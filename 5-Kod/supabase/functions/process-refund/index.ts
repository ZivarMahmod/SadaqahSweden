// Sadaqah Sweden — Edge Function process-refund (Härdning H2).
// Kallas av Server Action efter admin_initiera_refund_donation/insamling RPC.
// Externt sidoeffekt — sker utanför DB-tx.
//
// Flöde:
//  1. Server Action skickar { refund_id } i body med caller-JWT (service_role-
//     guard kontrollerar admin-roll via DB).
//  2. Slå upp refund + donation + transfer.
//  3. Kalla stripe.refunds.create() med idempotency_key från DB-raden.
//  4. Best-effort: om donationen har en paid transfer, försök
//     transfers.createReversal() — om det misslyckas, flagga
//     failure_reason men håll status=pending. Webhook (charge.refunded)
//     synkar slutstatus oavsett.
//  5. Uppdatera refunds.stripe_refund_id (+ failure_reason om reversal failade).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type Stripe from "npm:stripe@^18.0.0";
import { stripe } from "../_shared/stripe.ts";
import { serviceClient, callerUserId } from "../_shared/supabase.ts";
import { json, fail } from "../_shared/http.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  // Behörighet: caller måste vara inloggad admin med aal2.
  // Vi förlitar oss på att RPC:n redan kollat detta, men dubbelkollar här
  // så Edge Function inte kan kallas av vem som helst.
  const userId = await callerUserId(req);
  if (!userId) return fail("Inloggning krävs", 401);

  const body = await req.json().catch(() => null);
  const refundId = (body as { refund_id?: string } | null)?.refund_id;
  if (!refundId) return fail("refund_id krävs", 400);

  const admin = serviceClient();

  // Verifiera att caller är admin (utöver RPC-grinden).
  const { data: profil } = await admin
    .from("profiles")
    .select("roll")
    .eq("id", userId)
    .single();
  if (!profil || profil.roll !== "admin") {
    return fail("Endast admin", 403);
  }

  // Slå upp refund + donation + transfer.
  const { data: refund, error: rErr } = await admin
    .from("refunds")
    .select(
      "id, donation_id, belopp_ore, anledning, status, stripe_refund_id, idempotency_key",
    )
    .eq("id", refundId)
    .maybeSingle();
  if (rErr) return fail(rErr.message, 500);
  if (!refund) return fail("Refund hittades inte", 404);

  // Idempotens på Edge-Function-nivå: redan klar = no-op.
  if (refund.status === "succeeded" || refund.status === "failed") {
    return json({ ok: true, status: refund.status, no_op: true });
  }

  const { data: donation, error: dErr } = await admin
    .from("donation")
    .select("id, stripe_payment_intent_id, transfer_id, insamling_id")
    .eq("id", refund.donation_id)
    .maybeSingle();
  if (dErr) return fail(dErr.message, 500);
  if (!donation || !donation.stripe_payment_intent_id) {
    return fail("Donation eller PaymentIntent saknas", 404);
  }

  // Skapa Stripe refund.
  let stripeRefund: Stripe.Refund;
  try {
    stripeRefund = await stripe.refunds.create(
      {
        payment_intent: donation.stripe_payment_intent_id,
        amount: refund.belopp_ore,
        reason: mapAnledningTillStripeReason(refund.anledning),
        metadata: {
          refund_id: refund.id,
          anledning: refund.anledning,
          insamling_id: donation.insamling_id ?? "",
        },
      },
      { idempotencyKey: refund.idempotency_key },
    );
  } catch (e) {
    const msg = (e as Error).message;
    await admin
      .from("refunds")
      .update({ status: "failed", failure_reason: msg })
      .eq("id", refund.id);
    return fail(`Stripe refund failed: ${msg}`, 502);
  }

  // Best-effort transfer reversal om donationen har en paid transfer.
  let reversalNote: string | null = null;
  if (donation.transfer_id) {
    const { data: transfer } = await admin
      .from("transfers")
      .select("stripe_transfer_id, status, belopp_ore")
      .eq("id", donation.transfer_id)
      .maybeSingle();
    if (transfer?.stripe_transfer_id && transfer.status === "paid") {
      try {
        await stripe.transfers.createReversal(transfer.stripe_transfer_id, {
          amount: refund.belopp_ore,
          metadata: { refund_id: refund.id },
        });
      } catch (e) {
        // Stripe kan vägra reversal om medlen redan är utbetalda till
        // insamlarens bank. Brief: flagga som manuell åtgärd.
        reversalNote = `Transfer reversal misslyckades: ${(e as Error).message}. Manuell uppföljning krävs.`;
      }
    }
  }

  // Spara stripe_refund_id + ev. reversal-not. Status lämnas som pending —
  // webhook (charge.refunded) sätter slutgiltig status.
  await admin
    .from("refunds")
    .update({
      stripe_refund_id: stripeRefund.id,
      failure_reason: reversalNote,
    })
    .eq("id", refund.id);

  // Logga reversal-utfall i admin_ingreppslogg om något flaggats för manuell
  // åtgärd. Vanlig refund-loggning gjordes i RPC:n redan.
  if (reversalNote) {
    await admin.from("admin_ingreppslogg").insert({
      admin_id: userId,
      ingrepp_typ: "annat",
      mal_insamling_id: donation.insamling_id,
      mal_donation_id: donation.id,
      motivering: reversalNote,
      detaljer: { refund_id: refund.id, stripe_refund_id: stripeRefund.id },
      reversibel: false,
    });
  }

  return json({
    ok: true,
    stripe_refund_id: stripeRefund.id,
    reversal_note: reversalNote,
  });
});

function mapAnledningTillStripeReason(
  a: string,
): Stripe.RefundCreateParams.Reason | undefined {
  // Stripe accepterar: duplicate | fraudulent | requested_by_customer.
  switch (a) {
    case "bedrageri":
      return "fraudulent";
    case "fel_donation":
      return "duplicate";
    case "donator_begaran":
      return "requested_by_customer";
    case "admin_beslut":
      return "requested_by_customer";
    default:
      return undefined;
  }
}
