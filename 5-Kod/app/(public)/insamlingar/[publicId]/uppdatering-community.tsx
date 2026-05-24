// M13 — community-strimma per uppdatering.
// Renderas inline i transparens-tidslinjen. Kompaktare än sidan-bottom-vyn.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { aktuellAnvandare } from "@/lib/auth";
import { KommentarForm } from "./kommentar-form";
import { ReaktionKnappar } from "./reaktion-knappar";
import { KommentarRad } from "./kommentar-rad";
import type { KommentarVisa } from "./community-section";

export async function UppdateringCommunity({
  insamlingId,
  insamlingPublicId,
  uppdateringId,
  agareId,
  kommentarerAvstangda,
}: {
  insamlingId: string;
  insamlingPublicId: string;
  uppdateringId: string;
  agareId: string;
  kommentarerAvstangda: boolean;
}) {
  const me = await aktuellAnvandare();
  const supabase = await createClient();

  const [{ data: rakK }, { data: reaktioner }] = await Promise.all([
    supabase
      .from("kommentar")
      .select(
        "id, text, dold, dold_skal, created_at, author_id, parent_id, profiles:author_id(visningsnamn, public_id)",
      )
      .eq("uppdatering_id", uppdateringId)
      .eq("objekt_typ", "uppdatering")
      .is("raderad_at", null)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("reaktion")
      .select("typ, user_id")
      .eq("uppdatering_id", uppdateringId)
      .eq("objekt_typ", "uppdatering"),
  ]);

  type Row = NonNullable<typeof rakK>[number];
  const rader: KommentarVisa[] = (rakK ?? []).map((k: Row) => {
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

  const reaktionsRader = (reaktioner ?? []) as Array<{ typ: "dua" | "stod"; user_id: string }>;
  const duaTotal = reaktionsRader.filter((r) => r.typ === "dua").length;
  const stodTotal = reaktionsRader.filter((r) => r.typ === "stod").length;
  const minDua = me ? reaktionsRader.some((r) => r.typ === "dua" && r.user_id === me.userId) : false;
  const minStod = me ? reaktionsRader.some((r) => r.typ === "stod" && r.user_id === me.userId) : false;

  return (
    <div
      className="mt-3 rounded-md p-3"
      style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}
    >
      <ReaktionKnappar
        insamlingId={insamlingId}
        insamlingPublicId={insamlingPublicId}
        uppdateringId={uppdateringId}
        inloggad={!!me}
        duaTotal={duaTotal}
        stodTotal={stodTotal}
        minDua={minDua}
        minStod={minStod}
        kompakt
      />
      {kommentarerAvstangda ? (
        <p
          className="mt-2 text-xs"
          style={{ color: "var(--color-ink-3)", fontStyle: "italic" }}
        >
          Kommentarer avstängda.
        </p>
      ) : me ? (
        <KommentarForm
          insamlingId={insamlingId}
          insamlingPublicId={insamlingPublicId}
          uppdateringId={uppdateringId}
          parentId={null}
          kompakt
        />
      ) : (
        <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
          <Link
            href={`/login?retur=${encodeURIComponent(`/insamlingar/${insamlingPublicId}`)}`}
            style={{ color: "var(--color-forest)", textDecoration: "underline" }}
          >
            Logga in
          </Link>{" "}
          för att kommentera eller säga dua.
        </p>
      )}
      {top.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
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
      )}
    </div>
  );
}
