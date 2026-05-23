// Designsystem-chrome — global footer.
// Designreferens: handoff-to-code/assets/style.css § FOOTER + shared.js footer().
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Plattformen",
    links: [
      { label: "Insamlingar", href: "/insamlingar" },
      // TODO (M10): { label: "Föreningar", href: "/foreningar" }
      // TODO (M12): { label: "Karta", href: "/karta" }
      // TODO (M13): { label: "Community", href: "/community" }
    ],
  },
  {
    heading: "Stötta",
    links: [
      // TODO (M11): infosidor om regleringar.
      { label: "Logga in", href: "/login" },
      { label: "Skapa konto", href: "/registrera" },
    ],
  },
  {
    heading: "Förening",
    links: [
      // TODO (M10): anmäl förening, för moskéer, samarbeten.
      { label: "Kontakt", href: "mailto:hej@sadaqahsweden.se" },
    ],
  },
  {
    heading: "Kontakt",
    links: [
      { label: "hej@sadaqahsweden.se", href: "mailto:hej@sadaqahsweden.se" },
      { label: "support@sadaqahsweden.se", href: "mailto:support@sadaqahsweden.se" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="mt-32"
      style={{
        background: "var(--color-forest-deep)",
        color: "rgba(245, 240, 228, 0.7)",
        padding: "80px 24px 32px",
      }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div
          className="grid gap-12 pb-16 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
          style={{ borderBottom: "1px solid rgba(245, 240, 228, 0.08)" }}
        >
          <div>
            <Wordmark light size={22} />
            <p
              className="mt-5 max-w-xs text-sm leading-relaxed"
              style={{ color: "rgba(245, 240, 228, 0.55)" }}
            >
              Svenskspråkig insamlingsplattform för det muslimska samhället i Sverige.
              Granskad. Trygg. Öppen.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.heading}>
              <h5
                className="mb-5"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--color-copper-warm)",
                }}
              >
                {c.heading}
              </h5>
              <ul className="flex flex-col gap-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm transition-colors"
                      style={{ color: "rgba(245, 240, 228, 0.7)" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-8 flex flex-col items-start justify-between gap-3 text-xs md:flex-row md:items-center"
          style={{ color: "rgba(245, 240, 228, 0.35)" }}
        >
          <span>© {new Date().getFullYear()} Sadaqah Sweden ideell förening</span>
          <span>Plattformen är en bro — vi rör aldrig pengarna juridiskt.</span>
        </div>
        <div
          className="mt-6 text-center text-[11px]"
          style={{
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(245, 240, 228, 0.4)",
          }}
        >
          Powered by{" "}
          <a
            href="https://corevo.se"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-copper-warm)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(218, 168, 117, 0.4)",
              paddingBottom: 1,
            }}
          >
            Corevo.se
          </a>
        </div>
      </div>
    </footer>
  );
}
