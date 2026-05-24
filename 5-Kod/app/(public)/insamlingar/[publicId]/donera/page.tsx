// Modul M4 — Donator-flödet (publik donations-sida).
// Design: handoff-to-code/fundraiser.html — donera-yta.
// Plan: 1-Planering/Modul-04-Donator-flodet.md Block 1–3.
// Tillägg-A1: undermål-val är borttaget, ersätts av info "pengarna flödar framåt".
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";
import { kr } from "@/lib/format";
import { DoneraForm } from "./donera-form";

type Params = Promise<{ publicId: string }>;

export const metadata = {
  title: "Donera — Sadaqah Sweden",
};

export default async function DoneraPage({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();

  const { data: i, error } = await supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, status, malbelopp_modell, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, insamlat_ore, enhet_namn, enhet_pris_ore, connected_account_id",
    )
    .eq("public_id", publicId)
    .single();

  if (error || !i) notFound();
  if (i.status !== "aktiv") notFound();

  const tarEmot = !!i.connected_account_id;

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container width="narrow">
          <Link
            href={`/insamlingar/${i.public_id}`}
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "var(--color-ink-3)" }}
          >
            <Icon name="arrow-left" size={14} /> Tillbaka till insamlingen
          </Link>
          <span className="eyebrow mt-6 block">DONATION</span>
          <h1 className="heading-1 mt-3">Stötta {i.titel}</h1>
          <p className="lead mt-3">{i.kort_beskrivning}</p>
        </Container>
      </Section>

      <Section tone="cream" spacing="default">
        <Container width="narrow">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <Card>
              {tarEmot ? (
                <DoneraForm
                  insamlingId={i.id}
                  insamlingPublicId={i.public_id}
                  enhetNamn={i.enhet_namn}
                  enhetPrisOre={i.enhet_pris_ore}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <Pill tone="copper">Mottagaren kan inte ta emot ännu</Pill>
                  <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
                    Insamlaren har inte slutfört sin Stripe-onboarding än. Försök om en stund.
                  </p>
                </div>
              )}
            </Card>

            <aside className="flex flex-col gap-4">
              <Card variant="tight">
                <h3 className="heading-3">Om målet inte nås</h3>
                <p className="mt-3 text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Din gåva används <strong>ändå</strong> för saken — pengarna flödar framåt.
                  Insamlingen kan förlängas eller skalas till en mindre insats.
                </p>
              </Card>
              <Card variant="tight">
                <h3 className="heading-3">Trygga pengar</h3>
                <ul
                  className="mt-4 flex flex-col gap-3 text-sm"
                  style={{ color: "var(--color-ink-2)" }}
                >
                  <li className="flex items-start gap-2">
                    <span style={{ color: "var(--color-copper)" }}>
                      <Icon name="lock" size={16} />
                    </span>
                    Stripe hanterar betalningen — plattformen ser aldrig kortet.
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "var(--color-copper)" }}>
                      <Icon name="shield-check" size={16} />
                    </span>
                    Insamlaren är BankID-verifierad och granskad.
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "var(--color-copper)" }}>
                      <Icon name="file-check" size={16} />
                    </span>
                    Kvitto skickas direkt till din e-post.
                  </li>
                </ul>
              </Card>
              {i.insamlat_ore != null && (
                <Card variant="tight">
                  <h3 className="heading-3">Hittills insamlat</h3>
                  <p
                    className="tabular mt-3"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 32,
                      color: "var(--color-forest)",
                      fontWeight: 500,
                    }}
                  >
                    {kr(i.insamlat_ore)}
                  </p>
                </Card>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </main>
  );
}
