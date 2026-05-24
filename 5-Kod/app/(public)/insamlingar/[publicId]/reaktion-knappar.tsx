"use client";

// M13 Block 3 — bara två reaktioner, "Dua" och "Stöd". Inga negativa.
// Klicket togglar (sätter eller tar bort). Inloggning krävs.

import { useTransition } from "react";
import Link from "next/link";
import { reaktionAction } from "./community-actions";

export function ReaktionKnappar({
  insamlingId,
  insamlingPublicId,
  uppdateringId,
  inloggad,
  duaTotal,
  stodTotal,
  minDua,
  minStod,
  kompakt,
}: {
  insamlingId: string;
  insamlingPublicId: string;
  uppdateringId?: string | null;
  inloggad: boolean;
  duaTotal: number;
  stodTotal: number;
  minDua: boolean;
  minStod: boolean;
  kompakt?: boolean;
}) {
  const [pending, start] = useTransition();

  function toggla(typ: "dua" | "stod") {
    if (!inloggad) return;
    start(async () => {
      await reaktionAction(
        insamlingPublicId,
        insamlingId,
        uppdateringId ?? null,
        typ,
      );
    });
  }

  const Knapp = ({
    typ,
    label,
    total,
    aktiv,
  }: {
    typ: "dua" | "stod";
    label: string;
    total: number;
    aktiv: boolean;
  }) => {
    const inner = (
      <span className="inline-flex items-center gap-2 tabular">
        <span>{label}</span>
        <span
          className="text-xs"
          style={{ color: aktiv ? "var(--color-paper-soft)" : "var(--color-ink-3)" }}
        >
          {total}
        </span>
      </span>
    );
    if (!inloggad) {
      return (
        <Link
          href={`/login?retur=${encodeURIComponent(`/insamlingar/${insamlingPublicId}`)}`}
          className="btn btn-secondary btn-sm"
          title="Logga in för att reagera"
        >
          {inner}
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => toggla(typ)}
        disabled={pending}
        className={aktiv ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
        aria-pressed={aktiv}
      >
        {inner}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${kompakt ? "mt-2" : "mt-5"}`}
    >
      <Knapp typ="dua" label="Dua" total={duaTotal} aktiv={minDua} />
      <Knapp typ="stod" label="Stöd" total={stodTotal} aktiv={minStod} />
    </div>
  );
}
