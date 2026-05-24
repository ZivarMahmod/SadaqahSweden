// Sadaqah Sweden — Auth-middleware-helper för @supabase/ssr.
// Anropas från `5-Kod/middleware.ts` på varje request. Refreshar sessionen,
// håller cookies synkade mellan request + response, och returnerar JWT-aal
// så middleware kan grinda intern-zonen.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

type Aal = "aal1" | "aal2" | null;

export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; aal: Aal }> {
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

  // getUser() refreshar sessionen och fyller cookies (Supabase ssr-doc).
  await supabase.auth.getUser();

  // Hämta nuvarande AAL för middleware-gating. null om ej inloggad.
  let aal: Aal = null;
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    aal = (data?.currentLevel as Aal) ?? null;
  } catch {
    aal = null;
  }

  return { response: supabaseResponse, aal };
}
