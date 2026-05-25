// Designsystem-chrome — ChromePublic (publik topbar, magasin v0.2).
// Designreferens: handoff v2.1/source/studio/styles.css § CHROME (.chrome-public)
// + handoff v2.1/source/studio/components.jsx (ChromePublic) + § "Hamburger".
// Säkerhet: roll/inloggning läses serverside via aktuellAnvandare (RLS-skyddad).
// All server-logik (host-typ, roll-gating, notis-count) intakt från F3-refactor.
import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/layout/wordmark";
import { BurgerDrawer, type DrawerSection } from "@/components/layout/burger-drawer";
import { createClient } from "@/lib/supabase/server";
import { aktuellHostTyp } from "@/lib/host";

const PUBLIC_LINKS = [
  { href: "/insamlingar", label: "Insamlingar" },
  { href: "/foreningar", label: "Föreningar" },
  { href: "/events", label: "Events" },
  { href: "/karta", label: "Karta" },
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

  const drawerSections: DrawerSection[] = [
    {
      label: "Utforska",
      items: [
        { href: "/insamlingar", label: "Insamlingar", mono: "01" },
        { href: "/foreningar", label: "Föreningar", mono: "02" },
        { href: "/events", label: "Events", mono: "03" },
        { href: "/karta", label: "Karta", mono: "04" },
        { href: "/statistik", label: "Statistik", mono: "05" },
        { href: "/faq", label: "Frågor & svar", mono: "06" },
      ],
    },
    ...(me
      ? ([
          {
            label: "Mitt konto",
            items: [
              ...(arInsamlare
                ? [{ href: "/insamling", label: "Mina insamlingar" }]
                : []),
              { href: "/konto", label: "Översikt" },
              { href: "/konto/donationer", label: "Mina donationer" },
              { href: "/konto/foreningar", label: "Föreningar" },
              { href: "/konto/notiser", label: "Notiser" },
              { href: "/konto/profil", label: "Profil" },
            ],
          },
          ...(arGranskare
            ? [
                {
                  label: "Team",
                  items: [
                    { href: "/granskning", label: "Granskningskö" },
                    { href: "/granskning/event", label: "Event-kö" },
                    { href: "/admin", label: "Maskinrum" },
                  ],
                },
              ]
            : []),
        ] as DrawerSection[])
      : ([
          {
            label: "Konto",
            items: [
              { href: "/login", label: "Logga in" },
              ...(visaSkapaKonto
                ? [{ href: "/registrera", label: "Skapa konto" }]
                : []),
            ],
          },
        ] as DrawerSection[])),
  ];

  return (
    <header className="chrome-public">
      <Link href="/" aria-label="Sadaqah Sweden — hem">
        <Wordmark />
      </Link>

      <nav className="nav-links" aria-label="Huvudmeny">
        {PUBLIC_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="nav-link">
            {l.label}
          </Link>
        ))}
        {arGranskare && (
          <>
            <Link
              href="/granskning"
              className="nav-link"
              style={{ color: "var(--color-copper-deep)", fontWeight: 600 }}
            >
              Granskningskö
            </Link>
            <Link
              href="/admin"
              className="nav-link"
              style={{ color: "var(--color-copper-deep)", fontWeight: 600 }}
            >
              Maskinrum
            </Link>
          </>
        )}
      </nav>

      <div className="nav-actions">
        {me ? (
          <>
            {arInsamlare && (
              <Link href="/insamling" className="mag-btn mag-btn-ghost mag-btn-sm">
                Mina insamlingar
              </Link>
            )}
            <Link
              href="/konto/notiser"
              className="mag-btn mag-btn-ghost mag-btn-sm"
              aria-label={`Notiser${olasta > 0 ? ` (${olasta} olasta)` : ""}`}
              title="Notiser"
            >
              {olasta > 0 ? (
                <span aria-hidden className="inline-flex items-center gap-1">
                  Notiser
                  <span
                    className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[var(--sr-1)] px-1.5 text-[11px] font-semibold"
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
            <Link href="/konto" className="mag-btn mag-btn-secondary mag-btn-sm">
              {me.profil.visningsnamn}
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
          </>
        ) : (
          <>
            <Link href="/login" className="mag-btn mag-btn-ghost mag-btn-sm">
              Logga in
            </Link>
            {visaSkapaKonto && (
              <Link href="/registrera" className="mag-btn mag-btn-primary mag-btn-sm">
                Skapa konto
              </Link>
            )}
          </>
        )}
        <BurgerDrawer sections={drawerSections} />
      </div>
    </header>
  );
}

// Behåll bakåtkompatibelt alias så befintliga layouts som importerar SiteNav
// fortsätter fungera även när de pekas mot ChromePublic i F5.
export { SiteNav as ChromePublic };
