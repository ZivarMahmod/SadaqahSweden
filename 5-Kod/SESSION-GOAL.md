# SESSION-GOAL — Steg 5 + Steg 6 (Stripe + Donator-flöde)

**Datum:** 2026-05-24
**Status:** Strukturellt klart för Steg 5 och Steg 6. Skarp-test väntar på
Stripe test-nycklar + webhook-URL + Resend-nyckel.

## Steg 5 — Stripe Connect & pengaplumbing

- **Migration 0011** (`supabase/migrations/0011_stripe_pengaplumbing.sql`):
  connected_accounts, webhook_events (idempotens), transfers, refunds, payouts,
  disputes. Donation utökad med status/avgift/refund-belopp/transfer-FK.
  Insamling utökad med insamlat_netto_ore / utbetald_ore /
  frivilligt_bidrag_total_ore + utökat pengaskydd. FK insamling→connected_accounts.
  RLS på allt.
- **Edge Functions** (`supabase/functions/`):
  - `create-connected-account` — accounts.create (type=express, country=SE,
    capabilities card_payments+transfers, manual payout schedule), idempotent.
  - `create-account-link` — accountLinks.create för onboarding/refresh.
  - `create-payment-intent` — PaymentIntent på plattformskontot, separate
    charges and transfers, transfer_group per insamling, kort först
    (Swish via env-flagga `STRIPE_ENABLE_SWISH`).
  - `stripe-webhook` — signatur (platform + connect secret), idempotens via
    webhook_events, hanterar payment_intent.{succeeded,failed,processing} /
    charge.refunded / charge.dispute.* / transfer.* / payout.* / account.updated.
    Sänder Realtime broadcast på `campaign:<id>` och anropar `skicka-kvitto`
    efter succeeded.
  - `settle-campaign` — Tillägg A1 (pengar flödar framåt). Transfererar netto
    till insamlaren + tip till föreningens connected acct vid deadline.
    Idempotency-Key på transfers.
- **App-routes** (`app/(konto)/stripe/onboarding/`): status, retur, refresh.

## Steg 6 — Donator-flöde & realtidsräknare

- **Donator-wizard** (`app/(public)/insamlingar/[publicId]/donera/`):
  snabbval, fri summa, frivilligt bidrag, anonymitet, e-post. Gäst utan konto.
  Stripe Payment Element inbäddat. Tack-sida med kvittosammandrag.
- **Realtidsräknare** (`live-raknare.tsx`): klient prenumererar på
  Supabase Realtime broadcast `campaign:<id>`; webhook sänder vid varje
  succeeded/refunded. Fallback: hämtar nya beloppet vid window.focus.
- **Resend-kvitto** (`supabase/functions/skicka-kvitto/`): HTML + text mail
  med donations-public_id som kvittonummer. Anropas av stripe-webhook,
  icke-blockerande.
- **Beroenden**: @stripe/stripe-js + @stripe/react-stripe-js (installerade
  med --legacy-peer-deps).

## Verifikationsstatus

- `npm run build` — **grönt** (Steg 5 + Steg 6).
- Supabase Security Advisor — inga nya P0-lints från 0011.
  INFO `mission` (reserverad) och WARN HIBP (operativt) kvar sen tidigare.
- TypeScript-typer regenererade mot live-schemat.

## Väntar på Zivar (operativt)

1. **Stripe test-nycklar** i miljön:
   - `STRIPE_SECRET_KEY=sk_test_…` (server/Edge Functions)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…` (klient)
2. **Stripe Connect aktiverat** i test-läget (dashboard).
3. **Deploy Edge Functions** till Supabase:
   - `_shared/` (stripe.ts, supabase.ts, http.ts) — delade utilities
   - `create-connected-account`, `create-account-link`, `create-payment-intent`,
     `settle-campaign`, `skicka-kvitto` — `verify_jwt=true`
   - `stripe-webhook` — `verify_jwt=false` (Stripe POSTar utan JWT;
     signaturen är autentiseringen)
4. **Registrera webhook-endpoint** i Stripe (test-läget) mot deploy-URL
   `…/functions/v1/stripe-webhook`. Stripe genererar `whsec_…` → sätt som
   Supabase secrets:
   - `STRIPE_WEBHOOK_SECRET=whsec_…` (plattforms-events)
   - `STRIPE_WEBHOOK_SECRET_CONNECT=whsec_…` (Connect-events)
5. **Resend-nyckel**: `RESEND_API_KEY=re_…` + `RESEND_FROM` (verifierad
   from-adress på sadaqahsweden.se). Tills satt skickas inget kvitto, men
   donationen bokförs ändå.
6. **PLATFORM_ASSOCIATION_ACCOUNT_ID** (frivilligt) — föreningens egna
   connected account-id för tip-mottagning.
7. **STRIPE_ENABLE_SWISH=true** efter kort-flödet sett en test-betalning.

## Vad som händer i ordningsföljd när test-nycklarna finns

1. Deploy Edge Functions → register webhook → fyll i `STRIPE_WEBHOOK_SECRET`.
2. En testanvändare med rollen `insamlare`/`forening` besöker
   `/stripe/onboarding` → starta onboarding → Stripe-flow → retur →
   `account.updated`-webhook flippar status till `enabled`.
3. Användarens insamling kopplas via `insamling.connected_account_id`.
4. Donator-besöker `/insamlingar/<id>/donera` → snabbval → Payment Element
   → confirm → `payment_intent.succeeded`-webhook fyller donation,
   ökar insamling-aggregat, broadcastar till live-räknaren, anropar
   skicka-kvitto.

## Öppna frågor från 02-Stripe — uppdaterad status (2026-05-24)

| # | Fråga | Status |
|---|---|---|
| 1 | Swish via Stripe i Connect | Bekräftad (Tillägg A3 + Stripe-dok 2026-05-24). Slås på via env-flagga efter kort-flödet sett produktion. |
| 2 | Connect-API-form | Verifierad mot dok 2026-05-24: `accounts.create({ type: "express", country: "SE", capabilities: { card_payments, transfers }, settings: { payouts: { schedule: { interval: "manual" } } } })`. `accountLinks.create({ account, refresh_url, return_url, type: "account_onboarding" })`. PaymentIntent: amount/currency/payment_method_types/transfer_group/metadata. transfers.create: amount/currency/destination/transfer_group + Idempotency-Key. |
| 3 | Connect-webhooks vs plattforms-webhooks | Verifierad: båda secrets stöds av `stripe-webhook` (försöker båda i tur). |
| 4 | Payout-schema på Express | Verifierad: `settings.payouts.schedule.interval = "manual"` vid `accounts.create`. |
| 5–9 | Pris, refund-avgift, juridik, chargeback | Operativ uppföljning; kod-arkitekturen tål svaren oavsett. |

## Vad som kvarstår strukturellt för Steg 5–6

- **Insamlings-skapande (M2/Steg 3)** kopplar inte ännu insamlingens
  `connected_account_id`. När en insamlare publicerar en insamling ska
  hens connected_account.id automatiskt sättas på insamlingen. Lägg in
  i M2-wizardens "publicera"-steg (insamling_status=`aktiv`-övergången).
- **Realtime-policy på `realtime.messages`**: vi använder publika kanaler
  för räknaren (data är publik). Om Supabase-projektet senare strikt
  privatiserar Realtime — lägg policy som tillåter anon att subscribe på
  `topic LIKE 'campaign:%'`.
- **Stora-gåva-flagg (M4 B1.3 + M16)**: webhook bör flagga donation >50 000 kr
  till en larm-tabell. Parkerat tills M16-admin byggs.
- **Settle-campaign cron**: pg_cron-jobb som hittar insamlingar där
  `deadline < now()` och `status = 'aktiv'` och anropar `settle-campaign`
  per insamling. Funktion finns; schemaläggning väntar på operativ trigger
  (kan vara cron-job, webhook eller manuell admin-trigger för v1).
