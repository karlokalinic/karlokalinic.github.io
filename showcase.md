title: World Showcase
layout: default
nav_order: 2
---

<header>
  <h1>World Showcase</h1>
  <nav aria-label="Main navigation">
    <ul class="nav-list">
      <li><a href="index.md">Home</a></li>
      <li><a href="about.md">About</a></li>
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
    <h2>All Quests</h2>
    <ul id="showcase-quests"></ul>
  </section>
  <section>
    <h2>All Characters</h2>
    <ul id="showcase-characters"></ul>
  </section>
  <section>
    <h2>All Factions</h2>
    <ul id="showcase-factions"></ul>
  </section>
  <section>
    <h2>All Locations</h2>
    <ul id="showcase-locations"></ul>
  </section>
  <section>
    <h2>All Items</h2>
    <ul id="showcase-items"></ul>
  </section>
  <section>
    <h2>All Bestiary Entries</h2>
    <ul id="showcase-bestiary"></ul>
  </section>
</main>

<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
<script>
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function renderList(collection, elementId, field='title') {
  db.collection(collection).get().then(snap => {
    const ul = document.getElementById(elementId);
    ul.innerHTML = '';
    snap.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.data()[field] || doc.id;
      ul.appendChild(li);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderList('lore', 'showcase-quests', 'title');
  renderList('characters', 'showcase-characters', 'name');
  renderList('factions', 'showcase-factions', 'name');
  renderList('locations', 'showcase-locations', 'name');
  renderList('items', 'showcase-items', 'name');
  renderList('bestiary', 'showcase-bestiary', 'name');
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
ul {
  background: var(--card);
  border-radius: 8px;
  box-shadow: 0 1px 4px var(--shadow);
  padding: 1em 2em;
  margin: 1em 0;
}
li {
  margin-bottom: 0.5em;
  font-size: 1.1em;
}
</style>
