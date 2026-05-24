// Modul M19 — publik lärd-profil.
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/innehall/markdown";

export const runtime = "edge";

export default async function PublikLardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lard } = await supabase
    .from("lard_profil")
    .select("id, namn, presentation, visa_kontakt, kontakt_epost, kontakt_telefon")
    .eq("id", id)
    .maybeSingle();
  if (!lard) notFound();

  return (
    <main className="mx-auto max-w-[760px] px-6 py-16">
      <p className="eyebrow mb-2">Verifierande lärd</p>
      <h1 className="heading-1">{lard.namn}</h1>

      {lard.presentation ? (
        <div
          className="prose mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(lard.presentation) }}
        />
      ) : (
        <p className="lead mt-8 italic" style={{ color: "var(--color-ink-3)" }}>
          Profilen är på väg — presentation fylls i av profilägaren.
        </p>
      )}

      {lard.visa_kontakt && (lard.kontakt_epost || lard.kontakt_telefon) && (
        <section className="card mt-10">
          <h2 className="heading-3 mb-3">Kontakt</h2>
          {lard.kontakt_epost && (
            <p><a href={`mailto:${lard.kontakt_epost}`}>{lard.kontakt_epost}</a></p>
          )}
          {lard.kontakt_telefon && (
            <p className="mt-1">{lard.kontakt_telefon}</p>
          )}
        </section>
      )}

      <nav className="mt-10 text-sm">
        <Link href="/" className="btn btn-ghost btn-sm">← Till startsidan</Link>
      </nav>
    </main>
  );
}
