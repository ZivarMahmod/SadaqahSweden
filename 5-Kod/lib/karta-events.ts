// M14 ⇄ M12 — events som pin-lager på Sverige-kartan.
// Brief: "events matar M12-kartan som ett eget, av-/påslagbart pin-lager".

import { createClient } from "@/lib/supabase/server";

export type EventPin = {
  id: string;
  public_id: string;
  slug: string;
  titel: string;
  typ: string;
  start_at: string;
  lat: number;
  lng: number;
};

export async function hamtaEventsForKarta(): Promise<EventPin[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event")
    .select("id, public_id, slug, titel, typ, start_at, plats_lat, plats_lng")
    .eq("status", "publicerad")
    .eq("plats_typ", "fysisk")
    .not("plats_lat", "is", null)
    .not("plats_lng", "is", null)
    .is("deleted_at", null)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(500);
  return (data ?? []).map((e) => ({
    id: e.id,
    public_id: e.public_id,
    slug: e.slug,
    titel: e.titel,
    typ: e.typ,
    start_at: e.start_at,
    lat: e.plats_lat as number,
    lng: e.plats_lng as number,
  }));
}
