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

3. **De nya admin-sidorna byggs.** Designens admin-sidofält listar sidor som
   inte finns idag. Donatörer och Transaktioner byggs som riktiga listsidor.
   (Tre poster — Audit-rapport, Inkommande, Community-modd — saknar både
   mockup och definition; se "Öppna punkter" nedan.)

4. **Funktion och data rörs inte.** Server-actions, Supabase-queries, RLS,
   auth, Stripe- och BankID-flöden behålls oförändrade. Det som byts är
   markup, CSS-klasser, komponenter och layout. Om en omstajling skulle
   kräva att en query ändras — det är en flagga, inte ett tyst beslut.

5. **Designsystemet är redan halvvägs.** `5-Kod/app/globals.css` använder
   redan v0.2:s färger (forest/paper/ink/copper) och fonter (Spectral/
   Manrope/JetBrains). Omgörningen är en **skärpning**: runda hörn → skarpa,
   mjuka kort → kantiga, en topbar → tre chrome-lägen, magasinslayout.

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
| **22** | Maskinrum (admin) | Admin-dashboard mot designen, alla `(intern)`-sidor in i nya chrome+sidomeny, nya sidor Donatörer + Transaktioner. |
| **23** | Insamlare-ytor | `(konto)`-gruppen: Account-dashboard, Wizard, Update, konto-sidorna — ChromeInsamlare. |
| **24** | Publika kärnytor | Startsida, Insamlingar (discovery), Insamlingssida, Donera. |
| **25** | Publika övriga ytor | Profil, Föreningar, Karta, Events/Community, Auth, FAQ, Statistik, kategori, lärd, m.fl. |

Briefarna 22–25 skrivs en i taget, efter att föregående körts och verifierats —
så de bygger på hur foundation faktiskt blev, inte på antaganden.

---

## Öppna punkter — behöver en mening från Zivar (blockerar inte 21)

Designens admin-sidofält har tre poster utan mockup **och** utan definition.
Donatörer och Transaktioner är självklara listsidor och byggs i brief 22.
Dessa tre kan inte byggas blint:

- **Audit-rapport** — vad ska den visa? (Compliance-rapport? Ingreppsloggen
  `/admin/logg` paketerad? Stickprovsresultat?)
- **Inkommande** — en team-inkorg för vad? (Föreningsansökningar?
  Donator-frågor? Överklaganden?)
- **Community-modd** — moderering av vad, och vem får göra det?

När Zivar beskrivit dem med en mening var läggs de i en brief 26. Tills dess
visas de inte i sidofältet.

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
