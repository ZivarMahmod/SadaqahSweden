// Modul M19 — Innehåll & FAQ — skapa ny innehållssida.
import Link from "next/link";
import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { skapaSidaAction } from "../actions";

export default async function NySidaPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  async function action(formData: FormData) {
    "use server";
    const r = await skapaSidaAction(formData);
    if (!r.ok) throw new Error(r.fel ?? "Kunde inte skapa sida");
  }

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/admin/innehall" className="btn btn-ghost btn-sm">← Innehållssidor</Link>
      </nav>
      <h1 className="heading-1">Ny innehållssida</h1>
      <p className="lead mt-2">
        Skapa en stub. Brödtext, status och verifiering fylls efteråt i redigeringsläget.
      </p>

      <form action={action} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="field-label field-label-required">Slug</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="hur-det-fungerar"
            className="input"
          />
          <span className="field-help">Gemener + bindestreck. Blir URL:en — ändras aldrig efter publicering.</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label field-label-required">Titel</span>
          <input name="titel" required maxLength={200} className="input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label field-label-required">Sidtyp</span>
          <select name="sidtyp" required className="select" defaultValue="informativ">
            <option value="informativ">Informativ</option>
            <option value="juridisk">Juridisk (Villkor / Integritet — versioneringsflöde)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Verifieringsstatus</span>
          <select name="verifieringsstatus" className="select" defaultValue="ej_tillampligt">
            <option value="ej_tillampligt">Ej tillämpligt</option>
            <option value="behover_lard">Behöver lärd — kan inte publiceras förrän verifierad</option>
          </select>
          <span className="field-help">
            Sätt &quot;Behöver lärd&quot; för religiöst substantiella sidor (t.ex. Sadaqa &amp; Zakat).
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <Link href="/admin/innehall" className="btn btn-ghost">Avbryt</Link>
          <button type="submit" className="btn btn-primary">Skapa stub</button>
        </div>
      </form>
    </main>
  );
}
