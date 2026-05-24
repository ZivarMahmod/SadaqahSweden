"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true; id: string } | { ok: false; message: string };

export async function lamnaOverklagandeAction(insamlingId: string, skal: string): Promise<Resultat> {
  await kraver();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lamna_overklagande", {
    p_insamling_id: insamlingId,
    p_skal: skal,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/konto/insamling/${insamlingId}`);
  return { ok: true, id: data as string };
}
