"use client";

// Skolan F2/F3 — små klient-åtgärder (mock): gå med via join-kod och ansök om
// lärar-behörighet. Demonstrerar de grindade flödena UTAN backend:
// - Gå-med validerar koden mot mock-klasserna.
// - Lärar-behörighet är default STÄNGD: man ANSÖKER, blir inte lärare self-serve.
import { useState } from "react";
import { KLASSER } from "@/lib/skola/mock";

export function GaMedViaKod() {
  const [kod, setKod] = useState("");
  const [svar, setSvar] = useState<{ ok: boolean; text: string } | null>(null);

  function gaMed(e: React.FormEvent) {
    e.preventDefault();
    const trimmad = kod.trim().toUpperCase();
    const klass = KLASSER.find((k) => k.joinKod.toUpperCase() === trimmad);
    if (!trimmad) {
      setSvar({ ok: false, text: "Skriv in en kod." });
    } else if (klass) {
      setSvar({ ok: true, text: `Du gick med i «${klass.namn}». (Förhandsvisning — kopplas till riktig klass senare.)` });
    } else {
      setSvar({ ok: false, text: "Ingen klass med den koden. Prova ARAB-7Q2." });
    }
  }

  return (
    <form onSubmit={gaMed} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="join-kod" className="field-label">
            Gå med via kod
          </label>
          <input
            id="join-kod"
            className="input"
            placeholder="t.ex. ARAB-7Q2"
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            style={{ minHeight: 48, minWidth: 200 }}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ minHeight: 48 }}
        >
          Gå med
        </button>
      </div>
      {svar && (
        <p
          role="status"
          style={{ color: svar.ok ? "var(--color-success)" : "var(--color-danger)", fontSize: 14 }}
        >
          {svar.text}
        </p>
      )}
    </form>
  );
}

export function LararAnsokan() {
  const [skickad, setSkickad] = useState(false);
  return (
    <div className="card card-tight flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="heading-3" style={{ fontSize: 18 }}>
          Vill du undervisa?
        </h3>
        <span className="pill pill-outline">Grindat</span>
      </div>
      <p style={{ color: "var(--color-ink-2)", fontSize: 15, lineHeight: 1.5 }}>
        Att bli lärare är behörighetsgrindat — inte självregistrering. Du ansöker, och en
        granskare godkänner innan du kan skapa en klass.
      </p>
      {skickad ? (
        <p role="status" style={{ color: "var(--color-success)", fontSize: 14 }}>
          Ansökan inskickad (förhandsvisning). En granskare tar ställning. Du kan inte skapa en
          klass förrän du är godkänd.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setSkickad(true)}
          className="btn btn-secondary"
          style={{ minHeight: 48, alignSelf: "flex-start" }}
        >
          Ansök om lärar-behörighet
        </button>
      )}
    </div>
  );
}
