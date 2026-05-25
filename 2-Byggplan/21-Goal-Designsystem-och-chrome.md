# 21 — Goal: Designsystem v0.2 + tre chrome-lägen (foundation)

**Datum:** 2026-05-25
**Typ:** Autonom byggorder för Claude Code — körs via /goal.
**Vad detta är:** Den enda ingångspunkten för körningen. Läs den här filen
först, sedan `20-Designomgorning-ROADMAP.md` för helheten.

---

## Utgångsläge — var projektet står

Plattformen `5-Kod/` är live och färdigbyggd (Steg 0–18 + härdning). Den här
briefen är **brief 1 av 5** i designomgörningen v0.2 — foundation som alla
övriga bygger på. Inga ytor (sidor) byggs om i den här briefen; den levererar
designsystemet, de delade komponenterna och de tre chrome-lägena.

**Nuläget som ska ändras:**
- `app/globals.css` har redan v0.2:s färg- och font-tokens, men runda hörn
  (`--radius-xl: 20px`, knappar `--radius-pill`), mjuka kort.
- Alla tre route-grupperna (`(public)`, `(konto)`, `(intern)`) + `/team`
  använder samma `components/layout/site-nav.tsx`. Admin saknar sidomeny.

**Designkällan:** `handoff-to-code/handoff v2.1/source/studio/` —
`styles.css` (magasinslagret) och `components.jsx` (chrome + UI-bitar).
`02-Designsystem.md` och `05-Audit-fynd.md` (fynd G-01, G-02) i samma mapp
är spec. Studion är referens — översätt till riktig React/TS.

## Uppdraget

Skärp designsystemet till magasins-v0.2 och dela upp den enda topbaren i tre
chrome-lägen, utan att röra någon sidas funktion eller data. Efter den här
körningen ska varje sida i appen automatiskt plocka upp den skarpa stilen via
de delade komponenterna och rätt chrome — även innan ytorna byggs om i sina
egna briefar.

## Autonomi-regler

- Code fattar **alla tekniska val själv** — fråga aldrig droppvis.
- Allt via **kod** — aldrig en dashboard manuellt.
- **En commit per punkt** (F1…F5); verifiera + pusha före nästa.
- Inga databasändringar i den här briefen. Om något verkar kräva det — stanna
  och flagga, det är fel i briefen.
- `npm run build` grön + Security Advisor grön före varje push.
- Ingen route, ingen server-action, ingen Supabase-query, ingen RLS-policy
  ändras. Bara markup, CSS, komponenter, layout.
- Genuint mänskliga steg batchas — Code väntar aldrig på dem.

## Beslut som redan är fattade — stanna inte för dessa

1. **URL:er ändras inte.** Se ROADMAP-beslut 1.
2. **Skarpt vinner.** Där `styles.css` (magasin) och nuvarande `globals.css`
   krockar — magasinslagret är auktoritativt. Knappar blir skarpa (~4px), inte
   pill. Kort blir kantiga. Taggar 2px. `styles.css` portas troget.
3. **API:t på UI-primitiverna är fryst.** `components/ui/*` får nytt utseende
   men **identiska props/exports** — annars går ~50 importerande sidor sönder.
   Bara det renderade utseendet ändras.
4. **Server-logiken i `site-nav.tsx` behålls.** Den läser roll/host serverside
   (`aktuellAnvandare`, `aktuellHostTyp`, notis-count). Logiken flyttar med —
   bara markup/stil byts.
5. **`(auth)`-layouten behålls strukturellt.** Den är redan en split-screen
   brand-layout som matchar designens Auth-yta. Den får skarp-radie-polish i
   F2 via primitiverna, men ingen omstrukturering här.
6. **AdminSidebar wire:as mot de admin-routes som finns idag.** Nya admin-
   sidor (Donatörer, Transaktioner) kommer i brief 22 — sidofältet byggs så
   att poster läggs till utan att komponenten skrivs om. Inga döda länkar.

---

## Steg 0 — synka arbetskopian

Före F1: `git status` ren mot HEAD. Läs `app/globals.css`, `app/layout.tsx`,
de fyra route-grupp-layouterna, `components/layout/site-nav.tsx` och hela
`components/ui/`. Läs designkällan: `handoff v2.1/source/studio/styles.css`
och `components.jsx`. Bekräfta att fonterna redan laddas i `app/layout.tsx`
(Spectral/Manrope/JetBrains via next/font) — de ska inte röras.

---

## F1 — Magasinslagret in i globals.css

**Mål:** `globals.css` bär hela v0.2-magasinsystemet — skarpa radier,
`.mag-*`-klasserna, editorial-bitarna, magasins-griden.

**Krav/Bygg:**
- Porta `handoff v2.1/source/studio/styles.css` magasinslager in i
  `app/globals.css`. Hoppa över det som är rent studio-chrome (studio-sidebar,
  stage-meta, tweaks) — det hör inte hemma i produktion. Porta:
  designsystem-tokens, chrome-CSS, magasins-grid/containers, `.mag-*`-
  komponentklasser, editorial (drop-cap, pull-quote, hairline-divider),
  animations-primitiv.
- **Radier:** lägg till den skarpa skalan `--sr-0:0 --sr-1:2px --sr-2:4px
  --sr-3:6px --sr-4:10px`. Mappa om de befintliga `--radius-xs…2xl` till den
  skarpa skalan (inget hörn > 10px) så att gamla klassanvändningar skärps
  automatiskt. `--radius-pill` behålls bara för äkta pill-former (progress-
  spår, dot-indikatorer).
- Behåll alla befintliga färg-, font- och shadow-tokens — de är redan v0.2.
- CSS:en ska fungera med Tailwind v4 (`@import "tailwindcss"` + `@theme`).

**Klar när:**
- [ ] `globals.css` innehåller `--sr-0…--sr-4` och magasins-griden
      (`.mag`, `.mag-col-*`, `.mag-container*`).
- [ ] `.mag-eyebrow`, `.mag-btn`, `.mag-card`, `.mag-tag`, `.mag-display`,
      `.mag-h1`/`h2`/`h3`, drop-cap- och pull-quote-klasser finns.
- [ ] Inget radie-token > 10px utom `--radius-pill`.
- [ ] Inget studio-only-chrome (studio-sidebar/stage-meta/tweaks) portat.
- [ ] `npm run build` grön.

## F2 — UI-primitiverna skärpta, API:t oförändrat

**Mål:** Varje komponent i `components/ui/` renderar magasins-skarp stil;
inga prop-signaturer ändrade.

**Krav/Bygg:**
- Gå igenom `components/ui/`: `button.tsx`, `card.tsx`, `pill.tsx`,
  `progress.tsx`, `field.tsx`, `container.tsx`, `icon.tsx`, `alert.tsx`,
  `empty-state.tsx`, `insamling-card.tsx`. Uppdatera utseendet till v0.2:
  - `button` → skarp ~4px radie (inte pill), magasins-vikter.
  - `card` → kantig, `--sr-2`/`--sr-3`, magasins-shadow.
  - `pill` → magasins-tag-stil (22px, 2px radie).
  - Övriga → skarpa radier, magasins-typografi.
- **Frys API:t:** samma exporterade namn, samma props, samma varianter. En
  `grep` på importerna efteråt ska visa noll trasiga anrop. Om en sida idag
  skickar en variant som inte längre passar designen — behåll varianten,
  styla den, ändra inte anropet.
- Referens: `styles.css` §"Buttons (sharper)", §"Cards (squared)",
  §"Tag — squared" och `components.jsx` (`Btn`, `Tag`, `ProgressBar`, `Photo`).

**Klar när:**
- [ ] Alla 10 primitiver renderar v0.2-skarp stil.
- [ ] Inga prop-/export-signaturer ändrade — verifierat med grep mot importer.
- [ ] `npm run build` grön, inga TS-fel.
- [ ] Manuell koll: en publik sida visar skarpa knappar/kort.

## F3 — Tre chrome-komponenter + BurgerDrawer

**Mål:** Tre distinkta chrome-lägen finns som komponenter, plus hamburgar-
drawern. Löser audit-fynd G-01 och G-02.

**Krav/Bygg:** I `components/layout/`:
- **ChromePublic** — styla om `site-nav.tsx` till magasins-`.chrome-public`
  (68px, sticky, magasins-nav, skarpa knappar). All serverside roll-/host-/
  notis-logik behålls exakt.
- **ChromeInsamlare** (ny `chrome-insamlare.tsx`) — som publik men med
  avatar-pill (initialer + förnamn), bell-ikon, primär-CTA "+ Ny insamling".
- **ChromeAdmin** (ny `chrome-admin.tsx`) — minimal topbar: "Maskinrum"-
  wordmark, breadcrumbs, systemstatus-pillar (Stripe/BankID/pending),
  bell + settings + avatar med roll-label.
- **BurgerDrawer** (ny `burger-drawer.tsx`) — mörk drawer från höger,
  overlay-klick/ESC/stäng-knapp stänger. Tillgänglig på alla publika ytor,
  även desktop.
- Referens: `components.jsx` (`ChromePublic`, `ChromeInsamlare`,
  `ChromeAdmin`, `BurgerDrawer`) + `styles.css` §CHROME, §"Hamburger".
- Drawerns länkar och chrome-navlänkar ska peka på **riktiga routes** (se
  beslut 1 — inte designens påhittade URL:er).

**Klar när:**
- [ ] `ChromePublic`, `ChromeInsamlare`, `ChromeAdmin`, `BurgerDrawer` finns
      som komponenter och bygger.
- [ ] `site-nav.tsx` serverside-logik (roll/host/notiser) intakt.
- [ ] Alla navlänkar pekar på existerande routes — ingen 404.
- [ ] Drawern öppnar/stänger via overlay, ESC och stäng-knapp.
- [ ] `npm run build` grön.

## F4 — AdminSidebar

**Mål:** En 240px sidomeny för `(intern)`-gruppen, grupperad som designen,
wired mot de admin-routes som finns idag.

**Krav/Bygg:**
- Ny `components/layout/admin-sidebar.tsx`. Referens: `components.jsx`
  (`AdminSidebar`) + `styles.css` §"Admin layout: sidebar + content".
- Grupperad nav mot **befintliga** routes:
  - **ÖVERSIKT:** Dashboard `/admin`, Granskning `/granskning`
  - **DRIFT:** Föreningar `/granskning/organisationer`,
    Statistik `/admin/statistik`, Region-rapport `/admin/region-rapport`,
    Överklaganden `/admin/overklaganden`
  - **INNEHÅLL:** Innehåll `/admin/innehall`, FAQ `/admin/faq`,
    Lärd `/admin/lard`
  - **SYSTEM:** Larm `/admin/larm`, Ingreppslogg `/admin/logg`,
    Verktyg `/admin/verktyg`, Stickprov `/admin/stickprov`
  - **TEAM:** Arbetsyta `/admin/team`
- Aktiv post markeras utifrån nuvarande pathname.
- Stickprov visas bara för superadmin (matcha villkoret i nuvarande
  `app/(intern)/admin/page.tsx`).
- Bygg navet som en deklarativ lista (array) så brief 22 kan lägga till
  Donatörer/Transaktioner utan att skriva om komponenten.
- Responsivt: under en brytpunkt fälls sidomenyn till en drawer/hamburgare —
  den får aldrig krampa innehållet på mobil.

**Klar när:**
- [ ] `admin-sidebar.tsx` finns, grupperad enligt ovan, alla länkar 200 OK.
- [ ] Aktiv post markeras korrekt per route.
- [ ] Stickprov dolt för icke-superadmin.
- [ ] Navet är en array — enkelt att utöka.
- [ ] Sidomenyn fälls till drawer på mobil.
- [ ] `npm run build` grön.

## F5 — Route-grupp-layouterna omkopplade

**Mål:** Varje route-grupp renderar rätt chrome. Admin blir ett dashboard
med sidomeny i stället för en topp-crampad knapprad.

**Krav/Bygg:**
- `app/(public)/layout.tsx` → `ChromePublic` + `BurgerDrawer` + `Footer`.
- `app/team/layout.tsx` → samma som publik.
- `app/(konto)/layout.tsx` → `ChromeInsamlare` + `BurgerDrawer` + `Footer`.
- `app/(intern)/layout.tsx` → `ChromeAdmin` + `AdminSidebar` + innehålls-
  wrapper (magasinens `admin-layout`-flex: sidomeny vänster, innehåll höger).
  Ingen `Footer` i admin (dashboard-känsla).
- `app/(auth)/layout.tsx` → behålls strukturellt (split-screen). Den ärver
  redan skarp stil via primitiverna; ingen omstrukturering.
- Den horisontella knappraden i `app/(intern)/admin/page.tsx` (Larm, Logg,
  Verktyg, Statistik, Överklaganden, Stickprov, Granskningskö) tas bort —
  navigationen lever nu i AdminSidebar. Resten av sidans innehåll lämnas
  orört (görs om i brief 22).

**Klar när:**
- [ ] Publik-, konto- och team-grupp visar rätt chrome.
- [ ] `(intern)` visar ChromeAdmin + AdminSidebar; admin-sidan har inte
      längre den horisontella knappraden i toppen.
- [ ] `(auth)` oförändrad struktur, ärver skarp stil.
- [ ] Klicktest: en sida per route-grupp laddar utan fel.
- [ ] `npm run build` grön, Security Advisor grön.

---

## Batchade uppföljningar — kräver människa, blockerar inte bygget

- **Visuell genomgång.** Zivar/Cowork öppnar en sida per chrome-läge och
  jämför mot `handoff v2.1/source/v2/*.html`. Eventuella avvikelser blir en
  fix-brief.
- **De tre odefinierade admin-posterna** (Audit-rapport, Inkommande,
  Community-modd) — Zivar beskriver dem; läggs i en senare brief.

## När du är klar

Stoppa efter F5. Sammanfatta per punkt: vad gjordes, commit-hash, byggstatus.
Lista allt som blev oklart eller avvek från briefen. Pusha alla commits.

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-25 | Foundation-brief skapad — designsystem v0.2 + tre chrome-lägen. |
