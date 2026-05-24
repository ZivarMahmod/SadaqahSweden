// Modul M9 — Publik profil.
// Design: handoff-to-code/profile.html · Plan: 1-Planering/Modul-09-Profiler-och-anvandarsidor.md.
// Säkerhet: Läser via vy profil_publik (security_invoker) + insamling/badge-tabeller
// med RLS. Inga utkast/avvisade syns publikt (insamling_select_publik filtrerar).
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { datum, kortBelopp, kr, procentAvMal } from "@/lib/format";

type Params = Promise<{ publicId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profil_publik")
    .select("visningsnamn, presentation")
    .eq("public_id", publicId)
    .maybeSingle();
  if (!data) return { title: "Profil — Sadaqah Sweden" };
  return {
    title: `${data.visningsnamn} — Sadaqah Sweden`,
    description:
      data.presentation ??
      `Profil och transparens-historik för ${data.visningsnamn} på Sadaqah Sweden.`,
  };
}

export default async function ProfilPage({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();

  const { data: p, error } = await supabase
    .from("profil_publik")
    .select(
      "id, public_id, visningsnamn, presentation, stad, region, avatar_url, bankid_verifierad, ar_organisation, roll, medlem_sedan, antal_insamlingar, antal_levererade, antal_vantar_resultat, antal_utan_resultat, total_insamlat_ore",
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !p || !p.id) notFound();

  const profilId = p.id;

  // F10: visa antal donationer publikt om profilen valt öppen vy.
  const { data: antalDon } = await supabase.rpc("antal_publika_donationer", {
    p_profile_id: profilId,
  });
  const antalDonationer = (antalDon as number | null) ?? 0;

  // Insamlingar — publika status. RLS gör filtreringen.
  const { data: insamlingar } = await supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, status, malbelopp_modell, malbelopp_ore, malbelopp_max_ore, insamlat_ore, insamling_deadline, publicerad_at",
    )
    .eq("agare_id", profilId)
    .is("deleted_at", null)
    .order("publicerad_at", { ascending: false, nullsFirst: false });

  const { data: badges } = await supabase
    .from("profil_badge")
    .select("antal, uppdaterad_at, badge:badge_id(slug, namn, beskrivning)")
    .eq("profil_id", profilId)
    .order("uppdaterad_at", { ascending: false });

  const aktiva = (insamlingar ?? []).filter((i) => i.status === "aktiv");
  const avslutade = (insamlingar ?? []).filter((i) =>
    ["avslutad_levererad", "avslutad_utan_resultat", "utbetald"].includes(i.status),
  );
  const ovriga = (insamlingar ?? []).filter((i) =>
    !aktiva.includes(i) && !avslutade.includes(i),
  );

  const arNy = (p.antal_insamlingar ?? 0) === 0;

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container width="narrow">
          <div className="flex flex-wrap items-start gap-6">
            <div
              aria-hidden
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--color-copper-soft)",
                color: "var(--color-copper-deep)",
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 500,
              }}
            >
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initialer(p.visningsnamn ?? "?")
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {p.ar_organisation && <Pill tone="forest">Förening</Pill>}
                {p.bankid_verifierad && (
                  <Pill tone="success">
                    <Icon name="shield-check" size={12} /> Verifierad
                  </Pill>
                )}
                {arNy && <Pill tone="paper">Ny på plattformen</Pill>}
                {antalDonationer > 0 && (
                  <Pill tone="copper">
                    <Icon name="heart" size={12} /> {antalDonationer} donation{antalDonationer === 1 ? "" : "er"}
                  </Pill>
                )}
              </div>
              <h1 className="heading-1 mt-3">{p.visningsnamn ?? "Profil"}</h1>
              {p.presentation && (
                <p className="lead mt-3" style={{ maxWidth: "60ch" }}>
                  {p.presentation}
                </p>
              )}
              <p className="mt-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
                {p.stad ? `${p.stad}${p.region ? `, ${p.region}` : ""} · ` : ""}
                Medlem sedan {p.medlem_sedan ? datum(p.medlem_sedan) : "—"}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Track record (M9 B1.3) */}
      <Section tone="cream" spacing="tight">
        <Container width="narrow">
          <h2 className="heading-2">Track record</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
            Plattformen visar fakta — du drar slutsatsen.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Statkort label="Insamlingar" value={String(p.antal_insamlingar ?? 0)} />
            <Statkort label="Resultat levererat" value={String(p.antal_levererade ?? 0)} accent />
            <Statkort label="Väntar på resultat" value={String(p.antal_vantar_resultat ?? 0)} />
            <Statkort
              label="Total summa"
              value={p.total_insamlat_ore != null ? kortBelopp(p.total_insamlat_ore) : "—"}
              footnote={p.total_insamlat_ore == null ? "Användaren visar inte summa" : undefined}
            />
          </div>
          {(p.antal_utan_resultat ?? 0) > 0 && (
            <p className="mt-4 text-xs" style={{ color: "var(--color-ink-3)" }}>
              {p.antal_utan_resultat} avslutad{p.antal_utan_resultat === 1 ? "" : "e"} utan resultat-bevis.
            </p>
          )}
        </Container>
      </Section>

      {/* Insamlingar */}
      <Section tone="paper" spacing="default">
        <Container width="narrow">
          <h2 className="heading-2">Insamlingar</h2>

          {arNy && (
            <div className="mt-6">
              <EmptyState
                icon={<Icon name="sparkles" size={28} />}
                title={`${p.visningsnamn ?? "Profilen"} har inte startat någon insamling än`}
                description="Här kommer insamlingar att visas när de publiceras."
              />
            </div>
          )}

          {!arNy && (
            <div className="mt-6 flex flex-col gap-10">
              {aktiva.length > 0 && (
                <InsamlingsGrupp titel="Aktiva nu" insamlingar={aktiva} />
              )}
              {avslutade.length > 0 && (
                <InsamlingsGrupp titel="Avslutade" insamlingar={avslutade} />
              )}
              {ovriga.length > 0 && (
                <InsamlingsGrupp titel="Övriga" insamlingar={ovriga} />
              )}
            </div>
          )}
        </Container>
      </Section>

      {/* Utmärkelser */}
      {(badges ?? []).length > 0 && (
        <Section tone="cream" spacing="tight">
          <Container width="narrow">
            <h2 className="heading-2">Utmärkelser</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
              Lugnt tack — inte ranking. Sadaqah är komplett när pengarna lämnar handen.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(badges ?? []).map((row, i) =>
                row.badge ? (
                  <Card key={i} variant="tight">
                    <div className="flex items-start gap-3">
                      <span
                        style={{ color: "var(--color-copper)" }}
                        aria-hidden
                      >
                        <Icon name="shield-check" size={22} />
                      </span>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="heading-3">{row.badge.namn}</h3>
                          {row.antal > 1 && (
                            <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                              ×{row.antal}
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--color-ink-2)" }}
                        >
                          {row.badge.beskrivning}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : null,
              )}
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}

function InsamlingsGrupp({
  titel,
  insamlingar,
}: {
  titel: string;
  insamlingar: Array<{
    id: string;
    public_id: string;
    titel: string;
    kort_beskrivning: string;
    status: string;
    malbelopp_modell: string;
    malbelopp_ore: number | null;
    malbelopp_max_ore: number | null;
    insamlat_ore: number;
    insamling_deadline: string;
    publicerad_at: string | null;
  }>;
}) {
  return (
    <div>
      <h3 className="heading-3">{titel}</h3>
      <div className="mt-4 grid gap-3">
        {insamlingar.map((i) => {
          const procent = procentAvMal(
            i.insamlat_ore,
            i.malbelopp_modell,
            i.malbelopp_ore,
            i.malbelopp_max_ore,
          );
          const mal =
            i.malbelopp_modell === "fast"
              ? i.malbelopp_ore
              : i.malbelopp_modell === "intervall"
              ? i.malbelopp_max_ore
              : null;
          return (
            <Link
              key={i.id}
              href={`/insamlingar/${i.public_id}`}
              className="card card-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={statusTone(i.status)}>{statusLabel(i.status)}</Pill>
                    {i.publicerad_at && (
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        Publicerad {datum(i.publicerad_at)}
                      </span>
                    )}
                  </div>
                  <h4 className="heading-3 mt-2">{i.titel}</h4>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--color-ink-2)" }}
                  >
                    {i.kort_beskrivning}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span
                    className="tabular"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      color: "var(--color-forest)",
                      fontWeight: 500,
                    }}
                  >
                    {kr(i.insamlat_ore)}
                  </span>
                  {mal && (
                    <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                      av {kortBelopp(mal)}
                    </span>
                  )}
                </div>
              </div>
              {procent != null && (
                <div className="mt-4">
                  <Progress value={procent} ariaLabel={`${procent} % av målet`} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Statkort({
  label,
  value,
  accent,
  footnote,
}: {
  label: string;
  value: string;
  accent?: boolean;
  footnote?: string;
}) {
  return (
    <Card variant="tight">
      <span className="text-xs" style={{ color: "var(--color-ink-3)", letterSpacing: "0.05em" }}>
        {label.toUpperCase()}
      </span>
      <div
        className="mt-3 tabular"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 30,
          color: accent ? "var(--color-copper-deep)" : "var(--color-forest)",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {footnote && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
          {footnote}
        </p>
      )}
    </Card>
  );
}

function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function statusTone(s: string): "success" | "copper" | "outline" | "danger" | "paper" {
  if (s === "aktiv") return "success";
  if (s === "avslutad_levererad" || s === "utbetald") return "success";
  if (s === "vantar_pa_resultat" || s === "stangd") return "copper";
  if (s === "avslutad_utan_resultat") return "outline";
  if (s === "nedstangd") return "danger";
  return "paper";
}

function statusLabel(s: string): string {
  return ({
    aktiv: "Aktiv",
    stangd: "Stängd",
    utbetald: "Utbetald",
    vantar_pa_resultat: "Väntar resultat",
    avslutad_levererad: "Resultat levererat",
    avslutad_utan_resultat: "Utan resultat-bevis",
    pausad: "Pausad",
    nedstangd: "Nedstängd",
  } as Record<string, string>)[s] ?? s;
}
