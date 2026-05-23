# 00 — Masterkarta

**Plattform:** Sadaqa Sweden *(arbetsnamn — bekräfta eller byt)*
**Datum:** 2026-05-23
**Status:** Hela plattformen planerad — 17 moduler + Beredskapsplan. Extern granskning genomförd (se `FORGE-genomgang.md`).

---

## Vad detta dokument är

Det här är **kartan över hela plattformen**. Den säger inte *hur* varje modul fungerar i detalj — det gör modulfilerna. Den säger *vilka* delar som finns, *hur* de hänger ihop, och *i vilken ordning* du läser dem.

Läs den här filen först. Alltid. När du är vilse, börja här.

Tre saker du ska veta innan du läser vidare:

1. **Vi planerar HELA plattformen innan första kodraden.** Armar, ben, skosnören. Vi vet att alla delar finns innan vi bygger. Implementeringsordning är en separat plan — senare.
2. **Allt vi planerar = "v1".** "v2" som ord är slopat. Det betyder inte att allt byggs samtidigt — se avsnitt 6 om lager.
3. **Varje modulfil har samma mall.** Lär dig mallen en gång (avsnitt 8), sen kan du läsa vilken modul som helst.

---

## 1. Plattformen i en mening

> En **svenskspråkig insamlingsplattform för det muslimska samhället i Sverige** — där privatpersoner och föreningar driver insamlingar, pengarna går direkt till insamlaren via Stripe, varje projekt granskas mot islamiska principer innan publicering, och resultatet bevisas öppet — byggd så att den känns **premium, trygg och levande**, inte som ett kassaregister.

Det är norrstjärnan. När ett beslut är oklart: vilket val tjänar den meningen bäst?

---

## 2. De två lagren

Plattformen har **17 moduler i två lager**. Lagren är till för att du ska kunna tänka klart — inte en teknisk indelning.

### 🟢 KÄRNAN — insamlingsmotorn (Modul 1–8)

Det som *måste* funka för att det här ska vara en insamlingsplattform över huvud taget. En insamling skapas, granskas, publiceras, tar emot pengar, betalas ut, bevisas. Identitet och regler håller ihop det.

> **Om bara Kärnan fanns:** du har en fungerande, trygg insamlingsplattform. Tråkig, men den fungerar och den är säker.

### 🔵 VÄRLDEN RUNTOM — det som får folk att komma tillbaka (Modul 9–17)

Profiler, kartan över Sverige, föreningskatalogen, communityn, events, notiser, statistik. Det här är skillnaden mellan "en sajt jag besöker när jag ska donera" och "en plats jag går in på för att se vad som händer".

> **Din egen insikt:** *"om de är en platform som du går in på och de inte händer saker kommer inte folk tillbaka."* Världen runtom är svaret på det. Men huvudmålet bor i Kärnan — Världen lockar, Kärnan levererar.

---

## 3. Hela modulkartan

De 17 modulerna nedan. Två följedokument kompletterar dem: **`Beredskapsplan.md`** (operativ beredskap — bank, betalning, incident, kontinuitet, ekonomi) och **`FORGE-genomgang.md`** (logg över den externa granskningen och vad den ledde till).

| # | Modul | Lager | Vad den ansvarar för | Status |
|---|---|---|---|---|
| 1 | Insamling som objekt | 🟢 Kärnan | Vad en insamling *är* — innehåll, mål, pengar, tid, livscykel, regler | ✅ Klar |
| 2 | Insamlar-flödet | 🟢 Kärnan | Hur en insamlare skapar och driver sin insamling — wizard, redigering | ✅ Klar |
| 3 | Granskar-flödet | 🟢 Kärnan | Hur granskaren bedömer mot islamiska principer — köflöde, beslut, SLA | ✅ Klar |
| 4 | Donator-flödet | 🟢 Kärnan | Hur en donator ger — belopp/enheter, kvitto, gästdonation | ✅ Klar |
| 5 | Pengaflöde | 🟢 Kärnan | Stripe Connect — charge, utbetalning, refund, avgifter | ✅ Klar |
| 6 | Identitet & auth | 🟢 Kärnan | BankID, KYC, konton, roller, behörigheter | ✅ Klar |
| 7 | Transparens-loopen | 🟢 Kärnan | Uppdateringar, bevis (start/utbetalning/resultat), badges | ✅ Klar |
| 8 | Policies & regler | 🟢 Kärnan | Granskningspolicy, anti-diskriminering, villkor, integritet | ✅ Klar |
| 9 | Profiler & användarsidor | 🔵 Världen | Den publika profilen — historik, utmärkelser, insamlingar | ✅ Klar |
| 10 | Organisationer, katalog & collab | 🔵 Världen | Föreningskonton, självregistrering till katalogen, samarbeten | ✅ Klar |
| 11 | Listning, sökning & discovery | 🔵 Världen | Hur man hittar insamlingar — flöde, sök, filter, kategorier | ✅ Klar |
| 12 | Karta & geografisk insikt | 🔵 Världen | Sverige-kartan, regional data, var hjälpen landar | ✅ Klar |
| 13 | Community & samtal | 🔵 Världen | Trygg interaktion — kommentarer, dua, reaktioner. Inte Facebook | ✅ Klar |
| 14 | Events & platsinfo | 🔵 Världen | Händelser, moské-öppettider, vad som är på gång | ✅ Klar |
| 15 | Notiser & kommunikation | 🔵 Världen | Hur plattformen når användaren — kanaler, opt-in | ✅ Klar |
| 16 | Admin & dashboard | 🔵 Världen | Drift, statistik, larm, det som håller plattformen självgående | ✅ Klar |
| 17 | Team & intern arbetsyta | 🔵 Världen | Teamets konton, roller, vem-gör-vad, samlad inloggning — internt verktyg | ✅ Klar |

---

## 4. Vad varje modul gör — kort

### 🟢 KÄRNAN

**Modul 1 — Insamling som objekt.** Hjärtat. Definierar vad en insamling *är*: kategori, titel, beskrivning, mottagare, media, plats (Block 1), målbelopp, datum, över-/undermål, refund, valuta (Block 2), livscykel och tillstånd (Block 3), relationer till andra objekt (Block 4), regler för vad som får ändras (Block 5). Allt annat refererar hit.

**Modul 2 — Insamlar-flödet.** Resan för personen som skapar en insamling. Skapande-wizard med 4–5 strukturerande frågor, redigering, hur granskningsstatus visas, hur insamlaren driver insamlingen efter publicering.

**Modul 3 — Granskar-flödet.** Resan för granskaren (du + dina två bröder). Granskningskö, hur ett projekt bedöms mot islamiska principer, ändringsbegäran fram och tillbaka, beslut, SLA (riktmärke 72 h), eskalering vid stora belopp.

**Modul 4 — Donator-flödet.** Resan för den som ger. Donationsbelopp eller per-enhet ("20 mattor"), gäst kontra inloggad, kvitto, valet "ge ändå om undermål", anonymitet.

**Modul 5 — Pengaflöde.** Den tekniska sanningen om pengarna. Stripe Connect, hur charge går direkt till insamlarens konto, utbetalning, refund-möjlighet, vem som bär avgiften, vad plattformen *aldrig* rör juridiskt.

**Modul 6 — Identitet & auth.** Vem är vem. BankID-inloggning, KYC för insamlare, konton, de olika rollerna (besökare, donator, insamlare, förening, granskare, admin) och vad var och en får göra.

**Modul 7 — Transparens-loopen.** Plattformens själ i teknisk form. De tre obligatoriska bevisen (start, utbetalning, resultat), fria uppdateringar däremellan, badgesystemet, hur historik följer en profil.

**Modul 8 — Policies & regler.** Regelboken. Granskningspolicy per kategori, anti-diskrimineringspolicy, bildäkthetspolicy, användarvillkor, integritetspolicy (GDPR), hantering av fejk-insamlingar efter publicering.

### 🔵 VÄRLDEN RUNTOM

**Modul 9 — Profiler & användarsidor.** Den publika sidan för en person. Insamlingar de drivit, utmärkelser, transparens-historik, föreningar de taggat. Premiumkänslan bor mycket här.

**Modul 10 — Organisationer, katalog & collab.** Föreningskonton. **Självregistrering:** "Är ni en förening och vill synas? Fyll i formuläret — vi publicerar er efter granskning." Endast **muslimska föreningar och moskéer**. Plus collab: en privatperson driver en insamling *med* stöd av en moské, synligt på insamlingen.

**Modul 11 — Listning, sökning & discovery.** Hur en besökare hittar något att stötta. Startflödet, sök, filter (kategori, plats, modell), kategorisidor, hur "trafiken bygger sig själv".

**Modul 12 — Karta & geografisk insikt.** Sverige-kartan. Vilka regioner driver vad, var donationer kommer ifrån (baserat på verifierade insamlar-platser), vart hjälpen landar. Den interaktiva, visuella delen.

**Modul 13 — Community & samtal.** Den trygga sociala ytan. Kommentarer, dua-knapp, reaktioner, uppdateringsflöde. **Inte** en fri vägg — strukturerad så att huvudmålet (insamling) är kvar i centrum och kaos inte uppstår.

**Modul 14 — Events & platsinfo.** Det som gör plattformen levande mellan insamlingar. Händelser som är bra för samhället, moské-öppettider, taggning av platser.

**Modul 15 — Notiser & kommunikation.** Hur plattformen pratar med användaren. E-post, push, in-app. Opt-in, aldrig spam. "Ahmed öppnade en ny cykel — vill du ge igen?"

**Modul 16 — Admin & dashboard.** Maskinrummet. Driftövervakning, statistik, larm när något kräver en människa, verktygen som gör att plattformen sköter sig själv 95 % av tiden.

**Modul 17 — Team & intern arbetsyta.** Den interna sidan. Hur Zivar och vännerna som hjälper till får konton, roller och en samlad arbetsyta att logga in på — och hur man ser vem som gör vad. Databasen rörs aldrig direkt; arbetsytan är verktyget.

---

## 5. Kopplingskartan — hur modulerna pratar med varandra

Modulerna är inte öar. Här är de viktigaste kopplingarna. Pilen betyder "bygger på / matar".

```
                    ┌─────────────────────────────┐
                    │  M1  Insamling som objekt   │ ← allt refererar hit
                    └──────────────┬──────────────┘
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
   │ M2 Insamlar-   │───▶│ M3 Granskar-   │    │ M4 Donator-    │
   │    flödet      │◀───│    flödet      │    │    flödet      │
   └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
           │                     │                     │
           ▼                     ▼                     ▼
   ┌────────────────────────────────────────────────────────┐
   │ M6 Identitet & auth   │   M5 Pengaflöde (Stripe)        │
   └────────────────────────────────────────────────────────┘
           │                     │
           ▼                     ▼
   ┌────────────────┐    ┌────────────────┐
   │ M7 Transparens-│───▶│ M8 Policies &  │
   │    loopen      │    │    regler      │  ← regelboken alla lyder
   └───────┬────────┘    └────────────────┘
           │
   ════════╪══════════ KÄRNAN slutar / VÄRLDEN börjar ══════════
           ▼
   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
   │ M9 Profiler    │◀──▶│ M10 Org/katalog│◀──▶│ M11 Listning & │
   │                │    │    & collab    │    │     discovery  │
   └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
           │                     │                     │
           ▼                     ▼                     ▼
   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
   │ M12 Karta &    │    │ M13 Community  │    │ M14 Events &   │
   │  geo-insikt    │    │   & samtal     │    │   platsinfo    │
   └────────────────┘    └────────────────┘    └────────────────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 ▼
            ┌────────────────┐        ┌────────────────┐
            │ M15 Notiser    │        │ M16 Admin &    │
            │ (når alla)     │        │  dashboard     │
            └────────────────┘        └────────────────┘
```

**De viktigaste enskilda kopplingarna att minnas:**

- **M1 är navet.** Modul 2, 3, 4, 7, 11 läser och skriver alla mot insamlings-objektet.
- **M3 ↔ M8.** Granskaren *tillämpar* reglerna; reglerna *bor* i Policies. Ändras en regel i M8 ändras granskarens jobb i M3.
- **M5 styr M1 Block 2.** Hur Stripe Connect håller pengar avgör om refund vid undermål ens är tekniskt möjligt. Pengaflödet är inte fri konst — det sätter ramar uppåt.
- **M6 är portvakten.** Roller och KYC i M6 avgör vem som får göra vad i *alla* andra moduler.
- **M7 föder M9.** Transparens-historik (bevis, badges) blir det som visas på profilen.
- **M10 föder M12 och M14.** Föreningskatalogen är datakällan för var moskéer ligger på kartan och vem som arrangerar events.
- **M15 är tvärgående.** Notiser triggas av händelser i nästan sagt alla andra moduler.
- **M17 omsluter M16 och M3.** Teamets arbetsyta är skalet; driftvyn (M16) och granskningskön (M3) visas inuti den.

Varje modulfil har ett eget **"Kopplingar"-avsnitt** som listar exakt vad just den modulen tar in och lämnar ut.

---

## 6. Vad som är v1-kärna och vad som kan vänta

**Hela kartan planeras nu.** Men att planera ≠ att bygga samtidigt. Så här grupperar vi bygget — det här är en *grov* indikation, den skarpa implementeringsordningen är en egen plan senare.

**Bygg-grupp A — "plattformen fungerar och är trygg":**
M1, M2, M3, M5, M6, M8 + det minsta av M7.
→ En insamlare kan skapa, bli granskad, publicera, ta emot pengar. En donator kan ge. Reglerna håller.

**Bygg-grupp B — "plattformen är trovärdig och levande":**
Resten av M7, M4 fullt ut, M9, M11, M15.
→ Bevis, badges, profiler, discovery, notiser. Nu känns det som en plattform, inte ett formulär.

**Bygg-grupp C — "plattformen är en värld":**
M10, M12, M13, M14, M16, M17.
→ Katalog, karta, community, events, det självgående maskinrummet, teamets arbetsyta.

Varför säga det här rakt: scopet är stort. Det är inte knas — det hänger ihop. Men du ska veta att kartan är komplett *och* att den inte byggs på en månad. Planen är hel; bygget är i grupper.

---

## 7. Designprinciper — gäller ALLA moduler

Dessa återkommer genom hela plattformen. När en modul bryter mot en av dem ska det stå *varför*.

**Från Block 1 (behållna):**

1. **(B)-modellen.** Strukturen visas publikt. Granskaren säkrar kvalitet *vid* publicering. Granskaren är vakt vid grinden — inte censor.
2. **Per-fält integritetskontroll.** Insamlaren styr vad som visas publikt, fält för fält. Data lagras → granskaren ser allt → donatorn ser bara det publika.
3. **95 % självgående.** För varje funktion: kan detta automatiseras eller lösas med smart UX så att Zivar inte måste agera? Du har inte tid att granska heltid.
4. **"Vårt fel men inte dödligt."** Vi gör vårt bästa, 100 % är omöjligt. Något slinker igenom — lär, justera, fortsätt. Ingen över-design kring varje gränsfall.
5. **Verktyg, inte polis.** Plattformen ger infrastruktur. Insamlaren äger sitt eget ansvar. Vi tvingar inte fram *hur* jobbet görs — bara att resultatet bevisas.

**Nya principer (från visionen + research):**

6. **Premium genom omsorg, inte prål.** Plattformen ska kännas dyr och älskad — genom lugn, tydlighet, snygga detaljer och inga trasiga kanter. Inte genom effekter.
7. **Granska före publicering — alltid.** GoFundMes "publicera först, moderera sen" är ett bedrägerihål. Inget når allmänheten ogranskat.
8. **Bygg för det andliga idealet, respektera den mänskliga svagheten.** Sadaqah är komplett när pengarna lämnar handen — Allah har sett. Men människan i dunya behöver återkoppling. Badges bevisar inte fromhet; de bär det tvivlande hjärtat.
9. **Transparens är ett mål, inte ett tvång.** Vi kan inte tvinga fram resultatbevis. Vi gör det socialt belönande. Plattformen anklagar aldrig — den visar bara historik.
10. **Anti-kaos och anti-diskriminering by design.** Skydd byggs in i mekaniken, inte som efterhandskontroll. Diskriminerande språk, riktat hat, sekterism — fångas i granskning och i communityns struktur.
11. **Islamiskt medveten, inte sekteristisk.** Plattformen står på islamiska principer men tar inte sida mellan inriktningar (sunni/shia m.fl.). Den är för det muslimska samhället som helhet.
12. **Muslimsk är målgrupp, inte mur.** Insamlingar granskas på *projektet* — vem som helst får driva en insamling som inte krockar med islam. Föreningskatalogen däremot listar endast **muslimska** föreningar och moskéer — det är målgruppen.
13. **Samordna befintlig godhet.** Plattformen gör inte allt själv. Den kopplar ihop styrkor som redan finns (Stripe har licensen, BankID har identiteten, föreningar har handledningen).

---

## 8. Hur varje modulfil är uppbyggd — mallen

Lär dig den här en gång. Alla 17 modulfiler följer den.

```
1. Vad modulen är          — en mening + vad den löser
2. Varför den behövs        — problemet, kort
3. Blocköversikt            — modulen delas i block (numrerade)
4. [Block för block]        — full specifikation:
     • Vad blocket/fältet är
     • Specifikation (punktlista)
     • Obligatoriskt? Publikt? Vem får ändra?
     • Kantfall
5. Designval & motivering   — varför vi valde som vi valde
6. Kopplingar               — vad modulen tar in / lämnar ut
7. Säkerhet & anti-kaos     — vad som kan gå fel, vad som skyddar
8. Automatisering           — vad som är självgående, vad som kräver människa
9. Öppna frågor             — det som behöver ett beslut senare
10. Beslutslogg             — tabell: beslut + motivering
11. Versionshistorik
```

Du behöver inte läsa allt. Vill du bara förstå en modul snabbt: läs **avsnitt 1, 2 och 3**. Vill du bygga den: läs allt.

---

## 9. Vad research lärde oss (kondenserat)

Lärdomar som format planen. Detaljer per modul.

| Källa | Vad vi tar med oss | Hör hemma i |
|---|---|---|
| **GoFundMe** | Noll friktion att skapa. Optional-tip i stället för plattformsavgift = förtroendesignal. MEN: publicera-först = bedrägerihål → vi granskar först. Donor-garanti vid bedrägeri värt att efterlikna. | M2, M5, M8 |
| **BetterNow** | "Varje insamling hänger på en verifierad registrerad org" = starkaste bedrägeriskyddet. Men låser ute privatpersoner → vi kör hybrid: KYC på privatpersoner + collab/förening som extra trovärdighet. | M6, M10 |
| **LaunchGood** | Granskar före live (som vi). Zakat-verifierad-badge. Ramadan-cykler och referral-mekanik. 0 % avgift + frivilligt tips. Kritik: ytlig kontroll av *fund use* → vår transparens-loop ska vara vassare där. | M3, M7, M14 |
| **GiveMatch** | Matchning/referral kan bli viralt — men kräver tredjepartsåtagande. Avfärdat för v1, parkerat. | M4 (parkering) |
| **Svensk föreningsrätt** | Ideell förening finns vid konstituerande möte. Org.nr gratis via SKV 8400. 90-konto frivilligt (kräver auktoriserad revisor + 75/25-regel). | Föreningsdokument |
| **Marknadsluckan** | Ingen svenskspråkig, SEK/Swish-nativ muslimsk insamlingsplattform finns. Detta är inte "ännu en GoFundMe" — det är den första i sitt slag i Sverige. | Hela plattformen |

---

## 10. Gammal → ny modulnumrering

Dina tidigare dokument (`Insamlingsplattform-*`) använde en 12-modulskarta. Vi har utökat till 16 — fyra delar i visionen (profiler, karta, community, events) var för stora för att gömmas inuti andra moduler. Här är översättningen så du inte blir vilse:

| Gammal | Ny | Kommentar |
|---|---|---|
| 1 Insamling som objekt | **M1** | Samma |
| 2 Insamlar-flödet | **M2** | Samma |
| 3 Granskar-flödet | **M3** | Samma |
| 4 Donator-flödet | **M4** | Samma |
| 5 Pengaflöde | **M5** | Samma |
| 6 Identitet & auth | **M6** | Profiler bröts ut till M9 |
| 7 Organisationer & collab | **M10** | Utökad med självregistrerings-katalog |
| 8 Transparens-loopen | **M7** | Flyttad in i Kärnan — den hör hemma där |
| 9 Notiser & kommunikation | **M15** | Samma innehåll |
| 10 Listning, sökning | **M11** | Samma |
| 11 Admin & dashboard | **M16** | Geo-insikt bröts ut till M12 |
| 12 Policies & regler | **M8** | Flyttad in i Kärnan — regelboken hör dit |
| *(ny)* | **M9** | Profiler & användarsidor |
| *(ny)* | **M12** | Karta & geografisk insikt |
| *(ny)* | **M13** | Community & samtal |
| *(ny)* | **M14** | Events & platsinfo |

De gamla filerna `Insamlingsplattform-Modul1-Block1.md` och `-Block2.md` (nu i mappen `4-Bakgrund/`) är ditt frö-arbete. Den nya filen `Modul-01-...` bygger ut det till full djup och blir den gällande versionen.

---

## 11. Läsordning

Vill du läsa hela plattformen i en logisk ordning:

1. **00 Masterkarta** (den här filen)
2. Bakgrund (i `4-Bakgrund/`): `Insamlingsplattform-sammanfattning.md` och `-mitt-band.md` — *varför* plattformen finns
3. **M1 → M8** (Kärnan, i nummerordning)
4. **M9 → M17** (Världen runtom, i nummerordning)
5. **`Beredskapsplan.md`** — vad vi gör när verkligheten slår till
6. **Föreningsdokumenten** — den juridiska kroppen bakom plattformen

Vill du bara veta vad som finns: den här filen räcker.

---

## 12. Beslutslogg

| Beslut | Motivering |
|---|---|
| **16 moduler i två lager** (Kärnan / Världen) | 12 räckte inte — profiler, karta, community, events var för stora att gömma. Två lager gör kartan läsbar: vad som *måste* funka vs vad som *lockar tillbaka*. |
| **Transparens-loopen (M7) och Policies (M8) flyttas in i Kärnan** | Bevis och regler är inte "extra" — utan dem är plattformen varken trovärdig eller trygg. De hör till motorn. |
| **Profiler bryts ut från auth** | Auth är "vem får göra vad". Profil är "vad andra ser". Olika problem, olika moduler. |
| **Föreningskatalogen är självregistrering, inte vår lista** | Vi listar inte föreningar åt dem. De ansöker via formulär, granskas, publiceras. Skala utan att vi underhåller en databas manuellt. |
| **Endast muslimska föreningar i katalogen** | Det är målgruppen. Katalogen ska kännas relevant och sammanhållen, inte vara en allmän föreningskatalog. |
| **Granska före publicering** | Bekräftat av research: GoFundMes publicera-först är ett bedrägerihål. Confirmed av LaunchGoods modell. |
| **Hela kartan planeras, bygget grupperas i A/B/C** | Ärlighet: scopet är stort. Planen får vara hel; bygget måste vara i hanterbara grupper. |
| **M17 tillagd — Team & intern arbetsyta** | Adminpanelen/teamlagret var ett gap: hur de som driver plattformen får konton, roller och en arbetsyta. Eget koncept, skilt från M16:s driftvy. |

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första masterkartan. 16 moduler, två lager, kopplingskarta, designprinciper, mall, research-sammanfattning, gammal→ny-mappning. |
| 1.1 | 2026-05-23 | Modul 17 (Team & intern arbetsyta) tillagd efter att teamlagret identifierats som ett gap — 17 moduler. |
