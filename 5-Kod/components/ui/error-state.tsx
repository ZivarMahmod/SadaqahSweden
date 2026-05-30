// Designsystem v0.3 — ErrorState (tillstånd: FEL). F2, tillstånds-grammatiken.
//
// Ärligt, icke-skrämmande, ALLTID med en väg framåt ("Försök igen" via onRetry).
// Aldrig en rå feltext mot användaren. Skild från v0.2:s Alert — Alert är en
// banner för fel/info/success i ett flöde; ErrorState är hela ytans fel-tillstånd.
//
// variant="offline": religiösa verktyg (bönetider, qibla, kalender) faller
// tillbaka på sparad/offline-data — då ska felet KNAPPT synas: lugn ton, ingen
// danger-färg, bara en diskret rad. (#18: offline är inte ett haveri.)
//
// "use client": onRetry är en interaktiv handler. Kan renderas i en
// serverkomponent utan onRetry (då utan retry-knapp). Båda tonlägena.
"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

type ErrorVariant = "error" | "offline";

type ErrorStateProps = {
  title?: string;
  description?: string;
  /** Klient-handler för "Försök igen". Utelämnas → ingen retry-knapp. */
  onRetry?: () => void;
  retryLabel?: string;
  variant?: ErrorVariant;
  /** Ikon-override; default per variant. */
  icon?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Försök igen",
  variant = "error",
  icon,
  className,
}: ErrorStateProps) {
  if (variant === "offline") {
    // Diskret rad — offline är inte ett haveri. Ingen danger-färg.
    return (
      <div
        role="status"
        className={["flex items-center justify-center gap-2 py-4 text-sm", className]
          .filter(Boolean)
          .join(" ")}
        style={{ color: "var(--color-ink-3)" }}
      >
        <span aria-hidden style={{ color: "var(--color-ink-3)" }}>
          {icon ?? <Icon name="cloud-off" size={16} />}
        </span>
        <span>{description ?? "Du är offline — visar senast sparade information."}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline"
            style={{ color: "var(--color-forest)" }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={["card card-bare flex flex-col items-center gap-4 px-8 py-16 text-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden style={{ color: "var(--color-ink-3)" }}>
        {icon ?? <Icon name="alert-triangle" size={28} />}
      </span>
      <h3 className="heading-3">{title ?? "Något gick inte att hämta"}</h3>
      <p className="lead mx-auto max-w-md" style={{ fontSize: 16 }}>
        {description ??
          "Vi kunde inte ladda det här just nu. Det är sällan något allvarligt — försök igen om en stund."}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mag-btn mag-btn-secondary mt-2">
          <Icon name="refresh" size={16} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
