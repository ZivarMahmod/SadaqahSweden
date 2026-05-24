"use server";

// Server actions för M13 Community.
//
// Säkerhet: alla DB-skrivningar går via SECURITY DEFINER-RPC:er
// (posta_kommentar, satt_reaktion, rapportera_kommentar). Inga
// direkta INSERTs från klienten — RLS blockerar det också.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";

type Result = { ok: true } | { ok: false; fel: string };

async function kravInloggning(): Promise<{ ok: false; fel: string } | null> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };
  return null;
}

export async function postaKommentarAction(
  insamlingPublicId: string,
  formData: FormData,
): Promise<Result> {
  const auth = await kravInloggning();
  if (auth) return auth;

  const text = String(formData.get("text") ?? "").trim();
  const insamlingId = String(formData.get("insamling_id") ?? "");
  const uppdateringId = (formData.get("uppdatering_id") ?? null) as string | null;
  const parentId = (formData.get("parent_id") ?? null) as string | null;

  if (!text) return { ok: false, fel: "Tom kommentar" };
  if (!insamlingId) return { ok: false, fel: "insamling saknas" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("posta_kommentar", {
    p_objekt_typ: uppdateringId ? "uppdatering" : "insamling",
    p_insamling_id: insamlingId,
    p_uppdatering_id: uppdateringId || (null as never),
    p_parent_id: parentId || (null as never),
    p_text: text,
  });

  if (error) {
    return { ok: false, fel: human(error.message) };
  }

  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  return { ok: true };
}

export async function reaktionAction(
  insamlingPublicId: string,
  insamlingId: string,
  uppdateringId: string | null,
  typ: "dua" | "stod",
): Promise<Result> {
  const auth = await kravInloggning();
  if (auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase.rpc("satt_reaktion", {
    p_objekt_typ: uppdateringId ? "uppdatering" : "insamling",
    p_insamling_id: insamlingId,
    p_uppdatering_id: uppdateringId || (null as never),
    p_typ: typ,
  });
  if (error) return { ok: false, fel: human(error.message) };
  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  return { ok: true };
}

export async function rapporteraAction(
  insamlingPublicId: string,
  kommentarId: string,
  skal: string,
): Promise<Result> {
  const auth = await kravInloggning();
  if (auth) return auth;
  const trim = skal.trim();
  if (!trim) return { ok: false, fel: "Skäl krävs" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("rapportera_kommentar", {
    p_kommentar_id: kommentarId,
    p_skal: trim,
  });
  if (error) return { ok: false, fel: human(error.message) };
  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  return { ok: true };
}

export async function raderaKommentarAction(
  insamlingPublicId: string,
  kommentarId: string,
): Promise<Result> {
  const auth = await kravInloggning();
  if (auth) return auth;
  const supabase = await createClient();
  const { error } = await supabase
    .from("kommentar")
    .delete()
    .eq("id", kommentarId);
  if (error) return { ok: false, fel: human(error.message) };
  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  return { ok: true };
}

/**
 * Insamlaren kan stänga av kommentarsfältet på sin insamling (M13 Block 2.6).
 */
export async function toggleKommentarerAvstangda(
  insamlingPublicId: string,
  insamlingId: string,
  avstangda: boolean,
): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };

  const supabase = await createClient();
  // RLS säkrar att bara ägaren får ändra (insamling-UPDATE-policy från 0003).
  const { error } = await supabase
    .from("insamling")
    .update({ kommentarer_avstangda: avstangda })
    .eq("id", insamlingId)
    .eq("agare_id", me.userId);
  if (error) return { ok: false, fel: human(error.message) };
  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  revalidatePath(`/insamling/${insamlingId}`);
  return { ok: true };
}

export async function granskareDoljAction(
  insamlingPublicId: string,
  kommentarId: string,
  skal: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("granskare_dolj_kommentar", {
    p_kommentar_id: kommentarId,
    p_skal: skal,
  });
  if (error) return { ok: false, fel: human(error.message) };
  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  revalidatePath("/granskning/community");
  return { ok: true };
}

export async function granskareAterstallAction(
  insamlingPublicId: string,
  kommentarId: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("granskare_aterstall_kommentar", {
    p_kommentar_id: kommentarId,
  });
  if (error) return { ok: false, fel: human(error.message) };
  revalidatePath(`/insamlingar/${insamlingPublicId}`);
  revalidatePath("/granskning/community");
  return { ok: true };
}

// Omformulerar Postgres-felmeddelanden så användaren ser något läsbart.
function human(msg: string): string {
  if (msg.includes("Inloggning krävs")) return msg;
  if (msg.includes("Länkar är inte tillåtna")) return msg;
  if (msg.includes("HTML är inte tillåten")) return msg;
  if (msg.includes("Max 500 tecken")) return msg;
  if (msg.includes("kommentarsfältet")) return msg;
  if (msg.includes("För snabba")) return msg;
  if (msg.includes("språkregler")) return msg;
  if (msg.includes("egen kommentar")) return msg;
  if (msg.includes("Tråden tillåter")) return msg;
  if (msg.includes("dold kommentar")) return msg;
  if (msg.includes("Reaktioner är inte öppna")) return msg;
  if (msg.includes("Skäl krävs")) return msg;
  return "Kunde inte spara — försök igen om en stund";
}

// Redirect helper för login-skydd om client försöker när oinloggad.
export async function kravLoggaIn(returTill: string) {
  redirect(`/login?retur=${encodeURIComponent(returTill)}`);
}
