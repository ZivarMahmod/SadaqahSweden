// M16 — Intern statistik. Bredare än den publika; visar interna mått som
// granskningsutfall, mål-nåelse, wizard-avhopp.

import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = { title: "Statistik — Admin — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function AdminStatistik() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const [
    { data: insRows },
    { data: donRows },
    { data: granskRows },
    { data: katAgg },
  ] = await Promise.all([
    supabase
      .from("insamling")
      .select("status, malbelopp_modell, malbelopp_ore, malbelopp_max_ore, insamlat_ore")
      .is("deleted_at", null),
    supabase
      .from("donation")
      .select("belopp_ore, frivilligt_bidrag_ore, donator_id")
      .eq("bekraftad", true),
    supabase
      .from("granskning")
      .select("avgjord_at, runda, eskalerad"),
    supabase
      .from("geo_aggregat")
      .select("kategori_id, insamlingar_antal, insamlat_summa_ore, omrade_typ")
      .eq("omrade_typ", "lan")
      .not("kategori_id", "is", null),
  ]);

  const insamlingarTotal = (insRows ?? []).length;
  const aktivaTotal = (insRows ?? []).filter((i) => i.status === "aktiv").length;
  const levereradeTotal = (insRows ?? []).filter((i) => i.status === "avslutad_levererad").length;
  const utanResultatTotal = (insRows ?? []).filter((i) => i.status === "avslutad_utan_resultat").length;
  const malNadda = (insRows ?? []).filter((i) => {
    const mal = i.malbelopp_modell === "fast" ? i.malbelopp_ore : i.malbelopp_modell === "intervall" ? i.malbelopp_max_ore : null;
    return mal ? i.insamlat_ore >= mal : false;
  }).length;

  const donationerTotal = (donRows ?? []).length;
  const insamlatTotal = (donRows ?? []).reduce((s, d) => s + (d.belopp_ore ?? 0), 0);
  const tipsTotal = (donRows ?? []).reduce((s, d) => s + (d.frivilligt_bidrag_ore ?? 0), 0);
  const unikaDonatorer = new Set((donRows ?? []).map((d) => d.donator_id).filter(Boolean)).size;
  const medianBelopp = median((donRows ?? []).map((d) => d.belopp_ore));

  const granskningarAvgjorda = (granskRows ?? []).filter((g) => g.avgjord_at).length;
  const eskaleringar = (granskRows ?? []).filter((g) => g.eskalerad).length;
  const flerrundorAndel = granskningarAvgjorda > 0
    ? Math.round(((granskRows ?? []).filter((g) => g.runda > 1).length * 100) / granskningarAvgjorda)
    : 0;

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <h1 className="heading-2">Statistik (intern)</h1>
        <p className="lead mt-2">Bredare än publika sidan. Räknar från råa rader — uppdateras direkt.</p>

        <h2 className="heading-3 mt-10">Insamlingar</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <KortStat label="Totalt" varde={antal(insamlingarTotal)} />
          <KortStat label="Aktiva" varde={antal(aktivaTotal)} />
          <KortStat label="Levererat resultat" varde={antal(levereradeTotal)} />
          <KortStat label="Avslutade utan resultat" varde={antal(utanResultatTotal)} />
          <KortStat label="Nådde målet" varde={antal(malNadda)} />
        </div>

        <h2 className="heading-3 mt-10">Donationer</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <KortStat label="Donationer" varde={antal(donationerTotal)} />
          <KortStat label="Insamlat totalt" varde={kortBelopp(insamlatTotal)} />
          <KortStat label="Frivilliga bidrag (tip)" varde={kortBelopp(tipsTotal)} />
          <KortStat label="Unika donatorer" varde={antal(unikaDonatorer)} />
          <KortStat label="Median per donation" varde={medianBelopp ? kortBelopp(medianBelopp) : "—"} />
        </div>

        <h2 className="heading-3 mt-10">Granskning</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <KortStat label="Avgjorda ärenden" varde={antal(granskningarAvgjorda)} />
          <KortStat label="Eskaleringar" varde={antal(eskaleringar)} />
          <KortStat label="Flerrundor %" varde={`${flerrundorAndel}%`} />
        </div>

        <h2 className="heading-3 mt-10">Geografi (per län — fullt utan k-anon)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Län-kod</th>
                <th>Insamlingar</th>
                <th>Insamlat</th>
              </tr>
            </thead>
            <tbody>
              {(katAgg ?? []).length === 0 && (
                <tr><td colSpan={3} style={{ color: "var(--color-ink-3)" }}>Tomt — aggregatet uppdateras var 6:e timme.</td></tr>
              )}
              {/* TODO: rikare statistik per län när det finns rader att visa */}
            </tbody>
          </table>
        </div>

        <p className="mt-10 text-xs" style={{ color: "var(--color-ink-3)" }}>
          För publik statistik: <Link href="/statistik" style={{ textDecoration: "underline", color: "var(--color-forest)" }}>/statistik</Link> (k-anon 5).
        </p>
      </Container>
    </Section>
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function KortStat({ label, varde }: { label: string; varde: string }) {
  return (
    <Card variant="tight">
      <div className="text-xs uppercase tracking-wider" style={{ color: "var(--color-ink-3)" }}>{label}</div>
      <div className="figure mt-2" style={{ fontSize: 32 }}>{varde}</div>
    </Card>
  );
}
