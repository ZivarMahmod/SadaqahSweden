// Designsystem-primitiv — Card.
// Designreferens: handoff-to-code/assets/style.css § CARDS.
import type { HTMLAttributes } from "react";

type Variant = "default" | "tight" | "loose" | "bare" | "forest";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  hover?: boolean;
};

export function Card({ variant = "default", hover = false, className, children, ...rest }: CardProps) {
  const map: Record<Variant, string> = {
    default: "card",
    tight: "card card-tight",
    loose: "card card-loose",
    bare: "card card-bare",
    forest: "card card-forest",
  };
  const cls = [map[variant], hover && "card-hover", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
