---
build: 0.0.2
title: "Dug nije broj"
subject: "susjedstvo, obećanje, privatna zaliha i cijena istine"
systems:
  - SocialLedger
  - RelationshipHistory
  - Reciprocity
  - PromiseState
  - RunLog
status: production
---

# Dug nije broj

Danas sam programirao dug.

Ne kredit. Ne novac. Ne minus na računu. Onaj obični dug koji nastane kada ti susjed kaže: “Imaš li dvije litre za malog?” i ti shvatiš da boca vode više nema samo volumen, masu i mjesto u inventoryju. Ima svjedoka.

U prošloj verziji susjed je tražio vodu i igrač je mogao dati dvije litre. To je bilo dovoljno za prvi dokaz da predmet može biti društven. Ali tehnički je cijela stvar još uvijek završavala kao većina moralnih odluka u igrama: `solidarity += 4`.

To je uredno.

I zato je lažno.

Četiri boda ne znaju tko je kome što dao. Ne znaju je li pomoć bila poklon, posudba, obećanje ili panično iskupljenje nakon prethodne laži. Ne znaju je li primatelj zahvalan, ponižen, sumnjičav ili sada još više ovisan o osobi koja mu je pomogla. Četiri boda mogu reći da je svijet postao “bolji”. Ne mogu reći što se dogodilo.

Zato sam `solidarity` izbacio iz središta sustava i napravio `SocialLedger`.

Ledger nije moralni sudac. On je knjigovodstvo odnosa.

Za svaki smjer odnosa vodi pet dimenzija:

- povjerenje
- obveza
- zamjeranje
- ovisnost
- strah

Ali brojke su samo indeks. Prava informacija je povijest ispod njih.

Ako Ivan dobije dvije litre vode, sustav ne bilježi samo da mu je `trust` porastao. Bilježi događaj `gave_water`, vrijeme, smjer odnosa, promjenu svake dimenzije i rečenicu koja objašnjava zašto se promjena dogodila.

Ako mu obećaš vodu, inventory se ne mijenja.

Ledger se mijenja.

To je najvažnija stvar u cijelom commitu.

## Predmet koji je još kod tebe, ali više nije sasvim tvoj

Igre vole vlasništvo jer je binarno.

Imaš mač ili ga nemaš. Imaš tri konzerve ili dvije. Ključ je u inventoryju ili nije.

Stvarni život puno češće koristi mutnije glagole:

obećao si, posudio si, čuvaš, duguješ, rezervirao si za nekoga, rekao si da ćeš donijeti, rekao si da nemaš, nadaš se da se nitko neće sjetiti.

Ako Ivanu obećaš dvije litre, fizikalno se ništa nije dogodilo. Boca je još u stanu. Njezina masa je ista. Njezina temperatura je ista. Igra je može nacrtati na polici potpuno jednako.

Ali društveno više nije ista boca.

Dio budućnosti već je potrošen.

Zato build 0.0.2 ima radnju **OBEĆAJ IVANU 2 L**. Traje pet minuta. Ne oduzima vodu. Stvara obvezu u smjeru `PLAYER → IVAN` i dependency/trust promjenu u smjeru `IVAN → PLAYER`.

Ako voda u međuvremenu nestane iz sustava, obećanje ne nestaje.

Naprotiv, postaje skuplje.

To mi je puno bliže onome što želim od survival igre nego klasični crafting. Katastrofa nije samo trenutak kada nešto nemaš. Katastrofa je trenutak kada shvatiš da si istu stvar već obećao na dva mjesta.

## Odbijanje nije isto što i laž

Dodao sam četiri odgovora na isti zahtjev:

- dati dvije litre
- obećati dvije litre
- odbiti
- reći da nemaš vode

Na papiru su zadnja dva vrlo slična. U oba slučaja voda ostaje kod igrača.

To je upravo razlog zašto moraju biti različite mehanike.

Ako Ivana odbiješ, povećava mu se zamjeranje. Povjerenje može malo pasti. Odluka mu se ne sviđa.

Ali zna što se dogodilo.

Ako kažeš “nemam vode”, sustav bilježi tvrdnju.

Ranije u timelineu Ivan te može vidjeti kako nosiš boce. Ako se to dogodilo, laž kasnije ima dokaz. U 19:25 ne dobiješ karticu “Karma -20”. Dobiješ poruku:

**“Mislio sam da nemaš.”**

Tada pada povjerenje i raste zamjeranje.

Nisam htio napraviti sustav u kojem je “dobar” igrač uvijek nagrađen, a “loš” kažnjen. To bi bilo dječje vjeronaučno programiranje. Odbiti nekoga može biti racionalno. Možda imaš tri litre za četiri osobe. Možda je laž čak sigurnija. Sustav ne zna što je ispravno.

Ali zna razliku između odluke i krivotvorenja činjenice.

To je dovoljno.

## Povjerenje nije ljubav

Jedan `friendship` bar je opasan jer sve pretvara u istu valutu.

Možeš nekome vjerovati i ne voljeti ga. Možeš mu biti dužan i istovremeno mu zamjerati. Možeš ovisiti o njemu upravo zato što mu ne vjeruješ dovoljno da se osjećaš sigurno. Možeš se bojati osobe koja ti je upravo pomogla.

Zato su smjerovi odvojeni.

`IVAN → PLAYER` nije isto što i `PLAYER → IVAN`.

Ako mu dam vodu, njegova obveza prema meni raste. Moja obveza prema njemu ne mora.

Ako ja obećam vodu, moja obveza prema njemu raste prije nego što je on išta dobio.

To zvuči kao sitnica u strukturi podataka.

Nije.

To je razlika između odnosa i reputacije.

Reputacija je ono što jedna osoba navodno “jest”. Odnos je ono što dvije osobe imaju jedna prema drugoj, u određenom smjeru, zbog određenih događaja.

Ako ikad uvedemo dvadeset stanara, ne želim tablicu “KARMA = 72”. Želim mrežu ljudi koji se sjećaju različitih verzija istog dana.

## Povrat usluge ne resetira dug

Ako Ivanu daš vodu, kasnije ti ostavlja dvije konzerve pred vratima.

To je prva mala reciprocitetna posljedica.

Ali nisam napravio:

`obligation = 0`.

Smanjuje se.

Povjerenje malo raste.

Povijest ostaje.

Jer kada netko vrati uslugu, stvarni odnos se ne vraća na tvorničke postavke. Činjenica da je dug postojao postaje dio odnosa. Ponekad ga ojača. Ponekad ga učini neugodnijim. Ponekad se ljudi godinama svađaju upravo zato što oboje misle da su račun već zatvorili.

Računalo voli nulu.

Ljudi vole rečenicu: “Nisam zaboravio kad sam ti ja…”

Za sada je dovoljno da sustav ne briše dokaz.

## Zašto je ovo tehnički važnije od još deset eventova

Sada možemo napisati budući event ovako:

`neighbor asks for medicine if trust > X, dependency > Y, neighbor knows medicine exists, and previous obligation is unresolved`

To je drugačije od:

`Random.Range(0, 100) < 20`

Prvi sustav proizvodi događaj iz svijeta.

Drugi samo baca sadržaj na igrača.

To je razlika koju želim čuvati cijelim projektom.

Ne želim proceduralnu naraciju koja skriva kocku iza dramatičnog fonta. Želim da svaki važan događaj može odgovoriti na pitanje:

**Zašto se ovo dogodilo baš sada, baš ovoj osobi i baš meni?**

Ako ne može, event nije emergentan. Samo je slučajan.

## Mama i baka su namjerno u istom ledgeru

Ivan nije jedini odnos.

Poziv majci sada mijenja i informacijsko stanje i odnos. Uzimanje bakinih lijekova stvara obvezu prema baki.

To je namjerno neugodno.

Jer survival igre često tretiraju “pokupi lijek” kao pobjedu. Predmet je siguran čim uđe u inventory.

Ali bakini lijekovi nisu spašeni zato što su kod tebe.

Samo su promijenili čuvara.

Sada imaš predmet i obvezu da ga odneseš osobi kojoj pripada.

To je prvi korak prema `ItemDefinition.owner` i pravom ownership sustavu. Kasnije će item moći biti fizički u tvom stanu, pravno tuđi, moralno rezerviran i logistički nedostupan za neke radnje.

Drugim riječima: inventory će napokon naučiti da posjedovanje i pripadanje nisu sinonimi.

## UI mora pokazati razlog

Najveća opasnost ovakvog sustava je skrivena matematika.

Ako Ivan odjednom odbije pomoći igraču jer mu je `trust = 18`, a igrač nema pojma zašto je 18, napravili smo samo sofisticiraniji RNG.

Zato odnos u ovom buildu ima klikabilnu povijest.

Možeš vidjeti:

- vrijeme
- kod događaja
- opis razloga
- točne promjene vrijednosti

To je developerski prikaz i zasad je namjerno ogoljen.

Jednog dana igrač možda neće vidjeti sirove brojke. Ali ja ih moram moći vidjeti. Tester ih mora moći vidjeti. RunLog ih mora moći izvesti.

Ako završetak kaže da ti Ivan ne vjeruje, build mora moći pokazati račun.

Ne zato što se književnost mora opravdavati Excelom.

Nego zato što proceduralna književnost bez uzroka vrlo brzo postane horoskop.

## Što još ne valja

Ovo još nije prava društvena simulacija.

Ivan nema vlastite potrebe koje autonomno troše resurse. Ne donosi odluke dok igrač nije prisutan. Ne poznaje druge stanare. Njegovo znanje o svijetu je nekoliko boolean vrijednosti. Mama i baka postoje uglavnom kao odnosi vezani uz specifične radnje.

To je namjerno.

Sljedeće ne želim napraviti dvadeset NPC-jeva.

Želim napraviti da nekoliko postojećih ljudi stvarno **treba stvari**.

`CharacterNeeds` mora doći prije velike količine sadržaja.

Jer tek kada glad, voda, toplina i umor pripadaju konkretnim osobama, možemo prestati pitati “koliko kućanstvo ima vode?” i početi pitati puno neugodnije pitanje:

**čija je žeđ danas prioritet?**

To će biti sljedeći pravi rez.

Za sada smo napravili jednu malu stvar.

Kada kažeš susjedu da ćeš donijeti vodu, ekran s bocama više ne govori cijelu istinu.

I prvi put mi se čini da inventory počinje nalikovati društvu.
