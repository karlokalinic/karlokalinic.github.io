---
layout: home
nav_order: 1       # prikazuje ga na vrhu sidebara
title: "Home"
description: "RPG Worldbuilding Hub"
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

<header>
  <nav>
 <ul>
      <li><a href="world.md">World Overview</a></li>
      <li><a href="regions.md">Regions</a></li>
      <li><a href="factions.md">Factions</a></li>
      <li><a href="characters.md">Characters</a></li>
      <li><a href="locations.md">Locations</a></li>
      <li><a href="items.md">Items</a></li>
      <li><a href="quests.md">Quests</a></li>
      <li><a href="bestiary.md">Bestiary</a></li>
      <li><a href="magic.md">Magic</a></li>
      <li><a href="history.md">History & Timeline</a></li>
    </ul>
  </nav>
</header>

<main>
  <section>
    <h2>Layout Demos</h2>
    <ul class="nav-list">
      <li><a href="layout-home.md">Home Layout</a></li>
      <li><a href="layout-page.md">Page Layout</a></li>
      <li><a href="layout-post.md">Post Layout</a></li>
      <li><a href="layout-default.md">Default Layout</a></li>
    </ul>
  </section>

  <section>
    <h2>Theme Picker</h2>
    <div id="theme-controls">
      <label for="theme-select">Choose Theme:</label>
      <select id="theme-select" aria-label="Theme select">
        <option value="classic">Classic</option>
        <option value="dark">Dark</option>
        <option value="forest">Forest</option>
        <option value="arcane">Arcane</option>
      </select>
    </div>
  </section>
</main>

## Theme Picker

<div id="theme-controls">
  <label for="theme-select">Choose Theme:</label>
  <select id="theme-select">
    <option value="classic">Classic</option>
    <option value="dark">Dark</option>
    <option value="forest">Forest</option>
    <option value="arcane">Arcane</option>
  </select>
</div>


<script>
const themes = {
  classic: {
    '--bg': '#f4efe6',
    '--fg': '#2d1b00',
    '--accent': '#bfa76f',
    '--nav': '#e9e2d0',
    '--card': '#fff9ed',
    '--shadow': 'rgba(0,0,0,0.07)'
  },
  dark: {
    '--bg': '#181818',
    '--fg': '#e0e0e0',
    '--accent': '#5e3c1b',
    '--nav': '#232323',
    '--card': '#222',
    '--shadow': 'rgba(0,0,0,0.25)'
  },
  forest: {
    '--bg': '#22331a',
    '--fg': '#e6ffe6',
    '--accent': '#4e944f',
    '--nav': '#2d4d22',
    '--card': '#2e3d25',
    '--shadow': 'rgba(34,51,26,0.15)'
  },
  arcane: {
    '--bg': '#1a1332',
    '--fg': '#e0d7ff',
    '--accent': '#a259f7',
    '--nav': '#2a1a4d',
    '--card': '#241a3a',
    '--shadow': 'rgba(162,89,247,0.10)'
  }
};

function setTheme(theme) {
  const root = document.documentElement;
  const t = themes[theme] || themes.classic;
  for (const key in t) {
    root.style.setProperty(key, t[key]);
  }
  localStorage.setItem('theme', theme);
}

function getSavedTheme() {
  return localStorage.getItem('theme') || 'classic';
}

document.addEventListener('DOMContentLoaded', function() {
  const select = document.getElementById('theme-select');
  const saved = getSavedTheme();
  select.value = saved;
  setTheme(saved);
  select.addEventListener('change', function() {
    setTheme(this.value);
  });
});

// 404 fallback for broken links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
      fetch(this.getAttribute('href'), {method: 'HEAD'})
        .then(resp => {
          if (!resp.ok) {
            e.preventDefault();
            alert('Sorry, this page does not exist (404).');
          }
        })
        .catch(() => {
          e.preventDefault();
          alert('Sorry, this page does not exist (404).');
        });
    });
  });
});
</script>


<style>
:root {
  --bg: #f4efe6;
  --fg: #2d1b00;
  --accent: #bfa76f;
  --nav: #e9e2d0;
  --card: #fff9ed;
  --shadow: rgba(0,0,0,0.07);
}
body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Merriweather', serif;
  margin: 0;
  min-height: 100vh;
  transition: background 0.5s, color 0.5s;
}
header {
  background: var(--nav);
  box-shadow: 0 2px 8px var(--shadow);
  padding: 1.5em 0 1em 0;
  text-align: center;
}
header h1 {
  margin: 0 0 0.5em 0;
  font-size: 2.5em;
  letter-spacing: 0.05em;
}
.nav-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1em;
}
.nav-list li {
  margin: 0;
}
.nav-list a {
  color: var(--fg);
  background: var(--accent);
  padding: 0.5em 1.2em;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  box-shadow: 0 1px 4px var(--shadow);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.nav-list a:hover, .nav-list a:focus {
  background: var(--fg);
  color: var(--accent);
  outline: 2px solid var(--accent);
  box-shadow: 0 2px 8px var(--shadow);
}
main {
  max-width: 900px;
  margin: 2em auto;
  padding: 1.5em;
  background: var(--card);
  border-radius: 12px;
  box-shadow: 0 4px 24px var(--shadow);
}
section {
  margin-bottom: 2em;
}
#theme-controls {
  margin: 1em 0;
  padding: 1em;
  background: var(--accent, #bfa76f);
  border-radius: 8px;
  color: var(--bg);
  max-width: 400px;
  box-shadow: 0 2px 8px var(--shadow);
  font-size: 1.1em;
}
#theme-select {
  margin-left: 0.5em;
  padding: 0.3em 1em;
  border-radius: 4px;
  border: 1px solid var(--fg);
  background: var(--card);
  color: var(--fg);
  font-size: 1em;
}
@media (max-width: 600px) {
  main {
    padding: 0.5em;
  }
  .nav-list {
    flex-direction: column;
    gap: 0.5em;
  }
}
</style>


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
