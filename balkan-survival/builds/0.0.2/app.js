const STEP_MINUTES = 5;
const TICK_MS = 800;
const START_MINUTE = 17 * 60;
const END_MINUTE = 20 * 60;
const BUILD = '0.0.2';

const $ = (q) => document.querySelector(q);
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

const PEOPLE = {
  PLAYER: { name: 'TI' },
  IVAN: { name: 'IVAN · 3. KAT' },
  MAMA: { name: 'MAMA' },
  BAKA: { name: 'BAKA' }
};

function edge(trust, obligation, resentment, dependency, fear) {
  return { trust, obligation, resentment, dependency, fear, history: [] };
}

const initialState = () => ({
  minute: START_MINUTE,
  availableAt: 17 * 60 + 20,
  ended: false,
  activeTask: null,
  selectedRelation: 'IVAN>PLAYER',
  flags: {
    water: 'normal',
    store: 'open',
    network: 'normal',
    neighborRequest: false,
    neighborResolved: false,
    ivanKnowsWater: false,
    ivanResponseFired: false
  },
  resources: {
    water: 0,
    food: 0,
    medicine: 0,
    documents: 0,
    information: 0,
    money: 60
  },
  facts: {
    calledMother: false,
    hasGrandmaMedicine: false,
    neighborChoice: null,
    promiseWater: 0
  },
  relations: {
    'IVAN>PLAYER': edge(35, 0, 5, 5, 0),
    'PLAYER>IVAN': edge(30, 0, 0, 2, 0),
    'MAMA>PLAYER': edge(82, 8, 2, 48, 5),
    'PLAYER>MAMA': edge(78, 18, 1, 24, 6),
    'BAKA>PLAYER': edge(86, 12, 0, 61, 8),
    'PLAYER>BAKA': edge(83, 26, 0, 31, 7)
  },
  feed: [],
  log: []
});

let state = initialState();
let timer = null;

function log(type, actor, action, consequence, tags = [], meta = {}) {
  state.log.push({
    at: fmt(state.minute),
    minute: state.minute,
    type,
    actor,
    action,
    consequence,
    tags,
    meta,
    build: BUILD
  });
}

function relationKey(from, to) {
  return `${from}>${to}`;
}

function getRelation(from, to) {
  const key = relationKey(from, to);
  if (!state.relations[key]) state.relations[key] = edge(20, 0, 0, 0, 0);
  return state.relations[key];
}

function applyRelation(from, to, deltas, reason, code) {
  const r = getRelation(from, to);
  const applied = {};
  for (const metric of ['trust','obligation','resentment','dependency','fear']) {
    const delta = deltas[metric] ?? 0;
    if (!delta) continue;
    const before = r[metric];
    r[metric] = clamp(before + delta);
    applied[metric] = r[metric] - before;
  }

  const entry = {
    at: fmt(state.minute),
    minute: state.minute,
    from,
    to,
    code,
    reason,
    deltas: applied
  };
  r.history.unshift(entry);

  log(
    'social_ledger',
    from,
    code,
    reason,
    ['social','relationship',from,to],
    { from, to, deltas: applied }
  );
}

function city(source, title, body, apply) {
  state.feed.unshift({ at: fmt(state.minute), source, title, body });
  log('world_event', source, title, body, ['city']);
  if (apply) apply();
}

function message(source, title, body) {
  state.feed.unshift({ at: fmt(state.minute), source, title, body });
  log('message', source, title, body, ['information','social']);
}

function hasWater(amount = 1) {
  return state.resources.water >= amount;
}

function resolveNeighbor(choice) {
  state.flags.neighborResolved = true;
  state.facts.neighborChoice = choice;
}

const timeline = [
  { at: 17*60+10, run: () => city('POSLODAVAC','SMJENA OSTAVLJENA DO KRAJA','Nitko ne kaže da je hitno. Ostaješ do 17:20, kao i svaki drugi dan.') },
  { at: 17*60+15, run: () => city('GRUPA STANARA','NETKO PIŠE DA PADA PRITISAK','Poruka nema izvor. Ima tri uskličnika i fotografiju mutne slavine.') },
  { at: 17*60+40, run: () => city('VODOVOD','OPSKRBA JE STABILNA','Službena poruka navodi moguća kratkotrajna kolebanja, bez potrebe za stvaranjem zaliha.', () => state.resources.information += 1) },
  { at: 18*60+10, run: () => city('TRGOVINA','GUŽVA NA BLAGAJNAMA','Vrijeme kupnje raste. Police još nisu prazne.', () => state.flags.store = 'crowded') },
  { at: 18*60+30, run: () => city('ZGRADA','PRITISAK VODE PADA','Punjenje spremnika sada traje dulje i daje manje.', () => state.flags.water = 'low') },
  { at: 18*60+40, run: () => {
      if (state.resources.water >= 2) state.flags.ivanKnowsWater = true;
      city('HODNIK','IVAN TE VIDI S BOCAMA','Ništa ne traži. Samo registrira da imaš vodu.', () => {
        if (state.flags.ivanKnowsWater) applyRelation('IVAN','PLAYER',{trust:2},'Vidio je da se pripremaš i zna da barem nešto imaš.','observed_stock');
      });
    }
  },
  { at: 18*60+45, run: () => city('IVAN · 3. KAT','"IMAŠ LI DVIJE LITRE ZA MALOG?"','Ivan kaže da mu dijete povraća i da su mu ostale dvije čaše. Zahtjev sada postoji.', () => state.flags.neighborRequest = true) },
  { at: 18*60+55, run: () => city('CIVILNA ZAŠTITA','PRIPREMITE OSNOVNE ZALIHE','Nova poruka više ne zvuči kao jutarnje priopćenje. Nitko ne objašnjava što se promijenilo.', () => state.resources.information += 2) },
  { at: 19*60, run: () => city('VODOVOD','PREKID OPSKRBE','Slavina više nije resurs. Postala je predmet.', () => state.flags.water = 'off') },
  { at: 19*60+10, run: () => {
      if (state.facts.neighborChoice === 'promise' && state.facts.promiseWater > 0 && hasWater(state.facts.promiseWater)) {
        message('IVAN · 3. KAT','"REKAO SI DA ĆEŠ DONIJETI."','Obećanje je preživjelo prekid vode. Sada je skuplje nego kada je izgovoreno.');
        applyRelation('IVAN','PLAYER',{trust:-8,resentment:8,dependency:4},'Obećao si vodu, voda je nestala, a obećanje još nije ispunjeno.','promise_overdue');
      }
    }
  },
  { at: 19*60+15, run: () => city('TELEKOM','MREŽA PREOPTEREĆENA','Pozivi više nisu pouzdani. Vrijeme potrebno za kontakt raste.', () => state.flags.network = 'congested') },
  { at: 19*60+20, run: () => city('TRGOVINA','ULAZ ZATVOREN','Trgovina više ne prima nove kupce.', () => state.flags.store = 'closed') },
  { at: 19*60+25, run: () => {
      if (state.flags.ivanResponseFired) return;
      state.flags.ivanResponseFired = true;

      if (state.facts.neighborChoice === 'give') {
        message('IVAN · 3. KAT','ISPRED VRATA SU DVIJE KONZERVE','Nema cedulje. Ivan je vratio dio dara bez da je pitao koliko vrijedi.');
        state.resources.food += 2;
        applyRelation('IVAN','PLAYER',{obligation:-12,trust:5},'Vratio je dio primljene pomoći hranom. Dug se smanjio, odnos nije vraćen na početak.','reciprocity_food');
      } else if (state.facts.neighborChoice === 'lie' && state.flags.ivanKnowsWater) {
        message('IVAN · 3. KAT','"MISLIO SAM DA NEMAŠ."','Vidio je boce ranije. Nije problem što nisi dao vodu. Problem je što si prepravio stvarnost.');
        applyRelation('IVAN','PLAYER',{trust:-28,resentment:22,fear:3},'Otkrio je da si lagao o zalihi koju je već vidio.','lie_discovered');
      } else if (state.facts.neighborChoice === 'refuse') {
        message('IVAN · 3. KAT','VRATA SE ZATVARAJU','Nije zadovoljan. Ali zna što si rekao i zna da nije bilo laži.');
        applyRelation('IVAN','PLAYER',{resentment:8,trust:1},'Odbio si ga izravno. Zamjeranje raste, ali informacijska osnova odnosa ostaje čista.','honest_refusal_aftermath');
      }
    }
  },
  { at: 19*60+35, run: () => {
      if (!state.facts.calledMother) message('MOBITEL','PROPUŠTEN POZIV: MAMA','Poziv se pojavio tek sada. Nije označeno kada je stvarno pokušala dobiti vezu.');
      else message('MOBITEL','PORUKA: MAMA','"Dobro sam. Ne dolazi. Samo mi javi gdje ćeš biti."');
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
    detail: 'Ivan te može vidjeti s bocama. Znanje o zalihi postaje društvena činjenica.',
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
    detail: 'Predmet dolazi s vlasnikom i obvezom, ne samo s ikoncom.',
    duration: () => 20,
    available: () => !state.facts.hasGrandmaMedicine,
    finish: () => {
      state.resources.medicine = 1;
      state.facts.hasGrandmaMedicine = true;
      applyRelation('PLAYER','BAKA',{obligation:12,dependency:3},'Uzeo si lijekove koje trebaš kasnije dostaviti baki.','took_grandma_medicine');
      return 'Lijekovi su kod tebe. Inventory je dobio predmet; odnos je dobio obvezu.';
    }
  },
  mother: {
    label: 'NAZOVI MAMU',
    detail: 'Kontakt mijenja i informaciju i odnos.',
    duration: () => state.flags.network === 'congested' ? 30 : 15,
    available: () => !state.facts.calledMother,
    finish: () => {
      state.facts.calledMother = true;
      state.resources.information += state.flags.network === 'congested' ? 1 : 2;
      applyRelation('MAMA','PLAYER',{trust:4,fear:-2},'Javio si se prije nego što je morala nagađati gdje si.','called_mother');
      applyRelation('PLAYER','MAMA',{obligation:-3,trust:2},'Kontakt je smanjio neizvjesnost, ne nužno brigu.','called_mother');
      return state.flags.network === 'congested'
        ? 'Veza puca. Znaš da je živa, ali malo više.'
        : 'Kontakt uspostavljen. Znaš gdje je i što joj treba.';
    }
  },
  radio: {
    label: 'SLUŠAJ LOKALNI RADIO',
    detail: 'Informacija je resurs samo ako platiš vremenom.',
    duration: () => 15,
    available: () => true,
    finish: () => { state.resources.information += 2; return 'Čuo si dvije potvrđene lokacije i jedno proturječno priopćenje.'; }
  },

  giveNeighbor: {
    label: 'DAJ IVANU 2 L VODE',
    detail: 'Gubitak zalihe stvara konkretan trag obveze. Ne stvara prijateljstvo automatski.',
    duration: () => 10,
    social: true,
    available: () => state.flags.neighborRequest && !state.flags.neighborResolved && hasWater(2),
    finish: () => {
      state.resources.water -= 2;
      resolveNeighbor('give');
      applyRelation('IVAN','PLAYER',{trust:18,obligation:24,dependency:7,resentment:-3},'Dao si dvije litre nakon zahtjeva za bolesno dijete.','gave_water');
      applyRelation('PLAYER','IVAN',{trust:3,obligation:-2},'Prihvatio si njegov zahtjev kao legitimnu obvezu susjedstva.','gave_water');
      return 'Dao si 2 L. Voda je nestala iz zalihe, ali događaj nije nestao iz priče.';
    }
  },
  promiseNeighbor: {
    label: 'OBEĆAJ IVANU 2 L',
    detail: 'Ne troši vodu sada. Stvara dug koji postoji prije transfera.',
    duration: () => 5,
    social: true,
    available: () => state.flags.neighborRequest && !state.flags.neighborResolved,
    finish: () => {
      resolveNeighbor('promise');
      state.facts.promiseWater = 2;
      applyRelation('IVAN','PLAYER',{trust:7,dependency:8,obligation:10},'Rekao si da ćeš donijeti dvije litre. Budući resurs sada je već društveno rezerviran.','promised_water');
      applyRelation('PLAYER','IVAN',{obligation:18},'Obećanje je stvorilo tvoju obvezu prije nego što je predmet promijenio vlasnika.','promised_water');
      return 'Obećao si 2 L. Inventory još pokazuje istu vodu. Ledger ne.';
    }
  },
  fulfillPromise: {
    label: 'ISPUNI OBEĆANJE: 2 L',
    detail: 'Pojavljuje se samo nakon obećanja. Dug se zatvara događajem, ne resetiranjem broja.',
    duration: () => 10,
    social: true,
    available: () => state.facts.neighborChoice === 'promise' && state.facts.promiseWater > 0 && hasWater(2),
    finish: () => {
      state.resources.water -= 2;
      state.facts.promiseWater = 0;
      state.facts.neighborChoice = 'fulfilled';
      applyRelation('IVAN','PLAYER',{trust:16,obligation:12,resentment:-6},'Ispunio si ono što si prethodno obećao, nakon što je voda već postala oskudnija.','fulfilled_water_promise');
      applyRelation('PLAYER','IVAN',{obligation:-18,trust:4},'Tvoja prethodno evidentirana obveza je ispunjena. Povijest ostaje.','fulfilled_water_promise');
      return 'Predao si 2 L. Obećanje je ispunjeno; zapis ostaje.';
    }
  },
  refuseNeighbor: {
    label: 'ODBIJ IVANA',
    detail: 'Ne gubiš vodu. Ne lažeš. To dvoje nije isto.',
    duration: () => 5,
    social: true,
    available: () => state.flags.neighborRequest && !state.flags.neighborResolved,
    finish: () => {
      resolveNeighbor('refuse');
      applyRelation('IVAN','PLAYER',{trust:-3,resentment:14,dependency:-2},'Rekao si da vodu nećeš dati. Odluka je loša za njega, ali čitljiva.','refused_water');
      return 'Odbio si. Zaliha je ostala ista. Odnos nije.';
    }
  },
  lieNeighbor: {
    label: 'RECI: "NEMAM VODE"',
    detail: 'Ako Ivan zna za boce, laž kasnije ima dokaz.',
    duration: () => 5,
    social: true,
    available: () => state.flags.neighborRequest && !state.flags.neighborResolved,
    finish: () => {
      resolveNeighbor('lie');
      applyRelation('IVAN','PLAYER',{trust:-6,resentment:5},'Rekao si da nemaš vode. Istinitost još nije nužno provjerena.','claimed_no_water');
      return 'Rekao si da nemaš. Sistem pamti tvrdnju odvojeno od stvarnog stanja.';
    }
  }
};

function startAction(id) {
  if (state.ended || state.minute < state.availableAt || state.activeTask) return;
  const def = actions[id];
  if (!def || !def.available()) return;

  const duration = def.duration();
  state.activeTask = { id, total: duration, remaining: duration, startedAt: state.minute };
  log('task_start', 'PLAYER', id, `Started ${def.label}; planned ${duration} min.`, ['task', def.social ? 'social' : 'practical']);
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

function relationSummary(from, to) {
  const r = getRelation(from, to);
  const strongest = [
    ['povjerenje', r.trust],
    ['obveza', r.obligation],
    ['zamjeranje', r.resentment],
    ['ovisnost', r.dependency],
    ['strah', r.fear]
  ].sort((a,b) => b[1]-a[1])[0];
  return `${PEOPLE[from].name} → ${PEOPLE[to].name}: najjače je ${strongest[0]} (${strongest[1]}).`;
}

function verdict() {
  const r = state.resources;
  const ivan = getRelation('IVAN','PLAYER');

  if (state.facts.neighborChoice === 'lie' && state.flags.ivanKnowsWater) {
    return [
      'SAČUVAO SI VODU. POTROŠIO SI ČINJENICU.',
      'Ivan nije morao dobiti tvoju vodu. Ali nakon laži više ne dijelite istu verziju onoga što se dogodilo. Zaliha je ostala privatna; nepovjerenje nije.'
    ];
  }

  if (state.facts.promiseWater > 0) {
    return [
      'OBEĆANJE JE VEĆ POTROŠENA ZALIHA.',
      'Na polici još vidiš vodu koju si nekome obećao. Sistem zato ne smatra cijeli inventory raspoloživim. Dug je nastao prije transfera.'
    ];
  }

  if (state.facts.neighborChoice === 'give' || state.facts.neighborChoice === 'fulfilled') {
    return [
      'POMOĆ NIJE NAGRADA. TO JE NOVA POVIJEST.',
      `Ivanovo povjerenje sada je ${ivan.trust}, a njegova obveza prema tebi ${ivan.obligation}. Brojevi služe simulaciji; smisao je u događajima koji ih mogu objasniti.`
    ];
  }

  if (r.water < 3) {
    return [
      'VJEROVAO SI DA ĆE VODA OSTATI.',
      'Najskuplja odluka bila je ona koja je izgledala kao čekanje. Društveni odnosi nisu ukinuli fiziku; samo su odlučili tko nosi posljedicu.'
    ];
  }

  if (!state.facts.calledMother) {
    return [
      'STAN JE SPREMAN. ODNOS NIJE.',
      'Prikupio si stvari, ali nisi na vrijeme prikupio čovjeka u obliku informacije. Neke obveze nemaju masu, ali svejedno zauzimaju vrijeme.'
    ];
  }

  return [
    'NITKO TI NE DUGUJE "BODOVE".',
    'Iza svakog odnosa ostao je zapis: poruka, obećanje, odbijanje, transfer ili šutnja. To je početak društvene simulacije.'
  ];
}

function finishRun() {
  if (state.ended) return;
  state.ended = true;
  clearInterval(timer);

  if (state.activeTask) {
    log('task_interrupted', 'SYSTEM', state.activeTask.id, 'Preparation window closed before task completion.', ['task','deadline']);
    state.activeTask = null;
  }

  if (state.facts.promiseWater > 0) {
    applyRelation('IVAN','PLAYER',{trust:-10,resentment:12},'Dan je završio s neispunjenim obećanjem.','promise_unfulfilled_end');
    applyRelation('PLAYER','IVAN',{obligation:5},'Neispunjena obveza prenosi se dalje od prozora pripreme.','promise_unfulfilled_end');
  }

  const [title,text] = verdict();
  log('run_end','SYSTEM','deadline',title,['ending']);

  const snapshot = {
    build: BUILD,
    endedAt: fmt(state.minute),
    resources: state.resources,
    facts: state.facts,
    relations: state.relations,
    log: state.log
  };
  localStorage.setItem('balkan-survival:last-run', JSON.stringify(snapshot));

  $('#endingTitle').textContent = title;
  $('#endingText').textContent = text;
  $('#endingStats').innerHTML = Object.entries(state.resources)
    .map(([k,v]) => `<span>${k.toUpperCase()}: <b>${v}</b></span>`)
    .join('');

  $('#endingRelations').innerHTML = [
    ['IVAN','PLAYER'],
    ['PLAYER','IVAN'],
    ['MAMA','PLAYER'],
    ['PLAYER','MAMA']
  ].map(([from,to]) => `<article><strong>${PEOPLE[from].name} → ${PEOPLE[to].name}</strong><br><small>${relationSummary(from,to)}</small></article>`).join('');

  $('#ending').hidden = false;
}

function renderActions() {
  const locked = state.minute < state.availableAt;
  $('#actions').innerHTML = Object.entries(actions).map(([id,def]) => {
    const d = def.duration();
    const disabled = locked || !!state.activeTask || !def.available() || state.ended;
    return `<button class="action ${def.social?'social':''}" data-action="${id}" ${disabled?'disabled':''}><b>${def.label}</b><em>${d} MIN</em><small>${def.detail}</small></button>`;
  }).join('');

  document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => startAction(b.dataset.action)));
}

function renderResources() {
  const labels = {
    water:'VODA / L',
    food:'HRANA',
    medicine:'LIJEKOVI',
    documents:'DOKUMENTI',
    information:'INFORMACIJE',
    money:'NOVAC / €'
  };

  $('#resources').innerHTML = Object.entries(state.resources)
    .map(([k,v]) => `<div class="resource"><span>${labels[k]}</span><b>${v}</b></div>`)
    .join('');
}

function renderFeed() {
  $('#feed').innerHTML = state.feed.length
    ? state.feed.map(x => `<article class="entry"><time>${x.at}</time><strong>${x.source} · ${x.title}</strong><p>${x.body}</p></article>`).join('')
    : '<p class="entry">Grad još nije rekao ništa. To ne znači da se ništa ne događa.</p>';
}

function renderLog() {
  const rows = state.log.slice().reverse().slice(0,16);
  $('#runlog').innerHTML = rows.length
    ? rows.map(x => `<article class="entry"><time>${x.at}</time><strong>${x.type}</strong><p>${x.action} → ${x.consequence}</p></article>`).join('')
    : '<p class="entry">Nema zapisa.</p>';
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

function metricLabel(k) {
  return {
    trust:'POVJERENJE',
    obligation:'OBVEZA',
    resentment:'ZAMJERANJE',
    dependency:'OVISNOST',
    fear:'STRAH'
  }[k];
}

function renderRelations() {
  const visible = [
    ['IVAN','PLAYER'],
    ['PLAYER','IVAN'],
    ['MAMA','PLAYER'],
    ['PLAYER','MAMA'],
    ['PLAYER','BAKA']
  ];

  $('#relations').innerHTML = visible.map(([from,to]) => {
    const key = relationKey(from,to);
    const r = getRelation(from,to);
    const metrics = ['trust','obligation','resentment','dependency','fear']
      .map(k => `<div class="metric"><span>${metricLabel(k)}</span><b>${r[k]}</b></div>`)
      .join('');

    return `<button class="relation-card ${state.selectedRelation===key?'active':''}" data-relation="${key}">
      <header><strong>${PEOPLE[from].name} → ${PEOPLE[to].name}</strong><small>${r.history.length} zapisa</small></header>
      <div class="metrics">${metrics}</div>
    </button>`;
  }).join('');

  document.querySelectorAll('[data-relation]').forEach(b => {
    b.addEventListener('click', () => {
      state.selectedRelation = b.dataset.relation;
      renderRelations();
      renderRelationHistory();
    });
  });
}

function formatDelta(deltas) {
  const parts = Object.entries(deltas).map(([k,v]) => {
    const cls = v > 0 ? 'positive' : v < 0 ? 'negative' : '';
    return `<span class="delta ${cls}">${metricLabel(k)} ${v>0?'+':''}${v}</span>`;
  });
  return parts.length ? parts.join(' · ') : '<span class="delta">bez numeričke promjene</span>';
}

function renderRelationHistory() {
  const key = state.selectedRelation;
  const [from,to] = key.split('>');
  const r = getRelation(from,to);
  const target = $('#relationHistory');

  if (!r.history.length) {
    target.innerHTML = `<p><strong>${PEOPLE[from].name} → ${PEOPLE[to].name}</strong><br>Još nema događaja. Početno stanje je kontekst, ne presuda.</p>`;
    return;
  }

  target.innerHTML = `<p><strong>${PEOPLE[from].name} → ${PEOPLE[to].name}</strong></p>` +
    r.history.map(h => `<article class="ledger-row">
      <time>${h.at}</time>
      <strong>${h.code}</strong>
      <small>${h.reason}</small>
      <small>${formatDelta(h.deltas)}</small>
    </article>`).join('');
}

function render() {
  $('#clock').textContent = fmt(state.minute);
  const atWork = state.minute < state.availableAt;
  $('#availability').textContent = atWork ? `NA POSLU DO ${fmt(state.availableAt)}` : state.ended ? 'ZATVORENO' : 'DOSTUPAN';
  $('#worldState').textContent = `voda:${state.flags.water} · trgovina:${state.flags.store} · mreža:${state.flags.network}`;

  renderActions();
  renderResources();
  renderFeed();
  renderTask();
  renderRelations();
  renderRelationHistory();
  renderLog();
}

function exportLog() {
  const payload = {
    build: BUILD,
    exportedAt: new Date().toISOString(),
    state: {
      minute: state.minute,
      resources: state.resources,
      facts: state.facts,
      relations: state.relations
    },
    log: state.log
  };

  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `balkan-survival-${BUILD}-run.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restart() {
  clearInterval(timer);
  state = initialState();
  $('#ending').hidden = true;
  log('run_start','SYSTEM','start','Build 0.0.2 started.',['run']);
  render();
  timer = setInterval(tick, TICK_MS);
}

$('#cancelTask').addEventListener('click', cancelAction);
$('#exportLog').addEventListener('click', exportLog);
$('#restart').addEventListener('click', restart);

restart();
