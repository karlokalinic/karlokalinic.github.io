---
entry: 0000
date: 2026-08-16
build: 0.0.0
title: "Kuća nije bunker. Kuća je popis ljudi kojima vjeruješ."
status: published
---

# Kuća nije bunker. Kuća je popis ljudi kojima vjeruješ.

Danas nisam napravio igru. Napravio sam uvjet pod kojim igra smije početi postojati.

Gledao sam što radi *Survival Log* i najkorisnija stvar nije bila nijedan zombi. Igra trenutno gradi svoju petlju oko vrlo čitljive nepravde vremena: prije katastrofe znaš da katastrofa dolazi, imaš ograničen prozor za kupnju i skupljanje, a nakon toga živiš s vlastitom pripremom. Ima live inventar, kuću koja se širi, struju, hranu, uzgoj, hladnoću, susjede, razmjenu, poruke i različite početne identitete. U recentnim zakrpama developeri popravljaju manje glamurozne stvari — jasniji countdown, prekid radnji, brzi transfer, traženje resursa po spremnicima, postupno pogoršanje hladnog vala. To su, zapravo, lekcije o poštenju simulacije: igrač smije patiti zbog odluke, ali ne zbog toga što je sučelje zaboravilo objasniti vlastita pravila.

To je dio koji uzimam. Ne zombije. Ne njihove predmete. Ne njihovu priču. Uzimam pitanje: **što sve postane vidljivo kad čovjek dobije premalo vremena da nastavi glumiti da mu je sve jednako važno?**

Prvi build zato ima 50 sekundi i 12 kilograma. To je gotovo uvredljivo mali sustav. Na ekranu su voda, hrana, dokumenti, radio, alat, bakini lijekovi, susjedov inzulin, deka, powerbank, novac, cigarete, fotografija i ključ. Klikneš. Torba se puni. Vrijeme ide.

Matematički je banalno. Književno nije.

Šest litara vode ima šest kilograma. Obiteljska fotografija ima gotovo ništa. Ako optimiziram igru kao Excel tablicu, fotografija je fantastičan predmet: gotovo besplatna. Ako optimiziram ljudski život, pitanje više nije masa. Zašto je nosim? Jer ne znam hoće li stan postojati kad se vratim. Zašto nosim dokumente? Jer država možda sutra od mene traži dokaz da sam osoba koju je jučer uredno oporezivala. Zašto nosim susjedov inzulin? Jer je treći kat odjednom postao dio mog kućanstva, a nitko nije održao sastanak stanara da to službeno potvrdi.

Tu projekt počinje.

Najveća opasnost survival žanra nije da postane nerealan. Najveća opasnost je da postane kućanski posao s gamepadom. Jedi. Spavaj. Natoči generator. Popravi vrata. Jedi opet. Ako se sve potrebe prazne jednakom brzinom, čovjek nije lik nego pet spremnika kojima curi dno. Survival Log je i sam nakon demoa javno priznao problem repetitivnog kruga tipa eat/sleep/fix-door i najavio šire aktivnosti, dugoročne ciljeve i grananje priče. To je važnija lekcija od bilo koje pojedinačne mehanike.

Zato ovdje glad neće postojati zato što survival igra treba hunger bar. Postojat će kada može natjerati jednog čovjeka da pojede tuđi dio. Struja neće postojati zato da generator ima animaciju. Postojat će kada frižider s lijekovima, grijalica i radio istodobno žele zadnjih 400 vata. Telefon neće postojati kao quest menu. Postojat će zato što poruka majke, Civilne zaštite i susjedskog WhatsAppa mogu tvrditi tri različite stvari u istoj minuti.

To je metodologija: svaki resurs mora imati društvenu sjenu.

Danas sam također odlučio nešto tehnički dosadno i zato presudno. `main` branch nije MAIN igra. MAIN je pointer u `production.json`. Najnoviji build nema nikakvo prirodno pravo postati preporučeni build. Ako sutra napravim bolju vlagu, goru navigaciju i tri nova crasha, sutra nisam napravio novu produkciju. Napravio sam novi problem. Stari build ostaje igriv.

I devlog ostaje uz njega.

Ne želim godinu dana razvoja nakon koje Git pokazuje dvije tisuće commitova tipa `fix`, `finalfix`, `actually final`, a nitko — uključujući mene — više ne zna zašto je sustav uveden. Ako promijenim pravilo vode, moram napisati što sam promijenio, što igrač sada radi, koju društvenu tvrdnju time pokušavam testirati i što sam pokvario. Dokumentacija ovdje nije administracija projekta. Dokumentacija je druga polovica projekta.

Prvi build nema zombija. Nema crafting. Nema animacije čovjeka koji vrlo ozbiljno otvara konzervu. Ima izbor, rok i posljedicu koja te ne proglašava dobrim ili lošim. Samo ti vrati račun.

To mi je za početak dovoljno.

Jer bunker je rupa s vratima.

Društvo počinje tek kad odlučimo kome ćemo ih otvoriti.

## Research notes

Primary public references consulted for this entry:
- Survival Log Steam store page: https://store.steampowered.com/app/4164790/Survival_Log/
- Survival Log Steam Community updates: https://steamcommunity.com/app/4164790

These sources are used for feature/system analysis only. No proprietary assets, text, characters or code are reproduced.