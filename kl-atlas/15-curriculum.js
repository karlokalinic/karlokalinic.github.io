'use strict';

const CURRICULUM_MEMORY_KEY = 'klAtlasCurriculum.v2';
const MECHANICS = [
  ['predict', 'PREDICT', 'Before opening more evidence: what input/state enters this module and what observable state should leave it?'],
  ['remove', 'REMOVE IT', 'Pretend this entire module is deleted. Name the first downstream system that should fail and how that failure would look.'],
  ['teach', 'TEACH BACK', 'Explain why this module appears at this exact reconstruction position instead of three steps earlier or later.'],
  ['prove', 'PROVE IT', 'Write the concrete editor/runtime/build observation that would convince you this module works. No adjectives; only observable evidence.']
];

function getCurriculumMemory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CURRICULUM_MEMORY_KEY) || 'null');
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  return { projectId: 'pauktunel', diagnostic: {}, modules: {}, selectedModule: 'contract', sessions: 0 };
}
const curriculum = getCurriculumMemory();
function saveCurriculum() { localStorage.setItem(CURRICULUM_MEMORY_KEY, JSON.stringify(curriculum)); }
function curriculumEl(id) { return document.getElementById(id); }
function activeProject() { return STARTER_PROJECTS[curriculum.projectId] || STARTER_PROJECTS.pauktunel; }
function activeModules() { return activeProject().modules || []; }
function diagnosticLevel(domain) { const v = Number(curriculum.diagnostic?.[domain] ?? 0); return Number.isFinite(v) ? Math.max(0, Math.min(4, v)) : 0; }
function domainMasteryForModule(module) { return module?.domains?.length ? module.domains.reduce((s, d) => s + diagnosticLevel(d), 0) / module.domains.length : 0; }

function reconstructionImportance(module) {
  const m = module.metrics || {};
  const learnerMasteryGap = 1 - domainMasteryForModule(module) / 4;
  const score = 100 * (.30*(m.downstream??.5) + .20*(m.bootstrap??.5) + .15*(m.bridge??.5) + .15*(m.depth??.5) + .10*(m.salience??.5) + .10*learnerMasteryGap);
  return Math.round(Math.max(0, Math.min(100, score)));
}
function importanceClass(score) { return score >= 86 ? 'CRITICAL' : score >= 72 ? 'HIGH' : score >= 55 ? 'STRUCTURAL' : 'SUPPORT'; }
function moduleRecord(id) { curriculum.modules ||= {}; return curriculum.modules[id] ||= { complete:false, attempts:0, mechanics:{}, openedEvidence:[], lastTouched:0 }; }
function dependencySatisfied(module) { return (module.prereqs || []).every(id => moduleRecord(id).complete); }
function moduleStatus(module) { const r=moduleRecord(module.id); return r.complete?'COMPLETE':!dependencySatisfied(module)?'LOCKED':curriculum.selectedModule===module.id?'ACTIVE':'OPEN'; }
function completionRatio() { const m=activeModules(); return m.length ? m.filter(x=>moduleRecord(x.id).complete).length/m.length : 0; }

function renderProjectSelector() {
  const select=curriculumEl('starterProject'); if(!select)return;
  select.innerHTML=Object.values(STARTER_PROJECTS).map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.label)} — ${escapeHtml(p.status)}</option>`).join('');
  select.value=curriculum.projectId;
  const p=activeProject();
  curriculumEl('projectStatus').textContent=p.status; curriculumEl('projectSummary').textContent=p.summary; curriculumEl('projectSourcePolicy').textContent=p.sourcePolicy;
  curriculumEl('projectFacts').innerHTML=p.facts.map(f=>`<li>${escapeHtml(f)}</li>`).join('');
  curriculumEl('projectRepo').textContent=p.repo; curriculumEl('projectRef').textContent=p.ref; curriculumEl('projectEngine').textContent=p.engine; curriculumEl('projectTarget').textContent=p.target;
}

function renderDiagnostic() {
  const grid=curriculumEl('diagnosticGrid'); if(!grid)return;
  grid.innerHTML=BASELINE_DOMAINS.map(([id,label])=>{ const current=diagnosticLevel(id); const levels=[0,1,2,3,4].map(level=>`<button type="button" class="diag-level${current===level?' active':''}" data-domain="${id}" data-level="${level}" title="${['NONE','SEEN','CAN EXPLAIN','CAN BUILD','CAN DEBUG'][level]}">${level}</button>`).join(''); return `<div class="diag-row"><span class="diag-label">${escapeHtml(label)}</span><div class="diag-scale">${levels}</div></div>`; }).join('');
  grid.querySelectorAll('.diag-level').forEach(b=>b.addEventListener('click',()=>{ curriculum.diagnostic[b.dataset.domain]=Number(b.dataset.level); saveCurriculum(); renderDiagnostic(); renderModuleLedger(); renderModuleCase(); renderCurriculumProgress(); }));
  const levels=BASELINE_DOMAINS.map(([id])=>diagnosticLevel(id)); const avg=levels.reduce((a,b)=>a+b,0)/Math.max(1,levels.length); curriculumEl('diagnosticReadout').textContent=`${avg.toFixed(1)} / 4 AVG · 0 NONE · 4 DEBUG`;
}

function renderModuleLedger() {
  const ledger=curriculumEl('moduleLedger'); if(!ledger)return;
  ledger.innerHTML=activeModules().map(module=>{ const status=moduleStatus(module), importance=reconstructionImportance(module), cls=importanceClass(importance), mech=Object.values(moduleRecord(module.id).mechanics||{}).filter(Boolean).length; return `<button type="button" class="module-row status-${status.toLowerCase()}${curriculum.selectedModule===module.id?' selected':''}" data-module="${module.id}"><span class="module-order">${String(module.order).padStart(2,'0')}</span><span class="module-name">${escapeHtml(module.title)}</span><span class="module-importance" data-class="${cls}">${importance}</span><span class="module-state">${status}</span><span class="module-mech">${mech}/4</span></button>`; }).join('');
  ledger.querySelectorAll('.module-row').forEach(b=>b.addEventListener('click',()=>selectCurriculumModule(b.dataset.module)));
}
function relatedTip(module) { const bank=TIP_BANK[module.tip]||TIP_BANK.foundation; return bank[stableHash(`${activeProject().id}:${module.id}`)%bank.length]; }
function listHtml(items, empty='NONE') { return (items?.length?items:[empty]).map(x=>`<li>${escapeHtml(x)}</li>`).join(''); }
function chips(items) { return (items||[]).map(x=>`<button type="button" class="case-chip" data-concept="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(''); }

function renderModuleCase() {
  const modules=activeModules(); let module=modules.find(m=>m.id===curriculum.selectedModule); if(!module){ module=modules[0]; if(!module)return; curriculum.selectedModule=module.id; }
  const record=moduleRecord(module.id), importance=reconstructionImportance(module), cls=importanceClass(importance), status=moduleStatus(module), mastery=domainMasteryForModule(module);
  curriculumEl('moduleOrdinal').textContent=`FORM ${String(module.order).padStart(2,'0')} / ${String(Math.max(0,modules.length-1)).padStart(2,'0')}`;
  curriculumEl('moduleStatus').textContent=status; curriculumEl('moduleClass').textContent=cls; curriculumEl('moduleWeight').textContent=`${importance} / 100 PRIORITY`; curriculumEl('moduleTitle').textContent=module.title;
  curriculumEl('moduleThesis').textContent=module.thesis; curriculumEl('moduleWhy').textContent=module.why; curriculumEl('moduleBreaks').textContent=module.breaks;
  curriculumEl('modulePrereqs').innerHTML=listHtml(module.prereqs?.map(id=>modules.find(m=>m.id===id)?.title||id),'NO PREREQUISITE');
  curriculumEl('moduleUnlocks').innerHTML=listHtml(module.unlocks?.map(id=>modules.find(m=>m.id===id)?.title||id),'TERMINAL MODULE');
  curriculumEl('moduleEvidence').innerHTML=module.evidence.map(path=>{ const opened=record.openedEvidence?.some(e=>e.path===path||path.endsWith(e.name)); return `<li class="${opened?'evidence-opened':''}"><code>${escapeHtml(path)}</code><span>${opened?'OPENED':'EXPECTED'}</span></li>`; }).join('');
  curriculumEl('moduleTasks').innerHTML=module.tasks.map((task,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${escapeHtml(task)}</li>`).join(''); curriculumEl('moduleTest').textContent=module.doneWhen;
  curriculumEl('moduleAttempts').textContent=`${record.attempts||0} ATTEMPTS · ${Object.values(record.mechanics||{}).filter(Boolean).length}/4 MECHANICS`;
  curriculumEl('moduleTip').textContent=relatedTip(module); curriculumEl('moduleCaveat').textContent=module.caveat||'EVIDENCE STATUS: VERIFIED PATHS / AUTHORED RECONSTRUCTION ORDER. Open local files to inspect exact implementation.'; curriculumEl('moduleCaveat').classList.toggle('warning',Boolean(module.caveat));
  curriculumEl('moduleConcepts').innerHTML=chips(module.concepts); curriculumEl('moduleMastery').textContent=`${mastery.toFixed(1)} / 4 DOMAIN BASELINE`;
  curriculumEl('moduleSourcePrompt').textContent=`OPEN PRIVATE/LOCAL EVIDENCE FOR ${module.title}. Nothing is uploaded by this static page.`;
  renderModuleMechanics(module,record);
  const blocked=curriculumEl('moduleBlocked'), done=curriculumEl('moduleDone'); blocked.hidden=dependencySatisfied(module)||record.complete; blocked.textContent=`LOCKED UNTIL: ${(module.prereqs||[]).filter(id=>!moduleRecord(id).complete).map(id=>modules.find(m=>m.id===id)?.title||id).join(' · ')}`;
  const mc=Object.values(record.mechanics||{}).filter(Boolean).length; done.disabled=!dependencySatisfied(module)||mc<3; done.textContent=record.complete?'REOPEN MODULE':mc<3?`COMPLETE 3 MECHANICS (${mc}/3)`:'MARK MODULE PROVEN';
  curriculumEl('caseFile').dataset.status=status.toLowerCase(); curriculumEl('caseFile').dataset.class=cls.toLowerCase();
  curriculumEl('moduleConcepts').querySelectorAll('.case-chip').forEach(b=>b.addEventListener('click',()=>{ const lab=curriculumEl('sourceXray'); if(lab)lab.open=true; selectConcept(b.dataset.concept); lab?.scrollIntoView({behavior:'smooth',block:'start'}); }));
}

function renderModuleMechanics(module,record) {
  const host=curriculumEl('moduleMechanics'); if(!host)return;
  host.innerHTML=MECHANICS.map(([id,label,prompt])=>{ const stored=record.mechanics?.[id]||''; return `<section class="mechanic-card${stored?' recorded':''}" data-mechanic="${id}"><header><span>${label}</span><b>${stored?'RECORDED':'OPEN'}</b></header><p>${escapeHtml(prompt)}</p><textarea rows="3" spellcheck="false" placeholder="Your model, not a polished answer.">${escapeHtml(stored)}</textarea><button type="button" class="mechanic-store">${stored?'UPDATE NOTE':'STORE NOTE'}</button></section>`; }).join('');
  host.querySelectorAll('.mechanic-card').forEach(card=>card.querySelector('.mechanic-store').addEventListener('click',()=>{ const value=card.querySelector('textarea').value.trim(); if(!value)return; record.mechanics ||= {}; record.mechanics[card.dataset.mechanic]=value; record.attempts=(record.attempts||0)+1; record.lastTouched=Date.now(); saveCurriculum(); sound('clear'); renderModuleCase(); renderModuleLedger(); renderCurriculumProgress(); }));
}

function renderCurriculumMap() {
  const svg=curriculumEl('curriculumGraph'); if(!svg)return; const modules=activeModules(), ns='http://www.w3.org/2000/svg'; while(svg.firstChild)svg.removeChild(svg.firstChild);
  const width=720,rowH=44,startY=30; svg.setAttribute('viewBox',`0 0 ${width} ${Math.max(150,startY*2+modules.length*rowH)}`); const positions=new Map(); modules.forEach((m,i)=>positions.set(m.id,{x:42+(i%2)*330,y:startY+i*rowH}));
  modules.forEach(m=>(m.prereqs||[]).forEach(p=>{ const a=positions.get(p),b=positions.get(m.id); if(!a||!b)return; const line=document.createElementNS(ns,'line'); line.setAttribute('x1',a.x+285);line.setAttribute('y1',a.y+15);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y+15);line.setAttribute('class','curriculum-edge');svg.appendChild(line); }));
  modules.forEach(m=>{ const p=positions.get(m.id),status=moduleStatus(m),g=document.createElementNS(ns,'g'); g.setAttribute('class',`curriculum-node ${status.toLowerCase()}${curriculum.selectedModule===m.id?' selected':''}`);g.setAttribute('transform',`translate(${p.x},${p.y})`);const r=document.createElementNS(ns,'rect');r.setAttribute('width','285');r.setAttribute('height','30');const t=document.createElementNS(ns,'text');t.setAttribute('x','8');t.setAttribute('y','19');t.textContent=`${String(m.order).padStart(2,'0')}  ${m.title}`;g.append(r,t);g.addEventListener('click',()=>selectCurriculumModule(m.id));svg.appendChild(g); });
}

function renderCurriculumProgress() {
  const ratio=completionRatio(), modules=activeModules(), complete=modules.filter(m=>moduleRecord(m.id).complete).length, bar=curriculumEl('curriculumProgress'); if(bar){bar.style.setProperty('--progress',`${Math.round(ratio*100)}%`);bar.dataset.label=`${complete}/${modules.length} PROVEN`;}
  const next=nextRecommendedModule(), out=curriculumEl('nextRecommendation'); if(out)out.textContent=next?`NEXT RECOMMENDED: ${String(next.order).padStart(2,'0')} ${next.title} · PRIORITY ${reconstructionImportance(next)}`:'COURSE ROUTE COMPLETE';
}
function selectCurriculumModule(id){if(!activeModules().some(m=>m.id===id))return;curriculum.selectedModule=id;moduleRecord(id).lastTouched=Date.now();saveCurriculum();renderModuleLedger();renderModuleCase();renderCurriculumMap();renderCurriculumProgress();}
function setStarterProject(id){if(!STARTER_PROJECTS[id])return;curriculum.projectId=id;curriculum.selectedModule=STARTER_PROJECTS[id].modules?.[0]?.id||'';curriculum.diagnostic={};curriculum.modules={};saveCurriculum();renderCurriculum();}
function nextRecommendedModule(){return activeModules().filter(m=>!moduleRecord(m.id).complete&&dependencySatisfied(m)).sort((a,b)=>reconstructionImportance(b)-reconstructionImportance(a)||a.order-b.order)[0]||null;}
function toggleModuleProof(){const m=activeModules().find(x=>x.id===curriculum.selectedModule);if(!m)return;const r=moduleRecord(m.id);if(!r.complete&&Object.values(r.mechanics||{}).filter(Boolean).length<3)return;r.complete=!r.complete;r.attempts=(r.attempts||0)+1;r.lastTouched=Date.now();saveCurriculum();sound(r.complete?'clear':'unclear');renderModuleLedger();renderModuleCase();renderCurriculumMap();renderCurriculumProgress();}

function installCurriculumEvents(){
  curriculumEl('starterProject')?.addEventListener('change',e=>setStarterProject(e.target.value));
  curriculumEl('beginCurriculum')?.addEventListener('click',()=>{const t=nextRecommendedModule()||activeModules()[0];if(t)selectCurriculumModule(t.id);curriculumEl('caseFile')?.scrollIntoView({behavior:'smooth',block:'start'});});
  curriculumEl('moduleDone')?.addEventListener('click',toggleModuleProof); curriculumEl('nextModule')?.addEventListener('click',()=>{const n=nextRecommendedModule();if(n)selectCurriculumModule(n.id);});
  curriculumEl('resetCurriculum')?.addEventListener('click',()=>{if(!confirm('Reset project-course diagnostic, module proofs and mechanic notes in this browser? Source-learning memory is separate.'))return;localStorage.removeItem(CURRICULUM_MEMORY_KEY);Object.assign(curriculum,{projectId:'pauktunel',diagnostic:{},modules:{},selectedModule:'contract',sessions:1});saveCurriculum();renderCurriculum();});
  curriculumEl('moduleSourceInput')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const m=activeModules().find(x=>x.id===curriculum.selectedModule);if(!m)return;const text=await readFile(file),r=moduleRecord(m.id),expected=m.evidence.find(path=>path.endsWith(file.name)||path.includes(file.name));r.openedEvidence ||= [];if(!r.openedEvidence.some(x=>x.name===file.name))r.openedEvidence.push({name:file.name,path:expected||file.name,openedAt:Date.now()});saveCurriculum();loadSource(file.name,text);refs.sourceStatus.textContent=expected?'LOCAL EVIDENCE · MATCHED':'LOCAL EVIDENCE';curriculumEl('sourceXray').open=true;renderModuleCase();curriculumEl('sourceXray').scrollIntoView({behavior:'smooth',block:'start'});});
}
function renderCurriculum(){renderProjectSelector();renderDiagnostic();renderModuleLedger();renderModuleCase();renderCurriculumMap();renderCurriculumProgress();}
function bootCurriculum(){curriculum.sessions=(curriculum.sessions||0)+1;saveCurriculum();renderCurriculum();installCurriculumEvents();}