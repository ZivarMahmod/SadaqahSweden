// Modul M19 — Innehåll & FAQ
// CMS-light: listsida — superadmin ser alla innehållssidor, kan skapa nya.
// Design: handoff-to-code/internt.html · Regler: 1-Planering/Modul-19-Innehall-och-FAQ.md
import Link from "next/link";
import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const STATUS_LABEL: Record<string, string> = {
  utkast: "Utkast",
  publicerad: "Publicerad",
  kommer_snart: "Kommer snart",
};

const VERIF_LABEL: Record<string, string> = {
  ej_tillampligt: "Ej tillämpligt",
  behover_lard: "Behöver lärd",
  verifierad: "Verifierad",
};

export default async function InnehallListPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  const supabase = await createClient();
  const { data: sidor } = await supabase
    .from("innehallssida")
    .select("id, slug, titel, sidtyp, status, verifieringsstatus, last, senast_andrad_at")
    .order("sidtyp", { ascending: true })
    .order("titel", { ascending: true });

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-12">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">CMS-light</p>
          <h1 className="heading-1">Innehållssidor</h1>
          <p className="lead mt-2 max-w-[640px]">
            De informativa och juridiska sidorna footern länkar till. Skapa, redigera, publicera.
            Brödtexten skrivs i Markdown — HTML/JS blockeras automatiskt.
          </p>
        </div>
        <Link href="/admin/innehall/ny" className="btn btn-primary">
          Ny sida
        </Link>
      </header>


      <section className="card card-tight">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Slug</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Verifiering</th>
              <th>Lås</th>
              <th>Senast ändrad</th>
            </tr>
          </thead>
          <tbody>
            {(sidor ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-[color:var(--color-ink-3)] py-8">
                  Inga innehållssidor än. Tryck <em>Ny sida</em> för att skapa den första.
                </td>
              </tr>
            )}
            {(sidor ?? []).map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/innehall/${s.id}`} className="font-medium">
                    {s.titel}
                  </Link>
                </td>
                <td className="text-[color:var(--color-ink-3)]">/{s.slug}</td>
                <td>{s.sidtyp === "juridisk" ? "Juridisk" : "Informativ"}</td>
                <td>
                  <span className={`pill ${s.status === "publicerad" ? "pill-success" : s.status === "kommer_snart" ? "pill-copper" : "pill-paper"}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td>
                  <span className={`pill ${s.verifieringsstatus === "verifierad" ? "pill-success" : s.verifieringsstatus === "behover_lard" ? "pill-danger" : "pill-paper"}`}>
                    {VERIF_LABEL[s.verifieringsstatus] ?? s.verifieringsstatus}
                  </span>
                </td>
                <td>{s.last ? "🔒" : ""}</td>
                <td className="text-[color:var(--color-ink-3)]">
                  {new Date(s.senast_andrad_at).toLocaleDateString("sv-SE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
