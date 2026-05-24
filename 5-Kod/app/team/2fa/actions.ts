"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";

type Result = { ok: true } | { ok: false; fel: string };

export async function verifieraMfaChallenge(
  factorId: string,
  kod: string,
): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };

  const supabase = await createClient();
  const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (chErr || !challenge) {
    return { ok: false, fel: chErr?.message ?? "Kunde inte starta challenge" };
  }

  const { error: vErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: kod,
  });
  if (vErr) {
    return { ok: false, fel: oversaettMfaFel(vErr.message) };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

function oversaettMfaFel(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid totp code")) return "Felaktig kod — kolla att tiden i appen är synkad.";
  if (m.includes("expired")) return "Koden har gått ut — vänta 30 s och försök igen.";
  return msg;
}
