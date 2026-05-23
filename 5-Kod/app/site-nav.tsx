import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";

export async function SiteNav() {
  const me = await aktuellAnvandare();

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="text-lg">☘︎</span>
          <span>Sadaqah Sweden</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {me ? (
            <>
              {(me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin") && (
                <Link
                  href="/insamling"
                  className="rounded-md px-3 py-1.5 hover:bg-black/5"
                >
                  Mina insamlingar
                </Link>
              )}
              <Link href="/konto" className="rounded-md px-3 py-1.5 hover:bg-black/5">
                {me.profil.visningsnamn}
              </Link>
              <form action={loggaUt}>
                <button
                  type="submit"
                  className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5"
                >
                  Logga ut
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-1.5 hover:bg-black/5">
                Logga in
              </Link>
              <Link
                href="/registrera"
                className="rounded-md bg-black px-3 py-1.5 text-white hover:bg-black/85"
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
