# UNITY RUNTIME ARCHITECTURE — SOURCE MILESTONE 1

The Unity migration begins with domain state, not a scene.

## Authority

`RunEngine` owns gameplay mutation.

UI may read `RunState` and subscribe to `StateChanged` / `ScenarioChanged`. UI must not change resources, tokens, flags, roster or log directly.

`ScenarioDefinition` is authored data. It contains conditions and effects but does not contain runtime truth.

`RunState` is runtime truth and the serializable handoff format.

`SlegnuceWebBridge` transports events across the Unity/browser boundary. It does not decide gameplay.

## Mutation path

```
UI click
  -> RunEngine.CanChoose(index)
  -> RunEngine.CommitChoice(index)
  -> evaluate conditions
  -> apply typed effects
  -> append RunLogEntry
  -> StateChanged
  -> WebBridge: CHOICE_COMMITTED
```

No visual element should be able to bypass this path.

## Why conditions/effects are typed

The JavaScript prototype used closures. They were useful while discovering the rules, but closures do not serialize into Unity assets and make content auditing difficult.

The Unity layer therefore uses enums and serializable records:

- `ConditionKind.ResourceAtLeast`
- `ConditionKind.TokenAtLeast`
- `ConditionKind.FlagIs`
- `ConditionKind.CharacterPresenceIs`
- `EffectKind.AddResource`
- `EffectKind.AddToken`
- `EffectKind.SetFlag`
- `EffectKind.AddBond`
- `EffectKind.SetPresence`

This is deliberately less expressive than arbitrary C# delegates. The limitation is useful: content can be inspected, serialized, validated and later rendered in an editor tool.

When a scenario requires behavior that cannot be expressed by these primitives, add a new explicit domain primitive instead of hiding arbitrary code in a choice asset.

## Determinism

Roster assignment is seeded. The same seed should produce the same starting presence state.

The current `StableHash` is intentionally simple and project-local. Before cross-version replay compatibility becomes a promise, the hash algorithm and RNG contract must be versioned and locked.

## Serialization boundary

`RunState` uses plain serializable fields compatible with `JsonUtility`. This avoids relying on scene object references or dictionaries that would complicate Web handoff.

Current schema marker:

`"slegnuce.run/1"`

A future schema change that breaks compatibility must increment the marker and supply a migration or explicitly refuse restore with a useful error.

## Known issue deliberately left visible

This source milestone is not yet a compiled Unity build. It has not passed Unity compiler/runtime verification inside an actual project checkout.

Before a Unity build can become MAIN, the next implementation pass must:

1. import the scaffold into Unity 6;
2. fix any compiler/API mismatches found there;
3. create at least one real `ScenarioDefinition` asset;
4. bind a UI button to `CommitChoice`;
5. complete one scenario end-to-end;
6. confirm `CHOICE_COMMITTED` reaches the browser shell;
7. export and restore a `RunState` JSON snapshot;
8. compare the outcome with the equivalent 0.1.x browser scenario.

The browser build remains MAIN until those gates are satisfied.
