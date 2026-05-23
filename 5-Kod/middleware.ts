import type { NextRequest } from "next/server";
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

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Kör på alla routes utom statiska assets och Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
