# Tillägg — Nya beslut (2026-05-23)

**Vad detta är:** Beslut och ny omfattning som tillkom *efter* att de 17 modulerna
planerades — fångade här så inget tappas. Claude Code läser detta tillsammans med
de moduler varje punkt rör. **Säger detta dokument och en äldre modul-/byggplanstext
olika — detta dokument vinner** (det är nyare).

**Bakgrund:** framtaget i samtal med Zivar under förberedelsen av Stripe-steget.
Del A ändrar något redan planerat. Del B är ny omfattning som byggs efter de 17 modulerna.

---

## DEL A — Ändringar i befintliga moduler

### A1. Återbetalningsmodellen — reviderad

**Rör:** M5 (Pengaflöde), M1 Block 2, M4 (Donator-flöde), `2-Byggplan/02-Stripe-pengaflode.md`.
**Byggsteg:** 5–7 (mest `settle-campaign`, Steg 6–7). **Typ:** ÄNDRING.

**Gammal modell (utgår):** missar en insamling sitt mål → donationer med donatorns
val "återbetala mig" refunderas automatiskt vid deadline.

**Ny modell:**

- Pengar **flödar framåt** — de används för saken oavsett om exakt mål nås.
  Missar en insamling 50 000 med 49 998 återbetalas ingenting per automatik.
- Vid missat mål: insamlingen kan **förlängas** en gång, eller så **används medlen
  som de är** för en skalad insats. Insamlaren rapporterar utfallet via
  transparens-loopen (M7).
- **Återbetalning är ett undantag**, inte en rutin. Den sker bara vid:
  - **Bedrägeri** — upptäckt i valfritt skede (tidigt eller sent). Pengar återkallas
    i den mån det går, med juridiska medel.
  - **Fel** — en missad eller felaktig donation.
- Donatorns per-donation-val "ge ändå / återbetala mig" **utgår** som rutin.

**Icke-förhandlingsbart krav:** donatorn ska **vid gåvotillfället** tydligt veta att
gåvan används för saken oavsett om exakt mål nås. Transparens ersätter valet — utan
det är det ett förtroendebrott.

**Varför:** sadaqah som getts är Islamiskt oåterkallelig; givaren vill att saken
hjälps oavsett slutsumma. Enklare flöde, färre tillstånd.

**Juridik:** betaltjänstjuristen (02-Stripe öppen fråga 7) ska även granska
formuleringen kring "behålla medel om mål ej nås".

### A2. Onboarding — sänk tröskeln innan någon fastnar

**Rör:** M2 (Insamlar-flöde), M6 (Identitet), M8 (Policies).
**Byggsteg:** 3 (justering) + löpande. **Typ:** ÄNDRING / förtydligande.

**Profil-flödet — bekräftad ordning:**

1. **BankID-verifiering** (plattformens trygghets-grind) — måste vara grön först.
2. **Koppla Stripe** — möjligheten öppnas först när BankID är grön.
3. **Skapa första insamlingen** — först när 1 + 2 är klara.

**Problemet:** ingen ska behöva gå igenom hela kedjan och *sedan* nekas för att
insamlingen inte uppfyller kraven. Det bränner förtroende och belastar teamet.

**Lösning — två lager, innan man binder upp sig:**

- **Självbetjäning:** en tydlig "Kan jag samla in?"-guide — kriterierna i klartext
  + exempel på vad som godkänns och inte. De flesta får svar utan en människa.
- **Fråga-väg:** en lätt kanal att ställa frågan *innan* man drar igång. Hålls
  billig för teamet om guiden är bra. Frågorna besvaras med fördel av de regionala
  admins (se B1).

### A3. Swish via Stripe — bekräftad

**Rör:** M4, M5, `2-Byggplan/02-Stripe` (öppen fråga 1). **Byggsteg:** 5–6.
**Typ:** löst osäkerhet.

Verifierat mot Stripes dokumentation: **Swish fungerar via Stripe, i Connect, med
"separate charges and transfers", för Sverige.** Insamlaren behöver **inget eget
Swish-handelsavtal** — Stripe sköter Swish-mottagningen; plattformen slår på Swish
+ begär `swish_payments`-kapabiliteten för connected accounts. Swish är snabbt
(godkänns i appen, 3-minutersfönster) och har inga chargebacks.

→ **02-Stripe öppen fråga 1 är därmed besvarad: ja.** Bygg ändå kort-flödet först,
Swish direkt efter — samma charge-/transfer-arkitektur.

### A4. Test vs live — nyckel-disciplin

**Rör:** hela Stripe-bygget + deploy. **Byggsteg:** 5+. **Typ:** förtydligande.

- Claude Code **går aldrig in i** något Stripe-konto (varken test eller live).
  Code skriver *kod*. Koden pratar med Stripe via API:et; vilket läge den når
  avgörs **bara** av vilka nycklar som finns i miljön.
- **Under bygget:** test-nycklar (`pk_test_` / `sk_test_`) i `5-Kod/.env.local`
  → koden når bara Stripe-sandlådan. Live-kontot är fysiskt oåtkomligt. "Inga
  testköp på live" är därmed garanterat av nyckel-separationen.
- **I produktion:** exakt samma kod. Live-nycklar sätts som miljövariabler i
  **Cloudflare-projektet** — aldrig i `.env.local`, aldrig i git. Ingen
  kodändring; bara olika nycklar per miljö.
- **`STRIPE_WEBHOOK_SECRET`** skapas när webhook-endpointen skapas — en per miljö
  (en för sandlådan, en för produktion).
- Live-kontots egen uppsättning (Connect skarpt, företagsverifiering, bankkonto,
  produktions-webhook) är **operativt** — görs av Zivar i dashboarden inför
  produktion, inte av Code.

---

### A5. BankID — v1 använder Stripes inbyggda KYC, inte en broker

**Rör:** M6 (Identitet & auth), `2-Byggplan/03-BankID-auth-donationsflode.md`.
**Byggsteg:** insamlar-onboarding (kopplat till Steg 5 Stripe Connect). **Typ:** ÄNDRING.

**Gammalt (utgår för v1):** M6 + `03-BankID` gjorde BankID via en broker (Criipto-typ
OIDC) till **obligatoriskt KYC-Steg-1** för insamlare.

**Nytt — v1:**

- Identitets-grinden för en insamlare är **Stripe Connect-onboardingens inbyggda
  KYC**. När insamlaren onboardar sitt Express-konto (krävs för att ta emot pengar)
  verifierar Stripe deras identitet — regulatoriskt krav, ingår i Connect,
  **noll extra kostnad**.
- Insamlaren räknas som **identitetsverifierad när Stripe-onboardingen är klar**
  (`charges_enabled` / `details_submitted`). `bankid_verifierad`-flaggan i
  auth-skalet sätts då av Stripe-onboarding-callbacken istället för av en
  BankID-broker. Döp gärna om flaggan till `identitet_verifierad`.
- **Ingen BankID-broker i v1.** Skäl: en broker kostar månadsavgift; plattformen
  är 0 %-avgift och saknar intäkt i v1. Stripe gör redan KYC:n gratis.
- **UI-text:** "Ej BankID-verifierad" → "Ej identitetsverifierad"; "kräver
  BankID-verifiering" → "kräver identitetsverifiering (via Stripe)". Verifierad-
  badgen visar "identitet verifierad", inte "BankID".
- **BankID-inloggning utgår i v1** — e-post/lösenord.

**BankID som senare uttag:**

- Auth-skalets integrationsgräns (`lib/bankid/`, flaggan) behålls som ett
  **uttag**. När plattformen har medel kan riktig BankID via broker aktiveras —
  för BankID-stämpeln, BankID-login och step-up. Ingen ombyggnad.
- `03-BankID-auth-donationsflode.md` står kvar **orörd** som spec för det
  framtida uttaget.

**Konsekvenser:**

- Step-up-BankID vid utbetalning (`03-BankID` 1.6) utgår i v1 — Stripes egna
  payout-kontroller + att medel hålls till deadline täcker risken.
- Dubbelspärr (ett personnummer = ett konto, `03-BankID` 1.4) förlitar sig i v1
  på Stripes identitetskontroll.

**Varför:** bygg uttaget, aktivera BankID när det finns pengar. Stripes KYC är
gratis, riktig och regulatorisk — den räcker som identitets-grind för v1.

---

## DEL B — Ny omfattning (byggs efter de 17 modulerna)

### B1. Plattformsstyrning — superadmin / admin-federation

**Rör:** ny omfattning, bygger på M16 (Admin), M17 (Team), M3 (Granskning), M10 (Organisationer).
**Byggsteg:** efter Steg 16 (Bygg-grupp C, sista lagret).
**URL-arkitektur:** subpath på `sadaqahsweden.se` — `/superadmin`, `/admin`, `/team`. **Reviderat 2026-05-24:** subdomäner utgår, se `Tillägg-Admin-URL-arkitektur-2026-05-24.md`. Övrigt i B1 (tre nivåer, regional ansvarsfördelning, BankID-krav, skydd) gäller oförändrat.

**Idén:** plattformen ska inte vara beroende av att en person granskar hela Sverige.
Granskning *och* support distribueras till betrodda regionala moskéer.

**Strukturen — tre nivåer:**

- **Superadmin (Zivar)** — högst upp. Ser allt, hela kedjan. Subpath
  `sadaqahsweden.se/superadmin`.
- **Region-admin** — en moské per region driver sin regions granskning + support.
  Region-admins är **oberoende av varandra** — ser inte varandras data. Subpath
  `sadaqahsweden.se/admin` med RLS-scopning på `region_id`.
- **Region-medhjälpare** — varje region-admin får ha *några få* medhjälpare
  (begränsat antal, inte 15) som hjälper till med granskning och frågor.

**Regler:**

- Antal region-admins är **begränsat** — riktmärke en per region.
- **Alla** i kedjan (region-admin + medhjälpare) måste vara **BankID-verifierade**.
- En regions insamlingar granskas av den regionen → fördelad arbetslast.
- **Rapportering går hela vägen upp** till superadmin.

**Risker (Zivar flaggade dem själv) + skydd:**

- *Risk:* delegerad granskning missbrukas — släpper igenom fel, eller nekar av
  personliga skäl istället för sakskäl.
- *Skydd som redan finns (M3):* append-only-logg + motiveringskrav + jäv-regel
  (granskar aldrig egen insamling). Varje beslut spårbart till en person med ett skäl.
- *Skydd att lägga till:*
  - **M8-regelboken är den objektiva måttstocken** — region-admin granskar mot den,
    aldrig personlig smak. Skrivs in uttryckligt.
  - **Överklagande-väg** — en insamlare som känner sig orättvist nekad kan eskalera
    till superadmin. Fångar "nekad av fel skäl".
  - **Stickprov** — superadmin granskar stickprovsvis (Zivar gör redan detta).
  - **Andra-granskning** för stora eller känsliga insamlingar.

**Arkitektur-flagga:** detta inför en **region-dimension** i granskning + en
**admin-nivå-dimension**. Sadaqa är medvetet *inte* multi-tenant idag. Detta är inte
full multi-tenancy, men ett riktigt RLS-tillägg. Se datamodell-flaggorna nedan.

### B2. Innehåll & FAQ — superadmin-redigerbart

**Rör:** ny omfattning, bygger på M8 (Policies), M16 (Admin).
**Byggsteg:** juridiska sidorna tidigt (före skarp lansering); FAQ-systemet Bygg-grupp C.

**Behovet:** plattformen behöver mycket informativt innehåll och besvarade frågor
publikt — så att utbildade/rätt personer kan svara en gång och resten är
självbetjäning. Designens footer pekar redan på sidorna; innehållet finns inte än.

**Sidorna (från footern):**

- **Informativa / utbildande:** Hur det fungerar, Granskningen, Transparens,
  Sadaqa & Zakat, För moskéer, Samarbeten, Föreningsstöd, Anmäl er förening.
- **Juridiska:** Integritet (integritetspolicy), Villkor (användarvillkor).

**Två sorters innehåll — olika regler:**

- **Redigerbart innehåll** (de informativa sidorna + en FAQ): superadmin kan lägga
  till och ändra **live** — ett enkelt innehållssystem (CMS-light), ingen kodändring.
  Zivar levererar texter, eller skriver direkt.
- **Juridiska sidor** (Villkor, Integritet): finns på plats **före skarp lansering**.
  Ändras inte slarvigt live — de följer juridisk granskning.

**FAQ:** en strukturerad fråga/svar-yta. Vanliga frågor besvaras en gång, synliga
för alla. Minskar trycket på teamet och på region-admins (B1).

**Funktions-grind:** footer-länkarna får inte vara döda. Tills en sida har innehåll
→ en enkel "kommer snart"-sida, aldrig en länk som inte gör något.

---

## Datamodell-flaggor — gör NU, även om bygget är senare

Federationen (B1) byggs sist, men datamodellen ska *känna till* den från början så
att en senare federation inte kräver en smärtsam ombyggnad:

- **Insamling har en region** — `insamlar_region` finns redan i `insamling`.
  Säkerställ att den fylls och normaliseras (kopplar även M12-kartan).
- **Granskning ska kunna region-scopas** — en granskning bör kunna knytas till en
  region, så region-admins kan filtreras till sin regions kö senare.
- **Admin-roll behöver en nivå/scope** — dagens roll `admin` räcker inte för tre
  nivåer. Reservera utrymme för `superadmin` vs region-`admin` + region-id, utan
  att bygga federationen än.

Detta är *förberedande hänsyn*, inte bygge. Ingen federation-funktionalitet byggs
före Bygg-grupp C.

---

## Sammanfattning

| # | Beslut | Typ | Rör | Byggsteg |
|---|---|---|---|---|
| A1 | Återbetalning: framåt-flöde, refund bara vid bedrägeri/fel | Ändring | M5, M1, M4, 02-Stripe | 5–7 |
| A2 | Onboarding-ordning + "kan jag samla in"-guide + fråga-väg | Ändring | M2, M6, M8 | 3 + löpande |
| A3 | Swish via Stripe bekräftad (löser 02-Stripe öppen fråga 1) | Löst | M4, M5, 02-Stripe | 5–6 |
| A4 | Test vs live — nyckel-disciplin, Code rör aldrig live-kontot | Förtydligande | Stripe-bygget, deploy | 5+ |
| A5 | BankID v1: Stripes inbyggda KYC istället för broker; BankID = senare uttag | Ändring | M6, 03-BankID | insamlar-onboarding |
| B1 | Superadmin/admin-federation, regionala admins, subdomäner | Ny | M16, M17, M3, M10 | efter 16 |
| B2 | Innehåll & FAQ, superadmin-redigerbart | Ny | M8, M16 | tidigt + C |
| — | Datamodell-flaggor så federationen inte kräver ombyggnad | Förberedande | DB / M1, M3 | nu |

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första tillägget. Återbetalningsmodell reviderad, Swish bekräftad, onboarding-tröskel, superadmin/admin-federation, innehåll & FAQ, datamodell-flaggor. |
