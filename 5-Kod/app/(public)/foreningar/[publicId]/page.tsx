// Modul M10 — Publik organisationsprofil.
// Plan: Modul-10 Block 3.3.
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";

type Params = Promise<{ publicId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisation")
    .select("namn, beskrivning")
    .eq("public_id", publicId)
    .eq("katalog_status", "publicerad")
    .maybeSingle();
  if (!data) return { title: "Förening — Sadaqah Sweden" };
  return {
    title: `${data.namn} — Sadaqah Sweden`,
    description: data.beskrivning ?? undefined,
  };
}

export default async function OrgProfil({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();

  const { data: o, error } = await supabase
    .from("organisation")
    .select(
      "id, public_id, namn, org_nummer, organisationstyp, stad, region, besoksadress, beskrivning, logotyp_path, verifieringsniva, created_at, profil_id",
    )
    .eq("public_id", publicId)
    .eq("katalog_status", "publicerad")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !o) notFound();

  // Egna insamlingar (där föreningen är ägare via profil_id)
  let drivna: InsamlingCardData[] = [];
  if (o.profil_id) {
    const { data: insamlingar } = await supabase
      .from("insamling")
      .select(
        "public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status",
      )
      .eq("agare_id", o.profil_id)
      .is("deleted_at", null)
      .in("status", ["aktiv","stangd","utbetald","vantar_pa_resultat","avslutad_levererad","avslutad_utan_resultat","pausad"])
      .order("publicerad_at", { ascending: false, nullsFirst: false })
      .limit(12);
    drivna = (insamlingar ?? []).map((i) => ({
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
    }));
  }

  // Collab-insamlingar (godkända)
  const { data: collabRader } = await supabase
    .from("collab")
    .select(
      "collab_typ, insamling:insamling_id(public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status)",
    )
    .eq("organisation_id", o.id)
    .eq("status", "godkand")
    .limit(20);
  const collabInsamlingar: InsamlingCardData[] = (collabRader ?? [])
    .filter((c) => c.insamling)
    .map((c) => ({
      publicId: c.insamling!.public_id,
      titel: c.insamling!.titel,
      kortBeskrivning: c.insamling!.kort_beskrivning,
      insamlatOre: c.insamling!.insamlat_ore,
      malbeloppOre: c.insamling!.malbelopp_ore,
      malbeloppMinOre: c.insamling!.malbelopp_min_ore,
      malbeloppMaxOre: c.insamling!.malbelopp_max_ore,
      malbeloppModell: c.insamling!.malbelopp_modell,
      insamlarStad: c.insamling!.insamlar_stad,
      hjalpLand: c.insamling!.hjalp_land,
      insamlingDeadline: c.insamling!.insamling_deadline,
      status: c.insamling!.status,
    }));

  return (
    <main>
      <Section tone="paper" spacing="tight">
        <Container width="narrow">
          <div className="flex flex-wrap items-start gap-6">
            <div
              aria-hidden
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--color-copper-soft)",
                color: "var(--color-copper-deep)",
                fontFamily: "var(--font-display)",
                fontSize: 28,
              }}
            >
              {o.logotyp_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.logotyp_path} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                o.namn.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="forest">{o.organisationstyp}</Pill>
                <Pill tone={o.verifieringsniva === "org_nr" ? "success" : "copper"}>
                  {o.verifieringsniva === "org_nr" ? "Verifierad — org.nr" : "Verifierad — kontakt"}
                </Pill>
              </div>
              <h1 className="h-1 mt-3">{o.namn}</h1>
              <p className="lead mt-3" style={{ maxWidth: "60ch" }}>{o.beskrivning}</p>
              <p className="mt-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
                {o.stad}{o.region ? `, ${o.region}` : ""}
                {o.besoksadress ? ` · ${o.besoksadress}` : ""}
                {o.created_at ? ` · I katalogen sedan ${datum(o.created_at)}` : ""}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {drivna.length > 0 && (
        <Section tone="cream" spacing="default">
          <Container>
            <h2 className="h-2">Drivna insamlingar</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {drivna.map((i) => (
                <InsamlingCard key={i.publicId} data={i} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {collabInsamlingar.length > 0 && (
        <Section tone="paper" spacing="default">
          <Container>
            <h2 className="h-2">Stöttat via collab</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
              Insamlingar där föreningen aktivt står bakom en privatpersons initiativ.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collabInsamlingar.map((i) => (
                <InsamlingCard key={i.publicId} data={i} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {drivna.length === 0 && collabInsamlingar.length === 0 && (
        <Section tone="cream" spacing="default">
          <Container width="narrow">
            <Card variant="tight">
              <p style={{ color: "var(--color-ink-2)" }}>
                Föreningen har inga insamlingar publika just nu. Kom tillbaka — eller
                stötta direkt via en annan insamling.
              </p>
              <LinkButton href="/insamlingar" variant="secondary" size="sm" className="mt-4">
                Utforska insamlingar
              </LinkButton>
            </Card>
          </Container>
        </Section>
      )}
    </main>
  );
}
