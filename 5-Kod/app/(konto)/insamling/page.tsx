import Link from "next/link";
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { skapaUtkast } from "./actions";

export const metadata = {
  title: "Mina insamlingar — Sadaqah Sweden",
};

const STATUS_LABEL: Record<string, string> = {
  utkast: "Utkast",
  inskickad: "Inskickad — väntar granskning",
  under_granskning: "Under granskning",
  andring_begard: "Ändring begärd",
  avvisad: "Avvisad",
  aktiv: "Aktiv (publik)",
  stangd: "Stängd",
  utbetald: "Utbetald",
  vantar_pa_resultat: "Väntar på resultat",
  avslutad_levererad: "Avslutad — levererad",
  avslutad_utan_resultat: "Avslutad — utan resultat",
  pausad: "Pausad",
  nedstangd: "Nedstängd",
};

export default async function MinaInsamlingarPage() {
  const me = await kraver(["insamlare", "forening", "admin"]);
  const supabase = await createClient();

  const { data: insamlingar } = await supabase
    .from("insamling")
    .select("id, public_id, titel, status, malbelopp_ore, insamlat_ore, created_at")
    .eq("agare_id", me.userId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Mina insamlingar</h1>
        <form action={skapaUtkast}>
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            Skapa nytt utkast
          </button>
        </form>
      </div>

      {(!insamlingar || insamlingar.length === 0) && (
        <p className="mt-10 text-sm text-muted-foreground">
          Du har inga insamlingar än. Klicka <em>Skapa nytt utkast</em> för att börja.
        </p>
      )}

      <ul className="mt-8 divide-y divide-black/10">
        {insamlingar?.map((i) => (
          <li key={i.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <Link
                href={`/insamling/${i.id}/redigera`}
                className="text-base font-medium underline-offset-2 hover:underline"
              >
                {i.titel}
              </Link>
              <div className="text-xs text-muted-foreground">
                {STATUS_LABEL[i.status] ?? i.status} ·{" "}
                {kr(i.insamlat_ore)} / {kr(i.malbelopp_ore ?? 0)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right">
              <code>{i.public_id}</code>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

function kr(ore: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(ore / 100);
}
