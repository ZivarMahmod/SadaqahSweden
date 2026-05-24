// M17 — MFA-enroll via Supabase Auth (Härdning H1).
// Flöde:
//   1. Server-component anropar supabase.auth.mfa.enroll → får qr_code + secret.
//   2. Form-komponent kallar mfa.challenge + mfa.verify för att verifiera koden.
//   3. När verify lyckas är faktorn permanent; nästa login kräver challenge.

import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Setup2faForm } from "./form";

export const metadata = { title: "Aktivera 2FA — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function Setup2fa() {
  const me = await aktuellAnvandare();
  if (!me) redirect("/login?retur=/team/2fa-setup");

  // F8: alla inloggade konton kräver 2FA — team OCH insamlare/förening.
  // Donatorer som ändå skulle hamna här (de har inget konto) skickas hem.
  // void me; (rollen är kontroll-irrelevant — alla med inlogg får enrolla)

  const supabase = await createClient();

  // Om faktorn redan är verifierad → flyttar vi vidare. (Re-enroll måste gå
  // via admin-reset så vi inte tappar AAL2-grinden av misstag.)
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpFactor = factors?.totp?.[0];
  if (totpFactor?.status === "verified") {
    redirect("/team/2fa?retur=%2Fadmin");
  }

  // Återanvänd en eventuell `unverified`-faktor; annars enrolla ny.
  let factorId = totpFactor?.id;
  let qrCode: string | null = null;
  let secret: string | null = null;

  if (!factorId) {
    const { data: enroll, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator",
    });
    if (error || !enroll) {
      return (
        <Section tone="paper" spacing="default">
          <Container width="narrow">
            <Card variant="loose">
              <h1 className="heading-3">MFA-enroll misslyckades</h1>
              <p className="mt-3" style={{ color: "var(--color-danger)" }}>
                {error?.message ?? "Okänt fel"}
              </p>
            </Card>
          </Container>
        </Section>
      );
    }
    factorId = enroll.id;
    qrCode = enroll.totp.qr_code;
    secret = enroll.totp.secret;
  } else {
    // Befintlig unverified — Supabase exponerar inte qr/secret retroaktivt
    // via listFactors. Användaren får be om reset om hen tappat sin app.
  }

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="heading-2">Aktivera 2FA</h1>
        <p className="lead mt-2">
          Team-konton kräver MFA. Skanna QR-koden i en Authenticator-app och
          mata in den 6-siffriga koden för att aktivera.
        </p>

        <Card variant="loose" className="mt-8">
          <div className="grid gap-8 md:grid-cols-[180px_1fr]">
            <div>
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="2FA QR-kod" width={180} height={180} />
              ) : (
                <div
                  className="flex h-[180px] w-[180px] items-center justify-center text-xs"
                  style={{ background: "var(--color-paper)", color: "var(--color-ink-3)" }}
                >
                  QR ej tillgänglig — be en admin om reset.
                </div>
              )}
              {secret && (
                <>
                  <p
                    className="mt-3 text-xs leading-relaxed"
                    style={{ color: "var(--color-ink-3)" }}
                  >
                    Kan du inte skanna? Mata in koden manuellt:
                  </p>
                  <code
                    className="mt-1 block break-all rounded p-2 text-xs"
                    style={{ background: "var(--color-paper)", fontFamily: "var(--font-mono)" }}
                  >
                    {secret}
                  </code>
                </>
              )}
            </div>
            <div>
              <Setup2faForm factorId={factorId!} />
              <p className="mt-4 text-xs" style={{ color: "var(--color-ink-3)" }}>
                Enroll sker en gång per konto. Förlorad enhet? Be en admin
                återställa MFA i team-vyn.
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
