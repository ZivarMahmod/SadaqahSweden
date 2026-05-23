// Modul M11 — Kategorisida (landningsyta för SEO + discovery).
// Plan: Modul-11 Block 3 (Kategorisidor & sortering, dubblettavstyrning).
// Säkerhet: Bara aktiva och avslutade publika insamlingar visas. RLS gör grundjobbet.
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: kat } = await supabase
    .from("kategori")
    .select("namn")
    .eq("slug", slug)
    .maybeSingle();
  if (!kat) return { title: "Kategori — Sadaqah Sweden" };
  return {
    title: `${kat.namn} — Insamlingar — Sadaqah Sweden`,
    description: `Granskade ${kat.namn.toLowerCase()}-insamlingar på Sadaqah Sweden.`,
  };
}

export default async function KategoriSida({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: kat } = await supabase
    .from("kategori")
    .select("id, namn, slug")
    .eq("slug", slug)
    .eq("aktiv", true)
    .maybeSingle();

  if (!kat) notFound();

  const { data: ik } = await supabase
    .from("insamling_kategori")
    .select("insamling_id")
    .eq("kategori_id", kat.id);
  const ids = ik?.map((r) => r.insamling_id) ?? [];

  if (ids.length === 0) {
    return tomKategori(kat.namn);
  }

  const { data: aktiva } = await supabase
    .from("insamling")
    .select(
      "public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status",
    )
    .in("id", ids)
    .eq("status", "aktiv")
    .is("deleted_at", null)
    .order("publicerad_at", { ascending: false })
    .limit(24);

  const { data: avslutade } = await supabase
    .from("insamling")
    .select(
      "public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status",
    )
    .in("id", ids)
    .eq("status", "avslutad_levererad")
    .is("deleted_at", null)
    .order("stangd_at", { ascending: false, nullsFirst: false })
    .limit(6);

  const aktivaItems: InsamlingCardData[] =
    aktiva?.map((i) => mapItem(i, kat.namn)) ?? [];
  const avslutadeItems: InsamlingCardData[] =
    avslutade?.map((i) => mapItem(i, kat.namn)) ?? [];

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container width="narrow">
          <span className="eyebrow">KATEGORI</span>
          <h1 className="h-1 mt-3">{kat.namn}</h1>
          <p className="lead mt-3" style={{ maxWidth: "60ch" }}>
            Plattformen styr donatorn mot befintliga insamlingar — samordnad
            godhet hjälper mottagaren mer än splittrade gåvor. Se vad som
            redan pågår innan du startar en egen.
          </p>
        </Container>
      </Section>

      <Section tone="cream" spacing="default">
        <Container>
          <h2 className="h-2">Aktiva i {kat.namn.toLowerCase()}</h2>
          {aktivaItems.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={<Icon name="sparkles" size={24} />}
                title="Inga aktiva just nu"
                description="Här är ett område där en ny insamling skulle göra skillnad. Vill du starta?"
                action={<LinkButton href="/registrera">Starta en insamling</LinkButton>}
              />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {aktivaItems.map((i) => (
                <InsamlingCard key={i.publicId} data={i} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {avslutadeItems.length > 0 && (
        <Section tone="paper" spacing="default">
          <Container>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="h-2">Så har det gått tidigare</h2>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Insamlingar i {kat.namn.toLowerCase()} som stängt loopen — bevis på leverans.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {avslutadeItems.map((i) => (
                <InsamlingCard key={i.publicId} data={i} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}

function tomKategori(namn: string) {
  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container width="narrow">
          <span className="eyebrow">KATEGORI</span>
          <h1 className="h-1 mt-3">{namn}</h1>
          <p className="lead mt-3" style={{ maxWidth: "60ch" }}>
            Ingen insamling i {namn.toLowerCase()} än — vill du starta en?
          </p>
        </Container>
      </Section>
      <Section tone="cream" spacing="default">
        <Container width="narrow">
          <EmptyState
            icon={<Icon name="sparkles" size={24} />}
            title="Område utan aktiva insamlingar"
            description="Plattformen är ny. Här finns plats för den första."
            action={<LinkButton href="/registrera">Starta en insamling</LinkButton>}
          />
        </Container>
      </Section>
    </main>
  );
}

function mapItem(
  i: {
    public_id: string;
    titel: string;
    kort_beskrivning: string;
    insamlat_ore: number;
    malbelopp_ore: number | null;
    malbelopp_min_ore: number | null;
    malbelopp_max_ore: number | null;
    malbelopp_modell: string;
    insamlar_stad: string;
    hjalp_land: string;
    insamling_deadline: string;
    status: string;
  },
  kategoriNamn: string,
): InsamlingCardData {
  return {
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
    kategoriNamn,
  };
}
