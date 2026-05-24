// Modul M11 — Publik discovery/list.
// Design: handoff-to-code/discovery.html · Plan: 1-Planering/Modul-11-Listning-sokning-discovery.md.
// Säkerhet: serverside-filtrering via RLS-skyddad anon-klient. Default-vy: bara aktiva.
// Endast publika statusar; utkast/avvisad osynliga (insamling_select_publik).
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { SokForm } from "./sok-form";
import type { Database } from "@/lib/supabase/types";

type InsamlingStatus = Database["public"]["Enums"]["insamling_status"];

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

type SearchParams = Promise<{
  kategori?: string;
  q?: string;
  sort?: string;
  hjalp_land?: string;
  status?: string;
}>;

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

  // Status-mode (default: bara aktiva). 'alla_publika' visar hela bredden.
  const statusMode = params.status ?? "aktiv";
  const statusFilter: InsamlingStatus[] =
    statusMode === "aktiv"
      ? ["aktiv"]
      : statusMode === "avslutad_levererad"
      ? ["avslutad_levererad"]
      : (PUBLIK_STATUSAR as readonly InsamlingStatus[]).slice();

  const q = (params.q ?? "").trim();
  const hjalpLand = (params.hjalp_land ?? "").trim();
  const sort = params.sort ?? "nyast";

  let query = supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status, publicerad_at",
    )
    .in("status", statusFilter)
    .is("deleted_at", null)
    .limit(60);

  if (valdKat) {
    const { data: ik } = await supabase
      .from("insamling_kategori")
      .select("insamling_id")
      .eq("kategori_id", valdKat.id);
    const ids = ik?.map((r) => r.insamling_id) ?? [];
    if (ids.length === 0) {
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      query = query.in("id", ids);
    }
  }

  if (hjalpLand) {
    query = query.eq("hjalp_land", hjalpLand);
  }

  if (q) {
    // Fritextsök: titel | kort_beskrivning | insamlar_stad | hjalp_plats | hjalp_land.
    // ILIKE = case-insensitive. Or-uttryck via .or(...).
    const esc = q.replace(/[,()*]/g, " ");
    query = query.or(
      [
        `titel.ilike.%${esc}%`,
        `kort_beskrivning.ilike.%${esc}%`,
        `insamlar_stad.ilike.%${esc}%`,
        `hjalp_plats.ilike.%${esc}%`,
        `hjalp_land.ilike.%${esc}%`,
        `mottagare_beskrivning.ilike.%${esc}%`,
      ].join(","),
    );
  }

  if (sort === "snart_i_mal") {
    query = query.order("insamling_deadline", { ascending: true });
  } else if (sort === "alfabetiskt") {
    query = query.order("titel", { ascending: true });
  } else if (sort === "populart") {
    // Proxy: insamlat_ore tills donation-count är index-färdig. Hellre antal
    // donationer (M11 Block 3.2) — TODO när M11 popularitetsformel finns.
    query = query.order("insamlat_ore", { ascending: false });
  } else {
    query = query.order("publicerad_at", { ascending: false, nullsFirst: false });
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

  // Distinkta hjälp-länder för filtret
  const { data: landRader } = await supabase
    .from("insamling")
    .select("hjalp_land")
    .in("status", (PUBLIK_STATUSAR as readonly InsamlingStatus[]).slice())
    .is("deleted_at", null);
  const hjalpLander = Array.from(
    new Set((landRader ?? []).map((r) => r.hjalp_land).filter(Boolean)),
  ).sort();

  const filtersAktiva = !!(q || valdKat || hjalpLand || (params.status && params.status !== "aktiv"));

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container>
          <div className="flex flex-col gap-3">
            <span className="eyebrow">INSAMLINGAR</span>
            <h1 className="heading-1">
              {valdKat ? `Insamlingar — ${valdKat.namn}` : "Granskade insamlingar"}
            </h1>
            <p className="lead max-w-[640px]">
              Granskade mot svensk lag och islamiska principer innan publicering. Sök, filtrera och
              hitta något att stötta — eller låt plattformen föreslå.
            </p>
          </div>

          <div className="mt-8">
            <SokForm hjalpLander={hjalpLander} />
          </div>

          {/* Kategorifilter */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/insamlingar"
              className={`btn btn-sm ${!valdKat ? "btn-primary" : "btn-secondary"}`}
            >
              Alla områden
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

          {filtersAktiva && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
              {q && <Pill tone="paper">Sökord: {q}</Pill>}
              {valdKat && <Pill tone="paper">Kategori: {valdKat.namn}</Pill>}
              {hjalpLand && <Pill tone="paper">Hjälper i: {hjalpLand}</Pill>}
              {params.status === "alla_publika" && <Pill tone="paper">Inkl. avslutade</Pill>}
              {params.status === "avslutad_levererad" && <Pill tone="success">Bara levererade</Pill>}
              <Link href="/insamlingar" style={{ color: "var(--color-forest)", textDecoration: "underline" }}>
                Rensa filter
              </Link>
            </div>
          )}
        </Container>
      </Section>

      <Section tone="cream" spacing="default">
        <Container>
          {items.length === 0 ? (
            <EmptyState
              icon={<Icon name="sparkles" size={24} />}
              title={
                q
                  ? `Inga träffar på "${q}"`
                  : valdKat
                  ? `Inga insamlingar i ${valdKat.namn} ${statusMode === "aktiv" ? "aktiva" : ""}än`
                  : "Inga publicerade insamlingar än"
              }
              description="Försök med ett annat sökord, ta bort ett filter, eller utforska en annan kategori."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <LinkButton href="/insamlingar" variant="secondary">Rensa filter</LinkButton>
                  <LinkButton href="/">Tillbaka till start</LinkButton>
                </div>
              }
            />
          ) : (
            <>
              <p className="mb-6 text-sm" style={{ color: "var(--color-ink-3)" }}>
                Visar {items.length} insamling{items.length === 1 ? "" : "ar"}.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((i) => (
                  <InsamlingCard key={i.publicId} data={i} />
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}
