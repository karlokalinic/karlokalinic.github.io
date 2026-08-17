'use strict';
(() => {
  const root = document.getElementById('playgroundZero');
  if (!root) return;

  const $ = id => document.getElementById(id);
  const refs = {
    init: $('pzInit'), lang: $('pzLang'), reset: $('pzReset'), code: $('pzCode'), codeNote: $('pzCodeNote'),
    steps: $('pzSteps'), canvas: $('pzCanvas'), collision: $('pzCollision'), worldChip: $('pzWorldChip'),
    lessonTitle: $('pzLessonTitle'), lessonStatus: $('pzLessonStatus'), explanation: $('pzExplanation'), formula: $('pzFormula'),
    quest: $('pzQuest'), next: $('pzNext'), prev: $('pzPrev'), parts: $('pzParts'), partsGrid: $('pzPartsGrid'),
    inputX: $('pzInputX'), inputZ: $('pzInputZ'), yaw: $('pzYaw'), pitch: $('pzPitch'), posX: $('pzPosX'), posZ: $('pzPosZ')
  };
  if (!refs.canvas || !refs.code || !refs.steps) return;

  const COLORS = { init:'#b696e8', input:'#77cce8', look:'#f0a6c4', move:'#83d5a0', body:'#f4ce69', bridge:'#b8bbb5' };
  const SOURCE_PIN = '30b884361bf690c8ae3982aaaaf378dcb65de2f4';
  const SOURCE_BASE = `https://github.com/karlokalinic/control-room-alpha-production/blob/${SOURCE_PIN}/`;

  const CODE = [
    ['using UnityEngine;', null],
    ['using UnityEngine.InputSystem;', 'input'],
    ['', null],
    ['public class BabyPlayer : MonoBehaviour', 'body'],
    ['{', 'body'],
    ['    public CharacterController body;', 'body'],
    ['    public Camera head;', 'look'],
    ['    public float speed = 3f;', 'move'],
    ['    public float lookSpeed = 0.1f;', 'look'],
    ['', null],
    ['    float yaw;', 'look'],
    ['    float pitch;', 'look'],
    ['', null],
    ['    void Start()', 'init'],
    ['    {', 'init'],
    ['        Init();', 'init'],
    ['    }', 'init'],
    ['', null],
    ['    public void Init()', 'init'],
    ['    {', 'init'],
    ['        body.enabled = false;', 'init'],
    ['        transform.position = new Vector3(2f, 1f, 2f);', 'init'],
    ['        body.enabled = true;', 'init'],
    ['        yaw = 0f;', 'init'],
    ['        pitch = 0f;', 'init'],
    ['    }', 'init'],
    ['', null],
    ['    void Update()', 'body'],
    ['    {', 'body'],
    ['        Vector2 input = Vector2.zero;', 'input'],
    ['        if (Keyboard.current.wKey.isPressed) input.y += 1f;', 'input'],
    ['        if (Keyboard.current.sKey.isPressed) input.y -= 1f;', 'input'],
    ['        if (Keyboard.current.aKey.isPressed) input.x -= 1f;', 'input'],
    ['        if (Keyboard.current.dKey.isPressed) input.x += 1f;', 'input'],
    ['', null],
    ['        Vector2 mouse = Mouse.current.delta.ReadValue();', 'look'],
    ['        yaw += mouse.x * lookSpeed;', 'look'],
    ['        pitch = Mathf.Clamp(pitch - mouse.y * lookSpeed, -80f, 80f);', 'look'],
    ['        transform.rotation = Quaternion.Euler(0f, yaw, 0f);', 'look'],
    ['        head.transform.localRotation = Quaternion.Euler(pitch, 0f, 0f);', 'look'],
    ['', null],
    ['        Vector3 move = transform.right * input.x', 'move'],
    ['                     + transform.forward * input.y;', 'move'],
    ['        move = move.normalized;', 'move'],
    ['        body.Move(move * speed * Time.deltaTime);', 'body'],
    ['    }', 'body'],
    ['}', 'body']
  ];

  const SEGMENT_NOTES = {
    init: {hr:'INIT vraća poznato početno stanje. To znači da svaki pokus možeš ponoviti od iste točke.',en:'INIT restores one known starting state. That means every experiment can be repeated from the same point.'},
    input: {hr:'INPUT još ne pomiče igrača. Tipke samo pretvaramo u dva broja: x = lijevo/desno, y = naprijed/natrag.',en:'INPUT does not move the player yet. Keys only become two numbers: x = left/right, y = forward/back.'},
    look: {hr:'LOOK pretvara pomak miša u kutove yaw i pitch. Broj postaje rotacija tijela i kamere.',en:'LOOK turns mouse movement into yaw and pitch angles. A number becomes body and camera rotation.'},
    move: {hr:'MOVE spaja broj iz inputa s lokalnim smjerovima transform.right i transform.forward.',en:'MOVE combines the input number with local directions transform.right and transform.forward.'},
    body: {hr:'BODY je fizički izvođač. CharacterController pokušava napraviti pomak, ali zid mu može reći NE.',en:'BODY is the physical executor. CharacterController attempts the move, but a wall can say NO.'}
  };

  const STEPS = [
    {id:'init',segment:'init',title:{hr:'0. NAPRAVI POČETAK',en:'0. MAKE A START'},mini:{hr:'Jedan gumb = poznato stanje.',en:'One button = known state.'},explain:{hr:'Prije tipki, kamere i fizike napravi reset koji uvijek zna gdje je igrač. Pritisni INIT() i gledaj ljubičaste retke.',en:'Before keys, camera and physics, make a reset that always knows where the player is. Press INIT() and watch the purple lines.'},formula:'INIT() → position + yaw + pitch = KNOWN STATE',quest:{hr:'Pritisni INIT().',en:'Press INIT().'},test:()=>progress.init},
    {id:'input',segment:'input',title:{hr:'1. TIPKA POSTAJE BROJ',en:'1. A KEY BECOMES A NUMBER'},mini:{hr:'W nije pokret. W je +1.',en:'W is not movement. W is +1.'},explain:{hr:'Drži W. Plavi redovi čitaju tipku i mijenjaju samo INPUT Z. To je prva važna podjela: zahtjev igrača još nije fizika.',en:'Hold W. The blue lines read the key and change only INPUT Z. First important split: player intent is not physics yet.'},formula:'W → input.y = +1',quest:{hr:'Drži W barem četvrt sekunde i gledaj INPUT Z.',en:'Hold W for at least a quarter second and watch INPUT Z.'},test:()=>progress.input},
    {id:'move',segment:'move',title:{hr:'2. BROJ DOBIVA SMJER',en:'2. THE NUMBER GETS A DIRECTION'},mini:{hr:'input + forward = vektor',en:'input + forward = vector'},explain:{hr:'Zeleni redovi uzimaju +1 i pitaju: što znači naprijed za OVAJ objekt? Zato se koriste transform.forward i transform.right.',en:'The green lines take +1 and ask: what does forward mean for THIS object? That is why transform.forward and transform.right are used.'},formula:'direction = right × input.x + forward × input.y',quest:{hr:'Pomakni se W pa A ili D. Pogledaj kako X/Z pozicija reagira.',en:'Move with W, then A or D. Watch X/Z position react.'},test:()=>progress.move&&progress.strafe},
    {id:'look',segment:'look',title:{hr:'3. MIŠ POSTAJE POGLED',en:'3. MOUSE BECOMES VISION'},mini:{hr:'delta → yaw / pitch',en:'delta → yaw / pitch'},explain:{hr:'Povuci mišem po 3D prozoru. Ružičasti redovi pretvaraju horizontalni pomak u yaw, a vertikalni u pitch. Smjer kretanja se zato okreće zajedno s tobom.',en:'Drag inside the 3D view. Pink lines turn horizontal motion into yaw and vertical motion into pitch. Your movement direction therefore rotates with you.'},formula:'mouse Δ → angle → camera/body rotation',quest:{hr:'Povuci pogled barem 15° pa opet pritisni W.',en:'Drag the view by at least 15°, then press W again.'},test:()=>progress.look},
    {id:'body',segment:'body',title:{hr:'4. ZID KAŽE NE',en:'4. THE WALL SAYS NO'},mini:{hr:'želja ≠ dopušten pomak',en:'wish ≠ allowed movement'},explain:{hr:'Žuti red je mjesto gdje izračunati pokret predajemo CharacterControlleru. U ovoj maloj igri zid radi istu pedagošku stvar: input može biti +1, ali pozicija se ne smije promijeniti kroz zid.',en:'The yellow line is where calculated movement is handed to CharacterController. In this tiny game a wall teaches the same rule: input can be +1 while position is forbidden to pass through a wall.'},formula:'requested move → collision test → allowed position',quest:{hr:'Namjerno hodaj ravno u zid dok se ne pojavi BLOCKED / ZID.',en:'Walk deliberately into a wall until BLOCKED / ZID appears.'},test:()=>progress.collision},
    {id:'bridge',segment:'bridge',title:{hr:'5. SAD OTVORI PAUKTUNEL',en:'5. NOW OPEN PAUKTUNEL'},mini:{hr:'ista ideja, ozbiljnija podjela',en:'same idea, serious separation'},explain:{hr:'Tek sada ima smisla vidjeti zašto Pauktunel odvaja GameInput od PlayerMovementa. Nije “kompliciraniji kod bez razloga”: ono što si upravo ručno osjetio razdvaja se u stabilne odgovornosti.',en:'Only now does it make sense to see why Pauktunel separates GameInput from PlayerMovement. It is not “more complicated code for no reason”: the behavior you just felt is split into stable responsibilities.'},formula:'BabyPlayer → GameInput + PlayerMovement + scene references',quest:{hr:'Otvori LADICU DIJELOVA ispod i izaberi što želiš rastaviti sljedeće.',en:'Open the PARTS DRAWER below and choose what you want to dismantle next.'},test:()=>progress.bridge}
  ];

  const PARTS = [
    {kind:'CODE / KOD',title:'INPUT',desc:{hr:'Kako produkcijska igra centralizira W/A/S/D, miš, interact, sprint i ostale namjere.',en:'How the production game centralizes W/A/S/D, mouse, interact, sprint and other intentions.'},path:'Assets/Scripts/Assembly-CSharp/GameInput.cs',url:SOURCE_BASE+'Assets/Scripts/Assembly-CSharp/GameInput.cs'},
    {kind:'CODE / KOD',title:'PLAYER BODY',desc:{hr:'CharacterController, gravitacija, ground check, hodanje i sprint.',en:'CharacterController, gravity, ground check, walking and sprint.'},path:'Assets/Scripts/Assembly-CSharp/PlayerMovement.cs',url:SOURCE_BASE+'Assets/Scripts/Assembly-CSharp/PlayerMovement.cs'},
    {kind:'WORLD / SVIJET',title:'MAIN SCENE',desc:{hr:'Produkcijski prostor. Koristi ga kasnije kao inventar objekata, ne kao jednu nerazumljivu cjelinu.',en:'Production world. Later treat it as an inventory of objects, not one incomprehensible whole.'},path:'Assets/scenes/main.unity',url:SOURCE_BASE+'Assets/scenes/main.unity'},
    {kind:'SPIDER / PAUK',title:'SPIDER MOTION',desc:{hr:'Prvo trigger + animacija. Nemoj još pretpostaviti NavMesh dok izvor to ne dokaže.',en:'Start with trigger + animation. Do not assume NavMesh until source evidence proves it.'},path:'Assets/Scripts/Assembly-CSharp/cliffspiderTrigger.cs + Assets/AnimationClip/spider anim.anim',url:SOURCE_BASE+'Assets/Scripts/Assembly-CSharp/cliffspiderTrigger.cs'},
    {kind:'AUDIO / ZVUK',title:'ROOM AMBIENCE',desc:{hr:'Ambijent kao stanje prostora, ne kao ukras na kraju.',en:'Ambience as room state, not decoration added at the end.'},path:'Assets/AudioClip/ambience hum.ogg',url:SOURCE_BASE+'Assets/AudioClip/ambience hum.ogg'},
    {kind:'LOOK / SLIKA',title:'POST PROFILE',desc:{hr:'Boja, vignette i drugi slojevi tek nakon neutralne čitljive slike.',en:'Color, vignette and other layers only after a neutral readable image.'},path:'Assets/MonoBehaviour/post processing Profile.asset',url:SOURCE_BASE+'Assets/MonoBehaviour/post processing Profile.asset'}
  ];

  const MAP=['111111111111','100000000001','100000000001','100001100001','100000100001','100000000001','100011000001','100000000001','111111111111'];
  const player={x:2.5,z:2.5,yaw:0,pitch:0,speed:2.15};
  const start={x:2.5,z:2.5};
  const keys={w:false,a:false,s:false,d:false};
  const progress={init:false,input:false,move:false,strafe:false,look:false,collision:false,bridge:false};
  let currentStep=0,language='both',activeSegments=new Set(['init']),manualSegment=null,initHotUntil=0,lookHotUntil=0,collisionHotUntil=0,inputHold=0,lastTime=performance.now(),dragging=false,lastPointer=null,decorationImage=null;

  function esc(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function formatCode(text){let s=esc(text);s=s.replace(/(\/\/.*)$/g,'<span class="pz-token-comment">$1</span>').replace(/\b(using|public|class|void|float|if|true|false)\b/g,'<span class="pz-token-key">$1</span>').replace(/\b(UnityEngine|UnityEngine\.InputSystem|MonoBehaviour|CharacterController|Camera|Vector2|Vector3|Keyboard|Mouse|Quaternion|Mathf|Time)\b/g,'<span class="pz-token-type">$1</span>').replace(/\b(\d+(?:\.\d+)?f?)\b/g,'<span class="pz-token-number">$1</span>');return s;}
  function bilingual(hr,en,tag='div'){if(language==='hr')return `<${tag} data-pz-lang="hr">${esc(hr)}</${tag}>`;if(language==='en')return `<${tag} data-pz-lang="en">${esc(en)}</${tag}>`;return `<${tag} class="pz-lang-line" data-pz-lang="hr"><span class="pz-lang-tag">HR</span><span>${esc(hr)}</span></${tag}><${tag} class="pz-lang-line" data-pz-lang="en"><span class="pz-lang-tag">EN</span><span>${esc(en)}</span></${tag}>`;}

  function renderCode(){refs.code.innerHTML=CODE.map(([text,segment],i)=>`<div class="pz-code-line${segment&&activeSegments.has(segment)?' is-active':''}" data-line="${i+1}" ${segment?`data-segment="${segment}"`:''}><span class="pz-ln">${i+1}</span><code>${formatCode(text)}</code></div>`).join('');refs.code.classList.toggle('has-focus',activeSegments.size>0);refs.code.querySelectorAll('.pz-code-line[data-segment]').forEach(line=>line.addEventListener('click',()=>{manualSegment=line.dataset.segment;activeSegments=new Set([manualSegment]);const note=SEGMENT_NOTES[manualSegment];renderCode();if(refs.codeNote&&note)refs.codeNote.innerHTML=`<strong>${manualSegment.toUpperCase()}</strong>${bilingual(note.hr,note.en,'p')}`;}));root.querySelectorAll('.pz-legend button[data-segment]').forEach(btn=>btn.classList.toggle('is-active',activeSegments.has(btn.dataset.segment)));}
  function renderSteps(){refs.steps.innerHTML='<div class="pz-steps-head">MISSION / ZADATAK</div>'+STEPS.map((step,i)=>{const done=Boolean(step.test());return `<button type="button" class="pz-step${i===currentStep?' is-current':''}${done?' is-done':''}" data-step="${i}" style="--step-color:${COLORS[step.segment]||COLORS.bridge}"><span class="pz-step-n">${done?'✓':i}</span><span><span class="pz-step-title">${language==='en'?esc(step.title.en):esc(step.title.hr)}</span><span class="pz-step-mini">${language==='hr'?esc(step.mini.hr):language==='en'?esc(step.mini.en):esc(step.mini.hr)+' / '+esc(step.mini.en)}</span><span class="pz-step-check">${done?'PROVEN / DOKAZANO':'OPEN / OTVORENO'}</span></span></button>`;}).join('');refs.steps.querySelectorAll('.pz-step').forEach(b=>b.addEventListener('click',()=>selectStep(Number(b.dataset.step))));}
  function renderLesson(){const step=STEPS[currentStep],done=Boolean(step.test()),title=language==='en'?step.title.en:language==='hr'?step.title.hr:`${step.title.hr} / ${step.title.en}`;refs.lessonTitle.textContent=title;refs.lessonStatus.textContent=done?'PROVEN / DOKAZANO':'TRY IT / PROBAJ';refs.explanation.innerHTML=bilingual(step.explain.hr,step.explain.en,'p');refs.formula.textContent=step.formula;refs.formula.style.setProperty('--step-color',COLORS[step.segment]||COLORS.bridge);refs.quest.innerHTML=`<b>DO THIS / NAPRAVI OVO</b>${bilingual(step.quest.hr,step.quest.en,'p')}`;refs.next.disabled=currentStep>=STEPS.length-1;refs.prev.disabled=currentStep<=0;refs.next.style.setProperty('--step-color',COLORS[step.segment]||COLORS.bridge);if(!manualSegment){activeSegments=new Set(step.segment==='bridge'?[]:[step.segment]);renderCode();}}
  function selectStep(i){currentStep=Math.max(0,Math.min(STEPS.length-1,i));manualSegment=null;renderSteps();renderLesson();}
  function resetPlayer(mark=true){player.x=start.x;player.z=start.z;player.yaw=0;player.pitch=0;Object.keys(keys).forEach(k=>keys[k]=false);if(mark){progress.init=true;initHotUntil=performance.now()+900;currentStep=Math.max(currentStep,0);}manualSegment=null;updateProgressUI();}
  function resetLesson(){Object.keys(progress).forEach(k=>progress[k]=false);currentStep=0;resetPlayer(false);initHotUntil=performance.now()+700;renderSteps();renderLesson();}
  function wallAt(x,z){const gx=Math.floor(x),gz=Math.floor(z);if(gz<0||gz>=MAP.length||gx<0||gx>=MAP[0].length)return true;return MAP[gz][gx]==='1';}
  function blocked(x,z){const r=.20;return wallAt(x-r,z-r)||wallAt(x+r,z-r)||wallAt(x-r,z+r)||wallAt(x+r,z+r);}

  function update(dt,now){const ix=(keys.d?1:0)-(keys.a?1:0),iz=(keys.w?1:0)-(keys.s?1:0);if(ix||iz){inputHold+=dt;if(inputHold>.25)progress.input=true;const len=Math.hypot(ix,iz)||1,sx=ix/len,fz=iz/len,forwardX=Math.cos(player.yaw),forwardZ=Math.sin(player.yaw),rightX=Math.cos(player.yaw+Math.PI/2),rightZ=Math.sin(player.yaw+Math.PI/2),dx=(rightX*sx+forwardX*fz)*player.speed*dt,dz=(rightZ*sx+forwardZ*fz)*player.speed*dt;let moved=false;if(!blocked(player.x+dx,player.z)){player.x+=dx;moved=true;}else{progress.collision=true;collisionHotUntil=now+450;}if(!blocked(player.x,player.z+dz)){player.z+=dz;moved=true;}else{progress.collision=true;collisionHotUntil=now+450;}if(moved&&Math.hypot(player.x-start.x,player.z-start.z)>.42)progress.move=true;if(moved&&(keys.a||keys.d))progress.strafe=true;}else inputHold=0;const active=new Set();if(now<initHotUntil)active.add('init');if(ix||iz)active.add('input');if(now<lookHotUntil)active.add('look');if(ix||iz)active.add('move');if(ix||iz||now<collisionHotUntil)active.add('body');if(manualSegment)active.add(manualSegment);const changed=[...active].sort().join('|')!==[...activeSegments].sort().join('|');activeSegments=active;if(changed)renderCode();refs.collision.classList.toggle('is-on',now<collisionHotUntil);updateVars(ix,iz,now);autoAdvanceHint();}
  function updateVars(ix,iz,now){[[refs.inputX,ix,'input',ix!==0],[refs.inputZ,iz,'input',iz!==0],[refs.yaw,(player.yaw*180/Math.PI).toFixed(0)+'°','look',now<lookHotUntil],[refs.pitch,player.pitch.toFixed(0)+'°','look',now<lookHotUntil],[refs.posX,player.x.toFixed(2),'move',ix!==0||iz!==0],[refs.posZ,player.z.toFixed(2),'body',ix!==0||iz!==0]].forEach(([el,value,seg,hot])=>{if(!el)return;el.querySelector('b').textContent=value;el.dataset.hot=hot?'true':'false';el.style.setProperty('--var-color',COLORS[seg]);});}
  let lastDoneSignature='';
  function updateProgressUI(){renderSteps();renderLesson();}
  function autoAdvanceHint(){const signature=STEPS.map(s=>s.test()?'1':'0').join('');if(signature===lastDoneSignature)return;lastDoneSignature=signature;renderSteps();renderLesson();const current=STEPS[currentStep];if(current.test()&&currentStep<STEPS.length-1)refs.lessonStatus.textContent='PROVEN ✓ — NEXT IS READY';}

  function castRay(angle){const max=18,step=.025;for(let d=.03;d<max;d+=step){const x=player.x+Math.cos(angle)*d,z=player.z+Math.sin(angle)*d;if(wallAt(x,z))return{d,x,z};}return{d:max,x:player.x+Math.cos(angle)*max,z:player.z+Math.sin(angle)*max};}
  function renderWorld(){const canvas=refs.canvas,ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,horizon=Math.max(h*.22,Math.min(h*.78,h/2+player.pitch*2.2));ctx.fillStyle='#cfe7f4';ctx.fillRect(0,0,w,horizon);ctx.fillStyle='#d8d3bf';ctx.fillRect(0,horizon,w,h-horizon);const fov=Math.PI*65/180,depths=new Float32Array(w);for(let sx=0;sx<w;sx+=2){const rel=(sx/w-.5)*fov,rayA=player.yaw+rel,hit=castRay(rayA),dist=Math.max(.08,hit.d*Math.cos(rel));depths[sx]=depths[sx+1]=dist;const wallH=Math.min(h*1.8,h*0.92/dist*2.15),top=horizon-wallH/2,shade=Math.max(.28,1-dist/13),grid=((Math.floor(hit.x*2)+Math.floor(hit.z*2))%2)?1:.9,r=Math.round(118*shade*grid+55),g=Math.round(139*shade*grid+58),b=Math.round(149*shade*grid+62);ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(sx,top,2,wallH);if(dist<1.0){ctx.fillStyle='rgba(244,206,105,.15)';ctx.fillRect(sx,top,2,wallH);}}drawBillboard(ctx,w,h,horizon,fov,depths);drawMinimap(ctx,w,h);}
  function wrapAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
  function drawBillboard(ctx,w,h,horizon,fov,depths){const sx=8.4,sz=5.4,dx=sx-player.x,dz=sz-player.z,dist=Math.hypot(dx,dz),rel=wrapAngle(Math.atan2(dz,dx)-player.yaw);if(Math.abs(rel)>fov*.58)return;const screenX=(.5+rel/fov)*w,column=Math.max(0,Math.min(w-1,Math.round(screenX)));if(depths[column]&&dist>depths[column]+.1)return;const size=Math.max(18,Math.min(110,140/dist)),y=horizon-size*.2;if(decorationImage){ctx.drawImage(decorationImage,screenX-size/2,y-size,size,size);return;}ctx.save();ctx.translate(screenX,y);ctx.strokeStyle='#282628';ctx.lineWidth=Math.max(1,size*.035);ctx.fillStyle='#6e4660';for(let i=0;i<4;i++){const yy=-size*.15+i*size*.13;ctx.beginPath();ctx.moveTo(-size*.1,yy);ctx.lineTo(-size*.5,yy-size*.18);ctx.lineTo(-size*.68,yy+size*.03);ctx.stroke();ctx.beginPath();ctx.moveTo(size*.1,yy);ctx.lineTo(size*.5,yy-size*.18);ctx.lineTo(size*.68,yy+size*.03);ctx.stroke();}ctx.beginPath();ctx.ellipse(0,-size*.13,size*.22,size*.32,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.9)';ctx.font=`${Math.max(8,size*.08)}px Courier New`;ctx.textAlign='center';ctx.fillText('PAUK / PROXY',0,size*.34);ctx.restore();}
  function drawMinimap(ctx,w,h){const scale=6,ox=10,oy=h-MAP.length*scale-10;ctx.save();ctx.globalAlpha=.88;ctx.fillStyle='#fff';ctx.fillRect(ox-4,oy-4,MAP[0].length*scale+8,MAP.length*scale+8);for(let z=0;z<MAP.length;z++)for(let x=0;x<MAP[0].length;x++){ctx.fillStyle=MAP[z][x]==='1'?'#555b59':'#ecebe4';ctx.fillRect(ox+x*scale,oy+z*scale,scale,scale);}ctx.fillStyle='#6e4660';ctx.fillRect(ox+8.4*scale-2,oy+5.4*scale-2,4,4);ctx.fillStyle='#187443';ctx.beginPath();ctx.arc(ox+player.x*scale,oy+player.z*scale,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#187443';ctx.beginPath();ctx.moveTo(ox+player.x*scale,oy+player.z*scale);ctx.lineTo(ox+(player.x+Math.cos(player.yaw)*1.4)*scale,oy+(player.z+Math.sin(player.yaw)*1.4)*scale);ctx.stroke();ctx.restore();}
  function loop(now){const dt=Math.min(.04,Math.max(0,(now-lastTime)/1000));lastTime=now;update(dt,now);renderWorld();requestAnimationFrame(loop);}

  function setKey(key,value){if(key in keys){keys[key]=value;root.querySelectorAll(`.pz-key[data-key="${key}"]`).forEach(b=>b.classList.toggle('is-down',value));}}
  function installControls(){window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const k=e.key.toLowerCase();if(k in keys){setKey(k,true);e.preventDefault();}});window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k in keys)setKey(k,false);});window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>setKey(k,false)));root.querySelectorAll('.pz-key').forEach(btn=>{const key=btn.dataset.key;btn.addEventListener('pointerdown',e=>{e.preventDefault();setKey(key,true);btn.setPointerCapture?.(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(name=>btn.addEventListener(name,()=>setKey(key,false)));});refs.canvas.addEventListener('pointerdown',e=>{dragging=true;lastPointer={x:e.clientX,y:e.clientY};refs.canvas.setPointerCapture?.(e.pointerId);});refs.canvas.addEventListener('pointermove',e=>{if(!dragging||!lastPointer)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;lastPointer={x:e.clientX,y:e.clientY};player.yaw=wrapAngle(player.yaw+dx*.007);player.pitch=Math.max(-38,Math.min(38,player.pitch+dy*.16));if(Math.abs(dx)+Math.abs(dy)>1){progress.look=true;lookHotUntil=performance.now()+500;}});['pointerup','pointercancel','lostpointercapture'].forEach(name=>refs.canvas.addEventListener(name,()=>{dragging=false;lastPointer=null;}));}

  function renderParts(){refs.partsGrid.innerHTML=PARTS.map(part=>`<article class="pz-part"><small>${esc(part.kind)}</small><b>${esc(part.title)}</b><p>${language==='en'?esc(part.desc.en):language==='hr'?esc(part.desc.hr):esc(part.desc.hr)+' / '+esc(part.desc.en)}</p><code>${esc(part.path)}</code><span class="pz-part-status">PINNED ${SOURCE_PIN.slice(0,8)}</span><a href="${part.url}" target="_blank" rel="noreferrer">OPEN SOURCE EVIDENCE ↗</a></article>`).join('')+`<article class="pz-part"><small>LOCAL TOY / LOKALNA IGRAČKA</small><b>DECORATION BILLBOARD</b><p>${language==='en'?'Load a PNG/JPG/WebP locally and it replaces the spider proxy in the micro-world. Nothing uploads.':language==='hr'?'Učitaj PNG/JPG/WebP lokalno i zamijenit će proxy pauka u mikro-svijetu. Ništa se ne uploada.':'Učitaj PNG/JPG/WebP lokalno i zamijenit će proxy pauka u mikro-svijetu. Ništa se ne uploada. / Load a PNG/JPG/WebP locally and it replaces the spider proxy in the micro-world. Nothing uploads.'}</p><label class="pz-part-status" style="cursor:pointer">LOAD IMAGE<input id="pzDecorationInput" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><span class="pz-part-status">FBX / PREFAB = NEXT LAB</span></article><p class="pz-parts-note">${language==='en'?'The public tutorial contains only paths, teaching metadata and a synthetic spider proxy. Private Pauktunel models, scenes, audio and prefabs are not copied into this public renderer. The next loader layer can resolve/export supported private assets without publishing them.':language==='hr'?'Javni tutorial sadrži samo putanje, nastavne metapodatke i sintetski proxy pauka. Privatni Pauktunel modeli, scene, audio i prefabi nisu kopirani u javni renderer. Sljedeći loader sloj može razriješiti/izvesti podržane privatne assete bez objave.':'Javni tutorial sadrži samo putanje, nastavne metapodatke i sintetski proxy pauka. Privatni asseti nisu kopirani. / The public tutorial contains paths and teaching metadata only; private assets are not copied.'}</p>`;const input=$('pzDecorationInput');input?.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{decorationImage=img;};img.src=String(reader.result||'');};reader.readAsDataURL(file);});}
  function cycleLanguage(){language=language==='both'?'hr':language==='hr'?'en':'both';root.dataset.lang=language;refs.lang.textContent=`LANG: ${language.toUpperCase()}`;renderSteps();renderLesson();renderParts();}

  refs.init?.addEventListener('click',()=>{resetPlayer(true);selectStep(Math.max(currentStep,0));});refs.reset?.addEventListener('click',resetLesson);refs.lang?.addEventListener('click',cycleLanguage);refs.prev?.addEventListener('click',()=>selectStep(currentStep-1));refs.next?.addEventListener('click',()=>selectStep(currentStep+1));refs.parts?.addEventListener('toggle',()=>{if(refs.parts.open){progress.bridge=true;renderSteps();renderLesson();}});root.querySelectorAll('.pz-legend button[data-segment]').forEach(btn=>btn.addEventListener('click',()=>{manualSegment=manualSegment===btn.dataset.segment?null:btn.dataset.segment;activeSegments=new Set(manualSegment?[manualSegment]:[STEPS[currentStep].segment]);renderCode();const note=manualSegment?SEGMENT_NOTES[manualSegment]:null;if(refs.codeNote&&note)refs.codeNote.innerHTML=`<strong>${manualSegment.toUpperCase()}</strong>${bilingual(note.hr,note.en,'p')}`;}));
  root.dataset.lang=language;renderCode();renderSteps();renderLesson();renderParts();installControls();resetPlayer(false);requestAnimationFrame(loop);
})();
