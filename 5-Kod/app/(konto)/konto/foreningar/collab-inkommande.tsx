// Modul M10 — Klient-komponent: lista inkomna collab-förfrågningar med
// godkänn/avböj-knappar.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { svaraCollab } from "./actions";

type Item = {
  id: string;
  collab_typ: string;
  org_namn: string;
  insamling_titel: string;
};

export function CollabInkommandeList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function svara(id: string, godkand: boolean) {
    start(async () => {
      const r = await svaraCollab(id, godkand);
      if (r.ok) {
        setFeedback({ ok: true, message: godkand ? "Samarbete godkänt." : "Förfrågan avböjd." });
        router.refresh();
      } else {
        setFeedback({ ok: false, message: r.message });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {feedback && (
        <Alert tone={feedback.ok ? "success" : "danger"}>{feedback.message}</Alert>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-[12px] border p-4"
            style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <strong>{c.org_namn}</strong> som <em>{labelTyp(c.collab_typ)}</em> på
                {" "}<strong>{c.insamling_titel}</strong>.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" disabled={pending} onClick={() => svara(c.id, true)}>
                Godkänn
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => svara(c.id, false)}>
                Avböj
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function labelTyp(t: string): string {
  return ({
    initiativtagare: "initiativtagare",
    stodjer: "stödjer",
    praktisk_partner: "praktisk partner",
  } as Record<string, string>)[t] ?? t;
}
