// M17 — TOTP-enroll. Brief: obligatorisk för team-konton.
//
// Flöde:
//  1. Generera secret + spara i totp_secret (om saknas).
//  2. Visa otpauth-URL + QR-kod (klient genererar QR).
//  3. Användaren skannar i Authenticator-app + matar in 6-siffrig kod.
//  4. Verifiera serverside; om OK → markera totp_aktiverad=true.

import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Setup2faForm } from "./form";
import { Secret, TOTP } from "otpauth";

export const metadata = { title: "Aktivera 2FA — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function Setup2fa() {
  const me = await aktuellAnvandare();
  if (!me) redirect("/login?retur=/team/2fa-setup");

  const supabase = await createClient();
  const { data: befintlig } = await supabase
    .from("totp_secret")
    .select("secret_base32, aktiverad_at")
    .eq("profile_id", me.userId)
    .maybeSingle();

  let secret_base32: string;
  if (befintlig?.secret_base32) {
    secret_base32 = befintlig.secret_base32;
  } else {
    secret_base32 = new Secret({ size: 20 }).base32;
    await supabase.from("totp_secret").upsert({
      profile_id: me.userId,
      secret_base32,
      skapad_av: me.userId,
    });
  }

  const totp = new TOTP({
    issuer: "Sadaqah Sweden",
    label: me.epost,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret_base32,
  });
  const otpauth_url = totp.toString();

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="h-2">Aktivera 2FA</h1>
        <p className="lead mt-2">
          Team-konton kräver TOTP (Authenticator-app). Skanna QR-koden och
          mata in den 6-siffriga koden för att aktivera.
        </p>

        <Card variant="loose" className="mt-8">
          <div className="grid gap-8 md:grid-cols-[180px_1fr]">
            <div>
              <Setup2faQr otpauth={otpauth_url} />
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
                {secret_base32}
              </code>
            </div>
            <div>
              <Setup2faForm
                klar={!!befintlig?.aktiverad_at}
              />
              <p className="mt-4 text-xs" style={{ color: "var(--color-ink-3)" }}>
                Aktiveras enroll-flödet en gång per konto. Förlorad enhet? Be
                en admin återställa.
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}

// QR-renderare som server-component via dynamic-import.
async function Setup2faQr({ otpauth }: { otpauth: string }) {
  const QRCode = (await import("qrcode")).default;
  const dataUrl = await QRCode.toDataURL(otpauth, { width: 180, margin: 1 });
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt="2FA QR-kod" width={180} height={180} />
  );
}
