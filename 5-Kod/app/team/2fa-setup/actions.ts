"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import { TOTP } from "otpauth";

type Result = { ok: true } | { ok: false; fel: string };

export async function verifieraOchAktiveraTotp(kod: string): Promise<Result> {
  const me = await aktuellAnvandare();
  if (!me) return { ok: false, fel: "Inloggning krävs" };

  const supabase = await createClient();
  const { data: rad } = await supabase
    .from("totp_secret")
    .select("secret_base32, ateranvant_otp_skydd")
    .eq("profile_id", me.userId)
    .maybeSingle();

  if (!rad) return { ok: false, fel: "Inget secret upplagt — ladda om sidan." };
  if (rad.ateranvant_otp_skydd === kod) {
    return { ok: false, fel: "Den koden är redan använd — vänta 30 s och försök igen." };
  }

  const totp = new TOTP({
    issuer: "Sadaqah Sweden",
    label: me.epost,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: rad.secret_base32,
  });
  // Validera kod med ±1 fönster.
  const delta = totp.validate({ token: kod, window: 1 });
  if (delta === null) {
    return { ok: false, fel: "Felaktig kod — kolla att tiden i appen är synkad." };
  }

  await supabase
    .from("totp_secret")
    .update({
      aktiverad_at: new Date().toISOString(),
      senaste_verifiering_at: new Date().toISOString(),
      ateranvant_otp_skydd: kod,
    })
    .eq("profile_id", me.userId);

  // Markera profilen som TOTP-aktiverad via RPC (skydda_falt blockerar direkt write).
  const { error: rpcErr } = await supabase.rpc("team_satt_totp_aktiverad");
  if (rpcErr) return { ok: false, fel: rpcErr.message };

  revalidatePath("/team/2fa-setup");
  revalidatePath("/admin");
  return { ok: true };
}
