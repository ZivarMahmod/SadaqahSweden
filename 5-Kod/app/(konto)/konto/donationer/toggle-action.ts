"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true; visa: boolean } | { ok: false; message: string };

export async function toggleVisaDonationerAction(visa: boolean): Promise<Resultat> {
  const me = await kraver();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ visa_donations_publikt: visa })
    .eq("id", me.userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/konto/donationer");
  revalidatePath("/konto/profil");
  revalidatePath(`/profil/${me.profil.public_id}`);
  return { ok: true, visa };
}
