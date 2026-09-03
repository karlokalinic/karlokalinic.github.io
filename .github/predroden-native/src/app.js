import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const host=document.getElementById('game'), status=document.getElementById('status'), veil=document.getElementById('veil'), start=document.getElementById('start'), flash=document.getElementById('flash');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.8; host.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x050505); scene.fog=new THREE.FogExp2(0x070707,.018);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.025,1400); const controls=new PointerLockControls(camera,renderer.domElement);
scene.add(new THREE.HemisphereLight(0x9a9488,0x11100e,1.6));
const lamp=new THREE.PointLight(0xd9c9ae,13,22,1.8); lamp.position.set(0,.15,0); camera.add(lamp); scene.add(camera);
const mat=new THREE.MeshStandardMaterial({color:0x9b9385,roughness:.92,metalness:.02,side:THREE.DoubleSide});
const dark=new THREE.MeshStandardMaterial({color:0x49453f,roughness:1,metalness:0,side:THREE.DoubleSide});
const loader=new OBJLoader(), cache=new Map(), keys=new Set();
let manifest,currentIndex=0,sceneRoot=null,switching=false,walkY=1.65,cheatLatch=false;
const asset=(p)=>new URL(p,import.meta.url).href;
const setStatus=(t)=>status.textContent=t;
const code=(e)=>e.code||e.key;
function loadObj(path){
  if(!cache.has(path)) cache.set(path,loader.loadAsync(asset(`game/${path}`)).then(g=>{g.traverse(o=>{if(o.isMesh){o.geometry.computeVertexNormals();o.material=/floor|wall|ceiling|apartment|hallway|bathroom/i.test(path)?dark:mat;o.castShadow=false;o.receiveShadow=false}});return g}));
  return cache.get(path);
}
function transform(n,t){const [x,y,z]=t.position,[qx,qy,qz,qw]=t.rotation,[sx,sy,sz]=t.scale;n.position.set(x,y,z);n.quaternion.set(qx,qy,qz,qw);n.scale.set(sx,sy,sz)}
async function loadScene(index){
  if(!manifest?.scenes?.length||switching)return; switching=true; currentIndex=((index%manifest.scenes.length)+manifest.scenes.length)%manifest.scenes.length; const data=manifest.scenes[currentIndex];
  setStatus(`SCENA ${currentIndex+1}/${manifest.scenes.length} · ${data.label}\nrekonstrukcija geometrije...`);
  const root=new THREE.Group(); root.name=`PREDRODEN:${data.id}`; root.scale.z=-1; const nodes=new Map();
  for(const t of data.transforms){const n=new THREE.Object3D();n.name=t.name;transform(n,t);nodes.set(t.id,n)}
  for(const t of data.transforms){const n=nodes.get(t.id),p=t.parent?nodes.get(t.parent):null;(p||root).add(n)}
  let done=0; const visible=data.instances.filter(x=>x.enabled!==false);
  await Promise.all(visible.map(async i=>{try{const source=await loadObj(i.mesh),copy=source.clone(true);copy.name=i.name;(nodes.get(i.transform)||root).add(copy)}catch(e){console.warn('mesh failed',i.mesh,e)}finally{done++;if(done%12===0||done===visible.length)setStatus(`SCENA ${currentIndex+1}/${manifest.scenes.length} · ${data.label}\n${done}/${visible.length} objekata`)}}));
  root.updateMatrixWorld(true); if(sceneRoot)scene.remove(sceneRoot); sceneRoot=root; scene.add(root); root.updateMatrixWorld(true);
  let placed=false; const authored=data.cameras.find(c=>c.enabled)||data.cameras[0];
  if(authored){const n=nodes.get(authored.transform);if(n){const p=new THREE.Vector3(),q=new THREE.Quaternion();n.getWorldPosition(p);n.getWorldQuaternion(q);camera.position.copy(p);camera.quaternion.copy(q);camera.fov=Math.min(90,Math.max(45,authored.fov||62));camera.near=Math.max(.02,authored.near||.025);camera.far=Math.max(250,authored.far||1400);camera.updateProjectionMatrix();walkY=p.y;placed=true}}
  if(!placed){const b=new THREE.Box3().setFromObject(root);if(!b.isEmpty()){const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());camera.position.set(c.x,b.min.y+Math.max(1.65,s.y*.16),c.z+Math.max(2.5,s.z*.3));camera.lookAt(c.x,camera.position.y,c.z);walkY=camera.position.y}else{camera.position.set(0,1.65,5);walkY=1.65}}
  flash.classList.remove('fire');void flash.offsetWidth;flash.classList.add('fire');setStatus(`SCENA ${currentIndex+1}/${manifest.scenes.length} · ${data.label}\n${visible.length} objekata · CTRL+S+K → sljedeća`);switching=false;
}
const advance=()=>!switching&&loadScene(currentIndex+1);
function cheat(e){const ctrl=e.ctrlKey||keys.has('ControlLeft')||keys.has('ControlRight'),s=keys.has('KeyS'),k=keys.has('KeyK');if(ctrl&&(code(e)==='KeyS'||code(e)==='KeyK'))e.preventDefault();if(ctrl&&s&&k&&!cheatLatch){cheatLatch=true;e.preventDefault();advance()}}
addEventListener('keydown',e=>{keys.add(code(e));cheat(e)},{capture:true}); addEventListener('keyup',e=>{keys.delete(code(e));if(!keys.has('KeyS')||!keys.has('KeyK'))cheatLatch=false},{capture:true}); addEventListener('blur',()=>{keys.clear();cheatLatch=false});
start.addEventListener('click',()=>controls.lock()); renderer.domElement.addEventListener('click',()=>{if(!controls.isLocked)controls.lock()}); controls.addEventListener('lock',()=>veil.classList.add('hidden')); controls.addEventListener('unlock',()=>veil.classList.remove('hidden'));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6))});
const clock=new THREE.Clock(); function frame(){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta());if(controls.isLocked&&!switching){const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?5.2:2.65;if(keys.has('KeyW'))controls.moveForward(speed*dt);if(keys.has('KeyS')&&!(keys.has('KeyK')&&(keys.has('ControlLeft')||keys.has('ControlRight'))))controls.moveForward(-speed*dt);if(keys.has('KeyA'))controls.moveRight(-speed*dt);if(keys.has('KeyD'))controls.moveRight(speed*dt);camera.position.y=walkY;lamp.intensity=12.5+Math.sin(performance.now()*.0037)*.7}renderer.render(scene,camera)}
try{const r=await fetch(asset('game/manifest.json'),{cache:'no-store'});if(!r.ok)throw new Error(`manifest HTTP ${r.status}`);manifest=await r.json();if(!manifest.scenes?.length)throw new Error('manifest nema scene');const first=Math.max(0,manifest.scenes.findIndex(s=>s.instances.filter(x=>x.enabled!==false).length>=20));setStatus(`${manifest.sceneCount} scena · ${manifest.meshFiles} mesheva · ${manifest.meshInstances} instanci`);await loadScene(first)}catch(e){console.error(e);setStatus(`GREŠKA NATIVE PORTA\n${e.message||e}`);start.disabled=true}frame();
