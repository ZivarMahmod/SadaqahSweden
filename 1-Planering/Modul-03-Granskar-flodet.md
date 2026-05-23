# Modul 3 — Granskar-flödet

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`, `Modul-02-Insamlar-flodet.md`

---

## 1. Vad modulen är

Modul 3 är **resan för granskaren** — Zivar och hans två bröder i föreningens styrelse. Det är processen från att ett ärende landar i kön till att ett beslut är fattat och loggat.

**Viktig avgränsning från start:** Modul 3 är **PROCESSEN och FLÖDET**, inte policyn. *Vad* som godkänns eller avvisas mot islamiska principer — den faktiska regelboken — bor i **M8**. Modul 3 svarar på "hur går granskningen till", inte "var går gränsen". Granskaren *tillämpar* M8 via verktygen i M3.

**Den löser:** plattformens viktigaste löfte är att inget når allmänheten ogranskat (princip 7). Men granskning får inte bli en flaskhals som dödar plattformen, och inte ett heltidsjobb för Zivar som inte har tid (princip 3). Modul 3 är hur granskning blir *strukturerad, snabb, rättvis och loggad* — utan att svälja granskarens liv.

---

## 2. Varför den behövs

Granskningen är, med sammanfattningens egna ord, *"troligen den svåraste delen, inte tekniken"*. Tre saker måste lösas samtidigt:

1. **Inget ogranskat publiceras.** GoFundMes "publicera först, moderera sen" är ett bedrägerihål — bekräftat av research. Vår modell är granska-först (B-modellen, princip 1).
2. **Granskning får inte krossa granskaren.** Zivar har inte tid att granska heltid. Flödet måste vara så strömlinjeformat att tre deltidsbröder klarar volymen — och så automatiserat att rutinärenden går snabbt.
3. **Granskning måste vara rättvis och spårbar.** En avvisad insamlare ska aldrig kunna säga "det stod aldrig så" eller "ni var godtyckliga". Varje beslut motiveras och loggas.

Modul 3 är inte teknikens svåraste del — men det är förtroendets viktigaste del. En enda fejk som glider igenom kan slakta plattformens trovärdighet (M1:s motivering för att stänga ute modell C). Granskar-flödet är vakten vid grinden.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Granskningskön — hur ärenden kommer in, tilldelas, prioriteras, SLA | ✅ Spikad |
| 2 | Granskningsvyn — vad granskaren ser, checklistan, interna anteckningar | ✅ Spikad |
| 3 | Beslut — godkänn / avvisa / ändringsbegäran, motivering, loggning | ✅ Spikad |
| 4 | Eskalering & flergranskar-beslut — stora belopp, oenighet, kontroversiella fall | ✅ Spikad |
| 5 | Fast-track för återkommande cykler — diff-granskning (parkerad, planerad) | ✅ Spikad |

Blocken är granskarens arbetsdag, i ordning: ärendet kommer in (1), granskaren tittar (2), beslutar (3), eskalerar vid behov (4), och slipper granska om från noll vid återkommande cykler (5).

---

# BLOCK 1 — Granskningskön

Hur ärenden når granskaren, fördelas, prioriteras och hålls inom rimlig tid. Köns hela syfte: granskaren ska aldrig behöva *leta* arbete, och ingen insamlare ska tappas bort.

## 1.1 Hur ärenden kommer in

**Vad blocket är:** ingången till granskningen — vad som triggar att ett ärende blir granskningsbart.

**Specifikation:**
- När en insamlare skickar in (M2 Block 2) går insamlingen `utkast` → `inskickad` (M1 B3) och hamnar **automatiskt i granskningskön**.
- Kön är **en gemensam lista** för alla tre granskare — inte tre separata köer. Alla ser allt.
- Varje köpost visar: titel, kategori, målbelopp, insamlarens namn + KYC-status, inskickningstidpunkt, rundnummer (om åter-inskickad efter `ändring_begärd`), och eventuell eskaleringsflagga.
- Åter-inskickade ärenden (`ändring_begärd` → `inskickad`, M2 Block 2) går **tillbaka i kön** men markerade som "Runda 2/3..." så granskaren snabbt ser att det är en uppföljning, inte ett nytt ärende.

**Designval:** En gemensam kö, inte tre. Med bara tre granskare på deltid skapar separata köer döda zoner — en bror är bortrest, hans kö samlar damm. En delad lista med auto-tilldelning (1.2) gör att arbetet alltid flyter till någon som kan ta det.

**Kantfall:** Insamlaren drar tillbaka sitt ärende innan någon plockat det (M2 Block 2.1) → ärendet försvinner ur kön, tillstånd tillbaka till `utkast`. Inget granskararbete spills.

## 1.2 Auto-tilldelning

**Vad det är:** mekaniken som ser till att varje ärende har en ansvarig granskare utan att någon måste fördela manuellt.

**Specifikation:**
- När ett ärende kommer in **auto-tilldelas** det till en av de tre granskarna enligt **round-robin med tillgänglighet** — turordning, men hoppa över granskare som markerat sig "otillgänglig".
- Tilldelning är **mjuk, inte låst:** den tilldelade granskaren är *ansvarig* (och får notisen, M15), men vilken granskare som helst kan plocka vilket ärende som helst ur den gemensamma kön. Plockar någon annan ett ärende byter ansvaret över.
- En granskare kan markera sig **otillgänglig** (bortrest, sjuk, upptagen) — då tilldelas inga nya ärenden hen, och pågående kan lämnas tillbaka till kön.
- När en granskare plockar/tilldelas ett ärende: `inskickad` → `under_granskning` (M1 B3).
- **Återkommande cykler** (Block 5) auto-tilldelas helst till **samma granskare** som tog föregående cykel — kontinuitet, hen känner redan insamlingen.

**Designval:** Auto-tilldelning + fri omplockning är 95 %-principen (princip 3) tillämpad på granskarteamet. Ingen människa fördelar arbete manuellt; systemet gör det, men låser inte — verkligheten (sjukdom, resor) hanteras genom "otillgänglig"-flaggan, inte genom administration.

**Kantfall:** Alla tre granskare är otillgängliga samtidigt → ärenden samlas i kön, SLA-klockan tickar (1.4), och M16-admin får en larmsignal när kön växer. Plattformen döljer inte att granskning är pausad — den larmar.

## 1.3 Prioritering

**Vad det är:** i vilken ordning granskaren bör ta ärenden när kön har flera.

**Specifikation — prioriteringsordning (högst först):**

| Prioritet | Ärendetyp | Varför |
|---|---|---|
| 1 | **Akut katastrofhjälp**-kategori | Tid är hjälp. En vecka i kö kan vara meningslöst för en katastrof. |
| 2 | **Åter-inskickade** (runda 2+) | Insamlaren har redan väntat en runda; håll bollen rullande. |
| 3 | **Eskaleringsflaggade** (stora belopp m.m., Block 4) | Kräver mer tid → börja tidigt. |
| 4 | **Övriga, äldst först** (FIFO) | Rättvisa: först in, först granskad. |

- Kön **sorteras automatiskt** enligt detta; granskaren behöver inte tänka, bara ta uppifrån.
- Granskaren kan **manuellt avvika** från ordningen — prioritering är vägledning, inte tvång.
- En **SLA-färgmarkering** (1.4) ligger ovanpå: ett ärende nära sin tidsgräns lyfts visuellt oavsett kategori.

**Designval:** Katastrofhjälp högst är ett värderingsbeslut, inte ett tekniskt — det speglar att plattformens mening är att hjälp ska nå fram. FIFO för resten garanterar rättvisa: ingen insamlare hoppas över för att hen är "tråkig".

## 1.4 SLA — riktmärke 72 timmar

**Vad det är:** löftet om hur snabbt en insamlare får besked, och hur plattformen håller det.

**Specifikation:**
- **SLA-riktmärke: 72 timmar** från `inskickad` till första granskar-besked (godkänd, avvisad, eller ändringsbegäran). Detta är talet insamlaren ser i M2 Block 2.1.
- SLA-klockan **pausas** medan bollen ligger hos insamlaren (`ändring_begärd`) och **startar om** vid åter-inskickning. SLA mäter granskarens svarstid, inte insamlarens.
- Köposter har en **färgmarkering** mot SLA: grön (gott om tid) → gul (närmar sig) → röd (över 72 h).
- Eskaleringsflaggade ärenden (Block 4) har **förlängd SLA** — utökad granskning tar längre tid, och insamlaren informeras om det när flaggan sätts.
- Ett rött ärende triggar en notis till **alla tre granskare** (M15) och syns i M16-admin-dashboarden.

**Designval — riktmärke, inte hårt kontrakt.** 72 timmar är ett *mål*, inte ett juridiskt löfte. Tre bröder på deltid kommer ibland missa det — och det är "vårt fel men inte dödligt" (princip 4). Vi över-designar inte: vi mäter, färgmarkerar, larmar, och låter granskarna se sanningen. Att dölja en växande kö vore värre än att missa 72 timmar.

**Kantfall:** Ett ärende blir liggande rött i veckor (alla granskare överbelastade) → M16-admin eskalerar; en strukturell signal att granskarteamet behöver växa eller att fast-track (Block 5) bör aktiveras. Detta är inte ett enskilt fel — det är data om att modellen behöver justeras.

## 1.5 Granskningsskalning — när teamet utökas

**Vad det är:** den explicita mekanismen för att utöka granskar-teamet när tre bröder inte längre räcker — utan att kvaliteten faller.

Avsnitt 1.4 och 7 säger redan att granskarkapacitet är plattformens första flaskhals. Detta avsnitt spikar *vad som händer då* — så att svaret inte improviseras under press.

**Tröskel — när skalning utlöses:**
- Skalning övervägs när **minst ett** av dessa riktmärken slår till:
  - **Ihållande kö** — fler än **15 ärenden** väntande i mer än en vecka i sträck (inte en tillfällig topp).
  - **SLA-glidning** — den typiska väntetiden närmar sig SLA-riktmärket 72 h, eller röda ärenden (1.4) blir återkommande snarare än enstaka.
- M16-admin-dashboarden (kölängd, SLA-status) är datakällan; siffrorna är riktmärken, inte hårda kontrakt — samma logik som SLA:n själv (princip 4).

**Vad skalning är — och inte är:**
- Det är ett **utökat granskar-team** av i förväg betrodda, förgranskade granskare — **inte** en utvidgad styrelse. Styrelsens tre bröder behåller sin roll; nya granskare är granskare, inget annat.
- Kandidater är förgranskade i förväg (av styrelsen, kopplat till Bröderskapspakten) så att teamet kan växa *snabbt* när tröskeln nås — urvalet får inte börja först när kön redan brinner.

**Hur en ny granskare läggs till utan kvalitetstapp:**
1. **Kalibrering mot regelboken (M8).** Den nya granskaren går igenom M8 och ett antal redan avgjorda ärenden, och jämför sina bedömningar mot de faktiska besluten. Avvikelser diskuteras tills bedömningen ligger i linje.
2. **Börja med dubbelgranskning.** Den nya granskarens första ärenden granskas också av en erfaren bror (samma mekanik som flergranskar-beslut, Block 4.2). Beslut fattas gemensamt tills den erfarna granskaren ser konsekvent kvalitet.
3. **Successiv självständighet.** När kalibrering och dubbelgranskning visat stabil kvalitet får den nya granskaren granska rutinärenden själv. Eskalering (Block 4) och stora belopp ligger kvar hos det erfarna teamet tills vidare.

**Designval:** Att spika tröskel och inskolning *nu* — innan de behövs — är samma logik som fast-track (Block 5): planera ventilen innan trycket kommer. En kö som spräcker SLA frestar någon att släppa igenom ärenden ogranskat (avsnitt 7) — den risken möts med fler kalibrerade ögon, inte med sänkt ribba. Förgranskade kandidater + kalibrering + dubbelgranskning är hur teamet växer utan att granskningen blir godtycklig.

**Kantfall:** Volymen sjunker igen efter en topp → inga granskare avskedas; de blir vilande och kan markera sig "otillgänglig" (1.2). Teamet andas med behovet.

## 1.6 Volymstrategi som riskverktyg

**Vad det är:** mekanismen för att plattformen aktivt kan **begränsa** volym som en säkerhetsåtgärd — inte bara skala upp den. Att hålla inflödet kontrollerat är ett granskningsverktyg och ett riskverktyg, särskilt tidigt.

**Varför detta är ett riskverktyg, inte en broms av rädsla:**
- Granskning kan bara hålla kvalitet upp till en viss volym (1.5). Mer inflöde än teamet klarar = sänkt ribba eller spräckt SLA.
- **Bank- och processorrisken är direkt kopplad till volym.** Stripe och betalningspartners reagerar på plötsliga volymtoppar, chargebacks och oväntade mönster (se `Beredskapsplan.md` och **M5**). Okontrollerad tillväxt kan utlösa en frusen utbetalning eller en stängd integration — ett existentiellt hot. **Kontrollerad volym = kontrollerad risk.**
- Tidigt finns inga driftdata att luta sig mot. Att börja smalt och vidga medvetet är försiktighetsprincipen (Block 4.3) tillämpad på hela plattformens inflöde.

**Spakarna — vad plattformen kan dra i:**

| Spak | Vad den gör | När |
|---|---|---|
| **Manuellt godkännande av alla nya insamlingar** | Ingen insamling går live utan ett granskar-beslut. Detta är redan grundmodellen — men i tidig fas är det också en medveten volymspärr. | Tidig fas, alltid |
| **Tak på antal samtidigt aktiva insamlingar** | Plattformen sätter en övre gräns för hur många insamlingar som får vara `aktiv` samtidigt; nya hålls i kö när taket nås. | Tidig fas / vid risksignal |
| **Tak på totalt insamlat belopp per månad** | Ett plattaks-riktmärke för plattformens samlade volym per månad — bromsar mot den volymtopp som oroar en betalningspartner. | Vid behov, särskilt tidigt |

- Spakarna styrs från **M16-admin** och kan dras åt eller släppas gradvis allteftersom förtroende byggs med banken/processorn och granskar-teamet (1.5) växer.
- **Exakta siffror per fas spikas inte här.** De hör hemma i en separat rollout-plan. Detta avsnitt spikar **mekanismen och spakarna** — inte de slutgiltiga talen.
- Detta är medvetet kopplat till granskningsskalning (1.5): de två avsnitten är samma ratt åt olika håll — släpp på volym när teamet och bankrelationen tål det, strama åt när de inte gör det.

**Designval:** Att kunna *begränsa* volym är lika viktigt som att kunna granska den. En plattform som växer snabbare än sin granskningskapacitet eller sin bankrelations tålamod skadar sig själv — en frusen Stripe-integration stoppar varje utbetalning till varje insamlare samtidigt. Volymspakarna gör tillväxten till ett medvetet beslut, inte något som bara händer. Princip 3 (95 % självgående) gäller driften — men *tillväxttakten* är ett av få beslut som medvetet ska vara en mänsklig spak.

**Kantfall:** Taket nås mitt under en akut katastrof-situation med stort hjälpbehov → admin kan tillfälligt höja taket manuellt; katastrofhjälp har redan högsta köprioritet (1.3). Spaken är ett verktyg för omdöme, inte en absolut mur.

---

# BLOCK 2 — Granskningsvyn

Vad granskaren faktiskt ser och gör när hen öppnar ett ärende. Vyns hela syfte: göra ett svårt omdömesbeslut *strukturerat* så att tre olika personer granskar någorlunda likadant och inget glöms.

## 2.1 Vad granskaren ser

**Vad det är:** granskarens arbetsyta — hela insamlingen, så som den faktiskt är.

**Specifikation:**
- Granskaren ser **allt** — också de fält insamlaren valt att hålla privata (M1:s per-fält integritetskontroll: "data lagras → granskaren ser allt → donatorn ser bara det publika", princip 2).
- Vyn visar:
  - Hela insamlings-objektet, fält för fält (alla M1-block).
  - Insamlarens **fem strukturfråge-svar** (M2 Block 1.2) — råmaterialet, värdefullt för att bedöma äkthet.
  - All media, inklusive de bilder som inte är publika.
  - Eventuella **verifieringsdokument** för mottagaren (M1 B1 F4).
  - Insamlarens **KYC-status och historik** från M6 — tidigare insamlingar, deras utfall, eventuellt `avslutad_utan_resultat`, badges.
  - Vart externa länkar i beskrivningen pekar (M1 B1 F3).
- En **donator-preview**-knapp: granskaren kan växla till att se exakt vad en donator skulle se — för att bedöma helhetsintrycket.

**Designval:** Granskaren ser insamlarens historik direkt i vyn. En insamlare som tre gånger lämnat `avslutad_utan_resultat` är ett annat granskningsfall än en förstagångsinsamlare — granskaren ska ha det sammanhanget utan att leta. Detta är inte diskriminering; det är att låta dokumenterad historik informera omdömet (kopplar M9/M7).

## 2.2 Granskningschecklistan

**Vad det är:** en strukturerad checklista granskaren går igenom fält för fält. Detta är blockets kärna — det som gör tre personers granskning konsekvent.

**Specifikation:**
- Checklistan har **en punkt per granskningsbart fält/aspekt**. Granskaren bockar av: ✓ OK / ⚠ Behöver ändras / ✗ Underkänt.
- **Punkterna i checklistan (v1-utgångspunkt):**

| # | Checkpunkt | Vad granskaren bedömer |
|---|---|---|
| 1 | Kategori | Rätt kategori(er) vald? Stämmer mot innehållet? |
| 2 | Titel | Seriös, inte clickbait, ingen ALL CAPS/emoji (M1 B1 F2)? |
| 3 | Beskrivning — tydlighet | Förstår man vad, varför, hur pengarna används? |
| 4 | Beskrivning — islamisk förenlighet | Krockar ändamålet med islam? (Bedöms mot **M8**.) |
| 5 | Beskrivning — anti-diskriminering | Diskriminerande språk, riktat hat, sekterism? (Mot **M8**.) |
| 6 | Mottagare | Trovärdig, tillräckligt beskriven, verifieringsdok om möjligt? |
| 7 | Media | Äkta, relevanta, inte stockbilder/dramatiserade (M1 B1 F5)? |
| 8 | Mål & modell | Rätt målmodell för projektet? Belopp rimligt? |
| 9 | Datum | Insamlingsdeadline och genomförandedatum rimliga? |
| 10 | Övermålsplan | Deklarerad om övermål tillåts (M1 B2 F3)? |
| 11 | Externa länkar | Pekar de någonstans olämpligt? |
| 12 | Helhetsbedömning | Känns insamlingen äkta och genomförbar? |

- **Den faktiska bedömningsstandarden för punkt 4 och 5** (vad som är islamiskt förenligt, vad som räknas som diskriminering) **bor i M8.** Checklistan i M3 är *strukturen*; M8 är *innehållet*. Ändras en regel i M8 ändras vad granskaren mäter mot — checklistan i M3 ändras inte.
- Granskaren kan inte fatta beslutet "godkänn" förrän alla punkter har en markering — det tvingar fram fullständighet utan att tvinga fram ett visst utfall.

**Designval:** Checklistan är hur tre olika bröder granskar *likadant nog*. Utan den blir granskning ren magkänsla och varierar med dagsform och person — och då blir avvisanden godtyckliga och plattformen orättvis. Checklistan är anti-kaos by design (princip 10) applicerad på granskarna själva. Den är också ADHD-vänlig: granskaren följer en lista, behöver inte hålla tolv saker i huvudet.

## 2.3 Interna anteckningar

**Vad det är:** granskarnas privata arbetsutrymme — synligt för de tre granskarna, aldrig för insamlaren eller donatorn.

**Specifikation:**
- Varje ärende har ett **internt anteckningsfält** + möjlighet att kommentera per checklistepunkt.
- Synligt för **alla tre granskare** — så att en bror som tar över ett ärende, eller en andra granskare vid eskalering (Block 4), ser resonemanget.
- **Aldrig publikt, aldrig synligt för insamlaren.** Helt skilt från den motivering insamlaren får (Block 3) — den skrivs separat och medvetet.
- Anteckningar är permanenta och loggas med ärendet (Block 3.4) — del av spårbarheten.
- Användning: "Ringt och bekräftat med insamlaren", "Bror N har sett detta, vi är överens", "Liknar ärende X som vi avvisade i mars".

**Designval:** En tydlig vägg mellan *interna anteckningar* och *motivering till insamlaren*. Granskaren ska kunna tänka fritt och rått internt ("känns lurt, kolla en gång till") utan att det blir insamlarens besked. Insamlaren får en genomtänkt, respektfull motivering (Block 3) — inte granskarens arbetsklotter.

**Kantfall:** En intern anteckning innehåller känslig info om insamlaren → den omfattas av integritetspolicyn (M8/GDPR). Anteckningar raderas enligt samma gallringsregler som ärendet i övrigt.

---

# BLOCK 3 — Beslut

Granskaren har gått igenom checklistan. Nu fattas beslutet. Block 3 spikar de tre möjliga besluten, kravet på motivering, och loggningen som gör att ingen någonsin kan säga "det stod inte så".

## 3.1 De tre besluten

**Vad det är:** granskarens tre möjliga utgångar ur ett ärende.

**Specifikation:**

| Beslut | Tillståndsövergång (M1 B3) | Vad det betyder |
|---|---|---|
| **Godkänn** | `under_granskning` → `aktiv` | Insamlingen publiceras. Insamlingsdeadline börjar räknas. |
| **Begär ändring** | `under_granskning` → `ändring_begärd` | Insamlingen behöver justeras; bollen går till insamlaren. |
| **Avvisa** | `under_granskning` → `avvisad` | Insamlingen kan inte tas upp. Slutpunkt. |

- **Godkänn:** granskaren kan justera vissa fält *vid* godkännande — kategori (M1 B5.1 tillåter granskaren att ändra), småfel — med en notering om vad som ändrades och varför. Stora ändringar ska i stället bli en ändringsbegäran så insamlaren får säga sitt.
- **Begär ändring:** granskaren bygger en **fältkopplad lista** av ändringspunkter (detta är exakt det insamlaren möter i M2 Block 2.3). Varje punkt: vilket fält + motivering. Detta är det vanligaste beslutet och ska kännas lätt att skapa.
- **Avvisa:** reserverat för insamlingar som inte kan räddas med en ändring — ändamål som krockar med islam (M8), bekräftad oärlighet, projekt utanför plattformens scope. Avvisning är en slutpunkt, men insamlaren kan skapa en ny insamling.

**Designval:** "Begär ändring" är medvetet det lättaste och mest framträdande beslutet. De flesta insamlingar är inte fejk — de är ofullständiga. Granskaren ska luta mot att hjälpa insamlaren bli klar (vakt vid grinden, princip 1), inte mot att avvisa. Avvisning är för det som verkligen inte hör hemma.

## 3.2 Krav på tydlig motivering

**Vad det är:** den ovillkorliga regeln att inget negativt beslut lämnar granskaren utan en motivering i klartext.

**Specifikation:**
- **Begär ändring** kan inte skickas utan att *varje* ändringspunkt har en motivering i klartext.
- **Avvisa** kan inte skickas utan en sammanhållen motivering — och, där det är möjligt, en väg framåt för insamlaren ("Detta kan vi inte ta upp, men om du i stället..." — se M2 Block 2.4).
- Motiveringen ska vara **utbildande, inte dömande** — granskaren förklarar regeln, hänvisar vid policyskäl till rätt punkt i M8.
- Plattformen kan visa **mallformuleringar** för vanliga skäl (clickbait-titel, otydlig pengaväg, saknat verifieringsdokument) som granskaren väljer och anpassar — snabbare *och* mer konsekvent språk mellan de tre granskarna.
- **Godkänn** kräver ingen motivering till insamlaren, men om granskaren justerat fält vid godkännande loggas vad och varför.

**Designval:** Motiveringskravet är inte byråkrati — det är plattformens rykteskydd. En insamlare som förstår *varför* hen fick nej, även om hen ogillar svaret, sprider inte "de är godtyckliga" i det muslimska samhället. Mallformuleringarna löser samtidigt ett verkligt problem: tre granskare som formulerar sig olika gör att samma fel får olika hårt besked. Konsekvens är rättvisa.

## 3.3 Insamlarens svar och flera rundor

**Vad det är:** kopplingen tillbaka till dialogen i M2.

**Specifikation:**
- Efter **Begär ändring** ligger bollen hos insamlaren (M2 Block 2.3). När hen skickar tillbaka går ärendet `ändring_begärd` → `inskickad` och åter till kön (Block 1), helst till **samma granskare**.
- Granskaren ser då sin egen tidigare ändringslista med insamlarens svar och status per punkt — kan bocka av "åtgärdad" och fatta nytt beslut.
- Cykeln kan upprepas; vid runda 3 visar plattformen samma mjuka knuff om ett direkt samtal som insamlaren ser (M2 Block 2.5).
- Svarar insamlaren aldrig → auto-arkivering efter 30 dagar (M1 B3.4). Inget granskararbete krävs.

**Designval:** Ärendet återvänder till samma granskare. Hen har redan kontexten — en annan bror skulle behöva sätta sig in från noll. Kontinuitet sparar granskartid (princip 3) och ger insamlaren en konsekvent motpart.

## 3.4 Fullständig loggning

**Vad det är:** det orubbliga spåret. Hela syftet: ingen — insamlare, granskare eller utomstående — ska kunna säga "det stod inte så" eller "ni bestämde aldrig det".

**Specifikation — för varje ärende loggas permanent:**
- Varje tillståndsbyte, med **tidsstämpel** och **vilken granskare**.
- Varje checklistemarkering (✓/⚠/✗) per punkt.
- Varje beslut (godkänn/begär ändring/avvisa) med fullständig motivering.
- Alla interna anteckningar (Block 2.3).
- Alla rundor — varje ändringsbegäran och insamlarens svar.
- Vid godkännande: **vilken granskare som godkände** (M1 B4.2: "loggas vem som godkände").
- Vid eskalering (Block 4): vilka granskare som deltog och hur de röstade.
- Loggen är **oföränderlig** — append-only. Man rättar inte historik, man lägger till en ny rad.

**Specifikation — synlighet:**
- Loggen är **internt fullt synlig** för granskare och admin (M16).
- Den **publika ändringsloggen** på insamlingssidan (M1 B5.1) är en *delmängd* — den visar att granskning skett och senare publika ändringar, men inte interna anteckningar eller granskarnas namn. Granskarens motivering vid avvisning/ändring syns för insamlaren (M2 Block 2.4), inte för allmänheten.

**Designval:** Append-only-logg är inte överdrift — det är granskarteamets eget skydd. När en avvisad insamlare blir upprörd, eller när en bror om två år ifrågasätter "varför godkände vi den där", finns ett exakt, daterat spår. Det skyddar också *mellan* bröderna: ingen kan i efterhand omtolka vad som beslutades. Loggen är förtroendets infrastruktur — och en förutsättning för att lösa oenighet i Block 4.

---

# BLOCK 4 — Eskalering & flergranskar-beslut

De flesta ärenden granskas av en person på några minuter. Block 4 är för undantagen: stora belopp, kontroversiella fall, och — det svåraste — när de tre bröderna är oense.

## 4.1 När ett ärende eskaleras

**Vad det är:** triggarna som lyfter ett ärende från en-granskar-beslut till flergranskar-beslut.

**Specifikation — ett ärende eskaleras automatiskt eller manuellt:**

| Trigger | Typ | Effekt |
|---|---|---|
| **Målbelopp över riktmärke 500 000 kr** | Auto | Kräver minst **två granskare** för godkännande |
| **Akut katastrofhjälp med stort belopp/bred mottagare** | Auto | Utökad granskning av mottagar-trovärdighet |
| **Granskaren känner sig osäker** | Manuell | Vilken granskare som helst kan flagga "jag vill ha en andra blick" |
| **Kontroversiellt/känsligt ändamål** (gränsfall mot M8) | Manuell | Lyfts till alla tre |
| **Insamlare med problematisk historik** (`avslutad_utan_resultat`, tidigare avvisanden) | Halv-auto | Vyn varnar; granskaren avgör om eskalering behövs |

- **500 000 kr-tröskeln** är M1:s öppna fråga 3 — **här spikas den till 500 000 kr** som riktmärke för v1. Den kan justeras när driften lärt oss volymerna.
- En eskalerad insamling får **förlängd SLA** (Block 1.4) och insamlaren informeras: "Den här insamlingen genomgår en utökad granskning eftersom beloppet är stort — det tar lite längre tid."

**Designval:** Tröskeln 500 000 kr är ett medvetet trubbigt verktyg. Exakt rätt siffra finns inte — poängen är att stora belopp bär större risk (mer skada om det är fejk, fler donatorer drabbade) och därför förtjänar fler ögon. Manuell eskalering finns för att ingen tröskel fångar allt: en granskares magkänsla om ett gränsfall är legitim och ska ha en knapp.

## 4.2 Hur flergranskar-beslut går till

**Vad det är:** processen när två eller tre granskare ska bedöma samma ärende.

**Specifikation:**
- Vid eskalering tilldelas ärendet **ytterligare granskare** (för 500 000 kr-fall: minst en till; för kontroversiella fall: alla tre).
- Varje granskare går igenom **sin egen checklista** (Block 2.2) oberoende och lämnar sitt eget beslut + motivering. De interna anteckningarna (Block 2.3) är delade så de ser varandras resonemang.
- **Beslutsregel för godkännande av eskalerat ärende:** alla deltagande granskare måste vara **eniga** om "godkänn". Är någon för "begär ändring" eller "avvisa" går ärendet den vägen.
- **Begär ändring** vid eskalering: granskarnas ändringspunkter slås samman till en lista till insamlaren.
- All flergranskar-aktivitet loggas (Block 3.4): vem deltog, vad var och en tyckte, hur det slutade.

**Designval:** Enighetskrav för att *godkänna* stora belopp, men inte för att *bromsa*. Logiken: att släppa fram en 600 000 kr-insamling är det riskabla steget — det ska krävas att alla är trygga. Att be om en ändring eller pausa är det säkra steget — en granskares tvekan räcker. Detta är medvetet asymmetriskt: vi gör det lätt att vara försiktig, svårt att vara vårdslös.

## 4.3 När de tre bröderna är oense

**Vad det är:** det känsligaste i hela Modul 3 — hur ett dödläge mellan de tre i styrelsen bryts.

**Specifikation — en stege, i ordning:**

1. **Samtal först.** Plattformen tvingar inte fram en omröstning. De tre bröderna sätter sig ner (digitalt eller fysiskt) och pratar igenom oenigheten. De flesta dödlägen löses här.
2. **Avsikten bryter dödläget.** När samtalet inte räcker är det **inte majoritet eller teknik** som avgör — det är frågan från plattformens filosofi: *vad var insamlarens avsikt, och tjänar ett godkännande plattformens mening?* Sammanfattningens filosofi är beslutsregeln: plattformen finns för att bygga något *för Allah*. Den granskningens utfall som bäst tjänar den meningen — ärlig hjälp som når fram, utan att riskera plattformens trovärdighet — är rätt utfall. Vid genuin tvekan om en insamlings äkthet väger skyddet av förtroendet tyngre än en enskild insamling (M1:s logik för modell C).
3. **Försiktighetsprincipen vid kvarstående oenighet.** Kan de tre fortfarande inte enas: ärendet **godkänns inte**. Det blir "begär ändring" (insamlaren får förtydliga det som skapade tvivlet) eller, om tvivlet är fundamentalt, "avvisa" med respektfull motivering. **Ett ogranskbart tvivel publiceras aldrig** (princip 7).
4. **Medling som sista utväg.** För en djup, principiell oenighet som hotar samarbetet hänvisar Bröderskapspakten (sammanfattningen avsnitt 6) till att be en gemensam vän eller imam medla — det är en föreningsfråga, inte en plattformsfunktion, men M3 pekar på den så vägen är känd.

**Designval:** Vi bygger **ingen "majoritet 2 mot 1"-knapp**. En sådan knapp skulle göra varje svår granskning till en omröstning där en bror regelbundet blir överkörd — och det vittrar sönder broderskapet som hela föreningen vilar på (sammanfattningen avsnitt 6: "tre röster, ingen hierarki"). I stället: samtal, sedan en delad princip (avsikten + plattformens mening), sedan försiktighet. Detta är medvetet inte en teknisk lösning — för det här är inte ett tekniskt problem. Det är ett förtroendeproblem, och det löses mellan människor med en delad kompass.

**Kantfall:** Oenigheten handlar inte om ett enskilt ärende utan om hur en M8-regel ska tolkas → då är det inte ett M3-ärende, det är ett policybeslut. Det lyfts till M8 — regeln förtydligas där, och sedan granskar alla tre likadant igen.

---

# BLOCK 5 — Fast-track för återkommande cykler

Parkerat för v1, men planerat — relationen och tänket måste finnas från start. Block 5 är hur granskningen *inte* görs om från noll när samma insamling körs igen.

## 5.1 Problemet fast-track löser

**Vad det är:** bakgrunden till varför detta block finns trots att det inte byggs i v1.

**Specifikation:**
- M1 B4.3 beskrev **mission** — en återkommande insats som öppnar en ny insamlings-cykel varje månad ("Mat till föräldralösa i Mogadishu"). Parkerad för v1, men `mission_id` finns i datamodellen.
- M2 Block 5.3 gav v1-bryggan: insamlaren kan **"kopiera en insamling som mall"** för att starta en ny cykel.
- **Problemet:** om varje ny cykel av en redan godkänd, redan bevisad insats måste genomgå full granskning från noll, blir granskarteamet överbelastat av rutinärenden de redan sett — tvärtemot 95 %-principen (princip 3). En insamlare som kört samma brunnsinsamling fyra gånger felfritt ska inte köa bakom en förstagångsansökan.

**Designval:** Att planera fast-track redan nu — utan att bygga det — är samma logik som M1:s `mission_id`: bygg uttaget, aktivera funktionen senare. Vi vill inte måla in oss i en granskningsmodell som inte skalar.

## 5.2 Diff-granskning — de tre nivåerna

**Vad det är:** den planerade mekaniken. Granskaren granskar **skillnaden** (diffen) mot den tidigare godkända cykeln, inte hela insamlingen om.

**Specifikation — tre nivåer beroende på hur mycket cykeln skiljer sig:**

| Nivå | Skillnad mot förra cykeln | Granskning |
|---|---|---|
| **Identisk** | Inga förändringar i ändamål, mottagare, modell — bara ny tidsperiod/cykel | **Ingen granskning** — auto-godkänns. |
| **Liten ändring** | Justerat belopp, uppdaterad text, ny media — ändamålet oförändrat | **Snabbgranskning** — granskaren ser bara diffen, bockar av, godkänner. Minuter. |
| **Stor ändring** | Ändrad mottagare, ändrat ändamål, ny kategori, stort beloppshopp | **Full granskning** — behandlas som en ny insamling, hela checklistan (Block 2). |

- Plattformen **beräknar diffen automatiskt** mot den senast godkända cykeln och föreslår nivå; granskaren kan alltid uppgradera nivån manuellt ("det här vill jag titta ordentligt på").
- Fast-track gäller **bara insamlare med ren historik** — en tidigare `avslutad_utan_resultat` eller ett avvisande på missionen tar bort fast-track-rätten tills förtroendet återställts.
- Eskaleringströsklarna i Block 4 gäller fortfarande: en återkommande cykel som passerar 500 000 kr går till flergranskar-beslut oavsett diff.

**Designval:** Tre nivåer, inte två. En binär "granska / granska inte" är för trubbig — den tvingar antingen onödig full granskning av en textjustering, eller farligt lättsläpp av en mottagarändring. Tre nivåer låter granskningens tyngd matcha den faktiska risken. Detta är 95 %-principen: rutin auto-hanteras, omdöme reserveras för det som ändrats.

**Kantfall:** En insamlare gör en "liten ändring" som tekniskt är liten men i praktiken ändrar löftet (samma text, men byter tyst land i ett fält) → diff-motorn ska flagga ändringar i *löftesbärande fält* (mottagare, plats, modell — M1 B5.1) som **stor ändring oavsett storlek**. Diffens nivå styrs av *vilka* fält som ändrats, inte bara hur många tecken.

## 5.3 Vad som krävs innan fast-track kan aktiveras

**Vad det är:** ärlig avgränsning — vad som måste finnas på plats först.

**Specifikation — förkrav:**
- **Mission-modellen** (M1 B4.3) måste vara byggd, eller åtminstone "kopiera som mall"-kedjan (M2 Block 5.3) måste bevara en stabil länk mellan cykler så diffen kan beräknas.
- **Diff-motorn** måste kunna jämföra två insamlings-objekt fält för fält och klassificera löftesbärande kontra kosmetiska fält.
- Granskarteamet behöver **driftdata** — vi behöver ha sett verkliga återkommande cykler för att veta var gränserna mellan nivåerna ska gå.
- Hör ihop med **M15** (notiser till tidigare donatorer när en ny cykel öppnar) och **M7** (varje cykels egen transparens-loop).

**Designval:** Fast-track aktiveras i bygg-grupp C eller senare (masterkartan avsnitt 6), inte i v1. Att specificera det nu kostar inget och säkrar att v1:s datamodell inte stänger dörren. Att bygga det nu vore att optimera ett flöde vi ännu inte sett i verkligheten — och plattformen har viktigare delar att leverera först.

---

## 5. Designval & motivering (hela Modul 3)

| Beslut | Motivering |
|---|---|
| M3 är processen, policyn bor i M8 | Flödet och regelboken är olika problem. Ändras en regel ska bara M8 röras, inte granskarens verktyg. |
| En gemensam kö för alla tre granskare | Tre separata köer skapar döda zoner när en bror är borta. Delad kö + auto-tilldelning får arbetet att alltid flyta. |
| Auto-tilldelning round-robin, men fri omplockning | 95 %-principen: systemet fördelar, ingen administrerar. "Otillgänglig"-flaggan hanterar verkligheten utan byråkrati. |
| Katastrofhjälp prioriteras högst i kön | Värderingsbeslut: plattformens mening är att hjälp ska nå fram i tid. |
| SLA 72 h är riktmärke, inte hårt kontrakt | Tre bröder på deltid missar ibland. "Vårt fel men inte dödligt" — vi mäter och larmar i stället för att över-designa. |
| Explicit skalningströskel + förgranskade granskare, kalibrering, dubbelgranskning | Granskarkapacitet är första flaskhalsen. Svaret måste vara spikat innan kön brinner — fler kalibrerade ögon, inte sänkt ribba. Utökat team, inte utvidgad styrelse. |
| Plattformen kan aktivt begränsa volym (manuellt godkännande, tak på aktiva insamlingar, månadstak) | Kontrollerad volym = kontrollerad risk. Skyddar granskningskvaliteten och bank-/processorrelationen (M5, Beredskapsplan). Tillväxttakt är ett medvetet mänskligt beslut. Siffror spikas i separat rollout-plan. |
| Strukturerad checklista per fält | Får tre olika personer att granska likadant nog. Utan den blir avvisanden godtyckliga och plattformen orättvis. |
| Interna anteckningar skilda från motivering till insamlaren | Granskaren tänker fritt internt; insamlaren får ett genomtänkt respektfullt besked — inte arbetsklotter. |
| "Begär ändring" är det lättaste, mest framträdande beslutet | De flesta insamlingar är ofullständiga, inte fejk. Granskaren ska luta mot att hjälpa, inte avvisa (vakt vid grinden). |
| Motivering obligatorisk vid varje negativt beslut | Rykteskydd: en insamlare som förstår sitt nej sprider inte "de är godtyckliga". |
| Mallformuleringar för vanliga avslagsskäl | Snabbare + konsekvent språk mellan tre granskare. Konsekvens är rättvisa. |
| Append-only-logg av allt | Ingen kan säga "det stod inte så" — skyddar mot insamlare, utomstående och mellan bröderna själva. |
| 500 000 kr-tröskel triggar flergranskar-beslut | Spikar M1:s öppna fråga 3. Stora belopp = större skada om fejk = fler ögon. |
| Enighet krävs för att godkänna eskalerat ärende, men inte för att bromsa | Asymmetriskt med flit: lätt att vara försiktig, svårt att vara vårdslös. |
| INGEN "majoritet 2 mot 1"-knapp för oenighet | En sådan knapp gör varje svår granskning till en omröstning och vittrar sönder broderskapet. Oenighet löses med samtal + delad princip. |
| Avsikten + plattformens mening bryter dödläget | Filosofiskt, inte tekniskt: detta är ett förtroendeproblem, inte ett teknikproblem. |
| Försiktighetsprincip vid kvarstående oenighet — godkänns ej | Ett ogranskbart tvivel får aldrig publiceras (princip 7). |
| Fast-track diff-granskning planeras nu, byggs senare | Bygg uttaget, aktivera funktionen senare — som M1:s `mission_id`. Optimera inte ett flöde vi inte sett i verkligheten. |
| Diff-nivå styrs av vilka fält som ändrats, inte hur många tecken | En tyst ändring i ett löftesbärande fält måste alltid bli full granskning. |

---

## 6. Kopplingar

**Modul 3 tar in:**
- Inskickade och åter-inskickade insamlings-objekt från **M2** (Block 2 — granskningsdialogen).
- Insamlings-objektets fält, tillståndsmaskin och redigeringsregler från **M1** — checklistan granskar M1-fält, besluten driver M1 B3-övergångar.
- Granskningspolicyn — vad som är islamiskt förenligt, vad som är diskriminering — från **M8**. Detta är M3:s viktigaste inkoppling: M3 är tomt utan M8:s innehåll.
- Insamlarens identitet, KYC-status, roll och historik från **M6**.
- Insamlarens transparens-historik (badges, `avslutad_utan_resultat`) från **M7/M9** — input till granskarens omdöme.

**Modul 3 lämnar ut:**
- Granskningsbeslut (godkänd/avvisad/ändringsbegärd) och tillståndsövergångar till **M1** och **M2**.
- Fältkopplade ändringspunkter med motivering till **M2** (granskningsdialogen, Block 2.3).
- Den fullständiga, oföränderliga granskningsloggen till **M16** (admin).
- En delmängd av loggen (att granskning skett) till den publika ändringsloggen i **M1 B5.1**.
- SLA-status, kölängd och eskaleringslarm till **M16** och **M15** (notiser till granskare).
- Vem som godkände — loggas på insamlings-objektet (**M1 B4.2**).

**Hård beroende-flagga:** M3 kan inte byggas färdig utan M8. Checklistans punkt 4 (islamisk förenlighet) och punkt 5 (anti-diskriminering) är skal utan M8:s policyinnehåll. M3:s *flöde* kan planeras nu (det är gjort), men granskning *i drift* kräver att M8 är spikad.

---

## 7. Säkerhet & anti-kaos

- **Granska före publicering** — M3 ÄR den vakten. Tillståndsmaskinen (M1 B3) har ingen väg `utkast` → `aktiv` förbi `under_granskning`. Att hoppa över granskning är inte en regel man bryter — det är ett tillstånd som inte existerar.
- **Strukturerad checklista** — skyddar mot godtycke. Tre granskare med olika dagsform granskar mot samma punkter, inte mot ren magkänsla.
- **Obligatorisk motivering + append-only-logg** — skyddar både insamlaren (rättvisa) och granskarteamet (spårbarhet). Ingen kan omtolka historik.
- **Flergranskar-beslut för stora belopp** — fler ögon där skadan av en fejk är störst.
- **Försiktighetsprincip vid oenighet** — ett tvivel som inte kan redas ut publiceras aldrig.
- **Verklig risk — granskarteamet är en flaskhals.** Tre deltidsbröder är hela granskningskapaciteten. Blir de överbelastade växer kön, SLA spräcks, och i värsta fall frestas någon att släppa igenom ärenden ogranskat för att tömma kön. Skyddet: M16-larm vid växande kö, prioriteringsordningen, och fast-track (Block 5) som ventil. Men detta måste sägas rakt — om plattformen växer snabbt är granskarkapacitet den första saken som spricker. Det är en strukturell risk, inte ett designfel, och den bör övervakas från dag ett.
- **Verklig risk — granskar-godtycke trots checklistan.** Punkt 4 och 5 (islamisk förenlighet, diskriminering) är omdömesfrågor. Två granskare kan landa olika på ett gränsfall även med samma checklista. Skyddet är M8 (tydlig policy), mallformuleringar, eskalering vid osäkerhet, och loggen. Helt borta blir det aldrig — "vårt fel men inte dödligt" — men det ska minimeras, inte ignoreras.
- **Risk — granskaren granskar sin egen eller en närståendes insamling.** Zivars egen bönematteinsamling är pilot; en bror kan vilja driva en insamling. En granskare får **aldrig granska sitt eget eller en nära anhörigs ärende** — det auto-tilldelas en annan granskare, och vid eget intresse i ett ärende ska granskaren avstå. Detta jävsregeln loggas. Bör formaliseras i Bröderskapspakten och M8.

## 8. Automatisering

**Självgående (ingen människa):** köläggning vid inskickning, auto-tilldelning (round-robin + tillgänglighet), kösortering enligt prioritet, SLA-färgmarkering och -larm, tillståndsövergångar efter beslut, diff-beräkning (Block 5, när byggt), auto-godkännande av identiska återkommande cykler (Block 5), arkivering av ärenden där insamlaren aldrig svarar.

**Kräver människa:** själva granskningsbedömningen, varje beslut och dess motivering, interna anteckningar, eskaleringsbedömning vid manuell flaggning, och — framför allt — att bryta oenighet mellan de tre bröderna (Block 4.3, kan per design inte automatiseras).

Riktmärke: ~95 % av en insamlings *väg genom granskningen* (köläggning, tilldelning, sortering, statusbyten, notiser, och med Block 5 även rutincykler) rullar utan handpåläggning. Det granskaren gör är det enda som *kräver* en människa — omdömet. Allt runt omkring sköter sig självt. Det är så tre deltidsbröder kan bära granskningen.

## 9. Öppna frågor

1. **Exakt 500 000 kr-tröskel** — spikad här som riktmärke (svarar M1:s öppna fråga 3), men bör omprövas när driftvolymen är känd. Är talet för högt eller lågt? → ses över efter de första månaderna, i samråd med M8.
2. **Direkt kontaktväg granskare ↔ insamlare** vid runda 3 — delas med M2:s öppna fråga 1. → spikas med M15.
3. **Jävsregeln** — när granskaren har eget intresse i ett ärende — är slagen fast i avsnitt 7, men den exakta definitionen av "nära anhörig" och hur det formaliseras → M8 + Bröderskapspakten.
4. **Belöning/ersättning för granskararbetet** — sammanfattningen nämner att styrelsen kan ta lön när motiverat. Påverkar inte M3:s flöde, men granskarvolym kan i längden kräva en fjärde granskare eller ersättning. → föreningsfråga, inte plattformsfråga.
5. **Vad händer om M8-policyn ändras medan ett ärende är `under_granskning`** — granskar man mot gammal eller ny regel? Lutar mot: ärendet granskas mot policyn som gällde vid inskickning, men granskaren får flagga om en ny regel är avgörande. → bekräftas i M8.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 3:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Alla 5 block spikade: granskningskön (gemensam kö, auto-tilldelning, prioritering, SLA 72 h), granskningsvyn (checklista per fält, interna anteckningar), beslut (tre beslut, motiveringskrav, append-only-logg), eskalering (500 000 kr-tröskel spikad, flergranskar-beslut, oenighet bryts av avsikt + plattformens mening), fast-track diff-granskning (parkerad, tre nivåer planerade). |
| 1.1 | 2026-05-23 | Kirurgiska tillägg efter extern granskning. Block 1: nytt avsnitt 1.5 — granskningsskalning med explicit tröskel (kö >15 ärenden/vecka eller SLA-glidning), utökat granskar-team av förgranskade granskare, inskolning via M8-kalibrering + dubbelgranskning. Nytt avsnitt 1.6 — volymstrategi som riskverktyg: spakar för att begränsa volym (manuellt godkännande, tak på aktiva insamlingar, månadstak), kopplat till bank-/processorrisk (M5, Beredskapsplan); siffror spikas i separat rollout-plan. Två rader tillagda i designvals-/beslutstabellen. |
