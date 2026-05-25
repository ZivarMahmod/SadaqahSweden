// Modul M7 — Granska enskilt resultat-bevis.
// Plan: Modul-07 Block 1 (Bevis 3 + Granskning), Block 5 (visa hela tidslinjen
// så granskaren ser kontexten).
// Säkerhet: kraver(["granskare","admin"]) + RLS transparens_bevis_select.
import { notFound } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TransparensTidslinje } from "@/components/transparens-tidslinje";
import { datum } from "@/lib/format";
import { BevisPanel } from "./bevis-panel";

type Params = Promise<{ bevisId: string }>;

export const metadata = {
  title: "Granska resultat-bevis — Sadaqah Sweden",
};

export default async function BevisDetalj({ params }: { params: Params }) {
  const { bevisId } = await params;
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: b, error } = await supabase
    .from("transparens_bevis")
    .select(
      "id, bevis_typ, created_at, godkant_at, uppdatering_id, insamling:insamling_id(id, public_id, titel, kort_beskrivning, lang_beskrivning, status, malbelopp_modell, malbelopp_ore, malbelopp_max_ore, insamlat_ore, genomforande_datum, profiles!insamling_agare_id_fkey(visningsnamn, e_post))",
    )
    .eq("id", bevisId)
    .single();

  if (error || !b || !b.insamling) notFound();
  if (b.bevis_typ !== "resultat") notFound();

  const { data: uppdatering } = b.uppdatering_id
    ? await supabase
        .from("transparens_uppdatering")
        .select("text, ar_bevis, created_at")
        .eq("id", b.uppdatering_id)
        .maybeSingle()
    : { data: null };

  const ins = b.insamling;
  const insamlare = ins.profiles;

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/granskning/bevis" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
            Tillbaka till kön
          </LinkButton>
          <Pill tone={b.godkant_at ? "success" : "copper"}>
            {b.godkant_at ? "Godkänt" : "Väntar"}
          </Pill>
        </div>
        <h1 className="heading-1 mt-4">{ins.titel}</h1>
        <p className="lead mt-2">{ins.kort_beskrivning}</p>

        <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="heading-3">Beviset som lämnats</h2>
                <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                  Lämnat {datum(b.created_at)}
                </span>
              </div>
              {uppdatering?.text ? (
                <p
                  className="mt-4 whitespace-pre-wrap text-base leading-relaxed"
                  style={{ color: "var(--color-ink-1)" }}
                >
                  {uppdatering.text}
                </p>
              ) : (
                <p className="mt-4 text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Bevis utan text-uppdatering (ovanligt).
                </p>
              )}
            </Card>

            <Card>
              <h2 className="heading-3">Löftet (startbevis)</h2>
              <p
                className="mt-3 whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: "var(--color-ink-1)" }}
              >
                {ins.lang_beskrivning}
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
                Genomförandedatum: {datum(ins.genomforande_datum)}
              </p>
            </Card>

            <Card>
              <h2 className="heading-3">Hela tidslinjen</h2>
              <div className="mt-6">
                <TransparensTidslinje insamlingId={ins.id} />
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-6">
            <Card variant="tight">
              <h3 className="heading-3">Beslut</h3>
              {b.godkant_at ? (
                <p className="mt-3 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Godkänt {datum(b.godkant_at)} — loopen är sluten.
                </p>
              ) : (
                <div className="mt-4">
                  <BevisPanel bevisId={b.id} />
                </div>
              )}
            </Card>

            <Card variant="tight">
              <h3 className="heading-3">Insamlaren</h3>
              <dl className="mt-3 flex flex-col gap-2 text-sm">
                <Row label="Namn">{insamlare?.visningsnamn ?? "okänd"}</Row>
                <Row label="E-post">
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {insamlare?.e_post ?? "—"}
                  </code>
                </Row>
              </dl>
              <LinkButton
                href={`/insamlingar/${ins.public_id}`}
                size="sm"
                variant="secondary"
                className="mt-4"
                rightIcon={<Icon name="external" size={14} />}
              >
                Donator-preview
              </LinkButton>
            </Card>

            <Card variant="tight">
              <h3 className="heading-3">Bedömning</h3>
              <ul className="mt-3 flex flex-col gap-2 text-xs" style={{ color: "var(--color-ink-2)" }}>
                <li>Finns beviset?</li>
                <li>Knyter texten resultatet till det utlovade?</li>
                <li>Är innehållet rimligt — ingen stockbild, inget orelaterat?</li>
              </ul>
              <p className="mt-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
                M7 Block 1 — lättviktig äkthetskoll, inte revision. Värdighet
                före millimeterprecision (Block 4).
              </p>
            </Card>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-baseline gap-3">
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
