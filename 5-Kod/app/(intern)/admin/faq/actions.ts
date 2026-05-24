"use server";
// Modul M19 — FAQ-poster: CMS-light server actions. Guard: superadmin.

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

export async function skapaFaqAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const fraga = String(formData.get("fraga") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "").trim();
  const verifieringsstatus = String(formData.get("verifieringsstatus") ?? "ej_tillampligt");

  if (fraga.length === 0 || fraga.length > 500) {
    return { ok: false, fel: "Frågan måste vara 1–500 tecken" };
  }
  if (kategori.length === 0 || kategori.length > 80) {
    return { ok: false, fel: "Kategori krävs" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("innehall_skapa_faq", {
    p_fraga: fraga,
    p_svar: "",
    p_kategori: kategori,
    p_ordning: 0,
    p_verifieringsstatus: verifieringsstatus as "ej_tillampligt" | "behover_lard" | "verifierad",
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/faq");
  redirect(`/admin/faq/${data}`);
}

export async function uppdateraFaqAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  const fraga = String(formData.get("fraga") ?? "").trim();
  const svar = String(formData.get("svar") ?? "");
  const kategori = String(formData.get("kategori") ?? "").trim();
  const ordningRaw = String(formData.get("ordning") ?? "0");
  const ordning = Number.parseInt(ordningRaw, 10);
  const verifieringsstatus = String(formData.get("verifieringsstatus") ?? "ej_tillampligt");
  const verifierad_av = String(formData.get("verifierad_av_lard_id") ?? "").trim() || undefined;

  if (!id) return { ok: false, fel: "Saknar id" };
  if (!fraga) return { ok: false, fel: "Fråga krävs" };
  if (!kategori) return { ok: false, fel: "Kategori krävs" };
  if (Number.isNaN(ordning)) return { ok: false, fel: "Ordning måste vara ett heltal" };

  const v = validateMarkdown(svar);
  if (!v.ok) return { ok: false, fel: `Svar: ${v.reason}` };

  const supabase = await createClient();
  const { error } = await supabase.rpc("innehall_uppdatera_faq", {
    p_id: id,
    p_fraga: fraga,
    p_svar: svar,
    p_kategori: kategori,
    p_ordning: ordning,
    p_verifieringsstatus: verifieringsstatus as "ej_tillampligt" | "behover_lard" | "verifierad",
    p_verifierad_av_lard_id: verifierad_av,
    p_verifierad_datum: undefined,
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/faq");
  revalidatePath(`/admin/faq/${id}`);
  return { ok: true };
}

export async function publiceraFaqAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, fel: "Saknar id" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("innehall_publicera_faq", { p_id: id });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/faq");
  revalidatePath(`/admin/faq/${id}`);
  revalidatePath("/faq");
  return { ok: true };
}

export async function avpubliceraFaqAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, fel: "Saknar id" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("innehall_avpublicera_faq", { p_id: id });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/faq");
  revalidatePath(`/admin/faq/${id}`);
  revalidatePath("/faq");
  return { ok: true };
}
