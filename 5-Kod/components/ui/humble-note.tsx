// Designsystem v0.3 — HumbleNote (F4). Den lågmälda ärlighets-noten.
//
// EN delad komponent för religiös osäkerhet — så att #7:s hög-latitud-upplysning,
// #8:s "detta är en beräkning, inte ett dekret" och liknande noter ser likadana ut
// överallt. Lågmäld, icke-alarmerande: --ink-3-text + en diskret info-ikon.
// ALDRIG --danger, ALDRIG en gul varningsruta — den ska kännas som ärlighet,
// inte som ett fel.
//
// Skild från v0.2:s Alert: Alert är för fel/varning/framgång i ett flöde;
// HumbleNote är för ärlig osäkerhet. De får ALDRIG slås ihop.
//
// Princip E: HumbleNote *bär* osäkerhet — den uttalar aldrig en religiös
// bedömning. Det finns INGEN default-copy; varje yta ger sin egen text, och
// den texten är verifierad där det krävs (#6:s register). Plattformen skriver
// ingen religiös substans i en komponent-default.
//
// Server-säker. Fungerar i båda tonlägena.
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

type HumbleNoteProps = {
  /** Notens text — ALLTID prop-styrd (princip E). Ingen default. */
  children: ReactNode;
  /** Ikon-override; default: diskret info-ikon. */
  icon?: ReactNode;
  className?: string;
};

export function HumbleNote({ children, icon, className }: HumbleNoteProps) {
  return (
    <div
      className={["flex items-start gap-2.5 text-sm", className].filter(Boolean).join(" ")}
      style={{
        color: "var(--color-ink-3)",
        lineHeight: 1.55,
        paddingLeft: 14,
        borderLeft: "1px solid var(--color-ink-line)",
      }}
    >
      <span aria-hidden style={{ color: "var(--color-ink-3)", flex: "0 0 auto", marginTop: 1 }}>
        {icon ?? <Icon name="info" size={16} />}
      </span>
      <span>{children}</span>
    </div>
  );
}
