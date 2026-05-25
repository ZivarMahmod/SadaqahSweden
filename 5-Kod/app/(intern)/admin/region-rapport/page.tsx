// M16 — region-rapport-väljare. Listar tillgängliga län; klick öppnar
// utskriftsvänlig rapport (browser print → PDF).

import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = { title: "Regionrapporter — Admin" };
export const dynamic = "force-dynamic";

export default async function RegionrapportListsida() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();
  const [{ data: agg }, { data: namn }] = await Promise.all([
    supabase
      .from("geo_aggregat")
      .select("omrade_kod, insamlingar_antal, insamlat_summa_ore, aktiva_antal, avslutade_levererade")
      .eq("omrade_typ", "lan")
      .is("kategori_id", null),
    supabase
      .from("plats_taxonomi")
      .select("kod, namn, kort_namn")
      .eq("niva", "lan")
      .order("namn"),
  ]);
  const aggByKod = new Map((agg ?? []).map((a) => [a.omrade_kod, a]));

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <h1 className="heading-2">Regionrapporter</h1>
        <p className="lead mt-2">
          Underlag per län — att lägga på kommunens eller regionens bord.
          Rapporten är utskriftsvänlig: öppna och skriv ut som PDF från
          webbläsaren.
        </p>

        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {(namn ?? []).map((n) => {
            const a = aggByKod.get(n.kod);
            return (
              <li key={n.kod}>
                <Link href={`/admin/region-rapport/${n.kod}`} className="block">
                  <Card variant="tight" className="card-hover">
                    <h3 className="heading-3">{n.namn}</h3>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
                      {a ? `${antal(a.aktiva_antal)} aktiva · ${kortBelopp(a.insamlat_summa_ore)}` : "Ingen data"}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
