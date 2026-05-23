// Designsystem-primitiv — Pill (badge).
// Designreferens: handoff-to-code/assets/style.css § BADGES.
import type { HTMLAttributes, ReactNode } from "react";

type Tone = "forest" | "copper" | "danger" | "success" | "paper" | "outline" | "dark";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: "default" | "success" | "danger" | "pulse";
  children: ReactNode;
};

export function Pill({ tone = "forest", dot, className, children, ...rest }: PillProps) {
  const toneClass: Record<Tone, string> = {
    forest: "pill",
    copper: "pill pill-copper",
    danger: "pill pill-danger",
    success: "pill pill-success",
    paper: "pill pill-paper",
    outline: "pill pill-outline",
    dark: "pill pill-dark",
  };
  const dotClass = dot ? `dot${dot === "default" ? "" : ` dot-${dot}`}` : null;
  return (
    <span className={[toneClass[tone], className].filter(Boolean).join(" ")} {...rest}>
      {dotClass && <span className={dotClass} />}
      {children}
    </span>
  );
}
