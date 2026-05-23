// Modul M10 — Klient-panel: beslutsknappar + motiveringsfält.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { granskaOrganisation, type Resultat } from "./actions";

type Mode = "publicera" | "komplettering" | "avvisa" | "vilande" | null;

export function OrgGranskarPanel({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [motivering, setMotivering] = useState("");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<Resultat | null>(null);

  function kor(beslut: NonNullable<Mode>) {
    start(async () => {
      const r = await granskaOrganisation(orgId, beslut, motivering);
      setFeedback(r);
      if (r.ok) router.push("/granskning/organisationer");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {feedback && !feedback.ok && <Alert tone="danger">{feedback.message}</Alert>}
      {feedback && feedback.ok && <Alert tone="success">Beslut sparat.</Alert>}

      {mode === null && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => kor("publicera")}>
            {pending ? "Sparar…" : "Publicera"}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setMode("komplettering")}>
            Begär komplettering
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setMode("avvisa")}>
            Avvisa
          </Button>
        </div>
      )}

      {mode && mode !== "publicera" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            kor(mode);
          }}
        >
          <Field
            label={mode === "komplettering" ? "Vad ska kompletteras?" : "Motivering till avvisning"}
            htmlFor="motivering"
            help="Minst 10 tecken. Föreningen får detta som notis."
          >
            <Textarea
              id="motivering"
              rows={4}
              required
              minLength={10}
              value={motivering}
              onChange={(e) => setMotivering(e.target.value)}
            />
          </Field>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={pending || motivering.trim().length < 10}>
              {pending ? "Sparar…" : "Bekräfta"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode(null)}>
              Avbryt
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
