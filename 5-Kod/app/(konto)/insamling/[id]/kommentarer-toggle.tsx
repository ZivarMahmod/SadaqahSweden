"use client";

// M13 Block 2.6 — insamlaren kan stänga av kommentarsfältet på sin
// insamling. RLS säkrar att bara ägaren får uppdatera flaggan.

import { useState, useTransition } from "react";
import { toggleKommentarerAvstangda } from "@/app/(public)/insamlingar/[publicId]/community-actions";

export function KommentarerToggle({
  insamlingId,
  insamlingPublicId,
  avstangda,
}: {
  insamlingId: string;
  insamlingPublicId: string;
  avstangda: boolean;
}) {
  const [pa, setPa] = useState(!avstangda);
  const [pending, start] = useTransition();
  const [fel, setFel] = useState<string | null>(null);

  function toggla() {
    setFel(null);
    const nyAv = pa; // ny "avstangd" = inversen av nuvarande "på"
    start(async () => {
      const res = await toggleKommentarerAvstangda(insamlingPublicId, insamlingId, nyAv);
      if (!res.ok) {
        setFel(res.fel);
      } else {
        setPa(!nyAv);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-sm"
          style={{ color: "var(--color-ink-1)" }}
        >
          Kommentarer
        </span>
        <button
          type="button"
          onClick={toggla}
          aria-pressed={pa}
          disabled={pending}
          className={pa ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
          style={{ height: 28 }}
        >
          {pending ? "…" : pa ? "På" : "Avstängda"}
        </button>
      </div>
      <p
        className="mt-2 text-xs"
        style={{ color: "var(--color-ink-3)" }}
      >
        {pa
          ? "Inloggade kan kommentera, säga dua eller stötta din insamling."
          : "Ingen kan kommentera eller reagera på din insamling."}
      </p>
      {fel && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-danger)" }}>
          {fel}
        </p>
      )}
    </div>
  );
}
