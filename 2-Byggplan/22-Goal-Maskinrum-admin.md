# 22 — Goal: Maskinrum — admin v0.2 (dashboard, re-skin, nya sidor)

**Datum:** 2026-05-25
**Typ:** Autonom byggorder för Claude Code — körs via /goal.
**Vad detta är:** Den enda ingångspunkten för körningen. Läs den här filen
först, sedan `20-Designomgorning-ROADMAP.md` för helheten.

**FÖRUTSÄTTNING:** Brief `21-Goal-Designsystem-och-chrome.md` måste vara körd
och verifierad först. Den här briefen bygger på dess komponenter
(`ChromeAdmin`, `AdminSidebar`, magasins-primitiverna).

---

## Utgångsläge — var projektet står

Brief 2 av 5 i designomgörningen v0.2. Brief 21 levererade designsystemet och
de tre chrome-lägena. `(intern)`-gruppen renderar nu `ChromeAdmin` +
`AdminSidebar`. Den här briefen gör om hela maskinrummet — admin-dashboard mot
designen, alla interna sidor i den nya layouten, och fyra nya admin-sidor.

**Designkällan:** `handoff-to-code/handoff v2.1/source/studio/` —
`screens-internal.jsx` (Admin, Review, Team) och `source/v2/admin.html`,
`review.html`, `team.html` (öppna i webbläsare för referens). `03-Ytor-per-
yta.md` §09–11 är spec.

**Gap-analysen är klar** (se ROADMAP "Admin-sidorna — utrett"): inga nya
databasmoduler krävs. Allt nytt bygger på tabeller och åtgärder som finns.

## Uppdraget

Maskinrummet ska kännas som ett dashboard, inte en sida med en knapprad i
toppen. Dashboard byggs om mot designen; alla interna sidor sätts in i
chrome+sidomeny-layouten; fyra nya sidor byggs (Donatörer, Transaktioner,
Community-modd, Inkommande).

## Autonomi-regler

- Code fattar **alla tekniska val själv** — fråga aldrig droppvis.
- **En commit per punkt** (F1…F8); verifiera + pusha före nästa.
- **Inga databasmigrationer.** Nya server-actions över befintliga tabeller är
  OK (det är ingen schemaändring). Behöver något en ny tabell — stanna och
  flagga, det är fel i briefen.
- Nya sidor: läs den faktiska tabellstrukturen i `supabase/migrations/` innan
  du skriver queries — gissa aldrig kolumnnamn.
- Alla `(intern)`-sidor, även nya, gatas med `kraver(["granskare","admin"])`
  (superadmin-only där det redan gäller). RLS skyddar dessutom.
- `npm run build` (hela `next build` inkl. ESLint — **noll fel**, inte bara
  "compiled successfully") + Security Advisor grön före varje push. Ett rött
  bygge blockerar Cloudflare-deployen — då når inget live.
- Genuint mänskliga steg batchas — Code väntar aldrig på dem.

## Beslut som redan är fattade — stanna inte för dessa

1. **URL:er ändras inte.** Befintliga interna routes behålls. Nya sidor läggs
   under `/admin/`: `/admin/donatorer`, `/admin/transaktioner`,
   `/admin/community-modd`, `/admin/inkommande`.
2. **Inga nya databasmoduler.** Allt nytt bygger på befintlig data:
   - Donatörer/Transaktioner → `donation`, `disputes`, `refunds`,
     `transfers`, `payouts`, `connected_accounts`, `profiles`.
   - Community-modd → `rapport` + `kommentar`; åtgärderna finns i
     `app/(public)/insamlingar/[publicId]/community-actions.ts`
     (`granskareDoljAction`, `granskareAterstallAction`).
   - Inkommande → `organisation` (`katalog_status`) + `collab`.
3. **Audit-rapport byggs inte.** Det är designens egen audit — referens för
   dig, ingen produktionssida. Finns inte i AdminSidebar.
4. **Två-vägs meddelanden med föreningar byggs inte här.** Inkommande är en
   läs/aggregat-inkorg över inkommande föreningsärenden — ingen chatt.
5. **Funktion bevaras.** Befintliga interna sidors logik, queries, actions
   och RLS rörs inte vid re-skin. Bara layout/markup/komponenter.

---

## Steg 0 — synka & bekräfta foundation

`git status` ren mot HEAD. Bekräfta att brief 21 är körd: `ChromeAdmin`,
`AdminSidebar`, `BurgerDrawer` finns i `components/layout/`, magasins-systemet
i `globals.css`. Saknas något — stanna, brief 21 är inte klar.
Läs `screens-internal.jsx`, designens `admin.html`/`review.html`/`team.html`,
nuvarande `app/(intern)/admin/page.tsx`, och de berörda tabellernas
migrationer.

---

## Förkrav — grönt bygge (gör detta FÖRST, egen commit)

Produktionsbygget är **rött** och har varit det sedan M19 — därför har varken
M19, SX-härdningen eller designarbetet deployats. `next build` kör ESLint och
stoppar på fel. Blockerande fel från Cloudflare-byggloggen 2026-05-25:

- `app/(intern)/admin/statistik/page.tsx:113` — `<a>` mot `/statistik/` →
  byt till `<Link>` från `next/link`.
- `app/team/2fa-setup/form.tsx:37` — `<a>` mot `/admin/` → byt till `<Link>`.

Regeln `@next/next/no-html-link-for-pages`: interna länkar måste vara `<Link>`.

Innan F1: fixa dessa, kör `npm run build`, bekräfta **noll fel** (varningar
OK). Dyker fler lint-/typfel upp — fixa dem med. Commit:
`fix: grönt produktionsbygge — interna länkar via <Link>`. Det här låser upp
alla deploys.

**Klar när:**
- [ ] Båda `<a>`-felen åtgärdade; ev. övriga blockerande lint-/typfel med.
- [ ] `npm run build` grön — noll fel.

---

## F1 — Admin-dashboard mot designen

**Mål:** `app/(intern)/admin/page.tsx` blir dashboardet i designen.

**Krav/Bygg:** Layout enligt `screens-internal.jsx` Admin + `admin.html`:
- **KPI-rad (4):** Samlat idag · Aktiva projekt · Väntar på granskning · en
  fjärde (Stripe-balans om den är trivial att hämta via befintlig Stripe-
  integration, annars Insamlat 30 dygn — välj och nämn valet).
- **Vänsterkolumn:** stapeldiagram "Donationer · senaste timmarna" (gruppera
  `donation` per timme, bekräftade) + tabell "Senaste donationerna".
- **Högerkolumn:** Kritisk-larm-kort (röda `admin_larm`), Granskningskö-kort
  (länk till `/granskning`), Systemstatus-lista (Stripe/BankID/Supabase/Mail).
- **Bottenrad:** Topp-insamlingar idag + Nya registreringar.
- Återanvänd queries som redan finns i nuvarande `page.tsx`; lägg till
  timvis donations-aggregat, senaste donationer, topp-insamlingar, nya
  registreringar. Befintlig data — inga nya tabeller.
- Den horisontella knappraden är redan borttagen i brief 21 (F5).

**Klar när:**
- [ ] Dashboard har KPI-rad, donations-diagram, senaste donationer, larm-/
      gransknings-/systemkort, topp-insamlingar och nya registreringar.
- [ ] Layouten matchar `admin.html` visuellt (sidomeny + chrome runt om).
- [ ] Alla siffror kommer från riktiga queries — inga hårdkodade värden.
- [ ] `npm run build` grön.

## F2 — Re-skin alla befintliga (intern)-sidor

**Mål:** Varje intern sida sitter rätt i chrome+sidomeny-layouten.

**Krav/Bygg:**
- Gå igenom alla sidor under `app/(intern)/`: `granskning` + `granskning/*`
  (bevis, event, organisationer, [id]), och `admin/*` (faq, innehall, lard,
  larm, logg, overklaganden, region-rapport, statistik, stickprov, team,
  verktyg).
- De delade komponenterna är redan magasins-stylade (brief 21) — fokus här:
  fixa bredd/spacing nu när en 240px sidomeny finns (t.ex. `Container
  width="narrow"` kan behöva bli bredare), applicera designens tabell- och
  eyebrow-mönster, ta bort dubbel-navigering.
- **Rör inte** queries, server-actions, auth eller RLS — bara layout/markup.

**Klar när:**
- [ ] Varje intern sida renderar rent i ChromeAdmin + AdminSidebar.
- [ ] Ingen sida krampar mot sidomenyn; inga horisontella knapprader kvar.
- [ ] Ingen query/action/RLS ändrad — verifierat med git-diff.
- [ ] `npm run build` grön.

## F3 — Ny sida: Donatörer

**Mål:** `/admin/donatorer` — lista över donatorer.

**Krav/Bygg:** Ny `app/(intern)/admin/donatorer/page.tsx`.
- Aggregera `donation` (bekräftade) per donator: namn (från `profiles`,
  annars "Anonym"), antal donationer, totalt belopp, senaste donation.
- Sökbar/sorterbar tabell i magasins-stil. Tom-state. Paginering vid > 50.
- Gate: `kraver(["granskare","admin"])`.

**Klar när:**
- [ ] `/admin/donatorer` laddar, listar donatorer från `donation`+`profiles`.
- [ ] Anonyma donationer hanteras korrekt (ingen profil-läcka).
- [ ] Tom-state finns; tabell sorterbar.
- [ ] `npm run build` grön.

## F4 — Ny sida: Transaktioner

**Mål:** `/admin/transaktioner` — samlad transaktionslogg.

**Krav/Bygg:** Ny `app/(intern)/admin/transaktioner/page.tsx`.
- Enad logg över `donation`, `refunds`, `disputes`, `transfers`, `payouts` —
  typ, belopp, status, motpart, tidpunkt. Läs migrationerna för exakta
  kolumner.
- Filtrerbar på typ + status. Magasins-tabell, tom-state, paginering.
- Gate: `kraver(["granskare","admin"])`.

**Klar när:**
- [ ] `/admin/transaktioner` visar transaktioner från de fem tabellerna.
- [ ] Filter på typ + status fungerar (riktig state, inte dekor).
- [ ] Tom-state finns; paginering vid stor lista.
- [ ] `npm run build` grön.

## F5 — Ny sida: Community-modd

**Mål:** `/admin/community-modd` — modereringskö för rapporterade kommentarer.

**Krav/Bygg:** Ny `app/(intern)/admin/community-modd/page.tsx`.
- Lista `rapport` med `status = 'pending'`, joinat till `kommentar` (text,
  författare, insamling) — visa rapportskäl och `rapporter_antal`.
- Åtgärder per rad: dölj kommentar (`granskareDoljAction`), återställ
  (`granskareAterstallAction`) — importera från `community-actions.ts`.
  Sätt `rapport.status` till `behandlad_dold` / `behandlad_avfard` /
  `behandlad_eskalerad`: finns ingen action för det, lägg en tunn server-
  action i sidans egen `actions.ts` (befintlig tabell, ingen migration),
  gatad med `kraver(["granskare","admin"])`.
- Tom-state: "Inget att moderera". Magasins-stil.

**Klar när:**
- [ ] `/admin/community-modd` listar pending `rapport` med kommentarskontext.
- [ ] Dölj/återställ fungerar via befintliga actions; `rapport.status`
      uppdateras.
- [ ] Gate `kraver(["granskare","admin"])`; tom-state finns.
- [ ] `npm run build` grön.

## F6 — Ny sida: Inkommande

**Mål:** `/admin/inkommande` — inkorg för inkommande föreningsärenden.

**Krav/Bygg:** Ny `app/(intern)/admin/inkommande/page.tsx`.
- Aggregera inkommande: organisationsansökningar (`organisation` där
  `katalog_status` ∈ inskickad / under_granskning / komplettering_begard) och
  collab-förfrågningar (`collab` där `status = 'begard'`).
- Grupperad lista med typ, motpart, ålder, länk till rätt befintlig
  hanteringssida (t.ex. `/granskning/organisationer/[id]`).
- Tom-state. Gate: `kraver(["granskare","admin"])`.
- Detta är en läs/aggregat-vy — ingen meddelandetråd (se beslut 4).

**Klar när:**
- [ ] `/admin/inkommande` listar org-ansökningar + collab-förfrågningar.
- [ ] Varje rad länkar till rätt befintlig hanteringssida.
- [ ] Tom-state finns; gate satt.
- [ ] `npm run build` grön.

## F7 — AdminSidebar utökad

**Mål:** Sidomenyn rymmer de fyra nya sidorna.

**Krav/Bygg:**
- Lägg till i `admin-sidebar.tsx` nav-arrayen (från brief 21):
  Donatörer `/admin/donatorer`, Transaktioner `/admin/transaktioner`,
  Inkommande `/admin/inkommande`, Community-modd `/admin/community-modd`.
- Gruppera enligt designen (`components.jsx` `AdminSidebar`): ÖVERSIKT /
  DRIFT / TEAM — placera Donatörer + Transaktioner i DRIFT, Inkommande +
  Community-modd i TEAM. Audit-rapport läggs INTE till.
- Aktiv-markering ska fungera för de nya routerna.

**Klar när:**
- [ ] De fyra nya sidorna finns i sidomenyn, rätt grupperade.
- [ ] Alla sidomenylänkar ger 200 — ingen 404, ingen Audit-rapport.
- [ ] Aktiv post markeras på de nya sidorna.
- [ ] `npm run build` grön.

## F8 — Verifiering

**Mål:** Hela maskinrummet hänger ihop.

**Krav/Bygg:** Klicka igenom varje sida i `(intern)` inkl. de fyra nya.
Kontrollera: rätt chrome+sidomeny, inga 404, inga TS-fel, tom-states,
icke-superadmin ser inte superadmin-sidor.

**Klar när:**
- [ ] Varje intern sida laddar i nya layouten utan fel.
- [ ] De fyra nya sidorna fungerar med riktig data + tom-state.
- [ ] `npm run build` grön, Security Advisor grön.

## F9 — Spärr på kontoskapande (publik + admin)

**Mål:** Kontoskapande är avstängt på både publika sidan och admin — visar
"kommer snart".

**Krav/Bygg:**
- Publik `/registrera`: signup är redan låst via `SIGNUP_LOCKED` i
  `app/(auth)/signup-lock.ts`. Behåll låset. Ändra meddelandet till en
  "kommer snart"-formulering — rubrik t.ex. "Skapa konto — kommer snart",
  text om att funktionen öppnar längre fram. Server-side `registrera`-action
  fortsätter rejecta POST.
- Admin: ingen kontoskapar-väg får vara öppen. `/registrera` på admin-host
  redirectar redan till `/login` — behåll. Finns en "skapa konto"-länk eller
  -referens på admin-login/-ytan: byt till "kommer snart" eller ta bort.
- "For now"-läge — bygg som en enkel flagga/meddelande, lätt att häva vid
  lansering.

**Klar när:**
- [ ] `/registrera` publikt visar "kommer snart"; inget konto kan skapas.
- [ ] Admin-host: ingen öppen kontoskapar-väg; ev. referens visar "kommer snart".
- [ ] `registrera`-action rejectar fortfarande server-side.
- [ ] `npm run build` grön.

## F10 — Deploy-checkpoint: grönt bygge + live

**Mål:** Allt i den här körningen når faktiskt live-sajten — inte bara GitHub.

**Krav/Bygg:**
- När Förkrav + F1–F9 är klara: kör `npm run build` en sista gång. Den MÅSTE
  gå igenom med **noll ESLint-fel och noll typfel**. Rött bygge = Cloudflare
  Workers-bygget failar = ingen deploy. Grönt bygge är icke-förhandlingsbart.
- Pusha alla commits.
- Bekräfta att Cloudflare-deployen gått igenom (ny version aktiv) och att
  live-sajten svarar på en M19-route: `https://sadaqahsweden.se/faq` ska ge
  200, inte 404.
- Misslyckas deployen — läs byggloggen, fixa felet, gör om. Stanna aldrig i
  ett rött läge.

**Klar när:**
- [ ] `npm run build` grön — noll fel.
- [ ] Alla commits pushade.
- [ ] Cloudflare-deploy aktiv med den nya versionen.
- [ ] `sadaqahsweden.se/faq` och de nya admin-routerna svarar 200.

---

## Batchade uppföljningar — kräver människa, blockerar inte bygget

- **Visuell genomgång** av dashboard + nya sidor mot `source/v2/*.html`.
- **Två-vägs meddelanden med föreningar** — egen modul, egen brief, när
  projektets riktning är satt (Zivar).

## När du är klar

Stoppa efter F10. Sammanfatta per punkt: vad gjordes, commit-hash, byggstatus.
Bekräfta att deployen är live. Lista allt oklart eller avvikande.

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-25 | Admin-briefen skapad efter gap-analys. Dashboard, re-skin, fyra nya sidor — inga nya databasmoduler. |
| 1.1 | 2026-05-25 | Förkrav (grönt bygge — fixa blockerande lint-fel som stoppar Cloudflare-deployen), F9 signup-spärr (publik + admin, "kommer snart"), F10 deploy-checkpoint. |
