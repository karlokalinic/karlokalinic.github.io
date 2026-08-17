'use strict';
(() => {
  const root = document.getElementById('personalWorkspace');
  if (!root) return;

  const $ = id => document.getElementById(id);
  const refs = {
    owner:$('wsOwner'), repo:$('wsRepo'), branch:$('wsBranch'), token:$('wsToken'), connect:$('wsConnect'), remote:$('wsRemoteStatus'),
    newScript:$('wsNewScript'), newLore:$('wsNewLore'), assetInput:$('wsAssetInput'), assetButton:$('wsAssetButton'), library:$('wsLibrary'),
    fileName:$('wsFileName'), fileKind:$('wsFileKind'), editor:$('wsEditor'), lineRail:$('wsLineRail'), ghost:$('wsGhost'),
    save:$('wsSave'), tests:$('wsTests'), analyze:$('wsAnalyze'), initModel:$('wsInitModel'), preview:$('wsPreview'),
    typed:$('wsTyped'), pasteCount:$('wsPasteCount'), dirty:$('wsDirty'), concepts:$('wsConcepts'), suggestions:$('wsSuggestions'),
    graph:$('wsGraph'), inspector:$('wsInspector'), inspectorTitle:$('wsInspectorTitle'), inspectorBody:$('wsInspectorBody'), inspectorPath:$('wsInspectorPath'),
    pet:$('wsPet'), petSpeech:$('wsPetSpeech'), petHabitat:$('wsPetHabitat'), petEyes:[...root.querySelectorAll('.ws-pet-eye')]
  };
  if (!refs.editor || !refs.library || !refs.graph) return;

  const WORKSPACE_ROOT = 'workspace';
  const MANIFEST_PATH = `${WORKSPACE_ROOT}/manifest.json`;
  const MAX_ASSET_BYTES = 4 * 1024 * 1024;
  const PAUK_PIN = '30b884361bf690c8ae3982aaaaf378dcb65de2f4';
  const PAUK = [
    {id:'pauk-input',title:'Pauktunel · GameInput',concepts:['input','interaction'],path:'Assets/Scripts/Assembly-CSharp/GameInput.cs'},
    {id:'pauk-player',title:'Pauktunel · PlayerMovement',concepts:['movement','physics','input'],path:'Assets/Scripts/Assembly-CSharp/PlayerMovement.cs'},
    {id:'pauk-grab',title:'Pauktunel · grabManager',concepts:['interaction','physics','ownership'],path:'Assets/Scripts/Assembly-CSharp/grabManager.cs'},
    {id:'pauk-flow',title:'Pauktunel · linearHost',concepts:['orchestration','scene','animation','audio'],path:'Assets/Scripts/Assembly-CSharp/linearHost.cs'},
    {id:'pauk-spider',title:'Pauktunel · spider evidence',concepts:['enemy','animation','trigger'],path:'Assets/Scripts/Assembly-CSharp/cliffspiderTrigger.cs'},
    {id:'pauk-look',title:'Pauktunel · post profile',concepts:['lighting','rendering'],path:'Assets/MonoBehaviour/post processing Profile.asset'}
  ];

  const UNITY_WORDS = [
    'Awake','Start','Update','FixedUpdate','LateUpdate','Init','MonoBehaviour','GameObject','Transform','Vector2','Vector3','Quaternion',
    'CharacterController','Rigidbody','Collider','Animator','AudioSource','Camera','Light','Mathf','Time','InputAction','Keyboard.current','Mouse.current',
    'Physics.Raycast','GetComponent','TryGetComponent','SerializeField','SceneManager.LoadScene','NavMeshAgent','SetTrigger','SetBool','isKinematic'
  ];

  const CONCEPT_RULES = [
    ['input',/Keyboard\.current|Mouse\.current|InputAction|GameInput|KeyCode|InputSystem/i],
    ['movement',/CharacterController|Rigidbody|MovePosition|\.Move\s*\(|transform\.(position|Translate)|\bspeed\b/i],
    ['camera',/\bCamera\b|\byaw\b|\bpitch\b|lookSpeed|Mouse\.current/i],
    ['physics',/Rigidbody|Collider|CharacterController|OnCollision|OnTrigger|Physics\.|isKinematic/i],
    ['interaction',/Interact|Raycast|grab|pickup|useKey|OnTrigger/i],
    ['animation',/Animator|AnimationClip|SetTrigger|SetBool|CrossFade|\.Play\s*\(/i],
    ['audio',/AudioSource|AudioClip|PlayOneShot|spatialBlend|\.Play\s*\(/i],
    ['lighting',/\bLight\b|RenderSettings|PostProcess|Volume|vignette|ambient/i],
    ['rendering',/Material|Shader|RenderTexture|PostProcess|Volume|Graphics/i],
    ['enemy',/NavMeshAgent|enemy|spider|chase|target|aggro/i],
    ['scene',/SceneManager|LoadScene|sceneLoaded|DontDestroyOnLoad/i],
    ['orchestration',/IEnumerator|Coroutine|StartCoroutine|WaitForSeconds|sequence|timeline/i],
    ['ownership',/SetParent|\.parent\s*=|isKinematic|Instantiate|Destroy/i],
    ['trigger',/OnTriggerEnter|OnTriggerExit|OnTriggerStay|Collider/i],
    ['state',/\benum\b|\bstate\b|\bbool\b|switch\s*\(/i]
  ];

  const LORE_SYNONYMS = {
    spider:['spider','pauk','enemy','neprijatelj','creature','stvorenje'],
    light:['light','svjetlo','lamp','flashlight','baterija','lighting'],
    sound:['sound','zvuk','audio','noise','buka','ambience','ambijent'],
    door:['door','vrata','hatch','airlock'],
    sample:['sample','uzorak','grab','pickup','predmet'],
    camera:['camera','kamera','pogled','vision','look'],
    movement:['movement','kretanje','hodanje','walk','move'],
    fear:['fear','strah','dread','paranoia','paranoja'],
    cold:['cold','hladnoća','zima','winter','snow','snijeg'],
    water:['water','voda','river','rijeka','prud']
  };

  const state = {
    token:null, owner:'karlokalinic', repo:'GIT', branch:'workspace-live', connected:false,
    manifest:{schema:'kl-atlas-workspace/1',workspace:'KARLOLEGEND PERSONAL WORKSPACE',entries:[]}, manifestSha:null,
    entries:[], current:null, currentSha:null, dirty:false, typedKeys:0, blockedPaste:0, analysis:null,
    cache:new Map(), lastActivity:Date.now(), lastSuggestionFingerprint:'', preview:{x:2.2,z:2.2,yaw:0}, previewKeys:new Set()
  };

  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const safeName = value => String(value || '').trim().replace(/[^A-Za-z0-9._ -]+/g,'-').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^[-.]+|[-.]+$/g,'').slice(0,100);
  const isCodeKind = () => (refs.fileKind?.value || 'script') === 'script';

  function utf8ToBase64(text){
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const chunk = 0x8000;
    for(let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(binary);
  }
  function base64ToUtf8(value){
    const binary = atob(String(value || '').replace(/\n/g,''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function bytesToBase64(buffer){
    const bytes = new Uint8Array(buffer);
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(binary);
  }

  function setRemote(text, mode='idle'){
    refs.remote.textContent = text;
    refs.remote.classList.toggle('is-online', mode==='online');
    refs.remote.classList.toggle('is-error', mode==='error');
  }

  async function gh(path, options={}){
    if (!state.token) throw new Error('No session token.');
    const headers = {
      'Accept':'application/vnd.github+json',
      'Authorization':`Bearer ${state.token}`,
      'X-GitHub-Api-Version':'2022-11-28',
      ...(options.headers || {})
    };
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}${path}`, {...options, headers});
    if (!response.ok){
      let detail='';
      try{ const body=await response.json(); detail=body.message || ''; }catch{}
      throw new Error(`${response.status} ${detail || response.statusText}`.trim());
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function getRemoteFile(path){
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return gh(`/contents/${encoded}?ref=${encodeURIComponent(state.branch)}`);
  }

  async function putRemoteFile(path, base64Content, message, sha=null){
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const body = {message,content:base64Content,branch:state.branch};
    if (sha) body.sha = sha;
    return gh(`/contents/${encoded}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }

  async function loadManifest(){
    const file = await getRemoteFile(MANIFEST_PATH);
    const manifest = JSON.parse(base64ToUtf8(file.content));
    if (!Array.isArray(manifest.entries)) manifest.entries=[];
    state.manifest = manifest;
    state.manifestSha = file.sha;
    state.entries = manifest.entries;
    renderLibrary();
    analyzeAndRender();
  }

  async function saveManifestEntry(entry){
    let latest;
    try{
      const file = await getRemoteFile(MANIFEST_PATH);
      latest = JSON.parse(base64ToUtf8(file.content));
      latest.entries = Array.isArray(latest.entries) ? latest.entries : [];
      state.manifestSha = file.sha;
    }catch{
      latest = {schema:'kl-atlas-workspace/1',workspace:'KARLOLEGEND PERSONAL WORKSPACE',entries:[]};
      state.manifestSha = null;
    }
    const idx = latest.entries.findIndex(x => x.path === entry.path);
    if (idx >= 0) latest.entries[idx] = {...latest.entries[idx],...entry}; else latest.entries.push(entry);
    latest.updatedAt = new Date().toISOString();
    const result = await putRemoteFile(MANIFEST_PATH, utf8ToBase64(JSON.stringify(latest,null,2)+'\n'), `workspace: index ${entry.name}`, state.manifestSha);
    state.manifestSha = result.content?.sha || null;
    state.manifest = latest;
    state.entries = latest.entries;
  }

  async function connectRemote(){
    const token = refs.token.value.trim();
    if (!token){
      setRemote('TOKEN NEEDED / TREBA TOKEN','error');
      petSay('I can guard the notebook, but I need the little GitHub key first. / Treba mi mali GitHub ključ.', 'worried');
      return;
    }
    state.owner = refs.owner.value.trim() || 'karlokalinic';
    state.repo = refs.repo.value.trim() || 'GIT';
    state.branch = refs.branch.value.trim() || 'workspace-live';
    state.token = token;
    refs.token.value='';
    setRemote('CONNECTING… / SPAJAM…');
    refs.connect.disabled=true;
    try{
      const repo = await gh('');
      if (!repo.private) throw new Error('Workspace target must be private.');
      await loadManifest();
      state.connected=true;
      setRemote(`PRIVATE CLOUD · ${state.owner}/${state.repo}@${state.branch}`,'online');
      petSay('I found our notebook! I will sit on the branch and watch your letters. / Našla sam bilježnicu! Čuvam granu i gledam slova.', 'excited');
    }catch(error){
      state.connected=false;
      state.token=null;
      setRemote(`OFFLINE · ${error.message}`,'error');
      petSay('I could not reach the notebook. Tiny sad ears. / Ne mogu do bilježnice. Male tužne uši.', 'worried');
    }finally{ refs.connect.disabled=false; }
  }

  function defaultName(kind){
    if (kind==='lore') return `Lore-${new Date().toISOString().slice(0,10)}.md`;
    return 'NewBehaviour.cs';
  }

  function newDocument(kind){
    refs.fileKind.value = kind;
    refs.fileName.value = defaultName(kind);
    refs.editor.value='';
    state.current={kind,name:refs.fileName.value,path:null};
    state.currentSha=null;
    state.dirty=false;
    state.typedKeys=0;
    state.blockedPaste=0;
    updateAuthorship();
    updateLineRail();
    analyzeAndRender();
    refs.editor.focus();
    petSay(kind==='script' ? 'Empty page. I will not type it for you. I will just point. / Prazna stranica. Neću tipkati umjesto tebe. Samo pokazujem.' : 'Lore book open. Tell me what exists in your world. / Knjiga lore-a je otvorena. Reci mi što postoji u tvom svijetu.', 'happy');
  }

  function entryPath(kind,name){
    const clean = safeName(name) || defaultName(kind);
    return `${WORKSPACE_ROOT}/${kind==='lore'?'lore':'scripts'}/${clean}`;
  }

  async function openEntry(entry){
    if (!state.connected) return;
    state.current=entry;
    refs.fileName.value=entry.name;
    refs.fileKind.value=entry.kind==='lore'?'lore':'script';
    [...refs.library.querySelectorAll('.ws-entry')].forEach(el=>el.classList.toggle('is-active',el.dataset.path===entry.path));
    if (entry.kind==='asset'){
      refs.inspectorTitle.textContent=entry.name;
      refs.inspectorPath.textContent=entry.path;
      refs.inspectorBody.innerHTML=`<p>REMOTE ASSET / UDALJENI ASSET</p><p>${esc(entry.mime || 'unknown')} · ${Number(entry.size||0).toLocaleString()} B</p><p>Concept links come from the filename and your manifest, never from AI.</p>`;
      petSay('Asset spotted. I can connect its name and tags, but I will not pretend I can see inside a binary I did not parse. / Asset je tu. Spajam ime i oznake, ali ne izmišljam sadržaj binarne datoteke.', 'happy');
      return;
    }
    setRemote('LOADING FILE… / UČITAVAM…','online');
    try{
      const file = await getRemoteFile(entry.path);
      const text = base64ToUtf8(file.content);
      refs.editor.value=text;
      state.cache.set(entry.path,text);
      state.currentSha=file.sha;
      state.dirty=false;
      state.typedKeys=0;
      updateLineRail();
      updateAuthorship();
      analyzeAndRender();
      setRemote(`PRIVATE CLOUD · ${state.owner}/${state.repo}@${state.branch}`,'online');
    }catch(error){ setRemote(`LOAD FAILED · ${error.message}`,'error'); }
  }

  async function saveCurrent(){
    if (!state.connected){
      petSay('Remote notebook first, then save. / Prvo udaljena bilježnica, onda spremanje.', 'worried');
      return;
    }
    const kind = refs.fileKind.value;
    if (kind==='asset') return;
    const name = safeName(refs.fileName.value);
    if (!name){ petSay('This page needs a name. / Ova stranica treba ime.', 'worried'); return; }
    const path = state.current?.path || entryPath(kind,name);
    refs.save.disabled=true;
    setRemote('COMMITTING… / COMMITAM…','online');
    try{
      let sha = state.current?.path===path ? state.currentSha : null;
      if (!sha){ try{ sha=(await getRemoteFile(path)).sha; }catch{} }
      const text=refs.editor.value;
      const analysis=analyzeText(text,name,kind);
      const result=await putRemoteFile(path,utf8ToBase64(text),`workspace: save ${name}`,sha);
      const entry={
        id:state.current?.id || `entry-${Date.now().toString(36)}`,
        kind,name,path,sha:result.content?.sha || null,updatedAt:new Date().toISOString(),
        typedKeys:state.typedKeys,concepts:analysis.concepts,symbols:analysis.symbols,summary:analysis.summary
      };
      await saveManifestEntry(entry);
      state.current=entry;
      state.currentSha=entry.sha;
      state.cache.set(path,text);
      state.dirty=false;
      renderLibrary(); updateAuthorship(); renderGraph();
      setRemote(`SAVED · ${path}`,'online');
      petSay('COMMIT! I put a tiny paw on it. It exists outside this browser now. / COMMIT! Stavila sam šapicu. Sad postoji izvan ovog browsera.', 'excited');
    }catch(error){
      setRemote(`SAVE FAILED · ${error.message}`,'error');
      petSay('The save fell over. I am sitting next to it until you fix the connection. / Spremanje je palo. Sjedim kraj njega dok ne popraviš vezu.', 'worried');
    }finally{ refs.save.disabled=false; }
  }

  async function uploadAsset(file){
    if (!file) return;
    if (!state.connected){ petSay('Connect the private notebook before giving me assets. / Spoji privatnu bilježnicu prije asseta.', 'worried'); return; }
    if (file.size > MAX_ASSET_BYTES){
      petSay('That one is too heavy for my tiny backpack: 4 MB max here. / To mi je preteško za mali ruksak: ovdje najviše 4 MB.', 'worried');
      return;
    }
    const name=`${Date.now().toString(36)}-${safeName(file.name) || 'asset.bin'}`;
    const path=`${WORKSPACE_ROOT}/assets/${name}`;
    setRemote('UPLOADING ASSET… / ŠALJEM ASSET…','online');
    try{
      const base64=bytesToBase64(await file.arrayBuffer());
      const result=await putRemoteFile(path,base64,`workspace: add asset ${file.name}`);
      const analysis=analyzeAsset(file.name,file.type);
      const entry={id:`asset-${Date.now().toString(36)}`,kind:'asset',name:file.name,path,sha:result.content?.sha||null,mime:file.type||'application/octet-stream',size:file.size,updatedAt:new Date().toISOString(),concepts:analysis.concepts,symbols:[]};
      await saveManifestEntry(entry);
      renderLibrary(); renderGraph();
      setRemote(`ASSET SAVED · ${path}`,'online');
      petSay('I carried it! Very carefully. / Prenijela sam ga! Jako pažljivo.', 'excited');
    }catch(error){ setRemote(`ASSET FAILED · ${error.message}`,'error'); petSay('Dropped the box. Sorry. / Ispala mi je kutija. Oprosti.', 'worried'); }
    refs.assetInput.value='';
  }

  function loreConcepts(text){
    const lower=text.toLowerCase();
    const found=[];
    for(const [concept,words] of Object.entries(LORE_SYNONYMS)) if(words.some(w=>lower.includes(w))) found.push(concept);
    return found;
  }

  function extractSymbols(text){
    const set=new Set();
    for(const m of text.matchAll(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/g)) set.add(m[1]);
    for(const m of text.matchAll(/\b(?:void|bool|int|float|string|Vector[23]|IEnumerator)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) set.add(m[1]);
    for(const m of text.matchAll(/\b(?:public|private|protected|internal)?\s*(?:static\s+)?([A-Z][A-Za-z0-9_]*)\s+([a-zA-Z_][A-Za-z0-9_]*)\s*[;=]/g)){ set.add(m[1]); set.add(m[2]); }
    return [...set].slice(0,40);
  }

  function analyzeAsset(name,mime=''){
    const text=`${name} ${mime}`;
    const concepts=new Set(loreConcepts(text));
    if(/png|jpg|jpeg|webp|texture|material/i.test(text)) concepts.add('rendering');
    if(/wav|ogg|mp3|audio|sound/i.test(text)) concepts.add('audio');
    if(/anim|fbx|model|glb|gltf/i.test(text)) concepts.add('animation');
    if(/spider|enemy|pauk/i.test(text)) concepts.add('enemy');
    return {concepts:[...concepts]};
  }

  function analyzeText(text,name,kind){
    const concepts=new Set();
    if(kind==='lore') loreConcepts(text).forEach(c=>concepts.add(c));
    for(const [concept,rx] of CONCEPT_RULES) if(rx.test(text)) concepts.add(concept);
    const symbols=kind==='script'?extractSymbols(text):[];
    const suggestions=[];
    const add=(severity,rule,textValue)=>suggestions.push({severity,rule,text:textValue});

    if(kind==='script'){
      if(/Mouse\.current|\byaw\b|\bpitch\b/i.test(text) && !/Mathf\.Clamp|Clamp\s*\(/i.test(text)) add('warn','CAMERA-PITCH-001','You have look input but no visible pitch clamp. Test what happens when the camera passes vertical. / Imaš look input, ali ne vidim clamp za pitch. Testiraj prelazak preko vertikale.');
      if(/Rigidbody/i.test(text) && /MovePosition|AddForce|velocity/i.test(text) && /void\s+Update\s*\(/i.test(text) && !/void\s+FixedUpdate\s*\(/i.test(text)) add('warn','PHYSICS-TICK-001','Rigidbody motion appears next to Update(). Verify whether the physics write belongs in FixedUpdate(). / Rigidbody pomak je uz Update(). Provjeri treba li fizički upis ići u FixedUpdate().');
      if(/void\s+Update\s*\([^)]*\)[\s\S]{0,800}GetComponent\s*</i.test(text)) add('warn','CACHE-001','GetComponent appears inside Update(). Cache stable references in Awake/Start unless the component genuinely changes. / GetComponent je unutar Update(). Stabilnu referencu spremi u Awake/Start osim ako se stvarno mijenja.');
      if(/void\s+Update\s*\([^)]*\)[\s\S]{0,800}Find(Object|FirstObject|AnyObject)/i.test(text)) add('warn','SEARCH-LOOP-001','Scene search appears in Update(). Repeated global lookup is usually the wrong runtime contract. / Pretraga scene je u Update(). Ponavljani globalni lookup obično je pogrešan runtime ugovor.');
      if(/Animator\.Set(?:Trigger|Bool|Float|Integer)\s*\(\s*"/i.test(text)) add('tip','ANIM-HASH-001','Animator parameter names are string literals. Later, consider Animator.StringToHash so spelling becomes centralized. / Animator parametri su stringovi. Kasnije razmisli o StringToHash radi centraliziranog pravopisa.');
      if(/Keyboard\.current|Mouse\.current/i.test(text)){
        const otherInput=state.entries.filter(e=>e.kind==='script' && e.path!==state.current?.path && (e.concepts||[]).includes('input')).length;
        if(otherInput>0) add('tip','INPUT-BOUNDARY-002',`Your corpus already has ${otherInput} other input-related script(s). Decide whether device reads belong behind one shared input vocabulary. / Korpus već ima ${otherInput} drugih input skripti. Odluči trebaju li čitanja uređaja iza jednog input rječnika.`);
      }
      if(/transform\.position\s*[+\-]?=|transform\.Translate/i.test(text) && /Collider|Rigidbody|CharacterController/i.test(text)===false) add('tip','MOVEMENT-CONTRACT-003','Transform movement is visible, but no collision owner is visible in this script. Decide explicitly who is allowed to reject movement. / Vidim Transform kretanje, ali ne i vlasnika kolizije. Eksplicitno odluči tko smije odbiti pomak.');
      if((concepts.has('movement')||concepts.has('camera')||concepts.has('state')) && !/\bInit\s*\(|\bReset\s*\(/i.test(text)) add('tip','RESET-TEST-001','This script owns mutable runtime state but exposes no obvious reset/init seam. A deterministic reset makes experiments repeatable. / Skripta drži promjenjivo runtime stanje, ali nema jasan reset/init. Deterministički reset čini pokuse ponovljivima.');
      if(/SceneManager\.LoadScene/i.test(text)) add('tip','SCENE-PROOF-001','Scene transition detected. Your proof should include the built player, not only Editor Play Mode. / Otkriven prijelaz scene. Dokaz treba uključiti buildani player, ne samo Editor Play Mode.');
      if(text.trim() && !/\bclass\s+[A-Za-z_]/.test(text) && /\.cs$/i.test(name)) add('warn','CS-CLASS-001','This is named like a C# file but no class declaration is visible yet. / Datoteka izgleda kao C#, ali još ne vidim deklaraciju klase.');
      if(!text.trim()) add('tip','BLANK-001','Start with the smallest contract you can test. I can show words, but I will not insert a skeleton. / Počni najmanjim ugovorom koji možeš testirati. Mogu pokazati riječi, ali neću umetnuti kostur.');
    } else {
      const loreMatches=[];
      for(const entry of state.entries){
        if(entry.kind!=='script') continue;
        const shared=(entry.concepts||[]).filter(c=>concepts.has(c));
        if(shared.length) loreMatches.push(`${entry.name}: ${shared.join(', ')}`);
      }
      if(loreMatches.length) add('tip','LORE-BRIDGE-001',`Lore already touches code: ${loreMatches.slice(0,3).join(' · ')}. / Lore već dodiruje kod: ${loreMatches.slice(0,3).join(' · ')}`);
      if(text.trim() && concepts.size===0) add('tip','LORE-TAGS-001','I found no known systems yet. Name concrete things, actions, places or rules; deterministic links need shared words or concepts. / Još nisam našla poznate sustave. Imenuj konkretne stvari, radnje, mjesta ili pravila; determinističke veze trebaju zajedničke pojmove.');
    }

    const paukMatches=PAUK.filter(p=>p.concepts.some(c=>concepts.has(c)));
    if(paukMatches.length) add('tip','PAUK-BRIDGE-001',`Closest Pauktunel evidence: ${paukMatches.slice(0,3).map(p=>p.title.replace('Pauktunel · ','')).join(', ')}. This is a concept match, not a claim that your implementation is identical. / Najbliži Pauktunel dokaz: ${paukMatches.slice(0,3).map(p=>p.title.replace('Pauktunel · ','')).join(', ')}. To je podudaranje koncepta, ne tvrdnja da je implementacija ista.`);

    const summary = concepts.size ? `${[...concepts].slice(0,5).join(' · ')}` : (text.trim()?'unclassified':'blank');
    return {concepts:[...concepts],symbols,suggestions,summary,paukMatches};
  }

  function updateLineRail(){
    const lines=Math.max(1,refs.editor.value.split('\n').length);
    refs.lineRail.textContent=Array.from({length:lines},(_,i)=>String(i+1)).join('\n');
    refs.lineRail.scrollTop=refs.editor.scrollTop;
  }

  function updateAuthorship(){
    refs.typed.textContent=`${state.typedKeys} KEYS / TIPKI`;
    refs.pasteCount.textContent=`${state.blockedPaste} BLOCKED / BLOKIRANO`;
    refs.dirty.textContent=state.dirty?'UNSAVED / NIJE SPREMLJENO':'CLEAN / ČISTO';
    refs.dirty.classList.toggle('typed',state.dirty);
  }

  function updateGhost(){
    if(!isCodeKind()){ refs.ghost.hidden=true; return; }
    const caret=refs.editor.selectionStart || 0;
    const before=refs.editor.value.slice(0,caret);
    const match=before.match(/([A-Za-z_][A-Za-z0-9_.]*)$/);
    if(!match || match[1].length<2){ refs.ghost.hidden=true; return; }
    const prefix=match[1].toLowerCase();
    const corpusWords=state.entries.flatMap(e=>e.symbols||[]);
    const all=[...new Set([...UNITY_WORDS,...corpusWords])];
    const candidate=all.find(w=>w.toLowerCase().startsWith(prefix) && w.toLowerCase()!==prefix);
    if(!candidate){ refs.ghost.hidden=true; return; }
    refs.ghost.innerHTML=`<strong>READ-ONLY COMPLETION / SAMO PRIJEDLOG</strong><code>${esc(candidate)}</code><small>I will never insert it. Type every character yourself. / Nikad ga neću umetnuti. Upiši svaki znak sam.</small>`;
    refs.ghost.hidden=false;
  }

  function renderConcepts(analysis){
    if(!analysis.concepts.length){ refs.concepts.innerHTML='<span class="ws-empty">NO CONCEPTS YET / JOŠ NEMA KONCEPATA</span>'; return; }
    refs.concepts.innerHTML=analysis.concepts.map(c=>`<span class="ws-concept" data-source="${refs.fileKind.value==='lore'?'lore':'script'}">${esc(c)}</span>`).join('');
  }

  function renderSuggestions(analysis){
    if(!analysis.suggestions.length){ refs.suggestions.innerHTML='<li>Nothing deterministic to flag yet. Keep the contract small and observable. / Još nema determinističkog upozorenja. Drži ugovor malenim i vidljivim.<span class="ws-rule">CLEAR-000</span></li>'; return; }
    refs.suggestions.innerHTML=analysis.suggestions.map(s=>`<li><b>${s.severity.toUpperCase()}</b> · ${esc(s.text)}<span class="ws-rule">${esc(s.rule)}</span></li>`).join('');
    const fp=analysis.suggestions.map(s=>s.rule).join('|');
    if(fp && fp!==state.lastSuggestionFingerprint){ state.lastSuggestionFingerprint=fp; petSay('I found a thread! I am pointing, not writing. / Našla sam nit! Pokazujem, ne pišem.', 'happy'); }
  }

  function analyzeAndRender(){
    const analysis=analyzeText(refs.editor.value,refs.fileName.value,refs.fileKind.value);
    state.analysis=analysis;
    renderConcepts(analysis); renderSuggestions(analysis); renderTests(analysis); renderGraph(); updateGhost();
  }

  function renderTests(analysis){
    const tests=[];
    const kind=refs.fileKind.value;
    if(kind==='script'){
      tests.push({state:refs.editor.value.trim()?'pass':'fail',label:'SOURCE EXISTS',text:refs.editor.value.trim()?'Code has manually editable source.':'Type at least one character.'});
      tests.push({state:/\.cs$/i.test(refs.fileName.value)?(/\bclass\s+[A-Za-z_]/.test(refs.editor.value)?'pass':'warn'):'pass',label:'C# SHAPE',text:/\.cs$/i.test(refs.fileName.value)?'Class declaration check for .cs files.':'Non-.cs filename; C# class rule skipped.'});
      if(analysis.concepts.includes('camera')) tests.push({state:/Mathf\.Clamp|Clamp\s*\(/i.test(refs.editor.value)?'pass':'warn',label:'LOOK LIMIT',text:'Camera/look code benefits from an explicit pitch limit test.'});
      if(analysis.concepts.includes('movement')) tests.push({state:/CharacterController|Rigidbody|Collider/i.test(refs.editor.value)?'pass':'warn',label:'COLLISION OWNER',text:'Who is allowed to reject requested movement?'});
      tests.push({state:state.connected?'pass':'warn',label:'REMOTE PROVENANCE',text:state.connected?'GitHub workspace session is connected.':'Not connected; code is not remotely durable yet.'});
    }else{
      tests.push({state:refs.editor.value.trim()?'pass':'warn',label:'LORE BODY',text:'Write concrete nouns/actions/rules to create deterministic links.'});
      tests.push({state:analysis.concepts.length?'pass':'warn',label:'LINKABLE TERMS',text:`${analysis.concepts.length} recognized concept(s).`});
    }
    refs.tests.innerHTML=tests.map(t=>`<div class="ws-test ${t.state}"><b>${t.state.toUpperCase()}</b>${esc(t.label)} — ${esc(t.text)}</div>`).join('');
  }

  function renderLibrary(){
    if(!state.entries.length){ refs.library.innerHTML='<div class="ws-empty">Remote workspace is empty. Create a script, lore page or asset. / Udaljeni workspace je prazan. Napravi skriptu, lore stranicu ili asset.</div>'; return; }
    refs.library.innerHTML=[...state.entries].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).map(e=>`<button class="ws-entry${state.current?.path===e.path?' is-active':''}" data-kind="${esc(e.kind)}" data-path="${esc(e.path)}"><b>${esc(e.name)}</b><span>${esc(e.kind.toUpperCase())} · ${(e.concepts||[]).slice(0,3).map(esc).join(' · ') || 'UNCLASSIFIED'}</span></button>`).join('');
    refs.library.querySelectorAll('.ws-entry').forEach(btn=>btn.addEventListener('click',()=>{const e=state.entries.find(x=>x.path===btn.dataset.path); if(e) openEntry(e);}));
  }

  function graphData(){
    const entries=state.entries.slice(0,12);
    if(state.current && state.current.path==null){
      const a=state.analysis||analyzeText(refs.editor.value,refs.fileName.value,refs.fileKind.value);
      entries.unshift({id:'draft',kind:refs.fileKind.value,name:`DRAFT · ${refs.fileName.value||'untitled'}`,path:'UNSAVED',concepts:a.concepts});
    }
    const conceptSet=new Set(entries.flatMap(e=>e.concepts||[]));
    const concepts=[...conceptSet].slice(0,12);
    const refsPauk=PAUK.filter(p=>p.concepts.some(c=>conceptSet.has(c))).slice(0,8);
    return {entries,concepts,refsPauk};
  }

  function renderGraph(){
    const svg=refs.graph;
    const {entries,concepts,refsPauk}=graphData();
    const width=900,height=380;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    if(!entries.length){ svg.innerHTML='<text x="30" y="50" font-family="Courier New" font-size="13">NO REMOTE CORPUS YET / JOŠ NEMA UDALJENOG KORPUSA</text>'; return; }
    const nodeMap=new Map();
    const yFor=(i,total)=>55+(height-90)*(total<=1?.5:i/(total-1));
    entries.forEach((e,i)=>nodeMap.set(`e:${e.id||e.path}`,{x:105,y:yFor(i,entries.length),w:190,h:30,label:e.name,type:`entry-${e.kind}`,data:e}));
    concepts.forEach((c,i)=>nodeMap.set(`c:${c}`,{x:450,y:yFor(i,concepts.length),w:145,h:28,label:c,type:'concept',data:{kind:'concept',name:c}}));
    refsPauk.forEach((p,i)=>nodeMap.set(`p:${p.id}`,{x:755,y:yFor(i,refsPauk.length),w:210,h:30,label:p.title,type:'reference',data:{kind:'reference',name:p.title,path:p.path,concepts:p.concepts}}));
    const edges=[];
    for(const e of entries) for(const c of e.concepts||[]) if(nodeMap.has(`c:${c}`)) edges.push([`e:${e.id||e.path}`,`c:${c}`,'strong']);
    for(const p of refsPauk) for(const c of p.concepts) if(nodeMap.has(`c:${c}`)) edges.push([`c:${c}`,`p:${p.id}`,'']);
    let html='';
    for(const [a,b,strong] of edges){const A=nodeMap.get(a),B=nodeMap.get(b);html+=`<line class="edge ${strong}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"></line>`;}
    for(const [id,n] of nodeMap){html+=`<g class="node ${n.type}" data-node="${esc(id)}" transform="translate(${n.x-n.w/2},${n.y-n.h/2})"><rect width="${n.w}" height="${n.h}"></rect><text x="8" y="${n.h/2+4}">${esc(String(n.label).slice(0,30))}</text></g>`;}
    svg.innerHTML=html;
    svg.querySelectorAll('.node').forEach(node=>node.addEventListener('click',()=>inspectGraphNode(nodeMap.get(node.dataset.node)?.data)));
  }

  function inspectGraphNode(data){
    if(!data) return;
    refs.inspectorTitle.textContent=data.name||'NODE';
    refs.inspectorPath.textContent=data.path||'';
    if(data.kind==='concept'){
      const own=state.entries.filter(e=>(e.concepts||[]).includes(data.name)).map(e=>e.name);
      const pauk=PAUK.filter(p=>p.concepts.includes(data.name)).map(p=>p.title);
      refs.inspectorBody.innerHTML=`<p><b>CONCEPT / KONCEPT:</b> ${esc(data.name)}</p><p>Your corpus / Tvoj korpus: ${esc(own.join(', ')||'—')}</p><p>Pauktunel evidence / dokaz: ${esc(pauk.join(', ')||'—')}</p><p>This edge exists because both sides were classified by explicit vocabulary rules.</p>`;
    }else if(data.kind==='reference'){
      refs.inspectorBody.innerHTML=`<p>Pinned Pauktunel reference at <code>${PAUK_PIN.slice(0,12)}…</code>.</p><p>Concepts: ${esc((data.concepts||[]).join(', '))}</p><p>It is a teaching comparison, not copied source.</p>`;
    }else{
      refs.inspectorBody.innerHTML=`<p><b>${esc(String(data.kind||'entry').toUpperCase())}</b></p><p>Concepts: ${esc((data.concepts||[]).join(', ')||'unclassified')}</p><p>${esc(data.summary||'')}</p>`;
    }
  }

  function petMoveRandom(){
    if(!refs.petHabitat || !refs.pet) return;
    const max=Math.max(10,refs.petHabitat.clientWidth-72);
    const x=Math.round(8+Math.random()*(max-8));
    refs.pet.style.setProperty('--pet-x',`${x}px`);
  }
  function petSay(text,mood='happy'){
    state.lastActivity=Date.now();
    refs.petSpeech.textContent=text;
    refs.pet.classList.remove('is-happy','is-excited','is-worried','is-sleeping');
    refs.pet.classList.add(`is-${mood}`);
    petMoveRandom();
    if(mood==='happy') refs.pet.classList.add('is-happy');
    setTimeout(()=>{if(Date.now()-state.lastActivity>1200) refs.pet.classList.remove('is-excited','is-worried','is-happy');},1400);
  }

  setInterval(()=>{
    const idle=Date.now()-state.lastActivity;
    if(idle>45000){ refs.pet.classList.add('is-sleeping'); refs.petSpeech.textContent='zz… I am still here. / još sam tu.'; }
    else if(idle>6000){ refs.pet.classList.remove('is-sleeping'); petMoveRandom(); }
  },4500);

  refs.petHabitat?.addEventListener('pointermove',e=>{
    const r=refs.petHabitat.getBoundingClientRect();
    const dx=clamp((e.clientX-(r.left+r.width/2))/r.width*4,-2,2);
    const dy=clamp((e.clientY-(r.top+r.height/2))/r.height*3,-1.5,1.5);
    refs.petEyes.forEach(eye=>eye.style.transform=`translate(${dx}px,${dy}px)`);
  });
  refs.petHabitat?.addEventListener('pointerleave',()=>refs.petEyes.forEach(eye=>eye.style.transform=''));

  function blockCheat(event,label){
    event.preventDefault();
    state.blockedPaste++;
    updateAuthorship();
    petSay(`${label}: nope 🥺. Read it, then type it. / ${label}: neee 🥺. Pročitaj pa upiši.`, 'worried');
    refs.editor.classList.add('ws-flash'); setTimeout(()=>refs.editor.classList.remove('ws-flash'),450);
  }

  refs.editor.addEventListener('paste',e=>{ if(isCodeKind()) blockCheat(e,'PASTE'); });
  refs.editor.addEventListener('drop',e=>{ if(isCodeKind()) blockCheat(e,'DROP'); });
  refs.editor.addEventListener('beforeinput',e=>{
    if(!isCodeKind()) return;
    const allowed=['insertText','insertLineBreak','deleteContentBackward','deleteContentForward','deleteWordBackward','deleteWordForward','historyUndo','historyRedo'];
    if(!allowed.includes(e.inputType)) return blockCheat(e,e.inputType.toUpperCase());
    if(e.inputType==='insertText' && String(e.data||'').length!==1) return blockCheat(e,'MULTI-CHAR INSERT');
  });
  refs.editor.addEventListener('keydown',e=>{
    state.lastActivity=Date.now();
    if(isCodeKind() && (e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='v') return blockCheat(e,'PASTE');
    if(isCodeKind() && e.key==='Tab') return blockCheat(e,'TAB AUTOFILL');
    if(e.key.length===1 || ['Enter','Backspace','Delete'].includes(e.key)){
      state.typedKeys++;
      if(state.typedKeys>0 && state.typedKeys%25===0) petSay(`${state.typedKeys} keys! I saw every one. ♥ / ${state.typedKeys} tipki! Vidjela sam svaku. ♥`, 'happy');
    }
  });
  refs.editor.addEventListener('input',()=>{
    state.dirty=true; updateLineRail(); updateAuthorship(); updateGhost();
    clearTimeout(refs.editor._analysisTimer); refs.editor._analysisTimer=setTimeout(analyzeAndRender,120);
  });
  refs.editor.addEventListener('scroll',()=>{refs.lineRail.scrollTop=refs.editor.scrollTop;});
  refs.editor.addEventListener('click',updateGhost);
  refs.editor.addEventListener('keyup',updateGhost);

  function previewCapabilities(){
    const a=state.analysis||{concepts:[]};
    const speedMatch=refs.editor.value.match(/\bspeed\s*=\s*([0-9.]+)f?/i);
    return {movement:a.concepts.includes('movement'),camera:a.concepts.includes('camera'),speed:clamp(Number(speedMatch?.[1]||2.2),.5,8)};
  }
  function resetPreview(){ state.preview={x:2.2,z:2.2,yaw:0}; drawPreview(); petSay('Model reset. Same start, new experiment. / Model resetiran. Isti početak, novi pokus.', 'happy'); }
  function drawPreview(){
    const c=refs.preview,ctx=c.getContext('2d'); if(!ctx) return;
    const w=c.width,h=c.height; ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#202627';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#6c7772';ctx.lineWidth=2;
    for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.strokeStyle='#f2cf68';ctx.lineWidth=7;ctx.strokeRect(14,14,w-28,h-28);
    const px=20+state.preview.x/8*(w-40),py=20+state.preview.z/5*(h-40);
    ctx.fillStyle='#fffef7';ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#1d2020';ctx.stroke();
    const r=state.preview.yaw*Math.PI/180;ctx.strokeStyle='#79cce8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.sin(r)*30,py-Math.cos(r)*30);ctx.stroke();
    const cap=previewCapabilities();
    ctx.fillStyle='#fffef7';ctx.font='12px Courier New';ctx.fillText(cap.movement?`MOVE MODEL · speed ${cap.speed.toFixed(1)}`:'NO MOVEMENT CONTRACT DETECTED',22,h-20);
  }
  refs.preview.tabIndex=0;
  refs.preview.addEventListener('keydown',e=>{
    const cap=previewCapabilities();
    if(['w','a','s','d','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    if((e.key==='ArrowLeft'||e.key==='ArrowRight') && cap.camera){state.preview.yaw+=(e.key==='ArrowLeft'?-10:10);drawPreview();return;}
    if(!cap.movement) return;
    const step=.18*cap.speed;
    const r=state.preview.yaw*Math.PI/180;
    let dx=0,dz=0;
    if(e.key.toLowerCase()==='w'){dx+=Math.sin(r)*step;dz-=Math.cos(r)*step;}
    if(e.key.toLowerCase()==='s'){dx-=Math.sin(r)*step;dz+=Math.cos(r)*step;}
    if(e.key.toLowerCase()==='a'){dx-=Math.cos(r)*step;dz-=Math.sin(r)*step;}
    if(e.key.toLowerCase()==='d'){dx+=Math.cos(r)*step;dz+=Math.sin(r)*step;}
    const nx=clamp(state.preview.x+dx,.2,7.8),nz=clamp(state.preview.z+dz,.2,4.8);
    state.preview.x=nx;state.preview.z=nz;drawPreview();
  });

  refs.connect.addEventListener('click',connectRemote);
  refs.newScript.addEventListener('click',()=>newDocument('script'));
  refs.newLore.addEventListener('click',()=>newDocument('lore'));
  refs.assetButton.addEventListener('click',()=>refs.assetInput.click());
  refs.assetInput.addEventListener('change',()=>uploadAsset(refs.assetInput.files?.[0]));
  refs.save.addEventListener('click',saveCurrent);
  refs.analyze.addEventListener('click',()=>{analyzeAndRender();petSay('I traced the rules again. No model, no magic. / Ponovno sam pratila pravila. Bez modela, bez magije.', 'happy');});
  refs.initModel.addEventListener('click',resetPreview);
  refs.fileName.addEventListener('input',()=>{state.dirty=true;updateAuthorship();analyzeAndRender();});
  refs.fileKind.addEventListener('change',()=>{state.current={kind:refs.fileKind.value,name:refs.fileName.value,path:null};state.currentSha=null;analyzeAndRender();updateAuthorship();});

  refs.owner.value=state.owner; refs.repo.value=state.repo; refs.branch.value=state.branch;
  refs.editor.setAttribute('spellcheck','false'); refs.editor.setAttribute('autocomplete','off'); refs.editor.setAttribute('autocapitalize','off'); refs.editor.setAttribute('autocorrect','off');
  newDocument('script');
  drawPreview();
})();
