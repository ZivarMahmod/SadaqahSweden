// F6 — host-detect-helper för Server Components.
// Match middlewares logik. Används för att dölja admin-/granskar-knappar
// från publik-navigeringen på sadaqahsweden.se.
//
// En admin-subdomän: hela teamet (superadmin, region-admin, medhjälpare)
// loggar in på admin.sadaqahsweden.se. admin_niva + RLS avgör vad var och
// en ser efter inloggning. Subdomänen är en ingång, inte en
// säkerhetsgräns.

import { headers } from "next/headers";

export type HostTyp = "publik" | "admin" | "okand";

export async function aktuellHostTyp(): Promise<HostTyp> {
  const h = await headers();
  const host = (h.get("host") ?? "").toLowerCase();
  if (host === "admin.sadaqahsweden.se") return "admin";
  if (host === "sadaqahsweden.se" || host === "www.sadaqahsweden.se") return "publik";
  return "okand";
}

export async function arAdminHost(): Promise<boolean> {
  return (await aktuellHostTyp()) === "admin";
}
