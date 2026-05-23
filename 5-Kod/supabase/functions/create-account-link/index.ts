// Modul M5 — Pengaflöde
// Plan: 2-Byggplan/02-Stripe-pengaflode.md §1.2 · 1-Planering/Modul-05 B1.3
// Skapar en kortlivad Stripe-hostad onboarding-URL. Anropas både vid första
// onboarding och som refresh när länken gått ut.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SITE_URL, stripe } from "../_shared/stripe.ts";
import { callerUserId, userClient } from "../_shared/supabase.ts";
import { fail, json } from "../_shared/http.ts";

interface ReqBody {
  type?: "account_onboarding" | "account_update";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const uid = await callerUserId(req);
  if (!uid) return fail("Unauthorized", 401);

  const supa = userClient(req);
  const { data: ca, error } = await supa
    .from("connected_accounts")
    .select("id, stripe_account_id")
    .eq("profile_id", uid)
    .in("typ", ["insamlare", "forening"])
    .maybeSingle();

  if (error || !ca) return fail("Inget connected account — kör create-connected-account först", 404);

  const body: ReqBody = await req.json().catch(() => ({}));
  const type = body.type ?? "account_onboarding";

  try {
    const link = await stripe.accountLinks.create({
      account: ca.stripe_account_id,
      refresh_url: `${SITE_URL}/stripe/onboarding/refresh`,
      return_url: `${SITE_URL}/stripe/onboarding/retur`,
      type,
    });
    return json({ url: link.url, expires_at: link.expires_at });
  } catch (e) {
    console.error("stripe.accountLinks.create failed", e);
    return fail("Kunde inte skapa Stripe onboarding-länk", 502, {
      stripe_error: (e as Error).message,
    });
  }
});
