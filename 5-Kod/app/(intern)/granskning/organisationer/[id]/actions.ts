// Modul M10 — Server actions: granska organisation.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true } | { ok: false; message: string };

export async function granskaOrganisation(
  orgId: string,
  beslut: "publicera" | "komplettering" | "avvisa" | "vilande",
  motivering: string,
): Promise<Resultat> {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("granska_organisation", {
    p_org_id: orgId,
    p_beslut: beslut,
    p_motivering: motivering || undefined,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/granskning/organisationer");
  revalidatePath("/foreningar");
  return { ok: true };
}
