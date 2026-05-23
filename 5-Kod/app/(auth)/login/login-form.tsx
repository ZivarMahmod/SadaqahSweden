// Modul M6 — Login-formulär (client component för useTransition).
"use client";

import { useState, useTransition } from "react";
import { loggaIn } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function LoginForm() {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 flex flex-col gap-4"
      action={(formData) => {
        setFel(null);
        startTransition(async () => {
          const res = await loggaIn(formData);
          if (res && !res.ok) setFel(res.message);
        });
      }}
    >
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

      <Field label="Lösenord" htmlFor="losenord" required>
        <Input
          id="losenord"
          name="losenord"
          type="password"
          autoComplete="current-password"
          required
          minLength={10}
        />
      </Field>

      {fel && <Alert tone="danger" role="alert">{fel}</Alert>}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Loggar in…" : "Logga in"}
      </Button>
    </form>
  );
}
