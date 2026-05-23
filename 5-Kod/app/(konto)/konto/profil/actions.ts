// Modul M9 — Server actions för att uppdatera egen profil.
// Säkerhet: kraver() + profiles_skydda_falt-triggern. Användaren får bara
// uppdatera self-presentation-fälten på sin egen rad — roll/bankid/stripe
// blockeras av triggern oavsett vad klienten skickar.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { ok: true } | { ok: false; message: string };

export async function uppdateraEgenProfil(formData: FormData): Promise<Resultat> {
  const me = await kraver();
  const supabase = await createClient();

  const visningsnamn = String(formData.get("visningsnamn") ?? "").trim();
  if (visningsnamn.length < 1 || visningsnamn.length > 80) {
    return { ok: false, message: "Visningsnamn måste vara 1–80 tecken." };
  }
  const presentation = String(formData.get("presentation") ?? "").trim();
  if (presentation.length > 280) {
    return { ok: false, message: "Presentation max 280 tecken." };
  }
  const stad   = String(formData.get("stad") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const avatar = String(formData.get("avatar_url") ?? "").trim() || null;
  const visaTotalSumma = formData.get("visa_total_summa") === "on";
  const visaStad       = formData.get("visa_stad") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({
      visningsnamn,
      presentation: presentation || null,
      stad,
      region,
      avatar_url: avatar,
      visa_total_summa: visaTotalSumma,
      visa_stad: visaStad,
    })
    .eq("id", me.userId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/konto");
  revalidatePath("/konto/profil");
  revalidatePath(`/profil/${me.profil.public_id}`);
  return { ok: true };
}
