# 14 — Goal: Fix-pass 2 efter Steg 17 (säkerhet + migrations-ledger)

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Ett andra fix-pass. Verifieringen av `13-Goal-Steg-17-fixar.md`
(3 granskare + live-DB-kontroll) hittade **ett säkerhetsproblem** och **en
migrations-drift** som måste stängas. Inga nya byggsteg.

---

## Utgångsläge

- Steg 17 (F1–F10) + fix-passet (FX1–FX6) är byggt och pushat.
- **FX2, FX3, FX4, FX5 är verifierat korrekta.** Inga åtgärder där.
- Verifieringen hittade två problem i **FX1** och **FX6**:
  - **Säkerhet (hög):** `fx6_grant_usage_private_to_anon` gav `anon` USAGE på
    `private`-schemat. Live-DB-kontroll: `anon` kan nu nå **11 `private`-
    funktioner** — bl.a. `admin_satt_admin_niva`, `admin_satt_admin_region`,
    `superadmin_avgor_overklagande`, `binda_forenings_konto`, `pausa_team_roll`,
    `markera_jav`. Migration 0001 gjorde medvetet `REVOKE ALL ON SCHEMA private
    FROM anon` — FX6 rev den hardningen. Försvaret-på-djupet är borta.
  - **Migrations-drift (medel):** repo har numrerade filer `0041`–`0050`;
    remote-ledgern har 15 annorlunda namngivna migrationer (`f1_admin_nivaer_rls`,
    `f3_overklagande`, `fx6_grant_usage_private_to_anon` …). Repo ≠ produktion.
    `supabase db reset` från repot reproducerar inte produktionen.
- `5-Kod/SESSION-GOAL.md` är aktuell statusfil — uppdatera den.

---

## Uppdraget

Bygg **GX1–GX3** nedan, i ordning. **GX1 först — säkerhet.** Verifiera varje,
commita och pusha (`fix(gx1)`…`fix(gx3)`).

**Sluta efter GX3.** Uppdatera `SESSION-GOAL.md`, sammanfatta, starta inte Steg 18.

---

## Autonomi-regler

Samma som tidigare brief: alla tekniska val själv, allt via kod/migration/API/CLI,
fråga aldrig droppvis. Migrationer numrerade, idempotenta, med rollback. Följ
`../Supabase/SAKERHETSREGLER.md`. `npm run build` + Security Advisor grön före
push. **Applicera varje migration under sitt numrerade repo-namn** (se GX2 —
det var fel-applicering med MCP-etikettnamn som orsakade driften).

---

## GX1 — Stäng `private`-schemat mot anon igen (SÄKERHET)

**🔴 Säkerhetskritisk. Gör först.**

**Problemet.** `fx6_grant_usage_private_to_anon` (repo: `0050`) körde
`GRANT USAGE ON SCHEMA private TO anon`. Migration 0001 hade medvetet
`REVOKE ALL ON SCHEMA private FROM anon` — `private` ska vara oåtkomligt för
klienter; det är hela poängen med schemat. Live-DB-kontroll 2026-05-24 visar att
`anon` nu har USAGE på `private` **och** EXECUTE på 11 `private`-funktioner
(de flesta `private`-funktioner skapades med Postgres standard-`PUBLIC`-grant —
`REVOKE EXECUTE … FROM PUBLIC` saknades i F-migrationerna, vilket schemat-väggen
tidigare maskerade). Bland dem: `admin_satt_admin_niva`, `admin_satt_admin_region`,
`superadmin_avgor_overklagande`, `binda_forenings_konto`, `aterstall_team_roll`.

Inte direkt exploaterbart i dag (PostgREST exponerar `public`, inte `private`,
och funktionerna har interna guards) — men den medvetna hårda väggen är riven och
systemet vilar nu på ett enda lager. Det är inte acceptabelt för en
donationsplattform. `anon` ska ha **noll** räckvidd in i `private`.

**Krav.**

- Numrerad migration som **återställer låsningen**:
  - `REVOKE USAGE ON SCHEMA private FROM anon;` (häv FX6:s grant).
  - `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;` —
    återställ SAKERHETSREGLER-mönstret som F-migrationerna hoppade över.
  - `GRANT EXECUTE` på de `private`-funktioner som **genuint** behöver det, bara
    till `authenticated` / `service_role` — t.ex. RLS-hjälpfunktioner som
    `private.aktuell_roll()` (RLS-policys körs som anroparens roll →
    `authenticated` måste kunna EXECUTE den). Du kan kodbasen — gå igenom
    funktionerna och grant:a per faktiskt behov, aldrig brett till PUBLIC/anon.
  - `authenticated` har redan USAGE på `private` sedan migration 0019 — rör inte
    det.
- **Verifiera mot live-DB efteråt:** `anon` ska ha USAGE = false på `private`
  och EXECUTE = false på samtliga `private`-funktioner. `authenticated`-flödena
  (inloggad insamlare, team, granskning) ska fortfarande fungera.
- Bekräfta att PostgREST inte exponerar `private`-schemat (ska vara `public` +
  `graphql_public` bara). Är `private` exponerat — flagga det rött.

**Klar når:**
- [ ] `anon` har varken USAGE på `private` eller EXECUTE på någon
      `private`-funktion (bevisat med DB-query).
- [ ] Inloggade flöden (insamlare/team/granskning) fungerar — ingen regression.
- [ ] `private` är inte ett PostgREST-exponerat schema.
- [ ] Migration numrerad, idempotent, med rollback. Security Advisor grön.
- [ ] Pushad.

## GX2 — Reconcilera migrations-ledgern

**Problemet.** Steg 17 + fixarna applicerades på remote via MCP `apply_migration`
med etikettnamn (`f1_admin_nivaer_rls`, `f3_overklagande` …) i stället för
repots numrerade filnamn. Resultat: repo har `0041`–`0050` (+ GX1:s nya);
remote-ledgern har 15 andra namn. F1 är ett repo-fil men tre remote-rader; F3
likadant. Repo ≠ produktion — `supabase db reset` från repot reproducerar inte
prod, och `db push` blir oförutsägbart.

**Krav.**

- Reconcilera så `supabase migration list` visar **repo = remote**: repots
  numrerade filer `0041`–`0050` (+ GX1) ska vara de som står som applicerade.
- Detta är **enbart ett ledger-jobb** (`supabase migration repair` /
  `schema_migrations`-tabellen) — schemat har redan alla objekt. **Kör inte om
  SQL, ändra inte schemat.** Markera repots numrerade migrationer som applicerade
  och de felnamngivna remote-raderna som reverted i ledgern.
- Säkerställ att repo-filernas SQL faktiskt motsvarar det som ligger på remote
  (de ska göra det — F-migrationerna skrevs som filer parallellt). Hittar du en
  genuin avvikelse, notera den; fixa inte schemat i den här punkten.

**Klar når:**
- [ ] `supabase migration list` visar repo-filerna `0041`–`0050` (+ GX1) som
      applicerade; inga kvarvarande felnamngivna phantom-rader.
- [ ] Schemat orört — bara ledgern justerad.
- [ ] Framtida migrationer appliceras under sitt numrerade repo-namn.

## GX3 — Småhärdning (FX5 + FX3)

**Problemet.** Två låg-allvar-noteringar från verifieringen:
- **FX5:** server-actionen `aterstallMfaForEpostAction` kollar bara `roll='admin'`
  i TS-lagret, inte `aal2`. DB-RPC:n stoppar en aal1-admin, så det är effektivt
  skyddat — men kontrollen bör finnas explicit på rätt lager.
- **FX3:** uppgradering till region-admin gör två RPC-anrop i följd; failar det
  andra lämnas profilen i halvläge (`admin_niva` satt utan region).

**Krav.**

- FX5: lägg en explicit `aal2`-koll i `aterstallMfaForEpostAction` (samma
  `kraver`-mönster som sidan använder) så skyddet inte bara hänger på DB-grinden.
- FX3: gör region-admin-uppgraderingen atomär — en RPC som sätter både
  `admin_niva` och `admin_region_kod` i samma transaktion, eller wrappa de två
  befintliga så ett fel rullar tillbaka båda.

**Klar når:**
- [ ] `aterstallMfaForEpostAction` avvisar en aal1-session i TS-lagret.
- [ ] Region-admin-uppgradering är atomär — inget halvläge vid partiellt fel.
- [ ] `npm run build` grön, pushad.

---

## Batchade uppföljningar — oförändrat

Utse riktiga region-admins, beredskaps-superadmin, `RESEND_API_KEY`,
leaked-password-toggle, basemap till R2, team-e-post. Se `SESSION-GOAL.md`.

---

## När du är klar

Uppdatera `SESSION-GOAL.md` (markera GX1–GX3, notera DB-verifieringen i GX1 och
ledger-läget i GX2), sammanfatta, **stoppa**. Efter den här körningen är Steg 17
helt verifierat klart — bara Steg 18 (innehåll & FAQ) återstår.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Andra fix-passet efter Steg 17. GX1 säkerhet (`anon` utestängd ur `private`-schemat igen — FX6 rev migration 0001:s lockdown), GX2 migrations-ledger reconcilieras (repo `0041`–`0050` vs 15 felnamngivna remote-rader), GX3 småhärdning (FX5 aal2-koll i TS-lagret, FX3 atomär region-admin-uppgradering). |
