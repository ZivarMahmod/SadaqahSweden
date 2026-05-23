import { notFound, redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RedigeraForm } from "./redigera-form";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Redigera insamling — Sadaqah Sweden",
};

export default async function RedigeraInsamlingPage({ params }: { params: Params }) {
  const { id } = await params;
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const { data: i, error } = await supabase
    .from("insamling")
    .select("*")
    .eq("id", id)
    .eq("agare_id", me.userId)
    .single();

  if (error || !i) notFound();

  const editableStatuses = ["utkast", "andring_begard"];
  if (!editableStatuses.includes(i.status)) {
    redirect("/insamling");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Redigera insamling</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sparas inte automatiskt — klicka <em>Spara utkast</em> regelbundet. När
        allt stämmer, klicka <em>Skicka till granskning</em>.
      </p>

      <RedigeraForm
        insamling={{
          id: i.id,
          titel: i.titel,
          kort_beskrivning: i.kort_beskrivning,
          lang_beskrivning: i.lang_beskrivning,
          mottagare_typ: i.mottagare_typ,
          mottagare_beskrivning: i.mottagare_beskrivning,
          hjalp_land: i.hjalp_land,
          hjalp_plats: i.hjalp_plats,
          insamlar_stad: i.insamlar_stad,
          insamlar_region: i.insamlar_region,
          malbelopp_modell: i.malbelopp_modell,
          malbelopp_ore: i.malbelopp_ore,
          malbelopp_min_ore: i.malbelopp_min_ore,
          malbelopp_max_ore: i.malbelopp_max_ore,
          insamling_deadline: i.insamling_deadline,
          genomforande_datum: i.genomforande_datum,
          overmalsplan: i.overmalsplan,
          tillat_overmal: i.tillat_overmal,
        }}
      />
    </main>
  );
}
