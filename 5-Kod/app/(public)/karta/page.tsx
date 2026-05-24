// /karta — Modul 12: Sverigekarta + geografisk insikt.
//
// Server Component. Hämtar geo_aggregat + plats_taxonomi i en query
// (M12 Block 9.4: ett anrop, inte hundra) och bakar in payloaden i HTML.
// Klient-komponenten KartaKlient hanterar all interaktivitet — drill-down,
// vy-byte, hover — utan ytterligare nätverksanrop. Kartdatan ändras bara
// var 6:e timme (pg_cron), så sidan kan cachas hårt.

import { Suspense } from "react";
import Link from "next/link";
import { hamtaKartData } from "@/lib/karta";
import { hamtaHjalpData } from "@/lib/karta-hjalp";
import { hamtaEventsForKarta } from "@/lib/karta-events";
import { KartaKlient } from "./karta-klient";
import { Topplista } from "./topplista";
import { kortBelopp, antal } from "@/lib/format";

// ISR: hämta om en gång var 6:e timme (samma takt som pg_cron-jobbet).
export const revalidate = 21600;

export const metadata = {
  title: "Karta — Sadaqah Sweden",
  description:
    "Var i Sverige drivs insamlingar och vart i världen landar hjälpen. Aggregerad, anonymiserad data — aldrig en enskild person på kartan.",
};

export default async function KartaSida() {
  const [data, hjalp, events] = await Promise.all([
    hamtaKartData(),
    hamtaHjalpData(),
    hamtaEventsForKarta(),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-12 md:px-12 md:py-20">
      <header className="mb-12 max-w-3xl">
        <span className="eyebrow">Karta &amp; geografisk insikt</span>
        <h1 className="heading-1 mt-3">Sverige, regionvis.</h1>
        <p className="lead mt-5">
          Var i landet drivs insamlingar — och vart i världen landar hjälpen.
          Allt på kartan är aggregat. Inga enskilda personer pekas ut.
        </p>
      </header>

      <section
        aria-label="Översikt"
        className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mb-12"
      >
        <Nyckeltal label="Aktiva insamlingar" varde={antal(data.rikstotal.aktiva_antal)} />
        <Nyckeltal label="Levererade" varde={antal(data.rikstotal.avslutade_levererade)} />
        <Nyckeltal label="Verifierade insamlare" varde={antal(data.rikstotal.verifierade_insamlare)} />
        <Nyckeltal label="Insamlat totalt" varde={kortBelopp(data.rikstotal.insamlat_summa_ore)} />
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <Suspense
            fallback={
              <div
                className="ph-paper flex items-center justify-center rounded-2xl"
                style={{ height: 560 }}
              >
                <span className="text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Laddar karta …
                </span>
              </div>
            }
          >
            <KartaKlient data={data} hjalp={hjalp} events={events} />
          </Suspense>
          <p className="mt-4 text-xs" style={{ color: "var(--color-ink-3)" }}>
            Aggregat uppdateras var 6:e timme. Senast beräknad:{" "}
            {data.beraknad_at
              ? new Date(data.beraknad_at).toLocaleString("sv-SE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
            . Bara län/kommuner med minst {data.troskel} insamlingar visar
            siffror på kommunnivå (k-anonymitet).
          </p>
        </div>

        <aside className="order-1 lg:order-2">
          <Topplista lan={data.lan} />
          <div className="card card-tight mt-6">
            <h3 className="heading-3 mb-3">Vill du starta något här?</h3>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: "var(--color-ink-2)" }}
            >
              Saknar din region engagemang? Bli först — varje insamling
              börjar med en person som ser ett behov.
            </p>
            <Link href="/insamling" className="btn btn-primary btn-sm">
              Starta en insamling
            </Link>
          </div>
        </aside>
      </div>

      <p
        className="mt-12 text-xs leading-relaxed"
        style={{ color: "var(--color-ink-3)" }}
      >
        Bakgrundskarta © OpenStreetMap-bidragsgivare via OpenFreeMap.
        Län/kommun-data från Lantmäteriet / SCB öppna data. Endast
        BankID-/identitetsverifierade insamlare i tillstånd <em>aktiv</em>{" "}
        eller senare räknas i aggregatet.
      </p>
    </main>
  );
}

function Nyckeltal({ label, varde }: { label: string; varde: string }) {
  return (
    <div className="card card-tight">
      <div className="figure">{varde}</div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}
