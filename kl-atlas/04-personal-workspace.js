'use strict';
(() => {
  const root = document.getElementById('personalWorkspace');
  if (!root) return;
  root.dataset.engine = 'goal-engine';

  document.title = 'KL//ATLAS — Goal Engine';
  const eyebrow = document.querySelector('.pz-eyebrow');
  if (eyebrow) eyebrow.textContent = eyebrow.textContent.replace('KL//ATLAS 0.4', 'KL//ATLAS 0.5');

  if (!document.querySelector('link[data-kl-goal-engine]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '05-goal-engine.css';
    link.dataset.klGoalEngine = '1';
    document.head.appendChild(link);
  }

  const script = document.createElement('script');
  script.src = '05-goal-engine.js';
  script.dataset.klGoalEngine = '1';
  script.defer = true;
  script.addEventListener('load', () => {
    const remote = document.getElementById('fmRemote');
    if (!remote) return;
    const reopenRemoteCurrent = () => {
      if (remote.dataset.mode !== 'online') return;
      const current = document.querySelector('#fmChoices .fm-choice.current:not(:disabled)');
      if (current) current.click();
      observer.disconnect();
    };
    const observer = new MutationObserver(reopenRemoteCurrent);
    observer.observe(remote, { attributes: true, childList: true, characterData: true, subtree: true });
    reopenRemoteCurrent();
  });
  document.body.appendChild(script);
})();
