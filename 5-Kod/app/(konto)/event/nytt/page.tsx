// M14 — skapa nytt event-formulär.

import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EVENT_TYP_LABEL } from "@/lib/event";
import { NyttEventForm } from "./form";

export const metadata = { title: "Nytt event — Sadaqah Sweden" };

export default async function NyttEvent() {
  const me = await kraver();
  const supabase = await createClient();

  // Listar de organisationer användaren företräder, så de kan välja
  // "i föreningens namn" istället för privatperson.
  const { data: orgs } = await supabase
    .from("organisation")
    .select("id, namn")
    .eq("profil_id", me.userId)
    .eq("katalog_status", "publicerad");

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="heading-2">Nytt event</h1>
        <p className="lead mt-2 max-w-2xl">
          Skapa ett utkast — när allt är ifyllt kan du skicka det för granskning.
          Föreningar med tre rena event går direkt till publicering med stickprov.
        </p>
        <Card variant="loose" className="mt-8">
          <NyttEventForm
            orgs={orgs ?? []}
            typOptions={Object.entries(EVENT_TYP_LABEL)}
          />
        </Card>
      </Container>
    </Section>
  );
}
