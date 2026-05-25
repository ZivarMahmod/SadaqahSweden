// M16 — Admin driftöversikt. Fyra paneler (Block 1):
//  A: Livscykel-hälsa · B: Granskningskö · C: Pengaflöde · D: Systemhälsa.
// Grön-som-default — paneler lyser bara när det finns något att se på.

import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = { title: "Admin — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function AdminDriftoversikt() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const [
    { data: lifecycle },
    { data: granskKo },
    { data: aldsta },
    { data: stripe30d },
    { data: senasteWebhook },
    { data: aktivaLarm },
    { data: regionKo },
  ] = await Promise.all([
    supabase
      .from("insamling")
      .select("status", { count: "exact", head: false })
      .in("status", ["aktiv", "stangd", "vantar_pa_resultat", "pausad", "nedstangd"])
      .is("deleted_at", null),
    supabase
      .from("granskning")
      .select("id, inskickad_at, eskalerad")
      .is("avgjord_at", null),
    supabase
      .from("granskning")
      .select("inskickad_at")
      .is("avgjord_at", null)
      .order("inskickad_at", { ascending: true })
      .limit(1),
    supabase
      .from("donation")
      .select("belopp_ore, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq("bekraftad", true),
    supabase
      .from("donation")
      .select("created_at")
      .eq("bekraftad", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("admin_larm")
      .select("id, niva, kategori, rubrik, detaljer, triggered_at, insamling_id")
      .eq("status", "aktiv")
      .order("triggered_at", { ascending: false })
      .limit(20),
    // F2: per-region kö-aggregat. RLS gör att region-admin bara ser egen region,
    // superadmin/nationellt team ser alla.
    supabase.rpc("region_ko_oversikt"),
  ]);

  // F9: insamlare i Stripe-pending (har account_id men ej onboarding_klar).
  const { data: pendingInsamlare } = await supabase
    .from("profiles")
    .select("public_id, visningsnamn, e_post, stripe_account_id, created_at")
    .in("roll", ["insamlare", "forening"])
    .not("stripe_account_id", "is", null)
    .eq("stripe_onboarding_klar", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const lc = (lifecycle ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const aktiva = lc.aktiv ?? 0;
  const ko = (granskKo ?? []).length;
  const eskalerade = (granskKo ?? []).filter((g) => g.eskalerad).length;
  const aldstaInskickad = aldsta?.[0]?.inskickad_at;
  const aldstaTimmar = aldstaInskickad
    ? Math.round((Date.now() - new Date(aldstaInskickad).getTime()) / 3600000)
    : 0;

  const insamlat30d = (stripe30d ?? []).reduce((s, d) => s + (d.belopp_ore ?? 0), 0);
  const webhookSenaste = senasteWebhook?.[0]?.created_at
    ? new Date(senasteWebhook[0].created_at)
    : null;
  const minSidanWebhook = webhookSenaste
    ? Math.round((Date.now() - webhookSenaste.getTime()) / 60000)
    : null;

  const roda = (aktivaLarm ?? []).filter((l) => l.niva === "rod");
  const gula = (aktivaLarm ?? []).filter((l) => l.niva === "gul");

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <h1 className="heading-2">Drift &amp; admin</h1>

        {/* Larm-band — visas bara när det finns aktivt */}
        {roda.length + gula.length > 0 && (
          <Card variant="tight" className="mt-6">
            <h2 className="heading-3">Aktiva larm</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {roda.map((l) => <LarmRad key={l.id} l={l} />)}
              {gula.map((l) => <LarmRad key={l.id} l={l} />)}
            </ul>
          </Card>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* A: Livscykel */}
          <Card variant="tight">
            <h3 className="heading-3">Livscykel-hälsa</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Aktiva" varde={antal(aktiva)} />
              <Stat label="Väntar resultat" varde={antal(lc.vantar_pa_resultat ?? 0)} />
              <Stat label="Stängda (väntar utbetalning)" varde={antal(lc.stangd ?? 0)} />
              <Stat
                label="Pausade / Nedstängda"
                varde={antal((lc.pausad ?? 0) + (lc.nedstangd ?? 0))}
                varning={(lc.pausad ?? 0) + (lc.nedstangd ?? 0) > 0}
              />
            </dl>
          </Card>

          {/* B: Granskningskö */}
          <Card variant="tight">
            <h3 className="heading-3">Granskningskö</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="I kö" varde={antal(ko)} />
              <Stat label="Eskalerade" varde={antal(eskalerade)} varning={eskalerade > 0} />
              <Stat
                label="Äldsta ärendet"
                varde={ko > 0 ? `${aldstaTimmar} h` : "—"}
                varning={aldstaTimmar > 72}
              />
              <div>
                <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>SLA-status</dt>
                <dd className="mt-1">
                  {aldstaTimmar <= 48 ? (
                    <Pill tone="success">Grön</Pill>
                  ) : aldstaTimmar <= 72 ? (
                    <Pill tone="copper">Gul</Pill>
                  ) : (
                    <Pill tone="danger">Röd</Pill>
                  )}
                </dd>
              </div>
            </dl>
            <Link href="/granskning" className="mt-4 inline-block text-xs underline" style={{ color: "var(--color-forest)" }}>
              Öppna kön →
            </Link>
          </Card>

          {/* C: Pengaflöde */}
          <Card variant="tight">
            <h3 className="heading-3">Pengaflöde</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Insamlat (30 dygn)" varde={kortBelopp(insamlat30d)} />
              <Stat label="Donationer (30 dygn)" varde={antal((stripe30d ?? []).length)} />
            </dl>
            <p className="mt-4 text-xs" style={{ color: "var(--color-ink-3)" }}>
              Stripe-utbetalningar sker via auto-settle. Misslyckade utbetalningar
              triggas till röda larm.
            </p>
          </Card>

          {/* D: Systemhälsa */}
          <Card variant="tight">
            <h3 className="heading-3">Systemhälsa</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>Senaste webhook</dt>
                <dd className="mt-1">
                  {minSidanWebhook != null ? (
                    <Pill tone={minSidanWebhook > 360 ? "danger" : "success"}>
                      {minSidanWebhook < 60
                        ? `${minSidanWebhook} min sedan`
                        : `${Math.round(minSidanWebhook / 60)} h sedan`}
                    </Pill>
                  ) : (
                    <Pill tone="paper">—</Pill>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>Aktiva larm</dt>
                <dd className="mt-1">
                  <Pill tone={roda.length > 0 ? "danger" : gula.length > 0 ? "copper" : "success"}>
                    {roda.length + gula.length} st
                  </Pill>
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* F2: Distribuerad granskningskö — per-region översikt */}
        {regionKo && regionKo.length > 0 && (
          <Card variant="tight" className="mt-8">
            <h3 className="heading-3">Kön per region</h3>
            <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
              Region-admins ser bara egen region. Superadmin och nationellt team
              ser alla regioner; insamlingar utan region hamnar i superadmins kö.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th className="text-right">Öppna</th>
                    <th className="text-right">SLA-brott</th>
                    <th className="text-right">Eskalerade</th>
                    <th className="text-right">Snitt-väntetid</th>
                  </tr>
                </thead>
                <tbody>
                  {regionKo.map((r) => (
                    <tr key={r.region_kod ?? "null"}>
                      <td>
                        {r.region_kod ?? "(ingen region — superadmins kö)"}
                        {r.region_namn && r.region_kod ? ` · ${r.region_namn}` : ""}
                      </td>
                      <td className="text-right tabular">{antal(r.oppna_antal)}</td>
                      <td
                        className="text-right tabular"
                        style={{ color: r.sla_brott_antal > 0 ? "var(--color-danger)" : undefined }}
                      >
                        {antal(r.sla_brott_antal)}
                      </td>
                      <td className="text-right tabular">{antal(r.eskalerade_antal)}</td>
                      <td className="text-right tabular">
                        {r.snittvantetid_timmar ? `${r.snittvantetid_timmar} h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* F9: insamlare med pending Stripe-onboarding */}
        {pendingInsamlare && pendingInsamlare.length > 0 && (
          <Card variant="tight" className="mt-8">
            <h3 className="heading-3">Stripe-pending insamlare ({pendingInsamlare.length})</h3>
            <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
              Insamlare som har påbörjat Stripe-onboarding men inte godkänts än.
              Webhook account.updated flippar status automatiskt.
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {pendingInsamlare.map((p) => (
                <li key={p.public_id} className="flex items-center justify-between gap-3" style={{ borderTop: "1px solid var(--color-ink-line)", paddingTop: 8 }}>
                  <span>
                    <strong>{p.visningsnamn}</strong>{" "}
                    <span style={{ color: "var(--color-ink-3)" }}>· {p.e_post}</span>
                  </span>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)" }}>
                    {p.stripe_account_id}
                  </code>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="mt-8 text-xs" style={{ color: "var(--color-ink-3)" }}>
          Tröskel för publik kommun-statistik är {5}. K-anonymitet enhetlig med M12.
        </p>
      </Container>
    </Section>
  );
}

function Stat({ label, varde, varning }: { label: string; varde: string; varning?: boolean }) {
  return (
    <div>
      <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd
        className="figure mt-1"
        style={{
          fontSize: 28,
          color: varning ? "var(--color-danger)" : "var(--color-forest)",
        }}
      >
        {varde}
      </dd>
    </div>
  );
}

function LarmRad({ l }: { l: { id: string; niva: "rod" | "gul" | "gron"; rubrik: string; detaljer: string | null; triggered_at: string; insamling_id: string | null } }) {
  const tone = l.niva === "rod" ? "danger" : l.niva === "gul" ? "copper" : "outline";
  return (
    <li className="flex items-start justify-between gap-3 py-2" style={{ borderTop: "1px solid var(--color-ink-line)" }}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={tone}>{l.niva.toUpperCase()}</Pill>
          <span className="text-sm font-semibold">{l.rubrik}</span>
        </div>
        {l.detaljer && (
          <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>{l.detaljer}</p>
        )}
      </div>
      <Link
        href={`/admin/larm#${l.id}`}
        className="text-xs underline"
        style={{ color: "var(--color-forest)", whiteSpace: "nowrap" }}
      >
        Hantera →
      </Link>
    </li>
  );
}
