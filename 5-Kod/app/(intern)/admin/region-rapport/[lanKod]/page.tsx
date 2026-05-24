// M16 — utskriftsvänlig region-rapport för ett län.
// Genereras inte om totala antalet insamlingar i länet är under tröskel.

import { notFound } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kortBelopp, antal, kr } from "@/lib/format";
import { SkrivUtKnapp } from "./skriv-ut-knapp";

type Params = Promise<{ lanKod: string }>;

export const metadata = { title: "Regionrapport — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

const TROSKEL = 5;

export default async function Regionrapport({ params }: { params: Params }) {
  const { lanKod } = await params;
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const [{ data: lan }, { data: agg }, { data: kommuner }, { data: kategorier }] = await Promise.all([
    supabase.from("plats_taxonomi").select("kod, namn, kort_namn").eq("kod", lanKod).single(),
    supabase
      .from("geo_aggregat")
      .select("insamlingar_antal, aktiva_antal, avslutade_levererade, verifierade_insamlare, insamlat_summa_ore")
      .eq("omrade_typ", "lan")
      .eq("omrade_kod", lanKod)
      .is("kategori_id", null)
      .maybeSingle(),
    supabase
      .from("plats_taxonomi")
      .select("kod, namn")
      .eq("parent_kod", lanKod)
      .order("namn"),
    supabase
      .from("geo_aggregat")
      .select("kategori_id, insamlingar_antal, insamlat_summa_ore, kategori:kategori_id(namn)")
      .eq("omrade_typ", "lan")
      .eq("omrade_kod", lanKod)
      .not("kategori_id", "is", null),
  ]);

  if (!lan) notFound();
  if (!agg || agg.insamlingar_antal < TROSKEL) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="h-2">Regionrapport — {lan.namn}</h1>
        <p
          className="mt-4 rounded-md p-4"
          style={{ background: "var(--color-paper-deep)", color: "var(--color-ink-2)" }}
        >
          För få insamlingar för en meningsfull rapport. Tröskeln är {TROSKEL}
          (k-anonymitet). Kom tillbaka när länet har fler insamlingar i kön.
        </p>
      </main>
    );
  }

  const kommunKoder = (kommuner ?? []).map((k) => k.kod);
  const { data: komAgg } = await supabase
    .from("geo_aggregat")
    .select("omrade_kod, insamlingar_antal, insamlat_summa_ore, under_troskel")
    .eq("omrade_typ", "kommun")
    .in("omrade_kod", kommunKoder)
    .is("kategori_id", null);

  const komAggByKod = new Map((komAgg ?? []).map((r) => [r.omrade_kod, r]));

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: A4; margin: 18mm 16mm; }
        }
        .rapport h2 { margin-top: 1.5rem; }
      `}</style>
      <main className="rapport mx-auto max-w-3xl bg-white p-10" style={{ color: "var(--color-ink)" }}>
        <header
          className="mb-8 border-b pb-4"
          style={{ borderColor: "var(--color-ink-line)" }}
        >
          <p className="eyebrow">Sadaqah Sweden — regionrapport</p>
          <h1
            className="h-1 mt-2"
            style={{ fontSize: 36 }}
          >
            {lan.namn}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-ink-3)" }}>
            Genererad {new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}.
            Källa: geo_aggregat (uppdateras var 6:e timme).
          </p>
        </header>

        <section>
          <h2 className="h-3">Översikt</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Row label="Aktiva insamlingar" v={antal(agg.aktiva_antal)} />
            <Row label="Levererade resultat" v={antal(agg.avslutade_levererade)} />
            <Row label="Verifierade insamlare" v={antal(agg.verifierade_insamlare)} />
            <Row label="Insamlat totalt" v={kr(agg.insamlat_summa_ore)} />
          </dl>
        </section>

        <section>
          <h2 className="h-3">Per kommun</h2>
          <table className="table mt-3" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>Kommun</th><th>Insamlingar</th><th>Insamlat</th></tr>
            </thead>
            <tbody>
              {(kommuner ?? []).map((k) => {
                const a = komAggByKod.get(k.kod);
                return (
                  <tr key={k.kod}>
                    <td>{k.namn}</td>
                    <td>{a ? (a.under_troskel ? "—" : antal(a.insamlingar_antal)) : "—"}</td>
                    <td>{a && !a.under_troskel ? kortBelopp(a.insamlat_summa_ore) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
            Kommuner med färre än {TROSKEL} insamlingar visas som streck
            (k-anonymitet — vi pekar aldrig ut en enskild person).
          </p>
        </section>

        {kategorier && kategorier.length > 0 && (
          <section>
            <h2 className="h-3">Kategori-mix</h2>
            <table className="table mt-3" style={{ fontSize: 13 }}>
              <thead><tr><th>Kategori</th><th>Insamlingar</th><th>Insamlat</th></tr></thead>
              <tbody>
                {kategorier.map((r) => {
                  const kat = Array.isArray(r.kategori) ? r.kategori[0] : r.kategori;
                  return (
                    <tr key={r.kategori_id}>
                      <td>{(kat as { namn?: string } | null)?.namn ?? "—"}</td>
                      <td>{antal(r.insamlingar_antal)}</td>
                      <td>{kortBelopp(r.insamlat_summa_ore)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        <footer
          className="mt-12 border-t pt-4 text-xs"
          style={{ borderColor: "var(--color-ink-line)", color: "var(--color-ink-3)" }}
        >
          Sadaqah Sweden — en transparent insamlingsplattform för det
          muslimska samhället i Sverige. Pengar går direkt till insamlaren via
          Stripe. Varje projekt granskas. sadaqahsweden.se
        </footer>

        <div className="no-print mt-8 flex gap-3">
          <SkrivUtKnapp />
        </div>
      </main>
    </>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider" style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd className="figure mt-1" style={{ fontSize: 28 }}>{v}</dd>
    </div>
  );
}
