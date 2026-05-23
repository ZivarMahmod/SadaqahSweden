"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skickaInForGranskning, uppdateraUtkast } from "../../actions";

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

export function RedigeraForm({ insamling }: { insamling: InsamlingForm }) {
  const [model, setModel] = useState(insamling.malbelopp_modell);
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
    if (!confirm("Skicka insamlingen till granskning? Du kan inte ändra fritt efter inskickning."))
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
    <form action={spara} className="mt-10 grid gap-8">
      <Section title="Innehåll">
        <Field name="titel" label="Titel" defaultValue={insamling.titel} required minLength={3} maxLength={80} />
        <Field
          name="kort_beskrivning"
          label="Kort beskrivning (max 200 tecken)"
          defaultValue={insamling.kort_beskrivning}
          required
          minLength={10}
          maxLength={200}
        />
        <Field
          name="lang_beskrivning"
          label="Lång beskrivning (max 5000 tecken)"
          defaultValue={insamling.lang_beskrivning}
          textarea
          required
          minLength={50}
          maxLength={5000}
        />
      </Section>

      <Section title="Mottagare">
        <Field
          name="mottagare_typ"
          label="Mottagartyp"
          defaultValue={insamling.mottagare_typ}
          required
        />
        <Field
          name="mottagare_beskrivning"
          label="Vem är mottagaren? (max 500 tecken)"
          defaultValue={insamling.mottagare_beskrivning}
          textarea
          required
          maxLength={500}
        />
      </Section>

      <Section title="Plats">
        <div className="grid grid-cols-2 gap-3">
          <Field name="hjalp_land" label="Land där hjälpen landar" defaultValue={insamling.hjalp_land} required />
          <Field name="hjalp_plats" label="Specifik plats (frivillig)" defaultValue={insamling.hjalp_plats ?? ""} />
          <Field name="insamlar_stad" label="Din stad" defaultValue={insamling.insamlar_stad} required />
          <Field name="insamlar_region" label="Region (frivillig)" defaultValue={insamling.insamlar_region ?? ""} />
        </div>
      </Section>

      <Section title="Mål & tid">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Målbelopps-modell</span>
          <select
            name="malbelopp_modell"
            value={model}
            onChange={(e) => setModel(e.target.value as typeof model)}
            className="rounded-md border border-black/20 px-3 py-2"
          >
            <option value="fast">Fast belopp</option>
            <option value="intervall">Intervall (min–max)</option>
            <option value="oppet">Öppet (ingen specifik summa)</option>
          </select>
        </label>

        {model === "fast" && (
          <Field
            name="malbelopp_ore"
            label="Målbelopp (öre — 100 kr = 10000)"
            defaultValue={String(insamling.malbelopp_ore ?? "")}
            type="number"
            min={1}
          />
        )}
        {model === "intervall" && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              name="malbelopp_min_ore"
              label="Min (öre)"
              defaultValue={String(insamling.malbelopp_min_ore ?? "")}
              type="number"
              min={1}
            />
            <Field
              name="malbelopp_max_ore"
              label="Max (öre)"
              defaultValue={String(insamling.malbelopp_max_ore ?? "")}
              type="number"
              min={1}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field
            name="insamling_deadline"
            label="Deadline för insamling"
            defaultValue={insamling.insamling_deadline.slice(0, 10)}
            type="date"
            required
          />
          <Field
            name="genomforande_datum"
            label="Genomförande-datum"
            defaultValue={insamling.genomforande_datum}
            type="date"
            required
          />
        </div>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="tillat_overmal" defaultChecked={insamling.tillat_overmal} />
          <span>Tillåt övermål (kräver att du beskriver vad extra medel går till nedan)</span>
        </label>
        <Field
          name="overmalsplan"
          label="Övermålsplan (krävs om övermål tillåts)"
          defaultValue={insamling.overmalsplan ?? ""}
          textarea
        />
      </Section>

      {fel && (
        <p role="alert" className="text-sm text-red-700">
          {fel}
        </p>
      )}
      {ok && <p className="text-sm text-green-700">{ok}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Sparar…" : "Spara utkast"}
        </button>
        <button
          type="button"
          onClick={skickaIn}
          disabled={pending}
          className="rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-50"
        >
          Skicka till granskning
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

type FieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  type?: string;
  textarea?: boolean;
};

function Field({ name, label, defaultValue, textarea, ...rest }: FieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={4}
          className="rounded-md border border-black/20 px-3 py-2"
          {...rest}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          className="rounded-md border border-black/20 px-3 py-2"
          {...rest}
        />
      )}
    </label>
  );
}
