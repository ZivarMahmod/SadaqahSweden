// M17/H1 — MFA-challenge vid login.
// Visas när användaren har en verifierad TOTP-faktor men sessionen står på
// aal1. Verify lyfter sessionen till aal2 så intern-zonen öppnas.

import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Challenge2faForm } from "./form";

export const metadata = { title: "MFA-kod — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ retur?: string }>;

export default async function MfaChallenge({ searchParams }: { searchParams: SearchParams }) {
  const me = await aktuellAnvandare();
  if (!me) redirect("/login");

  const { retur } = await searchParams;
  const next = sanityRetur(retur);

  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Redan i aal2 — direkt vidare.
  if (aal?.currentLevel === "aal2") {
    redirect(next);
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.find((f) => f.status === "verified");

  if (!totp) {
    // Ingen verifierad faktor — skicka till enroll.
    redirect("/team/2fa-setup");
  }

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="h-2">Verifiera 2FA</h1>
        <p className="lead mt-2">
          Ange den 6-siffriga koden från din Authenticator-app för att
          fortsätta till team-arbetsytan.
        </p>

        <Card variant="loose" className="mt-8">
          <Challenge2faForm factorId={totp.id} retur={next} />
        </Card>
      </Container>
    </Section>
  );
}

function sanityRetur(retur: string | undefined): string {
  if (!retur) return "/admin";
  // Bara relativa interna paths tillåtna (skydd mot open redirect).
  if (!retur.startsWith("/") || retur.startsWith("//")) return "/admin";
  return retur;
}
