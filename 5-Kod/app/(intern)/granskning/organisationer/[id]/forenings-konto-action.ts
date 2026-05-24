// F4: server action — granskare/admin aktiverar förenings-konto efter
// godkänd anmälan. Skapar separat auth-user för kontaktperson via
// Supabase Auth Admin API, genererar magic-link och binder kontot via
// binda_forenings_konto-RPC.
"use server";

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AktiveraResultat =
  | { ok: true; user_id: string; invite_url: string | null; email: string }
  | { ok: false; message: string };

export async function aktiveraForeningsKontoAction(orgId: string): Promise<AktiveraResultat> {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: org, error: orgErr } = await supabase
    .from("organisation")
    .select("id, kontaktperson_namn, kontaktperson_epost, forenings_konto_user_id, katalog_status")
    .eq("id", orgId)
    .single();
  if (orgErr || !org) return { ok: false, message: orgErr?.message ?? "Org saknas" };
  if (org.forenings_konto_user_id) {
    return { ok: false, message: "Förenings-konto är redan aktiverat." };
  }
  if (!org.kontaktperson_epost) {
    return { ok: false, message: "Kontaktperson-e-post saknas på anmälan." };
  }

  // Steg 1: skapa user (eller hämta existerande med samma e-post).
  let userId: string | null = null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: org.kontaktperson_epost,
    email_confirm: false,
    user_metadata: {
      visningsnamn: org.kontaktperson_namn ?? null,
      forening_org_id: org.id,
    },
  });
  if (createErr) {
    // Om e-posten redan finns: hämta user och fortsätt.
    if ((createErr as { code?: string }).code === "email_exists") {
      const { data: list } = await admin.auth.admin.listUsers();
      const found = list?.users.find((u) => u.email?.toLowerCase() === org.kontaktperson_epost!.toLowerCase());
      if (found) userId = found.id;
    }
    if (!userId) return { ok: false, message: `Kunde inte skapa kontaktperson: ${createErr.message}` };
  } else {
    userId = created.user?.id ?? null;
  }
  if (!userId) return { ok: false, message: "Auth-user saknar id efter create." };

  // Steg 2: generera magic-link för invite (Supabase email skickas om
  // SMTP konfigurerat; oavsett returneras URL:en till granskaren).
  let inviteUrl: string | null = null;
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: org.kontaktperson_epost,
  });
  if (!linkErr && link?.properties?.action_link) {
    inviteUrl = link.properties.action_link;
  }

  // Steg 3: bind förenings-konto via RPC (sätter ar_organisation=true + kopplar).
  const { error: bindErr } = await supabase.rpc("binda_forenings_konto", {
    p_org_id: org.id,
    p_user_id: userId,
  });
  if (bindErr) return { ok: false, message: bindErr.message };

  revalidatePath(`/granskning/organisationer/${orgId}`);
  revalidatePath("/granskning/organisationer");
  return { ok: true, user_id: userId, invite_url: inviteUrl, email: org.kontaktperson_epost };
}
