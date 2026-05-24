// Designsystem-chrome — public/app site nav.
// Designreferens: handoff-to-code/assets/style.css § TOP NAV.
// Säkerhet: roll/inloggning läses serverside via aktuellAnvandare (RLS-skyddad).
import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/layout/wordmark";
import { createClient } from "@/lib/supabase/server";
import { aktuellHostTyp } from "@/lib/host";

const PUBLIC_LINKS = [
  { href: "/insamlingar", label: "Insamlingar" },
  { href: "/foreningar", label: "Föreningar" },
  { href: "/events", label: "Events" },
  { href: "/karta", label: "Karta" },
  // TODO (M11): /om-plattformen — informationsida.
];

export async function SiteNav() {
  const me = await aktuellAnvandare();
  const hostTyp = await aktuellHostTyp();
  // F6: publika domänen exponerar INGA admin-/granskar-ingångar i navet,
  // även om en team-medlem är inloggad. Admin-länkar visas bara på
  // admin-subdomänen (eller okänd host i dev/preview).
  const visaInternaLankar = hostTyp !== "publik";
  // Admin-subdomänen har bara logga-in-yta. "Skapa konto"-knappen göms helt;
  // team-konton tilldelas manuellt av superadmin.
  const visaSkapaKonto = hostTyp !== "admin";
  const arInsamlare =
    !!me && (me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin");
  const arGranskare =
    !!me && (me.roll === "granskare" || me.roll === "admin") && visaInternaLankar;

  let olasta = 0;
  if (me) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notis")
      .select("id", { count: "exact", head: true })
      .is("last_at", null);
    olasta = count ?? 0;
  }

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
            <>
              <Link
                href="/granskning"
                className="text-sm font-semibold transition-colors"
                style={{ color: "var(--color-copper-deep)" }}
              >
                Granskningskö
              </Link>
              <Link
                href="/granskning/event"
                className="text-sm font-semibold transition-colors"
                style={{ color: "var(--color-copper-deep)" }}
              >
                Event-kö
              </Link>
              <Link
                href="/admin"
                className="text-sm font-semibold transition-colors"
                style={{ color: "var(--color-copper-deep)" }}
              >
                Admin
              </Link>
              {me.roll === "admin" && (
                <Link
                  href="/admin/team"
                  className="text-sm font-semibold transition-colors"
                  style={{ color: "var(--color-copper-deep)" }}
                >
                  Team
                </Link>
              )}
            </>
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
              <Link
                href="/konto/notiser"
                className="btn btn-ghost btn-sm"
                aria-label={`Notiser${olasta > 0 ? ` (${olasta} olasta)` : ""}`}
                title="Notiser"
              >
                {olasta > 0 ? (
                  <span
                    aria-hidden
                    className="inline-flex items-center gap-1"
                  >
                    Notiser
                    <span
                      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold"
                      style={{
                        background: "var(--color-copper)",
                        color: "var(--color-paper)",
                      }}
                    >
                      {olasta > 99 ? "99+" : olasta}
                    </span>
                  </span>
                ) : (
                  "Notiser"
                )}
              </Link>
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
              {visaSkapaKonto && (
                <Link href="/registrera" className="btn btn-primary btn-sm">
                  Skapa konto
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
