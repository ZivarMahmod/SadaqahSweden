// Designsystem v0.3 — SkeletonState (tillstånd: LADDAR). F2, tillstånds-grammatiken.
//
// En lugn skelett-platshållare i --paper-deep/--paper-line. ALDRIG en spinner
// mitt på en tom sida — spinner reserveras för BankID och betalning (extern
// väntan, dokumenterat i docs/DESIGNSYSTEM-v0.3.md). Skelettet formas efter den
// kommande layouten (variant + lines/count) så sidan inte hoppar när data laddat.
//
// Server-säker (ingen "use client"). Shimmer-pulsen respekterar
// prefers-reduced-motion (global regel i app/globals.css, F7).
// Fungerar i båda tonlägena (editorial/utility).
import type { CSSProperties } from "react";

type SkeletonVariant = "text" | "list" | "card" | "block";

type SkeletonStateProps = {
  /** Vilken kommande layout skelettet efterliknar. */
  variant?: SkeletonVariant;
  /** Antal rader (variant text/list). */
  lines?: number;
  /** Antal kort (variant card). */
  count?: number;
  /** Höjd för variant="block" (px eller CSS-värde). */
  height?: number | string;
  className?: string;
  /** Skärmläsar-text medan ytan laddar. */
  label?: string;
};

function Bar({ w, h = 12 }: { w: string; h?: number }) {
  return <span className="skeleton" style={{ display: "block", width: w, height: h }} />;
}

export function SkeletonState({
  variant = "text",
  lines = 3,
  count = 3,
  height,
  className,
  label = "Laddar innehåll …",
}: SkeletonStateProps) {
  const wrap = ["flex flex-col", className].filter(Boolean).join(" ");
  const widths = ["100%", "92%", "78%", "85%", "60%"];

  let body: React.ReactNode;

  if (variant === "block") {
    body = <Bar w="100%" h={typeof height === "number" ? height : 200} />;
  } else if (variant === "list") {
    body = (
      <div className="flex flex-col" style={{ gap: "var(--tone-row-gap)" }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center" style={{ gap: 12 }}>
            <span className="skeleton" style={{ width: 40, height: 40, borderRadius: "var(--sr-2)", flex: "0 0 40px" }} />
            <div className="flex flex-1 flex-col" style={{ gap: 8 }}>
              <Bar w="55%" h={12} />
              <Bar w="80%" h={10} />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (variant === "card") {
    body = (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
            <Bar w="100%" h={180} />
            <div className="flex flex-col p-6" style={{ gap: 10 }}>
              <Bar w="40%" h={10} />
              <Bar w="85%" h={16} />
              <Bar w="100%" h={10} />
              <Bar w="70%" h={10} />
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col" style={{ gap: 10 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Bar key={i} w={widths[i % widths.length]} h={12} />
        ))}
      </div>
    );
  }

  const style: CSSProperties = { gap: "var(--tone-card-gap)" };

  return (
    <div className={wrap} style={style} aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      <span aria-hidden>{body}</span>
    </div>
  );
}
