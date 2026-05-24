"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifieraOchAktiveraTotp } from "./actions";

export function Setup2faForm({ klar }: { klar: boolean }) {
  const router = useRouter();
  const [kod, setKod] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [ok, setOk] = useState(klar);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFel(null);
    start(async () => {
      const res = await verifieraOchAktiveraTotp(kod);
      if (!res.ok) {
        setFel(res.fel);
      } else {
        setOk(true);
        router.refresh();
      }
    });
  }

  if (ok) {
    return (
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
          TOTP aktiverad ✓
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
          Du kan nu använda team-verktygen i arbetsytan.
        </p>
        <a href="/admin" className="btn btn-primary btn-sm mt-4 inline-flex">Till arbetsytan</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="field-label" htmlFor="totp_kod">6-siffrig kod från Authenticator-appen</label>
      <input
        id="totp_kod"
        name="kod"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={kod}
        onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="input"
        placeholder="123456"
        autoComplete="one-time-code"
      />
      {fel && <p className="field-error">{fel}</p>}
      <button type="submit" disabled={pending || kod.length !== 6} className="btn btn-primary">
        {pending ? "Verifierar …" : "Verifiera & aktivera"}
      </button>
    </form>
  );
}
