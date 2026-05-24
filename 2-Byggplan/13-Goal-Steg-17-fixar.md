# 13 — Goal: Fixar efter Steg 17 (federationen)

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Ett **fix-pass** efter Steg 17 (`12-Goal-Steg-17-federation.md`).
Ett verifieringspass hittade en blocker och fem gap mellan vad som byggdes och
vad briefen krävde. Den här körningen stänger dem. Inga nya byggsteg.

---

## Utgångsläge

- **Steg 17 (F1–F10) är byggt och pushat** — commits `feat(f1)`…`feat(f10)`,
  migrationer 0041–0047.
- Ett verifieringspass (3 oberoende granskare, 2026-05-24) hittade:
  - **1 blocker:** migration 0043 har ett syntaxfel som gör att den inte kan
    köras → hela F3 (jäv, andra-granskning, stickprov, överklagande) kan ha
    misslyckats att applicera på databasen.
  - **2 höga:** fel subdomän-namn (F6), saknad federations-aktiverings-UI (F4).
  - **2 medel:** andra-granskning aldrig inkopplad (F3), oåtkomlig
    MFA-återställning för insamlare (F8).
  - **1 låg:** test-luckor (F2/F3/F7/F8/F10).
- F1, F2, F5, F7, F9, F10 är i grunden korrekt byggda — F1-fundamentet
  (region-RLS) är gediget och bevisat med test.
- `5-Kod/SESSION-GOAL.md` är aktuell statusfil — uppdatera den.

---

## Uppdraget

Bygg **FX1–FX6** nedan, i ordning. **FX1 först — den är en blocker.** Verifiera
varje punkt, commita och pusha (`fix(fx1)`…`fix(fx6)`).

**Sluta efter FX6.** Uppdatera `SESSION-GOAL.md`, sammanfatta, starta inte Steg 18.

---

## Autonomi-regler

Samma som `12-Goal-Steg-17-federation.md`: du fattar alla tekniska val själv,
allt via kod/migration/API/CLI, fråga aldrig droppvis. Migrationer numrerade,
idempotenta, med rollback. RLS på varje ny tabell. Följ
`../Supabase/SAKERHETSREGLER.md`. `npm run build` + Security Advisor grön före
push. Mänskliga steg batchas sist.

---

## FX1 — Migration 0043 går inte att köra (BLOCKER)

**🔴 Blocker. Den viktigaste punkten. Gör den först.**

**Problemet.** `0043_f3_skydden.sql` rad 187:

```sql
CREATE TYPE IF NOT EXISTS public.overklagande_status AS ENUM (...);
```

PostgreSQL stöder **inte** `IF NOT EXISTS` på `CREATE TYPE`. Det är ett
**syntaxfel** — migrationen avbryter på rad 187 och inget i 0043 appliceras.
Rad 190–192 har redan den **korrekta** idempotenta varianten
(`DO $$ BEGIN CREATE TYPE … EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
— typen skapas alltså två gånger, först fel, sen rätt. Den felaktiga raden
körs först och kraschar hela filen.

**Konsekvens:** F3:s tabeller, RPC:er och RLS (jäv, andra-granskning, stickprov,
överklagande) kan aldrig ha applicerats på remote-databasen. F3-koden i
app-lagret pekar då mot objekt som inte finns.

**Krav.**

- Ta bort den felaktiga satsen (rad 187–188). Den korrekta `DO`-blocket
  (rad 190–192) blir kvar och är ensamt nog.
- **0043 redigeras på plats** — den har aldrig applicerats (syntaxfel = inget
  kördes), så det är inte att ändra en redan körd migration. Lägg ingen ny
  migration ovanpå; 0043:s CREATE TABLE/RPC/RLS måste köra.
- **Verifiera databastillståndet:** kontrollera mot remote om något av 0043
  finns (tabellen `overklagande`, F3-funktionerna, känslig-flaggan). Om
  ingenting finns → applicera 0043 rent. Om databasen är i ett halvläge →
  reconcilera så slutläget matchar 0043 i sin helhet.
- Skanna **alla** migrationer 0041–0047 efter samma `CREATE TYPE IF NOT EXISTS`-
  miss och fixa varje förekomst.

**Klar når:**
- [ ] 0043 kör rent från en ren databas — inget syntaxfel.
- [ ] `overklagande`-tabellen + alla F3-funktioner finns verifierat på remote.
- [ ] Ingen annan migration 0041–0047 har `CREATE TYPE IF NOT EXISTS`.
- [ ] Security Advisor grön.
- [ ] Pushad.

## FX2 — Subdomänerna: fel namn i koden + saknas i wrangler.jsonc (F6)

**Problem 1 — fel namn i koden.** `middleware.ts` och `lib/host.ts` använder
`regionaladmin.sadaqahsweden.se`. Briefens **Beslut 1** låste
`admin.sadaqahsweden.se`. Host-routningen matchar aldrig den riktiga domänen,
och region-admin-ytan är onåbar i produktion.

**Problem 2 — subdomänerna försvann.** `admin.` och `superadmin.` lades till
manuellt i Cloudflare-dashboarden, men `wrangler.jsonc` `routes` deklarerar bara
`sadaqahsweden.se` och `www.sadaqahsweden.se`. En `wrangler deploy` (Steg 17:s
push triggade en) reconcilerar custom domains mot `wrangler.jsonc` — odeklarerade,
manuellt tillagda domäner raderas. Därför är de borta. Manuellt i dashboarden är
inte hållbart; subdomänerna måste deklareras i koden.

**Krav.**

- Byt `regionaladmin.sadaqahsweden.se` → `admin.sadaqahsweden.se` i
  `middleware.ts`, `lib/host.ts` och var den än förekommer i koden.
  `superadmin.` är redan rätt i koden.
- Lägg till båda subdomänerna i `wrangler.jsonc` `routes`, samma mönster som de
  befintliga `sadaqahsweden.se`/`www`:

  ```jsonc
  { "pattern": "admin.sadaqahsweden.se", "custom_domain": true },
  { "pattern": "superadmin.sadaqahsweden.se", "custom_domain": true }
  ```

  Då skapar Cloudflare DNS automatiskt vid deploy, och domänerna överlever varje
  framtida deploy — versionshanterat, inte handpillat i dashboarden.

**Klar när:**
- [ ] Ingen kod refererar `regionaladmin.` — host-routningen matchar
      `admin.sadaqahsweden.se`.
- [ ] `wrangler.jsonc` `routes` deklarerar `admin.` + `superadmin.` som
      `custom_domain`.
- [ ] Efter deploy svarar båda subdomänerna och leder till samma inloggning;
      `admin_niva` styr efteråt. Klarar deployen inte att koppla domänerna
      (token-rättigheter) — notera det som en Zivar-punkt; koddeklarationen är
      ändå den hållbara fixen.
- [ ] `npm run build` grön, pushad.

## FX3 — Federations-aktivering saknar UI (F4)

**Problemet.** RPC:erna `admin_satt_admin_niva` / `admin_satt_admin_region`
finns (migration 0041) men anropas inte från någon sida. Briefens F4 kräver att
superadmin kan **uppgradera en förening till region-admin** — utan en UI-väg
kan federationen inte tändas via plattformen alls.

**Krav.** Bygg superadmin-vägen: på en förenings sida i admin-/granskningsytan,
en åtgärd "uppgradera till region-admin" som sätter `admin_niva='region_admin'`
+ `admin_region_kod` (länet) via de befintliga RPC:erna. Endast superadmin ser
och når den. Bekräftelsesteg i klartext före verkställande.

**Klar när:**
- [ ] Superadmin kan, från en förenings sida, uppgradera den till region-admin
      med vald region.
- [ ] Åtgärden är onåbar för region-admin och medhjälpare (RLS + RPC-guard).
- [ ] Test för att uppgraderingen scopar föreningen rätt.
- [ ] `npm run build` grön, pushad.

## FX4 — Andra-granskning aldrig inkopplad + stickprovsvy (F3)

**Problemet.** `private.kraver_andra_granskning()` är byggd men har **noll
callers** — `fatta_granskar_beslut` godkänner en insamling över 500 000 kr utan
någon extern granskning. F3 markerades klar trots att kravet "stora/känsliga
insamlingar kräver ett öga utanför regionen" inte är uppfyllt. Dessutom saknas
stickprovsvyn i app-lagret (RPC finns, vy saknas).

**Krav.**

- Koppla `kraver_andra_granskning()` in i `fatta_granskar_beslut`: en insamling
  över 500 000 kr målbelopp, eller med känslig-flaggan satt, kan **inte** få ett
  slutgiltigt godkännande av en enda region-admin/medhjälpare — den kräver ett
  granskande öga utanför regionen (superadmin eller region-admin i annan region).
  Hård gating, inte bara en varning.
- Bygg stickprovsvyn: superadmin-yta som visar utpekade avvikande region-admins
  via `stickprov_avvikande_granskare()`.

**Klar när:**
- [ ] En insamling ≥ 500 000 kr eller känslig-flaggad kan inte slutgodkännas av
      en ensam region-granskare — extern granskning krävs, bevisat med test.
- [ ] Superadmin har en stickprovsvy som listar avvikande region-admins.
- [ ] `npm run build` grön, pushad.

## FX5 — MFA-återställning oåtkomlig för insamlare (F8)

**Problemet.** `aterstallMfaAction` fungerar tekniskt för vilket konto som helst,
men admin-ytan `/admin/team` listar bara `roll IN ('granskare','admin')`. En
utelåst **insamlare** går inte att hitta eller återställa via gränssnittet —
briefens F8 kräver uttryckligen "utelåst insamlare kan återställas utan
databasingrepp".

**Krav.** Ge admin en nåbar väg att slå upp ett insamlar-konto (t.ex. via
e-post) och nollställa dess MFA-faktor — återanvänd `aterstallMfaAction`. Kräver
`aal2` + admin.

**Klar när:**
- [ ] En admin kan hitta och MFA-återställa ett utelåst insamlar-konto via
      gränssnittet, utan databasingrepp.
- [ ] `npm run build` grön, pushad.

## FX6 — Test-luckor + emblem-kantfall

**Problemet.** Briefen krävde test för F2 (kö-scope), F3 (överklagande + jäv),
F7 (paus-flödet), F8 (2FA-flödet) och F10 (privat/öppen). Bara F1 har test.
Dessutom: F5:s emblem-trigger fyrar bara på `admin_niva`-UPDATE — byts
`forenings_konto_user_id` efter en uppgradering synkas inte `ar_region_admin`.

**Krav.**

- Skriv de saknade testerna — samma stil som `supabase/tests/f1_region_scope.sql`
  (tx-rollback): F2 kö-scope, F3 överklagande + jäv-routning, F7 paus → insamlare
  → återuppta, F8 lösenord-utan-kod nekas, F10 privat default + öppen vy.
- Utöka F5:s emblem-trigger så `ar_region_admin` synkas även om
  `forenings_konto_user_id` ändras.

**Klar når:**
- [ ] Test finns och passerar för F2, F3, F7, F8, F10.
- [ ] Emblem-flaggan kan inte drifta vid byte av förenings-konto.
- [ ] `npm run build` grön, pushad.

---

## Batchade uppföljningar — kräver Zivar, blockerar inte

Oförändrat sedan brief 12 / `SESSION-GOAL.md`: utse riktiga region-admins,
beredskaps-superadmin, `RESEND_API_KEY`, leaked-password-toggle, basemap till R2,
team-e-post. (Subdomänerna är inte längre en batchad punkt — FX2 deklarerar dem
i `wrangler.jsonc`.)

---

## När du är klar

Uppdatera `SESSION-GOAL.md` (markera FX1–FX6, notera DB-tillståndet du hittade i
FX1), sammanfatta, **stoppa**. Efter den här körningen är Steg 17 verifierat
klart — bara Steg 18 (innehåll & FAQ) återstår.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Fix-pass efter Steg 17. FX1 blocker (0043 syntaxfel — `CREATE TYPE IF NOT EXISTS`), FX2 subdomän-namn, FX3 federations-aktiverings-UI, FX4 andra-granskning + stickprovsvy, FX5 MFA-återställning för insamlare, FX6 test-luckor + emblem-kantfall. |
| 1.1 | 2026-05-24 | FX2 utökad: subdomänerna `admin.` + `superadmin.` försvann ur Cloudflare (manuellt tillagda, ej i `wrangler.jsonc` → städades bort vid deploy). FX2 deklarerar dem nu i `wrangler.jsonc` `routes`. DNS-punkten borttagen ur batchade uppföljningar. |
