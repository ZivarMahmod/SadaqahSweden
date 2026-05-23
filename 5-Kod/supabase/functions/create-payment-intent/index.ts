// Modul M5 — Pengaflöde
// Plan: 2-Byggplan/02-Stripe-pengaflode.md §2.1 · 1-Planering/Modul-05 B2.
// Skapar en PaymentIntent PÅ PLATTFORMSKONTOT (separate charges and transfers).
// Bygger kort först (Tillägg A3). Swish slås på senare via env-flagga.
// Webhooks är sanningen — denna funktion skapar bara "skapad"-rad i donation
// tills payment_intent.succeeded landar.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { stripe } from "../_shared/stripe.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { fail, json } from "../_shared/http.ts";

interface ReqBody {
  insamling_id: string;            // public.insamling.id (uuid)
  belopp_ore: number;              // gåvan
  frivilligt_bidrag_ore?: number;  // tip till plattformen
  enhet_antal?: number;            // M4 per-enhet
  undermal_val?: "ge_anda" | "aterbetala";
  donator_epost: string;
  donator_id?: string | null;      // null för gäst
  anonym?: boolean;
}

const ENABLE_SWISH = (Deno.env.get("STRIPE_ENABLE_SWISH") ?? "false") === "true";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON", 400);
  }

  if (!body.insamling_id || !body.belopp_ore || !body.donator_epost) {
    return fail("insamling_id, belopp_ore, donator_epost krävs", 400);
  }
  if (body.belopp_ore <= 0 || (body.frivilligt_bidrag_ore ?? 0) < 0) {
    return fail("Ogiltigt belopp", 400);
  }

  const admin = serviceClient();

  // Hämta insamling + connected account.
  const { data: insamling, error: insamlingErr } = await admin
    .from("insamling")
    .select(`
      id, public_id, status, valuta,
      connected_account_id,
      transfer_group
    `)
    .eq("id", body.insamling_id)
    .maybeSingle();

  if (insamlingErr || !insamling) return fail("Insamlingen finns inte", 404);
  if (insamling.status !== "aktiv") {
    return fail(`Insamlingen tar inte emot donationer (status=${insamling.status})`, 409);
  }
  if (!insamling.connected_account_id) {
    return fail("Insamlingens mottagare saknar verifierat Stripe-konto", 409);
  }

  const { data: ca, error: caErr } = await admin
    .from("connected_accounts")
    .select("id, stripe_account_id, charges_enabled")
    .eq("id", insamling.connected_account_id)
    .maybeSingle();

  if (caErr || !ca) return fail("Connected account hittades inte", 404);
  if (!ca.charges_enabled) {
    return fail("Mottagarens Stripe-konto kan ännu inte ta emot betalningar", 409);
  }

  // Säkerställ transfer_group via service_role-funktion.
  let transferGroup = insamling.transfer_group;
  if (!transferGroup) {
    const { data: tg, error: tgErr } = await admin.rpc("sakerstall_transfer_group", {
      p_insamling_id: insamling.id,
    });
    if (tgErr || !tg) return fail("Kunde inte sätta transfer_group", 500);
    transferGroup = tg as string;
  }

  const gava = body.belopp_ore;
  const tip = body.frivilligt_bidrag_ore ?? 0;
  const total = gava + tip;
  const undermalVal = body.undermal_val ?? "ge_anda";
  const paymentMethods = ENABLE_SWISH ? ["card", "swish"] : ["card"];

  let pi;
  try {
    pi = await stripe.paymentIntents.create({
      amount: total,
      currency: "sek",
      payment_method_types: paymentMethods,
      transfer_group: transferGroup,
      receipt_email: body.donator_epost,
      metadata: {
        insamling_id: insamling.id,
        insamling_public_id: insamling.public_id,
        connected_account_id: ca.id,
        stripe_account_id: ca.stripe_account_id,
        gava_ore: String(gava),
        frivilligt_bidrag_ore: String(tip),
        undermal_val: undermalVal,
        enhet_antal: body.enhet_antal != null ? String(body.enhet_antal) : "",
        donator_id: body.donator_id ?? "",
        anonym: String(Boolean(body.anonym)),
      },
    });
  } catch (e) {
    console.error("stripe.paymentIntents.create failed", e);
    return fail("Kunde inte skapa PaymentIntent", 502, {
      stripe_error: (e as Error).message,
    });
  }

  // Skriv "skapad" donation. Status flippas av stripe-webhook vid succeeded.
  const { data: donation, error: dErr } = await admin
    .from("donation")
    .insert({
      insamling_id: insamling.id,
      donator_id: body.donator_id ?? null,
      donator_epost: body.donator_epost,
      belopp_ore: gava,
      frivilligt_bidrag_ore: tip,
      enhet_antal: body.enhet_antal ?? null,
      undermal_val: undermalVal,
      anonym: Boolean(body.anonym),
      stripe_payment_intent_id: pi.id,
      status: "skapad",
      bekraftad: false,
    })
    .select("id, public_id")
    .single();

  if (dErr) {
    console.error("donation insert failed", dErr);
    return fail("Kunde inte skapa donation-rad", 500, { db_error: dErr.message });
  }

  return json({
    payment_intent_id: pi.id,
    client_secret: pi.client_secret,
    donation_id: donation.id,
    donation_public_id: donation.public_id,
    transfer_group: transferGroup,
  }, 201);
});
