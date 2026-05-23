// Sadaqah Sweden — Auth-middleware-helper för @supabase/ssr.
// Anropas från `5-Kod/middleware.ts` på varje request. Refreshar sessionen,
// håller cookies synkade mellan request + response. Utan detta tappar
// server-komponenter inloggning vid expiry.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // VIKTIGT: getUser() måste anropas — utan detta refreshar inte sessionen
  // och RLS-anrop från Server Components blir anonyma.
  // Se @supabase/ssr docs: alltid getUser() innan response returneras.
  await supabase.auth.getUser();

  return supabaseResponse;
}
