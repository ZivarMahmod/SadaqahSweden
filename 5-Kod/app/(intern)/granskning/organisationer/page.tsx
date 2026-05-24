// Modul M10 — Granskar-kö för organisations-ansökningar.
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";

export const metadata = { title: "Organisations-kö — Sadaqah Sweden" };

const STATUSAR_VANTAR = ["inskickad", "under_granskning", "komplettering_begard"];

export default async function OrgKo() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: rader, error } = await supabase
    .from("organisation")
    .select("id, public_id, namn, organisationstyp, stad, region, beskrivning, org_nummer, katalog_status, created_at, profiles!organisation_profil_id_fkey(visningsnamn, e_post)")
    .in("katalog_status", STATUSAR_VANTAR)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return (
    <Section tone="paper" spacing="default">
      <Container>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/granskning" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
            Tillbaka till granskar-kön
          </LinkButton>
          <Pill tone="forest">M10</Pill>
        </div>
        <h1 className="heading-1 mt-4">Föreningar att granska</h1>
        <p className="lead mt-2 max-w-[60ch]">
          Endast muslimska föreningar och moskéer (M10 B2.4). Kontrollera
          org.nr mot offentligt register, verifiera kontaktväg, bedöm
          äkthet och beskrivning mot M8.
        </p>

        {error && (
          <Card variant="tight" className="mt-6">
            <p style={{ color: "var(--color-danger)" }}>{error.message}</p>
          </Card>
        )}

        {!error && (!rader || rader.length === 0) && (
          <div className="mt-8">
            <EmptyState
              icon={<Icon name="inbox" size={24} />}
              title="Inga ansökningar i kön"
              description="Här dyker nya ansökningar upp. Lugnt tempo, ärlig kontroll."
            />
          </div>
        )}

        {rader && rader.length > 0 && (
          <ul className="mt-8 flex flex-col gap-3">
            {rader.map((o) => (
              <li key={o.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="copper">{labelStatus(o.katalog_status)}</Pill>
                        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          Anmäld {datum(o.created_at)}
                        </span>
                      </div>
                      <h3 className="heading-3 mt-2">{o.namn}</h3>
                      <p className="mt-1 text-xs uppercase" style={{ letterSpacing: "0.08em", color: "var(--color-copper-deep)" }}>
                        {o.organisationstyp} · {o.stad}, {o.region}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                        {o.beskrivning}
                      </p>
                      <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
                        Insändare: {o.profiles?.visningsnamn ?? "okänd"} · Org.nr:{" "}
                        <code style={{ fontFamily: "var(--font-mono)" }}>{o.org_nummer ?? "—"}</code>
                      </p>
                    </div>
                    <LinkButton href={`/granskning/organisationer/${o.id}`} size="sm">
                      Granska
                    </LinkButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}

function labelStatus(s: string): string {
  return ({
    inskickad: "I kö",
    under_granskning: "Under granskning",
    komplettering_begard: "Komplettering begärd",
  } as Record<string, string>)[s] ?? s;
}
