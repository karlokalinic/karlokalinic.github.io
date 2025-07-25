---
title: Home Layout Demo
layout: home
---

# Home Layout

This page uses the `home` layout.

## Deities & Pantheon

Explore the gods, demigods, and cosmic entities that shape the world's faiths and mythologies.

### Major Deities

- **The Radiant One**: God of light, justice, and renewal. Worshipped by paladins and healers.
- **The Veiled Mother**: Goddess of secrets, fate, and dreams. Her followers are oracles and spies.
- **The Iron Warden**: Deity of war, honor, and protection. Revered by soldiers and city guards.
- **The Trickster**: God of chaos, luck, and change. Rogues and gamblers pray for his favor.

### Minor Spirits

- **Rivermaidens**: Spirits of streams, bringers of fortune or floods.
- **Stone Sentinels**: Guardians of mountain passes, invoked for safe travel.

---

## Dice Roller & Theme Selector

Try your luck with a customizable dice roller and change the site's fantasy theme!

<div id="theme-controls">
  <label for="theme-select">Choose Theme:</label>
  <select id="theme-select">
    <option value="classic">Classic</option>
    <option value="dark">Dark</option>
    <option value="forest">Forest</option>
    <option value="arcane">Arcane</option>
  </select>
</div>

<div id="dice-roller">
  <label for="dice-count">Number of Dice:</label>
  <input type="number" id="dice-count" value="1" min="1" max="20">
  <label for="dice-sides">Sides per Die:</label>
  <input type="number" id="dice-sides" value="6" min="2" max="100">
  <button onclick="rollDice()">Roll!</button>
  <div id="dice-result"></div>
</div>

<script>
// Dice roller algorithm
function rollDice() {
  const count = Math.max(1, Math.min(20, parseInt(document.getElementById('dice-count').value)));
  const sides = Math.max(2, Math.min(100, parseInt(document.getElementById('dice-sides').value)));
  let rolls = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  document.getElementById('dice-result').innerHTML =
    `Rolls: [${rolls.join(', ')}] <br>Total: <strong>${total}</strong>`;
}

// Theme selector
const themes = {
  classic: {
    '--bg': '#f4efe6',
    '--fg': '#2d1b00',
    '--accent': '#bfa76f'
  },
  dark: {
    '--bg': '#181818',
    '--fg': '#e0e0e0',
    '--accent': '#5e3c1b'
  },
  forest: {
    '--bg': '#22331a',
    '--fg': '#e6ffe6',
    '--accent': '#4e944f'
  },
  arcane: {
    '--bg': '#1a1332',
    '--fg': '#e0d7ff',
    '--accent': '#a259f7'
  }
};

function setTheme(theme) {
  const root = document.documentElement;
  const t = themes[theme] || themes.classic;
  for (const key in t) {
    root.style.setProperty(key, t[key]);
  }
}

document.getElementById('theme-select').addEventListener('change', function() {
  setTheme(this.value);
});
setTheme('classic');
</script>

<style>
:root {
  --bg: #f4efe6;
  --fg: #2d1b00;
  --accent: #bfa76f;
}
body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Merriweather', serif;
  transition: background 0.5s, color 0.5s;
}
#theme-controls, #dice-roller {
  margin: 1em 0;
  padding: 1em;
  background: var(--accent, #bfa76f);
  border-radius: 8px;
  color: var(--bg);
  max-width: 400px;
}
#dice-result {
  margin-top: 1em;
  font-size: 1.2em;
  color: var(--fg);
}
</style>
