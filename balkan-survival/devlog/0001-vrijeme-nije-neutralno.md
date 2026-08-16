---
build: 0.0.1
title: "Vrijeme nije neutralno"
subject: "rad, upozorenja, pristup i cijena čekanja"
systems:
  - GameClock
  - CrisisTimeline
  - ActionTask
  - RunLog
status: production
---

# Vrijeme nije neutralno

Danas sam programirao sat.

To zvuči kao ona vrsta posla koju programer napravi prije ručka pa ga nakon toga zaboravi. `minute += 5`. Prikaži dvije znamenke. Kad dođe dvadeset sati, završi rundu. Sat je valjda najpošteniji dio sustava. Jedna minuta meni, jedna minuta tebi. Demokracija koju je izmislio kvarc.

Problem je što ljudi ne dobivaju istu minutu.

U ovoj verziji igrač u 17:00 saznaje da s vodom možda nešto nije u redu. U 17:15 grupa stanara šalje mutnu fotografiju slavine. U 17:40 vodovod tvrdi da je opskrba stabilna. U 18:30 pritisak stvarno pada. U 19:00 vode više nema.

Igrač sve to vrijeme nije slobodan čovjek u apstraktnom prostoru odluka. Smjena mu završava u 17:20.

To je cijeli commit.

Ne tehnički. Tehnički sam dodao `GameClock`, deterministički `CrisisTimeline`, radnje koje imaju trajanje i mogu se prekinuti te `RunLog` koji zapisuje što se dogodilo, kada, kome i s kakvom posljedicom. Ali razlog za te sustave nije da igra izgleda ozbiljnije. Razlog je da se jedna banalna rečenica napokon može simulirati umjesto napisati u loreu:

**Nije dovoljno informaciju dobiti na vrijeme. Moraš imati i pravo nešto učiniti s njom.**

Netko u 17:05 već puni kadu. Netko u 17:05 skenira artikle, mijenja pelene starcu, stoji u tramvaju, završava smjenu, čeka šefa da zaključa skladište ili upravo sluša kupca koji mu objašnjava da je njegov problem hitan. Sat na mobitelu svima pokazuje isto. To je njegova najuspješnija laž.

## Što sam promijenio

Build 0.0.0 imao je vrlo jednostavnu prisilu: pedeset sekundi, dvanaest kilograma, uzmi što možeš. To je dobro za dokaz osnovne premise, ali loše za društvo. Predmet je mogao biti moralno zanimljiv, ali vrijeme je bilo samo zid koji se približava.

U 0.0.1 vrijeme je postalo stanje svijeta.

Punjenje vode traje 25 minuta dok je pritisak normalan. Kad pritisak padne, ista radnja traje 50 minuta i daje manje. Odlazak u trgovinu traje dulje kad se stvore redovi. Poziv obitelji traje dulje kada se mreža zaguši. Ako si krenuo obaviti nešto u pogrešnom trenutku, grad se neće zamrznuti iz pristojnosti dok završiš.

Radnju možeš prekinuti.

Vrijeme se ne vraća.

To mi je važnije nego što izgleda. U survival igrama često postoji čudna vrsta administrativnog nasilja: kliknuo si nešto, animacija traje, promijenio si mišljenje, ali igra ti kaže da moraš čekati jer je sustav već odlučio da je odluka sveta. To nije težina odluke. To je loš UI odjeven u realizam.

Ovdje možeš odustati. Plaćaš ono što si stvarno izgubio: minute.

## Grad koji govori različitim glasovima

Dodao sam i prvi pravi informacijski sloj. Izvori nisu jedan narrator koji govori istinu u različitim fontovima. Grupa stanara javlja glasinu. Vodovod smiruje situaciju. Civilna zaštita kasnije mijenja ton. Telekom prijavljuje zagušenje. Trgovina zatvara ulaz.

Ništa od toga još nije kompleksna simulacija. To je niz determinističkih događaja.

Ali već sada može proizvesti ono što želim od cijelog projekta: racionalnu pogrešku.

Ako igrač u 17:40 povjeruje službenoj poruci i odluči prvo spremiti dokumente ili nazvati obitelj, nije glup. Ako kasnije ostane bez vode, igra ga ne bi smjela tretirati kao idiota koji nije naučio pravilo. Napravio je odluku na temelju informacije koju je institucija ponudila u trenutku kada je odluka još imala cijenu.

To je puno zanimljivije od "trebao si kliknuti plavu bocu".

## Prvi mali društveni dug

U 18:45 susjed s trećeg kata pita imaš li viška vode. Radnja se ne prikazuje prije toga jer obveza ne postoji dok odnos ne proizvede zahtjev.

Ako imaš barem dvije litre, možeš ih odnijeti.

To smanjuje tvoju zalihu i povećava `solidarity`.

Ne postoji nagrada u obliku +50 XP. Još ne postoji ni kasnija protuusluga. To dolazi s `SocialLedgerom`. Za sada mi je bilo dovoljno da UI prvi put kaže nešto što inventory igre gotovo nikad ne kažu:

**predmet može prestati biti samo tvoj prije nego što ga fizički izgubiš.**

Onog trenutka kad netko pita za vodu, tih šest litara više nije šest litara. Postaje argument.

## RunLog

Svaka važna promjena sada ostavlja strukturirani zapis:

- vrijeme
- tip događaja
- akter
- radnja
- posljedica
- društvene oznake
- build verzija

Igrač ga može izvesti kao JSON.

To trenutno izgleda kao alat za debug, i jest. Ali to je jedan od najvažnijih tehničkih temelja projekta. Ne želim kasnije generirati završne tekstove iz magle i slučajnih rečenica. Ako igra na kraju kaže da si zanemario obitelj, mora moći pokazati zapis u kojem si tri puta odabrao nešto drugo dok je kontakt još bio moguć.

Ako jednog dana završetak bude književan, pod njim mora postojati računovodstvo.

Inače nije emergentna priča. To je autor koji laže igrača o tome što je upravo napravio.

## Što još ne valja

Ovaj build još uvijek ima samo jednog implicitnog protagonista i jednu vremensku putanju. To je namjerno. Sljedeći korak nije dodavanje još trideset događaja nego uvođenje ljudi čije vrijeme nije zamjenjivo.

Kad uvedemo `SocialLedger`, ista boca vode više neće značiti isto ovisno o tome tko ju je kupio, tko ju je obećao, tko ju je potrošio i tko je znao da postoji.

Tek tada će jedna minuta prestati biti samo trajanje radnje i postati ono što je oduvijek bila: komad nečijeg života koji je netko morao potrošiti da bi drugi čovjek mogao imati izbor.

Sat nije nepravedan.

Samo savršeno mjeri posljedice tuđih rasporeda.
