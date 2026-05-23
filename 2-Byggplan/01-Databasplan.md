# 01 — Databasplan

**Projekt:** Sadaqa Sweden *(arbetsnamn)*
**Datum:** 2026-05-23
**Vad detta är:** Datamodellen för hela plattformen — alla tabeller, relationer och säkerhetsprinciper. Detta är fil 01 i `2-Byggplan/`. Läs `00-Byggplan-oversikt.md` först (teknikvalet, byggfilosofin).
**Bygger på:** M1 (insamlings-objektet — kärnan), M3, M5, M6, M7, M8, M10. Korsreferenser till modulerna står som `M1`, `M5` osv.

> **Detta dokument ska Claude Code kunna agera på.** Schema-skisserna i kodblock är avsiktligt konkreta — riktiga tabellnamn, kolumnnamn, datatyper. De är planeringsunderlag, inte färdiga migrationer. Exakt SQL skrivs i migrationsfilerna (avsnitt 5). Var beslutsam om *strukturen*, noggrann om *detaljerna*.

> **Databassäkerhet — icke-förhandlingsbart.** Varje tabell, policy och funktion följer `../Supabase/SAKERHETSREGLER.md`: RLS på allt i samma migration, `SECURITY DEFINER` bara i `private`-schema med pinnad `search_path`, `service_role` aldrig i klienten, inget `user_metadata` i policies, Security Advisor grön före push. Principerna i avsnitt 1 nedan ska stämma överens med den filen — gör de inte det, vinner SAKERHETSREGLER.md.

---

## 1. Databasprinciper

Tio principer. De gäller **varje** tabell, utan undantag.

1. **Postgres via Supabase.** Inte SQLite. Postgres ger riktiga relationer, RLS, triggers och `pg_cron`. Supabase ger Auth, Realtime, Storage och Edge Functions ovanpå.

2. **Row Level Security (RLS) på VARJE tabell.** Ingen tabell publiceras utan RLS aktiverat (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) och minst en policy. Default är **deny-all** — en tabell utan policy är otillgänglig, inte öppen. RLS skrivs i samma migration som tabellen skapas. Aldrig "vi lägger till säkerhet sen" (byggfilosofi regel 5).

3. **snake_case överallt.** Tabeller och kolumner: `insamling_media`, `created_at`, `stripe_account_id`. Tabellnamn i singular för entiteter (`insamling`, `donation`, `profile`), kopplingstabeller beskriver relationen (`insamling_kategori`).

4. **Pengar lagras som heltal i öre.** `bigint`, aldrig `float`, aldrig `numeric` för belopp. 35 000 kr = `3500000`. Kolumnnamn slutar på `_ore` (`malbelopp_ore`, `belopp_ore`). Float på pengar är en bugg som väntar — den finns inte i denna databas.

5. **Slumpade publika ID:n — från M1.** Varje publikt exponerat objekt (insamling, profil, organisation) har två ID:n:
   - Internt `id` (`uuid`, primärnyckel) — för relationer, aldrig i URL.
   - Publikt `public_id` (`text`, slumpat 6–8 tecken, unikt) — för URL:er. Exponerar inte plattformens volym. Uppslag sker på `public_id` (M1 Block 1 Fält 2).
   - Sekventiella `serial`/`bigserial` används **aldrig** som publik identifierare.

6. **Migrationer: numrerade, idempotenta, med rollback för destruktiva.** Se avsnitt 5. Databasen ändras aldrig för hand (byggfilosofi regel 4).

7. **Främmande nycklar för alla relationer.** Varje relation i datamodellen är en `FOREIGN KEY` med uttalad `ON DELETE`-regel (oftast `RESTRICT` eller `SET NULL` — sällan `CASCADE`, eftersom historik ska bevaras). Inga "lösa" id-kolumner utan FK.

8. **Timestamps på varje tabell.** `created_at timestamptz NOT NULL DEFAULT now()` och `updated_at timestamptz NOT NULL DEFAULT now()`. `updated_at` underhålls av en gemensam trigger (`set_updated_at()`).

9. **Audit-/ändringsloggtabeller för transparens.** Allt som rör pengar, granskningsbeslut, roller och löftesbärande fält loggas i **append-only**-tabeller (`granskning_handelse`, `insamling_andringslogg`, `roll_handelse`). Man rättar inte en logg — man lägger till en rad. Loggtabeller har ingen `UPDATE`- eller `DELETE`-policy alls.

10. **Soft-delete där historik ska bevaras.** Insamlingar, donationer, profiler raderas aldrig hårt — de får `deleted_at timestamptz` (NULL = aktiv) eller anonymiseras. Hård `DELETE` reserveras för utkast och rena skräpposter. Bokföringspliktig data raderas aldrig (GDPR-undantag, M8 Block 5).

**Tre tekniska stödbeslut:**

- **Enums via Postgres `enum`-typer** för slutna värdemängder (insamlingstillstånd, roller, collab-typ). Tydligare än `text` + CHECK, och databasen vägrar ogiltiga värden. Att lägga till ett värde är en egen migration.
- **`profiles` speglar `auth.users`.** Supabase Auth äger inloggning (`auth.users`). Vår `profiles`-tabell har samma `id` (FK mot `auth.users.id`) och bär roll, visningsnamn, KYC-status. Rollen ligger **här**, serverside — aldrig i en klient-token (M6 Block 5.3).
- **Personnummer krypteras i vila** och lagras separat/minimalt (M6 Block 5.5). Det visas aldrig publikt och ingen RLS-policy exponerar det utåt.

---

## 2. Kärnschemat — full detalj (M1–M8)

Detta är motorn. Alla tabeller nedan byggs i bygg-grupp A. Varje tabell anges med kolumner, datatyper, nycklar och **RLS-avsikt** (vad policyn ska tillåta — exakta policy-uttryck skrivs i migrationen, principerna i avsnitt 4).

### 2.1 Enum-typer

```sql
-- Insamlingens tillstånd — M1 Block 3.1
CREATE TYPE insamling_status AS ENUM (
  'utkast', 'inskickad', 'under_granskning', 'andring_begard', 'avvisad',
  'aktiv', 'stangd', 'utbetald', 'vantar_pa_resultat',
  'avslutad_levererad', 'avslutad_utan_resultat', 'pausad', 'nedstangd'
);

-- Roller — M6 Block 4. Besökare = "ingen roll" (ej inloggad), finns ej som värde.
CREATE TYPE anvandar_roll AS ENUM (
  'donator', 'insamlare', 'forening', 'granskare', 'admin'
);

CREATE TYPE malbelopp_modell AS ENUM ('fast', 'intervall', 'oppet');      -- M1 Block 2 Fält 1
CREATE TYPE media_roll       AS ENUM ('cover','gallery','update','result_proof','payout_proof'); -- M1 Block 1 Fält 5
CREATE TYPE granskning_beslut AS ENUM ('godkann','begar_andring','avvisa'); -- M3 Block 3
CREATE TYPE collab_typ       AS ENUM ('initiativtagare','stodjer','praktisk_partner'); -- M10 Block 4.3
CREATE TYPE collab_status    AS ENUM ('begard','godkand','avbojd','aterkallad');        -- M10 Block 4.3
CREATE TYPE donation_undermal_val AS ENUM ('ge_anda','aterbetala'); -- M1 Block 2 Fält 4 / M4
```

### 2.2 `profiles` — användare & roller (M6)

Speglar `auth.users`. Bär roll och publik identitet. **Plattformens mest säkerhetskritiska tabell.**

```sql
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  public_id       text UNIQUE NOT NULL,            -- slumpat, för profilsidans URL (M9)
  roll            anvandar_roll NOT NULL DEFAULT 'donator',
  visningsnamn    text NOT NULL,                   -- publikt namn (M6 5.5) — aldrig personnr
  e_post          text NOT NULL,
  bankid_verifierad      boolean NOT NULL DEFAULT false,  -- M6 Block 3 steg 1
  personnummer_krypterat bytea,                     -- krypterad, aldrig publik (M6 5.5)
  stripe_account_id      text,                      -- M6 Block 3 steg 3 / M5
  stripe_onboarding_klar boolean NOT NULL DEFAULT false,  -- M5 Block 1.3
  kontofryst      boolean NOT NULL DEFAULT false,   -- M6 Block 4 — admin kan frysa
  ar_organisation boolean NOT NULL DEFAULT false,   -- true = föreningskonto (M10), se 3.x
  ombud_kontakt   text,                             -- frivilligt ombudsfält (M6 öppen fråga 3)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz                       -- soft-delete / anonymisering
);
```

**RLS-avsikt:**
- **Läsa:** alla får läsa de *publika* kolumnerna (visningsnamn, public_id, badges via join). `personnummer_krypterat`, `e_post`, `stripe_account_id` exponeras aldrig av någon SELECT-policy — de filtreras bort på kolumnnivå (separat vy eller kolumnrättigheter).
- **Skriva egen rad:** en användare får uppdatera sitt eget `visningsnamn`, `ombud_kontakt` — men **aldrig** `roll`, `bankid_verifierad`, `kontofryst`, `stripe_*`. De kolumnerna ändras bara av service-roll (Edge Function) eller admin.
- **Roll/frysning:** endast admin (uppslag mot `profiles.roll = 'admin'`).

### 2.3 `kategori` + `insamling_kategori` — multi-kategori (M1 Block 1 Fält 1)

Fast lista, platt hierarki, multi-val. Därför en separat tabell + kopplingstabell.

```sql
CREATE TABLE kategori (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      text UNIQUE NOT NULL,        -- 'mosjekprojekt', 'vatten', ...
  namn      text NOT NULL,               -- 'Mosképrojekt'
  aktiv     boolean NOT NULL DEFAULT true,
  sortering integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Kopplingstabell: en insamling -> 1..flera kategorier
CREATE TABLE insamling_kategori (
  insamling_id uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  kategori_id  uuid NOT NULL REFERENCES kategori(id)  ON DELETE RESTRICT,
  PRIMARY KEY (insamling_id, kategori_id)
);
```

**RLS-avsikt:** `kategori` — alla läser, bara admin skriver (seedas i migration). `insamling_kategori` — läses tillsammans med insamlingen (samma synlighetsregel som insamlingen), skrivs av insamlingens ägare medan den är `utkast`/`andring_begard`, samt av granskare (M1 Block 5.1 — granskaren får ändra kategori).

### 2.4 `insamling` — KÄRNAN (M1, alla block)

Navet. Allt annat pekar hit. Fälten följer M1 Block 1 (innehåll), Block 2 (pengar/tid), Block 3 (status), Block 4 (relationer).

```sql
CREATE TABLE insamling (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id       text UNIQUE NOT NULL,              -- slumpat 6-8 tecken (M1 B1 F2)
  slug            text NOT NULL,                     -- autogenererad, ID permanent vid titeländring
  agare_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,  -- M1 B4: 1 ägare
  godkand_av      uuid REFERENCES profiles(id) ON DELETE SET NULL,           -- M1 B4.2: vem godkände
  mission_id      uuid REFERENCES mission(id) ON DELETE SET NULL,            -- NULLBART, reserverat (M1 B4.3)

  -- Block 1: innehåll
  titel             text NOT NULL,                   -- max 80 tecken (CHECK)
  kort_beskrivning  text NOT NULL,                   -- max 200 tecken
  lang_beskrivning  text NOT NULL,                   -- max 5000 tecken, markdown-light
  mottagare_typ     text NOT NULL,                   -- dropdown (M1 B1 F4)
  mottagare_beskrivning text NOT NULL,               -- max 500 tecken

  -- Block 1: plats — två separata platsfält
  hjalp_land        text NOT NULL,                   -- där hjälpen landar (publikt)
  hjalp_plats       text,                            -- specifik plats, fritext
  hjalp_lat         double precision,                -- GPS, frivillig -> M12
  hjalp_lng         double precision,
  insamlar_stad     text NOT NULL,                   -- där insamlingen sker (publikt)
  insamlar_region   text,
  insamlar_adress   text,                            -- frivillig
  insamlar_adress_publik boolean NOT NULL DEFAULT false,  -- per-fält integritet (M1 B1 F6)

  -- Block 2: mål, pengar, tid
  malbelopp_modell  malbelopp_modell NOT NULL,
  malbelopp_ore         bigint,                      -- 'fast': exakt mål. NULL för 'oppet'
  malbelopp_min_ore     bigint,                      -- 'intervall': lägstanivå = "målet nått"
  malbelopp_max_ore     bigint,                      -- 'intervall': övre nivå
  valuta            text NOT NULL DEFAULT 'SEK',     -- struktur för fler, UI låst SEK i v1
  insamling_deadline    timestamptz NOT NULL,        -- pengaflödet stänger
  genomforande_datum    date NOT NULL,               -- uppskattat leveransdatum
  overmalsplan      text,                            -- deklarerad plan -> tillåter övermål
  tillat_overmal    boolean NOT NULL DEFAULT false,
  forlangningar_anvanda smallint NOT NULL DEFAULT 0, -- max 2 (M1 B2 F5)

  -- Block 3: livscykel
  status            insamling_status NOT NULL DEFAULT 'utkast',
  publicerad_at     timestamptz,                     -- när status blev 'aktiv' (startbevis, M7)

  -- transparens / pengar
  transfer_group    text UNIQUE,                     -- M5 Block 2.3 — ID per insamling
  insamlat_ore      bigint NOT NULL DEFAULT 0,       -- realtidsräknare, uppdateras av webhook (M5/fil 03)

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,

  CONSTRAINT titel_langd CHECK (char_length(titel) <= 80),
  CONSTRAINT belopp_ej_negativt CHECK (
    coalesce(malbelopp_ore,0) >= 0 AND coalesce(malbelopp_min_ore,0) >= 0
  )
);
```

**Noter:**
- `mission_id` är **nullbart och reserverat** — funktionen byggs inte i v1, men kolumnen finns från start så ingen migration behövs senare (M1 Block 4.3, designval).
- `insamlat_ore` är en cachad summa för realtidsräknaren (fil 03). **Sanningen** är summan av bekräftade `donation`-rader; `insamlat_ore` uppdateras bara av Stripe-webhook via Edge Function — aldrig av klienten (byggfilosofi regel 7).
- Statusövergångar verkställs av en `SECURITY DEFINER`-funktion (`overgang_insamling_status()`) som kontrollerar att övergången är giltig enligt M1 Block 3.2. Klienten får aldrig sätta `status` fritt.

**RLS-avsikt (kärnregel — se M1 Block 3.1 "Publikt synlig?"):**
- **Läsa:** publikt synliga statusar (`aktiv`, `stangd`, `utbetald`, `vantar_pa_resultat`, `avslutad_*`, `pausad`, `nedstangd`) får läsas av **alla**, inkl. ej inloggade besökare. Icke-publika (`utkast`, `inskickad`, `under_granskning`, `andring_begard`, `avvisad`) får bara läsas av ägaren, granskare och admin.
- **Skapa:** bara `insamlare`/`forening`/`granskare`/`admin` (M6-matrisen). `agare_id` måste = inloggad användare (eller föreningen man företräder).
- **Uppdatera:** ägaren får ändra fria fält på sin egen insamling; löftesbärande fält (mottagare, modell, plats, sänkt mål) är låsta för ägaren och ändras bara av granskare/admin (M1 Block 5.1). `status` aldrig direkt — bara via övergångsfunktionen.

### 2.5 `insamling_media` — bilder med roll-fält (M1 Block 1 Fält 5)

**En tabell, roll-kolumn styr fasen** — inte separata tabeller per fas (M1 spikar detta uttryckligen).

```sql
CREATE TABLE insamling_media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  roll          media_roll NOT NULL,          -- cover/gallery/update/result_proof/payout_proof
  uppdatering_id uuid REFERENCES transparens_uppdatering(id) ON DELETE CASCADE, -- om roll='update'
  storage_path  text NOT NULL,                -- Supabase Storage, komprimerad webp
  original_path text,                         -- original sparas separat (M1 B1 F5)
  bredd_px      integer,
  hojd_px       integer,
  sortering     integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

**RLS-avsikt:** läses med insamlingen (samma synlighet). Skrivs av insamlingens ägare; `result_proof`/`payout_proof` kopplas till transparens-loopen (M7). Cover är obligatorisk — en CHECK på applikationsnivå/trigger, inte tabellnivå (en rad i taget kan inte se hela mängden).

### 2.6 `mottagare` (M1 Block 1 Fält 4)

Mottagaren är **en per insamling** (kollektiv om många — fritext, inte 50 rader). Kan ligga som kolumner direkt på `insamling` (görs delvis ovan: `mottagare_typ`, `mottagare_beskrivning`). Verifieringsdokument bryts ut:

```sql
CREATE TABLE mottagare_dokument (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,                -- verifieringsdokument, ej publikt
  beskrivning   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**RLS-avsikt:** **aldrig publikt.** Läses bara av ägare, granskare, admin (granskningsunderlag — M3 Block 2.1).

### 2.7 `donation` (M4 → M1 Block 4)

Varje donation pekar på en insamling. Belopp i öre. Webhook är sanningen (M5).

```sql
CREATE TABLE donation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id       text UNIQUE NOT NULL,           -- för kvittolänk (även gäst)
  insamling_id    uuid NOT NULL REFERENCES insamling(id) ON DELETE RESTRICT,
  donator_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL = gästdonation
  donator_epost   text NOT NULL,                  -- för kvitto, även gäst (M6 Block 2.2)
  belopp_ore      bigint NOT NULL CHECK (belopp_ore > 0),
  frivilligt_bidrag_ore bigint NOT NULL DEFAULT 0, -- tip till föreningen (M5 Block 5.4)
  enhet_antal     integer,                        -- "20 mattor" — display-flagga (M1 B2 F1)
  undermal_val    donation_undermal_val NOT NULL DEFAULT 'ge_anda', -- M1 B2 F4
  anonym          boolean NOT NULL DEFAULT false, -- publik anonymitet (M8 Block 5.2)
  stripe_payment_intent_id text UNIQUE,           -- Stripe-koppling (M5 Block 2.1)
  stripe_charge_id text,
  bekraftad       boolean NOT NULL DEFAULT false, -- true först när webhook bekräftat
  refunderad      boolean NOT NULL DEFAULT false,
  refunderad_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**RLS-avsikt:**
- **Läsa:** donatorn ser sina egna donationer. Insamlingens ägare ser donationer till sin insamling (men inte donatorns identitet om `anonym=true`). Granskare/admin ser allt. Publikt: en donationsräknare kan exponeras via aggregat-vy, men aldrig donatorns namn+belopp per rad utan anonymitetshänsyn (M7 Block 5.4).
- **Skriva:** `donation` skapas av en Edge Function (service-roll) — `bekraftad`, `refunderad`, `stripe_*` sätts **bara** av webhook-funktionen, aldrig av klienten (byggfilosofi regel 7).

### 2.8 `granskning` + `granskning_handelse` — beslut & logg (M3)

`granskning` = ärendet i kön. `granskning_handelse` = den append-only loggen (M3 Block 3.4 — "ingen kan säga 'det stod inte så'").

```sql
CREATE TABLE granskning (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id    uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  arende_typ      text NOT NULL DEFAULT 'insamling', -- 'insamling' | 'katalog' (M10 delar kö)
  tilldelad_granskare_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- auto-tilldelning (M3 1.2)
  runda           smallint NOT NULL DEFAULT 1,       -- "Runda 2/3" vid åter-inskickning
  eskalerad       boolean NOT NULL DEFAULT false,    -- M3 Block 4 (>500 000 kr m.m.)
  sla_deadline    timestamptz,                       -- 72 h-riktmärke (M3 Block 1.4)
  interna_anteckningar text,                         -- synligt bara för granskare/admin (M3 2.3)
  inskickad_at    timestamptz NOT NULL DEFAULT now(),
  avgjord_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- APPEND-ONLY logg. Ingen UPDATE/DELETE-policy.
CREATE TABLE granskning_handelse (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  granskning_id   uuid NOT NULL REFERENCES granskning(id) ON DELETE RESTRICT,
  granskare_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  handelse_typ    text NOT NULL,         -- 'tilldelad','statusbyte','beslut','checklistemarkering',
                                          -- 'anteckning','eskalering'
  beslut          granskning_beslut,     -- ifyllt när handelse_typ='beslut'
  motivering      text,                  -- obligatorisk vid negativt beslut (M3 Block 3.2)
  detalj          jsonb,                 -- checklistepunkter, fältkopplade ändringspunkter
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**RLS-avsikt:** båda tabellerna — **bara granskare och admin** läser. `granskning_handelse` har **endast** INSERT-policy (för granskare/admin) — ingen UPDATE, ingen DELETE. Loggen är oföränderlig. En delmängd ("granskning skedde") exponeras till den publika ändringsloggen via `insamling_andringslogg`, inte härifrån.

### 2.9 `insamling_andringslogg` — publik ändringslogg (M1 Block 5.1)

Publik "redigeringshistorik". Append-only. Transparens slår tillit-på-ord.

```sql
CREATE TABLE insamling_andringslogg (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  andrad_av     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  falt          text NOT NULL,           -- vilket fält som ändrades
  handelse      text NOT NULL,           -- 'redigerad','granskning_godkand','forlangd','malhojning'
  beskrivning   text,                    -- människoläsbar, t.ex. "Titel ändrad"
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**RLS-avsikt:** läses av **alla** (publik historik på insamlingssidan). Skrivs bara av triggers/Edge Functions vid faktisk ändring — aldrig direkt av klient. Ingen UPDATE/DELETE.

### 2.10 Transparens — `transparens_uppdatering` + `transparens_bevis` (M7)

M7 har tre obligatoriska bevis (start, utbetalning, resultat) + fria uppdateringar. Modelleras som **en uppdaterings-tabell** (fria + bevis-knutna inlägg) plus en **bevis-tabell** som markerar de tre obligatoriska punkterna.

```sql
-- Fria uppdateringar OCH text-delen av bevis (M7 Block 1 + 2)
CREATE TABLE transparens_uppdatering (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  postad_av     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ar_bevis      boolean NOT NULL DEFAULT false,  -- true om kopplad till en bevis-rad
  rubrik        text,
  text          text NOT NULL,
  dold          boolean NOT NULL DEFAULT false,  -- granskare/admin kan dölja olämpligt (M7 2.3)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- De tre obligatoriska bevispunkterna (M7 Block 1)
CREATE TABLE transparens_bevis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  bevis_typ     text NOT NULL,           -- 'start' | 'utbetalning' | 'resultat'
  kategori_id   uuid REFERENCES kategori(id), -- resultatbevis krävs per kategori (M7 Block 4.3)
  uppdatering_id uuid REFERENCES transparens_uppdatering(id) ON DELETE SET NULL,
  systemgenererad boolean NOT NULL DEFAULT false, -- start + utbetalning är systemgenererade
  godkand       boolean NOT NULL DEFAULT false,   -- resultatbevis äkthetsgranskas (M3/M7)
  godkand_av    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  skapad_at     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (insamling_id, bevis_typ, kategori_id)
);
```

**RLS-avsikt:** uppdateringar och bevis läses av **alla** (publik transparens-tidslinje) **utom** `dold=true` (då bara ägare/granskare/admin). Skrivs av ägaren (`update`-typ) och av system (`start`/`utbetalning` — systemgenererade ur Stripe-händelse). `godkand` sätts bara av granskare/admin.

### 2.11 `badge` + `profil_badge` / `insamling_badge` (M7 Block 3)

Badges sitter på insamling **och** profil. En badge-definitionstabell + två kopplingstabeller.

```sql
CREATE TABLE badge (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      text UNIQUE NOT NULL,   -- 'resultat_levererat','verifierad_insamlare','oppen_bok',...
  namn      text NOT NULL,
  beskrivning text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE insamling_badge (
  insamling_id uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  badge_id     uuid NOT NULL REFERENCES badge(id) ON DELETE RESTRICT,
  tilldelad_at timestamptz NOT NULL DEFAULT now(),
  indragen_at  timestamptz,         -- dras in vid bekräftad fejk (M7 Block 3.3)
  PRIMARY KEY (insamling_id, badge_id)
);

CREATE TABLE profil_badge (
  profil_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id     uuid NOT NULL REFERENCES badge(id) ON DELETE RESTRICT,
  antal        integer NOT NULL DEFAULT 1,  -- aggregat: "Resultat levererat x7"
  uppdaterad_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profil_id, badge_id)
);
```

**RLS-avsikt:** alla läser (badges är publika). Skrivs **bara** av systemet — badge-tilldelning är automatisk och regelstyrd (M7 Block 3.3). Ingen klient, ingen människa, sätter badges direkt.

### 2.12 `organisation` + `collab` (M10 — Kärnan rör vid dessa via M1 Block 4)

Föreningskontot är en `profile` med `ar_organisation=true`; `organisation` bär de förenings-specifika fälten och katalogposten.

```sql
CREATE TABLE organisation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id       text UNIQUE NOT NULL,
  profil_id       uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL, -- länk konto<->org (M10 1.2)
  namn            text NOT NULL,
  org_nummer      text,                          -- NNNNNN-NNNN, internt (M10 Block 2.2)
  organisationstyp text NOT NULL,                -- dropdown (M10 Block 2.3)
  stad            text NOT NULL,
  region          text NOT NULL,
  besoksadress    text,
  beskrivning     text NOT NULL,                 -- max 300 tecken
  logotyp_path    text,
  verifieringsniva text,                         -- 'org_nr' | 'kontakt' | NULL (M10 Block 5.2)
  katalog_status  text NOT NULL DEFAULT 'inskickad', -- inskickad/under_granskning/...
                                                 -- /komplettering_begard/publicerad/avvisad/vilande
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Collab — relationsobjekt insamling <-> organisation (M10 Block 4.3, fyller M1 Block 4-uttaget)
CREATE TABLE collab (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id    uuid NOT NULL REFERENCES insamling(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  collab_typ      collab_typ NOT NULL,
  status          collab_status NOT NULL DEFAULT 'begard',
  begard_at       timestamptz NOT NULL DEFAULT now(),
  besvarad_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (insamling_id, organisation_id)
);
```

**RLS-avsikt:** `organisation` — `katalog_status='publicerad'` läses av alla; övriga statusar bara av föreningens företrädare + granskare/admin. `org_nummer` exponeras aldrig publikt. `collab` — `status='godkand'` läses av alla (visas på insamlingssidan); begäran/avböjande syns bara för insamlingens ägare och föreningens företrädare (en förening ska kunna säga nej osynligt, M10 Block 4.4).

### 2.13 `mission` — reserverad tabell (M1 Block 4.3)

Byggs **inte** funktionellt i v1, men tabellen skapas så `insamling.mission_id` har en giltig FK från start.

```sql
CREATE TABLE mission (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id   text UNIQUE NOT NULL,
  agare_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  titel       text NOT NULL,
  beskrivning text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**RLS-avsikt:** deny-all i v1 (ingen policy som tillåter skrivning ännu) — tabellen finns för FK-integritet, funktionen aktiveras i ett framtidsspår.

---

## 3. Världen-schemat — strukturell översikt (M9–M16)

Tabellerna nedan **skissas** här så Claude Code ser helheten — men de **detaljeras när respektive modul byggs** (bygg-grupp B och C). Inga kolumner spikas i detalj här. Alla får samma principer som kärnschemat: RLS, snake_case, timestamps, slumpade publika ID:n, FK.

| Område | Modul | Skissade tabeller | Not |
|---|---|---|---|
| **Profil-relaterat** | M9 | `profil_installning` (publik synlighet per fält), `foljning` (donator följer insamling) | Profilen läser mest från `profiles`, `insamling`, `badge`, `transparens_*` — få egna tabeller. |
| **Discovery** | M11 | `sok_index` / materialiserad vy, ev. `kategori_sida` | Sök bygger på `insamling` + `kategori`. Troligen en materialiserad vy, inte mycket egen lagring. |
| **Geo-aggregat** | M12 | `geo_aggregat` (region → antal/summa), `plats_taxonomi` (län, stad) | `plats_taxonomi` ägs av M12 men refereras av M1/M10. Aggregat fylls av `pg_cron`-jobb. |
| **Community** | M13 | `kommentar`, `dua`, `reaktion`, `rapport` | Hänger på `insamling` och `transparens_uppdatering`. `rapport` matar M8:s auto-paus-tröskel. |
| **Events** | M14 | `event`, `oppettid`, `bonetid` | Hänger på `organisation` (moskéns kalender). |
| **Notiser** | M15 | `notis`, `notis_preferens`, `notis_kanal` | Opt-in per kanal. Triggas av händelser i nästan alla moduler. |
| **Admin** | M16 | `admin_larm`, `system_installning` (volymspakar — M3 1.6), `audit_logg` (tvärgående) | Läser brett, äger volymtak-inställningar. |

**Designnot:** flera "Världen"-funktioner (profil, discovery, karta) lagrar lite eget — de **läser** kärnschemat. Det är meningen: kärnan är sanningen, Världen presenterar den. Detaljschemat för varje tabell ovan skrivs i den modulens byggsteg (fil 05).

---

## 4. RLS-policyprinciper per roll

Rollerna definieras i M6 Block 4. Varje policy slår upp `profiles.roll` för den inloggade användaren (`auth.uid()`) — **serverside, varje gång** (M6 Block 5.3). Klienten är skyltfönster, databasen är valvet.

**Generella regler:**
- **Default deny.** RLS på, ingen policy = ingen åtkomst. Policys *öppnar* åtkomst, de stänger inte.
- **`auth.uid()`** är den inloggade användarens id. Är den NULL = besökare (ej inloggad).
- **Service-roll** (Edge Functions för Stripe-webhooks, badge-tilldelning, statusövergångar) går förbi RLS medvetet — den är den enda vägen pengar/status/badges skrivs.
- En **hjälpfunktion** `aktuell_roll()` (`SECURITY DEFINER`) returnerar inloggad användares roll — används i policy-uttryck.

| Roll | Får läsa | Får skriva |
|---|---|---|
| **Besökare** (ej inloggad) | Publika insamlingar (`aktiv` + senare statusar), publika profiler, publicerade organisationer, publik transparens-tidslinje, badges, kategorier. | Inget. (Gästdonation skapas av Edge Function, inte direkt INSERT.) |
| **Donator** | Allt en besökare ser + sina egna donationer, sina egna notiser, sina följningar. | Sin egen `profiles`-rad (begränsade kolumner), sina följningar, kommentarer/dua (M13). |
| **Insamlare** | Allt donator ser + **alla fält** på sina egna insamlingar (inkl. icke-publika), mottagardokument på egna insamlingar. | Sina egna insamlingar (fria fält medan `utkast`/`andring_begard`; löftesfält låsta), media, transparens-uppdateringar på egna insamlingar. Aldrig `status` direkt. |
| **Förening** | Som insamlare, för insamlingar ägda av organisationen man företräder + sin organisations alla katalogstatusar. | Som insamlare men i organisationens namn; sin organisations katalogpost; svara på collab-begäran. |
| **Granskare** | **Allt** — alla insamlingar i alla statusar, alla mottagardokument, hela `granskning` + `granskning_handelse`, alla organisationer. (Princip 2: granskaren ser allt, även icke-publika fält.) | `granskning`, `granskning_handelse` (append-only INSERT), granskningsbeslut, kategori/plats på insamling, dölja uppdateringar, godkänna bevis, pausa insamling. **Aldrig** granska egen insamling (jäv — M3/M6, uttrycks i tilldelningslogiken). |
| **Admin** | Allt granskare ser + admin-larm, systeminställningar, roll-logg, all donationsdata. | Allt granskare kan + tilldela roller, frysa konton, `nedstangd`, hantera GDPR-begäran, sätta volymspakar. |

**Kritiska RLS-regler att inte missa:**
- **`profiles.roll` ändras aldrig av användaren själv** — bara av admin eller service-roll. En UPDATE-policy på `profiles` får inte inkludera kolumnen `roll`.
- **Pengakolumner** (`donation.bekraftad`, `insamling.insamlat_ore`, `*.stripe_*`) skrivs bara av service-roll. Ingen vanlig roll har UPDATE-policy som rör dem.
- **Loggtabeller** (`granskning_handelse`, `insamling_andringslogg`, `roll_handelse`) har INSERT-policy men **aldrig** UPDATE/DELETE — för någon roll.
- **Personnummer** har ingen SELECT-policy som returnerar det till klienten — det läses bara av betrodd serverkod.
- **Anonyma donationer:** RLS/vy döljer donatorns identitet när `donation.anonym=true` även för insamlingens ägare.

---

## 5. Migrationsstrategi

Databasen ändras **bara** via migrationer (byggfilosofi regel 4). Aldrig för hand, aldrig via Supabase-dashboarden i produktion.

**Numrering & ordning:**
- Migrationer ligger i `5-Kod/supabase/migrations/` och namnges `NNNN_kort_beskrivning.sql` — `0001_initiala_enums.sql`, `0002_profiles.sql`, `0003_insamling.sql`, ...
- Nummer är **strikt stigande** och körs i ordning. En migration läggs aldrig in "mellan" befintliga nummer.
- En migration = en logisk ändring. Liten, läsbar, en commit per migration (byggfilosofi regel 3).

**Idempotens:**
- Migrationer skrivs så att de tål att köras mot en redan delvis uppdaterad databas där det är rimligt: `CREATE TABLE IF NOT EXISTS`, `CREATE TYPE ... ` skyddat med `DO $$ ... EXCEPTION WHEN duplicate_object ...`, `CREATE POLICY` föregånget av `DROP POLICY IF EXISTS`.
- Supabase migrations-verktyget håller reda på vilka som körts (`supabase_migrations.schema_migrations`) — men idempotensen är ett extra skyddsnät, inte en ursäkt att köra om i produktion.

**Rollback för destruktiva migrationer:**
- En migration som **tar bort eller ändrar** en kolumn/tabell/typ (destruktiv) levereras med en **rollback-fil**: `NNNN_kort_beskrivning.down.sql`.
- Rollback-filen återställer schemat till föregående tillstånd. Den testas på en branch-databas (Supabase branching) innan den körs i produktion.
- **Icke-destruktiva** migrationer (lägga till tabell/kolumn/policy) behöver ingen down-fil — de rullas tillbaka genom att helt enkelt inte deploya dem, eller via en ny framåt-migration.
- **Destruktiv migration mot data som inte kan återskapas körs aldrig utan backup** verifierad först.

**Körning:**
- Lokalt / staging: `supabase db push` mot en branch-databas.
- Produktion: migrationer körs som del av deploy-pipelinen (fil 04/05) — en commit som innehåller en ny migration triggar körning mot produktionsdatabasen efter att staging är grön.
- **Seed-data** (kategorilistan M1, badge-listan M7, plats-taxonomi M12) ligger i egna, tydligt märkta seed-migrationer eller i `seed.sql` — skild från schema-migrationer.

**Ordning för bygg-grupp A (kärnschemat):**
`enums → profiles → kategori → mission → insamling → insamling_kategori → insamling_media → mottagare_dokument → organisation → collab → donation → granskning → granskning_handelse → insamling_andringslogg → transparens_uppdatering → transparens_bevis → badge (+ kopplingstabeller) → RLS-policys per tabell → seed (kategori, badge)`.
RLS aktiveras i **samma** migration som tabellen skapas — aldrig en separat "lägg till säkerhet"-migration efteråt.

---

## 6. Beslut & öppna frågor

**Spikade beslut (denna fil):**

| Beslut | Motivering |
|---|---|
| Postgres via Supabase, RLS på varje tabell | Säkerhet i databasen, inte i frontend (byggfilosofi 5–6). |
| Pengar som `bigint` i öre, kolumner `*_ore` | Float på pengar är en bugg. Heltal i öre är exakt. |
| Slumpat `public_id` + internt `uuid` på alla publika objekt | Exponerar inte volym; uppslag på `public_id` (M1 B1 F2). |
| `insamling_media` — en tabell, `roll`-kolumn | M1 spikar uttryckligen: ingen separat tabell per fas. |
| Insamlingstillstånd som Postgres-enum + övergångsfunktion | Databasen vägrar ogiltigt tillstånd; klienten sätter aldrig `status` fritt (M1 B3). |
| `mission`-tabell skapas i v1 men deny-all | `insamling.mission_id` behöver giltig FK från start — bygg uttaget nu (M1 B4.3). |
| Append-only loggtabeller utan UPDATE/DELETE-policy | Granskningslogg och ändringslogg får aldrig kunna rättas (M3 3.4, M1 5.1). |
| Pengar/status/badges skrivs bara av service-roll (Edge Functions) | Webhook är sanningen; klienten litas aldrig (byggfilosofi 7). |
| `profiles` speglar `auth.users`; roll lagras där, serverside | Användaren får aldrig ändra sin egen roll (M6 5.3). |
| Soft-delete (`deleted_at`) / anonymisering för historikbärande tabeller | Bokföring + transparens kräver att historik består (M8 5.4). |
| Föreningskonto = `profiles.ar_organisation` + separat `organisation`-tabell | Konto och katalogpost är separata men länkbara objekt (M10 1.2). |

**Öppna frågor (avgörs vid bygge eller i annan modul):**

1. **Personnummer-kryptering — exakt metod.** `pgcrypto` i databasen, eller kryptering i Edge Function före lagring? Avgörs vid bygget av M6-steget. Kravet (krypterat i vila, aldrig publikt) står fast.
2. **`insamlat_ore` — cachad kolumn vs alltid-aggregera.** Realtidsräknaren (fil 03) behöver snabb läsning. Förslag: cachad kolumn uppdaterad av webhook + ett `pg_cron`-jobb som stämmer av mot `SUM(donation.belopp_ore)`. Bekräftas i fil 03.
3. **Plats-taxonomi (`plats_taxonomi`, län/stad).** Ägs av M12 men refereras av M1 och M10. Bör seedas tidigt (fast lista över svenska län/kommuner) även om M12 byggs i grupp C. Avgörs i byggsekvensen (fil 05).
4. **Sök — materialiserad vy vs `pg_trgm`/full-text.** M11-beslut. Påverkar inte kärnschemat; noteras här så det inte glöms.
5. **`granskning_handelse.detalj` som `jsonb`.** Flexibelt för checklistepunkter och fältkopplade ändringar — men ostrukturerat. Acceptabelt för en ren loggtabell; omprövas om M3-vyn behöver fråga in i den ofta.
6. **Aggregat-/statistiktabeller för M12/M16.** Byggs som `pg_cron`-matade tabeller eller materialiserade vyer — avgörs när de modulerna byggs.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första databasplanen. Tio databasprinciper. Fullt kärnschema M1–M8 (enums, profiles, kategori + multi-kategori, insamling, insamling_media, mottagardokument, donation, granskning + append-only logg, publik ändringslogg, transparens-uppdatering/bevis, badge, organisation, collab, reserverad mission-tabell) med kolumner, datatyper, nycklar och RLS-avsikt. Strukturell skiss av Världen-schemat M9–M16. RLS-policyprinciper per roll. Migrationsstrategi (numrering, idempotens, rollback). Beslut och öppna frågor. |
