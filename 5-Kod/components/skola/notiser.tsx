// Skolan — små delade UI-bitar: ärliga "kommer snart"-lägen, demo-banner och
// premium-uppsälj utan mörka mönster. Server-säkra (inga hooks).
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/button";

/** Ärligt vilande-läge när en flagga är av (aldrig en trasig knapp). */
export function KommerSnart({
  titel,
  beskrivning,
  forutsattning,
}: {
  titel: string;
  beskrivning: string;
  /** Vad som krävs för att aktivera (modul/flagga). */
  forutsattning?: string;
}) {
  return (
    <div
      className="card card-bare flex flex-col items-center gap-3 px-8 py-14 text-center"
      style={{ border: "1px dashed var(--color-paper-line)" }}
    >
      <span className="pill pill-outline">Kommer snart</span>
      <h3 className="heading-3">{titel}</h3>
      <p className="lead mx-auto max-w-md" style={{ fontSize: 16 }}>
        {beskrivning}
      </p>
      {forutsattning && (
        <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
          Aktiveras när: {forutsattning}
        </p>
      )}
    </div>
  );
}

/** Tydlig demo-/platshållar-markering (t.ex. Koran-skrift mot demo-ayah). */
export function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3"
      style={{
        background: "var(--color-copper-soft)",
        border: "1px solid var(--color-copper)",
        color: "var(--color-copper-deep)",
        fontSize: 14,
      }}
      role="note"
    >
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
        ⚠️
      </span>
      <div>{children}</div>
    </div>
  );
}

/** Premium-uppsälj — visar förmånen, ingen FOMO/falsk knapphet. */
export function PremiumUppsalj({
  titel,
  varfor,
  pris = "29 kr/mån (familj 89 kr) — frivilligt, säg upp när som helst.",
}: {
  titel: string;
  varfor: string;
  pris?: string;
}) {
  return (
    <div
      className="card card-forest flex flex-col gap-3 px-7 py-8"
      style={{ color: "var(--color-paper-soft)" }}
    >
      <span className="pill pill-copper" style={{ alignSelf: "flex-start" }}>
        Del av medlemskapet
      </span>
      <h3 className="heading-3" style={{ color: "var(--color-paper-soft)" }}>
        {titel}
      </h3>
      <p style={{ fontSize: 17, lineHeight: 1.5, color: "rgba(245,240,228,0.92)" }}>{varfor}</p>
      <p style={{ color: "rgba(245,240,228,0.7)", fontSize: 14 }}>{pris}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <LinkButton href="/kunskap/skola/studieplan" variant="copper" size="md">
          Läs mer om medlemskapet
        </LinkButton>
        <span style={{ color: "rgba(245,240,228,0.7)", fontSize: 13 }}>
          Allt religiöst innehåll är och förblir gratis.
        </span>
      </div>
    </div>
  );
}
