# SYSTEMS BACKLOG — from survival simulation to social simulation

Research baseline: Survival Log (Midnight Workshop, 2026) is useful because its strongest design is not the zombie theme. It combines a fixed preparation window with live stockpile visibility, inventory logistics, an expandable home, cooking/farming/power, needs and morale, weather/blackouts, rescue/trade, background-dependent starts and repeated runs. Its updates also show where friction matters: crisis countdowns, cancellable actions, quick transfers, cross-container resource search, gradual disaster escalation and phone/message controls.

We copy none of its content. We extract interaction problems worth solving.

## Implementation status

### Build 0.0.0 — Kuća nije bunker
Implemented: finite preparation window, weight-limited selection, social-value dimensions on objects, immutable playable build archive and MAIN release pointer.

### Build 0.0.1 — Vrijeme nije neutralno
Implemented slice:
- `GameClock`: deterministic simulated minutes.
- `CrisisTimeline`: scheduled world events mutate water, store and network states.
- `ActionTask`: one active timed task, dynamic duration, cancellable with no time refund.
- `RunLog`: structured state-transition log with JSON export.
- first conditional social request: neighbor asks for water only after the timeline creates the obligation.

Not complete yet: generalized task definitions, multi-character actors, persistent relationships, seed system, automated replay tests.

## P0 — build these before content production

### 1. GameClock + CrisisTimeline — EASY — PARTIAL 0.0.1
Player-facing: one clock, scheduled warnings, progressive crisis severity.
Social reason: institutions rarely fail at one cinematic second; warnings arrive, are ignored, contradicted or unevenly acted upon.
Implementation: deterministic timeline events keyed by simulation minute. No Update-loop spaghetti.
Test target: replay same seed and verify identical event timestamps.

### 2. ItemDefinition + ContainerInventory — EASY
Player-facing: weight, volume, ownership, perishability, category, location.
Social reason: an object is not only useful. It can be mine, ours, borrowed, stolen, rationed or owed.
Required metadata: `owner`, `moralStatus`, `essentiality`, `tradeValue`, `institutionalValue`.

### 3. Stockpile / Risk Register — EASY
Player-facing: low / adequate / resilient across water, calories, heat, medicine, information, power and documents.
Social reason: preparedness is partly planning and partly purchasing power. The UI must never pretend those are the same thing.

### 4. CharacterNeeds — EASY
Do not build six bars that simply decay. Needs should create decisions, not chores.
Start with hydration, calories, warmth, fatigue. Morale is derived later from events and relationships rather than another leaking fuel tank.

### 5. ActionTask — EASY — PARTIAL 0.0.1
Every action has duration, interruptibility and completion effect. Stamina/resource reservation comes later.
Cost is charged on completion unless the action itself logically consumes resources over time.
Social reason: the player must be able to change their mind. Friction is meaningful only when it represents the world, not bad controls.

### 6. PhoneFeed / InformationSource — EASY–MEDIUM — PROTOTYPE 0.0.1
Messages currently carry source, timestamp and consequence. Next iteration adds confidence, agenda and character belief.
Sources: civil protection, family, employer, neighbor group, local radio, anonymous forward.
Social reason: information scarcity and trust are resources.

### 7. SocialLedger — MEDIUM / CORE FEATURE — NEXT
Do not use one Friendship number.
Pairwise values: trust, obligation, resentment, dependency, fear.
Actions write ledger entries: `gaveMedicine`, `refusedShelter`, `usedSharedWater`, `liedAboutStock`.
This is the first system that turns survival into society.

### 8. RunLog — EASY / MANDATORY — PARTIAL 0.0.1
Every meaningful state transition becomes structured data: timestamp, actor, action, consequence, social tags and build version.
Current browser prototype can export JSON.
Purpose: save debugging data now; later generate ending summaries, statistics and selected post-run prose from the same facts.

## P1 — depth without architectural suicide

### 9. Spoilage + HousingQuality — MEDIUM
Food spoilage, damp, mold, insulation and sanitation are environmental pressures.
Social reason: 'clean harder' is not a neutral answer when the building itself is bad.

### 10. PowerGrid — MEDIUM
Loads, sources and priority groups. Fridge, radio, lights, heater, charging.
No electrical-engineering simulator. The interesting act is choosing what loses power.

### 11. Cooking Transformation Graph — MEDIUM
Raw ingredients -> simple meal -> composed meal.
Cooking spends time/power but improves nutrition, morale or shelf life.
Reason: domestic labor must visibly cost somebody time.

### 12. Background / Class Start — EASY–MEDIUM
Background changes starting access, knowledge, working hours and relationships, not arbitrary RPG +10 stats.
Examples: student, warehouse worker, nurse, unemployed tenant, municipal clerk.
Question: who begins a disaster already holding the keys — and who is still clocked in?

### 13. Neighbor Reciprocity Network — MEDIUM
Requests, gifts, loans and favors produce future claims.
A donated object is not deleted from the story; it becomes an obligation edge.

### 14. Resource Finder — EASY
Search all known containers from one interface.
Reason: depth must come from scarcity, not forcing the player to click thirteen cupboards because the simulation forgot it has a brain.

## P2 — expensive features that earn their cost

### 15. Multi-character Task Scheduler — HARD
Characters accept queued tasks, reserve required objects, walk/animate, interrupt safely and report why a task cannot continue.
This is worth building only when at least three controllable people can work simultaneously.

### 16. Shelter Rooms / Floors — HARD
Data-driven rooms with capacity, heat, power and access. A floor is a graph node, not a bespoke scene.
Social reason: architecture distributes privacy, safety and labor.

### 17. Dynamic Social Event Director — HARD / HIGH VALUE
Events query world state instead of firing from a flat random deck.
Example: a medicine request exists because a known neighbor is ill, knows you have medicine, and has enough trust to ask.
This makes narrative causality inspectable and testable.

### 18. Institutional Simulation — HARD / SIGNATURE FEATURE
Model utilities, aid, police/civil protection, stores, transport and communication as services with capacity, delay and district reach.
Do not simulate a country. Simulate promises made to the household and whether they arrive.

### 19. Build-to-Web Run Archive — HARDER LATER
Unity Web build emits run summary JSON to the hosting page. With explicit player consent, a run can be serialized locally/exported and linked to the matching devlog/build version.
Purpose: the website becomes historical evidence of how the rules evolved.

## Deliberately rejected for now

- giant crafting tree
- hundreds of near-identical food items
- combat because 'survival games need combat'
- real-time autonomous NPC AI before deterministic tasks work
- procedural text that cannot explain which state caused it
- morale as a constantly draining chore meter
- any feature whose only justification is that Survival Log has it

Quality comes from causal density: fewer systems, more ways for them to collide.
