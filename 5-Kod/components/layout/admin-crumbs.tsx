// Designsystem-chrome — AdminCrumbs (client, läser pathname).
// Visas inom ChromeAdmin: "Maskinrum / <sektion>".
"use client";

import { usePathname } from "next/navigation";

const NAMNTABELL: Record<string, string> = {
  "/admin": "Översikt",
  "/admin/team": "Team",
  "/admin/larm": "Larm",
  "/admin/logg": "Ingreppslogg",
  "/admin/verktyg": "Verktyg",
  "/admin/statistik": "Statistik",
  "/admin/region-rapport": "Region-rapport",
  "/admin/overklaganden": "Överklaganden",
  "/admin/stickprov": "Stickprov",
  "/admin/innehall": "Innehåll",
  "/admin/faq": "FAQ",
  "/admin/lard": "Lärd",
  "/granskning": "Granskningskö",
  "/granskning/event": "Event-kö",
  "/granskning/organisationer": "Föreningar",
  "/granskning/bevis": "Bevis",
};

function sektionFor(path: string): string {
  // Exakt matchning först
  if (NAMNTABELL[path]) return NAMNTABELL[path];
  // Sedan längsta prefix som finns i tabellen
  let bast = "Admin";
  let langd = 0;
  for (const [key, val] of Object.entries(NAMNTABELL)) {
    if (path.startsWith(key + "/") && key.length > langd) {
      bast = val;
      langd = key.length;
    }
  }
  return bast;
}

export function AdminCrumbs() {
  const path = usePathname() ?? "/admin";
  const sektion = sektionFor(path);
  return (
    <div className="crumbs">
      <span>Maskinrum</span>
      <span className="sep">/</span>
      <span className="here">{sektion}</span>
    </div>
  );
}
