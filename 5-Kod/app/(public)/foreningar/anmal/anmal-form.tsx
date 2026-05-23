// Modul M10 — Klient-form: anmäl förening (M10 B2.2 — 13 fält, 5 frivilliga).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { anmalForening, type Resultat } from "./actions";

const TYPER = [
  "Moské / böneplats",
  "Islamiskt center / församling",
  "Studie- eller utbildningsförening",
  "Hjälp- / biståndsorganisation",
  "Ungdoms- eller kvinnoförening",
  "Begravnings- / janazah-förening",
  "Övrig muslimsk förening",
] as const;

const REGIONER = [
  "Blekinge", "Dalarna", "Gotland", "Gävleborg", "Halland", "Jämtland",
  "Jönköping", "Kalmar", "Kronoberg", "Norrbotten", "Skåne", "Stockholm",
  "Södermanland", "Uppsala", "Värmland", "Västerbotten", "Västernorrland",
  "Västmanland", "Västra Götaland", "Örebro", "Östergötland",
] as const;

export function AnmalForeningForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();
  const [beskrivning, setBeskrivning] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await anmalForening(fd);
          setFeedback(r);
          if (r.ok) router.push("/konto/foreningar");
        });
      }}
      className="flex flex-col gap-5"
    >
      <Field label="Föreningens namn" htmlFor="namn" required>
        <Input id="namn" name="namn" required maxLength={100} />
      </Field>
      <Field
        label="Organisationsnummer"
        htmlFor="org_nummer"
        help="NNNNNN-NNNN. Lämna tomt om föreningen ännu inte har — då verifieras ni via kontaktväg."
      >
        <Input id="org_nummer" name="org_nummer" placeholder="802000-1234" />
      </Field>
      <Field label="Typ av organisation" htmlFor="organisationstyp" required>
        <Select id="organisationstyp" name="organisationstyp" required defaultValue="">
          <option value="" disabled>Välj typ…</option>
          {TYPER.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stad" htmlFor="stad" required>
          <Input id="stad" name="stad" required />
        </Field>
        <Field label="Region / län" htmlFor="region" required>
          <Select id="region" name="region" required defaultValue="">
            <option value="" disabled>Välj region…</option>
            {REGIONER.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Besöksadress" htmlFor="besoksadress" help="Valfritt. Visas publikt för moskéer som vill kunna besökas.">
        <Input id="besoksadress" name="besoksadress" />
      </Field>
      <Field
        label="Kort beskrivning"
        htmlFor="beskrivning"
        required
        help={`${beskrivning.length} / 300 tecken. Vad föreningen är och gör.`}
      >
        <Textarea
          id="beskrivning"
          name="beskrivning"
          rows={4}
          required
          minLength={10}
          maxLength={300}
          value={beskrivning}
          onChange={(e) => setBeskrivning(e.target.value)}
        />
      </Field>
      <Field
        label="Logotyp / bild — URL"
        htmlFor="logotyp_url"
        help="Tillfälligt: fullständig URL. Storage-upload kommer senare."
      >
        <Input id="logotyp_url" name="logotyp_url" type="url" placeholder="https://…" />
      </Field>

      <fieldset
        className="rounded-[14px] border p-4"
        style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper)" }}
      >
        <legend className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.08em", color: "var(--color-ink-3)" }}>
          Bekräftelse
        </legend>
        <label className="mt-3 flex items-start gap-3">
          <input type="checkbox" name="muslimsk" className="mt-1" required />
          <span className="text-sm">
            Vi bekräftar att föreningen är en muslimsk förening/moské som tjänar
            det muslimska samhället. Plattformen tar inte sida mellan inriktningar.
          </span>
        </label>
      </fieldset>

      {feedback && !feedback.ok && <Alert tone="danger">{feedback.message}</Alert>}
      {feedback && feedback.ok && <Alert tone="success">Ansökan skickad — vi hör av oss.</Alert>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Skickar…" : "Skicka anmälan"}
        </Button>
      </div>
    </form>
  );
}
