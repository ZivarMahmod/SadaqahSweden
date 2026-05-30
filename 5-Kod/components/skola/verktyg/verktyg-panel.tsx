"use client";

// Skolan F8 — verktygspanel. Flikar mellan rityta / PDF / dokument så bara ett
// tungt verktyg monteras åt gången. Dokument-editorn är en stub bakom
// NEXT_PUBLIC_DOCSERVER_URL (OnlyOffice) — tom URL = "kommer snart".
import { useState } from "react";
import { ExcalidrawRityta } from "./excalidraw-rityta";
import { PdfVisare } from "./pdf-visare";

type Flik = "rityta" | "pdf" | "dokument";

const FLIKAR: { id: Flik; label: string }[] = [
  { id: "rityta", label: "Rityta" },
  { id: "pdf", label: "PDF-läsare" },
  { id: "dokument", label: "Dokument" },
];

export function VerktygPanel({ docserverUrl }: { docserverUrl: string }) {
  const [flik, setFlik] = useState<Flik>("rityta");

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Verktyg" className="flex flex-wrap gap-2">
        {FLIKAR.map((f) => {
          const aktiv = flik === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={aktiv}
              onClick={() => setFlik(f.id)}
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] px-5 font-medium transition-colors"
              style={{
                minHeight: 48,
                fontSize: 15,
                background: aktiv ? "var(--color-forest)" : "var(--color-paper-soft)",
                color: aktiv ? "var(--color-paper-soft)" : "var(--color-ink-2)",
                border: "1px solid var(--color-paper-line)",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {flik === "rityta" && <ExcalidrawRityta />}
        {flik === "pdf" && <PdfVisare />}
        {flik === "dokument" &&
          (docserverUrl ? (
            <iframe
              title="Dokument-editor"
              src={docserverUrl}
              className="w-full rounded-[var(--radius-lg)]"
              style={{ height: "min(70vh, 620px)", border: "1px solid var(--color-paper-line)" }}
            />
          ) : (
            <div
              className="card card-bare flex flex-col items-center gap-3 px-8 py-14 text-center"
              style={{ border: "1px dashed var(--color-paper-line)" }}
            >
              <span className="pill pill-outline">Kommer snart</span>
              <h3 className="heading-3">Dokument- och PPT-redigering</h3>
              <p className="lead mx-auto max-w-md" style={{ fontSize: 16 }}>
                Rich dokumentredigering (OnlyOffice) kopplas in när en doc-server finns.
                Rityta och PDF fungerar fullt ut redan nu.
              </p>
              <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
                Aktiveras när: NEXT_PUBLIC_DOCSERVER_URL är satt.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
