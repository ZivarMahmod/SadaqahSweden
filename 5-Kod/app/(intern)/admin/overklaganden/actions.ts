"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true } | { ok: false; message: string };

export async function avgorOverklagandeAction(
  overklagandeId: string,
  rivUpp: boolean,
  motivering: string,
): Promise<Resultat> {
  await kraver(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("superadmin_avgor_overklagande", {
    p_overklagande_id: overklagandeId,
    p_riv_upp: rivUpp,
    p_motivering: motivering,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/overklaganden");
  return { ok: true };
}
