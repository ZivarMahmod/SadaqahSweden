import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: filen heter `proxy.ts` (tidigare `middleware.ts`). Funktionen
// måste exportera namnet `proxy` (tidigare `middleware`). Beteende oförändrat.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Kör på alla routes utom statiska assets och Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
