---
build: source-milestone
title: "Kad projekt postane izvršiv"
subject: "Unity project pinning, reproducible scene generation, editor-side self-tests, batch Web builds and the distinction between source presence and buildability"
systems:
  - UnityProjectRoot
  - ProjectVersionPin
  - SlegnuceBuild
  - SlegnuceSelfTest
  - WebGLBuildEntrypoint
  - WebGLContractValidation
status: development
---

# Kad projekt postane izvršiv

U prethodnom rezu pokušao sam dokazati da jedna odluka može preživjeti promjenu jezika: Unity state može postati JSON, napustiti runtime i vratiti se bez tihe reinterpretacije. Taj kod je postojao u repozitoriju, ali postojanje izvornog koda još nije isto što i postojanje projekta koji drugi proces može izgraditi. To je razlika koju razvoj vrlo lako preskoči jer GitHub uredno prikazuje `.cs` datoteke, namespaceovi izgledaju smisleno i arhitektura na papiru već ima oblik proizvoda. Međutim Unity ne izvršava našu namjeru. On otvara konkretan projekt s konkretnom verzijom Editora, konkretnim Package manifestom, dostupnim platformskim modulima, build targetom, scenama i build postavkama. Ako bilo koja od tih pretpostavki postoji samo u glavi autora, repo je zbirka izvornog materijala, a ne reproducibilan postupak.

Zato ovaj rez nema novu survival mehaniku. Njegov tehnički predmet je buildability: koliko malo skrivenog znanja smije ostati između `git clone` i prvog Web builda. To je možda manje fotogenično od modularnog lika ili animiranog sheltera, ali je upravo ona vrsta infrastrukture koja odlučuje hoće li projekt za tri mjeseca biti sustav ili ritual koji radi samo na jednom računalu zato što se autor sjeća kojim redoslijedom treba kliknuti šest prozora.

## Verzija editora je dio izvornog koda

`webgl/` sada ima `ProjectSettings/ProjectVersion.txt` i `Packages/manifest.json`, pa ga Unity Hub može tretirati kao projektni root. Editor je pinan na `6000.3.16f1`, u Unity 6.3 LTS liniji. Namjerno nisam napisao skriptu koja automatski prepisuje projekt na najnoviji editor koji pronađe. Lokalni `build-web.ps1` prvo traži točno pinanu verziju; ako je nema, može za dijagnostiku pronaći drugi instalirani `6000.3.x`, ali ispisuje upozorenje i ne mijenja `ProjectVersion.txt`.

Ta odluka izgleda konzervativno samo dok se verzija editora promatra kao alat izvan projekta. U stvarnosti editor određuje serializer, importer, build pipeline, IL2CPP toolchain, ponašanje packageova i niz implicitnih defaulta. Promijeniti editor bez zapisa u povijesti slično je promijeniti pravilnik institucije, a zatim se čuditi što isti obrazac više ne proizvodi isti rezultat. Nije svaka promjena verzije problem; problem je promjena bez svjesnog trenutka u kojem prihvaćamo da se ugovor promijenio.

Ovdje je važno i ograničenje repozitorija. Web Build Support nije JSON dependency koju mogu spremiti u `Packages/manifest.json`; to je platform module koji mora biti instaliran uz Unity Editor. Zbog toga `SlegnuceBuild` ne pokušava glumiti da je okruženje kompletno. Prije builda pita `BuildPipeline.IsBuildTargetSupported(...)` i prekida s jasnim errorom ako Web target ne postoji. Dobar build sustav ne uklanja vanjske ovisnosti tako što prestane govoriti o njima. On ih pretvara iz prešutnog znanja u eksplicitni uvjet.

## Scena koja se generira jer još nema pravo biti artefakt

Prvi buildable Unity slice treba scenu, ali još ne želim da prototipna scena postane novi izvor istine. Unity scene su korisni serializirani asseti kada njihov sadržaj stvarno predstavlja dizajnirani prostor. Trenutačno bi `PrototypeShelter.unity` sadržavao kameru i bootstrap objekt. Commitati takav YAML samo zato da build pipeline ima nešto u `EditorBuildSettings.scenes` značilo bi stvoriti datoteku koju ćemo zatim ručno održavati iako cijeli njezin smisao možemo opisati s nekoliko linija koda.

Zato `SlegnuceBuild.EnsurePrototypeScene()` svaki put regenerira scenu. Kreira praznu scenu, dodaje kameru, postavlja neutralnu pozadinu, dodaje `PrototypeBootstrap`, sprema rezultat pod stabilnim putem i taj isti put upisuje u build settings. Generated scene je u `.gitignoreu`. Kada kasnije shelter dobije stvarnu prostornu kompoziciju, light rig, modularne character anchor točke i autorski raspored asseta, kriterij će se promijeniti i scena će zaslužiti biti commitani sadržaj. Trenutačno je samo reproducibilna posljedica sourcea.

To je mali primjer važnije razlike između podatka i izvedenog podatka. U projektu će postojati mnogo stvari koje se mogu spremiti zato što ih je moguće spremiti, ali to ne znači da ih treba tretirati kao autoritativne. Build folder, generated scene, `Library/`, IDE solution i WebAssembly output svi su proizvodi postupka. Git treba čuvati dovoljno informacija da ih možemo ponovno dobiti, a ne svaki trag koji je alat ostavio dok ih je proizvodio.

## Test koji mora proći prije nego što build uopće počne

`SlegnuceSelfTest` sada je dio editor-side build gatea. Ne koristi test kao dekoraciju nakon implementacije, nego se poziva iz samog `BuildDevelopmentWeb()` prije `BuildPipeline.BuildPlayer`. Trenutačno ima pet provjera.

Prva instancira `RunEngine`, učitava isti `PrototypeScenarioFactory` koji koristi runtime i pokreće run. Commit `give_two_liters` mora smanjiti vodu sa sedam na pet, dodati jedan BILJEG, postaviti `NeighborHelped` i zapisati očekivani scenario/choice u `RunLog`. Time se provjerava osnovni causal chain, ne UI rezultat.

Druga provjera mutira run, izvozi compact JSON, pamti fingerprint, stvara potpuno novi `RunEngine`, vraća JSON i uspoređuje fingerprint i ključna polja. Bitna riječ je novi. Round-trip nije dokaz ako restore radimo u objekt koji još uvijek u memoriji nosi prethodno stanje.

Treća namjerno mijenja schema iz `slegnuce.run/1` u nepodržanu vrijednost. Restore mora vratiti `false`, a fingerprint postojećeg runa mora ostati isti. Time provjeravamo ne samo da sustav prepoznaje pogrešan dokument nego i da ga odbijanje ne mijenja. To je važno jer validator koji prvo djelomično primijeni payload, a tek onda zaključi da mu ne vjeruje, nije validator nego vrlo pristojan oblik korupcije stanja.

Četvrta provjera ručno postavlja Miru kao `Absent` i traži legalnost choicea koji ona nosi. `CanChoose` mora odbiti radnju i razlog mora identificirati Miru. Nakon promjene na `Active`, isti choice uz postojeću vodu mora postati legalan. To je test naše ranije tvrdnje da lik nije portrait modifier nego dio skupa mogućih radnji.

Peta provjera završava najdosadnijim, ali opasnim slučajem: nakon mutiranog runa poziva se `StartNewRun`. Voda se mora vratiti na sedam, BILJEG na nulu, log se mora isprazniti i `NeighborHelped` mora ponovno biti false. Persistence bug koji novi život pokrene s ostacima staroga može vizualno izgledati kao duboka proceduralna posljedica, ali bio bi samo objekt koji nismo resetirali. Ako igra želi govoriti o nasljeđu, mora biti sposobna razlikovati nasljeđe koje je dizajnirano od memorije koju je program zaboravio očistiti.

## Batch mode kao uklanjanje tajnog rituala

Za Windows je dodan `build-web.ps1`. Njegova svrha nije uštedjeti tri klika u Unityju nego pretvoriti lokalni build u naredbu koju možemo zapisati, ponoviti i kasnije preseliti u automatizaciju. Skripta nalazi pinani editor, postavlja output path i pokreće Unity s `-batchmode`, `-projectPath`, `-buildTarget WebGL` i `-executeMethod Slegnuce.Editor.SlegnuceBuild.BuildDevelopmentWeb`.

`-buildTarget WebGL` je ovdje važniji nego što izgleda. Unity ne dopušta da batch proces usred `executeMethod` poziva proizvoljno prebaci aktivni target i zatim očekuje normalnu recompilaciju. Interaktivni menu wrapper smije pozvati `SwitchActiveBuildTarget`; batch entrypoint, međutim, zahtijeva da je proces već pokrenut za WebGL. Tako build script ne skriva razliku između interaktivnog Editora i automatiziranog procesa.

Nakon toga `SlegnuceBuild` postavlja product metadata, bira `PROJECT:Slegnuce` custom Web template, regenerira scenu, pokreće self-testove i poziva `BuildPipeline.BuildPlayer` s `BuildOptions.Development`. Build je uspješan samo ako Unity vrati `BuildResult.Succeeded`. Nema varijante u kojoj PowerShell ispiše zeleno zato što je `Builds/` direktorij nastao prije nego što je IL2CPP prijavio grešku.

Ta strogost je dosadna na isti način na koji je dosadan svaki postupak koji odbija priznati djelomičan uspjeh. Ali upravo to želim od infrastrukture. U samoj igri institucije mogu kasniti, proturječiti si i proglasiti proces završenim dok netko još čeka vodu. Build pipeline ne smije takvu temu interpretirati metodom glume.

## Zašto GitHub CI još uvijek ne tvrdi da je kompajlirao Unity

U projektni workflow dodan je `validate-webgl-project.mjs`. On provjerava da pinana verzija postoji, da je manifest validan, da build entrypoint sadrži stvarni `BuildPipeline.BuildPlayer`, da Development target i custom template nisu nestali, da self-test i dalje pokriva pet ugovorenih slučajeva, da Web template sadrži `createUnityInstance`, `SendMessage`, shell API i restore put, te da `.jslib` i PowerShell entrypoint imaju očekivane bridge/build točke.

To je korisna CI provjera, ali nije Unity compile. GitHub runner bez odgovarajućeg Editora, platform modulea i licence ne može pošteno dokazati C# API kompatibilnost ni proizvesti WebAssembly. Mogao bih nazvati statičku provjeru `unity-build` i dobiti lijepu zelenu kvačicu, ali tada bi metrika postala zamjena za događaj koji navodno mjeri. U projektu koji upravo pokušava razlikovati dokument od stvarnosti to bi bio prilično glup arhitektonski vic.

Zato trenutno postoje dva različita statusa. CI može dokazati da je repo strukturno spreman za build i da nismo slučajno uklonili ključni contract. Sam Unity Editor mora dokazati da se source kompajlira i da Web target može proći IL2CPP/build pipeline. Nakon toga browser mora dokazati dvanaest round-trip uvjeta iz `ROUNDTRIP_TEST.md`. Nijedan od ta tri sloja ne smije unaprijed potpisati rezultat drugoga.

## Što ovaj rez stvarno završava

Nakon ovog commita `webgl/` više nije samo mapa s nekoliko C# skripti koje jednog dana planiramo kopirati u Unity projekt. Ima pinani editor contract, Package manifest, ignoriranje generated statea, deterministički scene bootstrap, editor-side self-test, programmatic Development Web build i Windows command entrypoint. To je dovoljno da sljedeća osoba ili sljedeća verzija mene ne mora iz razgovora rekonstruirati što sam podrazumijevao pod ‘napravi prvi Unity build’.

Ali još uvijek neću arhivirati `0.2.0` niti ga promovirati kao MAIN. Ovaj razgovor nema pristup instaliranom Unity Editoru na korisničkom računalu i ne može lažno prijaviti rezultat procesa koji nije izvršio. Sljedeći stvarni dokaz zato je namjerno praktičan: pokrenuti `build-web.ps1` na stroju s Unityjem 6.3 i Web Build Supportom, dobiti C# compile, Development Web output i zatim proći browser round-trip protokol. Ako prvi compile otkrije pogrešnu API pretpostavku, taj neuspjeh neće biti odstupanje od plana. Bit će prvi put da je plan došao u kontakt s alatom koji ga mora izvršiti.
