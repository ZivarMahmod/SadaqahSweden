"use client";

// Skolan F8 — PDF-visning via pdf.js (pdfjs-dist). Klient-only.
// pdfjs importeras BARA inuti effekt/handler (aldrig på modultoppnivå) så att
// DOMMatrix/Path2D inte utvärderas på servern. Worker-URL härleds från
// pdfjs.version (matchar alltid installerad version). Öppna en PDF lokalt —
// inget laddas upp, ingen server.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export function PdfVisare() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const [filnamn, setFilnamn] = useState<string | null>(null);
  const [antalSidor, setAntalSidor] = useState(0);
  const [sida, setSida] = useState(1);
  const [skala, setSkala] = useState(1.2);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  // Räknare som ändras varje gång ett nytt dokument laddas → triggar omritning
  // även om filnamnet råkar vara identiskt.
  const [docVer, setDocVer] = useState(0);

  const oppnaFil = useCallback(async (file: File) => {
    setFel(null);
    setLaddar(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      // Self-hostad worker (samma origin) — inget tredjepartsanrop, fungerar
      // offline och bryts inte av en framtida CSP. Filen ligger i public/pdf.
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
      const data = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data }).promise;
      docRef.current = doc;
      setAntalSidor(doc.numPages);
      setSida(1);
      setFilnamn(file.name);
      setDocVer((v) => v + 1);
    } catch (e) {
      setFel("Kunde inte öppna PDF:en. Kontrollera att filen är en giltig PDF.");
      console.error("PDF-fel:", e);
    } finally {
      setLaddar(false);
    }
  }, []);

  // Rendera aktuell sida när doc/sida/skala ändras. Avbryt pågående render vid
  // snabba sid-/zoom-byten — annars kraschar pdf.js på "same canvas during
  // multiple render() operations" och sidan blir tom.
  useEffect(() => {
    let avbruten = false;
    let task: { promise: Promise<unknown>; cancel: () => void } | null = null;
    const doc = docRef.current;
    if (!doc) return;
    (async () => {
      try {
        const page = await doc.getPage(sida);
        if (avbruten) return;
        const viewport = page.getViewport({ scale: skala });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        // v5 kräver `canvas`; skicka både canvas + canvasContext (v4/v5-säkert).
        task = page.render({ canvas, canvasContext: ctx, viewport } as never) as {
          promise: Promise<unknown>;
          cancel: () => void;
        };
        await task.promise;
      } catch (e) {
        // RenderingCancelledException vid avbrott är förväntat — ignorera tyst.
        const namn = (e as { name?: string })?.name;
        if (namn !== "RenderingCancelledException") console.error("PDF-render-fel:", e);
      }
    })();
    return () => {
      avbruten = true;
      task?.cancel();
    };
  }, [sida, skala, docVer]);

  const knapp =
    "inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 font-medium";
  const knappStil: React.CSSProperties = {
    minHeight: 48,
    fontSize: 14,
    border: "1px solid var(--color-paper-line)",
    background: "var(--color-paper-soft)",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className={knapp} style={{ ...knappStil, cursor: "pointer" }}>
          Öppna PDF
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void oppnaFil(f);
            }}
          />
        </label>
        {filnamn && (
          <span style={{ color: "var(--color-ink-2)", fontSize: 14 }} className="truncate">
            {filnamn}
          </span>
        )}
      </div>

      {fel && (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 14 }}>
          {fel}
        </p>
      )}

      {!filnamn && !laddar && (
        <div
          className="card card-bare flex flex-col items-center gap-2 px-8 py-14 text-center"
          style={{ border: "1px dashed var(--color-paper-line)" }}
        >
          <p className="heading-3" style={{ fontSize: 20 }}>
            Öppna en PDF för att läsa
          </p>
          <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>
            Filen läses bara i din webbläsare — den laddas aldrig upp.
          </p>
        </div>
      )}

      {laddar && <p style={{ color: "var(--color-ink-3)" }}>Laddar…</p>}

      {filnamn && !laddar && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={knapp} style={knappStil} disabled={sida <= 1} onClick={() => setSida((s) => Math.max(1, s - 1))}>
              ← Föregående
            </button>
            <span style={{ color: "var(--color-ink-2)", fontSize: 14, minWidth: 110, textAlign: "center" }}>
              Sida {sida} / {antalSidor}
            </span>
            <button type="button" className={knapp} style={knappStil} disabled={sida >= antalSidor} onClick={() => setSida((s) => Math.min(antalSidor, s + 1))}>
              Nästa →
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" className={knapp} style={knappStil} onClick={() => setSkala((z) => Math.max(0.5, +(z - 0.2).toFixed(2)))}>
                −
              </button>
              <span style={{ color: "var(--color-ink-3)", fontSize: 13, minWidth: 48, textAlign: "center" }}>
                {Math.round(skala * 100)}%
              </span>
              <button type="button" className={knapp} style={knappStil} onClick={() => setSkala((z) => Math.min(3, +(z + 0.2).toFixed(2)))}>
                +
              </button>
            </div>
          </div>

          <div
            className="overflow-auto rounded-[var(--radius-lg)]"
            style={{
              maxHeight: "70vh",
              background: "var(--color-paper-deep)",
              border: "1px solid var(--color-paper-line)",
              padding: 16,
            }}
          >
            <canvas ref={canvasRef} className="mx-auto block" style={{ boxShadow: "var(--shadow-2)" }} />
          </div>
        </>
      )}
    </div>
  );
}
