# Architecture

## 1. Identity

KARLOLEGEND Desktop is a native Windows filesystem shell.

It is not:

- an operating system;
- a VM;
- WSL;
- a browser application;
- a remote desktop;
- a security sandbox.

The shell itself is native WPF/.NET. Embedded web technology is allowed only as a content renderer for HTML/web material.

## 2. Deployment boundary

Development:

    C:\KARLOLEGEND-DESKTOP-SOURCE\

Runtime:

    K:\KARLOLEGEND.exe

User data:

    K:\...

Internal app data:

    K:\.karlo\...

## 3. Root resolution

Production build:

1. Determine the directory containing the running executable.
2. Determine that directory's drive root.
3. Render that root.

Therefore:

    K:\KARLOLEGEND.exe -> K:\

Development override:

    dotnet run -- --root "K:\"

The override exists so source can stay on C: while rendering K:.

## 4. Runtime/UI architecture

    App
      |
      +-- SingleInstanceService
      +-- MainWindow
            |
            +-- filesystem enumeration
            +-- ShellIconService -> shell32.dll
            +-- FileSystemWatcher
            +-- DesktopSettingsService
            +-- FeatureCenterWindow
            +-- RemoteUpdateService
            +-- supported content routing
                    |
                    +-- folder -> MainWindow navigation
                    +-- .html/.htm -> HtmlViewerWindow / WebView2
                    +-- other file -> Windows Shell association

One normal KARLOLEGEND process owns global shell state per Windows user session. That does not prohibit child viewer/editor/tool windows inside the same process.

## 5. Owned content rendering

The shell should gradually own the presentation of content types that benefit from a coherent KARLOLEGEND experience, while preserving a normal external-open escape hatch.

HTML is the first internally-owned content type.

`HtmlViewerWindow` embeds Microsoft WebView2. It does not change the application architecture into a web app.

The K: root is exposed to the embedded renderer as:

    https://karlo.local/

This gives local HTML a normal origin for relative assets rather than forcing the shell to behave like a browser navigating raw `file://` URLs.

WebView2 user data is explicitly redirected to:

    K:\.karlo\state\webview2\

so browser profile/cache state never pollutes the visible K: root.

Future internally-owned content may include Markdown, text, images, audio and version-control/project views.

## 6. Internal environment

`K:\.karlo` is app-owned state and is hidden from the desktop surface.

It must never contain irreplaceable user projects.

Current structure includes:

    K:\.karlo\
      state\
        desktop.json
        webview2\
        wallpaper\
      features\
      packages\inbox\
      updates\inbox\
      updates\staged\
      updates\backup\
      vcs\
      temp\

User-authored files remain normal files/folders directly on K: or below user-created directories.

## 7. Desktop presentation state

The real filesystem determines **what exists**.

KARLOLEGEND state determines **how it is presented**.

Examples of presentation state:
- wallpaper;
- future icon coordinates;
- icon size;
- snap-to-grid;
- per-directory layout;
- viewer preferences.

This state belongs under `.karlo\state` and must never be required to recover the user's files.

## 8. Update architecture

Network discovery/download and local replacement are separate layers.

Current sequence:

    release discovery
      -> download .karloupdate
      -> hidden inbox
      -> extract to staging
      -> SHA-256 verify replacement EXE
      -> backup current EXE
      -> temporary updater
      -> replace live EXE
      -> restart

The final design adds a stable-channel manifest, schema versions, signed metadata/packages, a post-update health signal and automatic rollback. See `docs/UPDATE-PLAN.md`.

## 9. Cross-agent documentation

`karlolegend-desktop/AI_CONTEXT.md` is the compact canonical onboarding document for repository-aware coding agents.

It intentionally points to deeper documents instead of duplicating them. Scoped `AGENTS.md`, Claude instructions and GitHub Copilot instructions all route agents through the same architecture and product contracts.

Detailed documentation remains the system of record under `source/docs/`.

## 10. Failure principle

The application is a view over the filesystem, not the owner of the filesystem.

If KARLOLEGEND.exe is deleted:

- projects still exist;
- folders still exist;
- Git repositories still exist;
- HTML remains ordinary HTML;
- files remain openable from Explorer.

That is a non-negotiable architectural property.
