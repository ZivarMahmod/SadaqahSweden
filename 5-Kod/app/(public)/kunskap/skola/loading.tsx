// Skolan — laddnings-läge (tillstånds-grammatik). Visas medan en skol-yta laddar.
export default function SkolaLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Laddar…</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              minHeight: 132,
              opacity: 0.6,
              background:
                "linear-gradient(90deg, var(--color-paper-deep) 25%, var(--color-paper-soft) 50%, var(--color-paper-deep) 75%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
