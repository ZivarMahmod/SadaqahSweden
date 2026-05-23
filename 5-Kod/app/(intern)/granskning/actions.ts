// Modul M3 — Server Actions för granskar-flödet.
// Plan: Modul-03 Block 1.2 (pickup), Block 3 (beslut + motivering + logg).
// Säkerhet: alla actions kallar kraver(['granskare','admin']). RPC validerar
// dessutom rollen serverside via private.aktuell_roll() — dubbla lås.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type GranskningBeslut = Database["public"]["Enums"]["granskning_beslut"];

export type Resultat = { ok: true } | { ok: false; message: string };

export async function tilldelaTillMig(granskningId: string): Promise<Resultat> {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("tilldela_granskning", {
    p_granskning_id: granskningId,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/granskning", "layout");
  return { ok: true };
}

export async function fattaBeslut(
  granskningId: string,
  beslut: GranskningBeslut,
  motivering: string,
): Promise<Resultat> {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("fatta_granskar_beslut", {
    p_granskning_id: granskningId,
    p_beslut: beslut,
    p_motivering: motivering,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/granskning", "layout");
  return { ok: true };
}

export async function sparaAnteckningar(
  granskningId: string,
  anteckningar: string,
): Promise<Resultat> {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("uppdatera_granskning_anteckningar", {
    p_granskning_id: granskningId,
    p_anteckningar: anteckningar,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/granskning/${granskningId}`);
  return { ok: true };
}

// Server Action: bunden form-action för pickup.
export async function tilldelaOchOppna(formData: FormData): Promise<void> {
  const granskningId = String(formData.get("granskning_id") ?? "");
  if (!granskningId) return;
  const res = await tilldelaTillMig(granskningId);
  if (!res.ok) {
    // RPC failade — redirect tillbaka med info; UI:n visar fel via state.
    return;
  }
  redirect(`/granskning/${granskningId}`);
}
