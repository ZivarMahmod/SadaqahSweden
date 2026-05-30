// Skolan F10 — Koran-skrift. Server-yta: läser flaggor och väljer textkälla.
// Klient-canvasen (Pointer Events) renderas direkt — den bryter inte SSR
// (window/dpr läses bara i effekter).
import { laesSkolaFlaggor } from "@/lib/skola/flags";
import { DEMO_AYAH } from "@/lib/skola/demo-ayah";
import { KoranSkriftCanvas } from "@/components/skola/koran-skrift/koran-skrift-canvas";
import { DemoBanner, KommerSnart } from "@/components/skola/notiser";

export default function KoranSkriftPage() {
  const flaggor = laesSkolaFlaggor();

  // När #6 (Koran-modulen) är byggd och SKOLA_KORAN_DATA är på hämtas riktig,
  // grindad text här. Tills dess: demo-ayah bakom SKOLA_KORAN_DEMO.
  const visaDemo = flaggor.koranDemo && !flaggor.koranData;
  const harData = flaggor.koranData; // skarp källa — vilande tills #6/#7

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-[640px]">
        <h2 className="heading-3">Koran-skrift</h2>
        <p className="lead mt-2" style={{ fontSize: 16 }}>
          Öva på att skriva och spåra bokstäverna med penna eller finger. Slå av mallen när du
          vill skriva fritt. Inget sparas på servern — det du ritar stannar på din enhet.
        </p>
      </header>

      {harData ? (
        // Skarp Koran-data-väg: aktiveras när #6/#7 finns. Tills dess vilande.
        <KommerSnart
          titel="Riktig Koran-text på väg"
          beskrivning="Skarp, grindad text och recitation kopplas in när Koran-modulen är byggd."
          forutsattning="#6/#7 byggda + SKOLA_KORAN_DATA=true"
        />
      ) : visaDemo ? (
        <>
          <DemoBanner>
            <strong>Demo-läge.</strong> Verserna nedan är en liten teknisk platshållare med
            välkänd text för att öva skrivandet. När Koran-modulen är på ersätts de av riktig,
            verifierad text. Ingen recitation spelas i demo-läget.
          </DemoBanner>
          <KoranSkriftCanvas ayahs={DEMO_AYAH} />
        </>
      ) : (
        <KommerSnart
          titel="Skriv-ytan är avstängd"
          beskrivning="Sätt på demo-läget för att öva, eller vänta tills Koran-modulen är byggd."
          forutsattning="SKOLA_KORAN_DEMO=true (demo) eller #6 + SKOLA_KORAN_DATA=true (skarpt)"
        />
      )}
    </div>
  );
}
