---
build: source-milestone
title: "Ista odluka nakon promjene jezika"
subject: "round-trip serializacija, autoritet stanja, browser boundary i problem identiteta u migraciji JavaScript → Unity"
systems:
  - PrototypeScenarioFactory
  - RunEngineRoundTrip
  - SaveSchema
  - StateFingerprint
  - BrowserCommandAPI
  - RestoreValidation
status: development
---

# Ista odluka nakon promjene jezika

Ovaj tjedan nisam pokušavao dokazati da Unity može nacrtati stan. To znamo unaprijed. Unity može nacrtati stan, može animirati Miru kako otvara ormarić i može dovoljno uvjerljivo zatresti kameru kada u zgradi padne tlak vode. Problem koji sam htio riješiti je manje fotogeničan: ako igrač u Unityju odluči dati Ivanu dvije litre vode, može li ta odluka napustiti Unity, postati običan tekstualni zapis u browseru, nestati zajedno sa scenom i zatim se vratiti u novi runtime kao ista odluka, a ne kao približna rekonstrukcija onoga što se nekada dogodilo?

To je tehničko pitanje o serializaciji, ali je ujedno i pitanje koje će određivati koliko ovom projektu mogu vjerovati za šest mjeseci. Igre često govore o sjećanju, identitetu i posljedicama, a istodobno vlastiti save sustav tretiraju kao nusproizvod scene. Vrijednost postoji dok postoji GameObject koji je prikazuje; odnos postoji dok UI drži referencu; odluka postoji dok je određeni button disabled. Kada se scena ugasi, sustav pokušava naknadno rekonstruirati povijest iz nekoliko boolova. Takav model može raditi, ali nije naročito različit od čovjeka koji se sjeća zaključka, a ne može više objasniti kako je do njega došao.

Zato sam za prvi Unity round-trip izabrao najmanji događaj koji već ima dovoljno društvene strukture da pokaže gdje arhitektura može lagati: Ivan traži dvije litre vode.

## Zašto baš dvije litre

Scenarij `two_liters` nije izabran zato što je narativno najvažniji. Izabran je zato što u malom prostoru prisiljava nekoliko sustava da se slože oko jedne činjenice. Ako igrač odabere `DAJ 2 L VODE`, `RunEngine` mora prije izvršenja provjeriti postoji li najmanje dvije litre. Nakon izvršenja mora smanjiti vodu za dvije jedinice, dodati BILJEG, postaviti `NeighborHelped = true` i zapisati choice u `RunLog`. Ako je Mira aktivna, postoji druga mogućnost koja troši samo jednu litru, ali povećava informaciju i njezin bond jer se odluka oslanja na njezinu sposobnost raspodjele. Ako Mira nije aktivna, ta opcija ne smije biti samo vizualno zasivljena; simulation layer mora znati da je nelegalna i moći objasniti zašto.

To nam daje dovoljno materijala za pravi integracijski test. Resource gating provjerava stanje. Character gating provjerava roster. Effects provjeravaju mutaciju. `RunLog` provjerava da odluka ima povijest. Browser bridge provjerava da se stanje može iznijeti iz procesa. Restore provjerava da se ono može vratiti bez tihe reinterpretacije. U jednoj sceni imamo gotovo sve infrastrukturne probleme koje ćemo kasnije imati s mnogo složenijim događajima, samo bez deset tisuća asseta koji bi nam otežali pronalaženje greške.

To je razlog zbog kojeg `PrototypeScenarioFactory` za sada stvara `ScenarioDefinition` u runtimeu. Dugoročno želim stvarne ScriptableObject assete koje writer ili designer može uređivati bez diranja C# koda, ali u ovoj fazi asset pipeline bi unio dodatnu varijablu. Kada testiram bridge, ne želim istodobno testirati GUID reference, importere i ručno složenu scenu. Factory je test fixture: dovoljno je stvaran da prolazi kroz iste condition/effect tipove kao budući sadržaj, ali dovoljno je malen da se cijela definicija može pročitati u jednom source fileu.

## Autoritet nije isto što i mjesto na kojem se nešto vidi

Najvažnija promjena u `RunEngineu` nije novi event nego jasnija granica odgovornosti. `RunState` je jedino mjesto koje smije tvrditi koliko vode postoji, tko je aktivan i koji su flagovi istiniti. Scenario opisuje uvjete i učinke. View prikazuje stanje. Browser ga može spremiti. Nijedan od tih slojeva ne smije samostalno izmisliti novu vrijednost.

Ta zabrana zvuči kao standardna arhitektura dok se ne usporedi s načinom na koji se stvarni informacijski sustavi ponašaju pod pritiskom. U instituciji često postoji više paralelnih verzija iste činjenice: ono što se dogodilo, ono što je upisano, ono što prikazuje ekran i ono što službenik smatra važećim. Računalni sustav ne postaje društvena kritika time što namjerno reproducira takvu konfuziju u vlastitom kodu. Ako želimo igru o neskladu između života i evidencije, implementacija prvo mora vrlo precizno znati gdje taj nesklad nastaje. Inače bug i tema postanu nerazlučivi.

Zato je razlika između `RunState.water = 5` i pet boca nacrtanih na polici fundamentalna. Boca na polici je reprezentacija. Može kasniti jedan frame, može biti animirana, može biti skrivena kamerom ili namjerno pogrešno prikazana u scenariju gdje lik nešto skriva. `RunState` ne smije zbog toga prestati znati istinu koju simulacija trenutno priznaje. Tek kada imamo tu razliku, možemo kasnije napraviti zanimljiviji sustav u kojem likovi ne znaju cijeli `RunState`, nego vlastite parcijalne činjenice. Ne možeš modelirati nepouzdanu informaciju ako je i sam engine nepouzdan prema sebi.

## Save schema kao granica između pamćenja i nagađanja

`RunState` sada eksplicitno nosi `schema = slegnuce.run/1`. To nije ukras verzije nego uvjet restorea. `RestoreJson` više neće prihvatiti bilo koji JSON koji slučajno ima nekoliko poznatih polja. Payload se prvo parsira, zatim normalizira kolekcije koje mogu nedostajati, a onda se schema uspoređuje sa `SupportedSchema`. Ako se ne poklapa, engine emitira `RUN_RESTORE_REJECTED` s razlogom.

Ovdje sam namjerno odabrao strože ponašanje iako je neugodnije za razvoj. Vrlo je primamljivo reći da će stari save ‘vjerojatno raditi’ jer `JsonUtility` ignorira nepoznata polja i ostavlja nedostajuća na default vrijednostima. To bi nam dalo manje errora, ali i opasniju vrstu uspjeha: run bi se učitao, UI bi izgledao uvjerljivo, a dio povijesti bi nestao bez upozorenja. U igri koja planira vezati završetke i odnose uz prethodne odluke, tiha parcijalna migracija nije kompatibilnost. To je falsificiranje vlastite evidencije.

Kasnije ćemo zato morati birati između dvije stvarne opcije. Ili napišemo migrator iz `slegnuce.run/1` u budući schema format, sa svim pravilima potrebnima da se stara odluka smisleno prevede, ili otvoreno kažemo da se određeni build ne može restaurirati u novom runtimeu. Druga opcija zvuči ružnije, ali je epistemološki čišća od sustava koji se pretvara da pamti.

## Fingerprint nije duša savea

Dodao sam i `RunEngine.Fingerprint()`, 32-bitni FNV-1a hash nad UTF-8 bajtovima kompaktnog `JsonUtility` outputa. Njegova svrha je vrlo uska: tijekom round-trip testa želim brzim pogledom vidjeti je li stanje prije spremanja i nakon restorea ostalo isto pod istim serializer contractom. Ako se fingerprint promijeni, znam da nešto u tekstualnoj reprezentaciji više nije identično i mogu otvoriti JSON diff.

Važno je što taj broj ne znači. Nije cryptographic signature, ne štiti od namjerne izmjene savea, ne dokazuje filozofski identitet runa i ne smije postati gameplay mehanika. Čak ni tehnički nije vječan ugovor: promijenimo li redoslijed serializiranih polja ili serializer, isti semantički state može proizvesti drugačiji tekst i time drugi fingerprint. Zbog toga dokumentacija izričito veže fingerprint uz trenutačni schema i serializer contract.

Ovo ograničenje mi je važnije od samog hasha. U razvoju postoji stalna potreba da se indikator pretvori u stvarnost koju navodno mjeri. Frame time postane kvaliteta igre, broj taskova postane produktivnost, test coverage postane sigurnost, relationship score postane odnos. Fingerprint je koristan samo dok ostaje skroman: on kaže da se određeni niz bajtova nije promijenio. Sve drugo moramo dokazati drugim testom.

## Browser nije arhiva samo zato što ima localStorage

Web dio sada dobiva mali command API. Kada Unity instance postane spreman, `SLEGNUCE_SHELL.command(type, payload)` šalje strukturiranu naredbu GameObjectu `WebBridge`, koji je prosljeđuje `RunEngineu`. Dodani su `START_RUN`, `RESTORE_RUN`, `REQUEST_STATE`, `REQUEST_RUN_EXPORT`, `COMMIT_CHOICE` i `ADVANCE`. Na drugoj strani Unity emitira `RUN_STARTED`, `SCENE_CHANGED`, `CHOICE_COMMITTED`, `RUN_COMPLETE`, `RUN_RESTORED` i eksplicitne rejection evente.

`SlegnuceWeb_SaveRun` i dalje sprema završni state u `localStorage['slegnuce:last-unity-run']`. To je dovoljno za prvi dokaz, ali nije dugoročni save dizajn. Browser storage može biti obrisan, razlikuje se po originu i nije backup. Razlog da ga sada koristimo nije uvjerenje da smo riješili persistenciju, nego činjenica da je to najkraći put preko granice procesa: state mora napustiti Unity, preživjeti bez Unity scene i zatim se kroz istu javnu poruku vratiti.

Custom Web template dobio je i `?debug=1`, koji prikazuje zadnji bridge event bez otvaranja DevTools-a, te nekoliko eksplicitnih helpera poput `SLEGNUCE_SHELL.requestState()` i `restoreLastRun()`. `?restore=1` postoji samo za namjerni test automatskog restorea. Ne želim da production build sam pretpostavi da igrač želi nastaviti posljednji run čim otvori stranicu; to je UX odluka, a ne tehnička posljedica činjenice da save postoji.

Tu je dvostruko značenje projekta možda najjasnije, ali ne treba ga posebno ukrašavati. Institucija koja posjeduje zapis još uvijek mora odlučiti kada taj zapis ima pravo djelovati na sadašnjost. Browser koji ima spremljeni JSON također ne bi smio sam odrediti da je to trenutno stanje igre. Postojanje evidencije i autoritet evidencije nisu isto.

## Namjerno ružan view

Dodao sam `PrototypeShelterView`, vrlo običan `OnGUI` development harness. Automatski se instalira samo u Editoru ili Development Buildu. Prikazuje resurse, roster, schema, fingerprint, scenarij i choice gumbe, a nakon završetka dopušta kopiranje cijelog JSON-a. To nije korak unatrag od vizualnog smjera koji smo već postavili; upravo suprotno, to je izolacija odgovornosti.

Ako sada napravim production UI, modularne portrete, animirani shelter i finalne tokene, a zatim restore izgubi `NeighborHelped`, debugging će morati proći kroz deset vizualnih slojeva koji s problemom nemaju veze. Development harness je kontrolni instrument. Kada round-trip prođe, možemo ga ugasiti i spojiti isti `RunEngine` na pravi presentation layer. Ako presentation layer tada nešto pokaže pogrešno, znat ćemo da bug nije u povijesti runa nego u prijevodu stanja u sliku.

To je konstruktivniji način da art i kod ostanu ambiciozni istodobno: ne tražiti da jedan sloj rano glumi završnu kvalitetu drugoga.

## Što još nije dokazano

Ovaj commit i dalje nije Unity Web release. C# source sada definira round-trip put, browser template zna poslati i primiti naredbe, a testni scenarij može se instancirati bez asseta, ali repository sam po sebi još nije izvršio Unity compiler. To znači da su mogući problemi s API kompatibilnošću, WebGL strippingom, actual `SendMessage` timingom ili Unityjevom serializacijom u konkretnom projektu i dalje otvoreni.

Zbog toga sam napisao `ROUNDTRIP_TEST.md` s dvanaest prolaznih uvjeta. Ne smatram migraciju uspješnom dok stvarni development Web build ne pokaže `RUN_STARTED`, ne izvrši legalan choice, ne spremi state u browser, ne vrati ga kroz `RESTORE_RUN`, ne proizvede isti state/fingerprint i ne odbije malformed ili unsupported payload. Jednako je važno da novi run nakon restorea ne naslijedi stari state; persistence bugovi često se skrivaju kao uspješna restauracija dok zapravo samo isti objekt nikada nije bio očišćen.

Sljedeći korak zato nije napisati još jednu apstrakciju. Sljedeći korak je pokrenuti ovaj kod u stvarnom Unityju, dobiti prvi compile i zatvoriti tih dvanaest točaka jednu po jednu. Tek poslije toga ima smisla vezati modularne spriteove Mire, Davora, Ene i Ivana na `PresenceState`, `bond` i buduće fiziološke stateove.

Ako tada lik na ekranu izgleda žedan, želim moći pratiti put natrag do vrijednosti koja je to uzrokovala. Ako nakon reload-a i dalje izgleda žedan, želim dokaz da je ista vrijednost preživjela, a ne da je animator slučajno ostao u istom stateu. To je razlika između atmosfere koja uvjerljivo izgleda kao kontinuitet i sustava koji kontinuitet stvarno posjeduje.

Za igru o ljudima koji pokušavaju sačuvati smisao dok se infrastruktura oko njih raspada, to mi se čini dovoljno strogim mjestom za početak.
