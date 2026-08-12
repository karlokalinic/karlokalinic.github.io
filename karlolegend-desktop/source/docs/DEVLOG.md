# KARLOLEGEND Desktop — Development Log

## Entry 001 — The disk becomes the workspace
**Date:** 2026-08-13

The project started from a storage and workflow problem rather than from a UI idea.

The original desire was to have a second environment that felt separate from ordinary Windows: something comparable to the mental separation of a Linux/WSL workspace, but without carrying another operating-system environment and its storage overhead.

Several possible abstractions were considered:

- a Windows network location;
- WSL/Linux;
- a Windows virtual desktop;
- Sandboxie;
- a dedicated local drive;
- a custom desktop shell.

The useful requirement turned out not to be security isolation. The useful requirement was **territorial separation**.

The machine can remain one Windows installation. `C:` remains the host system and the development location for the KARLOLEGEND shell itself. `K:` becomes the authored environment.

The resulting model is:

    C:
      Windows
      installed development tools
      KARLOLEGEND Desktop source code
      build artifacts

    K:
      KARLOLEGEND.exe
      projects
      writing
      games
      assets
      AI material
      whatever the user chooses to place in the environment

This distinction matters because it keeps the environment comprehensible without pretending that `K:` is another operating system.

### Why a dedicated K: volume?

The drive letter gives the environment an explicit root. A normal folder such as `C:\Projects` still feels like one directory inside the host machine. `K:\` can be treated as the border of the authored workspace.

The first implementation used a VHDX-backed local volume. This provides a real Windows volume/drive letter while keeping the storage physically backed by the existing SSD.

The VHDX does not create new physical capacity. Its purpose is organization and filesystem identity, not storage multiplication.

### Why not Sandboxie?

Sandboxie solves a different problem: containment of filesystem/registry writes and process behavior.

That is valuable when untrusted applications must be isolated, but it is not required for this project. The intended KARLOLEGEND environment is not a security boundary. Applications launched from it may still be normal Windows applications.

Sandboxie can remain installed as a separate tool, but it is not part of the KARLOLEGEND Desktop architecture.

### Why not a web application?

The shell is meant to feel like a desktop, not a website pretending to be one.

The first implementation therefore uses C# + WPF:

- native Windows executable;
- no browser runtime;
- no local web server;
- direct filesystem APIs;
- direct Windows Shell icon lookup;
- normal Windows process launching.

### The core rule

**The filesystem is the database.**

If `K:\Carlo` exists, the shell displays a folder named `Carlo`.

If `K:\Game.exe` exists, the shell displays the executable with the icon Windows associates with it.

Deleting the KARLOLEGEND application must never delete the user's conceptual structure. The ordinary Windows filesystem remains authoritative and can always be opened in Explorer.

---

## Entry 002 — v0.1 compile failure and architectural correction
**Date:** 2026-08-13

The first generated prototype failed immediately with:

    CS0246: FileSystemEventArgs could not be found
    CS0246: FileSystemWatcher could not be found

Cause: `MainWindow.xaml.cs` used the `System.IO` types explicitly but did not import the `System.IO` namespace. Relying on SDK implicit usings was a bad assumption for this WPF project.

The correction in v0.2 is deliberately boring:

    using System.IO;

More importantly, filesystem-dependent source files now use explicit namespace imports so a compiler error like this is less likely to be hidden by project-template differences.

The failure is documented instead of erased because the development log should describe the actual evolution of the system, including stupid mistakes.

---

## Entry 003 — Updates and features must be first-class
**Date:** 2026-08-13

A shell that must be manually replaced every time functionality changes will become annoying very quickly.

The architecture therefore reserves a hidden application-owned tree:

    K:\.karlo\

The root stays visually clean while internal state is kept with the environment.

Current internal layout:

    .karlo\
      state\
      features\
      packages\inbox\
      updates\inbox\
      updates\staged\
      vcs\
      temp\

Two package concepts are introduced.

### `.karloupdate`

Application update package.

The app can discover a newer package, prompt the user, verify the declared SHA-256, stage the new executable, run a temporary copy of itself as the updater, exit, replace `K:\KARLOLEGEND.exe`, restart the new executable, and clean up.

This avoids requiring a permanent second updater executable in the K: root.

### `.karlofeature`

Optional feature package.

The Feature Center can distinguish:

- built-in;
- not installed;
- ready to install;
- installed;
- update available.

Local packages are installed into `.karlo\features`.

This is the package/state foundation. Runtime execution of arbitrary plug-in assemblies is intentionally deferred until the project defines a stable plug-in contract and trust policy.

---

## Entry 004 — Replacing GitHub, not Git
**Date:** 2026-08-13

The version-control goal is not collaboration.

The desired experience is the part of GitHub that is useful to a single developer:

- repositories;
- history;
- changes;
- commits;
- branches;
- tags;
- diffs;
- restore/revert;
- backup remotes when wanted.

The undesirable or unnecessary parts are:

- social profiles;
- stars;
- issues;
- pull requests;
- reviews;
- organization permissions;
- CI marketplace;
- collaboration workflows.

The planned implementation therefore treats **Git as the storage/versioning engine and KARLOLEGEND as the interface**.

Reimplementing Git's object model, packing, delta compression and merge semantics would add risk without improving the actual user experience. Standard `.git` repositories preserve interoperability and make recovery possible even if KARLOLEGEND disappears.

The app can become a personal GitHub-like model without becoming a Git hosting website.

---

## Entry 005 — The shell stops displaying its own machinery
**Date:** 2026-08-13

The first usable visual build exposed three things that should not be part of the authored desktop:

- `KARLOLEGEND.exe`;
- `System Volume Information`;
- `$RECYCLE.BIN`.

The distinction is important.

KARLOLEGEND renders the user's environment; it should not render the renderer itself.

`System Volume Information` is Windows volume infrastructure. It is often inaccessible by design and has no useful role on the authored desktop.

`$RECYCLE.BIN` is also volume infrastructure. Windows maintains recycle-bin storage per eligible volume, even though the familiar Recycle Bin UI aggregates deleted items from multiple volumes. The K: volume therefore has its own on-disk recycle-bin directory; it is not literally the same physical folder as C:'s recycle-bin directory.

The shell now filters all three.

---

## Entry 006 — One desktop, one process
**Date:** 2026-08-13

Multiple KARLOLEGEND shell instances do not create useful parallelism. They create competing filesystem views, duplicate update prompts and ambiguous ownership of future global UI state.

v0.3 introduces a named per-session mutex:

    Local\KARLOLEGEND.Desktop.SingleInstance

The first process owns it. A later launch attempts to restore/focus the existing window, then exits.

Updater mode bypasses this check because the temporary updater must briefly coexist while the main instance is shutting down.

---

## Entry 007 — Network updates become part of the product
**Date:** 2026-08-13

v0.2 already had the dangerous half of self-update: it could replace its own executable from a package already present on disk.

It did not have transport.

v0.3 adds the missing transport layer:

    GitHub Release API
        -> discover latest version
        -> find .karloupdate asset
        -> download into hidden inbox
        -> existing local update engine
        -> SHA-256 verify staged EXE
        -> replace
        -> restart

This keeps discovery/download separate from installation.

### Bootstrap problem

Software cannot retroactively gain code it does not contain.

The installed v0.2 executable has no network update-discovery code. Therefore it cannot discover v0.3 from GitHub on its own.

There must be one bootstrap transition into v0.3. After v0.3 is installed, the transport exists and later application updates no longer require a user to download release packages manually.
