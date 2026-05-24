"use server";

// M14 — server actions för event-skapande, redigering och skicka-för-granskning.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type EventTyp = Database["public"]["Enums"]["event_typ"];

type Result = { ok: true; id?: string } | { ok: false; fel: string };

function parseDateTimeLocal(value: string | null): string | null {
  if (!value) return null;
  // <input type="datetime-local"> ger "YYYY-MM-DDTHH:mm" utan tidszon.
  // Tolkas lokalt; konvertera till ISO med antagen Europe/Stockholm.
  // För enkelhet: skicka som UTC-konstruerad timestamp via Date().
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function skapaEventAction(formData: FormData): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };

  const arOrg = !!formData.get("arrangor_org_id");
  const arrangor_org_id = (formData.get("arrangor_org_id") as string) || null;
  const arrangor_profil_id = arOrg ? null : me.userId;

  const start_at = parseDateTimeLocal(formData.get("start_at") as string | null);
  const slut_at = parseDateTimeLocal(formData.get("slut_at") as string | null);
  if (!start_at) return { ok: false, fel: "Starttid saknas" };

  const upprepning = (formData.get("upprepning") as string) || null;
  const upprepning_veckodag = upprepning
    ? Number(formData.get("upprepning_veckodag") ?? new Date(start_at).getUTCDay())
    : null;

  const data = {
    arrangor_profil_id,
    arrangor_org_id,
    titel: String(formData.get("titel") ?? "").trim(),
    typ: String(formData.get("typ") ?? "annat") as EventTyp,
    beskrivning: String(formData.get("beskrivning") ?? "").trim(),
    start_at,
    slut_at,
    upprepning: upprepning as null | "vecka" | "manad",
    upprepning_veckodag,
    plats_typ: String(formData.get("plats_typ") ?? "fysisk") as "fysisk" | "digital",
    plats_namn: ((formData.get("plats_namn") as string) || "").trim() || null,
    plats_adress: ((formData.get("plats_adress") as string) || "").trim() || null,
    plats_stad: ((formData.get("plats_stad") as string) || "").trim() || null,
    plats_organisation_id: ((formData.get("plats_organisation_id") as string) || "").trim() || null,
    digital_lank: ((formData.get("digital_lank") as string) || "").trim() || null,
    kontakt_epost: ((formData.get("kontakt_epost") as string) || "").trim() || null,
    kontakt_telefon: ((formData.get("kontakt_telefon") as string) || "").trim() || null,
    anmalan_lank: ((formData.get("anmalan_lank") as string) || "").trim() || null,
    kostnad: ((formData.get("kostnad") as string) || "").trim() || null,
    status: "utkast" as const,
    slug: "", // fylls av trigger
  };

  if (!data.titel) return { ok: false, fel: "Titel krävs" };
  if (data.titel.length > 80) return { ok: false, fel: "Titel max 80 tecken" };
  if (!data.beskrivning) return { ok: false, fel: "Beskrivning krävs" };
  if (data.beskrivning.length > 2000) return { ok: false, fel: "Beskrivning max 2000 tecken" };
  if (data.plats_typ === "fysisk" && !data.plats_namn && !data.plats_organisation_id) {
    return { ok: false, fel: "Ange platsnamn eller koppla till förening" };
  }
  if (data.plats_typ === "digital" && !data.digital_lank) {
    return { ok: false, fel: "Digital länk krävs" };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("event")
    .insert(data)
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, fel: error?.message ?? "Kunde inte spara" };
  }

  revalidatePath("/konto/event");
  return { ok: true, id: created.id };
}

export async function skickaEventForGranskning(eventId: string): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("skicka_event_for_granskning", {
    p_event_id: eventId,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/konto/event");
  revalidatePath(`/konto/event/${eventId}`);
  return { ok: true };
}

export async function markeraInstallt(eventId: string): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("event")
    .update({ status: "installt" })
    .eq("id", eventId);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/konto/event");
  revalidatePath(`/konto/event/${eventId}`);
  return { ok: true };
}

export async function raderaEventUtkast(eventId: string): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };
  const supabase = await createClient();
  // Soft-delete via deleted_at — direkt DELETE fungerar också via RLS.
  const { error } = await supabase
    .from("event")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId)
    .in("status", ["utkast", "avvisad"]);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/konto/event");
  redirect("/konto/event");
}

export async function granskareEventBeslut(
  granskningId: string,
  beslut: "godkann" | "begar_andring" | "avvisa",
  motivering: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fatta_event_granskar_beslut", {
    p_granskning_id: granskningId,
    p_beslut: beslut,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/granskning/event");
  return { ok: true };
}
