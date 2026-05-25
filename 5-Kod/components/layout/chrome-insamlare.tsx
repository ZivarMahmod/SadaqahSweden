// Designsystem-chrome — ChromeInsamlare (konto-toppbar för inloggade insamlare).
// Designreferens: handoff v2.1/source/studio/components.jsx (ChromeInsamlare)
// + handoff v2.1/source/studio/styles.css § CHROME (.chrome-public).
// Återanvänder .chrome-public-layouten men byter nav-länkar till konto-flöden
// och lägger avatar-pill + bell + primär-CTA till höger.
// Säkerhet: läser me serverside via aktuellAnvandare (RLS-skyddad).
import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/layout/wordmark";
import { BurgerDrawer, type DrawerSection } from "@/components/layout/burger-drawer";
import { createClient } from "@/lib/supabase/server";

const INSAMLARE_LINKS = [
  { href: "/insamling", label: "Mina insamlingar" },
  { href: "/konto/donationer", label: "Donationer" },
  { href: "/konto/foreningar", label: "Föreningar" },
  { href: "/konto/notiser", label: "Notiser" },
];

function initialer(namn: string) {
  return namn
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
function fornamn(namn: string) {
  return namn.split(/\s+/)[0] || namn;
}

export async function ChromeInsamlare() {
  const me = await aktuellAnvandare();

  let olasta = 0;
  if (me) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notis")
      .select("id", { count: "exact", head: true })
      .is("last_at", null);
    olasta = count ?? 0;
  }

  const visningsnamn = me?.profil.visningsnamn ?? "Konto";

  const drawerSections: DrawerSection[] = [
    {
      label: "Mitt konto",
      items: [
        { href: "/insamling", label: "Mina insamlingar", mono: "01" },
        { href: "/konto", label: "Översikt", mono: "02" },
        { href: "/konto/donationer", label: "Mina donationer", mono: "03" },
        { href: "/konto/foreningar", label: "Föreningar", mono: "04" },
        { href: "/konto/notiser", label: "Notiser", mono: "05" },
        { href: "/konto/profil", label: "Profil", mono: "06" },
      ],
    },
    {
      label: "Utforska",
      items: [
        { href: "/insamlingar", label: "Alla insamlingar" },
        { href: "/foreningar", label: "Föreningar" },
        { href: "/events", label: "Events" },
        { href: "/karta", label: "Karta" },
      ],
    },
  ];

  return (
    <header className="chrome-public">
      <Link href="/" aria-label="Sadaqah Sweden — hem">
        <Wordmark />
      </Link>

      <nav className="nav-links" aria-label="Konto-meny">
        {INSAMLARE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="nav-link">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        <Link
          href="/konto/notiser"
          className="chrome-burger"
          aria-label={`Notiser${olasta > 0 ? ` (${olasta} olasta)` : ""}`}
          title="Notiser"
          style={{ position: "relative" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
          {olasta > 0 && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                background: "var(--color-danger)",
                color: "#fff",
                fontSize: 9.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                border: "2px solid var(--color-paper-soft)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {olasta > 99 ? "99+" : olasta}
            </span>
          )}
        </Link>

        <Link
          href="/konto"
          aria-label={`Konto: ${visningsnamn}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "4px 14px 4px 4px",
            border: "1px solid var(--color-ink-line)",
            borderRadius: "var(--sr-1)",
            background: "var(--color-paper-soft)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              background: "var(--color-forest)",
              color: "var(--color-paper)",
              borderRadius: "var(--sr-1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "var(--font-sans)",
            }}
          >
            {initialer(visningsnamn)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink-1)" }}>
            {fornamn(visningsnamn)}
          </span>
        </Link>

        {/* CTA pekar mot mina-insamlingar-listan där "Skapa nytt utkast"-action lever
            (en dedikerad /insamling/ny-route saknas i nuvarande app — kan läggas i
            en senare brief utan att rubba chrome-komponenten). */}
        <Link href="/insamling" className="mag-btn mag-btn-accent mag-btn-sm">
          + Ny insamling
        </Link>

        <form action={loggaUt}>
          <button
            type="submit"
            className="mag-btn mag-btn-ghost mag-btn-sm"
            aria-label="Logga ut"
          >
            Logga ut
          </button>
        </form>

        <BurgerDrawer sections={drawerSections} />
      </div>
    </header>
  );
}
