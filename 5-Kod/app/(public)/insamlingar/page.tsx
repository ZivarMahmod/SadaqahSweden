// Modul M11 — publik discovery/list (minimal version inför Steg 9).
// Design: handoff-to-code/discovery.html · Plan: 1-Planering/Modul-11-Listning-sokning-discovery.md.
// Säkerhet: serverside-filtrering via RLS-skyddad anon-klient. Kategori-filter går
// via URL-param (`?kategori=slug`), validerat mot kategori-tabellen.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = {
  title: "Insamlingar — Sadaqah Sweden",
  description: "Granskade och aktiva insamlingar — välj en att stötta.",
};

const PUBLIK_STATUSAR = [
  "aktiv",
  "stangd",
  "utbetald",
  "vantar_pa_resultat",
  "avslutad_levererad",
  "avslutad_utan_resultat",
  "pausad",
] as const;

type SearchParams = Promise<{ kategori?: string; status?: string }>;

export default async function InsamlingarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: katsLista } = await supabase
    .from("kategori")
    .select("id, namn, slug")
    .eq("aktiv", true)
    .order("sortering");

  const valdKat = params.kategori
    ? katsLista?.find((k) => k.slug === params.kategori)
    : undefined;

  let query = supabase
    .from("insamling")
    .select(
      "public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status",
    )
    .in("status", PUBLIK_STATUSAR)
    .is("deleted_at", null)
    .order("publicerad_at", { ascending: false })
    .limit(60);

  if (valdKat) {
    // Hämta insamlings-id:n knutna till vald kategori först.
    const { data: ik } = await supabase
      .from("insamling_kategori")
      .select("insamling_id")
      .eq("kategori_id", valdKat.id);
    const ids = ik?.map((r) => r.insamling_id) ?? [];
    if (ids.length === 0) {
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]); // tvinga tomt
    } else {
      query = query.in("id", ids);
    }
  }

  const { data: rader } = await query;

  const items: InsamlingCardData[] =
    rader?.map((i) => ({
      publicId: i.public_id,
      titel: i.titel,
      kortBeskrivning: i.kort_beskrivning,
      insamlatOre: i.insamlat_ore,
      malbeloppOre: i.malbelopp_ore,
      malbeloppMinOre: i.malbelopp_min_ore,
      malbeloppMaxOre: i.malbelopp_max_ore,
      malbeloppModell: i.malbelopp_modell,
      insamlarStad: i.insamlar_stad,
      hjalpLand: i.hjalp_land,
      insamlingDeadline: i.insamling_deadline,
      status: i.status,
    })) ?? [];

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container>
          <div className="flex flex-col gap-3">
            <span className="eyebrow">INSAMLINGAR</span>
            <h1 className="h-1">
              {valdKat ? `Insamlingar — ${valdKat.namn}` : "Granskade insamlingar"}
            </h1>
            <p className="lead max-w-[640px]">
              Varje insamling här har granskats mot svensk lag och islamiska principer innan
              publicering. Klicka in för att läsa mer eller stötta.
            </p>
          </div>

          {/* Kategorifilter — funktionella länkar */}
          <div className="mt-10 flex flex-wrap gap-2">
            <Link
              href="/insamlingar"
              className={`btn btn-sm ${!valdKat ? "btn-primary" : "btn-secondary"}`}
            >
              Alla
            </Link>
            {katsLista?.map((k) => (
              <Link
                key={k.id}
                href={`/insamlingar?kategori=${encodeURIComponent(k.slug)}`}
                className={`btn btn-sm ${valdKat?.id === k.id ? "btn-primary" : "btn-secondary"}`}
              >
                {k.namn}
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="cream" spacing="default">
        <Container>
          {items.length === 0 ? (
            <EmptyState
              icon={<Icon name="sparkles" size={24} />}
              title={valdKat ? `Inga insamlingar i ${valdKat.namn} än` : "Inga publicerade insamlingar än"}
              description="Plattformen är ny. När de första insamlingarna passerat granskning syns de här."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <LinkButton href="/" variant="secondary">
                    Tillbaka till start
                  </LinkButton>
                  <LinkButton href="/registrera">Starta din egen insamling</LinkButton>
                </div>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((i) => (
                <InsamlingCard key={i.publicId} data={i} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
