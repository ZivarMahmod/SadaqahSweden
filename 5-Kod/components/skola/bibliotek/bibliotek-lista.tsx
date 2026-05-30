"use client";

// Skolan F6 — bibliotekslista (klient): filtrera på ämne + privat bokmärkning.
// Bokmärken är per användare (mock i lokalt state tills backend finns).
import { useMemo, useState } from "react";
import { Pill } from "@/components/ui/pill";
import type { BibliotekItem } from "@/lib/skola/typer";

export function BibliotekLista({ items }: { items: BibliotekItem[] }) {
  const amnen = useMemo(
    () => ["Alla", ...Array.from(new Set(items.map((i) => i.amne)))],
    [items],
  );
  const [amne, setAmne] = useState("Alla");
  const [bokmarken, setBokmarken] = useState<Record<string, boolean>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.bokmarkt])),
  );
  const [baraBokmarkta, setBaraBokmarkta] = useState(false);

  const synliga = items.filter((i) => {
    if (amne !== "Alla" && i.amne !== amne) return false;
    if (baraBokmarkta && !bokmarken[i.id]) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {amnen.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmne(a)}
            aria-pressed={amne === a}
            className="inline-flex items-center justify-center rounded-[var(--radius-pill)] px-4 font-medium"
            style={{
              minHeight: 48,
              fontSize: 14,
              background: amne === a ? "var(--color-forest)" : "var(--color-paper-soft)",
              color: amne === a ? "var(--color-paper-soft)" : "var(--color-ink-2)",
              border: "1px solid var(--color-paper-line)",
            }}
          >
            {a}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2" style={{ fontSize: 14, color: "var(--color-ink-2)" }}>
          <input
            type="checkbox"
            checked={baraBokmarkta}
            onChange={(e) => setBaraBokmarkta(e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
          Bara bokmärkta
        </label>
      </div>

      {/* Lista */}
      {synliga.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>Inget material matchar filtret.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {synliga.map((i) => (
            <li key={i.id} className="card card-tight flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span style={{ fontWeight: 600, fontSize: 16 }}>{i.titel}</span>
                <button
                  type="button"
                  onClick={() => setBokmarken((b) => ({ ...b, [i.id]: !b[i.id] }))}
                  aria-pressed={bokmarken[i.id]}
                  aria-label={bokmarken[i.id] ? "Ta bort bokmärke" : "Bokmärk"}
                  style={{
                    minWidth: 48,
                    minHeight: 48,
                    fontSize: 20,
                    color: bokmarken[i.id] ? "var(--color-copper)" : "var(--color-ink-4)",
                    background: "transparent",
                    lineHeight: 1,
                  }}
                >
                  {bokmarken[i.id] ? "★" : "☆"}
                </button>
              </div>
              <p style={{ color: "var(--color-ink-2)", fontSize: 14, lineHeight: 1.5 }}>{i.beskrivning}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Pill tone="paper">{i.typ}</Pill>
                <Pill tone={i.kalla === "gemensamt_verifierat" ? "success" : "outline"}>
                  {i.kalla === "gemensamt_verifierat" ? "Verifierat" : "Lärarens"}
                </Pill>
                {i.agare && (
                  <span style={{ color: "var(--color-ink-4)", fontSize: 13 }}>{i.agare}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
