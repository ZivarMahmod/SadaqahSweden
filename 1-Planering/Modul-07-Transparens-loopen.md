# Modul 7 — Transparens-loopen

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`, `Modul-06-Identitet-och-auth.md`

---

## 1. Vad modulen är

Modul 7 är **plattformens själ i teknisk form**. Den definierar hur en insamling *bevisar* att pengarna gjorde vad de lovade.

Tre obligatoriska bevis (start, utbetalning, resultat), fria uppdateringar däremellan, ett badgesystem som belönar transparens, och en historik som följer både insamlingen och insamlarens profil.

**Den löser:** problemet som ingen konkurrent löst på riktigt. GoFundMe och LaunchGood granskar *innan* — men släpper sedan greppet om hur pengarna faktiskt användes. M7 är vassare just där. Den är **kärndifferentiatorn**.

---

## 2. Varför den behövs

Research var entydig: LaunchGoods svaghet är **ytlig kontroll av *fund use*** — de verifierar projektet vid start men följer inte upp resultatet. GoFundMe likadant. Det är hålet.

Varför hålet är farligt:
- En donator som ger en gång och aldrig får veta vad som hände **ger inte igen**.
- En plattform utan resultatbevis blir bara ett kassaregister — exakt vad visionen säger att vi *inte* ska vara.

Men — och det här är hela finessen — vi får inte lösa det med tvång:

> **Princip 8:** Sadaqah är komplett när pengarna lämnar handen. Allah har sett. Men människan i dunya behöver återkoppling.
> **Princip 9:** Transparens är ett *mål*, inte ett *tvång*. Vi kan inte tvinga fram resultatbevis. Vi gör det socialt belönande. Plattformen anklagar aldrig — den visar bara historik.
> **Princip 5:** Verktyg, inte polis.

M7 är svaret: en loop som gör transparens till det *naturliga, belönade* valet — utan att straffa den som faller kort.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | De tre obligatoriska bevisen — start, utbetalning, resultat | ✅ Spikad |
| 2 | Fria uppdateringar — det valfria däremellan | ✅ Spikad |
| 3 | Badgesystemet — hur transparens belönas | ✅ Spikad |
| 4 | Bevistryck per kategori & modell — hur kraven varierar | ✅ Spikad |
| 5 | Hur historik visas — på insamlingen och profilen | ✅ Spikad |

När alla fem är klara vet vi exakt hur en insamling bevisar sig — och hur den bevisningen följer en människa över tid.

---

# BLOCK 1 — De tre obligatoriska bevisen

Varje insamling går genom **tre bevispunkter**. De är ryggraden i loopen. De följer insamlingens livscykel (M1 Block 3).

```
START ──────▶ [insamling pågår] ──────▶ UTBETALNING ──────▶ [genomförande] ──────▶ RESULTAT
  │                                          │                                        │
publiceras                            pengar lämnar                            det lovade
                                       plattformen                              är gjort
```

## Bevis 1 — Start

**Vad det är:** löftet. Vad insamlingen *lovar* att göra. Detta är inte ett separat upload-moment — **det *är* insamlings-objektet vid publicering** (M1 Block 1 + 2).

**Specifikation:**
- Består av: beskrivning, målbelopp och modell, mottagare, genomförandedatum, cover-bild. Allt redan definierat i M1.
- **När det "tas":** automatiskt, i det ögonblick granskaren godkänner insamlingen (`under_granskning → aktiv`, M1 Block 3).
- **Format:** insamlings-objektets publika fält, fryst som en ögonblicksbild. Detta blir referenspunkten — allt senare bevis mäts *mot starten*.
- **Krav:** inget extra av insamlaren — granskningen (M3) *är* startbevisets kvalitetskontroll.
- **Obligatoriskt:** ja, per definition (en publicerad insamling *har* ett startbevis). **Publikt:** ja.

**Varför starten räknas som ett bevis:** för att resultatbeviset ska betyda något måste det finnas ett *löfte* att jämföra mot. Starten är nollpunkten i loopen.

## Bevis 2 — Utbetalning

**Vad det är:** beviset på att pengarna **lämnat plattformen** och nått insamlaren — på väg mot sitt syfte.

**Specifikation:**
- **När det skapas:** automatiskt när utbetalning genomförs (`stängd → utbetald`, M1 Block 3). Stripe (M5) bekräftar att medlen flyttats till insamlarens anslutna konto.
- **Vad som visas publikt:** belopp utbetalt, datum, och att det gick till den verifierade insamlaren (BankID-verifierad, M6). Plattformen *vet* detta — det behöver inte insamlaren bevisa manuellt.
- **`payout_proof`-media (M1 Block 1):** insamlaren *uppmanas*, men tvingas inte, ladda upp ett kompletterande bevis — kvitto från leverantör, beställningsbekräftelse, överföringsbevis till en partnerorganisation.
- **Format:** systemgenererad utbetalningspost (alltid) + frivillig bilduppladdning (jpeg/png/webp).
- **Krav:** den systemgenererade delen är obligatorisk och sker automatiskt. Den kompletterande uppladdningen är **starkt uppmuntrad men frivillig** — verktyg, inte polis.
- **Obligatoriskt:** systemdelen ja, uppladdningen nej. **Publikt:** ja.

**Varför utbetalning är ett eget bevis:** donatorn ska se *när* och *att* pengarna lämnade plattformens kontroll. Det är ett ärligt mellansteg — "pengarna är inte längre hos oss, de är på väg" — och det skyddar plattformen: efter utbetalning är genomförandet insamlarens ansvar, inte vårt.

## Bevis 3 — Resultat

**Vad det är:** beviset på att **det som lovades är genomfört**. Loopen sluts här. Detta är M7:s viktigaste enskilda funktion.

**Specifikation:**
- **När:** insamlaren postar det när det lovade är gjort — riktmärke kring genomförandedatumet (M1 Block 2).
- **Innehåll:** minst en bild *eller* video som visar resultatet, plus en skriven uppdatering som knyter resultatet till löftet. "1000 bönematter levererade till 8 moskéer — här är de."
- **Format:** bild (jpeg/png/webp) eller video (extern länk, YouTube/Vimeo — ingen direktuppladdning i v1, samma skäl som M1) + text.
- **Bevis per kategori:** har insamlingen flera kategorier krävs resultatbevis **per kategori** (Block 4).
- **Granskning av resultatbevis:** lättviktig. Granskaren (M3) kontrollerar inte sanningshalten i fält — det vore omöjligt — utan att beviset *finns, är relevant och rimligt* (inte en stockbild, inte uppenbart orelaterat). En slags äkthetskontroll, inte en revision.
- **Krav:** för att utlösa badgen "Resultat levererat" (Block 3) och tillståndet `avslutad_levererad` (M1) måste resultatbevis finnas och godkännas.
- **Obligatoriskt:** **ja som krav för full status — men inte framtvingbart.** Uteblir det → insamlingen går till `väntar_på_resultat`, sedan `avslutad_utan_resultat` (M1 Block 3). Ingen bestraffning, bara frånvaro av badge. Princip 9.
- **Publikt:** ja.

**Den ärliga gränsen:** vi kan inte *tvinga* fram ett resultatbevis. Vi kan göra det enkelt att ge, socialt belönat att ge, och synligt frånvarande när det inte ges. Det är allt en plattform *kan* göra — och det är medvetet. Att försöka mer vore att bli polis.

## Kantfall

- **Resultatbevis kommer sent:** fullt tillåtet. `väntar_på_resultat → avslutad_levererad` är en giltig övergång (M1 Block 3). Badgen tilldelas när beviset kommer, oavsett hur sent.
- **Insamlingen nådde bara undermål:** resultatbeviset mäts mot vad som *faktiskt* samlades in, inte mot ursprungsmålet (M1 Block 2 Fält 4). "Vi samlade 60 % — här är de 600 matterna."
- **Insamlaren postar resultat men det är uppenbart fejk/orelaterat:** granskaren avvisar beviset, insamlingen står kvar i `väntar_på_resultat`. Misstanke om bedrägeri → `pausad` (M1 Block 3, regler i M8).
- **Mottagaren föll bort efter utbetalning** (krig, moskén lades ner): insamlaren rapporterar via en fri uppdatering (Block 2); granskare/admin bedömer omdirigering eller refund (M1 Block 5, M8). Resultatbeviset blir då "så här blev det i stället".

---

# BLOCK 2 — Fria uppdateringar

Mellan de tre obligatoriska bevisen får insamlaren posta **valfritt många fria uppdateringar**. Det är loopens livspuls.

## 2.1 Vad en fri uppdatering är

**Vad det är:** ett inlägg insamlaren postar när som helst under en aktiv insamling eller dess genomförandefas — utan att det krävs.

**Specifikation:**
- **Innehåll:** text + valfria bilder/video-länk. "Tack — vi passerade halva målet idag." "Leverantören är vald, beställning lagd." "På väg till hamnen nu."
- **Format:** samma som lång beskrivning — Markdown-light, bilder via media-strukturen med rollen `update` (M1 Block 1 Fält 5).
- **Antal:** obegränsat. Insamlaren styr takten.
- **När:** från `aktiv` fram till `avslutad_levererad`/`avslutad_utan_resultat`.
- **Obligatoriskt:** **nej.** Helt frivilligt. **Publikt:** ja.
- **Vem får posta:** insamlaren (och föreningskonto), på sin egen insamling (M6 behörighetsmatris).

## 2.2 Varför fria uppdateringar finns

- **De håller donatorn varm.** En donator som får se "beställning lagd" känner att gåvan lever. Det är vad som gör att hen ger igen (M15 notiser kan trigga på en ny uppdatering).
- **De bygger berättelsen mot resultatbeviset.** När resultatet kommer har donatorn redan följt resan — beviset landar i ett sammanhang.
- **De är frivilliga med flit.** Att tvinga uppdateringar vore polisbeteende. Men en insamlare som postar ofta *premieras* — frekvensen kan ge en badge (Block 3).

## 2.3 Kantfall

- **Insamlaren postar aldrig en enda fri uppdatering:** helt tillåtet. De tre obligatoriska bevisen räcker för full status och "Resultat levererat"-badge. Fria uppdateringar är grädde, inte krav.
- **Insamlaren postar något olämpligt i en uppdatering** (hat, sekteristiskt språk, vilseledande påståenden): fångas — uppdateringar är synliga och kan anmälas (M13 community-struktur); granskare/admin kan dölja en uppdatering och vid behov pausa insamlingen. Reglerna bor i M8.
- **Uppdatering efter att insamlingen är helt avslutad:** tillåten en rimlig tid efter `avslutad_levererad` (en tacknotis, ett efterläge) — men en stängd insamling återöppnas inte.

---

# BLOCK 3 — Badgesystemet

Badges är hur plattformen **belönar transparens utan att tvinga den**. De är loopens morot.

## 3.1 Principen bakom badges

> Badges bevisar **inte fromhet**. De bär det **mänskliga hjärtat som behöver återkoppling**.

Det här måste sägas tydligt, för det är lätt att missförstå. Sadaqah är komplett inför Allah i samma sekund pengarna lämnar handen (princip 8). En badge lägger ingenting till det andliga värdet.

Men människan i dunya — donatorn *och* insamlaren — behöver se att något *hände*. Badgen är inte ett andligt betyg. Den är en **ärlig kvittens till det tvivlande hjärtat**: "du gjorde det, och det syns."

Därför är badges:
- **Beskrivande, inte dömande.** De säger vad som *hände*, inte vem som är god.
- **Aldrig negativa.** Det finns ingen "misslyckades"-badge, ingen röd stämpel. Frånvaron av en badge är det enda "negativa" — och frånvaro är inte en anklagelse (princip 9).
- **Automatiskt tilldelade.** Ingen människa delar ut badges. Systemet gör det när villkoren uppfylls (95 %-självgående, princip 3).

## 3.2 Badgelistan (v1)

| Badge | Tilldelas när | Sitter på |
|---|---|---|
| **Resultat levererat** | Alla tre obligatoriska bevis (Block 1) är inne och godkända → insamlingen når `avslutad_levererad`. | Insamlingen + insamlarens profil |
| **Verifierad insamlare** | Insamlaren har klarat BankID + Stripe-KYC (M6 Block 3). | Insamlarens profil |
| **Öppen bok** | Insamlaren postade minst X fria uppdateringar (riktmärke 3) jämnt fördelade under insamlingen. | Insamlingen + profil |
| **Snabb återkoppling** | Resultatbevis postat *före eller på* genomförandedatum. | Insamlingen + profil |
| **Trogen givare** *(för donatorer)* | Donatorn har gett till X olika insamlingar (riktmärke 5). | Donatorns profil (M9) |
| **Stöttad av förening** | Insamlingen har en kopplad collab-organisation (M10). | Insamlingen |

Listan är en **utgångspunkt** — den finslipas före lansering. Färre badges som betyder mycket slår fler badges som betyder lite. **Vi inflaterar inte badges till värdelöshet.**

## 3.3 Hur badges fungerar

- **Tilldelning är automatisk och regelstyrd.** Systemet utvärderar villkoren vid relevanta händelser (resultatbevis godkänt, insamling avslutad osv.).
- **Badges på en *insamling*** beskriver den enskilda insamlingen.
- **Badges på en *profil*** (M9) är aggregat: "Resultat levererat ×7" betyder att personen sju gånger slöt loopen.
- **En badge tas aldrig tillbaka godtyckligt.** Om en insamling i efterhand visar sig vara fejk och blir `nedstängd` → de badges som hängde på den fejk-insamlingen dras in (annars vore badgen en lögn). Men en *ärligt* avslutad insamling behåller sina badges för alltid.
- **Profilen visar både badges och frånvaro ärligt** — se Block 5.

## 3.4 Vad badges medvetet INTE gör

- De **rankar inte** insamlare mot varandra. Ingen topplista, ingen "bäst i Sverige". Det skapar tävling där det ska finnas uppriktighet.
- De **låser inte upp privilegier** som spelar roll för pengar eller granskning. En insamlare med noll badges granskas exakt lika rättvist som en med många. Badges är social återkoppling — inte en valuta i systemet.
- De **mäter inte belopp.** En liten insamling som slöt loopen får "Resultat levererat" precis som en stor. Det är *att loopen slöts* som räknas, inte hur mycket pengar.

## 3.5 Kantfall

- **Insamlingen blev `avslutad_utan_resultat`:** ingen "Resultat levererat"-badge. Ingen negativ badge heller. Profilen visar det som det är (Block 5).
- **Insamlaren raderar sitt konto:** badges hör till insamlingshistoriken; om kontot anonymiseras (M6 Block 5) följer badges den anonymiserade historiken.
- **Risk att flagga:** badges kan göra en insamlare *fixerad* vid att samla badges i stället för att hjälpa. Motgift: håll listan kort, gör badges beskrivande inte tävlingsinriktade, ranka aldrig. Inbyggt i 3.3–3.4.

---

# BLOCK 4 — Bevistryck per kategori & per modell

"Bevistryck" = **hur skarpt kravet på resultatbevis är.** Det varierar — för att kravet ska vara *rättvist* måste det matcha vad som faktiskt är bevisbart.

## 4.1 Bevistryck per målbeloppsmodell

Direkt ärvt från M1 Block 2 Fält 1:

| Modell | Bevistryck | Vad resultatbeviset ska visa |
|---|---|---|
| **Fast** | **Skarpast.** | Exakt det utlovade. Sa "1000 mattor" → visa 1000 mattor. Konkret, räknebart. |
| **Intervall** | **Lägstanivån.** | Den lägsta lovade leveransen (vid 30k-exemplet: minst det 30k köper). Extra volym över lägstanivån dokumenteras separat och friare. |
| **Öppet** | **Fördelningslogiken.** | Inte en volym — utan *hur* det insamlade fördelades enligt den utlovade fördelningspolicyn. "Vi fick in X, så här delades det." |

**Princip:** bevistrycket matchar löftet. Den som lovade en exakt sak måste visa den exakta saken. Den som ärligt sa "så mycket vi kan" bevisar i stället sitt *omdöme* — att pengarna fördelades som lovat.

## 4.2 Bevistryck per kategori

Varje kategori (M1 Block 1 Fält 1) har olika *bevisbarhet*. Bevistrycket anpassas:

| Kategorigrupp | Bevistryck | Not |
|---|---|---|
| Fysiska, räknebara varor (bönematter, Quran, brunnar, mat) | **Hög** — bild på den faktiska varan/leveransen krävs. | Lätt att bevisa, alltså krävs det. |
| Byggnation (mosképrojekt, madrasa) | **Hög, fasvis** — före-bilder, under tiden, färdigt. Långa projekt → resultatbevis kan vara delvis/fasat. | Genomförandedatum kan vara långt fram (M1 Block 2). |
| Akut katastrofhjälp | **Medel** — kontext gör exakt bevis svårt; rimligt bevis på att hjälpen nådde fram. | Granskaren bedömer rimlighet, inte millimeterprecision. |
| Sjukvård utomlands, föräldralösa/utsatta barn | **Medel, integritetshänsyn** — bevis krävs men får anonymiseras (skydda utsatta individer). | Bevisbörda får aldrig kräva att man exponerar ett barn. |
| Begravning/Janazah | **Låg–medel** — värdighet går före dokumentation. En bekräftelse, inte ett bildreportage. | Mänsklig takt. Vi kräver inte gravbilder. |
| Övrig sadaqah jariyah | Bedöms i granskning från fall till fall. | Fångnätskategorin — bevistrycket sätts vid godkännande. |

**Princip:** vi kräver så mycket bevis som rimligen *går att ge* — aldrig mer. Bevistryck som tvingar fram exploaterande eller ovärdiga bilder är fel bevistryck.

## 4.3 Flera kategorier = bevis per kategori

Direkt ärvt från M1 Block 1 Fält 1 ("fler kategorier = fler bevis"):

- Taggar insamlingen tre kategorier → resultatbeviset måste täcka **alla tre**.
- Det är självreglerande: det avskräcker från att tagga brett "för synlighetens skull" och belönar fokus — utan att förbjuda bredd.

## 4.4 Vem sätter bevistrycket

- **Default-bevistrycket följer modell + kategori** enligt tabellerna ovan — automatiskt, ingen människa.
- **Granskaren (M3) kan justera** vid godkännande om projektet är ovanligt (t.ex. ett byggprojekt med svårdokumenterad fas). Justeringen loggas och syns i startbeviset så donatorn vet vad som utlovats.
- Bevistrycket **kommuniceras till insamlaren redan i wizarden (M2)** — ingen ska bli överraskad av vad som krävs i resultatfasen.

## 4.5 Kantfall

- **Fast modell men varan är osynlig** (t.ex. en tjänst): granskaren omklassar antingen modellen vid ansökan eller justerar bevistrycket — ovanligt, hanteras manuellt.
- **Katastrof där allt bevis är omöjligt** (aktiv konfliktzon): granskaren kan sätta lägsta bevistryck redan vid start och göra det tydligt för donatorn — ärlighet om begränsningen är bättre än ett krav som inte kan uppfyllas.

---

# BLOCK 5 — Hur historik visas

Loopen är bara värd något om den **syns**. Block 5 spikar var och hur. Den bärande principen: **plattformen anklagar aldrig — den visar bara historik.**

## 5.1 Tripadvisor-modellen

Vi visar historik så som Tripadvisor visar recensioner: **fakta, samlat, neutralt presenterat — och läsaren drar sin egen slutsats.**

- Plattformen säger aldrig "den här insamlaren är opålitlig".
- Plattformen visar: "tre insamlingar, två med Resultat levererat, en utan resultat."
- **Donatorn drar slutsatsen.** Marknaden dömer, inte plattformen.

Varför: det är princip 9 i ren form. Vi *kan* inte och *ska* inte agera domare. Men vi ska göra fakta lättillgängliga så att förtroende byggs på *historik*, inte på tomma ord.

## 5.2 Historik på insamlingen

På en enskild insamlings sida visas, i tidsordning, en **transparens-tidslinje**:

```
●  START — publicerad 12 mars. Mål: 35 000 kr, 1000 bönematter.
│
●  Uppdatering — 18 mars: "Halva målet passerat, tack."
│
●  Uppdatering — 2 april: "Leverantör vald, beställning lagd."
│
●  UTBETALNING — 15 april: 35 000 kr utbetalt till verifierad insamlare.
│
●  RESULTAT — 6 maj: 1000 bönematter levererade till 8 moskéer. [bilder]
│
✓  Badge: Resultat levererat
```

- De **tre obligatoriska bevisen** är visuellt framhävda (ankarpunkter).
- **Fria uppdateringar** ligger inflätade mellan dem.
- **Badges** visas vid sidan.
- **Redigeringshistoriken** (M1 Block 5 — publik ändringslogg) är åtkomlig härifrån, diskret men inte gömd.
- Är ett bevis **ännu inte inne** visas det som *väntande*, neutralt: "Resultat — väntar." Inte rött, inte anklagande. Bara ärligt.

## 5.3 Historik på profilen (M9)

På insamlarens publika profil (M9 äger profilsidan; M7 levererar transparens-datat) visas en **aggregerad historik**:

- Antal drivna insamlingar.
- Hur många som nått `avslutad_levererad` (Resultat levererat).
- Hur många i `väntar_på_resultat` eller `avslutad_utan_resultat`.
- Insamlarens badges.
- Länkar till varje enskild insamlings tidslinje.

**Presentationen är neutral.** En insamlare med ett oavslutat resultat ser ut så här: *"4 insamlingar · 3 med resultat levererat · 1 väntar på resultat."* Inget utropstecken. Ingen varningsskylt. Bara siffror — Tripadvisor-modellen.

**Detta är poängen med att transparens följer profilen:** en insamlare bär sin historik vidare till nästa insamling. Det skapar ett *naturligt* incitament att sluta loopen — inte för att plattformen straffar, utan för att nästa donator tittar. Marknaden, inte polisen.

## 5.4 Vad som medvetet INTE visas

- **Ingen "svartlista", ingen skamskylt.** `avslutad_utan_resultat` är ett neutralt faktum bland andra fakta — aldrig en stämpel.
- **Inga personuppgifter.** Personnummer och verifierad identitet (M6) syns aldrig i historiken — bara det publika visningsnamnet.
- **Ingen ranking av insamlare.** Profiler jämförs inte sida vid sida av plattformen. Den som vill jämföra får göra det själv.
- **Inga donatorbelopp per namn.** Vem som gav och hur mycket styrs av M4:s anonymitetsregler — M7 visar bevis och uppdateringar, inte givarlistan.

## 5.5 Kantfall

- **Nystartad insamlare utan historik:** profilen visar "Verifierad insamlare · första insamlingen". Tom historik presenteras neutralt — alla börjar någonstans. Donatorn ser att det är en *ny*, inte en *misslyckad*, insamlare.
- **Insamling blev `nedstängd` (fejk):** visas i historiken med en faktabanner (M1 Block 3) — här *är* plattformen tydlig, för bekräftad fejk är ett faktum, inte ett omdöme. Tillhörande badges dras in (Block 3).
- **Insamlaren vill dölja en gammal insamling utan resultat:** nej. Historik kan inte raderas selektivt — då vore transparensen meningslös. (Hela kontot kan raderas/anonymiseras enligt M6 Block 5 + M8, men inte enskilda obekväma poster.)
- **Insamlaren tycker historiken är orättvis** (mottagaren föll bort utanför hens kontroll): den fria uppdateringen (Block 2) och resultatbeviset ("så blev det i stället") *är* hens röst. Plattformen visar fakta; insamlaren får alltid berätta sin sida i samma tidslinje.

---

## 5. Designval & motivering (hela Modul 7)

| Beslut | Motivering |
|---|---|
| Tre obligatoriska bevis: start, utbetalning, resultat | Slår hålet i GoFundMe/LaunchGood — de granskar start men följer inte fund use. Tre punkter täcker hela resan: löfte → pengar lämnar → löftet infriat. |
| Startbeviset = insamlings-objektet vid godkännande | Resultatet måste mätas mot ett löfte. Granskningen (M3) är redan startbevisets kvalitetskontroll — inget extra moment behövs. |
| Utbetalningsbeviset är systemgenererat, kompletterande upload frivillig | Plattformen *vet* att pengar flyttades (Stripe, M5) — det behöver inte bevisas manuellt. Extra kvitto uppmuntras men tvingas inte. Verktyg, inte polis. |
| Resultatbevis krävs för full status men är inte framtvingbart | Princip 9: transparens är mål inte tvång. Uteblir det → frånvaro av badge, inte straff. Det är allt en plattform *kan* göra ärligt. |
| Fria uppdateringar är helt frivilliga | Att tvinga uppdateringar vore polisbeteende. Men frekvens belönas med badge — moroten, inte piskan. |
| Badges automatiska, beskrivande, aldrig negativa | Princip 3 (självgående) + princip 9. Badges säger vad som hände, inte vem som är god. Ingen "misslyckades"-stämpel. |
| Badges bevisar inte fromhet — de bär det tvivlande hjärtat | Princip 8. Sadaqah är komplett inför Allah utan badge. Badgen är kvittens till människan i dunya, inget andligt betyg. |
| Badges rankar inte, låser inte upp privilegier, mäter inte belopp | Tävling skapar fel incitament. Att loopen *sluts* räknas — inte storlek, inte placering. |
| Bevistryck varierar per modell och kategori | Kravet måste matcha vad som rimligen går att bevisa. Begravning kräver inte bildreportage; fast modell kräver exakt vara. Rättvist krav = bevisbart krav. |
| Flera kategorier = bevis per kategori | Ärvt från M1. Självreglerande mot att tagga brett för synlighets skull. |
| Tripadvisor-modellen: visa historik, anklaga aldrig | Princip 9. Plattformen är inte domare. Fakta görs lättillgängliga; marknaden (donatorn) drar slutsatsen. |
| Transparens-historik följer profilen (M9) | Skapar ett *naturligt* incitament att sluta loopen — nästa donator tittar. Marknaden, inte polisen. |
| Historik kan inte raderas selektivt | Selektiv radering gör transparensen meningslös. Hela kontot kan anonymiseras (M6/M8), men inte enskilda obekväma poster. |

---

## 6. Kopplingar

**Modul 7 tar in:**
- Insamlings-objektet och dess livscykeltillstånd från **M1** (start = objektet vid godkännande; tillstånden styr när bevis krävs).
- Godkännande och resultatbevis-granskning från **M3** (granskaren bedömer att bevis finns och är rimligt).
- Utbetalningsbekräftelsen från **M5** (utbetalningsbeviset är systemgenererat ur Stripe-händelsen).
- Identiteten på den som postar bevis/uppdateringar från **M6** (vem postade — verifierad insamlare).
- Bevistryck-grunden (modell, kategori) från **M1 Block 1 + 2**.
- Reglerna för olämpligt innehåll i uppdateringar från **M8**.

**Modul 7 lämnar ut:**
- Badges och transparens-historik till **M9** (profilen visar dem).
- Bevis-krav (vad insamlaren måste leverera, per modell/kategori) till **M2** (wizarden kommunicerar dem) och **M3** (granskaren verifierar dem).
- Tillståndssignaler till **M1** — "alla tre bevis inne" triggar `avslutad_levererad`; "inget resultatbevis" matar `väntar_på_resultat`.
- Triggers till **M15** (notiser) — ny uppdatering, resultatbevis efterlyses, badge tilldelad.
- Uppdateringsflödet som **M13** (community) hänger kommentarer/dua på.
- Transparens-data till **M16** (admin-dashboard — vilka insamlingar väntar på resultat).

**Hård beroende-flagga:** utbetalningsbeviset (Block 1, Bevis 2) kan inte byggas färdigt förrän M5 bekräftat exakt vilken utbetalnings-händelse Stripe ger oss att hänga beviset på.

---

## 7. Säkerhet & anti-kaos

- **Granska före publicering** — startbeviset är granskat per definition; inget ogranskat löfte når allmänheten (princip 7).
- **Resultatbevis äkthetskontrolleras** — granskaren stoppar uppenbara stockbilder och orelaterat innehåll (lättviktig kontroll, inte revision).
- **Badges dras in vid bekräftad fejk** — en badge får aldrig vara en lögn; `nedstängd` insamling tappar sina badges.
- **Publik, oföränderlig transparens-tidslinje** — manipulation av historiken är synlig; bevis kan inte tyst tas bort.
- **Olämpligt innehåll i uppdateringar fångas** — uppdateringar är synliga, anmälbara (M13) och kan döljas av granskare/admin (regler i M8).
- **Historik kan inte raderas selektivt** — ingen kan gömma en obekväm post och behålla bara de fina.
- **Ingen ranking, ingen skamskylt** — anti-kaos genom design: vi bygger inte mekanik som föder tävling eller uthängning.

**Verklig risk att säga rakt:** den största risken i M7 är inte teknisk — den är *kulturell*. Om badges blir det folk jagar i stället för att hjälpa, har loopen misslyckats med sitt syfte. Motgiften (kort lista, beskrivande badges, ingen ranking, ingen privilegie-upplåsning) är medvetet inbyggda — men det måste bevakas efter lansering. Andra risken: en insamlare som ärligt gjorde rätt men vars mottagare föll bort kan uppleva `avslutad_utan_resultat` som orättvist. Motgift: den fria uppdateringen ger alltid insamlaren en röst i samma tidslinje.

---

## 8. Automatisering

**Självgående (ingen människa):** startbevis skapas vid godkännande, utbetalningsbevisets systemdel skapas ur Stripe-händelsen, badge-tilldelning (alla badges), default-bevistryck ur modell + kategori, statusövergångar som loopen matar (`avslutad_levererad`, `väntar_på_resultat`), påminnelser om efterlyst resultatbevis (M15), badge-indragning vid `nedstängd`, hela transparens-tidslinjens rendering.

**Kräver människa:** lättviktig granskning av resultatbevis (M3 — finns det, är det rimligt), justering av bevistryck för ovanliga projekt (granskaren vid godkännande), beslut vid kantfall (mottagaren föll bort, misstänkt fejk-bevis — M3/M8).

Riktmärke: loopen rullar nästan helt själv. Det enda återkommande mänskliga är en snabb äkthetskoll av resultatbevis — minuter, inte timmar — och den hänger på M3:s granskarkapacitet.

---

## 9. Öppna frågor

1. **Exakt tidsgräns** från `väntar_på_resultat` till `avslutad_utan_resultat` (riktmärke 90 dagar, ärvt från M1 öppen fråga 5). Bekräftas här: **90 dagar** föreslås som default, justerbart per kategori av granskaren (byggprojekt behöver längre). Slutgiltigt fastställs vid finslipning av kategorilistan.
2. **Hur djup ska resultatbevis-granskningen vara?** Spikat som "lättviktig äkthetskoll" — men exakt checklista (vad gör granskaren konkret) hör hemma i M3.
3. **Exakta badge-trösklar** (antal uppdateringar för "Öppen bok", antal insamlingar för "Trogen givare"). Sätts vid finslipning före lansering — riktmärken finns i Block 3.
4. **Final badgelista.** Block 3:s lista är en utgångspunkt; den ska kortas/finslipas så att varje badge betyder mycket. Princip: färre och tyngre.
5. **Video som direktuppladdning** för resultatbevis — i v1 endast extern länk (samma skäl som M1). Direktuppladdning parkeras till framtidsspår.

---

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 7:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (tre obligatoriska bevis), Block 2 (fria uppdateringar), Block 3 (badgesystemet), Block 4 (bevistryck per modell & kategori), Block 5 (historikvisning, Tripadvisor-modellen) nyskrivna. |
