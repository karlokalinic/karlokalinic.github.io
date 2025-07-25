---
title: Post Layout Demo
layout: post
date: 2024-06-10
---

# Post Layout

This page uses the `post` layout.

## Relics & Artifacts

Legendary items of great power and history.

- **Sunforged Blade**: A sword that glows with the light of dawn, bane of undead.
- **Crown of Whispers**: Grants the wearer insight into hidden truths and secrets.
- **Orb of the Depths**: Controls tides and communicates with sea creatures.
- **Mantle of the Phoenix**: Allows resurrection once per century.
- **Shadowstep Boots**: Wearer can teleport between shadows.
- **Tome of Forgotten Stars**: Contains spells lost to time.

---

## Random Loot Generator

Generate a random loot drop for your next adventure!

<div id="loot-gen">
  <button onclick="generateLoot()">Generate Loot</button>
  <div id="loot-result"></div>
</div>

<script>
const lootTypes = ["Weapon", "Armor", "Potion", "Scroll", "Ring", "Amulet", "Gem", "Relic"];
const lootQualities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const lootNames = [
  "of the Bear", "of Shadows", "of Flames", "of the Sea", "of the Eagle", "of the Ancients", "of Frost", "of the Phoenix", "of the Moon", "of the Storm"
];

function generateLoot() {
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  const type = pick(lootTypes);
  const quality = pick(lootQualities);
  const name = pick(lootNames);
  const loot = `${quality} ${type} ${name}`;
  document.getElementById('loot-result').innerText = loot;
}
</script>

<style>
#loot-gen {
  margin: 1em 0;
  padding: 1em;
  background: #f4efe6;
  border-radius: 8px;
  max-width: 400px;
}
#loot-result {
  margin-top: 1em;
  font-size: 1.2em;
  font-weight: bold;
  color: #5e3c1b;
}
</style>
