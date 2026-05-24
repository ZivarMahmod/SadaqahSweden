// Modul M10 — Föreningskatalog (publik).
// Plan: 1-Planering/Modul-10 Block 3 (katalogen, kort, sök).
// Säkerhet: RLS organisation_select_publik visar bara katalog_status='publicerad'.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ForeningSokForm } from "./sok-form";

export const metadata = {
  title: "Föreningar & moskéer — Sadaqah Sweden",
  description: "Granskade muslimska föreningar och moskéer i Sverige.",
};

type SearchParams = Promise<{ q?: string; typ?: string; region?: string }>;

export default async function ForeningarKatalog({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();

  const q = (params.q ?? "").trim();
  const typ = (params.typ ?? "").trim();
  const region = (params.region ?? "").trim();

  let query = supabase
    .from("organisation")
    .select(
      "public_id, namn, organisationstyp, stad, region, beskrivning, logotyp_path, verifieringsniva, ar_region_admin",
    )
    .eq("katalog_status", "publicerad")
    .is("deleted_at", null)
    .order("ar_region_admin", { ascending: false })
    .order("namn", { ascending: true })
    .limit(120);

  if (q) {
    query = query.or(
      [
        `namn.ilike.%${q}%`,
        `stad.ilike.%${q}%`,
        `beskrivning.ilike.%${q}%`,
      ].join(","),
    );
  }
  if (typ) query = query.eq("organisationstyp", typ);
  if (region) query = query.eq("region", region);

  const { data: rader, error } = await query;

  const { data: typer } = await supabase
    .from("organisation")
    .select("organisationstyp")
    .eq("katalog_status", "publicerad")
    .is("deleted_at", null);
  const typeAlt = Array.from(new Set((typer ?? []).map((r) => r.organisationstyp))).sort();

  const { data: regioner } = await supabase
    .from("organisation")
    .select("region")
    .eq("katalog_status", "publicerad")
    .is("deleted_at", null);
  const regionAlt = Array.from(new Set((regioner ?? []).map((r) => r.region).filter(Boolean))).sort();

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container>
          <span className="eyebrow">KATALOG</span>
          <h1 className="h-1 mt-3">Föreningar & moskéer</h1>
          <p className="lead mt-3" style={{ maxWidth: "60ch" }}>
            En självregistrerad lista över muslimska föreningar och moskéer i
            Sverige — granskade innan publicering. Letar du efter er lokala
            moské, eller en organisation att stötta?
          </p>

          <div className="mt-8">
            <ForeningSokForm typeAlt={typeAlt} regionAlt={regionAlt} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <LinkButton href="/foreningar/anmal" size="sm" variant="secondary" leftIcon={<Icon name="plus" size={14} />}>
              Anmäl er förening
            </LinkButton>
            {(q || typ || region) && (
              <Link href="/foreningar" className="text-xs" style={{ color: "var(--color-forest)", textDecoration: "underline" }}>
                Rensa filter
              </Link>
            )}
          </div>
        </Container>
      </Section>

      <Section tone="cream" spacing="default">
        <Container>
          {error && (
            <Card variant="tight">
              <p style={{ color: "var(--color-danger)" }}>Fel: {error.message}</p>
            </Card>
          )}

          {!error && (!rader || rader.length === 0) && (
            <EmptyState
              icon={<Icon name="building" size={28} />}
              title={q || typ || region ? "Inga föreningar matchar" : "Inga föreningar i katalogen än"}
              description={q || typ || region
                ? "Försök med ett bredare filter — eller anmäl er förening om ni inte finns med."
                : "Katalogen växer när föreningar själva anmäler sig. Är ni en muslimsk förening eller moské?"}
              action={
                <LinkButton href="/foreningar/anmal" leftIcon={<Icon name="plus" size={16} />}>
                  Anmäl er förening
                </LinkButton>
              }
            />
          )}

          {rader && rader.length > 0 && (
            <>
              <p className="mb-6 text-sm" style={{ color: "var(--color-ink-3)" }}>
                Visar {rader.length} förening{rader.length === 1 ? "" : "ar"}.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rader.map((o) => (
                  <Link
                    key={o.public_id}
                    href={`/foreningar/${o.public_id}`}
                    className="card card-hover flex flex-col gap-3 p-6 no-underline"
                    style={{ color: "inherit" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        aria-hidden
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          background: "var(--color-copper-soft)",
                          color: "var(--color-copper-deep)",
                          fontFamily: "var(--font-display)",
                          fontSize: 18,
                        }}
                      >
                        {o.logotyp_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.logotyp_path} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          o.namn.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {o.ar_region_admin && (
                          <Pill tone="copper" className="text-xs">
                            <Icon name="shield-check" size={12} /> Region-admin
                          </Pill>
                        )}
                        <Pill tone={o.verifieringsniva === "org_nr" ? "success" : "copper"} className="text-xs">
                          {o.verifieringsniva === "org_nr" ? "Verifierad — org.nr" : "Verifierad — kontakt"}
                        </Pill>
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, margin: 0 }}>
                        {o.namn}
                      </h3>
                      <p
                        className="mt-1 text-xs uppercase"
                        style={{ letterSpacing: "0.08em", color: "var(--color-copper-deep)" }}
                      >
                        {o.organisationstyp}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {o.stad}{o.region ? `, ${o.region}` : ""}
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
                      {o.beskrivning}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}
