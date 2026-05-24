// M14 — publik eventlista. Discovery enligt Block 3.
// Filter: stad, typ. Sortering: kommande först. Återkommande visas en gång
// med "nästa förekomst".

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";
import {
  EVENT_TYP_LABEL,
  formatEventTid,
  formatUpprepning,
  nastaForekomst,
  type EventRad,
} from "@/lib/event";

export const metadata = {
  title: "Events — Sadaqah Sweden",
  description: "Vad som händer i muslimska Sverige — föreläsningar, iftar, Eid, kurser.",
};

type Sok = Promise<{
  stad?: string;
  typ?: EventRad["typ"];
  org?: string;
}>;

export default async function EventListsida({ searchParams }: { searchParams: Sok }) {
  const filter = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("event")
    .select(
      "id, public_id, slug, titel, typ, beskrivning, start_at, slut_at, upprepning, upprepning_veckodag, upprepning_slut, installt_forekomster, plats_typ, plats_namn, plats_stad, plats_organisation_id, digital_lank, cover_path, arrangor_profil_id, arrangor_org_id, status",
    )
    .eq("status", "publicerad")
    .is("deleted_at", null)
    .order("start_at", { ascending: true })
    .limit(60);

  if (filter.typ) q = q.eq("typ", filter.typ);
  if (filter.stad) q = q.ilike("plats_stad", `%${filter.stad}%`);
  if (filter.org) q = q.eq("arrangor_org_id", filter.org);

  const { data: events } = await q;

  const synliga = (events ?? [])
    .map((e) => ({ ...e, nasta: nastaForekomst(e) }))
    .filter((e) => e.nasta != null)
    .sort((a, b) => (a.nasta!.getTime() - b.nasta!.getTime()));

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <header className="max-w-3xl">
          <span className="eyebrow">Events &amp; platsinfo</span>
          <h1 className="heading-1 mt-3">Vad händer just nu.</h1>
          <p className="lead mt-4">
            Föreläsningar, iftar, kurser, öppna hus — events i muslimska Sverige. Granskade, fysiska eller digitala.
          </p>
        </header>

        <form className="mt-10 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="field-label" htmlFor="stad">Stad</label>
            <input
              id="stad"
              name="stad"
              type="text"
              defaultValue={filter.stad ?? ""}
              placeholder="t.ex. Malmö"
              className="input"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="field-label" htmlFor="typ">Typ</label>
            <select
              id="typ"
              name="typ"
              defaultValue={filter.typ ?? ""}
              className="select"
            >
              <option value="">Alla</option>
              {Object.entries(EVENT_TYP_LABEL).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">Filtrera</button>
          {(filter.stad || filter.typ) && (
            <Link href="/events" className="btn btn-ghost btn-sm">
              Rensa
            </Link>
          )}
        </form>

        {synliga.length === 0 ? (
          <Card variant="tight" className="mt-10">
            <p style={{ color: "var(--color-ink-3)" }}>
              Inga publicerade events matchar — kom gärna tillbaka snart, eller{" "}
              <Link href="/konto" style={{ color: "var(--color-forest)", textDecoration: "underline" }}>
                arrangera ett själv
              </Link>.
            </p>
          </Card>
        ) : (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {synliga.map((e) => (
              <li key={e.id}>
                <Link href={`/event/${e.public_id}-${e.slug}`} className="block">
                  <Card variant="tight" className="card-hover h-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="copper">{EVENT_TYP_LABEL[e.typ]}</Pill>
                      {formatUpprepning(e) && (
                        <Pill tone="outline">{formatUpprepning(e)}</Pill>
                      )}
                      {e.plats_typ === "digital" && (
                        <Pill tone="paper">Digitalt</Pill>
                      )}
                    </div>
                    <h3 className="heading-3 mt-3">{e.titel}</h3>
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: "var(--color-ink-2)" }}
                    >
                      {e.beskrivning.length > 180 ? e.beskrivning.slice(0, 180) + "…" : e.beskrivning}
                    </p>
                    <div
                      className="mt-4 flex flex-wrap items-center gap-3 text-xs"
                      style={{ color: "var(--color-ink-3)" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon name="clock" size={12} />
                        {formatEventTid(e.nasta!)}
                      </span>
                      {e.plats_typ === "fysisk" && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="map-pin" size={12} />
                          {e.plats_namn}
                          {e.plats_stad ? `, ${e.plats_stad}` : ""}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
