// Modul M19 — publik FAQ-yta.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/innehall/markdown";
import { FaqKlient } from "./faq-klient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const supabase = await createClient();
  // RLS filtrerar bort utkast — vi får bara publicerad.
  const { data: poster } = await supabase
    .from("faq_post")
    .select("id, fraga, svar, kategori, ordning, verifierad_av_lard_id, verifierad_datum")
    .order("kategori", { ascending: true })
    .order("ordning", { ascending: true });

  // Slå upp lärda för verifierade.
  const lardIds = Array.from(new Set((poster ?? []).map((p) => p.verifierad_av_lard_id).filter((x): x is string => Boolean(x))));
  let lardMap = new Map<string, { id: string; namn: string }>();
  if (lardIds.length > 0) {
    const { data: larda } = await supabase
      .from("lard_profil")
      .select("id, namn")
      .in("id", lardIds);
    lardMap = new Map((larda ?? []).map((l) => [l.id, l]));
  }

  const renderade = (poster ?? []).map((p) => {
    const lard = p.verifierad_av_lard_id ? lardMap.get(p.verifierad_av_lard_id) : null;
    return {
      id: p.id,
      fraga: p.fraga,
      svar_html: renderMarkdown(p.svar ?? ""),
      kategori: p.kategori,
      verifierad: lard ? { id: lard.id, namn: lard.namn, datum: p.verifierad_datum } : null,
    };
  });

  return (
    <main className="mx-auto max-w-[860px] px-6 py-16">
      <header className="mb-12 text-center">
        <p className="eyebrow mb-2">Vanliga frågor</p>
        <h1 className="heading-1">FAQ</h1>
        <p className="lead mt-4">
          Frågor och svar som rör hela plattformen. Hittar du inte ditt svar — kontakta teamet
          eller läs <Link href="/hur-det-fungerar">Hur det fungerar</Link>.
        </p>
      </header>

      {renderade.length === 0 ? (
        <p className="lead text-center" style={{ color: "var(--color-ink-3)" }}>
          FAQ:n fylls i takt med att vanliga frågor identifieras. Inga publicerade poster än.
        </p>
      ) : (
        <FaqKlient poster={renderade} />
      )}
    </main>
  );
}
