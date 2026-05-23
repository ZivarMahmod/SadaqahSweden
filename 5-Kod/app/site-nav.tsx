import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";

function Logotyp() {
  return (
    <span className="flex items-center gap-2.5 text-brand">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <rect x="7" y="7" width="18" height="18" rx="2.5" fill="currentColor" opacity="0.9" />
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="2.5"
          fill="currentColor"
          opacity="0.55"
          transform="rotate(45 16 16)"
        />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Sadaqah Sweden
      </span>
    </span>
  );
}

export async function SiteNav() {
  const me = await aktuellAnvandare();
  const ärInsamlare = me && (me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin");

  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Sadaqah Sweden — hem">
          <Logotyp />
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {me ? (
            <>
              {ärInsamlare && (
                <Link
                  href="/insamling"
                  className="rounded-full px-4 py-2 font-medium text-ink hover:text-brand"
                >
                  Mina insamlingar
                </Link>
              )}
              <Link
                href="/konto"
                className="rounded-full px-4 py-2 font-medium text-ink hover:text-brand"
              >
                {me.profil.visningsnamn}
              </Link>
              <form action={loggaUt}>
                <button
                  type="submit"
                  className="rounded-full border border-line px-4 py-2 font-medium text-ink transition hover:border-brand hover:text-brand"
                >
                  Logga ut
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 font-medium text-ink hover:text-brand"
              >
                Logga in
              </Link>
              <Link
                href="/registrera"
                className="rounded-full bg-brand px-4 py-2 font-medium text-paper transition hover:bg-brand-dark"
              >
                Skapa konto
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
