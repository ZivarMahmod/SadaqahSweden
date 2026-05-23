const steg = [
  {
    n: "01",
    titel: "Skapa och granskas",
    text: "Du beskriver vad du samlar in till. Vi granskar projektet mot svensk lag och islamiska principer innan det publiceras. Ingen insamling går ut ogranskad.",
  },
  {
    n: "02",
    titel: "Dela och samla in",
    text: "Insamlingen får en egen sida och en QR-kod att dela i ditt nätverk. Människor kan ge enkelt och tryggt — inget konto behövs för att donera.",
  },
  {
    n: "03",
    titel: "Visa resultatet",
    text: "När pengarna betalats ut och hjälpen levererats laddar du upp bevis. Givarna ser med egna ögon vad deras gåva blev.",
  },
];

const principer = [
  {
    titel: "Granskat före publicering",
    text: "Inget projekt når allmänheten utan att först ha granskats. Trygghet för både givare och insamlare.",
  },
  {
    titel: "Pengarna går direkt",
    text: "Donationer går via Stripe rakt till insamlaren. Noll kronor i plattformsavgift — vi tar inget mellanskick.",
  },
  {
    titel: "Spårbart hela vägen",
    text: "Varje krona kan följas, från gåva till levererat resultat. Öppenhet är inbyggt, inte en eftertanke.",
  },
  {
    titel: "Islamiskt medvetet",
    text: "Byggt på islamiska principer, för hela det muslimska samhället i Sverige — utan att ta sida mellan inriktningar.",
  },
];

const kategorier = [
  "Vatten",
  "Mat",
  "Utbildning",
  "Mosképrojekt",
  "Föräldralösa",
  "Akut katastrofhjälp",
  "Sjukvård",
  "Religiösa varor",
];

import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";

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

export default async function Home() {
  const me = await aktuellAnvandare();
  const ärInsamlare = me && (me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12 sm:pt-20">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-brand">
            Insamlingsplattform för det muslimska samhället
          </p>
          <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Trygga insamlingar.
            <br />
            <span className="text-brand">Spårbara resultat.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Sadaqah Sweden är en transparent plattform där varje projekt granskas
            före publicering, pengarna går direkt till insamlaren och resultatet
            bevisas — från gåva till levererad hjälp.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {me ? (
              <>
                {ärInsamlare ? (
                  <Link
                    href="/insamling"
                    className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-paper transition hover:bg-brand-dark"
                  >
                    Mina insamlingar →
                  </Link>
                ) : (
                  <Link
                    href="/konto"
                    className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-paper transition hover:bg-brand-dark"
                  >
                    Till mitt konto →
                  </Link>
                )}
                <a
                  href="#sa-fungerar-det"
                  className="inline-flex items-center rounded-full border border-line bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
                >
                  Så fungerar det
                </a>
              </>
            ) : (
              <>
                <Link
                  href="/registrera"
                  className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-paper transition hover:bg-brand-dark"
                >
                  Skapa konto
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full border border-line bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
                >
                  Logga in
                </Link>
                <a
                  href="#sa-fungerar-det"
                  className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-muted underline-offset-2 transition hover:text-ink hover:underline"
                >
                  Så fungerar det
                </a>
              </>
            )}
          </div>
        </section>

        <section
          id="sa-fungerar-det"
          className="mx-auto w-full max-w-5xl px-6 pb-20"
        >
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Så fungerar det
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steg.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-line bg-paper p-6"
              >
                <span className="font-display text-sm font-semibold text-sand">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-xl font-medium text-ink">
                  {s.titel}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="principer" className="bg-sage">
          <div className="mx-auto w-full max-w-5xl px-6 py-20">
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Det vi bygger på
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {principer.map((p) => (
                <div
                  key={p.titel}
                  className="rounded-2xl border border-line bg-paper p-6"
                >
                  <h3 className="font-display text-xl font-medium text-ink">
                    {p.titel}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-20">
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Områden vi stödjer
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Från akut katastrofhjälp till långsiktiga projekt — granskat och
            spårbart.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {kategorier.map((k) => (
              <li
                key={k}
                className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink"
              >
                {k}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center">
          <Logotyp />
          <span>© {new Date().getFullYear()} Sadaqah Sweden</span>
        </div>
      </footer>
    </div>
  );
}
