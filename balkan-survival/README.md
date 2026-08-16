# BALKAN SURVIVAL / SLEGNUĆE

A game, permanent playable-build archive and literary development diary published as one object.

Public route: `/balkan-survival/`

## Current MAIN

`0.1.1 — Nauči sustav, ne tipke`

The first playable vertical slice now has a first-run tutorial, procedural Web Audio SFX/ambience, state-aware motion, reduced-motion behavior and the first committed Unity Web migration contract.

## Architecture

- `index.html` — public project front page; MAIN is always visually dominant.
- `builds/<version>/` — immutable playable builds. Historical builds are never overwritten.
- `data/production.json` — the single pointer to the recommended MAIN build.
- `data/builds.json` — build registry.
- `data/cloud-release.json` — machine-readable state of the Unity cloud-release pipeline.
- `devlog/` — one literary/critical development entry per meaningful project change.
- `docs/SYSTEMS.md` — implementation backlog and design rationale.
- `docs/AUDIO_TUTORIAL_ANIMATION.md` — polish rules and ownership boundaries.
- `docs/WEBGL_PREP.md` — Unity Web migration and hosting contract.
- `docs/UNITY_BUILD.md` — pinned Unity editor, deterministic project bootstrap, self-tests and local Development Web build procedure.
- `docs/CLOUD_RELEASE.md` — Unity Build Automation → immutable Vercel Preview → promote-the-same-deployment production contract.
- `webgl/` — buildable Unity 6.3 LTS project root with WebBridge/template/runtime source; a compiled Unity Web artifact has not yet been produced by this repository session.
- `webgl/cloud/` — UBA post-build deployment and production-promotion scripts. Production never rebuilds the approved Preview artifact.
- `scripts/validate.mjs` — archive/manifest integrity checks.
- `scripts/validate-webgl-project.mjs` — static CI contract for the Unity project structure, build entrypoints and cloud-release hooks.
- `scripts/package-vercel-release.mjs` — converts a Unity Web output into a versioned Vercel Build Output API bundle and release manifest.
- `scripts/verify-vercel-preview.mjs` — checks that the public Preview serves the intended manifest, loader and Wasm artifact.
- `scripts/test-release-packager.mjs` — credential-free CI proof that packaging is deterministic with respect to Unity output bytes.

## Release model

`main branch != newest cloud artifact != MAIN game`

A commit may be newer while the public MAIN remains on an older, more stable build. Promotion is explicit through `production.json`.

The Unity Web release path adds one more distinction:

```text
Git commit
  ↓
Unity Build Automation
  ↓
immutable Vercel Preview
  ↓
browser release gate
  ↓
Vercel promote SAME deployment
  ↓
optional project MAIN promotion
```

Production must never be created by rebuilding an already approved release candidate.

## Implemented sequence

- `0.0.0` — finite preparation, weight, scarcity and socially weighted objects.
- `0.0.1` — deterministic time, crisis timeline, cancellable tasks and structured RunLog.
- `0.0.2` — directional SocialLedger with evidence-backed promises, refusal, lies and reciprocity.
- `0.1.0` — first full playable evening: variable roster, character-specific affordances, token economy, connected scenarios, visuals and endings.
- `0.1.1` — tutorial, procedural SFX/ambience, motion language and Unity Web integration scaffolding.
- source milestone — authoritative Unity `RunState`/`RunEngine`, schema-aware round-trip contract and browser command bridge.
- source milestone — Unity 6.3 project pin, deterministic generated prototype scene, five editor-side buildability tests and programmatic Development Web build entrypoint.
- source milestone — UBA pre-export contract, immutable SHA-256 release manifest, Vercel Preview packaging/static verification and production promotion without rebuild.

## Design rule

Every mechanic must answer four questions:

1. What does the player physically do?
2. What pressure does the system create?
3. What social relationship does that pressure expose?
4. Why is this a game mechanic instead of a paragraph of lore?

If a feature cannot answer all four, it is optional.

## Character rule

A character is not a passive modifier. Presence must change which actions legally exist. Absence therefore changes the rhetoric and strategy of the same scenario.

## Causality rule

A relationship number is never sufficient evidence by itself. Meaningful social mutations should preserve who affected whom, when, which event caused it and why.

## Web runtime rule

Unity will own simulation/rendering. The browser shell will own release routing, archive identity, loading integration, run export and host-level controls. They communicate through a small versioned event bridge rather than duplicated gameplay systems.

## Artifact rule

A release candidate is identified by its Unity output bytes, not by the human intention to create “the same build again.” The release manifest stores SHA-256 per file plus an aggregate artifact digest. Preview and production must point to the same Vercel deployment after the browser gate passes.
