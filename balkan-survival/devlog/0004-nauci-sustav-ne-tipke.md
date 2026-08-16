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

Danas sam igri dodao tutorial i pokušao ne uvrijediti igrača.

To je teže nego zvuči.

Većina tutoriala počne s vrlo važnom informacijom da se gumb može kliknuti. Nakon toga strelica pokaže na broj, zatim se pojavi prozor koji kaže da je broj broj, a onda igra svečano čestita čovjeku što je preživio vlastiti miš.

Slegnuće nema problem s mišem. Ima problem s pravilima koja nisu normalna.

Ovdje dva čovjeka ne znače dva portreta. Znače dva različita skupa legalnih radnji. PRUD i MOSTARINA nisu dvije boje istog novca. Obećanje može biti skuplje od predmeta koji još uvijek fizički stoji na polici. Informacija se troši jer zastarijeva. Dokument može biti istinit i svejedno nepravedan.

Ako tutorial to ne objasni, onda tutorial nije objasnio igru.

Zato build 0.1.1 ima šest koraka i nijedan ne govori igraču što je moralno ispravno.

Prvi pokaže zalihe i kaže da se posljedice prenose. Drugi pokaže ljude i kaže da prisutnost mijenja mogućnosti. Treći pokaže tokene i odbije ih nazvati univerzalnom valutom. Četvrti pokaže događaj. Peti izbor. Šesti log.

To je sve.

Ne želim da tutorial bude roditelj. Želim da bude ugovor.

## Zvuk koji ne glumi glazbu

Još nemamo soundtrack u ovom buildu.

To nije nedostatak koji sam pokušao sakriti generičkim mračnim droneom iz biblioteke.

Napravio sam proceduralni audio sloj u browseru: sitan UI klik, udarac odluke, šum radija, dva kucanja na vratima, električni pad kada nestane struje, papir koji se pomakne kada dođe općinski popis, daleka sirena i jedva čujan hum prostorije.

Zvuk sada radi ono što UI prije nije mogao: daje težinu događaju prije nego što ga igrač pročita do kraja.

Kucanje na vratima nije ukras. Ono mijenja osjećaj granice između “moj stan” i “netko zna da sam unutra”.

Papir ne šušti zato što papir u igrama šušti. Šušti u trenutku kada količina hrane prestane biti kućna činjenica i postane službeni podatak.

Sirena dolazi tek kada više ne postoji odluka koja čuva sve opcije otvorenima.

Audio se aktivira tek nakon korisničkog klika. To je tehničko pravilo browsera, ali ovdje je i dobro dramaturško pravilo: igra ne proizvodi zvuk prije nego što joj igrač kaže da ulazi.

## Animacija kao interpunkcija

Dodao sam motion pass, ali ne želim da Slegnuće postane mobilna aplikacija koja skače svaki put kad broj poraste.

Animacija smije raditi četiri stvari: najaviti novi događaj, potvrditi promjenu, pokazati stanje prostorije i usmjeriti pažnju.

Zato broj kratko “udari” kada se promijeni. Opcije ulaze jedna za drugom. Lampa stvarno umre kada struja nestane. Radio dobije kratak signal. Crvena sirena prođe preko sobe. Papiri se pomaknu kada ih netko pretvara u institucionalnu istinu.

Ako je korisnik uključio reduced motion, sve se to praktički gasi.

Jer pristupačnost nije peti vizualni stil. To je činjenica da igra mora znati kada prestati pokazivati samu sebe.

## Zašto WebGL pripremam prije nego što Unity build postoji

Najlakši način da web verzija igre postane loša jest da jednog dana napravim Unity build i tek tada počnem razmišljati kako se on uklapa u stranicu.

Tada Unity postane stranica. Loader postane naslovnica. Save postane poseban sustav. Audio mute postoji dvaput. Tutorial postoji dvaput. Run JSON više nije isti. Stari buildovi postanu mrtvi linkovi jer je novi runtime odlučio da je povijest tehnički dug.

To ne želim.

Zato sada postoji WebBridge prije pravog Web builda.

Unity će biti runtime. Git će biti povijest. Build će biti artefakt. MAIN će ostati pointer.

Browser može poslati Unityju jednu strukturiranu poruku. Unity može browseru vratiti jedan strukturirani događaj. Run završava JSON-om bez obzira je li ga proizveo sadašnji JavaScript prototip ili budući C# sustav.

To nije uzbudljiv feature.

To je način da za šest mjeseci ne mrzim vlastiti projekt.

## Sljedeći rez

Sada je granica jasna.

Browser je naučio igrača kako čitati igru. Browser je dobio zvuk i motion jezik. Unity ulazna vrata postoje.

Sljedeći veliki korak ne treba biti još pet web featurea.

Treba biti prvi Unity shelter scene koji može napraviti jednu stvar od početka do kraja: primiti roster, prikazati modularne likove, provesti jedan događaj, vratiti posljedicu i završiti bez da web-shell izgubi kontrolu nad buildom.

Tek tada možemo reći da migracija postoji.

Do tada je WebGL samo obećanje.

A ovaj projekt je već dovoljno dugo učio da obećanje treba zapisati prije nego što ga počne trošiti.
