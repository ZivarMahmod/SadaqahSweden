"use client";

import { useState, useTransition } from "react";
import { sattSkyddadIdentitetAction } from "./skyddad-actions";

type Resultat =
  | { ok: true; epost: string; skydd: boolean }
  | { ok: false; fel: string };

export function SkyddadIdentitetForm() {
  const [epost, setEpost] = useState("");
  const [skydd, setSkydd] = useState(true);
  const [motivering, setMotivering] = useState("");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResultat(null);
    start(async () => {
      const res = await sattSkyddadIdentitetAction(epost.trim(), skydd, motivering.trim());
      setResultat(res);
      if (res.ok) {
        setEpost("");
        setMotivering("");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <label className="block">
        <span className="field-label">E-post på insamlaren</span>
        <input
          type="email"
          required
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          placeholder="namn@exempel.se"
          className="input mt-1"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={skydd}
          onChange={(e) => setSkydd(e.target.checked)}
        />
        <span>Skyddad identitet (kommun-nivå exkluderas)</span>
      </label>

      <label className="block">
        <span className="field-label">Motivering (5–2000 tecken)</span>
        <textarea
          required
          value={motivering}
          onChange={(e) => setMotivering(e.target.value)}
          rows={2}
          className="input mt-1"
          placeholder="Loggas i ingreppsloggen."
        />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || motivering.trim().length < 5} className="btn btn-primary btn-sm">
          {pending ? "Sätter …" : "Spara"}
        </button>
        {resultat && resultat.ok && (
          <span className="text-sm" style={{ color: "var(--color-success)" }}>
            {resultat.epost}: skyddad_identitet = {String(resultat.skydd)}
          </span>
        )}
        {resultat && !resultat.ok && <span className="field-error">{resultat.fel}</span>}
      </div>
    </form>
  );
}
