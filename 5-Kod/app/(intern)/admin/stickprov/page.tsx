// FX4 — Stickprovsvy. Superadmin-only.
// Lista region-admins med högre avvisningsandel än tröskel (>60%, minst 5 beslut).
// Heuristik från 0043: public.stickprov_avvikande_granskare() returnerar
// avvikare. RPC:n har require_superadmin() internt — sidan dubblar guarden
// så region-admins inte ens når URL:en.

import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Stickprov — Admin" };
export const dynamic = "force-dynamic";

type Rad = {
  granskare_id: string;
  granskare_namn: string | null;
  admin_niva: string | null;
  admin_region_kod: string | null;
  beslut_totalt: number;
  avvisade: number;
  avvisningsandel: number;
  median_handlaggningstid_h: number | null;
};

export default async function StickprovPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") {
    redirect("/admin");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("stickprov_avvikande_granskare");
  const rader = (data ?? []) as Rad[];

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="h-2">Stickprov — avvikande granskare</h1>
        <p className="lead mt-2 max-w-[640px]">
          Granskare med <strong>&gt;60% avvisningsandel</strong> och minst 5
          beslut. En signal — inte en automatisk åtgärd. Granska enskilda fall
          via överklagande-vyn eller granskningskön; rikta uppföljning där det
          behövs.
        </p>

        {error && (
          <Card variant="tight" className="mt-6">
            <Pill tone="danger">Fel</Pill>
            <p className="mt-2 text-sm">{error.message}</p>
          </Card>
        )}

        {!error && rader.length === 0 && (
          <EmptyState
            icon={<Icon name="check-circle" size={28} />}
            title="Inga avvikare just nu"
            description="Ingen granskare har över 60% avvisningsandel med minst 5 beslut. Vyn räknas om i realtid."
          />
        )}

        {rader.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {rader.map((r) => (
              <li key={r.granskare_id}>
                <Card variant="tight">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="danger">{Number(r.avvisningsandel).toFixed(1)}%</Pill>
                    <span className="text-sm font-semibold">
                      {r.granskare_namn ?? "(okänt namn)"}
                    </span>
                    {r.admin_niva && (
                      <Pill tone="outline">
                        {r.admin_niva}
                        {r.admin_region_kod ? ` · ${r.admin_region_kod}` : ""}
                      </Pill>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-xs">
                    <dt style={{ color: "var(--color-ink-3)" }}>Beslut totalt</dt>
                    <dd>{r.beslut_totalt}</dd>
                    <dt style={{ color: "var(--color-ink-3)" }}>Avvisade</dt>
                    <dd>{r.avvisade}</dd>
                    <dt style={{ color: "var(--color-ink-3)" }}>Median handläggning</dt>
                    <dd>
                      {r.median_handlaggningstid_h != null
                        ? `${Number(r.median_handlaggningstid_h).toFixed(1)} h`
                        : "—"}
                    </dd>
                    <dt style={{ color: "var(--color-ink-3)" }}>Granskare-ID</dt>
                    <dd>
                      <code style={{ fontFamily: "var(--font-mono)" }}>
                        {r.granskare_id}
                      </code>
                    </dd>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
