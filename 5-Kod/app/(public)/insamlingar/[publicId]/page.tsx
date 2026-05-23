// Modul M1 + M7 — Publik insamlingsvy (detalj).
// Design: handoff-to-code/fundraiser.html · Plan: 1-Planering/Modul-01-Insamlingsobjekt.md.
// Säkerhet: Endast publika statusar visas. insamlat_ore skrivs aldrig av klient (pengaskydd-trigger).
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { Button, LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { dagarKvar, datum, kortBelopp, kr, procentAvMal } from "@/lib/format";

type Params = Promise<{ publicId: string }>;

const PUBLIK_STATUSAR = new Set([
  "aktiv",
  "stangd",
  "utbetald",
  "vantar_pa_resultat",
  "avslutad_levererad",
  "avslutad_utan_resultat",
  "pausad",
]);

type StatusInfo = { label: string; tone: "success" | "copper" | "outline" | "danger" };

const STATUS_INFO: Record<string, StatusInfo> = {
  aktiv: { label: "Aktiv — tar emot donationer", tone: "success" },
  stangd: { label: "Insamling stängd — väntar utbetalning", tone: "copper" },
  utbetald: { label: "Utbetald till insamlaren", tone: "success" },
  vantar_pa_resultat: { label: "Väntar på resultat-bevis", tone: "copper" },
  avslutad_levererad: { label: "Avslutad — bevisat levererad", tone: "success" },
  avslutad_utan_resultat: { label: "Avslutad utan resultat", tone: "danger" },
  pausad: { label: "Pausad", tone: "outline" },
};

export async function generateMetadata({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("insamling")
    .select("titel, kort_beskrivning, status, deleted_at")
    .eq("public_id", publicId)
    .single();

  if (!data || data.deleted_at || !PUBLIK_STATUSAR.has(data.status)) {
    return { title: "Insamling — Sadaqah Sweden" };
  }
  return {
    title: `${data.titel} — Sadaqah Sweden`,
    description: data.kort_beskrivning,
  };
}

export default async function InsamlingPage({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();

  const { data: i, error } = await supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, lang_beskrivning, mottagare_typ, mottagare_beskrivning, hjalp_land, hjalp_plats, insamlar_stad, insamlar_region, malbelopp_modell, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, insamlat_ore, insamling_deadline, genomforande_datum, overmalsplan, tillat_overmal, status, publicerad_at, deleted_at",
    )
    .eq("public_id", publicId)
    .single();

  if (error || !i || i.deleted_at || !PUBLIK_STATUSAR.has(i.status)) {
    notFound();
  }

  const procent = procentAvMal(
    i.insamlat_ore,
    i.malbelopp_modell,
    i.malbelopp_ore,
    i.malbelopp_max_ore,
  );
  const malbelopp =
    i.malbelopp_modell === "fast"
      ? i.malbelopp_ore
      : i.malbelopp_modell === "intervall"
      ? i.malbelopp_max_ore
      : null;
  const dagar = dagarKvar(i.insamling_deadline);
  const status = STATUS_INFO[i.status] ?? { label: i.status, tone: "outline" as const };
  const tarEmotDonationer = i.status === "aktiv";

  return (
    <main>
      {/* Hero / titel */}
      <Section tone="paper" spacing="tight">
        <Container width="narrow">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone={status.tone} dot={i.status === "aktiv" ? "pulse" : undefined}>
              {status.label}
            </Pill>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
              <Icon name="map-pin" size={12} /> Insamling i {i.insamlar_stad}
              {i.insamlar_region ? `, ${i.insamlar_region}` : ""} · Hjälpen landar i {i.hjalp_land}
              {i.hjalp_plats ? ` (${i.hjalp_plats})` : ""}
            </span>
          </div>
          <h1 className="h-1 mt-5">{i.titel}</h1>
          <p className="lead mt-4">{i.kort_beskrivning}</p>
        </Container>
      </Section>

      {/* Hero-bild + räknarpanel */}
      <Section tone="cream" spacing="tight">
        <Container width="narrow">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div
              className="ph relative overflow-hidden"
              style={{ borderRadius: 20, minHeight: 360 }}
            >
              <div className="absolute left-5 top-5 z-10 flex gap-2">
                <Pill tone="dark">Granskad</Pill>
                {i.publicerad_at && (
                  <Pill tone="dark">Publicerad {datum(i.publicerad_at)}</Pill>
                )}
              </div>
              <div
                className="absolute bottom-5 left-5"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "rgba(245, 240, 228, 0.6)",
                }}
              >
                {/* TODO (M2 — media): cover-bild från insamling_media (storage_path) byts in här. */}
                Foto från fältet visas här när media laddats upp.
              </div>
            </div>

            <Card variant="loose">
              <div className="flex items-baseline justify-between">
                <span
                  className="tabular"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 44,
                    color: "var(--color-forest)",
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {kr(i.insamlat_ore)}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
                {malbelopp ? (
                  <>
                    av <span className="tabular">{kortBelopp(malbelopp)}</span>{" "}
                    {i.malbelopp_modell === "intervall" && i.malbelopp_min_ore && (
                      <>(min {kortBelopp(i.malbelopp_min_ore)})</>
                    )}
                  </>
                ) : (
                  "öppen insamling — inget specifikt mål"
                )}
              </p>

              {procent != null && (
                <div className="mt-4">
                  <Progress value={procent} ariaLabel={`${procent} % av målet`} />
                  <div
                    className="mt-2 flex justify-between text-xs"
                    style={{ color: "var(--color-ink-3)" }}
                  >
                    <span>{procent} % av målet</span>
                    <span>{dagar} dgr kvar</span>
                  </div>
                </div>
              )}

              <div
                className="mt-6 grid grid-cols-2 gap-3 pt-5 text-xs"
                style={{ borderTop: "1px solid var(--color-ink-line)", color: "var(--color-ink-3)" }}
              >
                <div>
                  <div>Insamlingen stänger</div>
                  <div
                    className="mt-1 font-semibold"
                    style={{ color: "var(--color-ink)", fontSize: 14 }}
                  >
                    {datum(i.insamling_deadline)}
                  </div>
                </div>
                <div>
                  <div>Genomförs senast</div>
                  <div
                    className="mt-1 font-semibold"
                    style={{ color: "var(--color-ink)", fontSize: 14 }}
                  >
                    {datum(i.genomforande_datum)}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {tarEmotDonationer ? (
                  // TODO (M4 — Steg 6): koppla in Stripe PaymentIntent serverside.
                  // Belopp sätts ALDRIG av klienten. Webhook = sanningen.
                  <Button block size="lg" variant="copper" disabled>
                    <Icon name="heart" size={18} /> Donera (kopplas in i Steg 6 — Stripe)
                  </Button>
                ) : (
                  <Button block size="lg" variant="secondary" disabled>
                    Insamlingen tar inte längre emot donationer
                  </Button>
                )}
                <p className="mt-3 text-center text-xs" style={{ color: "var(--color-ink-3)" }}>
                  Pengar går direkt till insamlaren via Stripe — 0 % plattformsavgift.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Innehåll */}
      <Section tone="paper" spacing="default">
        <Container width="narrow">
          <div className="grid gap-12 md:grid-cols-[2fr_1fr]">
            <article>
              <h2 className="h-2">Om insamlingen</h2>
              <p
                className="mt-6 whitespace-pre-wrap text-base leading-relaxed"
                style={{ color: "var(--color-ink-1)" }}
              >
                {i.lang_beskrivning}
              </p>

              <h2 className="h-3 mt-12">Mottagare</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
                {humanMottagare(i.mottagare_typ)}
              </p>
              <p className="mt-3" style={{ color: "var(--color-ink-1)" }}>
                {i.mottagare_beskrivning}
              </p>

              {i.tillat_overmal && i.overmalsplan && (
                <>
                  <h2 className="h-3 mt-12">Vad händer vid övermål</h2>
                  <p className="mt-3" style={{ color: "var(--color-ink-1)" }}>
                    {i.overmalsplan}
                  </p>
                </>
              )}
            </article>

            <aside>
              <Card variant="tight">
                <h3 className="h-3">Granskningslöftet</h3>
                <ul className="mt-4 flex flex-col gap-3 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "var(--color-copper)" }}>
                      <Icon name="shield-check" size={16} />
                    </span>
                    Verifierad mottagare och syfte.
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "var(--color-copper)" }}>
                      <Icon name="lock" size={16} />
                    </span>
                    Pengar via Stripe direkt till insamlaren.
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "var(--color-copper)" }}>
                      <Icon name="file-check" size={16} />
                    </span>
                    Resultat-bevis krävs innan insamlingen avslutas.
                  </li>
                </ul>
              </Card>

              <Card variant="tight" className="mt-4">
                <h3 className="h-3">Dela</h3>
                <p className="mt-3 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Sprid insamlingen i ditt nätverk — varje delning är sadaqah jariyah.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LinkButton
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `${i.titel} — Sadaqah Sweden\nhttps://sadaqahsweden.se/insamlingar/${i.public_id}`,
                    )}`}
                    variant="secondary"
                    size="sm"
                  >
                    WhatsApp
                  </LinkButton>
                  <LinkButton
                    href={`mailto:?subject=${encodeURIComponent(i.titel)}&body=${encodeURIComponent(
                      `Stötta gärna: https://sadaqahsweden.se/insamlingar/${i.public_id}`,
                    )}`}
                    variant="secondary"
                    size="sm"
                  >
                    E-post
                  </LinkButton>
                </div>
                <p
                  className="mt-4 text-xs"
                  style={{ color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}
                >
                  {i.public_id}
                </p>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function humanMottagare(typ: string): string {
  const m: Record<string, string> = {
    ej_angivet: "Typ: ej angivet",
    enskild_person: "Enskild person eller familj",
    forening: "Förening / organisation",
    moske: "Moské",
    byprojekt: "Byprojekt / samhälle",
    katastrof: "Katastrofhjälp — drabbat område",
    annat: "Annat",
  };
  return m[typ] ?? `Typ: ${typ}`;
}
