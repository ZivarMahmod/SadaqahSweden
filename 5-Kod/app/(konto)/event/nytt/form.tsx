"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skapaEventAction, skickaEventForGranskning } from "../actions";

type Org = { id: string; namn: string };

export function NyttEventForm({
  orgs,
  typOptions,
}: {
  orgs: Org[];
  typOptions: [string, string][];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fel, setFel] = useState<string | null>(null);
  const [platsTyp, setPlatsTyp] = useState<"fysisk" | "digital">("fysisk");
  const [aterkommande, setAterkommande] = useState(false);

  function submit(data: FormData) {
    setFel(null);
    start(async () => {
      const res = await skapaEventAction(data);
      if (!res.ok) {
        setFel(res.fel);
        return;
      }
      // Skicka direkt för granskning så arrangören slipper extra knapp.
      if (res.id) {
        const r2 = await skickaEventForGranskning(res.id);
        if (!r2.ok) {
          setFel(`Event skapat men kunde inte skickas: ${r2.fel}. Gå till mina events.`);
          router.push("/konto/event");
          return;
        }
      }
      router.push("/konto/event");
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      {orgs.length > 0 && (
        <div>
          <label className="field-label" htmlFor="arrangor_org_id">Arrangerar som</label>
          <select id="arrangor_org_id" name="arrangor_org_id" className="select" defaultValue="">
            <option value="">Privatperson (jag själv)</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.namn} (förening)</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="field-label field-label-required" htmlFor="titel">Titel</label>
          <input id="titel" name="titel" required maxLength={80} className="input" />
        </div>
        <div>
          <label className="field-label field-label-required" htmlFor="typ">Typ</label>
          <select id="typ" name="typ" required className="select" defaultValue="forelasning">
            {typOptions.map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="kostnad">Kostnad</label>
          <input id="kostnad" name="kostnad" placeholder="Gratis / 50 kr vid dörren" className="input" />
        </div>
      </div>

      <div>
        <label className="field-label field-label-required" htmlFor="beskrivning">Beskrivning</label>
        <textarea id="beskrivning" name="beskrivning" required maxLength={2000} rows={5} className="textarea" />
        <p className="field-help mt-1">Max 2000 tecken. Håll det snabbläst.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label field-label-required" htmlFor="start_at">Starttid</label>
          <input id="start_at" name="start_at" type="datetime-local" required className="input" />
        </div>
        <div>
          <label className="field-label" htmlFor="slut_at">Sluttid (frivilligt)</label>
          <input id="slut_at" name="slut_at" type="datetime-local" className="input" />
        </div>
      </div>

      <div className="rounded-md p-4" style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={aterkommande}
            onChange={(e) => setAterkommande(e.target.checked)}
          />
          <span className="text-sm font-medium">Återkommande event</span>
        </label>
        {aterkommande && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="upprepning">Mönster</label>
              <select id="upprepning" name="upprepning" className="select" defaultValue="vecka">
                <option value="vecka">Varje vecka</option>
                <option value="manad">Varje månad</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="upprepning_veckodag">Veckodag (0=sön)</label>
              <input id="upprepning_veckodag" name="upprepning_veckodag" type="number" min={0} max={6} defaultValue={5} className="input" />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md p-4" style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}>
        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="plats_typ"
              value="fysisk"
              checked={platsTyp === "fysisk"}
              onChange={() => setPlatsTyp("fysisk")}
            />
            <span className="text-sm font-medium">Fysisk plats</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="plats_typ"
              value="digital"
              checked={platsTyp === "digital"}
              onChange={() => setPlatsTyp("digital")}
            />
            <span className="text-sm font-medium">Digitalt</span>
          </label>
        </div>
        {platsTyp === "fysisk" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="plats_namn">Platsnamn</label>
              <input id="plats_namn" name="plats_namn" placeholder="Stockholms moské" className="input" />
            </div>
            <div>
              <label className="field-label" htmlFor="plats_stad">Stad</label>
              <input id="plats_stad" name="plats_stad" placeholder="Stockholm" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="plats_adress">Adress (frivilligt)</label>
              <input id="plats_adress" name="plats_adress" className="input" />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <label className="field-label" htmlFor="digital_lank">Länk (Zoom, Meet, YouTube …)</label>
            <input id="digital_lank" name="digital_lank" type="url" className="input" />
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="kontakt_epost">Kontakt-epost</label>
          <input id="kontakt_epost" name="kontakt_epost" type="email" className="input" />
        </div>
        <div>
          <label className="field-label" htmlFor="kontakt_telefon">Kontakttelefon</label>
          <input id="kontakt_telefon" name="kontakt_telefon" type="tel" className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="anmalan_lank">Anmälningslänk (extern, frivilligt)</label>
          <input id="anmalan_lank" name="anmalan_lank" type="url" placeholder="https://…" className="input" />
        </div>
      </div>

      {fel && <p className="field-error">{fel}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Skickar …" : "Skapa & skicka för granskning"}
      </button>
      <p className="field-help">
        Föreningar med tre rena event publiceras direkt (med stickprov). Privatpersoner granskas alltid.
      </p>
    </form>
  );
}
