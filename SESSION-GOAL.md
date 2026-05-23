# SESSION-GOAL

**Mål:** Bygg Sadaqah Sweden autonomt enligt `2-Byggplan/05-Byggsekvens.md`. Varje steg verifierat och pushat — inget halvbyggt.
**Startat:** 2026-05-23
**Senast uppdaterad:** 2026-05-23

---

## Steg-status

- [x] **Steg 0 — Fundament** — KLART, pushad
- [x] **Steg 1 — Databasens grund** — KLART, pushad (8 migrations, RLS på 18 tabeller, P0-lints gröna, TS-typer + Supabase-klientwrappers)
- [x] **Steg 2 — Auth & roller** — KLART, pushad (proxy, server-helper, login/registrera + Server Actions, auth-callback, skyddad demo-route)
- [x] **Steg 3 — Insamlings-objektet & insamlar-flödet** — KLART, pushas (skapa-utkast, redigera-formulär, status-skicka-in via SECURITY DEFINER, mina-insamlingar-lista, publik detaljvy)
- [x] **Steg 4 — Granskar-flödet** — KLART, pushas (migration 0010 utvidgar status-trigger för granskar-roll, RPC `tilldela_granskning` + `fatta_granskar_beslut` + `uppdatera_granskning_anteckningar` med SECURITY DEFINER i `private`-schema. UI: `(intern)/granskning` — kö med SLA-färgkod, `(intern)/granskning/[id]` — detaljvy + checklista + beslutspanel. Append-only-logg via `granskning_handelse`. Security Advisor P0 grön.)
- [ ] Steg 5 — Stripe Connect & pengaplumbing
- [ ] Steg 6 — Donator-flödet & realtidsräknaren
- [ ] Steg 7 — Transparens-loopen
- [ ] Steg 8 — Profiler & användarsidor
- [ ] Steg 9 — Listning, sökning & discovery
- [ ] Steg 10 — Notiser & kommunikation
- [ ] Steg 11–16 — Bygg-grupp C

---

## Senaste sessionens arbete

### 1. Catch-up commit (`c50d59a`)
Tidigare sessioners pending ändringar landade:

- Cloudflare ersätter Vercel i 00, 04, 05, README.
- 16 → 17 moduler (M17 — Team & intern arbetsyta) — byggsekvensen får Steg 16.
- Repo-namn `sadaqahsweden` i fil 04.
- `/goal`-kommandot omformulerat med "Vad resultatet ska vara".
- 5-Kod/CLAUDE.md: ny "Databassäkerhet"-sektion.
- `next.config.ts` ut med `output: 'export'`; SSR-läge för OpenNext.
- 5-Kod/public/ skräp-SVG borttagna.
- Nya: `2-Byggplan/07-Forutsattningar-och-gap.md`, `Supabase/SAKERHETSREGLER.md`,
  `Supabase/SUPABASE-FALTMANUAL.md`, `.claude/settings.local.json`.

### 2. Steg 0 — Fundament (kommer som nästa commit)

**Verifierade:**
- [x] GitHub-repo `ZivarMahmod/SadaqahSweden` finns, `main`-branch deployar.
- [x] Next.js 16 + Tailwind v4 igång lokalt (`npm run dev`), `npm run build` grön.
- [x] Supabase-projekt `dcfrvomfztgkbfoegwge` (region `eu-north-1`, PG17, status ACTIVE_HEALTHY) — kopplat via project-scoped MCP i `.mcp.json`.
- [x] **OpenNext Cloudflare-adapter inkopplad:**
  - `@opennextjs/cloudflare@latest` + `wrangler@latest` installerade.
  - `wrangler.jsonc`: namn `sadaqahsweden`, `compatibility_date: 2025-12-30`,
    `nodejs_compat` + `global_fetch_strictly_public`, `assets` binding.
  - `open-next.config.ts`: minimal `defineCloudflareConfig({})` (R2-cache adderas
    senare när R2-bucket existerar).
  - `.dev.vars`: `NEXTJS_ENV=development` (gitignored).
  - `next.config.ts`: kallar `initOpenNextCloudflareForDev()` för bindings i `next dev`.
  - `package.json`: scripts `cf-build`, `preview`, `deploy`, `upload`, `cf-typegen`.
  - `.gitignore`: `.open-next/`, `.wrangler/`, `.dev.vars*`, `cloudflare-env.d.ts`.
  - `public/_headers`: immutable cache för `/_next/static/*`.
  - `eslint.config.mjs`: ignorerar `.open-next/`, `.wrangler/`, `cloudflare-env.d.ts`.
- [x] `npm run cf-build` (= `opennextjs-cloudflare build`) producerar `.open-next/worker.js` grönt.
- [x] `npm run lint` grön.
- [x] `.env.example` på plats; inga hemligheter i git (`.env*` + `.dev.vars*` ignored).

**LIVE:** `https://sadaqahsweden.se` svarar 200 ✅ (deployad 2026-05-23 ~17:10
via Cloudflare Workers + OpenNext-adapter). Workers-projektet heter
`sadaqahsweden`, routes-pattern `sadaqahsweden.se/*` + `www.sadaqahsweden.se/*`
i wrangler.jsonc. Env vars satta: NEXT_PUBLIC_SUPABASE_URL, _ANON_KEY, _SITE_URL.

**Planeringsavvikelse (icke-tyst):** Next.js downgrade 16.2.6 → 15.5.16
pga bug i `@opennextjs/cloudflare` 1.19.x — Next 16.2.x gav 500 på alla
dynamiska routes (`TypeError: components.ComponentMod.handler is not a function`,
opennext-cloudflare#1258, "fixed" men workaround = downgrade). Återgå när
adaptern stöder Next 16 rent.

**Operativt kvar för Zivar (utanför Claudes kontroll):**

- **Pages-projektet (om existerar)** + dess DNS-records för `sadaqahsweden.se`:
  Workers-deployen använder `routes` (zone-pattern) istället för `custom_domain`
  eftersom befintliga DNS-records blockerar custom_domain-skapande. Det
  fungerar — proxied DNS + routes räcker. När du raderar Pages-projektet +
  dess DNS-records kan vi byta tillbaka till `custom_domain: true` i
  wrangler.jsonc för rentare setup. Inte brådskande.
- **Åtgärd:** migrera Cloudflare-projektet från Pages → Workers Builds:
  1. Cloudflare dashboard → **Workers & Pages**.
  2. Radera (eller döp om) gamla Pages-projektet `sadaqahsweden`.
  3. **Create application → Workers → Import a repository** → välj
     `ZivarMahmod/SadaqahSweden`.
  4. Build-inställningar: **Root directory** `5-Kod`,
     **Build command** `npm run cf-build`,
     **Deploy command** `npx wrangler deploy`.
  5. Spara — Workers Builds bygger + deployar.
- **Kontroll innan UI-byte:** `cd 5-Kod && npm run deploy` lokalt (kräver
  `wrangler login`) verifierar att adapter-deploy funkar via CLI.
- Lägg in produktionens miljövariabler i Cloudflare-projektet:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (server-only), `NEXT_PUBLIC_SITE_URL`.

### Flaggad plan-drift (icke-tyst avvikelse)

Planeringen (`2-Byggplan/00-Byggplan-oversikt.md` tabell + `04-Repo-och-kodstruktur.md`)
säger **Cloudflare Pages**. Verkligheten 2026: `@opennextjs/cloudflare` deployar
till **Cloudflare Workers + Static Assets**. Pages-vägen för Next.js är på utfasning;
Workers Builds är den nya auto-deploy-mekanismen från GitHub.

Inverkan: ingen funktionell skillnad för Zivar (han kopplar GitHub-repot i en
Cloudflare-dashboard, plattformen bygger och deployar). Bara terminologin.
**5-Kod/CLAUDE.md och README är uppdaterade.** Planeringsdokumenten i
`2-Byggplan/` lämnas orörda denna session (kod ↔ planering separation) — när
Zivar är tillbaka, byt "Pages" → "Workers + Static Assets" i 00 och 04.

---

## Genuint blockerat (saknad nyckel / extern dependency)

Inget blockerat just nu — Supabase + GitHub-repot räcker för Steg 1–4.

Förväntade blockare längre fram:
- **Steg 5–6:** Stripe Connect kräver `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
  (begär från Stripe-konto, sätt i `.env.local` + Cloudflare env vars).
- **Steg 6:** Resend kräver `RESEND_API_KEY`.
- **BankID-parallellspår:** kräver brokeravtal (Criipto el. likn.) + Vault-secrets.

Inga av dessa hindrar Steg 1–4.

---

## Beslut fattade autonomt (utan att vänta på Zivar)

1. **`compatibility_date: 2025-12-30`** i `wrangler.jsonc` — färsk men inte
   framtidsdatum, släcker adapter-varningen. Bumpa när det blir gamalt.
2. **Cloudflare Workers, inte Pages** — adaptern stöder det, Pages är på utfasning.
   Flaggat ovan.
3. **R2 incremental cache uppskjuten** — `open-next.config.ts` är tom tills R2-bucket
   skapas. ISR-routing fungerar utan cache initialt.
4. **Repo-rotens `.claude/settings.local.json` committad** — den enablar Supabase MCP
   för hela projektet och hör hemma där (även om namnet "local" är förvirrande).

---

### 3. Steg 1 — Databasens grund (commit kommer)

**Verifierade:**

- [x] 8 migrations applicerade via Supabase MCP `apply_migration`:
  `0001_extensions_helpers_enums`, `0002_profiles_kategori`,
  `0003_insamling_core`, `0004_donation`, `0005_granskning`,
  `0006_transparens_badges`, `0007_organisation_collab`,
  `0008_securityfix_indexes`.
- [x] 18 tabeller skapade i `public`, RLS aktiverad + FORCEd på alla
  (`profiles`, `kategori`, `mission`, `insamling`, `insamling_kategori`,
  `insamling_media`, `mottagare_dokument`, `donation`, `granskning`,
  `granskning_handelse`, `insamling_andringslogg`, `transparens_uppdatering`,
  `transparens_bevis`, `badge`, `insamling_badge`, `profil_badge`,
  `organisation`, `collab`).
- [x] Hjälpfunktioner i `private`-schema enligt SAKERHETSREGLER §3:
  `set_updated_at()`, `gen_public_id()`, `aktuell_roll()` (SECURITY DEFINER
  med `search_path=''`, explicita REVOKE/GRANT), `handle_new_user()`
  (auto-skapar profil när auth-användare registreras), `profiles_skydda_falt()`,
  `insamling_status_skydd()` (tillståndsmaskin), `insamling_pengaskydd()`
  (skyddar `insamlat_ore` + `connected_account_id` + `transfer_group` mot
  klient-skrivning).
- [x] Seeded: 13 kategorier (`vatten`, `mat`, `barn-och-foraldrar`, `sjukvard`,
  `utbildning`, `mosjekprojekt`, `koran-och-dawah`, `katastrofhjalp`,
  `flykting`, `fastebrytning`, `begravning`, `skuld`, `ovrigt`) + 5 badges.
- [x] Security Advisor: **alla P0-lints gröna**. Kvar: 1 INFO (`mission`
  deny-all — medvetet enligt Plan §2.13). P0-fixar i 0008:
  REVOKE EXECUTE på `public.rls_auto_enable()` från anon/authenticated
  (lints 0028/0029); index på `granskning_handelse.granskare_id` (lint 0001).
- [x] TS-typer genererade via MCP → `5-Kod/lib/supabase/types.ts`.
- [x] Supabase-klientwrappers (`@supabase/ssr`):
  `5-Kod/lib/supabase/client.ts` (browser), `5-Kod/lib/supabase/server.ts`
  (server components / route handlers / server actions, cookie-aware).
- [x] `.env.example` + `.env.local` uppdaterade med
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (publishable key `sb_publishable_HXDTgn9-KBwJQOal5WCL8g_bojAdAm3`).
- [x] `npm run build` grön, `npm run lint` grön.

### Förbättringsmöjligheter (uppskjutna, ej P0)

- **Multiple Permissive Policies** (`collab`, `donation`, `insamling`,
  `organisation`, `transparens_uppdatering`, `kategori`, `badge` på vissa
  roller/actions): konsolidera till en policy per `(table, role, action)`
  med OR-uttryck för bättre planning-time. Görs när första query-mönstren
  syns och prestanda mäts.
- **Unused Index** INFO för många nya index: normalt på tom DB; ignoreras
  tills riktig trafik finns och Supabase rapporterar dem efter perioden.
- **Storage-RLS** (SAKERHETSREGLER §7) — kopplas in när första filuppladdningen
  byggs (insamlings-cover i Steg 3).

---

### 4. Steg 2 — Auth & roller (kommer som nästa commit)

**Verifierade:**

- [x] **Proxy** (Next.js 16-konvention, tidigare middleware) i
  `5-Kod/proxy.ts` + helper i `5-Kod/lib/supabase/middleware.ts`.
  Refreshar session på varje request via `@supabase/ssr`. Utan detta
  tappar Server Components inloggning vid token-expiry.
- [x] **Server-helper** `5-Kod/lib/auth.ts`:
  - `aktuellAnvandare()` — cached per request (React `cache()`);
    returnerar `{ userId, epost, profil, roll }` eller null.
  - `kraver(rollerAllowed?)` — redirectar till `/login` om ej inloggad,
    till `/` om inloggad-men-fel-roll, till `/konto-fryst` om kontot är fryst.
  - `aktuellRoll()` — bara rollen, för render-time UI-val utan redirect.
- [x] **Server Actions** i `5-Kod/app/(auth)/actions.ts`:
  `loggaIn()`, `registrera()`, `loggaUt()`. Översätter Supabase-felmeddelanden
  till svenska (inkl. HIBP-läckta lösenord, dubbletter, ej-bekräftad e-post).
- [x] **Sidor**: `app/(auth)/login`, `app/(auth)/registrera`,
  `app/verifiera-epost`, `app/konto-fryst`. Server Components för meta + redirect,
  client subcomponent för formulär (`useTransition` för progressindikator).
- [x] **Auth-callback**: `app/auth/callback/route.ts` —
  `exchangeCodeForSession` på email-bekräftelse-länken.
- [x] **Skyddad demo-route**: `app/(konto)/konto/page.tsx` — anropar
  `kraver()`, visar profil + roll, logout-formulär. Bevisar att hela
  proxy → cookie → server-client → RLS-läsning fungerar end-to-end.
- [x] Behörighetsmatrisen från M6 Block 4.2 respekteras av RLS via
  `private.aktuell_roll()` i policy-uttryck (lagt redan i Steg 1).
- [x] Auth-skalet förberett för BankID-slot: `aktuellAnvandare` returnerar
  `profil.bankid_verifierad`-flaggan; den sätts av service_role (Edge Function
  som BankID-brokern callbackar in mot — byggs när broker-avtal finns).
- [x] `npm run build` grön, `npm run lint` grön. 8 routes byggda.

### Operativa Auth-inställningar (Zivar i Supabase-dashboarden)

Per SAKERHETSREGLER §9 — krävs innan publik lansering, ej P0 för bygget:

- **Email-provider PÅ** (är default — verifiera Authentication → Providers → Email).
- **Confirm email PÅ** så `registrera()` skickar bekräftelsemejl.
- **HIBP läckta-lösenord-skydd PÅ** (Authentication → Providers → Email →
  "Prevent use of leaked passwords"). Vår `registrera()`-action är redo
  för felmeddelandet "den lösenordet har förekommit i läckta databaser".
- **CAPTCHA Turnstile** på registrering (kopplas in senare, kräver site key).
- **Site URL** = `https://sadaqahsweden.se` (Authentication → URL Configuration).
- **Redirect URLs**: lägg till `https://sadaqahsweden.se/auth/callback` +
  `https://sadaqahsweden.<konto>.workers.dev/auth/callback`.

---

## Nästa: Steg 3 — Insamlings-objektet & insamlar-flödet

**Mål (från byggsekvensen):** En insamlare kan skapa och skicka in en
insamling. Bygger M1 (objektet + livscykel) + M2 (wizarden).

Plan:

1. Wizard-route `app/(konto)/insamling/ny/[steg]/page.tsx` — multistep
   som sparar utkast efter varje steg (Server Action).
2. Steg-uppdelning enligt M2: identitet → mottagare → media → mål → granskning.
3. Detaljvy `app/insamlingar/[publicId]/page.tsx` — publik (med RLS).
4. Lista-mina-insamlingar i `app/(konto)/insamling/page.tsx`.
5. Status-action "Skicka till granskning" — sätter status `utkast → inskickad`,
   tillåts av `insamling_status_skydd`-triggern, skapar `granskning`-rad
   via service_role (Edge Function eller Server Action med admin-klient).
6. Storage-bucket för insamlings-media (cover + gallery) + storage-RLS.
7. Test: skapa testanvändare med roll `insamlare`, skapa insamling,
   skicka in, verifiera RLS-isolering mellan användare.
8. Commit + push.
