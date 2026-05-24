# 12 — Goal: Steg 17 (Plattformsstyrning & federation, M18)

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Den enda ingångspunkten för den här körningen. Läs den här filen
först. Den säger vad som ska byggas, i vilken ordning, vilka beslut som redan är
fattade (så du aldrig behöver stanna och gissa), vilket schema som redan finns
reserverat, och var du ska sluta.

**Steg 17 = M18 (Plattformsstyrning & federation).** Den här briefen löser in hela
detaljplanen i `11-Steg-17-federation-utkast.md` (avsnitt A–K) och hela modulen
`../1-Planering/Modul-18-Plattformsstyrning-och-federation.md` (Block 1–7) i en
körbar order. Säger modultexten och den här briefen olika — **briefen vinner**
(den är nyare och har Zivars senaste beslut).

---

## Utgångsläge — var projektet står

- **Steg 0–16 är byggda, verifierade och pushade.** Bekräfta mot `git log`.
- **Härdningspasset H1–H5 är klart** (`10-Goal-Hardning.md`) — migrationer
  0035–0040. Riktig 2FA via Supabase MFA/AAL2 finns för team-konton. Första
  admin-kontot är bootstrappat: `admin@corevo.se` har roll `admin`;
  `zivar.mahmod@corevo.se` är orört `insamlare`.
- **Den här körningen = Steg 17.** Det sista stora byggsteget med logik —
  federationen. Efter den återstår bara Steg 18 (innehåll & FAQ).
- **Schemat för federationen är redan reserverat** (migration 0024). Du bygger
  *logiken* ovanpå befintliga kolumner — du skapar dem inte på nytt. Se avsnittet
  **"Reserverat schema"** nedan.
- `5-Kod/SESSION-GOAL.md` är den aktuella statusfilen — uppdatera den för den här
  körningen. Ignorera ev. `../SESSION-GOAL.md` i projektroten.

---

## Uppdraget

Bygg **F1–F10** nedan, i ordning. Verifiera varje punkt, commita och pusha till
`main` innan nästa (en commit per F-punkt, `feat(f1)`…`feat(f10)`).

**F1 är fundamentet** — admin-nivåerna och den region-scopade RLS:en. Allt annat
vilar på den. Gör F1 ordentligt; den är säkerhetskritisk.

**Sluta efter F10.** Uppdatera `SESSION-GOAL.md`, sammanfatta körningen, starta
INTE Steg 18 (innehåll & FAQ). Kommer du inte hela vägen — varje F-punkt du rört
ska vara på riktigt klar (Klar när-listan grön, pushad). Hellre sju solida
punkter än tio halvbyggda.

---

## Autonomi-regler — så jobbar du i den här körningen

Samma som `09-Goal-Steg-12-16.md` och `10`. Zivar är inte med:

- **Du fattar alla tekniska val själv.** Tabellnamn, RPC-struktur, hur en
  RLS-policy skrivs, komponentstruktur, UI-detaljer — ditt beslut. Fråga aldrig.
- **Allt görs via kod / migration / API / CLI.** Du går aldrig in i någon
  dashboard manuellt.
- **Du routar aldrig rutinbeslut till Zivar.** M18:s öppna frågor är besvarade
  nedan med riktmärken — använd dem. Är något ändå oklart: välj det enklaste
  alternativet som uppfyller modulens krav, notera valet i `SESSION-GOAL.md`,
  gå vidare.
- **De få sakerna som faktiskt kräver Zivar** är samlade sist ("Batchade
  uppföljningar") — de blockerar inte bygget och du ska inte vänta på dem.

Allt annat gäller som vanligt: databasändringar bara via **numrerade, idempotenta
migrationer med rollback** (federationen rör säkerhetsmodellen — destruktiva steg
ska gå att ångra), **RLS på varje ny tabell**, följ `../Supabase/SAKERHETSREGLER.md`
till punkt och pricka, **Security Advisor grön före push**, test där det rör
behörighet och region-scope, `npm run build` grön före push.

---

## Beslut som redan är fattade — stanna inte för dessa

Modulerna M17/M18 och detaljplan 11 har punkter som behöver låsas. Här är de
avgjorda. Säger en modultext och det här avsnittet olika — **det här vinner.**

### 1. Subdomän-namnen — `admin.sadaqahsweden.se`

Tre domäner: `sadaqahsweden.se` (publik), `admin.sadaqahsweden.se`,
`superadmin.sadaqahsweden.se`. **Båda admin-subdomänerna finns redan som custom
domains i Cloudflare** (skapade 2026-05-24). Detaljplan 11 skrev `regionaladmin.`,
men infrastrukturen och M18 Block 7.4 säger `admin.` — **`admin.` gäller.** De
två admin-subdomänerna delar **samma landningssida vid inloggning** — det är en
och samma admin-yta; rollen styr vilka funktioner som visas, inte utseendet.

### 2. Team-modellen — ett konto, pausbar roll (skriver om M17)

M17 Block 1 + 1.4 och M18 Block 1.4 säger "team-konto skilt från privat konto
(två konton)". **Det är överspelat.** Zivars nyare modell (detaljplan 11 E):

> **En person = ett konto.** Vill en region-medhjälpare (eller region-admin)
> driva en egen insamling: deras **team-roll pausas** under tiden — de agerar då
> som vanlig insamlare, utan åtkomst till regionens verktyg. När insamlingen är
> klar **återupptas** rollen. Kontot raderas aldrig.

Detta gäller hela kedjan (region-admin + medhjälpare). Bygg det enligt **F7**.
M17/M18:s två-konto-text ska inte byggas.

### 3. BankID — inte ett krav i v1 (senare uttag)

M18 Block 4.2 säger "BankID obligatoriskt för alla i kedjan". **Det är
överspelat** av Tillägg A5 + detaljplan 11 beslut 3: **ingen BankID-broker i v1.**
Identitetssäkringen för en region-admin i v1 är: superadminens personliga
onboarding + upplärning + förenings-inlogg + emblem (F4–F5) + **obligatorisk 2FA**
(F8). BankID-kravet aktiveras först när BankID-uttaget byggs — bygg inget
BankID-flöde nu, och blockera ingenting på det.

### 4. Följa/flöde — PARKERAT, M13 lämnas orörd

Detaljplan 11 K + beslut 1: följa-funktion och flöde **byggs inte.** Rör inte
M13 (Community). Se "Bygg INTE" nedan.

### 5. Roll-nivå läses via en `private.`-hjälpare — ingen JWT-hook

M18 Block 7.3 föreslår `app_metadata`/JWT-claims för roll-nivå. Plattformen har
**ingen** Custom Access Token Hook idag — `roll` läses via `private.aktuell_roll()`
(SECURITY DEFINER, läser `profiles`). Federationsfälten (`admin_niva`,
`admin_region_kod`) är redan skyddade av `profiles_skydda_falt`-triggern (en
användare kan inte sätta dem själv). **Följ det befintliga mönstret:** bygg
`private.aktuell_admin_niva()` och `private.aktuell_region_kod()` på exakt samma
sätt som `aktuell_roll()`. Det uppfyller M18 7.3:s säkerhetsintention (ingen
självskriven behörighet) utan att uppfinna en JWT-hook. Bygg ingen JWT-hook.

### 6. M18:s öppna frågor — riktmärken

- **Antal medhjälpare per region:** ingen hård gräns i koden. Riktmärke 2–5,
  ej framtvingat tekniskt.
- **Tröskel "stor/känslig insamling"** som utlöser andra-granskning: använd
  M3 Block 4:s riktmärke **500 000 kr** i målbelopp + manuell "känslig"-flagga
  som en granskare kan sätta.
- **Definition av jäv** ("närstående"/"intresse"): ärvs från M8 — bygg
  mekaniken (markera jäv → ärendet lyfts ur kön), inte en egen definition.
- **Beredskaps-superadmin:** schemat ska tillåta att fler än ett konto har
  `admin_niva='superadmin'`. Vem det blir är en föreningsfråga — batchad.

---

## Reserverat schema som redan finns — bygg vidare på det, duplicera inte

Migration 0024 reserverade federationens datamodell. **Skapa inte dessa på nytt.**
Du bygger logiken ovanpå:

| Finns redan | Var | Vad det är |
|---|---|---|
| `profiles.admin_niva` | text, CHECK NULL eller `'superadmin'`/`'region_admin'`/`'medhjalpare'` | Admin-nivån. **Använd exakt dessa enum-strängar.** |
| `profiles.admin_region_kod` | text, FK → `plats_taxonomi(kod)` | Regionen (länet) en region-admin/medhjälpare ansvarar för. |
| `granskning.region_kod` | text, FK → `plats_taxonomi(kod)`, indexerad | Granskningens region. **Fylls redan automatiskt** av triggern `granskning_satt_region_kod` från `insamling.insamlar_lan_kod` vid INSERT. |
| `insamling.insamlar_region` + `insamlar_lan_kod` | text | Insamlingens region, normaliserad av trigger sedan Steg 12. |
| `profiles_skydda_falt`-triggern | `private`-schema | Blockerar redan att en användare själv ändrar `admin_niva` / `admin_region_kod`. Rör den inte — den fungerar. |

**Roll-modellen:** federationen uppfinner **inga nya `anvandar_roll`-värden.**
Den lägger en nivå-dimension ovanpå dagens roll (M18 Block 1.2):

| Nivå | `roll` | `admin_niva` | `admin_region_kod` |
|---|---|---|---|
| Superadmin | `admin` | `superadmin` | NULL (hela Sverige) |
| Region-admin | `admin` | `region_admin` | en läns-kod |
| Region-medhjälpare | `granskare` | `medhjalpare` | en läns-kod |
| Nationellt team (dagens bröder) | `admin`/`granskare` | NULL | NULL |

**`admin_niva IS NULL` på ett team-konto = nationellt scope** (ser alla regioner,
precis som idag). Det får inte bli en regression — dagens team måste fortsätta
fungera oförändrat efter den här körningen.

---

## F1 — Admin-nivåer & region-scopad RLS (fundamentet)

**🔴 Säkerhetskritisk. Den viktigaste punkten i körningen.**

**Mål:** De tre nivåerna (superadmin / region-admin / medhjälpare) finns på
riktigt, och RLS isolerar regioner från varandra på databasnivå.

**Plan-referens:** M18 Block 1, Block 7; detaljplan 11 B–C.

**Bygg:**

- En numrerad migration som ger plattformens första superadmin: sätt
  `admin_niva='superadmin'` på `admin@corevo.se` (kontot fick `roll='admin'` i
  H5, men H5 satte aldrig `admin_niva` — detaljplan 11 C antog det; det stämmer
  inte, gör det här). Sätts i `service_role`/SECURITY DEFINER-kontext så
  `profiles_skydda_falt` släpper igenom. Rör inte `zivar.mahmod@corevo.se`.
- `private.aktuell_admin_niva()` och `private.aktuell_region_kod()` — SECURITY
  DEFINER, `search_path=''`, samma mönster som `private.aktuell_roll()`.
- **RLS-scope-policys.** En region-admin/medhjälpare ser bara sin regions data;
  superadmin (och nationellt team med `admin_niva IS NULL`) ser allt. Mönstret:
  matcha `granskning.region_kod` (resp. `insamling.insamlar_lan_kod`) mot
  `private.aktuell_region_kod()`. Följ `SAKERHETSREGLER.md`: explicit `TO`-roll,
  `(select …)`-wrappade anrop, index på varje policy-refererad kolumn
  (`granskning.region_kod` är redan indexerad — verifiera, lägg index där det
  saknas).
- **Befogenhetssteget** (M18 Block 1.3) hårdkodat i RLS + RPC-guards:
  pengaingrepp (refund, permanent nedstängning) och utse/avsätta region-admin är
  **endast superadmin**; region-admin får pausa, granska, hantera medhjälpare i
  egen region; medhjälpare granskar i egen region men utser ingen.
- RPC:er för superadmin att skapa/ändra en region-admins nivå + region-kod
  (`admin_niva` + `admin_region_kod`). Kräver `aal2` + `superadmin`.

**Klar när:**
- [ ] `admin@corevo.se` har `admin_niva='superadmin'`, satt via numrerad migration.
- [ ] En region-scopad användare kan via RLS **inte** läsa en annan regions
      insamlingar/granskningar — bevisat med test, inte UI-döljning.
- [ ] Superadmin och nationellt team (`admin_niva IS NULL`) ser allt — ingen
      regression mot dagens granskningsflöde.
- [ ] Pengaingrepp och utse/avsätta region-admin går inte att nå för en
      region-admin (RLS + RPC-guard), bevisat med test.
- [ ] `npm run build` grön, Security Advisor grön, pushad.

## F2 — Distribuerad granskningskö (region-scopad)

**Mål:** En regions insamlingar granskas av den regionens admin + medhjälpare.
M3:s flöde är oförändrat — bara *vem som ser vilken kö* ändras.

**Plan-referens:** M18 Block 3; detaljplan 11 (vattenmärkning, D).

**Bygg:**

- Granskningskön filtreras på region via F1:s RLS. M3:s auto-tilldelning
  (round-robin + tillgänglighet) körs **inom regionen**.
- **Region utan region-admin → superadmins kö.** Det är utgångsläget vid
  lansering (inga län har en region-admin än). En insamling utan region eller med
  ouppslagbar region → superadmins kö. Det får aldrig finnas ett glapp där en
  insamling hamnar i ingen kö.
- **Rapportering uppåt:** superadmin ser varje regions kölängd, SLA-status och
  beslut — M16:s granskningspanel, nu filtrerbar per region + aggregerad
  nationellt. Region-admin ser bara sin egen region. Rapportering flödar uppåt,
  aldrig i sidled.
- Append-only-loggen (M3) får region-koppling via `granskning.region_kod` — den
  fylls redan av triggern; säkerställ att den syns i superadminens läs-vy.

**Klar när:**
- [ ] En inskickad insamling hamnar i sin insamlar-regions kö; superadmins kö
      fångar regioner utan region-admin och insamlingar utan region.
- [ ] Region-admin ser bara sin regions kö; superadmin ser alla regioners köer
      aggregerat.
- [ ] Test för kö-scope (rätt region ser rätt ärenden).
- [ ] `npm run build` grön, pushad.

## F3 — Skydden: jäv, andra-granskning, stickprov, överklagande-väg

**Mål:** Delegerad granskning kan inte missbrukas osynligt. M18 Block 5 byggd.

**Plan-referens:** M18 Block 5; detaljplan 11 D; `05-Byggsekvens.md` Steg 17
"Klar när".

**Bygg:**

- **Jäv.** En granskare/medhjälpare/region-admin får inte vara aktiv insamlare
  samtidigt — kopplar till F7:s pausbara roll (driver de en insamling är
  team-rollen pausad). Utöver det: en granskare markerar jäv på ett enskilt
  ärende → ärendet lyfts ur kön till en jävsfri medhjälpare i regionen, annars
  till superadmin/annan region. Jäv loggas (en logg-rad i sig).
- **Andra-granskning.** Insamlingar över **500 000 kr** målbelopp, eller med en
  manuell "känslig"-flagga, kräver minst ett granskande öga **utanför regionen**
  (superadmin eller en region-admin i en annan region). Staplas ovanpå M3 Block
  4:s flergranskar-beslut, ersätter det inte.
- **Datadrivet stickprov.** M16:s per-region-statistik pekar ut avvikande
  region-admins (onormalt hög avvisningsgrad, för snabba godkännanden) för
  superadminens stickprovsgranskning. Bygg utpekningen + en stickprovsvy.
- **Överklagande-vägen** — det enda *nya flödet* M18 inför. Bygg:
  - En insamlare vars insamling `avvisad`:s av en region-admin/medhjälpare kan
    överklaga **en gång**, direkt till superadmin (aldrig tillbaka till samma
    region-admin).
  - Egen tabell med RLS, kopplad till granskningen/insamlingen.
  - Superadmin ser överklaganden i `superadmin.sadaqahsweden.se`; kan låta
    avvisningen stå eller riva upp den (ny granskning).
  - **Överklagande-vägen måste vara synlig i avvisningsbeskedet** — en osynlig
    väg är ingen väg.

**Klar när:**
- [ ] Jäv-markering lyfter ett ärende ur regionens kö och loggas.
- [ ] Stora/känsliga insamlingar kräver ett öga utanför regionen.
- [ ] Avvikande region-admins pekas ut för stickprov.
- [ ] En avvisad insamlare kan överklaga en gång till superadmin; vägen syns i
      avvisningsbeskedet; superadmin kan riva upp beslutet.
- [ ] Test för överklagande-flödet och jäv-routningen.
- [ ] `npm run build` grön, Security Advisor grön, pushad.

## F4 — Anmäl förening — flödet

**Mål:** En förening kan anmälas, granskas, och få ett eget inlogg —
och superadmin kan uppgradera en förening till region-admin.

**Plan-referens:** detaljplan 11 F; M10 (organisationer, byggd i Steg 11).

**Bygg:**

- En **"anmäl förening"-form** — inloggning krävs. Vem som helst (privatperson
  eller föreningsföreträdare) kan anmäla en förening.
- Anmälan **granskas** (återanvänd M3:s kö-koncept, lättare checklista — samma
  mönster som event-granskningen i Steg 14).
- Vid godkännande: skapa ett **eget, separat inlogg för föreningen** (en profil
  med `ar_organisation=true`) och efterfråga en **kontaktperson** så föreningen
  kan ta emot kontot. Anmälde en privatperson åt en förening behåller hen sitt
  eget konto — föreningen får sitt.
- **Att anmäla en förening gör den inte till region-admin.** Det är ett separat,
  senare steg.
- **Superadmin kan uppgradera** en förening (som har inlogg) till region-admin:
  gå in på föreningens sida → se vem/vad/hur → aktivera, dvs. sätt
  `admin_niva='region_admin'` + `admin_region_kod` (via F1:s RPC). Görs medvetet
  av superadmin, inte automatiskt.

**Klar när:**
- [ ] Inloggad användare kan anmäla en förening; anmälan hamnar i en granskningskö.
- [ ] Godkänd anmälan skapar ett separat förenings-inlogg + efterfrågar kontaktperson.
- [ ] Superadmin kan uppgradera en förening med inlogg till region-admin.
- [ ] RLS på alla nya tabeller; test för anmäl→granska→inlogg-kedjan.
- [ ] `npm run build` grön, pushad.

## F5 — Regional föreningsprofil & emblem

**Mål:** En förening som driver en region syns som verifierad samarbetspartner.

**Plan-referens:** detaljplan 11 G; M10.

**Bygg:**

- En förening som är aktiverad som region-admin (`admin_niva='region_admin'`)
  visas i **förenings-fliken** (M10:s katalogvy) med ett **emblem** — verifierad
  + godkänd samarbetspartner till Sadaqah-teamet.
- Riktmärke: härled emblemet från `admin_niva='region_admin'` på
  förenings-profilen så det inte blir ett fält som kan glömmas bort. Behöver du
  en explicit flagga — ditt val, men håll det enkelt.

**Klar när:**
- [ ] En region-admin-förening visas med emblem i förenings-fliken; en vanlig
      förening gör det inte.
- [ ] `npm run build` grön, pushad.

## F6 — Subdomäner & inloggning

**Mål:** Tre domäner, ren uppdelning av ytan — RLS är säkerhetsgränsen, inte
subdomänen.

**Plan-referens:** detaljplan 11 A; M18 Block 7.4.

**Bygg:**

- `admin.sadaqahsweden.se` och `superadmin.sadaqahsweden.se` — host-baserad
  routning i `middleware.ts` (den har ingen host-logik idag). Båda finns redan
  som Cloudflare custom domains; du bygger bara routningen i koden.
- **De två admin-subdomänerna delar samma landningssida vid inloggning.** Efter
  inloggning avgör `admin_niva` vilka funktioner som visas: superadmin → hela
  Sverige; region-admin/medhjälpare → egen region. Det är M17:s rollmedvetna
  arbetsyta, federerad — bygg inte två separata UI:n.
- **Den publika sidan (`sadaqahsweden.se`) har inga admin-knappar** — en besökare
  ser aldrig en intern ingång.
- **Subdomänen är en ingång, inte säkerhetsgränsen.** En region-admin som på
  något sätt nådde superadmin-subdomänen ser ändå bara sin region — F1:s RLS
  släpper inte mer. Säkerhet i djupet.
- AAL2-enforcement (från H1) gäller även de nya subdomänerna.

**Klar när:**
- [ ] De två admin-subdomänerna leder till samma inloggning; `admin_niva` styr
      vad som visas efteråt.
- [ ] Publika sidan exponerar ingen admin-ingång.
- [ ] En region-admin på superadmin-subdomänen ser fortfarande bara sin region.
- [ ] `npm run build` grön, pushad.

## F7 — Team-roll som kan pausas (skriver om M17)

**Mål:** En person = ett konto. Team-rollen kan pausas och återupptas.

**Plan-referens:** detaljplan 11 E; ersätter M17 Block 1 + 1.4.

**Bygg:**

- Ett team-konto (granskare, medhjälpare, region-admin) som vill driva en egen
  insamling: **team-rollen pausas.** Personen agerar då som vanlig insamlare,
  utan åtkomst till regionens/teamets verktyg.
- När insamlingen är avslutad **återupptas** rollen. Kontot raderas aldrig,
  insamlingen lever kvar.
- Mekaniken: ett pausat tillstånd på team-rollen (ditt val på hur — t.ex. ett
  `team_roll_pausad`-fält eller en paus-tidsstämpel). Pausad roll → `aktuell_roll()`
  och `aktuell_admin_niva()` behandlar kontot som `insamlare` tills återupptaget.
- Detta ersätter M17:s "två konton"-modell helt. Bygg inte två-konto-flödet.

**Klar när:**
- [ ] Ett team-konto kan pausa sin team-roll, driva en insamling som vanlig
      insamlare, och återuppta rollen — utan att tappa konto eller historik.
- [ ] Under paus når kontot inga team-/region-verktyg (RLS bevisar det).
- [ ] Test för paus → insamlare → återuppta.
- [ ] `npm run build` grön, pushad.

## F8 — 2FA obligatoriskt för alla konton

**Mål:** Varje konto som loggar in skyddas av 2FA — inte bara team-konton.

**Plan-referens:** detaljplan 11 I; bygger vidare på H1 (Supabase MFA/AAL2).

**Bygg:**

- Utöka H1:s Supabase MFA/AAL2-enforcement från team-konton till **alla
  inloggade konton** — även insamlare och förenings-konton.
- En insamlare måste enrolla TOTP (vid registrering/första inloggning) och
  challenge:as vid varje ny session. Insamlarens egna kontohandlingar (skapa/
  redigera insamling, starta Stripe-onboarding, profil) gateas bakom `aal2` —
  samma mönster som de interna routsen redan har.
- **Gäst-donatorer berörs inte** — de har inget konto. Den inloggningsfria
  donationen och publik surfning ska fungera exakt som förut. Rör inte
  donationsflödet.
- Återställningsvägen från H1 (admin nollställer MFA-faktor) ska gälla även
  insamlar-konton.

**Klar när:**
- [ ] En insamlare kan inte nå sina kontohandlingar utan giltig 2FA.
- [ ] Gäst-donation och publik surfning opåverkade — bevisat.
- [ ] En utelåst insamlare kan återställas utan databasingrepp.
- [ ] Test: insamlare lösenord-utan-kod nekas, med-kod släpps in.
- [ ] `npm run build` grön, Security Advisor grön, pushad.

## F9 — Insamlare-onboarding: synlig pending-status

**Mål:** Medan Stripe verifierar insamlaren syns en tydlig pending-status.

**Plan-referens:** detaljplan 11 H.

**Bygg:**

- Man blir fullvärdig insamlare när Stripe-kontot är godkänt + registrering är
  klar. Stripe kan ta ett par dagar — under tiden **pending-status**, synlig för
  insamlaren själv och för admin.
- Webhooken `account.updated` finns sedan Steg 5 och flippar redan status. Det
  som saknas är den **synliga** pending-statusen — härled den från
  `stripe_onboarding_klar` (false efter påbörjad onboarding) och visa den i
  insamlarens vy + i admin-vyn. Ingen ny webhook behövs.

**Klar när:**
- [ ] En insamlare mitt i Stripe-verifiering ser en tydlig pending-status; admin
      ser den också.
- [ ] När Stripe blir klar flippar statusen automatiskt (befintlig webhook).
- [ ] `npm run build` grön, pushad.

## F10 — Donationshistorik i profilen

**Mål:** En donation sparas i givarens profil — privat och anonym som default.

**Plan-referens:** detaljplan 11 J; konsekvent med M4:s anonyma givande, liten
tillbyggnad till M9-profilen.

**Bygg:**

- Efter en donation sparas den i givarens profil. **Privat och anonym som
  default.**
- Givaren kan själv välja att visa historiken öppet — och då står **bara**
  *"den här personen har gjort X donationer"*, ingen summa, inget mer.
- Gäller bara inloggade givare med konto. Gäst-donationer utan konto berörs inte.

**Klar när:**
- [ ] En inloggad givares donationer sparas i profilen, privata som default.
- [ ] Givaren kan slå på en öppen vy som bara visar antal donationer.
- [ ] RLS skyddar historiken; test för privat/öppen.
- [ ] `npm run build` grön, pushad.

---

## Bygg INTE i den här körningen

- **Följa-funktion / flöde / person-graf** (detaljplan 11 K) — parkerat. **Rör
  inte M13 (Community).**
- **BankID-flöde / broker** — senare uttag (beslut 3). Blockera ingenting på det.
- **Per-kommentar-moderering, biljetter, bönetider** m.m. — redan parkerat i
  tidigare steg, oförändrat.
- **Steg 18 (innehåll & FAQ)** — startas inte. Separat körning.
- Bygg ingen JWT/Custom-Access-Token-hook (beslut 5).

---

## Batchade uppföljningar — kräver Zivar, blockerar inte bygget

Samlade här. Inget av detta hindrar dig från att bygga F1–F10 fullt ut.

1. **DNS för subdomänerna — KLART.** `admin.sadaqahsweden.se` +
   `superadmin.sadaqahsweden.se` finns redan som Cloudflare custom domains
   (2026-05-24). Inget kvar här — F6 bygger bara host-routningen i koden.
2. **Utse riktiga region-admins.** Federationen *tänds region för region* —
   vilka moskéer/personer som blir region-admins är Zivars förtroendebeslut,
   operativt, görs efter bygget. Koden ska klara noll region-admins (allt i
   superadmins kö) — det är det normala utgångsläget.
3. **Beredskaps-superadmin.** Minst ett konto till bör ha `admin_niva='superadmin'`
   som bus-factor-skydd. Schemat tillåter det (F1) — vem det blir är en
   föreningsfråga.
4. **Kvarvarande sedan tidigare körningar** (se `SESSION-GOAL.md`):
   `RESEND_API_KEY`, team-e-post, basemap till R2, leaked password protection.

Lista det du faktiskt stöter på i `SESSION-GOAL.md` under en tydlig rubrik.

---

## När du är klar

Uppdatera `SESSION-GOAL.md` (markera F1–F10, notera vad du valde och ev. nya
uppföljningar), sammanfatta körningen, **stoppa**. Starta inte Steg 18 — det
planeras separat.

Efter den här körningen är hela byggsekvensens logik klar — bara Steg 18
(publikt innehåll & FAQ) återstår.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första goal-briefen för Steg 17 (M18 Plattformsstyrning & federation). Löser in detaljplan 11 (A–K) + M18 (Block 1–7) i F1–F10. Sex motsägelser avgjorda: subdomän-namn (`admin.sadaqahsweden.se`), team-modell (ett konto/pausbar roll, skriver om M17), BankID (ej v1-krav), följa/flöde (parkerat), roll-nivå via `private.`-hjälpare (ingen JWT-hook), M18:s öppna frågor med riktmärken. Reserverat schema från migration 0024 dokumenterat. |
