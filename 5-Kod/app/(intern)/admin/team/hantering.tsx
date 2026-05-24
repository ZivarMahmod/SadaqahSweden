"use client";

import { useState, useTransition } from "react";
import {
  bjudInTeamMedlemAction,
  inaktiveraTeamMedlemAction,
} from "./actions";

export function TeamInviteForm() {
  const [email, setEmail] = useState("");
  const [roll, setRoll] = useState<"granskare" | "admin">("granskare");
  const [noteringar, setNoteringar] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFel(null);
    setToken(null);
    start(async () => {
      const res = await bjudInTeamMedlemAction(email.trim(), roll, noteringar.trim() || null);
      if (!res.ok) {
        setFel(res.fel);
      } else {
        setToken(res.data as string);
        setEmail("");
        setNoteringar("");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="namn@sadaqahsweden.se"
          className="input"
        />
        <select value={roll} onChange={(e) => setRoll(e.target.value as "granskare" | "admin")} className="select">
          <option value="granskare">Granskare</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <input
        type="text"
        value={noteringar}
        onChange={(e) => setNoteringar(e.target.value)}
        placeholder="Anteckningar (frivilligt — t.ex. region)"
        className="input"
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Skapar …" : "Skapa inbjudningslänk"}
        </button>
        {fel && <span className="field-error">{fel}</span>}
      </div>
      {token && (
        <div className="rounded-md p-3" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success)" }}>
          <p className="text-sm" style={{ color: "var(--color-success)" }}>Inbjudan skapad.</p>
          <p className="mt-2 break-all rounded p-2 text-xs" style={{ background: "var(--color-paper)", fontFamily: "var(--font-mono)" }}>
            {typeof window !== "undefined" ? `${window.location.origin}/team/accept-invite/${token}` : `/team/accept-invite/${token}`}
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
            Kopiera URL:en och skicka via en kanal du litar på. Den är giltig 7 dagar och kan bara lösas in en gång.
          </p>
        </div>
      )}
    </form>
  );
}

export function TeamInaktiveraKnapp({ profileId, namn }: { profileId: string; namn: string }) {
  const [pending, start] = useTransition();
  function inaktivera() {
    const motiv = prompt(`Motivering för att inaktivera ${namn}? (minst 5 tecken)`);
    if (!motiv || motiv.trim().length < 5) return;
    start(async () => {
      await inaktiveraTeamMedlemAction(profileId, motiv.trim());
    });
  }
  return (
    <button
      type="button"
      onClick={inaktivera}
      disabled={pending}
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--color-danger)" }}
    >
      {pending ? "…" : "Inaktivera"}
    </button>
  );
}
