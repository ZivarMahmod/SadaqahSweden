// Modul M5 — Stripe-onboarding (huvudsida)
// Design: handoff-to-code/account.html-stil · Plan: 02-Stripe-pengaflode.md §1.2
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";
import { skapaConnectedAccount, fortsattOnboarding } from "./actions";

export const metadata = {
  title: "Stripe-onboarding — Sadaqah Sweden",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "Onboarding ej slutförd",
  restricted: "Stripe väntar på mer information",
  enabled: "Klart — kan ta emot betalningar",
  disabled: "Avaktiverat av Stripe — kontakta admin",
};

export default async function StripeOnboardingPage() {
  await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const { data: ca } = await supabase
    .from("connected_accounts")
    .select("id, stripe_account_id, status, charges_enabled, payouts_enabled, details_submitted, requirements")
    .in("typ", ["insamlare", "forening"])
    .maybeSingle();

  const inteOnboardatAn = !ca;
  const klart = ca?.status === "enabled" && ca?.charges_enabled && ca?.payouts_enabled;

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <span className="eyebrow">STRIPE-ONBOARDING</span>
        <h1 className="heading-1 mt-3">Koppla Stripe</h1>
        <p className="lead mt-3">
          För att din insamling ska kunna ta emot donationer måste du verifiera ditt Stripe-konto.
          Stripe sköter identitet och bankuppgifter — plattformen ser aldrig ditt kontonummer.
        </p>

        <div className="mt-10 grid gap-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <h3 className="heading-3">Status</h3>
              {inteOnboardatAn ? (
                <Pill tone="paper">Ej kopplat</Pill>
              ) : klart ? (
                <Pill tone="success">
                  <Icon name="shield-check" size={12} /> Klart
                </Pill>
              ) : (
                <Pill tone="copper">{STATUS_TEXT[ca?.status ?? "pending"]}</Pill>
              )}
            </div>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <Row label="Konto-id">
                {ca?.stripe_account_id ? (
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    {ca.stripe_account_id}
                  </code>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Tar emot betalningar">{ca?.charges_enabled ? "Ja" : "Nej"}</Row>
              <Row label="Tar emot utbetalningar">{ca?.payouts_enabled ? "Ja" : "Nej"}</Row>
              <Row label="Uppgifter inlämnade">{ca?.details_submitted ? "Ja" : "Nej"}</Row>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {inteOnboardatAn ? (
                <form action={skapaConnectedAccount}>
                  <button type="submit" className="btn btn-primary">
                    <Icon name="arrow-right" size={16} /> Starta onboarding
                  </button>
                </form>
              ) : klart ? (
                <Pill tone="success">Allt klart — du kan publicera insamlingar</Pill>
              ) : (
                <form action={fortsattOnboarding}>
                  <button type="submit" className="btn btn-primary">
                    <Icon name="arrow-right" size={16} /> Fortsätt onboarding
                  </button>
                </form>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="heading-3">Hur det fungerar</h3>
            <ol className="mt-6 flex flex-col gap-3 text-sm" style={{ color: "var(--color-ink-2)" }}>
              <li>
                <strong>1. Starta onboarding</strong> — du skickas till Stripes hostade flow.
              </li>
              <li>
                <strong>2. Lämna identitet och bankkonto</strong> direkt till Stripe.
                Plattformen ser aldrig dina bankuppgifter.
              </li>
              <li>
                <strong>3. Stripe verifierar</strong> — oftast inom minuter.
                När det är klart kan din insamling publiceras och ta emot donationer.
              </li>
              <li>
                <strong>4. Utbetalning sker efter deadline</strong> — pengarna hålls på
                plattformens Stripe-balans tills insamlingen är klar, sen flyttas de till
                ditt bankkonto.
              </li>
            </ol>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-baseline gap-3">
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
