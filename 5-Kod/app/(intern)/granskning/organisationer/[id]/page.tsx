// Modul M10 — Granska enskild organisation.
import { notFound } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { datum } from "@/lib/format";
import { OrgGranskarPanel } from "./panel";
import { AktiveraForeningsKontoKnapp } from "./aktivera-knapp";
import { UppgraderaRegionAdminForm } from "./region-admin-form";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Granska förening — Sadaqah Sweden" };

export default async function GranskaOrg({ params }: { params: Params }) {
  const { id } = await params;
  const me = await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: o, error } = await supabase
    .from("organisation")
    .select("id, namn, org_nummer, organisationstyp, stad, region, besoksadress, beskrivning, logotyp_path, katalog_status, created_at, kontaktperson_namn, kontaktperson_epost, forenings_konto_user_id, forenings_konto_aktiverat_at, profiles!organisation_profil_id_fkey(visningsnamn, e_post)")
    .eq("id", id)
    .single();

  if (error || !o) notFound();

  // FX3 — superadmin-only federation-aktivering.
  const arSuperadmin = me.profil.admin_niva === "superadmin";
  let foreningsKontoProfil: { admin_niva: string | null; admin_region_kod: string | null } | null = null;
  let lanList: { kod: string; namn: string }[] = [];
  if (arSuperadmin && o.forenings_konto_user_id) {
    const [{ data: fkp }, { data: lan }] = await Promise.all([
      supabase
        .from("profiles")
        .select("admin_niva, admin_region_kod")
        .eq("id", o.forenings_konto_user_id)
        .single(),
      supabase
        .from("plats_taxonomi")
        .select("kod, namn")
        .eq("niva", "lan")
        .order("kod"),
    ]);
    foreningsKontoProfil = fkp ?? null;
    lanList = (lan ?? []).map((l) => ({ kod: l.kod, namn: l.namn }));
  }

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <LinkButton href="/granskning/organisationer" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
          Tillbaka till kön
        </LinkButton>
        <h1 className="heading-1 mt-4">{o.namn}</h1>
        <p className="lead mt-2">{o.beskrivning}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
          <Card>
            <h2 className="heading-3">Ansökningsuppgifter</h2>
            <dl className="mt-4 grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
              <dt style={{ color: "var(--color-ink-3)" }}>Typ</dt>
              <dd>{o.organisationstyp}</dd>
              <dt style={{ color: "var(--color-ink-3)" }}>Plats</dt>
              <dd>{o.stad}, {o.region}</dd>
              <dt style={{ color: "var(--color-ink-3)" }}>Besöksadress</dt>
              <dd>{o.besoksadress ?? "—"}</dd>
              <dt style={{ color: "var(--color-ink-3)" }}>Org.nr</dt>
              <dd>
                <code style={{ fontFamily: "var(--font-mono)" }}>
                  {o.org_nummer ?? "—"}
                </code>
              </dd>
              <dt style={{ color: "var(--color-ink-3)" }}>Logotyp-URL</dt>
              <dd className="break-all">{o.logotyp_path ?? "—"}</dd>
              <dt style={{ color: "var(--color-ink-3)" }}>Status</dt>
              <dd><Pill tone="copper">{o.katalog_status}</Pill></dd>
              <dt style={{ color: "var(--color-ink-3)" }}>Anmäld</dt>
              <dd>{datum(o.created_at)}</dd>
            </dl>
          </Card>

          <aside className="flex flex-col gap-4">
            <Card variant="tight">
              <h3 className="heading-3">Insändare</h3>
              <p className="mt-2 text-sm">{o.profiles?.visningsnamn ?? "okänd"}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                <code style={{ fontFamily: "var(--font-mono)" }}>
                  {o.profiles?.e_post ?? "—"}
                </code>
              </p>
            </Card>

            <Card variant="tight">
              <h3 className="heading-3">Checklista</h3>
              <ul className="mt-3 flex flex-col gap-2 text-xs" style={{ color: "var(--color-ink-2)" }}>
                <li>Är detta en muslimsk förening eller moské? (M10 B2.4)</li>
                <li>Stämmer org.nr mot offentligt register?</li>
                <li>Bekräfta kontaktväg (M10 B5.4)</li>
                <li>Beskrivning fri från diskriminering (M8)?</li>
              </ul>
            </Card>

            <Card variant="tight">
              <h3 className="heading-3">Kontaktperson (förening)</h3>
              <p className="mt-2 text-sm">{o.kontaktperson_namn ?? "—"}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                <code style={{ fontFamily: "var(--font-mono)" }}>
                  {o.kontaktperson_epost ?? "—"}
                </code>
              </p>
            </Card>

            <Card variant="tight">
              <h3 className="heading-3">Beslut</h3>
              <div className="mt-3">
                <OrgGranskarPanel orgId={o.id} />
              </div>
            </Card>

            {(o.katalog_status === "publicerad" || o.forenings_konto_user_id) && (
              <Card variant="tight">
                <h3 className="heading-3">Förenings-konto</h3>
                <div className="mt-3">
                  <AktiveraForeningsKontoKnapp
                    orgId={o.id}
                    alreadyActive={!!o.forenings_konto_user_id}
                  />
                </div>
              </Card>
            )}

            {arSuperadmin && o.forenings_konto_user_id && (
              <Card variant="tight">
                <h3 className="heading-3">Region-admin (federation)</h3>
                <div className="mt-3">
                  <UppgraderaRegionAdminForm
                    orgId={o.id}
                    orgNamn={o.namn}
                    currentAdminNiva={foreningsKontoProfil?.admin_niva ?? null}
                    currentRegionKod={foreningsKontoProfil?.admin_region_kod ?? null}
                    lanList={lanList}
                  />
                </div>
              </Card>
            )}
          </aside>
        </div>
      </Container>
    </Section>
  );
}
