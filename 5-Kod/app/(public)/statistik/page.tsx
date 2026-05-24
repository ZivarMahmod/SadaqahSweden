// M16 — Publik kurerad statistik. K-anonymitet 5 på kommunnivå (enhetligt
// med M12). Visar bara säkra aggregat.

import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = {
  title: "Statistik — Sadaqah Sweden",
  description: "Aggregerad statistik om plattformen. Inga enskilda personer pekas ut.",
};

export const revalidate = 21600; // 6 timmar — samma takt som geo_aggregat.

export default async function PublikStatistik() {
  const supabase = await createClient();

  const [{ data: lan }, { data: plats }] = await Promise.all([
    supabase
      .from("geo_aggregat")
      .select("omrade_kod, insamlingar_antal, aktiva_antal, avslutade_levererade, insamlat_summa_ore")
      .eq("omrade_typ", "lan")
      .is("kategori_id", null)
      .order("insamlat_summa_ore", { ascending: false }),
    supabase
      .from("plats_taxonomi")
      .select("kod, kort_namn")
      .eq("niva", "lan"),
  ]);

  const namnByKod = new Map((plats ?? []).map((p) => [p.kod, p.kort_namn]));

  const totalt = (lan ?? []).reduce(
    (acc, r) => ({
      insamlingar: acc.insamlingar + r.insamlingar_antal,
      aktiva: acc.aktiva + r.aktiva_antal,
      levererade: acc.levererade + r.avslutade_levererade,
      summa: acc.summa + r.insamlat_summa_ore,
    }),
    { insamlingar: 0, aktiva: 0, levererade: 0, summa: 0 },
  );

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <header className="max-w-3xl">
          <span className="eyebrow">Plattformen i siffror</span>
          <h1 className="heading-1 mt-3">Statistik</h1>
          <p className="lead mt-4">
            Aggregerad data — inga enskilda personer eller individers
            insamlingar exponeras. Kommunnivå visas bara där minst 5
            insamlingar finns (k-anonymitet).
          </p>
        </header>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Stat label="Aktiva insamlingar" varde={antal(totalt.aktiva)} />
          <Stat label="Levererade resultat" varde={antal(totalt.levererade)} />
          <Stat label="Totalt insamlat" varde={kortBelopp(totalt.summa)} />
          <Stat label="Insamlingar (alla statusar)" varde={antal(totalt.insamlingar)} />
        </div>

        <h2 className="heading-3 mt-12">Per län</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Län</th>
                <th>Aktiva</th>
                <th>Levererade</th>
                <th>Insamlat</th>
              </tr>
            </thead>
            <tbody>
              {(lan ?? []).map((r) => (
                <tr key={r.omrade_kod}>
                  <td>{namnByKod.get(r.omrade_kod) ?? r.omrade_kod}</td>
                  <td className="tabular">{antal(r.aktiva_antal)}</td>
                  <td className="tabular">{antal(r.avslutade_levererade)}</td>
                  <td className="tabular">{kortBelopp(r.insamlat_summa_ore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-10 text-xs" style={{ color: "var(--color-ink-3)" }}>
          Uppdaterat var 6:e timme. Källa: geo_aggregat (M12).
        </p>
      </Container>
    </Section>
  );
}

function Stat({ label, varde }: { label: string; varde: string }) {
  return (
    <Card variant="tight">
      <div className="figure" style={{ fontSize: 36 }}>{varde}</div>
      <div className="eyebrow mt-2">{label}</div>
    </Card>
  );
}
