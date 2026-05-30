"use client";

// Skolan F9 — quiz-spelare (kunskap/ord, ALDRIG tillbedjan). Spela i egen takt,
// privat poäng. Healthy-by-design: ingen publik topplista, ingen streak, inga
// mörka mönster. Mock — inget sparas på server.
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import type { Quiz } from "@/lib/skola/typer";

export function QuizSpelare({ quiz }: { quiz: Quiz }) {
  const [index, setIndex] = useState(0);
  const [valt, setValt] = useState<number | null>(null);
  const [visat, setVisat] = useState(false);
  const [ratt, setRatt] = useState(0);
  const [klar, setKlar] = useState(false);

  const fraga = quiz.fragor[index];
  const sista = index === quiz.fragor.length - 1;

  function svara(i: number) {
    if (visat) return;
    setValt(i);
    setVisat(true);
    if (i === fraga.ratt) setRatt((r) => r + 1);
  }

  function nasta() {
    if (sista) {
      setKlar(true);
      return;
    }
    setIndex((x) => x + 1);
    setValt(null);
    setVisat(false);
  }

  function omStart() {
    setIndex(0);
    setValt(null);
    setVisat(false);
    setRatt(0);
    setKlar(false);
  }

  if (klar) {
    const andel = Math.round((ratt / quiz.fragor.length) * 100);
    return (
      <div className="card flex flex-col items-center gap-4 px-8 py-12 text-center">
        <span className="eyebrow">Klart</span>
        <h3 className="heading-2">
          {ratt} / {quiz.fragor.length} rätt
        </h3>
        <div className="w-full max-w-xs">
          <Progress value={andel} tone="forest" ariaLabel="Resultat" />
        </div>
        <p className="lead" style={{ fontSize: 16 }}>
          {andel === 100
            ? "Allt rätt — fint jobbat, māshāʾAllāh!"
            : andel >= 60
              ? "Bra jobbat. Kör igen för att nöta in resten."
              : "Bra start. Öva lite till och prova igen — i din egen takt."}
        </p>
        <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
          Ditt resultat är privat. Ingen topplista, ingen jämförelse med andra.
        </p>
        <button type="button" onClick={omStart} className="btn btn-primary" style={{ minHeight: 48 }}>
          Spela igen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          Fråga {index + 1} av {quiz.fragor.length}
        </span>
        <span style={{ color: "var(--color-ink-3)", fontSize: 14 }}>{quiz.titel}</span>
      </div>
      <Progress value={((index + (visat ? 1 : 0)) / quiz.fragor.length) * 100} ariaLabel="Framsteg" />

      <h3 className="heading-3">{fraga.fraga}</h3>

      <div className="flex flex-col gap-2">
        {fraga.alternativ.map((alt, i) => {
          const arRatt = i === fraga.ratt;
          const arValt = i === valt;
          let bg = "var(--color-paper-soft)";
          let bord = "var(--color-paper-line)";
          if (visat && arRatt) {
            bg = "var(--color-success-soft)";
            bord = "var(--color-success)";
          } else if (visat && arValt && !arRatt) {
            bg = "var(--color-danger-soft)";
            bord = "var(--color-danger)";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => svara(i)}
              disabled={visat}
              aria-pressed={arValt}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-5 text-left font-medium"
              style={{
                minHeight: 56,
                fontSize: 16,
                background: bg,
                border: `1px solid ${bord}`,
                color: "var(--color-ink-1)",
                cursor: visat ? "default" : "pointer",
              }}
            >
              <span>{alt}</span>
              {visat && arRatt && <span style={{ color: "var(--color-success)" }}>✓</span>}
              {visat && arValt && !arRatt && <span style={{ color: "var(--color-danger)" }}>✗</span>}
            </button>
          );
        })}
      </div>

      {visat && (
        <button type="button" onClick={nasta} className="btn btn-primary self-end" style={{ minHeight: 48 }}>
          {sista ? "Se resultat" : "Nästa fråga"}
        </button>
      )}
    </div>
  );
}
