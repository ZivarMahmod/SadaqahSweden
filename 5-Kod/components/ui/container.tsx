// Designsystem-primitiv — Container/Section layout helpers.
// Designreferens: handoff-to-code/assets/style.css § LAYOUT.
import type { HTMLAttributes, ReactNode } from "react";

type Width = "default" | "narrow" | "wide" | "prose";

const widthClass: Record<Width, string> = {
  default: "max-w-[1280px]",
  narrow: "max-w-[1040px]",
  wide: "max-w-[1440px]",
  prose: "max-w-[720px]",
};

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  width?: Width;
  children: ReactNode;
};

export function Container({ width = "default", className, children, ...rest }: ContainerProps) {
  const padX = width === "prose" ? "px-6" : "px-6 md:px-12";
  return (
    <div className={[`mx-auto w-full ${widthClass[width]} ${padX}`, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

type SectionProps = HTMLAttributes<HTMLElement> & {
  tone?: "paper" | "cream" | "forest";
  spacing?: "tight" | "default" | "loose";
  children: ReactNode;
};

export function Section({ tone = "paper", spacing = "default", className, children, ...rest }: SectionProps) {
  const bg: Record<NonNullable<SectionProps["tone"]>, string> = {
    paper: "bg-[var(--color-paper)]",
    cream: "bg-[var(--color-paper-soft)]",
    forest: "bg-[var(--color-forest-deep)] text-[var(--color-paper-soft)]",
  };
  const py: Record<NonNullable<SectionProps["spacing"]>, string> = {
    tight: "py-16 md:py-20",
    default: "py-20 md:py-28",
    loose: "py-24 md:py-32",
  };
  return (
    <section className={[bg[tone], py[spacing], "relative", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </section>
  );
}
