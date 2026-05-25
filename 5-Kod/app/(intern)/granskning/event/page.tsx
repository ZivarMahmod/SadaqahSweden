// M14 — granskar-kö för events (separat kö, kortare SLA — 48h).

import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EVENT_TYP_LABEL, formatEventTid } from "@/lib/event";

export const metadata = { title: "Event-granskning — Sadaqah Sweden" };

export default async function EventGranskningsKo() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: rader } = await supabase
    .from("granskning")
    .select(
      "id, runda, inskickad_at, sla_deadline, avgjord_at, region_kod, event:event_id(id, public_id, slug, titel, typ, start_at, plats_stad, plats_typ, arrangor_org_id, arrangor_profil_id)",
    )
    .not("event_id", "is", null)
    .is("avgjord_at", null)
    .order("inskickad_at", { ascending: true })
    .limit(50);

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <h1 className="heading-2">Event-granskning</h1>
        <p className="lead mt-2">SLA 48 h. Lättare checklista — bra för samhället, ingen diskriminering, riktig arrangör.</p>

        {(rader ?? []).length === 0 ? (
          <Card variant="tight" className="mt-8">
            <p style={{ color: "var(--color-ink-3)" }}>Tom kö — fina sätt att börja dagen.</p>
          </Card>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {(rader ?? []).map((r) => {
              const e = Array.isArray(r.event) ? r.event[0] : r.event;
              if (!e) return null;
              const sla = r.sla_deadline ? new Date(r.sla_deadline) : null;
              const overdue = sla ? sla.getTime() < Date.now() : false;
              return (
                <li key={r.id}>
                  <Link href={`/granskning/event/${r.id}`} className="block">
                    <Card variant="tight" className="card-hover">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="copper">{EVENT_TYP_LABEL[e.typ as keyof typeof EVENT_TYP_LABEL]}</Pill>
                          {e.plats_typ === "digital" && <Pill tone="paper">Digitalt</Pill>}
                          {r.runda > 1 && <Pill tone="outline">Runda {r.runda}</Pill>}
                          {overdue && <Pill tone="danger">SLA brutet</Pill>}
                        </div>
                        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          Inskickat {new Date(r.inskickad_at).toLocaleDateString("sv-SE")}
                        </span>
                      </div>
                      <h3 className="heading-3 mt-2">{e.titel}</h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {formatEventTid(e.start_at)} · {e.plats_stad ?? (e.plats_typ === "digital" ? "Digital" : "—")}
                      </p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </Section>
  );
}
