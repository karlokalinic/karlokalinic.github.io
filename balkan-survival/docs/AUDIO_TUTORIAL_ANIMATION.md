# 0.1.1 UX POLISH — tutorial, audio and motion

## Tutorial principle

The tutorial teaches the causal grammar, not keyboard trivia.

It explains six things only:
1. resources persist across events;
2. character presence creates or removes legal actions;
3. tokens represent different kinds of access rather than one currency;
4. one event allows one committed decision;
5. decisions immediately mutate the world;
6. Run Log is evidence of causality.

The tutorial never marks an option as morally correct. It can be replayed at any time and first-run completion is stored locally.

## Audio architecture

Build 0.1.1 uses procedural Web Audio instead of downloaded music/SFX files.

Current cues:
- UI tick — hover/focus feedback;
- decision thump — committing a choice;
- continue tone — advancing time;
- door knock — hallway request;
- radio static — Radio Prudina events;
- electrical drop — blackout;
- paper rustle — municipal document event;
- two-tone distant siren — final decision;
- low 49 Hz shelter hum + filtered room noise — ambience.

The audio context is created only after a user gesture. Mute state persists in localStorage. This is intentionally compatible with the browser interaction requirement that will also exist when the runtime becomes Unity Web.

## Motion language

Motion has four jobs:
- announce a new event;
- show that a value changed;
- make the room react to world state;
- direct attention during tutorial steps.

Implemented:
- event-card entrance;
- staggered choices;
- resource/token value bump;
- result reveal;
- character-card breathing;
- blackout lamp collapse;
- radio signal pulse;
- siren red room wash;
- paper movement;
- subtle intro camera drift.

`prefers-reduced-motion` collapses these effects to near-zero duration.

## Rule for later Unity migration

Audio, tutorial and shell UI are not allowed to become duplicated systems.

Unity owns in-game world simulation and spatial/character animation. The browser shell owns page-level loading, archive navigation, optional tutorial framing, run export, mute state and host integration. Communication crosses the WebBridge contract.
