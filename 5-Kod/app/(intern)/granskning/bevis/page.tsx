// Modul M7 — Kö för resultat-bevis-granskning.
// Plan: Modul-07 Block 1 (lättviktig äkthetskoll, M3 utför).
// Säkerhet: kraver(["granskare","admin"]) + RLS transparens_bevis_select.
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";

export const metadata = {
  title: "Resultat-bevis — kö — Sadaqah Sweden",
};

export default async function ResultatBevisKo() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: bevis, error } = await supabase
    .from("transparens_bevis")
    .select(
      "id, bevis_typ, created_at, godkant_at, systemgenererad, insamling:insamling_id(id, public_id, titel, status, agare_id, profiles!insamling_agare_id_fkey(visningsnamn))",
    )
    .eq("bevis_typ", "resultat")
    .is("godkant_at", null)
    .eq("systemgenererad", false)
    .order("created_at", { ascending: true });

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/granskning" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
            Tillbaka till granskar-kön
          </LinkButton>
          <Pill tone="copper">M7 Bevis 3</Pill>
        </div>
        <h1 className="heading-1 mt-4">Resultat-bevis att granska</h1>
        <p className="lead mt-2 max-w-[60ch]">
          Lättviktig äkthetskoll. Du bedömer att beviset <em>finns, är
          relevant och rimligt</em> — inte sanningshalten i fält. Stockbilder
          eller uppenbart orelaterat innehåll avvisas.
        </p>

        {error && (
          <Card variant="tight" className="mt-6">
            <p style={{ color: "var(--color-danger)" }}>Fel: {error.message}</p>
          </Card>
        )}

        {!error && (!bevis || bevis.length === 0) && (
          <div className="mt-10">
            <EmptyState
              icon={<Icon name="inbox" size={28} />}
              title="Inga resultat-bevis i kön"
              description="Här dyker bevis upp när insamlare har lämnat in resultat. Lugnt tempo, ärlig kontroll."
            />
          </div>
        )}

        {bevis && bevis.length > 0 && (
          <div className="mt-8 grid gap-4">
            {bevis.map((b) => (
              <Card key={b.id} variant="default" hover>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Pill tone="copper">Väntar</Pill>
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        Lämnat {datum(b.created_at)}
                      </span>
                    </div>
                    <h3 className="heading-3">{b.insamling?.titel ?? "Insamling utan titel"}</h3>
                    <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
                      Insamlare: {b.insamling?.profiles?.visningsnamn ?? "okänd"} · ID {b.insamling?.public_id}
                    </p>
                  </div>
                  <LinkButton href={`/granskning/bevis/${b.id}`} size="sm">
                    Granska
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
