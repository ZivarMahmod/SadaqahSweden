// Rum: Kunskap (brief 35, F6 — platshållare). Ytan byggs av briefs 46/49/50/56.
import { RoomLanding } from "@/components/layout/room-landing";
import { ROOMS } from "@/lib/navigation";

export const metadata = { title: "Kunskap — Sadaqah Sweden" };

const room = ROOMS.find((r) => r.key === "kunskap");

export default function KunskapRoom() {
  if (!room) return null;
  return <RoomLanding room={room} />;
}
