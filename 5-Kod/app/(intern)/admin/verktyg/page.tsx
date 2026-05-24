// M16 / H2 — Verktygslåda: refund-verktyget.
// Listar insamlingar i status nedstangd ELLER med pending dispute, plus
// generella med succeeded-donationer. Admin kan trigga refund per insamling
// eller per enskild donation via modal.

import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { kortBelopp } from "@/lib/format";
import { RefundKnapp } from "./refund-modal";
import { SkyddadIdentitetForm } from "./skyddad-identitet";
import { MfaResetForm } from "./mfa-reset";

export const metadata = { title: "Verktyg — Admin — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function VerktygSida() {
  await kraver(["admin"]);
  const supabase = await createClient();

  // Insamlingar med >= 1 succeeded-donation som inte är fullt refunderad.
  // Vi listar de senaste 50 — admin kan söka via insamlingens egna UI annars.
  const { data: kandidater } = await supabase
    .from("insamling")
    .select("id, public_id, titel, status, insamlat_ore, created_at")
    .in("status", ["aktiv", "pausad", "stangd", "nedstangd", "vantar_pa_resultat", "avslutad_levererad"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="heading-2">Verktygslåda</h1>
        <p className="lead mt-2">
          Refund-verktyget: återbetala en enskild donation eller alla
          donationer på en insamling. Varje refund loggas i
          ingreppsloggen och kan inte ångras.
        </p>

        <h2 className="heading-3 mt-10">Refund</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
          Refund är ett undantag — vid bedrägeri eller fel. Pengarna flödar
          annars framåt.
        </p>

        {(kandidater ?? []).length === 0 ? (
          <Card variant="tight" className="mt-6">
            <p style={{ color: "var(--color-ink-3)" }}>Inga insamlingar med refunderbara donationer.</p>
          </Card>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {(kandidater ?? []).map((i) => (
              <li key={i.id}>
                <Card variant="tight">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={i.status === "nedstangd" ? "danger" : "outline"}>{i.status}</Pill>
                      <span className="font-semibold">{i.titel}</span>
                      <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {kortBelopp(i.insamlat_ore ?? 0)}
                      </span>
                    </div>
                    <RefundKnapp insamlingId={i.id} insamlingNamn={i.titel} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <h2 className="heading-3 mt-12">Skyddad identitet</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
          M12 Block 5.3 — insamlare med skyddad identitet exkluderas från
          kommun-nivå på kartan. Län-nivån (21 grova områden) inkluderar dem.
          Sätt flaggan här. Geo-aggregatet räknas om direkt.
        </p>
        <Card variant="tight" className="mt-4">
          <SkyddadIdentitetForm />
        </Card>

        <h2 className="heading-3 mt-12">MFA-nollställning (alla konton)</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
          F8/FX5 — slå upp ett konto via e-post och radera samtliga MFA-faktorer.
          Funkar för alla roller (insamlare, förening, granskare, admin) — inte
          bara team. Användaren omdirigeras till 2FA-setup vid nästa skyddad
          request. Verifiera identitet utanför plattformen (support-samtal,
          BankID) innan du nollställer — annars är detta en bakdörr.
        </p>
        <Card variant="tight" className="mt-4">
          <MfaResetForm />
        </Card>
      </Container>
    </Section>
  );
}
