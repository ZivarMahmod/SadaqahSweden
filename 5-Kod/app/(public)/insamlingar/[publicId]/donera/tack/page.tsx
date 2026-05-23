// Modul M4 — Donator-flödet · bekräftelseskärm (Block 4.1).
// Plan: Modul-04 4.1 — lugn, varm, inte ett kassakvitto.
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LinkButton } from "@/components/ui/button";
import { kr } from "@/lib/format";

type Params = Promise<{ publicId: string }>;
type Search = Promise<{ d?: string }>;

export const metadata = {
  title: "Tack — Sadaqah Sweden",
};

export default async function TackPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { publicId } = await params;
  const { d: donationPublicId } = await searchParams;
  if (!donationPublicId) notFound();

  const supabase = await createClient();

  const { data: i } = await supabase
    .from("insamling")
    .select("id, public_id, titel")
    .eq("public_id", publicId)
    .single();

  // Donationen kan vara ”skapad" eller ”processing" här om webhooken inte
  // hunnit landa — vi visar ett milt budskap.
  const { data: donation } = await supabase
    .from("donation")
    .select("public_id, belopp_ore, frivilligt_bidrag_ore, status, donator_epost")
    .eq("public_id", donationPublicId)
    .single();

  if (!i || !donation) notFound();

  const bekraftad = donation.status === "succeeded";
  const total = (donation.belopp_ore ?? 0) + (donation.frivilligt_bidrag_ore ?? 0);

  return (
    <main>
      <Section tone="paper" spacing="default">
        <Container width="narrow">
          <div className="text-center">
            <span style={{ color: "var(--color-copper)" }}>
              <Icon name={bekraftad ? "shield-check" : "heart"} size={48} />
            </span>
            <h1 className="h-1 mt-4">Tack för din gåva</h1>
            <p className="lead mt-3">
              {bekraftad
                ? "Din gåva är registrerad. Må Allah belöna dig."
                : "Vi bekräftar betalningen — det tar några ögonblick. Du får ett kvitto till din e-post."}
            </p>
          </div>

          <Card className="mt-10">
            <h3 className="h-3">Sammanställning</h3>
            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <Row label="Insamling">{i.titel}</Row>
              <Row label="Gåva">
                <span className="tabular">{kr(donation.belopp_ore ?? 0)}</span>
              </Row>
              {donation.frivilligt_bidrag_ore && donation.frivilligt_bidrag_ore > 0 ? (
                <Row label="Frivilligt bidrag">
                  <span className="tabular">{kr(donation.frivilligt_bidrag_ore)}</span>
                </Row>
              ) : null}
              <Row label="Totalt">
                <strong className="tabular">{kr(total)}</strong>
              </Row>
              <Row label="Kvittonummer">
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {donation.public_id}
                </code>
              </Row>
              <Row label="Kvitto till">{donation.donator_epost}</Row>
            </dl>
            <p className="mt-6 text-xs" style={{ color: "var(--color-ink-3)" }}>
              Om målet inte nås används din gåva ändå för projektet — pengarna flödar framåt.
            </p>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <LinkButton href={`/insamlingar/${i.public_id}`}>
              Tillbaka till insamlingen
            </LinkButton>
            <Link href="/insamlingar" className="btn btn-secondary">
              Utforska andra insamlingar
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-baseline gap-3">
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
