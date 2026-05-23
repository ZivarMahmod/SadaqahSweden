// Modul M9 — Min profil (redigera + förhandsvy).
// Plan: 1-Planering/Modul-09 B3.4 "Förhandsvy 'så här ser andra din profil'".
import { kraver } from "@/lib/auth";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProfilForm } from "./profil-form";

export const metadata = {
  title: "Min profil — Sadaqah Sweden",
};

export default async function MinProfilPage() {
  const me = await kraver();
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
      </Container>
    </Section>
  );
}
