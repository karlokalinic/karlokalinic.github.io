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

## 4. UI architecture

    MainWindow
      |
      +-- filesystem enumeration
      +-- ShellIconService -> shell32.dll
      +-- FileSystemWatcher
      +-- ProcessStartInfo / Windows associations
      +-- FeatureCenterWindow

## 5. Internal environment

`K:\.karlo` is app-owned state and is hidden from the desktop surface.

It must never contain irreplaceable user projects.

User-authored files remain normal files/folders directly on K: or below user-created directories.

## 6. Failure principle

The application is a view over the filesystem, not the owner of the filesystem.

If KARLOLEGEND.exe is deleted:

- projects still exist;
- folders still exist;
- Git repositories still exist;
- files remain openable from Explorer.

That is a non-negotiable architectural property.
