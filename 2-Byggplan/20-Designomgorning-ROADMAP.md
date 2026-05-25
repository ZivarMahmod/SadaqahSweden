# 20 — Designomgörning v0.2 — ROADMAP

**Datum:** 2026-05-25
**Typ:** Ingångspunkt för hela designomgörningen. Läs den här filen först.
**Källa:** `handoff-to-code/handoff v2.1/` (designstudions överlämning).

---

## Vad detta är

Designstudion (Claude Design) har levererat en omdesign — **v0.2** — av hela
Sadaqa Sweden. Det är en **designändring på den befintliga live-plattformen**,
inte ett nybygge. Hela `5-Kod/` är redan byggt, verifierat och live.

Den här filen är den enda ingångspunkten. Den säger vad som är bestämt, var
designkällan ligger, och i vilken ordning briefarna 21→25 körs.

---

## Beslut som är fattade — gäller alla briefar

Dessa är låsta. Code ska aldrig stanna och fråga om dem.

1. **URL:er ändras INTE.** Designdokumentens route-karta (`/u/[handle]`,
   `/logga-in`, `/insamlingar/[slug]`) matchar inte koden — designern kände
   inte till den befintliga strukturen. Vi behåller varje befintlig route
   (`/profil/[publicId]`, `/login`, `/insamlingar/[publicId]` osv).
   Designändringen rör **utseende och chrome**, inte adresser.

2. **Hela plattformen restylas.** Inte bara de 17 ytor designen detaljerar —
   alla ~50 sidor får det nya designsystemet och rätt chrome-läge, så appen
   hänger ihop visuellt. De 17 detaljerade ytorna byggs exakt mot studio-
   källan; övriga sidor re-skinnas via de delade komponenterna + chrome.

3. **De nya admin-sidorna byggs i goal 22.** Designens admin-sidofält listar
   sidor som inte finns idag. Utrett 2026-05-25 (se "Admin-sidorna — utrett"):
   Donatörer, Transaktioner, Community-modd och Inkommande byggs som nya
   admin-sidor — **alla på befintlig data, inga nya databasmoduler krävs**.
   Audit-rapport byggs inte (det är designens audit, bara referens för Code).

4. **Funktion och data rörs inte.** Server-actions, Supabase-queries, RLS,
   auth, Stripe- och BankID-flöden behålls oförändrade. Det som byts är
   markup, CSS-klasser, komponenter och layout. Om en omstajling skulle
   kräva att en query ändras — det är en flagga, inte ett tyst beslut.

5. **Designsystemet är redan halvvägs.** `5-Kod/app/globals.css` använder
   redan v0.2:s färger (forest/paper/ink/copper) och fonter (Spectral/
   Manrope/JetBrains). Omgörningen är en **skärpning**: runda hörn → skarpa,
   mjuka kort → kantiga, en topbar → tre chrome-lägen, magasinslayout.

6. **Grönt bygge + deploy är en del av varje goal.** Pushat ≠ deployat.
   `next build` kör ESLint och stoppar på fel — ett rött bygge gör att
   Cloudflare Workers-bygget failar och inget når live. Varje goal slutar
   med en deploy-checkpoint: `npm run build` med noll fel → push → bekräfta
   att deployen gått live. Det sista målet (25) avslutar med en
   slutkonsolidering: hela plattformen byggd, deployad och verifierad live.

7. **Kontoskapande är spärrat tills lansering.** Publik `/registrera` och
   admin visar "kommer snart" — ingen signup. Byggs in i goal 22 (F9).

---

## Utgångsläge — var plattformen står

- `5-Kod/` — Next.js 15, Supabase, Stripe, live. Steg 0–18 + härdning klara.
- Fyra route-grupper: `(public)`, `(konto)`, `(intern)`, `(auth)` + `/team`.
- **Problemet designen löser:** alla tre grupperna använder samma `<SiteNav>`.
  Admin lägger ovanpå en rad små knappar i toppen — det är det "crampade".
- Designen delar upp i tre chrome-lägen: publik topbar, insamlar-topbar, och
  admin med **sidomeny** (240px) → admin blir ett riktigt dashboard.

## Designkällan — vad Code läser

Allt ligger i `handoff-to-code/handoff v2.1/`:

| Fil | Vad |
|---|---|
| `01`–`05`*.md | Dokumentationen — översikt, designsystem, yta-för-yta, tech, audit |
| `source/studio/styles.css` | Magasinslagret (891 rader) — det som ska in i globals.css |
| `source/studio/components.jsx` | De tre chrome-lägena, AdminSidebar, BurgerDrawer, delade UI-bitar |
| `source/studio/screens-public.jsx` | Marketing, Discovery, Fundraiser, Donate, Profile, Catalog, Auth |
| `source/studio/screens-account.jsx` | Account, Wizard, Update |
| `source/studio/screens-internal.jsx` | Admin, Review, Team, Map, Community |
| `source/v2/*.html` | Varje yta som fristående render — öppna i webbläsare för referens |

Studion är **designreferens**, inte produktionskod. Code översätter JSX:en till
plattformens riktiga React/TS-komponenter mot den riktiga datan.

---

## Brief-sekvensen

Körs i ordning. En brief → Code kör → Cowork verifierar → nästa brief.
Foundation-briefen (21) måste vara klar och verifierad innan 22–25 — allt
annat bygger på dess komponenter och chrome.

| Brief | Namn | Innehåll |
|---|---|---|
| **21** | Designsystem + chrome | Magasinslagret in i globals.css, UI-primitiver skärps, tre chrome-lägen, AdminSidebar, BurgerDrawer, route-grupp-layouterna omkopplade. **Skriven — redo att köras.** |
| **22** | Maskinrum (admin) | Förkrav: fixa rött bygge (blockerande lint-fel). Admin-dashboard mot designen, alla `(intern)`-sidor in i nya chrome+sidomeny, nya sidor Donatörer + Transaktioner + Community-modd + Inkommande. F9 signup-spärr, F10 deploy-checkpoint. **Skriven — körs efter att 21 verifierats.** |
| **23** | Insamlare-ytor | `(konto)`-gruppen: Account-dashboard, Wizard, Update, konto-sidorna — ChromeInsamlare. |
| **24** | Publika kärnytor | Startsida, Insamlingar (discovery), Insamlingssida, Donera. |
| **25** | Publika övriga ytor + slutkonsolidering | Profil, Föreningar, Karta, Events/Community, Auth, FAQ, Statistik, kategori, lärd, m.fl. Avslutas med slutkonsolidering: hela plattformen byggd, grönt bygge, deployad och verifierad live. |

Briefarna 22–25 skrivs en i taget, efter att föregående körts och verifierats —
så de bygger på hur foundation faktiskt blev, inte på antaganden.

---

## Admin-sidorna — utrett 2026-05-25

Gap-analys mot DB-schemat (47 tabeller) och befintliga moduler. Slutsats:
**goal 22 kräver inga nya databasmoduler** — allt bygger på data som finns.

- **Audit-rapport** — byggs INTE som produktionssida. Det är designens egen
  audit (17 fynd) — referensmaterial för Code, inget admin-verktyg. Tas bort
  ur admin-sidofältet.
- **Donatörer / Transaktioner** — nya läs-sidor över befintliga tabeller
  (`donation`, `disputes`, `refunds`, `transfers`, `payouts`, `profiles`).
- **Community-modd** — modereringskö över befintliga `rapport`- och
  `kommentar`-tabellerna. Modereringsåtgärderna finns redan i
  `community-actions.ts` (`granskareDoljAction` m.fl.) — bara admin-sidan
  saknas. Ingen ny modul.
- **Inkommande** — team-inkorg som aggregerar inkommande från föreningar:
  organisationsansökningar (`organisation.katalog_status`) + collab-
  förfrågningar (`collab`). Allt på befintlig data.
- **Två-vägs meddelanden** med föreningar (riktig chatt) — finns ingen
  tabell för. Det vore en genuint ny modul. **Skjuts upp** — projektets
  riktning ändras och tas separat senare. Inkommande i goal 22 är en
  läs/aggregat-inkorg, inte en meddelandetråd.

---

## Hur en brief körs

1. Cowork skriver briefen som `2-Byggplan/NN-Goal-*.md`.
2. Zivar klistrar in ett kort `/goal` som pekar på briefen.
3. Claude Code kör briefen autonomt — en commit per punkt, pushar.
4. Cowork verifierar mot briefens *Klar när*-listor (litar aldrig på Code:s
   egen sammanfattning).
5. Defekter → fix-brief i samma format. Annars → nästa brief.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-25 | Roadmap skapad efter handoff v2.1. Beslut låsta, sekvens 21–25 satt. |
| 1.1 | 2026-05-25 | Admin-sidorna utredda mot DB-schemat. Audit-rapport struken. Goal 22 skriven — inga nya databasmoduler krävs. Två-vägs meddelanden uppskjutet. |
| 1.2 | 2026-05-25 | Diagnos: produktionsbygget rött (lint-fel) → inget deployat sedan M19. Deploy-disciplin tillagd (beslut 6): grönt bygge + deploy-checkpoint i varje goal, slutkonsolidering i goal 25. Signup-spärr (beslut 7) in i goal 22. |
