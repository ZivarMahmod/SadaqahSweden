// Modul M19 — redigera FAQ-post.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/innehall/markdown";
import { uppdateraFaqAction, publiceraFaqAction, avpubliceraFaqAction } from "../actions";

export const runtime = "edge";

export default async function RedigeraFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("faq_post")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  async function spara(formData: FormData) {
    "use server";
    const r = await uppdateraFaqAction(formData);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte spara");
  }

  async function publicera() {
    "use server";
    const fd = new FormData();
    fd.set("id", id);
    const r = await publiceraFaqAction(fd);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte publicera");
  }

  async function avpublicera() {
    "use server";
    const fd = new FormData();
    fd.set("id", id);
    const r = await avpubliceraFaqAction(fd);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte avpublicera");
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-12">
      <nav className="mb-6 flex gap-3 text-sm">
        <Link href="/admin/faq" className="btn btn-ghost btn-sm">← FAQ-poster</Link>
      </nav>

      <header className="mb-6">
        <p className="eyebrow mb-2">Kategori: {post.kategori}</p>
        <h1 className="heading-2">{post.fraga}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`pill ${post.status === "publicerad" ? "pill-success" : "pill-paper"}`}>
            {post.status === "publicerad" ? "Publicerad" : "Utkast"}
          </span>
          <span className={`pill ${post.verifieringsstatus === "verifierad" ? "pill-success" : post.verifieringsstatus === "behover_lard" ? "pill-danger" : "pill-paper"}`}>
            {post.verifieringsstatus === "verifierad" ? "Verifierad" : post.verifieringsstatus === "behover_lard" ? "Behöver lärd" : "Ej religiöst"}
          </span>
          {post.last && <span className="pill pill-paper">🔒 Låst</span>}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <form action={spara} className="card flex flex-col gap-5">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="verifierad_av_lard_id" defaultValue={post.verifierad_av_lard_id ?? ""} />

          <label className="flex flex-col gap-1">
            <span className="field-label field-label-required">Fråga</span>
            <input name="fraga" required defaultValue={post.fraga} maxLength={500} className="input" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Svar (Markdown)</span>
            <textarea
              name="svar"
              rows={10}
              defaultValue={post.svar ?? ""}
              className="textarea font-mono text-sm"
              placeholder="Svaret. Lämna tomt om svaret inte är klart — utkast publiceras aldrig."
            />
            <span className="field-help">Markdown. HTML/JS blockeras. Tomt svar = utkast.</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="field-label field-label-required">Kategori</span>
              <input name="kategori" required defaultValue={post.kategori} className="input" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="field-label">Ordning</span>
              <input type="number" name="ordning" defaultValue={post.ordning} className="input" />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="field-label">Verifieringsstatus</span>
            <select name="verifieringsstatus" className="select" defaultValue={post.verifieringsstatus}>
              <option value="ej_tillampligt">Ej religiöst</option>
              <option value="behover_lard">Behöver lärd</option>
              <option value="verifierad">Verifierad</option>
            </select>
          </label>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={post.last}>
              {post.last ? "Låst" : "Spara"}
            </button>
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <section className="card card-tight">
            <h2 className="heading-3 mb-3">Status</h2>
            {post.status !== "publicerad" && (
              <form action={publicera} className="mb-3">
                <button
                  type="submit"
                  className="btn btn-copper btn-block"
                  disabled={post.verifieringsstatus === "behover_lard"}
                >
                  Publicera
                </button>
              </form>
            )}
            {post.status === "publicerad" && (
              <form action={avpublicera}>
                <button type="submit" className="btn btn-ghost btn-block">Avpublicera</button>
              </form>
            )}
          </section>

          <section className="card card-tight">
            <h2 className="heading-3 mb-3">Förhandsvisning</h2>
            <p className="text-sm font-medium mb-2">{post.fraga}</p>
            <div
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.svar ?? "") }}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}
