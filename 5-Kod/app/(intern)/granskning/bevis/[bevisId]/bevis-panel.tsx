// Modul M7 — Klient-form för godkänn/avvisa resultat-bevis.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { godkannResultatBevis, avvisaResultatBevis } from "../../actions";

type Resultat = { ok: true } | { ok: false; message: string };

export function BevisPanel({ bevisId }: { bevisId: string }) {
  const router = useRouter();
  const [motivering, setMotivering] = useState("");
  const [feedback, setFeedback] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"idle" | "avvisa">("idle");

  return (
    <div className="flex flex-col gap-4">
      {feedback && !feedback.ok && (
        <Alert tone="danger">{feedback.message}</Alert>
      )}
      {feedback && feedback.ok && (
        <Alert tone="success">Beslut sparat — kön uppdaterad.</Alert>
      )}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending}
            onClick={() => {
              start(async () => {
                const r = await godkannResultatBevis(bevisId);
                setFeedback(r);
                if (r.ok) router.push("/granskning/bevis");
              });
            }}
          >
            {pending ? "Sparar…" : "Godkänn — lättviktig kontroll OK"}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setMode("avvisa")}>
            Avvisa
          </Button>
        </div>
      )}

      {mode === "avvisa" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await avvisaResultatBevis(bevisId, motivering);
              setFeedback(r);
              if (r.ok) router.push("/granskning/bevis");
            });
          }}
        >
          <Field
            label="Motivering till avvisning"
            htmlFor="motivering"
            help="Minst 10 tecken. Insamlaren ser detta indirekt via insamling_andringslogg och kan posta ett nytt bevis."
          >
            <Textarea
              id="motivering"
              rows={4}
              required
              minLength={10}
              value={motivering}
              onChange={(e) => setMotivering(e.target.value)}
              placeholder="Stockbild från Google — saknar koppling till den faktiska leveransen."
            />
          </Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={pending || motivering.trim().length < 10}>
              {pending ? "Avvisar…" : "Bekräfta avvisning"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
              Avbryt
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
