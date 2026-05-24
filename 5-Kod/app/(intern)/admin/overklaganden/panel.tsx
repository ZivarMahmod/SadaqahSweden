"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { avgorOverklagandeAction } from "./actions";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Field, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";

type Overklagande = {
  id: string;
  insamling_id: string;
  skal: string;
  created_at: string;
  insamling: {
    public_id: string;
    titel: string;
    status: string;
    insamlar_lan_kod: string | null;
    profiles: { visningsnamn: string } | null;
  } | null;
};

export function OverklagandePanel({ o }: { o: Overklagande }) {
  const router = useRouter();
  const [motivering, setMotivering] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function avgor(rivUpp: boolean) {
    if (motivering.trim().length < 10) {
      setFel("Motivering krävs (minst 10 tecken).");
      return;
    }
    const bekraft = rivUpp
      ? "Riv upp avslaget? Insamlingen återgår till granskning (ny runda)."
      : "Bekräfta avslaget? Överklagande markeras som avgjort.";
    if (!confirm(bekraft)) return;
    setFel(null);
    startTransition(async () => {
      const res = await avgorOverklagandeAction(o.id, rivUpp, motivering.trim());
      if (res.ok) {
        router.refresh();
      } else {
        setFel(res.message);
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="copper">Inkommit</Pill>
        <span className="text-sm font-semibold">{o.insamling?.titel ?? "(saknas)"}</span>
        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
          Insamlare: {o.insamling?.profiles?.visningsnamn ?? "okänd"} · Region:{" "}
          {o.insamling?.insamlar_lan_kod ?? "—"} · Inkom {datum(o.created_at)}
        </span>
      </div>

      <h4 className="mt-4 text-sm font-semibold">Insamlarens skäl</h4>
      <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: "var(--color-ink-2)" }}>
        {o.skal}
      </p>

      <div className="mt-6">
        <Field label="Din motivering" htmlFor={`m-${o.id}`} help="Minst 10 tecken. Loggas i admin_ingreppslogg.">
          <Textarea
            id={`m-${o.id}`}
            value={motivering}
            onChange={(e) => setMotivering(e.target.value)}
            rows={3}
            maxLength={5000}
          />
        </Field>
      </div>

      {fel && (
        <div className="mt-3">
          <Alert tone="danger" role="alert">{fel}</Alert>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={() => avgor(true)}
          disabled={pending}
          leftIcon={<Icon name="rotate-ccw" size={14} />}
        >
          Riv upp & ny granskning
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => avgor(false)}
          disabled={pending}
          leftIcon={<Icon name="check" size={14} />}
        >
          Bekräfta avslaget
        </Button>
      </div>
    </Card>
  );
}
