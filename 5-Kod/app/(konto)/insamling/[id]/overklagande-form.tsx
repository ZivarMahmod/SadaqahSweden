// F3 — Överklagande-form. Visas på avvisad insamling om ingen överklagan finns.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lamnaOverklagandeAction } from "./overklagande-actions";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

export function OverklagandeForm({ insamlingId }: { insamlingId: string }) {
  const router = useRouter();
  const [skal, setSkal] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (skal.trim().length < 20) {
      setFel("Skäl krävs (minst 20 tecken).");
      return;
    }
    setFel(null);
    startTransition(async () => {
      const res = await lamnaOverklagandeAction(insamlingId, skal.trim());
      if (res.ok) {
        setOk(true);
        router.refresh();
      } else {
        setFel(res.message);
      }
    });
  }

  if (ok) {
    return (
      <Card>
        <Alert tone="success">
          <strong>Överklagande inlämnat.</strong> Superadmin granskar och hör av sig.
        </Alert>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Icon name="flag" size={18} />
        <h2 className="h-3">Överklaga avslaget</h2>
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
        Tycker du att avslaget är fel? Du kan överklaga <strong>en gång</strong>
        — direkt till superadmin (inte tillbaka till samma granskare). Var
        konkret om vad du tror granskaren missade eller missförstod.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <Field label="Skäl för överklagande" htmlFor="skal" help="Minst 20 tecken.">
          <Textarea
            id="skal"
            value={skal}
            onChange={(e) => setSkal(e.target.value)}
            rows={6}
            maxLength={5000}
            placeholder="Förklara varför du tycker beslutet bör rivas upp."
          />
        </Field>
        {fel && <Alert tone="danger" role="alert">{fel}</Alert>}
        <Button type="submit" variant="copper" disabled={pending} rightIcon={<Icon name="arrow-right" size={14} />}>
          {pending ? "Skickar…" : "Skicka överklagande"}
        </Button>
      </form>
    </Card>
  );
}
