// Designsystem v0.3 — ToneSurface (surface_mode-konventionen, #18 F1).
//
// De två tonlägena är editorial (v0.2 oförändrat, default) och utility (v0.3).
// surface_mode är INGEN databaskolumn — det är en ren frontend-konvention:
// en yta/route taggar sig själv genom att rendera sitt innehåll i en
// <ToneSurface tone="utility">. CSS i app/globals.css ([data-tone="utility"])
// ger då tätare spacing + Manrope-driven typografi. SAMMA tokens/färger/radier
// som editorial — det finns ingen utility-palett (#18 R7).
//
// Server-säker: ingen "use client". Funkar i både server- och klientkomponenter
// (t.ex. en route-layout som vill sätta tonläget för hela undersidan).
//
// Konvention per yt-typ (dokumenteras i docs/DESIGNSYSTEM-v0.3.md):
//   editorial → webb-förrummet, topbar, Ge/Gemenskap/Kunskap-landningar, läsytor.
//   utility   → Min vardag (bönetider/qibla/kalender), kart-sheet, dashboards,
//               komponent-galleriet.
import type { CSSProperties, ElementType, ReactNode } from "react";

export type SurfaceTone = "editorial" | "utility";

type ToneSurfaceProps = {
  /** editorial (default, v0.2) eller utility (v0.3, tätare). */
  tone?: SurfaceTone;
  /** Vilket element wrappern renderar. Default: div. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function ToneSurface({
  tone = "editorial",
  as: Tag = "div",
  className,
  style,
  children,
}: ToneSurfaceProps) {
  return (
    <Tag data-tone={tone} className={className} style={style}>
      {children}
    </Tag>
  );
}
