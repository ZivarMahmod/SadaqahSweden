// Skolan F6 — Bibliotek. Lärarens eget material (klart) + bokmärken. Gemensamt
// verifierat bibliotek är vilande bakom SKOLA_GEMENSAMT_BIBLIOTEK tills #34:s
// grind finns — visas bara om flaggan är på (då bara grind-godkänt innehåll).
import { laesSkolaFlaggor } from "@/lib/skola/flags";
import { BIBLIOTEK_GEMENSAMT, BIBLIOTEK_LARARE } from "@/lib/skola/mock";
import { BibliotekLista } from "@/components/skola/bibliotek/bibliotek-lista";
import { KommerSnart } from "@/components/skola/notiser";

export default function BibliotekPage() {
  const flaggor = laesSkolaFlaggor();
  // Lärar-material syns alltid. Gemensamt-verifierat bara när grinden är på.
  const items = flaggor.gemensamtBibliotek
    ? [...BIBLIOTEK_LARARE, ...BIBLIOTEK_GEMENSAMT]
    : BIBLIOTEK_LARARE;

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-[640px]">
        <h2 className="heading-3">Bibliotek</h2>
        <p className="lead mt-2" style={{ fontSize: 16 }}>
          Lärarens material och dina bokmärken. Att läsa är alltid gratis.
        </p>
      </header>

      <BibliotekLista items={items} />

      {!flaggor.gemensamtBibliotek && (
        <KommerSnart
          titel="Gemensamt verifierat bibliotek"
          beskrivning="Ett delat bibliotek med lärd-verifierat innehåll renderas genom det religiösa registrets grind. Bara grind-godkänt innehåll visas — plattformen påstår aldrig religiös sanning på egen hand."
          forutsattning="#34 (religiöst register) byggt + SKOLA_GEMENSAMT_BIBLIOTEK=true"
        />
      )}
    </div>
  );
}
