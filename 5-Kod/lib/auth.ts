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

/**
 * Returnerar inloggad användare + profil + roll. Null om ej inloggad.
 *
 * Cached per request via React `cache()` så flera anrop i samma request
 * inte skapar duplicate-queries (Server Components renderas i parallell).
 *
 * Använd ALLTID denna istället för att läsa session i klienten — roll
 * får aldrig sättas av klient-state.
 */
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
      // Profil ska auto-skapas via handle_new_user-trigger. Om den saknas
      // är något fel — logga men returnera null så caller redirectar till
      // login (säkrast).
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
 * till / om inloggad men fel roll.
 *
 * Användning i en Server Component eller Route Handler:
 *   const me = await kraver(["granskare", "admin"]);
 *   // me är garanterat inloggad med rätt roll här
 */
export async function kraver(
  tillatnaRoller?: ReadonlyArray<Roll>,
): Promise<AktuellAnvandare> {
  const me = await aktuellAnvandare();

  if (!me) {
    redirect("/login");
  }

  if (tillatnaRoller && tillatnaRoller.length > 0 && !tillatnaRoller.includes(me.roll)) {
    // Loggning av nekade behörighetsförsök hör hemma i M16 (admin/dashboard).
    redirect("/");
  }

  if (me.profil.kontofryst) {
    redirect("/konto-fryst");
  }

  // M17: team-konton (granskare/admin med totp_kravs=true) får inte nå
  // skyddade routes innan TOTP är aktiverat. Undantag: 2FA-setup-sidan själv
  // och accept-invite-flödet.
  if (
    me.profil.totp_kravs &&
    !me.profil.totp_aktiverad &&
    tillatnaRoller &&
    tillatnaRoller.length > 0
  ) {
    redirect("/team/2fa-setup");
  }

  return me;
}

/**
 * Helper för Server Components som vill rendera olika UI för olika roller
 * UTAN att redirecta. Returnerar bara rollen (eller null).
 */
export async function aktuellRoll(): Promise<Roll | null> {
  const me = await aktuellAnvandare();
  return me?.roll ?? null;
}
