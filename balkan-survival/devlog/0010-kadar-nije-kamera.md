---
build: source-milestone
title: "Kadar nije kamera"
subject: "Prvi 2.5D shelter presentation sloj, click-to-move, state-driven scenografija i zašto vizualni stil igre mora biti posljedica istog autoritativnog stanja koje testira browser"
systems:
  - SlegnuceCameraRig
  - ClickToMoveController
  - ScenarioInteractionBinding
  - ShelterVisualRules
  - ShelterPresentationController
  - CharacterPresentation
status: development
---

# Kadar nije kamera

Do sada je Unity scena bila namjerno ružna na pošten način. Kamera je gledala u prazninu, a IMGUI panel pokazivao je ono što je zapravo bilo važno: `RunState`, choice gating, fingerprint, restore i događaje prema browseru. To je bio dobar razvojni alat jer nije pokušavao glumiti igru prije nego što smo mogli dokazati da igra pamti vlastite činjenice.

Ali razvojni alat postaje loš čim ga počnemo brkati s djelom. Ako još mjesec dana gledamo u tablicu na ekranu, počet ćemo dizajnirati mehanike koje dobro izgledaju kao tablica. Voda će biti broj, stres će biti broj, odnos će biti broj, a prostor će postati dekoracija koja se naknadno lijepi na sustav. U igri o kući, oskudici, susjedstvu i tome tko je što vidio to bi bilo gotovo komično pogrešno. Kuća ne smije biti skin za state. Kuća mora biti mjesto na kojem state ostavlja trag.

Ovaj rez zato prvi put daje Unityju ozbiljniju dužnost: ne da odlučuje što je istina, nego da istinu pokaže.

## Perspektiva nije isto što i kamera

Najlakše je reći da želimo 2.5D i zatim postaviti kameru pod kut od četrdeset pet stupnjeva. To nije 2.5D. To je kamera pod kutom od četrdeset pet stupnjeva.

2.5D ovdje znači da kadar ima autoritet. Prostor se ne gradi kao neutralna kutija koja mora izgledati prihvatljivo iz svakog mogućeg smjera. Gradi se za pogled koji smo unaprijed izabrali. Prednji rub stola može sakriti noge. Zid može biti prekratak sa strane koju igrač nikada neće vidjeti. Prozor može biti više svjetlosna masa nego arhitektonski objekt. Vrata mogu imati savršeno čitljivu siluetu iz glavnog kadra čak i ako bi iz slobodne kamere izgledala previše široko.

To nije prevara. Kazališna scenografija nije loša kuća zato što nema pravi strop. Film nije loša arhitektura zato što se zid može izvaditi radi kamere. Kontrolirana perspektiva kupuje mogućnost da svaki kadar tretiramo kao sliku.

Zato nova `SlegnuceCameraRig` nije orbitalna kamera i nije standardni third-person follow rig. Ona je fiksna perspektivna kamera s vrlo uskim vidnim poljem. Perspektiva postoji — ljudi i predmeti stvarno imaju dubinu — ali je dovoljno stisnuta da prostor dobije gotovo ilustriranu ravninu. To je korisna napetost: kadar najprije izgleda kao slika, a onda lik ode iza stola i dokaže da slika ima volumen.

Nisam u ovom rezu prebacio projekt na URP ili HDRP. To je namjerna zabrana, ne odgađanje iz lijenosti. Promjena render pipelinea i promjena prostorne arhitekture dvije su različite vrste rizika. Ako ih spojimo, svaki problem sa sjenama, shaderima, buildom ili WebGL kompatibilnošću moći će se pogrešno pripisati bilo kojem sloju. Prvo zaključavamo što kadar jest. Tek onda ćemo mijenjati kako površina tog kadra izgleda.

## Scena više nije prazna

`SlegnuceBuild.EnsurePrototypeScene()` sada programatski rekonstruira prvi shelter kadar. To je važno iz istog razloga zbog kojeg smo ranije inzistirali na reproducibilnom WebGL buildu: ne želim da ključna razvojna činjenica postoji samo zato što je na jednom računalu netko jednom ručno spremio Unity scenu.

Generator stvara navigacijski pod, dva zida cutaway sobe, tamni prozorski otvor, stol, kuhinjski pult, radio, izlazna vrata, dvije vidljive zalihe vode i malu praktičnu lampu. Dodaje hladni directional key i topli point light. Ambient nije neutralno sivo osvjetljenje nego tri odvojene vrijednosne mase, a linearni fog odvaja dubinu bez potrebe da prostor postane volumetrijski demo.

Ti objekti trenutno nisu art asseti. To su geometrijski argumenti. Stol postoji da provjerimo odnos lika i prednjeg plana. Prozor postoji da kadar dobije hladnu masu. Lampica postoji da testiramo može li state mijenjati atmosferu bez mijenjanja činjenice. Boce postoje jer je voda prva stvar koju više ne želim predstavljati samo brojkom.

To je bitna razlika između greyboxa i privremenog lošeg arta. Greybox postavlja pitanje. Privremeni loš art glumi odgovor.

## Klik nije naredba simulaciji

Player sada može kliknuti po skrivenoj navigacijskoj površini i kretati se kroz kadar. Nema WASD-a kao glavne paradigme i nema slobodnog first-person pogleda. Pointer radi raycast u stvarni Unity world, bira odredište i vodi lika kroz X/Z ravninu ograničenu na kompoziciju sheltera.

Interakcija je namjerno napravljena u dva koraka. Klik na Ivana ne izvršava `give_two_liters` istog framea. Najprije se nalazi njegov interaction anchor. Player do njega fizički dolazi. Tek kada je dovoljno blizu, `ScenarioInteractionBinding` pita postojeći `RunEngine` smije li se choice izvršiti.

To znači da presentation layer ne dobiva vlastitu metodu tipa `GiveWaterAndMakeIvanHappy()`. Takva metoda bila bi ugodna za demo i katastrofalna za arhitekturu. Za nekoliko mjeseci imali bismo jednu istinu u browser testu, drugu u UI gumbu, treću u animaciji i četvrtu u nekom triggeru kraj vrata.

Novi world interaction zato završava na istim `CanChoose()` i `CommitChoice()` metodama koje već koristi razvojni harness i browser bridge. Kadar smije inicirati zahtjev. Ne smije sam sebi izdati potvrdu da je zahtjev postao činjenica.

To je sitna razlika u kodu i velika razlika u budućnosti projekta.

## Sedam litara nije tekst "7"

Prvi `ShelterVisualRules` namjerno je primitivan. Kada je voda na početnih sedam, dvije zalihe vode postoje u kadru. Nakon `give_two_liters`, stanje padne na pet i rezervna boca nestane iz prikaza. Pojavi se prazna šalica kao trag događaja. Ivanov presentation state prelazi iz `Watching` u `Relieved`, a praktično svjetlo malo promijeni intenzitet.

Ništa od toga ne ulazi u `RunState`.

To je upravo poanta. `neighborHelped=true` je činjenica. `Ivan izgleda nešto opuštenije` je interpretacija te činjenice u ovom kadru. Ako sutra odlučimo da je Ivan čovjek koji pomoć prima s još većom nelagodom, možemo zamijeniti `Relieved` s drugačijom pozom bez migracije save schema, bez promjene fingerprinta i bez lažiranja povijesti runa.

Presentation state mora biti jeftin za promijeniti. Narrative state ne smije biti.

Ovo otvara mnogo ozbiljniji model od HUD-a. `water=0` kasnije ne mora značiti samo crvenu nulu u kutu. Može značiti otvoren prazan kanistar, neopranu šalicu, prestanak jedne idle rutine, drugačiji zvuk cijevi i razgovore koji se fizički sele bliže kuhinji. `stress=8` ne mora obojiti progress bar. Može smanjiti frekvenciju pogleda u oči, ubrzati hod, promijeniti koliko dugo netko ostaje sjediti prije nego ustane.

Broj i dalje postoji jer simulacija mora računati. Ali igrač ne mora živjeti u Excelu samo zato što računalo mora.

## Lik nije Animator Controller

Prvi modularni likovi su namjerno napravljeni od jednostavnih dijelova: torso, glava, noge i odvojena stopala. Vizualno to još nije cilj. Arhitektonski jest.

`CharacterPresentation` trenutno posjeduje samo vrlo mali skup vidljivih stanja i proceduralni mikro-idle: disanje, nagib, sitno njihanje. Bitno je da se karakter ne definira jednom animacijskom datotekom koja usput postane identitet lika. Kasnije tijelo, outfit, lice, postura, gesture rate i emotional state moraju biti zamjenjivi moduli istog čovjeka.

To je posebno važno za stil koji tražimo. Lik u ovakvom kadru ne mora stalno izvoditi sadržaj. Često je zanimljiviji kada miruje predugo. Jedan čovjek okreće cijelo tijelo prije nego pogleda sugovornika. Drugi prvo okrene oči, pa glavu, pa tek onda ramena. Treći se naslanja kao da svaki razgovor mora nekako preživjeti bez pune težine vlastitog tijela.

Ako svi imaju isti `Idle`, razlika u teksturi kaputa neće ih spasiti.

## Debug panel nije umro; izgubio je glavnu ulogu

Stari IMGUI development harness ostaje u buildu za Editor i Development konfiguracije, ali je sada skriven iza F1. To je mali, ali disciplinirajući potez.

Ne želim izgubiti alat kojim odmah vidimo state, fingerprint i choice gating. Ali ne želim ni da taj alat određuje što prvo gledamo kada scena krene. Normalan prvi pogled mora biti kadar. Dijagnostika se pojavljuje tek kada je zatražimo.

To je ista hijerarhija koju smo prethodno napravili između browser event ledgera i `RunStatea`. Dobar alat za dokaz ne mora biti dobar protagonist iskustva.

## Zašto još ne tvrdim da ovo izgleda kao Disco Elysium

Ne izgleda.

Ovaj source rez hvata neke strukturne uvjete zbog kojih takav tip prezentacije uopće može nastati: fiksna komponirana perspektiva, dubina koja se čita kroz kretanje, likovi odvojeni od simulacije, state-driven scenografija i interaction model u kojem se klik pretvara u režirani dolazak do mjesta radnje.

Painterly rendering još nije napravljen. Nema finalnih texture paintovera. Nema edge breakup shadera. Nema kontroliranog foreground occlusion sustava. Nema prostornog dialogue layouta. Nema vlastitih character mesh profila. Trenutni primitive shelter mora izgledati kao kostur kadra, ne kao pokušaj da se nekoliko kubusa proglasi estetikom.

To je važno napisati prije prvog screenshota. Stil nije deklaracija u README-u. Ako kasnije finalni kadar ne nosi masu, prljavštinu, teksturu i ljudsku posebnost koju tražimo, činjenica da kamera ima FOV 26 neće ga spasiti.

## Isti događaj, dva svjedoka

Najzanimljiviji dio ovog reza zapravo nije kamera.

Browser i Unity presentation sada mogu promatrati isti događaj iz dvije različite odgovornosti.

Browser nakon `give_two_liters` želi dokazati:

```text
water: 7 → 5
biljeg: 0 → 1
neighborHelped: false → true
RunLog: +1
```

Presentation želi odgovoriti:

```text
jedna zaliha vode više nije u kadru
ostao je predmet koji sugerira da se voda upravo koristila
Ivan više ne stoji na isti način
svjetlosna masa prostorije lagano se promijenila
```

Prvi je dokaz činjenice. Drugi je dramaturgija činjenice.

Ne želim ih spojiti. Upravo zato mogu postati jači.

Ako jednog dana browser test kaže da je voda pet, a kadar još pokazuje obje pune boce, to nije razlog da promijenimo test. To je dokaz da je režija zakasnila za vlastitom pričom. Ako kadar izgleda uvjerljivo, ali state kaže sedam, ne smijemo proglasiti vizualnu sugestiju kanonom. Simulacija i prezentacija mogu se međusobno provjeravati zato što nijedna nije dobila pravo potajno obavljati posao druge.

## Sljedeća granica

Nakon ovog reza više nema smisla dodavati scenarije u obliku novih odlomaka teksta i gumba ako za njih ne postoji prostorna posljedica.

Sljedeći presentation posao zato nije deset novih soba. To bi samo umnožilo nedovršenu gramatiku. Treba završiti jednu sobu dovoljno duboko da znamo što riječ "Slegnuće" znači kada je pretvorena u kadar.

To znači najmanje četiri stvari: foreground occlusion koji može privremeno progutati dio lika bez gubitka čitljivosti, ozbiljniji modularni character silhouette, painterly surface pipeline koji nije post-process filter i prostorni dijalog koji ne prekida svijet da bi otvorio zasebnu aplikaciju preko njega.

Tek tada će `two_liters` biti više od tehnički ispravnog prvog scenarija. Postat će mala scena u kojoj se dvije litre mogu vidjeti kako napuštaju kuću.

A to je cijeli problem ove igre: gotovo ništa što ljudi daju jedni drugima stvarno ne nestane kada izađe kroz vrata.
