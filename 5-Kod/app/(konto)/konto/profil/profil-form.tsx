// Modul M9 — Klient-form för profilredigering.
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { uppdateraEgenProfil, type Resultat } from "./actions";

type Props = {
  visningsnamn: string;
  presentation: string | null;
  stad: string | null;
  region: string | null;
  avatarUrl: string | null;
  visaTotalSumma: boolean;
  visaStad: boolean;
};

export function ProfilForm(p: Props) {
  const [visningsnamn, setVisningsnamn] = useState(p.visningsnamn);
  const [presentation, setPresentation] = useState(p.presentation ?? "");
  const [stad, setStad] = useState(p.stad ?? "");
  const [region, setRegion] = useState(p.region ?? "");
  const [avatarUrl, setAvatarUrl] = useState(p.avatarUrl ?? "");
  const [visaTotalSumma, setVisaTotalSumma] = useState(p.visaTotalSumma);
  const [visaStad, setVisaStad] = useState(p.visaStad);
  const [feedback, setFeedback] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("visningsnamn", visningsnamn);
        fd.set("presentation", presentation);
        fd.set("stad", stad);
        fd.set("region", region);
        fd.set("avatar_url", avatarUrl);
        if (visaTotalSumma) fd.set("visa_total_summa", "on");
        if (visaStad) fd.set("visa_stad", "on");
        start(async () => {
          const r = await uppdateraEgenProfil(fd);
          setFeedback(r);
        });
      }}
      className="flex flex-col gap-5"
    >
      <Field label="Visningsnamn" htmlFor="visningsnamn" required help="Det andra ser. Förening: föreningens namn.">
        <Input
          id="visningsnamn"
          value={visningsnamn}
          onChange={(e) => setVisningsnamn(e.target.value)}
          maxLength={80}
          required
        />
      </Field>
      <Field
        label="Kort presentation"
        htmlFor="presentation"
        help={`${presentation.length} / 280 tecken. Visa vem du är som insamlare. Max 280 tecken.`}
      >
        <Textarea
          id="presentation"
          rows={3}
          maxLength={280}
          value={presentation}
          onChange={(e) => setPresentation(e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stad" htmlFor="stad" help="Stockholm, Malmö, Göteborg…">
          <Input id="stad" value={stad} onChange={(e) => setStad(e.target.value)} />
        </Field>
        <Field label="Region" htmlFor="region" help="Valfritt — t.ex. Skåne.">
          <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
        </Field>
      </div>
      <Field label="Avatar-URL" htmlFor="avatar_url" help="Tillfälligt: fullständig URL till en bild. Storage-upload kommer senare.">
        <Input
          id="avatar_url"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <fieldset
        className="rounded-[14px] border p-4"
        style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper)" }}
      >
        <legend className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.08em", color: "var(--color-ink-3)" }}>
          Integritet — vad andra ser
        </legend>
        <label className="mt-3 flex items-center gap-3">
          <input
            type="checkbox"
            checked={visaStad}
            onChange={(e) => setVisaStad(e.target.checked)}
          />
          <span className="text-sm">Visa min stad/region publikt</span>
        </label>
        <label className="mt-3 flex items-center gap-3">
          <input
            type="checkbox"
            checked={visaTotalSumma}
            onChange={(e) => setVisaTotalSumma(e.target.checked)}
          />
          <span className="text-sm">Visa total insamlad summa på min profil</span>
        </label>
        <p className="mt-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
          Namn, antal insamlingar, antal levererade resultat och badges är alltid
          publika — annars är profilen meningslös att lita på (M9 B3).
        </p>
      </fieldset>

      {feedback && !feedback.ok && <Alert tone="danger">{feedback.message}</Alert>}
      {feedback && feedback.ok && <Alert tone="success">Profilen sparades.</Alert>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sparar…" : "Spara profil"}
        </Button>
      </div>
    </form>
  );
}
