// M17 — min aktivitet (personlig audit-log).

import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Min aktivitet — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

const TYP_LABEL: Record<string, string> = {
  invite_skapad: "Inbjudan skapad",
  invite_redeemed: "Inbjudan inlöst",
  invite_avbruten: "Inbjudan avbruten",
  roll_befordrad: "Roll uppdaterad",
  roll_inaktiverad: "Konto inaktiverat",
  roll_aterstalld: "Konto återställt",
  totp_aktiverad: "TOTP aktiverat",
  totp_aterstalld: "TOTP återställt",
  login_team: "Inloggning",
  session_invalidated: "Session avbruten",
  annat: "Annat",
};

export default async function MinAktivitet() {
  const me = await aktuellAnvandare();
  if (!me) redirect("/login?retur=/team/min-aktivitet");

  const supabase = await createClient();
  const { data: rader } = await supabase
    .from("team_activity_log")
    .select("id, typ, beskrivning, detaljer, created_at, utfort_av, profiles:utfort_av(visningsnamn)")
    .eq("profile_id", me.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="heading-2">Min aktivitet</h1>
        <p className="lead mt-2">Allt som rör ditt team-konto loggas här — append-only.</p>

        {(rader ?? []).length === 0 ? (
          <Card variant="tight" className="mt-8">
            <p style={{ color: "var(--color-ink-3)" }}>Ingen aktivitet ännu.</p>
          </Card>
        ) : (
          <ul className="mt-8 flex flex-col gap-2">
            {(rader ?? []).map((r) => {
              const utfortProfile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
              const utfort = (utfortProfile as { visningsnamn?: string } | null)?.visningsnamn;
              return (
                <li key={r.id}>
                  <Card variant="tight">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Pill tone="outline">{TYP_LABEL[r.typ] ?? r.typ}</Pill>
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {new Date(r.created_at).toLocaleString("sv-SE")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{r.beskrivning}</p>
                    {utfort && r.utfort_av !== me.userId && (
                      <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                        av {utfort}
                      </p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </Section>
  );
}
