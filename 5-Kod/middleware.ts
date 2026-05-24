import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// OBS: Next.js 16 har omdöpt middleware → proxy (filnamn + funktionsnamn) och
// kräver Node.js-runtime för proxy. `@opennextjs/cloudflare` stöder dock
// fortfarande BARA edge-runtime middleware. Tills adaptern hinner kapp:
// håll deprecated `middleware.ts` + edge-runtime — Next.js varnar bara,
// men adaptern bygger grönt.
//
// När OpenNext supportar Node.js-proxy: byt fil till `proxy.ts`, exportera
// `proxy` istället för `middleware`, ta bort `runtime`-raden.
export const runtime = "experimental-edge";

// Intern-zonen: team-routes som kräver aal2. Login, registrera och själva
// MFA-routes är medvetet undantagna så att man kan nå dem på aal1 för att
// lyfta sessionen. Härdning H1.
const INTERN_PREFIX = ["/admin", "/granskning", "/team/larm"];
const MFA_LIFT_EXEMPT = [
  "/team/2fa",
  "/team/2fa-setup",
  "/team/accept-invite",
  "/login",
  "/registrera",
  "/logga-ut",
  "/auth/callback",
];

// F6 — admin-subdomäner. Båda delar samma landningssida vid inloggning;
// admin_niva styr vad användaren ser efteråt. Subdomänen är en INGÅNG,
// inte säkerhetsgränsen — F1's RLS är säkerheten i djupet.
const PUBLIK_HOST = "sadaqahsweden.se";
const REGIONALADMIN_HOST = "regionaladmin.sadaqahsweden.se";
const SUPERADMIN_HOST = "superadmin.sadaqahsweden.se";

function arInternZon(path: string): boolean {
  return INTERN_PREFIX.some((p) => path === p || path.startsWith(`${p}/`));
}

function arMfaLiftExempt(path: string): boolean {
  return MFA_LIFT_EXEMPT.some((p) => path === p || path.startsWith(`${p}/`));
}

function detekteraHost(request: NextRequest): "publik" | "regionaladmin" | "superadmin" | "okand" {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  if (host === REGIONALADMIN_HOST) return "regionaladmin";
  if (host === SUPERADMIN_HOST) return "superadmin";
  if (host === PUBLIK_HOST || host === `www.${PUBLIK_HOST}`) return "publik";
  return "okand";
}

export async function middleware(request: NextRequest) {
  // Steg 1: refresh session + skicka cookies vidare.
  const { response, aal } = await updateSession(request);

  const host = detekteraHost(request);
  const path = request.nextUrl.pathname;

  // Steg 2 (F6): host-baserad routning.
  if (host === "publik") {
    // Publika domänen exponerar INTE admin-/granskar-ingångar. Direktanrop
    // hit -> redirect till regionaladmin-subdomänen (delad landning).
    if (path.startsWith("/admin") || path.startsWith("/granskning") || path.startsWith("/team")) {
      const url = new URL(request.nextUrl.toString());
      url.host = REGIONALADMIN_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  } else if (host === "regionaladmin" || host === "superadmin") {
    // Admin-subdomänernas rotväg leder till samma admin-landning.
    if (path === "/" || path === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url, 307);
    }
    // Publika ytor (insamlingar, donera, karta) på admin-subdomäner är fortsatt
    // åtkomliga — host är en ingång, inte en säkerhetsgräns. F1's RLS gör att
    // en region-admin som råkar nå superadmin-subdomänen ändå bara ser sin region.
  }

  // Steg 3: intern-zon-grind (AAL2). Gäller alla hosts.
  if (arInternZon(path) && !arMfaLiftExempt(path)) {
    if (aal && aal !== "aal2") {
      const next = `${path}${request.nextUrl.search ?? ""}`;
      const url = request.nextUrl.clone();
      url.pathname = "/team/2fa";
      url.search = `?retur=${encodeURIComponent(next)}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
