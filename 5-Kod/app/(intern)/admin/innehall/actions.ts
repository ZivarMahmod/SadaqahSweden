"use server";
// Modul M19 — Innehåll & FAQ
// CMS-light server actions. Guard: superadmin. Markdown valideras innan RPC.
// Design: handoff-to-code/internt.html · Regler: 1-Planering/Modul-19-Innehall-och-FAQ.md

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { kraver } from "@/lib/auth";
import { validateMarkdown } from "@/lib/innehall/markdown";

type FormResultat = { ok: boolean; fel?: string };

async function kravSuperadmin() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") {
    redirect("/admin");
  }
  return me;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function skapaSidaAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const titel = String(formData.get("titel") ?? "").trim();
  const sidtyp = String(formData.get("sidtyp") ?? "informativ");
  const verifieringsstatus = String(formData.get("verifieringsstatus") ?? "ej_tillampligt");

  if (!SLUG_RE.test(slug)) {
    return { ok: false, fel: "Slug måste vara gemener och bindestreck (t.ex. hur-det-fungerar)" };
  }
  if (titel.length === 0 || titel.length > 200) {
    return { ok: false, fel: "Titeln måste vara 1–200 tecken" };
  }
  if (sidtyp !== "informativ" && sidtyp !== "juridisk") {
    return { ok: false, fel: "Ogiltig sidtyp" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("innehall_skapa_sida", {
    p_slug: slug,
    p_titel: titel,
    p_sidtyp: sidtyp as "informativ" | "juridisk",
    p_verifieringsstatus: verifieringsstatus as "ej_tillampligt" | "behover_lard" | "verifierad",
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/innehall");
  redirect(`/admin/innehall/${data}`);
}

export async function uppdateraSidaAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();
  const brodtext = String(formData.get("brodtext") ?? "");
  const verifieringsstatus = String(formData.get("verifieringsstatus") ?? "ej_tillampligt");
  const verifierad_av = String(formData.get("verifierad_av_lard_id") ?? "").trim() || undefined;
  const ikrafttradande = String(formData.get("ikrafttradande_datum") ?? "").trim() || undefined;

  if (!id) return { ok: false, fel: "Saknar id" };
  if (titel.length === 0) return { ok: false, fel: "Titel krävs" };

  const v = validateMarkdown(brodtext);
  if (!v.ok) return { ok: false, fel: `Brödtext: ${v.reason}` };

  const supabase = await createClient();
  const { error } = await supabase.rpc("innehall_uppdatera_sida", {
    p_id: id,
    p_titel: titel,
    p_brodtext: brodtext,
    p_verifieringsstatus: verifieringsstatus as "ej_tillampligt" | "behover_lard" | "verifierad",
    p_verifierad_av_lard_id: verifierad_av,
    p_verifierad_datum: undefined,
    p_ikrafttradande_datum: ikrafttradande,
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath("/admin/innehall");
  revalidatePath(`/admin/innehall/${id}`);
  return { ok: true };
}

export async function publiceraSidaAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, fel: "Saknar id" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("innehall_publicera_sida", { p_id: id });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/innehall");
  revalidatePath(`/admin/innehall/${id}`);
  return { ok: true };
}

export async function skapaJuridiskVersionAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const sidaId = String(formData.get("innehallssida_id") ?? "");
  const brodtext = String(formData.get("brodtext") ?? "");
  const ikraftRaw = String(formData.get("ikrafttradande_datum") ?? "").trim();
  if (!sidaId) return { ok: false, fel: "Saknar sida-id" };
  if (!brodtext || !brodtext.trim()) return { ok: false, fel: "Brödtext krävs" };
  if (!ikraftRaw) return { ok: false, fel: "Ikraftträdandedatum krävs" };

  const v = validateMarkdown(brodtext);
  if (!v.ok) return { ok: false, fel: `Brödtext: ${v.reason}` };

  const supabase = await createClient();
  const { error } = await supabase.rpc("juridisk_skapa_version", {
    p_innehallssida_id: sidaId,
    p_brodtext: brodtext,
    p_ikrafttradande_datum: new Date(ikraftRaw).toISOString(),
  });
  if (error) return { ok: false, fel: error.message };

  revalidatePath(`/admin/innehall/${sidaId}`);
  return { ok: true };
}

export async function publiceraJuridiskVersionAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const versionId = String(formData.get("version_id") ?? "");
  const sidaId = String(formData.get("innehallssida_id") ?? "");
  if (!versionId) return { ok: false, fel: "Saknar version-id" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("juridisk_publicera_version", { p_version_id: versionId });
  if (error) return { ok: false, fel: error.message };

  revalidatePath(`/admin/innehall/${sidaId}`);
  if (sidaId) {
    revalidatePath(`/admin/innehall/${sidaId}`);
  }
  return { ok: true };
}

export async function avpubliceraSidaAction(formData: FormData): Promise<FormResultat> {
  await kravSuperadmin();
  const id = String(formData.get("id") ?? "");
  const till = String(formData.get("till_status") ?? "utkast");
  if (!id) return { ok: false, fel: "Saknar id" };
  if (till !== "utkast" && till !== "kommer_snart") {
    return { ok: false, fel: "Ogiltig avpubliceringsstatus" };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("innehall_avpublicera_sida", {
    p_id: id,
    p_till_status: till as "utkast" | "kommer_snart",
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/innehall");
  revalidatePath(`/admin/innehall/${id}`);
  return { ok: true };
}
