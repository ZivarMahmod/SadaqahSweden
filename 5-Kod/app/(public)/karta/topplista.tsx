// Topplista — Block 1.2: "Topplista bredvid kartan, alltid". Färgnyanser
// är svårlästa — särskilt vid dyslexi. En rangordnad lista ger siffrorna
// i klartext. Mobil-prioriterad ordning är lista först.

import type { LanAggregat } from "@/lib/karta";
import { kortBelopp, antal } from "@/lib/format";

export function Topplista({ lan }: { lan: LanAggregat[] }) {
  // Visa top 10. Tomma län hamnar längst ned via lib/karta-sortering.
  const top = lan.slice(0, 10);

  return (
    <div className="card card-tight">
      <h3 className="h-3 mb-1">Topplista</h3>
      <p
        className="text-xs mb-4"
        style={{ color: "var(--color-ink-3)" }}
      >
        Aktiva insamlingar per län.
      </p>
      <ol className="flex flex-col">
        {top.map((l, i) => (
          <li
            key={l.kod}
            className="flex items-center justify-between gap-3 py-2.5"
            style={{
              borderTop: i === 0 ? "none" : "1px solid var(--color-ink-line)",
            }}
          >
            <div className="flex min-w-0 items-baseline gap-3">
              <span
                className="tabular text-xs"
                style={{ color: "var(--color-ink-3)", width: 18 }}
              >
                {i + 1}.
              </span>
              <span
                className="truncate text-sm font-medium"
                style={{ color: "var(--color-ink-1)" }}
                title={l.namn}
              >
                {l.kort_namn}
              </span>
            </div>
            <div className="flex shrink-0 items-baseline gap-3 text-right">
              <span
                className="tabular text-sm font-semibold"
                style={{ color: "var(--color-forest)" }}
              >
                {antal(l.aktiva_antal)}
              </span>
              <span
                className="tabular text-xs"
                style={{ color: "var(--color-ink-3)" }}
              >
                {kortBelopp(l.insamlat_summa_ore)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
