// Modul M11 — Relaterade insamlingar (RSC).
// Plan: Modul-11 Block 5.2 — diskret yta efter donationsknappen så vi delar
// trafik utan att kapa insamlingen besökaren faktiskt kom för.
import { createClient } from "@/lib/supabase/server";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";

type Props = {
  insamlingId: string;
  hjalpLand: string;
  insamlarStad: string;
  limit?: number;
};

export async function RelateradeInsamlingar({
  insamlingId,
  hjalpLand,
  insamlarStad,
  limit = 3,
}: Props) {
  const supabase = await createClient();

  // Hämta kategorierna för insamlingen
  const { data: kategorier } = await supabase
    .from("insamling_kategori")
    .select("kategori_id")
    .eq("insamling_id", insamlingId);
  const kategoriIds = kategorier?.map((k) => k.kategori_id) ?? [];

  // Hitta insamlings-ids i samma kategori (om någon).
  let kandidatIds: string[] = [];
  if (kategoriIds.length > 0) {
    const { data: ik } = await supabase
      .from("insamling_kategori")
      .select("insamling_id")
      .in("kategori_id", kategoriIds);
    kandidatIds = Array.from(new Set((ik ?? []).map((r) => r.insamling_id))).filter(
      (id) => id !== insamlingId,
    );
  }

  // Hjälp-land som fallback om kategori saknas eller ger för få.
  let query = supabase
    .from("insamling")
    .select(
      "public_id, titel, kort_beskrivning, insamlat_ore, malbelopp_ore, malbelopp_min_ore, malbelopp_max_ore, malbelopp_modell, insamlar_stad, hjalp_land, insamling_deadline, status",
    )
    .eq("status", "aktiv")
    .is("deleted_at", null)
    .neq("id", insamlingId)
    .order("publicerad_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (kandidatIds.length > 0) {
    query = query.in("id", kandidatIds);
  } else if (hjalpLand) {
    query = query.eq("hjalp_land", hjalpLand);
  } else if (insamlarStad) {
    query = query.eq("insamlar_stad", insamlarStad);
  }

  const { data: rader } = await query;

  if (!rader || rader.length === 0) return null;

  const items: InsamlingCardData[] = rader.map((i) => ({
    publicId: i.public_id,
    titel: i.titel,
    kortBeskrivning: i.kort_beskrivning,
    insamlatOre: i.insamlat_ore,
    malbeloppOre: i.malbelopp_ore,
    malbeloppMinOre: i.malbelopp_min_ore,
    malbeloppMaxOre: i.malbelopp_max_ore,
    malbeloppModell: i.malbelopp_modell,
    insamlarStad: i.insamlar_stad,
    hjalpLand: i.hjalp_land,
    insamlingDeadline: i.insamling_deadline,
    status: i.status,
  }));

  return (
    <section>
      <h2 className="heading-2">Relaterade insamlingar</h2>
      <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
        Andra granskade insamlingar som ligger nära den här — om du vill ge mer.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <InsamlingCard key={i.publicId} data={i} />
        ))}
      </div>
    </section>
  );
}
