"use server";

// M16 — verktygslåda. Allt loggas i admin_ingreppslogg via RPC.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";

type Result = { ok: true } | { ok: false; fel: string };

async function ensureRoll(roller: ("granskare" | "admin")[]): Promise<{ ok: false; fel: string } | null> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };
  if (!roller.includes(me.roll as "granskare" | "admin")) {
    return { ok: false, fel: "Otillräcklig behörighet" };
  }
  return null;
}

export async function pausaInsamlingAction(
  insamlingId: string,
  motivering: string,
): Promise<Result> {
  const err = await ensureRoll(["granskare", "admin"]);
  if (err) return err;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_pausa_insamling", {
    p_insamling_id: insamlingId,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/logg");
  return { ok: true };
}

export async function aterstallInsamlingAction(
  insamlingId: string,
  motivering: string,
): Promise<Result> {
  const err = await ensureRoll(["granskare", "admin"]);
  if (err) return err;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_aterstall_insamling", {
    p_insamling_id: insamlingId,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/logg");
  return { ok: true };
}

export async function stangInsamlingAction(
  insamlingId: string,
  motivering: string,
): Promise<Result> {
  const err = await ensureRoll(["admin"]);
  if (err) return err;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_stang_insamling", {
    p_insamling_id: insamlingId,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/logg");
  return { ok: true };
}

export async function avfardLarmAction(larmId: string, motivering: string): Promise<Result> {
  const err = await ensureRoll(["granskare", "admin"]);
  if (err) return err;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_avfard_larm", {
    p_larm_id: larmId,
    p_motivering: motivering,
  });
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/larm");
  return { ok: true };
}
