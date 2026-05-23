// Modul M15 — Klient-form för notispreferenser (per grupp).
"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { uppdateraPref, type Resultat } from "../notiser/actions";

type Grupp = "mina_insamlingar" | "stottat" | "community" | "upptack";
type PrefRad = {
  grupp: Grupp;
  in_app: boolean;
  epost: boolean;
};

const LABELS: Record<Grupp, { titel: string; beskrivning: string }> = {
  mina_insamlingar: {
    titel: "Mina insamlingar",
    beskrivning: "Granskningsbeslut, nya donationer, utbetalningar och badges på dina egna insamlingar.",
  },
  stottat: {
    titel: "Insamlingar jag stöttat",
    beskrivning: "Uppdateringar, resultat-bevis och förlängningar på insamlingar du donerat till.",
  },
  community: {
    titel: "Community",
    beskrivning: "Kommentarer, dua och svar (aktiveras när community-modulen är på plats).",
  },
  upptack: {
    titel: "Upptäck nytt",
    beskrivning: "Veckodigest med nya insamlingar i kategorier du följt. Aldrig styckvis.",
  },
};

export function NotisPrefForm({ preferenser }: { preferenser: PrefRad[] }) {
  const [pref, setPref] = useState<Record<Grupp, PrefRad>>(() => {
    const init: Partial<Record<Grupp, PrefRad>> = {};
    for (const p of preferenser) init[p.grupp] = p;
    for (const g of ["mina_insamlingar","stottat","community","upptack"] as Grupp[]) {
      if (!init[g]) init[g] = { grupp: g, in_app: true, epost: false };
    }
    return init as Record<Grupp, PrefRad>;
  });
  const [feedback, setFeedback] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();
  const [activeGrupp, setActiveGrupp] = useState<Grupp | null>(null);

  function uppdatera(grupp: Grupp, key: "in_app" | "epost", value: boolean) {
    const ny = { ...pref[grupp], [key]: value };
    setPref({ ...pref, [grupp]: ny });
    setActiveGrupp(grupp);
    const fd = new FormData();
    if (ny.in_app) fd.set("in_app", "on");
    if (ny.epost) fd.set("epost", "on");
    start(async () => {
      const r = await uppdateraPref(grupp, fd);
      setFeedback(r);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {(Object.keys(LABELS) as Grupp[]).map((g) => (
          <li
            key={g}
            className="rounded-[14px] border p-4"
            style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper-soft)" }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 style={{ fontSize: 15, fontWeight: 600 }}>{LABELS[g].titel}</h4>
                <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                  {LABELS[g].beskrivning}
                </p>
              </div>
              <div className="flex shrink-0 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pref[g].in_app}
                    disabled={pending}
                    onChange={(e) => uppdatera(g, "in_app", e.target.checked)}
                  />
                  In-app
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pref[g].epost}
                    disabled={pending}
                    onChange={(e) => uppdatera(g, "epost", e.target.checked)}
                  />
                  E-post
                </label>
              </div>
            </div>
          </li>
        ))}
        <li
          className="rounded-[14px] border p-4"
          style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper)" }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 600 }}>Transaktionellt</h4>
              <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                Kvitto, granskningsbeslut, utbetalningsbesked, säkerhet. Du har rätt
                att veta vad som händer med dina pengar — kan inte stängas av.
              </p>
            </div>
            <span
              className="rounded-[10px] px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}
            >
              Alltid på
            </span>
          </div>
        </li>
      </ul>

      {feedback && !feedback.ok && (
        <Alert tone="danger">
          {feedback.message} ({activeGrupp})
        </Alert>
      )}
      {feedback && feedback.ok && (
        <Alert tone="success">Notispreferenser sparade.</Alert>
      )}
    </div>
  );
}
