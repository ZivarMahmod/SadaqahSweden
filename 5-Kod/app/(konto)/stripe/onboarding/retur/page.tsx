// Modul M5 — Stripe-onboarding retur-sida (return_url)
// Stripe redirectar hit när användaren slutfört onboarding-flowen.
// Slutligt onboarding-resultat fastställs av webhooken account.updated.
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = {
  title: "Stripe — onboarding slutförd",
};

export default function StripeReturPage() {
  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <span className="eyebrow">STRIPE</span>
        <h1 className="heading-1 mt-3">Tack — vi tar det härifrån</h1>
        <p className="lead mt-3">
          Stripe verifierar dina uppgifter. Det går oftast på minuter, men ibland tar
          det längre. Du får en notis när allt är klart.
        </p>

        <Card className="mt-8">
          <div className="flex items-start gap-4">
            <span style={{ color: "var(--color-copper)" }}>
              <Icon name="shield-check" size={24} />
            </span>
            <div>
              <h3 className="heading-3">Vad händer nu</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                När Stripe har verifierat ditt konto kan du publicera insamlingar
                och börja ta emot donationer.
              </p>
              <div className="mt-6 flex gap-3">
                <LinkButton href="/stripe/onboarding">Tillbaka till status</LinkButton>
                <Link href="/insamling" className="btn btn-secondary">
                  Mina insamlingar
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
