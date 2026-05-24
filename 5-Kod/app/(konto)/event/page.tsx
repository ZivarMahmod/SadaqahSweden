// M14 — användarens egna events.

import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  EVENT_STATUS_LABEL,
  EVENT_TYP_LABEL,
  formatEventTid,
} from "@/lib/event";

export const metadata = { title: "Mina events — Sadaqah Sweden" };

export default async function MinaEvents() {
  const me = await kraver();
  const supabase = await createClient();

  // Hämta egna events + de jag företräder via en organisation.
  const { data: orgs } = await supabase
    .from("organisation")
    .select("id, namn")
    .eq("profil_id", me.userId);

  const orgIds = (orgs ?? []).map((o) => o.id);

  const queries = [
    supabase
      .from("event")
      .select("id, public_id, slug, titel, typ, start_at, status, plats_namn, plats_stad")
      .eq("arrangor_profil_id", me.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ];
  if (orgIds.length > 0) {
    queries.push(
      supabase
        .from("event")
        .select("id, public_id, slug, titel, typ, start_at, status, plats_namn, plats_stad")
        .in("arrangor_org_id", orgIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    );
  }
  const results = await Promise.all(queries);
  const events = results.flatMap((r) => r.data ?? []);

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex items-center justify-between gap-3">
          <h1 className="heading-2">Mina events</h1>
          <LinkButton href="/event/nytt" variant="primary" size="sm" leftIcon={<Icon name="plus" size={14} />}>
            Nytt event
          </LinkButton>
        </div>

        {events.length === 0 ? (
          <Card variant="tight" className="mt-10">
            <p style={{ color: "var(--color-ink-3)" }}>
              Inga events ännu. Föreläsning, iftar, kurs — ett event är en anslagstavla med struktur.
            </p>
            <LinkButton href="/event/nytt" variant="primary" size="sm" className="mt-4">
              Skapa ditt första event
            </LinkButton>
          </Card>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/event/${e.id}`} className="block">
                  <Card variant="tight" className="card-hover">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={statusTone(e.status)}>{EVENT_STATUS_LABEL[e.status]}</Pill>
                        <Pill tone="paper">{EVENT_TYP_LABEL[e.typ]}</Pill>
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {formatEventTid(e.start_at)}
                      </span>
                    </div>
                    <h3 className="heading-3 mt-3">{e.titel}</h3>
                    {(e.plats_namn || e.plats_stad) && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--color-ink-3)" }}
                      >
                        {e.plats_namn}
                        {e.plats_stad ? `, ${e.plats_stad}` : ""}
                      </p>
                    )}
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

function statusTone(s: string): "success" | "copper" | "outline" | "danger" {
  if (["publicerad", "avslutad"].includes(s)) return "success";
  if (["inskickad", "under_granskning"].includes(s)) return "copper";
  if (["avvisad", "installt"].includes(s)) return "danger";
  return "outline";
}
