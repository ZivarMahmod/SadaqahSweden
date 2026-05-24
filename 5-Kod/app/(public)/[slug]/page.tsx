// Modul M19 — publik innehållssida (dynamic catch-all).
// Statiska routes går först (Next.js App Router). Vi kollar ändå mot en
// reserved-lista för säkerhets skull.
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/innehall/markdown";
import { VerifieratMarke } from "@/components/verifierat-marke";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Reserverade slugs som har en egen statisk route — får aldrig kapas av
// innehållssidor. Återställs till notFound() om någon mot förmodan
// matchade den dynamiska handlern.
const RESERVERADE_SLUGS = new Set([
  "insamlingar","foreningar","karta","faq","login","registrera",
  "profil","kategori","statistik","events","event","donera","lard",
  "admin","granskning","team","konto","stripe","insamling","auth",
  "logga-ut","verifiera-epost","konto-fryst","api","_next",
]);

export default async function PublikInnehallssida({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVERADE_SLUGS.has(slug)) notFound();

  const supabase = await createClient();
  const { data: sida } = await supabase
    .from("innehallssida")
    .select("slug, titel, brodtext, sidtyp, status, verifieringsstatus, verifierad_av_lard_id, verifierad_datum, ikrafttradande_datum")
    .eq("slug", slug)
    .maybeSingle();
  if (!sida) notFound();

  // RLS filtrerar bort utkast. Här ser vi bara publicerad + kommer_snart.
  if (sida.status === "kommer_snart") {
    return <KommerSnartSida titel={sida.titel} />;
  }

  let lard: { id: string; namn: string } | null = null;
  if (sida.verifieringsstatus === "verifierad" && sida.verifierad_av_lard_id) {
    const { data: l } = await supabase
      .from("lard_profil")
      .select("id, namn")
      .eq("id", sida.verifierad_av_lard_id)
      .maybeSingle();
    if (l) lard = l;
  }

  return (
    <main className="mx-auto max-w-[760px] px-6 py-16">
      {sida.sidtyp === "juridisk" && (
        <p className="eyebrow mb-2">Juridisk sida</p>
      )}
      <h1 className="heading-1">{sida.titel}</h1>

      {lard && (
        <div className="mt-4">
          <VerifieratMarke
            lardId={lard.id}
            lardNamn={lard.namn}
            datum={sida.verifierad_datum}
          />
        </div>
      )}

      {sida.sidtyp === "juridisk" && sida.ikrafttradande_datum && (
        <p className="mt-4 text-xs" style={{ color: "var(--color-ink-3)" }}>
          Gäller från {new Date(sida.ikrafttradande_datum).toLocaleDateString("sv-SE")}
        </p>
      )}

      <div
        className="prose mt-10"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(sida.brodtext ?? "") }}
      />
    </main>
  );
}

function KommerSnartSida({ titel }: { titel: string }) {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-24 text-center">
      <p className="eyebrow mb-3">Kommer snart</p>
      <h1 className="heading-1">{titel}</h1>
      <p className="lead mt-6">
        Den här sidan är på väg. Vi fyller den med innehåll inom kort.
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">Till startsidan</Link>
        <Link href="/insamlingar" className="btn btn-secondary">Se insamlingar</Link>
      </div>
    </main>
  );
}
