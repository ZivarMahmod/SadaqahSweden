// Skolan F7 — Studieplaner + cross-reference (PREMIUM). Entitlement-grindat
// (`studieplan`). Att läsa material kräver ALDRIG medlemskap.
import { harTillgang } from "@/lib/skola/mock";
import { StudieplanByggare } from "@/components/skola/studieplan/studieplan-byggare";

export default function StudieplanPage() {
  // Mock-spegling av private.school_har_tillgang. Religiöst innehåll anropar
  // aldrig denna grind — bara power-verktyg som studieplan/cross-reference.
  const harStudieplan = harTillgang("studieplan");

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-[640px]">
        <h2 className="heading-3">Studieplan</h2>
        <p className="lead mt-2" style={{ fontSize: 16 }}>
          Bygg din egen väg genom lärandet och följ dina framsteg. Verktyget ingår i
          medlemskapet — innehållet du läser är och förblir gratis.
        </p>
      </header>

      <StudieplanByggare laast={!harStudieplan} />
    </div>
  );
}
