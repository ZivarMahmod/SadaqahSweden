// IA v0.3+ — RoomTabs (tvärgående, efter brief 35). Nivå-2-flikar inom ett rum.
//
// Konsumerar rummets `tabs` ur lib/navigation.ts och renderar dem som
// route-länkar med aktiv-markering (usePathname). Flikar med comingSoon pekar på
// rummets "öppnar snart"-landning (aldrig 404) och får en diskret "snart"-markör.
// Varje yt-brief (38–50) lägger sina nivå-2-flikar i nav-konfig; den här
// komponenten renderar dem — ingen yta uppfinner sin egen flik-rad.
//
// "use client": usePathname för aktiv-markering.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROOMS, type RoomKey } from "@/lib/navigation";

type RoomTabsProps = {
  roomKey: RoomKey;
  ariaLabel?: string;
};

export function RoomTabs({ roomKey, ariaLabel }: RoomTabsProps) {
  const pathname = usePathname() || "/";
  const room = ROOMS.find((r) => r.key === roomKey);
  const tabs = room?.tabs ?? [];
  if (tabs.length === 0) return null;

  return (
    <nav className="room-tabs" aria-label={ariaLabel ?? `${room?.label}: flikar`}>
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`room-tab${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
            {t.comingSoon && <span className="room-tab-soon">snart</span>}
          </Link>
        );
      })}
    </nav>
  );
}
