// M16 — Admin driftöversikt (Maskinrum-dashboard, brief 22 F1).
// Designreferens: handoff v2.1/source/studio/screens-internal.jsx (Admin)
// + handoff v2.1/source/v2/admin.html. Layout: KPI-rad, donations-diagram,
// senaste donationer, larm/granskning/system-kort, topp-insamlingar, nya
// registreringar. Allt på befintliga tabeller — inga nya databasmoduler.
//
// Säkerhet: kraver(['granskare','admin']) gatar sidan; RLS skyddar
// dessutom (donation, granskning, admin_larm, profiles, insamling).
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = { title: "Maskinrum — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

type Larm = {
  id: string;
  niva: "rod" | "gul" | "gron";
  kategori: string | null;
  rubrik: string;
  detaljer: string | null;
  triggered_at: string;
  insamling_id: string | null;
};

const TIMME_MS = 60 * 60 * 1000;
const DYGN_MS = 24 * TIMME_MS;

export default async function MaskinrumDashboard() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const nu = Date.now();
  const dygnIso = new Date(nu - DYGN_MS).toISOString();
  const dagensStartIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const trettiodagar = new Date(nu - 30 * DYGN_MS).toISOString();
  const sjuDagar = new Date(nu - 7 * DYGN_MS).toISOString();

  const [
    { data: lifecycle },
    { data: granskKo },
    { data: aldsta },
    { data: don24h },
    { data: don30d },
    { data: donIdag },
    { data: senasteDonRows },
    { data: senasteWebhook },
    { data: aktivaLarm },
    { data: nyaProfiler },
  ] = await Promise.all([
    supabase
      .from("insamling")
      .select("status")
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
      .select("belopp_ore, created_at, insamling_id")
      .gte("created_at", dygnIso)
      .eq("bekraftad", true),
    supabase
      .from("donation")
      .select("belopp_ore")
      .gte("created_at", trettiodagar)
      .eq("bekraftad", true),
    supabase
      .from("donation")
      .select("belopp_ore")
      .gte("created_at", dagensStartIso)
      .eq("bekraftad", true),
    supabase
      .from("donation")
      .select("id, belopp_ore, created_at, anonym, donator_id, insamling_id")
      .eq("bekraftad", true)
      .order("created_at", { ascending: false })
      .limit(10),
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
    supabase
      .from("profiles")
      .select("public_id, visningsnamn, roll, created_at")
      .gte("created_at", sjuDagar)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // KPI: insamlat idag
  const idagOre = (donIdag ?? []).reduce((s, d) => s + (d.belopp_ore ?? 0), 0);
  // KPI: insamlat 30 dygn (fjärde KPI — Stripe-balans skulle kräva live-API,
  // brief tillåter 30-dygnsfall back när Stripe-balansen inte är trivial).
  const trettiodagarOre = (don30d ?? []).reduce((s, d) => s + (d.belopp_ore ?? 0), 0);

  const lcMap = (lifecycle ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const aktiva = lcMap.aktiv ?? 0;
  const koAntal = (granskKo ?? []).length;
  const eskalerade = (granskKo ?? []).filter((g) => g.eskalerad).length;
  const aldstaIso = aldsta?.[0]?.inskickad_at;
  const aldstaTimmar = aldstaIso
    ? Math.round((nu - new Date(aldstaIso).getTime()) / TIMME_MS)
    : 0;

  // Bar-chart: senaste 24 timmar, bucket per timme
  const buckets: { tid: Date; sum: number; antal: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const tid = new Date(nu - i * TIMME_MS);
    tid.setMinutes(0, 0, 0);
    buckets.push({ tid, sum: 0, antal: 0 });
  }
  for (const d of don24h ?? []) {
    const t = new Date(d.created_at).getTime();
    const idx = buckets.findIndex(
      (b, j) =>
        t >= b.tid.getTime() &&
        (j === buckets.length - 1 || t < buckets[j + 1].tid.getTime()),
    );
    if (idx >= 0) {
      buckets[idx].sum += d.belopp_ore ?? 0;
      buckets[idx].antal += 1;
    }
  }
  const maxBucket = Math.max(1, ...buckets.map((b) => b.sum));

  // Topp-insamlingar idag — räkna per insamling_id
  const perIns = new Map<string, number>();
  for (const d of don24h ?? []) {
    perIns.set(d.insamling_id, (perIns.get(d.insamling_id) ?? 0) + (d.belopp_ore ?? 0));
  }
  const toppIds = [...perIns.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const toppTitlar = await hamtaTitlar(supabase, toppIds);
  const toppRader = toppIds.map((id) => ({
    id,
    titel: toppTitlar.get(id)?.titel ?? "(okänd insamling)",
    publicId: toppTitlar.get(id)?.publicId ?? null,
    sum: perIns.get(id) ?? 0,
  }));

  // Senaste donationer — hämta tillhörande titlar + visningsnamn
  const insIdsSenaste = [...new Set((senasteDonRows ?? []).map((d) => d.insamling_id))];
  const donatorIds = [
    ...new Set(
      (senasteDonRows ?? [])
        .filter((d) => !d.anonym && d.donator_id)
        .map((d) => d.donator_id as string),
    ),
  ];
  const [titlarKarta, donatorKarta] = await Promise.all([
    hamtaTitlar(supabase, insIdsSenaste),
    hamtaVisningsnamn(supabase, donatorIds),
  ]);
  const senasteDon = (senasteDonRows ?? []).map((d) => ({
    id: d.id,
    beloppOre: d.belopp_ore ?? 0,
    createdAt: d.created_at,
    visningsnamn:
      d.anonym || !d.donator_id
        ? "Anonym"
        : donatorKarta.get(d.donator_id) ?? "Donator",
    insamlingTitel: titlarKarta.get(d.insamling_id)?.titel ?? "(okänd insamling)",
    insamlingPublicId: titlarKarta.get(d.insamling_id)?.publicId ?? null,
  }));

  const webhookSenaste = senasteWebhook?.[0]?.created_at
    ? new Date(senasteWebhook[0].created_at)
    : null;
  const minSidanWebhook = webhookSenaste
    ? Math.round((nu - webhookSenaste.getTime()) / 60000)
    : null;

  const larmTyper = (aktivaLarm ?? []) as Larm[];
  const roda = larmTyper.filter((l) => l.niva === "rod");
  const gula = larmTyper.filter((l) => l.niva === "gul");

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mag-eyebrow">
            <span className="stroke" />
            Maskinrum
          </span>
          <h1 className="mag-h1 mt-2">Drift &amp; admin</h1>
          <p className="mag-lead mt-2" style={{ fontSize: 16 }}>
            Realtidsöversikt över livscykel, granskning, pengaflöde och systemhälsa.
            Allt räknas från råa rader — inga cachelager.
          </p>
        </div>
      </header>

      {/* KPI-rad — fyra paneler */}
      <section className="dash-kpi-row mt-8">
        <div className="dash-kpi">
          <div className="label">Samlat idag</div>
          <div className="figure">{kortBelopp(idagOre)}</div>
          <div className="sub">{antal((donIdag ?? []).length)} donationer sedan 00:00</div>
        </div>
        <div className="dash-kpi">
          <div className="label">Aktiva projekt</div>
          <div className="figure">{antal(aktiva)}</div>
          <div className="sub">
            {antal(lcMap.vantar_pa_resultat ?? 0)} väntar resultat ·{" "}
            {antal((lcMap.pausad ?? 0) + (lcMap.nedstangd ?? 0))} pausade
          </div>
        </div>
        <div className="dash-kpi">
          <div className="label">Väntar på granskning</div>
          <div
            className="figure"
            style={{ color: aldstaTimmar > 72 ? "var(--color-danger)" : undefined }}
          >
            {antal(koAntal)}
          </div>
          <div className="sub">
            {eskalerade > 0 && <>{antal(eskalerade)} eskalerade · </>}
            äldsta {koAntal > 0 ? `${aldstaTimmar} h` : "—"}
          </div>
        </div>
        <div className="dash-kpi">
          <div className="label">Insamlat 30 dygn</div>
          <div className="figure">{kortBelopp(trettiodagarOre)}</div>
          <div className="sub">{antal((don30d ?? []).length)} bekräftade donationer</div>
        </div>
      </section>

      {/* Larm-band — visas bara när det finns något */}
      {roda.length + gula.length > 0 && (
        <section className="mag-card mt-8" style={{ borderColor: roda.length > 0 ? "var(--color-danger)" : undefined }}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="mag-h3">Aktiva larm</h2>
            <span className="f-mono" style={{ fontSize: 11, color: "var(--color-ink-3)", letterSpacing: "0.12em" }}>
              {antal(roda.length)} röda · {antal(gula.length)} gula
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-0">
            {[...roda, ...gula].slice(0, 6).map((l) => (
              <LarmRad key={l.id} l={l} />
            ))}
          </ul>
          {roda.length + gula.length > 6 && (
            <Link
              href="/admin/larm"
              className="f-mono uc mt-4 inline-block"
              style={{ fontSize: 11, color: "var(--color-forest)" }}
            >
              Alla larm →
            </Link>
          )}
        </section>
      )}

      {/* Två-kolumn-layout: vänster bred (chart + donations), höger smal (kort) */}
      <section className="mt-8 grid gap-6" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)" }}>
        <div className="flex flex-col gap-6">
          {/* Donations-diagram per timme */}
          <div className="mag-card">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="mag-h3">Donationer · senaste 24 timmarna</h2>
              <span className="f-mono uc" style={{ fontSize: 10.5, color: "var(--color-ink-3)" }}>
                {antal((don24h ?? []).length)} st · {kortBelopp((don24h ?? []).reduce((s, d) => s + (d.belopp_ore ?? 0), 0))}
              </span>
            </div>
            <div className="mt-6 flex items-end gap-[3px]" style={{ height: 140 }}>
              {buckets.map((b) => {
                const h = b.sum === 0 ? 2 : Math.max(4, Math.round((b.sum / maxBucket) * 140));
                return (
                  <div
                    key={b.tid.toISOString()}
                    title={`${b.tid.getHours().toString().padStart(2, "0")}:00 — ${kortBelopp(b.sum)} (${b.antal})`}
                    style={{
                      flex: 1,
                      height: h,
                      background:
                        b.sum === 0 ? "var(--color-ink-line)" : "var(--color-forest)",
                      borderRadius: "var(--sr-1) var(--sr-1) 0 0",
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between f-mono" style={{ fontSize: 10, color: "var(--color-ink-4)", letterSpacing: "0.08em" }}>
              <span>{buckets[0].tid.getHours().toString().padStart(2, "0")}:00</span>
              <span>{buckets[Math.floor(buckets.length / 2)].tid.getHours().toString().padStart(2, "0")}:00</span>
              <span>{buckets[buckets.length - 1].tid.getHours().toString().padStart(2, "0")}:00</span>
            </div>
          </div>

          {/* Senaste donationer */}
          <div className="mag-card">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="mag-h3">Senaste donationer</h2>
              <Link
                href="/admin/transaktioner"
                className="f-mono uc"
                style={{ fontSize: 10.5, color: "var(--color-forest)" }}
              >
                Hela loggen →
              </Link>
            </div>
            {senasteDon.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: "var(--color-ink-3)" }}>
                Inga donationer än.
              </p>
            ) : (
              <table className="dash-table mt-4">
                <thead>
                  <tr>
                    <th>Tid</th>
                    <th>Donator</th>
                    <th>Insamling</th>
                    <th style={{ textAlign: "right" }}>Belopp</th>
                  </tr>
                </thead>
                <tbody>
                  {senasteDon.map((d) => (
                    <tr key={d.id}>
                      <td className="f-mono" style={{ fontSize: 12, color: "var(--color-ink-3)", whiteSpace: "nowrap" }}>
                        {fmtTid(d.createdAt)}
                      </td>
                      <td>{d.visningsnamn}</td>
                      <td>
                        {d.insamlingPublicId ? (
                          <Link
                            href={`/insamlingar/${d.insamlingPublicId}`}
                            style={{ color: "var(--color-forest)" }}
                          >
                            {d.insamlingTitel}
                          </Link>
                        ) : (
                          d.insamlingTitel
                        )}
                      </td>
                      <td className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                        {kortBelopp(d.beloppOre)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Granskningskö */}
          <div className="mag-card">
            <h3 className="mag-h3">Granskningskö</h3>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="f-mono uc" style={{ fontSize: 10.5, color: "var(--color-ink-3)" }}>
                I kö
              </span>
              <span className="figure" style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 300 }}>
                {antal(koAntal)}
              </span>
            </div>
            <div className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
              {eskalerade > 0 && <>{antal(eskalerade)} eskalerade · </>}
              SLA:{" "}
              <span
                className="f-mono"
                style={{
                  color:
                    aldstaTimmar > 72
                      ? "var(--color-danger)"
                      : aldstaTimmar > 48
                      ? "var(--color-copper-deep)"
                      : "var(--color-success)",
                }}
              >
                {aldstaTimmar <= 48 ? "GRÖN" : aldstaTimmar <= 72 ? "GUL" : "RÖD"}
              </span>
            </div>
            <Link
              href="/granskning"
              className="mag-btn mag-btn-secondary mag-btn-sm mt-4"
              style={{ width: "100%" }}
            >
              Öppna kön
            </Link>
          </div>

          {/* Systemstatus */}
          <div className="mag-card">
            <h3 className="mag-h3">Systemstatus</h3>
            <ul className="mt-4 flex flex-col gap-3">
              <SysRad
                namn="Stripe webhook"
                varde={minSidanWebhook != null
                  ? minSidanWebhook < 60
                    ? `${minSidanWebhook} min sedan`
                    : `${Math.round(minSidanWebhook / 60)} h sedan`
                  : "Ingen data"}
                ton={minSidanWebhook != null && minSidanWebhook > 360 ? "danger" : "ok"}
              />
              <SysRad
                namn="BankID"
                varde="Aktiv (live-status i senare brief)"
                ton="pending"
              />
              <SysRad
                namn="Supabase"
                varde="OK — sidan har laddat"
                ton="ok"
              />
              <SysRad
                namn="Mail (Resend)"
                varde="OK — antaget (status i senare brief)"
                ton="pending"
              />
            </ul>
          </div>
        </aside>
      </section>

      {/* Bottenrad: Topp-insamlingar idag + Nya registreringar */}
      <section
        className="mt-8 grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
      >
        <div className="mag-card">
          <h3 className="mag-h3">Topp-insamlingar senaste 24 h</h3>
          {toppRader.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--color-ink-3)" }}>
              Inga donationer senaste dygnet.
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {toppRader.map((r, i) => (
                <li key={r.id} className="flex items-baseline justify-between gap-3">
                  <span className="f-mono" style={{ fontSize: 11, color: "var(--color-ink-3)", letterSpacing: "0.12em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    {r.publicId ? (
                      <Link
                        href={`/insamlingar/${r.publicId}`}
                        style={{ color: "var(--color-ink-1)" }}
                      >
                        {r.titel}
                      </Link>
                    ) : (
                      r.titel
                    )}
                  </span>
                  <span className="tnum" style={{ fontWeight: 600 }}>
                    {kortBelopp(r.sum)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="mag-card">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="mag-h3">Nya registreringar (7 d)</h3>
            <span className="f-mono uc" style={{ fontSize: 10.5, color: "var(--color-ink-3)" }}>
              {antal((nyaProfiler ?? []).length)}
            </span>
          </div>
          {(nyaProfiler ?? []).length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--color-ink-3)" }}>
              Inga nya konton senaste veckan.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {(nyaProfiler ?? []).map((p) => (
                <li
                  key={p.public_id}
                  className="flex items-baseline justify-between gap-3"
                  style={{ borderTop: "1px solid var(--color-ink-line)", paddingTop: 10 }}
                >
                  <span>
                    <strong>{p.visningsnamn}</strong>
                    <span className="f-mono ml-2" style={{ fontSize: 10.5, color: "var(--color-ink-3)", letterSpacing: "0.08em" }}>
                      {p.roll.toUpperCase()}
                    </span>
                  </span>
                  <span className="f-mono" style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
                    {fmtDatum(p.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

type TitelKarta = Map<string, { titel: string; publicId: string }>;
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function hamtaTitlar(
  supabase: SupabaseClient,
  ids: string[],
): Promise<TitelKarta> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("insamling")
    .select("id, titel, public_id")
    .in("id", ids);
  return new Map(
    (data ?? []).map((r) => [
      r.id,
      { titel: r.titel as string, publicId: r.public_id as string },
    ]),
  );
}

async function hamtaVisningsnamn(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, visningsnamn")
    .in("id", ids);
  return new Map((data ?? []).map((r) => [r.id as string, r.visningsnamn as string]));
}

function fmtTid(iso: string): string {
  const d = new Date(iso);
  const nu = Date.now();
  const diff = nu - d.getTime();
  if (diff < 60_000) return "nyss";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h`;
  return d.toLocaleDateString("sv-SE", { day: "2-digit", month: "2-digit" });
}
function fmtDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function LarmRad({ l }: { l: Larm }) {
  const farg =
    l.niva === "rod"
      ? "var(--color-danger)"
      : l.niva === "gul"
      ? "var(--color-copper)"
      : "var(--color-success)";
  return (
    <li
      className="flex items-start justify-between gap-3 py-3"
      style={{ borderTop: "1px solid var(--color-ink-line)" }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: farg,
            flex: "0 0 8px",
            marginTop: 7,
          }}
        />
        <div>
          <div className="text-sm font-semibold">{l.rubrik}</div>
          {l.detaljer && (
            <p className="mt-1 text-xs" style={{ color: "var(--color-ink-3)" }}>
              {l.detaljer}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/admin/larm#${l.id}`}
        className="f-mono uc"
        style={{ fontSize: 10.5, color: "var(--color-forest)", whiteSpace: "nowrap" }}
      >
        Hantera →
      </Link>
    </li>
  );
}

function SysRad({
  namn,
  varde,
  ton,
}: {
  namn: string;
  varde: string;
  ton: "ok" | "danger" | "pending";
}) {
  const farg =
    ton === "ok"
      ? "var(--color-success)"
      : ton === "danger"
      ? "var(--color-danger)"
      : "var(--color-copper)";
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: farg,
            flex: "0 0 8px",
          }}
        />
        {namn}
      </span>
      <span style={{ color: "var(--color-ink-3)", fontSize: 12 }}>{varde}</span>
    </li>
  );
}
