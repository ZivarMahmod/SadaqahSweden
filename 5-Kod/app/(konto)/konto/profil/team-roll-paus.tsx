// F7: paus/återuppta team-roll. Visas bara för team-konton (granskare/admin).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pausaAction, aterstallAction } from "./team-roll-actions";
import { Field, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

export function TeamRollPaus({
  arPausad,
  pausadSkal,
  pausadAt,
}: {
  arPausad: boolean;
  pausadSkal: string | null;
  pausadAt: string | null;
}) {
  const router = useRouter();
  const [skal, setSkal] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pausa() {
    if (skal.trim().length < 3) {
      setFel("Skäl krävs (minst 3 tecken).");
      return;
    }
    if (!confirm("Pausa din team-roll? Du agerar som vanlig insamlare tills du återupptar.")) return;
    setFel(null);
    start(async () => {
      const r = await pausaAction(skal.trim());
      if (r.ok) router.refresh();
      else setFel(r.message);
    });
  }

  function aterstall() {
    if (!confirm("Återuppta din team-roll?")) return;
    setFel(null);
    start(async () => {
      const r = await aterstallAction();
      if (r.ok) router.refresh();
      else setFel(r.message);
    });
  }

  if (arPausad) {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="warning">
          <strong>Team-rollen är pausad.</strong> Du agerar som vanlig insamlare
          tills du återupptar.
          {pausadSkal && (
            <p className="mt-1 text-xs">Skäl: {pausadSkal}</p>
          )}
          {pausadAt && (
            <p className="mt-1 text-xs">Pausad sedan: {new Date(pausadAt).toLocaleString("sv-SE")}</p>
          )}
        </Alert>
        {fel && <Alert tone="danger">{fel}</Alert>}
        <Button type="button" onClick={aterstall} disabled={pending} leftIcon={<Icon name="rotate-ccw" size={14} />}>
          {pending ? "Återupptar…" : "Återuppta team-rollen"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
        Vill du driva en egen insamling? Pausa team-rollen så agerar du som
        vanlig insamlare — kontot raderas aldrig, du återupptar när insamlingen
        är klar.
      </p>
      <Field label="Skäl för paus" htmlFor="skal" help="Minst 3 tecken — för din egen aktivitetslogg.">
        <Textarea
          id="skal"
          rows={2}
          value={skal}
          onChange={(e) => setSkal(e.target.value)}
          maxLength={500}
          placeholder="T.ex. 'Driver insamling X under Q3'"
        />
      </Field>
      {fel && <Alert tone="danger">{fel}</Alert>}
      <Button type="button" variant="secondary" onClick={pausa} disabled={pending} leftIcon={<Icon name="pause" size={14} />}>
        {pending ? "Pausar…" : "Pausa team-rollen"}
      </Button>
    </div>
  );
}
