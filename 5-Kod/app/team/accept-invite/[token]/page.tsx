// M17 — invitation-redemption.
// Flöde:
//  1. Mottagaren har redan ett konto (eller skapar ett först med
//     samma e-post som inbjudan).
//  2. Klick på länk → om inloggad: anropa team_loesa_in_invitation.
//     Om inte: redirect till /login med retur.
//  3. Efter inlösen: redirect till /team/2fa-setup.

import { redirect } from "next/navigation";
import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

type Params = Promise<{ token: string }>;

export const dynamic = "force-dynamic";

export default async function AcceptInvite({ params }: { params: Params }) {
  const { token } = await params;
  const me = await aktuellAnvandare();

  if (!me) {
    return (
      <Section tone="paper" spacing="default">
        <Container width="narrow">
          <Card variant="loose">
            <h1 className="heading-3">Logga in för att acceptera inbjudan</h1>
            <p className="mt-3" style={{ color: "var(--color-ink-2)" }}>
              Skapa konto eller logga in med exakt den e-post som inbjudan
              skickats till. Återvänd hit efter inloggning.
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href={`/login?retur=${encodeURIComponent(`/team/accept-invite/${token}`)}`}
                className="btn btn-primary btn-sm"
              >
                Logga in
              </Link>
              <Link
                href={`/registrera?retur=${encodeURIComponent(`/team/accept-invite/${token}`)}`}
                className="btn btn-secondary btn-sm"
              >
                Skapa konto
              </Link>
            </div>
          </Card>
        </Container>
      </Section>
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("team_loesa_in_invitation", { p_token: token });

  if (error) {
    return (
      <Section tone="paper" spacing="default">
        <Container width="narrow">
          <Card variant="loose">
            <h1 className="heading-3">Kunde inte lösa in inbjudan</h1>
            <p className="mt-3" style={{ color: "var(--color-danger)" }}>{error.message}</p>
            <Link href="/konto" className="btn btn-secondary btn-sm mt-4 inline-flex">
              Till mitt konto
            </Link>
          </Card>
        </Container>
      </Section>
    );
  }

  redirect("/team/2fa-setup?nytt=1");
}
