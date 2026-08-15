const $ = (q) => document.querySelector(q);

async function boot() {
  const [production, registry] = await Promise.all([
    fetch('./data/production.json').then(r => r.json()),
    fetch('./data/builds.json').then(r => r.json())
  ]);

  $('#mainVersion').textContent = production.version;
  $('#mainStatus').textContent = production.status;
  $('#playMain').href = production.route;

  const builds = registry.builds
    .slice()
    .reverse()
    .map(build => `
      <article class="build">
        <strong>${build.version}</strong> · ${build.kind}<br>
        <small>${build.date} · ${build.engine}</small>
        <p>${build.summary}</p>
        <a href="${build.route}">PLAY THIS BUILD</a>
      </article>`)
    .join('');

  $('#builds').innerHTML = builds;
}

boot().catch(err => {
  console.error(err);
  $('#mainStatus').textContent = 'manifest-error';
});
