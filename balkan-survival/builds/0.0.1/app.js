const STEP_MINUTES = 5;
const TICK_MS = 800;
const START_MINUTE = 17 * 60;
const END_MINUTE = 20 * 60;

const $ = (q) => document.querySelector(q);
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;

const initialState = () => ({
  minute: START_MINUTE,
  availableAt: 17 * 60 + 20,
  ended: false,
  activeTask: null,
  flags: { water: 'normal', store: 'open', network: 'normal', neighborRequest: false },
  resources: { water: 0, food: 0, medicine: 0, documents: 0, information: 0, solidarity: 0, money: 60 },
  facts: { calledMother: false, checkedNeighbor: false },
  feed: [],
  log: []
});

let state = initialState();
let timer = null;

function log(type, actor, action, consequence, tags = []) {
  state.log.push({
    at: fmt(state.minute),
    minute: state.minute,
    type,
    actor,
    action,
    consequence,
    tags,
    build: '0.0.1'
  });
}

function city(source, title, body, apply) {
  state.feed.unshift({ at: fmt(state.minute), source, title, body });
  log('world_event', source, title, body, ['city']);
  if (apply) apply();
}

const timeline = [
  { at: 17*60+10, run: () => city('POSLODAVAC','SMJENA OSTAVLJENA DO KRAJA','Nitko ne kaže da je hitno. Ostaješ do 17:20, kao i svaki drugi dan.') },
  { at: 17*60+15, run: () => city('GRUPA STANARA','NETKO PIŠE DA PADA PRITISAK','Poruka nema izvor. Ima tri uskličnika i fotografiju mutne slavine.') },
  { at: 17*60+40, run: () => city('VODOVOD','OPSKRBA JE STABILNA','Službena poruka navodi moguća kratkotrajna kolebanja, bez potrebe za stvaranjem zaliha.', () => state.resources.information += 1) },
  { at: 18*60+10, run: () => city('TRGOVINA','GUŽVA NA BLAGAJNAMA','Vrijeme kupnje raste. Police još nisu prazne.', () => state.flags.store = 'crowded') },
  { at: 18*60+30, run: () => city('ZGRADA','PRITISAK VODE PADA','Punjenje spremnika sada traje dulje i daje manje vode.', () => state.flags.water = 'low') },
  { at: 18*60+45, run: () => city('SUSJED · 3. KAT','IMATE LI VIŠKA VODE?','Susjed kaže da mu je dijete bolesno. Sada postoji radnja koju prije nije bilo moguće izvršiti.', () => state.flags.neighborRequest = true) },
  { at: 18*60+55, run: () => city('CIVILNA ZAŠTITA','PRIPREMITE OSNOVNE ZALIHE','Nova poruka više ne zvuči kao jutarnje priopćenje. Nitko ne objašnjava što se promijenilo.', () => state.resources.information += 2) },
  { at: 19*60, run: () => city('VODOVOD','PREKID OPSKRBE','Slavina više nije resurs. Postala je predmet.', () => state.flags.water = 'off') },
  { at: 19*60+15, run: () => city('TELEKOM','MREŽA PREOPTEREĆENA','Pozivi više nisu pouzdani. Vrijeme potrebno za kontakt raste.', () => state.flags.network = 'congested') },
  { at: 19*60+20, run: () => city('TRGOVINA','ULAZ ZATVOREN','Trgovina više ne prima nove kupce.', () => state.flags.store = 'closed') },
  { at: 19*60+35, run: () => {
      if (!state.facts.calledMother) city('MOBITEL','PROPUŠTEN POZIV: MAMA','Poziv se pojavio tek sada. Nije označeno kada je stvarno pokušala dobiti vezu.');
      else city('MOBITEL','PORUKA: MAMA','"Dobro sam. Ne dolazi. Samo mi javi gdje ćeš biti."');
    }
  }
];

const actions = {
  documents: {
    label: 'SPREMI DOKUMENTE',
    detail: 'Osobna, zdravstvena, ključevi.',
    duration: () => 10,
    available: () => state.resources.documents === 0,
    finish: () => { state.resources.documents = 1; return 'Dokumenti su spremljeni.'; }
  },
  water: {
    label: 'NAPUNI SPREMNIKE',
    detail: 'Vrijednost ove radnje ovisi o stanju vodovoda.',
    duration: () => state.flags.water === 'normal' ? 25 : 50,
    available: () => state.flags.water !== 'off',
    finish: () => {
      const amount = state.flags.water === 'normal' ? 6 : state.flags.water === 'low' ? 3 : 0;
      state.resources.water += amount;
      return amount ? `Spremljeno ${amount} L vode.` : 'Opskrba je stala prije završetka.';
    }
  },
  food: {
    label: 'ODI U TRGOVINU',
    detail: '20 € · gužva povećava trajanje i smanjuje ishod.',
    duration: () => state.flags.store === 'crowded' ? 60 : 35,
    available: () => state.flags.store !== 'closed' && state.resources.money >= 20,
    finish: () => {
      if (state.flags.store === 'closed') return 'Došao si do zatvorenih vrata. Vrijeme je potrošeno.';
      const amount = state.flags.store === 'crowded' ? 4 : 6;
      state.resources.money -= 20;
      state.resources.food += amount;
      return `Kupljeno ${amount} jedinica hrane za 20 €.`;
    }
  },
  medicine: {
    label: 'POKUPI BAKINE LIJEKOVE',
    detail: 'Nisu tvoji, ali postaju tvoja obveza.',
    duration: () => 20,
    available: () => state.resources.medicine === 0,
    finish: () => { state.resources.medicine = 1; state.resources.solidarity += 1; return 'Lijekovi su kod tebe. Sada ih moraš nekome i odnijeti.'; }
  },
  mother: {
    label: 'NAZOVI MAMU',
    detail: 'Prije zagušenja 15 min; poslije 30 min.',
    duration: () => state.flags.network === 'congested' ? 30 : 15,
    available: () => !state.facts.calledMother,
    finish: () => {
      if (state.flags.network === 'congested') {
        state.resources.information += 1;
        return 'Veza puca. Znaš samo da je živa i da je kod kuće.';
      }
      state.facts.calledMother = true;
      state.resources.information += 2;
      return 'Kontakt uspostavljen. Znaš gdje je i što joj treba.';
    }
  },
  radio: {
    label: 'SLUŠAJ LOKALNI RADIO',
    detail: 'Informacija je resurs samo ako platiš vremenom.',
    duration: () => 15,
    available: () => true,
    finish: () => { state.resources.information += 2; return 'Čuo si dvije potvrđene lokacije i jedno proturječno priopćenje.'; }
  },
  neighbor: {
    label: 'ODNESI SUSJEDU 2 L VODE',
    detail: 'Pojavljuje se samo ako je zamolio. Troši tvoju zalihu.',
    duration: () => 10,
    available: () => state.flags.neighborRequest && state.resources.water >= 2 && !state.facts.checkedNeighbor,
    finish: () => {
      state.resources.water -= 2;
      state.resources.solidarity += 4;
      state.facts.checkedNeighbor = true;
      return 'Dao si 2 L vode. Susjed sada zna da si otvorio vrata.';
    }
  }
};

function startAction(id) {
  if (state.ended || state.minute < state.availableAt || state.activeTask) return;
  const def = actions[id];
  if (!def || !def.available()) return;
  const duration = def.duration();
  state.activeTask = { id, total: duration, remaining: duration, startedAt: state.minute };
  log('task_start', 'PLAYER', id, `Started ${def.label}; planned ${duration} min.`, ['task']);
  render();
}

function cancelAction() {
  if (!state.activeTask) return;
  const task = state.activeTask;
  const spent = task.total - task.remaining;
  log('task_cancel', 'PLAYER', task.id, `Cancelled after ${spent} min. Time is not refunded.`, ['task','interruption']);
  state.activeTask = null;
  render();
}

function completeAction() {
  const task = state.activeTask;
  if (!task) return;
  const def = actions[task.id];
  const consequence = def.finish();
  log('task_complete', 'PLAYER', task.id, consequence, ['task','consequence']);
  state.activeTask = null;
}

function fireTimeline(previous, current) {
  for (const event of timeline) {
    if (event.at > previous && event.at <= current) event.run();
  }
}

function tick() {
  if (state.ended) return;
  const previous = state.minute;
  state.minute = Math.min(state.minute + STEP_MINUTES, END_MINUTE);
  fireTimeline(previous, state.minute);

  if (state.activeTask) {
    state.activeTask.remaining -= STEP_MINUTES;
    if (state.activeTask.remaining <= 0) completeAction();
  }

  if (state.minute >= END_MINUTE) finishRun();
  render();
}

function verdict() {
  const r = state.resources;
  if (r.water < 3) return ['VJEROVAO SI DA ĆE VODA OSTATI.','Najskuplja odluka bila je ona koja je izgledala kao čekanje. Imaš premalo vode za mirnu noć.'];
  if (!state.facts.calledMother) return ['STAN JE SPREMAN. ODNOS NIJE.','Prikupio si stvari, ali nisi na vrijeme prikupio čovjeka u obliku informacije. Ne znaš dovoljno o vlastitoj obitelji.'];
  if (r.solidarity >= 4 && r.water >= 3) return ['PRIPREMA NIJE PRIVATNI SPORT.','Dio vlastite sigurnosti pretvorio si u tuđu. To može biti pogreška. Može biti i početak društva.'];
  if (r.information >= 5) return ['ZNAO SI VIŠE. NISI IMAO VIŠE VREMENA.','Informacija je pomogla, ali nije ukinula red na blagajni, smjenu ni zatvorenu slavinu.'];
  return ['IMAŠ PLAN. GRAD IMA RASPORED.','Uspio si nešto pripremiti, ali svaka odluka došla je nakon neke druge odluke koju više nije bilo moguće donijeti.'];
}

function finishRun() {
  if (state.ended) return;
  state.ended = true;
  clearInterval(timer);
  if (state.activeTask) {
    log('task_interrupted', 'SYSTEM', state.activeTask.id, 'Preparation window closed before task completion.', ['task','deadline']);
    state.activeTask = null;
  }
  const [title,text] = verdict();
  log('run_end','SYSTEM','deadline',title,['ending']);
  localStorage.setItem('balkan-survival:last-run', JSON.stringify({build:'0.0.1', endedAt:fmt(state.minute), resources:state.resources, facts:state.facts, log:state.log}));
  $('#endingTitle').textContent = title;
  $('#endingText').textContent = text;
  $('#endingStats').innerHTML = Object.entries(state.resources).map(([k,v]) => `<span>${k.toUpperCase()}: <b>${v}</b></span>`).join('');
  $('#ending').hidden = false;
}

function renderActions() {
  const locked = state.minute < state.availableAt;
  $('#actions').innerHTML = Object.entries(actions).map(([id,def]) => {
    const d = def.duration();
    const disabled = locked || !!state.activeTask || !def.available() || state.ended;
    return `<button class="action" data-action="${id}" ${disabled?'disabled':''}><b>${def.label}</b><em>${d} MIN</em><small>${def.detail}</small></button>`;
  }).join('');
  document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => startAction(b.dataset.action)));
}

function renderResources() {
  const labels = {water:'VODA / L',food:'HRANA',medicine:'LIJEKOVI',documents:'DOKUMENTI',information:'INFORMACIJE',solidarity:'SOLIDARNOST',money:'NOVAC / €'};
  $('#resources').innerHTML = Object.entries(state.resources).map(([k,v]) => `<div class="resource"><span>${labels[k]}</span><b>${v}</b></div>`).join('');
}

function renderFeed() {
  $('#feed').innerHTML = state.feed.length ? state.feed.map(x => `<article class="entry"><time>${x.at}</time><strong>${x.source} · ${x.title}</strong><p>${x.body}</p></article>`).join('') : '<p class="entry">Grad još nije rekao ništa. To ne znači da se ništa ne događa.</p>';
}

function renderLog() {
  const rows = state.log.slice().reverse().slice(0,14);
  $('#runlog').innerHTML = rows.length ? rows.map(x => `<article class="entry"><time>${x.at}</time><strong>${x.type}</strong><p>${x.action} → ${x.consequence}</p></article>`).join('') : '<p class="entry">Nema zapisa.</p>';
}

function renderTask() {
  const task = state.activeTask;
  $('#cancelTask').disabled = !task || state.ended;
  if (!task) {
    $('#taskName').textContent = 'nema';
    $('#taskBar').style.width = '0%';
    return;
  }
  $('#taskName').textContent = `${actions[task.id].label} · ${task.remaining} min`;
  $('#taskBar').style.width = `${Math.max(0,100 * (task.total - task.remaining) / task.total)}%`;
}

function render() {
  $('#clock').textContent = fmt(state.minute);
  const atWork = state.minute < state.availableAt;
  $('#availability').textContent = atWork ? `NA POSLU DO ${fmt(state.availableAt)}` : state.ended ? 'ZATVORENO' : 'DOSTUPAN';
  $('#worldState').textContent = `voda:${state.flags.water} · trgovina:${state.flags.store} · mreža:${state.flags.network}`;
  $('#notice').textContent = atWork ? 'Kriza je već počela proizvoditi informacije. Ti još uvijek proizvodiš radno vrijeme.' : 'Radnje troše vrijeme. Grad ne pauzira dok biraš.';
  renderActions();
  renderResources();
  renderFeed();
  renderLog();
  renderTask();
}

function exportLog() {
  const payload = {build:'0.0.1', seed:'deterministic-001', state:{minute:state.minute,resources:state.resources,facts:state.facts}, log:state.log};
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `balkan-survival-0.0.1-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restart() {
  clearInterval(timer);
  state = initialState();
  $('#ending').hidden = true;
  log('run_start','SYSTEM','scenario','Shift ends at 17:20; crisis window ends at 20:00.',['start']);
  render();
  timer = setInterval(tick,TICK_MS);
}

$('#cancelTask').addEventListener('click', cancelAction);
$('#exportLog').addEventListener('click', exportLog);
$('#restart').addEventListener('click', restart);
restart();
