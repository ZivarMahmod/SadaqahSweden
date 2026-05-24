"use client";
// Modul M19 — FAQ-yta. Klient-component: sökruta filtrerar listan.
import { useMemo, useState } from "react";
import { VerifieratMarke } from "@/components/verifierat-marke";

type FaqPost = {
  id: string;
  fraga: string;
  svar_html: string;
  kategori: string;
  verifierad?: { id: string; namn: string; datum: string | null } | null;
};

export function FaqKlient({ poster }: { poster: FaqPost[] }) {
  const [sok, setSok] = useState("");

  const filtrerade = useMemo(() => {
    const q = sok.trim().toLowerCase();
    if (!q) return poster;
    return poster.filter((p) =>
      p.fraga.toLowerCase().includes(q) ||
      p.svar_html.toLowerCase().includes(q) ||
      p.kategori.toLowerCase().includes(q)
    );
  }, [poster, sok]);

  const grupper = useMemo(() => {
    const m = new Map<string, FaqPost[]>();
    for (const p of filtrerade) {
      if (!m.has(p.kategori)) m.set(p.kategori, []);
      m.get(p.kategori)!.push(p);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], "sv"));
  }, [filtrerade]);

  return (
    <>
      <div className="mb-10">
        <label className="flex flex-col gap-1">
          <span className="field-label">Sök i FAQ</span>
          <input
            type="search"
            value={sok}
            onChange={(e) => setSok(e.target.value)}
            placeholder="Skriv en fråga eller ord…"
            className="input input-lg"
          />
        </label>
      </div>

      {filtrerade.length === 0 && (
        <p className="lead text-center" style={{ color: "var(--color-ink-3)" }}>
          Inga frågor matchade. Prova en annan sökning.
        </p>
      )}

      {grupper.map(([kategori, lista]) => (
        <section key={kategori} className="mb-12">
          <h2 className="heading-2 mb-6">{kategori}</h2>
          <div className="flex flex-col gap-4">
            {lista.map((p) => (
              <details key={p.id} className="card card-tight">
                <summary
                  className="cursor-pointer font-medium"
                  style={{ fontSize: 17 }}
                >
                  {p.fraga}
                </summary>
                <div
                  className="prose prose-sm mt-4 max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: p.svar_html }}
                />
                {p.verifierad && (
                  <div className="mt-4">
                    <VerifieratMarke
                      lardId={p.verifierad.id}
                      lardNamn={p.verifierad.namn}
                      datum={p.verifierad.datum}
                    />
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
