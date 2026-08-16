# UNITY ↔ WEB ROUND-TRIP TEST

Purpose: prove that one Slegnuće decision survives the full path from Unity simulation state to browser storage and back without the scene becoming a second source of truth.

This is a development contract, not a claim that a compiled Unity Web build already exists in the repository.

## Slice under test

Scenario: `two_liters`.

The run starts with the standard prototype state and a deterministic roster. Ivan asks for water. Four logical responses exist:

- give 2 L;
- Mira-specific rationing if Mira is active;
- refuse plainly;
- claim there is no water.

The choices exercise resource gating, character gating, token mutation, flag mutation, stress, bond, RunLog, serialization and restore.

## Runtime path

```text
PrototypeBootstrap
  -> PrototypeScenarioFactory
  -> RunEngine.StartNewRun
  -> ScenarioDefinition(two_liters)
  -> RunEngine.CanChoose
  -> RunEngine.CommitChoice
  -> RunState mutation
  -> RunLogEntry
  -> CHOICE_COMMITTED
  -> RunEngine.Advance
  -> RUN_COMPLETE
  -> SlegnuceWeb_SaveRun
  -> localStorage['slegnuce:last-unity-run']
  -> SLEGNUCE_SHELL.restoreLastRun()
  -> SendMessage(WebBridge.ReceiveShellCommand)
  -> RESTORE_RUN
  -> RunEngine.RestoreJson
  -> schema validation
  -> RUN_RESTORED
```

## Development harness

`PrototypeBootstrap` auto-installs only in the Unity Editor or a Development Build. It creates the bridge, engine and a deliberately plain `OnGUI` view when no configured prototype exists.

The view is not production UI. It exists so the simulation can be compiled and exercised before scene art, prefab structure and UI Toolkit/uGUI decisions become dependencies.

## Browser diagnostics

Open a future Unity Web development build with:

```text
?debug=1
```

The custom Web template displays the latest bridge event in the top-right corner.

Useful console commands:

```js
SLEGNUCE_SHELL.requestState()
SLEGNUCE_SHELL.requestExport()
SLEGNUCE_SHELL.restoreLastRun()
SLEGNUCE_SHELL.startRun('TEST-SEED-001')
SLEGNUCE_SHELL.command('COMMIT_CHOICE', '0')
SLEGNUCE_SHELL.command('ADVANCE', '')
```

Use `?restore=1` only when intentionally testing automatic restore from the last saved Unity run.

## Fingerprint

`RunEngine.Fingerprint()` computes a 32-bit FNV-1a diagnostic fingerprint over the UTF-8 bytes of compact `JsonUtility` output.

It is **not** a cryptographic signature and must never be treated as proof against malicious modification. It is only a fast integration-test marker: if the exported state is restored without semantic mutation, the compact state and its fingerprint should remain stable under the same serializer contract.

If serializer ordering or schema migration changes later, the fingerprint contract must be versioned or replaced rather than silently reinterpreted.

## Restore policy

Current supported schema:

```text
slegnuce.run/1
```

A restore with another schema is explicitly rejected through `RUN_RESTORE_REJECTED`. The engine does not guess that two formats are equivalent.

Future schema changes require one of two explicit decisions:

1. write a migration into the supported schema; or
2. reject the old save with an understandable reason.

Silent partial restore is forbidden because it produces plausible-looking but historically false runs.

## Pass conditions for the first compiled Unity Web build

The slice passes only when all of the following are observed in an actual Unity Web development build:

1. `RUN_STARTED` reaches the browser.
2. `SCENE_CHANGED` identifies `two_liters`.
3. a disabled character-gated choice reports why it is disabled when its carrier is absent.
4. committing a legal choice changes only the expected fields.
5. `CHOICE_COMMITTED` includes a fingerprint and full state snapshot.
6. closing the scenario emits `RUN_COMPLETE`.
7. browser storage contains `slegnuce:last-unity-run`.
8. `restoreLastRun()` produces `RUN_RESTORED`.
9. the restored run has the same schema, seed, resource values, flags, roster and log as the saved run.
10. the pre-save and post-restore fingerprints match under the same build and serializer version.
11. malformed JSON and unsupported schema are rejected rather than partially accepted.
12. a fresh run after restore does not retain state from the restored run.

Until those twelve conditions pass in a real build, the repository should describe this as a prepared integration slice, not a completed Unity migration.
