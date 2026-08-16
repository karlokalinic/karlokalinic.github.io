# UNITY ↔ WEB ROUND-TRIP TEST

Purpose: prove that one Slegnuće decision survives the full path from Unity simulation state to browser storage and back without the scene or browser becoming a second source of truth.

This contract now has two forms: the human-readable specification below and an automated Playwright implementation in `scripts/headless-roundtrip.mjs`. The automation can only run against a real compiled Unity Web Preview. The source repository cannot manufacture a passing result in the absence of that artifact.

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

## Browser diagnostics and event ledger

The custom Web template exposes `window.SLEGNUCE_SHELL`. It now keeps a bounded event ledger:

```js
{
  seq: 37,
  type: 'RUN_RESTORED',
  payload: { ... },
  at: 1786870000000
}
```

`seq` is monotonically increasing for the lifetime of the page. `clearEvents()` clears retained history but deliberately does not reset the sequence number. A test therefore records the current sequence before issuing a command and waits only for an event with a larger sequence.

This matters because “wait until the last event is RUN_RESTORED” is not a safe integration test. A stale event from a previous command can accidentally satisfy it. The ledger turns temporal order into inspectable evidence without pretending to become authoritative state.

The browser also dispatches a `slegnuce:unity-event` `CustomEvent` for tooling and keeps at most 256 bridge events. It remains a diagnostic buffer, not durable history.

Open a Unity Web development build with:

```text
?debug=1
```

The template displays the latest bridge event in the top-right corner.

Useful console commands:

```js
SLEGNUCE_SHELL.requestState()
SLEGNUCE_SHELL.requestExport()
SLEGNUCE_SHELL.restoreLastRun()
SLEGNUCE_SHELL.startRun('TEST-SEED-001')
SLEGNUCE_SHELL.command('COMMIT_CHOICE', '0')
SLEGNUCE_SHELL.command('ADVANCE', '')
SLEGNUCE_SHELL.clearEvents()
```

Use `?restore=1` only when intentionally testing automatic restore from the last saved Unity run.

## Fingerprint

`RunEngine.Fingerprint()` computes a 32-bit FNV-1a diagnostic fingerprint over the UTF-8 bytes of compact `JsonUtility` output.

It is **not** a cryptographic signature and must never be treated as proof against malicious modification. It is only a fast integration-test marker: if the exported state is restored without semantic mutation, the compact state and its fingerprint should remain stable under the same serializer contract.

The release-level SHA-256 `artifactDigest` is a separate concept. It identifies Unity output files. The run fingerprint identifies a serialized simulation state under the current schema/serializer. Neither is allowed to impersonate the other.

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

## The twelve pass conditions

The slice passes only when all of the following are observed in an actual Unity Web build:

1. `RUN_STARTED` reaches the browser.
2. `SCENE_CHANGED` identifies `two_liters`.
3. a character-gated choice is rejected with an explanation naming its unavailable carrier.
4. committing `give_two_liters` changes only water, BILJEG, `NeighborHelped` and the expected RunLog append.
5. `CHOICE_COMMITTED` includes a fingerprint and full state snapshot.
6. closing the scenario emits `RUN_COMPLETE`.
7. browser storage contains `slegnuce:last-unity-run` with the committed consequence.
8. `restoreLastRun()` produces `RUN_RESTORED` after the current restore command.
9. the restored run has the same schema, seed, resource values, flags, roster and log as the saved run.
10. the pre-save and post-restore fingerprints match under the same build and serializer version.
11. malformed JSON and unsupported schema are rejected without mutating the currently restored run.
12. a fresh run after restore resets resources, flags, log and scenario position instead of inheriting residue.

## Automated Chromium implementation

`.github/workflows/slegnuce-roundtrip.yml` runs these conditions in Chromium through Playwright `1.62.0`.

The workflow can start in two ways:

- `repository_dispatch` with type `slegnuce-preview-ready`, normally emitted by the UBA post-build hook after static Vercel verification; or
- manual `workflow_dispatch`, where a developer supplies Preview URL, release version and expected artifact digest.

The workflow first installs Playwright and Chromium, then runs:

```text
node balkan-survival/scripts/headless-roundtrip.mjs \
  --url <preview> \
  --version <0.2.0-rc.N> \
  --digest <sha256> \
  --report <path>
```

Before opening Chromium, the script runs the same public static verifier used by the UBA post-build hook. This prevents the behavior test from accidentally exercising a Preview whose manifest does not match the intended candidate.

The browser then waits for `SLEGNUCE_SHELL.unityReady`, clears retained event history, and issues commands only through the public browser bridge. It does not invoke private C# methods or modify Unity memory directly. A test that bypassed the bridge would prove the simulation layer in isolation, not the integration path we are trying to release.

For the character-gating condition the script searches deterministic seeds until it finds one in which Mira is not `Active`, then attempts her carrier-specific choice and requires `CHOICE_REJECTED` to identify her. This makes roster variability part of the test rather than an unstable external prerequisite.

For the legal choice condition the test builds an expected copy of the pre-choice state and permits exactly four differences: water -2, BILJEG +1, `neighborHelped=true`, and one expected RunLog entry. Any unrelated mutation fails the release gate.

After `RUN_COMPLETE`, the test reads browser `localStorage`, intentionally starts and mutates another run, restores the saved run, compares the restored object to the saved JSON, tests malformed and unsupported restore payloads, and finally starts a new run to prove old state did not leak forward.

The workflow uploads `slegnuce-roundtrip-report.json` even on failure. A successful report uses schema:

```text
slegnuce.roundtrip-report/1
```

and contains the twelve checks, their evidence, the Preview URL, release version, artifact digest and a bounded capture of browser console output.

## What the automated gate still does not prove

A 12/12 result is strong evidence that the simulation/browser contract works in Chromium for that immutable Preview. It does not prove:

- that the art direction is acceptable;
- that animation feels good;
- that audio levels are correct;
- that Safari/Firefox behavior is identical;
- that a human understands the tutorial;
- that performance budgets are satisfied on weak hardware;
- that the game is ready to become project MAIN.

Those are different questions and need different evidence. The automation is valuable precisely because its jurisdiction is narrow and explicit.

## Production relationship

A successful automatic `repository_dispatch` run does **not** promote production.

Production promotion is exposed only through manual `workflow_dispatch` with `promote_after_pass=true`. The promotion job depends on the successful round-trip job, enters GitHub environment `slegnuce-production`, re-verifies the Preview's version/digest and calls `promote-vercel.sh` on the same deployment URL.

This separation means automation may testify that a candidate passed without giving itself the authority to publish that candidate.
