# Modul 2 — Insamlar-flödet

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`

---

## 1. Vad modulen är

Modul 2 är **resan för personen som skapar och driver en insamling**. Inte vad insamlingen *är* (M1), inte hur den granskas (M3), inte hur någon ger till den (M4). Bara: hur en människa med en idé tar den hela vägen från tom skärm till bevisat resultat.

**Den löser:** M1 definierade insamlings-objektet och dess fält. Men ett objekt fyller inte i sig självt. Insamlaren — ofta en helt vanlig person som Ahmed, inte en kommunikatör — behöver ledas, inte lämnas ensam med ett formulär. Modul 2 är den ledningen: wizarden, granskningsdialogen, dashboarden, resultatfasen.

---

## 2. Varför den behövs

Ett tomt textfält är en mur. De flesta insamlare vet *vad* de vill göra men inte *hur de ska skriva ner det*. Lämnar vi dem ensamma får vi två dåliga utfall: tunna ansökningar som granskaren måste skicka tillbaka gång på gång, eller insamlare som ger upp halvvägs.

Samtidigt får vi inte göra tvärtom — bygga en AI-skrivassistent som polerar bort människan. M1 slog redan fast varför: **donatorer ger till människor de litar på, och Ahmeds oslipade text är mer trovärdig än AI-perfektion**.

Lösningen är **struktur, inte ersättning**. Wizarden ställer rätt frågor i rätt ordning. Insamlaren skriver fortfarande sina egna ord. Modulen bär också insamlaren genom det jobbigaste momentet — granskningen — så att det känns som hjälp, inte som ett avslag.

Detta är direkt kopplat till norrstjärnan: plattformen ska kännas **premium, trygg och levande, inte som ett kassaregister**. Insamlar-flödet är där den känslan vinns eller förloras först.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Skapande-wizarden — från tom skärm till färdigt utkast | ✅ Spikad |
| 2 | Inskickning & granskningsdialog — fram och tillbaka med granskaren | ✅ Spikad |
| 3 | Driva en aktiv insamling — dashboard, uppdateringar, delning | ✅ Spikad |
| 4 | Resultatfasen — ladda upp bevis, stäng transparens-loopen | ✅ Spikad |
| 5 | Flera insamlingar & redigering efter publicering | ✅ Spikad |

Blocken är insamlarens tidslinje, i ordning. När alla fem är klara vet vi exakt hur en insamlare upplever plattformen från start till slut.

---

# BLOCK 1 — Skapande-wizarden

Resan från tom skärm till ett inskickningsklart utkast. Detta är insamlarens första intryck av plattformen — det måste kännas lätt, lugnt och tryggt.

## 1.1 Wizardens grundform

**Vad blocket är:** ett guidat, stegvis flöde som tar insamlaren genom alla obligatoriska M1-fält utan att någonsin visa en mur av tomma fält.

**Specifikation:**
- **Steg-för-steg, ett fokus åt gången.** Aldrig hela formuläret på en gång. Ett steg = en fråga eller en liten grupp besläktade fält.
- **Progress-indikator** högst upp: "Steg 3 av 7". Insamlaren ser alltid hur långt kvar det är — viktigt för en ADHD-läsare, viktigt för alla.
- **Fram och tillbaka fritt.** Insamlaren kan kliva bakåt och ändra utan att tappa något.
- **Allt sparas som `utkast` i realtid** (se 1.4). Stänger man fliken mitt i steg 4 ligger steg 1–3 kvar.
- **Inget steg är "smart" på insamlarens bekostnad** — inga dolda obligatoriska fält, ingen validering som låser utan att förklara varför.

**Stegordning (v1):**

| Steg | Innehåll | M1-fält |
|---|---|---|
| 1 | Välkomst + de fem strukturfrågorna (se 1.2) | matar Beskrivning |
| 2 | Kategori + titel | M1 B1 F1, F2 |
| 3 | Mottagare + plats | M1 B1 F4, F6 |
| 4 | Mål, modell, datum | M1 B2 F1, F2 |
| 5 | Övermålsplan + undermåls-info | M1 B2 F3, F4 |
| 6 | Media — ladda upp cover + galleri | M1 B1 F5 |
| 7 | Granska & skicka in | → Block 2 |

**Designval:** Strukturfrågorna kommer *först*, före de torra fälten. Insamlaren börjar med att berätta sin historia — det är motiverande — och de strukturerade fälten känns sen som att fylla i resten, inte som att börja från noll.

## 1.2 De fem strukturfrågorna

**Vad det är:** kärnan i wizarden. Fem frågor som tillsammans tvingar fram en komplett, granskningsbar och trovärdig insamling — utan att insamlaren behöver veta hur man "skriver en bra insamlingstext".

**De fem frågorna — spikade:**

| # | Fråga insamlaren ser | Vad den säkrar |
|---|---|---|
| 1 | **Vad samlar du till?** | Konkret föremål/insats. Granskaren och donatorn ska direkt förstå *vad*. |
| 2 | **Varför behövs det?** | Nöden, motivet. Det som rör donatorns hjärta. |
| 3 | **Hur används pengarna?** | Pengaväg från donation till mål. Stänger "vart tar pengarna vägen"-frågan. |
| 4 | **När levereras resultatet?** | Förväntad leverans → matar genomförandedatum (M1 B2 F2). |
| 5 | **Vad kan du bevisa?** | Insamlaren tänker på bevis *redan vid start* — inte i efterhand. |

**Specifikation:**
- **Varje fråga = ett eget litet textfält** med en kort, konkret hjälptext under och **ett verkligt exempel** ("T.ex.: *1000 bönemattor till moskéer i Mellansverige*").
- **Fråga 1–3 är obligatoriska.** Fråga 4 matar ett datumfält i steg 4 och är obligatorisk. Fråga 5 är obligatorisk men kort — det är en avsiktsförklaring, inte uppladdning här.
- **Inga teckenminimum som siffror.** I stället: mjuk vägledning ("En mening eller två räcker"). Tvång på "minst 200 tecken" stressar och ger utfyllnad, inte kvalitet.
- **Fråga 5 är psykologiskt central.** Den planterar bevis-tänket från sekund ett. Insamlaren som redan vid start svarat "jag kan ta kvitto från leverantören och bilder vid utdelningen" kommer leverera transparens-loopen. Det är princip 9 (transparens som mål) inbyggd i UX.

**Kantfall:** Insamlaren skriver bara ett ord per fråga → wizarden blockerar inte, men steg 7 (granska & skicka) visar en mjuk varning: "Din beskrivning är väldigt kort — granskaren kommer troligen be om mer." Verktyg, inte polis: vi hindrar inte, vi informerar.

## 1.3 Hur svaren blir den långa beskrivningen

**Vad det är:** mekaniken som omvandlar fem korta svar till M1:s `lång beskrivning`.

**Specifikation:**
- Efter strukturfrågorna sätter wizarden ihop svaren till **ett sammanhängande utkast** till lång beskrivning, med rubriker:
  - *Vad vi samlar till* → svar 1
  - *Varför* → svar 2
  - *Så används pengarna* → svar 3
  - *Tidsplan* → svar 4
- **Detta är ren sammanfogning — INGEN AI-omskrivning.** Insamlarens exakta ord, bara strukturerade under rubriker. Detta hedrar M1:s beslut: ingen AI-skrivassistent i v1.
- Utkastet visas sedan i **markdown-editorn** (1.5) där insamlaren fritt redigerar, lägger till, tar bort.
- **Kort beskrivning** (max 200 tecken, M1 B1 F3) genereras INTE automatiskt — insamlaren skriver den själv i ett eget fält, med svar 1 synligt bredvid som stöd. Kärnmeningen ska vara medvetet vald, inte avhuggen.

**Designval:** Sammanfogning, inte generering. Plattformen ger *ställningen*; insamlaren bygger *huset*. Den oslipade men äkta texten är en feature, inte en brist.

**Kantfall:** Insamlaren raderar hela det sammanfogade utkastet och skriver eget → helt tillåtet. Wizarden är ett startblock, inte en tvångströja.

## 1.4 Draft-sparning

**Vad det är:** garantin att ingen insamlare någonsin tappar sitt arbete.

**Specifikation:**
- **Auto-spara på varje fält-blur och var 20:e sekund.** Insamlaren behöver aldrig leta efter en spara-knapp.
- Diskret status-text: "Sparat ✓" / "Sparar...". Lugn återkoppling, ingen modal.
- Utkastet lever i tillståndet `utkast` (M1 B3) — inte synligt för någon utom insamlaren.
- **Ett aktivt utkast i taget per insamling**, men en insamlare kan ha flera olika utkast parallellt (se Block 5).
- Insamlaren kan lämna och återuppta från sin översikt (Block 5) när som helst.
- **Döda utkast:** orört i 60 dagar → påminnelse via M15, sen mjuk arkivering (M1 B3.4). Arkiverat utkast kan återupplivas.

**Designval:** Auto-spara är inte en lyx — det är respekt. En ADHD-läsare blir avbruten ständigt. En insamlare som tappar 20 minuters arbete kommer inte tillbaka. Premium genom omsorg (princip 6).

**Kantfall:** Två flikar öppna mot samma utkast → sista skrivningen vinner, men en mjuk notis varnar: "Detta utkast är öppet i ett annat fönster." Ingen avancerad konflikthantering i v1 — "vårt fel men inte dödligt".

## 1.5 Live preview & markdown-editor

**Vad det är:** insamlaren ska kunna *se* sin insamling växa fram, och formatera texten utan att kunna en enda kod.

**Live preview — specifikation:**
- **Delad vy:** redigering till vänster, en levande förhandsvisning av insamlingssidan till höger (staplas vertikalt på mobil).
- Previewen visar insamlingen **så som donatorn kommer se den** — cover, titel, kort beskrivning, progress bar, lång beskrivning.
- Uppdateras i realtid medan insamlaren skriver.
- En tydlig stämpel "Förhandsvisning — så här ser donatorn din insamling" så ingen tror den är publicerad.

**Markdown-editor — specifikation:**
- M1 B1 F3 slog fast: **markdown-light** (fet, kursiv, listor, H2/H3). Insamlaren ska aldrig behöva *skriva* markdown-tecken.
- **Formatteringsknappar** ovanför textfältet, en liten verktygsrad:
  - **Fet** · *Kursiv* · • Punktlista · 1. Numrerad lista · H2-rubrik · H3-rubrik · Länk
- Knapparna infogar rätt markdown bakom kulisserna. Insamlaren markerar text, klickar Fet, ser fet text i previewen.
- **Inga inline-bilder i editorn** — bilder hör hemma i Media-steget (M1 B1 F5), så granskaren vet var att titta.
- **Länk-knappen** öppnar en liten dialog (text + URL). Externa länkar tillåtna (M1) men flaggas synligt för granskaren.
- Teckenräknare diskret i hörnet, blir gul när man närmar sig 5000-taket (M1 B1 F3).

**Designval:** En rik WYSIWYG-editor är frestande men fel — den bjuder in clickbait-formatering, brutna layouter och granskningskaos. Markdown-light med knappar ger insamlaren *tillräckligt* utan att öppna en kaoslåda. Anti-kaos by design (princip 10).

**Kantfall:** Insamlaren klistrar in formaterad text från Word → klistras in som ren text, markdown-formatering måste göras om med knapparna. Detta är medvetet: det skyddar mot trasig HTML och osynliga stilar. En kort notis förklarar varför.

## 1.6 Skatte-information till insamlaren

**Vad det är:** en tydlig informationsruta i skapande-flödet som upplyser insamlaren om att större belopp kan väcka skattefrågor — och att skatten är insamlarens eget ansvar, inte plattformens.

**Specifikation:**
- I wizarden visas en lugn **informationsruta** — placerad i steg 5 (mål, modell, datum), där insamlaren just satt sitt målbelopp, eftersom det är då frågan blir konkret.
- Rutans innehåll, i klartext:
  > **Tänk på skatten.** Tar du emot större belopp kan det väcka skattefrågor — räknas det som gåva, insamling eller inkomst? Det beror på vad pengarna går till och hur de används. **Plattformen hanterar inte din skatt.** Är du osäker, kontakta Skatteverket eller en revisor innan du drar igång.
- Rutan är **informativ, inte blockerande** — insamlaren behöver inte bocka av något för att gå vidare. Verktyg, inte polis (princip 5).
- Samma upplysning sammanfattas kort i steg 7 (granska & skicka) bredvid sammanställningen, så den inte missas av en insamlare som klickat förbi snabbt.
- Texten knyter an till **M5** (pengaflödet — vad plattformen aldrig rör juridiskt) och **M8** (villkor): plattformen förmedlar, insamlaren äger sitt eget ansvar.

**Designval:** Detta skyddar **båda parter**. Insamlaren får informationen i tid och kan inte i efterhand säga "ingen sa något". Plattformen visar tydligt var dess ansvar slutar — den är infrastruktur, inte skatterådgivare (princip 13: samordna befintlig godhet — Skatteverket och revisorer äger skattefrågan). En oslipad insamlare som Ahmed vet ofta inte att en stor insamling kan ses som inkomst; en tidig, vänlig knuff är omsorg, inte byråkrati.

**Kantfall:** Insamlaren ber plattformen om skatteråd via supportkanal → standardsvar hänvisar vidare till Skatteverket/revisor. Plattformen ger aldrig skatteråd — det är medvetet och gäller utan undantag.

---

# BLOCK 2 — Inskickning & granskningsdialog

Det känsligaste momentet i hela insamlar-flödet. Här möter insamlaren granskaren. Görs det fel känns det som ett myndighetsavslag. Görs det rätt känns det som att någon hjälper dig bli klar.

> **Avgränsning:** Detta block är insamlarens *upplevelse* av granskningen. Granskarens egen vy, kö och beslutsverktyg bor i M3. Vad som granskas *mot* (policyn) bor i M8.

## 2.1 Inskickningen

**Vad det är:** ögonblicket insamlaren lämnar över utkastet till granskning.

**Specifikation:**
- Steg 7 i wizarden ("Granska & skicka in") visar **en sammanställning** av hela insamlingen + previewen.
- En **förkontroll** listar allt obligatoriskt: grönt ✓ för ifyllt, gult ⚠ för tunt, rött ✗ för saknat. Knappen "Skicka in" är inaktiv tills inga röda finns.
- De gula varningarna (tunn text, ingen specifik plats osv.) **blockerar inte** — de informerar. Insamlaren får skicka in ändå.
- Vid inskickning: en lugn bekräftelse-skärm — *"Din insamling är inskickad. Granskaren tittar på den inom ca 72 timmar. Du får en notis när det finns ett besked."* Förväntan sätts direkt (SLA-riktmärket från M3).
- Tillstånd: `utkast` → `inskickad` (M1 B3.3). Insamlaren kan **inte** redigera medan ärendet ligger i kö eller granskas (annars granskar man ett rörligt mål).

**Designval:** Att sätta tidsförväntan direkt ("ca 72 timmar") dödar oron. Tystnad efter inskickning är den vanligaste orsaken till att folk hör av sig — och varje sådan kontakt är manuellt arbete mot 95 %-principen.

**Kantfall:** Insamlaren upptäcker ett fel direkt efter inskickning → kan **dra tillbaka** ärendet till `utkast` så länge ingen granskare ännu plockat det. Har granskningen börjat → får vänta på granskarens första svar.

## 2.2 Granskningsstatus — vad insamlaren ser

**Vad det är:** ett alltid-synligt, ärligt fönster mot var ärendet befinner sig.

**Specifikation — statusen visas i insamlarens översikt (Block 5) och på utkastsidan:**

| Tillstånd (M1 B3) | Vad insamlaren ser | Ton |
|---|---|---|
| `inskickad` | "I kö för granskning. Beräknad start inom 72 h." | Lugn väntan |
| `under_granskning` | "En granskare tittar på din insamling nu." | Det rör på sig |
| `ändring_begärd` | "Granskaren har frågor — se vad som behöver justeras." | Handlingsbart, ej avslag |
| `aktiv` | "Godkänd och publicerad! 🎉" | Firande |
| `avvisad` | "Granskaren kunde inte godkänna — läs motiveringen." | Respektfullt, tydligt |

- **Aldrig en naken statuskod.** Alltid en mänsklig mening + vad insamlaren ska göra härnäst (om något).
- Statusbyten triggar en notis via M15 (opt-in).
- En diskret **tidslinje** visar ärendets historik: inskickad → granskning startade → ändring begärd → osv. Insamlaren ser hela resan, inget är dolt.

**Designval:** `ändring_begärd` får aldrig se ut som ett avslag. Ordval, färg (gul, inte röd) och formulering ("har frågor", inte "underkänd") är medvetna. Det är skillnaden mellan en insamlare som justerar och skickar tillbaka, och en som ger upp.

## 2.3 Ändringsbegäran — dialogen fram och tillbaka

**Vad det är:** själva samtalet mellan insamlare och granskare. Detta är hjärtat i Block 2.

**Specifikation:**
- När granskaren begär ändring går insamlingen till `ändring_begärd` (M1 B3) och **bollen ligger hos insamlaren**.
- Insamlaren ser granskarens begäran som **en strukturerad lista**, inte en textklump:
  - Varje punkt pekar på **ett specifikt fält** ("Mottagarbeskrivning", "Cover-bild").
  - Varje punkt har granskarens **motivering** i klartext ("Beskriv tydligare hur de 50 moskéerna valts ut").
  - Varje punkt har en status: ☐ Att åtgärda / ✓ Åtgärdad.
- Insamlaren kan nu **redigera de berörda fälten** — utkastet är upplåst igen, men bara för redigering, inte för ny inskickning förrän punkterna är adresserade.
- Vid varje punkt kan insamlaren skriva ett **kort svar till granskaren** ("Jag har lagt till en förklaring") eller, om hen är oenig, motivera varför ("Adressen kan jag inte visa publikt av säkerhetsskäl — den finns för granskning").
- När insamlaren är klar: **"Skicka tillbaka till granskning"** → `ändring_begärd` → `inskickad` (M1 B3.3).

**Designval — punktlista, inte fritextkonversation.** En chatt-tråd blir rörig, svår att överblicka och omöjlig att se "är vi klara nu?". En fältkopplad checklista gör det glasklart vad som återstår — för båda parter. Det är anti-kaos i ett verktyg som annars lätt blir kaos. Bra för en ADHD-läsare på *båda* sidor.

## 2.4 Hur granskarens motivering visas

**Vad det är:** principen att insamlaren alltid förstår *varför*.

**Specifikation:**
- **Ingen ändringsbegäran och inget avvisande utan motivering i klartext.** Detta är ett krav, speglat från M3 Block 3.
- Motiveringen visas **bredvid det fält den gäller**, inte i en separat e-post eller dold logg.
- Vid `avvisad`: en sammanhållen, respektfull förklaring + om möjligt en väg framåt ("Den här typen av insamling kan vi inte ta upp eftersom... Om du i stället vill samla till X, går det bra.").
- Avvisande som beror på policyn (M8) länkar till den relevanta policy-punkten — insamlaren ska kunna läsa regeln själv.
- Tonen är **utbildande, inte dömande**. Granskaren är vakt vid grinden, inte censor (princip 1).

**Designval:** En insamlare som blir avvisad utan att förstå varför känner sig orättvist behandlad och kan sprida det i samhället. En insamlare som *förstår* — även när svaret är nej — accepterar det. Tydlig motivering är inte bara rättvist, det skyddar plattformens rykte.

## 2.5 Flera granskningsrundor

**Vad det är:** verkligheten att en insamling kan gå fram och tillbaka mer än en gång.

**Specifikation:**
- Cykeln `under_granskning` → `ändring_begärd` → `inskickad` → `under_granskning` kan upprepas **utan hård gräns**.
- Varje runda lägger ett nytt lager i tidslinjen (2.2) — insamlaren ser "Runda 2", "Runda 3".
- **Vid runda 3** visar plattformen en mjuk uppmaning till *båda* parter: "Den här insamlingen har gått fram och tillbaka flera gånger — överväg ett kort samtal." (Kontaktväg spikas i M3/M15.)
- Tidigare rundors åtgärdade punkter ligger kvar som historik (hopfällda), så ingen behöver scrolla genom allt.
- Svarar insamlaren aldrig på `ändring_begärd` → auto-arkiveras efter 30 dagar (M1 B3.4), kan återupplivas.

**Designval:** Ingen hård rundgräns — en automatisk avvisning efter "för många rundor" straffar ofta den mest seriösa insamlaren som verkligen försöker. Men en mjuk knuff vid runda 3 erkänner att vissa saker löses snabbare i ett samtal än i en checklista. Människor löser kantfall, inte regler (M1 B5.3).

**Kantfall:** Insamlaren skickar tillbaka utan att ha rört något → granskaren ser det direkt i M3 och kan begära samma ändringar igen eller avvisa. Plattformen blockerar inte tomma åter-inskickningar — det är granskarens omdöme.

---

# BLOCK 3 — Driva en aktiv insamling

Insamlingen är `aktiv`. Pengar kan komma in. Nu byter insamlaren roll — från sökande till värd. Block 3 ger verktygen för den rollen.

## 3.1 Insamlarens dashboard

**Vad det är:** kommandocentralen för en aktiv insamling. En vy, allt insamlaren behöver.

**Specifikation — dashboarden visar:**
- **Status överst:** "Aktiv — stänger om 12 dagar" + förväntad leverans (M1 B2 F2).
- **Progress:** insamlat belopp / mål, progress bar, antal donationer. Vid intervall-modell: stretch-markering mot max (M1 B2 F1).
- **Donationsflöde:** lista över donationer — belopp, tidpunkt, namn eller "Anonym" (M4 styr vad som visas), donatorns meddelande om sådant finns.
- **Snabbåtgärder:** Posta uppdatering · Dela · Redigera (det som får ändras, Block 5) · Förläng (M1 B2 F5).
- **Att-göra-påminnelser:** mjuka kort — "Posta gärna en uppdatering, det var 9 dagar sedan senast", "Tänk på att samla bevis inför resultatfasen".
- **Transparens-status:** de tre obligatoriska bevisen (start/utbetalning/resultat, M7) som en checklista — start ✓ klar vid publicering, de andra två väntande.

**Designval:** En enda vy, inte en meny av sidor. En insamlare loggar in sällan och stressat — allt viktigt måste synas direkt. Skannbart, kortbaserat, fet stil på siffror. Premium genom lugn och tydlighet (princip 6).

**Kantfall:** Insamling med noll donationer än → dashboarden visar uppmuntran och delningsverktyg i fokus, inte en tom tabell. Den första dagen är känslig.

## 3.2 Posta fria uppdateringar

**Vad det är:** insamlarens röst under insamlingens gång. Den fria delen av transparens-loopen (M7).

**Specifikation:**
- Insamlaren kan posta **fritt antal uppdateringar** mellan de tre obligatoriska bevisen.
- En uppdatering = kort text (markdown-light, samma editor som Block 1.5) + valfria bilder (roll `update`, M1 B1 F5).
- Uppdateringar **granskas INTE i förväg** — de publiceras direkt. Insamlaren äger sin röst (princip 5, verktyg inte polis).
- Uppdateringar visas i ett kronologiskt flöde på insamlingssidan och kan trigga notis till donatorer som följer (M15, opt-in).
- **Efterhandsmoderering finns:** anmäls en uppdatering för olämpligt innehåll → M8/M13-flöde. Detta är det enda undantaget från "granska före publicering" (princip 7) — och det är medvetet: förhandsgranskning av varje liten uppdatering vore omöjligt för en 95 %-självgående plattform och skulle döda livskänslan.

**Designval:** Fria uppdateringar är oövervakade *by design*. Att förhandsgranska dem skulle skapa en granskningskö som aldrig tar slut och göra plattformen död och långsam. Skyddet ligger i efterhandsanmälan + att insamlarens identitet är KYC-verifierad (M6) — det finns en verklig person bakom varje uppdatering.

**Kantfall:** Insamlaren postar en uppdatering som i praktiken ändrar insamlingens ändamål ("pengarna går nu till X i stället") → det är inte en uppdatering, det är en ändring av löftet. Hör till Block 5 / M3 och fångas i anmälan om det smyger förbi.

## 3.3 Se donationer

**Vad det är:** insamlarens fönster mot pengarna som kommer in.

**Specifikation:**
- Live-lista: belopp, tidpunkt, donatorns namn eller "Anonym", meddelande.
- **Insamlaren ser ALDRIG kort-, person- eller kontaktuppgifter.** Den datan bor hos Stripe (M5). Dashboarden visar bara det donatorn valt att visa (M4).
- Aggregat: totalt, snitt, antal, "ge ändå vid undermål" kontra "vill ha refund"-fördelning (M1 B2 F4) — så insamlaren vet sin verkliga buffert.
- Per-enhet-vy om modellen har det ("412 mattor finansierade av 1000", M1 B2 F1).
- Export till enkel CSV för insamlarens egen bokföring/transparens.

**Designval:** Insamlaren ser *resultatet* av donationer men aldrig *donatorns privata data*. Det är per-fält integritetskontroll (princip 2) och det skyddar plattformen — insamlaren kan aldrig missbruka en kontaktlista hen aldrig fått.

## 3.4 Dela på sociala medier

**Vad det är:** verktyget som låter insamlaren dra in sin egen publik — och som låter "trafiken bygga sig själv".

**Specifikation:**
- Dela-knappar för **Facebook, WhatsApp, Instagram (länk/story), X, kopiera länk, e-post**. WhatsApp och Facebook först — det är där det muslimska samhället i Sverige faktiskt delar.
- Delad länk använder den **slumpade slug-URL:en** (M1 B1 F2).
- En korrekt **social preview** (Open Graph): cover-bild, titel, kort beskrivning. Länken ska se proffsig ut i flödet — premium-känslan följer med ut i världen.
- En enkel **"Tack-bild"-generator:** plattformen skapar en delningsbar bild med insamlingens framsteg ("412 av 1000 mattor — var med!"). Färdig att posta. Ingen designkunskap krävs.
- En **automatiskt genererad QR-kod** till insamlingssidans slug-URL. Insamlaren kan ladda ner den och dela den i sitt **lokala nätverk** — sätta upp den på moskéns anslagstavla, ta med på en lapp, lägga in i en bild på sociala medier. QR-koden kräver ingen designkunskap och fungerar utanför skärmen, där en länk inte når. Den finns synlig i dela-vyn bredvid dela-knapparna.
- **Ingen referral-/matchningsmekanik i v1.** M1 och masterkartans research parkerade GiveMatch-modellen — den kräver tredjepartsåtagande. Delning i v1 är ren organisk delning.

**Designval:** Plattformen kan inte marknadsföra varje enskild insamling. Men varje insamlare har ett eget nätverk. Att göra delning *friktionsfri och snygg* är hur den samlade trafiken byggs — varje delad insamling drar in besökare som upptäcker andra insamlingar (kopplar till M11). Princip 13: samordna befintlig godhet — insamlarens eget nätverk är "befintlig godhet".

**Kantfall:** Insamlaren delar innan en cover-bild finns → kan inte hända, cover är obligatorisk för publicering (M1). Social preview saknar bild först efter ev. cachning hos Facebook → vi tillhandahåller en korrekt OG-tagg, resten ligger hos plattformen vi delar till.

---

# BLOCK 4 — Resultatfasen

Insamlingen är `stängd` och `utbetald` (M1 B3). Pengarna är hos insamlaren. Nu kommer det som skiljer Sadaqa Sweden från en vanlig insamlingssajt: **loopen ska stängas**.

> **Avgränsning:** Hur bevisen *värderas och badges tilldelas* bor i M7. Block 4 är insamlarens *upplevelse* av att lämna in dem.

## 4.1 De obligatoriska bevisen

**Vad det är:** de två sista av transparens-loopens tre bevis som insamlaren själv laddar upp (det första, start-beviset, skapades automatiskt vid publicering).

**Specifikation — insamlaren laddar upp:**

| Bevis | Vad det är | M1-mediaroll |
|---|---|---|
| **Utbetalningsbevis** | Att pengarna lämnat plattformen till syftet — kvitto från leverantör, skärmbild av överföring | `payout_proof` |
| **Resultatbevis** | Att det som lovades blev gjort — bilder/uppdatering från utdelning, brunn, projekt | `result_proof` |

- Varje bevis = bild(er) + en kort förklarande text.
- **Ett bevis per taggad kategori** (M1 B1 F1): taggade insamlaren tre kategorier ska resultatfasen ha bevis som täcker alla tre. Wizardens fråga 5 ("vad kan du bevisa?") förberedde insamlaren på just detta.
- Bevistrycket följer målmodellen (M1 B2 F1): fast → "visa 1000 mattor", intervall → "visa lägstanivåns leverans", öppet → "visa fördelningslogiken". Vid undermål bevisas mot vad som faktiskt samlades in (M1 B2 F4), inte mot ursprungsmålet.
- Samma media-regler som M1 B1 F5: jpeg/png/webp, max 5 MB, äkta och relevanta bilder.

**Kantfall:** Insamlaren har bara ett resultat och vill bevisa "delvis" → tillåtet, hen laddar upp det hen har. Plattformen anklagar inte (princip 9) — den visar bara vad som finns. Ett partiellt bevis är bättre än inget och syns ärligt.

## 4.2 Att-göra-flödet i resultatfasen

**Vad det är:** hur plattformen leder insamlaren genom de sista stegen utan att tjata.

**Specifikation:**
- Efter `utbetald` får dashboarden (Block 3) ett tydligt **resultat-kort** överst: "Sista steget — visa vad insamlingen gjorde."
- En liten checklista: ☐ Utbetalningsbevis ☐ Resultatbevis (+ per kategori om flera).
- **Påminnelser via M15** (opt-in): efter utbetalning, inför genomförandedatum, och vid genomförandedatum om bevis saknas. Mjuka, inte hotfulla.
- Passerar genomförandedatum utan resultatbevis → `väntar_på_resultat` (M1 B3), insamlingssidan visar publikt "Väntar på resultat". **Inte ett straff — synligt** (M1 B2 F2).
- Bevis kommer in sent → `väntar_på_resultat` → `avslutad_levererad`, badge tilldelas (M7). Det är aldrig för sent att stänga loopen.

**Designval:** Resultatfasen ska kännas som en *möjlighet* — chansen att visa stolt vad insamlingen åstadkom — inte som en revisorsbörda. Ordval och framtoning är medvetna. Detta är princip 8 i praktiken: bygg för det andliga idealet (sadaqah är redan komplett), men bär den mänskliga svagheten (insamlaren vill visa, donatorn vill se).

## 4.3 Att stänga transparens-loopen

**Vad det är:** ögonblicket loopen sluts — och varför det är socialt belönande, inte tvingande.

**Specifikation:**
- När alla tre bevis är inne och godkända (M7) → `avslutad_levererad`, **badge "Resultat levererat"** tilldelas och följer insamlarens profil (M9).
- Insamlingssidan visar en lugn, hel "slutförd"-vy: start → utbetalning → resultat, med alla bevis i en ren tidslinje. Donatorn kan komma tillbaka och se hela historien.
- Uteblir resultatbeviset i 90 dagar (M1 B5.2) → `avslutad_utan_resultat`, **ingen badge**. Plattformen skriver ingen anklagelse — frånvaron av badge är hela signalen.
- **Plattformen tvingar aldrig fram bevis.** Den gör det socialt belönande att lämna dem (badge, profil, trovärdighet inför nästa insamling) och socialt synligt att inte göra det. Marknaden — donatorerna — drar slutsatsen (Tripadvisor-modellen, sammanfattningen).

**Designval:** Transparens är ett mål, inte ett tvång (princip 9). Hela mekaniken bygger på morot, inte piska. En insamlare som stänger loopen får något hen vill ha; en som inte gör det förlorar bara framtida trovärdighet. Detta är den enda modellen som är förenlig med "verktyg, inte polis" *och* med att faktiskt få in bevis.

**Kantfall:** Insamlaren stängde loopen men en donator ifrågasätter äktheten i ett bevis → anmälningsflöde, granskare/admin bedömer (M8). Badge kan dras tillbaka. Sällan, men möjligt.

---

# BLOCK 5 — Flera insamlingar & redigering efter publicering

En insamlare är inte en engångsföreteelse. Hen kan driva flera insamlingar, komma tillbaka, behöva justera. Block 5 ger överblicken och reglerna.

## 5.1 Insamlarens översikt

**Vad det är:** insamlarens hem på plattformen — alla hens insamlingar, oavsett tillstånd, på ett ställe.

**Specifikation:**
- En lista/kortvy över **alla** insamlingar insamlaren äger, grupperade efter tillstånd:
  - **Pågår** (`utkast`, `inskickad`, `under_granskning`, `ändring_begärd`)
  - **Aktiva** (`aktiv`)
  - **Avslutade** (`stängd`, `utbetald`, `väntar_på_resultat`, `avslutad_*`)
- Varje kort: titel, status med mänsklig text, framsteg, och **vad insamlaren behöver göra härnäst** (om något) — "Svara på granskaren", "Ladda upp resultatbevis", inget.
- "Skapa ny insamling" alltid synlig → startar wizarden (Block 1).
- **Ingen gräns på antal samtidiga insamlingar i v1.** Men: en insamlare med ett `avslutad_utan_resultat` i historiken ser detta tydligt — och granskaren ser hens fullständiga historik vid nästa granskning (M3). Trovärdighet bärs framåt.

**Designval:** En insamlare med tre insamlingar i olika faser måste kunna se allt på en gång och direkt veta var hens uppmärksamhet behövs. "Vad ska jag göra härnäst" på varje kort är ADHD-vänlig design — den eliminerar beslutsfriktionen "vänta, vad väntade den här på?".

**Kantfall:** En insamlare öppnar tio utkast och slutför inget → utkasten arkiveras efter 60 dagars stillhet (M1 B3.4). Ingen panik, ingen begränsning i förväg — "vårt fel men inte dödligt".

## 5.2 Redigering efter publicering

**Vad det är:** vad en insamlare får ändra på en `aktiv` insamling — och hur.

**Detta block ÄGER INTE reglerna — de bor i M1 Block 5.** Modul 2 är insamlarens *gränssnitt* mot de reglerna. Sammanfattning av M1 B5.1:

| Insamlaren får fritt (loggas) | Kräver granskare | Låst helt |
|---|---|---|
| Titel, kort/lång beskrivning (små ändringar) | Höja målbelopp | Mottagare |
| Lägga till media | Ändra kategori | Målbelopps-modell |
| Förlänga deadline (kort, auto) | Lång förlängning, byta plats | Sänka målbelopp |
| Skjuta genomförandedatum | Ändring som ändrar ändamålet | |

**Specifikation av gränssnittet:**
- "Redigera"-knappen i dashboarden (Block 3) öppnar samma editor som Block 1, men **fält som är låsta är gråade** med en liten förklaring ("Mottagaren kan inte ändras — det är löftet till dina donatorer").
- Fält som **kräver granskare** är redigerbara men markerade: en ändring där skapar en liten granskningsbegäran (kort runda i M3, inte hela flödet om).
- Fält som är **fria** sparas direkt — men skriver alltid en rad i den **publika ändringsloggen** (M1 B5.1).
- Ändringsloggen visas för insamlaren själv i dashboarden ("Din redigeringshistorik — detta syns för donatorer") så det aldrig kommer som en överraskning att ändringar är publika.

**Designval:** Insamlaren ska aldrig kunna *av misstag* bryta löftet till en donator. Gränssnittet gör det fysiskt omöjligt att tyst ändra mottagare eller modell — de fälten går inte att röra. Det som bara förbättrar berättelsen är fritt men transparent loggat. Princip 10 (anti-kaos by design) och M1:s "löftet är heligt".

## 5.3 Återkommande cykler — förberedd, inte byggd

**Vad det är:** insamlarens väg att driva samma insats om och om igen.

**Specifikation:**
- M1 B4.3 parkerade **mission** (återkommande insamlingstyp) men slog fast att `mission_id` finns i datamodellen från start.
- I Modul 2 betyder det: **wizarden i v1 har inget "skapa återkommande insamling"-val.** En insamlare som vill köra en ny cykel skapar i v1 en ny insamling — men kan **kopiera en tidigare insamling som mall** (alla fält förifylls, insamlaren justerar). Detta sparar arbete utan att kräva mission-arkitekturen.
- Diff-baserad fast-track-granskning av nästan identiska cykler hör till **M3 Block 5** — Modul 2 förbereder bara genom att "kopiera som mall" bevarar kopplingen till originalet, så M3 kan jämföra.
- Notiser till tidigare donatorer ("Ahmed öppnade en ny cykel") hör till **M15**.

**Designval:** "Kopiera som mall" ger 80 % av nyttan av återkommande insamlingar till nästan ingen byggkostnad, och håller v1-scopet ärligt (masterkartan, bygg-grupp A/B/C). Den fulla mission-modellen byggs när plattformen lärt sig hur cykler faktiskt används.

**Kantfall:** Insamlaren kopierar en insamling som blev avvisad → mallen kopieras, men granskningen börjar om från noll. En tidigare avvisning ger ingen genväg.

---

## 5. Designval & motivering (hela Modul 2)

| Beslut | Motivering |
|---|---|
| Stegvis wizard, ett fokus per steg | En mur av fält stoppar vanliga människor. Steg + progress-indikator gör det överkomligt — särskilt för en ADHD-läsare. |
| Strukturfrågorna före de torra fälten | Insamlaren börjar med sin historia (motiverande), resten känns som att fylla i, inte börja om. |
| Fem strukturfrågor, fråga 5 = "vad kan du bevisa?" | Planterar bevis-tänket vid sekund ett. Transparens-loopen vinns i wizarden, inte i resultatfasen. |
| Svaren sammanfogas, AI omskriver inte | Hedrar M1: äkta oslipad text är mer trovärdig än AI-perfektion. Plattformen ger ställningen, inte huset. |
| Auto-spara var 20:e sekund | Förlorat arbete = förlorad insamlare. Respekt och premium-känsla. |
| Markdown-light med formatteringsknappar, ingen rik WYSIWYG | Ger insamlaren nog utan att öppna clickbait- och layoutkaos. Anti-kaos by design. |
| Granskningsdialog som fältkopplad checklista, inte chatt | Glasklart vad som återstår för båda parter. En chatt-tråd blir rörig och oöverskådlig. |
| `ändring_begärd` framställs aldrig som avslag | Ordval och färg avgör om insamlaren justerar eller ger upp. |
| Ingen hård gräns på granskningsrundor, mjuk knuff vid runda 3 | Hård gräns straffar den mest seriösa insamlaren. Vissa saker löses bäst i ett samtal. |
| Fria uppdateringar förhandsgranskas inte | Förhandsgranskning av varje uppdatering vore omöjligt för en 95 %-självgående plattform och dödar livskänslan. Skydd = efterhandsanmälan + KYC. |
| Insamlaren ser aldrig donatorns privata data | Per-fält integritet. Insamlaren kan inte missbruka en lista hen aldrig fått. |
| Snygg, friktionsfri delning; ingen referral-mekanik i v1 | Insamlarens nätverk bygger trafiken. Referral parkerat — kräver tredjepartsåtagande. |
| Skatte-informationsruta i wizarden, informativ ej blockerande | Skyddar båda parter: insamlaren får veta i tid, plattformen visar var dess ansvar slutar. Plattformen är infrastruktur, inte skatterådgivare (M5/M8). |
| Automatiskt genererad QR-kod till insamlingssidan | Når insamlarens lokala nätverk utanför skärmen — moskéns anslagstavla, fysiska lappar — där en länk inte fungerar. |
| Resultatfasen framställs som möjlighet, inte revisorsbörda | Princip 8: bär den mänskliga svagheten — insamlaren vill visa, donatorn vill se. |
| Plattformen tvingar aldrig fram bevis | Transparens är mål, inte tvång (princip 9). Morot (badge) + synlighet, aldrig piska. |
| "Kopiera som mall" i stället för full mission-modell i v1 | 80 % av nyttan, nästan ingen byggkostnad. Mission byggs när cykler är förstådda. |
| Låsta fält gråas i redigeringsvyn med förklaring | Insamlaren kan inte ens av misstag bryta löftet till donatorn. |

---

## 6. Kopplingar

**Modul 2 tar in:**
- Insamlings-objektets fält, modeller och regler från **M1** — wizarden bygger ett M1-objekt, redigeringen lyder M1 B5.
- Roll och KYC-status från **M6** — bara en verifierad insamlare får skapa och publicera.
- Granskningsbeslut och ändringsbegäranden från **M3** — granskningsdialogen (Block 2) visar M3:s utdata.
- Donationsdata (aggregerat, integritetsfiltrerat) från **M4/M5** för dashboarden.

**Modul 2 lämnar ut:**
- Ett inskickat insamlings-objekt som **M3** granskar.
- Insamlarens svar på ändringsbegäran tillbaka till **M3**.
- Fria uppdateringar och de två slutbevisen till **M7** (transparens-loopen).
- Färdig insamlingssida som **M11** listar och **M13** öppnar för community.
- Delnings-events och statusbyten som triggar **M15**-notiser.
- "Vad insamlaren behöver göra"-signaler som **M16**-dashboarden kan aggregera.

**Hård beroende-flagga:** Block 1 (wizarden) kan inte byggas färdig förrän M1 är spikad — vilket den är. Block 2 (granskningsdialogen) måste byggas i takt med M3, de delar samma tillståndsmaskin. Block 3:s donationsvy väntar på M4/M5.

---

## 7. Säkerhet & anti-kaos

- **Granska före publicering** — wizarden kan bara producera ett `utkast`; det finns ingen väg till `aktiv` utom genom M3. Tillståndsmaskinen (M1 B3) gör det omöjligt att hoppa över granskning.
- **Granskningsdialog som checklista** — strukturen i sig hindrar att samtalet spårar ur i en oöverskådlig tråd.
- **Fria uppdateringar är oövervakade — en medveten risk.** Detta är det enda stället där "granska före publicering" inte gäller. Risken: en insamlare postar något olämpligt eller ändrar i praktiken ändamålet via en uppdatering. Skyddet är efterhandsanmälan (M8/M13) + att varje insamlare är KYC-verifierad (M6) — det finns alltid en identifierbar person. Att förhandsgranska uppdateringar avvisades: det skulle skapa en oändlig kö och döda livskänslan. Vi accepterar risken medvetet ("vårt fel men inte dödligt").
- **Insamlaren ser aldrig donatorers persondata** — kan inte läcka eller missbruka det.
- **Låsta fält i redigeringsvyn** — löftet till donatorn kan inte tyst ändras; mottagare/modell går fysiskt inte att röra.
- **Publik ändringslogg** — varje fri ändring syns; smygmanipulation blir synlig.
- **Diskriminerande/clickbait-språk** i wizardens text fångas i granskning (regeln bor i M8).
- **Reell risk att flagga:** en insamlare kan skicka tillbaka en ändringsbegäran utan att ha rört något, om och om. Det finns ingen automatisk spärr — det är medvetet, för en spärr skulle slå mot seriösa insamlare. Försvaret är granskarens omdöme i M3. Acceptabelt så länge granskar-volymen är liten; bör ses över om plattformen växer.

## 8. Automatisering

**Självgående (ingen människa):** auto-spara av utkast, sammanfogning av strukturfrågor till beskrivning, slug-generering, social preview, "tack-bild"-generering, statusnotiser, påminnelser (utkast, uppdateringar, resultatbevis), kort förlängning (auto-godkänd, M1 B2 F5), publicering av fria uppdateringar, arkivering av döda utkast.

**Kräver människa:** allt i granskningsdialogen (granskaren, M3), bedömning av målhöjning och lång förlängning, anmälda uppdateringar (M8), och de M1 B5.2-kantfall där insamlaren själv inte räcker.

Riktmärke: en insamlare ska kunna ta en hel insamling från idé till publicerad — och vidare till stängd loop — utan att Zivar rör något *utom* själva granskningsbesluten. Det är 95 %-principen för insamlar-flödet.

## 9. Öppna frågor

1. **Direkt kontaktväg insamlare ↔ granskare** vid runda 3 (2.5) — chatt, e-post, eller bokat samtal? → spikas tillsammans med M3 + M15.
2. **Får en insamlare med ett `avslutad_utan_resultat` i historiken** automatiskt skapa nya insamlingar fritt, eller ska granskaren se en varningsflagga? → bedöms i M3 (granskningspolicy-koppling M8).
3. **Hur hanteras social preview-cachning** hos Facebook/WhatsApp efter en titel-/cover-ändring? Tekniskt, parkeras till byggfasen.
4. **"Kopiera som mall"** — ska den även kopiera media, eller bara textfält? Lutar mot endast text (bilder ska vara aktuella) → bekräftas i M7.
5. **Maxantal samtidiga aktiva insamlingar per insamlare** — ingen gräns i v1, men bör övervakas. → M16 (admin) håller koll.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 2:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Alla 5 block spikade: wizarden (5 strukturfrågor, draft-sparning, live preview, markdown-editor), granskningsdialogen, aktiv-fasen (dashboard, uppdateringar, delning), resultatfasen, flera insamlingar & redigering efter publicering. |
| 1.1 | 2026-05-23 | Kirurgiska tillägg efter extern granskning. Block 1: nytt avsnitt 1.6 — skatte-informationsruta i wizarden (skyddar insamlare och plattform, hänvisar till Skatteverket/revisor). Block 3.4: QR-kod till insamlingssidan, för delning i lokalt nätverk. Två rader tillagda i designvals-/beslutstabellen. |
