// Modul M3 — Granskningskö (intern översikt för granskare/admin).
// Design: handoff-to-code/review.html § kö · Plan: Modul-03 Block 1.
// Säkerhet: kraver(['granskare','admin']) + RLS granskning_select.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { datum, kortBelopp } from "@/lib/format";
import { tilldelaOchOppna } from "./actions";

export const metadata = {
  title: "Granskningskö — Sadaqah Sweden",
};

const STATUS_PILL: Record<string, { label: string; tone: "copper" | "forest" | "outline" }> = {
  inskickad: { label: "I kö", tone: "copper" },
  under_granskning: { label: "Pågående", tone: "forest" },
  andring_begard: { label: "Ändring begärd", tone: "outline" },
};

function timmarSedan(iso: string): string {
  const t = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3600000));
  if (t < 24) return `${t} h sedan`;
  return `${Math.floor(t / 24)} dgr sedan`;
}

function slaSignal(deadlineIso: string | null): {
  tone: "success" | "copper" | "danger";
  text: string;
} {
  if (!deadlineIso) return { tone: "success", text: "Ingen SLA" };
  const diff = new Date(deadlineIso).getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  if (h < 0) return { tone: "danger", text: `${Math.abs(h)} h över SLA` };
  if (h < 24) return { tone: "copper", text: `${h} h kvar av SLA` };
  return { tone: "success", text: `${h} h kvar av SLA` };
}

export default async function GranskningKoPage() {
  const me = await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: rader, error } = await supabase
    .from("granskning")
    .select(
      "id, runda, tilldelad_granskare_id, sla_deadline, inskickad_at, eskalerad, avgjord_at, insamling:insamling_id(public_id, titel, kort_beskrivning, status, malbelopp_modell, malbelopp_ore, malbelopp_max_ore, insamlar_stad, hjalp_land, agare_id, profiles!insamling_agare_id_fkey(visningsnamn))",
    )
    .is("avgjord_at", null)
    .order("inskickad_at", { ascending: true })
    .limit(100);

  // Aggregat — kö-stats
  const totalOppna = rader?.length ?? 0;
  const mina =
    rader?.filter((r) => r.tilldelad_granskare_id === me.userId).length ?? 0;
  const overSla =
    rader?.filter(
      (r) => r.sla_deadline && new Date(r.sla_deadline).getTime() < Date.now(),
    ).length ?? 0;
  const eskalerade = rader?.filter((r) => r.eskalerad).length ?? 0;

  return (
    <Section tone="paper" spacing="default">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">GRANSKARE</span>
            <h1 className="h-1 mt-3">Granskningskö</h1>
            <p className="lead mt-3 max-w-[640px]">
              Inkommande och pågående ärenden. SLA-riktmärke 72 h från inskickning till första
              besked. Plocka ett ärende eller fortsätt på ett du redan tilldelats.
            </p>
          </div>
          <div className="flex gap-2">
            <Pill tone="paper">
              <Icon name="user" size={12} /> {me.profil.visningsnamn}
            </Pill>
            <Pill tone="copper">
              <Icon name="shield-check" size={12} /> {me.roll}
            </Pill>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <KoStat label="Öppna ärenden" value={String(totalOppna)} icon="inbox" />
          <KoStat label="Mina ärenden" value={String(mina)} icon="user" />
          <KoStat
            label="Över SLA"
            value={String(overSla)}
            icon="alert-triangle"
            tone={overSla > 0 ? "danger" : "default"}
          />
          <KoStat label="Eskalerade" value={String(eskalerade)} icon="flag" />
        </div>

        <div className="mt-12">
          {error && (
            <div
              className="card"
              style={{
                borderColor: "rgba(139,58,46,0.3)",
                background: "var(--color-danger-soft)",
                color: "var(--color-danger)",
              }}
              role="alert"
            >
              Kunde inte läsa kön: {error.message}
            </div>
          )}

          {!error && (!rader || rader.length === 0) && (
            <EmptyState
              icon={<Icon name="check-circle" size={28} />}
              title="Kön är tom"
              description="Inga inskickade ärenden väntar just nu. Kom tillbaka om en stund — auto-tilldelning lägger nya ärenden här direkt."
              action={
                <LinkButton href="/konto" variant="secondary">
                  Tillbaka till mitt konto
                </LinkButton>
              }
            />
          )}

          {rader && rader.length > 0 && (
            <ul className="flex flex-col gap-3">
              {rader.map((g) => {
                const ins = g.insamling;
                if (!ins) return null;
                const status = STATUS_PILL[ins.status] ?? { label: ins.status, tone: "outline" as const };
                const sla = slaSignal(g.sla_deadline);
                const mal =
                  ins.malbelopp_modell === "fast"
                    ? ins.malbelopp_ore
                    : ins.malbelopp_modell === "intervall"
                    ? ins.malbelopp_max_ore
                    : null;
                const eyDigital = g.tilldelad_granskare_id === me.userId;

                return (
                  <li key={g.id}>
                    <Card variant="default">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Pill tone={status.tone}>{status.label}</Pill>
                            {g.runda > 1 && <Pill tone="paper">Runda {g.runda}</Pill>}
                            {g.eskalerad && (
                              <Pill tone="copper">
                                <Icon name="flag" size={12} /> Eskalerad
                              </Pill>
                            )}
                            <Pill tone={sla.tone === "success" ? "success" : sla.tone === "copper" ? "copper" : "danger"}>
                              <Icon name="clock" size={12} /> {sla.text}
                            </Pill>
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-ink-3)" }}
                            >
                              Inskickad {timmarSedan(g.inskickad_at)}
                            </span>
                          </div>
                          <h3 className="h-3">{ins.titel}</h3>
                          <p
                            className="mt-1 line-clamp-2 text-sm"
                            style={{ color: "var(--color-ink-2)" }}
                          >
                            {ins.kort_beskrivning}
                          </p>
                          <div
                            className="mt-3 flex flex-wrap gap-4 text-xs"
                            style={{ color: "var(--color-ink-3)" }}
                          >
                            <span>
                              <Icon name="user" size={12} />{" "}
                              {ins.profiles?.visningsnamn ?? "okänd insamlare"}
                            </span>
                            <span>
                              <Icon name="map-pin" size={12} /> {ins.insamlar_stad} →{" "}
                              {ins.hjalp_land}
                            </span>
                            {mal && (
                              <span style={{ fontFamily: "var(--font-mono)" }}>
                                Mål {kortBelopp(mal)}
                              </span>
                            )}
                            <span>Inskickad {datum(g.inskickad_at)}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:items-end">
                          {eyDigital ? (
                            <LinkButton
                              href={`/granskning/${g.id}`}
                              size="sm"
                              variant="primary"
                              rightIcon={<Icon name="arrow-right" size={14} />}
                            >
                              Öppna mitt ärende
                            </LinkButton>
                          ) : g.tilldelad_granskare_id ? (
                            <>
                              <LinkButton
                                href={`/granskning/${g.id}`}
                                size="sm"
                                variant="secondary"
                                rightIcon={<Icon name="external" size={14} />}
                              >
                                Öppna (annans)
                              </LinkButton>
                              <p
                                className="text-xs"
                                style={{ color: "var(--color-ink-3)" }}
                              >
                                Tilldelad annan granskare
                              </p>
                            </>
                          ) : (
                            <form action={tilldelaOchOppna}>
                              <input type="hidden" name="granskning_id" value={g.id} />
                              <button
                                type="submit"
                                className="btn btn-copper btn-sm"
                              >
                                <Icon name="plus" size={14} /> Ta upp & öppna
                              </button>
                            </form>
                          )}
                          <Link
                            href={`/insamlingar/${ins.public_id}`}
                            className="text-xs"
                            style={{ color: "var(--color-ink-3)", textDecoration: "underline" }}
                          >
                            Donator-preview →
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </Section>
  );
}

function KoStat({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: string;
  tone?: "default" | "danger";
}) {
  const color =
    tone === "danger" ? "var(--color-danger)" : "var(--color-forest)";
  return (
    <Card variant="tight">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: "var(--color-ink-3)", letterSpacing: "0.05em" }}>
          {label.toUpperCase()}
        </span>
        <span style={{ color: tone === "danger" ? "var(--color-danger)" : "var(--color-copper)" }}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div
        className="mt-3 tabular"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          color,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </Card>
  );
}
