// Sadaqah Sweden — server-side auth/roll-helpers.
// "Klienten är skyltfönster, servern är valvet" (M6 Block 5.3).
// Allt rolluppslag sker här, serverside, mot databasen — aldrig via klient-JWT.

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Roll = Database["public"]["Enums"]["anvandar_roll"];

export type AktuellAnvandare = {
  userId: string;
  epost: string;
  profil: Database["public"]["Tables"]["profiles"]["Row"];
  roll: Roll;
};

export const aktuellAnvandare = cache(
  async (): Promise<AktuellAnvandare | null> => {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: profil, error: profilError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profilError || !profil) {
      console.error("aktuellAnvandare: profil saknas för user", user.id, profilError);
      return null;
    }

    return {
      userId: user.id,
      epost: user.email ?? profil.e_post,
      profil,
      roll: profil.roll,
    };
  },
);

/**
 * Skyddar en serverside-route. Redirectar till /login om ej inloggad,
 * till / om inloggad men fel roll. För team-roller (granskare/admin) krävs
 * dessutom MFA: om ingen faktor finns enrollad → /team/2fa-setup; om faktor
 * finns men inte challenged i nuvarande session → /team/2fa.
 *
 * Detta dubbleras i `middleware.ts` (path-baserat) och i DB:s
 * `private.require_aal2()` (RPC-baserat). Härdning H1.
 */
export async function kraver(
  tillatnaRoller?: ReadonlyArray<Roll>,
): Promise<AktuellAnvandare> {
  const me = await aktuellAnvandare();

  if (!me) {
    redirect("/login");
  }

  if (tillatnaRoller && tillatnaRoller.length > 0 && !tillatnaRoller.includes(me.roll)) {
    redirect("/");
  }

  if (me.profil.kontofryst) {
    redirect("/konto-fryst");
  }

  const arTeam = me.roll === "granskare" || me.roll === "admin";
  if (arTeam) {
    const supabase = await createClient();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel === "aal1") {
      redirect("/team/2fa");
    }
    if (aal?.nextLevel === "aal1" && aal.currentLevel === "aal1") {
      redirect("/team/2fa-setup");
    }
  }

  return me;
}

export async function aktuellRoll(): Promise<Roll | null> {
  const me = await aktuellAnvandare();
  return me?.roll ?? null;
}
