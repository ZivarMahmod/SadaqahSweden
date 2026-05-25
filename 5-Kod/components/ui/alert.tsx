// Designsystem-primitiv — Alert (banner för fel/info/success).
// Designreferens: tonkoder från handoff-to-code/assets/style.css § STATUS.
import type { ReactNode } from "react";

type Tone = "info" | "success" | "danger" | "warning";

const map: Record<Tone, { bg: string; color: string; border: string }> = {
  info: { bg: "var(--color-forest-soft)", color: "var(--color-forest)", border: "var(--color-forest-line)" },
  success: { bg: "var(--color-success-soft)", color: "var(--color-success)", border: "rgba(45,107,79,0.2)" },
  danger: { bg: "var(--color-danger-soft)", color: "var(--color-danger)", border: "rgba(139,58,46,0.2)" },
  warning: { bg: "var(--color-copper-soft)", color: "var(--color-copper-deep)", border: "rgba(184,132,62,0.2)" },
};

type AlertProps = {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  role?: "alert" | "status";
};

export function Alert({ tone = "info", title, children, role = "status" }: AlertProps) {
  const s = map[tone];
  return (
    <div
      role={role}
      className="rounded-[var(--sr-2)] border px-4 py-3 text-sm"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div>{children}</div>
    </div>
  );
}
