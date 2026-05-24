// F10 — Min donationshistorik (privat).
// RLS: donation_select_egen (donator_id = auth.uid()) — bara mina egna rader.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { kr, datum } from "@/lib/format";
import { ToggleVisaDonationer } from "./toggle";

export const metadata = { title: "Mina donationer — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function MinaDonationer() {
  const me = await kraver();
  const supabase = await createClient();

  const { data: rader, error } = await supabase
    .from("donation")
    .select(
      "id, belopp_ore, frivilligt_bidrag_ore, status, bekraftad, anonym, created_at, insamling:insamling_id(public_id, titel)",
    )
    .eq("donator_id", me.userId)
    .order("created_at", { ascending: false })
    .limit(200);

  const totalBekraftade = (rader ?? []).filter((d) => d.bekraftad).length;

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <LinkButton href="/konto" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
          Tillbaka till konto
        </LinkButton>
        <h1 className="h-1 mt-4">Mina donationer</h1>
        <p className="lead mt-2 max-w-[60ch]">
          Privat historik — bara du och plattformens granskare ser den. Du kan
          slå på en öppen vy på din profil; då visas bara <strong>antalet</strong>{" "}
          donationer, ingen summa.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Pill tone="forest">
            <Icon name="heart" size={12} /> {totalBekraftade} bekräftade
          </Pill>
          <ToggleVisaDonationer initial={me.profil.visa_donations_publikt ?? false} />
        </div>

        {error && (
          <Card variant="tight" className="mt-6">
            <p style={{ color: "var(--color-danger)" }}>{error.message}</p>
          </Card>
        )}

        {!error && (!rader || rader.length === 0) && (
          <div className="mt-8">
            <EmptyState
              icon={<Icon name="heart" size={28} />}
              title="Inga donationer än"
              description="När du donerar via plattformen sparas det här — privat som default."
              action={
                <LinkButton href="/insamlingar">Utforska insamlingar</LinkButton>
              }
            />
          </div>
        )}

        {rader && rader.length > 0 && (
          <ul className="mt-8 flex flex-col gap-3">
            {rader.map((d) => (
              <li key={d.id}>
                <Card variant="tight">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {d.insamling?.titel ?? "(insamling saknas)"}
                      </h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {datum(d.created_at)}
                        {d.anonym && " · Visad anonymt"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="figure" style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--color-forest)" }}>
                        {kr(d.belopp_ore)}
                      </div>
                      {(d.frivilligt_bidrag_ore ?? 0) > 0 && (
                        <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          + {kr(d.frivilligt_bidrag_ore ?? 0)} bidrag
                        </p>
                      )}
                      <Pill tone={d.bekraftad ? "success" : "copper"} className="mt-1 text-xs">
                        {d.bekraftad ? "Bekräftad" : d.status}
                      </Pill>
                    </div>
                  </div>
                  {d.insamling?.public_id && (
                    <div className="mt-3">
                      <Link
                        href={`/insamlingar/${d.insamling.public_id}`}
                        className="text-xs underline"
                        style={{ color: "var(--color-forest)" }}
                      >
                        Öppna insamlingen →
                      </Link>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
