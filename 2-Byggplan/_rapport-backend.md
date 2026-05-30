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

## Lane-split & vad denna ruta bygger (korrigerad 2026-05-30)

> **Rättelse:** en tidigare version av denna rapport påstod att `5-Kod` var en
> "planeringsspegel av stubbar". Det var **fel** (mina detaljer var
> ofaktiska). Verifierat mot filerna: `5-Kod` är den **riktiga, deployade
> Next.js-appen** — `lib/supabase/admin.ts` är 100 rader äkta kod, `next.config.ts`
> är en ren riktig config, **noll** filer är stubbar/markdown-fence, största
> filerna är 600+ rader, och `npm run cf-build` producerar ett riktigt
> OpenNext-worker-bundle. `cf-build` ÄR alltså en meningsfull grind och körs
> före varje push.

**Lane-split (per `57-MASTER-Parallell-bygg.md`):**
- **Denna ruta (backend) äger:** ALLA migrationer (0063+), RLS, RPC:er, triggers,
  seeds, och DB-nära server-actions. Den **irreplaceable** leveransen — ingen
  annan instans skriver migrationer.
- **Design-instansen + skola-instansen äger:** React-komponenterna / UI mot
  designsystem v0.3 (t.ex. `Art9ConsentGate.tsx`, `RateLimitNotice`,
  Dataskydd-panelens `page.tsx`). De rör inga migrationer. Jag bygger
  **backend-kontraktet** (RPC-signaturer, tabeller) som de wirear mot, och
  **flaggar** UI-delarna här istället för att bygga dem i fel lane.
- **Server-action-wiring** (t.ex. koppla `rate_limit_traff` in i befintliga
  login/donation-actions): backend-lane i princip, men kräver den frontend-burna
  `RateLimitNotice`-komponenten för att vara komplett → **flaggas som koordinerat
  steg**; RPC:n är klar och redo att kopplas in (fail-open). Jag rör inte den
  levande appens auth-/pengaväg från en långlivad obmergad branch utan att
  frontend-motparten finns.

**Grindar per migration:** `apply_migration` mot live (additivt + idempotent) →
`get_advisors(security)` (inga nya ERROR; nya INFO `rls_enabled_no_policy` på
avsiktligt policy-fria DEFINER-only-tabeller är accepterat, som befintliga
`public.mission`) → RLS-bevis via testqueries → `npm run cf-build` grön (på
brancher som rör `.ts/.tsx`) → commit → push.

---

## Statuslogg per brief

### Brief 31 — Säkerhetsbasen (#17) — migrationer 0063–0069 ✅ KLAR (DB-lager)

DB-lagret klart och verifierat mot live. F10: ledger 0063–0069 applicerad; alla
objekt finns (5 nya tabeller, 9 private-fn, privat bucket); rollback+reapply
bevisad på 0068 (funktioner droppade → återställda → round-trip ok). Advisor:
baslinje + 2 avsiktliga INFO, noll ERROR. Frontend (F7 Art9ConsentGate, F8
Dataskydd-UI) = design-lane, flaggat. Server-action-wiring av rate_limit =
flaggat (koordineras med RateLimitNotice-komponenten).

| Punkt | Migration | Status | Commit |
|---|---|---|---|
| Förkrav (grönt baslinjebygge) | — | klar (redan grönt) | |
| F1 consent_records | 0063 | ✅ klar | b3f3516 |
| F2 audit_log (+ F1-RPC:er) | 0064 | ✅ klar | 564568b |
| F3 rate limiting | 0065 | ✅ klar (DB) | ceb8a2e |
| F4 privata buckets + lib/storage.ts | 0066 | ✅ klar | cd3943b |
| F5 data_retention_jobs | 0067 | pågår | |
| F6 krypteringsmönster | 0068 | — | |
| F7 Art9ConsentGate | (frontend) | flaggad — design-lane; backend-RPC klar | |
| F8 Dataskydd-panel (RPC-del) | 0069 | RPC byggs; UI flaggad (design-lane) | |
| F9 förbudslista (dok) | — | byggs (riktig dokumentfil) | |
| F10 verifiering/deploy | — | — | |

**F3-not:** `rate_limit_buckets` + `public.rate_limit_traff` (DEFINER, GRANT
bara `service_role` — anropas server-side via admin-klient; linter-rent, ingen
0028/0029). RLS ENABLE+FORCE utan policys = avsiktlig (bara DEFINER-fn rör
tabellen); ger en INFO-lint `rls_enabled_no_policy` precis som befintliga
`public.mission` — accepterat, dokumenterat mönster. UI-delen (RateLimitNotice)
+ wiring i login/donation-server-actions flaggad (koordineras med design-lane).

**F4-not:** privat bucket `kansliga-underlag` (public=false) + 5 storage-policys
på `storage.objects` (egen mapp för authenticated, admin-läsning). `lib/storage.ts`
med `getSignadUrl` + TTL-konstanter. Nulägeskoll: inga buckets fanns före — inget
publikt fynd att flagga.

---

### Brief 32 — Identitetstrappan (#1/#17) — migrationer 0071–0074 ✅ KLAR (DB-lager)

| Punkt | Migration | Status | Not |
|---|---|---|---|
| F1 tre identitetslager | 0071 | ✅ | `private.identitet_niva`, `private.har_verifierad_roll` |
| F2 identity_verification + manuell väg | 0072 | ✅ | tabell+RLS+`admin_verifiera_identitet` (wrapper). BankID-broker = TODO-flagga |
| F3 role_application | 0073 | ✅ | tabell+RLS, öppen-ansökan-unikt, roll-check insamlare/forening |
| F4 kan_ansoka_roll (karenstid) | 0074 | ✅ | 6-mån karens efter avslag (DEL 7) |
| F5 /konto/identitet (UI) | — | flaggad — design-lane | RPC-kontrakt klart |

**Bevis (empiriskt mot live):** `admin_verifiera_identitet` — non-admin nekas;
admin sätter `bankid_verifierad=true` genom `profiles_skydda_falt`-triggern via
transaktions-lokal `request.jwt.claim.role=service_role` (H5/0062-mönstret);
verifieringsrad blir `godkand`. Testprofil återställd till ursprungligt läge.
Advisor: baslinje + 2 INFO, noll ERROR/nya lints.

---

### Brief 33 — Betal-abstraktionslagret (#15) — migr 0075 + lib/betalning ✅ KLAR (uttag)

`PaymentProvider`/`PayoutProvider`-interfaces + `StripeProvider` (parallell-wrap
av befintliga Edge Functions, live-flödet oförändrat) + registry (default stripe).
`insamling.betal_provider`-fält (0075, additivt). cf-build grön, advisor ren.
Pengaflöden åtskilda (F), 0% avgift (G). **Flaggat:** full Edge-Function-refaktor
(F4–F6) + destination-charge (J3) + Zivar pengaregression = senare/människo-steg.

### Brief 34 — Religiösa innehållsregistret (#6) — migr 0076–0078 ✅ KLAR (DB-lager)

| Punkt | Migration | Status | Not |
|---|---|---|---|
| F1 register + grind + ar_lard | 0076 | ✅ | `religious_content_register`; helpers `ar_lard`/`lard_profil_id` (via `lard_profil.kopplad_profil_id`) |
| F2 content_edition | 0077 | ✅ | versioner (översättning/recitation/qiraah/translit), egen grind |
| F3 verifierings-RPC:er | 0078 | ✅ | `lard_godkann_innehall/edition` (kopplad lärd), `admin_klarera_licens` (wrapper) |

**GRINDEN bevisad mot live (princip E):** seedade utkast / godkänt-men-oklarerat /
godkänt+klarerat → läst som `anon` → **bara godkänt+klarerat syntes**. Övriga
osynliga. Test städat. CHECK: `godkand` kräver `verifierad_av`+`verifierad_at`.
Lärd-koppling rättad mot verifierat schema (`lard_profil` har ingen user_id/status;
kopplingen ÄR `kopplad_profil_id`). Advisor baslinje, noll nya lints.
**Flaggat:** Koran-läsaren/FAQ/bönetider (46/47/49) konsumerar grinden senare;
lärd-bemanning + första editioner = lärd-paketet (människo-steg).

### Brief 36 — Roll-konsoler + moderering (#17/#3) — migr 0079–0083 ✅ KLAR (DB-lager)

| Punkt | Migration | Status | Not |
|---|---|---|---|
| F1 operativa roller | 0079 | ✅ | enum `operativ_roll` (7) + `operativ_roll_def` seedad + RLS |
| F2+F3 team_member + helper | 0080 | ✅ | `team_member` (unik user+roll) + `private.har_operativ_roll()` |
| F4 moderation_reports | 0081 | ✅ | polymorf kö (objekt_typ+id); distinkt från `rapport` (kommentar) |
| F5 moderator-RPC:er | 0082 | ✅ | `moderering_ta_ko`/`moderering_atgarda` (wrapper, moderator/admin) |
| F6 säkerhetsansvarig-tillsyn | 0083 | ✅ | utökade `audit_log_select` (brief 31:s utökningspunkt) |
| F7 konsol-UI | — | flaggad — design-lane | backend-RPC klart |

De sex roll-RLS-grupperna finns nu (`har_operativ_roll`); briefs 38–50 grindar
mot dem. Moderator-bemanning = Zivar/team (DEL 7 pkt 15). Advisor baslinje.

## Hoppade / flaggade (kräver konto/infra/människa)

- **BankID-broker** (brief 32 F2) — behållaren (`identity_verification` +
  status-flöde + manuell admin-väg) byggd. Broker-anropet (klient→broker→webhook
  sätter `status=godkand`+`bankid_verifierad` via service_role) byggs när
  broker-avtal finns. Env: `BANKID_BROKER_*` i `.env.example`.
- **Frontend-ytor (design-lane):** brief 31 F7 `Art9ConsentGate`, F8
  Dataskydd-panel (`/konto/dataskydd`); brief 32 F5 `/konto/identitet`. Backend-
  kontrakten (RPC:er/tabeller) finns; UI byggs mot designsystem v0.3 av design-
  instansen. Rör ej route-dirs (57-MASTER).
- **rate_limit-wiring i login/donation-server-actions** — RPC klar; kopplas in
  tillsammans med `RateLimitNotice`-komponenten (design-lane).

## Batchade människo-steg (J1 jurist, lärd, BankID-broker, Stripe-produkter)

- **J1 (jurist):** art.9-samtyckestexternas exakta lydelse; fyll
  `data_retention_jobs.retention_period` + `jurist_godkand`; DPIA;
  `processing_register`-mallen i `docs/SAKERHET-FORBUDSLISTA.md`.
- **Schemaläggning av gallring:** `private.kor_gallring()` finns; koppla till
  pg_cron/scheduled edge function efter J1 + driftsbeslut.
- **BankID-broker, Stripe-produkter:** se ovan / brief 33+40.
