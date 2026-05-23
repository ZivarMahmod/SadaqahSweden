// Modul M6 — auth-route-grupp.
// Design: handoff-to-code/auth.html · split-screen, brand vänster, formulär höger.
// Ingen SiteNav/Footer — auth-skärmen är heltäckande.
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { Icon } from "@/components/ui/icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-2">
      {/* Brand sida */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-16 md:flex"
        style={{
          background: "var(--color-forest-deep)",
          color: "var(--color-paper)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='rgba(245,240,228,0.05)' stroke-width='0.5'><path d='M40 0L48 32L80 40L48 48L40 80L32 48L0 40L32 32Z'/></g></svg>\")",
            backgroundSize: "240px 240px",
          }}
        />
        <div className="relative">
          <Link href="/" aria-label="Sadaqah Sweden — hem">
            <Wordmark light size={22} />
          </Link>
        </div>

        <div className="relative">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 56,
              lineHeight: 1.04,
              fontWeight: 400,
              letterSpacing: "-0.014em",
              margin: 0,
              color: "var(--color-paper)",
              maxWidth: 480,
            }}
          >
            Trygg inloggning{" "}
            <span style={{ color: "var(--color-copper-warm)" }}>för dig som ger</span> — och du som
            tar ansvar.
          </h1>
          <p
            className="mt-8 max-w-[440px]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              color: "rgba(245, 240, 228, 0.7)",
              lineHeight: 1.5,
              fontWeight: 300,
            }}
          >
            Du behöver inget konto för att donera. För att starta en insamling, granska eller
            representera en förening krävs identifiering.
          </p>
        </div>

        <div
          className="relative mt-auto flex flex-col gap-3 pt-8"
          style={{ borderTop: "1px solid rgba(245, 240, 228, 0.10)" }}
        >
          {[
            ["shield-check", "Plattformen är en bro — vi rör aldrig pengarna juridiskt."],
            ["lock", "All identitet är skyddad enligt GDPR — vi sparar inte personnummer."],
            ["check-circle", "Granskning före publicering — varje insamling, varje gång."],
          ].map(([icon, text]) => (
            <div
              key={text}
              className="flex items-center gap-3 text-sm"
              style={{ color: "rgba(245, 240, 228, 0.8)" }}
            >
              <span style={{ color: "var(--color-copper-warm)" }}>
                <Icon name={icon as string} size={14} />
              </span>
              {text}
            </div>
          ))}
        </div>
      </aside>

      {/* Formulärsida */}
      <main className="flex flex-col px-6 py-10 md:px-20 md:py-16">
        {/* Mobil-wordmark synlig endast under md */}
        <div className="mb-10 md:hidden">
          <Link href="/" aria-label="Sadaqah Sweden — hem">
            <Wordmark size={20} />
          </Link>
        </div>
        <div className="m-auto w-full max-w-[480px]">{children}</div>
      </main>
    </div>
  );
}
