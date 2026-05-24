// FX3 — Superadmin-väg för federation: uppgradera en förening till region-admin.
// Anropar de befintliga RPC:erna från F1 (admin_satt_admin_niva +
// admin_satt_admin_region). Båda är superadmin-only och guardade i DB.
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

  // Två separata RPC-anrop. Båda är idempotenta + loggar i admin_ingreppslogg.
  // Vid fel i andra anropet rullas första inte tillbaka — region_kod kan då
  // vara osatt medan admin_niva redan är region_admin. Det är ett synligt
  // halvläge som superadmin enkelt kan reparera genom att re-sätta (idempotent).
  const setNiva = await supabase.rpc("admin_satt_admin_niva", {
    p_profile_id: org.forenings_konto_user_id,
    p_admin_niva: "region_admin",
    p_motivering: motivering,
  });
  if (setNiva.error) return { ok: false, message: setNiva.error.message };

  const setRegion = await supabase.rpc("admin_satt_admin_region", {
    p_profile_id: org.forenings_konto_user_id,
    p_region_kod: regionKod,
    p_motivering: motivering,
  });
  if (setRegion.error) return { ok: false, message: setRegion.error.message };

  revalidatePath(`/granskning/organisationer/${orgId}`);
  revalidatePath("/foreningar");
  revalidatePath(`/foreningar`);
  return { ok: true };
}
