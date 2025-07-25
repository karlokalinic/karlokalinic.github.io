layout: default
title: Characters
nav_order: 7
---


<header>
  <h1>Characters</h1>
  <nav aria-label="Main navigation">
    <ul class="nav-list">
      <li><a href="index.md">Home</a></li>
      <li><a href="about.md">About</a></li>
      <li><a href="world.md">World Overview</a></li>
      <li><a href="regions.md">Regions</a></li>
      <li><a href="factions.md">Factions</a></li>
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
    <h2>Major Characters</h2>
    <p>Detail the major characters and NPCs in your world. For each character, consider:</p>
    <ul>
      <li>Name</li>
      <li>Role or occupation</li>
      <li>Appearance & personality</li>
      <li>Background & motivations</li>
      <li>Relationships</li>
    </ul>
    <h3>Example:</h3>
    <strong>Serana the Wanderer</strong>
    <p>A mysterious traveler with a hidden past and a knack for finding trouble.</p>
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
