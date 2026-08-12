# Feature and Update Architecture

## Goal

The application must understand three distinct things:

1. what is built into this version of KARLOLEGEND;
2. what optional features are installed;
3. what install/update packages are currently available.

The UI must be able to show this distinction without pretending that every planned feature already exists.

## Internal storage

    K:\.karlo\
      features\
      packages\inbox\
      updates\inbox\
      updates\staged\
      state\
      temp\

## Feature packages

Extension:

    .karlofeature

Format:

ZIP archive with `manifest.json` at the root.

Example manifest:

    {
      "id": "terminal",
      "name": "Integrated Terminal",
      "version": "0.1.0",
      "description": "Terminal integration.",
      "minAppVersion": "0.2.0"
    }

Current v0.2 behavior:

- scan package inbox;
- parse manifests without executing package contents;
- compare available and installed versions;
- expose status in Feature Center;
- install/update the package payload into versioned feature storage;
- update the feature's `current.json`.

### Important limitation

v0.2 does **not** dynamically execute arbitrary feature DLLs.

That requires a separate contract layer:

- stable interface/ABI;
- API version negotiation;
- signature/trust verification;
- dependency resolution;
- crash containment;
- module unload/reload behavior.

The package manager is intentionally being built before the plug-in runtime.

## Application updates

Extension:

    .karloupdate

Format:

ZIP containing:

- `manifest.json`;
- the replacement `KARLOLEGEND.exe`.

Example:

    {
      "version": "0.3.0",
      "file": "KARLOLEGEND.exe",
      "sha256": "<SHA-256 OF EXE>",
      "notes": "Desktop layout persistence."
    }

Update sequence:

    discover newer package
      -> prompt user
      -> extract into .karlo\updates\staged
      -> verify SHA-256 when supplied
      -> copy current EXE to %TEMP%
      -> start temporary updater copy
      -> main process exits
      -> updater replaces deployed EXE
      -> updater starts new EXE
      -> updater cleans staged/package data
      -> updater schedules deletion of itself

The source tree on C: is never modified by runtime self-update.

## Future online updates

The package engine should not care where a package came from.

Future sources can include:

- local folder;
- local network share;
- personal HTTP endpoint;
- release server;
- object storage.

A future network catalog only needs to download the exact same package into the appropriate inbox. Installation remains the same code path.

This keeps the application native and offline-capable even if online update discovery is later added.


## Remote release channel (v0.3+)

Production builds query:

    https://api.github.com/repos/karlokalinic/karlokalinic.github.io/releases/latest

The application does not require a GitHub login because the release channel is public.

Expected release asset:

    *.karloupdate

The package is downloaded by the application into:

    K:\.karlo\updates\inbox\

The existing local updater then performs staging, manifest parsing, executable SHA-256 verification, replacement and restart.

### Why the release channel is public

A private GitHub release cannot be downloaded anonymously. Embedding a personal access token in a desktop executable would be a credential leak, not a feature.

Therefore the update transport must use a public asset endpoint or a different authenticated distribution service.

The source repository and the release host can be split later. The important invariant is that the production app never contains a developer credential.
