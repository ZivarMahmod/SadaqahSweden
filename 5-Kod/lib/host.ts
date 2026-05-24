// F6 — host-detect-helper för Server Components.
// Match middlewares logik. Används för att dölja admin-/granskar-knappar
// från publik-navigeringen på sadaqahsweden.se.

import { headers } from "next/headers";

export type HostTyp = "publik" | "admin" | "superadmin" | "okand";

export async function aktuellHostTyp(): Promise<HostTyp> {
  const h = await headers();
  const host = (h.get("host") ?? "").toLowerCase();
  if (host === "admin.sadaqahsweden.se") return "admin";
  if (host === "superadmin.sadaqahsweden.se") return "superadmin";
  if (host === "sadaqahsweden.se" || host === "www.sadaqahsweden.se") return "publik";
  return "okand";
}

export async function arAdminHost(): Promise<boolean> {
  const t = await aktuellHostTyp();
  return t === "admin" || t === "superadmin";
}
