// Modul M2 — Mina insamlingar (insamlar-lista).
// Design: handoff-to-code/account.html · Plan: 1-Planering/Modul-02-Skapa-insamling.md.
// Säkerhet: RLS säkrar att en insamlare bara ser sina egna rader (agare_id = auth.uid()).
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { skapaUtkast } from "./actions";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { datum, kortBelopp, kr, procentAvMal } from "@/lib/format";

export const metadata = {
  title: "Mina insamlingar — Sadaqah Sweden",
};

type StatusTon = "forest" | "copper" | "danger" | "success" | "paper" | "outline";

const STATUS: Record<string, { label: string; tone: StatusTon }> = {
  utkast: { label: "Utkast", tone: "paper" },
  inskickad: { label: "Inskickad — väntar granskning", tone: "copper" },
  under_granskning: { label: "Under granskning", tone: "copper" },
  andring_begard: { label: "Ändring begärd", tone: "danger" },
  avvisad: { label: "Avvisad", tone: "danger" },
  aktiv: { label: "Aktiv — publik", tone: "success" },
  stangd: { label: "Stängd", tone: "outline" },
  utbetald: { label: "Utbetald", tone: "success" },
  vantar_pa_resultat: { label: "Väntar på resultat", tone: "copper" },
  avslutad_levererad: { label: "Levererad", tone: "success" },
  avslutad_utan_resultat: { label: "Avslutad utan resultat", tone: "danger" },
  pausad: { label: "Pausad", tone: "paper" },
  nedstangd: { label: "Nedstängd", tone: "danger" },
};

export default async function MinaInsamlingarPage() {
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const { data: insamlingar, error } = await supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, status, malbelopp_modell, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, insamlat_ore, insamling_deadline, created_at, publicerad_at",
    )
    .eq("agare_id", me.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Aggregat över egna insamlingar
  const totalt = insamlingar?.reduce((s, i) => s + i.insamlat_ore, 0) ?? 0;
  const aktiva = insamlingar?.filter((i) => i.status === "aktiv").length ?? 0;
  const utkast = insamlingar?.filter((i) => i.status === "utkast" || i.status === "andring_begard").length ?? 0;
  const underGranskning = insamlingar?.filter(
    (i) => i.status === "inskickad" || i.status === "under_granskning",
  ).length ?? 0;

  return (
    <Section tone="paper" spacing="default">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">INSAMLAR-VY</span>
            <h1 className="heading-1 mt-3">Mina insamlingar</h1>
            <p className="lead mt-3 max-w-[640px]">
              Skapa, redigera och skicka in dina projekt. Granskaren tar vid när du är klar.
            </p>
          </div>
          <form action={skapaUtkast}>
            <Button size="lg" leftIcon={<Icon name="plus" size={18} />}>
              Skapa nytt utkast
            </Button>
          </form>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard label="Totalt insamlat" value={kortBelopp(totalt)} icon="heart" />
          <StatCard label="Aktiva nu" value={String(aktiva)} icon="sparkles" />
          <StatCard label="Under granskning" value={String(underGranskning)} icon="shield" />
          <StatCard label="Utkast / återöppnade" value={String(utkast)} icon="edit" />
        </div>

        {/* Lista */}
        <div className="mt-12">
          {error && (
            <div
              className="card border-red-200 bg-red-50 text-red-900"
              role="alert"
            >
              Något gick fel: {error.message}
            </div>
          )}

          {!error && (!insamlingar || insamlingar.length === 0) && (
            <EmptyState
              icon={<Icon name="sparkles" size={28} />}
              title="Inga insamlingar än"
              description="Klicka Skapa nytt utkast för att börja. Du kan spara och fortsätta senare — utkast är privata tills du skickar in."
              action={
                <form action={skapaUtkast}>
                  <Button leftIcon={<Icon name="plus" size={16} />}>Skapa nytt utkast</Button>
                </form>
              }
            />
          )}

          {insamlingar && insamlingar.length > 0 && (
            <div className="grid gap-4">
              {insamlingar.map((i) => {
                const s = STATUS[i.status] ?? { label: i.status, tone: "paper" as StatusTon };
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
                const kanRedigera = i.status === "utkast" || i.status === "andring_begard";
                const arPublik = [
                  "aktiv",
                  "stangd",
                  "utbetald",
                  "vantar_pa_resultat",
                  "avslutad_levererad",
                  "avslutad_utan_resultat",
                  "pausad",
                ].includes(i.status);

                return (
                  <Card key={i.id} variant="default" hover>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Pill tone={s.tone}>{s.label}</Pill>
                          <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                            Skapad {datum(i.created_at)}
                            {i.publicerad_at && <> · Publicerad {datum(i.publicerad_at)}</>}
                          </span>
                        </div>
                        <h3 className="heading-3">{i.titel}</h3>
                        <p
                          className="mt-2 text-sm"
                          style={{ color: "var(--color-ink-2)" }}
                        >
                          {i.kort_beskrivning}
                        </p>
                        <p
                          className="mt-2 text-xs"
                          style={{ color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}
                        >
                          {i.public_id}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                        <span
                          className="tabular"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 28,
                            color: "var(--color-forest)",
                            fontWeight: 500,
                            lineHeight: 1,
                          }}
                        >
                          {kr(i.insamlat_ore)}
                        </span>
                        {malbelopp && (
                          <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                            av {kr(malbelopp)}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          Deadline {datum(i.insamling_deadline)}
                        </span>
                      </div>
                    </div>

                    {procent != null && (
                      <div className="mt-4">
                        <Progress value={procent} ariaLabel={`${procent} % av målet`} />
                      </div>
                    )}

                    <div
                      className="mt-5 flex flex-wrap items-center gap-3 pt-4"
                      style={{ borderTop: "1px solid var(--color-ink-line)" }}
                    >
                      {kanRedigera && (
                        <LinkButton
                          href={`/insamling/${i.id}/redigera`}
                          variant="primary"
                          size="sm"
                          leftIcon={<Icon name="edit" size={14} />}
                        >
                          Fortsätt redigera
                        </LinkButton>
                      )}
                      {!kanRedigera && arPublik && (
                        <LinkButton
                          href={`/insamling/${i.id}`}
                          variant="primary"
                          size="sm"
                          leftIcon={<Icon name="sparkles" size={14} />}
                        >
                          Hantera & posta uppdatering
                        </LinkButton>
                      )}
                      {!kanRedigera && !arPublik && (
                        <Link
                          href={`/insamling/${i.id}/redigera`}
                          className="btn btn-secondary btn-sm"
                          aria-disabled
                        >
                          Skrivskyddad efter inskick
                        </Link>
                      )}
                      {arPublik && (
                        <LinkButton
                          href={`/insamlingar/${i.public_id}`}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Icon name="external" size={14} />}
                        >
                          Se publik sida
                        </LinkButton>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Card variant="tight">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: "var(--color-ink-3)", letterSpacing: "0.05em" }}>
          {label.toUpperCase()}
        </span>
        <span style={{ color: "var(--color-copper)" }}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div
        className="mt-3 tabular"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          color: "var(--color-forest)",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </Card>
  );
}
