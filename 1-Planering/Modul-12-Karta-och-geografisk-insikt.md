# Modul 12 — Karta & geografisk insikt

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md` (Block 1 Fält 6 — Plats)

---

## 1. Vad modulen är

Modul 12 är **kartan över Sverige och den geografiska datan** bakom hela plattformen. Den tar plats-data som redan finns i varje insamling (M1 Block 1 Fält 6) och förvandlar den till något man kan **se, klicka på och förstå**.

Den löser tre saker på en gång:

- **Visualisering.** Var i Sverige driver folk insamlingar? Var landar hjälpen ute i världen?
- **Insikt.** Vilka kommuner är starka, vilka brister — data föreningen kan ta med till städer och regioner.
- **Personlig koppling.** Någon med rötter i Mogadishu eller Gaza kan hitta vägen till en insamling dit.

> Det här är den del Zivar älskar: *"jag gillar att visa data, statistik och uppmuntra."* Modulen är den visuella, levande ytan som får folk att gå in på plattformen även när de inte ska donera just nu.

---

## 2. Varför den behövs

En insamlingsplattform utan karta är en lista. En lista är funktionell men död. Masterkartans insikt gäller här: *"om de är en platform som du går in på och de inte händer saker kommer inte folk tillbaka."*

Tre konkreta problem modulen löser:

1. **Sverige är osynligt.** Plattformens styrka är att den är *svensk* och samlar det muslimska samhället. Utan en karta syns aldrig att en insamling i Malmö, en i Göteborg och en i Kiruna alla hör till samma rörelse.
2. **Hjälpen är abstrakt.** "Pengarna går till Somalia" är en mening. En markör på en karta vid Mogadishu är en plats.
3. **Datan ligger oanvänd.** Insamlar-plats samlas redan in i M1. Utan M12 är den bara ett databasfält — med M12 blir den ett argument föreningen kan lägga på en kommuns bord.

Kartan bygger inget nytt — den **visar** det som M1 redan samlar. Det gör den billig att bygga och svår att ha fel i.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Sverige-kartan — vad den visar och hur man rör sig i den | ✅ Spikad |
| 2 | Datakällorna — vad som matar kartan och hur färskt det är | ✅ Spikad |
| 3 | Regional insikt — vem driver mest, vad brister, data till städer | ✅ Spikad |
| 4 | Hjälp-plats-visualisering — vart hjälpen landar, Sverige + världen | ✅ Spikad |
| 5 | Integritet i geo-data — aggregering och minsta-antal-regeln | ✅ Spikad |

När alla fem är klara vet vi exakt vad kartan visar, var datan kommer ifrån, och hur den aldrig pekar ut en enskild människa.

---

# BLOCK 1 — Sverige-kartan

Den interaktiva kartan. Det första man ser när man öppnar kart-sidan.

## 1.1 Vad kartan visar

**En karta över Sverige, indelad i landets 21 regioner (län).** Varje region är en klickbar yta.

På översiktsnivå visar kartan **aktivitet per region** via färg:

- **Färgintensitet** — desto mer aktivitet, desto mörkare/varmare ton. En region med 40 aktiva insamlingar lyser starkare än en med 2.
- **Lugn palett.** Inte rött-gult-grönt trafikljus — det signalerar "bra/dåligt" och dömer regioner. I stället en enda varm färgskala (ljus → mörk) som bara säger "mer/mindre", aldrig "sämre". Premium genom omsorg (princip 6).
- **Inga regioner är tomma/grå på ett nedslående sätt.** En region utan aktivitet visas i palettens ljusaste ton med texten *"Ingen insamling startad här ännu — vill du bli först?"* — uppmuntran, inte tomhet.

**Vad "aktivitet" betyder** (en region kan rangordnas på flera mått, användaren väljer):

- Antal **aktiva insamlingar** med insamlar-plats i regionen (default).
- Antal **avslutade & levererade** insamlingar (transparens-historik, M7).
- Totalt **insamlat belopp** från insamlare i regionen.

## 1.2 Hur kartan ser ut

- **Stil:** ren vektorkarta. Inga satellitbilder, ingen Google-Maps-look. Plattformens egen lugna grafik — matchar premiumkänslan.
- **Två vyer, en växlare:**
  - **Insamlar-vyn** — "var i Sverige drivs insamlingar?" (default, Block 3 lever här).
  - **Hjälp-vyn** — "vart i världen landar hjälpen?" (Block 4 lever här, då zoomar kartan ut till världen).
- **Topplista bredvid kartan.** Kartan är vacker men svårläst för exakta tal — en enkel rangordnad lista vid sidan ger siffrorna i klartext. Viktigt för Zivars dyslexi och för alla: en lista är lättare att skanna än färgnyanser.

## 1.3 Interaktivitet

**Klick på en region** öppnar regionens panel (glider in från sidan, kartan stannar synlig):

- Regionens namn + nyckeltal (aktiva insamlingar, levererade, insamlat belopp).
- **Lista på regionens aktiva insamlingar** — klickbara kort, leder rakt in i insamlingen (M11-listkortet återanvänds).
- Regional insikt-text (Block 3).
- Knapp: *"Starta en insamling härifrån"* → in i M2:s wizard.

**Zoom-nivåer:**

| Nivå | Visar | Klick gör |
|---|---|---|
| Sverige | 21 regioner färgade | Öppnar regionpanel |
| Region | Kommunerna i regionen | Öppnar kommunpanel |
| Kommun | Insamlingar kopplade dit | Öppnar insamlingen |

- **Kommunnivå** finns men styrs av minsta-antal-regeln (Block 5) — en kommun med för få insamlingar visar ingen siffra, bara "för få insamlingar för att visa statistik".
- **Ingen gatu-/adressnivå.** Kartan zoomar aldrig djupare än kommun för insamlar-data. Integritet by design.

**Mobilt:** kartan fungerar på mobil men topplistan blir den primära ytan där — en liten färgkarta är svår att peta på. Lista först, karta som komplement på liten skärm.

## 1.4 Kantfall

- **Insamlare utan region angiven** (M1: region är frivilligt, bara stad obligatoriskt) → faller tillbaka på stadens region via en uppslagstabell stad→region. Kan inte slås upp → räknas i ett "Sverige, ospecificerat"-aggregat, inte på kartan.
- **Insamlare med skyddad identitet/adress** → räknas i regionen men aldrig på kommunnivå (Block 5).
- **Region med exakt en insamling** → minsta-antal-regeln, ingen exakt siffra på kommunnivå men regionen som helhet får visas (21 regioner är grova nog att aldrig peka ut en individ — se Block 5).

---

# BLOCK 2 — Datakällorna

Kartan uppfinner ingen data. Den **läser** från moduler som redan äger sin data. Block 2 spikar exakt vad som matar kartan, varifrån, och hur färskt det är.

## 2.1 De tre datakällorna

| Källa | Vad den ger kartan | Äger datan |
|---|---|---|
| **Insamlar-plats** (M1 Block 1 Fält 6 B) | Var i Sverige insamlingen drivs — stad, ev. region | M1 |
| **Hjälp-plats** (M1 Block 1 Fält 6 A) | Vart hjälpen landar — land, specifik plats, ev. GPS | M1 |
| **Verifierade användare** (M6) | Att en plats hör till en *KYC-verifierad* insamlare — datan är trovärdig | M6 |

**Varför M6 är med:** kartan ska inte visa platser från ogranskade utkast eller overifierade konton. En siffra på kartan ska betyda *"så här många verifierade insamlare i en granskad, publicerad insamling"*. Annars blir kartan lätt att förgifta. Endast insamlingar i tillstånd `aktiv` eller senare (M1 Block 3) räknas — aldrig `utkast`, `inskickad`, `under_granskning`, `avvisad`.

## 2.2 Vad som matar vad

```
   M1 Insamling (aktiv+)
   ├─ insamlar-plats (stad/region) ──┐
   └─ hjälp-plats (land/GPS) ────────┤
                                     ▼
   M6 verifierad insamlare ──▶  KART-AGGREGAT (M12)
                                     │
                          ┌──────────┴──────────┐
                          ▼                     ▼
                  Insamlar-vyn            Hjälp-vyn
                (Sverige-karta)        (världskarta)
```

Kartan har ett eget **aggregat-lager** — en förberäknad sammanställning per region/kommun/land. Den ritar aldrig direkt från råa insamlingsrader. Skäl: snabbhet, *och* integritet (aggregatet är där minsta-antal-regeln, Block 5, appliceras innan något når skärmen).

## 2.3 Hur färsk datan är

- **Aggregatet räknas om automatiskt.** Riktmärke: **var 6:e timme**, plus en omräkning när en insamling byter tillstånd till `aktiv` eller `avslutad_levererad`.
- **Inte realtid.** En karta behöver inte vara sekund-färsk — den visar mönster, inte ett kassaregister. Realtidsräkning per klick vore dyrt och onödigt.
- **Tidsstämpel syns.** Diskret text på kartan: *"Uppdaterad senast: idag 06:00."* Ärlighet om datans ålder är en del av premiumkänslan.

## 2.4 Kantfall

- **Insamling pausas/stängs ned** (`pausad`, `nedstängd`) → faller ur aggregatet vid nästa omräkning. En fejk-insamling ska inte ligga kvar och blåsa upp en regions siffra.
- **GPS-koordinat saknas på hjälp-plats** (frivilligt fält i M1) → hjälp-platsen placeras på landets mittpunkt eller den angivna stadens centrum, med en not om att exakt plats inte angetts. Aldrig en falsk precision.
- **Stad felstavad i fritext** → uppslagstabellen stad→region har en luddig matchning; träffar den inte → "Sverige, ospecificerat". Vi jagar inte varje stavfel — "vårt fel men inte dödligt" (princip 4).

---

# BLOCK 3 — Regional insikt

Här blir kartan ett **verktyg**, inte bara en bild. Block 3 är insikten: vilka kommuner driver mest, vad brister i en region, vad en region gör bra — och hur föreningen kan lägga den datan på en kommuns bord.

## 3.1 Vad regional insikt visar

För varje region (och varje kommun ovanför minsta-antal-tröskeln) visas en **insikts-panel**:

- **Styrka:** *"Malmö driver flest insamlingar i Skåne — 18 aktiva, 24 levererade."*
- **Aktivitet över tid:** en enkel trendlinje — växer eller minskar engagemanget här?
- **Vad regionen ger till:** topp-3 kategorier (M1) bland regionens insamlingar — t.ex. *"Mest till: mosképrojekt, vatten, föräldralösa barn."*
- **Leveransgrad:** andel av regionens avslutade insamlingar som nådde `avslutad_levererad` med alla tre bevis (M7). Detta är ett kvalitetsmått, inte ett volymmått.

## 3.2 Hur "vad brister" hanteras varsamt

Att säga *"region X brister"* är en fälla — det dömer människor som inte gjort något fel. Designval:

- **Aldrig negativt formulerat på den publika kartan.** Ingen region får texten "svag" eller "passiv".
- I stället **inbjudande:** *"I Norrbotten finns ännu få insamlingar — utrymme för dig som vill starta något här."*
- Den **råa, ärliga jämförelsen** (vilka regioner ligger lågt) finns men bara i **M16 Admin-dashboarden**, för föreningens egna ögon. Publik karta uppmuntrar; internt verktyg analyserar. Två olika syften, två olika ytor.

## 3.3 Data till städer och regioner

Detta är en strategisk funktion. Föreningen kan ta plattformens aggregerade data och **presentera värdet för kommuner och regioner**: *"Det muslimska samhället i er kommun har samlat in X kr till Y projekt det senaste året."*

- **Form:** en exporterbar **regionrapport** (PDF eller enkel webbsida) per region/kommun, genererad från aggregatet.
- **Innehåll:** antal insamlingar, totalt belopp, kategorier, leveransgrad, antal verifierade aktiva insamlare — **allt aggregerat, aldrig en individ** (Block 5).
- **Vem genererar den:** föreningen via M16. Inte en publik knapp — det är ett föreningsverktyg, och rapporten ska ha föreningens röst och kontext.
- **Varför detta är viktigt:** det positionerar plattformen som en samhällsaktör, inte bara en sajt. Det är samordning av befintlig godhet (princip 13) gjort synligt — och det kan öppna dörrar (lokaler, samarbeten, legitimitet).

## 3.4 Kantfall

- **En region domineras av en enda insamlare** → insikten visar regionens siffror men minsta-antal-regeln (Block 5) hindrar att kommunnivån avslöjar att det är *en* person. Trendlinjen kan utelämnas om den blir för avslöjande.
- **Trend pekar brant nedåt** → visas aldrig dramatiskt publikt ("aktiviteten rasar"). Internt i M16 är det en ärlig signal föreningen bör se.
- **Regionrapport begärs för ett område med för lite data** → rapporten genereras inte; M16 säger "för få insamlingar för en meningsfull rapport".

---

# BLOCK 4 — Hjälp-plats-visualisering

Insamlar-vyn visar var i Sverige. Hjälp-vyn visar **vart hjälpen landar** — och det är ofta utanför Sverige. Block 4 är den emotionella delen av kartan: den gör destinationen verklig.

## 4.1 Världskartan

När man växlar till **Hjälp-vyn** zoomar kartan ut till hela världen.

- **Markörer på hjälp-platser.** Varje land/plats där minst en aktiv insamling levererar hjälp får en markör.
- **Markörstorlek/intensitet** = mängd aktivitet dit (antal insamlingar eller belopp). Gaza med 30 insamlingar är en stor markör; en enskild by en liten.
- **Klick på en markör** → panel med listan på insamlingar som hjälper just den platsen → klick → in i insamlingen.
- **Sverige är också en hjälp-plats.** Insamlingar som hjälper *inom* Sverige (t.ex. mosképrojekt, religiösa varor till svenska moskéer) visas på den svenska delen av världskartan — hjälpen stannar inte alltid utomlands.

## 4.2 Den personliga kopplingen

Detta är funktionens hjärta. M1 noterar redan strategin: *"hjälp-plats kan trigga personlig koppling."*

- Någon med rötter i Somalia öppnar hjälp-vyn, hittar Somalia, ser **alla insamlingar dit på ett ställe**.
- Profilen (M9) kan ha ett frivilligt **"platser jag bryr mig om"**-fält. Anger en användare det → notiser (M15) kan tipsa: *"En ny insamling till [din plats] har startat."*
- **Sökning på plats** i M11 och kartans hjälp-vy är samma data sett från två håll — listan (M11) och kartan (M12) speglar varandra.

Detta är discovery driven av tillhörighet, inte av algoritm. Det är premium genom omsorg (princip 6): plattformen känns personlig för att den möter människan där hennes hjärta redan är.

## 4.3 Hjälp-platsens precisionsnivå

- Hjälp-plats är **publik och detaljerad** (M1: *"desto mer desto bättre"*) — här finns ingen individ att skydda, mottagaren är typiskt en moské, by eller kollektiv.
- Visas så detaljerat som insamlaren angett: land alltid, specifik plats om angiven, GPS-prick om koordinat finns.
- **Undantag — när mottagaren ÄR en utpekbar individ.** M1 tillåter mottagartyp "Familj eller individ (utomlands)". Då gäller en mildare regel: visa land/region, inte exakt by eller koordinat, om det skulle peka ut en specifik utsatt familj. Granskaren (M3) flaggar detta vid granskning. Kopplar M1:s per-fält integritetskontroll (princip 2).

## 4.4 Kantfall

- **Insamling med flera hjälp-platser** → M1 modellerar en kollektiv mottagare med fritext. Kartan placerar markören på det primära landet; fritexten ("50 moskéer i Sverige") syns i panelen. Vi splittrar inte en insamling på 50 markörer — det är samma över-engineering M1 redan avfärdat.
- **Hjälp-plats i konfliktzon utan stabil geografi** → land-markör räcker; ingen koordinatprecision krävs.
- **Hjälp-plats = hela världen / flera kontinenter** (sällsynt, t.ex. en bred katastroffond) → markör på "global" med förklarande text, inte 50 markörer.

---

# BLOCK 5 — Integritet i geo-data

Geo-data är farlig. En karta som visar för fint kan peka ut en enskild människa utan att någon menat det. Block 5 är skyddet — och det är **inte förhandlingsbart**.

## 5.1 Grundprincipen — aldrig en individ

- **Allt på kartan är aggregat.** Kartan visar *antal* och *summor* per geografiskt område. Den visar **aldrig** "Ahmed Hassan i Kiruna driver en insamling".
- Vill man se en enskild insamling klickar man sig in på den — men då är man inne i M1:s insamlingssida med M1:s egna per-fält integritetskontroll. Kartan själv listar bara, den avslöjar inget extra.
- Insamlar-plats är redan integritetsskyddad i M1 (bara stad obligatorisk, allt annat insamlarens val). M12 får **aldrig kringgå** det. Anger en insamlare bara "Stockholm" får kartan inte gissa stadsdel.

## 5.2 Minsta-antal-regeln

Kärnan i Block 5. **En siffra för ett geografiskt område visas bara om området innehåller minst ett tröskelantal insamlingar/insamlare.**

- **Tröskel: minst 5.** Ett område med 1–4 insamlingar visar **ingen exakt siffra** — bara texten *"För få insamlingar för att visa statistik här ännu."*
- **Varför:** i en liten kommun med 2 insamlingar kan en granne räkna ut vem den andra är. Med 5+ blir varje siffra anonym nog.
- **Gäller kommunnivå.** Sveriges 21 regioner är så stora att en region aldrig pekar ut en individ — regionnivå har ingen tröskel. Kommunnivå har det. Stadsdelsnivå finns inte alls.
- **Gäller även regionrapporten** (Block 3): en rapport för ett område under tröskeln genereras inte.

**Varför denna regel finns — rakt:** utan den blir kartan ett sätt att kartlägga var enskilda muslimer i små svenska orter engagerar sig. Det är en personuppgiftsrisk *och* en säkerhetsrisk i ett klimat där moskéer och muslimska miljöer redan utsätts. Tröskeln är billig att bygga och dyr att sakna.

## 5.3 Vad som aldrig korsas mot geo-data

- Kartan korsar **aldrig** plats med kategori på ett sätt som blir utpekande. *"3 insamlingar i lilla X-kommun, alla kategori begravning"* kan avslöja en enskild familjs sorg. Kategori-uppdelning visas bara ovanför minsta-antal-tröskeln **per kategori**, inte bara per område.
- Kartan korsar aldrig plats med **donator-data**. Var donatorer bor är inte kart-data över huvud taget. M4 äger donationer; donatorns plats lämnar aldrig M4. Kartan handlar om *insamlare* och *hjälp-platser*, punkt.
- Insamlare med **skyddade personuppgifter / skyddad identitet** (flaggas i M6) räknas i regionaggregatet men aldrig på kommunnivå, oavsett tröskel.

## 5.4 Kantfall

- **En kommun passerar 5 och sjunker sen under** (en insamling avslutas) → siffran döljs igen vid nästa omräkning. Tröskeln är dynamisk, inte en engångskoll.
- **Någon försöker triangulera** genom att jämföra region- och kommunsiffror över tid → mildras av att kommunnivå helt döljs under tröskeln och att aggregatet bara uppdateras var 6:e timme (ingen sekund-exakt förändring att läsa av).
- **Hjälp-plats som pekar på en namngiven enskild familj** → Block 4.3-regeln: land/region-nivå, inte by/koordinat. Granskaren (M3) är sista kontrollen.

---

## 5. Designval & motivering (hela Modul 12)

| Beslut | Motivering |
|---|---|
| Kartan ritar bara från ett aggregat-lager, aldrig från råa insamlingsrader | Snabbhet — *och* aggregatet är den enda plats där minsta-antal-regeln kan appliceras innan data når skärmen. |
| Endast insamlingar `aktiv`+ och verifierade insamlare (M6) räknas | En siffra på kartan ska betyda något. Utkast och overifierade konton skulle göra kartan lätt att förgifta. |
| Lugn enfärgsskala, inget trafikljus | Trafikljus säger "bra/dåligt" och dömer regioner och människor. En mer/mindre-skala uppmuntrar, dömer inte (princip 6 + 10). |
| Topplista bredvid kartan, alltid | Färgnyanser är svårlästa — särskilt vid dyslexi. En rangordnad lista ger siffrorna i klartext. Lista först på mobil. |
| "Vad brister" visas aldrig negativt publikt — bara inbjudande | Att kalla en region "svag" dömer oskyldiga. Den råa jämförelsen hör hemma i M16, inte på publik karta. |
| Ingen zoom djupare än kommun för insamlar-data; ingen stadsdelsnivå | Integritet by design. Ju finare zoom, desto lättare att peka ut en individ. |
| Minsta-antal-regeln: tröskel 5 på kommunnivå, ingen tröskel på region | 21 regioner är grova nog att aldrig avslöja en individ; en liten kommun är det inte. 5 gör varje siffra anonym nog. |
| Aggregatet uppdateras var 6:e timme, inte realtid | En karta visar mönster, inte ett kassaregister. Realtid vore dyrt, onödigt, och lättare att triangulera. |
| Hjälp-plats visas detaljerat — utom när mottagaren är en utpekbar individ | M1: "desto mer desto bättre" gäller moskéer/byar. En enskild utsatt familj utomlands skyddas dock (princip 2). |
| Regionrapport till städer/kommuner är ett M16-föreningsverktyg, inte en publik knapp | Rapporten behöver föreningens röst och kontext, och får aldrig genereras för ett område under integritetströskeln. |
| Donator-plats är inte kart-data | Var donatorer bor lämnar aldrig M4. Kartan handlar om insamlare och hjälp-platser. |

---

## 6. Kopplingar

**Modul 12 tar in:**
- **Insamlar-plats** och **hjälp-plats** från **M1** (Block 1 Fält 6) — kartans råmaterial.
- **Verifieringsstatus** och **skyddad identitet**-flagga från **M6** — avgör vad som får räknas och på vilken nivå.
- **Insamlingens tillstånd** från **M1 Block 3** — endast `aktiv`+ räknas.
- **Kategorier** från **M1 Block 1** — för "vad regionen ger till".
- **Leveransgrad / bevis-status** från **M7** — kvalitetsmåttet i regional insikt.
- **"Platser jag bryr mig om"** från **M9-profilen** — driver den personliga kopplingen.

**Modul 12 lämnar ut:**
- **Kart-aggregatet** som **M16 Admin-dashboard** läser för intern analys och regionrapporter.
- **Klick på insamling** leder in i **M1**:s insamlingssida via **M11**:s listkort.
- **Plats-baserade tips** som **M15 Notiser** kan skicka ("ny insamling till din plats").
- **Hjälp-plats-vyn** speglar **M11**:s plats-sökning — samma data, två ytor.

**Princip-flagga:** M12 äger ingen primärdata. Allt kommer från M1 och M6. Modulen är en *vy* — det gör den robust: går något fel ligger felet i källan, inte i kartan.

---

## 7. Säkerhet & anti-kaos

- **Minsta-antal-regeln** (Block 5.2) — kartan kan aldrig peka ut en enskild muslim i en liten svensk ort. Detta är den enskilt viktigaste skyddsmekanismen i modulen.
- **Ingen stadsdels-/gatunivå** — kartan zoomar aldrig djupare än kommun för insamlar-data.
- **Endast verifierad, granskad data** (Block 2) — overifierade konton och ogranskade utkast når aldrig kartan; den går inte att blåsa upp med fejk.
- **Aggregat, inte rådata** — kartan kan av konstruktion inte läcka en enskild insamlingsrad; den ser bara summor.
- **Skyddade personuppgifter respekteras** — insamlare med skyddad identitet (M6) hålls borta från kommunnivå oavsett tröskel.
- **Ingen donator-data på kartan** — var folk *ger* ifrån är inte kart-data och samlas inte.
- **"Vad brister" hålls vänligt publikt** — kartan kan inte användas för att stämpla en region eller en folkgrupp som passiv. Den rå jämförelsen är inlåst i M16.

**Reell risk att vara ärlig om:** en geografisk karta över muslimskt engagemang i Sverige *är* känslig data i fel händer. Modulen är därför byggd defensivt: grova nivåer, trösklar, aggregat, ingen individ. Premiumkänslan i M12 kommer inte av maximal detalj — den kommer av att man känner att datan hanteras med omdöme.

## 8. Automatisering

**Självgående (ingen människa):**
- Omräkning av kart-aggregatet (var 6:e timme + vid tillståndsbyten).
- Applicering av minsta-antal-regeln — sker automatiskt i aggregat-steget.
- Stad→region-uppslag och fallback till "Sverige, ospecificerat".
- Färgsättning, markörstorlek, topplistor — allt härlett från aggregatet.
- Plats-baserade notis-tips (via M15).

**Kräver människa:**
- Generering av en **regionrapport** till en kommun (föreningen, via M16) — den ska ha en mänsklig röst och kontext.
- Bedömning av om en **hjälp-plats pekar ut en utsatt individ** — granskaren (M3) vid granskning.
- Tolkning av interna trender i M16 — datan visas automatiskt, slutsatsen dras av en människa.

Riktmärke: kartan sköter sig själv 95 %+ av tiden. Det enda återkommande mänskliga momentet är när föreningen *väljer* att vända datan utåt mot en kommun — och det är en möjlighet, inte en plikt.

## 9. Öppna frågor

1. **Exakt minsta-antal-tröskel** — 5 är riktmärket. Bör stresstestas mot Sveriges minsta kommuner; kan behöva höjas till 10 för riktigt små orter. → bekräftas i M8 (integritetspolicy).
2. **Regionrapportens exakta format** (PDF, webbsida, eller bådadera) och om den någonsin ska kunna delas publikt → M16.
3. **"Platser jag bryr mig om"-fältet** på profilen — exakt utformning och hur många platser → M9.
4. **Kartans tekniska underlag** (vilken geo-bibliotek/kartdata) → implementeringsplan, inte detta dokument.
5. **Ska hjälp-vyn visa historisk hjälp** (avslutade insamlingar) som ett separat lager — "här har vi hjälpt över tid"? Lockande, men kan vänta. → parkerad till efter v1-lansering.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 12:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (Sverige-kartan), Block 2 (datakällor), Block 3 (regional insikt + data till kommuner), Block 4 (hjälp-plats-visualisering), Block 5 (integritet, minsta-antal-regeln) nyskrivna. |
