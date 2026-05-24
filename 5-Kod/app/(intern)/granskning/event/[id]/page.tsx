// M14 — granskar enskilt event-ärende.

import { notFound } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EVENT_TYP_LABEL, formatEventTid, formatUpprepning } from "@/lib/event";
import { EventBeslutPanel } from "./panel";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Granska event — Sadaqah Sweden" };

export default async function EventGranskning({ params }: { params: Params }) {
  const { id } = await params;
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: g } = await supabase
    .from("granskning")
    .select(
      "id, runda, inskickad_at, sla_deadline, interna_anteckningar, region_kod, event_id, avgjord_at, event:event_id(id, public_id, slug, titel, typ, beskrivning, start_at, slut_at, upprepning, upprepning_veckodag, plats_typ, plats_namn, plats_adress, plats_stad, digital_lank, kontakt_epost, kontakt_telefon, anmalan_lank, kostnad, arrangor_org_id, arrangor_profil_id, organisation:arrangor_org_id(namn, public_id), profiles:arrangor_profil_id(visningsnamn, public_id, bankid_verifierad))",
    )
    .eq("id", id)
    .single();

  if (!g || !g.event_id) notFound();
  const e = Array.isArray(g.event) ? g.event[0] : g.event;
  if (!e) notFound();
  const org = e ? (Array.isArray(e.organisation) ? e.organisation[0] : e.organisation) : null;
  const profil = e ? (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles) : null;
  const arrangor = (org as { namn?: string } | null | undefined)?.namn ?? (profil as { visningsnamn?: string } | null | undefined)?.visningsnamn ?? "—";

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="copper">{EVENT_TYP_LABEL[e.typ as keyof typeof EVENT_TYP_LABEL]}</Pill>
          {e.plats_typ === "digital" && <Pill tone="paper">Digitalt</Pill>}
          {g.runda > 1 && <Pill tone="outline">Runda {g.runda}</Pill>}
        </div>
        <h1 className="h-1 mt-3">{e.titel}</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
          <article>
            <h2 className="h-3">När</h2>
            <p className="mt-2 text-sm">
              {formatEventTid(e.start_at, e.slut_at)}
              {formatUpprepning(e) && ` · ${formatUpprepning(e)}`}
            </p>

            <h2 className="h-3 mt-6">Plats</h2>
            <p className="mt-2 text-sm">
              {e.plats_typ === "fysisk"
                ? `${e.plats_namn ?? ""}${e.plats_adress ? ", " + e.plats_adress : ""}${e.plats_stad ? ", " + e.plats_stad : ""}`
                : `Digitalt: ${e.digital_lank ?? "—"}`}
            </p>

            <h2 className="h-3 mt-6">Beskrivning</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{e.beskrivning}</p>

            {(e.kontakt_epost || e.kontakt_telefon || e.anmalan_lank || e.kostnad) && (
              <>
                <h2 className="h-3 mt-6">Övrigt</h2>
                <dl className="mt-2 grid grid-cols-[110px_1fr] gap-2 text-sm">
                  {e.kostnad && <><dt style={{ color: "var(--color-ink-3)" }}>Kostnad</dt><dd>{e.kostnad}</dd></>}
                  {e.kontakt_epost && <><dt style={{ color: "var(--color-ink-3)" }}>E-post</dt><dd>{e.kontakt_epost}</dd></>}
                  {e.kontakt_telefon && <><dt style={{ color: "var(--color-ink-3)" }}>Telefon</dt><dd>{e.kontakt_telefon}</dd></>}
                  {e.anmalan_lank && <><dt style={{ color: "var(--color-ink-3)" }}>Anmälan</dt><dd className="break-all">{e.anmalan_lank}</dd></>}
                </dl>
              </>
            )}
          </article>

          <aside className="flex flex-col gap-4">
            <Card variant="tight">
              <h3 className="h-3">Arrangör</h3>
              <p className="mt-2 text-sm">{arrangor}</p>
              {profil?.bankid_verifierad && (
                <Pill tone="success" className="mt-2 text-xs">Identitetsverifierad</Pill>
              )}
            </Card>
            <Card variant="tight">
              <h3 className="h-3">Beslut</h3>
              <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
                Checklista: gagnar samhället? Fritt från diskriminering/sekterism (M8 principerna 10–11)? Riktig arrangör?
              </p>
              <div className="mt-4">
                <EventBeslutPanel granskningId={g.id} />
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
