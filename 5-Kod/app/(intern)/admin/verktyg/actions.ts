"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type RefundAnledning = Database["public"]["Enums"]["refund_anledning"];
type Result =
  | { ok: true; refundId?: string; antal?: number }
  | { ok: false; fel: string };

async function processOne(refundId: string, accessToken: string | null): Promise<void> {
  // Trigga Edge Function asynkront — server-action väntar inte på Stripe.
  // Webhook (charge.refunded) synkar slutstatus i refunds-raden.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  try {
    await fetch(`${url}/functions/v1/process-refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken ?? anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ refund_id: refundId }),
    });
  } catch (e) {
    console.error("process-refund invoke failed", e);
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function initieraRefundDonationAction(
  donationId: string,
  anledning: RefundAnledning,
  motivering: string,
): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { ok: false, fel: "Bara admin" };

  const supabase = await createClient();
  const { data: refundId, error } = await supabase.rpc(
    "admin_initiera_refund_donation",
    {
      p_donation_id: donationId,
      p_anledning: anledning,
      p_motivering: motivering,
    },
  );
  if (error) return { ok: false, fel: error.message };

  const token = await getAccessToken();
  await processOne(refundId as string, token);

  revalidatePath("/admin/verktyg");
  revalidatePath("/admin/logg");
  return { ok: true, refundId: refundId as string };
}

export async function initieraRefundInsamlingAction(
  insamlingId: string,
  anledning: RefundAnledning,
  motivering: string,
): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { ok: false, fel: "Bara admin" };

  const supabase = await createClient();
  const { data: antal, error } = await supabase.rpc(
    "admin_initiera_refund_insamling",
    {
      p_insamling_id: insamlingId,
      p_anledning: anledning,
      p_motivering: motivering,
    },
  );
  if (error) return { ok: false, fel: error.message };

  // Triggera process-refund för alla pending refunds på denna insamling.
  const token = await getAccessToken();
  const { data: pending } = await supabase
    .from("refunds")
    .select("id, donation:donation_id!inner(insamling_id)")
    .eq("status", "pending")
    .eq("donation.insamling_id", insamlingId);
  for (const r of pending ?? []) {
    await processOne(r.id, token);
  }

  revalidatePath("/admin/verktyg");
  revalidatePath("/admin/logg");
  return { ok: true, antal: (antal as number) ?? 0 };
}

export async function forhandsberaknaRefundAction(
  insamlingId: string,
): Promise<{ antal: number; summa_ore: number } | { fel: string }> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { fel: "Bara admin" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("forhandsberakna_refund_insamling", {
    p_insamling_id: insamlingId,
  });
  if (error) return { fel: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    antal: row?.antal ?? 0,
    summa_ore: row?.summa_ore ?? 0,
  };
}
