---
build: 0.2.0
title: "Build koji se može dotaknuti"
subject: "Zašto presentation milestone nije gotov dok korisnik ne može otvoriti URL, pomaknuti lika, proizvesti odluku i vidjeti da je prostor pamti"
systems:
  - Browser2_5DRenderer
  - ClickToMove
  - SpatialInteraction
  - StateDrivenScenography
  - LocalRunPersistence
status: playable
---

# Build koji se može dotaknuti

Postoji vrlo ugodna vrsta laži u razvoju igre: kod postoji, arhitektura je razumna, testovi su zeleni, kamera je definirana, a igra još uvijek ne postoji ni na jednom mjestu na kojem je netko može stvarno igrati. Sve pojedinačne rečenice mogu biti istinite, a njihov zbroj i dalje može biti lažan. Igra nije dijagram mogućnosti. Igra je izvršenje.

Zato build 0.2.0 nema zadatak dokazivati da je naš budući Unity WebGL pipeline završen. Nije. Njegov zadatak je stroži i prizemniji: ista ideja koja je u source milestoneu definirana kao 2.5D presentation contract mora postati javno izvršiva u browseru danas. Ne screenshot, ne GIF, ne panel s opisom što bi se trebalo dogoditi, nego prostor u kojem klik proizvodi kretanje, blizina proizvodi mogućnost razgovora, odluka mutira state, a state potom promijeni sobu.

To je razlog zašto je ovaj build označen kao browser presentation reference, a ne kao lažni Unity artefakt. Renderira se na Canvasu, ali ne pokušava sakriti tu činjenicu. Time dobivamo nešto važnije od prividne tehničke prestiži: možemo provjeriti kompoziciju, ritam klika, veličinu lika, udaljenost do Ivana, ponašanje dijaloga, čitljivost interakcijskog prompta i samu ideju da se posljedica vidi na stolu prije nego što potrošimo sljedeći dan na shader koji će možda samo ljepše obojiti pogrešan kadar.

## Kretanje nije gumb

Prijašnji javni buildovi bili su namjerno panel-based jer su dokazivali causal systems. To je bilo legitimno dok je pitanje bilo može li sustav razlikovati pomoć, odbijanje i laž. Nakon što je to dokazano, isti UI postao je prepreka. Ako je odluka 'daj dvije litre' samo pravokutni gumb ispod teksta, igrač ne mora razumjeti gdje se voda nalazi, tko je Ivan, koliko je udaljen od izlaza ili što je ostalo iza njega.

U 0.2.0 klik na pod najprije pomiče tijelo kroz prostor. Klik na Ivana ne otvara dijalog iz beskonačne udaljenosti; protagonist mu prilazi. Vrata nakon odluke nisu gumb NASTAVI nego objekt u sobi. Ova razlika je mala samo u kodu. U dramaturgiji je ogromna: odluka više nije stavka iz obrasca nego događaj kojem tijelo mora prisustvovati.

## Scenografija kao rezultat funkcije

Najvažniji tehnički motiv builda je isti kao u Unity presentation sourceu: scenografija nije drugi state. Dvije boce na stolu nisu podatak koji se posebno sprema. Njihova vidljivost izvodi se iz količine vode. Ako je voda sedam, rezervna boca postoji. Ako odluka spusti vodu na pet, ona nestaje. Ako je susjedu pomognuto, pojavljuje se šalica i Ivanovo držanje tijela postaje manje zatvoreno. Ako stres raste, toplo praktično svjetlo gubi dio ugode.

To je važna granica. Kada bismo spremali `reserveBottleVisible=false` uz `water=5`, prije ili kasnije dobili bismo run u kojem se ta dva podatka razilaze. Tada bismo morali odlučivati kojem vjerujemo. Ovdje odgovor ostaje isti kao u Unity sourceu: vjerujemo činjenici, a kadar je interpretira.

## Zašto ovo još nije finalni rendering

Canvas geometrija nije zamjena za painterly 3D pipeline. Likovi su proceduralne siluete, materijali su plohe, a dubina se dobiva fiksnom projekcijom i ručno kontroliranim vrijednostima. To je namjerno. Build treba razotkriti pogrešnu kompoziciju prije nego što je skupo uljepšamo.

Ako se lik iz ovog kuta izgubi iza stola, to je stvaran problem kadra. Ako Ivan nije dovoljno uočljiv bez quest markera, to je problem vrijednosti i siluete. Ako dijalog prekrije najvažniji dio sobe, to je problem spatial UI-ja. Svaki od tih problema je korisnije pronaći u ružnijem build-u nego nakon tjedna rada na teksturama.

Ali build nije neutralni wireframe. Namjerno ima hladan prozor, topli practical, prljavo-zelene i smeđe mase, blagi noise i nepravilne ljudske siluete. Cilj je već sada testirati smjer: tmurna društvena realnost s painterly težinom, ne sterilna izometrija i ne fantasy diorama.

## Javna granica

Najvažnija promjena ovog commita nije nijedan shader ni JavaScript algoritam. To je činjenica da 0.2.0 ulazi u isti registry kao prethodni buildovi i postaje MAIN. GitHub Pages ga mora moći izgraditi, integrity validator ga mora pronaći na deklariranoj ruti, a javni URL mora posluživati upravo te datoteke.

Time se vraćamo jednostavnom kriteriju kojeg je vrlo lako zaboraviti kada projekt postane arhitektonski zanimljiv: može li druga osoba otvoriti link i napraviti ono o čemu govorimo? Ako ne može, imamo source. Ako može, imamo build.

Unity migration se nastavlja odvojeno. Kada Unity WebGL artefakt prođe svoj pravi build i browser round-trip gate, on smije zamijeniti ovaj reference runtime. Do tada ovaj build nije imitacija gotovosti nego izvršivi ugovor za ono što taj budući runtime mora barem zadržati: kadar, kretanje, spatial interaction, odluku i posljedicu koja ostaje u prostoru.
