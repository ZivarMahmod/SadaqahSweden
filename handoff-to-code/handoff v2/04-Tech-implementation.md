# 04 — Tech-implementation

Det här dokumentet kopplar designen till **Next.js 15 + Supabase + Stripe + BankID**-stacken som ligger i `5-Kod/`. Det är inte en byggplan (den finns i `2-Byggplan/`) — det är spec för *hur* designen ska översättas.

---

## Stack-översikt (från `5-Kod/CLAUDE.md` och package.json)

- **Next.js 15** — App Router, Server Components default
- **Supabase** — Postgres + Auth + Realtime + Storage
- **Stripe Connect** — direkta utbetalningar till mottagar-föreningar
- **BankID** — via Signicat eller direkt-integration
- **Cloudflare Workers** — production deploy via OpenNext
- **Tailwind 4** — för stilfärger (men token-systemet i `globals.css` är primärt)

---

## Mappa designen till Next.js-strukturen

```
5-Kod/app/
├── layout.tsx                    ← ChromePublic + footer (root)
├── page.tsx                      ← Marketing
├── globals.css                   ← KOPIERA: source/assets/style.css + source/studio/styles.css
│
├── (public)/
│   ├── insamlingar/
│   │   ├── page.tsx              ← Discovery
│   │   └── [slug]/
│   │       ├── page.tsx          ← Fundraiser
│   │       └── donera/
│   │           └── page.tsx      ← Donate
│   ├── foreningar/
│   │   └── page.tsx              ← Catalog
│   ├── karta/
│   │   └── page.tsx              ← Map
│   ├── community/
│   │   └── page.tsx              ← Community
│   ├── u/
│   │   └── [handle]/
│   │       └── page.tsx          ← Profile
│   └── logga-in/
│       └── page.tsx              ← Auth (egen layout, ingen chrome)
│
├── (account)/                    ← layout.tsx wraps i ChromeInsamlare
│   └── mina-sidor/
│       ├── page.tsx              ← Account
│       ├── ny/
│       │   └── page.tsx          ← Wizard
│       └── [slug]/
│           └── uppdatering/
│               └── page.tsx      ← Update
│
└── (admin)/                       ← middleware redir om subdomän !== admin
    ├── layout.tsx                ← ChromeAdmin + AdminSidebar
    ├── page.tsx                  ← Admin dashboard
    ├── granskning/
    │   └── page.tsx              ← Review
    └── team/
        └── page.tsx              ← Team

5-Kod/components/
├── chrome/
│   ├── ChromePublic.tsx
│   ├── ChromeInsamlare.tsx
│   ├── ChromeAdmin.tsx
│   ├── AdminSidebar.tsx
│   └── BurgerDrawer.tsx
├── ui/
│   ├── Btn.tsx
│   ├── Tag.tsx
│   ├── Eyebrow.tsx
│   ├── ProgressBar.tsx
│   ├── Photo.tsx
│   ├── Field.tsx
│   └── ...
├── campaign/
│   ├── CampaignCard.tsx
│   └── CampaignDonateAside.tsx
└── shared/
    ├── Wordmark.tsx
    └── Icon.tsx
```

---

## Data-modellen — så här mappar studion till Supabase

Spec finns i `2-Byggplan/01-Databasplan.md`. Här är hur fälten i `STUDIO_DATA` översätts:

### `fundraisers` (tidigare `campaigns`)

| Studio | DB-kolumn | Typ | Notes |
|---|---|---|---|
| `id` | `id` | uuid | PK |
| `slug` | `slug` | text unique | URL-slug |
| `title` | `title` | text | max 120 |
| `category` | `category_id` | uuid → categories | |
| `location` | `country`, `city`, `region` | text | uppdela |
| `photo` | `hero_image_url` | text | Supabase Storage URL |
| `goal` | `goal_amount_ore` | int | i ören (200000 kr = 20000000 ören) |
| `raised` | (aggregat från donations) | int | beräknas |
| `daysLeft` | (beräknas från `end_date`) | int | |
| `donors` | (aggregat från donations) | int | beräknas |
| `org` | `partner_org_id` | uuid → organizations | |
| `starter` | `starter_user_id` | uuid → users | |
| `starterInit` | (härleds från user.name) | | |
| `verified` | (härleds från user.bankid_verified) | | |
| `zakat` | `zakat_eligible` | boolean | beslutas av granskare |
| `tags` | `tags` | text[] | inkl. "Granskad", "Akut" |
| `excerpt` | `excerpt` | text | max 240 |
| (status) | `status` | enum | draft, pending_review, active, paused, completed, archived |

### `proof_updates` (kallad "Bevis & uppdateringar" i UI)

| Fält | Typ | Notes |
|---|---|---|
| `id` | uuid | |
| `fundraiser_id` | uuid → fundraisers | |
| `type` | enum | start, proof, status, result, issue |
| `title` | text | |
| `body` | text | |
| `amount_disbursed_ore` | int nullable | bara för type=proof |
| `attachments` | jsonb | [{url, type, ocr_text}] |
| `created_at` | timestamptz | |
| `dua_count` | int | aggregat |

### `donations`

| Fält | Typ | Notes |
|---|---|---|
| `id` | uuid | |
| `fundraiser_id` | uuid → fundraisers | |
| `amount_ore` | int | |
| `donor_user_id` | uuid nullable → users | null om anonym/gäst |
| `anonymous` | boolean | |
| `stripe_payment_intent_id` | text | |
| `stripe_charge_id` | text | |
| `status` | enum | pending, succeeded, refunded |
| `created_at` | timestamptz | |

### `review_decisions`

| Fält | Typ | Notes |
|---|---|---|
| `id` | uuid | |
| `fundraiser_id` | uuid → fundraisers | |
| `reviewer_user_id` | uuid → users | |
| `decision` | enum | approved, rejected, questions_asked |
| `principle_1` | enum | ok, question, reject |
| `principle_2` | enum | |
| `principle_3` | enum | |
| `internal_note` | text | |
| `created_at` | timestamptz | |

### `users` & `bankid_verifications`

Användare har:
- `auth.users` (Supabase) för session
- `profiles` med `display_name`, `handle`, `city`, `bio`
- `bankid_verifications` med `personnummer_hashed`, `verified_at`, `latest_check_at`

### `trust_scores` (beräknad)

```sql
CREATE VIEW trust_scores AS
SELECT 
  u.id AS user_id,
  -- BankID: +30
  CASE WHEN b.verified_at IS NOT NULL THEN 30 ELSE 0 END
  -- Per finished fundraiser: +3 (max +30)
  + LEAST(30, COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'completed') * 3)
  -- Per proof in completed fundraiser: +1 per (max +30)
  + LEAST(30, COUNT(DISTINCT p.id) FILTER (WHERE p.type IN ('proof','result')) * 1)
  -- Förening-koppling: +10
  + CASE WHEN EXISTS(SELECT 1 FROM user_org_memberships WHERE user_id = u.id) THEN 10 ELSE 0 END
  -- Saknad uppdatering: -5 per
  - GREATEST(0, COUNT(*) FILTER (WHERE f.status = 'paused')) * 5
  AS score
FROM users u
LEFT JOIN bankid_verifications b ON b.user_id = u.id
LEFT JOIN fundraisers f ON f.starter_user_id = u.id
LEFT JOIN proof_updates p ON p.fundraiser_id = f.id
GROUP BY u.id, b.verified_at;
```

---

## Routing-detaljer

### Middleware (subdomän)

`5-Kod/middleware.ts` redan finns. Lägg till:

```ts
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl;
  
  if (hostname.startsWith('admin.')) {
    // Auth check: bara admin/granskare/team får in
    // Skriv om till (admin)-gruppen
    url.pathname = `/(admin)${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // Default: publik / account-grupp baserat på session
  return NextResponse.next();
}
```

### Auth-gating

`/mina-sidor/*` kräver session.
`/(admin)/*` kräver session + `role IN ('admin', 'reviewer', 'team')`.

---

## Bilder & filer

### Hero-bilder för fundraisers
- Lagras i Supabase Storage bucket `fundraiser-images`
- Path: `{fundraiser_id}/{filename}`
- Public bucket, men signed-URL för upload
- Optimering via Next.js `<Image>` med `loader` som genererar Supabase-resize-URLs

### Bevis-bilagor
- Lagras i Storage bucket `proof-attachments`
- Path: `{fundraiser_id}/{proof_update_id}/{filename}`
- **Privat bucket** — bara insamlare och granskare kan ladda ner
- PDF:er kan köras genom Tesseract.js för OCR (frivilligt, M7 nice-to-have)

### I studion vs i produktion

| Studio | Produktion |
|---|---|
| `picsum.photos/seed/sadaqa-well/1400/900?grayscale` | Faktisk URL från `fundraiser.hero_image_url` |
| Inline `STAR_SVG` i `assets/shared.js` | `<Image src="/brand/star.svg" />` |
| `data-om-text`-wrappers | Inga (det är design-systemets edit-markers) |

---

## State pattern

### För publika ytor
- **Server Components** för all initial render
- **Client Components** bara för interactive parts (`'use client'` på topbar, filter, donate-aside)
- **URL-state** för filter (Discovery använder `?cat=&sort=`) — backknappen funkar
- **localStorage** bara för: språk-pref, dark mode (vid implementering), wizard-draft

### För insamlare-ytor
- Server fetcher → client component med initial-data prop
- Mutations via Server Actions (`'use server'`)
- Realtime: bell-notiser via Supabase Realtime channel `user:{id}:notifications`

### För admin-ytor
- Realtime tight integration: kö, KPI:er, alerts via Supabase channels
- Optimistic updates på granskning-beslut

---

## Stripe Connect — flow

### Onboarding (förening)
1. Förening godkänns som partner i admin
2. Förenings-admin får länk: `/foreningar/stripe-onboarding`
3. Stripe Connect Onboarding (Express account) körs in-line med Stripe Embedded
4. Vid done → `stripe_account_id` lagras på `organizations`

### Donate-flow
1. Donator klickar "Ge X kr" på fundraiser
2. Navigera till `/insamlingar/[slug]/donera?amount=X`
3. Submit → server action skapar PaymentIntent med `application_fee_amount: 0` och `transfer_data[destination]: foreningens stripe_account_id`
4. Stripe Checkout redirect
5. Success → webhook lagrar donation, uppdaterar aggregat, mejlar kvitto
6. Cancel → tillbaka till fundraiser-sidan med felmeddelande

### 100%-policyn
- `application_fee_amount: 0` — vi tar inget
- Kortavgifter (Stripes 1.4% + 2 kr) syns på kvittot men plattformen är inte mottagare av dem
- Detta upplyses tydligt i UI (text under "Ge X kr"-knappen)

---

## BankID — flow

Spec i `2-Byggplan/03-BankID-auth-donationsflode.md`.

Sammandrag: använd Signicat eller direkt mot BankID Test/Prod. Endpoint-pattern:
- `POST /api/auth/bankid/start` → returnerar `orderRef` + `autoStartToken`
- `GET /api/auth/bankid/status?orderRef=…` → poll var 2s
- Vid `complete` → skapa Supabase session med custom claim `bankid_verified: true`

UI:
- Step 1: personnummer-input
- Step 2: spinner + "Öppna BankID-appen" + QR-kod (för annan enhet)
- Step 3: redirect till `account` (eller wherever flow startade)

---

## Tweaks — inte i produktion

Tweaks-panelen i studion ska **inte** byggas i produktion. Det är en design-verktygsfunktion. Default-tokens (copper, Spectral, Manrope) är det som ska in.

---

## Performance-mål

| Metric | Mål |
|---|---|
| **LCP (Largest Contentful Paint)** | < 2.0s |
| **FID/INP** | < 100ms |
| **CLS** | < 0.05 |
| **Bundle size (initial JS)** | < 100 KB |
| **First fundraiser-sida render** | SSG + ISR med 60s revalidate |

---

## Accessibility-baseline

- **All färgkontrast** WCAG AA (4.5:1 för text, 3:1 för UI)
- **Keyboard navigation** — Tab-bara nav, ESC stänger drawer, Enter på `<button>`
- **Focus-rings** — synliga, accent-färgade (`outline: 2px solid var(--accent)`)
- **Skärmläsare** — `aria-label` på ikon-knappar, `aria-live="polite"` på toast/notifs
- **Reduced motion** — `prefers-reduced-motion` — disable bar-chart-animation, pulse-dots, spinner

---

## Test-strategi

- **E2E** med Playwright: hela donate-flödet, wizard end-to-end, review-godkänn
- **Visual regression** med Percy eller Chromatic (jämför mot studion som baseline)
- **Stripe-test** med test-cards i alla checkouts
- **BankID-test** med Signicat-sandbox

---

## Migrering från v0.1 (befintliga HTML-filer)

De gamla HTML-filerna i `handoff-to-code/` är obsolete — använd studion + dessa docs istället. Innehåll/copy kan dock plockas från dem:

- `marketing.html` → riktig copy som finns i studion redan
- `byggplan.html` → behåll separat som design-anteckningar, ej produktion
- Övriga är överlagrade av studion

---

## Vad jag REKOMMENDERAR bygg-ordningen blir

1. **Auth + BankID** först — allt annat behöver det
2. **Account (M2)** — Wizard + Account-dashboard, så att insamlare kan börja skapa
3. **Granskningskö (M3)** — bygg parallellt, så att granskare kan testa flödet
4. **Discovery + Fundraiser-detalj** — publika ytor
5. **Donate + Stripe Connect**
6. **Update + Bevis-loop**
7. **Marketing-landing** (sist — kräver att flera ytor finns för att visa)
8. **Map, Community, Catalog, Profile** — kan göras parallellt i slutet
9. **Admin-dashboard** sist — det är meta-vyn över allt

Anpassa efter `2-Byggplan/05-Byggsekvens.md`.
