# KARLOLEGEND Desktop

Current source version: **0.4.0**

KARLOLEGEND Desktop is a native Windows shell-like application that renders a real disk as an icon desktop. It is not a VM, WSL environment, browser app, remote desktop, or security sandbox.

The filesystem is the data model.

## Source vs deployed app

Source:

    C:\KARLOLEGEND-DESKTOP-SOURCE\

Production executable:

    K:\KARLOLEGEND.exe

When the production EXE runs from K:\ it automatically uses K:\ as its root.

## Development test

    cd C:\KARLOLEGEND-DESKTOP-SOURCE
    dotnet run -- --root "K:\"

Development `--root` mode intentionally disables self-update so the Debug executable cannot replace itself or the production build.

## Publish

    dotnet publish .\KarloDiskShell.csproj -c Release -r win-x64 --self-contained true -o .\publish

Then:

    Copy-Item .\publish\KARLOLEGEND.exe "K:\KARLOLEGEND.exe" -Force

## v0.3 foundation

- exactly one KARLOLEGEND instance per Windows user session;
- a second launch restores/focuses the existing window and exits;
- the running `KARLOLEGEND.exe` does not render itself as a desktop icon;
- `System Volume Information` is hidden from the shell;
- `$RECYCLE.BIN` is hidden from the shell;
- `.karlo` remains hidden application infrastructure;
- real Windows Shell icons;
- folder navigation;
- ordinary file/EXE opening through Windows associations;
- Back / Up / Root / Refresh;
- F5 refresh;
- live filesystem refresh;
- Feature Center;
- local `.karlofeature` package foundation;
- local `.karloupdate` staging/replacement engine;
- automatic internet update discovery from the public KARLOLEGEND GitHub release channel;
- automatic `.karloupdate` download into the hidden inbox;
- update install/restart happens inside the app.

## v0.4 desktop behavior

- `KARLOLEGEND.exe`, `.karlo`, `$RECYCLE.BIN`, and `System Volume Information` are infrastructure and are not rendered;
- F11 enters chrome-free desktop mode;
- right-click the desktop surface for New Folder, wallpaper, Explorer and refresh actions;
- selected wallpaper is imported into hidden K: app state so the desktop does not depend on an external C: file;
- `.html` and `.htm` open in the internal KARLOLEGEND WebView2 viewer;
- unsupported file types continue to open through normal Windows associations;
- one previous executable is preserved before an update replaces the live shell.

The HTML renderer keeps WebView2 state under:

    K:\.karlo\state\webview2\

The desktop appearance state lives at:

    K:\.karlo\state\desktop.json

## Windows infrastructure folders

The shell deliberately hides:

    System Volume Information
    $RECYCLE.BIN
    KARLOLEGEND.exe
    .karlo

`$RECYCLE.BIN` is not physically the same directory as the one on C:. Windows maintains recycle-bin storage on each eligible volume, while the normal Recycle Bin UI presents an aggregated view.

## Internal layout

    K:\.karlo\
        state\
        features\
        packages\inbox\
        updates\inbox\
        updates\staged\
        updates\backup\
        vcs\
        temp\

## Update channel

Production v0.3+ scans public GitHub Releases for the newest stable release that actually contains a `.karloupdate` asset in:

    karlokalinic/karlokalinic.github.io

It downloads the package itself and hands it to the local update engine.

The update package contains:

    manifest.json
    KARLOLEGEND.exe

The manifest includes the expected SHA-256 of the executable. The staged executable is verified before replacement.

The current transport is intentionally not the final updater design. See `docs/UPDATE-PLAN.md` for stable-channel metadata, health checks, rollback and signing.

## Bootstrap boundary

v0.2 had only a local inbox updater. It had no network discovery/downloader.

The v0.2 -> v0.3 bootstrap also exposed a JSON-manifest casing compatibility bug; v0.3.2 fixed both the release schema and the current deserializer so future packages cannot repeat that exact failure.

Once v0.3.2+ is installed, future ordinary application updates can be discovered, downloaded, installed and restarted from inside KARLOLEGEND itself.

See:
- `docs/DESKTOP-SPEC.md`
- `docs/UPDATE-PLAN.md`
- `docs/FEATURES-AND-UPDATES.md`
- `docs/DEVLOG.md`
