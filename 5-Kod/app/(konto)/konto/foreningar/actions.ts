// Modul M10 — Server actions: svara collab.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true } | { ok: false; message: string };

export async function svaraCollab(collabId: string, godkand: boolean): Promise<Resultat> {
  await kraver();
  const supabase = await createClient();
  const { error } = await supabase.rpc("svara_collab", {
    p_collab_id: collabId,
    p_godkand: godkand,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/konto/foreningar");
  return { ok: true };
}
