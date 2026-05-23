// Modul M11 — Marketing/landningssida.
// Design: handoff-to-code/marketing.html · Plan: 1-Planering/Modul-11-Listning-sokning-discovery.md.
// Säkerhet: Alla DB-läsningar via RLS-skyddad anon-klient. Summor och kort visas
// bara om publik data finns; tom DB → empty state, aldrig falska siffror.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import { Container, Section } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";
import { antal, kortBelopp } from "@/lib/format";

const PUBLIK_STATUSAR = [
  "aktiv",
  "stangd",
  "utbetald",
  "vantar_pa_resultat",
  "avslutad_levererad",
  "avslutad_utan_resultat",
  "pausad",
] as const;

const STEG = [
  {
    n: "01",
    titel: "Skapa & granskas",
    text: "Du beskriver vad du samlar in till. Vi granskar projektet mot svensk lag och islamiska principer innan det publiceras. Ingen insamling går ut ogranskad.",
  },
  {
    n: "02",
    titel: "Dela & samla in",
    text: "Insamlingen får en egen sida och en QR-kod att dela. Människor kan ge enkelt och tryggt — inget konto behövs för att donera.",
  },
  {
    n: "03",
    titel: "Visa resultatet",
    text: "När pengarna betalats ut och hjälpen levererats laddar du upp bevis. Givarna ser med egna ögon vad gåvan blev.",
  },
];

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

type KategoriRad = { id: string; namn: string; slug: string; antal: number };

export default async function MarketingPage() {
  const me = await aktuellAnvandare();
  const arInsamlare =
    !!me && (me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin");

  const supabase = await createClient();

  // Publik totalsumma + antal — TODO (M11): byt mot materialiserad vy när trafik finns.
  const { data: aggData } = await supabase
    .from("insamling")
    .select("insamlat_ore, status")
    .in("status", PUBLIK_STATUSAR)
    .is("deleted_at", null);

  const totaltOre = aggData?.reduce((s, r) => s + (r.insamlat_ore ?? 0), 0) ?? 0;
  const antalInsamlingar = aggData?.length ?? 0;

  // Featured/aktiva insamlingar
  const { data: featuredData } = await supabase
    .from("insamling")
    .select(
      "public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status",
    )
    .eq("status", "aktiv")
    .is("deleted_at", null)
    .order("publicerad_at", { ascending: false })
    .limit(3);

  const featured: InsamlingCardData[] =
    featuredData?.map((i) => ({
      publicId: i.public_id,
      titel: i.titel,
      kortBeskrivning: i.kort_beskrivning,
      insamlatOre: i.insamlat_ore,
      malbeloppOre: i.malbelopp_ore,
      malbeloppMinOre: i.malbelopp_min_ore,
      malbeloppMaxOre: i.malbelopp_max_ore,
      malbeloppModell: i.malbelopp_modell,
      insamlarStad: i.insamlar_stad,
      hjalpLand: i.hjalp_land,
      insamlingDeadline: i.insamling_deadline,
      status: i.status,
    })) ?? [];

  // Kategorier — visa alla aktiva, sorterade. Räkna publika insamlingar per kategori.
  const { data: katData } = await supabase
    .from("kategori")
    .select("id, namn, slug, sortering, insamling_kategori(insamling(id, status, deleted_at))")
    .eq("aktiv", true)
    .order("sortering");

  const kategorier: KategoriRad[] = (katData ?? []).map((k) => {
    const ik = (k as unknown as {
      insamling_kategori?: { insamling?: { status: string; deleted_at: string | null } | null }[];
    }).insamling_kategori;
    const n =
      ik?.filter(
        (rel) =>
          rel.insamling &&
          !rel.insamling.deleted_at &&
          (PUBLIK_STATUSAR as readonly string[]).includes(rel.insamling.status),
      ).length ?? 0;
    return { id: k.id, namn: k.namn, slug: k.slug, antal: n };
  });

  const hasAggregat = antalInsamlingar > 0 || totaltOre > 0;

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ padding: "80px 0 120px" }}>
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
                <span className="eyebrow">SADAQA · ZAKAT · UMMAH</span>
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
                En svenskspråkig plattform för det muslimska samhällets insamlingar — där pengarna
                går direkt till insamlaren via Stripe, varje projekt granskas innan publicering,
                och resultatet bevisas öppet.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {me ? (
                  arInsamlare ? (
                    <LinkButton href="/insamling" size="lg" rightIcon={<Icon name="arrow-right" size={20} />}>
                      Mina insamlingar
                    </LinkButton>
                  ) : (
                    <LinkButton href="/konto" size="lg" rightIcon={<Icon name="arrow-right" size={20} />}>
                      Till mitt konto
                    </LinkButton>
                  )
                ) : (
                  <LinkButton href="/insamlingar" size="lg" rightIcon={<Icon name="arrow-right" size={20} />}>
                    Utforska insamlingar
                  </LinkButton>
                )}
                <LinkButton href="/registrera" size="lg" variant="secondary">
                  Starta din egen
                </LinkButton>
              </div>

              <div
                className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-6 pt-8"
                style={{ borderTop: "1px solid var(--color-ink-line)" }}
              >
                {hasAggregat ? (
                  <>
                    <Stat figure={kortBelopp(totaltOre)} label="samlat in" />
                    <Stat figure={antal(antalInsamlingar)} label="publicerade insamlingar" />
                    <Stat figure="100 %" label="till mottagaren" />
                  </>
                ) : (
                  <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
                    Plattformen är ny. När de första insamlingarna publicerats syns siffrorna här.
                  </p>
                )}
              </div>
            </div>

            <HeroVisual />
          </div>
        </Container>
      </section>

      {/* SÅ FUNGERAR DET */}
      <Section tone="cream" spacing="default">
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <Star size={16} />
            <span className="eyebrow">SÅ FUNGERAR DET</span>
          </div>
          <h2 className="h-1 max-w-[800px]">Tre tydliga steg — från idé till bevis.</h2>
          <div
            className="mt-16 grid overflow-hidden md:grid-cols-3"
            style={{ background: "var(--color-ink-line)", gap: 1, border: "1px solid var(--color-ink-line)", borderRadius: 20 }}
          >
            {STEG.map((s) => (
              <div
                key={s.n}
                className="flex min-h-[340px] flex-col gap-4 p-10"
                style={{ background: "var(--color-paper-soft)" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 88,
                    lineHeight: 0.9,
                    color: "var(--color-copper)",
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    fontStyle: "italic",
                    marginBottom: 8,
                  }}
                >
                  {s.n}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    lineHeight: 1.15,
                    letterSpacing: "-0.012em",
                    fontWeight: 400,
                  }}
                >
                  {s.titel}
                </h3>
                <p style={{ fontSize: 15, color: "var(--color-ink-2)", lineHeight: 1.55 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* AKTIVA INSAMLINGAR */}
      <Section tone="paper" spacing="default">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Star size={16} />
                <span className="eyebrow">AKTIVA INSAMLINGAR</span>
              </div>
              <h2 className="h-2">Granskade och aktiva just nu.</h2>
            </div>
            <Link
              href="/insamlingar"
              className="text-sm font-semibold"
              style={{ color: "var(--color-forest)" }}
            >
              Se alla insamlingar →
            </Link>
          </div>
          {featured.length === 0 ? (
            <div
              className="mt-12 rounded-[20px] border p-12 text-center"
              style={{ borderColor: "var(--color-ink-line)", background: "var(--color-paper-soft)" }}
            >
              <p className="lead mb-6">
                Inga aktiva insamlingar publicerade än — du kan bli den första.
              </p>
              {arInsamlare ? (
                <LinkButton href="/insamling">Skapa en insamling</LinkButton>
              ) : me ? (
                <LinkButton href="/konto">Bli insamlare</LinkButton>
              ) : (
                <LinkButton href="/registrera">Skapa konto för att starta</LinkButton>
              )}
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featured.map((f) => (
                <InsamlingCard key={f.publicId} data={f} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* GRANSKNINGSLÖFTE — dark band */}
      <Section tone="forest" spacing="default">
        <div
          className="bg-star-pattern-dark absolute inset-0 pointer-events-none"
          style={{ position: "absolute" }}
        />
        <Container>
          <div className="relative grid items-center gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Star size={16} light />
                <span className="eyebrow" style={{ color: "var(--color-copper-warm)" }}>
                  GRANSKNINGSLÖFTET
                </span>
              </div>
              <h2 className="h-1" style={{ color: "var(--color-paper)" }}>
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
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 500,
                      color: "var(--color-paper)",
                      margin: 0,
                    }}
                  >
                    {p.titel}
                  </h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "rgba(245, 240, 228, 0.7)", lineHeight: 1.55 }}
                  >
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* KATEGORIER */}
      <Section tone="cream" spacing="default">
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <Star size={16} />
            <span className="eyebrow">OMRÅDEN</span>
          </div>
          <h2 className="h-2">Från akut katastrofhjälp till långsiktiga projekt.</h2>
          {kategorier.length === 0 ? (
            <p
              className="mt-8 text-sm"
              style={{ color: "var(--color-ink-3)" }}
            >
              Kategorier laddas. Försök ladda om sidan.
            </p>
          ) : (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {kategorier.map((k) => (
                <Link
                  key={k.id}
                  href={`/insamlingar?kategori=${encodeURIComponent(k.slug)}`}
                  className="flex min-h-[140px] flex-col gap-3 p-7 transition-all hover:-translate-y-0.5"
                  style={{
                    background: "var(--color-paper-soft)",
                    border: "1px solid var(--color-ink-line)",
                    borderRadius: "var(--radius-lg)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 400,
                      letterSpacing: "-0.008em",
                    }}
                  >
                    {k.namn}
                  </span>
                  <span
                    className="mt-auto text-xs"
                    style={{ color: "var(--color-ink-3)" }}
                  >
                    {k.antal > 0 ? `${k.antal} aktiva` : "Inga aktiva än"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* CTA-BAND */}
      <Section tone="paper" spacing="loose">
        <Container>
          <div
            className="relative overflow-hidden p-16 md:p-20"
            style={{
              background: "var(--color-forest)",
              color: "var(--color-paper)",
              borderRadius: 28,
            }}
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
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    lineHeight: 1.08,
                    fontWeight: 400,
                    letterSpacing: "-0.014em",
                    color: "var(--color-paper)",
                    margin: 0,
                  }}
                >
                  Bygg er förenings transparens — utan att rör en mjukvarurad.
                </h2>
                <p
                  className="mt-6 max-w-[480px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 300,
                    fontSize: 18,
                    color: "rgba(245, 240, 228, 0.75)",
                    lineHeight: 1.5,
                  }}
                >
                  Sadaqah Sweden är gratis för registrerade föreningar. Vi tar inget mellanskick —
                  ni får verktygen, vi sköter granskningen och plattformen.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <LinkButton
                  href="/registrera"
                  variant="copper"
                  size="lg"
                  rightIcon={<Icon name="arrow-right" size={20} />}
                >
                  Anmäl er förening
                </LinkButton>
                <Link
                  href="mailto:hej@sadaqahsweden.se"
                  className="text-sm"
                  style={{ color: "rgba(245, 240, 228, 0.6)" }}
                >
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

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="tabular"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          color: "var(--color-forest)",
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: "-0.012em",
        }}
      >
        {figure}
      </span>
      <span className="text-xs" style={{ color: "var(--color-ink-3)", letterSpacing: "0.05em" }}>
        {label}
      </span>
    </div>
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
    <div className="relative hidden md:block" style={{ height: 560 }}>
      <div
        className="absolute"
        style={{
          top: 60,
          left: -8,
          right: 60,
          bottom: 60,
          background: "var(--color-forest)",
          zIndex: 1,
          transform: "rotate(-2deg)",
          boxShadow: "var(--shadow-2)",
          borderRadius: 28,
          overflow: "hidden",
        }}
      />
      <div
        className="absolute"
        style={{
          inset: "0 24px 24px 0",
          zIndex: 2,
          background: "var(--color-paper-soft)",
          border: "1px solid var(--color-ink-line)",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "var(--shadow-3)",
        }}
      >
        <div className="ph relative" style={{ height: 320 }}>
          <div className="absolute left-6 top-6 z-10 flex gap-2">
            <Pill tone="dark" dot="pulse">
              Granskning levande
            </Pill>
            <Pill tone="dark">Plattform live</Pill>
          </div>
          <div
            className="absolute bottom-6 left-6"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 14,
              color: "rgba(245, 240, 228, 0.6)",
            }}
          >
            Foto: insamling som passerat granskning
          </div>
        </div>
        <div className="flex flex-col gap-3.5 p-7">
          <div
            className="text-xs font-semibold uppercase"
            style={{ letterSpacing: "0.16em", color: "var(--color-copper-deep)" }}
          >
            Exempel · designreferens
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 500,
              letterSpacing: "-0.008em",
              color: "var(--color-ink)",
              margin: 0,
            }}
          >
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
