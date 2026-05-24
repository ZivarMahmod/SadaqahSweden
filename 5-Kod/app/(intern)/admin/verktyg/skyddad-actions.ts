"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";

type SkyddadResultat =
  | { ok: true; epost: string; skydd: boolean }
  | { ok: false; fel: string };

export async function sattSkyddadIdentitetAction(
  epost: string,
  skydd: boolean,
  motivering: string,
): Promise<SkyddadResultat> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { ok: false, fel: "Bara admin" };

  const supabase = await createClient();
  const { data: profil, error: pErr } = await supabase
    .from("profiles")
    .select("id, e_post")
    .ilike("e_post", epost)
    .maybeSingle();
  if (pErr) return { ok: false, fel: pErr.message };
  if (!profil) return { ok: false, fel: "Ingen profil med den e-posten" };

  const { error } = await supabase.rpc("admin_satt_skyddad_identitet", {
    p_profile_id: profil.id,
    p_skydd: skydd,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/verktyg");
  revalidatePath("/admin/logg");
  return { ok: true, epost: profil.e_post, skydd };
}
