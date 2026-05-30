// Skolan — feature-flaggor (server-side). 56b §6.
//
// Default AV för allt vilande (kräver obyggd modul). Default PÅ för det som
// är fullt klient-byggbart i dev. Läs ALLTID server-side och skicka ner
// resultatet som props till klient-komponenter — exponera inte rå env.
//
// När en flagga är av visar ytan ett ärligt "kommer snart"-läge
// (tillstånds-grammatiken), aldrig en trasig eller fejkad funktion.

export type SkolaFlaggor = {
  /** Hela skol-ytan synlig i Kunskap-rummet. */
  aktiv: boolean;
  /** Gemensamt verifierat bibliotek — kräver #34:s grind. Default av. */
  gemensamtBibliotek: boolean;
  /** Riktig Koran-text/uttal — kräver #6/#7. Default av. */
  koranData: boolean;
  /** Seedad demo-ayah för skriv-canvasen. Default på (dev). */
  koranDemo: boolean;
  /** OnlyOffice doc-server för dokument/PPT. Tom = stub. */
  docserverUrl: string;
  /** Riktig premium-betalning — kräver #12 + Stripe-produkter. Default av. */
  stripeAktiv: boolean;
};

/** Läs alla skol-flaggor från env. Anropa i Server Components. */
export function laesSkolaFlaggor(): SkolaFlaggor {
  return {
    // Default på om inte uttryckligen "false".
    aktiv: process.env.SKOLA_AKTIV !== "false",
    gemensamtBibliotek: process.env.SKOLA_GEMENSAMT_BIBLIOTEK === "true",
    koranData: process.env.SKOLA_KORAN_DATA === "true",
    koranDemo: process.env.SKOLA_KORAN_DEMO !== "false",
    docserverUrl: process.env.NEXT_PUBLIC_DOCSERVER_URL ?? "",
    stripeAktiv: process.env.SKOLA_STRIPE_AKTIV === "true",
  };
}
