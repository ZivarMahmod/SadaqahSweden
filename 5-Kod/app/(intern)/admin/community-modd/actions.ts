"use server";

// Brief 22 F5 — Community-modd: tunna server-actions ovanpå rapport-tabellen
// (befintlig sedan migration 0027). Inga schemaändringar.
//
// Säkerhet: kraver(['granskare','admin']) på varje action. rapport.UPDATE-policy
// (0027) kräver dessutom rollen granskare/admin — RLS skyddar om någon hittar
// route direkt.
//
// Returnerar void för att vara kompatibla med <form action={...}>.
// Vid databasfel kastas Error som Next visar som 500 (tekniska användare —
// toast/inline-fel kan läggas i en senare brief).

import { revalidatePath } from "next/cache";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  granskareAterstallAction,
  granskareDoljAction,
} from "@/app/(public)/insamlingar/[publicId]/community-actions";

async function sattRapportStatus(
  rapportId: string,
  status: "behandlad_avfard" | "behandlad_dold" | "behandlad_eskalerad",
  granskadAv: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rapport")
    .update({
      status,
      granskad_av: granskadAv,
      granskad_at: new Date().toISOString(),
    })
    .eq("id", rapportId);
  if (error) throw new Error(`Kunde inte sätta rapport.status: ${error.message}`);
}

export async function behandlaRapportAvfardAction(
  rapportId: string,
): Promise<void> {
  const me = await kraver(["granskare", "admin"]);
  await sattRapportStatus(rapportId, "behandlad_avfard", me.userId);
  revalidatePath("/admin/community-modd");
}

export async function behandlaRapportEskaleraAction(
  rapportId: string,
): Promise<void> {
  const me = await kraver(["granskare", "admin"]);
  await sattRapportStatus(rapportId, "behandlad_eskalerad", me.userId);
  revalidatePath("/admin/community-modd");
}

export async function behandlaRapportDoljAction(
  rapportId: string,
  kommentarId: string,
  insamlingPublicId: string,
  skal: string,
): Promise<void> {
  const me = await kraver(["granskare", "admin"]);
  const dolj = await granskareDoljAction(insamlingPublicId, kommentarId, skal);
  if (!dolj.ok) throw new Error(`Kunde inte dölja kommentar: ${dolj.fel}`);
  await sattRapportStatus(rapportId, "behandlad_dold", me.userId);
  revalidatePath("/admin/community-modd");
}

export async function behandlaRapportAterstallAction(
  rapportId: string,
  kommentarId: string,
  insamlingPublicId: string,
): Promise<void> {
  const me = await kraver(["granskare", "admin"]);
  const ater = await granskareAterstallAction(insamlingPublicId, kommentarId);
  if (!ater.ok) throw new Error(`Kunde inte återställa kommentar: ${ater.fel}`);
  // Återställning betyder att rapporten avfärdas (kommentaren bedöms OK).
  await sattRapportStatus(rapportId, "behandlad_avfard", me.userId);
  revalidatePath("/admin/community-modd");
}
