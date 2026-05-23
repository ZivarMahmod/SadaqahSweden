# Modul 16 — Admin & dashboard

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, samt M1 (livscykel), M3 (granskar-flödet), M5 (pengaflöde), M6 (roller & behörigheter), M8 (policies), M12 (karta)

---

## 1. Vad modulen är

Modul 16 är **maskinrummet**. Det är inte en sida för användare — det är verktygslådan och kontrollpanelen för de få människor som driver plattformen (Zivar + hans två bröder, samma personer som är granskare i M3).

Modulen gör två saker, och bara två:

1. **Visar plattformens hälsa** — så att en människa på 30 sekunder vet om allt rullar eller om något kärvar.
2. **Ger en människa kontroll** — knapparna för att pausa, stänga, refundera och hantera kantfall när automatiken inte räcker.

**Den löser:** plattformen ska sköta sig själv 95 % av tiden (princip 3). Men "självgående" betyder inte "utan tillsyn". Det betyder att de återstående 5 % är *synliga, samlade och snabba att åtgärda*. M16 är platsen där de 5 % bor — och, lika viktigt, platsen som bevisar att de andra 95 % verkligen rullar.

---

## 2. Varför den behövs

Utan M16 finns två misslyckanden inbyggda i plattformen:

- **Det tysta haveriet.** Något går sönder — Stripe-utbetalningar fastnar, granskningskön svämmar över, en fejk-insamling tar in pengar — och ingen ser det förrän en användare klagar. Då är skadan redan gjord.
- **Den utbrända grundaren.** Zivar har inte tid att granska heltid. Om varje litet beslut kräver att han loggar in, gräver i databasen och tolkar rådata, dör plattformen av sin egen administration — inte av brist på insamlingar.

M16 är svaret på båda. Den gör haveriet **synligt innan det blir dödligt** ("vårt fel men inte dödligt", princip 4), och den gör ingreppet **snabbt nog att en upptagen människa orkar göra det**.

Det finns också en tredje, ljusare anledning: **plattformen producerar data värd att visa upp.** Hur mycket har det muslimska samhället i Sverige samlat in? Vilka kommuner är mest aktiva? Den datan är inte bara drift — den är föreningens berättelse utåt, bränsle för att uppmuntra fler. M16 är dit den datan samlas.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Driftövervakning — plattformens puls, en lugn översikt | ✅ Spikad |
| 2 | Statistik & insiktsdashboard — datan föreningen visar utåt | ✅ Spikad |
| 3 | Larm & när en människa behövs — vad som väcker admin | ✅ Spikad |
| 4 | Manuella ingrepp — knapparna: pausa, stäng, refundera, kantfall | ✅ Spikad |
| 5 | Självgående-kontroller — hur 95 %-principen verkställs i praktiken | ✅ Spikad |

Block 1 är vad du *ser*. Block 3 är vad som *väcker* dig. Block 4 är vad du *gör*. Block 5 är allt du *slipper göra*. Block 2 står lite vid sidan — det är inte drift, det är berättelse.

---

# BLOCK 1 — Driftövervakning

**Vad blocket är:** den enda sidan en admin ska behöva titta på dagligen. Plattformens puls på en skärm. Designprincipen här är **lugn, inte brus** — om dashboarden skriker konstant slutar människan lyssna, och då är den värdelös.

## 1.1 Designregel — grön tills något inte är det

Driftöversikten har **ett enda jobb**: svara på frågan *"behöver jag göra något just nu?"*. Den ska kunna besvaras på 5 sekunder.

- **Default-tillstånd är tomt och grönt.** När allt rullar visar sidan en lugn statusrad: *"Allt fungerar. 14 aktiva insamlingar, 2 i granskningskö, inga larm."* Inga grafer som rör sig, inga räknare som tickar i ansiktet.
- **Avvikelser drar blicken.** Bara det som behöver uppmärksamhet får färg och rörelse. En sak fel → den saken lyser, resten är grått.
- **Ingen siffra utan handling.** Varje tal på driftsidan ska antingen vara "bra att veta i en blink" eller leda till en knapp. Siffror man inte kan agera på hör hemma i Block 2 (statistik), inte här.

> **Varför så strikt:** en dashboard full av siffror känns "proffsig" men är en fälla. Zivars uppmärksamhet är plattformens knappaste resurs. En lugn yta som bara talar när det är viktigt respekterar det. Brus tränar bort uppmärksamhet — princip 6, premium genom omsorg.

## 1.2 De fyra panelerna

Driftsidan har fyra paneler, alltid samma ordning. Var och en kollapsad till en enda rad när läget är normalt.

### Panel A — Insamlingar (livscykelhälsa)

Speglar tillståndsmaskinen i **M1 Block 3**. Visar antal insamlingar per tillstånd, men grupperat så det blir läsbart:

- **Aktiva** — antal `aktiv`. (Bara en siffra — det är plattformen som mår bra.)
- **Väntar på granskning** — antal `inskickad` + `under_granskning` + `ändring_begärd`. Klick → M3:s granskningskö.
- **Väntar på resultat** — antal `väntar_på_resultat`. Klick → lista. Detta är inte ett larm men värt ögat.
- **Stoppade** — antal `pausad` + `nedstängd`. Om > 0: lyser, för det är alltid en pågående situation.

### Panel B — Granskningskö

Den enskilt viktigaste driftsiffran, för granskningskön är där plattformen kan kvävas.

- **Antal i kö** + **äldsta ärendets ålder**.
- **SLA-status:** grön om allt under 72 h (M3:s riktmärke), gul vid 48–72 h, röd vid > 72 h.
- **Eskaleringsärenden** (stora belopp, M3) markeras separat — de kräver två granskare.

### Panel C — Pengaflöde

Den tekniska sanningen från **M5**, sammanfattad utan att admin behöver öppna Stripe-dashboarden.

- **Insamlat senaste 30 dagar** (rullande summa).
- **Pengar hos Stripe just nu** — totala medel som väntar på utbetalning (insamlingar i `aktiv`/`stängd`).
- **Utbetalningar:** senaste utförda + nästa schemalagda. Misslyckad utbetalning → lyser rött, blir ett larm (Block 3).
- **Refunder pågående** — antal + summa. Bara synligt om > 0.

### Panel D — Fel & system

Plattformens tekniska livstecken.

- **Senaste lyckade Stripe-webhook** (tidsstämpel) — om den är gammal har integrationen tappat kontakt.
- **Senaste lyckade notisutskick** (M15) — samma logik.
- **Bakgrundsjobb:** kör schemaläggaren? (deadline-passeringar, arkivering, badge-tilldelning — Block 5).
- **Felräknare senaste 24 h** — applikationsfel. 0 = grått. > 0 = en länk till felloggen.

## 1.3 Vem ser driftsidan

| Roll | Åtkomst | Not |
|---|---|---|
| Admin | Full driftsida | Zivar + den/de bröder som är admin |
| Granskare | Panel A + B (insamlingar, granskningskö) | Behöver inte se pengaflöde |
| Förening | Nej | Föreningar har egen, mycket enklare vy (M10) |
| Donator / besökare | Nej | — |

Behörighet styrs av rollmatrisen i **M6** — M16 definierar inte roller, den *lyder* dem.

## 1.4 Kantfall

- **Dashboarden själv är nere.** Den får inte vara den enda kanalen. Kritiska larm (Block 3) går *också* via e-post/push (M15), så att ett trasigt admin-UI inte döljer ett trasigt pengaflöde.
- **Många avvikelser samtidigt.** Panelerna sorteras efter allvar (Block 3:s prioritetsskala), värst överst. Aldrig en oordnad röd vägg.
- **Helt ny plattform, nästan ingen data.** Tomt tillstånd skrivs uppmuntrande, inte trasigt: *"Inga insamlingar ännu — här dyker de upp."*

---

# BLOCK 2 — Statistik & insiktsdashboard

**Vad blocket är:** plattformens berättelse i siffror. Detta är inte drift — det är **datan föreningen älskar att visa och uppmuntra med**. Skild från Block 1 av en anledning: drift svarar *"måste jag agera?"*, statistik svarar *"hur går det, och vad kan vi berätta?"*. Att blanda dem gör båda sämre.

## 2.1 Två publik, två lägen

Statistiken har två konsumenter, och blocket betjänar båda:

- **Internt (admin/styrelse):** hela bilden, inklusive det som inte är vackert — avhopp, undermål, avvisade insamlingar.
- **Publikt (utåt):** en kurerad delmängd som föreningen kan pusha — i sociala medier, i årsredovisningen, på startsidan. **Bara aggregerad, aldrig på individnivå.**

Samma datakälla, två vyer. Den publika vyn är en delmängd av den interna — aldrig en separat sanning.

## 2.2 Vad dashboarden visar

### Nyckeltal (de stora talen, överst)

- **Totalt insamlat** — sedan start. Det stolta talet.
- **Aktiva insamlingar just nu.**
- **Antal slutförda projekt** — insamlingar i `avslutad_levererad`. Detta är trovärdighetstalet: inte bara pengar in, utan *bevisad* leverans.
- **Antal donationer totalt** + **antal unika donatorer**.
- **Antal medverkande föreningar** (från M10).

### Geografi (kopplar M12 — kartan)

Detta är den datan som gör plattformen unik: en bild av det muslimska samhällets givande i Sverige.

- **Aktivitet per kommun/region** — antal insamlingar och insamlat belopp, baserat på **insamlar-plats** (M1 Block 1, Fält 6B).
- **Var hjälpen landar** — fördelning på hjälp-plats (länder, regioner).
- Visas som **samma karta som M12** matar publikt — M16 äger inte kartritandet, den läser M12:s aggregat och presenterar det som statistik.

### Trender över tid

- Insamlat belopp per månad — en kurva, inte en tabell.
- Nya insamlingar per månad.
- Nya donatorer per månad.
- **Ramadan-markering:** kurvan markerar Ramadan-perioder, eftersom givandet med stor sannolikhet toppar då (research: LaunchGoods Ramadan-cykler). Det hjälper föreningen planera kampanjer.

### Kategori-fördelning

- Insamlat belopp och antal insamlingar **per kategori** (M1 Block 1, Fält 1).
- Visar vad samhället prioriterar — mosképrojekt vs vatten vs föräldralösa.
- Internt också: **vilka kategorier som oftast undermålar** — en signal om var efterfrågan är svag.

### Hälsotal (endast internt)

Det som inte pushas utåt men styrelsen måste se:

- **Granskningsutfall:** andel godkända / avvisade / ändring begärd.
- **Andel insamlingar som når sitt mål.**
- **Andel insamlingar som når `avslutad_levererad`** vs `avslutad_utan_resultat` — det viktigaste interna kvalitetsmåttet.
- **Wizard-avhopp** (data från M2): hur många börjar en insamling men skickar aldrig in.

## 2.3 Hur datan kommer ut

- **Publik statistiksida** — en kurerad, vacker sida (egen URL) som vem som helst kan se. Föreningen länkar till den.
- **Export** — admin kan exportera aggregerad data som CSV/PDF för årsredovisning och bidragsansökningar. Detta är konkret nytta för föreningens juridiska kropp.
- **Inbäddningsbara siffror** — nyckeltalen ("Totalt insamlat: X kr") kan visas på plattformens egen startsida (M11) som ett levande förtroendetecken.

## 2.4 Integritetsgräns — hård

- **Publik statistik är alltid aggregerad.** Aldrig "donator X gav Y kr". Aldrig enskild insamlares identitet i ett statistiksammanhang utan att den redan är publik via insamlingen själv.
- **Kommun-data har ett golv.** En kommun med bara 1–2 insamlingar visas inte som egen punkt — den slås ihop till regionnivå. Annars blir "insamlingar i Kiruna" i praktiken en utpekning av enskilda personer. Detta är **k-anonymitet** och det är inte valfritt (kopplar M8, integritetspolicy).
- **Insamlar-plats är redan integritetsskyddad i M1** — statistiken får aldrig läcka mer än vad insamlaren själv valt att visa.

## 2.5 Kantfall

- **För lite data för en trovärdig siffra.** Tidig fas: hellre tomt eller "kommer snart" än en pinsamt liten siffra som underminerar förtroendet.
- **En enda jätteinsamling snedvrider allt.** Trendkurvor visar **median vid sidan av summa** så att en miljonkampanj inte får det att se ut som att varje månad är rekordmånad.
- **Negativ trend.** Internt visas den rakt — fallande månader göms inte. Publikt visar man **totaler och kumulativa tal** (som alltid växer), inte en månadskurva som kan se nedslående ut. Inte oärligt, bara vänligt urval.

---

# BLOCK 3 — Larm & när en människa behövs

**Vad blocket är:** definitionen av exakt vad som ska **avbryta en människas dag** — och, lika viktigt, vad som *inte* ska göra det. Detta block är hjärtat i 95 %-principen: om larmen är fel kalibrerade blir plattformen antingen farlig (missar det viktiga) eller outhärdlig (larmar om allt).

## 3.1 Två nivåer — och bara två

Varje sak som plattformen kan upptäcka hamnar i exakt en av två lådor:

| Nivå | Betyder | Kanal | Förväntad responstid |
|---|---|---|---|
| 🔴 **Måste agera nu** | Pengar eller förtroende är i fara just nu | Push + e-post + dashboard-topp | Samma dag |
| 🟡 **Bra att veta** | Behöver ögon snart, men inget brinner | Samlas i dashboard + daglig sammanfattning | Inom några dagar |

Ingen tredje nivå. Ingen "kanske-viktigt". Tvånget att välja **en av två** är vad som håller systemet ärligt — om allt får vara "viktigt" är ingenting det.

## 3.2 🔴 Måste agera nu — den korta listan

Listan är medvetet **kort**. Bara saker där väntan kostar pengar eller trovärdighet.

| Trigger | Varför akut | Var det leder |
|---|---|---|
| **Anmäld insamling** (M13/M8) — en användare har flaggat en aktiv insamling | Kan vara en fejk som tar in pengar *nu* | Block 4: pausa-knapp |
| **Misslyckad Stripe-utbetalning** (M5) | Insamlarens pengar fastnar — direkt skada | Block 4 / M5-felhantering |
| **Stripe-webhook tyst > 6 h** | Pengaflödet kan vara blint utan att vi vet det | Teknisk felsökning |
| **Ovanligt pengaflöde** — se 3.4 | Möjligt bedrägeri eller tekniskt fel | Block 4: utred, ev. pausa |
| **Granskningsärende långt över SLA** (> 96 h, M3) | En insamlare väntar orimligt länge — förtroendeskada | M3: ta ärendet |
| **Bekräftad fejk under utredning eskalerar** | Behöver beslut om nedstängning + refund | Block 4 |

**Princip:** ett rött larm betyder *"om du inte tittar idag kan något verkligen gå fel"*. Om det inte är sant är det inte rött.

## 3.3 🟡 Bra att veta — samlas, stör inte

Allt annat. Levereras som **en daglig sammanfattning** (ett mejl, en gång, valfri tid) — aldrig som enskilda avbrott.

- Granskningskö passerade 72 h SLA (gul, inte röd — kön är full, men ingen är *kraftigt* försenad ännu).
- Ny insamling inskickad (om kön annars är tom — annars syns det bara i Panel B).
- Insamling gick till `väntar_på_resultat`.
- Insamling gick till `avslutad_utan_resultat`.
- Förening har självregistrerat sig och väntar på katalog-granskning (M10).
- Insamlare begärde målhöjning eller lång förlängning (M1 Block 2).
- Enstaka applikationsfel (icke-kritiska).
- Veckans/månadens statistik-höjdpunkter (det roliga — kopplar Block 2).

> **Designval:** den dagliga sammanfattningen är ett *medvetet* verktyg. Den samlar ihop bruset så att Zivar kan möta hela "bra att veta"-högen i ett enda lugnt svep, när det passar honom — i stället för att bli avbruten 11 gånger om dagen. Detta är 95 %-principen som upplevelse: plattformen respekterar din tid.

## 3.4 Vad är "ovanligt pengaflöde"

Detta behöver en konkret definition, annars blir det antingen aldrig-larm eller alltid-larm. Riktmärken (justeras med driftserfarenhet):

- **En enskild donation över en tröskel** (riktmärke 25 000 kr) → 🟡 bra att veta. Stora gåvor är ofta äkta och underbara — men värda ett öga.
- **Många donationer från samma kort/källa på kort tid** → 🔴. Klassiskt mönster för testning av stulna kort.
- **En insamling går från 0 till stort belopp orimligt snabbt** (riktmärke: > 50 000 kr inom 1 h på en ny insamling) → 🔴. Ofta tekniskt fel eller manipulation.
- **Refund-frekvens spikar** på en insamling → 🟡. Kan betyda att något är fel med projektet.

Mycket av detta kan Stripes egna verktyg (Radar) fånga — M16 ska **inte bygga om bedrägeridetektering från grunden** (princip 13, samordna befintlig godhet). M16:s jobb är att *ta emot* Stripes signal och översätta den till ett larm i admins värld.

## 3.5 Kantfall

- **Larm-storm** (många röda samtidigt, t.ex. Stripe nere). Plattformen **grupperar** — "12 misslyckade utbetalningar" är ett larm, inte tolv. Annars dränks det verkliga budskapet.
- **Falsklarm.** En anmälan visar sig grundlös → admin avfärdar den med ett klick, insamlingen återgår tyst till `aktiv`. Inget straff för anmälaren — anmälan är ett verktyg (princip 5), och de flesta görs i god tro.
- **Larm mitt i natten.** Röda larm skickas dygnet runt (pengar väntar inte), men plattformen pausar ALDRIG sig själv automatiskt på enbart misstanke utöver de hårda auto-pausreglerna i Block 5. En människa avgör. "Vårt fel men inte dödligt" — hellre vänta till morgonen än felaktigt frysa en äkta insamling.
- **Ingen reagerar på ett rött larm.** Ett rött larm som varit obesvarat > 24 h **eskalerar** — skickas om, till alla admins. Det är skyddsnätet mot en bortrest grundare.

---

# BLOCK 4 — Manuella ingrepp

**Vad blocket är:** knapparna. När automatiken inte räcker — och för vissa saker ska den aldrig räcka — behöver en människa kunna gripa in. Block 4 spikar **exakt vilka verktyg som finns, vad de gör, och vem som får trycka**.

Filosofin är **verktyg, inte polis** (princip 5): admin styr inte plattformen genom att mikromanagera. Verktygen är få, vassa, och används sällan. Men när de behövs ska de finnas och vara begripliga.

## 4.1 Verktygslådan

| Verktyg | Vad det gör | Kopplar |
|---|---|---|
| **Pausa insamling** | `aktiv` → `pausad`. Stoppar nya donationer, fryser befintliga medel hos Stripe. Publik banner. | M1 Block 3, M5 |
| **Återställa insamling** | `pausad` → `aktiv`. Utredning visade inget — allt rullar igen. | M1 Block 3 |
| **Stänga ner insamling** | → `nedstängd`. Permanent. För bekräftad fejk eller allvarligt brott. Startar refund-process. | M1 Block 3, M8 |
| **Initiera refund** | Återbetala en eller alla donationer på en insamling via Stripe. | M5 |
| **Redigera/överrida fält** | Ändra ett fält på en insamling utöver vad insamlaren själv får (M1 Block 5). Alltid loggat. | M1 Block 5 |
| **Hantera kantfall** | Den manuella verktygslådan för 5.2-situationerna i M1: mottagare faller bort, insamlaren avlider, omdirigering. | M1 Block 5, M8 |
| **Avfärda larm / anmälan** | Stänga ett larm utan åtgärd. | Block 3 |
| **Förlängning utöver regel** | Godkänna en tredje förlängning eller annat undantag (M1 Block 2). | M1 Block 2 |
| **Hantera användare** | Stänga av ett konto vid grovt missbruk. Sällsynt. | M6 |

## 4.2 Vem får göra vad — behörighet

M16 **definierar inte** roller — den lyder behörighetsmatrisen i **M6**. Här är hur M16:s verktyg mappas mot M6:s roller:

| Verktyg | Granskare | Admin | Not |
|---|---|---|---|
| Pausa insamling | ✅ | ✅ | Granskaren ska kunna agera snabbt på misstanke |
| Återställa insamling | ✅ | ✅ | — |
| **Stänga ner permanent** | ❌ | ✅ **endast** | Permanent + refund + ev. polisanmälan — admin-tungt beslut |
| Initiera refund | ❌ | ✅ | Rör pengar direkt — admin |
| Redigera/överrida fält | ✅ (begränsat) | ✅ | Granskaren får rätta sak inom granskning; admin får mer |
| Hantera kantfall (5.2) | ⚠️ föreslår | ✅ beslutar | Granskare flaggar, admin verkställer |
| Avfärda larm / anmälan | ✅ | ✅ | — |
| Förlängning utöver regel | ✅ | ✅ | — |
| Hantera användare (avstängning) | ❌ | ✅ | — |

**Regeln bakom tabellen:** *snabba, reversibla* åtgärder (pausa, avfärda larm) får granskaren göra ensam — väntan kostar mer än ett felgrepp som går att ångra. *Permanenta eller pengarörliga* åtgärder (nedstängning, refund) kräver admin. Detta speglar M1:s tillståndsmaskin, där `nedstängd` redan är reserverat för admin.

## 4.3 Två säkerhetsregler för alla ingrepp

1. **Allt loggas — vem, vad, när, varför.** Varje manuellt ingrepp kräver en kort motiveringstext och skrivs till en **oföränderlig admin-logg**. Detta är inte byråkrati — det är skyddet både för plattformen ("vi kan visa varför vi gjorde det") och för insamlaren ("ingen kan tyst manipulera min insamling"). Konsekvent med M1:s publika ändringslogg, fast denna logg är intern.

2. **Bekräftelse på det oåterkalleliga.** Pausa = ett klick (lätt att ångra). Stänga ner permanent eller refundera alla = ett **bekräftelsesteg** som visar konsekvensen i klartext: *"Detta refunderar 47 donationer för totalt 31 200 kr. Det går inte att ångra. Stripe-avgiften per donation återbetalas inte."* Inga ödesdigra åtgärder ska gå att göra av misstag.

## 4.4 Kantfall

- **Två granskare gör motstridiga ingrepp** (en pausar, en återställer, nästan samtidigt). Tillståndsmaskinen i M1 tar emot ändringar sekventiellt; den sista vinner och bägge loggas med tidsstämpel. I praktiken: tre personer i ett litet team pratar med varandra. Vi bygger inte ett låssystem för ett trepersonersteam — "vårt fel men inte dödligt".
- **Admin behöver göra något verktyget inte täcker** (en sällsynt juridisk situation). Då är direkt databasåtkomst sista utvägen — men det ska vara *sällsynt och obekvämt*, inte en genväg. Om samma manuella sak görs tre gånger → det är en signal att Block 5 eller verktygslådan ska byggas ut.
- **Insamlaren protesterar mot ett ingrepp.** Den interna loggens motivering blir grunden för svaret. Beslutsregler och eskaleringsväg för tvister hör hemma i M8.
- **Refund misslyckas tekniskt** (kortet utgånget). Hanteras i M5:s refund-flöde; M16 visar det bara som ett kvarstående ärende tills det är löst.

---

# BLOCK 5 — Självgående-kontroller

**Vad blocket är:** den konkreta mekaniken bakom princip 3 — **95 % självgående**. Block 1–4 handlar om människan. Block 5 handlar om allt människan *slipper*. Det här blocket är det enskilt viktigaste i hela M16, för det är skillnaden mellan en plattform Zivar kan driva vid sidan av ett liv och en plattform som äter honom.

## 5.1 Principen, exakt formulerad

> För varje sak plattformen gör: **standardläget är att maskinen gör det.** En människa kopplas in bara när (a) ett genuint omdöme krävs, eller (b) en hård säkerhetströskel passerats. Allt annat rullar.

"95 %" är inte en mätbar garanti — det är en **designhållning**. Varje gång en ny funktion planeras ställs frågan: *kan detta rulla utan Zivar?* Om svaret är nej måste det motiveras.

## 5.2 Vad rullar helt automatiskt

Sammanställt från alla moduler — detta är vad maskinen sköter utan en enda mänsklig handling:

| Automatik | Källmodul | Trigger |
|---|---|---|
| Deadline-passering: `aktiv` → `stängd` | M1 Block 3 | Tid |
| Statusbyten efter utbetalning | M1 Block 3 | Stripe-händelse |
| `utbetald` → `väntar_på_resultat` | M1 Block 3 | Genomförandedatum passerat |
| `väntar_på_resultat` → `avslutad_utan_resultat` | M1 Block 3 | 90-dagarsgräns passerad |
| Badge-tilldelning | M1 / M7 | Alla tre bevis godkända |
| Kort förlängning (≤14 dagar) auto-godkänns | M1 Block 2 | Insamlarens begäran |
| Övermåls-auto-stäng (när plan saknas) | M1 Block 2 | Målet nått |
| Slug-generering, bildkomprimering | M1 Block 1 | Vid skapande/uppladdning |
| Arkivering av döda utkast (60 d) och obesvarade ändringsärenden (30 d) | M1 Block 3 | Tid |
| Påminnelser till insamlare (resultat förfaller, utkast vilar) | M15 | Tid |
| Notiser till donatorer (förlängning, ny cykel) | M15 | Händelse |
| Refund vid undermål till donatorer som valt det | M1 Block 2 / M5 | Deadline + undermål |
| Kvitton till donatorer | M4 | Vid donation |
| Statistik-aggregering, kart-data | M12 / Block 2 | Schemalagt |
| Bedrägerimönster-scanning | Stripe Radar | Löpande |

**Allt detta är schemalagda bakgrundsjobb eller händelsedrivna triggers.** Driftpanel D (Block 1) bevakar att de faktiskt kör — för det enda som är värre än att glömma en uppgift är att *tro* att maskinen gör den när den i tysthet har slutat.

## 5.3 Trösklar — var maskinen släpper ifrån sig kontrollen

Automatiken har gränser. Vid dessa trösklar kopplas en människa in — medvetet, av designskäl:

| Tröskel | Vad som händer | Varför inte automatiskt |
|---|---|---|
| **All publicering** | Granskning krävs (M3) | Princip 7 — inget når allmänheten ogranskat. Detta är icke-förhandlingsbart. |
| **Målbelopp > 500 000 kr** (riktmärke) | Utökad granskning, ev. två granskare (M3) | Stora belopp = stor skada om fel |
| **Enskild donation > 25 000 kr** | 🟡 larm, ingen blockering | Äkta gåvor stoppas aldrig — men noteras |
| **Tredje förlängningen** | Admin-beslut (M1 Block 2) | Kan vara legitimt vid katastrof — kräver omdöme |
| **Målhöjning** | Granskar-godkännande (M1 Block 2) | Ändrar löftet till donatorn |
| **Anmälan av aktiv insamling** | 🔴 larm → människa tittar | Förtroende i fara |
| **Kantfall i M1 5.2** | Människa beslutar | Verkligheten har gått sönder — ingen regel täcker den |

## 5.4 Auto-paus — den enda automatiska "ingripande"-åtgärden

Plattformen frihetsberövar i regel inte en insamling automatiskt — en människa beslutar (Block 3.5). Men det finns **två snäva undantag** där väntan är farligare än ett möjligt felgrepp:

1. **Stripe Radar flaggar en donation som högrisk-bedrägeri** → den enskilda donationen hålls/blockeras av Stripe automatiskt. Insamlingen i sig pausas inte — bara den misstänkta transaktionen. Admin får ett 🟡 larm.
2. **En insamling träffar `ovanligt pengaflöde`-mönstret i 3.4 på den allvarligaste nivån** (0 → > 50 000 kr på under en timme) → insamlingen **auto-pausas** och ett 🔴 larm går ut. Här är risken för pågående kortbedrägeri så konkret att de minuter en människa skulle ta att reagera är för dyra.

Bortsett från dessa två: misstanke → larm → människa → ingrepp. Aldrig maskinen ensam som domare. "Vårt fel men inte dödligt" skär åt båda håll — en felaktigt fryst äkta insamling skadar också förtroendet.

## 5.5 Hur plattformen undviker att kräva en människa i onödan

Konkreta designval, utöver automatiken ovan, som finns *just för* att skona admins tid:

- **Smart UX framför granskning.** Maxlängder, formatregler, "inga emoji i titel" (M1 Block 1) hindras i formuläret (M2) — så att granskaren slipper bedöma sånt en maskin kan avvisa. Människan granskar *innehåll och avsikt*, inte teckenantal.
- **Wizardens strukturerande frågor** (M2) gör inskickade insamlingar mer enhetliga → snabbare granskning → kortare kö → färre SLA-larm.
- **Daglig sammanfattning** (Block 3.3) buntar allt icke-akut → en kontaktpunkt om dagen i stället för konstanta avbrott.
- **Den gröna default-dashboarden** (Block 1) → admin kan *bekräfta att inget behövs* på 5 sekunder och stänga fliken.
- **Self-service för föreningar** (M10:s självregistrering) → admin underhåller ingen föreningsdatabas manuellt.
- **Transparens-loopen är social, inte administrativ** (M7) → plattformen jagar inte resultatbevis genom admin; den gör det socialt belönande och låter `avslutad_utan_resultat` tala för sig själv.

> **Ärlig flagga:** den enda delen av plattformen som *inte* kan göras 95 % självgående är **granskningen själv (M3)**. Den kräver mänskligt omdöme per definition — det är hela poängen med princip 7. Det betyder att granskningsbördan skalar linjärt med antalet insamlingar. M16 kan inte lösa det, bara *bevaka* det (Panel B). När granskningskön blir den verkliga flaskhalsen är svaret fler granskare — inte mer automatik. Det är värt att veta nu, innan volymen kommer.

## 5.6 Kantfall

- **Ett bakgrundsjobb kraschar tyst.** Panel D:s "senaste lyckade körning"-stämplar är skyddet — gammal stämpel = 🔴 larm. Maskinen som ska upptäcka problem måste själv övervakas.
- **Tröskeln är fel kalibrerad** (för många/för få larm). Trösklarna i 5.3 är **riktmärken, inte lag** — de justeras med driftserfarenhet. De första månaderna är en inlärningsperiod.
- **Plattformen växer förbi trepersonsteamet.** Då skalar M3 (fler granskare) och M6 (rollmatrisen) — M16:s dashboard och larmlogik håller, för de skalar i läsare, inte i arbete.

---

## 5. Designval & motivering (hela Modul 16)

| Beslut | Motivering |
|---|---|
| Drift (Block 1) och statistik (Block 2) är skilda block | De svarar på olika frågor — "måste jag agera?" vs "hur går det?". Blandade blir båda sämre. |
| Driftsidan är grön och tom som default | Admins uppmärksamhet är plattformens knappaste resurs. Brus tränar bort uppmärksamhet. Princip 6. |
| Exakt två larmnivåer — inget mer | Tvånget att välja röd eller gul håller systemet ärligt. En "kanske"-nivå gör allt till brus. |
| Daglig sammanfattning för allt icke-akut | Buntar bruset → en lugn kontaktpunkt om dagen i stället för konstanta avbrott. 95 %-principen som upplevelse. |
| Plattformen auto-pausar nästan aldrig | En felaktigt fryst äkta insamling skadar förtroendet. Misstanke → larm → människa. Två snäva undantag där bedrägeririsken är akut. |
| Snabba reversibla ingrepp = granskare; permanenta/pengarörliga = admin | Väntan kostar mer än ett ångerbart felgrepp; men permanent skada och pengar kräver den högre rollen. Speglar M1:s tillståndsmaskin. |
| Allt manuellt ingrepp loggas med motivering | Skyddar både plattformen ("vi kan visa varför") och insamlaren ("ingen manipulerar tyst"). |
| Bekräftelsesteg i klartext på det oåterkalleliga | Inga ödesdigra åtgärder ska gå att göra av misstag. |
| Bedrägeridetektering byggs inte om — Stripe Radar används | Princip 13, samordna befintlig godhet. M16 översätter Stripes signal till ett larm, bygger inte om den. |
| Publik statistik är alltid aggregerad, med k-anonymitetsgolv per kommun | Annars blir "insamlingar i Kiruna" en utpekning av enskilda personer. Princip 2, integritet. |
| M16 definierar inte roller — lyder M6 | Behörighet bor i M6. M16 mappar bara verktyg mot befintliga roller. |
| Granskningen erkänns som det som INTE kan göras 95 % självgående | Ärlighet före önsketänkande. Volym → fler granskare, inte mer automatik. Värt att veta innan tillväxten kommer. |

---

## 6. Kopplingar

**Modul 16 tar in:**
- Tillstånd och livscykel-händelser från **M1** (allt Panel A och statusstatistiken bygger på).
- Granskningskö, SLA-status och eskaleringsärenden från **M3**.
- Pengaflöde, utbetalningsstatus, refund-status, Stripe Radar-signaler från **M5**.
- Rollmatrisen från **M6** — vem som får se och göra vad.
- Beslutsregler för kantfall, anmälningar och nedstängning från **M8**.
- Föreningsregistreringar och föreningsantal från **M10**.
- Geografiska aggregat från **M12** (kartan).
- Anmälningar från community-ytan i **M13**.
- Notisstatus (lyckade/misslyckade utskick) från **M15**.
- Wizard-avhoppsdata från **M2**.

**Modul 16 lämnar ut:**
- Manuella tillståndsändringar tillbaka till **M1** (pausa, stäng, återställ).
- Refund-order till **M5**.
- Larm som notiser via **M15** (push, e-post, daglig sammanfattning).
- Publik aggregerad statistik till **M11** (startsida) och en egen publik statistiksida.
- Exporterad data (CSV/PDF) till föreningens juridiska processer.

**Tvärgående natur:** M16 är, liksom M15, en modul som *läser från nästan allt*. Den äger ingen kärndata — den observerar, sammanfattar och ger en människa kontrollratten. Den är plattformens spegel, inte dess hjärta.

---

## 7. Säkerhet & anti-kaos

- **Kritiska larm har dubbel kanal.** Röda larm går via dashboard *och* via M15 (e-post/push). Ett trasigt admin-UI får inte dölja ett trasigt pengaflöde.
- **Obesvarade röda larm eskalerar.** > 24 h utan respons → skickas om till alla admins. Skyddsnät mot en bortrest grundare.
- **Oföränderlig admin-logg.** Varje manuellt ingrepp är spårbart — vem, vad, när, varför. Skyddar mot både extern anklagelse och internt missbruk.
- **Bekräftelse på det oåterkalleliga.** Permanent nedstängning och massrefund kräver ett klartext-bekräftelsesteg.
- **Behörighet ärvs från M6.** M16 uppfinner inga rättigheter — permanenta åtgärder är reserverade för admin.
- **Maskinen som vaktar övervakas själv.** Panel D bevakar att bakgrundsjobben kör; ett tyst kraschat schemajobb blir ett rött larm.
- **Statistikens integritetsgolv.** K-anonymitet per kommun hindrar att aggregerad data avslöjar enskilda personer.
- **Auto-paus är snäv och motiverad.** Bara två definierade undantag — i övrigt beslutar en människa. Skyddar äkta insamlingar mot felaktig frysning.

**Verklig risk att flagga:** den största risken i hela M16 är **larm-trötthet**. Om larmen kalibreras för känsligt slutar Zivar läsa dem, och då är plattformen i praktiken oövervakad trots en fin dashboard. Tvånivåsystemet och den dagliga sammanfattningen finns just för att motverka det — men trösklarna i Block 3 och 5 *måste* justeras aktivt de första driftmånaderna. En dashboard som ingen orkar titta på är farligare än ingen dashboard, för den ger falsk trygghet.

**Andra flaggan:** granskningen (M3) skalar linjärt med volym och kan inte automatiseras bort. M16 gör den synlig (Panel B) men löser den inte. När den blir flaskhalsen är svaret fler människor. Planera för det.

---

## 8. Automatisering

**Självgående (ingen människa):** hela driftövervakningen (Block 1 läser och visar utan input), statistik-aggregering (Block 2), larm-generering och -gruppering (Block 3), den dagliga sammanfattningens sammanställning, larm-eskalering vid obesvarat, samt allt i tabellen i 5.2 — deadline-passeringar, statusbyten, badge-tilldelning, arkivering, påminnelser, refund vid undermål, bedrägeriscanning.

**Kräver människa:** att *läsa* dashboarden och *agera* på larm (Block 1, 3). Alla manuella ingrepp i Block 4 — pausa, stänga, refundera, kantfallshantering, godkänna undantag. Att kalibrera larmtrösklarna under inlärningsperioden.

**Den ärliga gränsen:** M16:s automatik kan göra allt *utom* att fatta beslut och utöva omdöme. Den kan upptäcka, sammanställa, larma och verkställa — men det första valet ("är detta en fejk?", "ska denna förlängning godkännas?") är och förblir mänskligt. Riktmärket: en normal vecka utan kantfall ska kräva av Zivar att han läser en grön dashboard på 5 sekunder och ett sammanfattningsmejl på 2 minuter. Allt därutöver är de 5 %.

---

## 9. Öppna frågor

1. **Exakt SLA-tröskel för rött larm** — riktmärke > 96 h i 3.2, men M3 spikar det slutgiltiga granskningens-SLA. Synkas med M3.
2. **Exakta tröskelvärden för "ovanligt pengaflöde"** (3.4) — riktmärkena (25 000 kr, 50 000 kr/h) är gissningar inför drift. Justeras med verklig data; bör synkas mot vad Stripe Radar redan fångar så M16 inte dubblerar.
3. **K-anonymitetsgolvet för kommun-statistik** — är 1–2 insamlingar rätt gräns, eller behövs ett högre golv? Bekräftas mot integritetspolicyn i M8.
4. **Daglig sammanfattning — leveranstid och format.** En gång om dagen, men när? Och ska den vara e-post, in-app eller båda? Detaljspecas i M15.
5. **Behörighet vid teamtillväxt** — om plattformen får fler än tre personer i drift, behövs en mellannivå mellan "granskare" och "admin"? Bedöms i M6 om/när det blir aktuellt.
6. **Admin-loggens lagringstid och åtkomst** — hur länge sparas den interna ingreppsloggen, och vem får läsa den historiskt? Knyts till GDPR-besluten i M8.

---

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 16:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (driftövervakning, fyra paneler), Block 2 (statistik & insiktsdashboard, intern/publik delning, k-anonymitet), Block 3 (tvånivå-larm, "ovanligt pengaflöde"-definition), Block 4 (verktygslåda, behörighetsmappning mot M6), Block 5 (självgående-kontroller, auto-pausens två undantag, ärlig flagga om granskningens skalningsgräns) nyskrivna. |
