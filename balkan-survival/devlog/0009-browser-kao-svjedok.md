---
build: source-milestone
title: "Browser kao svjedok"
subject: "Playwright, sekvencirani bridge eventi, automatizirani round-trip test i razlika između stanja koje postoji i događaja za koji možemo pokazati da se dogodio"
systems:
  - BrowserEventLedger
  - PlaywrightRoundTrip
  - RepositoryDispatch
  - RoundTripEvidenceReport
  - ProductionApprovalGate
status: development
---

# Browser kao svjedok

U prethodnom rezu release candidate napokon je dobio identitet koji nije ovisio o nazivu foldera. Unity output se može hashirati file po file, od tih hashova napraviti jedan `artifactDigest`, postaviti isti skup bytesa na Vercel Preview i kasnije taj isti deployment promovirati u produkciju bez ponovnog builda. Time smo riješili vrlo određeni problem: ako kažemo da je kandidat koji smo testirali postao produkcija, možemo pokazati da se radi o istom artefaktu.

Ali byte identitet nije izvršenje. `.wasm` može biti dostupan, imati ispravan MIME type i savršeno odgovarati manifestu, a da se loader ipak sruši prije nego što Unity pošalje prvi event. Browser može uredno preuzeti sve datoteke, a `SendMessage` može biti pozvan prerano. Restore može raditi u Editoru i zakazati tek nakon WebGL serializacije. Lokalni storage može sadržavati JSON, ali taj JSON može pripadati prethodnom runu. Ako statički deployment proglasimo dokazom da igra radi, samo smo zamijenili jednu vrstu neprovjerene pretpostavke drugom.

Zato je predmet ovog reza browser. Ne kao viewport, nego kao izvršno okruženje koje stoji s druge strane granice koju već nekoliko buildova pokušavamo precizno definirati. Unity zna svoje stanje. Vercel zna koje je datoteke poslužio. Tek browser može vidjeti jesu li se ta dva svijeta stvarno spojila kroz javni `SLEGNUCE_SHELL` contract.

## Zašto test ne smije ući kroz stražnja vrata

Najlakši način da napišem automatski test za `RunEngine` bio bi da ga izvršim kao C# test u Editoru. To već djelomično radimo kroz `SlegnuceSelfTest`, i taj sloj je koristan. On može dokazati da `give_two_liters` smanjuje vodu, da schema rejection ne mutira state i da novi run nema ostatke staroga. Međutim takav test ne zna ništa o WebAssemblyju, `.jslib` bridgeu, `createUnityInstance`, `SendMessage`, `localStorage` ili stvarnom redoslijedu browser događaja.

Ako bih sada Playwrightu dao neki tajni test endpoint koji iz JavaScripta direktno mijenja `RunState`, test bi postao brz i stabilan, ali dokazao bi pogrešnu stvar. Release contract kaže da hosting shell razgovara s Unityjem preko `window.SLEGNUCE_SHELL.command()`, a Unity odgovara kroz bridge evente. Automatizacija zato mora koristiti isti javni put. Ne želim test koji prolazi zato što zna više od korisničkog runtimea.

To je općenito pravilo koje vrijedi i izvan testova. Sustav često izgleda pouzdanije kada kontrola ima privilegirani pristup koji običan tok nema. Administrator može ručno popraviti zapis, developer može otvoriti inspector, test može direktno postaviti privatno polje. Sve to pomaže dijagnostici, ali ne dokazuje da redovni postupak radi. Ako želimo testirati proceduru, svjedok mora stajati na istoj strani vrata kao i procedura.

Zato `headless-roundtrip.mjs` otvara javni Vercel Preview, čeka da `SLEGNUCE_SHELL.unityReady` postane `true` i nakon toga šalje samo javne shell komande. Kada želi početi run, šalje `START_RUN`. Kada želi choice, šalje `COMMIT_CHOICE`. Kada želi restore, koristi isti `restoreLastRun()` koji će koristiti hosting shell. C# interno može imati deset drugih načina da postigne isti rezultat; release test ih namjerno ne poznaje.

## Zadnji event nije povijest

Prva stvar koju sam morao promijeniti u Web templateu nije bila Playwright skripta nego način na koji browser pamti događaje. Do sada je `SLEGNUCE_SHELL.lastEvent` držao samo zadnju poruku iz Unityja. To je dovoljno za debug overlay: pogledaš ekran i vidiš da je zadnje stigao `RUN_RESTORED`. Za automatizirani test to nije dovoljno.

Zamisli da test pošalje `RESTORE_RUN` i zatim čeka dok `lastEvent.type === 'RUN_RESTORED'`. Ako je `RUN_RESTORED` ostao od prethodnog restorea, uvjet je zadovoljen prije nego što je nova komanda uopće obrađena. Test postaje posebno opasan jer ne pada nasumično; postaje lažno stabilan. Što je prethodni run sličniji novome, to više izgleda kao dokaz.

Zato shell sada drži ograničeni `eventHistory`. Svaki event dobiva monoton `seq`:

```js
{
  seq: 37,
  type: 'RUN_RESTORED',
  payload: { ... },
  at: 1786870000000
}
```

Prije slanja naredbe test zapamti trenutačni sequence. Nakon slanja ne traži bilo koji `RUN_RESTORED`, nego samo onaj kojem je `seq` veći od zapamćenoga. `clearEvents()` može isprazniti buffer radi čitljivosti, ali ne vraća brojač na nulu. Time povijest koju trenutno čuvamo može biti kratka, dok redoslijed i dalje ostaje jednoznačan unutar page sessiona.

Ovaj ledger nije novi source of truth. Ne koristimo ga za gameplay, ne restoramo run iz njega i ne računamo resurse iz eventa. `RunState` ostaje autoritet simulacije. Browser ledger čuva dokaz o komunikaciji. Razlika je slična razlici između bankovnog stanja i izvatka mrežnih poruka koje su dovele do promjene: drugo može objasniti put, ali ne smije samovoljno postati prvo.

Ta razlika mi je važna jer projekt cijelo vrijeme govori o evidenciji. Loša implementacija te teme bila bi napraviti pet konkurentskih evidencija i onda njihove kontradikcije proglasiti realizmom. Dobra implementacija mora prvo znati koja evidencija ima koju nadležnost. Tek tada možemo namjerno modelirati nesklad.

## Dvanaest uvjeta kao jedan postupak, ne dvanaest screenshotova

`ROUNDTRIP_TEST.md` već je imao dvanaest uvjeta, ali do sada su bili ručni acceptance contract. Novi Playwright runner ih pretvara u jedan reproducibilan postupak.

Prva dva uvjeta provjeravaju da je Unity uopće živ u browseru. Nakon eksplicitnog `START_RUN` mora doći `RUN_STARTED`, a zatim `SCENE_CHANGED` mora identificirati `two_liters`. To zvuči banalno, ali upravo tu se otkriva velik broj Web problema: loader se može završiti, canvas može biti vidljiv, a bridge još uvijek biti mrtav. Za ovaj test “vidim Unity canvas” nije isto što i “simulacija komunicira”.

Treći uvjet testira odsutnost kao mehaničku činjenicu. Mira nije garantirano aktivna u svakom seedu, pa runner deterministički pokušava `HEADLESS-MIRA-0`, `HEADLESS-MIRA-1` i tako dalje dok ne pronađe run u kojem nije `Active`. Tada namjerno šalje njezin choice. `RunEngine` ga mora odbiti, a `CHOICE_REJECTED` mora objasniti da Mira nije aktivna. Time test ne provjerava samo da se gumb može zasiviti; provjerava da simulation layer sam zna zašto radnja nije legalna.

Četvrti uvjet je stroži od obične provjere `water === 5`. Runner sprema cijeli state prije `give_two_liters`, napravi očekivanu kopiju i dopušta točno četiri razlike: voda se smanjuje za dvije, BILJEG raste za jedan, `neighborHelped` postaje true i RunLog dobiva očekivani zapis. Ako se usput promijeni hrana, roster, stress ili bilo što drugo, test pada. Pozitivan rezultat nije samo “dogodilo se ono što smo očekivali” nego i “nije se dogodilo nešto što nismo očekivali”.

Peti uvjet provjerava da `CHOICE_COMMITTED` nosi i fingerprint i snapshot stanja. Šesti zatvara jedini scenarij i traži `RUN_COMPLETE`. Sedmi prelazi iz event streama u browser persistence: `localStorage['slegnuce:last-unity-run']` mora postojati i sadržavati posljedicu koju smo upravo proizveli.

Tek tada dolazi dio koji stvarno opravdava naziv round-trip. Test namjerno pokrene drugi run i u njemu napravi drugu odluku. To “onečisti” trenutačnu memoriju. Nakon toga `restoreLastRun()` mora vratiti prethodno spremljen run, a `RUN_RESTORED` mora nastati nakon aktualne restore komande. Restorani state zatim se uspoređuje s JSON-om koji je stvarno bio u browser storageu. Ako bismo restore testirali bez prethodnog disturb runa, lako bismo zamijenili “state nikada nije nestao” s “state se uspješno vratio”.

Deseti uvjet uspoređuje fingerprint nakon završetka s fingerprintom nakon restorea. Jedanaesti namjerno šalje pokvaren JSON i zatim valjan JSON s nepodržanim `slegnuce.run/999` schema identifikatorom. Oba moraju biti odbijena, a fingerprint trenutačnog runa mora ostati isti. Ovdje odbijanje nije samo error handling. Validator koji prvo mutira stanje pa tek onda objavi da dokument ne prihvaća praktički je izvršio dokument kojem tvrdi da ne vjeruje.

Dvanaesti uvjet nakon svega pokreće potpuno novi run i provjerava bazne vrijednosti: voda sedam, BILJEG nula, ključni flagovi false, log prazan, scenario index nula. Tek tada imamo razuman dokaz da restore nije pretvorio singleton memoriju u skriveno nasljeđe.

## Zašto test namjerno radi nered

Dobar integracijski test ne pokušava reprodukciju idealnog korisnika. Idealni korisnik rijetko otkriva najopasnije greške. On pokrene run, napravi choice, možda završi i zatvori tab. Naš test nakon spremanja namjerno pokreće drugi run, laže Ivanu, vraća prethodni run, šalje nevažeći JSON, šalje budući schema i tek onda traži fresh state.

To nije fuzzing i ne treba ga predstavljati kao takvo. Ulazi su vrlo precizno izabrani. Ali njihova je svrha ukloniti najlakša alternativna objašnjenja za uspjeh. Ako restore prođe samo zato što originalni objekt još stoji u memoriji, disturb run ga razotkriva. Ako unsupported schema vrati error ali ostavi pola novih vrijednosti, fingerprint prije i poslije ga razotkriva. Ako fresh run samo prepiše seed, ali ne resetira kolekcije, zadnji uvjet ga razotkriva.

U znanstvenom jeziku to bi bio pokušaj kontrole varijabli; u software testu je to uglavnom disciplina da se ne zaljubimo u prvi output koji izgleda ispravno. Igra koja pokušava graditi causal density ne može si priuštiti testove koji prihvaćaju korelaciju kao uzrok samo zato što je rezultat zgodan.

## Chromium je jedan svjedok, ne porota

Workflow pinamo na Playwright `1.62.0` i instaliramo Chromium na svježem GitHub runneru. Pin nije tvrdnja da je ta verzija posebna. On znači da rezultat release testa ima reproducibilniji kontekst. Ako jednog dana promijenimo Playwright ili browser runtime, to je promjena testnog okoliša koja zaslužuje svoj zapis, pogotovo ako se ponašanje WebGL-a promijeni.

Ali čak i potpuno zelen Chromium test ima ograničenu nadležnost. Ne dokazuje Safari. Ne dokazuje Firefox. Ne dokazuje low-end laptop. Ne dokazuje da WebAudio dobro zvuči ili da input nema neugodan latency. Ne dokazuje da je tutorial razumljiv. Ne dokazuje da su likovi vizualno dovoljno konzistentni.

To nije slabost gatea nego uvjet da mu vjerujemo. Svaki test postaje opasan kada se njegov status proširi na pitanja koja nije postavio. `12/12` znači da je dvanaest definiranih Unity ↔ browser ugovora prošlo u tom Chromium izvršenju nad tim immutable Previewom. Ništa manje i ništa više.

Kasnije možemo dodati browser matrix, performance budgets i screenshot/regression sloj. Ne želim ih dodavati prije nego što prvi ugovor stvarno proizvede javni build, jer bi tada opet testirali infrastrukturu koju još nemamo umjesto problema koji se upravo pojavio.

## Izvještaj je dokaz, ali nije presuda

Workflow uvijek pokušava spremiti `slegnuce-roundtrip-report.json`, čak i kada test padne. Report ima schema `slegnuce.roundtrip-report/1`, Preview URL, release version, artifact digest, početno i završno vrijeme, listu uspješnih provjera, bounded browser console i, kod pada, stack trace.

To nam daje nešto što običan zeleni check nema: možemo poslije vidjeti dokle je proces stvarno stigao. Ako je prošlo sedam uvjeta i osmi pao na restoreu, nije korisno svesti cijeli događaj samo na crveno. Crveno je ispravan release zaključak, ali razvoj treba trag.

S druge strane, report namjerno nije automatski upisan u game `RunLog`. To su dvije različite povijesti. Jedna je povijest igračeva svijeta, druga je povijest build procesa. Spajanje svega u jedan univerzalni ledger zvuči elegantno dok se ne počnu miješati različite vrste autoriteta.

## Zašto automatizirani uspjeh ne objavljuje produkciju

UBA post-build nakon statičke verifikacije može poslati `repository_dispatch: slegnuce-preview-ready`. To automatski pokreće browser gate. Ako svih dvanaest uvjeta prođe, workflow završava zeleno i sprema report.

Tu automatizacija staje.

Vercel promotion nalazi se u istom workflow fileu, ali se može aktivirati samo ručnim `workflow_dispatch` pokretanjem s `promote_after_pass=true`. Promotion job ovisi o uspješnom round-trip jobu i ulazi u GitHub environment `slegnuce-production`, gdje se mogu postaviti environment secrets i reviewer protection. Tek tada `promote-vercel.sh` ponovno provjerava Preview version/digest i traži od Vercela da istom deploymentu da produkcijski status.

Ovo možda djeluje konzervativno jer već imamo automatski dokaz. Ali dokaz i odluka nisu ista operacija. CI može vrlo dobro reći da je kandidat zadovoljio ugovor. Ne želim da činjenica da je on sam proizveo tu rečenicu automatski znači i da ima pravo promijeniti javnu produkciju.

U nekim projektima potpuni continuous deployment je ispravan. Ovdje zasad nije. MAIN još uvijek uključuje umjetničku i uredničku procjenu koju ne pokušavam formalizirati u dvanaest boolova. Tehnički release može biti ispravan i vizualno nedovoljno dobar za zamjenu `0.1.1`. Zato su Vercel production i project `production.json` i dalje dva odvojena statusa.

To je ista arhitektonska odluka koju smo već imali, sada samo proširena na cloud. Najnoviji commit nije automatski MAIN. Najnoviji Unity build nije automatski production. Zeleni browser test nije automatski MAIN. Svaki prijelaz ima točno određeni razlog.

## Dispatch kao predaja predmeta, ne povjerenja

`dispatch-roundtrip.mjs` postoji zato da Unity Build Automation ne mora čekati čovjeka koji će kopirati Preview URL u GitHub Actions formu. Nakon što UBA napravi build, packager izračuna digest i Vercel static gate prođe, skripta može poslati tri ključne vrijednosti: Preview URL, version i digest. Git commit ide kao provenance metadata.

GitHub workflow ne prima Vercel token ni Unity credential kroz taj payload. Ne treba mu. Za browser test treba samo javni kandidat i očekivani identitet. To je dobar primjer kako granica između servisa može biti uska: predajemo predmet koji treba ispitati i račun kojim potvrđujemo koji je to predmet, a ne cijeli administrativni pristup sustavu koji ga je proizveo.

Ako `GITHUB_RELEASE_TOKEN` još nije konfiguriran u UBA-i, post-build ne pada. Preview ostaje valjan kandidat i workflow se može pokrenuti ručno s istim URL/version/digest podacima. Time automatizacija ostaje poboljšanje postupka, a ne nova centralna točka kvara koja briše već uspješan Unity build zato što treći servis trenutačno nije dostupan.

Naravno, kada želimo punu autonomnu cijev, dispatch token postaje dio operativnog contracta i njegov failure treba biti vidljiv. Ali trenutno smo još u fazi spajanja računa, pa je važno razlikovati “candidate nije napravljen” od “candidate nije automatski predan sljedećem svjedoku”.

## Što sada stvarno nedostaje

Nakon ovog commita source strana pipelinea ide puno dalje nego prije, ali neću iz toga izvesti build koji ne postoji. Još uvijek treba jednom povezati ovaj Git repo s Unity Build Automation konfiguracijom, napraviti dedicated Vercel Slegnuće projekt i unijeti cloud secrets. Tek stvarni UBA job može dokazati da `6000.3.16f1` na njihovom builderu kompajlira naš source i proizvodi Web output koji packager očekuje.

Kada se to dogodi, više ne trebamo izmišljati sljedeći test ručno. UBA će izbaciti candidate, Vercel će ga staviti na immutable Preview, GitHub će otvoriti Chromium i pokušati svih dvanaest uvjeta. Ako padne, report će pokazati na kojoj granici. Ako prođe, imat ćemo kandidat kojemu možemo svjesno dati produkcijski status bez ponovnog builda.

Tek poslije toga ima smisla veliki vizualni rez: modularni character renderer, stvarna shelter scena, state-aware animacije i asset streaming. Do tada infrastruktura nije cilj igre, ali je način da se kasnije vizualna složenost ne pretvori u izgovor za neobjašnjive buildove.

Browser u ovom rezu nije sudac kvalitete. On je samo prvi svjedok kojeg možemo ponovno pozvati i očekivati da odgovara na ista pitanja istim postupkom. Za release pipeline je to dovoljno važna nova sposobnost.
