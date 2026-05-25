// M16 — alla larm + hantering.

import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LarmHanteringForm } from "./hantering";

export const metadata = { title: "Larm — Admin — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function LarmListsida() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();
  const { data: larm } = await supabase
    .from("admin_larm")
    .select("id, niva, kategori, rubrik, detaljer, triggered_at, insamling_id, donation_id, status, hanterad_av, hanterad_at, metadata")
    .order("triggered_at", { ascending: false })
    .limit(100);

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <h1 className="heading-2">Larm</h1>
        <p className="lead mt-2">Aktiva först, sedan avfärdade/behandlade. Inga aktiva = grönt läge.</p>

        {(larm ?? []).filter((l) => l.status === "aktiv").length === 0 && (
          <Card variant="tight" className="mt-6">
            <p style={{ color: "var(--color-success)" }}>Inga aktiva larm — plattformen är i lugnt läge.</p>
          </Card>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {(larm ?? []).map((l) => {
            const tone = l.niva === "rod" ? "danger" : l.niva === "gul" ? "copper" : "outline";
            return (
              <li key={l.id} id={l.id}>
                <Card variant="tight">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={tone}>{l.niva.toUpperCase()}</Pill>
                      <Pill tone="paper">{l.kategori}</Pill>
                      {l.status !== "aktiv" && <Pill tone="success">Avfärdad</Pill>}
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                      {new Date(l.triggered_at).toLocaleString("sv-SE")}
                    </span>
                  </div>
                  <h3 className="heading-3 mt-2">{l.rubrik}</h3>
                  {l.detaljer && (
                    <p className="mt-1 text-sm" style={{ color: "var(--color-ink-2)" }}>
                      {l.detaljer}
                    </p>
                  )}
                  {l.status === "aktiv" && <LarmHanteringForm larmId={l.id} />}
                </Card>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
