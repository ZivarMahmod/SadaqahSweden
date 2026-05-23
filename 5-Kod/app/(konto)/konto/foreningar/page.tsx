// Modul M10 — Mina föreningar (egen vy: ansökningar + publicerade poster).
// Plan: Modul-10 Block 1 (föreningskontot — företrädaren ser).
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";
import { CollabInkommandeList } from "./collab-inkommande";

export const metadata = { title: "Mina föreningar — Sadaqah Sweden" };

const STATUS_PILL: Record<string, { label: string; tone: "copper" | "success" | "danger" | "paper" | "outline" }> = {
  inskickad: { label: "Inskickad", tone: "copper" },
  under_granskning: { label: "Under granskning", tone: "copper" },
  komplettering_begard: { label: "Komplettering begärd", tone: "outline" },
  publicerad: { label: "Publicerad", tone: "success" },
  avvisad: { label: "Avvisad", tone: "danger" },
  vilande: { label: "Vilande", tone: "paper" },
};

export default async function MinaForeningar() {
  const me = await kraver();
  const supabase = await createClient();

  const { data: mina } = await supabase
    .from("organisation")
    .select("id, public_id, namn, organisationstyp, stad, region, katalog_status, verifieringsniva, created_at")
    .eq("profil_id", me.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Inkomna collab-förfrågningar — för publicerade föreningar jag äger.
  const orgIds = (mina ?? []).filter((o) => o.katalog_status === "publicerad").map((o) => o.id);
  let collabBegarda: Array<{
    id: string;
    collab_typ: string;
    org_namn: string;
    insamling_titel: string;
    insamling_id: string;
  }> = [];
  if (orgIds.length > 0) {
    const { data: cdata } = await supabase
      .from("collab")
      .select(
        "id, collab_typ, status, insamling:insamling_id(id, titel), organisation:organisation_id(namn)",
      )
      .in("organisation_id", orgIds)
      .eq("status", "begard");
    collabBegarda = (cdata ?? []).map((c) => ({
      id: c.id,
      collab_typ: c.collab_typ,
      org_namn: c.organisation?.namn ?? "okänd",
      insamling_titel: c.insamling?.titel ?? "okänd",
      insamling_id: c.insamling?.id ?? "",
    }));
  }

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/konto" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
            Tillbaka till konto
          </LinkButton>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="h-1">Mina föreningar</h1>
            <p className="lead mt-2">Ansökningar och publicerade katalogposter du äger.</p>
          </div>
          <LinkButton href="/foreningar/anmal" leftIcon={<Icon name="plus" size={16} />}>
            Anmäl ny förening
          </LinkButton>
        </div>

        {collabBegarda.length > 0 && (
          <Card className="mt-8" variant="forest">
            <h2 className="h-3">Inkomna collab-förfrågningar ({collabBegarda.length})</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
              En insamlare vill att er förening står bakom deras insamling. Ert ja
              eller nej är synligt på insamlingen.
            </p>
            <div className="mt-4">
              <CollabInkommandeList items={collabBegarda} />
            </div>
          </Card>
        )}

        <div className="mt-8">
          {(!mina || mina.length === 0) ? (
            <EmptyState
              icon={<Icon name="building" size={28} />}
              title="Inga föreningar än"
              description="Anmäl er förening eller moské för att synas i katalogen och kunna driva insamlingar."
              action={<LinkButton href="/foreningar/anmal">Anmäl er förening</LinkButton>}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {mina.map((o) => {
                const s = STATUS_PILL[o.katalog_status] ?? { label: o.katalog_status, tone: "paper" as const };
                return (
                  <li key={o.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={s.tone}>{s.label}</Pill>
                            {o.verifieringsniva && (
                              <Pill tone="success">
                                {o.verifieringsniva === "org_nr" ? "Verifierad — org.nr" : "Verifierad — kontakt"}
                              </Pill>
                            )}
                            <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                              Anmäld {datum(o.created_at)}
                            </span>
                          </div>
                          <h3 className="h-3 mt-2">{o.namn}</h3>
                          <p className="mt-1 text-sm" style={{ color: "var(--color-ink-3)" }}>
                            {o.organisationstyp} · {o.stad}, {o.region}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {o.katalog_status === "publicerad" && (
                            <LinkButton
                              href={`/foreningar/${o.public_id}`}
                              variant="secondary"
                              size="sm"
                              rightIcon={<Icon name="external" size={14} />}
                            >
                              Publik sida
                            </LinkButton>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </Section>
  );
}
