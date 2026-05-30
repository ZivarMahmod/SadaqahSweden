// Webb-förrummet (brief 35, F6). Den publika landningsskärmen — app-hemmets
// webb-motsvarighet (#18 nivå 3, "förrummet, inte ett rum").
//
// Förrummet lyfter en lugn, värdig ingång till var och en av de fem rummen.
// editorial-tonläge (lugn landning, inte en dashboard). INGEN feed, INGEN
// algoritmisk kurering, INGET engagemangs-element (#19: ingen central feed,
// permanent). Bygger helt på v0.3 (F1–F5) + navigationskonfigurationen.
//
// v0.3-omarbetning: den tidigare ytan var en marknadsförings-/discovery-sida som
// läste insamlingar/kategorier/aggregat ur DB och visade en featured-feed. Den
// feed-/marketing-tunga delen viker för den lugna rum-landningen (F6-not). En
// kort, statisk "om plattformen"-sektion (granskningslöftet) behålls. Sidan är
// nu helt statisk — inga DB-läsningar (databasen ägs av en annan instans).
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ROOMS } from "@/lib/navigation";

const PRINCIPER = [
  {
    titel: "Granskat före publicering",
    text: "Inget projekt når allmänheten utan att först ha granskats mot islamiska principer och svensk lag. Trygghet för både givare och insamlare.",
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

export default function Forrummet() {
  return (
    <main>
      {/* HERO — lugn landning */}
      <section className="relative overflow-hidden" style={{ padding: "80px 0 96px" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='rgba(31,70,54,0.045)' stroke-width='0.6'><path d='M40 0L48 32L80 40L48 48L40 80L32 48L0 40L32 32Z'/></g></svg>\")",
            backgroundSize: "280px 280px",
            backgroundPosition: "center",
          }}
        />
        <Container>
          <div className="relative grid items-center gap-12 md:grid-cols-[1.15fr_1fr] md:gap-20">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Star size={16} />
                <span className="eyebrow">SADAQAH · ZAKAT · UMMAH</span>
              </div>
              <h1 className="h-display">
                Ge öppet.
                <br />
                Bli granskad.
                <br />
                <span style={{ color: "var(--color-copper-deep)", fontStyle: "italic" }}>
                  Visa resultatet.
                </span>
              </h1>
              <p className="lead mt-8 max-w-[540px]">
                En svenskspråkig plattform för det muslimska samhället i Sverige — där det
                religiösa och det uppdragskritiska är gratis för alla, pengarna går direkt till
                insamlaren, och varje projekt granskas innan publicering.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <LinkButton href="/ge" size="lg" rightIcon={<Icon name="arrow-right" size={20} />}>
                  Utforska insamlingar
                </LinkButton>
                <LinkButton href="/registrera" size="lg" variant="secondary">
                  Starta din egen
                </LinkButton>
              </div>
              <p className="mt-10 pt-8 text-sm" style={{ borderTop: "1px solid var(--color-ink-line)", color: "var(--color-ink-3)", maxWidth: 540 }}>
                Allt religiöst och uppdragskritiskt är fritt: läsa Koranen, bönetider, kartan,
                donera och delta. Inget av hjärtat ligger bakom betalning.
              </p>
            </div>

            <HeroVisual />
          </div>
        </Container>
      </section>

      {/* DE FEM RUMMEN — förrummets kärna: lugna, värdiga ingångar */}
      <Section tone="cream" spacing="default">
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <Star size={16} />
            <span className="eyebrow">DE FEM RUMMEN</span>
          </div>
          <h2 className="heading-1 max-w-[760px]">En lugn ingång till var sak.</h2>
          <p className="lead mt-5 max-w-[620px]">
            Plattformen är ett hus med fem rum. Gå in i det du söker — inget flöde drar dig vidare,
            inget rankas eller tävlar.
          </p>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROOMS.map((room) => (
              <Link
                key={room.key}
                href={room.href}
                className="group flex min-h-[180px] flex-col gap-4 p-8 no-underline transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--color-paper-soft)",
                  border: "1px solid var(--color-ink-line)",
                  borderRadius: "var(--sr-3)",
                  color: "inherit",
                }}
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center"
                  style={{
                    background: "var(--color-forest-soft)",
                    color: "var(--color-forest)",
                    borderRadius: "var(--sr-2)",
                  }}
                >
                  <Icon name={room.icon} size={22} />
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    fontWeight: 400,
                    letterSpacing: "-0.012em",
                    margin: 0,
                  }}
                >
                  {room.label}
                </h3>
                <p className="text-sm" style={{ color: "var(--color-ink-2)", lineHeight: 1.5 }}>
                  {room.description}
                </p>
                <span
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: "var(--color-forest)" }}
                >
                  Gå in
                  <Icon name="arrow-right" size={15} />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* GRANSKNINGSLÖFTET — statiskt förtroende-band (om plattformen) */}
      <Section tone="forest" spacing="default">
        <div className="bg-star-pattern-dark absolute inset-0 pointer-events-none" style={{ position: "absolute" }} />
        <Container>
          <div className="relative grid items-center gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Star size={16} light />
                <span className="eyebrow" style={{ color: "var(--color-copper-warm)" }}>
                  GRANSKNINGSLÖFTET
                </span>
              </div>
              <h2 className="heading-1" style={{ color: "var(--color-paper)" }}>
                Vi granskar varje insamling — innan en enda krona ges.
              </h2>
              <ul className="mt-10 flex flex-col gap-5">
                {[
                  "Mottagare och syfte verifieras mot svensk lag och islamiska principer.",
                  "Pengaflödet sker via Stripe direkt till insamlaren — vi rör aldrig pengarna juridiskt.",
                  "Resultatet bevisas öppet: utbetalningskvitto, foton, och vittnesmål från fältet.",
                  "Avvikelser hanteras transparent — vi döljer aldrig en avbruten insamling.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-4">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(184, 132, 62, 0.18)", color: "var(--color-copper-warm)" }}
                    >
                      <Icon name="check" size={14} />
                    </span>
                    <span style={{ color: "rgba(245, 240, 228, 0.82)", lineHeight: 1.45 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4">
              {PRINCIPER.map((p) => (
                <div
                  key={p.titel}
                  className="card"
                  style={{ background: "rgba(245, 240, 228, 0.04)", borderColor: "rgba(245, 240, 228, 0.1)" }}
                >
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--color-paper)", margin: 0 }}>
                    {p.titel}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: "rgba(245, 240, 228, 0.7)", lineHeight: 1.55 }}>
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* FÖRENINGS-CTA — statiskt band */}
      <Section tone="paper" spacing="loose">
        <Container>
          <div
            className="relative overflow-hidden p-16 md:p-20"
            style={{ background: "var(--color-forest)", color: "var(--color-paper)", borderRadius: 28 }}
          >
            <div className="bg-star-pattern-dark pointer-events-none" />
            <div className="relative grid items-center gap-12 md:grid-cols-[1.4fr_1fr]">
              <div>
                <Pill tone="dark">
                  <Icon name="users" size={12} />
                  För föreningar &amp; moskéer
                </Pill>
                <h2
                  className="mt-6"
                  style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 1.08, fontWeight: 400, letterSpacing: "-0.014em", color: "var(--color-paper)", margin: 0 }}
                >
                  Bygg er förenings transparens — utan att röra en mjukvarurad.
                </h2>
                <p
                  className="mt-6 max-w-[480px]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 18, color: "rgba(245, 240, 228, 0.75)", lineHeight: 1.5 }}
                >
                  Sadaqah Sweden är gratis för registrerade föreningar. Vi tar inget mellanskick —
                  ni får verktygen, vi sköter granskningen och plattformen.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <LinkButton href="/registrera" variant="copper" size="lg" rightIcon={<Icon name="arrow-right" size={20} />}>
                  Anmäl er förening
                </LinkButton>
                <Link href="mailto:hej@sadaqahsweden.se" className="text-sm" style={{ color: "rgba(245, 240, 228, 0.6)" }}>
                  hej@sadaqahsweden.se
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function Star({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ color: light ? "var(--color-copper-warm)" : "var(--color-copper)", flex: `0 0 ${size}px` }}
    >
      <path d="M8 0.5L9.8 6.2L15.5 8L9.8 9.8L8 15.5L6.2 9.8L0.5 8L6.2 6.2L8 0.5Z" fill="currentColor" />
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative hidden md:block" style={{ height: 520 }}>
      <div
        className="absolute"
        style={{ top: 60, left: -8, right: 60, bottom: 60, background: "var(--color-forest)", zIndex: 1, transform: "rotate(-2deg)", boxShadow: "var(--shadow-2)", borderRadius: 28, overflow: "hidden" }}
      />
      <div
        className="absolute"
        style={{ inset: "0 24px 24px 0", zIndex: 2, background: "var(--color-paper-soft)", border: "1px solid var(--color-ink-line)", borderRadius: 28, overflow: "hidden", boxShadow: "var(--shadow-3)" }}
      >
        <div className="ph relative" style={{ height: 300 }}>
          <div className="absolute left-6 top-6 z-10 flex gap-2">
            <Pill tone="dark" dot="pulse">
              Granskning levande
            </Pill>
            <Pill tone="dark">Plattform live</Pill>
          </div>
          <div
            className="absolute bottom-6 left-6"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "rgba(245, 240, 228, 0.6)" }}
          >
            Foto: insamling som passerat granskning
          </div>
        </div>
        <div className="flex flex-col gap-3.5 p-7">
          <div className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.16em", color: "var(--color-copper-deep)" }}>
            Exempel · designreferens
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-0.008em", color: "var(--color-ink)", margin: 0 }}>
            En transparent plattform där varje krona kan följas till resultatet.
          </h3>
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            När en insamling är aktiv visas riktiga belopp och bilder här — granskat före publicering.
          </p>
        </div>
      </div>
    </div>
  );
}
