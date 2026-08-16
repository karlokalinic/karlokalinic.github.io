---
build: source-milestone-unity-domain-1
title: "Runtime nije svijet"
subject: "prvi Unity domain layer, autoritet stanja i cijena pretvaranja odluke u podatak"
systems:
  - RunState
  - RunEngine
  - ScenarioDefinition
  - TypedConditions
  - TypedEffects
  - WebBridgeContract
status: source-milestone
---

# Runtime nije svijet

Prvi ozbiljan korak prema Unity verziji Slegnuća nisam započeo scenom, kamerom ni likom. Započeo sam klasom koja sadrži vodu.

To zvuči kao antiklimaks nakon svih priča o modularnim karakterima, animaciji i WebGL-u, ali upravo je to test koji projekt trenutno mora proći. JavaScript prototip već zna dovoljno dobro glumiti cijelu večer: prikazuje četiri lika, sedam situacija, tokene, resurse i završetak. Unity će vrlo brzo moći nacrtati istu stvar ljepše. Problem je što ljepši prikaz ne dokazuje da smo prenijeli igru. Dokazuje samo da smo prenijeli prizor.

Igra je prenesena tek kada odluka ima isto značenje nakon što promijenimo runtime.

## Tko smije reći koliko vode postoji

U browser prototipu gameplay state živi u jednom JavaScript objektu i to je za ovu fazu bilo korisno. Funkcije poput `addRes`, `addToken`, `bond` i `choose` zajedno čine vrlo tanku granicu između prikaza i simulacije. Kako projekt prelazi u Unity, ta granica mora postati eksplicitna jer scene, GameObjecti, UI komponente i animacije prirodno počnu stvarati vlastite male kopije istine.

Najčešći kvar u ovakvom projektu nije dramatičan. Text label kaže `VODA: 4`, inventory komponenta misli da je 3, animacija na stolu još pokazuje pet boca, a save file je nastao prije zadnje promjene. Svaki od tih dijelova može pojedinačno izgledati razumno. Zajedno više nemamo stanje nego glasovanje.

Zato novi `RunEngine` dobiva isključivo pravo mutirati `RunState`. UI smije pitati `CanChoose()`, smije poslati `CommitChoice()`, smije slušati `StateChanged`, ali ne smije sam oduzeti vodu zato što je animacija odigrana. WebBridge smije prenijeti događaj, ali ne smije odlučiti ishod. `ScenarioDefinition` smije opisati uvjete i efekte, ali nije runtime memorija. Ovo je manje fleksibilno od sustava u kojem svaka komponenta radi “ono što treba”, ali fleksibilnost koja dopušta više vlasnika iste činjenice vrlo brzo postane samo elegantan naziv za kontradikciju.

Postoji očita dvostruka upotreba riječi stanje koju ovdje ne želim pretvoriti u jeftinu metaforu. U programu je `state` skup vrijednosti iz kojih proizlazi sljedeći legalni prijelaz. U društvenom životu stanje je također distribucija činjenica i ovlasti: tko ima pristup, čija se evidencija priznaje, koji dokument vrijedi, tko smije proglasiti da je neka obveza ispunjena. Projekt već govori o institucijama i kućanstvu upravo kroz sukob različitih evidencija. Bilo bi prilično glupo da kod koji to simulira sam nema jasnu evidenciju.

## Zašto sam namjerno odbacio pametniji kod

JavaScript verzija scenarija koristi funkcije i closuree. Izbor može sadržavati gotovo proizvoljan komad logike: provjeri nešto, promijeni tri vrijednosti, napiši rezultat. Za prototip je to izvrsno jer ideju možemo formulirati brže nego što bismo dizajnirali editor. Za dugoročni Unity content pipeline to je problem. Proizvoljna funkcija ne može se uredno spremiti u ScriptableObject, teško ju je prikazati dizajneru, teško ju je validirati bez izvršavanja i još teže usporediti između buildova.

Zato `ScenarioDefinition` u ovom commitu izgleda gotovo dosadno. Choice ima listu `ScenarioCondition` i listu `ScenarioEffect`. Condition može za sada pitati postoji li dovoljno resursa ili tokena, je li flag određene vrijednosti ili je lik u određenom presence stanju. Effect može dodati resurs ili token, postaviti flag, promijeniti bond ili promijeniti prisutnost lika.

To je manje moćno od `Func<bool>` i `Action` delegata. Upravo zato je korisno.

Ograničenje pretvara dizajn u nešto što se može pregledati. Ako izbor troši MOSTARINU i daje lijek, to može biti zapisano kao podatak koji editor, validator i budući devlog mogu pročitati bez pokretanja scene. Ako nam za godinu dana treba novi koncept — primjerice rezervirana zaliha koja nije dostupna jer je obećana drugome — želim dodati novi eksplicitni primitive, a ne sakriti pet redaka posebnog koda u jedinom scenariju koji ga koristi.

Tu je i filozofski problem koji je dovoljno konkretan da bude inženjerski problem: svaka enumeracija odlučuje što sustav može prepoznati. Ako enum poznaje samo `Water`, `Food` i `Medicine`, onda obećanje, sram, dužnost i vlasništvo za engine ne postoje dok ih ne damo nekoj reprezentaciji. To nije argument da sve treba pretvoriti u broj. Upravo suprotno. Dobar domain model mora imati dovoljno disciplina da ne pomiješa različite stvari samo zato što ih je lako zbrojiti.

## RunState kao dokument koji se može osporiti

`RunState` je namjerno sastavljen od običnih serializable polja. Voda, hrana, lijekovi, informacije, sklonište, stres, pet tokena, flagovi, roster i `RunLogEntry` lista. Nema referenci na GameObject, nema Transform, nema Sprite, nema scene-specific stanja. Razlog nije čistoća koda radi čistoće koda. Razlog je transport.

Ako run želimo poslati kroz WebBridge, spremiti u browser, usporediti s browser prototipom ili jednog dana migrirati u noviji build, moramo ga moći opisati bez Unity scene. `JsonUtility.ToJson(State)` zato nije samo save implementacija nego test ontološke samostalnosti. Može li ova odluka postojati kao činjenica i kada ekran koji ju je prikazao više ne postoji?

Trenutačni schema marker je `slegnuce.run/1`. Taj string djeluje beznačajno dok format prvi put ne promijenimo. Onda postaje razlika između povijesti koju možemo pročitati i hrpe starih JSON datoteka kojima novi build pristojno objasni da više ne postoje. Prije nego što obećamo cross-version replay, morat ćemo verzionirati ne samo schema nego i seed/RNG ugovor. U ovom source milestoneu roster jest deterministički za isti seed, ali još nisam spreman tvrditi da isti seed mora proizvoditi isti svijet kroz svaku buduću verziju. To obećanje je puno skuplje nego što izgleda.

## Determinizam nije suprotnost životu

Postoji iskušenje da se proceduralna drama učini “življom” dodavanjem sve više randoma. Ja za sada radim obrnuto. `RunEngine` mora moći objasniti zašto je choice dostupan, zatim primijeniti točno definiran niz efekata, zatim zapisati koji je choice commit-an. Random ulazi tamo gdje želimo varijaciju početnih uvjeta, primjerice roster, ali ne smije biti univerzalna izlika za uzrok.

Deterministički sustav nije zato manje ljudski. U društvenim situacijama često upravo suprotno: posljedica je brutalno predvidljiva čim znaš uvjete koje osoba nije birala. Ako netko nema MOSTARINU, vrata se ne otvaraju. Ako Ena nije prisutna, njezina metoda provjere izvora ne postoji. Ako je voda potrošena ranije, kasniji moralni govor ne stvara dvije litre iz dobre namjere. Random može odlučiti s kim si počeo večer. Ne bi trebao odlučivati je li prethodna odluka stvarno imala posljedicu.

Naravno, potpuni determinizam bi također bio lažan model. Ljudi mijenjaju mišljenje, informacije su pogrešne, infrastruktura ima nepredvidive kvarove, a društvene mreže stvaraju ponašanje koje nije jednostavno zbroj lokalnih pravila. Ali takvu neizvjesnost želim dodati kao modeliranu neizvjesnost — s izvorom, distribucijom i posljedicom — a ne kao `Random.Range()` ubačen tamo gdje dizajnu nedostaje uzrok.

## Što ovaj kod još ne dokazuje

Važno je napisati što nije napravljeno. Ove C# datoteke još nisu kompajlirane u stvarnom Unity projektu u ovom repou. Nema izrađenog `ScenarioDefinition` asseta, nema MonoBehavioura koji crta shelter UI iz `RunState`, nema sprite animation controllera, nema WebGL build artefakta. To znači da je trenutni commit arhitektonski prijedlog s konkretnim kodom, ne dokaz da migracija radi.

To razlikovanje mi je bitno upravo zato što projekt sve više izgleda uvjerljivo. Što su screenshotovi bolji i dokumentacija urednija, lakše je početi vjerovati vlastitim planovima kao da su rezultati. Programer također može biti žrtva vlastitog UI-a.

Sljedeći eksperiment je zato vrlo ograničen. U Unityju treba stvoriti jedan `ScenarioDefinition`, vezati jedan gumb na `RunEngine.CommitChoice`, promijeniti jedan resurs, poslati `CHOICE_COMMITTED` kroz `SlegnuceWebBridge`, zatim exportati `RunState`, reloadati ga i dobiti istu posljedicu. Ako to ne radi, nema smisla animirati četiri lika. Ako radi, imamo prvi prijelaz koji je preživio promjenu jezika iz JavaScripta u C#.

To je skromniji cilj od “prebaciti igru u Unity”. Ali je i precizniji. Runtime može nacrtati svijet, može ga osvijetliti i može ga uništiti zatvaranjem taba. Ono što pokušavam izgraditi ispod njega jest nešto strože: zapis zbog kojeg ista odluka ostaje ista čak i kada je mjesto na kojem se dogodila više ne postoji.
