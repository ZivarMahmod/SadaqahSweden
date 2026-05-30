// Skolan — sub-layout i Kunskap-rummet. Ramar in alla /kunskap/skola-ytor med
// rubrik + sub-nav. Hela ytan gömd bakom SKOLA_AKTIV (default på i dev).
//
// VIKTIGT (klient-bygge): inga DB-anrop här eller i barn-sidorna — allt mot
// lib/skola/mock.ts bakom flaggor. Backend (klasser, RLS, inlämning) ägs av en
// annan instans och wire:as in senare utan ombygge.
import type { ReactNode } from "react";
import { laesSkolaFlaggor } from "@/lib/skola/flags";
import { SkolaNav } from "@/components/skola/skola-nav";
import { KommerSnart } from "@/components/skola/notiser";

export default function SkolaLayout({ children }: { children: ReactNode }) {
  const flaggor = laesSkolaFlaggor();
  return (
    <main className="mx-auto max-w-[1080px] px-6 py-10">
      <header className="mb-6">
        <p className="eyebrow mb-2">Kunskap · Skolan</p>
        <h1 className="heading-2">Skolan</h1>
        <p className="lead mt-2" style={{ fontSize: 17 }}>
          Lärar-ledda klasser, uppgifter, bibliotek och studieverktyg — en skola i plattformen.
          Att läsa och lära är alltid gratis.
        </p>
      </header>

      {flaggor.aktiv ? (
        <>
          <SkolaNav />
          <div className="mt-8">{children}</div>
        </>
      ) : (
        <KommerSnart
          titel="Skolan är inte öppen än"
          beskrivning="Kunskapsskolan förbereds. Den öppnar när allt är på plats."
          forutsattning="SKOLA_AKTIV=true"
        />
      )}
    </main>
  );
}
