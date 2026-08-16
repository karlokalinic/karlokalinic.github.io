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
- `docs/CLOUD_RELEASE.md` — Unity Build Automation → immutable Vercel Preview → browser gate → promote-the-same-deployment contract.
- `docs/ROUNDTRIP_TEST.md` — the twelve browser-visible conditions required before a Unity Preview is eligible for production.
- `webgl/` — buildable Unity 6.3 LTS project root with WebBridge/template/runtime source; a compiled Unity Web artifact has not yet been produced by this repository session.
- `webgl/cloud/` — UBA post-build deployment and production-promotion scripts. Production never rebuilds the approved Preview artifact.
- `scripts/validate.mjs` — archive/manifest integrity checks.
- `scripts/validate-webgl-project.mjs` — static CI contract for Unity, cloud release and browser-gate wiring.
- `scripts/package-vercel-release.mjs` — converts a Unity Web output into a versioned Vercel Build Output API bundle and release manifest.
- `scripts/verify-vercel-preview.mjs` — proves the expected manifest, loader and Wasm reached the public Preview.
- `scripts/headless-roundtrip.mjs` — Playwright/Chromium execution of all twelve Unity ↔ browser integration conditions.
- `scripts/dispatch-roundtrip.mjs` — optional UBA → GitHub `repository_dispatch` handoff after a Preview passes the static gate.
- `.github/workflows/slegnuce-roundtrip.yml` — automatic browser gate plus an explicitly requested production-promotion job.

## Release model

`main branch != newest cloud artifact != Vercel production != MAIN game`

A commit may be newer while the public MAIN remains on an older, more stable build. Promotion is explicit through `production.json`.

The Unity Web release path is:

```text
Git commit
  ↓
Unity Build Automation
  ↓
immutable Vercel Preview
  ↓
static artifact verification
  ↓
Playwright / Chromium 12-of-12 round-trip
  ↓
manual release approval
  ↓
Vercel promote SAME deployment
  ↓
optional project MAIN promotion
```

Production must never be created by rebuilding an already approved release candidate. Passing a deployment test also does not make the release project MAIN; visual and editorial acceptance remain distinct gates.

## Implemented sequence

- `0.0.0` — finite preparation, weight, scarcity and socially weighted objects.
- `0.0.1` — deterministic time, crisis timeline, cancellable tasks and structured RunLog.
- `0.0.2` — directional SocialLedger with evidence-backed promises, refusal, lies and reciprocity.
- `0.1.0` — first full playable evening: variable roster, character-specific affordances, token economy, connected scenarios, visuals and endings.
- `0.1.1` — tutorial, procedural SFX/ambience, motion language and Unity Web integration scaffolding.
- source milestone — authoritative Unity `RunState`/`RunEngine`, schema-aware round-trip contract and browser command bridge.
- source milestone — Unity 6.3 project pin, deterministic generated prototype scene, five editor-side buildability tests and programmatic Development Web build entrypoint.
- source milestone — UBA pre-export contract, immutable SHA-256 release manifest, Vercel Preview packaging/static verification and production promotion without rebuild.
- source milestone — sequenced browser event ledger, Playwright/Chromium 12/12 round-trip automation, Preview dispatch and evidence-report artifact.

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

Unity owns simulation/rendering. The browser shell owns release routing, archive identity, loading integration, run export and host-level controls. They communicate through a small versioned event bridge rather than duplicated gameplay systems. Browser tests consume that same public bridge instead of reaching into private C# internals.

## Artifact rule

A release candidate is identified by its Unity output bytes, not by the human intention to create “the same build again.” The release manifest stores SHA-256 per file plus an aggregate artifact digest. Preview and production must point to the same Vercel deployment after the browser gate passes.

## Evidence rule

A final state is not enough to prove a transition. The Web shell keeps a bounded, sequenced event ledger so automated tests can distinguish which event happened after which command. The ledger is diagnostic evidence, not a second game state.
