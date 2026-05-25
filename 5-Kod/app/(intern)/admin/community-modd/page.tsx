// M16 — Community-modd (brief 22 F5).
// Modereringskö för rapporterade kommentarer. Listar rapport (status=pending),
// joinat till kommentaren med författare, insamling, rapporter_antal.
// Åtgärder per rad: Dölj / Återställ / Avfärda / Eskalera.
//
// Inga nya tabeller. Använder befintliga granskareDoljAction /
// granskareAterstallAction från (public)-community-stacken samt en tunn
// rapport.status-uppdatering i sidans egen actions.ts.
// Säkerhet: kraver(['granskare','admin']); RLS på rapport/kommentar/profiles.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { antal } from "@/lib/format";
import {
  behandlaRapportAterstallAction,
  behandlaRapportAvfardAction,
  behandlaRapportDoljAction,
  behandlaRapportEskaleraAction,
} from "./actions";

export const metadata = { title: "Community-modd — Maskinrum" };
export const dynamic = "force-dynamic";

type RapportRad = {
  rapportId: string;
  skal: string;
  reporterId: string | null;
  rapportSkapad: string;
  kommentarId: string;
  kommentarText: string;
  kommentarDold: boolean;
  rapporterAntal: number;
  forfattareId: string;
  forfattareNamn: string;
  insamlingId: string;
  insamlingTitel: string;
  insamlingPublicId: string;
};

export default async function CommunityModdPage() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const { data: rapporter } = await supabase
    .from("rapport")
    .select("id, kommentar_id, skal, reporter_id, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200);

  const kommentarIds = [
    ...new Set((rapporter ?? []).map((r) => r.kommentar_id as string)),
  ];
  const { data: kommentarer } = kommentarIds.length
    ? await supabase
        .from("kommentar")
        .select("id, text, dold, rapporter_antal, author_id, insamling_id")
        .in("id", kommentarIds)
    : { data: [] as KommentarRad[] };

  type KommentarRad = {
    id: string;
    text: string;
    dold: boolean;
    rapporter_antal: number;
    author_id: string;
    insamling_id: string;
  };

  const kommKarta = new Map(
    (kommentarer ?? []).map((k) => [k.id as string, k as KommentarRad]),
  );

  const insIds = [
    ...new Set((kommentarer ?? []).map((k) => k.insamling_id as string)),
  ];
  const profilIds = [
    ...new Set((kommentarer ?? []).map((k) => k.author_id as string)),
  ];

  const [insKarta, profilKarta] = await Promise.all([
    hamtaTitlar(supabase, insIds),
    hamtaNamn(supabase, profilIds),
  ]);

  const rader: RapportRad[] = (rapporter ?? [])
    .map((r) => {
      const k = kommKarta.get(r.kommentar_id as string);
      if (!k) return null;
      const ins = insKarta.get(k.insamling_id);
      return {
        rapportId: r.id as string,
        skal: r.skal as string,
        reporterId: (r.reporter_id as string | null) ?? null,
        rapportSkapad: r.created_at as string,
        kommentarId: k.id,
        kommentarText: k.text,
        kommentarDold: k.dold,
        rapporterAntal: k.rapporter_antal ?? 0,
        forfattareId: k.author_id,
        forfattareNamn: profilKarta.get(k.author_id) ?? "(profil saknas)",
        insamlingId: k.insamling_id,
        insamlingTitel: ins?.titel ?? "(okänd insamling)",
        insamlingPublicId: ins?.publicId ?? "",
      } satisfies RapportRad;
    })
    .filter((r): r is RapportRad => r !== null);

  return (
    <main>
      <header>
        <span className="mag-eyebrow">
          <span className="stroke" />
          Team
        </span>
        <h1 className="mag-h1 mt-2">Community-modd</h1>
        <p className="mag-lead mt-2" style={{ fontSize: 16 }}>
          {antal(rader.length)} rapport{rader.length === 1 ? "" : "er"} väntar
          på beslut. Dölja kommentar = användare kan inte se den men författare,
          insamlingens ägare och team ser den. Återställ = bedöms OK och syns
          igen.
        </p>
      </header>

      {rader.length === 0 ? (
        <div
          className="mag-card mt-8 text-center"
          style={{ padding: "48px 24px" }}
        >
          <h2 className="mag-h3">Inget att moderera</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
            Inga öppna rapporter just nu. Behandlade rapporter syns inte här —
            de loggas i admin/logg.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {rader.map((r) => (
            <li key={r.rapportId} className="mag-card">
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="mag-tag mag-tag-danger">
                  {antal(r.rapporterAntal)} rapport
                  {r.rapporterAntal === 1 ? "" : "er"}
                </span>
                {r.kommentarDold && (
                  <span className="mag-tag mag-tag-outline">Redan dold</span>
                )}
                <span
                  className="f-mono"
                  style={{ fontSize: 11, color: "var(--color-ink-3)" }}
                >
                  {new Date(r.rapportSkapad).toLocaleString("sv-SE", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </header>

              <blockquote
                className="mt-4 mag-pull"
                style={{ fontSize: 18, fontStyle: "normal", margin: 0 }}
              >
                {r.kommentarText}
              </blockquote>

              <dl className="mt-4 grid gap-2 text-sm" style={{ gridTemplateColumns: "auto 1fr" }}>
                <dt style={{ color: "var(--color-ink-3)" }}>Författare:</dt>
                <dd>
                  <Link
                    href={`/profil/${r.forfattareId}`}
                    style={{ color: "var(--color-forest)" }}
                  >
                    {r.forfattareNamn}
                  </Link>
                </dd>
                <dt style={{ color: "var(--color-ink-3)" }}>Insamling:</dt>
                <dd>
                  {r.insamlingPublicId ? (
                    <Link
                      href={`/insamlingar/${r.insamlingPublicId}`}
                      style={{ color: "var(--color-forest)" }}
                    >
                      {r.insamlingTitel}
                    </Link>
                  ) : (
                    r.insamlingTitel
                  )}
                </dd>
                <dt style={{ color: "var(--color-ink-3)" }}>Skäl:</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>{r.skal}</dd>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <form
                  action={behandlaRapportDoljAction.bind(
                    null,
                    r.rapportId,
                    r.kommentarId,
                    r.insamlingPublicId,
                    r.skal,
                  )}
                >
                  <button
                    type="submit"
                    className="mag-btn mag-btn-accent mag-btn-sm"
                    disabled={r.kommentarDold}
                  >
                    Dölj kommentar
                  </button>
                </form>
                {r.kommentarDold && (
                  <form
                    action={behandlaRapportAterstallAction.bind(
                      null,
                      r.rapportId,
                      r.kommentarId,
                      r.insamlingPublicId,
                    )}
                  >
                    <button
                      type="submit"
                      className="mag-btn mag-btn-secondary mag-btn-sm"
                    >
                      Återställ
                    </button>
                  </form>
                )}
                <form
                  action={behandlaRapportAvfardAction.bind(null, r.rapportId)}
                >
                  <button
                    type="submit"
                    className="mag-btn mag-btn-ghost mag-btn-sm"
                  >
                    Avfärda rapport
                  </button>
                </form>
                <form
                  action={behandlaRapportEskaleraAction.bind(null, r.rapportId)}
                >
                  <button
                    type="submit"
                    className="mag-btn mag-btn-ghost mag-btn-sm"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Eskalera
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function hamtaTitlar(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, { titel: string; publicId: string }>> {
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

async function hamtaNamn(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, visningsnamn")
    .in("id", ids);
  return new Map(
    (data ?? []).map((r) => [r.id as string, r.visningsnamn as string]),
  );
}
