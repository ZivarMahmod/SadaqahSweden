"use client";

// Skolan F8 — rityta/whiteboard via Excalidraw (@excalidraw/excalidraw, MIT).
// Klient-only: dynamisk import med ssr:false MÅSTE ligga i en "use client"-fil
// (Next 15 tillåter inte ssr:false i Server Components). CSS importeras här,
// inte i globals. Scenen sparas lokalt (localStorage) — ingen server, ingen DB.
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";

// Hämta named export via dynamisk import (aldrig statiskt — undviker att
// excalidraw utvärderar `window` på servern).
const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center" style={{ color: "var(--color-ink-3)" }}>
      Laddar rityta…
    </div>
  ),
});

const LAGRINGSNYCKEL = "skola-rityta-scen";

// Läs ev. sparad scen (bara element — plain array, säkert att serialisera).
function lasSparad(): unknown[] | null {
  if (typeof window === "undefined") return null;
  try {
    const r = window.localStorage.getItem(LAGRINGSNYCKEL);
    return r ? (JSON.parse(r) as unknown[]) : null;
  } catch {
    return null;
  }
}

export function ExcalidrawRityta() {
  const elementenRef = useRef<readonly unknown[]>([]);
  const [sparad, setSparad] = useState(false);
  const [start] = useState<unknown[] | null>(() => lasSparad());

  const onChange = useCallback((elements: readonly unknown[]) => {
    elementenRef.current = elements;
    if (sparad) setSparad(false);
  }, [sparad]);

  const sparaLokalt = useCallback(() => {
    try {
      window.localStorage.setItem(LAGRINGSNYCKEL, JSON.stringify(elementenRef.current));
      setSparad(true);
    } catch {
      // localStorage kan vara avstängt — tyst, det är bara en bekvämlighet.
    }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          Rita fritt — sparas bara på din enhet.
        </p>
        <button
          type="button"
          onClick={sparaLokalt}
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 font-medium"
          style={{
            minHeight: 48,
            fontSize: 14,
            background: "var(--color-forest)",
            color: "var(--color-paper-soft)",
          }}
        >
          {sparad ? "Sparad ✓" : "Spara lokalt"}
        </button>
      </div>
      {/* Föräldern MÅSTE ha en explicit höjd annars renderas canvasen tom. */}
      <div
        style={{
          height: "min(70vh, 620px)",
          width: "100%",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--color-paper-line)",
        }}
      >
        <Excalidraw
          initialData={start ? { elements: start as never } : undefined}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
