(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const dialogue = document.getElementById('dialogue');
  const choicesEl = document.getElementById('choices');
  const resultCard = document.getElementById('result');
  const resultText = document.getElementById('resultText');
  const ending = document.getElementById('ending');
  const endingText = document.getElementById('endingText');
  const endingFacts = document.getElementById('endingFacts');
  const hint = document.getElementById('hint');
  const worldPrompt = document.getElementById('worldPrompt');
  const debug = document.getElementById('debug');
  const debugText = document.getElementById('debugText');
  const help = document.getElementById('help');

  const STORAGE = 'slegnuce:browser-build-0.2.0';
  const BASE = { schema:'slegnuce.run/1-browser-mirror', build:'0.2.0', seed:'PRVI-REZ', scenarioIndex:0,
    water:7, food:6, medicine:1, information:1, shelter:2, stress:2,
    prud:2, tlak:1, mostarina:1, zavodniBon:1, biljeg:0,
    lied:false, neighborHelped:false, committed:false, completed:false, choiceId:'', result:'',
    miraActive:false, log:[] };
  let state = load() || fresh();
  let dpr = 1, W = 0, H = 0, t = 0, last = performance.now();
  const player = { x:-1.9, z:-1.35, tx:-1.9, tz:-1.35, speed:2.35, moving:false, pending:null };
  const ivan = { x:2.72, z:1.02 };
  const door = { x:3.55, z:2.12 };
  const pointer = { x:0, y:0, hover:null };
  let debugOpen = false;

  function fresh(){ const s = structuredClone(BASE); s.seed = Math.random().toString(36).slice(2,10).toUpperCase(); s.miraActive = hash(s.seed) % 3 !== 0; return s; }
  function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function load(){ try{ const raw=localStorage.getItem(STORAGE); if(!raw) return null; const s=JSON.parse(raw); return s && s.build==='0.2.0' ? s : null; }catch{return null;} }
  function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function reset(){ state=fresh(); save(); player.x=player.tx=-1.9; player.z=player.tz=-1.35; player.pending=null; dialogue.hidden=true; resultCard.hidden=true; ending.hidden=true; hint.classList.remove('fade'); }

  function resize(){ dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr); canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); }
  addEventListener('resize',resize); resize();

  function project(x,y,z){
    const scale=Math.min(W/11.2,H/7.2); const cx=W*0.51, base=H*0.72;
    const depth=(z+3.0)/6.0; const persp=1-depth*0.18;
    return { x:cx+(x*scale*persp)+(z*scale*0.19), y:base-(y*scale*persp)-(z*scale*0.44), s:scale*persp };
  }
  function poly(points,fill,stroke,lineWidth=1){ ctx.beginPath(); points.forEach((p,i)=>{const q=project(...p); i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)}); ctx.closePath(); if(fill){ctx.fillStyle=fill;ctx.fill()} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()} }
  function line(a,b,color,width=1){ const p=project(...a),q=project(...b); ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(); }
  function ellipseWorld(x,y,z,rx,ry,fill,alpha=1){ const p=project(x,y,z); ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*p.s,ry*p.s,0,0,Math.PI*2);ctx.fill();ctx.restore(); }
  function box(x,y,z,sx,sy,sz,top,front,side,stroke='#11120f66'){
    const x0=x-sx/2,x1=x+sx/2,y0=y,y1=y+sy,z0=z-sz/2,z1=z+sz/2;
    poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],top,stroke,.7);
    poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],front,stroke,.7);
    poly([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],side,stroke,.7);
  }
  function capsuleCharacter(c,isIvan=false){
    const phase=isIvan?1.7:0.2; const helped=isIvan&&state.neighborHelped;
    const stress=isIvan?0.25:state.stress/8; const bob=Math.sin(t*1.7+phase)*0.015*(1+stress);
    const lean=helped?-0.06:(isIvan?0.045:0.02*Math.sin(t*.6));
    ellipseWorld(c.x,0.025,c.z,.34,.11,'#050604',.5);
    const p=project(c.x,bob,c.z); const s=p.s;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(lean);
    const coat=isIvan?'#5b4037':'#4b5143', dark=isIvan?'#332720':'#30362d', skin='#9c806c';
    ctx.fillStyle=dark; ctx.beginPath();ctx.ellipse(-.13*s,-.25*s,.13*s,.30*s,-.1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(.13*s,-.25*s,.13*s,.30*s,.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=coat; ctx.beginPath();ctx.moveTo(-.29*s,-.45*s);ctx.quadraticCurveTo(-.33*s,-1.12*s,-.18*s,-1.45*s);ctx.quadraticCurveTo(0,-1.62*s,.2*s,-1.43*s);ctx.quadraticCurveTo(.36*s,-.98*s,.28*s,-.43*s);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#171914';ctx.lineWidth=Math.max(1,s*.018);ctx.stroke();
    ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(.02*s,-1.68*s,.18*s,.22*s,-.08,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2a241f';ctx.beginPath();ctx.ellipse(.01*s,-1.80*s,.19*s,.12*s,-.08,Math.PI,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#2a2924';ctx.lineWidth=s*.025;ctx.beginPath();ctx.moveTo(-.19*s,-1.02*s);ctx.lineTo((helped?-.38:-.45)*s,-.58*s);ctx.moveTo(.19*s,-1.01*s);ctx.lineTo((helped?.30:.47)*s,-.67*s);ctx.stroke();
    if(isIvan){ctx.fillStyle=helped?'#d2c283':'#c2b9a0';ctx.fillRect(-.12*s,-.72*s,.25*s,.11*s)}
    ctx.restore();
  }
  function bottle(x,z,visible=true){ if(!visible)return; ellipseWorld(x,1.12,z,.10,.035,'#1b2424',.35); box(x,1.12,z,.18,.52,.18,'#628087aa','#47656aaa','#36535aaa'); box(x,1.64,z,.09,.10,.09,'#6f7468','#52594e','#3b423a'); }
  function cup(x,z,visible){ if(!visible)return; box(x,1.10,z,.20,.18,.20,'#b0a98e','#716c5c','#5d594d'); }
  function drawRoom(){
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#111510');grad.addColorStop(.58,'#1b1d18');grad.addColorStop(1,'#090a08');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    poly([[-4.7,0,-2.8],[4.7,0,-2.8],[4.7,0,2.8],[-4.7,0,2.8]],'#484438','#171914aa');
    for(let i=-4;i<=4;i++) line([i,0,-2.8],[i,0,2.8],'#191a1640',.65);
    for(let z=-2;z<=2;z++) line([-4.7,0,z],[4.7,0,z],'#18191432',.65);
    poly([[-4.7,0,2.8],[4.7,0,2.8],[4.7,3.0,2.8],[-4.7,3.0,2.8]],'#6f6b59','#17191488');
    poly([[-4.7,0,-2.8],[-4.7,0,2.8],[-4.7,3.0,2.8],[-4.7,3.0,-2.8]],'#404940','#17191499');
    box(-1.9,1.15,2.74,2.2,1.25,.05,'#152023','#182226','#101719');
    const wp=project(-1.9,1.4,2.70);ctx.save();ctx.globalAlpha=.17;const glow=ctx.createRadialGradient(wp.x,wp.y,4,wp.x,wp.y,wp.s*3);glow.addColorStop(0,'#a8c8d4');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);ctx.restore();
    box(-3.15,.0,1.82,2.25,1.08,.9,'#615e4e','#4c4a40','#383a32');
    box(-3.52,1.08,1.76,.60,.36,.30,'#43453e','#292b27','#1f211e');
    box(.05,.0,-.10,2.15,1.02,1.20,'#59432e','#3e3024','#2f251d');
    bottle(-.42,-.08,true); bottle(.00,-.08,state.water>=7); cup(.42,-.08,state.neighborHelped);
    const warm=state.neighborHelped?'#cdb276':'#9f895f'; ellipseWorld(.38,2.42,.18,.20,.12,warm,.9); const lp=project(.38,2.25,.18);ctx.save();ctx.globalAlpha=.12+Math.max(0,4-state.stress)*.018;const lg=ctx.createRadialGradient(lp.x,lp.y,3,lp.x,lp.y,lp.s*2.9);lg.addColorStop(0,'#f1c66f');lg.addColorStop(1,'transparent');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);ctx.restore();
    box(3.72,0,2.69,1.32,2.58,.11,state.committed?'#3d3529':'#332a22','#2f251f','#221b18');
    ellipseWorld(3.26,1.15,2.58,.04,.04,state.committed?'#c3b46c':'#6e6552');
    ctx.save();ctx.globalAlpha=.06;ctx.fillStyle='#d6d1bd';for(let i=0;i<42;i++){const x=(hash(state.seed+i)%1000)/1000*W;const y=(hash('y'+state.seed+i)%1000)/1000*H;ctx.fillRect(x,y,1+(i%3),1)}ctx.restore();
  }
  function draw(){ drawRoom(); capsuleCharacter(player,false); capsuleCharacter(ivan,true); drawHover(); if(debugOpen) updateDebug(); }
  function drawHover(){
    const target=pointer.hover; if(!target){worldPrompt.hidden=true;return;}
    let label='',p=null;
    if(target==='ivan'){label=state.committed?'IVAN · ODLUKA JE VEĆ ZAPISANA':'IVAN · PRIĐI / RAZGOVARAJ';p=project(ivan.x,2.1,ivan.z)}
    if(target==='door'){label=state.committed?'VRATA · ZATVORI SCENU':'VRATA · PRVO ODLUKA';p=project(door.x,1.5,door.z)}
    if(!p)return;worldPrompt.hidden=false;worldPrompt.textContent=label;worldPrompt.style.left=Math.min(W-220,Math.max(8,p.x+12))+'px';worldPrompt.style.top=Math.max(70,p.y-12)+'px';
  }
  function update(dt){
    t+=dt; const dx=player.tx-player.x,dz=player.tz-player.z,dist=Math.hypot(dx,dz);
    if(dist>.025){const step=Math.min(dist,player.speed*dt);player.x+=dx/dist*step;player.z+=dz/dist*step;player.moving=true;}
    else {player.moving=false;if(player.pending){const fn=player.pending;player.pending=null;fn();}}
  }
  function loop(now){const dt=Math.min(.04,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)} requestAnimationFrame(loop);

  function screenToFloor(sx,sy){
    let best={x:0,z:0,d:1e9}; for(let x=-4.2;x<=4.2;x+=.14){for(let z=-2.45;z<=2.35;z+=.14){const p=project(x,0,z),d=(p.x-sx)**2+(p.y-sy)**2;if(d<best.d)best={x,z,d}}} return best;
  }
  function hitTarget(sx,sy,obj,radiusPx=46){const p=project(obj.x,1.0,obj.z);return Math.hypot(p.x-sx,p.y-sy)<radiusPx;}
  function moveTo(x,z,after=null){player.tx=Math.max(-4.05,Math.min(4.05,x));player.tz=Math.max(-2.35,Math.min(2.25,z));player.pending=after;hint.classList.add('fade');}
  function interactIvan(){ if(state.completed)return; moveTo(1.88,.50,()=>openDialogue()); }
  function interactDoor(){ if(!state.committed){ flashHint('PRVO RAZGOVARAJ S IVANOM'); return; } moveTo(3.08,1.68,()=>completeRun()); }
  function flashHint(text){const old=hint.textContent;hint.textContent=text;hint.classList.remove('fade');setTimeout(()=>{hint.textContent=old;hint.classList.add('fade')},1200)}

  canvas.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.hover=hitTarget(e.clientX,e.clientY,ivan,58)?'ivan':hitTarget(e.clientX,e.clientY,door,64)?'door':null;canvas.style.cursor=pointer.hover?'pointer':'crosshair';});
  canvas.addEventListener('pointerdown',e=>{if(!dialogue.hidden||!ending.hidden||!help.hidden)return;if(hitTarget(e.clientX,e.clientY,ivan,64))return interactIvan();if(hitTarget(e.clientX,e.clientY,door,72))return interactDoor();const f=screenToFloor(e.clientX,e.clientY);moveTo(f.x,f.z);});

  const held=new Set();addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='f1'){e.preventDefault();debugOpen=!debugOpen;debug.hidden=!debugOpen;return}held.add(k)});addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
  setInterval(()=>{if(!dialogue.hidden||!ending.hidden||!help.hidden)return;let dx=0,dz=0;if(held.has('a')||held.has('arrowleft'))dx-=1;if(held.has('d')||held.has('arrowright'))dx+=1;if(held.has('w')||held.has('arrowup'))dz+=1;if(held.has('s')||held.has('arrowdown'))dz-=1;if(dx||dz){const n=Math.hypot(dx,dz);moveTo(player.x+dx/n*.12,player.z+dz/n*.12)}},50);

  const choiceDefs=[
    {id:'give_two_liters',label:'DAJ 2 L VODE',detail:'−2 VODA · +1 BILJEG · susjedu je stvarno pomognuto',enabled:()=>state.water>=2,result:'Dvije litre napuštaju stan. Na stolu ostaje manje vode, a u runu ostaje dokaz uzajamnosti.',apply:()=>{state.water-=2;state.biljeg+=1;state.neighborHelped=true}},
    {id:'mira_ration',label:'MIRA: RAZDJELI 1 L I PREPIŠI PLAN',detail:'Samo ako je Mira aktivna · −1 VODA · +1 INFO · +1 BILJEG',enabled:()=>state.miraActive&&state.water>=1,result:'Mira preslaguje raspodjelu. Pomoć je manja, ali kuća prvi put preciznije zna koliko joj ostaje.',apply:()=>{state.water-=1;state.information+=1;state.biljeg+=1;state.neighborHelped=true}},
    {id:'refuse_plainly',label:'ODBIJ BEZ LAŽI',detail:'+1 STRES · zaliha ostaje ista',enabled:()=>true,result:'Ivan odlazi bez vode. Nema lažne činjenice koju kasnije treba braniti, ali odbijanje ostaje događaj.',apply:()=>{state.stress+=1}},
    {id:'claim_no_water',label:'RECI DA NEMA VODE',detail:'+1 STRES · tvrdnja može kasnije doći u sukob s dokazima',enabled:()=>true,result:'Voda ostaje kod tebe, ali run sada sadrži tvrdnju koja može doći u sukob s onim što drugi vide.',apply:()=>{state.stress+=1;state.lied=true}}
  ];
  function openDialogue(){ if(state.committed){resultCard.hidden=false;resultText.textContent=state.result;return;}choicesEl.innerHTML='';choiceDefs.forEach(c=>{const b=document.createElement('button');b.className='choice';b.disabled=!c.enabled();b.innerHTML='<span><b>'+c.label+'</b><br><small>'+c.detail+'</small></span><span>→</span>';b.addEventListener('click',()=>commit(c));choicesEl.appendChild(b)});dialogue.hidden=false; }
  function commit(c){if(state.committed||!c.enabled())return;c.apply();state.committed=true;state.choiceId=c.id;state.result=c.result;state.log.push({scenarioId:'two_liters',choiceId:c.id,result:c.result});save();dialogue.hidden=true;resultText.textContent=c.result;resultCard.hidden=false;setTimeout(()=>resultCard.hidden=true,5200);flashHint('ODLUKA ZAPISANA · SADA VRATA');}
  function completeRun(){state.completed=true;state.scenarioIndex=1;save();endingText.textContent=state.neighborHelped?'Soba je fizički siromašnija za vodu, ali nije ista soba. Ivan odlazi drukčije nego što je došao. Trag odluke ostaje vidljiv i nakon što je dijalog nestao.':state.lied?'Ništa fizički nije otišlo iz stana. Ipak, prostor više nije neutralan: zaliha postoji uz tvrdnju da je nema.':'Voda je ostala. Napetost također. Odluka nije trošila bocu, ali je potrošila dio tišine.';endingFacts.innerHTML=['VODA '+state.water,'BILJEG '+state.biljeg,'STRES '+state.stress,state.miraActive?'MIRA AKTIVNA':'MIRA ODSUTNA',state.neighborHelped?'SUSJEDU POMOGNUTO':state.lied?'LAŽ ZAPISANA':'POMOĆ ODBIJENA'].map(x=>'<span>'+x+'</span>').join('');ending.hidden=false;}
  function updateDebug(){debugText.textContent=JSON.stringify({...state,player:{x:+player.x.toFixed(2),z:+player.z.toFixed(2)}},null,2)}

  document.getElementById('closeDialogue').onclick=()=>dialogue.hidden=true;
  document.getElementById('resetBtn').onclick=reset;document.getElementById('againBtn').onclick=reset;
  document.getElementById('helpBtn').onclick=()=>help.hidden=false;document.getElementById('closeHelp').onclick=()=>help.hidden=true;
  if(!state.committed) setTimeout(()=>help.hidden=false,450);
})();
