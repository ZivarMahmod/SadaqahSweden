// Modul M7 — Klient-form för uppdatering / resultat-bevis.
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { postaUppdatering, postaResultatBevis } from "../actions";

type Resultat = { ok: true } | { ok: false; message: string };

export function UppdateringForm({ insamlingId }: { insamlingId: string }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("text", text);
        start(async () => {
          const r = await postaUppdatering(insamlingId, fd);
          setFeedback(r);
          if (r.ok) setText("");
        });
      }}
    >
      <Field label="Posta en fri uppdatering" htmlFor="up_text" help="Donator ser detta direkt i tidslinjen. Korta, ärliga uppdateringar håller engagemanget vid liv (M7 B2).">
        <Textarea
          id="up_text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tack — vi passerade halva målet idag."
          required
        />
      </Field>
      {feedback && !feedback.ok && (
        <div className="mt-3"><Alert tone="danger">
          {feedback.message}
        </Alert></div>
      )}
      {feedback && feedback.ok && (
        <div className="mt-3"><Alert tone="success">
          Uppdateringen postad.
        </Alert></div>
      )}
      <div className="mt-4">
        <Button type="submit" disabled={pending || text.trim().length === 0} size="sm">
          {pending ? "Postar…" : "Posta uppdatering"}
        </Button>
      </div>
    </form>
  );
}

export function ResultatBevisForm({ insamlingId }: { insamlingId: string }) {
  const [text, setText] = useState("");
  const [video, setVideo] = useState("");
  const [feedback, setFeedback] = useState<Resultat | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("text", text);
        fd.set("video_url", video);
        start(async () => {
          const r = await postaResultatBevis(insamlingId, fd);
          setFeedback(r);
          if (r.ok) {
            setText("");
            setVideo("");
          }
        });
      }}
    >
      <Field
        label="Resultat-bevis"
        htmlFor="rb_text"
        help="Beskriv vad som faktiskt genomfördes — knyt resultatet till löftet. Granskaren gör en lättviktig äkthetskoll. Minst 10 tecken."
      >
        <Textarea
          id="rb_text"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="1000 bönematter levererade till 8 moskéer — vi har bilder från utdelningen."
          minLength={10}
          required
        />
      </Field>
      <Field label="Video-länk (valfritt)" htmlFor="rb_video" help="YouTube/Vimeo. Direktuppladdning av video kommer senare (M7 §9).">
        <Input
          id="rb_video"
          type="url"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
          placeholder="https://youtu.be/…"
        />
      </Field>
      {feedback && !feedback.ok && (
        <div className="mt-3"><Alert tone="danger">
          {feedback.message}
        </Alert></div>
      )}
      {feedback && feedback.ok && (
        <div className="mt-3"><Alert tone="success">
          Resultat-beviset är skickat för granskning.
        </Alert></div>
      )}
      <div className="mt-4">
        <Button type="submit" disabled={pending || text.trim().length < 10}>
          {pending ? "Skickar…" : "Skicka resultat-bevis"}
        </Button>
      </div>
    </form>
  );
}
