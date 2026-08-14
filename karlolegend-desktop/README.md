# KARLOLEGEND Desktop

Native Windows filesystem desktop for the KARLOLEGEND K: environment.

## Canonical deployment model

GitHub is the canonical source and build system.

- Source: `karlolegend-desktop/source/`
- Windows CI: `.github/workflows/karlolegend-desktop-ci.yml`
- Release pipeline: `.github/workflows/karlolegend-desktop-release.yml`
- Bootstrap installer: `karlolegend-desktop/install.ps1`
- Production executable: `K:\KARLOLEGEND.exe`
- Releases: GitHub Releases for this repository

A production machine does **not** need a source checkout, Visual Studio, the .NET SDK, NuGet caches, or a permanent KARLOLEGEND source directory on `C:`. The GitHub release is self-contained.

## Clean install from K:\

### From PowerShell already opened at `PS K:\>`

```powershell
& ([scriptblock]::Create((Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/karlokalinic/karlokalinic.github.io/main/karlolegend-desktop/install.ps1').Content))
```

### From Command Prompt opened at `K:\>`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "& ([scriptblock]::Create((Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/karlokalinic/karlokalinic.github.io/main/karlolegend-desktop/install.ps1').Content))"
```

Do not use `iex (irm '.../install.ps1')` for this installer. `install.ps1` is an advanced PowerShell script with a script-level `[CmdletBinding()]` / `param(...)` block; it must be parsed as a script block (or executed as a `.ps1` file), not injected as an `Invoke-Expression` expression.

The bootstrap resolves the latest stable GitHub Release, downloads the exact `KARLOLEGEND.exe` asset into the current directory, checks the release asset size and SHA-256 digest when GitHub exposes it, safely replaces an older executable with rollback protection, and removes its temporary download.

On an otherwise empty `K:\`, the visible deployment result is exactly:

```text
K:\KARLOLEGEND.exe
```

KARLOLEGEND creates hidden/private runtime state under `K:\.karlo\` only after it runs.

For the absolute minimum direct download without bootstrap verification logic:

```cmd
curl.exe -fL --retry 3 -o KARLOLEGEND.exe https://github.com/karlokalinic/karlokalinic.github.io/releases/latest/download/KARLOLEGEND.exe
```

## Build contract

GitHub Actions restores and builds the WPF project on Windows and performs a release publish smoke test. The publish contract is intentionally strict: the deployable output must contain one file only, named `KARLOLEGEND.exe`.

The production updater checks stable GitHub Releases and downloads the `.karloupdate` asset in-app. Update state, staging and backups live under hidden `K:\.karlo\` state rather than cluttering the K: root.

Current stable release line: **0.4.x**
