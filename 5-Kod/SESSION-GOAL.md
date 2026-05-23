# SESSION-GOAL — Steg 5 Stripe Connect & pengaplumbing

**Datum:** 2026-05-24
**Status:** Strukturellt klart. Skarp-test väntar på Stripe test-nycklar + webhook-URL.

## Vad är byggt

- **Migration 0011** (`supabase/migrations/0011_stripe_pengaplumbing.sql`): connected_accounts, webhook_events (idempotens), transfers, refunds, payouts, disputes. Donation utökad med status/avgift/refund-belopp/transfer-FK. Insamling utökad med insamlat_netto_ore / utbetald_ore / frivilligt_bidrag_total_ore + utökat pengaskydd. FK insamling→connected_accounts. RLS på allt.
- **Edge Functions** (`supabase/functions/`):
  - `create-connected-account` — accounts.create (type=express, country=SE, capabilities card_payments+transfers, manual payout schedule), idempotent per profil.
  - `create-account-link` — accountLinks.create för onboarding/refresh.
  - `create-payment-intent` — PaymentIntent på plattformskontot, separate charges and transfers, transfer_group per insamling, kort först (Swish via env-flagga `STRIPE_ENABLE_SWISH`).
  - `stripe-webhook` — signatur (platform + connect secret), idempotens via webhook_events, hanterar payment_intent.{succeeded,failed,processing} / charge.refunded / charge.dispute.* / transfer.* / payout.* / account.updated.
  - `settle-campaign` — Tillägg A1 (pengar flödar framåt). Transfererar netto till insamlaren + tip till föreningens connected acct vid deadline. Idempotency-Key på transfers.
- **App-routes** (`app/(konto)/stripe/onboarding/`): status-sida, onboarding-knapp, retur-sida, refresh-sida. Server actions invokar Edge Functions via user-JWT.

## Verifikationsstatus

- `npm run build` — **grönt**.
- Supabase Security Advisor — inga nya lints från 0011. INFO `mission` (reserverad) och WARN HIBP (operativ Auth-inställning) kvar sen tidigare.
- TypeScript-typer (`lib/supabase/types.ts`) regenererade mot live-schemat — innehåller alla nya tabeller.

## Väntar på Zivar (operativt, hör inte hit men noteras)

1. **Stripe test-nycklar i miljön:**
   - `STRIPE_SECRET_KEY=sk_test_…` (server/Edge Functions)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…` (klient — Steg 6)
2. **Stripe Connect aktiverat i test-läget** (dashboard).
3. **Deploy Edge Functions** till Supabase:
   - `_shared/` (stripe.ts, supabase.ts, http.ts) — delade utilities
   - `create-connected-account`, `create-account-link`, `create-payment-intent`, `settle-campaign` — `verify_jwt=true`
   - `stripe-webhook` — `verify_jwt=false` (Stripe POSTar utan JWT; signaturen är autentisering)
4. **Registrera webhook-endpoint** i Stripe (test-läget) mot deploy-URL `…/functions/v1/stripe-webhook`. Stripe genererar då `whsec_…` — sätt som Supabase secret:
   - `STRIPE_WEBHOOK_SECRET=whsec_…` (plattforms-events)
   - `STRIPE_WEBHOOK_SECRET_CONNECT=whsec_…` (Connect-events, separat endpoint i Stripe)
5. **PLATFORM_ASSOCIATION_ACCOUNT_ID** (frivilligt) — föreningens egna connected account-id för att ta emot tip. Tills satt stannar tip-summan på plattformsbalansen och spåras via `insamling.frivilligt_bidrag_total_ore`.
6. **STRIPE_ENABLE_SWISH=true** när Swish-test verifierad (Tillägg A3 bekräftade att det funkar — slå på efter kort-flödet sett en testbetalning landa).

## Vad som händer i ordningsföljd när test-nycklarna finns

1. Deploy Edge Functions → register webhook → fyll i `STRIPE_WEBHOOK_SECRET` → Edge Functions klara.
2. En testanvändare med rollen `insamlare`/`forening` besöker `/stripe/onboarding` → starta onboarding → Stripe-flow → retur → `account.updated`-webhook flippar status till `enabled`.
3. Den användarens insamling kopplas via `insamling.connected_account_id` (manuellt i Steg 6 eller via M2-wizard).
4. Steg 6 (donator-flöde) använder `create-payment-intent` → succeeded-webhook fyller donation → realtidsräknaren uppdateras (M5 §6).

## Öppna frågor från 02-Stripe — uppdaterad status (2026-05-24)

| # | Fråga | Status |
|---|---|---|
| 1 | Swish via Stripe i Connect — | Bekräftad (Tillägg A3 + Stripe-dok 2026-05-24). Slås på via env-flagga efter kort-flödet sett produktion. |
| 2 | Connect-API-form | Verifierad: `accounts.create({ type: "express", country: "SE", capabilities: { card_payments, transfers } })` + `accountLinks.create({ account, refresh_url, return_url, type: "account_onboarding" })`. PaymentIntent: amount/currency/payment_method_types/transfer_group/metadata. transfers.create: amount/currency/destination/transfer_group + Idempotency-Key. |
| 3 | Connect-webhooks vs plattforms-webhooks | Verifierad: event-namn passthrough; båda secrets stöds av `stripe-webhook` (försöker båda i tur). |
| 4 | Payout-schema på Express | Verifierad: `settings.payouts.schedule.interval = "manual"` vid `accounts.create` (även `balance_settings`-API finns för accounts v2). |
| 5–9 | Prissättning, refund-avgift, juridik, chargeback-villkor m.m. | Operativ uppföljning; kod-arkitekturen tål svaren oavsett siffror. |
