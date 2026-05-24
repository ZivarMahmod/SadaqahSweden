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

function arInternZon(path: string): boolean {
  return INTERN_PREFIX.some((p) => path === p || path.startsWith(`${p}/`));
}

function arMfaLiftExempt(path: string): boolean {
  return MFA_LIFT_EXEMPT.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  // Steg 1: refresh session + skicka cookies vidare.
  const { response, aal } = await updateSession(request);

  // Steg 2: intern-zon-grind. Om path matchar och session är aal1 trots att
  // användaren har en faktor enrollad → redirect till /team/2fa för challenge.
  // Om ingen faktor enrollad → /team/2fa-setup (görs via kraver() inom routen
  // när den faktiskt rendas; här blockerar vi bara aal2-zonen).
  const path = request.nextUrl.pathname;
  if (arInternZon(path) && !arMfaLiftExempt(path)) {
    // aal === null → ej inloggad; låt kraver() i routen redirecta till /login.
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
