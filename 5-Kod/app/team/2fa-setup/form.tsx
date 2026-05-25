"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifieraOchAktiveraTotp } from "./actions";

export function Setup2faForm({ factorId }: { factorId: string }) {
  const router = useRouter();
  const [kod, setKod] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFel(null);
    start(async () => {
      const res = await verifieraOchAktiveraTotp(factorId, kod);
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
          MFA aktiverad ✓
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
          Du är nu i en aal2-session och kan använda team-verktygen.
        </p>
        <Link href="/admin" className="btn btn-primary btn-sm mt-4 inline-flex">Till arbetsytan</Link>
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
