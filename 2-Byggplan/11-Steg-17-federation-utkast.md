# 11 — Steg 17: admin, roller & federation — detaljplan

**Datum:** 2026-05-24 (uppdaterad v2.0)
**Vad detta är:** Detaljplanen för hur admin, roller och federationen ska
fungera — byggd på Zivars genomgång 2026-05-24. Blir underlaget till goal-briefen
för Steg 17. Rör flera moduler: M18 (federation), M17 (team), M16 (admin),
M10 (föreningar), M9 (profil), M6 (roller/2FA), M13 (community).

**Status:** De flesta punkter är beslutade av Zivar. De som fortfarande behöver
hans beslut är samlade sist under **"Beslut som behöver dig"**.

---

## A. Domäner & inloggning

- Tre domäner: `sadaqahsweden.se` (publik), `regionaladmin.sadaqahsweden.se`,
  `superadmin.sadaqahsweden.se`.
- De **två admin-subdomänerna delar samma landningssida vid inloggning** — det är
  *en och samma* admin-yta. Skillnaden är vilka **funktioner** som visas, inte
  utseendet. Rollen styr.
- Publika sidan har inga admin-knappar — en besökare ser aldrig interna ingångar.

## B. Admin-nivåer

| Nivå | Får göra |
|---|---|
| **Superadmin** (Zivar) | Allt. Plus det extra: skapa regioner, skapa och aktivera regionala admins, gå in på en förenings sida och uppgradera den. |
| **Regional admin** | Nästan allt en superadmin kan — fast för sin egen region. Får **inte** skapa fler regionala admins. |
| **Region-hjälpare** (granskare) | Hjälper sin regions admin med granskning. Riktmärke 3–4 "bröder" per region. |

## C. Hur konton skapas

- **Superadmin** sätts direkt i databasen (görs i härdningens H5).
- **Regionala admins** skapas av superadmin — Zivar "beställer" ett konto åt
  personen och väljer kontotyp/roll när han skapar det.
- **Region-hjälpare** kan skapas av superadmin *eller* av regionens egen admin.
- Varje region har ett **huvud-admin-konto som är föreningens**, plus
  hjälpar-konton.

## D. Jäv & spårbarhet

- En granskare/region-hjälpare får **inte samtidigt vara aktiv insamlare** — risk
  för partiska godkännanden.
- **Vattenmärkning:** varje godkännande loggas med tid, person och alla detaljer,
  oföränderligt — går inte att fuska med. *(Finns redan — M3:s granskning har en
  append-only-logg. Federationen lägger på region-koppling.)*
- **Jäv-regel:** vill en granskare i en region driva en egen insamling får
  regionens *andra* granskare **inte** godkänna den — regionens ansvariga admin
  måste göra det, vattenmärkt. Håller det rent från korruptionsanklagelser.

## E. Team-roll som kan pausas  ⚠️ reviderar M17

- En person = **ett konto**. Inte två separata konton.
- Vill en region-hjälpare driva en egen insamling: deras **team-roll pausas**
  under tiden. De agerar då som vanlig insamlare, utan åtkomst till regionens
  verktyg.
- När insamlingen är klar **återupptas** team-rollen. Kontot raderas aldrig,
  insamlingen lever kvar.
- *Detta ändrar M17 Block 1, som sa "team-konto skilt från privat konto (två
  konton)". Zivars nyare modell — ett konto, pausbar roll — är renare. M17 måste
  skrivas om.*

## F. Anmäl förening — flödet

1. Någon (privatperson eller föreningsföreträdare) anmäler en förening —
   inloggning krävs.
2. Anmälan **granskas**.
3. Vid godkännande skapas ett **eget, separat inlogg för föreningen**, och en
   **kontaktperson** efterfrågas så föreningen kan ta emot kontot.
4. Anmälde en privatperson åt en förening behåller hen sitt eget konto —
   föreningen får sitt. Två inlogg som skiljer person från förening.
5. **Att anmäla en förening gör den inte till regional admin.** Separat, senare
   steg.
6. Superadmin kan **uppgradera** en förening (som har inlogg) till regional
   admin: gå in på föreningens sida, se vem/vad/hur, aktivera. Sker först när
   Zivar vet att de fått info + upplärning, och att automatisk granskning ligger
   på dem.

## G. Regional föreningsprofil & emblem

- En förening som driver en region syns i **förenings-fliken** med ett **emblem**
  — verifierad + godkänd samarbetspartner till Sadaqah-teamet.

## H. Insamlare-onboarding — Stripe-callback

- Man blir insamlare när **Stripe-kontot är godkänt** + man har registrerat sig.
- Stripe kan ta ett par dagar — under tiden har personen **pending-status**,
  synlig för henne och för admin.
- En **callback (webhook) från Stripe** flippar status pending → godkänd när
  Stripe är klar. *(Webhooken `account.updated` finns redan sedan Steg 5 —
  behöver bara den synliga pending-statusen.)*

## I. 2FA obligatoriskt

- 2FA är **obligatoriskt för alla konton** (alla som loggar in — insamlare och
  team). Gäst-donatorer berörs inte; de har inget konto.
- *(Liten flagga: obligatorisk 2FA på varje insamlare lägger ett extra moment i
  deras onboarding. Värt att veta — annars helt ok.)*

## J. Donationshistorik i profilen

- Efter en donation sparas den i givarens profil — **privat och anonym** som
  default.
- Givaren kan själv välja att visa den öppet — och då står bara *"den här
  personen har gjort X donationer"*, inget mer.
- Skäl: man skryter inte om sadaqah. Aggregerad, anonym statistik är ändå
  värdefull för att förstå plattformen.
- *(Konsekvent med M4:s anonyma givande. Liten tillbyggnad till M9-profilen.)*

## K. Följa & flöde — PARKERAD (beslut 2026-05-24)

- **Beslut:** byggs **inte nu**. M13 (Community) står kvar som den är — ingen
  följa-funktion, inget flöde — tills funktionen faktiskt efterfrågas.
- **Framtida riktning, om den läggs till:** den mjuka varianten — man kan följa
  en *insamling man donerat till* för att se hur det går. Aldrig en person-graf,
  aldrig ett Facebook-flöde.
- **Hård regel oavsett:** ytan ska vara enkel, stilren och samlad — inget
  överdrivet klickande eller letande. Krocken med M13 hanteras genom att skjuta
  upp funktionen, inte genom att riva M13.

---

## Beslut fattade 2026-05-24

1. **Följa/flöde — parkerad.** Byggs inte nu (se avsnitt K). M13 lämnas orörd.
2. **Team-roll-paus (avsnitt E) — bekräftad.** Ett konto, pausbar roll. Ersätter
   M17:s två-konto-modell. M17 skrivs om.
3. **BankID — senare uttag.** v1 verifierar regionala admins via superadminens
   personliga onboarding + upplärning + förenings-inlogg + emblem. BankID-kravet
   (Tillägg B1) aktiveras först när BankID-uttaget byggs.

---

## Att göra när Steg 17 ska byggas

- Skriv om M17 (team) enligt avsnitt E — pausbar team-roll.
- M13 (community) lämnas orörd — följa/flöde är parkerat.
- Lös in hela den här planen i en goal-brief för Steg 17 (efter härdningen).

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | F1–F4 fångade från första bollplanket. |
| 2.0 | 2026-05-24 | Full detaljplan från Zivars genomgång: domäner, admin-nivåer, kontoskapande, jäv & spårbarhet, pausbar team-roll, anmäl-förening-flödet, emblem, Stripe-callback, 2FA, donationshistorik, följa/flöde-krocken. |
| 2.1 | 2026-05-24 | Besluten fattade: följa/flöde parkerat, team-roll-paus bekräftad, BankID = senare uttag. |
