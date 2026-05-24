// Sadaqah Sweden — Supabase service_role-klient.
// SAKERHETSREGLER §1: service_role finns BARA på servern, aldrig i klienten.
// Anropas i Server Actions, Route Handlers och Edge Functions som behöver
// förbigå RLS (Stripe-webhooks, MFA-reset, hård offboarding).
//
// Skapas på begäran (ingen module-singleton) eftersom nyckeln läses från env
// och vi vill att felmeddelandet uppstår vid första anrop, inte vid import.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function readServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY saknas i env");
  }
  return key;
}

function readUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL saknas");
  return url;
}

/**
 * Skapar en server-only klient med service_role-nyckel. Förbigår RLS.
 * Använd bara där det är absolut nödvändigt (refunds, MFA-reset, offboarding).
 */
export function createAdminClient() {
  return createClient<Database>(readUrl(), readServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Hård offboarding: dödar alla sessioner för en användare globalt.
 * Kallar GoTrue Admin API direkt — `auth.admin.signOut` i supabase-js v2
 * tar en JWT-sträng, inte ett user-id. POST /auth/v1/admin/users/{id}/logout
 * är den dokumenterade vägen.
 *
 * @returns true om sign-out lyckades, false annars (logga och fortsätt — DB-
 * sidan har redan sänkt rollen så nästa request blockeras ändå).
 */
export async function revokeAllSessions(userId: string): Promise<boolean> {
  const url = readUrl();
  const key = readServiceRoleKey();
  try {
    const resp = await fetch(
      `${url}/auth/v1/admin/users/${userId}/logout?scope=global`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          "Content-Type": "application/json",
        },
      },
    );
    if (!resp.ok) {
      // Fallback: skärmlös ban-toggle revokerar tokens som sidoeffekt.
      const banResp = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ban_duration: "1s" }),
      });
      return banResp.ok;
    }
    return true;
  } catch (e) {
    console.error("revokeAllSessions: misslyckades", e);
    return false;
  }
}

/**
 * Rensa alla MFA-faktorer för en användare. Kallas vid admin-reset av MFA.
 * Använder service_role-klient som har auth.admin-rättigheter.
 */
export async function deleteAllMfaFactors(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error || !data) {
    console.error("deleteAllMfaFactors: list failed", error);
    return 0;
  }
  let n = 0;
  for (const f of data.factors) {
    const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({
      userId,
      id: f.id,
    });
    if (!delErr) n += 1;
  }
  return n;
}
