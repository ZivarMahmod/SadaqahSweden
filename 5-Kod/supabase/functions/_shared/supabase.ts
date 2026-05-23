// Modul M5 — Pengaflöde (delad Supabase-klient för Edge Functions)
// service_role-klient: webhooks och settle-jobb kringgår RLS medvetet.
// user-klient: hämtar caller-identitet från JWT i request-headern.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@^2.46.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(req: Request): SupabaseClient {
  const auth = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function callerUserId(req: Request): Promise<string | null> {
  const supa = userClient(req);
  const { data, error } = await supa.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
