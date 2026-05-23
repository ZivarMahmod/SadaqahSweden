"use client";

import { useState, useTransition } from "react";
import { registrera } from "../actions";

export function RegistreraForm() {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 grid gap-4"
      action={(formData) => {
        setFel(null);
        startTransition(async () => {
          const res = await registrera(formData);
          if (res && !res.ok) setFel(res.message);
        });
      }}
    >
      <label className="grid gap-1">
        <span className="text-sm font-medium">Visningsnamn</span>
        <input
          name="visningsnamn"
          type="text"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={60}
          className="rounded-md border border-black/20 px-3 py-2"
        />
        <span className="text-xs text-muted-foreground">
          Syns publikt. Använd inte personnummer eller adress.
        </span>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">E-post</span>
        <input
          name="epost"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-black/20 px-3 py-2"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Lösenord</span>
        <input
          name="losenord"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          className="rounded-md border border-black/20 px-3 py-2"
        />
        <span className="text-xs text-muted-foreground">
          Minst 10 tecken. Läckta lösenord avvisas (HIBP-check).
        </span>
      </label>

      {fel && (
        <p role="alert" className="text-sm text-red-700">
          {fel}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Skapar konto…" : "Skapa konto"}
      </button>
    </form>
  );
}
