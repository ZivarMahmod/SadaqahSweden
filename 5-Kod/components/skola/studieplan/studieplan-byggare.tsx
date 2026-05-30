"use client";

// Skolan F7 — studieplan-byggare + cross-reference (PREMIUM). Bakom
// entitlement-grinden `studieplan`/`cross_reference`. Att LÄSA material är
// alltid gratis; bara verktyget att ordna/strukturera är premium.
//
// Är funktionen låst (`laast`) visas ärligt uppsälj + en transparent
// förhandsvisning (ingen FOMO, ingen falsk knapphet). Mock — inget sparas.
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { PremiumUppsalj } from "@/components/skola/notiser";
import { BIBLIOTEK_LARARE, STUDIEPLANER } from "@/lib/skola/mock";
import type { StudieplanModul } from "@/lib/skola/typer";

let nyttId = 0;

export function StudieplanByggare({ laast }: { laast: boolean }) {
  const [forhandsvisa, setForhandsvisa] = useState(false);

  if (laast && !forhandsvisa) {
    return (
      <div className="flex flex-col gap-5">
        <PremiumUppsalj
          titel="Bygg din egen studieplan"
          varfor="Strukturera ditt lärande i moduler, följ dina framsteg och korsreferera mot materialet. Verktygen som ordnar lärandet ingår i medlemskapet — innehållet du läser är alltid gratis."
        />
        <button
          type="button"
          onClick={() => setForhandsvisa(true)}
          className="btn btn-ghost self-start"
          style={{ minHeight: 48 }}
        >
          Förhandsvisa verktyget
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {laast && (
        <div
          className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3"
          style={{ background: "var(--color-copper-soft)", color: "var(--color-copper-deep)", fontSize: 14 }}
        >
          <span>
            <strong>Förhandsvisning.</strong> Så här fungerar studieplan-byggaren. Med
            medlemskap kan du spara din egen plan.
          </span>
          <button type="button" onClick={() => setForhandsvisa(false)} className="btn btn-ghost btn-sm">
            Stäng
          </button>
        </div>
      )}
      <Byggare />
    </div>
  );
}

function Byggare() {
  const [namn, setNamn] = useState(STUDIEPLANER[0]?.namn ?? "Min studieplan");
  const [moduler, setModuler] = useState<StudieplanModul[]>(
    () => STUDIEPLANER[0]?.moduler.map((m) => ({ ...m })) ?? [],
  );
  const [ny, setNy] = useState("");
  const [referenser, setReferenser] = useState<string[]>([]);

  const klara = moduler.filter((m) => m.klar).length;
  const andel = moduler.length ? Math.round((klara / moduler.length) * 100) : 0;

  function laggTill(e: React.FormEvent) {
    e.preventDefault();
    const t = ny.trim();
    if (!t) return;
    setModuler((m) => [...m, { id: `ny-${nyttId++}`, titel: t, klar: false }]);
    setNy("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="plan-namn" className="field-label">
          Planens namn
        </label>
        <input
          id="plan-namn"
          className="input"
          value={namn}
          onChange={(e) => setNamn(e.target.value)}
          style={{ minHeight: 48, maxWidth: 420 }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="heading-3" style={{ fontSize: 18 }}>
            Moduler
          </h3>
          <span style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
            {klara}/{moduler.length} klara
          </span>
        </div>
        <Progress value={andel} ariaLabel="Framsteg i studieplanen" />
        <ul className="mt-2 flex flex-col gap-2">
          {moduler.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3"
              style={{ background: "var(--color-paper-soft)", border: "1px solid var(--color-paper-line)" }}
            >
              <label className="flex items-center gap-3" style={{ fontSize: 15 }}>
                <input
                  type="checkbox"
                  checked={m.klar}
                  onChange={() =>
                    setModuler((arr) => arr.map((x) => (x.id === m.id ? { ...x, klar: !x.klar } : x)))
                  }
                  style={{ width: 22, height: 22 }}
                />
                <span style={{ textDecoration: m.klar ? "line-through" : "none", color: m.klar ? "var(--color-ink-4)" : "var(--color-ink-1)" }}>
                  {m.titel}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setModuler((arr) => arr.filter((x) => x.id !== m.id))}
                aria-label={`Ta bort ${m.titel}`}
                style={{ minWidth: 44, minHeight: 44, color: "var(--color-ink-4)", background: "transparent" }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={laggTill} className="mt-1 flex flex-wrap items-end gap-2">
          <input
            className="input"
            placeholder="Lägg till en modul…"
            value={ny}
            onChange={(e) => setNy(e.target.value)}
            style={{ minHeight: 48, minWidth: 240 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ minHeight: 48 }}>
            Lägg till
          </button>
        </form>
      </div>

      {/* Cross-reference (premium) */}
      <div className="flex flex-col gap-2">
        <h3 className="heading-3" style={{ fontSize: 18 }}>
          Korsreferens till material
        </h3>
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          Koppla planen till material du vill arbeta med.
        </p>
        <div className="flex flex-wrap gap-2">
          {BIBLIOTEK_LARARE.map((b) => {
            const vald = referenser.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setReferenser((r) => (vald ? r.filter((x) => x !== b.id) : [...r, b.id]))
                }
                aria-pressed={vald}
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 font-medium"
                style={{
                  minHeight: 44,
                  fontSize: 14,
                  background: vald ? "var(--color-forest-soft)" : "var(--color-paper-soft)",
                  border: `1px solid ${vald ? "var(--color-forest-line)" : "var(--color-paper-line)"}`,
                  color: "var(--color-ink-2)",
                }}
              >
                {vald ? "✓ " : "+ "}
                {b.titel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
