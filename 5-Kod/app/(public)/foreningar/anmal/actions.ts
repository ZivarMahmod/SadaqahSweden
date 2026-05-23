// Modul M10 — Server action: anmäl förening till katalogen.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true; id: string } | { ok: false; message: string };

export async function anmalForening(formData: FormData): Promise<Resultat> {
  await kraver();
  const supabase = await createClient();

  const namn = String(formData.get("namn") ?? "").trim();
  const orgNummer = String(formData.get("org_nummer") ?? "").trim() || null;
  const organisationstyp = String(formData.get("organisationstyp") ?? "").trim();
  const stad = String(formData.get("stad") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const besoksadress = String(formData.get("besoksadress") ?? "").trim() || null;
  const beskrivning = String(formData.get("beskrivning") ?? "").trim();
  const logotyp = String(formData.get("logotyp_url") ?? "").trim() || null;
  const bekraftaMuslimsk = formData.get("muslimsk") === "on";

  if (!bekraftaMuslimsk) {
    return { ok: false, message: "Bekräfta att föreningen är muslimsk för att gå vidare." };
  }

  const { data, error } = await supabase.rpc("anmal_organisation", {
    p_namn: namn,
    p_org_nummer: orgNummer ?? "",
    p_organisationstyp: organisationstyp,
    p_stad: stad,
    p_region: region,
    p_besoksadress: besoksadress ?? "",
    p_beskrivning: beskrivning,
    p_logotyp_path: logotyp ?? "",
  });

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Okänt fel vid anmälan." };

  revalidatePath("/foreningar");
  revalidatePath("/konto/foreningar");
  return { ok: true, id: String(data) };
}
