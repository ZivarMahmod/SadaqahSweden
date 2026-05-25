// M16 — Transaktioner (brief 22 F4).
// Enad logg över de fem Stripe-spegelnerade tabellerna: donation, refunds,
// disputes, transfers, payouts. Allt på befintliga kolumner — inga nya
// tabeller, ingen ny RPC, ingen ny migration.
// Säkerhet: kraver(['granskare','admin']) + RLS-policies på respektive
// tabell ger sista skyddet.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = { title: "Transaktioner — Maskinrum" };
export const dynamic = "force-dynamic";

const PER_SIDA = 50;
const HAMTA_PER_TABELL = 200;

type Typ = "donation" | "refund" | "dispute" | "transfer" | "payout";

type Rad = {
  id: string;
  typ: Typ;
  beloppOre: number;
  status: string;
  motpartId: string | null; // insamling.id
  motpartFallback: string | null; // visat namn om motpartId saknas
  tid: string; // ISO
  ref: string | null; // stripe-id (re_…, dp_…, tr_…, po_…) eller donation.public_id
};

const TYP_LABEL: Record<Typ, string> = {
  donation: "Donation",
  refund: "Refund",
  dispute: "Dispute",
  transfer: "Transfer",
  payout: "Payout",
};
const TYP_TON: Record<Typ, string> = {
  donation: "var(--color-forest)",
  refund: "var(--color-copper-deep)",
  dispute: "var(--color-danger)",
  transfer: "var(--color-ink-2)",
  payout: "var(--color-ink-2)",
};

export default async function TransaktionerPage({
  searchParams,
}: {
  searchParams: Promise<{ typ?: string; status?: string; page?: string }>;
}) {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const sp = await searchParams;
  const typFilter = (sp.typ ?? "") as Typ | "";
  const statusFilter = (sp.status ?? "").trim();
  const sida = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [
    { data: donRows },
    { data: refRows },
    { data: dispRows },
    { data: trRows },
    { data: poRows },
  ] = await Promise.all([
    supabase
      .from("donation")
      .select("id, public_id, belopp_ore, status, insamling_id, created_at")
      .eq("bekraftad", true)
      .order("created_at", { ascending: false })
      .limit(HAMTA_PER_TABELL),
    supabase
      .from("refunds")
      .select("id, stripe_refund_id, belopp_ore, status, donation_id, created_at")
      .order("created_at", { ascending: false })
      .limit(HAMTA_PER_TABELL),
    supabase
      .from("disputes")
      .select("id, stripe_dispute_id, belopp_ore, status, insamling_id, created_at")
      .order("created_at", { ascending: false })
      .limit(HAMTA_PER_TABELL),
    supabase
      .from("transfers")
      .select("id, stripe_transfer_id, belopp_ore, status, insamling_id, created_at")
      .order("created_at", { ascending: false })
      .limit(HAMTA_PER_TABELL),
    supabase
      .from("payouts")
      .select("id, stripe_payout_id, belopp_ore, status, insamling_id, created_at")
      .order("created_at", { ascending: false })
      .limit(HAMTA_PER_TABELL),
  ]);

  // Refund saknar insamling_id direkt — slå upp via donation
  const refundDonIds = [...new Set((refRows ?? []).map((r) => r.donation_id as string))];
  const { data: refundDonMap } = refundDonIds.length
    ? await supabase
        .from("donation")
        .select("id, insamling_id")
        .in("id", refundDonIds)
    : { data: [] as { id: string; insamling_id: string }[] };
  const donInsKarta = new Map(
    (refundDonMap ?? []).map((d) => [d.id as string, d.insamling_id as string]),
  );

  const insamlingIds = [
    ...new Set(
      [
        ...(donRows ?? []).map((r) => r.insamling_id),
        ...(dispRows ?? []).map((r) => r.insamling_id),
        ...(trRows ?? []).map((r) => r.insamling_id),
        ...(poRows ?? []).map((r) => r.insamling_id).filter(Boolean),
        ...[...donInsKarta.values()],
      ].filter(Boolean) as string[],
    ),
  ];
  const titlarKarta = await hamtaTitlar(supabase, insamlingIds);

  const rader: Rad[] = [];
  for (const r of donRows ?? []) {
    rader.push({
      id: `don-${r.id}`,
      typ: "donation",
      beloppOre: r.belopp_ore ?? 0,
      status: r.status ?? "skapad",
      motpartId: r.insamling_id as string,
      motpartFallback: null,
      tid: r.created_at as string,
      ref: r.public_id as string,
    });
  }
  for (const r of refRows ?? []) {
    const insId = donInsKarta.get(r.donation_id as string) ?? null;
    rader.push({
      id: `ref-${r.id}`,
      typ: "refund",
      beloppOre: r.belopp_ore ?? 0,
      status: r.status ?? "pending",
      motpartId: insId,
      motpartFallback: null,
      tid: r.created_at as string,
      ref: r.stripe_refund_id as string | null,
    });
  }
  for (const r of dispRows ?? []) {
    rader.push({
      id: `dis-${r.id}`,
      typ: "dispute",
      beloppOre: r.belopp_ore ?? 0,
      status: r.status ?? "needs_response",
      motpartId: r.insamling_id as string,
      motpartFallback: null,
      tid: r.created_at as string,
      ref: r.stripe_dispute_id as string,
    });
  }
  for (const r of trRows ?? []) {
    rader.push({
      id: `tr-${r.id}`,
      typ: "transfer",
      beloppOre: r.belopp_ore ?? 0,
      status: r.status ?? "pending",
      motpartId: r.insamling_id as string,
      motpartFallback: null,
      tid: r.created_at as string,
      ref: r.stripe_transfer_id as string | null,
    });
  }
  for (const r of poRows ?? []) {
    rader.push({
      id: `po-${r.id}`,
      typ: "payout",
      beloppOre: r.belopp_ore ?? 0,
      status: r.status ?? "pending",
      motpartId: (r.insamling_id as string | null) ?? null,
      motpartFallback: r.insamling_id ? null : "Aggregerad payout",
      tid: r.created_at as string,
      ref: r.stripe_payout_id as string | null,
    });
  }

  rader.sort((a, b) => b.tid.localeCompare(a.tid));

  const filtrerade = rader.filter((r) => {
    if (typFilter && r.typ !== typFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const totalAntal = filtrerade.length;
  const sidor = Math.max(1, Math.ceil(totalAntal / PER_SIDA));
  const aktiv = Math.min(sida, sidor);
  const visade = filtrerade.slice((aktiv - 1) * PER_SIDA, aktiv * PER_SIDA);

  const statusarFortyp: Record<string, string[]> = {};
  for (const r of rader) {
    const key = r.typ;
    if (!statusarFortyp[key]) statusarFortyp[key] = [];
    if (!statusarFortyp[key].includes(r.status)) statusarFortyp[key].push(r.status);
  }
  const synligaStatusar = typFilter
    ? statusarFortyp[typFilter] ?? []
    : [...new Set(rader.map((r) => r.status))];

  function lank(extra: { page?: number }) {
    const usp = new URLSearchParams();
    if (typFilter) usp.set("typ", typFilter);
    if (statusFilter) usp.set("status", statusFilter);
    const p = extra.page ?? aktiv;
    if (p > 1) usp.set("page", String(p));
    const s = usp.toString();
    return s ? `?${s}` : "?";
  }

  return (
    <main>
      <header>
        <span className="mag-eyebrow">
          <span className="stroke" />
          Drift
        </span>
        <h1 className="mag-h1 mt-2">Transaktioner</h1>
        <p className="mag-lead mt-2" style={{ fontSize: 16 }}>
          Enad logg över donationer, refunds, disputes, transfers och payouts —
          spegel av Stripe. {antal(rader.length)} senaste rader (max{" "}
          {antal(HAMTA_PER_TABELL)} per tabell).
        </p>
      </header>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-center gap-3"
        role="search"
      >
        <select name="typ" defaultValue={typFilter} className="select" style={{ maxWidth: 200 }} aria-label="Typ">
          <option value="">Alla typer</option>
          <option value="donation">Donation</option>
          <option value="refund">Refund</option>
          <option value="dispute">Dispute</option>
          <option value="transfer">Transfer</option>
          <option value="payout">Payout</option>
        </select>
        <select
          name="status"
          defaultValue={statusFilter}
          className="select"
          style={{ maxWidth: 240 }}
          aria-label="Status"
        >
          <option value="">Alla statusar</option>
          {synligaStatusar.sort().map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="mag-btn mag-btn-primary mag-btn-sm">
          Filtrera
        </button>
        {(typFilter || statusFilter) && (
          <Link href="/admin/transaktioner" className="mag-btn mag-btn-ghost mag-btn-sm">
            Nollställ
          </Link>
        )}
      </form>

      {visade.length === 0 ? (
        <div className="mag-card mt-8 text-center" style={{ padding: "48px 24px" }}>
          <h2 className="mag-h3">Inga transaktioner matchar</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
            {typFilter || statusFilter
              ? "Filtret gav inga träffar. Justera eller nollställ."
              : "Inga transaktioner i någon av de fem tabellerna än."}
          </p>
        </div>
      ) : (
        <>
          <table className="dash-table mt-6">
            <thead>
              <tr>
                <th>Tid</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Motpart</th>
                <th>Referens</th>
                <th style={{ textAlign: "right" }}>Belopp</th>
              </tr>
            </thead>
            <tbody>
              {visade.map((r) => {
                const titel = r.motpartId ? titlarKarta.get(r.motpartId) : null;
                return (
                  <tr key={r.id}>
                    <td className="f-mono" style={{ fontSize: 12, color: "var(--color-ink-3)", whiteSpace: "nowrap" }}>
                      {fmtTid(r.tid)}
                    </td>
                    <td>
                      <span
                        className="mag-tag"
                        style={{ background: "transparent", color: TYP_TON[r.typ], border: `1px solid ${TYP_TON[r.typ]}` }}
                      >
                        {TYP_LABEL[r.typ]}
                      </span>
                    </td>
                    <td className="f-mono" style={{ fontSize: 12 }}>
                      {r.status}
                    </td>
                    <td>
                      {titel ? (
                        <Link
                          href={`/insamlingar/${titel.publicId}`}
                          style={{ color: "var(--color-forest)" }}
                        >
                          {titel.titel}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--color-ink-3)" }}>
                          {r.motpartFallback ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="f-mono" style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
                      {r.ref ?? "—"}
                    </td>
                    <td className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                      {kortBelopp(r.beloppOre)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sidor > 1 && (
            <nav
              className="mt-6 flex items-center justify-between"
              aria-label="Paginering"
            >
              <span className="f-mono" style={{ fontSize: 11, color: "var(--color-ink-3)", letterSpacing: "0.12em" }}>
                Sida {aktiv} av {sidor} · {visade.length} av {totalAntal} rader
              </span>
              <span className="flex gap-2">
                {aktiv > 1 && (
                  <Link
                    href={lank({ page: aktiv - 1 })}
                    className="mag-btn mag-btn-ghost mag-btn-sm"
                  >
                    ← Föregående
                  </Link>
                )}
                {aktiv < sidor && (
                  <Link
                    href={lank({ page: aktiv + 1 })}
                    className="mag-btn mag-btn-ghost mag-btn-sm"
                  >
                    Nästa →
                  </Link>
                )}
              </span>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type TitelKarta = Map<string, { titel: string; publicId: string }>;

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
      r.id as string,
      { titel: r.titel as string, publicId: r.public_id as string },
    ]),
  );
}

function fmtTid(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("sv-SE", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
