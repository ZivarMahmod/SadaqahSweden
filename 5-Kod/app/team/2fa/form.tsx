"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifieraMfaChallenge } from "./actions";

export function Challenge2faForm({ factorId, retur }: { factorId: string; retur: string }) {
  const router = useRouter();
  const [kod, setKod] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFel(null);
    start(async () => {
      const res = await verifieraMfaChallenge(factorId, kod);
      if (!res.ok) {
        setFel(res.fel);
      } else {
        router.push(retur);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="field-label" htmlFor="mfa_kod">6-siffrig kod</label>
      <input
        id="mfa_kod"
        name="kod"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        value={kod}
        onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="input"
        placeholder="123456"
        autoComplete="one-time-code"
      />
      {fel && <p className="field-error">{fel}</p>}
      <button type="submit" disabled={pending || kod.length !== 6} className="btn btn-primary">
        {pending ? "Verifierar …" : "Verifiera"}
      </button>
    </form>
  );
}
