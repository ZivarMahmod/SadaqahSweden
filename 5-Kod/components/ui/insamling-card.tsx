// Designsystem-primitiv — InsamlingCard (publik kortvy).
// Designreferens: handoff-to-code/marketing.html § campaign + discovery.html.
//
// v0.3 (brief 35, F3): InsamlingCard är nu en TUNN ADAPTER ovanpå den gemensamma
// EntityCard-stommen — den mappar insamlings-entiteten → EntityCard-props. Det
// exporterade API:t är OFÖRÄNDRAT (InsamlingCard, InsamlingCardData, kr) och den
// renderade vyn är visuellt identisk; inuti delas stommen med alla katalogkort.
// Andra områden (förening/event/imam/FAQ) skriver sina egna adaptrar likadant.
import { EntityCard } from "@/components/ui/entity-card";
import { Pill } from "@/components/ui/pill";
import { dagarKvar, kortBelopp, kr, procentAvMal } from "@/lib/format";

type InsamlingCardData = {
  publicId: string;
  titel: string;
  kortBeskrivning: string;
  insamlatOre: number;
  malbeloppOre: number | null;
  malbeloppMinOre: number | null;
  malbeloppMaxOre: number | null;
  malbeloppModell: string;
  insamlarStad: string;
  hjalpLand: string;
  insamlingDeadline: string;
  status: string;
  kategoriNamn?: string | null;
};

export function InsamlingCard({ data }: { data: InsamlingCardData }) {
  const procent = procentAvMal(
    data.insamlatOre,
    data.malbeloppModell,
    data.malbeloppOre,
    data.malbeloppMaxOre,
  );
  const dagar = dagarKvar(data.insamlingDeadline);
  const malbelopp =
    data.malbeloppModell === "fast"
      ? data.malbeloppOre
      : data.malbeloppModell === "intervall"
      ? data.malbeloppMaxOre
      : null;

  return (
    <EntityCard
      href={`/insamlingar/${data.publicId}`}
      thumbnail={<div className="ph relative h-[220px] w-full" />}
      statusTag={
        <>
          {data.status === "aktiv" && (
            <Pill tone="dark" dot="pulse">
              Aktiv nu
            </Pill>
          )}
          <Pill tone="dark">Granskad</Pill>
        </>
      }
      eyebrow={`${data.kategoriNamn ?? "Insamling"} · ${data.hjalpLand}`}
      title={data.titel}
      metaLines={[data.kortBeskrivning]}
      progress={procent ?? undefined}
      progressAriaLabel={procent != null ? `${procent} % av målet` : undefined}
      footer={
        <div className="flex justify-between text-[13px]" style={{ color: "var(--color-ink-2)" }}>
          <span>
            <span
              className="tabular font-semibold"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-forest)" }}
            >
              {kortBelopp(data.insamlatOre)}
            </span>
            {malbelopp && <> av {kortBelopp(malbelopp)}</>}
          </span>
          <span>
            {procent != null && <>{procent} % · </>}
            {dagar} dgr kvar
          </span>
        </div>
      }
    />
  );
}

export type { InsamlingCardData };
export { kr };
