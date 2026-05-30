// Rum: Min vardag (brief 35, F6 — platshållare). Ytan byggs av briefs 46–48.
import { RoomComingSoon } from "@/components/layout/room-landing";
import { ROOMS } from "@/lib/navigation";

export const metadata = { title: "Min vardag — Sadaqah Sweden" };

const room = ROOMS.find((r) => r.key === "min-vardag");

export default function MinVardagRoom() {
  if (!room) return null;
  return <RoomComingSoon room={room} />;
}
