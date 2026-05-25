// Modul M19 — FAQ-poster CMS-light: listsida.
import Link from "next/link";
import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function FaqAdminPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  const supabase = await createClient();
  const { data: poster } = await supabase
    .from("faq_post")
    .select("id, fraga, kategori, ordning, status, verifieringsstatus, last, senast_andrad_at")
    .order("kategori", { ascending: true })
    .order("ordning", { ascending: true });

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-12">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">CMS-light</p>
          <h1 className="heading-1">FAQ-poster</h1>
          <p className="lead mt-2 max-w-[640px]">
            Strukturerade fråga/svar-poster. Utan färdigt svar förblir posten utkast — utkast
            läcker aldrig publikt.
          </p>
        </div>
        <Link href="/admin/faq/ny" className="btn btn-primary">Ny FAQ-post</Link>
      </header>

      <section className="card card-tight">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Fråga</th>
              <th>Ordning</th>
              <th>Status</th>
              <th>Verifiering</th>
            </tr>
          </thead>
          <tbody>
            {(poster ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[color:var(--color-ink-3)] py-8">
                  Inga FAQ-poster än.
                </td>
              </tr>
            )}
            {(poster ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.kategori}</td>
                <td>
                  <Link href={`/admin/faq/${p.id}`} className="font-medium">{p.fraga}</Link>
                </td>
                <td>{p.ordning}</td>
                <td>
                  <span className={`pill ${p.status === "publicerad" ? "pill-success" : "pill-paper"}`}>
                    {p.status === "publicerad" ? "Publicerad" : "Utkast"}
                  </span>
                </td>
                <td>
                  <span className={`pill ${p.verifieringsstatus === "verifierad" ? "pill-success" : p.verifieringsstatus === "behover_lard" ? "pill-danger" : "pill-paper"}`}>
                    {p.verifieringsstatus === "verifierad" ? "Verifierad" : p.verifieringsstatus === "behover_lard" ? "Behöver lärd" : "Ej religiöst"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
