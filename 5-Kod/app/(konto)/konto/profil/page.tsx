// Modul M9 — Min profil (redigera + förhandsvy).
// Plan: 1-Planering/Modul-09 B3.4 "Förhandsvy 'så här ser andra din profil'".
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProfilForm } from "./profil-form";
import { NotisPrefForm } from "./notis-pref-form";
import { TeamRollPaus } from "./team-roll-paus";

export const metadata = {
  title: "Min profil — Sadaqah Sweden",
};

export default async function MinProfilPage() {
  const me = await kraver();
  const supabase = await createClient();
  const { data: prefRader } = await supabase
    .from("notis_preferens")
    .select("grupp, in_app, epost")
    .eq("profil_id", me.userId);
  type Grupp = "mina_insamlingar" | "stottat" | "community" | "upptack";
  const preferenser = (prefRader ?? [])
    .filter((p): p is { grupp: Grupp; in_app: boolean; epost: boolean } =>
      ["mina_insamlingar","stottat","community","upptack"].includes(p.grupp))
    .map((p) => ({ grupp: p.grupp, in_app: p.in_app, epost: p.epost }));
  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/konto" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
            Tillbaka till konto
          </LinkButton>
        </div>
        <h1 className="h-1 mt-4">Min profil</h1>
        <p className="lead mt-2">
          Det här är vad andra ser. Vill du dölja något – kryssa av i Integritet
          längst ner.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
          <Card>
            <ProfilForm
              visningsnamn={me.profil.visningsnamn}
              presentation={me.profil.presentation ?? null}
              stad={me.profil.stad ?? null}
              region={me.profil.region ?? null}
              avatarUrl={me.profil.avatar_url ?? null}
              visaTotalSumma={me.profil.visa_total_summa ?? true}
              visaStad={me.profil.visa_stad ?? true}
            />
          </Card>
          <Card variant="tight">
            <h3 className="h-3">Förhandsvy</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
              Öppna din publika profil i en ny flik — så ser besökare ut den
              just nu.
            </p>
            <LinkButton
              href={`/profil/${me.profil.public_id}`}
              variant="secondary"
              size="sm"
              className="mt-4"
              rightIcon={<Icon name="external" size={14} />}
            >
              Visa publik profil
            </LinkButton>
          </Card>
        </div>

        {/* F7: paus av team-roll — synligt bara för team-konton (även när pausade). */}
        {(me.profil.roll === "granskare" || me.profil.roll === "admin") && (
          <Card className="mt-8">
            <h2 className="h-2">Team-roll</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
              En person = ett konto. Pausa team-rollen om du tillfälligt vill
              agera som vanlig insamlare för en egen insamling.
            </p>
            <div className="mt-4">
              <TeamRollPaus
                arPausad={me.profil.team_roll_pausad_at != null}
                pausadSkal={me.profil.team_roll_pausad_skal ?? null}
                pausadAt={me.profil.team_roll_pausad_at ?? null}
              />
            </div>
          </Card>
        )}

        <Card className="mt-8">
          <h2 className="h-2">Notiser</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
            Plattformen pratar sällan men i rätt stund. Du styr per grupp och
            kanal — transaktionella kvitton kan inte stängas av (det vore som
            att stänga av kvittot i en butik).
          </p>
          <div className="mt-6">
            <NotisPrefForm preferenser={preferenser} />
          </div>
        </Card>
      </Container>
    </Section>
  );
}
