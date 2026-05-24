// M13 Community-sektion på insamlingssidan.
// Server-komponent — hämtar kommentarer + reaktioner, renderar formulär +
// lista. Interaktivitet (toggla reaktion, posta, rapportera) ligger i
// klient-barnen.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import { KommentarForm } from "./kommentar-form";
import { ReaktionKnappar } from "./reaktion-knappar";
import { KommentarRad } from "./kommentar-rad";

export type KommentarVisa = {
  id: string;
  text: string;
  dold: boolean;
  dold_skal: string | null;
  created_at: string;
  author_id: string;
  author_namn: string;
  author_public_id: string | null;
  parent_id: string | null;
  ar_egen: boolean;
};

export async function CommunitySektion({
  insamlingId,
  insamlingPublicId,
  agareId,
  kommentarerAvstangda,
}: {
  insamlingId: string;
  insamlingPublicId: string;
  agareId: string;
  kommentarerAvstangda: boolean;
}) {
  const me = await aktuellAnvandare();
  const supabase = await createClient();

  // Hämta kommentarer + author-namn. RLS filtrerar bort dolda för
  // utomstående redan — vi får tillbaka det vi får läsa.
  const { data: kommentarer } = await supabase
    .from("kommentar")
    .select(
      "id, text, dold, dold_skal, created_at, author_id, parent_id, profiles:author_id(visningsnamn, public_id)",
    )
    .eq("insamling_id", insamlingId)
    .eq("objekt_typ", "insamling")
    .is("raderad_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  type Row = NonNullable<typeof kommentarer>[number];
  const rader: KommentarVisa[] = (kommentarer ?? []).map((k: Row) => {
    const profil = Array.isArray(k.profiles) ? k.profiles[0] : k.profiles;
    return {
      id: k.id,
      text: k.text,
      dold: k.dold,
      dold_skal: k.dold_skal,
      created_at: k.created_at,
      author_id: k.author_id,
      author_namn: profil?.visningsnamn ?? "Användare",
      author_public_id: profil?.public_id ?? null,
      parent_id: k.parent_id,
      ar_egen: me?.userId === k.author_id,
    };
  });

  const top = rader.filter((r) => !r.parent_id);
  const svarMap = new Map<string, KommentarVisa[]>();
  for (const r of rader) {
    if (r.parent_id) {
      const list = svarMap.get(r.parent_id) ?? [];
      list.push(r);
      svarMap.set(r.parent_id, list);
    }
  }

  // Reaktioner — räkna upp typerna; markera om jag reagerat.
  const { data: reaktioner } = await supabase
    .from("reaktion")
    .select("typ, user_id")
    .eq("insamling_id", insamlingId)
    .eq("objekt_typ", "insamling");

  const reaktionsRader = (reaktioner ?? []) as Array<{ typ: "dua" | "stod"; user_id: string }>;
  const duaTotal = reaktionsRader.filter((r) => r.typ === "dua").length;
  const stodTotal = reaktionsRader.filter((r) => r.typ === "stod").length;
  const minDua = me ? reaktionsRader.some((r) => r.typ === "dua" && r.user_id === me.userId) : false;
  const minStod = me ? reaktionsRader.some((r) => r.typ === "stod" && r.user_id === me.userId) : false;

  return (
    <section aria-label="Samtal" className="mt-12">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="heading-2">Samtal</h2>
        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
          {top.length} kommentar{top.length === 1 ? "" : "er"}
        </span>
      </div>

      <ReaktionKnappar
        insamlingId={insamlingId}
        insamlingPublicId={insamlingPublicId}
        inloggad={!!me}
        duaTotal={duaTotal}
        stodTotal={stodTotal}
        minDua={minDua}
        minStod={minStod}
      />

      {kommentarerAvstangda ? (
        <div
          className="mt-6 rounded-md p-4 text-sm"
          style={{
            background: "var(--color-paper-deep)",
            color: "var(--color-ink-2)",
          }}
        >
          Insamlaren har stängt av kommentarsfältet på denna insamling.
        </div>
      ) : me ? (
        <KommentarForm
          insamlingId={insamlingId}
          insamlingPublicId={insamlingPublicId}
          uppdateringId={null}
          parentId={null}
        />
      ) : (
        <div
          className="mt-6 rounded-md p-4 text-sm flex flex-wrap items-center justify-between gap-3"
          style={{
            background: "var(--color-paper-soft)",
            border: "1px dashed var(--color-ink-line)",
          }}
        >
          <span style={{ color: "var(--color-ink-2)" }}>
            Logga in för att kommentera, säga dua eller stötta.
          </span>
          <Link
            href={`/login?retur=${encodeURIComponent(`/insamlingar/${insamlingPublicId}`)}`}
            className="btn btn-secondary btn-sm"
          >
            Logga in
          </Link>
        </div>
      )}

      <ul className="mt-8 flex flex-col gap-5">
        {top.length === 0 && (
          <li
            className="rounded-md p-4 text-sm italic"
            style={{ background: "var(--color-paper-soft)", color: "var(--color-ink-3)" }}
          >
            Inga kommentarer ännu — bli först att säga ett ord.
          </li>
        )}
        {top.map((k) => (
          <li key={k.id}>
            <KommentarRad
              kommentar={k}
              insamlingPublicId={insamlingPublicId}
              insamlingId={insamlingId}
              meUserId={me?.userId ?? null}
              agareId={agareId}
              kanSvara={!!me && !kommentarerAvstangda}
              svar={svarMap.get(k.id) ?? []}
              arGranskare={me?.roll === "granskare" || me?.roll === "admin"}
            />
          </li>
        ))}
      </ul>

      <p
        className="mt-6 text-xs"
        style={{ color: "var(--color-ink-3)" }}
      >
        Max 500 tecken, ren text, inga länkar. En kommentar i taget — vi
        bygger tillit, inte volym. Tre rapporter döljer en kommentar
        automatiskt tills en granskare hinner titta.
      </p>
    </section>
  );
}
