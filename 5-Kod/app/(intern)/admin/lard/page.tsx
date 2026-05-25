// Modul M19 — Lärd-profiler: list.
import Link from "next/link";
import { redirect } from "next/navigation";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export default async function LardListPage() {
  const me = await kraver(["admin"]);
  if (me.profil.admin_niva !== "superadmin") redirect("/admin");

  const supabase = await createClient();
  const { data: larda } = await supabase
    .from("lard_profil")
    .select("id, namn, presentation, visa_kontakt, skapad_at")
    .order("namn", { ascending: true });

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-12">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">Lärd-profiler</p>
          <h1 className="heading-1">Lärda &amp; talesmän</h1>
          <p className="lead mt-2 max-w-[640px]">
            Profiler som verifierar religiöst substantiellt innehåll. Listas neutralt — ingen
            inriktnings-rangordning.
          </p>
        </div>
        <Link href="/admin/lard/ny" className="btn btn-primary">Ny lärd-profil</Link>
      </header>


      <section className="card card-tight">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Namn</th>
              <th>Kontaktuppgifter</th>
              <th>Skapad</th>
            </tr>
          </thead>
          <tbody>
            {(larda ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-[color:var(--color-ink-3)] py-8">
                  Inga lärd-profiler än. Skapa den första — innehållet du fyller det med
                  bestämmer Zivar och de lärda själva.
                </td>
              </tr>
            )}
            {(larda ?? []).map((l) => (
              <tr key={l.id}>
                <td>
                  <Link href={`/admin/lard/${l.id}`} className="font-medium">{l.namn}</Link>
                </td>
                <td>{l.visa_kontakt ? "Synliga (opt-in)" : "Dolda"}</td>
                <td className="text-[color:var(--color-ink-3)]">
                  {new Date(l.skapad_at).toLocaleDateString("sv-SE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
