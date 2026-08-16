# UNITY BUILD CONTRACT

This folder is now intended to be opened as a Unity project, not merely copied into one later.

## Pinned editor

The repository pins `webgl/ProjectSettings/ProjectVersion.txt` to `6000.3.16f1` (Unity 6.3 LTS line). Do not silently rewrite the version because Unity Hub offered a newer editor. An editor upgrade is a source change and should receive its own commit/devlog if accepted.

The Web platform module is an editor installation component, not something this repository can vendor. If Web Build Support is missing, the build script must fail explicitly.

## Windows: shortest build path

From the repository root:

```powershell
cd .\balkan-survival\webgl
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-web.ps1
```

The script first looks for:

```text
C:\Program Files\Unity\Hub\Editor\6000.3.16f1\Editor\Unity.exe
```

If that exact patch is absent, it may use another installed `6000.3.x` editor with a warning. That fallback is for local diagnosis, not permission to commit an accidental project upgrade.

Output defaults to:

```text
balkan-survival\webgl\Builds\WebGL-Development\
```

`Builds/`, `Library/`, `Temp/`, `Logs/` and generated project files remain ignored.

## What the build command actually does

`Slegnuce.Editor.SlegnuceBuild.BuildDevelopmentWeb` performs a deterministic preparation sequence:

1. Verify that the WebGL build target exists.
2. Require Unity to have started with `-buildTarget WebGL` in batch mode.
3. Regenerate `Assets/Scenes/PrototypeShelter.unity` from code.
4. Run `SlegnuceSelfTest.RunAll()`.
5. Select the committed `PROJECT:Slegnuce` custom Web template.
6. Build exactly the generated prototype scene as a Development Web player.
7. Fail the process if Unity reports anything other than `BuildResult.Succeeded`.

The generated scene is deliberately not committed. At this stage it contains only a camera and `PrototypeBootstrap`. This keeps the test scene reproducible from source instead of making an opaque YAML scene another hidden authority.

## Five pre-build self-tests

The editor-side self-test currently proves:

- committing `give_two_liters` changes water 7 → 5, creates one BILJEG, sets `NeighborHelped`, and appends the expected RunLog record;
- export → restore preserves the state fingerprint and key fields;
- an unsupported save schema is rejected without mutating current authoritative state;
- Mira-only choices are illegal while Mira is absent and become legal when she is active;
- starting a new run after a mutated run resets water, BILJEG, RunLog and flags instead of inheriting stale state.

These tests are intentionally independent of browser rendering. They answer whether the simulation can survive its own serialization contract before WebAssembly is involved.

## CI versus Unity compile

GitHub Actions currently runs `scripts/validate-webgl-project.mjs`. That check proves that the repository contains a coherent pinned Unity project, build entrypoint, custom Web template, bridge, and required self-test code. It does **not** claim to compile Unity.

A real Unity compile additionally depends on an installed matching Editor, valid licensing, and the Web Build Support module. Until an actual Unity process executes the project, C# API compatibility and IL2CPP/WebAssembly output remain unverified.

## After the first successful local Web build

Run the existing twelve-point `docs/ROUNDTRIP_TEST.md` protocol against the Development Web output. Only after those browser-boundary tests pass should a compiled Unity build be archived under `builds/<version>/` and considered for MAIN promotion.
