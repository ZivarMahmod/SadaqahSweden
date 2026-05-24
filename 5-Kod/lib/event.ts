// M14 — event-helpers.
// Typer + visning-helpers (formatera datum, nästa förekomst för återkommande).

import type { Database } from "@/lib/supabase/types";

export type EventRad = Database["public"]["Tables"]["event"]["Row"];

export const EVENT_TYP_LABEL: Record<EventRad["typ"], string> = {
  forelasning: "Föreläsning",
  insamlingskvall: "Insamlingskväll",
  eid_firande: "Eid-firande",
  iftar: "Iftar",
  kurs: "Kurs / studiecirkel",
  familjedag: "Familjedag",
  ungdom: "Ungdomsträff",
  sister: "Systerträff",
  oppet_hus: "Öppet hus",
  annat: "Annat",
};

export const EVENT_STATUS_LABEL: Record<EventRad["status"], string> = {
  utkast: "Utkast",
  inskickad: "Inskickad",
  under_granskning: "Under granskning",
  andring_begard: "Ändring begärd",
  avvisad: "Avvisad",
  publicerad: "Publicerad",
  avslutad: "Avslutad",
  installt: "Inställt",
  arkiverad: "Arkiverad",
};

const VECKODAG_NAMN = [
  "söndag",
  "måndag",
  "tisdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lördag",
];

/**
 * Returnerar nästa förekomst för ett (ev. återkommande) event från `from`.
 * Om eventet inte är återkommande returneras dess `start_at` om det ligger
 * i framtiden, annars null.
 */
export function nastaForekomst(
  e: Pick<EventRad, "start_at" | "upprepning" | "upprepning_veckodag" | "upprepning_slut" | "installt_forekomster">,
  from: Date = new Date(),
): Date | null {
  const start = new Date(e.start_at);
  if (!e.upprepning) {
    return start >= from ? start : null;
  }
  const slut = e.upprepning_slut ? new Date(e.upprepning_slut) : null;

  if (e.upprepning === "vecka" && e.upprepning_veckodag != null) {
    let kandidat = new Date(start);
    while (kandidat < from) {
      kandidat = new Date(kandidat.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (slut && kandidat > slut) return null;
    }
    if (arInstalld(kandidat, e.installt_forekomster ?? [])) {
      kandidat = new Date(kandidat.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (slut && kandidat > slut) return null;
    return kandidat;
  }

  if (e.upprepning === "manad") {
    let kandidat = new Date(start);
    while (kandidat < from) {
      kandidat = new Date(kandidat);
      kandidat.setMonth(kandidat.getMonth() + 1);
      if (slut && kandidat > slut) return null;
    }
    return kandidat;
  }

  return null;
}

function arInstalld(d: Date, installda: string[]): boolean {
  const isoDag = d.toISOString().slice(0, 10);
  return installda.includes(isoDag);
}

export function formatEventTid(start: Date | string, slut?: Date | string | null): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const datumDel = s.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const tidDel = s.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  let slutDel = "";
  if (slut) {
    const e = typeof slut === "string" ? new Date(slut) : slut;
    slutDel = `–${e.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${datumDel} kl. ${tidDel}${slutDel}`;
}

export function formatUpprepning(
  e: Pick<EventRad, "upprepning" | "upprepning_veckodag">,
): string | null {
  if (!e.upprepning) return null;
  if (e.upprepning === "vecka" && e.upprepning_veckodag != null) {
    return `Varje ${VECKODAG_NAMN[e.upprepning_veckodag]}`;
  }
  if (e.upprepning === "manad") {
    return "Varje månad";
  }
  return null;
}
