# Betal-abstraktionslagret (`lib/betalning/`)

Brief 33 (#15). En abstraktion runt betalleverantören så plattformen kan byta
eller lägga till PSP **utan att röra appkoden**. Stripe är en *implementation*,
inte en hårdkodning.

## Delar

- `types.ts` — `PaymentProvider` + `PayoutProvider`-interfaces och gemensamma
  typer (`BetalIntent`, `BetalResultat`, `RefundResultat`, `PayoutStatus`,
  `ProviderResultat<T>`).
- `stripe-provider.ts` — `StripeProvider` implementerar båda interfaces. Den
  **parallell-wrappar** det befintliga, levande Stripe-flödet (Edge Functions
  `create-payment-intent`, `settle-campaign`, `stripe-webhook`). Live-flödet är
  oförändrat; abstraktionen är additiv.
- `registry.ts` — `getPaymentProvider(provider?)` / `getPayoutProvider(provider?)`.
  Default `'stripe'`. Provider väljs per insamling via `insamling.betal_provider`.

## Principer (DEL 7 / CLAUDE.md) — får aldrig brytas

- **Destination charge:** gåvan går direkt till insamlarens anslutna konto.
- **Pengar i öre, heltal** — aldrig float.
- **Webhooks är sanningen för pengar** — providern skapar intents; status
  bekräftas alltid av webhook, aldrig av klienten.
- **De fyra pengaflödena blandas aldrig** (princip F): gåva · medlemskap ·
  plattforms-gåva · Corevo. `Pengaflode`-typen håller dem isär.

## Lägga till en ny provider (t.ex. Transfer Galaxy)

1. Skapa `lib/betalning/<psp>-provider.ts` som implementerar `PaymentProvider`
   (och ev. `PayoutProvider`). Delegera till PSP:ns API/Edge Function.
2. Registrera den i `registry.ts` (`switch`-grenen) under sitt provider-namn.
3. Sätt `insamling.betal_provider = '<psp>'` på de insamlingar som ska använda
   den (migration/admin). Default förblir `'stripe'`.
4. **Rör inte appkoden** — server-actions anropar `getPaymentProvider(...)`,
   aldrig en PSP direkt.

## Status (v1)

Stripe är default och enda aktiva provider (DEL 7). Abstraktionen gör byte
*möjligt* men byter inte. `skapaRefund` / `hamtaPayoutStatus` exponerar
kontrakten; deras skarpa koppling (admin_initiera_refund / `payouts`-tabellen)
wire:as när appkodens server-actions migreras till providern — en additiv,
icke-brådskande refaktor som inte får störa live-pengaflödet.
