// Modul M4 — Kvitto via Resend.
// Plan: 1-Planering/Modul-04-Donator-flodet.md Block 4.2.
// Anropas av stripe-webhook efter payment_intent.succeeded med donation_id.
// Idempotent: kollar donation.kvitto_skickat_at (om kolumnen finns) — annars
// skickar bara om payload.force = false.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { fail, json } from "../_shared/http.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Sadaqah Sweden <ingen-svarsadress@sadaqahsweden.se>";
const SITE_URL = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://sadaqahsweden.se";

interface ReqBody {
  donation_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON", 400);
  }
  if (!body.donation_id) return fail("donation_id krävs", 400);

  if (!RESEND_API_KEY) {
    return fail("RESEND_API_KEY ej konfigurerad", 503, { pending: true });
  }

  const admin = serviceClient();

  const { data: donation, error } = await admin
    .from("donation")
    .select(`
      id, public_id, belopp_ore, frivilligt_bidrag_ore, donator_epost,
      stripe_payment_intent_id, status, anonym,
      insamling:insamling_id (
        id, public_id, titel
      )
    `)
    .eq("id", body.donation_id)
    .maybeSingle();

  if (error || !donation) return fail("Donation hittades inte", 404);
  if (donation.status !== "succeeded") {
    return fail(`Donation ej succeeded (status=${donation.status})`, 409);
  }

  const insamling = donation.insamling as { id: string; public_id: string; titel: string } | null;
  if (!insamling) return fail("Insamlingens data saknas", 500);

  const total = (donation.belopp_ore ?? 0) + (donation.frivilligt_bidrag_ore ?? 0);
  const kvittoUrl = `${SITE_URL}/insamlingar/${insamling.public_id}/donera/tack?d=${donation.public_id}`;

  const html = renderaKvittoHTML({
    insamling_titel: insamling.titel,
    insamling_link: `${SITE_URL}/insamlingar/${insamling.public_id}`,
    kvitto_url: kvittoUrl,
    kvitto_nr: donation.public_id,
    belopp_ore: donation.belopp_ore ?? 0,
    bidrag_ore: donation.frivilligt_bidrag_ore ?? 0,
    total_ore: total,
  });

  const text = renderaKvittoText({
    insamling_titel: insamling.titel,
    insamling_link: `${SITE_URL}/insamlingar/${insamling.public_id}`,
    kvitto_nr: donation.public_id,
    belopp_ore: donation.belopp_ore ?? 0,
    bidrag_ore: donation.frivilligt_bidrag_ore ?? 0,
    total_ore: total,
  });

  let resendId: string | null = null;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [donation.donator_epost],
        subject: `Tack för din gåva — ${insamling.titel}`,
        html,
        text,
        tags: [
          { name: "type", value: "donation_kvitto" },
          { name: "donation_public_id", value: donation.public_id },
        ],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("Resend API-fel", resp.status, errBody);
      return fail("Kunde inte skicka kvitto", 502, { resend_status: resp.status });
    }
    const responseJson = await resp.json();
    resendId = responseJson?.id ?? null;
  } catch (e) {
    console.error("Resend-anrop kraschade", e);
    return fail("Resend-anrop kraschade", 502);
  }

  return json({ ok: true, resend_id: resendId, kvitto_url: kvittoUrl });
});

function fmtKr(ore: number): string {
  return `${(ore / 100).toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`;
}

function renderaKvittoHTML(p: {
  insamling_titel: string;
  insamling_link: string;
  kvitto_url: string;
  kvitto_nr: string;
  belopp_ore: number;
  bidrag_ore: number;
  total_ore: number;
}): string {
  return `<!DOCTYPE html>
<html lang="sv">
  <body style="margin:0;padding:0;background:#f5f0e4;font-family:Georgia,serif;color:#1d1f1c;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#fffdf6;border-radius:16px;padding:40px;">
            <tr><td>
              <p style="margin:0;font-size:13px;letter-spacing:0.08em;color:#7a6a3b;text-transform:uppercase;">Sadaqah Sweden — Kvitto</p>
              <h1 style="margin:8px 0 24px;font-size:28px;font-weight:500;color:#0d4a3a;">Tack för din gåva</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
                Din gåva till <strong>${escapeHtml(p.insamling_titel)}</strong> är mottagen.
                Må Allah belöna dig.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="8" border="0" width="100%" style="margin:24px 0;border-top:1px solid #e6dec4;border-bottom:1px solid #e6dec4;">
                <tr>
                  <td style="color:#6a6a5e;font-size:14px;">Gåva</td>
                  <td align="right" style="font-variant-numeric:tabular-nums;">${fmtKr(p.belopp_ore)}</td>
                </tr>
                ${p.bidrag_ore > 0 ? `<tr>
                  <td style="color:#6a6a5e;font-size:14px;">Frivilligt bidrag till plattformen</td>
                  <td align="right" style="font-variant-numeric:tabular-nums;">${fmtKr(p.bidrag_ore)}</td>
                </tr>` : ""}
                <tr>
                  <td style="font-weight:600;">Totalt</td>
                  <td align="right" style="font-weight:600;font-variant-numeric:tabular-nums;">${fmtKr(p.total_ore)}</td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6a6a5e;">Kvittonummer</p>
              <p style="margin:0 0 24px;font-family:monospace;font-size:14px;">${escapeHtml(p.kvitto_nr)}</p>

              <p style="margin:24px 0;">
                <a href="${p.kvitto_url}" style="display:inline-block;background:#b46e2b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
                  Visa kvitto online
                </a>
              </p>

              <p style="margin:24px 0 0;font-size:13px;color:#6a6a5e;line-height:1.5;">
                Om målet inte nås används din gåva ändå för projektet — pengarna flödar
                framåt. Insamlaren rapporterar utfallet via plattformen.
              </p>

              <p style="margin:24px 0 0;font-size:12px;color:#7a6a3b;">
                <a href="${p.insamling_link}" style="color:#0d4a3a;">Följ insamlingen</a> · sadaqahsweden.se
              </p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderaKvittoText(p: {
  insamling_titel: string;
  insamling_link: string;
  kvitto_nr: string;
  belopp_ore: number;
  bidrag_ore: number;
  total_ore: number;
}): string {
  return [
    `Sadaqah Sweden — Kvitto`,
    ``,
    `Tack för din gåva till ${p.insamling_titel}.`,
    ``,
    `Gåva:                ${fmtKr(p.belopp_ore)}`,
    p.bidrag_ore > 0 ? `Frivilligt bidrag:   ${fmtKr(p.bidrag_ore)}` : "",
    `Totalt:              ${fmtKr(p.total_ore)}`,
    ``,
    `Kvittonummer: ${p.kvitto_nr}`,
    ``,
    `Följ insamlingen: ${p.insamling_link}`,
    ``,
    `Om målet inte nås används din gåva ändå för projektet — pengarna flödar`,
    `framåt. Insamlaren rapporterar utfallet via plattformen.`,
  ].filter(Boolean).join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
