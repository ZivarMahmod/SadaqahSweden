"use client";

import { useState, useTransition } from "react";
import { avfardLarmAction } from "../actions";

export function LarmHanteringForm({ larmId }: { larmId: string }) {
  const [motiv, setMotiv] = useState("");
  const [pending, start] = useTransition();
  const [fel, setFel] = useState<string | null>(null);

  function avfard() {
    setFel(null);
    if (motiv.trim().length < 5) {
      setFel("Motivering krävs (minst 5 tecken)");
      return;
    }
    start(async () => {
      const res = await avfardLarmAction(larmId, motiv.trim());
      if (!res.ok) setFel(res.fel);
    });
  }

  return (
    <div
      className="mt-4 flex flex-col gap-2 rounded-md p-3"
      style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}
    >
      <textarea
        rows={2}
        value={motiv}
        onChange={(e) => setMotiv(e.target.value.slice(0, 500))}
        placeholder="Hur har du hanterat larmet? Loggas i ingreppsloggen."
        className="textarea"
        disabled={pending}
      />
      {fel && <p className="field-error">{fel}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={avfard} disabled={pending} className="btn btn-secondary btn-sm">
          {pending ? "Sparar …" : "Avfärda larm"}
        </button>
      </div>
    </div>
  );
}
