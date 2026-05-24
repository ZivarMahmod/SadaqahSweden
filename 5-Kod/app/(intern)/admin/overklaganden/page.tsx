// F3 — Överklaganden (superadmin/nationellt team).
// RLS: insamlare ser bara egen; superadmin/national ser alla.
// Region-admin ser ingenting via RLS (det är de vars beslut överklagas).

import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";
import { OverklagandePanel } from "./panel";

export const metadata = { title: "Överklaganden — Admin" };
export const dynamic = "force-dynamic";

export default async function OverklagandenPage() {
  await kraver(["admin"]);
  const supabase = await createClient();

  const { data: rader, error } = await supabase
    .from("overklagande")
    .select(
      "id, insamling_id, insamlare_id, skal, status, beslut_motivering, hanterad_at, created_at, insamling:insamling_id(public_id, titel, status, insamlar_lan_kod, agare_id, profiles!insamling_agare_id_fkey(visningsnamn))",
    )
    .order("created_at", { ascending: true });

  const pending = (rader ?? []).filter((r) => r.status === "inkommit");
  const avgjorda = (rader ?? []).filter((r) => r.status !== "inkommit");

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="h-2">Överklaganden</h1>
        <p className="lead mt-2 max-w-[640px]">
          Insamlare vars projekt avvisats av en region-admin kan överklaga{" "}
          <strong>en gång</strong> direkt till superadmin. Du kan låta avslaget
          stå eller riva upp det (insamlingen återgår till granskning, ny runda).
        </p>

        {error && (
          <Card variant="tight" className="mt-6">
            <Pill tone="danger">Fel</Pill>
            <p className="mt-2 text-sm">{error.message}</p>
          </Card>
        )}

        <h2 className="h-3 mt-10">Inkomna ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState
            icon={<Icon name="check-circle" size={28} />}
            title="Inga inkomna överklaganden"
            description="Avvisade insamlare kan överklaga från sin dashboard. Inkomna landar här."
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {pending.map((o) => (
              <li key={o.id}>
                <OverklagandePanel o={o} />
              </li>
            ))}
          </ul>
        )}

        {avgjorda.length > 0 && (
          <>
            <h2 className="h-3 mt-12">Avgjorda ({avgjorda.length})</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {avgjorda.map((o) => (
                <li key={o.id}>
                  <Card variant="tight">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={o.status === "avgjord_uppriven" ? "success" : "outline"}>
                        {o.status === "avgjord_uppriven" ? "Uppriven" : "Bekräftad"}
                      </Pill>
                      <span className="text-sm font-semibold">{o.insamling?.titel}</span>
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        Inkom {datum(o.created_at)}{o.hanterad_at ? `, avgjort ${datum(o.hanterad_at)}` : ""}
                      </span>
                    </div>
                    {o.beslut_motivering && (
                      <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                        {o.beslut_motivering}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </Section>
  );
}
