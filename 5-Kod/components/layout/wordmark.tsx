// Designsystem-chrome — Wordmark (8-uddig stjärna + Sadaqa·Sweden).
// Designreferens: handoff-to-code/assets/style.css § LOGO/WORDMARK
// + handoff-to-code/assets/shared.js (STAR_SVG).

type WordmarkProps = {
  light?: boolean;
  size?: number;
};

export function Wordmark({ light = false, size = 22 }: WordmarkProps) {
  const starSize = Math.round(size * 1.05);
  return (
    <span
      className="inline-flex items-baseline gap-3"
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "-0.012em",
        color: light ? "var(--color-paper)" : "var(--color-forest)",
        lineHeight: 1,
      }}
    >
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{
          width: starSize,
          height: starSize,
          color: light ? "var(--color-copper-warm)" : "var(--color-copper)",
        }}
      >
        <Star8 />
      </span>
      <span className="inline-flex items-baseline gap-[7px]">
        <span>Sadaqa</span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: light ? "var(--color-copper-warm)" : "var(--color-copper-deep)",
          }}
        >
          Sweden
        </span>
      </span>
    </span>
  );
}

function Star8() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M16 1.5L19.6 12.4L30.5 16L19.6 19.6L16 30.5L12.4 19.6L1.5 16L12.4 12.4L16 1.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 6.5L18.1 13L24.5 16L18.1 19L16 25.5L13.9 19L7.5 16L13.9 13L16 6.5Z"
        fill="rgba(0,0,0,0.18)"
      />
      <circle cx="16" cy="16" r="2" fill="rgba(245,240,228,0.92)" />
    </svg>
  );
}
