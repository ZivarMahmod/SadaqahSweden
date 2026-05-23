// Modul M15 — Server actions: markera läst, uppdatera notispreferenser.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Grupp = Database["public"]["Enums"]["notis_grupp"];

export type Resultat = { ok: true } | { ok: false; message: string };

export async function markeraLast(notisId: string): Promise<Resultat> {
  await kraver();
  const supabase = await createClient();
  const { error } = await supabase.rpc("markera_notis_last", { p_notis_id: notisId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/konto/notiser");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markeraAllaLasta(): Promise<Resultat> {
  await kraver();
  const supabase = await createClient();
  const { error } = await supabase.rpc("markera_alla_notiser_lasta");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/konto/notiser");
  revalidatePath("/", "layout");
  return { ok: true };
}

// Form action — använd via <form action={...}>
export async function markeraAllaLastaForm(): Promise<void> {
  await markeraAllaLasta();
}

export async function uppdateraPref(
  grupp: Grupp,
  formData: FormData,
): Promise<Resultat> {
  const me = await kraver();
  const supabase = await createClient();

  if (grupp === "transaktionellt") {
    return { ok: false, message: "Transaktionella notiser kan inte stängas av." };
  }

  const inApp = formData.get("in_app") === "on";
  const epost = formData.get("epost") === "on";

  // UPSERT — om raden saknas (sällan, men händer) skapa den.
  const { error: updErr } = await supabase
    .from("notis_preferens")
    .upsert({
      profil_id: me.userId,
      grupp,
      in_app: inApp,
      epost,
      push: false,
      uppdaterad_at: new Date().toISOString(),
    });

  if (updErr) return { ok: false, message: updErr.message };

  revalidatePath("/konto/profil");
  revalidatePath("/konto/notiser");
  return { ok: true };
}
