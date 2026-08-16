---
build: 0.1.1
title: "Nauči sustav, ne tipke"
subject: "tutorial, zvuk, animacija i priprema prelaska na Unity Web"
systems:
  - FirstRunTutorial
  - WebAudioSFX
  - MotionFeedback
  - WebBridge
  - UnityWebTemplate
status: production
---

# Nauči sustav, ne tipke

Build 0.1.1 izgleda kao mali polish commit: tutorial, nekoliko zvukova, nekoliko animacija i priprema za Unity Web. Te četiri stavke lako je napisati u release notesima i još lakše pogrešno razumjeti. Zajednički problem nije bio nedostatak efekata nego nedostatak jezika između igrača, preglednika i budućeg runtimea. Igra je već imala pravila, ali još nije dovoljno dobro razlikovala ono što sustav zna od onoga što igrač razumije, niti ono što web-stranica posjeduje od onoga što će jednog dana posjedovati Unity.

Zato ovaj commit nije pokušaj da sučelje postane glasnije. Pokušaj je da postane preciznije.

## Tutorial kao specifikacija javnog ugovora

U prototipu 0.1.0 postojala je vrlo opasna mogućnost: igrač može ispravno klikati i svejedno krivo razumjeti igru. Može zaključiti da su PRUD i MOSTARINA samo dvije valute, da su Mira i Davor pasivni bonusi, da se Run Log nalazi na ekranu samo zato što developer voli debug panele. Takva pogreška nije problem inteligencije igrača. To je problem dizajna koji je važnu semantiku ostavio implicitnom.

Tutorial u 0.1.1 zato nema zadatak naučiti kursoru gdje je gumb. Definiran je kao niz od šest semantičkih koraka. Prvi fokusira resurse i objašnjava da se stanje prenosi između događaja. Drugi fokusira roster i objašnjava da prisutnost lika mijenja skup legalnih akcija. Treći fokusira tokene i razdvaja vrste pristupa. Četvrti i peti razdvajaju događaj od odluke. Šesti pokazuje Run Log kao zapis uzroka, ne kao dekoraciju.

Tehnički je to vrlo mala struktura: niz objekata s `target`, `title` i `body` poljima, jedan `tutorialIndex`, jedna klasa za vizualni fokus i `localStorage` ključ koji pamti je li prvi prolaz završen. Ali odgovornost tog malog niza je velika. On predstavlja javnu verziju pravila. Ako tutorial kaže da lik otključava mogućnost, a kasniji kod dopusti istu mogućnost bez lika, tutorial nije zastario tekst; postao je dokaz da dizajn sam sebi proturječi.

Zbog toga tutorial želim tretirati kao specifikaciju koja se izvršava kroz igračevo iskustvo. Dokumentacija obično opisuje program nakon što je napisan. Ovdje jedan dio dokumentacije sjedi unutar programa i određuje što igrač ima pravo očekivati od njega. To je praktičan razlog zašto ne želim tutorijalne rečenice tipa “dobrodošli, kliknite dalje”. One troše pažnju bez stvaranja obveze za dizajn.

Postoji i društvena paralela koja nije slučajna. Institucija građaninu gotovo nikada ne pokazuje cijeli sustav; pokazuje proceduru. Procedura može biti jasna, a sustav koji proizvodi posljedicu ostati nevidljiv. U Slegnuću ne želim potpuno ukloniti tu asimetriju — dio igre upravo jest živjeti s nepotpunim informacijama — ali moram razlikovati neizvjesnost svijeta od nejasnoće sučelja. Ako igrač ne zna hoće li vodovod proraditi, to je sadržaj. Ako ne zna zašto mu je opcija zaključana, to je kvar komunikacije.

## AudioContext i pravo preglednika da šuti

Zvuk je uveden bez audio datoteka. `AudioEngine` koristi Web Audio API: `AudioContext`, oscilatore, gain čvorove, filtrirani noise buffer i nekoliko vrlo kratkih sintetiziranih događaja. Nema soundtracka koji pokušava unaprijed objasniti emociju. Postoji niski sobni hum, UI tick, dva udarca na vrata, radio static, šum papira, pad električne mreže, sirena i završni ton.

Odluka nije samo estetska ni štedljiva. Proceduralni SFX sloj drži build malen, ali važnije je što svakom zvuku daje funkciju koju mogu vezati uz stanje. `HODNIK` aktivira kucanje. `RADIO PRUDINA` aktivira statiku. `HEP` spušta hum i gasi vizualnu lampu. `OPĆINSKI URED` pokreće papir. `SIRENA` ulazi tek u završnu fazu. Audio signal tako više nalikuje event dispatchu nego playlisti.

Preglednici dodatno zahtijevaju korisničku gestu prije pouzdanog pokretanja zvuka. Zbog toga `POKRENI RUN` radi i `AudioEngine.unlock()`. Mogao bih tu restrikciju tretirati kao tehničku smetnju koju treba zaobići, ali dramaturški mi je korisna: stranica ne proizvodi ambijent prije nego što je korisnik odlučio ući u simulaciju. Pristanak na zvuk nije duboka etička pobjeda softvera; ipak je konkretna granica između sadržaja koji postoji i sadržaja koji si dopustio da ti uđe u prostor.

To je posebno važno za ovu igru jer zvukovi nisu neutralni feedback. Kucanje znači da privatni prostor više nije privatna informacija. Šum papira znači da kućna činjenica postaje institucionalni podatak. Nestanak električnog huma nije “spooky effect” nego promjena infrastrukture koju tijelo primijeti prije nego što je pročita. Ako kasnije soundtrack dođe, morat će poštovati istu hijerarhiju: prvo uzrok, zatim osjećaj. Ne obrnuto.

## Motion feedback i razlika između promjene i predstave promjene

CSS animation pass ima vrlo usku nadležnost. `event-enter` potvrđuje da je otvoren novi događaj. `choice-enter` daje choicesima kratki stagger kako bi ih oko čitalo kao skup, ali ne kao odjednom nastalu zidnu ploču teksta. `bump` se aktivira samo kada se vrijednost resursa ili tokena stvarno promijeni. Room-stage dobiva različita stanja za radio, blackout i sirenu. `prefers-reduced-motion` može gotovo potpuno isključiti taj sloj.

Važno mi je da animacija ne postane paralelni sustav istine. Ako broj napravi veliki zeleni skok svaki put kada se poveća, igrač će vrlo brzo naučiti da povećanje znači nagradu, čak i kada je riječ o TLAKU ili obvezi koju će kasnije platiti. Zato motion ne smije vrednovati promjenu; smije je samo potvrditi. To je mala razlika u CSS-u i velika razlika u retorici sučelja.

Igre često tvrde da “samo prikazuju podatke”, ali način prikaza već sadrži presudu. Crveno, zeleno, zvono, konfeti, vibracija, položaj na ekranu — sve to prije teksta kaže igraču što bi trebao osjećati. Ovdje pokušavam biti oprezniji: ako je BILJEG narastao jer si nekome dao vodu, sučelje treba reći da se vrijednost promijenila. Ne treba automatski reći da si postao bolja osoba.

## Zašto WebBridge postoji prije Unity scene

Najtehničkiji dio commita zapravo je priprema za nešto što korisnik još ne vidi. U repou sada postoje `SlegnuceBridge.jslib`, `SlegnuceWebBridge.cs` i custom Web template koji bootstrapa Unity preko `createUnityInstance()`. To je namjerno napravljeno prije prvog pravog Unity shelter builda jer želim zaključati granicu odgovornosti prije nego što renderer postane dovoljno impresivan da počnemo tolerirati arhitektonske greške.

Web-stranica je dugoročno arhiv, release shell i mjesto gdje žive povijest buildova, devlog i eventualni export runa. Unity treba postati runtime simulacije i prikaza, a ne novi vlasnik cijelog projekta. Zato je komunikacija svedena na mali event contract. Unity može emitirati `RUN_STARTED`, `SCENE_CHANGED`, `CHOICE_COMMITTED`, `RESOURCE_CHANGED`, `CHARACTER_STATE_CHANGED` i `RUN_COMPLETE`. Shell može vratiti naredbe poput `SET_AUDIO_MUTED`, `SET_TUTORIAL_STATE`, `REQUEST_RUN_EXPORT`, `RESTORE_RUN` i `PAUSE_FROM_SHELL`.

Ta granica je važnija nego što izgleda. Ako svaki UI element dobije vlastitu JavaScript funkciju, web i Unity brzo postanu dva sustava koji znaju previše jedan o drugome. Tada promjena imena jednog resursa postaje migracija kroz HTML, C#, `.jslib` i save format. Ako umjesto toga postoji verzionirani payload i mali skup događaja, možemo mijenjati prikaz bez promjene ontologije runa.

Tu se pojavljuje i ozbiljnija tema cijelog projekta: runtime nije povijest. Unity proces može nestati zatvaranjem taba. `AudioContext` može biti suspendiran. Canvas može biti reloadan. Ali odluka koju želimo sačuvati mora imati reprezentaciju koja preživljava taj konkretni trenutak izvođenja. Zbog toga `RUN_COMPLETE` mora biti serijalizirana činjenica, a ne stanje razbacano po GameObjectima. Ako neka odluka postoji samo zato što jedan objekt u sceni trenutno ima određenu boju ili bool, ona još nije dio povijesti igre; ona je samo trenutno sjećanje procesa.

## Trade-off: više granica znači više discipline

Ovakva arhitektura nije besplatna. Jednostavnije bi bilo pustiti Unity da nacrta sve, sprema sve i kontrolira sve. Jedna aplikacija, jedan debugger, manje ugovora. WebBridge uvodi verzioniranje poruka, serializaciju, compatibility probleme i potrebu da jasno odredimo tko smije mutirati stanje. To je dodatni posao upravo u fazi u kojoj bi bilo zabavnije animirati likove.

Prihvaćam taj trošak jer projekt ima specifičnu dugoročnu obvezu: svaki build mora ostati igriv, a stranica mora ostati čitljiva kao povijest razvoja. Runtime koji danas izgleda centralno za tri godine može biti zastario. Arhiv ne smije biti talac jednog enginea. Ako Slegnuće doživi više tehnoloških inkarnacija, želim da se promjena enginea vidi kao promjena instrumenta, ne kao gubitak sjećanja.

Sljedeći eksperiment zato nije “dodati još WebGL stvari”. Treba napraviti prvi Unity domain layer koji može stvoriti `RunState`, primijeniti jednu data-driven odluku, proizvesti determinističku posljedicu, zapisati je i emitirati kroz postojeći bridge. Ako taj mali ciklus ne možemo izvesti bez da UI postane vlasnik pravila, migracija je pogrešno postavljena. Ako možemo, onda je prvi put moguće reći da JavaScript prototip i Unity igra nisu dvije različite istine nego dva runtimea nad istom gramatikom.
