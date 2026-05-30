import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * F4 (säkerhetsbasen) — signerad-URL-standard.
 *
 * ALLA bilagor (bevisfoton, dokument, profilbilder, art.9-underlag) serveras
 * via signerade URL:er med kort giltighet — ALDRIG en publik storage-URL.
 * Känsligt material ligger i privata buckets (t.ex. `kansliga-underlag`).
 *
 * Kort TTL som default; använd `_LANG` bara där en längre länk verkligen behövs
 * (t.ex. en nedladdning som måste överleva en långsam uppkoppling).
 */
export const SIGNERAD_URL_TTL_KORT = 120; // sekunder (2 min)
export const SIGNERAD_URL_TTL_LANG = 600; // sekunder (10 min)

export const PRIVAT_BUCKET_KANSLIGA = "kansliga-underlag" as const;

/**
 * Skapar en kortlivad signerad URL för ett objekt i en privat bucket.
 * Server-only (kräver service_role / inloggad serverkontext). Returnerar
 * `null` om signeringen misslyckas — anropare visar fel-state, läcker aldrig
 * en rå sökväg.
 */
export async function getSignadUrl(
  bucket: string,
  path: string,
  ttlSekunder: number = SIGNERAD_URL_TTL_KORT,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, ttlSekunder);
  if (error || !data) return null;
  return data.signedUrl;
}
