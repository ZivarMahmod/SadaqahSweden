// Modul M2 — Redigera insamling (wizard-form, restyle).
// Design: handoff-to-code/wizard.html · Plan: 1-Planering/Modul-02-Skapa-insamling.md.
// Säkerhet: agare_id = auth.uid() (RLS) + status-tillståndsmaskin i DB (private.insamling_status_skydd).
import { notFound, redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RedigeraForm } from "./redigera-form";
import { Container, Section } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";

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
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex items-center gap-3">
          <Pill tone="paper">
            <Icon name="edit" size={12} />
            {i.status === "andring_begard" ? "Ändring begärd — uppdatera och skicka in igen" : "Utkast"}
          </Pill>
        </div>
        <h1 className="heading-1 mt-4">Redigera insamling</h1>
        <p className="lead mt-3 max-w-[640px]">
          Allt sparas via knappen <em>Spara utkast</em>. När du är klar — klicka{" "}
          <em>Skicka till granskning</em>, så går projektet till granskningskön.
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
      </Container>
    </Section>
  );
}
