// M16 — Inkommande (brief 22 F6).
// Inkorg över inkommande föreningsärenden: organisationsansökningar
// (katalog_status pending) + collab-förfrågningar (status='begard').
// Läs/aggregat-vy — ingen meddelandetråd (beslut 4 i brief 22).
// Inga nya tabeller; allt på organisation, collab, insamling.
// Säkerhet: kraver(['granskare','admin']) + RLS skyddar.
import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { antal } from "@/lib/format";

export const metadata = { title: "Inkommande — Maskinrum" };
export const dynamic = "force-dynamic";

const ORG_STATUS_LABEL: Record<string, string> = {
  inskickad: "Ny ansökan",
  under_granskning: "Under granskning",
  komplettering_begard: "Komplettering begärd",
};

type OrgRad = {
  id: string;
  namn: string;
  status: string;
  stad: string;
  region: string;
  organisationstyp: string;
  createdAt: string;
};

type CollabRad = {
  id: string;
  orgNamn: string;
  orgId: string;
  insamlingTitel: string;
  insamlingPublicId: string | null;
  collabTyp: string;
  begardAt: string;
};

export default async function InkommandePage() {
  await kraver(["granskare", "admin"]);
  const supabase = await createClient();

  const [{ data: orgRows }, { data: collabRows }] = await Promise.all([
    supabase
      .from("organisation")
      .select("id, namn, organisationstyp, stad, region, katalog_status, created_at")
      .in("katalog_status", [
        "inskickad",
        "under_granskning",
        "komplettering_begard",
      ])
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("collab")
      .select("id, organisation_id, insamling_id, collab_typ, begard_at")
      .eq("status", "begard")
      .order("begard_at", { ascending: false }),
  ]);

  const orgRader: OrgRad[] = (orgRows ?? []).map((r) => ({
    id: r.id as string,
    namn: r.namn as string,
    status: r.katalog_status as string,
    stad: r.stad as string,
    region: r.region as string,
    organisationstyp: r.organisationstyp as string,
    createdAt: r.created_at as string,
  }));

  const orgIdsForCollab = [
    ...new Set((collabRows ?? []).map((c) => c.organisation_id as string)),
  ];
  const insIdsForCollab = [
    ...new Set((collabRows ?? []).map((c) => c.insamling_id as string)),
  ];

  const [{ data: orgNamnRows }, { data: insRows }] = await Promise.all([
    orgIdsForCollab.length
      ? supabase
          .from("organisation")
          .select("id, namn")
          .in("id", orgIdsForCollab)
      : Promise.resolve({ data: [] as { id: string; namn: string }[] }),
    insIdsForCollab.length
      ? supabase
          .from("insamling")
          .select("id, titel, public_id")
          .in("id", insIdsForCollab)
      : Promise.resolve(
          { data: [] as { id: string; titel: string; public_id: string }[] },
        ),
  ]);

  const orgNamnKarta = new Map(
    (orgNamnRows ?? []).map((r) => [r.id as string, r.namn as string]),
  );
  const insKarta = new Map(
    (insRows ?? []).map((r) => [
      r.id as string,
      { titel: r.titel as string, publicId: r.public_id as string },
    ]),
  );

  const collabRader: CollabRad[] = (collabRows ?? []).map((c) => {
    const ins = insKarta.get(c.insamling_id as string);
    return {
      id: c.id as string,
      orgNamn:
        orgNamnKarta.get(c.organisation_id as string) ?? "(okänd förening)",
      orgId: c.organisation_id as string,
      insamlingTitel: ins?.titel ?? "(okänd insamling)",
      insamlingPublicId: ins?.publicId ?? null,
      collabTyp: c.collab_typ as string,
      begardAt: c.begard_at as string,
    };
  });

  const totalRader = orgRader.length + collabRader.length;

  return (
    <main>
      <header>
        <span className="mag-eyebrow">
          <span className="stroke" />
          Team
        </span>
        <h1 className="mag-h1 mt-2">Inkommande</h1>
        <p className="mag-lead mt-2" style={{ fontSize: 16 }}>
          Aggregerad inkorg över föreningsansökningar och collab-förfrågningar.
          {antal(orgRader.length)} ansökningar och{" "}
          {antal(collabRader.length)} collab-förfrågningar väntar på beslut.
          Klicka för att hantera i respektive sida.
        </p>
      </header>

      {totalRader === 0 ? (
        <div
          className="mag-card mt-8 text-center"
          style={{ padding: "48px 24px" }}
        >
          <h2 className="mag-h3">Tom inkorg</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
            Inga öppna föreningsansökningar eller collab-förfrågningar just nu.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {orgRader.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="mag-h2">Föreningsansökningar</h2>
                <span
                  className="f-mono uc"
                  style={{ fontSize: 10.5, color: "var(--color-ink-3)" }}
                >
                  {antal(orgRader.length)} st
                </span>
              </div>
              <table className="dash-table mt-4">
                <thead>
                  <tr>
                    <th>Förening</th>
                    <th>Typ</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Ålder</th>
                    <th style={{ textAlign: "right" }}>Hantera</th>
                  </tr>
                </thead>
                <tbody>
                  {orgRader.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.namn}</strong>
                      </td>
                      <td className="f-mono" style={{ fontSize: 12 }}>
                        {o.organisationstyp}
                      </td>
                      <td>
                        {o.stad}
                        <span className="ml-2" style={{ color: "var(--color-ink-3)", fontSize: 12 }}>
                          {o.region}
                        </span>
                      </td>
                      <td>
                        <span
                          className="mag-tag"
                          style={{
                            background:
                              o.status === "komplettering_begard"
                                ? "rgba(184,132,62,0.12)"
                                : "var(--color-forest-soft)",
                            color:
                              o.status === "komplettering_begard"
                                ? "var(--color-copper-deep)"
                                : "var(--color-forest)",
                          }}
                        >
                          {ORG_STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="f-mono" style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                        {alder(o.createdAt)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          href={`/granskning/organisationer/${o.id}`}
                          className="mag-btn mag-btn-secondary mag-btn-sm"
                        >
                          Öppna →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {collabRader.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="mag-h2">Collab-förfrågningar</h2>
                <span
                  className="f-mono uc"
                  style={{ fontSize: 10.5, color: "var(--color-ink-3)" }}
                >
                  {antal(collabRader.length)} st
                </span>
              </div>
              <table className="dash-table mt-4">
                <thead>
                  <tr>
                    <th>Förening</th>
                    <th>Insamling</th>
                    <th>Typ</th>
                    <th>Ålder</th>
                    <th style={{ textAlign: "right" }}>Visa</th>
                  </tr>
                </thead>
                <tbody>
                  {collabRader.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          href={`/granskning/organisationer/${c.orgId}`}
                          style={{ color: "var(--color-forest)" }}
                        >
                          {c.orgNamn}
                        </Link>
                      </td>
                      <td>
                        {c.insamlingPublicId ? (
                          <Link
                            href={`/insamlingar/${c.insamlingPublicId}`}
                            style={{ color: "var(--color-forest)" }}
                          >
                            {c.insamlingTitel}
                          </Link>
                        ) : (
                          c.insamlingTitel
                        )}
                      </td>
                      <td className="f-mono" style={{ fontSize: 12 }}>
                        {c.collabTyp}
                      </td>
                      <td className="f-mono" style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                        {alder(c.begardAt)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          href={`/granskning/organisationer/${c.orgId}`}
                          className="mag-btn mag-btn-ghost mag-btn-sm"
                        >
                          Öppna →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p
                className="mt-3 text-xs"
                style={{ color: "var(--color-ink-3)" }}
              >
                Collab-beslut tas av föreningen själv via konto/foreningar.
                Admin har här en översikt — inga beslutsknappar (se brief 22
                beslut 4: två-vägs meddelanden ligger utanför denna brief).
              </p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function alder(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h`;
  return `${Math.floor(diff / 86_400_000)} d`;
}
