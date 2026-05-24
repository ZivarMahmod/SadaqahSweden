// Modul M19 — ny FAQ-post.
import Link from "next/link";
import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { skapaFaqAction } from "../actions";

export const runtime = "edge";

export default async function NyFaqPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  async function action(formData: FormData) {
    "use server";
    const r = await skapaFaqAction(formData);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte skapa FAQ-post");
  }

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/admin/faq" className="btn btn-ghost btn-sm">← FAQ-poster</Link>
      </nav>
      <h1 className="heading-1">Ny FAQ-post</h1>
      <p className="lead mt-2">Lägg in frågan. Svar fyller du i redigeringsläget.</p>

      <form action={action} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="field-label field-label-required">Fråga</span>
          <input name="fraga" required maxLength={500} className="input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label field-label-required">Kategori</span>
          <input
            name="kategori"
            required
            maxLength={80}
            placeholder="Donatorer / Insamlare / Granskning / Pengar / Föreningar / Trygghet"
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Verifieringsstatus</span>
          <select name="verifieringsstatus" className="select" defaultValue="ej_tillampligt">
            <option value="ej_tillampligt">Ej tillämpligt</option>
            <option value="behover_lard">Behöver lärd</option>
          </select>
        </label>

        <div className="flex justify-end gap-3">
          <Link href="/admin/faq" className="btn btn-ghost">Avbryt</Link>
          <button type="submit" className="btn btn-primary">Skapa</button>
        </div>
      </form>
    </main>
  );
}
