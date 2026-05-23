"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type InsamlingInsert = Database["public"]["Tables"]["insamling"]["Insert"];
type InsamlingUpdate = Database["public"]["Tables"]["insamling"]["Update"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "insamling";
}

/**
 * Skapar ett tomt utkast med minimala obligatoriska fält (med placeholder-
 * värden som måste ersättas innan inskickning). Returnerar id:t så caller
 * kan redirecta till redigera-vyn.
 */
export async function skapaUtkast(): Promise<never> {
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const placeholderDeadline = new Date();
  placeholderDeadline.setDate(placeholderDeadline.getDate() + 30);
  const placeholderGenomforande = new Date(placeholderDeadline);
  placeholderGenomforande.setDate(placeholderGenomforande.getDate() + 30);

  const draft: InsamlingInsert = {
    agare_id: me.userId,
    slug: `utkast-${Date.now()}`,
    titel: "Nytt insamlingsutkast",
    kort_beskrivning: "Beskriv kort vad insamlingen är till för.",
    lang_beskrivning:
      "Här skriver du en längre beskrivning av insamlingen — vad pengarna går till, varför det behövs och vem som får hjälpen.",
    mottagare_typ: "ej_angivet",
    mottagare_beskrivning: "Beskriv mottagaren.",
    hjalp_land: "Sverige",
    insamlar_stad: me.profil.visningsnamn || "Stockholm",
    malbelopp_modell: "fast",
    malbelopp_ore: 100000,
    insamling_deadline: placeholderDeadline.toISOString(),
    genomforande_datum: placeholderGenomforande.toISOString().slice(0, 10),
    status: "utkast",
  };

  const { data, error } = await supabase
    .from("insamling")
    .insert(draft)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Kunde inte skapa utkast: ${error?.message}`);
  }

  revalidatePath("/insamling", "layout");
  redirect(`/insamling/${data.id}/redigera`);
}

export type UppdateraResult = { ok: true } | { ok: false; message: string };

export async function uppdateraUtkast(
  id: string,
  formData: FormData,
): Promise<UppdateraResult> {
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const titel = String(formData.get("titel") ?? "").trim();
  const update: InsamlingUpdate = {
    titel,
    slug: slugify(titel),
    kort_beskrivning: String(formData.get("kort_beskrivning") ?? "").trim(),
    lang_beskrivning: String(formData.get("lang_beskrivning") ?? "").trim(),
    mottagare_typ: String(formData.get("mottagare_typ") ?? "").trim(),
    mottagare_beskrivning: String(formData.get("mottagare_beskrivning") ?? "").trim(),
    hjalp_land: String(formData.get("hjalp_land") ?? "").trim(),
    hjalp_plats: optString(formData.get("hjalp_plats")),
    insamlar_stad: String(formData.get("insamlar_stad") ?? "").trim(),
    insamlar_region: optString(formData.get("insamlar_region")),
    malbelopp_modell: String(formData.get("malbelopp_modell") ?? "fast") as
      | "fast"
      | "intervall"
      | "oppet",
    malbelopp_ore: optInt(formData.get("malbelopp_ore")),
    malbelopp_min_ore: optInt(formData.get("malbelopp_min_ore")),
    malbelopp_max_ore: optInt(formData.get("malbelopp_max_ore")),
    insamling_deadline: String(formData.get("insamling_deadline") ?? "") || undefined,
    genomforande_datum: String(formData.get("genomforande_datum") ?? "") || undefined,
    overmalsplan: optString(formData.get("overmalsplan")),
    tillat_overmal: formData.get("tillat_overmal") === "on",
  };

  const { error } = await supabase
    .from("insamling")
    .update(update)
    .eq("id", id)
    .eq("agare_id", me.userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/insamling/${id}/redigera`);
  return { ok: true };
}

export async function skickaInForGranskning(id: string): Promise<UppdateraResult> {
  const me = await kraver(["insamlare", "forening", "admin"]);
  void me;
  const supabase = await createClient();

  const { error } = await supabase.rpc("skicka_insamling_for_granskning", {
    p_insamling_id: id,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/insamling", "layout");
  return { ok: true };
}

function optString(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

function optInt(value: FormDataEntryValue | null): number | undefined {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}
