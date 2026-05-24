// Karta — server-side data-helper för M12.
//
// Hämtar `geo_aggregat` joinat mot `plats_taxonomi` så att server-rendered
// /karta-sidan kan baka in all data i den initiala payloaden (Block 9.4:
// ett anrop, inte hundra). Den enskilda kart-klienten gör sedan all
// drill-down i minnet.

import { createClient } from "@/lib/supabase/server";

export type LanAggregat = {
  kod: string;             // SCB-länskod, 2 tecken
  namn: string;            // "Stockholms län"
  kort_namn: string;       // "Stockholm"
  insamlingar_antal: number;
  aktiva_antal: number;
  avslutade_levererade: number;
  verifierade_insamlare: number;
  insamlat_summa_ore: number;
};

export type KommunAggregat = {
  kod: string;             // SCB-kommunkod, 4 tecken
  namn: string;
  lan_kod: string;         // parent
  insamlingar_antal: number;
  aktiva_antal: number;
  avslutade_levererade: number;
  verifierade_insamlare: number;
  insamlat_summa_ore: number;
  under_troskel: boolean;
};

export type Riksttotal = {
  insamlingar_antal: number;
  aktiva_antal: number;
  avslutade_levererade: number;
  verifierade_insamlare: number;
  insamlat_summa_ore: number;
};

export type KartData = {
  beraknad_at: string | null;
  lan: LanAggregat[];
  kommuner: KommunAggregat[];   // bara de med under_troskel=false eller insamlingar_antal>0
  rikstotal: Riksttotal;
  troskel: number;
};

export async function hamtaKartData(): Promise<KartData> {
  const supabase = await createClient();

  // En query — joinar aggregat mot plats_taxonomi för namn.
  const [{ data: aggData }, { data: lanMeta }] = await Promise.all([
    supabase
      .from("geo_aggregat")
      .select(
        "omrade_typ, omrade_kod, kategori_id, insamlingar_antal, aktiva_antal, avslutade_levererade, verifierade_insamlare, insamlat_summa_ore, under_troskel, beraknad_at",
      )
      .is("kategori_id", null),
    supabase
      .from("plats_taxonomi")
      .select("kod, namn, kort_namn, parent_kod, niva")
      .order("kod"),
  ]);

  const namnByKod = new Map<string, { namn: string; kort: string; parent_kod: string | null }>();
  for (const r of lanMeta ?? []) {
    namnByKod.set(r.kod, { namn: r.namn, kort: r.kort_namn, parent_kod: r.parent_kod });
  }

  const lanIndex = new Map<string, LanAggregat>();
  // Initiera ALLA 21 län i indexet — även de utan rader i aggregat — så att
  // kartan visar tomma områden som inbjudan, inte luckor (Block 1.1).
  for (const r of lanMeta ?? []) {
    if (r.niva !== "lan") continue;
    lanIndex.set(r.kod, {
      kod: r.kod,
      namn: r.namn,
      kort_namn: r.kort_namn,
      insamlingar_antal: 0,
      aktiva_antal: 0,
      avslutade_levererade: 0,
      verifierade_insamlare: 0,
      insamlat_summa_ore: 0,
    });
  }

  const kommuner: KommunAggregat[] = [];
  let beraknad_at: string | null = null;

  for (const a of aggData ?? []) {
    beraknad_at = beraknad_at ?? a.beraknad_at;
    if (a.omrade_typ === "lan") {
      const lan = lanIndex.get(a.omrade_kod);
      if (lan) {
        lan.insamlingar_antal = a.insamlingar_antal;
        lan.aktiva_antal = a.aktiva_antal;
        lan.avslutade_levererade = a.avslutade_levererade;
        lan.verifierade_insamlare = a.verifierade_insamlare;
        lan.insamlat_summa_ore = a.insamlat_summa_ore;
      }
    } else if (a.omrade_typ === "kommun") {
      const meta = namnByKod.get(a.omrade_kod);
      if (!meta) continue;
      kommuner.push({
        kod: a.omrade_kod,
        namn: meta.namn,
        lan_kod: meta.parent_kod ?? "",
        insamlingar_antal: a.insamlingar_antal,
        aktiva_antal: a.aktiva_antal,
        avslutade_levererade: a.avslutade_levererade,
        verifierade_insamlare: a.verifierade_insamlare,
        insamlat_summa_ore: a.insamlat_summa_ore,
        under_troskel: a.under_troskel,
      });
    }
  }

  const lan: LanAggregat[] = Array.from(lanIndex.values()).sort(
    (a, b) => b.insamlingar_antal - a.insamlingar_antal || a.namn.localeCompare(b.namn, "sv"),
  );

  const rikstotal: Riksttotal = lan.reduce(
    (acc, l) => ({
      insamlingar_antal: acc.insamlingar_antal + l.insamlingar_antal,
      aktiva_antal: acc.aktiva_antal + l.aktiva_antal,
      avslutade_levererade: acc.avslutade_levererade + l.avslutade_levererade,
      verifierade_insamlare: acc.verifierade_insamlare + l.verifierade_insamlare,
      insamlat_summa_ore: acc.insamlat_summa_ore + l.insamlat_summa_ore,
    }),
    {
      insamlingar_antal: 0,
      aktiva_antal: 0,
      avslutade_levererade: 0,
      verifierade_insamlare: 0,
      insamlat_summa_ore: 0,
    },
  );

  return { beraknad_at, lan, kommuner, rikstotal, troskel: 5 };
}

export async function hamtaKommunerForLan(lan_kod: string): Promise<KommunAggregat[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("geo_aggregat")
    .select(
      "omrade_kod, insamlingar_antal, aktiva_antal, avslutade_levererade, verifierade_insamlare, insamlat_summa_ore, under_troskel",
    )
    .eq("omrade_typ", "kommun")
    .is("kategori_id", null);

  if (!data) return [];

  // Filtrera till bara kommuner inom det valda länet via plats_taxonomi.
  const { data: koms } = await supabase
    .from("plats_taxonomi")
    .select("kod, namn, parent_kod")
    .eq("niva", "kommun")
    .eq("parent_kod", lan_kod)
    .order("namn");

  const aggByKod = new Map(data.map((d) => [d.omrade_kod, d]));

  return (koms ?? []).map((k) => {
    const a = aggByKod.get(k.kod);
    return {
      kod: k.kod,
      namn: k.namn,
      lan_kod: k.parent_kod ?? "",
      insamlingar_antal: a?.insamlingar_antal ?? 0,
      aktiva_antal: a?.aktiva_antal ?? 0,
      avslutade_levererade: a?.avslutade_levererade ?? 0,
      verifierade_insamlare: a?.verifierade_insamlare ?? 0,
      insamlat_summa_ore: a?.insamlat_summa_ore ?? 0,
      under_troskel: a?.under_troskel ?? false,
    };
  });
}

/**
 * Hämtar de aktiva insamlingarna i ett område — län eller kommun.
 * Används av drill-down-panelens "Insamlingar här"-lista.
 */
export async function hamtaInsamlingarForOmrade(
  niva: "lan" | "kommun",
  kod: string,
  limit = 20,
): Promise<
  Array<{
    public_id: string;
    titel: string;
    insamlar_stad: string | null;
    insamlat_ore: number;
    malbelopp_ore: number | null;
    malbelopp_modell: string;
  }>
> {
  const supabase = await createClient();
  const kolumn = niva === "lan" ? "insamlar_lan_kod" : "insamlar_kommun_kod";

  const { data } = await supabase
    .from("insamling")
    .select(
      "public_id, titel, insamlar_stad, insamlat_ore, malbelopp_ore, malbelopp_modell",
    )
    .eq(kolumn, kod)
    .eq("status", "aktiv")
    .is("deleted_at", null)
    .order("insamlat_ore", { ascending: false })
    .limit(limit);

  return data ?? [];
}
