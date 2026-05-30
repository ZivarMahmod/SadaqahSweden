// Skolan F8 — inbäddade verktyg. Server-yta: läser doc-server-flaggan och
// renderar klient-panelen (rityta/PDF/dokument). Verktygen ingår i
// medlemskapet i skarpt läge; att läsa material kräver aldrig premium.
import { laesSkolaFlaggor } from "@/lib/skola/flags";
import { VerktygPanel } from "@/components/skola/verktyg/verktyg-panel";

export default function VerktygPage() {
  const flaggor = laesSkolaFlaggor();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[640px]">
          <h2 className="heading-3">Verktyg</h2>
          <p className="lead mt-2" style={{ fontSize: 16 }}>
            Rityta, PDF-läsare och dokument — inbäddade open source-verktyg, full funktion,
            ingen licenskostnad. Allt körs i din webbläsare.
          </p>
        </div>
        <span className="pill pill-copper" style={{ whiteSpace: "nowrap" }}>
          Del av medlemskapet
        </span>
      </header>

      <VerktygPanel docserverUrl={flaggor.docserverUrl} />

      <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
        Licenser: Excalidraw (MIT), pdf.js (Apache-2.0). Se docs/SKOLA-VERKTYG.md.
      </p>
    </div>
  );
}
