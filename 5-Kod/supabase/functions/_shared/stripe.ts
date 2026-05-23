// Modul M5 — Pengaflöde (delad Stripe-klient för Edge Functions)
// Plan: 2-Byggplan/02-Stripe-pengaflode.md, 1-Planering/Modul-05.
// Nyckeln läses från miljön. Live vs test avgörs av vilken STRIPE_SECRET_KEY
// som finns i miljön (Tillägg A4 — nyckel-disciplin).
import Stripe from "npm:stripe@^18.0.0";

const key = Deno.env.get("STRIPE_SECRET_KEY");
if (!key) {
  console.error("STRIPE_SECRET_KEY saknas i miljön");
}

export const stripe = new Stripe(key ?? "sk_test_placeholder", {
  apiVersion: "2025-09-30.clover",
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "sadaqahsweden", version: "0.1.0" },
});

export const PLATFORM_ASSOCIATION_ACCOUNT_ID =
  Deno.env.get("PLATFORM_ASSOCIATION_ACCOUNT_ID") ?? null;

export const SITE_URL =
  Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
