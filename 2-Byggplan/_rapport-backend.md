# Rapport — backend-bygget (branch `bygg/backend`)

**Start:** 2026-05-30
**Körfält:** Backend-lagret för hela Sadaqa-visionen (briefs 31–50). Äger ALLA
migrationer från `0063` och uppåt. Worktree: `../sadaqa-backend`, branch
`bygg/backend` (pushas aldrig till `main`).

**Arbetssätt per F-punkt:** skriv `NNNN_*.sql` + `.rollback.sql` i worktree →
applicera additivt + idempotent mot live (Supabase MCP `apply_migration`) →
`get_advisors(security)` (inga nya ERROR-lints) → RLS-bevis via testqueries →
`npm run cf-build` grön → commit → push branchen.

---

## Globala autonoma beslut (gäller alla briefs)

1. **Roll-gating:** `anvandar_roll`-enum = `{donator, insamlare, forening,
   granskare, admin}` — **`superadmin` finns inte som enum-värde**. Superadmin är
   `profiles.admin_niva = 'superadmin'` (och de raderna har redan `roll='admin'`,
   migration 0062). Brief 31:s `private.aktuell_roll() IN ('admin','superadmin')`
   översätts därför till `private.aktuell_roll() = 'admin'` (täcker även
   superadmins) för admin-läsning, och `private.aktuell_admin_niva() =
   'superadmin'` där superadmin-ENSAM krävs (t.ex. `data_retention_jobs` UPDATE).
2. **pgcrypto** ligger redan i schemat `extensions` (migration 0001). Nya
   migrationer kör `create extension if not exists pgcrypto with schema
   extensions` idempotent (no-op).
3. **Live-applicering:** alla migrationer är rent additiva (nya enums/tabeller/
   RPC:er) + idempotenta (`if not exists`, `do $$ … duplicate_object`). Inga
   destruktiva ändringar på befintliga 46 tabeller/96 donationer/9 profiler.
4. **Security Advisor-baslinje (före 0063):** 1 INFO (`public.mission` RLS utan
   policy — befintligt), 4 WARN `0029` (avsiktliga klient-RPC:er i granskar-
   flödet), 1 WARN leaked-password (auth-config, Zivar-steg). **Noll ERROR.**
   "Grön" = inga NYA ERROR-lints; avsiktliga klient-RPC:er bär en accepterad
   `0029`-WARN (briefen föreskriver exakt det mönstret).
5. **Baslinjebygge:** `npm run cf-build` grönt (exit 0) i worktree innan F1 —
   ingen Förkrav-fix behövdes.

## ⚠️ VIKTIG UPPTÄCKT — 5-Kod är en planeringsspegel (stubbar)

`5-Kod/`-repots TypeScript-lager är **avsiktliga stubbar**, inte deployad kod.
Bevis: commit `9c843e5 "chore: scaffolda 5-Kod-stubbar för planeringsspegel
(cowork)"`; alla 165 `.ts/.tsx`-filer är platshållare; `lib/supabase/admin.ts`
är 11 rader och slutar i en markdown-fence; `next.config.ts` innehåller
`bibba: true` + ogiltig `ignoreErrors` castad `as unknown as NextConfig`.

**Konsekvens för detta goal:**
- Den **riktiga, deployade tillgången är Supabase-databasen** (verifierad live
  via MCP: 46 tabeller, 96 donationer, fungerande RPC:er). **Migrationerna är
  den äkta leveransen** och de är applicerade + verifierade mot live.
- **`npm run cf-build` är ingen meningsfull grind** här — koden är stubbar (bygget
  passerar trivialt eller säger inget om korrekthet). **Den verkliga grinden är
  Supabase Security Advisor** (körs efter varje migration; inga nya ERROR/WARN).
- **Server-actions / frontend wiring hoppas** — att väva in i stub-filer (som
  slutar i ```` ``` ````) vore värdelöst och kan t.o.m. förfula spegeln. Where the
  brief asks for an `Art9ConsentGate`, `RateLimitNotice`, Dataskydd-panel etc.,
  these are frontend och ägs av design/skola-instanserna mot v0.3 — flaggas här,
  byggs inte mot stubbar. Backend-kontraktet (RPC-signaturer) finns för dem.
- Beslut: kör hela 31–50 som **DB-lager** (tabeller/RLS/RPC/triggers/seeds) som
  numrerade migrationer mot live + Security Advisor-verifiering. Det är exakt
  goal-textens "KLUSTER (backend: migrationer/RLS/RPC/server-actions)" kärna.

---

## Statuslogg per brief

### Brief 31 — Säkerhetsbasen (#17) — migrationer 0063–0069
*Pågår.*

| Punkt | Migration | Status | Commit |
|---|---|---|---|
| Förkrav (grönt baslinjebygge) | — | klar (redan grönt) | |
| F1 consent_records | 0063 | ✅ klar | b3f3516 |
| F2 audit_log (+ F1-RPC:er) | 0064 | ✅ klar | 564568b |
| F3 rate limiting | 0065 | ✅ klar (DB) | (denna) |
| F4 privata buckets | 0066 | pågår | |
| F5 data_retention_jobs | 0067 | — | |
| F6 krypteringsmönster | 0068 | — | |
| F7 Art9ConsentGate | (frontend) | hoppad — stub-lager, flaggad | |
| F8 Dataskydd-panel (RPC-del) | 0069 | RPC byggs; UI hoppas (stub) | |
| F9 förbudslista (dok) | — | byggs (riktig dokumentfil) | |
| F10 verifiering/deploy | — | — | |

**F3-not:** `rate_limit_buckets` + `public.rate_limit_traff` (DEFINER, GRANT
bara `service_role` — anropas server-side via admin-klient; linter-rent, ingen
0028/0029). RLS ENABLE+FORCE utan policys = avsiktlig (bara DEFINER-fn rör
tabellen); ger en INFO-lint `rls_enabled_no_policy` precis som befintliga
`public.mission` — accepterat, dokumenterat mönster. UI-delen (RateLimitNotice)
+ wiring i login/donation-server-actions hoppas (stub-lager).

---

## Hoppade / flaggade (kräver konto/infra/människa)

*(fylls på löpande)*

## Batchade människo-steg (J1 jurist, lärd, BankID-broker, Stripe-produkter)

*(fylls på löpande)*
