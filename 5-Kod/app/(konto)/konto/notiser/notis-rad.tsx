// Modul M15 — Klient-komponent: en notisrad med "markera läst"-knapp.
"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markeraLast } from "./actions";

type Props = {
  id: string;
  titel: string;
  text: string | null;
  lank: string | null;
  grupp: string;
  last: boolean;
  createdRel: string;
};

export function NotisRad({ id, titel, text, lank, grupp, last, createdRel }: Props) {
  const [pending, start] = useTransition();

  function markera() {
    start(async () => {
      await markeraLast(id);
    });
  }

  return (
    <li
      className="grid grid-cols-[4px_1fr_auto] gap-3 rounded-[12px] border p-4"
      style={{
        borderColor: "var(--color-ink-line)",
        background: last ? "var(--color-paper)" : "var(--color-paper-soft)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 4,
          background: last ? "transparent" : "var(--color-copper)",
          borderRadius: 4,
        }}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className="text-xs font-semibold uppercase"
            style={{ letterSpacing: "0.06em", color: "var(--color-ink-3)" }}
          >
            {gruppLabel(grupp)}
          </span>
          <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
            {createdRel}
          </span>
        </div>
        <h3 className="mt-1" style={{ fontSize: 16, fontWeight: 500 }}>
          {lank ? (
            <Link
              href={lank}
              style={{ color: "var(--color-ink-1)" }}
              onClick={() => !last && markera()}
            >
              {titel}
            </Link>
          ) : (
            titel
          )}
        </h3>
        {text && (
          <p className="mt-1 text-sm" style={{ color: "var(--color-ink-2)" }}>
            {text}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-2">
        {!last && (
          <button
            type="button"
            onClick={markera}
            disabled={pending}
            className="btn btn-ghost btn-sm"
            aria-label="Markera som läst"
          >
            {pending ? "…" : "Markera läst"}
          </button>
        )}
      </div>
    </li>
  );
}

function gruppLabel(grupp: string): string {
  return ({
    mina_insamlingar: "Mina insamlingar",
    stottat: "Insamlingar jag stöttat",
    community: "Community",
    upptack: "Upptäck nytt",
    transaktionellt: "Transaktionellt",
  } as Record<string, string>)[grupp] ?? grupp;
}
