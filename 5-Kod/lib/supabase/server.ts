// Sadaqah Sweden — Supabase server-klient.
// Används i Server Components, Route Handlers och Server Actions.
// Anon-nyckel via cookies — RLS gäller utifrån inloggad användare.
//
// För service_role (Edge Functions, Stripe-webhooks som ska kringgå RLS):
// se separat admin-klient i `./admin.ts` (skapas i Steg 5 när Stripe byggs).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Kan kastas om setAll anropas från en Server Component utan
            // middleware som refreshar sessionen — middleware tar hand om
            // det fallet, så här är det säkert att ignorera.
          }
        },
      },
    },
  );
}
