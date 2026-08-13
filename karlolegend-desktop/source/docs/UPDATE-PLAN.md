# Update Architecture — Concrete Plan

## Current state

The application already has:
- remote GitHub release discovery;
- `.karloupdate` download;
- package manifest;
- SHA-256 validation of the staged replacement executable;
- temporary self-updater process;
- replacement and restart;
- one previous executable backup as of v0.4.

This is sufficient for development, not yet the final update system.

## Target update contract

### 1. Stable channel manifest

Instead of making the client infer product state from generic repository releases forever, publish a tiny channel document:

```json
{
  "schema": 1,
  "channel": "stable",
  "version": "0.5.0",
  "minimumUpdaterVersion": "0.3.2",
  "packageUrl": "...",
  "packageSha256": "...",
  "publishedUtc": "...",
  "mandatory": false
}
```

The app fetches one small stable URL first. GitHub Releases can remain the binary storage backend.

### 2. Package manifest

A `.karloupdate` package must declare:
- package schema;
- application version;
- minimum compatible updater version;
- executable file name;
- executable SHA-256;
- optional package SHA-256;
- release notes;
- migration identifier;
- feature/catalog schema versions.

### 3. Staging

Never overwrite the live EXE while downloading or extracting.

    download -> inbox
    verify package -> staged/<version>
    verify staged executable -> ready

### 4. Backup

Before replacement:

    K:\KARLOLEGEND.exe
      -> K:\.karlo\updates\backup\KARLOLEGEND.previous.exe

Keep exactly one known previous build by default to control storage use.

### 5. Atomic-ish replacement

Updater sequence:

    main app exits
    current -> backup
    staged new -> live
    launch new with --post-update <oldVersion>
    wait for health signal

### 6. Health signal

The new process must write:

    K:\.karlo\updates\health\<version>.ok

only after:
- app initialization completed;
- K: root opened;
- settings parsed;
- mandatory migrations completed.

### 7. Rollback

If the new process exits or fails to produce the health signal inside a bounded startup window:
- stop failed new instance;
- restore previous executable;
- restart previous version;
- retain diagnostic record.

### 8. Update history

Persist:

    K:\.karlo\updates\history.jsonl

One append-only event per:
- discovered;
- downloaded;
- verified;
- installed;
- health-success;
- rolled-back;
- failed.

### 9. Feature updates

Application updates and feature updates use the same transport concepts but different trust scopes.

Core EXE update:
- may change application API;
- always restart.

Feature package:
- must declare required app API version;
- can be install/enable/disable/update independently;
- future signed plug-in runtime required before arbitrary DLL execution.

## Security target

SHA-256 detects corruption but does not authenticate who produced a package.

Before treating the updater as production-grade, add release signing:
- detached signature for channel manifest/package;
- public verification key embedded in the app;
- CI-held signing secret/private key;
- reject unsigned/invalid packages.

Do not embed a GitHub personal access token in the executable.

## Release pipeline target

Every release commit should execute:

    restore
    build
    tests
    publish win-x64 self-contained
    smoke-test metadata
    hash
    package
    sign
    create release
    publish stable-channel manifest

The release must fail closed if any earlier step fails.
