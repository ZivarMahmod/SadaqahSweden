// Modul M2 — Redigera-formulär (client component för useTransition + dynamiska fält).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skickaInForGranskning, uppdateraUtkast } from "../../actions";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

type InsamlingForm = {
  id: string;
  titel: string;
  kort_beskrivning: string;
  lang_beskrivning: string;
  mottagare_typ: string;
  mottagare_beskrivning: string;
  hjalp_land: string;
  hjalp_plats: string | null;
  insamlar_stad: string;
  insamlar_region: string | null;
  malbelopp_modell: "fast" | "intervall" | "oppet";
  malbelopp_ore: number | null;
  malbelopp_min_ore: number | null;
  malbelopp_max_ore: number | null;
  insamling_deadline: string;
  genomforande_datum: string;
  overmalsplan: string | null;
  tillat_overmal: boolean;
};

const MOTTAGARE_TYPER = [
  { value: "ej_angivet", label: "Ej angivet" },
  { value: "enskild_person", label: "Enskild person/familj" },
  { value: "forening", label: "Förening / organisation" },
  { value: "moske", label: "Moské" },
  { value: "byprojekt", label: "Byprojekt / samhälle" },
  { value: "katastrof", label: "Katastrofhjälp (område)" },
  { value: "annat", label: "Annat" },
];

export function RedigeraForm({ insamling }: { insamling: InsamlingForm }) {
  const [model, setModel] = useState(insamling.malbelopp_modell);
  const [tillatOvermal, setTillatOvermal] = useState(insamling.tillat_overmal);
  const [fel, setFel] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function spara(formData: FormData) {
    setFel(null);
    setOk(null);
    startTransition(async () => {
      const res = await uppdateraUtkast(insamling.id, formData);
      if (res.ok) setOk("Utkast sparat.");
      else setFel(res.message);
    });
  }

  function skickaIn() {
    setFel(null);
    setOk(null);
    if (
      !confirm(
        "Skicka insamlingen till granskning? Du kan inte redigera fritt efter inskickning.",
      )
    )
      return;
    startTransition(async () => {
      const res = await skickaInForGranskning(insamling.id);
      if (res.ok) {
        router.push("/insamling");
      } else {
        setFel(res.message);
      }
    });
  }

  return (
    <form action={spara} className="mt-10 flex flex-col gap-6">
      <Card>
        <h2 className="heading-3">Innehåll</h2>
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Titel" htmlFor="titel" required help="Max 80 tecken — vad insamlingen heter publikt.">
            <Input
              id="titel"
              name="titel"
              defaultValue={insamling.titel}
              required
              minLength={3}
              maxLength={80}
            />
          </Field>
          <Field
            label="Kort beskrivning"
            htmlFor="kort_beskrivning"
            required
            help="Max 200 tecken — visas i kort och i delningslänkar."
          >
            <Input
              id="kort_beskrivning"
              name="kort_beskrivning"
              defaultValue={insamling.kort_beskrivning}
              required
              minLength={10}
              maxLength={200}
            />
          </Field>
          <Field
            label="Lång beskrivning"
            htmlFor="lang_beskrivning"
            required
            help="Min 50, max 5 000 tecken — visas på insamlings-sidan."
          >
            <Textarea
              id="lang_beskrivning"
              name="lang_beskrivning"
              defaultValue={insamling.lang_beskrivning}
              required
              minLength={50}
              maxLength={5000}
              rows={6}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="heading-3">Mottagare</h2>
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Mottagar-typ" htmlFor="mottagare_typ" required>
            <Select
              id="mottagare_typ"
              name="mottagare_typ"
              defaultValue={insamling.mottagare_typ}
              required
            >
              {MOTTAGARE_TYPER.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Beskriv mottagaren"
            htmlFor="mottagare_beskrivning"
            required
            help="Max 500 tecken. Var konkret — vem får hjälpen?"
          >
            <Textarea
              id="mottagare_beskrivning"
              name="mottagare_beskrivning"
              defaultValue={insamling.mottagare_beskrivning}
              required
              maxLength={500}
              rows={4}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="heading-3">Plats</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Land där hjälpen landar" htmlFor="hjalp_land" required>
            <Input id="hjalp_land" name="hjalp_land" defaultValue={insamling.hjalp_land} required />
          </Field>
          <Field label="Specifik plats (frivilligt)" htmlFor="hjalp_plats">
            <Input id="hjalp_plats" name="hjalp_plats" defaultValue={insamling.hjalp_plats ?? ""} />
          </Field>
          <Field label="Din stad" htmlFor="insamlar_stad" required>
            <Input
              id="insamlar_stad"
              name="insamlar_stad"
              defaultValue={insamling.insamlar_stad}
              required
            />
          </Field>
          <Field label="Region (frivilligt)" htmlFor="insamlar_region">
            <Input
              id="insamlar_region"
              name="insamlar_region"
              defaultValue={insamling.insamlar_region ?? ""}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="heading-3">Mål & tid</h2>
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Målbelopps-modell" htmlFor="malbelopp_modell" required>
            <Select
              id="malbelopp_modell"
              name="malbelopp_modell"
              value={model}
              onChange={(e) => setModel(e.target.value as InsamlingForm["malbelopp_modell"])}
            >
              <option value="fast">Fast belopp</option>
              <option value="intervall">Intervall (min–max)</option>
              <option value="oppet">Öppet (ingen specifik summa)</option>
            </Select>
          </Field>

          {model === "fast" && (
            <Field
              label="Målbelopp (öre)"
              htmlFor="malbelopp_ore"
              required
              help="100 kr = 10000 öre. Pengar lagras alltid som heltal öre."
            >
              <Input
                id="malbelopp_ore"
                name="malbelopp_ore"
                type="number"
                min={1}
                defaultValue={insamling.malbelopp_ore ?? ""}
              />
            </Field>
          )}
          {model === "intervall" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Min (öre)" htmlFor="malbelopp_min_ore" required>
                <Input
                  id="malbelopp_min_ore"
                  name="malbelopp_min_ore"
                  type="number"
                  min={1}
                  defaultValue={insamling.malbelopp_min_ore ?? ""}
                />
              </Field>
              <Field label="Max (öre)" htmlFor="malbelopp_max_ore" required>
                <Input
                  id="malbelopp_max_ore"
                  name="malbelopp_max_ore"
                  type="number"
                  min={1}
                  defaultValue={insamling.malbelopp_max_ore ?? ""}
                />
              </Field>
            </div>
          )}
          {model === "oppet" && (
            <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
              Öppen insamling — inget specifikt målbelopp visas publikt.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline för insamling" htmlFor="insamling_deadline" required>
              <Input
                id="insamling_deadline"
                name="insamling_deadline"
                type="date"
                required
                defaultValue={insamling.insamling_deadline.slice(0, 10)}
              />
            </Field>
            <Field label="Senast genomförd" htmlFor="genomforande_datum" required>
              <Input
                id="genomforande_datum"
                name="genomforande_datum"
                type="date"
                required
                defaultValue={insamling.genomforande_datum}
              />
            </Field>
          </div>

          <label
            className="flex items-center gap-3 rounded-xl border p-4 transition-all"
            style={{
              borderColor: tillatOvermal ? "var(--color-forest)" : "var(--color-ink-line)",
              background: tillatOvermal ? "var(--color-forest-soft)" : "var(--color-paper-soft)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="tillat_overmal"
              defaultChecked={insamling.tillat_overmal}
              onChange={(e) => setTillatOvermal(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--color-forest)" }}
            />
            <span className="text-sm">
              <strong>Tillåt övermål</strong> — beskriv nedan vad extra medel går till.
            </span>
          </label>

          {tillatOvermal && (
            <Field
              label="Övermålsplan"
              htmlFor="overmalsplan"
              required
              help="Krävs om övermål är tillåtet — annars vet inte givaren vart extra pengar går."
            >
              <Textarea
                id="overmalsplan"
                name="overmalsplan"
                defaultValue={insamling.overmalsplan ?? ""}
                rows={3}
              />
            </Field>
          )}
        </div>
      </Card>

      {fel && (
        <Alert tone="danger" role="alert" title="Något gick fel">
          {fel}
        </Alert>
      )}
      {ok && <Alert tone="success" role="status">{ok}</Alert>}

      <div
        className="sticky bottom-4 z-10 mx-auto flex w-full flex-wrap items-center justify-between gap-3 rounded-[20px] border p-4 shadow-3"
        style={{
          background: "var(--color-paper-soft)",
          borderColor: "var(--color-ink-line)",
          boxShadow: "var(--shadow-3)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
          Pengar lagras alltid som heltal öre · Status styrs serverside (DB-tillståndsmaskin).
        </p>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} leftIcon={<Icon name="check" size={16} />}>
            {pending ? "Sparar…" : "Spara utkast"}
          </Button>
          <Button
            type="button"
            variant="copper"
            onClick={skickaIn}
            disabled={pending}
            rightIcon={<Icon name="arrow-right" size={16} />}
          >
            Skicka till granskning
          </Button>
        </div>
      </div>
    </form>
  );
}
