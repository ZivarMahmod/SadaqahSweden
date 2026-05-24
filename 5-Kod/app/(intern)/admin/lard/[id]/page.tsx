// Modul M19 — redigera lärd-profil.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/innehall/markdown";
import { uppdateraLardAction, raderaLardAction } from "../actions";

export const runtime = "edge";

export default async function RedigeraLardPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  const { id } = await params;
  const supabase = await createClient();
  const { data: lard } = await supabase
    .from("lard_profil")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!lard) notFound();

  async function spara(formData: FormData) {
    "use server";
    const r = await uppdateraLardAction(formData);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte spara");
  }

  async function radera() {
    "use server";
    const fd = new FormData();
    fd.set("id", id);
    const r = await raderaLardAction(fd);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte radera");
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-12">
      <nav className="mb-6 flex gap-3 text-sm">
        <Link href="/admin/lard" className="btn btn-ghost btn-sm">← Lärd-profiler</Link>
        <Link href={`/lard/${lard.id}`} target="_blank" className="btn btn-secondary btn-sm">
          Visa publikt ↗
        </Link>
      </nav>

      <header className="mb-6">
        <p className="eyebrow mb-2">Lärd-profil</p>
        <h1 className="heading-1">{lard.namn}</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <form action={spara} className="card flex flex-col gap-5">
          <input type="hidden" name="id" value={lard.id} />

          <label className="flex flex-col gap-1">
            <span className="field-label field-label-required">Namn</span>
            <input name="namn" required defaultValue={lard.namn} className="input" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Presentation (Markdown)</span>
            <textarea
              name="presentation"
              rows={12}
              defaultValue={lard.presentation ?? ""}
              className="textarea font-mono text-sm"
            />
          </label>

          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="visa_kontakt" defaultChecked={lard.visa_kontakt} />
            <span className="field-label">Visa kontaktuppgifter publikt</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Kontakt e-post</span>
            <input type="email" name="kontakt_epost" defaultValue={lard.kontakt_epost ?? ""} className="input" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Kontakt telefon</span>
            <input type="tel" name="kontakt_telefon" defaultValue={lard.kontakt_telefon ?? ""} className="input" />
          </label>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">Spara</button>
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <section className="card card-tight">
            <h2 className="heading-3 mb-3">Förhandsvisning</h2>
            <div className="prose prose-sm max-w-none text-sm"
                 dangerouslySetInnerHTML={{ __html: renderMarkdown(lard.presentation ?? "") }} />
          </section>

          <form action={radera}>
            <button type="submit" className="btn btn-danger btn-block btn-sm">
              Radera profil
            </button>
            <p className="mt-2 text-xs italic" style={{ color: "var(--color-ink-3)" }}>
              Verifierade innehållsobjekt får sin koppling nollställd (ON DELETE SET NULL).
            </p>
          </form>
        </aside>
      </div>
    </main>
  );
}
