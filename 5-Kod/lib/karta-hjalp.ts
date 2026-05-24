// Hjälp-vy-data (M12 Block 4) — vart i världen landar hjälpen.
//
// Block 4 är en VY av insamlingar, inte ett eget aggregat — M12 har sitt
// eget Sverige-aggregat (geo_aggregat) men hjälp-platsen läses direkt från
// insamling.hjalp_land/hjalp_lat/hjalp_lng. Volymen är liten (en aktiv
// insamling per land i taget) så aggregeringen sker on-the-fly via Postgres.

import { createClient } from "@/lib/supabase/server";

export type HjalpPlats = {
  land: string;
  antal: number;
  insamlat_ore: number;
  lat: number | null;          // ev. genomsnittlig GPS om koordinat angetts
  lng: number | null;
};

// Land → ungefärligt landcentrum (lat,lng). Används som fallback när
// insamlingen saknar GPS. Förenklat startset; expanderas vid behov.
// Källa: allmänt kända koordinater för respektive land.
const LAND_CENTRUM: Record<string, [number, number]> = {
  Sverige: [62.0, 15.0],
  Somalia: [5.15, 46.2],
  Yemen: [15.55, 48.5],
  Syrien: [34.8, 38.9],
  Palestina: [31.95, 35.23],
  Gaza: [31.5, 34.47],
  Sudan: [12.86, 30.22],
  Afghanistan: [33.94, 67.71],
  Pakistan: [30.38, 69.35],
  Bangladesh: [23.68, 90.36],
  Marocko: [31.79, -7.09],
  Egypten: [26.82, 30.8],
  Libanon: [33.85, 35.86],
  Turkiet: [38.96, 35.24],
  Etiopien: [9.14, 40.49],
  Irak: [33.22, 43.68],
  Iran: [32.43, 53.69],
  Jordanien: [30.59, 36.24],
  Tunisien: [33.89, 9.54],
  Algeriet: [28.03, 1.66],
  Libyen: [26.34, 17.23],
  Nigeria: [9.08, 8.68],
  Kenya: [-0.02, 37.91],
  Indonesien: [-0.79, 113.92],
  Malaysia: [4.21, 101.98],
  Myanmar: [21.92, 95.96],
};

export async function hamtaHjalpData(): Promise<HjalpPlats[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insamling")
    .select("hjalp_land, hjalp_lat, hjalp_lng, insamlat_ore, status")
    .in("status", [
      "aktiv",
      "stangd",
      "utbetald",
      "vantar_pa_resultat",
      "avslutad_levererad",
    ])
    .is("deleted_at", null);

  const agg = new Map<string, { antal: number; summa: number; lat_sum: number; lng_sum: number; lat_n: number }>();
  for (const r of data ?? []) {
    if (!r.hjalp_land) continue;
    const k = r.hjalp_land.trim();
    if (!k) continue;
    const cur = agg.get(k) ?? { antal: 0, summa: 0, lat_sum: 0, lng_sum: 0, lat_n: 0 };
    cur.antal += 1;
    cur.summa += r.insamlat_ore ?? 0;
    if (r.hjalp_lat != null && r.hjalp_lng != null) {
      cur.lat_sum += r.hjalp_lat;
      cur.lng_sum += r.hjalp_lng;
      cur.lat_n += 1;
    }
    agg.set(k, cur);
  }

  const result: HjalpPlats[] = [];
  for (const [land, v] of agg) {
    let lat: number | null = null;
    let lng: number | null = null;
    if (v.lat_n > 0) {
      lat = v.lat_sum / v.lat_n;
      lng = v.lng_sum / v.lat_n;
    } else if (LAND_CENTRUM[land]) {
      [lat, lng] = LAND_CENTRUM[land];
    }
    result.push({ land, antal: v.antal, insamlat_ore: v.summa, lat, lng });
  }

  return result.sort((a, b) => b.antal - a.antal || b.insamlat_ore - a.insamlat_ore);
}
