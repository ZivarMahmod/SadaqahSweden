// M16 — admin-ingreppsloggen. Append-only, fullt sökbar.

import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Ingreppslogg — Admin — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

const INGREPP_LABEL: Record<string, string> = {
  pausa_insamling: "Pausa insamling",
  aterstall_insamling: "Återställ insamling",
  stang_insamling: "Stäng insamling (refund)",
  installt_event: "Inställt event",
  initiera_refund: "Initiera refund",
  dolj_kommentar: "Dölj kommentar",
  aterstall_kommentar: "Återställ kommentar",
  overrida_falt: "Överrida fält",
  frysning_konto: "Frys konto",
  aterstall_konto: "Återställ konto",
  avfard_larm: "Avfärda larm",
  annat: "Annat",
};

export default async function AdminLoggSida() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: logg } = await supabase
    .from("admin_ingreppslogg")
    .select(
      "id, ingrepp_typ, motivering, reversibel, created_at, mal_insamling_id, mal_kommentar_id, profiles:admin_id(visningsnamn)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="h-2">Ingreppslogg</h1>
        <p className="lead mt-2">Varje admin-ingrepp loggas här — vem, vad, när, varför. Loggen är append-only.</p>

        {(logg ?? []).length === 0 ? (
          <Card variant="tight" className="mt-6">
            <p style={{ color: "var(--color-ink-3)" }}>Inga ingrepp loggade ännu.</p>
          </Card>
        ) : (
          <ul className="mt-8 flex flex-col gap-2">
            {(logg ?? []).map((rad) => {
              const profil = Array.isArray(rad.profiles) ? rad.profiles[0] : rad.profiles;
              const admin = (profil as { visningsnamn?: string } | null)?.visningsnamn ?? "—";
              return (
                <li key={rad.id}>
                  <Card variant="tight">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={rad.reversibel ? "outline" : "danger"}>
                          {rad.reversibel ? "Reversibel" : "Permanent"}
                        </Pill>
                        <Pill tone="paper">{INGREPP_LABEL[rad.ingrepp_typ] ?? rad.ingrepp_typ}</Pill>
                        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          av {admin}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {new Date(rad.created_at).toLocaleString("sv-SE")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-ink-1)" }}>
                      {rad.motivering}
                    </p>
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
