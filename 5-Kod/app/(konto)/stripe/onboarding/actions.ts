// Modul M5 — Stripe-onboarding (Steg 5)
// Plan: 2-Byggplan/02-Stripe-pengaflode.md §1.2 · 1-Planering/Modul-05 B1.3
// Server actions som anropar Edge Functions create-connected-account
// och create-account-link. Klienten skickas till Stripes hostade onboarding-URL.
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { kraver } from "@/lib/auth";

function errorRedirect(message: string): never {
  redirect(`/stripe/onboarding?error=${encodeURIComponent(message)}`);
}

export async function skapaConnectedAccount(): Promise<void> {
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  // Skapa connected account om saknas (Edge Function är idempotent).
  const { error: caErr } = await supabase.functions.invoke("create-connected-account", {
    body: { business_type: me.roll === "forening" ? "company" : "individual" },
  });
  if (caErr) errorRedirect(`Kunde inte skapa Stripe-konto: ${caErr.message}`);

  const { data, error: linkErr } = await supabase.functions.invoke<{ url: string }>(
    "create-account-link",
    { body: { type: "account_onboarding" } },
  );
  if (linkErr || !data?.url) {
    errorRedirect(`Kunde inte hämta onboarding-länk: ${linkErr?.message ?? "okänt fel"}`);
  }

  redirect(data.url);
}

export async function fortsattOnboarding(): Promise<void> {
  await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    "create-account-link",
    { body: { type: "account_onboarding" } },
  );
  if (error || !data?.url) {
    errorRedirect(`Kunde inte hämta onboarding-länk: ${error?.message ?? "okänt fel"}`);
  }
  redirect(data.url);
}
