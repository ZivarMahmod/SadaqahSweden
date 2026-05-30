// Designsystem v0.3 — EntityCard (F3). Den gemensamma kort-stommen.
//
// Insamlings-, förenings-, event-, imam- och FAQ-kort är KONFIGURATIONER av den
// här stommen — inte fem separat designade kort (#18 R3, kort-inflation). Varje
// område skriver en TUNN adapter som mappar sin entitet → EntityCard-props
// (#18 äger renderings-kontraktet; områdena äger adaptrarna). InsamlingCard
// nedanför i samma katalog är referens-adaptern.
//
// PRINCIP A: EntityCard har INGEN betygs-, stjärn- eller röst-prop. Aldrig.
// Om en framtida brief ber om det är den medvetet frånvarande.
//
// Renderings-kontrakt (props) enligt #18:s datamodell-avsnitt. `footer` och
// `compact` är v0.3-extensions ovanpå kontraktet (compact = app-hemmets
// kort-anatomi, DEL 7-beslut 7; footer = fri fot, t.ex. insamlingens belopps-rad
// som inte mappar till metaLines). Tonmedveten via --tone-* (editorial/utility).
// Server-säker.
import Link from "next/link";
import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";

type EntityCardProps = {
  /** Typ/kategori-etikett (Eyebrow-stil). */
  eyebrow?: string;
  /** Spectral-titel. */
  title: string;
  /** 1–2 meta-rader. */
  metaLines?: string[];
  /** Valfri statustagg (en Tag/Pill). Overlay på thumbnail om sådan finns. */
  statusTag?: ReactNode;
  /** Valfri thumbnail/Photo. */
  thumbnail?: ReactNode;
  /** BARA insamlingar — en ProgressBar-andel (0–100). */
  progress?: number;
  progressAriaLabel?: string;
  /** BARA events — ett datum-block. */
  dateBlock?: ReactNode;
  /** Valfri åtgärd (en Btn/länk). */
  action?: ReactNode;
  /** v0.3-extension: fri fot (belopps-rad m.m. som inte är metaLines). */
  footer?: ReactNode;
  /** Hela kortet kan vara en länk. */
  href?: string;
  /** App-hemmets kompakta dagskort-anatomi (placeras av brief 51). */
  compact?: boolean;
  className?: string;
};

export function EntityCard({
  eyebrow,
  title,
  metaLines,
  statusTag,
  thumbnail,
  progress,
  progressAriaLabel,
  dateBlock,
  action,
  footer,
  href,
  compact = false,
  className,
}: EntityCardProps) {
  const cls = [
    "card card-hover entity-card",
    compact && "entity-card-compact",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {thumbnail && (
        <div className="entity-card-media">
          {thumbnail}
          {statusTag && <div className="entity-card-tags">{statusTag}</div>}
        </div>
      )}
      <div className="entity-card-body">
        {!thumbnail && statusTag && <div className="entity-card-tags-inline flex gap-2">{statusTag}</div>}
        {dateBlock}
        {eyebrow && <span className="entity-card-eyebrow">{eyebrow}</span>}
        <h3 className="entity-card-title">{title}</h3>
        {metaLines?.map((line, i) => (
          <p key={i} className="entity-card-meta">
            {line}
          </p>
        ))}
        {(progress != null || footer) && (
          <div className="entity-card-foot">
            {progress != null && (
              <Progress value={progress} ariaLabel={progressAriaLabel ?? `${progress} % av målet`} />
            )}
            {footer}
          </div>
        )}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${cls} no-underline`} style={{ color: "inherit" }}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
