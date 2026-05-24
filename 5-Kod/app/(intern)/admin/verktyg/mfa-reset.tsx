// FX5 — Klient-formulär: nollställ MFA via e-post för ett konto (alla roller).
"use client";

import { useState, useTransition } from "react";
import {
  aterstallMfaForEpostAction,
  type MfaResetResultat,
} from "./mfa-reset-actions";

export function MfaResetForm() {
  const [epost, setEpost] = useState("");
  const [motivering, setMotivering] = useState("");
  const [bekraftar, setBekraftar] = useState(false);
  const [resultat, setResultat] = useState<MfaResetResultat | null>(null);
  const [pending, start] = useTransition();

  const klar = epost.trim().length > 3 && motivering.trim().length >= 5;

  function submit() {
    start(async () => {
      const r = await aterstallMfaForEpostAction(epost.trim(), motivering.trim());
      setResultat(r);
      if (r.ok) {
        setBekraftar(false);
        setEpost("");
        setMotivering("");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <label className="block">
        <span className="field-label">E-post på konto</span>
        <input
          type="email"
          required
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          placeholder="namn@exempel.se"
          className="input mt-1"
        />
      </label>

      <label className="block">
        <span className="field-label">Motivering (minst 5 tecken)</span>
        <textarea
          required
          value={motivering}
          onChange={(e) => setMotivering(e.target.value)}
          rows={2}
          className="input mt-1"
          placeholder="T.ex. 'användaren har tappat telefonen, verifierad via support-samtal'. Loggas i admin_ingreppslogg."
        />
      </label>

      {!bekraftar ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending || !klar}
            onClick={() => setBekraftar(true)}
            className="btn btn-primary btn-sm"
          >
            Nollställ MFA…
          </button>
          {resultat && resultat.ok && (
            <span className="text-sm" style={{ color: "var(--color-success)" }}>
              {resultat.epost}: {resultat.antalRaderade} faktor(er) raderade — roll: {resultat.roll}
            </span>
          )}
          {resultat && !resultat.ok && (
            <span className="field-error">{resultat.fel}</span>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col gap-2 rounded border p-3"
          style={{ borderColor: "var(--color-copper)" }}
        >
          <p className="text-sm">
            Bekräfta: nollställ <strong>alla</strong> MFA-faktorer för{" "}
            <code>{epost}</code>? Användaren omdirigeras till 2FA-setup vid
            nästa skyddad request. Loggas i admin_ingreppslogg.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn btn-primary btn-sm"
            >
              {pending ? "Nollställer…" : "Bekräfta nollställning"}
            </button>
            <button
              type="button"
              onClick={() => setBekraftar(false)}
              disabled={pending}
              className="btn btn-ghost btn-sm"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
