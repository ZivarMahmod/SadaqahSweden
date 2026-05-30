// IA v0.3 — RoomNav (brief 35, F6). Webb-topbarens fem-rums-nav.
//
// Konsumerar lib/navigation.ts (ROOMS) — samma fil som app-bottennavet (brief 51)
// importerar. Liten klient-komponent BARA för aktiv-markering (usePathname); all
// roll-/host-/notis-logik bor kvar serverside i ChromePublic (oförändrad).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROOMS, ärRumAktivt, type NavRoom } from "@/lib/navigation";

type RoomNavProps = {
  rooms?: NavRoom[];
  /** Extra serverside-gatade länkar (t.ex. granskare-genvägar), renderas efter rummen. */
  extra?: { href: string; label: string }[];
};

export function RoomNav({ rooms = ROOMS, extra = [] }: RoomNavProps) {
  const pathname = usePathname() || "/";
  return (
    <nav className="nav-links" aria-label="Huvudmeny — de fem rummen">
      {rooms.map((room) => {
        const active = ärRumAktivt(room, pathname);
        return (
          <Link
            key={room.key}
            href={room.href}
            className={`nav-link${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {room.label}
          </Link>
        );
      })}
      {extra.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="nav-link"
          style={{ color: "var(--color-copper-deep)", fontWeight: 600 }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
