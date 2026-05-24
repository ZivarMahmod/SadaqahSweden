// FX5 — Slå upp ett insamlar-konto via e-post och nollställ MFA-faktorerna.
// Återanvänder H1:s mekanik (admin_logga_mfa_aterstallning + deleteAllMfaFactors)
// men gör email→profile_id-uppslaget först så admin slipper hitta UUID:t
// via DB-konsol. Funkar för alla roller (även insamlare/förening), inte
// bara team.
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import { deleteAllMfaFactors } from "@/lib/supabase/admin";

export type MfaResetResultat =
  | {
      ok: true;
      epost: string;
      profil_id: string;
      roll: string;
      antalRaderade: number;
    }
  | { ok: false; fel: string };

export async function aterstallMfaForEpostAction(
  epost: string,
  motivering: string,
): Promise<MfaResetResultat> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { ok: false, fel: "Bara admin." };
  if (motivering.trim().length < 5) {
    return { ok: false, fel: "Motivering krävs (minst 5 tecken)." };
  }

  const supabase = await createClient();
  const { data: profil, error: pErr } = await supabase
    .from("profiles")
    .select("id, e_post, roll")
    .ilike("e_post", epost.trim())
    .maybeSingle();
  if (pErr) return { ok: false, fel: pErr.message };
  if (!profil) {
    return { ok: false, fel: "Ingen profil med den e-posten." };
  }

  const { error: logErr } = await supabase.rpc("admin_logga_mfa_aterstallning", {
    p_profile_id: profil.id,
    p_motivering: motivering,
  });
  if (logErr) return { ok: false, fel: logErr.message };

  const antalRaderade = await deleteAllMfaFactors(profil.id);

  revalidatePath("/admin/verktyg");
  revalidatePath("/admin/logg");
  revalidatePath("/admin/team");
  return {
    ok: true,
    epost: profil.e_post,
    profil_id: profil.id,
    roll: profil.roll,
    antalRaderade,
  };
}
