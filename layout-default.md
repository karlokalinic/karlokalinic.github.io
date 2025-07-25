---
title: Default Layout Demo
layout: default
---

# Default Layout

This page uses the `default` layout.

## Calendar & Festivals

Important dates and celebrations in the world.

- **Dawn's Embrace**: New year festival marking the return of the sun.
- **Night of Masks**: A mysterious celebration where identities are hidden.
- **Harvest Home**: A feast of gratitude and community.
- **Eclipse Vigil**: Night-long rituals during rare celestial events.
- **Festival of Blades**: Tournament for warriors and duelists.
- **Starfall Eve**: Night of wishes as meteors streak across the sky.

---

## Random Event Generator

Generate a random event to inspire your next session!

<div id="event-gen">
  <button onclick="generateEvent()">Generate Event</button>
  <div id="event-result"></div>
</div>

<script>
const eventTypes = [
  "A mysterious stranger arrives in town.",
  "A festival is interrupted by a magical anomaly.",
  "A rare celestial event grants strange powers.",
  "A lost artifact is discovered in the ruins.",
  "A plague spreads among livestock.",
  "A noble seeks heroes for a secret quest.",
  "A monster threatens a remote village.",
  "A prophecy is revealed by an oracle.",
  "A rival faction makes a bold move.",
  "A portal to another realm opens nearby."
];

function generateEvent() {
  const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  document.getElementById('event-result').innerText = event;
}
</script>

<style>
#event-gen {
  margin: 1em 0;
  padding: 1em;
  background: #e0d7ff;
  border-radius: 8px;
  max-width: 400px;
}
#event-result {
  margin-top: 1em;
  font-size: 1.1em;
  font-weight: bold;
  color: #1a1332;
}
</style>
