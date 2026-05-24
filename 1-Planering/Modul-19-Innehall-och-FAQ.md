# Modul 19 — Innehåll & FAQ

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-24
**Status:** Full djup — alla 8 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-08-Policies-och-regler.md` (Block 5 — ToS & integritetspolicy), `Modul-16-Admin-och-dashboard.md` (superadmin förvaltar innehållet), `Tillägg-Nya-beslut-2026-05-23.md` (B2 — beslutet denna modul expanderar; A2 — "Kan jag samla in?"-guiden)

---

## 1. Vad modulen är

Modul 19 är **plattformens informativa innehåll och dess publika fråga/svar-yta** — och det enkla systemet som låter superadmin förvalta det utan att en kodrad skrivs.

Plattformen är inte bara en insamlingsmotor. Designens footer pekar redan på ett tiotal sidor — *Hur det fungerar*, *Granskningen*, *Transparens*, *Sadaqa & Zakat*, *För moskéer*, *Samarbeten*, *Föreningsstöd*, *Anmäl er förening*, *Integritet*, *Villkor*. Footern finns; innehållet bakom länkarna gör det inte. M19 är där det innehållet får ett hem.

Modulen löser tre saker på en gång:

- **Självbetjäning.** En orolig donator, en tveksam blivande insamlare, en moské som undrar hur det fungerar — ska kunna hitta svaret själv, läst och klart, utan att skriva till teamet. Rätt personer skriver svaret en gång; alla andra läser det.
- **Förvaltbarhet.** Innehåll förändras — en formulering blir bättre, en ny vanlig fråga dyker upp. Det får inte kräva en utvecklare varje gång. Superadmin ska kunna ändra **live**.
- **Inga döda kanter.** En footer-länk som inte leder någonstans är en trasig kant — precis det "premium genom omsorg" (princip 6) förbjuder. Tills en sida har innehåll visar M19 en lugn "kommer snart"-sida, aldrig en länk som inte gör något.

> Detta är modulen som gör att plattformen kan **svara på en fråga en gång** i stället för hundra gånger. Den är billig att bygga och dyr att sakna — utan den belastas teamet och region-admins (M18) av frågor som ett stycke text borde ha besvarat.

---

## 2. Varför den behövs

En insamlingsplattform utan informativt innehåll lämnar varje besökare med obesvarade frågor — och en obesvarad fråga blir antingen ett mejl till teamet eller en besökare som vänder i dörren. Båda är dyra.

Fyra konkreta problem modulen löser:

1. **Förtroende kräver förklaring.** Plattformens löfte är "trygga insamlingar, spårbara resultat" och "granskat mot islamiska principer". Det löftet är abstrakt tills någon kan läsa *hur* granskningen går till, *hur* transparensen fungerar, *vad* skillnaden är mellan sadaqa och zakat. Innehållet är där löftet blir begripligt.

2. **Frågor skalar inte med ett trepersonsteam.** Samma fråga ställd hundra gånger via mejl är hundra svar att skriva. Samma fråga besvarad en gång på en FAQ-sida är noll svar att skriva. Detta är princip 3 (95 % självgående) tillämpad på *kommunikation* — och det avlastar inte bara superadmin-teamet utan också region-admins i M18, som annars får frågorna i sin support-kö.

3. **Tröskeln måste sänkas innan någon fastnar.** Tillägg A2 var tydligt: ingen ska gå igenom BankID + Stripe + hela skapande-flödet och *sedan* nekas för att insamlingen inte uppfyller kraven. "Kan jag samla in?"-guiden — kriterierna i klartext, med exempel på vad som godkänns och inte — är ett självbetjäningssvar som måste finnas *innan* någon binder upp sig. Den guiden är innehåll, och den bor här.

4. **Juridiken är ett lanseringskrav.** *Villkor* och *Integritet* är inte trevligt-att-ha. Utan dem får plattformen inte ta emot en enda donation lagligt. De måste finnas, granskade, på plats — före skarp lansering.

M19 bygger lite ny mekanik (ett enkelt innehållssystem) och mycket innehåll. Det innehållet är inte pynt — det är den tysta arbetaren som svarar när teamet sover.

---

## 3. Blocköversikt — 8 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Innehållskartan — de tio sidorna footern pekar på, och vad var och en är | ✅ Spikad |
| 2 | De två innehållssorterna — redigerbart vs juridiskt, och varför reglerna skiljer | ✅ Spikad |
| 3 | CMS-light — hur innehåll lagras, redigeras och publiceras | ✅ Spikad |
| 4 | FAQ — den strukturerade fråga/svar-ytan | ✅ Spikad |
| 5 | "Kan jag samla in?"-guiden — onboarding-tröskelns självbetjäningslager | ✅ Spikad |
| 6 | Funktions-grinden — "kommer snart" i stället för en död länk | ✅ Spikad |
| 7 | De juridiska sidorna — Villkor & Integritet, livscykel och disciplin | ✅ Spikad |
| 8 | Teknisk grund & tidsläge — hur det byggs och i vilken ordning | ✅ Spikad |

Block 1–2 är *vad* innehållet är och hur det delas i två sorter. Block 3–5 är *systemet och dess viktigaste innehåll* — CMS-light, FAQ, och onboarding-guiden. Block 6–7 är *disciplinen* — inga döda länkar, och juridiken hanterad varsamt. Block 8 är *hur och när* det byggs.

---

# BLOCK 1 — Innehållskartan

Designens footer är redan ritad. Den pekar på tio sidor. Block 1 spikar exakt vilka de är, vad var och en ska säga, och vem den talar till — så att ingen sida glöms och ingen byggs utan ett syfte.

## 1.1 De tio sidorna

Sidorna delas i två grupper redan i footern — informativa och juridiska. Den uppdelningen är inte kosmetisk; den styr vilka regler sidan lyder (Block 2).

**Informativa / utbildande sidor** (åtta stycken):

| Sida | Vad den besvarar | Talar till |
|---|---|---|
| **Hur det fungerar** | Hela resan i klartext — skapa, granskas, publiceras, ta emot pengar, bevisa resultat. Plattformen i ett svep. | Alla — nyfikna besökare, blivande insamlare, donatorer |
| **Granskningen** | Vad "granskat mot islamiska principer" konkret betyder. Att projektet prövas, inte personen; hårda regler + gråzonsprocess på begriplig nivå. Refererar M8 utan att kopiera den. | Den som undrar om plattformen är trovärdig och icke-sekteristisk |
| **Transparens** | De tre bevisen (start, utbetalning, resultat), badge-systemet, hur historik följer en profil. Varför "spårbara resultat" inte är ett tomt ord. | Donatorer som vill veta att pengarna gör nytta |
| **Sadaqa & Zakat** | Den islamiska kontexten — skillnaden mellan frivillig sadaqa och obligatorisk zakat, vad plattformen lämpar sig för. Utbildande, inte en fatwa. | Hela det muslimska samhället |
| **För moskéer** | Vad plattformen erbjuder en moské — egen insamling, collab med privatpersoner, synlighet i katalogen. | Moskéer som överväger att gå med |
| **Samarbeten** | Hur collab fungerar — en privatperson driver en insamling *med* en moskés stöd, synligt på insamlingen. | Insamlare och föreningar som vill samverka |
| **Föreningsstöd** | Vilket stöd plattformen och dess struktur ger en muslimsk förening — praktiskt, inte juridisk rådgivning. | Befintliga och blivande föreningar |
| **Anmäl er förening** | Vägen in i föreningskatalogen — självregistrering, vad som krävs, vad granskningen tittar på. Leder in i M10:s registreringsformulär. | Muslimska föreningar och moskéer |

**Juridiska sidor** (två stycken):

| Sida | Vad den är | Talar till |
|---|---|---|
| **Integritet** | Integritetspolicyn — GDPR. Vilka uppgifter samlas, varför, vilka rättigheter användaren har. Innehållet definieras av M8 Block 5.2. | Var och en, lagkrav |
| **Villkor** | Användarvillkoren (ToS) — lätta, klarspråkiga en-klicks-villkor. Innehållet definieras av M8 Block 5.1. | Var och en, lagkrav |

## 1.2 Sidan som objekt

Varje sida — informativ som juridisk — är samma sorts objekt i systemet: en **innehållssida** med ett fåtal fält.

- **Slug** — den läsbara URL-delen (`/hur-det-fungerar`, `/villkor`). Stabil; ändras aldrig efter publicering så att länkar inte dör.
- **Titel** — sidans rubrik.
- **Brödtext** — själva innehållet, i ett enkelt format (Block 3.3).
- **Sidtyp** — `informativ` eller `juridisk`. Avgör vilka regler sidan lyder (Block 2).
- **Status** — `utkast`, `publicerad`, eller `kommer_snart` (Block 6).
- **Senast ändrad** — tidsstämpel + vem.
- **Ikraftträdandedatum** — endast juridiska sidor: när en version börjar gälla (Block 7).

## 1.3 Kantfall

- **En sida nämns i footern men har inget innehåll ännu** → den är `kommer_snart`, footern länkar ändå dit, besökaren möter en lugn platshållarsida (Block 6). Aldrig en död länk.
- **Footern ändras i designen** (en sida läggs till eller tas bort) → footern och innehållskartan ska hållas i synk. En footer-länk utan en motsvarande innehållssida är en bugg; en innehållssida ingen länkar till är vilse.
- **Två sidor överlappar** (t.ex. *Hur det fungerar* och *Granskningen* säger nästan samma sak) → tillåtet, men varje sida ska ha *ett* tydligt syfte enligt 1.1. Hellre korta sidor med ett fokus var än en lång allt-på-en-gång-sida.

---

# BLOCK 2 — De två innehållssorterna

Allt innehåll i M19 är inte likadant. Två sorter, två regelsystem. Block 2 spikar skillnaden — den är grunden för resten av modulen.

## 2.1 Redigerbart innehåll

De åtta informativa sidorna och hela FAQ:n är **redigerbart innehåll**.

- **Superadmin kan lägga till och ändra det live** — via CMS-light (Block 3). Ingen kodändring, ingen deploy, ingen utvecklare.
- **Lågt insats per ändring.** En bättre formulering, en ny FAQ-post, ett förtydligande — det ska gå snabbt och vara reversibelt.
- **Zivar levererar texterna, eller skriver dem direkt** i systemet. Innehållet är hans röst; verktyget ska inte stå i vägen.
- **Konsekvens vid fel är begränsad.** En stavfel eller en otydlig mening på *Hur det fungerar* är ett irritationsmoment — inte en juridisk eller ekonomisk skada. Det rättfärdigar ett *enkelt* system, inte ett tungt redaktionellt arbetsflöde.

## 2.2 Juridiskt innehåll

De två sidorna *Villkor* och *Integritet* är **juridiskt innehåll** — och de behandlas annorlunda.

- **De finns på plats FÖRE skarp lansering.** Plattformen får inte ta emot en donation utan dem (M8 Block 5 — lanseringskrav).
- **De ändras inte slarvigt live.** En juridisk text rör ansvar, rättigheter och lagkrav. Ett oöverlagt ord kan bli ett avtalsbrott eller ett GDPR-fel.
- **De följer juridisk granskning.** M8 Block 5 är tydligt: M8 säger *vad* dokumenten täcker, en föreningskunnig jurist skriver och granskar den *faktiska texten*. M19 ändrar inte den principen — den ger bara texten ett hem och en disciplinerad livscykel (Block 7).
- **Konsekvens vid fel är hög.** Därför extra steg: versionering, ikraftträdandedatum, och att väsentliga ändringar kan kräva förnyat användargodkännande (M8 Block 5.4).

## 2.3 Varför skillnaden finns — och varför den är inbyggd

Att lägga *Villkor* i samma snabbredigerbara system som *Hur det fungerar* vore att inbjuda till olyckan: någon rättar en mening i farten och har oavsiktligt ändrat ett bindande villkor. Att lägga *Hur det fungerar* under tungt juristgodkännande vore det motsatta slöseriet — varje stavfel skulle kräva en granskningsrunda, och då slutar innehållet uppdateras.

Lösningen är **sidtyp** (Block 1.2). Fältet `sidtyp` är inte en etikett — det är en grind. CMS-light (Block 3) läser den och tillämpar olika regler: redigerbara sidor publiceras direkt av superadmin; juridiska sidor går genom Block 7:s disciplinerade livscykel. Samma system, två lägen — bestämda av ett fält, inte av att någon kommer ihåg att vara försiktig.

## 2.4 Kantfall

- **En informativ sida glider in på juridiskt territorium** (t.ex. *Granskningen* börjar låta som ett bindande löfte) → den är fortfarande `informativ`, men texten ska vara försiktig: informativa sidor *beskriver*, de *avtalar* inte. Vid tvekan refererar sidan till *Villkor* i stället för att formulera om ett villkor.
- **FAQ-svar som rör en juridisk fråga** (t.ex. "Får jag pengarna tillbaka?") → FAQ:n får svara *översiktligt* och länka till *Villkor* / *Integritet* för det bindande. FAQ:n citerar, ersätter inte, de juridiska sidorna.
- **Någon vill göra en juridisk sida redigerbar "för enkelhets skull"** → nej. Sidtypen `juridisk` är låst till Block 7:s process. Bekvämlighet får aldrig kringgå juristgranskningen.

## 2.5 Religiöst substantiellt innehåll — kräver lärd-granskning

En tredje disciplin, sidoordnad den juridiska. Plattformen är islamiskt medveten — flera sidor (*Sadaqa & Zakat*, *Granskningen*, "Kan jag samla in?"-guiden) och många FAQ-svar rör **substantiella religiösa frågor**. Sådant innehåll får **aldrig publiceras som plattformens påstående utan att en lärd har verifierat det.**

- Plattformen — och den som tar fram innehåll, människa som AI — är **ingen religiös auktoritet**. Religiöst substantiell text (definitioner av sadaqa/zakat, vad som är tillåtet/otillåtet, riba, regler) behandlas som *utkast* tills en lärd granskat och verifierat det.
- Varje innehållsobjekt bär ett **`verifieringsstatus`** — `ej_tillämpligt`, `behöver_lärd` eller `verifierad`. Ett objekt märkt `behöver_lärd` kan inte publiceras; det måste först bli `verifierad`.
- Verifierat innehåll bär ett **"verifierad av [lärd]"-märke** som länkar till den lärdes profil på plattformen — så läsaren ser vem som står bakom svaret.
- **Lärd-granskning är ett lanseringskrav**, sidoordnat juristgranskningen av Villkor/Integritet. Ingen religiöst substantiell sida publiceras skarpt overifierad.
- Plattformen riktar sig till hela det muslimska samhället (sunni, shia m.fl.). Religiöst innehåll formuleras inte så att en inriktning framställs som den enda, och lärd-profilerna särbehandlas inte efter inriktning.

Detta är Zivars uttryckliga beslut (2026-05-24). Mekaniken — `verifieringsstatus`, lärd-profiler, verifierat-märket, låsbart innehåll — byggs i Steg 18 (`2-Byggplan/15-Goal-Steg-18-innehall-faq.md`).

---

# BLOCK 3 — CMS-light

Block 3 spikar **det enkla innehållssystemet** — hur innehåll lagras, vem som redigerar det, och hur en sida eller FAQ-post skapas och ändras. "Light" är inte en brist; det är ett val (3.5).

## 3.1 Vad CMS-light är — och inte är

CMS-light är ett **DB-backat redigerbart innehållslager**. Innehållet ligger i databasen, inte i kodfiler. En ändring i databasen är en ändring på sajten — ingen deploy.

**Vad det är:**

- En liten samling innehållssidor (Block 1.2) och FAQ-poster (Block 4) som rader i databasen.
- En enkel redigeringsyta inne i superadmin-verktyget (`superadmin.sadaqahsweden.se`, M18) där superadmin skapar och ändrar dem.
- Ett publikt läs-lager: plattformens sidor renderar innehållet från databasen.

**Vad det inte är:**

- Inte ett fullskaligt CMS (WordPress, Contentful) med mediabibliotek, arbetsflöden, roller, plugins.
- Inte en sidbyggare med drag-och-släpp-layout. Layouten är fast och tema-satt; superadmin styr *text*, inte *design*.
- Inte ett system flera personer redigerar i samtidigt. Ett trepersonsteam, en redaktör — superadmin (3.2).

## 3.2 Vem redigerar — superadmin

- **Endast superadmin** skapar och ändrar innehåll i CMS-light. Det är Zivar (M18:s superadmin-nivå, `superadmin.sadaqahsweden.se`).
- **Region-admins och region-medhjälpare (M18) redigerar inte innehåll.** Innehållet är plattformsgemensamt — en FAQ-post gäller hela Sverige, inte en region. Att låta varje region-admin skriva egen FAQ skulle splittra svaret och bryta poängen ("svara en gång").
- **Behörigheten ärvs från M6 / M18:s rollmodell.** M19 definierar ingen ny roll — den lyder den befintliga. Innehållsredigering är en superadmin-förmåga.
- **Region-admins kan *föreslå* FAQ-poster** — se Block 4.5. Förslaget går till superadmin, som beslutar och publicerar. Detta avlastar superadmin från att upptäcka varje vanlig fråga själv, utan att splittra ägarskapet.

## 3.3 Hur innehåll lagras och formateras

- **Lagring:** varje innehållssida och varje FAQ-post är en rad i databasen, med fälten i Block 1.2 respektive Block 4.2.
- **Format:** brödtexten skrivs i ett **enkelt, säkert format** — riktmärke Markdown, eller en starkt begränsad rich-text. Superadmin ska kunna göra rubriker, fetstil, listor och länkar; inget mer. Ingen rå HTML, ingen inbäddad JavaScript — ett innehållsfält får aldrig kunna injicera kod (Block 8, Säkerhet).
- **Bilder:** innehållssidor kan referera bilder som redan ligger i plattformens media-lager (R2). M19 bygger inget eget mediabibliotek — det vore över-engineering för ett tiotal sidor.
- **Versionshantering:** för redigerbara sidor räcker ett enkelt spår — `senast ändrad` + vem. För juridiska sidor krävs riktig versionering (Block 7.2). M19 bygger inte en full revisionshistorik för varje informativ sida; "vårt fel men inte dödligt" (princip 4) — en felaktig FAQ-text rättas, den behöver inte kunna rullas tillbaka tre versioner.

## 3.4 Hur en sida eller FAQ-post skapas och ändras

**Skapa en redigerbar sida eller FAQ-post:**

```
Superadmin öppnar innehållsytan (superadmin.sadaqahsweden.se)
        │
        ▼
Väljer "ny sida" eller "ny FAQ-post"
        │
        ▼
Fyller i fälten (titel, slug/kategori, brödtext, sidtyp)
        │
        ▼
Sparar som UTKAST  →  syns i superadmin, inte publikt
        │
        ▼
"Publicera"  →  status PUBLICERAD  →  live för alla, direkt
```

**Ändra en redigerbar sida eller FAQ-post:**

```
Superadmin öppnar posten  →  redigerar brödtexten
        │
        ▼
"Spara"  →  ändringen är live direkt (för redigerbart innehåll)
        │  status oförändrad, "senast ändrad" + vem uppdateras
        ▼
(Vid behov: "avpublicera"  →  tillbaka till utkast / kommer_snart)
```

För **juridiska sidor** ser ändringsflödet annorlunda ut — det går genom Block 7. CMS-light är samma verktyg, men `sidtyp = juridisk` kopplar in granskningsstegen.

## 3.5 Varför "light" — designvalet uttalat

Plattformen har ett tiotal sidor och en FAQ, en redaktör, och en princip om att slippa onödig komplexitet. Ett fullskaligt CMS vore:

- **Mer att underhålla** än innehållet är värt — tio sidor behöver inte ett plugin-ekosystem.
- **Ett större attackytan** — varje extra system är en extra sak som kan gå sönder eller bli osäker.
- **Emot princip 3 och 6** — komplexitet är inte premium; lugn enkelhet är.

CMS-light är precis så stort som behovet. Skulle plattformen en dag behöva många redaktörer, sidträd, lokalisering — då är det en framtida modul, inte detta. M19 löser dagens behov utan att bygga för en hypotetisk framtid.

## 3.6 Kantfall

- **Superadmin sparar ett halvfärdigt utkast** → status `utkast`, det når aldrig publikt. Ett utkast är osynligt för alla utom superadmin.
- **Superadmin publicerar av misstag** → "avpublicera" finns; sidan går tillbaka till utkast eller `kommer_snart`. Reversibelt — det är redigerbart innehåll, inte ett irreversibelt ingrepp.
- **Innehållsfältet matas med rå HTML eller ett skript** → format-lagret saniterar; rå HTML/JS får aldrig nå den renderade sidan. Detta är en hård säkerhetsregel (Block 8).
- **Databasen är tillfälligt onåbar när en sida ska visas** → den publika sidan ska fela mjukt (cachad senast kända version eller en lugn felruta), aldrig en kraschsida. Innehåll är inte mer kritiskt än att en cache räcker.

---

# BLOCK 4 — FAQ

FAQ:n är M19:s arbetshäst. Block 4 spikar den **strukturerade fråga/svar-ytan** — där en vanlig fråga besvaras en gång och blir synlig för alla.

## 4.1 Vad FAQ:n är

- En **publik sida** (`/faq`, eller liknande slug) som listar frågor med svar.
- Varje post är ett **par: en fråga + ett svar**. Inget annat — FAQ:n är inte ett forum, inte en kommentarstråd. Strukturen är medvetet enkel.
- Frågorna är **grupperade i kategorier** (4.3) så att en lång FAQ förblir skannbar.
- Svaret skrivs **en gång**, av rätt person, och är sedan självbetjäning för alla — det är hela poängen (princip 3 tillämpad på kommunikation).

## 4.2 FAQ-posten som objekt

| Fält | Vad det är |
|---|---|
| **Fråga** | Frågans text — formulerad som en användare skulle ställa den |
| **Svar** | Svaret, i samma enkla format som sidor (Block 3.3) |
| **Kategori** | Vilken grupp posten hör till (4.3) |
| **Ordning** | Plats inom kategorin — vanligaste frågorna högst |
| **Status** | `utkast` eller `publicerad` — en post utan färdigt svar publiceras inte (4.4) |
| **Senast ändrad** | Tidsstämpel + vem |

## 4.3 Kategorier — så FAQ:n förblir läsbar

FAQ:n grupperas så att en besökare hittar sin fråga snabbt. Riktmärke för kategorier:

- **För donatorer** — "Hur vet jag att pengarna gör nytta?", "Får jag kvitto?", "Kan jag ge anonymt?", "Vad händer om en insamling inte når sitt mål?"
- **För insamlare** — "Hur startar jag en insamling?", "Vad krävs av mig?", "Hur lång tid tar granskningen?"
- **Granskning & regler** — "Vad granskas?", "Varför blev min insamling avvisad?", refererar M8.
- **Pengar & utbetalning** — "När får insamlaren pengarna?", "Vilka avgifter finns?", "Fungerar Swish?" — refererar M5.
- **För föreningar & moskéer** — "Hur anmäler vi vår förening?", "Vad är collab?" — refererar M10.
- **Trygghet & integritet** — "Hur skyddas mina uppgifter?", "Vad gör jag om något känns fel?" — refererar M8:s klagomålsprocess.

Kategorilistan är superadmins att finslipa — den ska spegla de frågor som faktiskt kommer in, inte en teoretisk indelning.

## 4.4 FAQ utan svar — får aldrig publiceras tom

En FAQ-post finns för att *besvara* en fråga. En publicerad fråga utan svar är värre än ingen fråga alls — den signalerar att plattformen inte vet, eller inte bryr sig.

- **En post utan färdigt svar har status `utkast`** och syns aldrig publikt.
- Superadmin kan **samla obesvarade frågor som utkast** — en arbetslista över "frågor vi borde besvara" — utan att de läcker till den publika sidan.
- En post blir `publicerad` först när svaret är skrivet och korrekt. Hellre en kortare FAQ med tio bra svar än en lång med trettio halvfärdiga.

## 4.5 Var FAQ-frågorna kommer ifrån

FAQ:n ska spegla verkliga frågor, inte gissningar. Tre källor matar den:

- **Frågor som faktiskt ställs** — via "Fråga-vägen" (Block 5.3), via M8:s klagomålsprocess, via support. När samma fråga kommer tre gånger är det en FAQ-post.
- **Region-admins (M18) föreslår** — de möter frågorna i sin support-kö och ser mönstren regionalt. De kan föreslå en FAQ-post; superadmin beslutar och publicerar (Block 3.2). Så blir region-admins observationer en plattformsgemensam resurs utan att de äger innehållet.
- **Superadmin förutser** — de uppenbara frågorna ("Hur startar jag en insamling?") skrivs i förväg, inför lansering.

## 4.6 Hur FAQ:n avlastar — kopplingen till M18

FAQ:n är inte bara bekvämlighet — den är **tryckavlastning för hela support-kedjan**. Varje fråga som FAQ:n besvarar är en fråga som *inte* landar hos en region-admin (M18) eller hos superadmin-teamet. När region-admin-federationen distribuerar support till regionala moskéer är en bra FAQ det som håller den support-bördan låg nog att vara hållbar. Block 5.3:s "Fråga-väg" och FAQ:n arbetar ihop: Fråga-vägen fångar det nya, FAQ:n fångar det återkommande.

## 4.7 Kantfall

- **En fråga blir inaktuell** (en regel ändras, en funktion tas bort) → superadmin uppdaterar svaret eller avpublicerar posten. En FAQ med ett föråldrat svar är aktivt skadlig — den ska underhållas, inte bara fyllas på.
- **En känslig fråga** ("Varför avvisades just min insamling?") → FAQ:n svarar *generellt* om avvisningsgrunder och hänvisar till den personliga motivering insamlaren får (M8 Block 1.7). FAQ:n hanterar mönster, inte enskilda ärenden.
- **En fråga rör en juridisk detalj** → FAQ:n svarar översiktligt och länkar till *Villkor* / *Integritet* (Block 2.4). FAQ:n är ingång, inte den bindande källan.
- **FAQ:n växer sig ohanterligt lång** → kategorisering (4.3) och en enkel sökruta håller den skannbar. Skulle den bli mycket stor är det en signal att dela upp den, inte att lämna den orörd.

---

# BLOCK 5 — "Kan jag samla in?"-guiden

Tillägg A2 var tydligt: ingen ska gå igenom BankID, Stripe och hela skapande-flödet och *sedan* nekas. Block 5 spikar den självbetjänande delen av lösningen — och dess plats i M19.

## 5.1 Vad guiden är

"Kan jag samla in?"-guiden är en **innehållssida** (samma sorts objekt som alla andra, Block 1.2) som besvarar frågan *innan* någon binder upp sig:

- **Kriterierna i klartext** — vad plattformen kräver av en insamling, formulerat så en vanlig människa förstår det utan att läsa hela M8.
- **Exempel på vad som godkänns** — konkreta, igenkännbara fall: en mosképrenovering, en brunn, en katastrofinsamling med tydlig kanal.
- **Exempel på vad som inte godkänns** — lika konkret: de hårda reglerna (M8 Block 1.2) i begripliga exempel — alkohol, ränta, politisk kampanj, vinstdrivande projekt förklätt till välgörenhet.
- **Vad gråzonen är** — att vissa fall kräver en bedömning, och att det är okej att fråga (leder till Block 5.3).

Målet: **de flesta får sitt svar utan en människa.** En person som läser guiden och inser "mitt projekt passar inte" har sparats från en återvändsgränd — och teamet har sparats ett avvisningsärende.

## 5.2 Var i flödet guiden möter användaren

Guiden är värdelös om ingen ser den i rätt ögonblick. Den ska möta den blivande insamlaren **före** trösklarna, inte efter:

- **Länkad tidigt i insamlar-flödet (M2)** — innan BankID, innan Stripe. M2:s wizard-ingång pekar på guiden: *"Osäker på om ditt projekt passar? Läs först."*
- **Tillgänglig från footern** (*Hur det fungerar* kan länka vidare till den) och från FAQ:n (kategorin "För insamlare").
- **Refererad i onboarding-ordningen** — Tillägg A2 spikade ordningen BankID → Stripe → skapa. Guiden ligger *före steg 1*, som ett frivilligt men tydligt erbjudet förkunskapssteg.

M19 äger guidens *innehåll*. M2 äger *placeringen i flödet*. De två modulerna måste hållas i synk — det noteras som en koppling (avsnitt 6) och en byggflagga.

## 5.3 Fråga-vägen — det andra lagret

Tillägg A2 beskrev två lager. Guiden (5.1) är självbetjäningslagret. **Fråga-vägen** är det andra: en lätt kanal att ställa frågan *innan* man drar igång, för de fall guiden inte räcker.

- **Vad det är:** en enkel väg att ställa en konkret fråga om sitt tilltänkta projekt — "skulle det här godkännas?" — utan att först ha skapat konto, kopplat Stripe eller fyllt i en wizard.
- **Vem svarar:** med fördel de regionala admins (M18) — de har granskningskompetensen och frågan hör till deras region. Detta fördelar bördan i stället för att samla den hos superadmin-teamet.
- **Hålls billig av att guiden är bra.** Ju vassare guiden (5.1) och FAQ:n (Block 4), desto färre frågor når Fråga-vägen — och de som gör det är de genuint svåra, gråzons-nära fallen som *förtjänar* en människa.

**Modulgräns — sagt rakt:** M19 äger guidens innehåll och FAQ:n. *Fråga-vägen som mekanik* — formuläret, vart frågan dirigeras, hur region-admin svarar — hör hemma i M18 (federationen) och M2 (insamlar-flödet). M19 noterar Fråga-vägen här för att A2:s helhet ska hänga ihop, men bygger den inte själv. Detta block beskriver Fråga-vägen; det specificerar den inte.

## 5.4 Kantfall

- **Guiden säger "ja" men granskningen säger "nej"** → guiden är vägledning, inte ett bindande förhandsbesked. Den ska vara ärlig om det: *"Detta är vägledning — den slutliga bedömningen görs vid granskning."* Guiden ska ändå vara så träffsäker att detta är sällsynt.
- **Guiden blir inaktuell när M8 ändras** → guiden är redigerbart innehåll (Block 2.1); superadmin uppdaterar den. Den måste hållas i synk med M8:s regelbok — en byggflagga och en underhållsplikt.
- **Någon hoppar över guiden och fastnar ändå** → guiden är frivillig, inte en grind. Det är acceptabelt — A2:s mål är att *sänka* tröskeln, inte att lägga till ett tvång. De som hoppar över och nekas hanteras av M3:s vanliga avvisningsflöde med en saklig motivering (M8 Block 1.7).

---

# BLOCK 6 — Funktions-grinden

Tillägg B2 satte en hård regel: footer-länkarna får inte vara döda. Block 6 spikar hur — en lugn "kommer snart"-sida i stället för en länk som inte gör något.

## 6.1 Principen — aldrig en död länk

En footer-länk som leder till en 404, eller en länk som inte går att klicka, är en trasig kant. Det signalerar en halvfärdig, oomsorgsfull plattform — raka motsatsen till "premium genom omsorg" (princip 6).

Regeln är enkel och absolut: **varje länk i footern leder alltid någonstans meningsfullt.** Antingen till en publicerad sida, eller till en lugn "kommer snart"-sida. Aldrig till intet.

## 6.2 "Kommer snart"-sidan

En sida med status `kommer_snart` (Block 1.2) renderar inte sitt innehåll — den renderar en **lugn platshållare**:

- **Sidans titel** — så besökaren vet att hen hamnade rätt: *"Granskningen"*.
- **En kort, vänlig text** — *"Den här sidan är på väg. Vi fyller den med innehåll inom kort."*
- **En väg vidare** — en länk tillbaka till startsidan eller till en relaterad sida som finns, så besökaren inte hamnar i en återvändsgränd.
- **Plattformens lugna ton och tema** — platshållaren är inte en felsida, den är en omsorgsfullt gjord paus. Den ska kännas avsiktlig, inte trasig.

## 6.3 Statusens roll — grinden är ett fält

Funktions-grinden är inte en separat mekanik — den är `status`-fältet på innehållssidan (Block 1.2):

- `kommer_snart` → footern länkar dit, besökaren möter platshållaren (6.2).
- `publicerad` → footern länkar dit, besökaren möter det riktiga innehållet.
- `utkast` → sidan är osynlig; footern länkar **inte** dit ännu, eller länkar till `kommer_snart`-varianten. Ett utkast läcker aldrig.

Övergången från `kommer_snart` till `publicerad` sker när superadmin har fyllt sidan med innehåll och publicerar den (Block 3.4). Inget extra system — bara ett statusbyte.

## 6.4 Vid lansering — vad som måste vara klart

- **De juridiska sidorna** (*Villkor*, *Integritet*) får **inte** vara `kommer_snart` vid skarp lansering. De är lanseringskrav (Block 7, M8 Block 5) — de ska vara `publicerad` och juristgranskade innan första donationen.
- **Religiöst substantiella sidor** (*Sadaqa & Zakat*, *Granskningen*, "Kan jag samla in?"-guiden, religiösa FAQ-svar) får inte publiceras skarpt utan **lärd-granskning** (Block 2.5). Overifierat religiöst innehåll stannar `kommer_snart` / `behöver_lärd` — aldrig publikt som plattformens påstående.
- **De informativa sidorna** *får* vara `kommer_snart` vid lansering om innehållet inte hunnit bli klart — men det är en eftersläpning att stänga snabbt, inte ett viloläge. En plattform där halva footern säger "kommer snart" känns ofärdig.
- **Riktmärke:** vid skarp lansering bör åtminstone *Hur det fungerar*, *Granskningen* och *Transparens* vara publicerade — de bär förtroendet. Resten kan följa kort efter.

## 6.5 Kantfall

- **En publicerad sida måste tas ner tillfälligt** (innehållet visade sig fel) → den sätts till `kommer_snart`, inte raderas. Slugen och länken överlever; besökaren möter platshållaren tills sidan är rättad.
- **En sida i footern har ingen innehållssida alls** (glömd vid uppsättning) → detta är en bugg. Footern och innehållskartan (Block 1.1) ska valideras mot varandra — varje footer-länk måste ha en innehållssida, om så bara en `kommer_snart`-stub.
- **"Kommer snart" ligger kvar i månader** → det är en mjuk signal, inte ett tekniskt fel, men den hör hemma som en påminnelse till superadmin (kan visas i M16:s driftöversikt eller M18:s superadmin-yta): *"3 sidor är fortfarande kommer-snart."* Inget larm — bara ett vänligt påpekande att en kant fortfarande är halvfärdig.

---

# BLOCK 7 — De juridiska sidorna

*Villkor* och *Integritet* är innehåll, men de är inte vanligt innehåll. Block 7 spikar deras livscykel — varsamt, eftersom ett slarvigt fel här är ett juridiskt fel.

## 7.1 Vad M19 äger och vad M8 äger

Gränsen måste vara skarp:

- **M8 Block 5 äger innehållskravet** — *vad* Villkor och Integritet måste täcka (täckningstabellerna i M8 5.1 och 5.2). M19 motsäger inte M8; den refererar det.
- **En föreningskunnig jurist äger den faktiska texten** — M8 Block 5 och dess öppna fråga 2 är tydliga: en jurist skriver och granskar den slutliga juridiska texten före lansering.
- **M19 äger hemmet och livscykeln** — var texten bor (en innehållssida), hur den publiceras, hur en uppdatering hanteras, hur en version börjar gälla. M19 är *behållaren*, inte *författaren*.

## 7.2 Versionering — juridik kräver det

Till skillnad från en informativ sida (där ett enkelt "senast ändrad" räcker, Block 3.3) behöver en juridisk sida **riktig versionering**:

- **Varje publicerad version sparas** — den gamla texten kastas inte när en ny tar vid. Man måste kunna visa vilka villkor som gällde ett visst datum.
- **Ikraftträdandedatum** (fältet i Block 1.2) — varje version har ett datum då den börjar gälla.
- **Varför:** en användare som godkände villkoren i juni omfattas av juni-versionen tills hen godkänner en ny. Vid en tvist måste plattformen kunna visa exakt vilken text som gällde. Detta är inte över-engineering — det är ett juridiskt minimikrav, och det är skälet juridiska sidor inte ligger i det enkla redigerbara spåret.

## 7.3 Livscykeln för en juridisk uppdatering

```
Behov av uppdatering uppstår
  (lagändring, ny funktion, juristens påpekande)
        │
        ▼
Ny text tas fram  →  juristgranskning (M8 öppen fråga 2)
        │
        ▼
Superadmin lägger in den granskade texten som NY VERSION
   • status: utkast  ·  ikraftträdandedatum sätts
        │
        ▼
Publiceras  →  blir gällande version på ikraftträdandedatumet
   • föregående version arkiveras, inte raderas (7.2)
        │
        ▼
Är ändringen VÄSENTLIG?
        │
        ├── Ja → användare notifieras (M15) ·
        │         förnyat godkännande kan krävas (M8 Block 5.4)
        │
        └── Nej → publiceras, notifiering ej nödvändig
```

- **Väsentlig ändring** — en ändring som påverkar användarens rättigheter eller skyldigheter. Den triggar notis (M15) och kan kräva förnyat godkännande (M8 Block 5.4 — "väsentliga ändringar kräver förnyat godkännande").
- **Mindre ändring** — en stavfelsrättelse, ett förtydligande utan saklig skillnad. Publiceras utan notisstorm.
- **Vem avgör väsentligheten** — superadmin, med juristen som rådgivare. Vid tvekan: behandla som väsentlig. Hellre en notis för mycket än ett missat samtycke.

## 7.4 Tidsläge — juridiken först

- **Villkor och Integritet finns på plats FÖRE skarp lansering.** Detta är icke-förhandlingsbart (B2, M8 Block 5). De byggs och fylls tidigt — före FAQ-systemet, före de informativa sidorna om så krävs.
- **De ändras inte slarvigt live.** Block 2.2:s regel: juridiskt innehåll följer juridisk granskning, alltid.
- **Tidskontrast mot resten av M19:** de informativa sidorna och FAQ-systemet hör till Bygg-grupp C (Block 8). De juridiska sidorna bryter ut ur den ordningen — de måste vara klara *tidigt*, eftersom plattformen inte får ta emot en donation utan dem.

## 7.5 Kantfall

- **En lagändring tvingar fram en snabb uppdatering** → även en brådskande juridisk ändring går genom juristgranskning (7.3). "Snabbt" får aldrig betyda "ogranskat" för en juridisk sida. Det är hela skälet de inte är fritt redigerbara.
- **Juristen är inte klar när lanseringen närmar sig** → lanseringen väntar på juridiken, inte tvärtom. En plattform utan giltiga villkor får inte ta emot pengar. Detta är en hård beroende-flagga mot M8 öppen fråga 2.
- **En användare vill se en äldre version** av villkoren hen godkände → versioneringen (7.2) gör det möjligt. Riktmärke: arkiverade versioner ska vara åtkomliga, åtminstone på begäran.
- **Integritetspolicyn lovar en GDPR-funktion som inte är byggd** (export, radering — M8 Block 5.2) → policyns text och de faktiska funktionerna i M6/M16 måste vara i synk. M19 ska inte publicera en integritetspolicy som lovar mer än plattformen kan leverera — det vore ett tomt löfte och ett GDPR-brott (M8 Block 5.2). En byggflagga mot M6 och M16.

---

# BLOCK 8 — Teknisk grund & tidsläge

Block 8 är *hur* M19 byggs och *när*. Det är HUR-detaljer i en VAD-modul, medvetet samlade här så M19 är en enda källa för hela innehållslagret.

## 8.1 Teknisk grund — enkelt med flit

- **DB-backat innehåll.** Innehållssidor och FAQ-poster är rader i plattformens databas, med fälten i Block 1.2 och 4.2. Ingen separat CMS-tjänst, inget externt beroende — innehållet bor på infra plattformen redan äger (konsekvent med M12:s självhostnings-hållning).
- **Publik rendering.** Sidorna renderas server-side från databasen. Eftersom innehåll ändras sällan lämpar sig en **edge-cachad / ISR-liknande** rendering — sidan är blixtsnabb för besökaren och förnyas när superadmin publicerar en ändring (samma mönster M12 använder för kart-sidan).
- **Redigeringsytan** ligger inne i superadmin-verktyget (`superadmin.sadaqahsweden.se`, M18) — M19 bygger inte ett eget inloggningssystem, det lyder M18:s.
- **Format-lagret** (Block 3.3) — Markdown eller begränsad rich-text, saniterad. Ingen rå HTML/JS når den renderade sidan, någonsin.

## 8.2 Säkerhet — kort men hård

- **Innehåll får aldrig injicera kod.** Brödtexten saniteras; rå HTML och skript stoppas. Ett innehållsfält är text, inte en exekveringsyta. Detta är icke-förhandlingsbart.
- **Endast superadmin redigerar.** Skrivåtkomst till innehåll och FAQ är låst till superadmin-rollen (M6/M18). Region-admins och region-medhjälpare har ingen skrivåtkomst (Block 3.2).
- **Juridiska sidor är låsta till Block 7:s process.** Sidtypen `juridisk` kan inte fritt-redigeras kringgående juristgranskningen (Block 2.3).
- **Utkast läcker aldrig.** Allt med status `utkast` är osynligt publikt — sidor och FAQ-poster lika.
- **Publik läsväg är RLS-säker.** Den publika sidan läser endast `publicerad`/`kommer_snart`-innehåll; den når aldrig utkast eller redigeringsfunktioner.

## 8.3 Tidsläge — två takter

M19 byggs inte i ett enda svep. B2 spikade två olika takter:

| Del | När | Varför |
|---|---|---|
| **Villkor & Integritet** (juridiska sidor) | **Tidigt — före skarp lansering** | Lanseringskrav. Plattformen får inte ta emot en donation utan dem (M8 Block 5). Kan kräva bara en enkel statisk uppsättning av två sidor först — själva CMS-light-systemet behöver inte vara klart för att två juristgranskade texter ska kunna ligga på plats. |
| **Funktions-grinden** ("kommer snart") | **Med footern** — så fort footer-länkarna existerar | En länk får aldrig vara död. Så fort footern finns måste varje länk leda till minst en `kommer_snart`-stub. |
| **CMS-light, FAQ, informativa sidor, "Kan jag samla in?"-guiden** | **Bygg-grupp C** | Det fulla innehållssystemet hör till "plattformen är en värld"-lagret, tillsammans med M16, M18 och de andra Världen-modulerna. |

> **Praktisk konsekvens:** de juridiska sidorna kan behöva existera *innan* CMS-light är byggt. Det är acceptabelt — två juristgranskade sidor kan ligga på plats som ett minimalt först-steg, och senare flyttas in i CMS-light som `juridisk`-typade sidor när systemet finns. Innehållet och systemet behöver inte byggas i samma andetag.

## 8.4 Var M19 står i modulplanen

M19 är en av modulerna i Tillägg-Del B — ny omfattning som tillkom efter de ursprungliga 17 modulerna och 18:e (federationen, B1). M19 expanderar B2. Den hör, med undantag för de juridiska sidornas tidiga del, till Bygg-grupp C — samma byggfönster som M16 (admin) och M18 (federationen), som båda är dess närmaste grannar.

## 8.5 Kantfall

- **CMS-light hinner inte bli klart till lanseringen** → de juridiska sidorna sätts upp minimalt ändå (8.3); de informativa sidorna och FAQ:n får vänta bakom funktions-grinden (`kommer_snart`). Lanseringen blockeras av juridiken, inte av FAQ:n.
- **Innehållet växer förbi vad CMS-light klarar** (många sidor, många redaktörer, lokalisering) → det är en framtida modul, inte en ombyggnad av M19. CMS-light löser dagens behov; den ska inte byggas för en hypotetisk skala (Block 3.5).
- **Edge-cachen visar gammalt innehåll efter en publicering** → publiceringen ska invalidera cachen för den sidan. Riktmärke: en publicerad ändring syns inom kort, inte omedelbart-till-millisekunden. Innehåll behöver inte vara sekund-färskt (samma hållning som M12:s kart-data).

---

## 4. Designval & motivering (hela Modul 19)

| Beslut | Motivering |
|---|---|
| Två innehållssorter — redigerbart vs juridiskt — styrda av ett `sidtyp`-fält | Att blanda dem inbjuder olyckan: ett juridiskt villkor ändrat i farten, eller en informativ sida instängd i juristgranskning. Grinden är ett fält, inte en förhoppning om försiktighet. |
| Redigerbart innehåll publiceras live av superadmin, utan kodändring | Innehåll förändras ofta och fel är billiga att rätta. Skulle varje stavfel kräva en deploy slutar innehållet uppdateras. |
| Juridiska sidor ändras inte slarvigt live — de följer juristgranskning | Ett oöverlagt ord i Villkor eller Integritet kan bli ett avtalsbrott eller ett GDPR-fel. Hög konsekvens kräver disciplin. |
| CMS-light, inte ett fullskaligt CMS | Tio sidor och en FAQ, en redaktör. Ett plugin-ekosystem vore mer att underhålla och en större attackyta än behovet rättfärdigar. Enkelhet är premium (princip 6). |
| Endast superadmin redigerar innehåll; region-admins kan föreslå FAQ-poster | Innehåll är plattformsgemensamt — en FAQ-post gäller hela Sverige. Låter region-admins skriva egen FAQ splittras svaret och poängen ("svara en gång") bryts. |
| FAQ-poster utan färdigt svar publiceras aldrig | En publicerad fråga utan svar är värre än ingen fråga — den signalerar likgiltighet. Hellre tio bra svar än trettio halvfärdiga. |
| Funktions-grinden: en "kommer snart"-sida, aldrig en död länk | En footer-länk till intet är en trasig kant — raka motsatsen till premium genom omsorg (princip 6). Grinden är `status`-fältet, ingen extra mekanik. |
| Juridiska sidorna byggs tidigt, före skarp lansering | Lanseringskrav — plattformen får inte ta emot en donation utan giltiga villkor (M8 Block 5). De bryter ut ur Bygg-grupp C-takten. |
| Juridiska sidor versioneras med ikraftträdandedatum; informativa gör det inte | En tvist kräver att man kan visa vilken text som gällde ett visst datum. Informativa sidor klarar sig med "senast ändrad" — "vårt fel men inte dödligt" (princip 4). |
| "Kan jag samla in?"-guiden är innehåll i M19; Fråga-vägen som mekanik är M2/M18 | M19 äger texten och kunskapen. Formuläret och dirigeringen hör till insamlar-flödet och federationen. Modulgränsen hålls skarp. |
| Innehåll får aldrig injicera kod — brödtexten saniteras | Ett innehållsfält är text, inte en exekveringsyta. Icke-förhandlingsbar säkerhetsregel. |
| M19 äger hemmet och livscykeln, inte den juridiska texten | M8 äger innehållskravet, en jurist äger texten. M19 är behållaren — den motsäger inte M8, den refererar det. |

---

## 5. Kopplingar

**Modul 19 tar in:**
- **Innehållskravet för Villkor & Integritet** från **M8 Block 5** — vad de juridiska sidorna måste täcka. M19 är behållaren; M8 är kravet.
- **Granskningsreglerna** från **M8** — *Granskningen*-sidan, FAQ:ns regel-kategori och "Kan jag samla in?"-guiden refererar M8:s hårda regler och gråzonsprocess, översatta till begriplig nivå.
- **Superadmin-rollen och redigeringsytan** från **M18** (`superadmin.sadaqahsweden.se`) — M19 bygger ingen egen inloggning; den lever inuti superadmin-verktyget.
- **Rollmodellen** från **M6 / M18** — vem som får redigera innehåll. M19 definierar ingen ny roll.
- **Footern** från designöverlämningen — listan över sidor M19 måste fylla.
- **Mediareferenser** från plattformens R2-medialager — innehållssidor kan visa befintliga bilder; M19 bygger inget eget mediabibliotek.

**Modul 19 lämnar ut:**
- **De publika innehållssidorna och FAQ:n** till alla besökare — plattformens informativa yta.
- **"Kan jag samla in?"-guiden** till **M2** (insamlar-flödet), som länkar den tidigt i wizarden, före BankID och Stripe.
- **Föreslagna FAQ-poster-vägen** kopplar **M18** — region-admins föreslår, superadmin publicerar; FAQ:n avlastar M18:s support-kö.
- **Villkor & Integritet** till **M6** (godkänns vid kontoskapande / första donation, M8 Block 5.3) och länkas brett av M16 och hela plattformen.
- **"Kommer snart"-status** som en mjuk signal **M16/M18** kan visa superadmin ("3 sidor är fortfarande kommer-snart").

**Princip-flagga:** M19 äger sitt eget innehåll men *inte* den juridiska texten (jurist) eller granskningsreglerna (M8). Den är ett innehållslager och en behållare — det gör den robust: ändras en regel i M8 ska M19:s sidor uppdateras för att spegla det, men M19 hittar aldrig på en regel själv.

---

## 6. Säkerhet & anti-kaos

- **Innehåll injicerar aldrig kod** (Block 8.2) — brödtexten saniteras; rå HTML och skript stoppas. Ett innehållsfält är text, inte en exekveringsyta.
- **Skrivåtkomst är låst till superadmin** — region-admins och medhjälpare kan föreslå, aldrig publicera. Innehållet kan inte splittras eller förgiftas av en regional aktör.
- **Juridiska sidor kan inte fritt-redigeras** — sidtypen `juridisk` tvingar Block 7:s juristgranskade process. Ingen kan ändra ett bindande villkor i farten.
- **Utkast läcker aldrig** — allt med status `utkast`, sidor som FAQ-poster, är osynligt publikt.
- **Publik läsväg är RLS-säker** — den publika renderingen når bara publicerat innehåll, aldrig redigeringsfunktioner eller utkast.
- **Versionering skyddar mot juridisk tvist** — varje gällande version av Villkor/Integritet sparas med ikraftträdandedatum; plattformen kan alltid visa vad som gällde när.
- **Funktions-grinden eliminerar döda länkar** — en footer-länk leder alltid någonstans; ingen 404, ingen trasig kant.
- **Integritetspolicyn ljuger aldrig** — den får inte publiceras med löften om GDPR-funktioner (export, radering) som inte är byggda i M6/M16. Byggflagga, inte bara policytext.

**Reell risk att vara ärlig om:** den största risken i M19 är **inaktuellt innehåll**. En FAQ med ett föråldrat svar, en "Kan jag samla in?"-guide som inte följt med en regeländring i M8, en integritetspolicy som lovar mer än plattformen levererar — alla är aktivt skadliga, värre än en tom sida. Innehåll är inte en engångsuppgift. M19 är billigt att bygga men kräver löpande underhåll; den disciplinen måste finnas hos superadmin, för systemet kan inte tvinga fram den.

---

## 7. Automatisering

**Självgående (ingen människa):**
- Rendering av publicerade sidor och FAQ:n från databasen.
- Funktions-grinden — `status`-fältet avgör automatiskt om besökaren möter innehåll eller "kommer snart"-platshållaren.
- Saniteringen av innehållsformatet — rå HTML/JS stoppas automatiskt.
- Edge-cache-invalidering vid publicering — en ändring slår igenom utan manuellt ingrepp.
- Den mjuka "X sidor är fortfarande kommer-snart"-påminnelsen till superadmin.

**Kräver människa:**
- Att **skriva och redigera** allt innehåll — sidor, FAQ-svar, guiden. Innehåll är mänskligt arbete; ingen maskin formulerar plattformens röst.
- Att **publicera** — superadmin trycker på knappen; ingen sida går live av sig själv.
- Att **besluta om en FAQ-post** föreslagen av en region-admin ska publiceras.
- Hela **juristgranskningen** av de juridiska sidorna — och beslutet om en ändring är väsentlig.
- Att **hålla innehållet aktuellt** när M8:s regler ändras — den löpande underhållsplikten.

Riktmärke: när innehållet väl är skrivet och publicerat sköter sig visningen själv — plattformen svarar på frågan en gång och sedan tusen gånger utan en människa. Det enda återkommande mänskliga momentet är att *underhålla* innehållet: lägga till en FAQ-post när en ny vanlig fråga dyker upp, uppdatera guiden när en regel ändras. Det är litet arbete — men det får inte glömmas bort.

---

## 8. Öppna frågor

1. **Exakt format för brödtexten** — Markdown eller en begränsad rich-text-editor? Markdown är enklast och säkrast; en rich-text-yta är bekvämare för en icke-teknisk redaktör. Avgörs vid bygget i Bygg-grupp C, mot hur Zivar helst skriver.
2. **Slutlig juridisk text för Villkor och Integritet** — M8 öppen fråga 2 är ouppklarad: en föreningskunnig jurist måste skriva och granska texten. M19 kan inte publicera de sidorna förrän detta är gjort. Hård beroende-flagga.
3. **Personuppgiftsansvarig i integritetspolicyn** — M8 öppen fråga 3: föreningen, Corevo, eller båda? Texten på Integritet-sidan kan inte slutföras förrän detta är fastställt juridiskt.
4. **Fråga-vägens exakta mekanik** — formulär, dirigering till region-admin, svarsflöde. Specas i M18 (federationen) och M2 (insamlar-flödet), inte här. M19 noterar bara behovet.
5. **Hur väsentlig en juridisk ändring måste vara** för att kräva förnyat användargodkännande — riktlinjen bor i M8 Block 5.4; den exakta tröskeln bekräftas tillsammans med juristen.
6. **Ska FAQ:n ha fri textsökning** utöver kategorier? Riktmärke: ja om FAQ:n växer sig stor, men en enkel kategori-indelning räcker för en liten FAQ vid lansering. Avgörs när FAQ:ns storlek är känd.
7. **Var "kommer snart"-påminnelsen visas** — i M16:s driftöversikt, i M18:s superadmin-yta, eller båda? Synkas med M16 och M18 vid bygget.

---

## 9. Beslutslogg

Se avsnitt 4 (Designval & motivering) — det är Modul 19:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första versionen. Full djup — Block 1 (innehållskartan, de tio sidorna), Block 2 (redigerbart vs juridiskt innehåll), Block 3 (CMS-light), Block 4 (FAQ), Block 5 ("Kan jag samla in?"-guiden + Fråga-vägen), Block 6 (funktions-grinden), Block 7 (de juridiska sidorna), Block 8 (teknisk grund & tidsläge). Expanderar Tillägg B2 till full djup; integrerar A2:s onboarding-guide. |
| 1.1 | 2026-05-24 | Block 2.5 tillagt — religiöst substantiellt innehåll kräver lärd-granskning (verifieringsstatus, lärd-profil, verifierat-märke), lanseringskrav sidoordnat juristgranskningen. Lanseringsbullet i Block 6.4. Zivars beslut; mekaniken byggs i Steg 18 (`2-Byggplan/15-Goal-Steg-18-innehall-faq.md`). |
