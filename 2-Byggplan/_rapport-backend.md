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

---

## Statuslogg per brief

### Brief 31 — Säkerhetsbasen (#17) — migrationer 0063–0069
*Pågår.*

| Punkt | Migration | Status | Commit |
|---|---|---|---|
| Förkrav (grönt baslinjebygge) | — | klar (redan grönt) | |
| F1 consent_records | 0063 | pågår | |
| F2 audit_log (+ F1-RPC:er) | 0064 | — | |
| F3 rate limiting | 0065 | — | |
| F4 privata buckets | 0066 | — | |
| F5 data_retention_jobs | 0067 | — | |
| F6 krypteringsmönster | 0068 | — | |
| F7 Art9ConsentGate | (frontend) | — | |
| F8 Dataskydd-panel | 0069 | — | |
| F9 förbudslista (dok) | — | — | |
| F10 verifiering/deploy | — | — | |

---

## Hoppade / flaggade (kräver konto/infra/människa)

*(fylls på löpande)*

## Batchade människo-steg (J1 jurist, lärd, BankID-broker, Stripe-produkter)

*(fylls på löpande)*
