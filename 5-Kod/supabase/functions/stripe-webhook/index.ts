// Modul M5 — Pengaflöde
// Plan: 2-Byggplan/02-Stripe-pengaflode.md §3 · 1-Planering/Modul-05 B2-B5.
// Webhook = enda sanningen för betalstatus. Signatur + idempotens innan
// något skrivs. Skrivs av service_role (kringgår RLS).
//
// VIKTIGT: deployas med verify_jwt=false. Stripe POSTar utan JWT;
// signaturen är vår autentisering.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type Stripe from "npm:stripe@^18.0.0";
import { stripe } from "../_shared/stripe.ts";
import { serviceClient } from "../_shared/supabase.ts";

const PLATFORM_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const CONNECT_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();

  // Försök plattforms-secret först; fall back till connect-secret.
  // Båda endpoints kan tas emot på samma URL.
  let event: Stripe.Event | null = null;
  for (const secret of [PLATFORM_SECRET, CONNECT_SECRET].filter(Boolean)) {
    try {
      event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
      break;
    } catch {
      // försök nästa
    }
  }
  if (!event) {
    console.warn("stripe-webhook: signaturverifiering misslyckades");
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = serviceClient();

  // Idempotens: försök INSERT på webhook_events. Unique violation = redan sett.
  const { error: insertErr } = await admin
    .from("webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_account: (event as { account?: string }).account ?? null,
      livemode: event.livemode,
      api_version: event.api_version ?? null,
      payload: event as unknown as Record<string, unknown>,
      status: "received",
    });

  if (insertErr) {
    // 23505 = unique_violation
    if ((insertErr as { code?: string }).code === "23505") {
      console.log(`stripe-webhook: ${event.id} redan sett, hoppar`);
      return new Response("ok (duplicate)", { status: 200 });
    }
    console.error("webhook_events insert error", insertErr);
    return new Response("DB error", { status: 500 });
  }

  // Dispatcha
  try {
    await handleEvent(event, admin);
    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
  } catch (e) {
    console.error(`stripe-webhook: bearbetning av ${event.type} (${event.id}) misslyckades`, e);
    await admin
      .from("webhook_events")
      .update({
        status: "error",
        error_message: (e as Error).message,
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", event.id);
    // 500 → Stripe återförsöker
    return new Response("Processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});

type Admin = ReturnType<typeof serviceClient>;

async function handleEvent(event: Stripe.Event, admin: Admin): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, admin);
      return;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, admin);
      return;
    case "payment_intent.processing":
      await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent, admin);
      return;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge, admin);
      return;
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      await handleDispute(event.data.object as Stripe.Dispute, event.type, admin);
      return;
    case "transfer.created":
    case "transfer.reversed":
    case "transfer.updated":
      await handleTransfer(event.data.object as Stripe.Transfer, event.type, admin);
      return;
    case "payout.created":
    case "payout.paid":
    case "payout.failed":
    case "payout.canceled":
      await handlePayout(event.data.object as Stripe.Payout, event.type, (event as { account?: string }).account ?? null, admin);
      return;
    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account, admin);
      return;
    default:
      console.log(`stripe-webhook: ohanterad event-typ ${event.type}`);
  }
}

// ---------- PaymentIntent ----------

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent, admin: Admin): Promise<void> {
  const md = pi.metadata ?? {};
  const insamlingId = md.insamling_id;
  const gava = Number(md.gava_ore ?? "0");
  const tip = Number(md.frivilligt_bidrag_ore ?? "0");

  if (!insamlingId) {
    console.warn(`payment_intent.succeeded utan insamling_id i metadata (${pi.id})`);
    return;
  }

  // Stripe-avgift: läs balance_transaction från första latest_charge.
  let avgift = 0;
  let balanceTxId: string | null = null;
  let chargeId: string | null = null;
  const latestChargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;
  if (latestChargeId) {
    chargeId = latestChargeId;
    try {
      const charge = await stripe.charges.retrieve(latestChargeId, {
        expand: ["balance_transaction"],
      });
      const bt = charge.balance_transaction;
      if (bt && typeof bt === "object") {
        balanceTxId = bt.id;
        avgift = bt.fee ?? 0;
      }
    } catch (e) {
      console.warn(`Kunde inte hämta charge/balance_transaction för ${pi.id}`, e);
    }
  }

  // Uppdatera donation
  const { data: donation, error: dErr } = await admin
    .from("donation")
    .update({
      status: "succeeded",
      bekraftad: true,
      stripe_charge_id: chargeId,
      stripe_balance_transaction_id: balanceTxId,
      stripe_avgift_ore: avgift,
    })
    .eq("stripe_payment_intent_id", pi.id)
    .select("id, belopp_ore, frivilligt_bidrag_ore")
    .maybeSingle();

  if (dErr) throw dErr;
  if (!donation) {
    // Donation saknas — kan hända om PI skapades utanför vår flow.
    console.warn(`payment_intent.succeeded utan motsvarande donation (${pi.id})`);
    return;
  }

  // Öka insamling-aggregat (skrivs bara av service_role)
  const { data: cur } = await admin
    .from("insamling")
    .select("insamlat_ore, insamlat_netto_ore, frivilligt_bidrag_total_ore")
    .eq("id", insamlingId)
    .single();
  if (cur) {
    const nyttBelopp = (cur.insamlat_ore ?? 0) + gava;
    await admin
      .from("insamling")
      .update({
        insamlat_ore: nyttBelopp,
        insamlat_netto_ore: (cur.insamlat_netto_ore ?? 0) + Math.max(0, gava - avgift),
        frivilligt_bidrag_total_ore: (cur.frivilligt_bidrag_total_ore ?? 0) + tip,
      })
      .eq("id", insamlingId);

    // Realtidsräknare: broadcast på publik kanal (data ÄR publik) → klienten
    // animerar siffran. Fil 03 §4 — Stripe-webhook är källan.
    try {
      const channel = admin.channel(`campaign:${insamlingId}`);
      await channel.send({
        type: "broadcast",
        event: "belopp_updated",
        payload: { insamlat_ore: nyttBelopp, donation_id: donation.id },
      });
      await admin.removeChannel(channel);
    } catch (e) {
      console.warn("realtime broadcast failed (icke-fatalt)", e);
    }
  }

  // Skicka kvitto via Resend — icke-blockerande, loggas vid fel.
  try {
    const { error: kvittoErr } = await admin.functions.invoke("skicka-kvitto", {
      body: { donation_id: donation.id },
    });
    if (kvittoErr) console.warn("kvitto-utskick fel (icke-fatalt)", kvittoErr.message);
  } catch (e) {
    console.warn("kvitto-utskick kastade (icke-fatalt)", e);
  }
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent, admin: Admin): Promise<void> {
  const reason = pi.last_payment_error?.message ?? null;
  const { error } = await admin
    .from("donation")
    .update({
      status: "failed",
      failure_reason: reason,
    })
    .eq("stripe_payment_intent_id", pi.id);
  if (error) throw error;
}

async function handlePaymentIntentProcessing(pi: Stripe.PaymentIntent, admin: Admin): Promise<void> {
  const { error } = await admin
    .from("donation")
    .update({ status: "processing" })
    .eq("stripe_payment_intent_id", pi.id);
  if (error) throw error;
}

// ---------- Charge.refunded ----------

async function handleChargeRefunded(charge: Stripe.Charge, admin: Admin): Promise<void> {
  // Hela charge refunderad? amount_refunded === amount.
  const helt = charge.amount_refunded >= charge.amount;
  const piId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (!piId) return;

  const { data: donation, error: dErr } = await admin
    .from("donation")
    .select("id, belopp_ore, insamling_id, refunderad_belopp_ore")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();
  if (dErr) throw dErr;
  if (!donation) return;

  await admin
    .from("donation")
    .update({
      status: helt ? "refunded" : "partially_refunded",
      refunderad: helt,
      refunderad_at: helt ? new Date().toISOString() : null,
      refunderad_belopp_ore: charge.amount_refunded,
    })
    .eq("id", donation.id);

  // Justera insamling-aggregat: minska med skillnaden mellan ny och gammal refund.
  const tidigareRefund = donation.refunderad_belopp_ore ?? 0;
  const tillagdRefund = Math.max(0, charge.amount_refunded - tidigareRefund);
  if (tillagdRefund > 0) {
    const { data: cur } = await admin
      .from("insamling")
      .select("insamlat_ore, insamlat_netto_ore")
      .eq("id", donation.insamling_id)
      .single();
    if (cur) {
      const nyttBelopp = Math.max(0, (cur.insamlat_ore ?? 0) - tillagdRefund);
      await admin
        .from("insamling")
        .update({
          insamlat_ore: nyttBelopp,
          insamlat_netto_ore: Math.max(0, (cur.insamlat_netto_ore ?? 0) - tillagdRefund),
        })
        .eq("id", donation.insamling_id);

      try {
        const channel = admin.channel(`campaign:${donation.insamling_id}`);
        await channel.send({
          type: "broadcast",
          event: "belopp_updated",
          payload: { insamlat_ore: nyttBelopp, donation_id: donation.id, refund: true },
        });
        await admin.removeChannel(channel);
      } catch (e) {
        console.warn("realtime broadcast (refund) failed", e);
      }
    }
  }

  // Synka refunds-tabellen
  for (const r of charge.refunds?.data ?? []) {
    await admin
      .from("refunds")
      .update({
        status: r.status === "succeeded" ? "succeeded"
              : r.status === "failed"    ? "failed"
              : r.status === "canceled"  ? "canceled"
              : "pending",
        stripe_refund_id: r.id,
      })
      .eq("stripe_refund_id", r.id);
  }
}

// ---------- Disputes ----------

async function handleDispute(d: Stripe.Dispute, eventType: string, admin: Admin): Promise<void> {
  const piId = typeof d.payment_intent === "string"
    ? d.payment_intent
    : d.payment_intent?.id;
  const chargeId = typeof d.charge === "string" ? d.charge : d.charge?.id;

  // Hitta donation
  let donationId: string | null = null;
  let insamlingId: string | null = null;
  if (piId) {
    const { data } = await admin
      .from("donation")
      .select("id, insamling_id")
      .eq("stripe_payment_intent_id", piId)
      .maybeSingle();
    if (data) {
      donationId = data.id;
      insamlingId = data.insamling_id;
    }
  }
  if (!donationId && chargeId) {
    const { data } = await admin
      .from("donation")
      .select("id, insamling_id")
      .eq("stripe_charge_id", chargeId)
      .maybeSingle();
    if (data) {
      donationId = data.id;
      insamlingId = data.insamling_id;
    }
  }
  if (!donationId || !insamlingId) {
    console.warn(`dispute ${d.id} — kunde inte koppla till donation`);
    return;
  }

  const status = mapDisputeStatus(d.status);

  const { data: existing } = await admin
    .from("disputes")
    .select("id")
    .eq("stripe_dispute_id", d.id)
    .maybeSingle();

  if (existing) {
    await admin
      .from("disputes")
      .update({
        status,
        evidence_due_by: d.evidence_details?.due_by
          ? new Date(d.evidence_details.due_by * 1000).toISOString()
          : null,
        is_charge_refundable: d.is_charge_refundable ?? true,
      })
      .eq("stripe_dispute_id", d.id);
  } else {
    await admin
      .from("disputes")
      .insert({
        donation_id: donationId,
        insamling_id: insamlingId,
        stripe_dispute_id: d.id,
        belopp_ore: d.amount,
        avgift_ore: 0,                    // Stripe rapporterar dispute_fee i balance_transaction senare
        currency: "SEK",
        reason: d.reason,
        status,
        evidence_due_by: d.evidence_details?.due_by
          ? new Date(d.evidence_details.due_by * 1000).toISOString()
          : null,
        is_charge_refundable: d.is_charge_refundable ?? true,
      });
  }
  console.log(`dispute ${d.id} (${eventType}) -> ${status}`);
}

function mapDisputeStatus(s: Stripe.Dispute.Status): string {
  // Stripe har samma värden — passthrough.
  return s;
}

// ---------- Transfer ----------

async function handleTransfer(t: Stripe.Transfer, eventType: string, admin: Admin): Promise<void> {
  let status = "pending";
  if (eventType === "transfer.created") status = "paid";        // transfers är synkrona
  if (eventType === "transfer.reversed") status = "reversed";

  const { data: existing } = await admin
    .from("transfers")
    .select("id, status, insamling_id, belopp_ore")
    .eq("stripe_transfer_id", t.id)
    .maybeSingle();

  if (existing) {
    await admin
      .from("transfers")
      .update({ status })
      .eq("id", existing.id);
  } else {
    // Skapa raden om settle-campaign inte hann skriva först
    console.log(`transfer ${t.id} mottagen utan föregående DB-rad (event=${eventType})`);
    return;
  }

  // Uppdatera insamling.utbetald_ore vid lyckad transfer
  if (status === "paid" && existing.insamling_id) {
    const { data: cur } = await admin
      .from("insamling")
      .select("utbetald_ore")
      .eq("id", existing.insamling_id)
      .single();
    if (cur) {
      await admin
        .from("insamling")
        .update({ utbetald_ore: (cur.utbetald_ore ?? 0) + (existing.belopp_ore ?? 0) })
        .eq("id", existing.insamling_id);
    }
  }
}

// ---------- Payout ----------

async function handlePayout(p: Stripe.Payout, eventType: string, account: string | null, admin: Admin): Promise<void> {
  if (!account) {
    console.warn(`payout ${p.id} utan account-header — hoppar`);
    return;
  }

  const { data: ca } = await admin
    .from("connected_accounts")
    .select("id")
    .eq("stripe_account_id", account)
    .maybeSingle();
  if (!ca) {
    console.warn(`payout ${p.id} — connected account ${account} hittades inte`);
    return;
  }

  const status = mapPayoutStatus(p.status, eventType);

  const { data: existing } = await admin
    .from("payouts")
    .select("id")
    .eq("stripe_payout_id", p.id)
    .maybeSingle();

  if (existing) {
    await admin
      .from("payouts")
      .update({
        status,
        arrival_date: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString().slice(0, 10) : null,
        failure_reason: p.failure_message ?? null,
        failure_code: p.failure_code ?? null,
      })
      .eq("id", existing.id);
  } else {
    await admin
      .from("payouts")
      .insert({
        connected_account_id: ca.id,
        stripe_payout_id: p.id,
        belopp_ore: p.amount,
        currency: (p.currency ?? "sek").toUpperCase(),
        status,
        arrival_date: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString().slice(0, 10) : null,
        failure_reason: p.failure_message ?? null,
        failure_code: p.failure_code ?? null,
      });
  }

  if (status === "paid") {
    // Insamling -> utbetald (M1 B3): görs när transfers + payout båda klara.
    // Vi triggar bara om kopplingen är 1:1 (M5 enkelt fall).
    // Mer noggrann state-övergång drivs av settle-campaign / M7 Bevis.
  }
}

function mapPayoutStatus(s: Stripe.Payout.Status, eventType: string): string {
  if (eventType === "payout.paid") return "paid";
  if (eventType === "payout.failed") return "failed";
  if (eventType === "payout.canceled") return "canceled";
  switch (s) {
    case "paid": return "paid";
    case "failed": return "failed";
    case "canceled": return "canceled";
    case "in_transit": return "in_transit";
    default: return "pending";
  }
}

// ---------- Account ----------

async function handleAccountUpdated(acct: Stripe.Account, admin: Admin): Promise<void> {
  const chargesOk = Boolean(acct.charges_enabled);
  const payoutsOk = Boolean(acct.payouts_enabled);
  const detailsOk = Boolean(acct.details_submitted);

  let status: "pending" | "restricted" | "enabled" | "disabled" = "pending";
  if (chargesOk && payoutsOk) status = "enabled";
  else if (detailsOk) status = "restricted";
  if (acct.requirements?.disabled_reason) status = "disabled";

  await admin
    .from("connected_accounts")
    .update({
      status,
      charges_enabled: chargesOk,
      payouts_enabled: payoutsOk,
      details_submitted: detailsOk,
      capabilities: acct.capabilities ?? {},
      requirements: acct.requirements ?? {},
    })
    .eq("stripe_account_id", acct.id);

  // Spegla i profiles.stripe_account_id / stripe_onboarding_klar (legacy)
  const { data: ca } = await admin
    .from("connected_accounts")
    .select("profile_id")
    .eq("stripe_account_id", acct.id)
    .maybeSingle();
  if (ca?.profile_id) {
    await admin
      .from("profiles")
      .update({
        stripe_account_id: acct.id,
        stripe_onboarding_klar: status === "enabled",
      })
      .eq("id", ca.profile_id);

    // Retroaktiv koppling: insamlingar som hann godkännas innan ägaren
    // onboardade Stripe har connected_account_id = NULL. Sätt nu när
    // kontot finns/är aktivt — settle-campaign kräver kopplingen.
    try {
      const { error: backfillErr } = await admin.rpc(
        "backfill_connected_account_for_profil",
        { p_profile_id: ca.profile_id },
      );
      if (backfillErr) {
        console.warn("backfill_connected_account_for_profil fel (icke-fatalt)", backfillErr.message);
      }
    } catch (e) {
      console.warn("backfill_connected_account kastade (icke-fatalt)", e);
    }
  }
}
