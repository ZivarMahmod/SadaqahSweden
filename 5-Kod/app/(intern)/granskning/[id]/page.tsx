// Modul M3 — Granskningsvy + beslut (detalj).
// Design: handoff-to-code/review.html · Plan: Modul-03 Block 2 + Block 3.
// Säkerhet: kraver(['granskare','admin']) + RLS granskning_select +
// granskning_handelse_select. user_metadata aldrig betrodd; roll läses via JWT.
import { notFound } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BeslutsPanel } from "./beslutspanel";
import { datum, kortBelopp, kr } from "@/lib/format";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Granskar-ärende — Sadaqah Sweden",
};

const HANDELSE_LABEL: Record<string, string> = {
  tilldelad: "Ärendet plockades upp",
  beslut: "Beslut fattat",
  anteckning_uppdaterad: "Interna anteckningar uppdaterades",
};

const BESLUT_LABEL: Record<string, { label: string; tone: "success" | "copper" | "danger" }> = {
  godkann: { label: "Godkänd", tone: "success" },
  begar_andring: { label: "Ändring begärd", tone: "copper" },
  avvisa: { label: "Avvisad", tone: "danger" },
};

const STATUS_LABEL: Record<string, string> = {
  inskickad: "I kö (inskickad)",
  under_granskning: "Under granskning",
  andring_begard: "Ändring begärd",
  avvisad: "Avvisad",
  aktiv: "Aktiv (publik)",
};

export default async function GranskarArendePage({ params }: { params: Params }) {
  const { id } = await params;
  const me = await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: g, error } = await supabase
    .from("granskning")
    .select(
      "id, runda, eskalerad, sla_deadline, inskickad_at, avgjord_at, tilldelad_granskare_id, interna_anteckningar, insamling:insamling_id(id, public_id, titel, kort_beskrivning, lang_beskrivning, mottagare_typ, mottagare_beskrivning, hjalp_land, hjalp_plats, insamlar_stad, insamlar_region, malbelopp_modell, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, insamlat_ore, insamling_deadline, genomforande_datum, status, tillat_overmal, overmalsplan, agare_id, profiles!insamling_agare_id_fkey(visningsnamn, e_post, bankid_verifierad, roll))",
    )
    .eq("id", id)
    .single();

  if (error || !g || !g.insamling) notFound();

  const { data: handelser } = await supabase
    .from("granskning_handelse")
    .select("id, handelse_typ, beslut, motivering, created_at, granskare_id, profiles!granskning_handelse_granskare_id_fkey(visningsnamn)")
    .eq("granskning_id", id)
    .order("created_at", { ascending: false });

  const ins = g.insamling;
  const malbelopp =
    ins.malbelopp_modell === "fast"
      ? ins.malbelopp_ore
      : ins.malbelopp_modell === "intervall"
      ? ins.malbelopp_max_ore
      : null;
  const arMittArende = g.tilldelad_granskare_id === me.userId;
  const arAvgjort = g.avgjord_at != null;
  const insamlare = ins.profiles;

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton
            href="/granskning"
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="arrow-left" size={14} />}
          >
            Tillbaka till kön
          </LinkButton>
          <Pill tone={arAvgjort ? "outline" : "copper"}>
            {arAvgjort ? "Avgjort" : STATUS_LABEL[ins.status] ?? ins.status}
          </Pill>
          {g.runda > 1 && <Pill tone="paper">Runda {g.runda}</Pill>}
          {g.eskalerad && (
            <Pill tone="copper">
              <Icon name="flag" size={12} /> Eskalerad
            </Pill>
          )}
          {arMittArende && (
            <Pill tone="success" dot="default">
              Tilldelad mig
            </Pill>
          )}
        </div>
        <h1 className="heading-1 mt-4">{ins.titel}</h1>
        <p className="lead mt-3">{ins.kort_beskrivning}</p>

        <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
          {/* Vänster: innehåll + checklista */}
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="heading-3">Beskrivning</h2>
              <p
                className="mt-4 whitespace-pre-wrap text-base leading-relaxed"
                style={{ color: "var(--color-ink-1)" }}
              >
                {ins.lang_beskrivning}
              </p>
            </Card>

            <Card>
              <h2 className="heading-3">Mottagare</h2>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-ink-3)" }}
              >
                Typ: {ins.mottagare_typ}
              </p>
              <p className="mt-3">{ins.mottagare_beskrivning}</p>
              {/* TODO (M2 — media): visa mottagar_dokument-länkar (privat bucket) här. */}
            </Card>

            {ins.tillat_overmal && ins.overmalsplan && (
              <Card>
                <h2 className="heading-3">Övermålsplan</h2>
                <p className="mt-3">{ins.overmalsplan}</p>
              </Card>
            )}

            <Card>
              <h2 className="heading-3">Granskningschecklista</h2>
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--color-ink-3)" }}
              >
                Bedömningsstöd från Modul-03 Block 2.2. Punkterna är vägledning — själva beslutet
                fattas i panelen till höger. Bedömning av islamisk förenlighet och anti-diskriminering
                görs mot Modul-08 regelboken (TODO M8).
              </p>
              <ol className="mt-4 flex flex-col gap-2 text-sm">
                {[
                  "Kategori — rätt vald, stämmer mot innehållet?",
                  "Titel — seriös, inte clickbait?",
                  "Beskrivning — tydlighet (vad, varför, hur används pengarna)?",
                  "Beskrivning — islamisk förenlighet (mot M8)?",
                  "Beskrivning — anti-diskriminering (mot M8)?",
                  "Mottagare — trovärdig, tillräckligt beskriven?",
                  "Media — äkta, relevanta?",
                  "Mål & modell — rimligt belopp?",
                  "Datum — deadline och genomförande rimliga?",
                  "Övermålsplan — deklarerad om tillåten?",
                  "Externa länkar — pekar de någonstans olämpligt?",
                  "Helhetsbedömning — äkta och genomförbar?",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-md border p-3"
                    style={{
                      borderColor: "var(--color-ink-line)",
                      background: "var(--color-paper)",
                    }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        background: "var(--color-copper-soft)",
                        color: "var(--color-copper-deep)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: "var(--color-ink-1)" }}>{t}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Höger: meta + insamlare + beslutspanel */}
          <aside className="flex flex-col gap-6">
            <Card variant="tight">
              <h3 className="heading-3">Mål & tid</h3>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                <Row label="Insamlat">
                  <span className="tabular" style={{ fontFamily: "var(--font-mono)" }}>
                    {kr(ins.insamlat_ore)}
                  </span>
                </Row>
                <Row label="Mål">
                  {malbelopp ? (
                    <span className="tabular" style={{ fontFamily: "var(--font-mono)" }}>
                      {kortBelopp(malbelopp)}
                      {ins.malbelopp_modell === "intervall" && ins.malbelopp_min_ore && (
                        <> (min {kortBelopp(ins.malbelopp_min_ore)})</>
                      )}
                    </span>
                  ) : (
                    "Öppen"
                  )}
                </Row>
                <Row label="Modell">{ins.malbelopp_modell}</Row>
                <Row label="Deadline">{datum(ins.insamling_deadline)}</Row>
                <Row label="Genomförs senast">{datum(ins.genomforande_datum)}</Row>
                <Row label="Plats">
                  {ins.insamlar_stad}
                  {ins.insamlar_region ? `, ${ins.insamlar_region}` : ""} → {ins.hjalp_land}
                  {ins.hjalp_plats ? ` (${ins.hjalp_plats})` : ""}
                </Row>
              </dl>
            </Card>

            <Card variant="tight">
              <h3 className="heading-3">Insamlaren</h3>
              {insamlare ? (
                <dl className="mt-4 flex flex-col gap-3 text-sm">
                  <Row label="Namn">{insamlare.visningsnamn}</Row>
                  <Row label="E-post">
                    <code
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                      }}
                    >
                      {insamlare.e_post}
                    </code>
                  </Row>
                  <Row label="Roll">{insamlare.roll}</Row>
                  <Row label="BankID">
                    {insamlare.bankid_verifierad ? (
                      <Pill tone="success">Verifierad</Pill>
                    ) : (
                      <Pill tone="paper">Ej verifierad</Pill>
                    )}
                  </Row>
                </dl>
              ) : (
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Insamlarens profil hittades inte.
                </p>
              )}
              <LinkButton
                href={`/insamlingar/${ins.public_id}`}
                size="sm"
                variant="secondary"
                className="mt-4"
                rightIcon={<Icon name="external" size={14} />}
              >
                Donator-preview
              </LinkButton>
              {/* TODO (M9): historik — tidigare insamlingar, badges, avslutad_utan_resultat. */}
            </Card>

            <BeslutsPanel
              granskningId={g.id}
              avgjort={arAvgjort}
              ar_mitt_arende={arMittArende}
              start_anteckningar={g.interna_anteckningar ?? ""}
            />

            <Card variant="tight">
              <h3 className="heading-3">Historik</h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {(handelser ?? []).length === 0 && (
                  <li style={{ color: "var(--color-ink-3)" }}>Inga händelser än.</li>
                )}
                {(handelser ?? []).map((h) => {
                  const beslutInfo = h.beslut ? BESLUT_LABEL[h.beslut] : null;
                  return (
                    <li
                      key={h.id}
                      className="rounded-md border p-3"
                      style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper)" }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className="text-xs font-semibold uppercase"
                          style={{ letterSpacing: "0.08em", color: "var(--color-ink-3)" }}
                        >
                          {HANDELSE_LABEL[h.handelse_typ] ?? h.handelse_typ}
                        </span>
                        {beslutInfo && <Pill tone={beslutInfo.tone}>{beslutInfo.label}</Pill>}
                      </div>
                      <div
                        className="mt-1 text-xs"
                        style={{ color: "var(--color-ink-3)" }}
                      >
                        {h.profiles?.visningsnamn ?? "system"} · {datum(h.created_at)}
                      </div>
                      {h.motivering && (
                        <p className="mt-2 whitespace-pre-wrap text-sm">{h.motivering}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-3">
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
