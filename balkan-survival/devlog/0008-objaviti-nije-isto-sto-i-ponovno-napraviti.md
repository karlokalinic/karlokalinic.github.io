---
build: source-milestone
title: "Objaviti nije isto što i ponovno napraviti"
subject: "Unity Build Automation, immutable release artifacts, SHA-256 provenance, Vercel Preview promotion and the difference between creating an object and granting it authority"
systems:
  - UnityBuildAutomationContract
  - CloudPreExport
  - ReleasePackager
  - ArtifactDigest
  - VercelBuildOutputAPI
  - PreviewStaticGate
  - ProductionPromotion
status: development
---

# Objaviti nije isto što i ponovno napraviti

Do sada je migracija Slegnuća prema Unity Webu uglavnom bila problem izvršivosti. Prvo je trebalo odlučiti gdje se nalazi autoritativno stanje; zatim dokazati da se ono može serializirati i vratiti; nakon toga pretvoriti hrpu `.cs` datoteka u Unity projekt koji ima pinanu verziju Editora, build target, generiranu scenu i test koji se izvršava prije builda. Sljedeći problem nastaje tek kada sve to počne raditi: što točno znači reći da je neki build "objavljen"?

Na površini je odgovor trivijalan. Build se pošalje na server i link se podijeli. Međutim ta definicija miješa najmanje tri različita događaja. Jedan proces je proizveo WebAssembly, drugi ga je postavio na javnu adresu, a treći je toj adresi dao status produkcije. Ako svaki od tih koraka ima pravo ponovno proizvesti sadržaj, više ne znamo je li ono što je testirano doista ono što je objavljeno. Tada riječ "release" više ne označava isti objekt kroz različite faze, nego obitelj vrlo sličnih objekata kojima smo administrativno odlučili dati isto ime.

Zato ovaj rez uvodi pravilo koje je jednostavnije od većine deployment sustava, ali strože od načina na koji se često koriste: produkcija se ne builda. Produkcija se promovira.

## Cloud build nije hosting

Vercel je vrlo dobar u onome što mu želim dati: statičke datoteke, CDN, Preview deploymente, nepromjenjive deployment URL-ove i kasniju promociju već postojećeg deploymenta. Nije dobar kandidat za ono što mu ne želim dati: odgovornost da izvorni Unity projekt pretvara u WebAssembly. Unity build podrazumijeva konkretan Editor, platform module, Asset import, IL2CPP i niz specifičnih build postavki. Pokušati cijeli Unity toolchain smjestiti u proizvoljan web build container samo zato što taj container ima polje `buildCommand` bilo bi pogrešno razumijevanje apstrakcije. Mogućnost da izvršiš naredbu nije isto što i okruženje koje ima smisla za tu naredbu.

Zato compiler selim u Unity Build Automation. UBA već razumije Unity projekt kao projekt, zna njegovu verziju, može ciljati WebGL, pruža `OUTPUT_DIRECTORY`, `BUILD_NUMBER`, `GIT_COMMIT` i `UNITY_VERSION`, te dopušta pre-export metodu u Editoru i post-build shell skriptu nakon izgradnje. Drugim riječima, cloud builder ne pokušava glumiti generički server koji je slučajno našao Unity; njegova je zadaća upravo da bude okruženje u kojem Unity može biti izgrađen reproducibilno.

Repo sada zbog toga ima `SlegnuceBuild.PreExportCloud()`. Ta metoda ne poziva drugi build pipeline unutar UBA-e. Ona radi ono za što je pre-export dobar: generira prototipnu scenu iz sourcea, izvršava pet buildability self-testova, postavlja product metadata, bira naš custom Web template i određuje release version. Nakon nje Build Automation nastavlja sa svojim standardnim WebGL buildom.

To je važna granica odgovornosti. Lokalni `BuildDevelopmentWeb()` mora sam pozvati `BuildPipeline.BuildPlayer` jer je lokalna skripta cijeli proces. U cloud konfiguraciji taj poziv već pripada UBA-i. Ponavljati ga unutar pre-export metode značilo bi imati build unutar builda i zatim nagađati koji je output stvaran.

## Zašto prvi cloud release namjerno isključuje Unity kompresiju

U cloud pre-exportu postavljam `PlayerSettings.WebGL.compressionFormat = Disabled`. Na prvi pogled to izgleda kao korak unatrag u projektu koji ima mali Web download budget. Razlog je metodološki, ne estetski.

Unityjev Brotli ili Gzip output nije samo manji file. On stvara novi ugovor s hostingom: server mora vratiti odgovarajući `Content-Encoding`, MIME typeovi moraju ostati ispravni, a loader mora dobiti ono što očekuje. Sve se to može napraviti i kasnije treba napraviti. Ali prvi cloud release pokušava dokazati nešto drugo: da isti binary koji izađe iz Unityja može dobiti stabilan identitet, otići na Preview, biti testiran i zatim postati production bez ponovnog stvaranja.

Ako u isti rez uvedem i precompressed hosting, svaki loader problem može biti build problem, Vercel header problem, compression problem ili bridge problem. Uklanjanjem jednog sloja ne tvrdim da kompresija nije važna; stvaram kontrolni eksperiment. Vercel i dalje može primijeniti transport compression na obične statičke odgovore, dok izvorni build artefakt ostaje jednostavan za usporedbu. Kada pipeline prođe, Brotli možemo vratiti kao mjerljivu optimizaciju i tada testirati točno novu pretpostavku koju uvodimo.

To je obrazac koji želim zadržati kroz cijeli projekt. Optimizacija koja onemogući da objasnimo kvar nije nužno napredak, čak i kada broj bajtova izgleda bolje.

## Release manifest kao račun, ne kao reklama

`package-vercel-release.mjs` uzima direktorij koji je proizveo Unity i prije bilo kakvog deploya čita svaki file. Svaki dobiva SHA-256 i veličinu. Zatim se ti podaci sortiraju po relativnom pathu i od njih se proizvodi jedan `artifactDigest`. Release manifest pamti i Git commit, UBA build number, Unity verziju, verziju releasea i konačnu javnu rutu.

Ovdje je bitno što digest ne pokušava mjeriti. On ne govori je li igra dobra. Ne govori radi li restore. Ne govori je li render previše taman, je li Mira dovoljno prepoznatljiva ili ima li event dobar ritam. On govori samo da određeni skup datoteka ima određeni identitet.

Ta ograničenost je prednost. U tehničkim i društvenim sustavima postoji trajna sklonost da broj koji je lako izračunati preuzme autoritet nad pojavom koju je teško procijeniti. KPI postane rad, ocjena postane znanje, relationship score postane odnos. `artifactDigest` nije "istina o buildu"; on je račun za bytes. Ako bytes kasnije postanu drugi, račun se više ne slaže. Sve ostalo mora imati svoj dokaz.

Zato packager namjerno ne uključuje vrijeme pakiranja u digest. Ako isti Unity output zapakiram u 08:00 i 09:00, manifest može imati drugo `createdAt`, ali `artifactDigest` mora ostati isti. GitHub CI sada upravo to testira s umjetnim minimalnim Unity outputom. Dvije operacije pakiranja smiju se razlikovati u okolnostima, ali ne u identitetu predmeta koji opisuju.

## Verzija kao adresa koja se ne smije prepisivati

Vercel bundle ne stavlja Unity output samo u root. On ga kopira u `/releases/<version>/`. Taj path tretiramo kao immutable. Nije dovoljno reći da je release `0.2.0-rc.17` ako sutra istu adresu napunimo drugim bytesima. U tom slučaju verzija bi postala naziv ladice, a ne identitet artefakta.

Packager zato validira version string prije nego što ga uopće koristi kao path. Prihvaća semantičke verzije i naše `dev` / `rc.N` sufikse; odbija proizvoljne putanje. To je sigurnosna sitnica, ali ujedno vrlo doslovno provodi ideju da ime releasea ne smije imati skriveno pravo promijeniti mjesto na kojem se nalazi.

Root deploymenta sadrži samo mali redirect prema immutable release pathu i aktualni manifest. To znači da Preview URL može ostati jednostavan za otvaranje, dok unutar njega i dalje postoji eksplicitna adresa točno određenog artefakta.

## Deployment nije dokaz da je datoteka stigla

Jedna od najčešćih grešaka u automatizaciji je povjerenje u uspjeh prethodne automatizacije. Ako Vercel CLI vrati URL, lako je zaključiti da je deploy uspješan. Za infrastrukturu je to razumljiva definicija; za naš release gate nije dovoljna.

`verify-vercel-preview.mjs` zato izlazi na javni URL kao običan klijent. Ponovno čita `release-manifest.json`, uspoređuje version i digest, otvara Unity index, provjerava da su ostali naši `unity-canvas` i `createUnityInstance`, dohvaća loader i stvarni `.wasm`, traži `application/wasm` i provjerava da payload nije prazan.

To još uvijek nije gameplay test i tekst to izričito priznaje. Možemo dokazati da je WebAssembly dostupan, ali nismo ga time izvršili. Statički deployment gate dokazuje prijenos, ne ponašanje. Postojeći `ROUNDTRIP_TEST.md` ostaje viša razina dokaza i sljedeći tehnički cilj je automatizirati ga headless browserom nad upravo tim Preview URL-om.

Važno mi je da svaka zelena kvačica ima jasno definiranu nadležnost. Sustav postaje nepouzdan kada se status "success" širi dalje od onoga što je proces stvarno vidio.

## Preview kao kandidat, ne kao slabija produkcija

UBA post-build skripta namjerno završava na Previewu. Ne postoji `--prod` grana koja se aktivira zato što je build na `main`. `main` u ovom repozitoriju ionako već odavno ne znači "ovo je najbolji javni build"; imamo odvojeni `production.json` upravo zato da razvojna povijest ne bi automatski preuzela autoritet nad publikom.

Cloud release nastavlja istu logiku. Commit može biti najnoviji. UBA build može biti najnoviji. Vercel Preview može biti potpuno funkcionalan. Ništa od toga samo po sebi nije dovoljan razlog da deployment dobije produkcijski alias.

Post-build u UBA artefakte sprema `slegnuce-preview-url.txt` i `slegnuce-release-manifest.json`. Time build result nosi dvije činjenice koje kasniji gate treba: gdje se kandidat nalazi i kojim digestom se identificira. Nakon toga browser test smije dati odgovor o ponašanju.

Ovdje release pipeline počinje nalikovati temi igre bez potrebe za ukrasnom metaforom. Dokument postoji. Potpis postoji. Predmet postoji. Ali činjenica da postoji zapis o nečemu ne znači da taj zapis automatski ima pravo djelovati na sadašnjost. Autoritet je zasebna operacija.

## Promocija bez ponovnog stvaranja

`promote-vercel.sh` ima namjerno neugodan API. Zahtijeva `SLEGNUCE_RELEASE_APPROVED=YES`, očekivanu verziju i očekivani digest. Ponovno provjerava javni Preview. Tek nakon toga poziva Vercelovu operaciju promocije na postojećem deployment URL-u.

Nema Unity poziva. Nema packagera. Nema drugog `vercel deploy`.

Ovo je bit cijelog reza. Ako release candidate prođe test, ne gradimo "isti" release još jednom za production. Proglasimo testirani deployment produkcijom.

Razlika nije akademska. Rebuild može povući drugu dependency verziju, drugi editor patch, drugi asset import rezultat, drukčiji generated file, različito vrijeme ili jednostavno novu grešku. Čak i potpuno determinističan build treba dokaz prije nego što ga proglasimo jednakim. Ako nam Vercel već daje mogućnost da postojeći deployment promijeni status bez ponovne izgradnje, ponovno buildanje bilo bi nepotrebno stvaranje problema koji zatim moramo dokazivati da ne postoji.

U običnom govoru "promovirati" i "objaviti" često zvuče kao marketinške radnje. Ovdje su vrlo konkretne tehničke operacije. Status se mijenja; bytes ne.

## Paralelizam i mjesto na kojem mora prestati

Pitanje koje je pokrenulo ovaj rez bilo je možemo li build i produkciju raditi paralelno. Djelomično možemo i trebamo.

Web shell, dokumentacija i release UI mogu imati svoj Preview dok UBA kompajlira Unity. Ti poslovi ne moraju čekati jedan drugi. Ali production ne može biti potpuno paralelna s dokazom o artefaktu, jer tada dobivamo race condition pretvoren u proces izdavanja.

Pipeline zato ima oblik dvije grane koje se ponovno susreću u gateu. Sve prije gatea može biti paralelno. Sve poslije gatea mora znati točno koji artefakt je prošao.

To je općenitiji problem od deploymenta. Brzina se često poistovjećuje s istodobnošću: više procesa koji rade odjednom djeluje kao napredak. Ali sustav koji proizvodi odluke mora imati trenutke sinkronizacije. Bez njih više ne ubrzavamo isti postupak; proizvodimo više verzija stvarnosti i kasnije biramo jednu prema tome koja je prva stigla.

U ovoj igri vrijeme nije neutralno. U build pipelineu također nije. Ali baš zato ne želim da brzina postane način na koji gubimo podrijetlo.

## Što još nije završeno

Repo je sada spreman za UBA → Vercel Preview → promotion model, ali cloud accounti još nisu spojeni kroz ovu sesiju. Nemam pravo iz sourcea izmisliti Unity project ID, Build Automation konfiguraciju ili Vercel token. To su stvarni vanjski autoriteti i moraju biti postavljeni jednom u odgovarajućim servisima.

Također još nemamo headless browser koji automatski izvršava svih dvanaest round-trip uvjeta na javnom Previewu. Statički gate namjerno ne glumi taj test. To je sljedeći rez.

Kada taj zadnji komad dođe na mjesto, `0.2.0-rc.N` više neće biti samo naziv builda. Imat ćemo Git commit koji ga je proizveo, Unity build number, popis i hash svakog filea, javni Preview koji vraća isti manifest, browser dokaz da state može prijeći granicu runtimea i na kraju Vercel promotion event koji daje produkcijski status istom deploymentu.

Tada će release prvi put imati nešto što se u softveru često podrazumijeva, a rijetko stvarno zapisuje: ne samo adresu, nego biografiju.
