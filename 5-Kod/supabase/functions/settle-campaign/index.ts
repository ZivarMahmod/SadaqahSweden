// Modul M5 — Pengaflöde
// Plan: 2-Byggplan/02-Stripe-pengaflode.md §2.2, §5.1 ·
//       Tillägg-Nya-beslut-2026-05-23 A1.
//
// Stänger en insamling vid deadline och flyttar medlen framåt:
//   - All succeeded donation nettosumma → transfer till insamlarens connected account.
//   - Frivilligt bidrag-summa → transfer till föreningens connected account
//     (om PLATFORM_ASSOCIATION_ACCOUNT_ID är satt; annars stannar på plattformsbalansen).
//
// Tillägg A1: pengar flödar framåt oavsett om exakt mål nås.
// Refund vid bedrägeri/fel är ett separat admin-flöde (refund-by-admin).
// Settle gör därför ALDRIG någon refund automatiskt vid undermål.
//
// Idempotency-Key på transfers — säker vid återförsök (pg_cron eller manuell).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { stripe, PLATFORM_ASSOCIATION_ACCOUNT_ID } from "../_shared/stripe.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { fail, json } from "../_shared/http.ts";

interface ReqBody {
  insamling_id: string;
  force?: boolean;     // tillåt stängning även om deadline ej passerat (admin-test)
  dry_run?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON", 400);
  }
  if (!body.insamling_id) return fail("insamling_id krävs", 400);

  const admin = serviceClient();

  const { data: insamling, error } = await admin
    .from("insamling")
    .select(`
      id, public_id, status, insamling_deadline,
      connected_account_id, transfer_group,
      insamlat_ore, insamlat_netto_ore, frivilligt_bidrag_total_ore, utbetald_ore
    `)
    .eq("id", body.insamling_id)
    .maybeSingle();

  if (error || !insamling) return fail("Insamlingen hittades inte", 404);

  const deadlinePast = new Date(insamling.insamling_deadline).getTime() < Date.now();
  if (!deadlinePast && !body.force) {
    return fail("Deadline har inte passerat", 409);
  }
  if (!["aktiv", "stangd"].includes(insamling.status)) {
    return fail(`Insamlingen är i fel status (${insamling.status})`, 409);
  }
  if (!insamling.connected_account_id) {
    return fail("Saknar connected_account_id", 409);
  }

  // Hämta connected account stripe_account_id
  const { data: ca } = await admin
    .from("connected_accounts")
    .select("id, stripe_account_id, payouts_enabled, charges_enabled")
    .eq("id", insamling.connected_account_id)
    .maybeSingle();
  if (!ca) return fail("Connected account hittades inte", 404);

  // Netto till insamlaren = summa succeeded donation (belopp_ore - stripe_avgift_ore) - tidigare utbetald
  const { data: dStats } = await admin
    .from("donation")
    .select("belopp_ore, stripe_avgift_ore, refunderad_belopp_ore")
    .eq("insamling_id", insamling.id)
    .eq("status", "succeeded");

  const totalNetto = (dStats ?? []).reduce(
    (sum, d) => sum + Math.max(0, (d.belopp_ore ?? 0) - (d.stripe_avgift_ore ?? 0) - (d.refunderad_belopp_ore ?? 0)),
    0,
  );

  const redanUtbetald = insamling.utbetald_ore ?? 0;
  const attTransferera = totalNetto - redanUtbetald;

  if (attTransferera <= 0) {
    // Inget att flytta — markera stängd om aktiv.
    if (insamling.status === "aktiv") {
      await admin.from("insamling").update({ status: "stangd", stangd_at: new Date().toISOString() }).eq("id", insamling.id);
    }
    return json({ ok: true, transferred_ore: 0, fri_bidrag_ore: 0, status: "stangd" });
  }

  const transferGroup = insamling.transfer_group ?? `campaign_${insamling.public_id}`;
  const idempotencyKey = `settle_${insamling.id}_${Math.floor(Date.now() / 1000)}`;

  if (body.dry_run) {
    return json({
      ok: true,
      dry_run: true,
      would_transfer_ore: attTransferera,
      would_tip_ore: insamling.frivilligt_bidrag_total_ore ?? 0,
      transfer_group: transferGroup,
    });
  }

  // 1. Skapa pending transfer i DB (för audit + idempotens via unique index)
  const { data: tRow, error: tInsertErr } = await admin
    .from("transfers")
    .insert({
      insamling_id: insamling.id,
      connected_account_id: ca.id,
      belopp_ore: attTransferera,
      currency: "SEK",
      transfer_group: transferGroup,
      status: "pending",
      idempotency_key: idempotencyKey,
      syfte: "insamling_utbetalning",
    })
    .select("id")
    .single();

  if (tInsertErr) {
    console.error("transfer DB insert failed", tInsertErr);
    return fail("DB-fel vid transfer", 500, { db_error: tInsertErr.message });
  }

  // 2. Skapa Stripe transfer
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: attTransferera,
        currency: "sek",
        destination: ca.stripe_account_id,
        transfer_group: transferGroup,
        metadata: {
          insamling_id: insamling.id,
          insamling_public_id: insamling.public_id,
        },
      },
      { idempotencyKey },
    );

    await admin
      .from("transfers")
      .update({ stripe_transfer_id: transfer.id, status: "paid" })
      .eq("id", tRow.id);
  } catch (e) {
    console.error("stripe.transfers.create failed", e);
    await admin
      .from("transfers")
      .update({ status: "failed", failure_reason: (e as Error).message })
      .eq("id", tRow.id);
    return fail("Stripe transfer misslyckades", 502, { stripe_error: (e as Error).message });
  }

  // 3. Frivilligt bidrag-transfer till föreningens connected account, om konfigurerat
  const tipTotal = insamling.frivilligt_bidrag_total_ore ?? 0;
  let tipTransferId: string | null = null;
  if (tipTotal > 0 && PLATFORM_ASSOCIATION_ACCOUNT_ID) {
    const tipKey = `tip_${insamling.id}_${Math.floor(Date.now() / 1000)}`;
    const { data: ftRow, error: ftErr } = await admin
      .from("transfers")
      .insert({
        insamling_id: insamling.id,
        connected_account_id: ca.id,   // not used logically för tip; ger FK-grund
        belopp_ore: tipTotal,
        currency: "SEK",
        transfer_group: transferGroup,
        status: "pending",
        idempotency_key: tipKey,
        syfte: "frivilligt_bidrag",
      })
      .select("id")
      .single();

    if (!ftErr && ftRow) {
      try {
        const fTransfer = await stripe.transfers.create(
          {
            amount: tipTotal,
            currency: "sek",
            destination: PLATFORM_ASSOCIATION_ACCOUNT_ID,
            transfer_group: transferGroup,
            metadata: {
              insamling_id: insamling.id,
              syfte: "frivilligt_bidrag",
            },
          },
          { idempotencyKey: tipKey },
        );
        tipTransferId = fTransfer.id;
        await admin
          .from("transfers")
          .update({ stripe_transfer_id: fTransfer.id, status: "paid" })
          .eq("id", ftRow.id);
      } catch (e) {
        console.error("frivilligt-bidrag transfer failed", e);
        await admin
          .from("transfers")
          .update({ status: "failed", failure_reason: (e as Error).message })
          .eq("id", ftRow.id);
      }
    }
  }

  // 4. Stäng insamlingen.
  await admin
    .from("insamling")
    .update({
      status: "stangd",
      stangd_at: new Date().toISOString(),
    })
    .eq("id", insamling.id);

  return json({
    ok: true,
    transferred_ore: attTransferera,
    tip_transferred_ore: tipTransferId ? tipTotal : 0,
    transfer_group: transferGroup,
  });
});
