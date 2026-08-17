'use strict';
function installEvents() {
  document.addEventListener('pointerdown', e => {
    pulseAt(e.clientX, e.clientY);
    if (e.target.closest('button, .file-button, .graph-node, .case-chip, .module-row')) sound('click');
  }, { passive: true });

  refs.sourceInput.addEventListener('change', async () => {
    const file = refs.sourceInput.files?.[0]; if (!file) return;
    loadSource(file.name, await readFile(file));
    refs.sourceStatus.textContent = 'LOCAL EVIDENCE';
  });
  refs.klInput.addEventListener('change', async () => {
    const file = refs.klInput.files?.[0]; if (!file) return;
    state.lesson = parseKL(await readFile(file)); state.stepIndex = 0; refreshAnalysis(); refs.sourceStatus.textContent = 'LOCAL SOURCE + KL';
  });
  refs.analyzePaste.addEventListener('click', () => {
    const text = refs.documentPaste.value.trim(); if (!text) return;
    state.lesson = { version:1, title:'Document Atlas', target:'pasted document', steps:[{ id:'index', title:'Map the document before interpreting it', focus:[], concepts:[], say:'The graph shows statistically important terms and repeated sentence-level connections. Click a node to retrieve exact supporting sentences before making an interpretation.', why:'Retrieval and interpretation are separate epistemic steps. First prove what the document repeatedly connects; only then decide what the connection means.', pet:'Frequency is not meaning. It is triage.', theme:'sterile' }] };
    loadSource('pasted-analysis.md', text, { documentMode:true }); refs.sourceStatus.textContent = 'LOCAL DOCUMENT INDEX';
  });
  refs.prevStep.addEventListener('click', () => { if (state.stepIndex > 0) { state.stepIndex--; renderStep(); sound('next'); } });
  refs.nextStep.addEventListener('click', () => { if (state.stepIndex < state.lesson.steps.length - 1) { state.stepIndex++; renderStep(); sound('next'); } });
  refs.clearButton.addEventListener('click', () => recordFeedback(true)); refs.unclearButton.addEventListener('click', () => recordFeedback(false));
  refs.revealAnswer.addEventListener('click', () => { const hidden=refs.checkAnswer.hidden; refs.checkAnswer.hidden=!hidden; refs.revealAnswer.textContent=hidden?'HIDE ANSWER':'REVEAL ANSWER'; });
  refs.soundToggle.addEventListener('click', () => { state.sound=!state.sound; refs.soundToggle.textContent=`SOUND: ${state.sound?'ON':'OFF'}`; if(state.sound)sound('clear'); });
  refs.themeButton.addEventListener('click', () => { const themes=['sterile','blue','red','black','acid']; const current=themes.indexOf(document.body.dataset.theme||'sterile'); document.body.dataset.theme=themes[(current+1)%themes.length]; });
  refs.resetMemory.addEventListener('click', () => {
    if (!confirm('Delete source/concept learning memory stored in this browser? Project-course progress is separate. Source files are never stored.')) return;
    localStorage.removeItem('klAtlasMemory.v1'); state.memory={ concepts:{}, strategies:{}, sessions:0 }; saveMemory(); refs.conceptTitle.textContent='Source memory cleared'; refs.conceptExplanation.textContent='The next source explanation strategy starts from a neutral prior. Reconstruction-course diagnostic and proofs were not changed.'; refs.evidenceStack.innerHTML=''; refs.memoryStats.innerHTML='';
  });
}
function boot() {
  state.lesson=parseKL(SAMPLE_KL); state.memory.sessions=(state.memory.sessions||0)+1; saveMemory(); installEvents(); refreshAnalysis(); refs.sourceStatus.textContent='SAMPLE / ANNEX X'; refs.footerStatus.textContent='LOCAL-FIRST · PRIVATE SOURCE NOT BUNDLED'; if(typeof bootCurriculum==='function')bootCurriculum();
}
boot();
