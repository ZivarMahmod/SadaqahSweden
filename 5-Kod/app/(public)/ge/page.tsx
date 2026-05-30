// Rum: Ge (brief 35, F6 — platshållare). Ytan byggs av briefs 38–40.
import { RoomLanding } from "@/components/layout/room-landing";
import { ROOMS } from "@/lib/navigation";

export const metadata = { title: "Ge — Sadaqah Sweden" };

const room = ROOMS.find((r) => r.key === "ge");

export default function GeRoom() {
  if (!room) return null;
  return <RoomLanding room={room} />;
}
