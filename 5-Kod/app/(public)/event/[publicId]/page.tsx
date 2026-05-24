// M14 — publik event-detalj.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";
import {
  EVENT_TYP_LABEL,
  formatEventTid,
  formatUpprepning,
  nastaForekomst,
} from "@/lib/event";

type Params = Promise<{ publicId: string }>;

const PUBLIK = new Set(["publicerad", "avslutad", "installt"]);

export async function generateMetadata({ params }: { params: Params }) {
  const raw = (await params).publicId;
  const publicId = raw.split("-")[0];
  const supabase = await createClient();
  const { data } = await supabase
    .from("event")
    .select("titel, beskrivning, status, deleted_at")
    .eq("public_id", publicId)
    .single();
  if (!data || data.deleted_at || !PUBLIK.has(data.status)) {
    return { title: "Event — Sadaqah Sweden" };
  }
  return { title: `${data.titel} — Event`, description: data.beskrivning.slice(0, 150) };
}

export default async function EventSida({ params }: { params: Params }) {
  const raw = (await params).publicId;
  const publicId = raw.split("-")[0];
  const supabase = await createClient();

  const { data: e } = await supabase
    .from("event")
    .select(
      "id, public_id, slug, titel, typ, beskrivning, start_at, slut_at, upprepning, upprepning_veckodag, upprepning_slut, installt_forekomster, plats_typ, plats_namn, plats_adress, plats_stad, plats_organisation_id, digital_lank, kontakt_epost, kontakt_telefon, anmalan_lank, kostnad, status, publicerad_at, deleted_at, arrangor_org_id, arrangor_profil_id, profiles:arrangor_profil_id(visningsnamn, public_id), organisation:arrangor_org_id(namn, public_id)",
    )
    .eq("public_id", publicId)
    .single();

  if (!e || e.deleted_at || !PUBLIK.has(e.status)) notFound();

  const profilArr = (e as { profiles?: unknown }).profiles;
  const orgArr = (e as { organisation?: unknown }).organisation;
  const profil = Array.isArray(profilArr) ? profilArr[0] : profilArr;
  const org = Array.isArray(orgArr) ? orgArr[0] : orgArr;
  const arrangorNamn = (org as { namn?: string } | undefined)?.namn ?? (profil as { visningsnamn?: string } | undefined)?.visningsnamn ?? "Arrangör";

  const nasta = nastaForekomst(e);
  const upprepning = formatUpprepning(e);

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="copper">{EVENT_TYP_LABEL[e.typ]}</Pill>
          {upprepning && <Pill tone="outline">{upprepning}</Pill>}
          {e.plats_typ === "digital" && <Pill tone="paper">Digitalt</Pill>}
          {e.status === "installt" && <Pill tone="danger">Inställt</Pill>}
          {e.status === "avslutad" && <Pill tone="paper">Avslutat</Pill>}
        </div>
        <h1 className="heading-1 mt-4">{e.titel}</h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-4 text-sm"
          style={{ color: "var(--color-ink-2)" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={14} />
            {nasta ? formatEventTid(nasta, e.slut_at) : formatEventTid(e.start_at, e.slut_at)}
          </span>
          {e.plats_typ === "fysisk" && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="map-pin" size={14} />
              {e.plats_namn}{e.plats_adress ? `, ${e.plats_adress}` : ""}{e.plats_stad ? `, ${e.plats_stad}` : ""}
            </span>
          )}
          {e.plats_typ === "digital" && e.digital_lank && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="external" size={14} />
              Digitalt event — länk i panelen
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-[2fr_1fr]">
          <article>
            <h2 className="heading-3">Om eventet</h2>
            <p
              className="mt-3 whitespace-pre-wrap text-base leading-relaxed"
              style={{ color: "var(--color-ink-1)" }}
            >
              {e.beskrivning}
            </p>
          </article>

          <aside className="flex flex-col gap-4">
            <Card variant="tight">
              <h3 className="heading-3">Arrangör</h3>
              <p className="mt-3 text-sm" style={{ color: "var(--color-ink-1)" }}>
                {arrangorNamn}
                {org && (
                  <>
                    {" "}
                    <Link
                      href={`/foreningar/${(org as { public_id: string }).public_id}`}
                      className="text-xs"
                      style={{ color: "var(--color-forest)", textDecoration: "underline" }}
                    >
                      visa förening
                    </Link>
                  </>
                )}
                {profil && !org && (
                  <>
                    {" "}
                    <Link
                      href={`/profil/${(profil as { public_id: string }).public_id}`}
                      className="text-xs"
                      style={{ color: "var(--color-forest)", textDecoration: "underline" }}
                    >
                      visa profil
                    </Link>
                  </>
                )}
              </p>
              {e.kontakt_epost && (
                <p className="mt-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
                  Kontakt: <a href={`mailto:${e.kontakt_epost}`}>{e.kontakt_epost}</a>
                </p>
              )}
              {e.kontakt_telefon && (
                <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
                  Telefon: <a href={`tel:${e.kontakt_telefon}`}>{e.kontakt_telefon}</a>
                </p>
              )}
            </Card>

            {(e.anmalan_lank || e.plats_typ === "digital") && (
              <Card variant="tight">
                <h3 className="heading-3">Delta</h3>
                {e.kostnad && (
                  <p className="mt-3 text-sm" style={{ color: "var(--color-ink-2)" }}>
                    {e.kostnad}
                  </p>
                )}
                {e.anmalan_lank && (
                  <a
                    href={e.anmalan_lank}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm mt-4 inline-flex"
                  >
                    Anmäl dig (extern länk)
                  </a>
                )}
                {e.plats_typ === "digital" && e.digital_lank && (
                  <a
                    href={e.digital_lank}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm mt-3 inline-flex"
                  >
                    Öppna länken
                  </a>
                )}
              </Card>
            )}

            <Card variant="tight">
              <h3 className="heading-3">Granskat</h3>
              <p
                className="mt-3 text-xs leading-relaxed"
                style={{ color: "var(--color-ink-2)" }}
              >
                Plattformen granskar varje event mot en lättare checklista innan publicering.
                Vid frågor eller felaktig info — rapportera till oss.
              </p>
            </Card>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
