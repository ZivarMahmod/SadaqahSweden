"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";

type Result = { ok: true; data?: unknown } | { ok: false; fel: string };

export async function bjudInTeamMedlemAction(
  email: string,
  roll: "granskare" | "admin",
  noteringar: string | null,
): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { ok: false, fel: "Bara admin" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_bjud_in_team_medlem", {
    p_email: email,
    p_roll: roll,
    p_noteringar: noteringar ?? undefined,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/team");
  return { ok: true, data };
}

export async function inaktiveraTeamMedlemAction(
  profileId: string,
  motivering: string,
): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me || me.roll !== "admin") return { ok: false, fel: "Bara admin" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_inaktivera_team_medlem", {
    p_profile_id: profileId,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/team");
  return { ok: true };
}
