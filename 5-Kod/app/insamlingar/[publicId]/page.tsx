import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ publicId: string }>;

const PUBLIK_STATUSAR = new Set([
  "aktiv",
  "stangd",
  "utbetald",
  "vantar_pa_resultat",
  "avslutad_levererad",
  "avslutad_utan_resultat",
  "pausad",
]);

export async function generateMetadata({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("insamling")
    .select("titel, kort_beskrivning, status, deleted_at")
    .eq("public_id", publicId)
    .single();

  if (!data || data.deleted_at || !PUBLIK_STATUSAR.has(data.status)) {
    return { title: "Insamling — Sadaqah Sweden" };
  }
  return {
    title: `${data.titel} — Sadaqah Sweden`,
    description: data.kort_beskrivning,
  };
}

export default async function InsamlingPage({ params }: { params: Params }) {
  const { publicId } = await params;
  const supabase = await createClient();

  const { data: i, error } = await supabase
    .from("insamling")
    .select(
      "id, public_id, titel, kort_beskrivning, lang_beskrivning, mottagare_typ, mottagare_beskrivning, hjalp_land, hjalp_plats, insamlar_stad, insamlar_region, malbelopp_modell, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, insamlat_ore, insamling_deadline, genomforande_datum, overmalsplan, tillat_overmal, status, publicerad_at, deleted_at",
    )
    .eq("public_id", publicId)
    .single();

  if (error || !i || i.deleted_at || !PUBLIK_STATUSAR.has(i.status)) {
    notFound();
  }

  const malbelopp =
    i.malbelopp_modell === "fast"
      ? i.malbelopp_ore ?? 0
      : i.malbelopp_modell === "intervall"
        ? i.malbelopp_max_ore ?? 0
        : null;
  const procent = malbelopp ? Math.min(100, Math.round((i.insamlat_ore / malbelopp) * 100)) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm text-muted-foreground">
        Insamling i {i.insamlar_stad}
        {i.insamlar_region ? `, ${i.insamlar_region}` : ""} · Hjälpen landar i {i.hjalp_land}
        {i.hjalp_plats ? ` (${i.hjalp_plats})` : ""}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{i.titel}</h1>
      <p className="mt-3 text-lg">{i.kort_beskrivning}</p>

      <section className="mt-8 rounded-lg border border-black/10 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-semibold">{kr(i.insamlat_ore)}</span>
          {malbelopp && (
            <span className="text-sm text-muted-foreground">
              av {kr(malbelopp)}{" "}
              {i.malbelopp_modell === "intervall" && i.malbelopp_min_ore && (
                <>(mål {kr(i.malbelopp_min_ore)})</>
              )}
            </span>
          )}
          {!malbelopp && <span className="text-sm text-muted-foreground">öppen insamling</span>}
        </div>
        {procent != null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
            <div className="h-full bg-black" style={{ width: `${procent}%` }} />
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Stänger {new Date(i.insamling_deadline).toLocaleDateString("sv-SE")} · Genomförs senast{" "}
          {new Date(i.genomforande_datum).toLocaleDateString("sv-SE")}
        </p>

        <button
          type="button"
          disabled
          className="mt-6 w-full rounded-md bg-black px-4 py-3 text-white opacity-50"
          title="Donationsflödet kommer i Steg 6"
        >
          Donera (kopplas in i Steg 6 — Stripe)
        </button>
      </section>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold">Om insamlingen</h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed">{i.lang_beskrivning}</p>
      </section>

      <section className="mt-10 grid gap-2">
        <h2 className="text-xl font-semibold">Mottagare</h2>
        <p className="text-sm text-muted-foreground">Typ: {i.mottagare_typ}</p>
        <p className="text-base">{i.mottagare_beskrivning}</p>
      </section>

      {i.tillat_overmal && i.overmalsplan && (
        <section className="mt-10 grid gap-2">
          <h2 className="text-xl font-semibold">Vad händer vid övermål</h2>
          <p className="text-base">{i.overmalsplan}</p>
        </section>
      )}
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
