# KARLOLEGEND Desktop — Development Log

This log records product decisions, implementation failures, fixes, and the reason behind the architecture. It is intentionally not cleaned into a fake success story.

---

## Entry 001 — The disk becomes the workspace
**Date:** 2026-08-13

The project started from a storage/workflow problem rather than from a UI feature request.

The original goal was a second environment that felt separate from ordinary Windows, comparable to the mental separation of WSL/Linux, without carrying another operating-system environment and its storage overhead.

We considered:
- Windows network location;
- WSL/Linux;
- Windows virtual desktops;
- Sandboxie;
- a dedicated local drive;
- a custom desktop shell.

The requirement was eventually stated correctly: **territorial separation, not security isolation**.

Resulting model:

    C:\
      Windows
      installed tools
      KARLOLEGEND source
      build artifacts

    K:\
      KARLOLEGEND.exe
      projects
      writing
      games
      assets
      AI material
      user-created workspace

A VHDX-backed K: volume gives the workspace a real Windows drive root while still consuming physical storage on the existing SSD. It creates identity and organization, not new capacity.

Sandboxie remains useful as an unrelated utility but is not part of the architecture because the workspace does not need to be a security boundary.

---

## Entry 002 — The filesystem is the database
**Date:** 2026-08-13

The first non-negotiable product rule became:

> The real filesystem is canonical.

If `K:\Carlo` exists, the desktop shows Carlo. If the shell is deleted, Carlo still exists and remains usable in Explorer.

The app must never require a proprietary database merely to know what files the user owns.

Presentation metadata may be app-owned; user content may not be trapped by the shell.

---

## Entry 003 — v0.1 fails to compile
**Date:** 2026-08-13

The first generated prototype immediately failed with:

    CS0246: FileSystemEventArgs could not be found
    CS0246: FileSystemWatcher could not be found

Cause: `MainWindow.xaml.cs` used `System.IO` types without importing `System.IO`.

The fix was trivial. The lesson was not: do not claim a generated WPF build is valid before the Windows compiler actually validates it.

The project subsequently moved toward Windows GitHub Actions CI so compile/publish verification is external to the agent that wrote the code.

---

## Entry 004 — Hidden application infrastructure
**Date:** 2026-08-13

The app needs durable state but the K: root should remain authored space rather than implementation debris.

Reserved root:

    K:\.karlo\

Current families:

    state\
    features\
    packages\inbox\
    updates\inbox\
    updates\staged\
    updates\backup\
    vcs\
    temp\

`.karlo` is hidden from the KARLOLEGEND desktop. It may contain replaceable application state, caches, package metadata, presentation preferences and version-control registry data. It must not become the only home of irreplaceable user projects.

---

## Entry 005 — Replacing GitHub, not Git
**Date:** 2026-08-13

The version-control goal is explicitly single-user.

Wanted:
- repositories;
- changes;
- staging;
- commits;
- history;
- branches;
- tags;
- diffs;
- restore/revert;
- optional backup remotes.

Not wanted:
- pull requests;
- social profiles;
- stars;
- issues;
- reviews;
- organization permissions;
- collaboration-first workflow.

Decision: initially keep standard Git as the storage/history engine and build the KARLOLEGEND experience above it. Reimplementing Git object storage, delta compression and merge semantics would add failure modes without serving the actual product need.

The canonical project remains local. A remote is backup/synchronization, not identity.

---

## Entry 006 — The shell stops displaying its own machinery
**Date:** 2026-08-13

The first usable visual build exposed:
- `KARLOLEGEND.exe`;
- `System Volume Information`;
- `$RECYCLE.BIN`.

All three were wrong for the authored desktop.

`KARLOLEGEND.exe` is the renderer, not user content.

`System Volume Information` is volume infrastructure and normally inaccessible by design.

`$RECYCLE.BIN` is also volume infrastructure. K: has its own physical recycle-bin storage even though the normal Windows Recycle Bin UI aggregates items across volumes.

The shell now filters those entries plus `.karlo` without deleting any of them.

---

## Entry 007 — One desktop owner, one normal process
**Date:** 2026-08-13

Multiple independent shell processes would cause duplicate update prompts and ambiguous ownership of future desktop layout/global state.

A named per-session mutex was introduced:

    Local\KARLOLEGEND.Desktop.SingleInstance

Second launch -> attempt to restore/focus the existing shell -> exit.

Important distinction: **one process does not mean one window**. Child viewers/editors/tool windows are legitimate. The singleton protects global shell ownership, not document presentation.

Updater mode intentionally bypasses the singleton while replacement occurs.

---

## Entry 008 — Updates become part of the product
**Date:** 2026-08-13

v0.2 could already replace its own executable if a `.karloupdate` package was manually placed in its hidden inbox. It had no transport.

v0.3 added:

    release discovery
      -> download package
      -> K:\.karlo\updates\inbox
      -> extract to staging
      -> SHA-256 verify executable
      -> temporary updater
      -> replace K:\KARLOLEGEND.exe
      -> restart

This split is deliberate: network discovery/download and local installation remain separate layers.

The bootstrap limitation was unavoidable: an already-built v0.2 executable cannot retroactively gain network code it never contained.

---

## Entry 009 — The bootstrap updater bug becomes an API rule
**Date:** 2026-08-13

The first attempted v0.3.1 bootstrap failed silently even though the `.karloupdate` file was correctly present in:

    K:\.karlo\updates\inbox\

Root cause:
- the original v0.2 `System.Text.Json` deserializer used case-sensitive property matching;
- the v0.3.1 release workflow emitted lowercase JSON keys;
- the model expected PascalCase properties.

So a valid-looking package was parsed as an effectively empty manifest and ignored.

v0.3.2 corrected both sides:
- release manifests emit exact backward-compatible `Version`, `File`, `Sha256`, `Notes` keys;
- the current updater also parses manifest property names case-insensitively.

Design rule established:

> Update manifests are versioned API contracts, not implementation details.

Never casually rename fields, change casing, or change semantics in a format consumed by older binaries.

---

## Entry 010 — Releases stop being “every commit is a release”
**Date:** 2026-08-13

The early release workflow was too eager: any source change could rebuild and clobber assets for the same semantic version.

That makes a release tag, source commit and binary asset capable of drifting apart — unacceptable for a self-updating executable.

The pipeline was split conceptually:
- normal source changes -> Windows CI build/publish smoke test;
- explicit `karlolegend-desktop/release.json` request -> release pipeline;
- an already-published version is not overwritten; version must be bumped.

The release pipeline also enforces the intended K: deployment contract: the publish directory must contain exactly one visible deployable file, `KARLOLEGEND.exe`. If a dependency starts requiring loose runtime files, the release fails rather than silently changing the deployment model.

---

## Entry 011 — The desktop starts owning content presentation
**Date:** 2026-08-13

The previous behavior treated every non-folder file as something Windows should open externally.

That is acceptable for a file browser. It is too weak for a personal desktop environment.

HTML became the first internally-owned content type:

    double-click index.html
      -> KARLOLEGEND HtmlViewerWindow
      -> embedded Microsoft WebView2 renderer

The app itself remains native WPF. WebView2 is a content renderer, not the shell architecture.

Local K: content is mapped to:

    https://karlo.local/

and WebView2 profile/cache data is redirected into:

    K:\.karlo\state\webview2\

This lets local HTML resolve relative CSS/JS/images under a normal origin while keeping browser state out of the visible workspace.

An explicit External action remains available because KARLOLEGEND should own presentation without taking ownership away from the underlying file.

---

## Entry 012 — A real desktop needs presentation state
**Date:** 2026-08-13

A desktop is not merely a sorted list of filesystem entries.

It requires state that is not itself user content:
- wallpaper;
- icon coordinates;
- icon scale;
- snap-to-grid;
- per-directory layout;
- viewer preferences.

Rule:

    filesystem -> what exists
    .karlo\state -> how it is presented

v0.4 introduces persisted desktop settings and wallpaper. Selected wallpaper is imported into hidden K: state so the visual environment does not accidentally depend on a file that later disappears from C:.

The next major step is replacing WrapPanel-style icon layout with free-positioned, persistent desktop coordinates without creating fake shortcut files.

---

## Entry 013 — Update recovery begins before update sophistication
**Date:** 2026-08-13

The updater now preserves the current executable before replacement:

    K:\KARLOLEGEND.exe
      -> K:\.karlo\updates\backup\KARLOLEGEND.previous.exe

If the replacement copy itself fails, the updater attempts to restore the previous executable.

This is not yet full rollback. The next hardening layer is:
- explicit stable channel metadata;
- schema versions;
- signed metadata/packages;
- post-update health signal;
- bounded startup verification;
- automatic rollback;
- append-only update history.

The detailed contract lives in `UPDATE-PLAN.md`.

---

## Entry 014 — Repository context becomes infrastructure
**Date:** 2026-08-13

The project is being edited by multiple possible coding agents and interfaces. Re-explaining the whole architecture in every prompt wastes tokens and causes drift.

The repository therefore gained a compact context hierarchy:

    /AGENTS.md
    /CLAUDE.md
    /.github/copilot-instructions.md
    /.github/instructions/karlolegend-desktop.instructions.md
    /karlolegend-desktop/AGENTS.md
    /karlolegend-desktop/AI_CONTEXT.md
    /karlolegend-desktop/source/docs/*

`AI_CONTEXT.md` is intentionally short. It is the routing map, not another giant specification. Agents load deeper documents only when the task requires them.

This is treated as product engineering infrastructure: architecture and constraints should survive the chat/session/tool that happened to create them.
