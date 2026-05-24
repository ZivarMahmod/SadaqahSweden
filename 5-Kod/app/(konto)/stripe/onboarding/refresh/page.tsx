// Modul M5 — Stripe-onboarding refresh-sida (refresh_url)
// Stripe redirectar hit om en Account Link har gått ut (kortlivad).
// Vi genererar en ny länk direkt.
import { fortsattOnboarding } from "../actions";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata = {
  title: "Stripe — onboarding refresh",
};

export default function StripeRefreshPage() {
  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <span className="eyebrow">STRIPE</span>
        <h1 className="heading-1 mt-3">Länken gick ut</h1>
        <p className="lead mt-3">
          Stripes onboarding-länkar är kortlivade av säkerhetsskäl. Klicka nedan för
          att fortsätta där du var.
        </p>

        <Card className="mt-8">
          <form action={fortsattOnboarding}>
            <div className="flex items-center gap-4">
              <span style={{ color: "var(--color-copper)" }}>
                <Icon name="refresh-cw" size={24} />
              </span>
              <div className="flex-1">
                <h3 className="heading-3">Fortsätt onboarding</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Vi öppnar Stripes onboarding-flow på nytt — du fortsätter där du var.
                </p>
              </div>
              <button type="submit" className="btn btn-primary">
                <Icon name="arrow-right" size={16} /> Fortsätt
              </button>
            </div>
          </form>
        </Card>
      </Container>
    </Section>
  );
}
