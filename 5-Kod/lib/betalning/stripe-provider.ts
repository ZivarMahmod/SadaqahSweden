import "server-only";
// Sadaqah Sweden — Stripe-implementationen av betal-abstraktionen (brief 33 F2).
//
// Detta är en PARALLELL abstraktion runt det BEFINTLIGA, levande Stripe-flödet.
// Den ändrar inte live-flödet — den wrappar det konceptuellt så att appkoden
// (server-actions) på sikt kan anropa `PaymentProvider` istället för att känna
// till Stripe direkt. Den faktiska Stripe-logiken bor i Edge Functions
// (`create-payment-intent`, `settle-campaign`, `stripe-webhook`); här delegerar
// vi till dem via Supabase server-klienten — samma väg som donera/actions.ts.

import { createClient } from "@/lib/supabase/server";
import type {
  PaymentProvider,
  PayoutProvider,
  BetalIntent,
  BetalResultat,
  RefundResultat,
  PayoutStatus,
  ProviderResultat,
} from "./types";

export class StripeProvider implements PaymentProvider, PayoutProvider {
  readonly namn = "stripe";

  async skapaBetalIntent(
    input: BetalIntent,
  ): Promise<ProviderResultat<BetalResultat>> {
    if (!Number.isInteger(input.belopp_ore) || input.belopp_ore < 1) {
      return { ok: false, error: "Ogiltigt belopp (öre, heltal)." };
    }
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke<BetalResultat>(
      "create-payment-intent",
      {
        body: {
          insamling_id: input.insamling_id,
          belopp_ore: input.belopp_ore,
          frivilligt_bidrag_ore: input.frivilligt_bidrag_ore ?? 0,
          enhet_antal: input.enhet_antal,
          donator_epost: input.donator_epost,
          donator_id: input.donator_id ?? null,
          anonym: Boolean(input.anonym),
        },
      },
    );
    if (error || !data?.client_secret) {
      return {
        ok: false,
        error: `Kunde inte starta betalning: ${error?.message ?? "okänt fel"}`,
      };
    }
    return { ok: true, data };
  }

  async skapaRefund(
    _paymentIntentId: string,
    _beloppOre?: number,
  ): Promise<ProviderResultat<RefundResultat>> {
    // Skarp refund initieras admin-sidan via befintlig RPC/Edge Function
    // (H2, admin_initiera_refund). Abstraktionen exponerar kontraktet; den
    // skarpa kopplingen wire:as när appkoden migreras till providern.
    return {
      ok: false,
      error:
        "skapaRefund: koppla till admin_initiera_refund/Edge Function vid migrering (brief 33 F2 — parallell abstraktion).",
    };
  }

  async hamtaPayoutStatus(
    _payoutId: string,
  ): Promise<ProviderResultat<PayoutStatus>> {
    // Payout-status speglas redan i tabellen `payouts` via stripe-webhook.
    // Läs den vägen när providern tas i bruk; här är kontraktet på plats.
    return {
      ok: false,
      error:
        "hamtaPayoutStatus: läs från payouts-tabellen (webhook-speglad) vid migrering (brief 33 F2).",
    };
  }
}
