// Modul M19 — ny lärd-profil.
import Link from "next/link";
import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { skapaLardAction } from "../actions";

export const runtime = "edge";

export default async function NyLardPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  async function action(formData: FormData) {
    "use server";
    const r = await skapaLardAction(formData);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte skapa lärd-profil");
  }

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/admin/lard" className="btn btn-ghost btn-sm">← Lärd-profiler</Link>
      </nav>
      <h1 className="heading-1">Ny lärd-profil</h1>
      <p className="lead mt-2">
        Skapa profilen. Texten är profilägarens — Code skriver inget.
      </p>

      <form action={action} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="field-label field-label-required">Namn</span>
          <input name="namn" required maxLength={200} className="input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Presentation (Markdown)</span>
          <textarea name="presentation" rows={8} className="textarea font-mono text-sm" placeholder="Lämnas tom — fylls av lärd själv eller superadmin." />
          <span className="field-help">Markdown. HTML/JS blockeras.</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="visa_kontakt" />
          <span className="field-label">Visa kontaktuppgifter publikt (opt-in)</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Kontakt e-post</span>
          <input type="email" name="kontakt_epost" className="input" />
          <span className="field-help">Sparas bara om opt-in är på.</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Kontakt telefon</span>
          <input type="tel" name="kontakt_telefon" className="input" />
        </label>

        <div className="flex justify-end gap-3">
          <Link href="/admin/lard" className="btn btn-ghost">Avbryt</Link>
          <button type="submit" className="btn btn-primary">Skapa</button>
        </div>
      </form>
    </main>
  );
}
