// Sadaqah Sweden — Supabase browser-klient.
// Används i klient-komponenter ("use client"). Kör mot anon-nyckeln —
// RLS gäller. Aldrig hemligheter i den här filen.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
