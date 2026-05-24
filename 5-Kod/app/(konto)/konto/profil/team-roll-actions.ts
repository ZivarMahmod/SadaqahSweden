"use server";

import { revalidatePath } from "next/cache";
import { kraver, aktuellAnvandare } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true } | { ok: false; message: string };

export async function pausaAction(skal: string): Promise<Resultat> {
  // OBS: kraver() utan roll-restriktion — pausad team-roll har redan blivit
  // 'insamlare' via lib/auth, så restriktion mot 'granskare'|'admin' skulle
  // hindra användaren från att pausa två gånger eller från att se sin form.
  await kraver();
  const me = await aktuellAnvandare();
  // RPC nedan validerar rå roll igen (granskare/admin) serverside.
  if (!me) return { ok: false, message: "Inte inloggad" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("pausa_team_roll", { p_skal: skal });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/konto/profil");
  return { ok: true };
}

export async function aterstallAction(): Promise<Resultat> {
  await kraver();
  const supabase = await createClient();
  const { error } = await supabase.rpc("aterstall_team_roll");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/konto/profil");
  return { ok: true };
}
