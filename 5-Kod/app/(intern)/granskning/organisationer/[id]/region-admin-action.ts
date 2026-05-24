// FX3 — Superadmin-väg för federation: uppgradera en förening till region-admin.
//
// GX3b: använder den nya atomära admin_satt_region_admin-RPC:n (0052) som
// sätter admin_niva + admin_region_kod i samma transaktion. Tidigare två
// sekventiella anrop kunde lämna profilen i halvläge vid partiellt fel.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type RegionAdminResultat =
  | { ok: true }
  | { ok: false; message: string };

export async function uppgraderaTillRegionAdminAction(
  orgId: string,
  regionKod: string,
  motivering: string,
): Promise<RegionAdminResultat> {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") {
    return {
      ok: false,
      message: "Bara superadmin kan uppgradera en förening till region-admin.",
    };
  }
  if (!/^[0-9]{2}$/.test(regionKod)) {
    return { ok: false, message: "Ogiltig länkod (förväntar tvåsiffrigt)." };
  }
  if (motivering.trim().length < 5) {
    return { ok: false, message: "Motivering krävs (minst 5 tecken)." };
  }

  const supabase = await createClient();

  const { data: org, error: orgErr } = await supabase
    .from("organisation")
    .select("id, namn, forenings_konto_user_id")
    .eq("id", orgId)
    .single();
  if (orgErr || !org) {
    return { ok: false, message: orgErr?.message ?? "Förening saknas." };
  }
  if (!org.forenings_konto_user_id) {
    return {
      ok: false,
      message:
        "Förenings-konto är inte aktiverat ännu. Aktivera kontot (F4) först — det är profilen som blir region-admin.",
    };
  }

  // Atomär RPC: admin_niva + admin_region_kod sätts + audit-rad i samma tx.
  // Vid fel rullas allt tillbaka — inget halvläge.
  const { error } = await supabase.rpc("admin_satt_region_admin", {
    p_profile_id: org.forenings_konto_user_id,
    p_region_kod: regionKod,
    p_motivering: motivering,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/granskning/organisationer/${orgId}`);
  revalidatePath("/foreningar");
  return { ok: true };
}
