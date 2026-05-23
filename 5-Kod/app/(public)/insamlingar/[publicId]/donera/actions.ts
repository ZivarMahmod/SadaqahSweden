// Modul M4 — Donator-flödet (server action)
// Plan: 1-Planering/Modul-04-Donator-flodet.md Block 3, 2-Byggplan/03 §3.3.
// Klienten skickar belopp + e-post. Server anropar create-payment-intent
// Edge Function och returnerar client_secret som klienten konfirmerar med.
// Belopp/insamling/förtroende sätts ALDRIG av klienten — webhooks är sanningen.
"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DoneraInput {
  insamling_id: string;             // uuid på insamlingsobjektet
  belopp_ore: number;
  frivilligt_bidrag_ore?: number;
  enhet_antal?: number;
  donator_epost: string;
  anonym?: boolean;
  meddelande?: string;
}

export interface DoneraResultat {
  ok: true;
  client_secret: string;
  payment_intent_id: string;
  donation_id: string;
  donation_public_id: string;
}

export type DoneraSvar = DoneraResultat | { ok: false; error: string };

const EPOST_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function skapaPaymentIntent(input: DoneraInput): Promise<DoneraSvar> {
  if (!input.insamling_id) return { ok: false, error: "insamling_id saknas" };
  if (!Number.isInteger(input.belopp_ore) || input.belopp_ore < 1000) {
    return { ok: false, error: "Minsta donation är 10 kr" };
  }
  if (input.belopp_ore > 1_000_000_00) {
    return { ok: false, error: "Belopp för stort — kontakta oss" };
  }
  if ((input.frivilligt_bidrag_ore ?? 0) < 0) {
    return { ok: false, error: "Frivilligt bidrag kan inte vara negativt" };
  }
  if (!input.donator_epost || !EPOST_REGEX.test(input.donator_epost)) {
    return { ok: false, error: "Ogiltig e-postadress" };
  }

  const supabase: SupabaseClient = await createClient();

  // Inloggad donator? Bifoga uid; annars gäst.
  const { data: userData } = await supabase.auth.getUser();
  const donatorId = userData?.user?.id ?? null;

  const { data, error } = await supabase.functions.invoke<{
    payment_intent_id: string;
    client_secret: string;
    donation_id: string;
    donation_public_id: string;
  }>("create-payment-intent", {
    body: {
      insamling_id: input.insamling_id,
      belopp_ore: input.belopp_ore,
      frivilligt_bidrag_ore: input.frivilligt_bidrag_ore ?? 0,
      enhet_antal: input.enhet_antal,
      donator_epost: input.donator_epost,
      donator_id: donatorId,
      anonym: Boolean(input.anonym),
    },
  });

  if (error || !data?.client_secret) {
    return {
      ok: false,
      error: `Kunde inte starta betalning: ${error?.message ?? "okänt fel"}`,
    };
  }

  return {
    ok: true,
    client_secret: data.client_secret,
    payment_intent_id: data.payment_intent_id,
    donation_id: data.donation_id,
    donation_public_id: data.donation_public_id,
  };
}
