// Designsystem-primitiv — InsamlingCard (publik kortvy).
// Designreferens: handoff-to-code/marketing.html § campaign + discovery.html.
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
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
    <Link
      href={`/insamlingar/${data.publicId}`}
      className="card card-hover flex flex-col gap-0 overflow-hidden p-0 no-underline"
      style={{ color: "inherit" }}
    >
      <div className="ph relative h-[220px] w-full">
        <div className="absolute left-3.5 top-3.5 z-10 flex gap-2">
          {data.status === "aktiv" && (
            <Pill tone="dark" dot="pulse">
              Aktiv nu
            </Pill>
          )}
          <Pill tone="dark">Granskad</Pill>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 p-6">
        <span
          className="text-xs font-semibold uppercase"
          style={{ letterSpacing: "0.16em", color: "var(--color-copper-deep)" }}
        >
          {data.kategoriNamn ?? "Insamling"} · {data.hjalpLand}
        </span>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            lineHeight: 1.2,
            fontWeight: 500,
            letterSpacing: "-0.008em",
            color: "var(--color-ink)",
            margin: 0,
            textWrap: "balance",
          }}
        >
          {data.titel}
        </h3>
        <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
          {data.kortBeskrivning}
        </p>
        <div className="mt-auto flex flex-col gap-2">
          {procent != null && <Progress value={procent} ariaLabel={`${procent} % av målet`} />}
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
        </div>
      </div>
    </Link>
  );
}

export type { InsamlingCardData };
export { kr };
