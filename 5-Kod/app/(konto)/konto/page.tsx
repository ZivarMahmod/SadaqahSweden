// Modul M9 — Mitt konto (provisorisk vy inför full profil).
// Design: handoff-to-code/account.html · Plan: 1-Planering/Modul-09-Profiler.md.
// Säkerhet: kraver() läser roll serverside via RLS-skyddad helper. user_metadata aldrig betrodd.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = {
  title: "Mitt konto — Sadaqah Sweden",
};

const ROLL_LABEL: Record<string, string> = {
  donator: "Donator",
  insamlare: "Insamlare",
  forening: "Förening",
  granskare: "Granskare",
  admin: "Admin",
};

export default async function KontoPage() {
  const me = await kraver();
  const arInsamlare = me.roll === "insamlare" || me.roll === "forening" || me.roll === "admin";
  const arGranskare = me.roll === "granskare" || me.roll === "admin";

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="eyebrow">DITT KONTO</span>
            <h1 className="h-1 mt-3">{me.profil.visningsnamn}</h1>
            <p className="lead mt-3">{me.epost}</p>
          </div>
          <div className="flex gap-2">
            <Pill tone="copper" dot="default">
              {ROLL_LABEL[me.roll] ?? me.roll}
            </Pill>
            {me.profil.bankid_verifierad ? (
              <Pill tone="success">
                <Icon name="shield-check" size={12} /> BankID
              </Pill>
            ) : (
              <Pill tone="paper">Ej BankID-verifierad</Pill>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="h-3">Kontouppgifter</h3>
            <dl className="mt-6 flex flex-col gap-4 text-sm">
              <Row label="Visningsnamn">{me.profil.visningsnamn}</Row>
              <Row label="E-post">{me.epost}</Row>
              <Row label="Roll">{ROLL_LABEL[me.roll] ?? me.roll}</Row>
              <Row label="BankID">
                {me.profil.bankid_verifierad
                  ? "Verifierad"
                  : "Inte verifierad ännu (krävs för insamlare)"}
              </Row>
              <Row label="Publikt id">
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {me.profil.public_id}
                </code>
              </Row>
            </dl>
          </Card>

          <Card>
            <h3 className="h-3">Vad du kan göra här</h3>
            <ul className="mt-6 flex flex-col gap-4 text-sm" style={{ color: "var(--color-ink-2)" }}>
              {arInsamlare && (
                <li className="flex items-start gap-3">
                  <span style={{ color: "var(--color-copper)" }}>
                    <Icon name="edit" size={16} />
                  </span>
                  Skapa och redigera dina insamlingar — gå till{" "}
                  <Link
                    href="/insamling"
                    style={{ color: "var(--color-forest)", textDecoration: "underline" }}
                  >
                    Mina insamlingar
                  </Link>
                  .
                </li>
              )}
              {arGranskare && (
                <li className="flex items-start gap-3">
                  <span style={{ color: "var(--color-copper)" }}>
                    <Icon name="shield" size={16} />
                  </span>
                  Granska inskickade projekt i{" "}
                  <Link
                    href="/granskning"
                    style={{ color: "var(--color-forest)", textDecoration: "underline" }}
                  >
                    granskningskön
                  </Link>
                  .
                </li>
              )}
              <li className="flex items-start gap-3">
                <span style={{ color: "var(--color-copper)" }}>
                  <Icon name="heart" size={16} />
                </span>
                Stötta andras insamlingar via publika sidan — inget extra konto behövs.
              </li>
              {!arInsamlare && (
                <li className="flex items-start gap-3">
                  <span style={{ color: "var(--color-copper)" }}>
                    <Icon name="sparkles" size={16} />
                  </span>
                  Vill du starta egna insamlingar? Då krävs BankID-verifiering och Stripe-onboarding.
                  {/* TODO (M6/M5): rolluppgradering-flöde + BankID-broker integration. */}
                </li>
              )}
            </ul>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {arInsamlare && <LinkButton href="/insamling">Till mina insamlingar</LinkButton>}
          <LinkButton href="/konto/profil" variant="secondary" leftIcon={<Icon name="edit" size={16} />}>
            Redigera min profil
          </LinkButton>
          <LinkButton href="/konto/foreningar" variant="secondary" leftIcon={<Icon name="building" size={16} />}>
            Mina föreningar
          </LinkButton>
          <LinkButton
            href={`/profil/${me.profil.public_id}`}
            variant="secondary"
            leftIcon={<Icon name="external" size={16} />}
          >
            Visa publik profil
          </LinkButton>
          <LinkButton href="/insamlingar" variant="ghost">
            Utforska andra insamlingar
          </LinkButton>
          <form action={loggaUt}>
            <button type="submit" className="btn btn-ghost">
              <Icon name="log-out" size={16} /> Logga ut
            </button>
          </form>
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-baseline gap-3">
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
