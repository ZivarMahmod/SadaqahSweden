// M16 — Donatörer (brief 22 F3).
// Aggregat över bekräftade donationer per donator. Anonyma donationer
// (anonym=true eller donator_id=NULL) slås ihop till en rad — annars läcker
// admin att samma användare gjort flera anonyma donationer.
// Säkerhet: kraver(['granskare','admin']). RLS på donation/profiles ger
// extra skydd om route nås direkt.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kortBelopp, antal } from "@/lib/format";

export const metadata = { title: "Donatörer — Maskinrum" };
export const dynamic = "force-dynamic";

const PER_SIDA = 50;

type Sortering = "senaste" | "total" | "antal" | "namn";

type Rad = {
  id: string | null; // null = anonym-bucket
  namn: string;
  antal: number;
  total: number;
  senaste: string;
};

export default async function DonatorerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}) {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sort = (sp.sort ?? "senaste") as Sortering;
  const sida = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { data: dons } = await supabase
    .from("donation")
    .select("donator_id, anonym, belopp_ore, created_at")
    .eq("bekraftad", true)
    .order("created_at", { ascending: false });

  const namngivnaIds = [
    ...new Set(
      (dons ?? [])
        .filter((d) => !d.anonym && d.donator_id)
        .map((d) => d.donator_id as string),
    ),
  ];
  const namnKarta = await hamtaVisningsnamn(supabase, namngivnaIds);

  const agg = new Map<string, Rad>();
  let anonAntal = 0;
  let anonTotal = 0;
  let anonSenaste = "";

  for (const d of dons ?? []) {
    const belopp = d.belopp_ore ?? 0;
    if (d.anonym || !d.donator_id) {
      anonAntal++;
      anonTotal += belopp;
      if (!anonSenaste || d.created_at > anonSenaste) anonSenaste = d.created_at;
      continue;
    }
    const key = d.donator_id as string;
    const tidigare = agg.get(key);
    if (tidigare) {
      tidigare.antal++;
      tidigare.total += belopp;
      if (d.created_at > tidigare.senaste) tidigare.senaste = d.created_at;
    } else {
      agg.set(key, {
        id: key,
        namn: namnKarta.get(key) ?? "(profil saknas)",
        antal: 1,
        total: belopp,
        senaste: d.created_at,
      });
    }
  }

  const rader: Rad[] = [...agg.values()];
  if (anonAntal > 0) {
    rader.push({
      id: null,
      namn: "Anonym",
      antal: anonAntal,
      total: anonTotal,
      senaste: anonSenaste,
    });
  }

  const filtrerade = q
    ? rader.filter((r) => r.namn.toLowerCase().includes(q.toLowerCase()))
    : rader;

  filtrerade.sort((a, b) => {
    switch (sort) {
      case "total":
        return b.total - a.total;
      case "antal":
        return b.antal - a.antal;
      case "namn":
        return a.namn.localeCompare(b.namn, "sv");
      case "senaste":
      default:
        return b.senaste.localeCompare(a.senaste);
    }
  });

  const totalAntal = filtrerade.length;
  const sidor = Math.max(1, Math.ceil(totalAntal / PER_SIDA));
  const aktiv = Math.min(sida, sidor);
  const visade = filtrerade.slice((aktiv - 1) * PER_SIDA, aktiv * PER_SIDA);

  const summaTotal = filtrerade.reduce((s, r) => s + r.total, 0);
  const summaAntalDon = filtrerade.reduce((s, r) => s + r.antal, 0);

  function lank(extra: { page?: number; sort?: Sortering }): string {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (extra.sort ?? sort !== "senaste") usp.set("sort", extra.sort ?? sort);
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
        <h1 className="mag-h1 mt-2">Donatörer</h1>
        <p className="mag-lead mt-2" style={{ fontSize: 16 }}>
          {antal(totalAntal)} unika · {antal(summaAntalDon)} bekräftade donationer ·{" "}
          {kortBelopp(summaTotal)} totalt. Anonyma donationer aggregeras till
          en rad så att admin inte spårar enskilda anonyma användare.
        </p>
      </header>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-center gap-3"
        role="search"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Sök på namn …"
          className="input"
          style={{ maxWidth: 320 }}
          aria-label="Sök donator"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="select"
          style={{ maxWidth: 200 }}
          aria-label="Sortering"
        >
          <option value="senaste">Senaste donation</option>
          <option value="total">Totalt belopp</option>
          <option value="antal">Antal donationer</option>
          <option value="namn">Namn (A–Ö)</option>
        </select>
        <button type="submit" className="mag-btn mag-btn-primary mag-btn-sm">
          Filtrera
        </button>
        {(q || sort !== "senaste") && (
          <Link href="/admin/donatorer" className="mag-btn mag-btn-ghost mag-btn-sm">
            Nollställ
          </Link>
        )}
      </form>

      {visade.length === 0 ? (
        <div className="mag-card mt-8 text-center" style={{ padding: "48px 24px" }}>
          <h2 className="mag-h3">Inga donatorer matchar</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
            {q
              ? "Sökningen gav inga träffar. Justera filtret eller nollställ."
              : "Inga bekräftade donationer i databasen än."}
          </p>
        </div>
      ) : (
        <>
          <table className="dash-table mt-6">
            <thead>
              <tr>
                <th>Donator</th>
                <th style={{ textAlign: "right" }}>Antal</th>
                <th style={{ textAlign: "right" }}>Totalt</th>
                <th>Senaste</th>
              </tr>
            </thead>
            <tbody>
              {visade.map((r) => (
                <tr key={r.id ?? "__anonym__"}>
                  <td>
                    {r.id ? (
                      <Link
                        href={`/profil/${r.id}`}
                        style={{ color: "var(--color-forest)" }}
                      >
                        {r.namn}
                      </Link>
                    ) : (
                      <span className="f-mono uc" style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
                        {r.namn}
                      </span>
                    )}
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {antal(r.antal)}
                  </td>
                  <td className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                    {kortBelopp(r.total)}
                  </td>
                  <td className="f-mono" style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                    {fmtDatum(r.senaste)}
                  </td>
                </tr>
              ))}
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

function fmtDatum(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
