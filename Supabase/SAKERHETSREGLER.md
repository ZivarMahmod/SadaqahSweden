# Supabase-säkerhetsregler — Sadaqah Sweden

**Datum:** 2026-05-23
**Status:** Icke-förhandlingsbar. Gäller varje databasändring.

---

## Vad detta är

Den här filen är den **operativa säkerhetsregeluppsättningen** för Sadaqah Swedens databas. Den är destillerad ur `SUPABASE-FALTMANUAL.md` (i samma mapp).

Manualen är skriven för ett annat projekt (Corevo, kiosk/POS) — **hoppa över det Corevo-specifika** (tenants, kiosker, POS-kvittosekvenser för Skatteverket). Men säkerhets- och arkitekturprinciperna är universella och gäller fullt ut här.

**Varför detta finns:** Corevo-databasen samlade på sig 80+ säkerhetshål — `SECURITY DEFINER`-funktioner exponerade för `anon`, omutbar `search_path`, saknad grant-hygien — för att rollmodellen aldrig stramades åt från start. **Sadaqah Sweden gör rätt från migration 001.** Claude Code följer den här filen vid varje databasändring. Inga undantag.

> **Sadaqah Sweden är inte multi-tenant.** Corevo-manualens `tenant_id`-mönster gäller inte rakt av. Här styrs RLS av **ägarskap** (en insamlare äger sin insamling) och **roll** (granskare ser kön, admin ser allt). Tänk ägarskap + roll, inte tenant.

---

## Grundregeln

Varje migration följer reglerna nedan. **En migration som bryter mot dem pushas inte.** Säkerhetskontrollen är en del av "verifiera före push".

---

## 1. Rollmodellen ÄR säkerhetsmodellen

Fem Postgres-roller. Varje grant och policy väljer bland dem.

| Roll | Vem | RLS gäller? |
|---|---|---|
| `anon` | Oinloggad besökare (publishable-nyckeln) | Ja |
| `authenticated` | Inloggad användare med giltig JWT | Ja |
| `service_role` | Serverkod (Edge Functions, cron) | **Nej — kringgår RLS** |
| `authenticator` | PostgRESTs roll före `SET ROLE` | — |
| `postgres` | Migrationer, Studio | Nej |

- **`service_role`-nyckeln kringgår all RLS.** Den lever **bara på servern** — i Edge Functions och serverside-miljövariabler. Den hamnar **aldrig** i Next.js-klientbundet, aldrig i webbläsaren, aldrig i git.
- Klienten (webbläsaren) får **bara** `anon`/publishable-nyckeln.

## 2. RLS på varje tabell — från migrationen som skapar den

- Ingen tabell i `public` skapas utan att `enable row level security` körs i **samma migration**.
- "Vi lägger till RLS sen" finns inte. (Splinter-lint **0013**.)
- Varje policy anger **`TO authenticated`** (eller rätt roll) explicit — aldrig implicit default.
- Varje policy wrappar `auth.uid()` / `auth.jwt()` i `(select …)` — annars körs funktionen per rad, 10–100× långsammare. (lint **0003**.)
  ```sql
  -- rätt:
  using ( insamlare_id = (select auth.uid()) )
  ```
- **Index** på varje kolumn en policy refererar, och på varje främmande nyckel. (lint **0001**.)

## 3. SECURITY DEFINER — den farligaste primitiven

`SECURITY INVOKER` är default och kör med anroparens rättigheter (RLS gäller). `SECURITY DEFINER` kör med ägarens rättigheter (oftast `postgres` — kringgår RLS). Det var Corevos 80 hål.

- **Default: använd `SECURITY INVOKER`.**
- En `SECURITY DEFINER`-funktion behövs bara för specifik logik (atomära sekvensnummer, RLS-hjälpfunktioner, webhook-skrivningar). När den behövs — **fyra obligatoriska regler:**
  1. **Ligg i ett `private`-schema** — aldrig i `public` eller ett API-exponerat schema. PostgREST når den inte; RLS-policies och `service_role` gör det.
  2. **`SET search_path = ''`** och fullkvalificera varje namn (`public.donation`, `pg_catalog.now()`). Detta stänger search-path-injektion helt.
  3. **Explicita grants:** `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC, anon, authenticated;` följt av `GRANT EXECUTE … TO service_role;` (eller rätt roll).
  4. **Nästla aldrig** definer-anrop i varandra.
- (lints **0011**, **0028**, **0029**.)

## 4. Aldrig `user_metadata` i en RLS-policy

- `user_metadata` kan användaren själv skriva via SDK:n → hen kan ge sig själv admin. **Läs det aldrig i en policy.** (lint **0015**.)
- Roll och behörighet bor i `app_metadata` (bara serverside skrivbart) eller i JWT-claims via en Custom Access Token Hook.

## 5. SQL-editorn kringgår RLS

Studios SQL-editor kör som superuser — RLS gäller **inte** där. Testa alltid policies som en riktig `authenticated`-användare (klient-SDK eller RLS-testaren). Att en query funkar i SQL-editorn betyder ingenting.

## 6. Vyer

Varje vy: `ALTER VIEW … SET (security_invoker = true);` så att underliggande RLS respekteras. (lint **0010**.)

## 7. Storage-RLS är separat

- Storage-säkerhet bor på `storage.objects` — egna policies, helt skilt från tabell-RLS. En perfekt tabell-RLS lämnar ändå bucketen öppen om storage-policies saknas.
- **Känsliga filer** (utbetalningsbevis, ev. verifieringsdokument) → **privat bucket** + signerade URL:er med kort livslängd.
- **Publika bilder** (cover, galleri) → publik bucket.

## 8. Hemligheter

- Stripe-nycklar, webhook-secrets, BankID-broker-nycklar → **Supabase Vault** (`vault.create_secret()`, aldrig rå `INSERT`) eller serverside-miljövariabler.
- Aldrig i en tabellkolumn i klartext. Aldrig i git. Aldrig i klienten.

## 9. Auth-härdning

- **HIBP läckt-lösenord-skydd PÅ** (Authentication → Providers → Email).
- **CAPTCHA** på registrering och anonyma inloggningar (Turnstile — ni är på Cloudflare).
- **MFA** för team-konton (M17) — AAL2-krav för känsliga handlingar.
- **Asymmetriska JWT-signeringsnycklar (ES256)** — 2025 års standard.

## 10. Security Advisor — verifieringsgrinden

Efter varje migrationsomgång: kör Supabase **Security Advisor** (Splinter). Alla P0-lints ska vara **gröna**:

`0013` RLS av · `0011` search_path · `0028`/`0029` definer exponerad · `0015` user_metadata · `0010` definer-vyer · `0001` oindexerade FK · `0003` auth_rls_initplan.

**En röd P0-lint = pusha inte.** Detta är en del av "verifiera före push".

---

## Realtidsräknaren — rätt mönster

Insamlat belopp som ökar i realtid: använd **Broadcast på privata kanaler** — en Postgres-trigger som anropar `realtime.broadcast_changes()`. Använd **inte** `postgres_changes` (enkeltrådat, skalar inte). Stäng av publika realtidskanaler. Kedjan: Stripe-webhook → Edge Function → DB-skrivning → trigger → broadcast på privat kanal → klienten.

## Drift (när det går skarpt)

PITR (Point-in-Time Recovery) slås på innan skarp lansering — plattformen hanterar pengaposter, en trasig migration får aldrig vara oåterkallelig. Hör till `1-Planering/Beredskapsplan.md`.

---

## Definition of done — varje databasändring

- [ ] RLS aktiverad på varje ny tabell, i samma migration.
- [ ] Varje policy: `TO`-roll explicit, `auth.uid()` wrappad i `(select …)`.
- [ ] Index på varje FK och varje policy-refererad kolumn.
- [ ] Varje `SECURITY DEFINER`-funktion: `private`-schema, `search_path = ''`, explicit REVOKE/GRANT, ingen nästling.
- [ ] Inget `user_metadata` i någon policy.
- [ ] Vyer: `security_invoker = true`.
- [ ] Security Advisor körd — alla P0-lints gröna.
- [ ] Migration är numrerad, idempotent, med rollback för destruktiva ändringar.

Är listan inte grön → migrationen pushas inte.

---

## Djupare referens

`SUPABASE-FALTMANUAL.md` i samma mapp — full djup om roller, prestanda, Realtime, Edge Functions, branching, Vault m.m. Läs den för *varför* och för avancerade mönster. Den här filen är *vad du gör*.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första versionen. Destillerad ur SUPABASE-FALTMANUAL.md, anpassad till Sadaqah Swedens ägarskap/roll-modell. |
