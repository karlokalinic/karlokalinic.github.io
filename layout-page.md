---
title: Page Layout Demo
layout: page
---

# Page Layout

This page uses the `page` layout.

## Languages & Scripts

A list of major languages and scripts used across the world.

- **Eldertongue**: Ancient language of the elves, written in flowing runes.
- **Stone Speech**: The guttural dialect of dwarves, inscribed in angular glyphs.
- **Trade Common**: The universal language for commerce and diplomacy.
- **Sylvan Whispers**: The secretive language of forest spirits.
- **Draconic**: The powerful, sibilant tongue of dragons and their kin.
- **Celestial Script**: Used by angels and scholars of the divine.

---

## Fantasy Name Generator

Generate a random fantasy name for your character, place, or artifact!

<div id="name-gen">
  <button onclick="generateName()">Generate Name</button>
  <div id="name-result"></div>
</div>

<script>
const namePrefixes = ["Aer", "Bel", "Cor", "Dra", "Ely", "Fen", "Gal", "Hal", "Ith", "Jor", "Kel", "Lor", "Mor", "Nor", "Or", "Per", "Quel", "Ryn", "Syl", "Tor", "Ul", "Vor", "Wyn", "Xan", "Yel", "Zor"];
const nameMiddles = ["a", "e", "i", "o", "u", "ae", "ia", "or", "an", "el", "il", "ur", "yn", "ar", "en"];
const nameSuffixes = ["dor", "ion", "mir", "thas", "dil", "wyn", "las", "rin", "lor", "dan", "mar", "nor", "thil", "var", "gorn", "dril", "rion", "lith", "sor", "vash"];

function generateName() {
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  let name = pick(namePrefixes) + pick(nameMiddles) + pick(nameSuffixes);
  document.getElementById('name-result').innerText = name;
}
</script>

<style>
#name-gen {
  margin: 1em 0;
  padding: 1em;
  background: #e6ffe6;
  border-radius: 8px;
  max-width: 400px;
}
#name-result {
  margin-top: 1em;
  font-size: 1.3em;
  font-weight: bold;
  color: #22331a;
}
</style>
