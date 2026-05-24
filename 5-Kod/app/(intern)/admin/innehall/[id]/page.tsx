// Modul M19 — Innehåll & FAQ — redigera innehållssida.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/innehall/markdown";
import { uppdateraSidaAction, publiceraSidaAction, avpubliceraSidaAction } from "../actions";

export const runtime = "edge";

export default async function RedigeraSidaPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  const { id } = await params;
  const supabase = await createClient();
  const { data: sida } = await supabase
    .from("innehallssida")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sida) notFound();

  const { data: larda } = await supabase
    .from("lard_profil")
    .select("id, namn")
    .order("namn", { ascending: true });

  async function spara(formData: FormData) {
    "use server";
    const r = await uppdateraSidaAction(formData);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte spara");
  }

  async function publicera() {
    "use server";
    const fd = new FormData();
    fd.set("id", id);
    const r = await publiceraSidaAction(fd);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte publicera");
  }

  async function avpublicera() {
    "use server";
    const fd = new FormData();
    fd.set("id", id);
    fd.set("till_status", "utkast");
    const r = await avpubliceraSidaAction(fd);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte avpublicera");
  }

  async function settKommerSnart() {
    "use server";
    const fd = new FormData();
    fd.set("id", id);
    fd.set("till_status", "kommer_snart");
    const r = await avpubliceraSidaAction(fd);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte sätta kommer-snart");
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-12">
      <nav className="mb-6 flex gap-3 text-sm">
        <Link href="/admin/innehall" className="btn btn-ghost btn-sm">← Innehållssidor</Link>
        {sida.status === "publicerad" && (
          <Link href={`/${sida.slug}`} target="_blank" className="btn btn-secondary btn-sm">
            Visa publikt ↗
          </Link>
        )}
      </nav>

      <header className="mb-6">
        <p className="eyebrow mb-2">
          {sida.sidtyp === "juridisk" ? "Juridisk sida" : "Informativ sida"} · /{sida.slug}
        </p>
        <h1 className="heading-1">{sida.titel}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`pill ${sida.status === "publicerad" ? "pill-success" : sida.status === "kommer_snart" ? "pill-copper" : "pill-paper"}`}>
            {sida.status === "publicerad" ? "Publicerad" : sida.status === "kommer_snart" ? "Kommer snart" : "Utkast"}
          </span>
          <span className={`pill ${sida.verifieringsstatus === "verifierad" ? "pill-success" : sida.verifieringsstatus === "behover_lard" ? "pill-danger" : "pill-paper"}`}>
            {sida.verifieringsstatus === "verifierad" ? "Verifierad" : sida.verifieringsstatus === "behover_lard" ? "Behöver lärd" : "Ej religiöst"}
          </span>
          {sida.last && <span className="pill pill-paper">🔒 Låst</span>}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <form action={spara} className="card flex flex-col gap-5">
          <input type="hidden" name="id" value={sida.id} />

          <label className="flex flex-col gap-1">
            <span className="field-label field-label-required">Titel</span>
            <input name="titel" required defaultValue={sida.titel} className="input" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Brödtext (Markdown)</span>
            <textarea
              name="brodtext"
              rows={18}
              defaultValue={sida.brodtext ?? ""}
              className="textarea font-mono text-sm"
              placeholder="# Rubrik

Brödtext i Markdown. **Fet**, *kursiv*, [länk](https://...).

Du skriver innehållet själv. Code skriver inget."
            />
            <span className="field-help">
              Markdown. HTML/JavaScript blockeras automatiskt och kan inte sparas.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Verifieringsstatus</span>
            <select name="verifieringsstatus" className="select" defaultValue={sida.verifieringsstatus}>
              <option value="ej_tillampligt">Ej religiöst — kan publiceras direkt</option>
              <option value="behover_lard">Behöver lärd — blockerad från publicering</option>
              <option value="verifierad">Verifierad av lärd — kan publiceras</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Verifierad av (lärd-profil)</span>
            <select
              name="verifierad_av_lard_id"
              className="select"
              defaultValue={sida.verifierad_av_lard_id ?? ""}
            >
              <option value="">— Ingen —</option>
              {(larda ?? []).map((l) => (
                <option key={l.id} value={l.id}>{l.namn}</option>
              ))}
            </select>
            <span className="field-help">
              Krävs när verifieringsstatus = Verifierad. Verifierat-märket på publika sidan
              länkar hit.
            </span>
          </label>

          {sida.sidtyp === "juridisk" && (
            <label className="flex flex-col gap-1">
              <span className="field-label">Ikraftträdandedatum</span>
              <input
                type="date"
                name="ikrafttradande_datum"
                defaultValue={sida.ikrafttradande_datum ? new Date(sida.ikrafttradande_datum).toISOString().slice(0, 10) : ""}
                className="input"
              />
              <span className="field-help">När versionen börjar gälla (juridiska sidor — S8).</span>
            </label>
          )}

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={sida.last}>
              {sida.last ? "Låst — kan inte sparas" : "Spara"}
            </button>
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <section className="card card-tight">
            <h2 className="heading-3 mb-3">Status</h2>
            {sida.status !== "publicerad" && sida.sidtyp !== "juridisk" && (
              <form action={publicera} className="mb-3">
                <button
                  type="submit"
                  className="btn btn-copper btn-block"
                  disabled={sida.verifieringsstatus === "behover_lard"}
                  title={sida.verifieringsstatus === "behover_lard" ? "Behöver lärd-granskning först" : ""}
                >
                  Publicera
                </button>
              </form>
            )}
            {sida.status === "publicerad" && (
              <form action={avpublicera} className="mb-3">
                <button type="submit" className="btn btn-ghost btn-block">Avpublicera till utkast</button>
              </form>
            )}
            {sida.status !== "kommer_snart" && (
              <form action={settKommerSnart}>
                <button type="submit" className="btn btn-secondary btn-block">
                  Sätt &quot;Kommer snart&quot;
                </button>
              </form>
            )}
            {sida.sidtyp === "juridisk" && (
              <p className="mt-3 text-xs italic" style={{ color: "var(--color-ink-3)" }}>
                Juridiska sidor publiceras via versioneringsflödet (S8).
              </p>
            )}
          </section>

          <section className="card card-tight">
            <h2 className="heading-3 mb-3">Förhandsvisning</h2>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(sida.brodtext ?? "") }}
            />
          </section>

          <section className="card card-tight text-xs" style={{ color: "var(--color-ink-3)" }}>
            <p>Skapad: {new Date(sida.skapad_at).toLocaleString("sv-SE")}</p>
            <p>Senast ändrad: {new Date(sida.senast_andrad_at).toLocaleString("sv-SE")}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
