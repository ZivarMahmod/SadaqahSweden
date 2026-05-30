// Sadaqah Sweden — Betal-abstraktionslagret (brief 33, #15).
// Abstrakt kontrakt runt betalleverantören så plattformen senare kan byta/lägga
// till PSP (Transfer Galaxy, annan) UTAN att röra appkoden. Stripe är en
// *implementation* av dessa interfaces, inte en hårdkodning.
//
// Principer (DEL 7 / CLAUDE.md):
// - Destination charge: gåvan går direkt till insamlarens anslutna konto.
// - Pengar i ÖRE, heltal — aldrig float.
// - Webhooks är sanningen för pengar — interfacet skapar intents, men status
//   bekräftas alltid av webhook, aldrig av klienten.
// - De fyra pengaflödena blandas aldrig (princip F).

/** Pengaflöde — håller de fyra flödena åtskilda (princip F). */
export type Pengaflode = "gava" | "medlemskap" | "plattforms_gava" | "corevo";

/** Indata för att skapa en betal-intent. Belopp alltid i öre (heltal). */
export interface BetalIntent {
  insamling_id: string;
  belopp_ore: number;
  frivilligt_bidrag_ore?: number;
  enhet_antal?: number;
  donator_epost: string;
  donator_id?: string | null;
  anonym?: boolean;
  flode?: Pengaflode; // default "gava"
}

/** Resultat av en skapad betal-intent. */
export interface BetalResultat {
  client_secret: string;
  payment_intent_id: string;
  donation_id: string;
  donation_public_id: string;
}

/** Resultat av en återbetalning. */
export interface RefundResultat {
  refund_id: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  belopp_ore: number;
}

/** Status för en utbetalning till en insamlares anslutna konto. */
export interface PayoutStatus {
  payout_id: string;
  status: "pending" | "in_transit" | "paid" | "failed" | "canceled";
  belopp_ore: number;
  ankomst_at?: string | null;
}

/** Diskriminerat fel-resultat — providers kastar aldrig rått mot appkoden. */
export type ProviderResultat<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Kontrakt för att skapa betalningar och återbetalningar. Stripe implementerar
 * detta; en framtida PSP gör detsamma utan att appkoden ändras.
 */
export interface PaymentProvider {
  /** Leverantörens stabila id (t.ex. "stripe"). */
  readonly namn: string;
  /** Skapar en betal-intent (destination charge). Status bekräftas av webhook. */
  skapaBetalIntent(input: BetalIntent): Promise<ProviderResultat<BetalResultat>>;
  /** Initierar en återbetalning av en donation. */
  skapaRefund(
    paymentIntentId: string,
    beloppOre?: number,
  ): Promise<ProviderResultat<RefundResultat>>;
}

/**
 * Kontrakt för utbetalnings-status. Hålls separat från PaymentProvider eftersom
 * en framtida provider kan dela betal- men inte payout-ansvar.
 */
export interface PayoutProvider {
  readonly namn: string;
  /** Hämtar status för en utbetalning. */
  hamtaPayoutStatus(payoutId: string): Promise<ProviderResultat<PayoutStatus>>;
}
