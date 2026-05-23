// Designsystem-chrome — public/app site nav.
// Designreferens: handoff-to-code/assets/style.css § TOP NAV.
// Säkerhet: roll/inloggning läses serverside via aktuellAnvandare (RLS-skyddad).
import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/layout/wordmark";

const PUBLIC_LINKS = [
  { href: "/insamlingar", label: "Insamlingar" },
  // TODO (M10): /foreningar — katalog, byggs i Steg 11.
  // TODO (M12): /karta — geografisk vy, byggs i Steg 12.
  // TODO (M11): /om-plattformen — informationsida.
];

export async function SiteNav() {
  const me = await aktuellAnvandare();
  const arInsamlare =
    !!me && (me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin");
  const arGranskare = !!me && (me.roll === "granskare" || me.roll === "admin");

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{
        height: 72,
        background: "rgba(251, 247, 236, 0.85)",
        borderBottomColor: "var(--color-ink-line)",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-6 md:px-12">
        <Link href="/" aria-label="Sadaqah Sweden — hem">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Huvudmeny">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--color-ink-2)" }}
            >
              {l.label}
            </Link>
          ))}
          {arGranskare && (
            <Link
              href="/granskning"
              className="text-sm font-semibold transition-colors"
              style={{ color: "var(--color-copper-deep)" }}
            >
              Granskningskö
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {me ? (
            <>
              {arInsamlare && (
                <Link href="/insamling" className="btn btn-ghost btn-sm">
                  Mina insamlingar
                </Link>
              )}
              <Link href="/konto" className="btn btn-secondary btn-sm">
                {me.profil.visningsnamn}
              </Link>
              <form action={loggaUt}>
                <button type="submit" className="btn btn-ghost btn-sm" aria-label="Logga ut">
                  Logga ut
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Logga in
              </Link>
              <Link href="/registrera" className="btn btn-primary btn-sm">
                Skapa konto
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
