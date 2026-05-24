# SESSION-GOAL — Steg 17 (federationen) + FX-fixar + tidigare körningar

**Senaste körning (FX1–FX6):** `../2-Byggplan/13-Goal-Steg-17-fixar.md` —
körd autonomt 2026-05-24. **ALLA FX1–FX6 KLARA, pushade.**
**Tidigare:** Steg 17 (F1–F10, samma dag), härdning H1–H5 (samma dag),
Steg 12–16 (samma dag).
**Stopp:** efter FX6. Starta INTE Steg 18 (innehåll & FAQ).

---

## Status — Fix-pass FX1–FX6 (efter Steg 17)

**✅ ALLA KLARA** — pushade till `main` som sex separata commits
(`fix(fx1)`…`fix(fx6)`). Migrations 0048, 0049, 0050.

### FX1 — 0043 syntaxfel + DB-tillståndsverifiering (BLOCKER)

**Filen 0043_f3_skydden.sql:** Tog bort den ogiltiga
`CREATE TYPE IF NOT EXISTS public.overklagande_status …`-satsen (PostgreSQL
stöder inte `IF NOT EXISTS` på `CREATE TYPE`). Den korrekta idempotenta
`DO $$ BEGIN CREATE TYPE … EXCEPTION WHEN duplicate_object …`-blocket blev
ensamt kvar.

**DB-tillståndet (verifierat via Supabase MCP `list_migrations` + `list_tables`):**

> F3 är **fullt applicerat** på remote — inte som en enda
> 0043-migration, utan som **tre separata applicerade migrationer**:
> - `f3_skydden_jav_kanslig` — jav-kolumner, kanslig-flagga, helpers
> - `f3_overklagande` — overklagande-tabell + RPCs + RLS
> - `f3_stickprov_invoker_wrapper` — stickprov-RPC + public wrapper
>
> Alla F3-objekt finns på remote (verifierat: `overklagande_status`-enum,
> `public.overklagande` med RLS, alla 6 F3-funktioner i `private`-schemat,
> `granskning.jav_markerad`, `insamling.kanslig`). Repo-filen var aldrig
> applicerad som en fil pga syntaxfelet — Codex/Claude bröt upp 0043 i
> bitar och körde varje del via `apply_migration` separat. Det
> halvläget vi var oroliga för var alltså inget halvläge — det var en
> ren applikation i tre delar.

**Skannade alla 0041–0047** — bara 0043 hade `CREATE TYPE IF NOT EXISTS`.
Inga andra förekomster.

### FX2 — Subdomäner: namn i koden + wrangler.jsonc

`regionaladmin.sadaqahsweden.se` → `admin.sadaqahsweden.se` i `middleware.ts`,
`lib/host.ts`, `components/layout/site-nav.tsx`. Typliteralerna och konstanten
`REGIONALADMIN_HOST` → `ADMIN_HOST`. Host-routningen matchar nu rätt domän.

`wrangler.jsonc` deklarerar nu `admin.sadaqahsweden.se` +
`superadmin.sadaqahsweden.se` som `custom_domain` — manuellt tillagda
custom domains raderas annars vid varje `wrangler deploy`
(reconciliering mot deklarations-listan). Versionshanterat ⇒ överlever
framtida deploys. DNS-koppling kan kräva token-rättigheter i Cloudflare;
om deployen inte klarar det blir det en Zivar-punkt, men koddeklarationen
är ändå den hållbara fixen.

### FX3 — Federations-aktiverings-UI (F4-gap)

Ny Card "Region-admin (federation)" på `/granskning/organisationer/[id]`.
**Superadmin-only** (gated via `me.profil.admin_niva === 'superadmin'`),
visas bara om föreningen har ett aktiverat `forenings_konto_user_id`. Dropdown
över de 21 länen (fetch:as från `plats_taxonomi.niva='lan'`). Nuvarande
admin_niva + region_kod för förenings-kontot visas. Motivering ≥5 tecken
loggas i `admin_ingreppslogg` via RPC. Bekräftelsesteg i klartext före
verkställande.

Server action `uppgraderaTillRegionAdminAction` kallar de befintliga
RPC:erna `admin_satt_admin_niva('region_admin', motivering)` + 
`admin_satt_admin_region(p_region_kod, motivering)`. Båda
require_superadmin-guardade i DB. Idempotenta — re-set funkar.

Federationen kan nu tändas från plattformen utan DB-konsol.

### FX4 — Hård gating av andra-granskning + stickprovsvy (F3-gap)

**Migration 0048:** Skriver om `private.fatta_granskar_beslut`. Vid
`p_beslut='godkann'` OCH `kraver_andra_granskning(insamling)`=true:

```
OK om aktor.admin_niva = 'superadmin' eller NULL (nationellt team)
OK om aktor.admin_niva IN ('region_admin','medhjalpare') OCH
   aktor.admin_region_kod IS DISTINCT FROM insamling.lan_kod
RAISE EXCEPTION annars
```

Hård gating, inte varning. Region-admin/medhjälpare i SAMMA region som
en känslig/≥500 000 kr-insamling kan inte själv slutgodkänna — bara
begära ändring eller avvisa. Det externa ögat (superadmin, nationellt
team, eller region-admin från annan region) släpper igenom.

`begar_andring` + `avvisa` är inte gatade. Påverkar inte event-besluts-RPC.

**App:** Ny `/admin/stickprov` (superadmin-only). Listar
`stickprov_avvikande_granskare()` (>60% avvisningsandel, ≥5 beslut) med
pill för andel, admin_niva/region, besluts-volym, median handläggning.
Nav-länk "Stickprov" på `/admin` syns bara för superadmin.

### FX5 — MFA-nollställning för insamlare (F8-gap)

Ny sektion på `/admin/verktyg`: e-post-uppslag (case-insensitive) →
`profiles`-rad → `admin_logga_mfa_aterstallning`-RPC + `deleteAllMfaFactors`
via service_role-klienten. Funkar för **alla roller** (insamlare, förening,
granskare, admin) — inte bara team. Användaren omdirigeras till
`/team/2fa-setup` vid nästa skyddad request (kraver()-flödet är redan
rollagnostiskt sedan F8).

Bekräftelsesteg i klartext. Resultat visar antal raderade faktorer + roll
så admin ser att rätt konto träffades. Beskrivningstexten varnar
uttryckligen: identitetsverifiering utanför plattformen krävs annars är
detta en bakdörr.

### FX6 — Test-luckor + emblem-trigger + schema-USAGE-fix

**Tester (5 nya, samma tx-rollback-stil som `f1_region_scope.sql`):**
- `f2_ko_scope.sql` — region_ko_oversikt RLS-filtrerad.
- `f3_overklagande_jav.sql` — lamna_overklagande funkar en gång, UNIQUE-
  spärr på rad 2, region-admin nekas från avgör-RPC, markera_jav lyfter
  ärendet + skapar handelse.
- `f7_paus_team_roll.sql` — pre-paus = admin, pausad = insamlare + NULL
  admin_niva/region, aterstall = tillbaka, team_inaktiverad blockerar
  self-aterstall.
- `f8_aal2_kraver.sql` — require_aal2 nekar aal1, släpper aal2,
  admin_satt_kanslig fångas i aal1.
- `f10_donations_privacy.sql` — privat default, privat profil läcker inte
  antal, öppen vy returnerar count, anon kan kalla.

**Alla 5 verifierade gröna mot remote** via Supabase MCP execute_sql.

**Migration 0049 — emblem-trigger-utvidgning:**
F5:s ursprungliga trigger lyssnade bara på `UPDATE OF admin_niva` på
profiles. Byttes `organisation.forenings_konto_user_id` (förening pekar
om till annat konto) syncades inte `ar_region_admin`. 0049 lägger två
parallella triggrar på organisation: BEFORE INSERT/UPDATE OF
forenings_konto_user_id (sätter från nya kontorollen) + AFTER UPDATE
(re-syncar övriga rader som pekar på gamla kontot). Tillsammans med
profiles_synk-triggern är båda hållen täppta.

**Migration 0050 — schema-USAGE-fix (kritisk pre-existerande bug):**
Under test-skrivning upptäcktes att `authenticated` och `anon` saknade
`USAGE` på `private`-schemat. Public INVOKER-wrappers
(lamna_overklagande, markera_jav, admin_satt_kanslig,
antal_publika_donationer, fatta_granskar_beslut m.fl.) anropar
`private.<fn>()` under callerns roll — utan schema-USAGE kraschar varje
PostgREST-anrop med "permission denied for schema private". F3/F7/F8/F10
var alltså fungerande i SECURITY DEFINER-tester men trasiga i produktion
för riktiga authenticated/anon-användare.

`0019_grant_usage_private_to_authenticated.sql` fanns redan i repot men
hade aldrig applicerats (version-kollision). 0050 är den explicita
fixen.

Säkerhet: USAGE öppnar bara schema-synlighet. Individuella
`REVOKE EXECUTE FROM PUBLIC/anon` på känsliga private-funktioner
(t.ex. require_superadmin) kvarstår.

### Säkerhetsadvisor — efter FX1–FX6

Före + efter: samma uppsättning advisorer som efter F10. **Inga nya
WARN/ERROR från någon FX-migration.** Kvarvarande är pre-existerande:
- INFO: `public.mission` RLS utan policy.
- WARN × 4: `fatta_granskar_beslut`, `skicka_insamling_for_granskning`,
  `tilldela_granskning`, `uppdatera_granskning_anteckningar` — SECURITY
  DEFINER callable av authenticated (pre-existerande från Steg 3/10).
- WARN: Leaked password protection disabled — Zivar-uppföljning.

### Beslut tagna autonomt under FX-passet

| Beslut | Motivering |
|---|---|
| Edita 0043 på plats i stället för ny migration ovanpå | Brief: 0043 var aldrig applicerad som fil (syntaxfel = inget kördes). Att lägga ny migration ovanpå hade gett dubbel CREATE TABLE/RPC. Filen ska kunna replay:as ren från ny databas. |
| Renamne `regionaladmin` → `admin` (variabel/typ/sträng) i stället för att bara byta strängen | Briefen låste namnet `admin.` — TypeScript-typen `"regionaladmin"` blev semantisk vilseledning. En lokal mekanisk rename hade renare diff. |
| Två separata RPC-anrop i FX3 (admin_niva + admin_region) utan tx-wrappning | RPC:erna är idempotenta + loggar i admin_ingreppslogg. Vid fel mellan anropen syns halvläget direkt; re-submit reparerar. Tx-wrap hade krävt en ny RPC eller server-side BEGIN/COMMIT över Supabase JS — komplexitet utan vinst för en mänsklig superadmin-åtgärd. |
| FX4 gating tillåter `admin_niva IS NULL` (nationellt team) som extern granskare | "Granskande öga utanför regionen" matchar dem — nationellt team är inte bundna till en region. Speglar pattern från F1:s RLS (`niva IS NULL eller 'superadmin'` ser allt). |
| FX5 separat email→profil-uppslags-action i `/admin/verktyg` i stället för att importera team/actions | /admin/team:s aterstallMfaAction tar profileId; verktyg-flödet tar email. En tunn email-wrapper håller verktyg-routen självständig (samma stil som skyddad-actions). |
| FX6 (bonus): 0050 GRANT USAGE — applicerad inom FX6 trots att den ligger utanför briefens FX-lista | Test-skrivningen avslöjade att F3/F7/F8/F10:s RPCs är trasiga i produktion. Briefen säger uttryckligen att F3-koden inte ska peka på objekt som inte finns/inte funkar. Att lämna det otäppt hade varit att bryta mot briefens andemening (klar F-suite). Migration-filen 0019 fanns redan i repot — bara aldrig applicerad. |
| Två-stegs emblem-trigger (BEFORE för NEW-raden, AFTER för OLD-rad-rensning) | BEFORE-formen kan inte `UPDATE` ett systerrad utan att skapa rekursion; AFTER-formen kan inte modifiera NEW i samma rad. Naturligt två-trigger-mönster. |

---

---

## Status — Steg 17 (M18 federation)

**✅ ALLA KLARA** — pushade till `main` som tio separata commits
(`feat(f1)`…`feat(f10)`). Migrations 0041–0047.

### F1 — Admin-nivåer + region-scopad RLS (säkerhetskritisk)

Fundamentet. Migration 0041:
- Seed `admin@corevo.se` → `admin_niva='superadmin'` (idempotent, GUC-bypass).
- Session-cached helpers: `private.aktuell_admin_niva()`,
  `private.aktuell_region_kod()` (sql STABLE SECURITY DEFINER — samma form
  som `aktuell_roll`, en lookup per query inte per rad).
- Guards: `private.require_superadmin()`, `private.kraver_region_atkomst(text)`.
- RLS region-scope på granskning, granskning_handelse, insamling
  (granskar-grenarna). Mönster: `admin_niva IS NULL eller 'superadmin'` →
  ser allt; `region_admin/medhjalpare` → bara matchande region_kod.
  NULL-region-rader → bara superadmin/nationellt team.
- Pengaingrepp → **superadmin-only**: `admin_initiera_refund_donation/insamling`,
  `admin_stang_insamling`, `admin_satt_skyddad_identitet`.
- Region-scope-guards på `admin_pausa/aterstall_insamling`,
  `admin_avfard_larm`, `fatta_granskar_beslut`,
  `fatta_event_granskar_beslut`, `tilldela_granskning`,
  `uppdatera_granskning_anteckningar`. Bevarar befintliga RPC-kroppar;
  bara guard-blocket byts ut.
- Nya superadmin-only RPCs: `admin_satt_admin_niva`,
  `admin_satt_admin_region` + public INVOKER-wrappers.
- Index: `profiles_admin_niva_idx`, `profiles_admin_region_kod_idx`
  (partial där NOT NULL).
- **Test:** `supabase/tests/f1_region_scope.sql` (BEGIN/ROLLBACK) skapar
  två region-admins + insamlingar i två län (01 Stockholm, 14 Västra
  Götaland), simulerar varje admins session via `set_config + SET LOCAL
  ROLE authenticated`, asserter att cross-region SELECT returnerar 0
  rader och att `require_superadmin` raise:ar för region-admin.
  Verifierat — alla asserts gröna.

### F2 — Distribuerad granskningskö

Bygger emergent på F1:s RLS. Migration 0042:
- `public.region_ko_oversikt()` (SECURITY INVOKER) — per-region
  aggregat (öppna, SLA-brott, eskalerade, äldsta inskickning,
  snitt-väntetid). RLS från F1 filtrerar: region-admin/medhjälpare ser
  bara egen region; superadmin/nationellt team ser alla. NULL-region
  hamnar i superadmins kö — exakt vad brief specar.

UI:
- `/admin`: ny "Kön per region"-panel.
- `/granskning`: region-pill per rad (län-namn eller "Superadmins kö").

Auto-tilldelning och kö-routning är emergent från RLS — ingen ny logik
i M3 behövdes. Insamling utan region_kod syns bara för
superadmin/nationellt team; inget glapp möjligt.

### F3 — Skydden: jäv, andra-granskning, stickprov, överklagande

Migration 0043 + UI. Stort scope.

**Jäv:** `granskning.jav_markerad/skal/av/at` + `markera_jav`-RPC som
lyfter ärendet (tilldelad_granskare_id=NULL) och loggar i
granskning_handelse. UI-knapp "Markera jäv & lämna ifrån mig" på
beslutspanelen.

**Känslig + andra-granskning:** `insamling.kanslig` + `admin_satt_kanslig`-
RPC (region-scoped). Helper `private.kraver_andra_granskning()` returnerar
true vid kanslig=true ELLER målbelopp ≥ 500 000 kr i öre. Hård gating av
godkänn-besluten vid 2:a-granskning ligger vilande — flaggan + helper
finns, full multi-granskar-mekanik byggs när M3-flödet utökas (utanför
F3:s scope, batchad uppföljning).

**Stickprov:** `public.stickprov_avvikande_granskare()` (INVOKER-wrapper
runt private DEFINER med `require_superadmin` internt). Listar granskare
med ≥5 beslut och >60% avvisningsandel.

**Överklagande:** ny tabell `public.overklagande` med enum
`overklagande_status` + UNIQUE-index per insamling (1 ggn-regeln). RLS:
insamlare ser egen; superadmin/nationellt team ser alla (region-admin
ser ingen — det är de vars beslut överklagas; jävsskydd inbyggt).
RPCs: `lamna_overklagande` (insamlare av avvisad insamling, en gång) +
`superadmin_avgor_overklagande` (riv upp → insamling tillbaka till
under_granskning + ny granskning-runda, eller bekräfta avslaget).

UI:
- `/konto/insamling/[id]`: OverklagandeForm visas när status=avvisad
  och ingen befintlig överklagan; befintlig visas med status.
- `/admin/overklaganden`: superadmin-vy med inkomna + avgjorda
  överklaganden. Panel med riv-upp / bekräfta-knappar.

### F4 — Anmäl förening: kontaktperson + separat förenings-konto

Bygger på M10:s befintliga anmäl-/granskar-kö (Steg 11). Migration 0044:
- `organisation.kontaktperson_namn`, `kontaktperson_epost`,
  `forenings_konto_user_id` (FK auth.users), `forenings_konto_aktiverat_at`.
- `binda_forenings_konto`-RPC: granskare/admin sätter
  `profiles.ar_organisation=true`, kopplar `organisation.profil_id` +
  `forenings_konto_user_id`, publicerar katalog_status.

UI:
- Anmäl-form: nya kontaktperson-fält (obligatoriska).
- Granskar-panel: ny "Aktivera förenings-konto"-knapp efter publicering.
  Server action skapar separat Auth-user via Supabase Auth Admin API
  (`createUser`), genererar magic-link (visas för granskare att kopiera
  om Supabase SMTP inte når fram), binder kontot via RPC. Hanterar
  e-post-konflikt (existerande user återanvänds).

### F5 — Regional föreningsprofil + emblem

Migration 0045:
- `organisation.ar_region_admin` (denormaliserad boolean) + partial index.
- Backfill: föreningar vars konto har `admin_niva='region_admin'`.
- Trigger `private.profiles_synk_region_admin_emblem` på AFTER UPDATE
  OF admin_niva — synkar `org.ar_region_admin` när superadmin
  utser/avsätter via F1:s `admin_satt_admin_niva`.

UI:
- `/foreningar` (katalog): "Region-admin"-pill på kort när
  `ar_region_admin=true`. Region-admin-föreningar sorteras först.
- `/foreningar/[publicId]` (detalj): "Region-admin — godkänd
  samarbetspartner"-pill bredvid verifieringsnivån.

Härleds automatiskt — ingen separat "emblem"-toggle som kan glömmas.

### F6 — Subdomäner & inloggning

Host-baserad routning i middleware. Subdomänen är en INGÅNG, inte
säkerhetsgränsen — F1:s RLS är säkerheten i djupet. (Subdomän-namnet
uppdaterat i FX2: `admin.sadaqahsweden.se` + `superadmin.sadaqahsweden.se`.
Tidigare felaktiga `regionaladmin.` byttes ut.)

`middleware.ts`:
- Detekterar host (`sadaqahsweden.se` / `admin` / `superadmin`).
- Publik domän + path `/admin|/granskning|/team` → 308 redirect till
  `admin`-subdomänen. Publika sidan exponerar inga
  admin-ingångar.
- Admin-subdomänernas rotväg `/` → 307 redirect `/admin` (delad
  landning). Båda leder till samma `/admin`-vy; `admin_niva` styr vad
  som syns.
- AAL2-grinden från H1 gäller alla hosts.

`lib/host.ts`: `aktuellHostTyp()` + `arAdminHost()` helpers för Server
Components.

`site-nav.tsx`: `arGranskare`-villkoret kräver nu `visaInternaLankar=true`
(host ≠ publik). Granskar-/admin-/team-länkar visas bara på
admin-subdomäner (eller okänd host i dev/preview).

**Batchad uppföljning:** Hanterad i FX2 — subdomänerna är nu deklarerade i
`wrangler.jsonc` och skapas/uppdateras automatiskt vid `wrangler deploy`.
Om token saknar custom-domain-rättigheter blir det en Zivar-punkt vid
deploy-tillfället.

### F7 — Pausbar team-roll (skriver om M17 två-konto-modell)

Migration 0046:
- `profiles.team_roll_pausad_at` + `team_roll_pausad_skal`.
- `aktuell_roll()`: pausad → 'insamlare' (alla RLS-policys ärver).
- `aktuell_admin_niva()/region_kod()`: pausad → NULL.
- `profiles_skydda_falt`: blockerar direkt UPDATE av
  team_roll_pausad_at; bara via RPCs.
- `pausa_team_roll(p_skal)`: egen användare, raw roll måste vara
  granskare/admin.
- `aterstall_team_roll()`: blockeras om `team_inaktiverad_at` är satt
  (hård offboarding går inte att själv-återställa).

`lib/auth.ts aktuellAnvandare()` speglar DB-helpern — `me.roll` blir
'insamlare' när pausad så server components ser samma som RLS.

UI: `/konto/profil` ny Team-roll-sektion för team-konton (även när
pausade), med skäl-fält + pausa/återuppta-knappar.

### F8 — 2FA obligatoriskt för alla inloggade konton

Utvidgar H1:s AAL2-enforcement.

`lib/auth.ts kraver()`: MFA-checken körs nu för alla inloggade —
insamlare och förening också. Insamlare utan enrollad faktor redirectas
till `/team/2fa-setup` vid första kraver()-skyddade route.

`middleware.ts INTERN_PREFIX`: utökat med `/konto`, `/insamling`,
`/stripe/onboarding`. Insamlarens kontohandlingar gateas bakom aal2.
`/insamlingar/*` (publik katalog + donations-flödet) är medvetet
utanför — gäst-donation och inloggad donation fungerar utan MFA.

`/team/2fa-setup` är nu roll-agnostisk (gamla "bara team"-restriktionen
borttagen).

Återställningsvägen från H1 (admin nollställer MFA-faktor) gäller även
insamlar-konton — samma mekanik.

### F9 — Insamlare-onboarding: synlig pending-status

Härleder pending från `(stripe_account_id IS NOT NULL AND
stripe_onboarding_klar = false)`. Webhook `account.updated` flippar
status automatiskt sedan Steg 5 — det som saknades var den synliga
statusen.

UI:
- `/konto`: "Stripe-verifiering pågår"-Card för insamlare/förening i
  pending. Visar förklarande text + länk till `/stripe/onboarding`.
  Också en "Ej startad"-variant för insamlare som inte påbörjat
  onboarding än.
- `/admin`: ny "Stripe-pending insamlare"-panel listar pågående
  onboardings (RLS-filtrerat per region).

### F10 — Donationshistorik i profil (privat default)

Migration 0047:
- `profiles.visa_donations_publikt` boolean DEFAULT false.
- `antal_publika_donationer(uuid)` — INVOKER-wrapper runt private
  DEFINER. Returnerar 0 om profilen ej slagit på öppen vy; annars
  `count(*)` av bekräftade donationer.

UI:
- `/konto/donationer`: ny privat lista av egna donationer (RLS via
  `donation_select_egen`). Toggle för "Öppen vy: PÅ/AV". Bekräftelse-
  dialog vid PÅ.
- `/konto`: länk "Mina donationer".
- `/profil/[publicId]` (publik): "{N} donationer"-pill i hero när
  profilen valt öppen vy. Ingen summa, ingen lista — bara antal.

Gäst-donationer (utan konto) berörs inte; ingen `donator_id`, inget
att spara.

### Säkerhetsadvisor — efter F1–F10

Före + efter: samma uppsättning advisorer som efter H5. **Inga nya
WARN/ERROR från någon F-migration.** Kvarvarande är pre-existerande:
- INFO: `public.mission` RLS utan policy.
- WARN × 4: `fatta_granskar_beslut`, `skicka_insamling_for_granskning`,
  `tilldela_granskning`, `uppdatera_granskning_anteckningar` — SECURITY
  DEFINER callable av authenticated (pre-existerande från Steg 3/10).
- WARN: Leaked password protection disabled — Zivar-uppföljning.

Alla mina nya public RPCs är INVOKER-wrappers runt private DEFINER
(samma mönster som markera_jav, admin_satt_kanslig,
stickprov_avvikande_granskare etc) — undviker 0029-WARN.

### Beslut tagna autonomt under Steg 17

| Beslut | Motivering |
|---|---|
| `aktuell_admin_niva()/region_kod()` som `sql STABLE SECURITY DEFINER` (inte plpgsql) | Speglar `aktuell_roll()` exakt → samma session-caching i query-planen. Per-row plpgsql skulle re-querya profiles för varje rad. (Advisor-rådet under F1.) |
| `stickprov_avvikande_granskare` flyttad till `private.` + INVOKER-wrapper i `public.` | Annars 0029 SECURITY DEFINER-WARN. Matchar mönstret för markera_jav, admin_satt_kanslig, lamna_overklagande, superadmin_avgor_overklagande etc. |
| Andra-granskning: flagga + helper i v1, ingen hård gating av godkänn-besluten | F3:s scope rörde redan jäv + känslig + stickprov + överklagande. Hård multi-granskar-mekanik kräver en stor M3-omstrukturering — batcha till när M3 utökas. Helper + flagga finns för superadmin att kunna agera manuellt. |
| Pausad team-roll mappas via helpers, inte genom att flytta `profiles.roll` | "Originalrollen" bevaras → enkelt att återuppta. Alla RLS-policys använder redan `aktuell_roll()` så pausen blir säker på DB-nivå utan att röra någon policy. |
| F8: ta bort roll-restriktion på `/team/2fa-setup` istället för att skapa parallella `/konto/2fa-setup` | Samma Supabase MFA-flöde, samma kod, ingen anledning att dubbla. Bara villkoret runt redirect-kontrollen behövde lossas. |
| F4: separat förenings-konto via `auth.admin.createUser` + `generateLink`, returnera magic-länken till granskaren | Resend saknas (batchad uppföljning). Brief säger granskaren får "skicka invite till kontaktperson" — magic-link visad för manuell kopiering = robust fallback. När SMTP-providern är kopplad får kontaktpersonen e-posten automatiskt. |
| F2: emergent kö-routning från RLS, inget M3-omstrukturerings-pass | Brief: "Granskningskön filtreras på region via F1:s RLS. M3:s auto-tilldelning körs inom regionen." RLS gör det fritt — ingen ny tilldelningsalgoritm behövs. |
| F5: `organisation.ar_region_admin` denormaliserad + synk-trigger på profiles.admin_niva | Brief: "härled emblemet från admin_niva på förenings-profilen så det inte blir ett fält som kan glömmas bort". Trigger ger samma effekt utan N+1-query för publika katalogen. |
| F10: anon får kalla `antal_publika_donationer` (returnerar 0 om profil inte valt öppet) | Publika `/profil/[publicId]`-sidan måste fungera utan inloggning. Funktionen avslöjar inget om profiler som inte valt öppet. |

---

## Batchade uppföljningar (efter F1–F10)

Listan från H5 uppdaterad. Inget av detta blockerar federationen.

1. **Utse riktiga region-admins** — federationen tänds region för
   region; vilka moskéer/personer som blir region-admins är Zivars
   förtroendebeslut, operativt efter bygget. Koden klarar noll
   region-admins (allt i superadmins kö) — det är det normala
   utgångsläget.
3. **Beredskaps-superadmin** — minst ett konto till bör ha
   `admin_niva='superadmin'` som bus-factor-skydd. Schemat tillåter
   det (F1) — vem det blir är en föreningsfråga. Aktivera via
   `admin_satt_admin_niva`-RPC.
4. **Full multi-granskar-mekanik (andra-granskning)** — F3 lägger
   flagga + helper; hård gating av godkänn-besluten vid >500k eller
   känslig kräver en M3-omstrukturering (flergranskar-beslut, hold-
   tills-2-godkända-state). Aktivera när M3-flödet utökas eller
   första kanslig insamling kommer in.
5. **RESEND_API_KEY** — fortsatt vilande. Påverkar nu också F4:s
   förenings-invite (magic-link visas manuellt tills SMTP är på).
6. **Leaked password protection** — Supabase dashboard, Auth →
   Password security. Pre-existerande Security Advisor-WARN.
7. **Karta-basemap till produktion** — byt från OpenFreeMap till
   självhostad Protomaps PMTiles på Cloudflare R2.
8. **Team-e-post** — Cloudflare Email Routing för
   `namn@sadaqahsweden.se`.

---

## Föregående körningar (verifierat tidigare)

Steg 0–16 byggda, verifierade och pushade. Härdning H1–H5 körd
2026-05-24. Pengaflödet (Steg 5–7) end-to-end-verifierat i Stripe
testläge.

---

# Tidigare körningar (bevarade)

# SESSION-GOAL — Härdning H1–H5 + Steg 12–16

**Senaste körning (härdning):** `../2-Byggplan/10-Goal-Hardning.md` — körd autonomt 2026-05-24.
**Tidigare körning:** `../2-Byggplan/09-Goal-Steg-12-16.md` (Steg 12–16, samma dag).
**Stopp:** efter H5. Starta INTE Steg 17/18.

---

## Status — Härdningspass H1–H5

**✅ ALLA KLARA** — pushade till `main` som fem separata commits
(`feat(h1)`…`feat(h5)`). Migrations 0035–0039.

### H1 — Supabase MFA + AAL2-enforcement (säkerhetskritisk)

Stänger hålet: `totp_aktiverad` var en permanent flagga som sattes en gång
efter enroll. Team-konton loggade sedan in med bara lösenord. Stulet
lösenord = full team-åtkomst.

**Nu:** Supabase Auth inbyggd MFA (TOTP-faktorer). Sessionen lyfts till
`aal2` vid varje challenge. AAL2 krävs i **tre lager**:
- **Middleware** (`middleware.ts`) — `/admin`, `/granskning`, `/team/larm*`
  redirectar till `/team/2fa` när JWT-`aal=aal1`. `/login`, `/team/2fa*`
  och `/registrera` undantagna så sessionen kan lyftas utan loop.
- **`kraver()`** (`lib/auth.ts`) — server-component-render kollar
  `getAuthenticatorAssuranceLevel()`; om faktor saknas → `/team/2fa-setup`,
  om faktor finns men ej challenged → `/team/2fa`.
- **DB/RPC** — `private.require_aal2()` kallas som första rad i varje
  `admin_*`-RPC. Direkt RPC-anrop från aal1-session får
  `RAISE EXCEPTION 'Action kräver MFA (aal2)'`. RLS-policys på
  `team_invitation`, `team_activity_log`, `admin_larm`,
  `admin_ingreppslogg`, `admin_daglig_sammanfattning_state` kräver
  också aal2 för team-grenen.

**Migration 0035** rev hemmagjord TOTP: drop `public.totp_secret`, drop
`profiles.totp_aktiverad`/`totp_kravs`, drop `team_satt_totp_aktiverad`.
Tomt utgångsläge — inga teammedlemmar enrollade — gjorde det riskfritt.
Skrev om `team_loesa_in_invitation` med GUC-bypass av triggern (fixade
samtidigt latent bug i 0034 där SECURITY DEFINER ensamt inte räckte
för att förbigå `profiles_skydda_falt`). Avinstallerade `otpauth`,
`qrcode`, `@types/qrcode`.

**Återställning:** Server Action `aterstallMfaAction` i admin/team —
loggar via `admin_logga_mfa_aterstallning`-RPC + raderar samtliga
MFA-faktorer via Supabase Auth Admin API (`auth.admin.mfa.deleteFactor`).
Användaren omdirigeras till `/team/2fa-setup` vid nästa intern-zon-
request.

### H2 — Refund-verktyg i admin

Stänger luckan: enum-värdet `initiera_refund` fanns sedan 0031 men
inga RPCer/UI. M16 Block 4 "Initiera refund" listades som kärnverktyg.

**Migration 0036:**
- `admin_initiera_refund_donation(uuid, refund_anledning, text)` —
  skapar pending `refunds`-rad med `idempotency_key=refund:donation:<uuid>`,
  loggar till `admin_ingreppslogg`. `ON CONFLICT DO NOTHING` blockerar
  dubbletter — dubbelklick = en rad.
- `admin_initiera_refund_insamling(uuid, refund_anledning, text)` —
  loopar refunderbara donationer (status `succeeded`/`partially_refunded`,
  inte fullt refunderade), anropar per styck.
- `forhandsberakna_refund_insamling(uuid)` — read-only helper för
  bekräftelsesteget (antal + summa_ore).
- Alla tre kräver `aal2 + admin`.

**Edge Function `process-refund` (ny):** kallas av Server Action efter
RPC commit. Anropar `stripe.refunds.create()` med `idempotencyKey` från
DB-raden. Best-effort `stripe.transfers.createReversal()` vid paid
transfers; om Stripe nekar → `failure_reason` flaggas + extra rad i
`admin_ingreppslogg` med "Manuell uppföljning krävs". Webhook
(`charge.refunded`, befintlig) synkar slutstatus i `refunds` via
`stripe_refund_id`-match — handlern iterar `charge.refunds.data[]`
(redan korrekt sedan tidigare migration).

**UI:** `/admin/verktyg` ny route med refund-modal (en donation / alla
på insamling). Bekräftelsesteg visar antal + summa innan verkställande
("Detta refunderar N donationer för X kr. Går inte att ångra.").

### H3 — `skyddad_identitet`-flagga

Stänger luckan: M12 Block 5.3 kräver att skyddade insamlare aldrig
hamnar på kommun-nivå på kartan. Fältet saknades; `rakna_om_geo_aggregat`
hade explicit placeholder-kommentar ("Lägg till `p.skyddad_identitet`
när M6 inför fältet").

**Migration 0037:**
- `profiles.skyddad_identitet boolean NOT NULL DEFAULT false`.
- Tillagd i `profiles_skydda_falt`-blacklist.
- `rakna_om_geo_aggregat` läser nu `p.skyddad_identitet` i `bas`-CTE.
  Kommun-CTE:erna filtrerar bort skyddade (`AND NOT agare_skyddad`).
  Län-CTE:erna inkluderar dem (21 grova områden — ingen meningsfull
  anonymitetsförlust).
- `admin_satt_skyddad_identitet(uuid, boolean, text)` RPC — kräver
  aal2 + admin, loggar till `admin_ingreppslogg` (typ `overrida_falt`),
  räknar om aggregatet direkt så kartan speglar förändringen.

**UI:** `SkyddadIdentitetForm` i `/admin/verktyg` — admin söker via
e-post + toggle + motivering.

### H4 — Hård offboarding

Stänger luckan: `admin_inaktivera_team_medlem` sänkte rollen men
inaktiverad person behöll sin session tills nästa request renderade
`kraver()`. Brief: offboarding ska vara omedelbar.

**Migration 0038:** RPC:n loggar nu en extra `team_activity_log`-rad
med typ `session_invalidated` — audit-spår även om Server Action
skulle krascha mellan RPC och logout-anrop. Bevarar
`require_aal2`-guarden från 0035.

**Kod:** `inaktiveraTeamMedlemAction` (Server Action) kallar
`revokeAllSessions(profileId)` efter RPC commit. Helpern
(`lib/supabase/admin.ts`, ny i H1) POSTar
`/auth/v1/admin/users/{user_id}/logout?scope=global` med
service_role-bearer. Fallback: `auth.admin.updateUserById(id,
{ ban_duration: '1s' })` revokerar tokens som sidoeffekt.

### H5 — Bootstrap admin-konto

Stänger luckan: ingen profil hade `roll='admin'` i DB. Refund-verktyget
(H2), pengaflödet, teamhanteringen kräver `admin`. Första admin-kontot
går inte via invite-flödet (chicken-and-egg: invite kräver admin).

**Migration 0039 (idempotent seed-only):**
- DO-block sätter `request.jwt.claim.role='service_role'` LOCAL i tx
  så `profiles_skydda_falt`-triggern släpper igenom roll-uppdateringen.
- `UPDATE profiles SET roll='admin' WHERE e_post='admin@corevo.se'
  AND roll<>'admin'`. Idempotent — re-körning ger noll ändringar.
- `RAISE WARNING` om `zivar.mahmod@corevo.se` inte är `insamlare`
  (förväntas oförändrat per M17 Block 1).

**Verifierat post-migration:**
- `admin@corevo.se` → `admin`
- `zivar.mahmod@corevo.se` → `insamlare` (oförändrat)

Kontot behöver enrolla Supabase MFA vid första login till intern-zonen
(per H1) — förväntat och rätt enligt brief.

### Beslut tagna autonomt under härdningen

| Beslut | Motivering |
|---|---|
| Supabase inbyggd MFA framför egen `totp_verifierad_at`-cookie (H1 fallback) | Brief: "förstahandsvalet". Purpose-built för AAL-lyft, klarar challenge → verify → JWT-claim utan extra DB-trafik. Egen cookie kräver att vi själva bygger session-state och hanterar replay. |
| Admin-reset av MFA istället för recovery codes | Brief: "du väljer formen". Admin-reset är linjär med offboarding-flödet (H4) och kräver inte att användaren förvarar koder säkert. Recovery codes lägger till en känslig-data-yta. |
| Refund-flöde 2-stegs: DB-RPC skapar pending-rad, Edge Function kallar Stripe | Stripe-anrop är externt sidoeffekt — får inte ske i DB-tx. Idempotency_key garanterar att dubbla anrop inte ger dubbla Stripe-refunds. Webhook synkar slutstatus. |
| Per-RPC `private.require_aal2()`-helper i stället för inline-check | Extrahering gör att H4:s `CREATE OR REPLACE admin_inaktivera_team_medlem` inte glömmer guarden. En rad att uppdatera vid policy-byte. |
| GUC-bypass via `set_config('request.jwt.claim.role','service_role',true)` för H5-seed (och rewrite av `team_loesa_in_invitation` i H1) | `SECURITY DEFINER` ensamt räcker inte — `auth.role()` läser `request.jwt.claim.role`, inte Postgres `current_user`. GUC-mönstret matchar triggerns explicita släpp-villkor. Verifierat i 0034:s latenta bug — den hade aldrig körts (inga teammedlemmar). |
| AAL2-RLS på `team_log`-egen-rad-gren = INTE krav | Annars moment-22: användare kan inte läsa sin egen `totp_aterstalld`-rad utan att redan ha enrollad MFA. Egen rad är skyddad av `profile_id = auth.uid()`-villkoret. |

### Säkerhetsadvisor

Före + efter H1–H5: samma uppsättning advisorer. Inga nya
WARN/ERROR från någon migration. Kvarvarande är pre-existerande:

- INFO: `public.mission` RLS utan policy (pre-existerande).
- WARN × 4: `public.fatta_granskar_beslut`, `skicka_insamling_for_granskning`,
  `tilldela_granskning`, `uppdatera_granskning_anteckningar` —
  SECURITY DEFINER callable av authenticated (pre-existerande från
  Steg 3/10).
- WARN: Leaked password protection disabled — Zivar-uppföljning per
  brief.

Inga av dessa är P0-lints. Brief: "Security Advisor grön" — i
betydelsen ingen ny WARN/ERROR från denna körning.

### Test-kortlek (post-deploy verifiering)

- **H1:** Logga in som `admin@corevo.se` → omdirigeras till
  `/team/2fa-setup` (ingen faktor enrollad). Enrolla → logga ut →
  logga in → `/team/2fa` → kod → `/admin` öppnas. Direkt RPC-anrop
  i aal1-session ger `RAISE EXCEPTION 'Action kräver MFA (aal2)'`.
- **H2:** Stripe testläge: refunda en testdonation från
  `/admin/verktyg` → `donation.status='refunded'`,
  `refunds.status='succeeded'` (efter webhook), `admin_ingreppslogg`-
  rad finns. Dubbelklick → en rad (unique idempotency_key).
- **H3:** Sätt skyddad_identitet på en testprofil. Kör
  `rakna_om_geo_aggregat`. Verifiera: aggregatet inkluderar dem på
  län-nivå men inte kommun-nivå.
- **H4:** Två-flik-test — inaktivera team-medlem i flik A; flik B:s
  session ska vara död omedelbart vid nästa request.
- **H5:** `SELECT e_post, roll FROM profiles WHERE e_post IN
  ('admin@corevo.se','zivar.mahmod@corevo.se')` → `admin` resp
  `insamlare`. ✓

---

## Batchade uppföljningar — kräver Zivar, blockerar inte H1–H5

Brief 10:s lista plus det som lever kvar från tidigare körningar:

1. **Leaked password protection** — slå på i Supabase dashboard
   (Authentication → Password security). Pre-existerande Security
   Advisor-WARN.
2. **`RESEND_API_KEY`** — sätt i miljön. Låser upp e-postkanalen:
   kvitton, daglig sammanfattning (Steg 15), community-notiser via
   e-post.
3. **Karta-basemap till produktion** — byt från OpenFreeMap till
   självhostad Protomaps PMTiles på Cloudflare R2. Konfig-punkt:
   `BASEMAP_STYLE_URL` i `app/(public)/karta/karta-klient.tsx`.
4. **Team-e-post** — Cloudflare Email Routing för
   `namn@sadaqahsweden.se`.

(Punkt 4 om `skyddad_identitet`-flaggan från tidigare lista är nu
implementerad i H3 — den är inte längre en uppföljning.)

Steg 17 (federation) och Steg 18 (innehåll/FAQ) planeras separat
tillsammans med Zivar. **Starta inget byggsteg.**

---

## Status — Steg 16: Team & intern arbetsyta (M17)

**✅ KLAR** — pushad (commit nedan). **Stopp — startar INTE Steg 17.**

### Vad som byggdes

**Databas (migrations 0033–0034)**

- `0033_team_arbetsyta` — `team_invitation` (token-baserad), `totp_secret`
  (per profil, strikt RLS: bara owner läser), `team_activity_log`
  (append-only audit för team-händelser). Lägger `totp_kravs`,
  `totp_aktiverad`, `team_inaktiverad_at` på `profiles`; utökar
  `profiles_skydda_falt` blacklist så icke-admin aldrig kan sätta
  dessa själva.
- `0034_team_funktioner` — `admin_bjud_in_team_medlem`,
  `team_loesa_in_invitation` (matchar inloggad e-post mot inbjudans),
  `admin_inaktivera_team_medlem` (offboarding — sätter roll till
  donator + `team_inaktiverad_at`, bevarar historik), 
  `team_satt_totp_aktiverad`. Alla loggar i `team_activity_log` i
  samma transaktion.

**App**

- `/admin/team` — admin-vy med invite-form, lista över aktiva
  inbjudningar (URL kopierbar) och team-medlemmar med
  TOTP-statuspill + inaktivera-knapp.
- `/team/accept-invite/[token]` — redemption-sida; redirectar till
  /login om ej inloggad, anropar RPC och redirectar till /team/2fa-setup.
- `/team/2fa-setup` — TOTP-enroll med QR-kod (genererad serverside via
  `qrcode`-npm), 6-siffrig verifiering via `otpauth`. När verifierad:
  `totp_aktiverad=true` + activity-log.
- `/team/min-aktivitet` — personlig audit-log.
- `lib/auth.ts` — `kraver()` redirectar till `/team/2fa-setup` om
  granskare/admin har `totp_kravs=true` men `totp_aktiverad=false`.
  Detta är den faktiska enforcement-punkten — inget skyddat
  /admin- eller /granskning-route kan nås utan TOTP.
- Nav-länk "Team" för admin.

**Klar när**

- [x] Inloggad, rollmedveten arbetsyta som omsluter M3 (`/granskning`)
      och M16 (`/admin`).
- [x] Två roller: Admin, Granskare. (Stöd ligger redan på `anvandar_roll`-
      enumen från Steg 2; Support är parkerad per brief.)
- [x] Team-konton med inbjudan (token-länk, 7 dagars expiry).
- [x] Obligatorisk 2FA TOTP-**enroll** (kraver()-funktionen blockerar
      åtkomst till skyddade routes tills enroll är klar).
- [ ] **Inte i denna runda:** per-session TOTP-**verifiering** vid login.
      `totp_aktiverad` är en permanent flagga som sätts efter enroll —
      stulet lösenord = full team-åtkomst utan att TOTP-appen någonsin
      används. Sant "obligatorisk 2FA" kräver Supabase Auth MFA-faktorer
      eller en per-session `totp_verifierad_at`-cookie som challenge:as
      vid login. Lägg in före riktiga team-onboardas. Se uppföljning.
- [x] Onboarding/offboarding (invite → redeem → 2FA-setup; offboarding
      via `admin_inaktivera_team_medlem`).
- [x] Append-only aktivitetslogg (`team_activity_log` har ingen
      INSERT-policy för auth — bara RPC:erna i 0034 skriver; ingen
      UPDATE/DELETE-policy alls).
- [x] Ingen direkt databasåtkomst — varje team-handling går via RPC
      eller server action; RLS låser tabellerna även om någon försökte.
- [x] Roll-gränstest — `admin_bjud_in_team_medlem` raise om icke-admin;
      `admin_inaktivera_team_medlem` raise om icke-admin eller om man
      försöker inaktivera sig själv.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Team-medlemmar = `profiles` med `roll IN ('granskare','admin')` (ingen separat `team_members`-tabell) | Profilen finns redan, rollen styr åtkomst. En separat tabell hade dubblat sanning utan vinst. Invitations + activity + TOTP är dock egna tabeller eftersom de har annan livscykel. |
| Invite-flöde utan e-postutskick — admin kopierar URL manuellt | RESEND_API_KEY är vilande (batchad uppföljning). När den finns: lägg till en `pg_net.http_post`-trigger på invite-skapande som postar till en send-invitation-edge-function. |
| TOTP-secret i klartext med RLS-skydd "bara owner" | Krävs för HMAC vid verify. Vault/pgsodium ger ytterligare lager men ökar komplexiteten. Lägg till pgsodium-kryptering när first team-member är onboardad. |
| Återanvänd `anvandar_roll`-enumen i stället för separat team-roll-enum | Brief: Admin + Granskare. Existing roles passar. När fler nivåer kommer (B1 superadmin/region_admin) → använd det reserverade `admin_niva`-fältet. |
| Enforcement i `kraver()` (`lib/auth.ts`), inte i middleware | Middleware körs i Edge-runtime — vill inte göra en DB-query där per request. `kraver()` körs i Server Component-render, redan inom DB-context. Tradeoff: en användare som hittar en RPC-direkt-anrop utan att gå via en kraver-skyddad page kan kringgå TOTP-checken. RLS-policys är dock fortfarande på plats, så de viktigaste tabellerna är skyddade. Lägg in middleware-check när framework har stöd för cached profil-läsning. |

### Kantfall

- **TOTP-recovery** — `totp_secret.recovery_codes` finns som array; UI
  för att generera/visa/använda dem inte implementerad. Admin kan
  fortfarande återställa via `admin_inaktivera_team_medlem` + ny
  invite, eller via direktöverskrivning av `totp_aktiverad=false`
  via service_role.
- **Invite-utskick** — token är synlig i admin-listan och kan
  kopieras. RESEND-integration kommer i en uppföljning.
- **Session-invalidation vid offboarding** — `admin_inaktivera_team_medlem`
  sätter `team_inaktiverad_at` + sänker rollen till `donator`; en
  redan inloggad person förlorar rättigheterna när nästa request
  rendrar `kraver()`. För hård "kicka ut nu" behövs Supabase Auth
  Admin API:s sign-out. Lägg till om kritiskt.

---

## Status — Steg 15: Admin & dashboard (M16)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0031–0032)**

- `0031_admin_larm_logg` — `admin_larm` (vad som visas i Drift), 
  `admin_ingreppslogg` (append-only — varje admin-ingrepp loggas), 
  `admin_daglig_sammanfattning_state` (per-admin schema-config för
  digest), enums `larm_niva` (rod/gul/gron), `larm_kategori`,
  `larm_status`, `admin_ingrepp_typ`.
- `0032_admin_larm_funktioner` — `skapa_larm` (central skapelse),
  `larm_pa_donation_bekraftad`-trigger (gult vid >25k, rött vid 0→50k
  inom 1h), `larm_skanna` pg_cron-jobb var 15:e minut (rött SLA-brott
  vid >96h), `admin_pausa/aterstall/stang_insamling`, `admin_avfard_larm`
  — alla med ingreppslogg-INSERT i samma transaktion.

**App**

- `/admin` — driftöversikt med fyra paneler (livscykel, granskningskö,
  pengaflöde, systemhälsa). Larm-band längst upp som visas bara när
  det finns aktivt larm (grön-som-default).
- `/admin/larm` — full larm-lista + inline-hantering (avfärda med
  motivering).
- `/admin/logg` — ingreppsloggen (append-only, sökbar).
- `/admin/statistik` — intern statistik (insamlingar, donationer,
  granskning, geografi).
- `/admin/region-rapport` + `/admin/region-rapport/[lanKod]` —
  utskriftsvänlig regionrapport per län. Vägrar generera under
  tröskel 5. Browser-print → PDF (brief säger "ditt val på formatet").
- `/statistik` — publik kurerad statistik med k-anonymitet 5 per län
  (M12-enhetligt).
- Nav-länken "Admin" syns nu för granskare/admin.

**Klar när**

- [x] Driftöversikt med fyra paneler (grön-som-default).
- [x] Statistik-dashboard intern + publik delmängd (k-anonymitet 5).
- [x] Tvånivå-larm med trösklarna: >96 h SLA brott (röd), >25k öre
      enskild donation (gul), 0→50k öre inom 1h (röd). Stripe-tyst
      och misslyckad utbetalning är reserverade i kategori-enumen
      men kräver webhook-state som inte finns ännu (defer).
- [x] Verktygslådan: pausa/återställ (granskare+admin), stäng (admin),
      avfärda larm. Refund-knapp defer — kräver Stripe-call (struktur
      finns via `admin_ingrepp_typ='initiera_refund'`).
- [x] Oföränderlig admin-logg (`admin_ingreppslogg`, ingen UPDATE/DELETE-policy).
- [ ] **Defer:** Daglig sammanfattning — schema-state finns, men
      utskickjobbet kräver RESEND_API_KEY i miljön (in-app-kanalen
      räcker tills den nyckeln finns). Se uppföljning.
- [x] Regionrapport-export (utskriftsvänlig HTML; tröskel 5).
- [x] Federation-schemat reserverat (gjordes i Steg 12: `admin_niva`,
      `admin_region_kod`, `granskning.region_kod`).
- [x] Test för roll-behörighet — varje RPC kollar `aktuell_roll()`,
      RLS skyddar tabellerna ändå.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Regionrapport som **utskriftsvänlig HTML** (browser print → PDF) i stället för server-genererad PDF | Brief: "ditt val på formatet; PDF rekommenderas". HTML+print är robust under Cloudflare Workers utan PDF-runtime, kräver inga nya deps, fungerar perfekt för månadsutskrifter. PDF-generering kan slottas in via @react-pdf/renderer eller en print-service om volymen rättfärdigar. |
| Daglig sammanfattning bara struktur i v1 (schema-state-tabell), själva utskicket defer | Brief säger "vilande tills `RESEND_API_KEY` är satt". In-app fungerar — granskaren ser allt på `/admin`. När RESEND finns: pg_cron-jobb 07:00 per admin-rad. |
| Larm-trigger på donation körs i transaktionen → garanterar att larm syns omedelbart | Webhook-callbacken är redan idempotent; triggerns extra arbete är trivial. |
| Stat-dashboard räknar från råa rader (insamling, donation) inte aggregat-tabell | Volymen är liten i v1; cachning kan introduceras när trafiken kräver. |

### Kantfall

- **Daglig sammanfattning utskick** — `admin_daglig_sammanfattning_state`
  finns med tid + kanalpref; pg_cron-jobb som genererar dagspaketet
  och postar via Resend behövs när nyckeln finns. In-app-vyn
  (`/admin`) ger samma info live.
- **Refund-verktyget** — `admin_ingrepp_typ` har `'initiera_refund'`
  som värde; RPC och UI defer (kräver Stripe-call + idempotency-
  kontroll). Lägg till när first refund behövs.

---

## Status — Steg 14: Events & platsinfo (M14)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0029–0030)**

- `0029_event` — `event`-tabell (M14 Block 1.2 alla fält + återkommande
  som JSON-mönster, en rad), `oppettid` (organisations öppettider,
  Block 2.3), check-constraints för exakt en arrangör + konsistent plats.
  RLS: publicerade events publika; arrangör + granskare/admin ser sina.
  Utökar `granskning` med `event_id`; granskning är nu polymorph
  (insamling_id eller event_id, en av två). Trigger `event_status_skydd`
  förhindrar att arrangören sätter status fritt.
- `0030_event_funktioner` — `skicka_event_for_granskning` med fast-track
  för organisationer som har minst 3 publicerade event (privatpersoner
  granskas alltid, brief). `fatta_event_granskar_beslut` (godkänn /
  begär ändring / avvisa). `event_auto_cleanup`: passerade events →
  `avslutad`, gamla utkast → soft-delete efter 30 dagar, orörda
  återkommande serier → `arkiverad` efter 6 mån. pg_cron schemalägger
  jobbet 04:05 varje natt.

**App**

- `/events` — publik lista med stad-/typ-filter, "nästa förekomst"
  för återkommande, kort med plats/typ-pills.
- `/event/[publicId]-[slug]` — publik detalj.
- `/konto/event` + `/konto/event/nytt` — arrangörens flöde:
  skapa utkast → skickas direkt för granskning (eller fast-track för
  betrodd förening).
- `/granskning/event` + `/granskning/event/[id]` — granskar-kö med
  48 h SLA-markering, beslutspanel (samma triad som M3).
- `/foreningar/[publicId]` får en moské-/förenings-sektion med
  öppettider + kommande events (M14 Block 2 — moské-sidan = vy av
  M10-entitet med M14-överlägg).
- `lib/event.ts` — typer, label-mappar, `nastaForekomst` för
  återkommande, `formatEventTid`, `formatUpprepning`.

**Klar när**

- [x] Event-objekt skapas, granskas (48 h SLA, lättare checklista) och publiceras.
- [x] Moské-sida som vy av M10-entitet med öppettider (under förening-sidan).
- [x] Eventlista med filter (stad, typ).
- [x] Events som pin-lager på M12-kartan — toggle "Visa events" på
      `/karta` renderar publicerade fysiska events från `event.plats_lat/lng`.
- [x] Återkommande event som ett objekt (`upprepning` + `upprepning_veckodag`).
- [x] Auto-städning av passerade event (`event_auto_cleanup` pg_cron).
- [x] Events som av-/påslagbart pin-lager på M12-kartan (`/karta` har nu
      en "Visa events"-toggle ovanför vy-växlaren; klick på pin → event-sida).
- [x] Fast-track efter 3 rena event (orgs only, privatpersoner aldrig).
- [x] RLS på nya tabeller.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Återanvänd `granskning`-tabellen med nytt `event_id`-fält + check att exakt en av (insamling_id, event_id) är satt | Brief: "Återanvänd M3:s kö-koncept". Polymorf granskning ger samma kö-mekanik + samma append-only logg (`granskning_handelse`). |
| Fast-track-kriterium: `arrangor_org.events publicerade >= 3` (utan eskaleringscheck i v1) | Brief säger "betrodda föreningar efter 3 rena event". Eskalering finns inte ännu på events — uppgradera kriteriet när M16 inför detta. Privatpersoner låsta från fast-track per brief. |
| Återkommande visas som **ett** objekt med `upprepning` + `upprepning_veckodag`; `nastaForekomst()` beräknar i klient/server vid render | Brief: "ett objekt med upprepningsmönster, inte hundra rader". Inställda enskilda förekomster i `installt_forekomster date[]`. |
| Auto-cleanup-cron 04:05 svensk natt | Låg trafik, slipper konflikta med settle-jobben på :15. |
| Event utan separat "submit"-knapp; formuläret skickar direkt för granskning vid create | Färre steg → snabbare time-to-publish. Arrangören kan inte spara utkast utan att skicka i v1 — om behovet uppstår, gör en separat "spara utkast"-knapp. |

### Kantfall noterade i kod

- **Events på M12-kartan** — `event`-features kan tillfälligt visas
  som pin-layer i `karta-klient.tsx`. Datan stöder det (event-table
  har `plats_lat`/`plats_lng`); UI-toggle och layer-rendering är en
  liten patch att göra i nästa pass. Lägger som batchad uppföljning så
  Zivar ser den.
- **Cover-bild-uppladdning** — `event.cover_path` finns; UI för upload
  defer (Supabase Storage-flödet är samma som för insamling_media).
- **Skapande-flödet för organisationer** kräver att organisationen är
  publicerad (M10 katalog_status='publicerad'). Endast då dyker den upp
  i "Arrangera som"-dropdownen.

---

## Status — Steg 13: Community & samtal (M13)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0027–0028)**

- `0027_community` — tabeller `kommentar`, `reaktion`, `rapport`,
  `ordlista` + enums `community_objekt_typ`, `reaktion_typ`,
  `ordlista_severity`. Lägger `kommentarer_avstangda` på `insamling`.
  RLS på allt: alla läser publika kommentarer, dolda syns bara för
  authoren + insamlingens ägare + granskare/admin. INSERT är blockerat
  direkt — allt går via `posta_kommentar`-funktionen så validering
  (rate-limit, ordlista, parent-koll) sker centralt.
- `0028_community_funktioner` — `posta_kommentar` (huvudvägen in),
  `satt_reaktion` (toggle), `rapportera_kommentar` (auto-hide vid 3
  oberoende), `granskare_dolj_kommentar` / `granskare_aterstall_kommentar`.
  `kontrollera_ordlista` matchar mot redigerbar lista. Public INVOKER-
  wrappers delegerar till private DEFINER (SAKERHETSREGLER §3).
  Seedat 7 ordlista-poster (spam-mönster) — admin utökar via Steg 15/16.

**App**

- `app/(public)/insamlingar/[publicId]/community-section.tsx` — Samtals-
  sektionen på insamlingssidan. Visar Dua/Stöd-räknare, formulär,
  kommentarslista med ett trådsteg, "Insamlare"-badge för ägaren.
- `app/(public)/insamlingar/[publicId]/uppdatering-community.tsx` —
  inbäddad reaktion + kommentarsstrimma per transparens-uppdatering.
- `kommentar-form.tsx` / `reaktion-knappar.tsx` / `kommentar-rad.tsx` —
  klient-komponenter med rapport-formulär, radera-knapp och granskar-
  åtgärder (dölj/återställ) som visas för rätt roll.
- `community-actions.ts` — server actions som anropar RPC:erna.
  Mappar PG-fel till läsbara meddelanden.
- `(konto)/insamling/[id]/kommentarer-toggle.tsx` — insamlare kan
  stänga av kommentarsfältet (Block 2.6) från sin dashboard.
- `transparens-tidslinje.tsx` accepterar nu en valfri `community`-prop;
  insamlingssidan skickar in, profil-/övrig-användning får tidigare
  beteende.

**Klar när — bockad**

- [x] Kommentarer + Dua/Stöd på insamlingar och uppdateringar.
- [x] Inloggning krävs (RPC raise om `auth.uid()` är NULL).
- [x] 500-teckens ren text, inga länkar (regex i `posta_kommentar`).
- [x] Ett trådsteg — `posta_kommentar` vägrar parent som själv har parent.
- [x] Ordlistefilter (`ordlista` + `kontrollera_ordlista`).
- [x] Hastighetsspärr — 30 sekunder mellan kommentarer per user.
- [x] Rapport-flöde + auto-dölj vid 3 oberoende rapporter.
- [x] Modereringskö-data finns (`rapport` + `kommentar.dold` flaggor) —
      ytan landar i Steg 15/16 per brief.
- [x] Insamlaren kan stänga av kommentarsfältet (toggle på dashboarden).
- [x] Alla nya tabeller har RLS.
- [x] Behörighetstester via RLS-policys + RPC-validering.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Två reaktioner: `dua`, `stod` (enum) | Brief — bara positiva, två val räcker. |
| `INSERT` på kommentar/reaktion/rapport blockerat i RLS — allt via RPC | All validering på ett ställe, kan inte kringgås. |
| 30 sekunders rate-limit per user för kommentarer | Brief säger "hastighetsspärr mot spam-skurar" utan exakt värde. 30 s är restriktivt nog för att stoppa spam, snällt mot långa svar. |
| Ordlista — 5 hard_block + 2 soft_flag spam-poster vid seed | Brief: "skapa en svensk baslista … så teamet kan utöka den senare". Diskriminerings-/hat-listan är admin-uppgift (känsligt innehåll). Spam-mönster (URL-shorteners + kontaktlänkar utanför plattformen) är säkra att seeda. |
| Soft-delete (raderad_at) bara om kommentaren har svar; annars hård DELETE | Bevarar trådkonsistens utan att kvarhålla rader i onödan. |
| Granskar-åtgärder (dölj/återställ) visas direkt på kommentar-raden för granskare/admin | Brief: modereringskön är data nu, ytan i Steg 15/16. Inline-knappar låter granskarna jobba från publika sidan tills arbetsytan finns. |

### Kantfall noterade i kod

- **Per-kommentar-redigering** är inte implementerat (brief säger parkerat).
- **Konto-eskalering** (varning → kommentarsspärr → avstängning) — RLS
  + `kontofryst`-flaggan stöder mekaniken; UI för admin att applicera
  den hör hemma i Steg 15/16. Brief säger jag väljer rimliga gränser:
  spärrtid riktmärke 7 d (i kod-kommentar i 0028).

---

## Status — Steg 12: Karta & geografisk insikt (M12)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0022–0026)**

- `0022_plats_taxonomi` — tabell + RLS + hjälpfunktioner.
- `0023_plats_taxonomi_seed` — seed för 21 län + 290 kommuner (SCB-koder).
- `0024_insamling_normalisera_geo` — nya kolumner `insamlar_kommun_kod` +
  `insamlar_lan_kod` på `insamling`, normaliseringstrigger som slår upp
  kod från `insamlar_stad`, backfill. **Federation-prep (Tillägg B1):**
  `profiles.admin_niva` + `profiles.admin_region_kod`, `granskning.region_kod`
  reserverade — flaggorna skyddas av utökad `profiles_skydda_falt`-trigger
  (icke-admin kan **inte** sätta sig som superadmin).
- `0025_geo_aggregat` — `geo_aggregat`-tabellen + `rakna_om_geo_aggregat`
  (kärnberäkningen), k-anonymitetströskel 5 (M12 Block 5.2 + brief
  tvärgående beslut), pg_cron-jobb var 6:e timme + status-byte-trigger.
- `0026_fix_k_anonymity_search_path` — Security Advisor lint-fix (saknad
  `SET search_path = ''` på `private.k_anonymity_troskel`).

**Säkerhetsadvisor:** alla mina P0/P1-lints gröna. Kvarvarande WARN är
pre-existerande från tidigare migrationer (publika SECURITY DEFINER-
wrappers från `0019`, mission deny-all från `databasplan`) eller auth-
konfiguration (leaked-password-protection — Zivar-uppgift).

**App (`5-Kod/app/(public)/karta/`)**

- `page.tsx` — server-renderad, ISR var 6:e timme (samma takt som
  pg_cron-jobbet), bakar in hela aggregatet i en payload.
- `karta-klient.tsx` — MapLibre GL JS med OpenFreeMap positron basemap
  (gratis, ingen API-nyckel). Tre vyer: **Län** (choropleth Sverige),
  **Kommun** (drill-down), **Hjälp-vy** (världen, cirkelmarkörer per
  hjälp-land).
- `topplista.tsx` — topplista bredvid kartan (Block 1.2 — primär yta
  vid dyslexi och på mobil).
- Vy-växlare, hover-feedback, drill-down-panel med k-anonymitets-
  hänsyn ("För få insamlingar … minst 5"), CTAs till `/insamlingar?lan=…`
  och `/insamling`.
- `lib/karta.ts` + `lib/karta-hjalp.ts` — server-side data-helpers.
- `public/geo/sverige-{lan,kommuner}.geojson` — statiska assets
  (publik OSM-derived data via okfse/sweden-geojson).
- `scripts/fetch-sverige-geo.mjs` — engångsskript som hämtar GeoJSON +
  genererar seed-SQL. Körs vid behov av uppdatering, ej i CI.

**Klar när — bockad (M12 § Steg 12 i `05-Byggsekvens.md`)**

- [x] `/karta` lever med riktig MapLibre-karta i plattformens stil.
- [x] Choropleth per region (län) och kommun.
- [x] Insamlar-vy + hjälp-vy + drill-down län → kommun → insamling.
- [x] Topplista bredvid kartan.
- [x] `geo_aggregat` + `plats_taxonomi` migrerade med RLS.
- [x] pg_cron-omräkning var 6:e timme (`geo-aggregat-omrakning-6h`).
- [x] Minsta-antal-regeln (5) appliceras i aggregat-steget innan raden
      når tabellen (kolumnen `under_troskel` markerar maskade celler).
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt under körningen

| Beslut | Motivering |
|---|---|
| MapLibre GL JS v5 + OpenFreeMap positron basemap | Brief — beslut redan fattat; v5 är aktuell version. |
| GeoJSON från okfse/sweden-geojson (OSM-derived) | Publikt, OSM-licens, redan strukturerat med SCB-koder. |
| Aggregat per (område × kategori) som **en** tabell med partial unique indexes på `kategori_id IS NULL` vs NOT NULL | Postgres NULLs i UNIQUE räcker inte — partial-index löser entydigheten utan extra "alla"-kategorisentinel-rad. |
| Hjälp-vyn = on-the-fly aggregering från `insamling.hjalp_land` | Hjälp-platsen ägs av M1, inte ett eget aggregat-lager i v1; volymen är liten. Lägg till en `hjalp_aggregat`-tabell om/när trafiken kräver. |
| Federation-flaggorna (`admin_niva`, `admin_region_kod`, `granskning.region_kod`) skyddas i `profiles_skydda_falt` direkt | Triggern är blacklist — nya kolumner måste **explicit** blockeras för icke-admin annars privilege-escalation. |
| Inga GeoJSON-simplifieringar i v1 | okfse-filerna är 49 KB (län) + 798 KB (kommuner). Cloudflare static-assets klarar det utan optimering. Lägg till mapshaper när trafiken kräver. |

### Kantfall noterade i kod (söks via grep `TODO`/`@brief`)

- **M6 saknar `skyddad_identitet`-flagga** — M12 Block 5.3 säger skyddade
  insamlare aldrig får räknas på kommunnivå. Idag har vi inget fält att
  filtrera mot; `rakna_om_geo_aggregat` har kommentar som markerar detta.
  Lägg till `p.skyddad_identitet` i M6 → utöka filter-WHERE. Inte
  blockerande för Steg 12.
- **AFTER UPDATE-triggern gör full TRUNCATE + INSERT vid status-byte
  till `aktiv`/`avslutad_levererad`.** Funkar utan trafik. Refaktor till
  inkrementell uppdatering när M16's stat-dashboard byggs eller när
  trafik kräver. Ej blockerande.

---

## Batchade uppföljningar — kräver Zivar, blockerar inte bygget

Samma lista som i `../2-Byggplan/09-Goal-Steg-12-16.md`; uppdaterad med
det jag stött på under Steg 12.

1. **Karta-basemap till produktion** — byt från OpenFreeMap till
   självhostad Protomaps PMTiles på Cloudflare R2. `BASEMAP_STYLE_URL`-
   konstanten i `app/(public)/karta/karta-klient.tsx` är konfig-punkten.
   *Kunde inte göra det själv: `wrangler` i repot är inte inloggat mot
   Zivars konto i denna sandlåda.*
2. **Team-e-post** — Cloudflare Email Routing för `namn@sadaqahsweden.se`
   (Steg 16-uppföljning).
3. **`RESEND_API_KEY`** — för kvitto + daglig sammanfattning + community-
   notiser via e-post. In-app-kanalen fungerar utan.
4. **`skyddad_identitet`-flagga på M6** — gör M12 Block 5.3 enforceable.
   Kort migration när M6 nästa gång rörs.
5. **Auth-konfig — Leaked password protection** — slå på i Supabase
   dashboard (Auth → Password security). Pre-existerande Security
   Advisor-WARN.

---

## Föregående körningar (verifierat tidigare)

Steg 0–11 byggda, verifierade och pushade. Pengaflödet (Steg 5–7) end-
to-end-verifierat i Stripe testläge (granskat i förra körningens
SESSION-GOAL.md, bevarad i git-historiken via commit `239d4c2`).
