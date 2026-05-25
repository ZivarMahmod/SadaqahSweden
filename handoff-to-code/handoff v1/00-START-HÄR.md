# 00 — START HÄR (Claude Code)

Detta är ingången till designöverlämningen. **Läs hela denna fil innan du rör kod.**

Den är skriven för att ta bort varje oklarhet i hur designen i `handoff-to-code/`
ska bli kod i `../5-Kod/`. Den ersätter inte `README.md` eller `byggplan.html` —
den sätter dem i rätt ordning och rätt sammanhang.

---

## 1. Vad detta är

`handoff-to-code/` är en **design**-överlämning. Den innehåller:

- 17 statiska HTML-mockups (de 17 ytorna) + `index.html` (klickbar katalog)
- `byggplan.html` — ett 1992-raders spec-dokument (designgenomgång + arkitektur)
- `assets/style.css` (designtokens) + `assets/shared.js` (delad chrome)

Mappen är **referensmaterial**, precis som `1-Planering/` och `2-Byggplan/`.
**Du bygger aldrig i den här mappen.** All kod bor i `../5-Kod/`.

---

## 2. Viktigast: projektet är INTE tomt

Sadaqah Sweden är redan påbörjat, byggt, verifierat och **live på `sadaqahsweden.se`**.
Du ska **inte** bygga om det som finns — du ska **tillämpa designen på det** och
**fortsätta byggsekvensen** därifrån.

Status (full sanning i `../SESSION-GOAL.md`):

| Steg | Vad | Status |
|---|---|---|
| 0 | Fundament (Next.js + Cloudflare + deploy) | ✅ Klart, live |
| 1 | Databasens grund (18 tabeller, RLS, TS-typer) | ✅ Klart |
| 2 | Auth & roller | ✅ Klart |
| 3 | Insamlings-objekt + insamlar-flöde (M1, M2) | ✅ Klart |
| 4 | Granskar-flödet (M3) | ⏭️ **NÄSTA** |
| 5–16 | Stripe → donation → transparens → … → team | ⬜ Kvar |

---

## 3. "Implement: byggplan.html" är FEL instruktion

Claude Design genererade ett överlämningskommando som lyder *"Implement: byggplan.html"*.
**Följ inte det bokstavligt.**

`byggplan.html` är inte en sida att bygga. Det är ett **spec-dokument**. Behandla det
som designens facit: designgenomgång (vad som brister), arkitektur, per-route-spec,
tillståndsmatriser, integrationer. Du *läser* det — du *implementerar* det inte som en route.

---

## 4. Läsordning — gör i denna ordning

1. `../5-Kod/CLAUDE.md` — projektets regler och byggprinciper
2. `../SESSION-GOAL.md` — exakt nuläge, vad som är byggt och verifierat
3. `../2-Byggplan/05-Byggsekvens.md` — den numrerade byggordningen (master)
4. `../Supabase/SAKERHETSREGLER.md` — **icke-förhandlingsbar** databassäkerhet
5. `byggplan.html` — designgenomgång + arkitektur + per-route-spec
6. `index.html` — klickbar överblick över alla 17 ytor
7. `DESIGN-KARTA.md` (denna mapp) — vilken design-fil → vilken route → vilket steg
8. `assets/style.css` — designtokens (94 CSS-variabler)

---

## 5. Hur du arbetar — progressivt, inte allt på en gång

Designen täcker **alla 17 ytor**. Koden är vid **Steg 3**. Bygg **inte** alla
17 HTML-filer på en gång. Arbeta i tre faser:

### Fas A — Designsystemet (engångsjobb, FÖRE någon yta)

- Porta `assets/style.css` → `../5-Kod/app/globals.css` som Tailwind v4 `@theme`.
- Bygg primitiv-biblioteket (`../5-Kod/components/ui/`) enligt
  `byggplan.html` § *Primitiv-bibliotek* + bilaga B.
- Detta är fundamentet. Utan det blir varje yta ad-hoc och inkonsekvent.

### Fas B — Uppgradera redan byggda ytor till designen

Ytorna `marketing`, `auth`, `wizard`, `account`, `fundraiser` **finns redan**
som sidor i `../5-Kod/app/`. Här är jobbet **"restyla till designen + lägg
riktiga states"** — inte bygg nytt. Se status per yta i `DESIGN-KARTA.md`.

### Fas C — Fortsätt byggsekvensen från Steg 4

Bygg nya ytor med designen direkt: Steg 4 `review.html`, Steg 6 `donate.html`, osv.
Här är designen den visuella sanningen och `byggplan.html` den funktionella sanningen.

**Ett steg i taget. `npm run build` grönt + en commit per steg. Precis som hittills.**

---

## 6. Mappstruktur — BESLUTAT

Kod ligger **kolokerad** vid sin route. **Ingen `modules/`-mapp.** En moduls
sida, komponenter, server actions och logik bor i samma route-mapp i `app/`.
Delad kod → `components/` och `lib/`. Full struktur:
`../2-Byggplan/04-Repo-och-kodstruktur.md` (uppdaterad, v1.3).

Route-grupper: `(public)` / `(auth)` / `(konto)` / `(intern)`. Befintliga platta
publika routes (`app/insamlingar/`) får flyttas in i `(public)` som billig
städning — ingen URL ändras.

**Modul-stämpel — obligatorisk.** Varje route-fil (`page.tsx`, `actions.ts`) får
en stämpel högst upp så modulen syns direkt:

```
// Modul M3 — Granskar-flödet
// Design: handoff-to-code/review.html · Regler: 1-Planering/Modul-03-Granskar-flodet.md
```

Spårbarheten modul ↔ kod sitter i route-namn + stämpel + `DESIGN-KARTA.md` —
inte i en mapp.

> Ser du andra krockar mellan design och plan — **flagga, bygg inte runt tyst.**

---

## 7. Säkerhet — hård grind, gäller varje yta du rör

Design-HTML:en är mockups. Den visar **inga riktiga states och inga riktiga
behörigheter**. När den blir kod gäller `../Supabase/SAKERHETSREGLER.md` fullt ut.

**Innan du commitar en yta:**

- **RLS på varje ny/ändrad tabell**, i samma migration. Ingen tabell utan RLS.
- **`service_role`-nyckeln bara serverside** — aldrig i klient, webbläsare eller git.
  Klienten får bara anon/publishable-nyckeln.
- **Inga hemligheter i klartext** — inte i kod, inte i git, inte i en DB-kolumn.
  Vault eller serverside-miljövariabler.
- **Klienten är aldrig sanning** för pengar, status eller roll:
  - Donationsbelopp → `PaymentIntent` skapas **serverside**. Klienten sätter inte pris.
  - Insamlingsstatus → tillståndsmaskin i DB. Klienten kan inte sätta status fritt.
  - Roll/behörighet → `app_metadata` + RLS. **Aldrig `user_metadata`** i en policy.
- **Lösenord & PII** — aldrig i klartext. HIBP-skydd på. Känsliga filer
  (utbetalningsbevis, verifieringsdokument) i **privat bucket** med signerade URL:er.
- **Webhooks = sanningen för pengar.** Signaturverifierade, idempotenta.
- **Security Advisor grön** (alla P0-lints) innan push.

Frontend-kontroller är UX. **Säkerheten sitter i databasen.** Säkerhets-touchpoints
per yta finns i `DESIGN-KARTA.md`.

---

## 8. Funktionell fullständighet — designen är skiss, inte facit

Design-HTML:en är en klickbar mockup med **medvetet begränsad interaktivitet** —
designern byggde den för att visa känsla och grund, inte fungerande logik.
Exempel: föreningskatalogen (`catalog.html`) visar stadschips ("Stockholm 12")
men de går inte att klicka i mockupen.

**Regel: en kontroll som syns i designen ska FUNGERA på riktigt i koden.**
Filter, flikar, sökfält, sliders, knappar, paginering, länkar — bygg dem
funktionella och kopplade till riktig data. En död/dekorativ kontroll får aldrig
shippas. Måste något skjutas upp — skriv `// TODO (Mn): …` med skäl, så det är
synligt, inte tyst tappat.

**Visuell sanning vs funktionell sanning:**

- Designen (HTML) = hur ytan ser ut och känns.
- `byggplan.html` + modul-dokumentet `1-Planering/Modul-XX-….md` = vad ytan ska GÖRA.
- Krockar de → modul-dokumentet vinner för funktion, designen vinner för utseende.

**Tunna ytor — läs modul-dokumentet.** `byggplan.html` är djup på fyra flöden
(insamlingssidan, donator, wizard, granskning). För `catalog`, `map`, `community`,
`profile`, `account`, `admin` och `team` ger `byggplan.html` bara en rad i
"Övriga routes". Där är **modul-dokumentet i `1-Planering/` den fulla
funktions-spec:en** — bygg inte de ytorna från enbart mockup + en rad.

**Placeholder-data** ("36 föreningar", "8,4 mkr", stadssiffror) är påhittat.
Riktiga siffror kommer från DB-queries. Vid tom databas → bygg empty state,
visa aldrig falska siffror.

---

## 9. Frågor

- **Designfrågor** (saknad yta, oklar interaktion) → backa till designern (Claude Design-chatten).
- **Plan/bygg-frågor** → följ `../2-Byggplan/`. Avvik aldrig tyst — flagga först.

---

*Skapad som komplement till designöverlämningen, 2026-05-23. Tar bort oklarheter
mellan design, plan och befintlig kod.*
