# KARLOLEGEND Desktop

Current source version: **0.4.1**

KARLOLEGEND Desktop is a native Windows personal workspace shell that renders a real disk as a desktop. It is not a VM, WSL environment, browser app, remote desktop, or security sandbox.

The filesystem is the data model.

## Source vs deployed app

Canonical source:

    GitHub: karlokalinic/karlokalinic.github.io
    Path:   karlolegend-desktop/source/

A local source checkout is optional and may live anywhere. `C:\KARLOLEGEND-DESKTOP-SOURCE\` is not a runtime requirement and is not part of the deployment contract.

Production executable:

    K:\KARLOLEGEND.exe

When the production EXE runs from K:\ it automatically uses K:\ as its root.

## Zero-source production install

From Command Prompt opened at `K:\`:

    powershell -NoProfile -ExecutionPolicy Bypass -Command "iex (irm 'https://raw.githubusercontent.com/karlokalinic/karlokalinic.github.io/main/karlolegend-desktop/install.ps1')"

This resolves the latest stable GitHub Release, downloads `KARLOLEGEND.exe`, validates its release metadata/digest when available, and leaves the executable in the current directory. No source checkout or .NET SDK is required on the production machine.

A minimal direct download is also valid:

    curl.exe -fL --retry 3 -o KARLOLEGEND.exe https://github.com/karlokalinic/karlokalinic.github.io/releases/latest/download/KARLOLEGEND.exe

## Optional local development

From any local checkout of `karlolegend-desktop/source/`:

    dotnet run -- --root "K:\"

Development `--root` mode intentionally disables self-update so the Debug executable cannot replace itself or the production build.

## Optional local publish

    dotnet publish .\KarloDiskShell.csproj -c Release -r win-x64 --self-contained true -o .\publish

Then:

    Copy-Item .\publish\KARLOLEGEND.exe "K:\KARLOLEGEND.exe" -Force

GitHub CI/release remains the canonical production build path. The publish contract is strict: the deployable output must contain exactly one file, `KARLOLEGEND.exe`.

## Current desktop behavior

- exactly one normal KARLOLEGEND process per Windows user session;
- a second launch restores/focuses the existing window and exits;
- `KARLOLEGEND.exe`, `System Volume Information`, `$RECYCLE.BIN`, and `.karlo` do not render as desktop content;
- real Windows Shell icons;
- Canvas-based desktop surface;
- drag icons freely and retain persistent X/Y coordinates across refreshes/restarts;
- new filesystem items receive an initial top-to-bottom desktop position;
- folder navigation remains inside KARLOLEGEND;
- `.html` / `.htm` open in an internal WebView2 viewer;
- unsupported files and EXEs use normal Windows associations;
- item context menu: Open, Open Externally, Rename, Delete to Recycle Bin;
- F2 rename;
- Delete sends the selected item to the Windows Recycle Bin after confirmation;
- desktop background menu: New Folder, wallpaper, Explorer, refresh;
- wallpaper is copied into hidden K: state so the desktop does not depend on a C: source file;
- Terminal button opens Windows PowerShell in the current KARLOLEGEND directory;
- F5 refresh;
- F11 / Desktop enters chrome-free desktop mode;
- live filesystem refresh;
- Feature Center reports actual built-in capabilities and planned optional modules.

## HTML inside KARLOLEGEND

The app remains native WPF. WebView2 is only an embedded content renderer.

Local K: content is mapped to:

    https://karlo.local/

so HTML can use relative CSS/JS/image assets under a normal origin.

WebView2 state lives under:

    K:\.karlo\state\webview2\

The viewer includes an explicit External action if the same HTML should be opened using the normal Windows browser association.

## Desktop state

Presentation state lives under:

    K:\.karlo\state\desktop.json

It stores things such as wallpaper and icon coordinates. This state controls how files look on the desktop; it never determines whether the files exist.

## Internal layout

    K:\.karlo\
        state\
            desktop.json
            wallpaper\
            webview2\
        features\
        packages\inbox\
        updates\inbox\
        updates\staged\
        updates\backup\
        vcs\
        temp\

## Updates

Production v0.3.2+ can discover stable KARLOLEGEND GitHub releases, download a `.karloupdate` package itself, hand it to the local update engine, verify the staged replacement executable by SHA-256, replace the live EXE and restart.

v0.4 additionally preserves the previous live executable at:

    K:\.karlo\updates\backup\KARLOLEGEND.previous.exe

before replacement.

Release creation is explicit through `karlolegend-desktop/release.json`; ordinary source commits run CI but do not silently overwrite an already-published semantic version.

The current updater is not the final trust/recovery design. See `docs/UPDATE-PLAN.md` for channel metadata, schema versions, health checks, automatic rollback, update history and signing.

## Agent context

Repository-aware agents should start from:

    karlolegend-desktop/AI_CONTEXT.md
    karlolegend-desktop/AGENTS.md

and load detailed files from `source/docs/` only when relevant.

See:
- `docs/DESKTOP-SPEC.md`
- `docs/UPDATE-PLAN.md`
- `docs/FEATURES-AND-UPDATES.md`
- `docs/VERSION-CONTROL.md`
- `docs/DEVLOG.md`
- `docs/ROADMAP.md`
