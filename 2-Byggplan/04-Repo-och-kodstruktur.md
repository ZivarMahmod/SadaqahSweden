# 04 — Repo & kodstruktur

**Projekt:** Sadaqa Sweden *(arbetsnamn)*
**Datum:** 2026-05-23
**Vad detta är:** GitHub-repot och den interna mappstrukturen i `5-Kod/`. Var sidor, komponenter, affärslogik, databas, Stripe och Edge Functions bor — innan första kodraden skrivs, så koden föds organiserad.

> Läs `00-Byggplan-oversikt.md` först. Teknikvalet (Next.js App Router + TypeScript + Tailwind, Supabase, Stripe, Cloudflare Pages) är spikat där. Den här filen bygger på det.

---

## 1. GitHub-repot

### Ett repo — monorepo

Allt bor i **ett enda privat repo**. Inga separata repon för frontend och backend — det är onödig komplexitet för ett projekt i den här storleken.

Repot innehåller två huvuddelar:

| Del | Vad det är |
|---|---|
| **Next.js-appen** | Hela webbappen — sidor, komponenter, affärslogik. Bor i roten. |
| **`supabase/`-mappen** | Databas-migrationer och Edge Functions. Versionshanteras tillsammans med koden. |

**Varför ett repo:** en commit ändrar både kod och databas-migration i samma steg. Git-historiken berättar hela sanningen på ett ställe. Byggfilosofins regel "en commit per steg" (fil 00) blir enkel att följa.

### Repo-namn

**`sadaqahsweden`** *(arbetsnamn — byts om plattformen får ett annat namn senare)*.

Små bokstäver, bindestreck. Enkelt, läsbart, matchar projektnamnet.

### Privat repo

Repot är **privat** från dag 1. Det blir publikt först om — och bara om — ett medvetet beslut tas senare. Pengaflöde, granskningslogik och säkerhetsregler ska inte ligga öppet medan plattformen byggs.

### Branch-strategi

Enkel. Inget överbyggt flöde.

| Branch | Roll |
|---|---|
| **`main`** | Alltid deploybar. Det som ligger här är det som körs i produktion. |
| **`feature/...`** | En branch per byggsteg eller funktion. T.ex. `feature/m1-insamlingsobjekt`, `feature/stripe-webhooks`. |

**Flödet:** skapa feature-branch → bygg steget → öppna pull request → Cloudflare Pages skapar en preview-deploy → granska → merge till `main` → auto-deploy till produktion.

> **OBS — autonomt soloskede:** I projektets nuvarande autonoma soloskede commitar Claude Code direkt till `main` (se `/goal`-kommandot och `5-Kod/.claude/commands/goal.md`). Det skyddade `main` + PR-flödet nedan gäller senare, när byggteamet är fler än en.

`main` skyddas: ingen direkt push, merge sker via pull request. Det tvingar fram att "Klar när"-listan (fil 00) verkligen är grön innan något når produktion.

### `.gitignore`

Standard för Next.js + ett par tillägg. Det viktigaste: **ingen hemlighet får hamna i git.**

```
# Beroenden
/node_modules

# Next.js build
/.next
/out

# Miljövariabler — ALDRIG i git
.env
.env*.local

# Supabase lokal
/supabase/.branches
/supabase/.temp

# Övrigt
.DS_Store
*.log
/coverage
.vercel
```

`.env.example` *committas* (mall utan värden). `.env.local` med riktiga nycklar committas **aldrig** — se avsnitt 5.

### README

Repots `README.md` är kort och praktisk. Den ska räcka för att en utvecklare kommer igång:

- Vad projektet är — en mening + länk till `1-Planering/00-Masterkarta.md`.
- Teknikstacken.
- Hur man kör projektet lokalt (installera, sätt `.env.local`, starta).
- Hur migrationer körs.
- Branch-strategin (avsnitt ovan).
- Länk tillbaka till `2-Byggplan/`.

README ersätter inte planeringen — den pekar på den.

---

## 2. Kodens mappstruktur i `5-Kod/`

Hela Next.js-appen bor i `5-Kod/`. Den mappen *är* GitHub-repot.

Strukturen följer två principer:

1. **Delad kod ligger plant** — UI-byggstenar, Supabase-klient, hjälpfunktioner som alla moduler använder, i `components/` och `lib/`.
2. **Modulspecifik kod ligger kolokerad vid sin route** — en moduls egna komponenter, server actions och logik bor i samma route-mapp i `app/` som sidan. Ingen separat `modules/`-mapp; modulen hålls spårbar via route-namn + modul-stämpel (avsnitt 4).

```
5-Kod/
│
├── README.md
├── .gitignore
├── .env.example                 # mall för miljövariabler — utan värden
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── wrangler.jsonc               # Cloudflare Workers-konfig (OpenNext)
├── open-next.config.ts          # OpenNext-adaptern
├── proxy.ts                     # auth/session globalt (Next 15-proxy)
│
├── public/                      # statiska filer — bilder, ikoner, favicon
│
├── app/                         # Next.js App Router — sidor, routing OCH
│   │                            # modulspecifik kod (kolokerad vid sin route)
│   ├── layout.tsx               # rot-layout
│   ├── page.tsx                 # M11 startsidan
│   ├── globals.css              # Tailwind v4 base + designtokens
│   ├── site-nav.tsx             # delad navigation
│   │
│   ├── (public)/                # route-grupp: publika sidor (ej inloggning)
│   │   ├── insamlingar/
│   │   │   ├── page.tsx                  # M11 listning / sök / filter
│   │   │   └── [publicId]/
│   │   │       ├── page.tsx              # M1 insamlingssidan
│   │   │       └── donera/               # M4 donator-flödet
│   │   │           ├── page.tsx
│   │   │           └── actions.ts        # server actions för M4
│   │   ├── foreningar/          # M10 föreningskatalog
│   │   ├── profil/[handle]/     # M9 publik profil
│   │   ├── karta/               # M12 Sverige-kartan
│   │   └── community/           # M13 + M14 community & events
│   │
│   ├── (auth)/                  # route-grupp: inloggning
│   │   ├── login/ · registrera/ # M6
│   │   ├── verifiera-epost/ · konto-fryst/
│   │   └── actions.ts           # logga in / registrera / logga ut
│   │
│   ├── (konto)/                 # route-grupp: inloggad användare
│   │   └── insamling/           # M2 insamlar-flödet
│   │       ├── page.tsx                  # mina insamlingar
│   │       ├── actions.ts                # spara utkast / skicka in
│   │       ├── ny/[steg]/                # skapa-wizard, ett steg per route
│   │       └── [id]/
│   │           ├── redigera/             # redigera utkast
│   │           └── uppdatering/          # M7 transparens-uppdatering
│   │
│   ├── (intern)/                # route-grupp: granskar / admin / team-roll
│   │   ├── granskning/          # M3 granskningskö & beslut
│   │   ├── admin/               # M16 drift, statistik, larm
│   │   └── team/                # M17 intern arbetsyta
│   │
│   ├── auth/callback/route.ts   # M6 e-post / BankID-callback
│   │
│   └── api/                     # endast webhook-routes
│       └── stripe/webhook/      # M5 — OBS: tung webhook-logik i Edge Function
│
├── components/                  # DELAD UI — används av flera moduler
│   ├── ui/                      # byggstenar — knapp, kort, input, modal
│   └── layout/                  # header, footer, wordmark
│
├── lib/                         # DELAD infrastruktur & affärslogik
│   ├── supabase/
│   │   ├── client.ts            # Supabase-klient — webbläsare
│   │   ├── server.ts            # Supabase-klient — server
│   │   ├── middleware.ts        # session-hantering
│   │   └── types.ts             # AUTO-GENERERAD från Supabase-schemat
│   ├── auth.ts                  # roll-helpers, behörighetskontroller
│   └── utils/                   # formatering, datum, valuta
│
└── supabase/                    # DATABAS & EDGE FUNCTIONS
    ├── config.toml
    ├── migrations/               # numrerade SQL-migrationer — en per byggsteg
    └── functions/                # Edge Functions (Deno)
        ├── stripe-webhook/       # M5 — sanningen för pengar
        ├── deadline-stangning/   # M1 — pg_cron-triggad
        └── notiser/              # M15 — utskick

Modulspecifik kod (komponenter, server actions, modul-logik) ligger KOLOKERAD
i samma route-mapp i `app/` som sidan. Ingen separat `modules/`-mapp.
```

**Att lägga märke till:**

- **Modulkod ligger kolokerad.** En moduls sida, komponenter, server actions och logik bor i samma route-mapp i `app/`. Ingen separat `modules/`-mapp — modulen identifieras av route-namnet + modul-stämpeln (avsnitt 4), inte av en mapp.
- **`page.tsx` hålls tunn.** Sidfilen hämtar data och komponerar. Tyngre logik bor i syskonfiler (`actions.ts`, komponenter) i samma mapp, eller i `lib/` om den delas.
- **Route-grupper** `(public)`, `(auth)`, `(konto)`, `(intern)` grupperar sidor efter vem som får se dem. Parenteserna syns inte i URL:en — de strukturerar bara koden och låter olika delar dela layout.
- **Delad kod** (används av flera moduler) lyfts till `components/` eller `lib/`. Bygg inte delad kod i förväg.
- **Stripe-webhooks bor i `supabase/functions/`, inte i `app/api/`.** Webhooks är "sanningen för pengar" (fil 00, regel 7) och körs som Edge Function — närmast databasen, oberoende av webbappens drift.

---

## 3. Hur strukturen speglar de 17 modulerna

Varje modul har en plats i koden: route-mappen i `app/` — där bor både sidan (det användaren ser) och modulens kolokerade logik.

| Modul | Route i `app/` | Modulkod ligger |
|---|---|---|
| **M1** Insamling som objekt | `(public)/insamlingar/[publicId]/` | kolokerad i route-mappen |
| **M2** Insamlar-flödet | `(konto)/insamling/` | kolokerad i route-mappen |
| **M3** Granskar-flödet | `(intern)/granskning/` | kolokerad i route-mappen |
| **M4** Donator-flödet | `(public)/insamlingar/[publicId]/donera/` | kolokerad i route-mappen |
| **M5** Pengaflöde | `(konto)/stripe-onboarding/`, `api/stripe/` | kolokerad + `supabase/functions/stripe-webhook/` |
| **M6** Identitet & auth | `(auth)/`, `auth/callback/` | kolokerad + `lib/auth.ts` |
| **M7** Transparens-loopen | `(konto)/insamling/[id]/uppdatering/` + del av M1-sidan | kolokerad i route-mappen |
| **M8** Policies & regler | publika policy-sidor | kolokerad + delade konstanter i `lib/` |
| **M9** Profiler | `(public)/profil/[handle]/` | kolokerad i route-mappen |
| **M10** Organisationer & katalog | `(public)/foreningar/` | kolokerad i route-mappen |
| **M11** Listning & discovery | `(public)/insamlingar/`, `/` | kolokerad i route-mappen |
| **M12** Karta & geo-insikt | `(public)/karta/` | kolokerad i route-mappen |
| **M13** Community & samtal | `(public)/community/` + del av M1-sidan | kolokerad i route-mappen |
| **M14** Events & platsinfo | `(public)/community/` | kolokerad i route-mappen |
| **M15** Notiser | `(konto)/installningar/` | kolokerad + `supabase/functions/notiser/` |
| **M16** Admin & dashboard | `(intern)/admin/` | kolokerad i route-mappen |
| **M17** Team & intern arbetsyta | `(intern)/team/` | kolokerad i route-mappen |

**Databasen** ligger inte per modul — den är ett sammanhängande schema i `supabase/migrations/`. Varje byggsteg lägger en numrerad migration. Datamodellen detaljeras i fil `01-Databasplan.md`.

---

## 4. Konventioner

Regler för var saker bor och vad de heter. Konsekvens gör koden lätt att läsa.

### Filnamn

| Typ | Regel | Exempel |
|---|---|---|
| **Mappar & route-segment** | små bokstäver, bindestreck, svenska | `mina-insamlingar/` |
| **React-komponenter** | PascalCase | `InsamlingsKort.tsx` |
| **Logik & hjälpfiler** | camelCase | `berakna-belopp.ts` |
| **Next.js-specialfiler** | fasta namn | `page.tsx`, `layout.tsx`, `route.ts` |

### Delad kod kontra modulspecifik kod

Den viktigaste gränsen att hålla:

| Frågan | Svaret |
|---|---|
| Används av **flera moduler**? | → `components/` eller `lib/` |
| Hör till **en modul**? | → kolokerad i modulens route-mapp i `app/` |

**Tumregel:** börja modulspecifikt (i route-mappen). Lyfts något ut till delad kod *först* när en andra modul faktiskt behöver det. Bygg inte delad kod i förväg.

### Modul-stämpel — obligatorisk

Eftersom modulkoden inte ligger i en egen `modules/`-mapp hålls spårbarheten modul ↔ kod via en **stämpel** högst upp i varje route-fil (`page.tsx`, `actions.ts`):

```
// Modul M3 — Granskar-flödet
// Design: handoff-to-code/review.html · Regler: 1-Planering/Modul-03-Granskar-flodet.md
```

Öppna vilken kodfil som helst → du ser direkt vilken modul den hör till och var designens och planeringens källa finns. Tillsammans med route-namnet och `handoff-to-code/DESIGN-KARTA.md` är detta den röda tråden design ↔ modul ↔ kod.

### TypeScript-typer

- **`types/database.types.ts`** genereras automatiskt från Supabase-schemat med Supabase CLI. **Redigeras aldrig för hand** — regenereras efter varje migration.
- **`types/domain.ts`** är delade domäntyper byggda ovanpå databastyperna (t.ex. en `Insamling` med beräknade fält).
- **Modulspecifika typer** bor kolokerade i modulens route-mapp.
- **`any` undviks.** Är en typ okänd — skriv ut den.

### Övrigt

- Affärslogik bor i route-mappens syskonfiler (`actions.ts`, komponenter) eller `lib/` — **aldrig** i en `page.tsx`.
- Behörighet kontrolleras i databasen via RLS (fil 00, regel 5–6). Frontend-kontroller är UX, inte säkerhet.

---

## 5. Miljövariabler

Plattformen behöver hemligheter för Supabase, Stripe, e-post och BankID. **Ingen av dem får ligga i git** (fil 00, regel 9).

### Vad som behövs

| Variabel | Vad det är | Var den används |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-projektets URL | klient + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publik nyckel (skyddad av RLS) | klient + server |
| `SUPABASE_SERVICE_ROLE_KEY` | admin-nyckel — **kringgår RLS** | endast server/Edge Functions |
| `STRIPE_SECRET_KEY` | Stripe API-nyckel | server |
| `STRIPE_WEBHOOK_SECRET` | verifierar äkta webhooks | Edge Function |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | publik Stripe-nyckel | klient |
| `RESEND_API_KEY` | e-postutskick | server/Edge Functions |
| `BANKID_BROKER_*` | broker-nycklar (t.ex. Criipto) | server — se fil 03 |
| `NEXT_PUBLIC_SITE_URL` | appens bas-URL | klient + server |

**`NEXT_PUBLIC_`-prefixet** betyder att variabeln skickas till webbläsaren. Endast *publika* värden får prefixet. `SUPABASE_SERVICE_ROLE_KEY` och `STRIPE_SECRET_KEY` får det **aldrig** — de stannar på servern.

### `.env.example`-principen

- **`.env.example`** committas. Den listar alla variabelnamn — men **utan värden** (eller med tomma platshållare). Den är dokumentation: "detta behövs för att köra projektet."
- **`.env.local`** har de riktiga värdena. Den ligger i `.gitignore` och committas **aldrig**.
- Nya hemligheter läggs alltid till på **båda** ställena: namnet i `.example`, värdet lokalt.

### Var hemligheterna verkligen bor

| Miljö | Var |
|---|---|
| Lokal utveckling | `.env.local` på utvecklarens dator |
| Produktion & preview | Cloudflare Pages miljövariabel-inställningar |
| Edge Functions | Supabases secrets (`supabase secrets set`) |

Hemligheterna lever på tre ställen — aldrig i koden, aldrig i git.

---

## 6. CI & deploy

### GitHub → Cloudflare Pages auto-deploy

Cloudflare Pages kopplas till GitHub-repot. Därifrån är flödet automatiskt:

| Händelse | Vad Cloudflare Pages gör |
|---|---|
| Push till `main` | Bygger och deployar till **produktion** |
| Push till en `feature/...`-branch | Bygger en **preview-deploy** med egen URL |
| Pull request | Lägger preview-URL:en i PR:en — granska innan merge |

Next.js körs på Cloudflare via OpenNext-adaptern `@opennextjs/cloudflare` — adaptern måste vara inkopplad för att bygget ska fungera. Den kräver `nodejs_compat`-flaggan och compatibility date `2024-09-23` eller senare. Byggkommandot är adapterns (t.ex. `opennextjs-cloudflare build`) — verifiera exakt kommando mot aktuell dokumentation på `opennext.js.org/cloudflare`, eftersom området ändras snabbt.

En commit → en deploy (fil 00). Inget manuellt deploy-steg.

### Preview-deploys per branch

Varje feature-branch får en egen, levande URL. Det betyder att ett byggsteg kan **ses och testas i en riktig miljö innan det merge:as** till `main`. "Klar när"-listan kan verifieras på en riktig deploy, inte bara lokalt.

### Hur Supabase-migrationer körs

Databasen ändras **bara via numrerade migrationer** (fil 00, regel 4). De ligger i `supabase/migrations/` och versionshanteras med koden.

**Flödet:**

1. Ett byggsteg som behöver databasändring lägger en ny migrationsfil (`supabase/migrations/NNNN_...sql`).
2. Lokalt testas migrationen mot en lokal Supabase-instans.
3. När steget merge:as till `main` körs migrationen mot produktionsdatabasen — via Supabase CLI (`supabase db push`), kört av ett **GitHub Actions-workflow** vid merge.
4. Efter migrationen regenereras `types/database.types.ts`.

Cloudflare Pages deployar koden; Supabase CLI kör databasen. Båda triggas av samma merge till `main` — koden och databasen hålls i takt.

### Vad CI kontrollerar (GitHub Actions)

Vid varje pull request kör ett enkelt workflow:

- TypeScript-typkontroll
- Lint
- Tester — där de finns (pengaflöde, granskningsbeslut, roller — fil 00, regel 8)

Är något rött ska PR:en inte merge:as.

---

## 7. Beslut & öppna frågor

### Beslut

| Beslut | Motivering |
|---|---|
| **Ett privat monorepo** | Kod + databas-migration i samma commit. En sanning, en historik. Enklare än flera repon. |
| **Repo-namn `sadaqahsweden`** | Arbetsnamn, matchar projektet. Byts om plattformen får annat namn. |
| **`main` + feature-branches** | Enkelt flöde som passar ett litet team. Skyddad `main`, merge via PR. |
| **Kolokerad modulkod (ingen `modules/`)** | Modulkoden bor bredvid sin route i `app/`. Matchar Next.js App Router-konvention, den faktiska kodbasen och designöverlämningens byggplan. Spårbarhet via route-namn + modul-stämpel + `DESIGN-KARTA.md`. |
| **Tunna `page.tsx`** | Sidfiler hämtar data och komponerar. Affärslogik i route-mappens syskonfiler / `lib/`. Lättare att testa och läsa. |
| **Stripe-webhooks i Edge Functions** | "Webhooks är sanningen för pengar" — körs nära databasen, oberoende av webbappen. |
| **`database.types.ts` auto-genereras** | Databasen är källan. Typer regenereras, redigeras aldrig för hand. |
| **Migrationer körs via GitHub Actions vid merge** | Koden och databasen i takt — samma trigger, samma ögonblick. |

### Öppna frågor

| Fråga | Behöver beslut |
|---|---|
| **Slutligt repo-namn** | Bekräfta `sadaqahsweden` eller byt — gör det innan repot skapas, byten efteråt är stökiga. |
| **Vilket Cloudflare-konto / GitHub-organisation** | Personligt konto eller en organisation för projektet? Påverkar fakturering och åtkomst. |
| **BankID-broker** | Criipto är förslaget (fil 03) — exakt val avgör `BANKID_BROKER_*`-variablerna. |
| **Behövs en `staging`-miljö** | Preview-deploys täcker mycket. En fast staging-databas kan behövas när riktiga användare finns — kan vänta. |
| **CI-strikthet** | Hur hårt ska CI blockera vid start? Förslag: börja mjukt (typkontroll + lint), skärp med fler tester när pengaflödet byggs. |

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första versionen. GitHub-monorepo, branch-strategi, fullständig mappstruktur för `5-Kod/`, modul-till-kod-mappning, konventioner, miljövariabler, CI & deploy. |
| 1.1 | 2026-05-23 | Hosting ändrad från Vercel till Cloudflare Pages (OpenNext-adapter). |
| 1.2 | 2026-05-23 | Rättad mot faktisk scaffold — root-app/ (ingen src/), 17 moduler, repo-namn sadaqahsweden, brasklapp om autonomt soloskede. |
| 1.3 | 2026-05-23 | Struktur ändrad: kolokerad modulkod, **ingen `modules/`-mapp** (matchar faktisk kod + designöverlämningens byggplan). Route-grupper `(public)/(auth)/(konto)/(intern)`. Modul-stämpel-konvention tillagd. Beslutat av Zivar. |
