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

The icon surface was subsequently converted from an auto-arranged WrapPanel into a Canvas: filesystem items can be moved directly, their X/Y coordinates persist, and rename/delete operations update the presentation-state keys without creating fake shortcut files.

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

---

## Entry 015 — CI catches a WPF code-generation failure that source review did not
**Date:** 2026-08-13

The first v0.4 desktop-drag implementation used WPF `EventSetter` entries in the `ListBoxItem` style for pointer events.

The XAML looked structurally valid, but the .NET 10 WPF build generated malformed `MainWindow.g.cs` in `IStyleConnector.Connect`: the generated switch body contained EventSetter construction without a corresponding `case`, producing compiler errors such as `CS1513` and `CS1022`.

This is exactly the class of failure that static source inspection can miss because the invalid C# does not exist until WPF's build-time XAML generator runs.

The CI workflow was temporarily enhanced to print the relevant generated-source range when compilation fails. The fix removed style-level EventSetters and routes the pointer events from the `ListBox` itself to the appropriate `ListBoxItem` by walking the visual tree.

The next CI run compiled with zero warnings and zero errors.

Design rule reinforced:

> Generated-framework code is part of the build surface. CI is not ceremony; it is an additional compiler/runtime observer.

---

## Entry 016 — “Single EXE” is tested, not assumed
**Date:** 2026-08-13

Adding WebView2 preserved a working single-file application binary, but the publish directory also contained three WebView2 XML documentation files.

They were not runtime dependencies; they were IntelliSense/reference documentation copied beside the executable. Nevertheless, the new CI contract correctly failed because the deployment promise was explicit:

    K:\KARLOLEGEND.exe

with no visible runtime debris beside it.

The project now deletes published XML documentation after the publish target. CI then verifies the entire publish directory and fails unless exactly one file remains: `KARLOLEGEND.exe`.

The corrected Windows CI passed both compilation and publish smoke testing before release.

---

## Entry 017 — v0.4 becomes the first explicit release-gated desktop build
**Date:** 2026-08-13

The release workflow itself exposed another small but important automation bug: probing for a nonexistent GitHub Release with `gh release view` correctly returned native exit code 1, but the first workflow version allowed that expected negative lookup to become the step's final process exit code.

The workflow now captures the negative lookup as data, resets the native exit state, and only fails when the release actually exists.

After that correction, v0.4.0 passed the release gate:
- explicit release request matched the project version;
- no existing release was overwritten;
- self-contained Windows publish succeeded;
- single-EXE deployment contract passed;
- `.karloupdate` package was created;
- the stable GitHub Release was published.

This is the desired release philosophy going forward: ordinary commits prove themselves in CI; a version becomes an installable product only through an explicit release request.

---

## Entry 018 — The updater locks its own completed download
**Date:** 2026-08-13

The first real update check after the v0.4 release exposed a Windows sharing violation:

    Update check failed: The process cannot access the file because it is being used by another process.

The failure was inside `RemoteUpdateService`, not the updater replacement process.

The downloader wrote the release asset to:

    <destination>.download

using an `await using var FileStream`, then immediately attempted:

    File.Move(temporary, destination, overwrite: true)

The declaration-style `await using` kept the output stream alive for the remainder of the enclosing block, so Windows still held an exclusive handle (`FileShare.None`) at the exact moment KARLOLEGEND attempted to rename the completed temporary file into the update inbox.

The fix is deliberately structural rather than timing-based: the network input and output streams now live in explicit nested `await using (...)` scopes. Both streams are disposed before `File.Move` executes. No sleep/retry is used to hide an ownership error.

The application version is bumped to `0.4.1` because this is a shipped updater transport defect.

A practical consequence remains: a binary containing the broken downloader cannot download its own fix. The recovery path for affected installations is therefore a one-time bootstrap of the corrected executable/update package; once `0.4.1` is running, normal network self-update can resume.
