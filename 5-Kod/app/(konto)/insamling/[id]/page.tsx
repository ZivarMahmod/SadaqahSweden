// Modul M7 — Insamlar-dashboard: transparens-flöde + actions.
// Design: handoff-to-code/fundraiser.html (insamlar-vy) ·
// Plan: Modul-07 Block 1–3, Modul-02 (insamlarens dashboard).
// Säkerhet: kraver(["insamlare","forening","admin"]) + RLS insamling_select_egen
// (agare_id = auth.uid()). RPC-anropen serverside verifierar ägarskap igen.
import { notFound, redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TransparensTidslinje } from "@/components/transparens-tidslinje";
import { UppdateringForm, ResultatBevisForm } from "./transparens-form";
import { kortBelopp, kr, datum, procentAvMal, dagarKvar } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Insamling — Sadaqah Sweden",
};

const KAN_POSTA_UPPDATERING = new Set([
  "aktiv",
  "stangd",
  "utbetald",
  "vantar_pa_resultat",
  "avslutad_levererad",
  "pausad",
]);

const KAN_POSTA_RESULTAT = new Set([
  "aktiv",
  "stangd",
  "utbetald",
  "vantar_pa_resultat",
]);

export default async function InsamlingDashboard({ params }: { params: Params }) {
  const { id } = await params;
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const { data: i, error } = await supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, status, malbelopp_modell, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, insamlat_ore, insamlat_netto_ore, utbetald_ore, insamling_deadline, genomforande_datum, publicerad_at, agare_id, connected_account_id",
    )
    .eq("id", id)
    .single();

  if (error || !i) notFound();
  if (i.agare_id !== me.userId && me.roll !== "admin") {
    redirect("/insamling");
  }

  // Är utkast/avvisad/inskickad → redirecta till redigera (huvudflöde där).
  if (["utkast", "andring_begard"].includes(i.status)) {
    redirect(`/insamling/${i.id}/redigera`);
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
  const arPublik = ![
    "utkast",
    "inskickad",
    "under_granskning",
    "andring_begard",
    "avvisad",
  ].includes(i.status);

  const kanPostaUppdatering = KAN_POSTA_UPPDATERING.has(i.status);
  const kanPostaResultat = KAN_POSTA_RESULTAT.has(i.status);

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/insamling" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
            Mina insamlingar
          </LinkButton>
          <Pill tone="success" dot={i.status === "aktiv" ? "pulse" : undefined}>
            {humanStatus(i.status)}
          </Pill>
          {!i.connected_account_id && (
            <Pill tone="copper">Stripe-onboarding saknas</Pill>
          )}
        </div>
        <h1 className="h-1 mt-4">{i.titel}</h1>
        <p className="lead mt-2">{i.kort_beskrivning}</p>

        <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
          {/* Vänster: transparens-flöde + actions */}
          <div className="flex flex-col gap-8">
            <Card>
              <h2 className="h-3">Transparens-loopen</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                Start och utbetalning skapas automatiskt av plattformen.
                Resultat-bevis postar du själv när det lovade är genomfört.
              </p>
              <div className="mt-6">
                <TransparensTidslinje insamlingId={i.id} />
              </div>
            </Card>

            {kanPostaUppdatering && (
              <Card>
                <h2 className="h-3">Fri uppdatering</h2>
                <div className="mt-4">
                  <UppdateringForm insamlingId={i.id} />
                </div>
              </Card>
            )}

            {kanPostaResultat && (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="h-3">Resultat-bevis</h2>
                  <Pill tone="copper">M7 Bevis 3</Pill>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Detta är det viktigaste enskilda steget — det stänger loopen.
                  Granskaren gör en lättviktig äkthetskoll. Vid godkänt resultat
                  tilldelas insamlingen badgen <em>Resultat levererat</em>.
                </p>
                <div className="mt-5">
                  <ResultatBevisForm insamlingId={i.id} />
                </div>
              </Card>
            )}

            {i.status === "avslutad_levererad" && (
              <Card variant="forest">
                <h2 className="h-3">Loopen är sluten</h2>
                <p className="mt-2" style={{ color: "var(--color-ink-2)" }}>
                  Tack — du levererade. Historiken följer dig och insamlingens
                  publika sida visar nu hela resan.
                </p>
              </Card>
            )}

            {i.status === "avslutad_utan_resultat" && (
              <Card variant="tight">
                <h2 className="h-3">Avslutad utan resultat</h2>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Inget resultat-bevis kom in inom tidsramen. Du kan fortfarande
                  posta en fri uppdatering om läget — historiken visas neutralt
                  (Tripadvisor-modellen, M7 B5).
                </p>
              </Card>
            )}
          </div>

          {/* Höger: meta + länkar */}
          <aside className="flex flex-col gap-6">
            <Card variant="tight">
              <h3 className="h-3">Insamlat</h3>
              <div className="mt-4">
                <div
                  className="tabular"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 30,
                    color: "var(--color-forest)",
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {kr(i.insamlat_ore)}
                </div>
                {malbelopp && (
                  <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                    av {kortBelopp(malbelopp)}
                  </p>
                )}
              </div>
              {procent != null && (
                <div className="mt-4">
                  <Progress value={procent} ariaLabel={`${procent} % av målet`} />
                </div>
              )}
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <Row label="Netto">{kr(i.insamlat_netto_ore ?? 0)}</Row>
                <Row label="Utbetalt">{kr(i.utbetald_ore ?? 0)}</Row>
                <Row label="Deadline">
                  {datum(i.insamling_deadline)} ({dagar} dgr kvar)
                </Row>
                <Row label="Genomförs">{datum(i.genomforande_datum)}</Row>
              </dl>
            </Card>

            <Card variant="tight">
              <h3 className="h-3">Länkar</h3>
              <div className="mt-4 flex flex-col gap-2">
                {arPublik && (
                  <LinkButton
                    href={`/insamlingar/${i.public_id}`}
                    variant="secondary"
                    size="sm"
                    leftIcon={<Icon name="external" size={14} />}
                  >
                    Publik sida
                  </LinkButton>
                )}
                <LinkButton
                  href={`/stripe/onboarding`}
                  variant="ghost"
                  size="sm"
                  leftIcon={<Icon name="shield" size={14} />}
                >
                  Stripe-onboarding
                </LinkButton>
              </div>
            </Card>

            <Card variant="tight">
              <h3 className="h-3">Säkerhet</h3>
              <ul className="mt-3 flex flex-col gap-2 text-xs" style={{ color: "var(--color-ink-2)" }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: "var(--color-copper)" }}>
                    <Icon name="lock" size={14} />
                  </span>
                  Insamlat-belopp skrivs bara av Stripe-webhook.
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "var(--color-copper)" }}>
                    <Icon name="shield-check" size={14} />
                  </span>
                  Resultat-bevis granskas av plattformen innan loopen sluts.
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-3">
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function humanStatus(s: string): string {
  return ({
    aktiv: "Aktiv — publik",
    stangd: "Stängd — väntar utbetalning",
    utbetald: "Utbetald",
    vantar_pa_resultat: "Väntar på resultat",
    avslutad_levererad: "Resultat levererat",
    avslutad_utan_resultat: "Avslutad utan resultat",
    pausad: "Pausad",
    nedstangd: "Nedstängd",
    inskickad: "Inskickad",
    under_granskning: "Under granskning",
  } as Record<string, string>)[s] ?? s;
}
