# SESSION-GOAL — Steg 5–11 (Stripe → M10 Organisationer)

**Datum:** 2026-05-24 (uppdaterad)
**Status:** Steg 5–11 strukturellt klara. Build grön. Security Advisor grön
(samma två preexisting: mission INFO, HIBP WARN). Alla migrationer pushade.

---

## Steg 5 — Stripe Connect & pengaplumbing  ✅
- Migration 0011 (`supabase/migrations/0011_stripe_pengaplumbing.sql`):
  connected_accounts, webhook_events (idempotens), transfers, refunds,
  payouts, disputes. Donation utökad. Insamling utökad. RLS på allt.
- Edge Functions: `create-connected-account`, `create-account-link`,
  `create-payment-intent`, `stripe-webhook`, `settle-campaign`.
- App-routes: `app/(konto)/stripe/onboarding/`.

## Steg 6 — Donator-flöde & realtidsräknare  ✅
- Donator-wizard, realtidsräknare via Supabase Realtime broadcast,
  Resend-kvitto via `skicka-kvitto` Edge Function.

## Loose ends från Steg 5–6 — STÄNGT  ✅
- **Migration 0012** (`0012_connected_account_link_and_settle_cron.sql`):
  - `private.knyt_connected_account_till_insamling` hookas in i
    `fatta_granskar_beslut` → vid godkann sätts connected_account_id
    automatiskt.
  - `private.backfill_connected_account_for_profil` + RPC; anropas av
    `stripe-webhook` `account.updated` så insamlingar som godkändes
    innan Stripe-onboarding kopplas retroaktivt.
  - pengaskydd-triggern relaxas för `current_user IN ('postgres','supabase_admin')`
    (SECURITY DEFINER-bypass); service_role-bypassen behålls.
  - pg_cron + pg_net installeras (0012b flyttar pg_net till `extensions`).
  - Cron-jobb `settle-due-insamlingar-hourly` (15 * * * *) anropar
    `private.kor_settle_for_due_insamlingar()` som POSTar till
    settle-campaign via `net.http_post`.

## Steg 7 — Transparens-loopen (M7)  ✅
- **Migration 0013** (`0013_transparens_loop.sql`):
  - AUTO-startbevis vid `status -> aktiv`. AUTO-utbetalningsbevis vid
    `transfers.status = 'paid'`.
  - RPC `posta_uppdatering`, `posta_resultat_bevis`,
    `godkann_resultat_bevis`, `avvisa_resultat_bevis`.
  - Trigger: vid alla 3 bevis godkända → `avslutad_levererad` +
    badge `resultat_levererat` på insamling och profil.
  - Trigger: connected_account `enabled` → badge `verifierad_insamlare`.
  - View `transparens_tidslinje` (security_invoker).
  - Status_skydd lärs övergångar `vantar_pa_resultat` →
    `avslutad_levererad`/`avslutad_utan_resultat`.
- UI:
  - `components/transparens-tidslinje.tsx` (Tripadvisor-modellen).
  - `/insamlingar/[publicId]` får en cream-section med tidslinjen.
  - `/insamling/[id]` — ny dashboard för egen insamling med
    uppdatering- + resultat-bevis-formulär.
  - `/granskning/bevis` + `/granskning/bevis/[bevisId]` — granskar-kö
    för resultat-bevis (lättviktig äkthetskoll).

## Steg 8 — Profiler & användarsidor (M9)  ✅
- **Migration 0014** (`0014_profil_publik.sql`): profiles utökad med
  presentation, stad, region, avatar_url, visa_total_summa, visa_stad.
  View `profil_publik` (security_invoker) aggregerar track record.
- UI:
  - `/profil/[publicId]` — publik profil med track record-statkort,
    insamlingar grupperade (aktiva/avslutade/övriga), utmärkelser.
  - `/konto/profil` — redigera-form med per-fält integritetskryss +
    förhandsvy-länk.
  - Länk från insamlingssidan till insamlarens profil.

## Steg 9 — Listning, sökning & discovery (M11)  ✅
- UI (ingen ny migration — bygger på befintliga tabeller):
  - `/insamlingar` med fritextsök, sortering (nyast / snart_i_mal /
    populart / alfabetiskt), hjälp-land-filter, status-filter (default
    bara aktiva), kategori-pills.
  - `/kategori/[slug]` med "Aktiva i X" + "Så har det gått tidigare".
  - `components/relaterade-insamlingar.tsx` — visas efter donations-
    knappen på insamlingssidan (delar trafik, kapar inte).

## Steg 10 — Notiser & kommunikation (M15)  ✅
- **Migration 0015** (`0015_notiser.sql`):
  - Enums: `notis_typ` (17 typer), `notis_grupp` (5 inkl
    `transaktionellt`), `notis_kanal`.
  - Tabeller: `notis` + `notis_preferens` med RLS.
    `transaktionellt` kan aldrig stängas av (WITH CHECK).
  - Central `private.skapa_notis()` SECURITY DEFINER.
  - Triggers matar in från: insamling.status, donation succeeded,
    transparens_uppdatering INSERT, transparens_bevis godkant_at,
    profil_badge INSERT, transfers paid.
  - RPC: `markera_notis_last`, `markera_alla_notiser_lasta`.
  - `private.seed_notis_preferenser` + backfill + hook i
    `handle_new_user`.
- UI:
  - `/konto/notiser` — fullskärmsvy + markera-läst.
  - Site-nav får "Notiser (N)" med olast-counter.
  - `/konto/profil` får sektion för notispreferenser per grupp.

## Steg 11 — Organisationer, katalog & collab (M10)  ✅
- **Migration 0016** (`0016_organisation_rpcs.sql`):
  - `anmal_organisation`, `granska_organisation`,
    `begar_collab`, `svara_collab` — alla SECURITY DEFINER, notifierar
    via M15.
  - Vid publicera: profil-rollen uppgraderas till `forening` om donator.
  - Verifieringsnivå sätts automatiskt: `org_nr` om org.nr finns,
    annars `kontakt`.
- UI:
  - `/foreningar` — publik katalog (fritextsök + typ + region).
  - `/foreningar/[publicId]` — organisationsprofil.
  - `/foreningar/anmal` — självregistreringsformulär (13 fält, 5
    frivilliga, M10 B2.4 målgruppskryss).
  - `/konto/foreningar` — egna ansökningar + inkomna collab-förfrågningar.
  - `/granskning/organisationer` + `[id]` — granskar-kö med
    publicera/komplettering/avvisa.
  - Nav: "Föreningar" public-meny. Granskar-toolbar: räknare-knapp.

---

## Verifikationsstatus
- `npm run build` — **grönt** för Steg 5–11.
- Supabase Security Advisor — **inga nya P0-lints** efter 0012–0016.
  INFO `mission` (reserverad) och WARN HIBP (operativt) kvar som tidigare.
- TypeScript-typer regenererade mot live-schemat efter 0014, 0015, 0016.
- Commits pushas en per avgränsad del till `main` (inga genvägar).

---

## Väntar på Zivar (operativt)

### Stripe (oförändrat sedan Steg 5)
1. **Stripe test-nycklar** i miljön:
   - `STRIPE_SECRET_KEY=sk_test_…`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`
2. **Stripe Connect aktiverat** i test-läget.
3. **Deploy Edge Functions** till Supabase:
   - `_shared/`, `create-connected-account`, `create-account-link`,
     `create-payment-intent`, `settle-campaign`, `skicka-kvitto` — `verify_jwt=true`
   - `stripe-webhook` — `verify_jwt=false` (Stripe POSTar utan JWT)
4. **Registrera webhook-endpoint** i Stripe (test) → sätt secrets:
   - `STRIPE_WEBHOOK_SECRET=whsec_…`
   - `STRIPE_WEBHOOK_SECRET_CONNECT=whsec_…`
5. **Resend-nyckel**: `RESEND_API_KEY=re_…` + `RESEND_FROM`
6. **PLATFORM_ASSOCIATION_ACCOUNT_ID** (frivilligt) för tip-mottagning
7. **STRIPE_ENABLE_SWISH=true** efter kort-flödet sett en test-betalning

### pg_cron (för settle-campaign)
8. **Supabase Vault-secrets** krävs för att cron-jobbet ska kunna POSTa:
   - `edge_functions_base_url` = projektets functions-bas-URL
     (utan trailing slash, t.ex. `https://<ref>.functions.supabase.co`)
   - `service_role_key` = service-role JWT
   Skapa via Supabase Dashboard → Vault → New Secret. Utan dessa loggar
   cron-jobbet bara `NOTICE` och hoppar — ingen risk för felaktig
   pengaflyt.

---

## Vad som händer i ordningsföljd när test-nycklarna finns
1. Deploy Edge Functions → registrera webhook → fyll i secrets.
2. En testanvändare med rollen `insamlare`/`forening` besöker
   `/stripe/onboarding` → onboardar → `account.updated`-webhook flippar
   status till `enabled` + retroaktivt backfillas connected_account_id
   för redan aktiv-godkända insamlingar (0012-flödet).
3. Donator besöker `/insamlingar/<id>/donera` → snabbval → Payment
   Element → confirm → `payment_intent.succeeded`-webhook fyller
   donation, ökar insamling-aggregat, broadcastar till live-räknaren,
   anropar skicka-kvitto, triggar M15-notis till insamlaren ("Ny donation").
4. Vid deadline triggar pg_cron settle-campaign → transfer-bevis
   skapas automatiskt, M15-notis "Utbetalning på väg".
5. Insamlaren postar resultat-bevis i `/insamling/[id]` → granskaren
   ser i `/granskning/bevis` → godkänner → trigger slut_transparens_loop
   sätter `avslutad_levererad` + badge `resultat_levererat` + notiserar
   alla tidigare donatorer.

---

## Vad som kvarstår strukturellt (parkerat med flagga)

### M2-wizardlyft
- Dubblettvarning vid skapande (M11 B5.1) — kräver att skapande-wizarden
  i M2 visar liknande befintliga insamlingar baserat på kategori +
  hjälp-plats. Behöver utbyggd wizard.
- Collab-begäran från insamlar-dashboard — UI för att söka publicerad
  förening och skicka begäran. RPCs finns (`begar_collab`); bara UI
  saknas på insamlings-detalj/redigera.

### M15 e-post-leverans
- Notiser med `epost_status='kvar'` ligger i kö. Edge Function som
  läser kön och POSTar via Resend (med digest-sammanslagning, max
  1 mejl/dygn) behöver byggas. Kan plockas när Resend-nyckeln är satt.
- Push-notifications är helt oimplementerat (behöver Web Push + service
  worker).

### Pop-formler & finkalibrering
- M11 popularitetspoäng använder `insamlat_ore` som proxy; den
  fleranfaktoriella formeln (antal donationer + takt + engagement)
  byggs när data finns.
- M11 dubblettvarning (B5.1) — se ovan.

### Annat
- Auto-fallback för obesvarad collab efter 14 dagar — kräver pg_cron-jobb
  (kan modellas på `settle-due-insamlingar-hourly`-mönstret).
- "Stor-gåva-flagg" (M4 B1.3 + M16) → parkerat tills M16 byggs.
- Footer-länkar (M19 B2) — innehållssystem för informationsidor +
  juridiska sidor — byggs i framtida Bygg-grupp C.

---

## Öppna frågor från 02-Stripe — status oförändrad

| # | Fråga | Status |
|---|---|---|
| 1 | Swish via Stripe i Connect | Bekräftad (Tillägg A3). Slås på via env-flagga efter kort-flödet sett produktion. |
| 2 | Connect-API-form | Verifierad mot dok 2026-05-24 |
| 3 | Connect-webhooks vs plattforms-webhooks | Verifierad: båda secrets stöds |
| 4 | Payout-schema på Express | Verifierad: `manual` |
| 5–9 | Pris, refund-avgift, juridik, chargeback | Operativ uppföljning |
