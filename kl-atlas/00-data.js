'use strict';
const SAMPLE_SOURCE = `using UnityEngine;

public sealed class OnStart : MonoBehaviour
{
  [SerializeField] private GameObject partOne;
  [SerializeField] private AudioSource clickSource;

  private void Start()
  {
      partOne.SetActive(false);
      clickSource.Play();
  }

  public void RevealPartOne()
  {
      partOne.SetActive(true);
  }
}`;
const SAMPLE_KL = `KL/1
lesson: From component to behavior
target: OnStart.cs
@step class
focus: 3-6
title: First identify the thing Unity can attach
concepts: MonoBehaviour, OnStart, SerializeField
say: This file defines one Unity component. The class inherits MonoBehaviour, which is the contract that lets a GameObject host this behavior. The serialized fields are references that Unity can store in the scene or prefab.
why: Before reading behavior, separate identity from dependencies. The class tells you what this script is; serialized fields tell you what it needs from the scene.
pet: If you cannot name a script's inputs, every later line feels like magic.
theme: blue
check: Which two scene references must exist for this component to work as written?
answer: partOne and clickSource.
@end
@step entry
focus: 8-12
title: Then locate the automatic entry point
concepts: Start, SetActive, Play
say: Unity invokes Start once before the first frame update when this enabled component becomes active. The method does two side effects: it hides partOne and asks the referenced AudioSource to play.
why: Read this as a causal chain: Unity lifecycle event → this method → calls on other objects.
pet: Follow verbs. Verbs expose causality faster than nouns.
theme: black
check: Does this script create partOne?
answer: No. It only holds a reference and changes that existing object's active state.
@end
@step public
focus: 14-17
title: Finally find the externally callable behavior
concepts: RevealPartOne, public, SetActive
say: RevealPartOne is public, so another script, a UnityEvent, a UI Button, animation event or other caller can invoke it. The method reverses the state established in Start by activating partOne.
why: Dependency is injected by the scene, Start establishes initial state, and an external caller triggers the later transition.
pet: A method becomes understandable when you can point to who calls it and what state it changes.
theme: red
check: What missing information would you inspect next in Unity?
answer: Which GameObject owns this component, what object is assigned to partOne, what AudioSource is assigned, and what invokes RevealPartOne.
@end`;
const STOPWORDS = new Set(`a an and are as at be because been but by can could did do does for from had has have he her hers him his how i if in into is it its just me more most my no not of on or our ours she so some than that the their theirs them then there these they this those to too up us very was we were what when where which who why will with would you your yours a ako ali biti bio bila bilo bi bez da do dok ga gdje i ili iz ja je jer joj još kao kada kako koji koja koje kroz li me mi na nad nam ne nego nije ni njih njima no o od oko on ona ono pa po pod prije pri sa sam se si smo ste su što ta taj te ti to toga tu u uz vam vas već za zato zbog`.split(/\s+/));
const state={sourceName:'OnStart.cs',sourceText:SAMPLE_SOURCE,lesson:null,stepIndex:0,graph:{nodes:[],edges:[]},textIndex:null,structural:null,selectedConcept:null,sound:true,memory:loadMemory()};
const el=id=>document.getElementById(id);const refs={sourceInput:el('sourceInput'),klInput:el('klInput'),documentPaste:el('documentPaste'),analyzePaste:el('analyzePaste'),sourceStatus:el('sourceStatus'),sourceTitle:el('sourceTitle'),structureReadout:el('structureReadout'),codeStage:el('codeStage'),lessonTitle:el('lessonTitle'),stepCounter:el('stepCounter'),lessonIndex:el('lessonIndex'),stepTitle:el('stepTitle'),stepExplain:el('stepExplain'),stepWhy:el('stepWhy'),stepConcepts:el('stepConcepts'),lessonCard:el('lessonCard'),checkCard:el('checkCard'),checkQuestion:el('checkQuestion'),checkAnswer:el('checkAnswer'),revealAnswer:el('revealAnswer'),pet:el('pet'),petBubble:el('petBubble'),prevStep:el('prevStep'),nextStep:el('nextStep'),clearButton:el('clearButton'),unclearButton:el('unclearButton'),graph:el('graph'),graphReadout:el('graphReadout'),conceptTitle:el('conceptTitle'),conceptExplanation:el('conceptExplanation'),evidenceStack:el('evidenceStack'),memoryStats:el('memoryStats'),soundToggle:el('soundToggle'),themeButton:el('themeButton'),resetMemory:el('resetMemory'),memoryReadout:el('memoryReadout'),footerStatus:el('footerStatus')};
function loadMemory(){try{const raw=localStorage.getItem('klAtlasMemory.v1');return raw?JSON.parse(raw):{concepts:{},strategies:{},sessions:0}}catch{return{concepts:{},strategies:{},sessions:0}}}function saveMemory(){localStorage.setItem('klAtlasMemory.v1',JSON.stringify(state.memory));refs.memoryReadout.textContent=`${Object.keys(state.memory.concepts||{}).length} remembered concepts`}function escapeHtml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsText(file)})}function pulseAt(x,y){document.documentElement.style.setProperty('--pulse-x',`${Math.round(x/innerWidth*100)}%`);document.documentElement.style.setProperty('--pulse-y',`${Math.round(y/innerHeight*100)}%`)}function sound(kind='click'){if(!state.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!sound.ctx)sound.ctx=new A;const c=sound.ctx,o=c.createOscillator(),g=c.createGain(),n=c.currentTime,p={click:[260,.025,.028],next:[430,.055,.04],clear:[620,.09,.045],unclear:[170,.09,.035],node:[350,.04,.03]}[kind]||[260,.03,.03];o.type=kind==='unclear'?'triangle':'sine';o.frequency.setValueAtTime(p[0],n);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(p[2],n+.006);g.gain.exponentialRampToValueAtTime(.0001,n+p[1]);o.connect(g).connect(c.destination);o.start(n);o.stop(n+p[1]+.01)}catch{}}
