# SESSION-GOAL

**Mål:** Bygg Sadaqah Sweden autonomt enligt `2-Byggplan/05-Byggsekvens.md`. Varje steg verifierat och pushat — inget halvbyggt.
**Startat:** 2026-05-23
**Senast uppdaterad:** 2026-05-23

---

## Steg-status

- [x] **Steg 0 — Fundament** — KLART, pushad
- [x] **Steg 1 — Databasens grund** — KLART, pushad (8 migrations, RLS på 18 tabeller, P0-lints gröna, TS-typer + Supabase-klientwrappers)
- [ ] Steg 2 — Auth & roller
- [ ] Steg 3 — Insamlings-objektet & insamlar-flödet
- [ ] Steg 4 — Granskar-flödet
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

**Operativt kvar för Zivar (utanför Claudes kontroll):**

- ⚠️ **Cloudflare-deployen failar just nu** — orsak: projektet är uppsatt som
  Cloudflare **Pages** (gamla typen). Steg 0 sätter upp `@opennextjs/cloudflare`
  som deployar till **Cloudflare Workers**. Pages-pipeline:n förstår inte
  `wrangler.jsonc`, kör `npx next build`, hittar inte `5-Kod/out/` (vi
  exporterar inte statiskt längre), failar med
  `Error: Output directory "5-Kod/out" not found`.
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

## Nästa: Steg 2 — Auth & roller

**Mål (från byggsekvensen):** Inloggning som inte går att förfalska. Roll
serverside, RLS-skyddad. BankID-platshållare för Zivars parallella spår.

Plan:

1. Aktivera Supabase Auth-providers (email + lösenord initialt; BankID via
   broker kopplas in senare).
2. Bygg `5-Kod/middleware.ts` med session-refresh via `@supabase/ssr`.
3. Login/logout/registrering: `app/(auth)/login`, `app/(auth)/registrera`,
   `app/auth/callback`. Server Actions för formhantering.
4. Server-helper `aktuellAnvandare()` som returnerar `{ user, profil, roll }`
   och cache:ar per request (React `cache()`).
5. Skyddade route-grupper enligt M6 Block 4.2:
   `app/(konto)`, `app/(granskning)`, `app/(admin)`. Layout-gate via
   server-helper, ej klient-state.
6. Roll-bytes-trigger + `roll_handelse`-logg (M6 Block 5.4).
7. Test: skapa testanvändare, verifiera RLS att donator inte ser annans
   donation, insamlare inte ser annans insamling i utkast.
8. Commit + push.
