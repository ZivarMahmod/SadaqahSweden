// Modul M5 — Pengaflöde
// Plan: 2-Byggplan/02-Stripe-pengaflode.md §1.2 · 1-Planering/Modul-05 B1.3
// Skapar Stripe Connect Express-konto för insamlare/forening, lagrar acct_id
// i connected_accounts. Anropas en gång per användare; senare reonboarding
// går via create-account-link.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { stripe } from "../_shared/stripe.ts";
import { callerUserId, serviceClient, userClient } from "../_shared/supabase.ts";
import { fail, json } from "../_shared/http.ts";

type BusinessType = "individual" | "company";

interface ReqBody {
  business_type?: BusinessType;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const uid = await callerUserId(req);
  if (!uid) return fail("Unauthorized", 401);

  // Plocka profil + ev. existerande connected account.
  const supa = userClient(req);
  const { data: profile, error: profileErr } = await supa
    .from("profiles")
    .select("id, e_post, visningsnamn, roll")
    .eq("id", uid)
    .single();

  if (profileErr || !profile) return fail("Profile not found", 404);
  if (!["insamlare", "forening"].includes(profile.roll)) {
    return fail("Roll måste vara insamlare eller forening", 403);
  }

  // Idempotens: returnera befintligt om det finns.
  const { data: existing } = await supa
    .from("connected_accounts")
    .select("id, stripe_account_id, status, charges_enabled, payouts_enabled")
    .eq("profile_id", uid)
    .in("typ", ["insamlare", "forening"])
    .maybeSingle();

  if (existing) {
    return json({
      connected_account: existing,
      reused: true,
    });
  }

  const body: ReqBody = await req.json().catch(() => ({}));
  const businessType: BusinessType =
    body.business_type ?? (profile.roll === "forening" ? "company" : "individual");

  let acct;
  try {
    acct = await stripe.accounts.create({
      type: "express",
      country: "SE",
      email: profile.e_post,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: { schedule: { interval: "manual" } },
      },
      metadata: {
        profile_id: uid,
        plattform: "sadaqahsweden",
      },
    });
  } catch (e) {
    console.error("stripe.accounts.create failed", e);
    return fail("Kunde inte skapa Stripe-konto", 502, {
      stripe_error: (e as Error).message,
    });
  }

  // Skriv connected_accounts som service_role (RLS-bypass)
  const admin = serviceClient();
  const typ = profile.roll === "forening" ? "forening" : "insamlare";
  const { data: row, error: insertErr } = await admin
    .from("connected_accounts")
    .insert({
      profile_id: uid,
      typ,
      stripe_account_id: acct.id,
      country: acct.country ?? "SE",
      business_type: businessType,
      status: "pending",
      charges_enabled: acct.charges_enabled ?? false,
      payouts_enabled: acct.payouts_enabled ?? false,
      details_submitted: acct.details_submitted ?? false,
      capabilities: acct.capabilities ?? {},
      requirements: acct.requirements ?? {},
      payout_schedule: "manual",
    })
    .select("id, stripe_account_id, status, charges_enabled, payouts_enabled")
    .single();

  if (insertErr) {
    console.error("connected_accounts insert failed", insertErr);
    return fail("DB-fel vid sparande av connected account", 500, {
      db_error: insertErr.message,
    });
  }

  return json({ connected_account: row, reused: false }, 201);
});
