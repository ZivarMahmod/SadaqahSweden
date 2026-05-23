# SESSION-GOAL

**Mål:** Bygg Sadaqah Sweden autonomt enligt `2-Byggplan/05-Byggsekvens.md`. Varje steg verifierat och pushat — inget halvbyggt.
**Startat:** 2026-05-23
**Senast uppdaterad:** 2026-05-23

---

## Steg-status

- [x] **Steg 0 — Fundament** — KLART, pushad
- [ ] Steg 1 — Databasens grund
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
- Koppla GitHub-repot till **Cloudflare Workers Builds** (inte Pages — se nästa stycke)
  i Cloudflare-dashboarden så `main` auto-deployar.
- Lägg in produktionens miljövariabler i Cloudflare-projektet:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  (sistnämnda **server-only**), `NEXT_PUBLIC_SITE_URL`.

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

## Nästa: Steg 1 — Databasens grund

**Mål (från byggsekvensen):** Kärnschemat finns, säkrat med RLS.

Plan:
1. Skapa migrations-mapp `5-Kod/supabase/migrations/`.
2. Migration `0001_init_enums_and_core.sql` — alla enums + `profiles`, `kategori`,
   `insamling`, `insamling_kategori`, `insamling_media`, `mottagare`, `donation`,
   `granskning`, `granskning_handelse`, `insamling_andringslogg`,
   `transparens_uppdatering`, `transparens_bevis`, `badge`, `profil_badge`,
   `insamling_badge`, `organisation`, `collab`, `mission` (reserverad, nullbart FK
   på `insamling.mission_id`).
3. Varje tabell: `ENABLE ROW LEVEL SECURITY` i samma migration; deny-all baseline.
4. Index på FK + policy-refererade kolumner.
5. Trigger `set_updated_at()` (shared) + payloads per tabell.
6. Append-only loggtabeller utan UPDATE/DELETE-policy.
7. Applicera via Supabase MCP `apply_migration`.
8. Kör Security Advisor — alla P0 gröna.
9. Generera TS-typer via MCP `generate_typescript_types` → `5-Kod/lib/supabase/types.ts`.
10. Skapa Supabase-klientwrappers (server + browser) i `5-Kod/lib/supabase/`.
11. Commit + push.
