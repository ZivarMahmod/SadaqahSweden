// Designsystem-primitiv — Progress.
// Designreferens: handoff-to-code/assets/style.css § PROGRESS.

type ProgressProps = {
  value: number; // 0–100
  tone?: "forest" | "copper";
  ariaLabel?: string;
};

export function Progress({ value, tone = "forest", ariaLabel }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={ariaLabel}
    >
      <div
        className={`progress-bar${tone === "copper" ? " progress-bar-copper" : ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
