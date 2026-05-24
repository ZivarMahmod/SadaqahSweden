"use server";
// Modul M19 — Lärd-profiler. Superadmin-only CRUD.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { kraver } from "@/lib/auth";
import { validateMarkdown } from "@/lib/innehall/markdown";

type FormResultat = { ok: boolean; fel?: string };

async function kravSuperadmin() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");
  return me;
}

export async function skapaLardAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const namn = String(formData.get("namn") ?? "").trim();
  const presentation = String(formData.get("presentation") ?? "");
  const visa_kontakt = formData.get("visa_kontakt") === "on";
  const epost = String(formData.get("kontakt_epost") ?? "").trim() || undefined;
  const telefon = String(formData.get("kontakt_telefon") ?? "").trim() || undefined;

  if (namn.length === 0) return { ok: false, fel: "Namn krävs" };
  const v = validateMarkdown(presentation);
  if (!v.ok) return { ok: false, fel: `Presentation: ${v.reason}` };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lard_skapa", {
    p_namn: namn,
    p_presentation: presentation,
    p_visa_kontakt: visa_kontakt,
    p_kontakt_epost: epost,
    p_kontakt_telefon: telefon,
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/lard");
  redirect(`/admin/lard/${data}`);
}

export async function uppdateraLardAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  const namn = String(formData.get("namn") ?? "").trim();
  const presentation = String(formData.get("presentation") ?? "");
  const visa_kontakt = formData.get("visa_kontakt") === "on";
  const epost = String(formData.get("kontakt_epost") ?? "").trim() || undefined;
  const telefon = String(formData.get("kontakt_telefon") ?? "").trim() || undefined;

  if (!id) return { ok: false, fel: "Saknar id" };
  if (!namn) return { ok: false, fel: "Namn krävs" };
  const v = validateMarkdown(presentation);
  if (!v.ok) return { ok: false, fel: `Presentation: ${v.reason}` };

  const supabase = await createClient();
  const { error } = await supabase.rpc("lard_uppdatera", {
    p_id: id,
    p_namn: namn,
    p_presentation: presentation,
    p_visa_kontakt: visa_kontakt,
    p_kontakt_epost: epost,
    p_kontakt_telefon: telefon,
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/lard");
  revalidatePath(`/admin/lard/${id}`);
  revalidatePath(`/lard/${id}`);
  return { ok: true };
}

export async function raderaLardAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, fel: "Saknar id" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("lard_radera", { p_id: id });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/lard");
  redirect("/admin/lard");
}
