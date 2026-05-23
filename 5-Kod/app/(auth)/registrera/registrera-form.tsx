// Modul M6 — Registrerings-formulär (client component för useTransition).
"use client";

import { useState, useTransition } from "react";
import { registrera } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function RegistreraForm() {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 flex flex-col gap-4"
      action={(formData) => {
        setFel(null);
        startTransition(async () => {
          const res = await registrera(formData);
          if (res && !res.ok) setFel(res.message);
        });
      }}
    >
      <Field
        label="Visningsnamn"
        htmlFor="visningsnamn"
        required
        help="Syns publikt. Använd inte personnummer eller adress."
      >
        <Input
          id="visningsnamn"
          name="visningsnamn"
          type="text"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={60}
        />
      </Field>

      <Field label="E-post" htmlFor="epost" required>
        <Input
          id="epost"
          name="epost"
          type="email"
          autoComplete="email"
          required
          placeholder="du@exempel.se"
        />
      </Field>

      <Field
        label="Lösenord"
        htmlFor="losenord"
        required
        help="Minst 10 tecken. Läckta lösenord avvisas (HIBP-check)."
      >
        <Input
          id="losenord"
          name="losenord"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>

      {fel && <Alert tone="danger" role="alert">{fel}</Alert>}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Skapar konto…" : "Skapa konto"}
      </Button>

      <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
        Genom att skapa ett konto godkänner du våra användarvillkor. Vi skickar dig en
        bekräftelselänk på e-post.
      </p>
    </form>
  );
}
