"use client";

// Klient-formulär för att posta kommentar/svar. Server action gör all
// validering — vi visar fel-meddelandet det returnerar.

import { useState, useTransition } from "react";
import { postaKommentarAction } from "./community-actions";

export function KommentarForm({
  insamlingId,
  insamlingPublicId,
  uppdateringId,
  parentId,
  onPostat,
  kompakt,
}: {
  insamlingId: string;
  insamlingPublicId: string;
  uppdateringId: string | null;
  parentId: string | null;
  onPostat?: () => void;
  kompakt?: boolean;
}) {
  const [text, setText] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const MAX = 500;
  const kvar = MAX - text.length;
  const tomKnapp = text.trim().length === 0;

  function submit(formData: FormData) {
    setFel(null);
    formData.set("insamling_id", insamlingId);
    if (uppdateringId) formData.set("uppdatering_id", uppdateringId);
    if (parentId) formData.set("parent_id", parentId);
    start(async () => {
      const res = await postaKommentarAction(insamlingPublicId, formData);
      if (!res.ok) {
        setFel(res.fel);
        return;
      }
      setText("");
      onPostat?.();
    });
  }

  return (
    <form
      action={submit}
      className={kompakt ? "mt-3" : "mt-6"}
    >
      <textarea
        name="text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        rows={kompakt ? 2 : 3}
        placeholder={
          parentId
            ? "Skriv ditt svar — håll det vänligt och konkret."
            : "Skriv ett ord — dua, uppmuntran, fråga. Max 500 tecken, ingen länk."
        }
        className="textarea"
        disabled={pending}
        required
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={pending || tomKnapp}
          >
            {pending ? "Skickar …" : parentId ? "Skicka svar" : "Posta kommentar"}
          </button>
          {fel && (
            <span className="text-xs" style={{ color: "var(--color-danger)" }}>
              {fel}
            </span>
          )}
        </div>
        <span
          className="tabular text-xs"
          style={{
            color: kvar < 50 ? "var(--color-danger)" : "var(--color-ink-3)",
          }}
        >
          {kvar} tecken kvar
        </span>
      </div>
    </form>
  );
}
