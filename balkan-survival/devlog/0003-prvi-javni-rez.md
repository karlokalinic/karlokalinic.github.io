---
build: 0.1.0
title: "Prvi javni rez"
subject: "kada prototip prestane objašnjavati igru i mora postati igra"
systems:
  - VariableRoster
  - CharacterActions
  - TokenEconomy
  - ScenarioChain
  - VisualVerticalSlice
  - RunEnding
status: production
---

# Prvi javni rez

Do sada sam uglavnom programirao razloge zbog kojih igra jednog dana ne bi trebala biti glupa.

To nije isto što i programirati igru.

Možeš imati savršeno objašnjen `SocialLedger`, čist `RunLog`, determinističku vremensku crtu i vrlo ozbiljan dokument o tome zašto voda nije samo broj. Ako igrač otvori build i vidi tablicu s četiri gumba, prvi dojam neće biti: *kako zanimljiva kritika društva*. Prvi dojam bit će: *ovo još nije igra*.

Build 0.1.0 je zato prvi trenutak u kojem sam prisilio projekt da izgleda kao vlastiti argument.

## Lik nije bonus. Lik je mogućnost koja može nedostajati.

Mira, Davor, Ena i Ivan sada nisu četiri portreta uz iste izbore.

Mira može uskladiti zalihe bez laži, racionalizirati vodu i prioritizirati lijekove. Davor može donijeti više nego što drugi mogu nositi, ojačati vrata i potrošiti TLAK kao fizičku prijetnju. Ena može provjeriti prolaz, skupiti informacije i pretvoriti glasinu u rutu. Ivan može pretvoriti PRUD, MOSTARINU, ZAVODNI BON i jezik dokumenata u pristup.

Ako lika nema, nema ni njegovog odgovora.

To je osnovna rečenica cijelog builda.

Nisam htio klasični party RPG u kojem odsutni healer samo znači da će potion koštati 15% više. Odsutnost mora promijeniti retoriku problema. Bez Mire pitanje je manje "kako ćemo ovo pravedno zapisati?" i više "tko uopće zna što smo obećali?" Bez Davora dokument češće postaje jedina poluga. Bez Ene glasina ostaje glasina. Bez Ivana se neki papiri ne mogu pretvoriti u vrata.

Run zato nasumično počinje s dva ili tri lika. Jedan može biti dostupan kasnije. Netko može cijelu večer ostati izvan priče.

Ne zato da RNG proizvodi sadržaj, nego zato da ista moralna situacija ne nudi istu moć svakom kućanstvu.

## Novi novac koji nije novac

Uveo sam pet tokena: PRUD, TLAK, MOSTARINU, ZAVODNI BON i BILJEG.

Namjerno nisu svi valuta u ekonomskom smislu.

PRUD je racionalizirani bon i administrativna prihvatljivost. MOSTARINA kupuje prijelaz. ZAVODNI BON je komad nečijeg radnog vremena. TLAK je društveni pritisak pretvoren u potrošivu polugu. BILJEG nije novac nego dokaz da je netko negdje zapamtio da pripadaš mreži uzajamnosti.

To znači da kuća može biti "bogata" u pet potpuno različitih jezika.

Možeš imati TLAK bez povjerenja. BILJEG bez hrane. PRUD bez vode. MOSTARINU bez razloga da prijeđeš most.

To mi je zanimljivije od još jedne hrpe novčanica.

## Balance the Document je konačno radnja

Šesta scena je prva u kojoj naslovna ideja postaje doslovna mehanika.

Dolazi službenik s tablicom rationinga i zalihe se moraju "uskladiti".

Možeš prijaviti stvarno stanje i izgubiti dio hrane. Mira može napraviti knjigu koja je precizna bez nepotrebnog gubitka. Ivan može manipulirati kategorijama bez promjene količina. Možeš sakriti pola i potpisati.

Sustav ne ispisuje `GOOD +10` ili `EVIL +10`.

Samo pamti postoji li trag prijevare i vraća ga u završetak ako kasnije pokušavaš proći kroz punkt dokumentima.

Papir nije moralni sudac. Papir je memorija institucije.

## Prvi put imamo početak, sredinu i kraj

Run traje jednu večer:

1. upozorenje o vodi,
2. zahtjev susjeda,
3. kontrolna točka i lijekovi,
4. radio i mogući dolazak novog člana,
5. nestanak struje,
6. popis zaliha,
7. sirena i odluka gdje će grupa provesti noć.

Između scena voda pada, hrana se troši, stres raste. Dakle vrijeme više nije dekoracija oko choicesa; ono kažnjava čekanje.

Na kraju možeš ostati, izaći provjerenom rutom, pokušati proći punkt dokumentima, pustiti Davora da ostane na vratima ili izaći bez plana. Završetak čita resurse, prijevaru, laž susjedu i stanje likova.

To još nije velika igra.

Ali prvi put je cijeli mali komad igre.

## Vizualni dug

Ovaj commit također uvodi prve kanonske 3D studijske prikaze Mire, Davora, Ene i Ivana u sam playable build. Namjerno sam ih prvo postavio u neutralni studio: prije animacije i deset outfit varijanti moram moći pogledati lice i tijelo lika i reći da je to ista osoba.

Kasnije ti isti identiteti moraju preživjeti modularne spriteove, umor, žeđ, ozljede, profil, leđa i promjenu odjeće.

Ako ne mogu, asset pipeline je propao bez obzira koliko je slika lijepa.

## Što ovaj build sada mora dokazati

Ne želim još dodati dvadeset događaja.

Želim da igrač nakon prvog runa odmah shvati tri stvari:

- nisam igrao istu igru koju bih igrao s drugim rosterom;
- token koji sam potrošio bio je određena vrsta društvene moći, ne samo valuta;
- odluka iz 18:05 može se vratiti u 23:40.

Ako to radi, imamo jezgru.

Ako ne radi, količina sadržaja je potpuno nebitna.

Ovo je prvi build koji više nema pravo braniti se rečenicom "to je samo prototip".
