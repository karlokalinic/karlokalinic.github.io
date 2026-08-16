(() => {
  'use strict';
  const POLISH_BUILD='0.1.1';
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];

  Object.entries(CHARACTERS).forEach(([id,ch])=>{ch.image=`../0.1.0/assets/${id}.webp`;});

  const AudioEngine={
    ctx:null,master:null,ambience:null,noiseBuffer:null,muted:localStorage.getItem('slegnuce:mute')==='1',lastUi:0,
    unlock(){
      if(!this.ctx){
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC)return false;
        this.ctx=new AC();
        this.master=this.ctx.createGain(); this.master.gain.value=this.muted?0:.72; this.master.connect(this.ctx.destination);
        this.ambience=this.ctx.createGain(); this.ambience.gain.value=.22; this.ambience.connect(this.master);
        this.noiseBuffer=this.makeNoiseBuffer(); this.startAmbience();
      }
      if(this.ctx.state==='suspended')this.ctx.resume();
      return true;
    },
    makeNoiseBuffer(){const b=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.7;return b;},
    tone(freq=440,dur=.08,type='sine',gain=.04,slide=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+.02);},
    noise(dur=.12,gain=.025,freq=1600){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime,s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noiseBuffer;f.type='bandpass';f.frequency.value=freq;f.Q.value=.7;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f).connect(g).connect(this.master);s.start(t);s.stop(t+dur+.03);},
    startAmbience(){const o=this.ctx.createOscillator(),g=this.ctx.createGain(),n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),ng=this.ctx.createGain();o.type='sine';o.frequency.value=49;g.gain.value=.012;o.connect(g).connect(this.ambience);o.start();n.buffer=this.noiseBuffer;n.loop=true;f.type='lowpass';f.frequency.value=360;ng.gain.value=.013;n.connect(f).connect(ng).connect(this.ambience);n.start();this.hum=o;this.humGain=g;},
    ui(){const now=performance.now();if(now-this.lastUi<70)return;this.lastUi=now;this.tone(720,.035,'square',.012,-80);},
    decision(){this.tone(155,.11,'triangle',.05,55);setTimeout(()=>this.tone(235,.07,'sine',.025,35),65);},
    next(){this.tone(420,.05,'sine',.025,90);},
    knock(){this.tone(92,.055,'sine',.12,-18);setTimeout(()=>this.tone(82,.06,'sine',.1,-15),105);},
    paper(){this.noise(.26,.04,2100);setTimeout(()=>this.noise(.16,.022,3100),90);},
    radio(){this.noise(.38,.036,2900);setTimeout(()=>this.tone(960,.07,'square',.012,-300),95);},
    blackout(){this.tone(61,.24,'sawtooth',.03,-35);if(this.humGain)this.humGain.gain.setTargetAtTime(.002,this.ctx.currentTime,.15);},
    siren(){if(!this.ctx||this.muted)return;[0,.38,.76].forEach(dt=>setTimeout(()=>{this.tone(540,.3,'sine',.035,210);setTimeout(()=>this.tone(750,.28,'sine',.028,-190),260);},dt*1000));},
    end(){this.tone(110,.42,'sine',.045,-45);setTimeout(()=>this.tone(165,.5,'triangle',.025,-55),240);},
    setMute(v){this.muted=v;localStorage.setItem('slegnuce:mute',v?'1':'0');if(this.master)this.master.gain.setTargetAtTime(v?0:.72,this.ctx.currentTime,.04);updateAudioButton();}
  };

  const dock=document.createElement('div');dock.className='utility-dock';dock.innerHTML='<button id="tutorialBtn">TUTORIAL</button><button id="audioBtn">AUDIO</button>';document.body.appendChild(dock);
  const pop=document.createElement('aside');pop.id='tutorialPopover';pop.className='tutorial-popover';pop.hidden=true;pop.innerHTML='<div id="tutorialStep" class="tutorial-step"></div><h3 id="tutorialTitle"></h3><p id="tutorialBody"></p><div class="tutorial-actions"><button id="tutorialSkip">ZATVORI</button><div><button id="tutorialBack">←</button><button id="tutorialNext" class="tutorial-next">DALJE →</button></div></div>';document.body.appendChild(pop);

  const TUTORIAL=[
    {target:'.topbar',title:'Ovo je stanje, ne score.',body:'Voda, hrana, lijekovi, informacije, sklonište i stres prenose posljedicu iz scene u scenu. Nema automatskog resetiranja nakon dobrog izbora.'},
    {target:'.cast-panel',title:'Lik je mogućnost.',body:'Opcija vezana uz Miru, Davora, Enu ili Ivana postoji samo ako je ta osoba stvarno dostupna. Roster mijenja pravila runa, ne samo tekst.'},
    {target:'.ledger',title:'Token nije samo novac.',body:'PRUD, TLAK, MOSTARINA, ZAVODNI BON i BILJEG predstavljaju različite vrste pristupa: raspodjelu, pritisak, prolaz, rad i uzajamnost.'},
    {target:'.event-card',title:'Jedan događaj. Jedna odluka.',body:'Čitaj izvor, situaciju i cijenu. Neke opcije nestaju jer nemaš resurs; druge jer nema osobe koja ih može provesti.'},
    {target:'#choices',title:'Izbor troši nešto konkretno.',body:'Klikom zaključavaš odluku. Posljedica se odmah upisuje u resurse, odnose i Run Log. Tutorial ne govori koja je odluka “ispravna”.'},
    {target:'#log',title:'Igra mora moći objasniti samu sebe.',body:'Run Log čuva slijed uzroka. Kasnije će isti zapis hraniti ending, statistiku i Unity/WebGL replay/debug sloj.'}
  ];
  let tutorialIndex=0,focusEl=null;
  function clearFocus(){if(focusEl)focusEl.classList.remove('tutorial-focus');focusEl=null;}
  function showTutorial(index=0){tutorialIndex=Math.max(0,Math.min(TUTORIAL.length-1,index));pop.hidden=false;renderTutorial();}
  function renderTutorial(){clearFocus();const s=TUTORIAL[tutorialIndex];q('#tutorialStep').textContent=`TUTORIAL ${tutorialIndex+1} / ${TUTORIAL.length}`;q('#tutorialTitle').textContent=s.title;q('#tutorialBody').textContent=s.body;q('#tutorialBack').disabled=tutorialIndex===0;q('#tutorialNext').textContent=tutorialIndex===TUTORIAL.length-1?'GOTOVO':'DALJE →';focusEl=q(s.target);if(focusEl){focusEl.classList.add('tutorial-focus');focusEl.scrollIntoView({behavior:'smooth',block:'center'});}AudioEngine.ui();}
  function closeTutorial(done=false){clearFocus();pop.hidden=true;if(done)localStorage.setItem('slegnuce:tutorial','done');}
  q('#tutorialBtn').onclick=()=>showTutorial(0);q('#introTutorialBtn').onclick=()=>{if(q('#game').hidden){AudioEngine.unlock();originalStartGame();afterStart(false);}showTutorial(0);};q('#tutorialSkip').onclick=()=>closeTutorial(false);q('#tutorialBack').onclick=()=>showTutorial(tutorialIndex-1);q('#tutorialNext').onclick=()=>{if(tutorialIndex>=TUTORIAL.length-1)closeTutorial(true);else showTutorial(tutorialIndex+1);};

  function updateAudioButton(){const b=q('#audioBtn');b.textContent=AudioEngine.muted?'AUDIO OFF':'AUDIO ON';b.classList.toggle('active',!AudioEngine.muted);}
  q('#audioBtn').onclick=()=>{AudioEngine.unlock();AudioEngine.setMute(!AudioEngine.muted);AudioEngine.ui();};updateAudioButton();

  document.addEventListener('pointerover',e=>{if(e.target.closest('button,.character-card'))AudioEngine.ui();},{passive:true});

  const prevValues=new Map();
  function animateValues(){qa('.resource strong,.token strong').forEach(el=>{const key=el.closest('.resource,.token')?.textContent?.trim().split(/\s+/)[0]+':'+el.parentElement?.className;const val=el.textContent;if(prevValues.has(key)&&prevValues.get(key)!==val){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}prevValues.set(key,val);});}
  function sceneMood(){const room=q('.room-stage');if(!room)return;room.classList.remove('state-blackout','state-radio','state-siren');const src=q('#eventSource')?.textContent||'';if(src.includes('RADIO'))room.classList.add('state-radio');if(src.includes('HEP'))room.classList.add('state-blackout');if(src.includes('SIRENA'))room.classList.add('state-siren');const card=q('.event-card');if(card){card.classList.remove('event-enter');void card.offsetWidth;card.classList.add('event-enter');}qa('.choice').forEach((el,i)=>{el.classList.add('choice-enter');el.style.animationDelay=`${Math.min(i*55,220)}ms`;});if(src.includes('HODNIK'))AudioEngine.knock();else if(src.includes('RADIO'))AudioEngine.radio();else if(src.includes('HEP'))AudioEngine.blackout();else if(src.includes('OPĆINSKI')){AudioEngine.paper();q('.papers')?.classList.add('paper-rustle');}else if(src.includes('SIRENA'))AudioEngine.siren();}

  const originalStartGame=startGame,originalEvent=event,originalChoose=choose,originalAdvance=advance,originalFinish=finish,originalPayload=payload;
  function afterStart(autoTutorial=true){q('#seedLabel').textContent=`RUN ${state.seed} · ${POLISH_BUILD}`;AudioEngine.decision();sceneMood();animateValues();if(autoTutorial&&localStorage.getItem('slegnuce:tutorial')!=='done')setTimeout(()=>showTutorial(0),350);else setTimeout(()=>q('.choice:not(:disabled)')?.classList.add('tutorial-hint'),450);}
  startGame=function(){AudioEngine.unlock();originalStartGame();afterStart(true);};
  event=function(){originalEvent();sceneMood();animateValues();};
  choose=function(c){AudioEngine.unlock();AudioEngine.decision();qa('.choice').forEach(x=>x.classList.remove('tutorial-hint'));originalChoose(c);animateValues();};
  advance=function(){AudioEngine.next();originalAdvance();animateValues();};
  finish=function(){originalFinish();AudioEngine.end();q('.ending .kicker').textContent='RUN ZATVOREN · 23:40 · BUILD 0.1.1';};
  payload=function(){const p=originalPayload();p.build=POLISH_BUILD;p.audioMuted=AudioEngine.muted;p.tutorialCompleted=localStorage.getItem('slegnuce:tutorial')==='done';return p;};

  q('#startBtn').onclick=startGame;q('#restartBtn').onclick=startGame;q('#continueBtn').onclick=advance;q('#loreToggle').onclick=()=>{AudioEngine.ui();q('#lorePanel').hidden=!q('#lorePanel').hidden;};
  q('.intro .kicker').textContent='BALKAN SURVIVAL · BUILD 0.1.1';
  q('#startBtn').textContent='POKRENI NOVI RUN · AUDIO READY';
})();
