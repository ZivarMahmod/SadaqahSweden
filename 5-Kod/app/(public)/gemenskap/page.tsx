// Rum: Gemenskap (brief 35, F6 — platshållare). Ytan byggs av briefs 41–45.
import { RoomLanding } from "@/components/layout/room-landing";
import { ROOMS } from "@/lib/navigation";

export const metadata = { title: "Gemenskap — Sadaqah Sweden" };

const room = ROOMS.find((r) => r.key === "gemenskap");

export default function GemenskapRoom() {
  if (!room) return null;
  return <RoomLanding room={room} />;
}
