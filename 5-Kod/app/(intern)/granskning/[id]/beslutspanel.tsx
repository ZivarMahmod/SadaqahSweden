// Modul M3 — Beslutspanel (client component).
// Tre beslut: godkänn / begär ändring / avvisa. Motivering krävs vid negativa
// beslut (>= 10 tecken — validerat också serverside i RPC).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fattaBeslut, sparaAnteckningar, tilldelaTillMig } from "../actions";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

type Beslut = "godkann" | "begar_andring" | "avvisa";

const BESLUTSALTERNATIV: { value: Beslut; label: string; tone: "primary" | "copper" | "danger"; help: string }[] = [
  {
    value: "begar_andring",
    label: "Begär ändring",
    tone: "copper",
    help: "Mest framträdande val — de flesta insamlingar är ofullständiga, inte fejk. Insamlaren får ändra och skicka in igen.",
  },
  {
    value: "godkann",
    label: "Godkänn & publicera",
    tone: "primary",
    help: "Insamlingen blir aktiv direkt. Insamlingsdeadline börjar räknas. Motivering frivillig.",
  },
  {
    value: "avvisa",
    label: "Avvisa",
    tone: "danger",
    help: "Slutpunkt. Reserverat för ändamål som krockar med islam eller plattformens scope. Insamlaren kan skapa nytt projekt.",
  },
];

export function BeslutsPanel({
  granskningId,
  avgjort,
  ar_mitt_arende,
  start_anteckningar,
}: {
  granskningId: string;
  avgjort: boolean;
  ar_mitt_arende: boolean;
  start_anteckningar: string;
}) {
  const router = useRouter();
  const [valt, setValt] = useState<Beslut | null>(null);
  const [motivering, setMotivering] = useState("");
  const [anteckningar, setAnteckningar] = useState(start_anteckningar);
  const [fel, setFel] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (avgjort) {
    return (
      <Card variant="tight">
        <h3 className="h-3">Ärendet är avgjort</h3>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
          Beslut är fattat och kan inte ändras (append-only-loggning enligt M3 Block 3.4). Vid
          felaktigt beslut: kontakta admin för manuell åtgärd.
        </p>
      </Card>
    );
  }

  function plockaUpp() {
    setFel(null);
    setOk(null);
    startTransition(async () => {
      const res = await tilldelaTillMig(granskningId);
      if (res.ok) {
        router.refresh();
      } else {
        setFel(res.message);
      }
    });
  }

  function sparaAnt() {
    setFel(null);
    setOk(null);
    startTransition(async () => {
      const res = await sparaAnteckningar(granskningId, anteckningar);
      if (res.ok) setOk("Anteckningar sparade.");
      else setFel(res.message);
    });
  }

  function fattaValtBeslut(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valt) {
      setFel("Välj ett beslut först.");
      return;
    }
    if ((valt === "begar_andring" || valt === "avvisa") && motivering.trim().length < 10) {
      setFel("Motivering krävs (minst 10 tecken) för begär ändring och avvisa.");
      return;
    }
    const bekraftelse =
      valt === "godkann"
        ? "Godkänn och publicera insamlingen?"
        : valt === "begar_andring"
        ? "Skicka tillbaka med ändringsbegäran? Insamlaren får din motivering i klartext."
        : "Avvisa insamlingen? Detta är en slutpunkt — kan inte ångras utan admin.";
    if (!confirm(bekraftelse)) return;
    setFel(null);
    setOk(null);
    startTransition(async () => {
      const res = await fattaBeslut(granskningId, valt, motivering.trim() || "");
      if (res.ok) {
        router.push("/granskning");
      } else {
        setFel(res.message);
      }
    });
  }

  return (
    <Card>
      <h3 className="h-3">Fatta beslut</h3>

      {!ar_mitt_arende && (
        <div
          className="mt-4 rounded-md border p-3 text-sm"
          style={{
            borderColor: "rgba(184,132,62,0.3)",
            background: "var(--color-copper-soft)",
            color: "var(--color-copper-deep)",
          }}
          role="status"
        >
          Ärendet är inte tilldelat dig. Ta upp det först — då tar du över ansvaret.
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="copper"
              onClick={plockaUpp}
              disabled={pending}
              leftIcon={<Icon name="plus" size={14} />}
            >
              Ta upp ärendet
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={fattaValtBeslut} className="mt-5 flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="field-label">Vilket beslut?</legend>
          {BESLUTSALTERNATIV.map((a) => (
            <label
              key={a.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all"
              style={{
                borderColor: valt === a.value ? "var(--color-forest)" : "var(--color-ink-line)",
                background:
                  valt === a.value ? "var(--color-forest-soft)" : "var(--color-paper-soft)",
              }}
            >
              <input
                type="radio"
                name="beslut"
                value={a.value}
                checked={valt === a.value}
                onChange={() => setValt(a.value)}
                style={{ width: 18, height: 18, accentColor: "var(--color-forest)", marginTop: 2 }}
              />
              <div>
                <div className="text-sm font-semibold">{a.label}</div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                  {a.help}
                </p>
              </div>
            </label>
          ))}
        </fieldset>

        <Field
          label="Motivering till insamlaren"
          htmlFor="motivering"
          help={
            valt === "godkann"
              ? "Frivillig vid godkännande — kan kort förklara om du justerat något."
              : "Krävs vid Begär ändring och Avvisa (minst 10 tecken). Var konkret och utbildande — hjälper insamlaren förstå."
          }
        >
          <Textarea
            id="motivering"
            value={motivering}
            onChange={(e) => setMotivering(e.target.value)}
            rows={5}
            placeholder="Skriv en konkret motivering — hänvisa vid policyskäl till M8-regeln."
            maxLength={5000}
          />
        </Field>

        {fel && (
          <Alert tone="danger" role="alert" title="Kunde inte fatta beslut">
            {fel}
          </Alert>
        )}

        <Button
          type="submit"
          variant={
            valt === "avvisa" ? "danger" : valt === "begar_andring" ? "copper" : "primary"
          }
          disabled={pending || !valt || !ar_mitt_arende}
          rightIcon={<Icon name="arrow-right" size={16} />}
        >
          {pending ? "Skickar…" : "Skicka beslut"}
        </Button>
        {!ar_mitt_arende && (
          <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
            Plocka upp ärendet ovan för att kunna fatta beslut.
          </p>
        )}
      </form>

      <div
        className="mt-8 pt-6"
        style={{ borderTop: "1px solid var(--color-ink-line)" }}
      >
        <h4 className="text-sm font-semibold" style={{ color: "var(--color-ink-1)" }}>
          Interna anteckningar
        </h4>
        <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
          Synliga för granskare och admin — aldrig för insamlaren. Tänk fritt här.
        </p>
        <Textarea
          className="mt-3"
          value={anteckningar}
          onChange={(e) => setAnteckningar(e.target.value)}
          rows={4}
          placeholder='T.ex. "Ringt och bekräftat med insamlaren", "Liknar ärende X som vi avvisade i mars".'
        />
        {ok && (
          <Alert tone="success" role="status">
            {ok}
          </Alert>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={sparaAnt}
          disabled={pending}
        >
          Spara anteckningar
        </Button>
      </div>
    </Card>
  );
}
