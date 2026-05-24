# 02 — Stripe & pengaflöde

**Projekt:** Sadaqa Sweden *(arbetsnamn)*
**Datum:** 2026-05-23
**Vad detta är:** Den tekniska byggplanen för **pengarna** — hur Stripe Connect kopplas till Supabase, hur en donation blir en charge, hur webhooks håller databasen i synk, hur utbetalning/refund/chargeback verkställs i kod.
**Bygger på:** `00-Byggplan-oversikt.md` (teknikvalet), `1-Planering/Modul-05-Pengaflode.md` (pengaflödets beslut — den juridiska och ekonomiska sanningen), `1-Planering/Modul-04-Donator-flodet.md` (donationsflödet), `Modul-01-Insamling-som-objekt.md` Block 2 (mål/undermåls-policy), `1-Planering/Tillägg-Nya-beslut-2026-05-23.md` A1 (reviderad återbetalningsmodell).
**Hör ihop med:** Fil **01 Databasplan** (tabellerna nedan ägs där) och fil **03 BankID, auth & donationsflöde** (frontend-checkout + realtidsräknaren).

> **Läs så här.** M5 är *vad* och *varför* pengaflödet ser ut som det gör. Den här filen är *hur det byggs* — riktiga Stripe-objekt, event-namn, Edge Functions. Var beslutsam om **arkitekturen**. Där en aktuell Stripe-API-detalj kan ha ändrats står antagandet **uttryckligt** i texten och i avsnitt 9. Bygg inte runt en osäkerhet tyst — flagga den (byggregel 10, fil 00).

---

## 0. Snabböversikt — pengaflödet i ett svep

```
 Donator (M4 checkout, fil 03)
    │  belopp + insamlings-id + ev. frivilligt bidrag
    ▼
 Edge Function: create-payment-intent
    │  skapar PaymentIntent PÅ PLATTFORMSKONTOT (separate charges and transfers)
    ▼
 Stripe behandlar betalning (Swish / kort)
    │
    ▼  webhook: payment_intent.succeeded
 Edge Function: stripe-webhook  ──▶  Supabase Postgres
    │  signaturverifiering + idempotens                 donations-rad: status=succeeded
    │                                                   insamlings insamlat_belopp +=
    ▼
 Supabase Realtime sänder nytt belopp ──▶ frontend-räknaren (fil 03)

 ... insamlingen är AKTIV, medel ackumuleras på PLATTFORMENS Stripe-balans ...

 deadline passerar  →  pg_cron-jobb stänger insamlingen  →  Edge Function: settle-campaign
    │  räknar utfall (mål nått / undermål) — pengarna flödar framåt oavsett
    ├──▶ Transfer till insamlarens connected account   (ALLA donationer)
    │       undermål → ingen auto-refund: förlängning ELLER medlen används
    │       som de är för en skalad insats (M7-rapportering)
    └──▶ Refund av charge   (UNDANTAG — bara vid bedrägeri/fel, ej missat mål)
              │
              ▼  manuell, plattformsstyrd Payout
         insamlarens svenska bankkonto
```

> **OBS — återbetalningsmodellen reviderad (Tillägg-Nya-beslut-2026-05-23 A1).** Den ursprungliga modellen (per-donation `undermal_val` `ge_anda`/`aterbetala`, automatisk refund vid undermål) **utgår**. Ny modell: pengarna flödar framåt — `settle-campaign` transfererar **alla** donationer vid stängning, oavsett om exakt mål nåddes. Missat mål utlöser **ingen** auto-refund; insamlingen förlängs en gång eller medlen används som de är. Refund-koden behålls men anropas **bara** som undantag vid bedrägeri (`nedstängd`) eller fel (missad/felaktig donation). `undermal_val` som charge-metadata och beslutspunkt utgår. Avsnitt 2.2, 5.2, 5.3 och beslutsloggen är uppdaterade enligt detta.

**Tre saker att aldrig glömma:**
1. **Charge görs på plattformskontot, inte direkt mot insamlaren.** Det är det som ger plattformen kontroll vid stängning och gör refund vid bedrägeri/fel möjlig innan transfer (M5 Block 2.2).
2. **Webhooks är enda sanningen för betalstatus.** Klienten får aldrig skriva "betald" (byggregel 7, fil 00).
3. **Stripe är sanningen för pengarörelser. Databasen speglar.** Webhooks synkar. Databasen ljuger aldrig för Stripe.

---

## 1. Stripe Connect-arkitektur i kod-termer

### 1.1 Två sorters Stripe-konton

| Konto | Vad | I koden |
|---|---|---|
| **Plattformskontot** | Sadaqa Swedens (föreningens) eget Stripe-konto. Orkestrerar. Charges görs här. | `STRIPE_SECRET_KEY` — plattformens hemliga nyckel. Alla API-anrop utgår härifrån. |
| **Connected account (Express)** | Ett separat Stripe-konto per **insamlare** och per **förening**. Insamlingens medel transfereras hit vid deadline. | Stripe-id `acct_...`. Lagras i databasen, se avsnitt 4. Anrop *för* ett connected account görs antingen med `Stripe-Account`-header eller via `destination` på en Transfer. |

**Beslut (från M5 Block 1.2):** kontotyp = **Stripe Connect Express**. Stripe sköter hostad onboarding (identitet, bankkonto, KYC); plattformen behåller payout-kontroll. *Standard* för tungt, *Custom* onödigt utvecklingsarbete.

> **Antagande → öppen fråga 1.** Stripes Connect-kontotyper och deras exakta namn/kapabiliteter utvecklas. "Express-liknande hostad onboarding + plattformsstyrd payout" är robust som arkitektur. Exakt produktnamn/konfiguration (inkl. om man skapar konto via `accounts.create` med `type: 'express'` eller via den nyare controller-baserade konfigurationen) **verifieras mot Stripes aktuella Connect-dokumentation vid byggstart.**

### 1.2 Onboarding av insamlaren — Account Links

Onboarding sker som en del av insamlar-flödet (M2), men den tekniska sanningen bor här. Insamlingen kan **inte gå `aktiv`** förrän insamlaren har ett verifierat connected account (M5 Block 1.3 — M6-identitet OCH Stripe-verifiering måste båda vara gröna).

**Stegen i kod:**

1. Insamlaren är granskningsgodkänd (M3) och saknar connected account.
2. **Edge Function `create-connected-account`:**
   - Anropar Stripe: skapa ett Express connected account (`accounts.create`). Sätt `country: 'SE'`, `email`, och `capabilities` för att ta emot betalningar och payouts (`card_payments`, `transfers` — exakt capability-namn verifieras, öppen fråga 1).
   - Privatperson → `business_type: 'individual'`. Förening → `business_type: 'company'` (kräver org.nr + firmatecknare, M5 Block 1.3).
   - Sparar det returnerade `acct_...`-id:t i databasen (`connected_accounts`-tabellen, avsnitt 4).
3. **Edge Function `create-account-link`:**
   - Anropar Stripe `accountLinks.create` med `account: acct_...`, `type: 'account_onboarding'`, samt `return_url` och `refresh_url` (sidor på plattformen).
   - Returnerar en **hostad Stripe-URL**. Frontend skickar insamlaren dit.
4. Insamlaren lämnar identitet + **svenskt bankkonto** direkt till Stripe. **Plattformen ser aldrig bankkontonumret.**
5. **Webhook `account.updated`** kommer in när Stripe verifierat. Edge Function läser `charges_enabled`, `payouts_enabled`, `details_submitted` och uppdaterar `connected_accounts.onboarding_status`.
6. När kontot kan ta emot charges + payouts → insamlingen får publiceras → `aktiv` (M1 Block 3).

**Account Links är kortlivade.** En länk går ut snabbt. Om insamlaren inte hinner klart genererar plattformen en ny via `refresh_url` → `create-account-link` igen. Bygg den loopen.

**Kantfall (M5 Block 1.3):** granskningsgodkänd men Stripe-onboarding aldrig slutförd → insamlingen fastnar i "godkänd men ej publicerbar". Påminnelse via M15. Ingen donation utan verifierad mottagare — det är rätt.

### 1.3 Föreningens eget connected account

Föreningen (Sadaqa Sweden själv) har **också** ett connected account — destination för det **frivilliga bidraget** (avsnitt 5.4 / M5 Block 5.4). Lagras som en rad i `connected_accounts` märkt som föreningens, eller som en konstant `PLATFORM_ASSOCIATION_ACCOUNT_ID` i miljövariabel. Hålls strikt åtskilt från varje insamlings medel.

### 1.4 Vad som lagras — och var sanningen bor

**Princip:** Stripe äger pengarörelserna. Databasen **speglar**. Vi lagrar Stripe-**id:n** (referenser), aldrig kortdata, aldrig bankkontonummer. Detaljerna i avsnitt 4.

---

## 2. Charge-flödet tekniskt — separate charges and transfers

Detta är hela plattformens hemlighet (M5 Block 2). **Vald modell: separate charges and transfers** — charge på plattformskontot, transfer till insamlaren *senare* (vid deadline). *Inte* destination charges (då sitter pengarna hos insamlaren direkt → plattformen tappar kontroll vid stängning och refund vid bedrägeri/fel före transfer blir omöjlig).

### 2.1 När en donation görs

Donatorn slutför M4-checkouten (fil 03 detaljerar frontend). Steg:

1. **Edge Function `create-payment-intent`** anropas med: belopp (öre, SEK), `campaign_id`, ev. frivilligt bidrag (öre), donatorns e-post.
2. Funktionen skapar en **PaymentIntent på plattformskontot** (alltså *utan* `Stripe-Account`-header — anropet körs som plattformen själv):

   ```ts
   // Edge Function: create-payment-intent  (skiss)
   const pi = await stripe.paymentIntents.create({
     amount: gava_ore + frivilligt_bidrag_ore,   // total charge
     currency: "sek",
     payment_method_types: ["card"],             // + Swish när verifierat, se avsnitt 8
     transfer_group: `campaign_${campaign_id}`,  // binder ihop charges + transfer
     metadata: {
       campaign_id,
       gava_ore,                                 // insamlingens del
       frivilligt_bidrag_ore,                    // föreningens del
       donator_email,
       enhetsantal,                              // M4 per-enhet-display
     },
   });
   // returnera pi.client_secret till frontend
   // Obs: inget undermal_val längre — pengarna flödar framåt (Tillägg A1).
   ```

   - **`transfer_group`** = ett id per insamling (`campaign_<id>`). Ryggraden i bokföringen (avsnitt 2.3).
   - **`metadata`** bär allt vi behöver för att senare veta vad varje charge ska bli. Stripe är sanningen — metadata gör Stripe-objektet självförklarande.
   - **`amount`** är total: gåva **plus** frivilligt bidrag. Uppdelningen sker vid settlement (avsnitt 5.4), inte här.
3. Frontend bekräftar betalningen mot Stripe med `client_secret` (Swish/kort). Plattformen rör aldrig kortdata — Stripe gör allt (PCI hos Stripe).
4. Betalning lyckas → pengarna ligger på **plattformens Stripe-balans**, öronmärkta mot insamlingen via `transfer_group` + metadata. **Ingen transfer görs ännu.**
5. **Webhook `payment_intent.succeeded`** (avsnitt 3) är det som skriver `donations`-raden till `succeeded` och ökar insamlingens insamlade belopp. **Inte** klienten.

### 2.2 Medlen hålls till deadline — kritiskt

Under hela `aktiv`-fasen ackumuleras charges på plattformsbalansen. **Ingen transfer.** Detta bekräftar M1 Block 2 Fält 4: eftersom ingen transfer skett kan varje charge refunderas → refund vid bedrägeri/fel är tekniskt möjlig fram tills medlen transfererats. Det är inte längre en undermåls-mekanik — pengarna flödar framåt vid undermål (Tillägg A1) — men fönstret att stoppa en upptäckt fejk innan utbetalning finns kvar.

**Vid deadline** (pg_cron stänger insamlingen, M1 Block 3):

1. **pg_cron-jobb** kör schemalagt, hittar insamlingar vars `deadline < now()` och status `aktiv` → sätter status `stängd`.
2. **Edge Function `settle-campaign`** triggas (av cron-jobbet eller en kö):
   - Räknar utfallet: mål nått / undermål (M1 Block 2 — fast: 100 %; intervall: lägstanivå; öppet: ej relevant).
   - **Pengarna flödar framåt oavsett utfall** (Tillägg A1) — `settle-campaign` transfererar **alla** insamlingens donationer, både vid nått mål och vid undermål.
   - **Vid undermål görs ingen auto-refund.** Insamlingen kan i stället förlängas en gång (M1 Block 2 Fält 5 — kort förlängning auto-godkänns, längre kräver granskare) eller använda medlen som de är för en skalad insats. `settle-campaign` skiljer alltså på två fall: (a) insamlingen ska **förlängas** → skjut stängningen, ingen settlement än; (b) insamlingen ska **avräknas som den är** (mål nått ELLER undermål utan förlängning) → transferera alla donationer.
   - Utfallet rapporteras via transparens-loopen (M7).
   - För donationer som ska transfereras: skapar **Transfer** (avsnitt 5.1).
   - **Refund anropas inte här som rutin.** Refund-koden (avsnitt 5.2) körs bara som undantag — vid bedrägeri (`nedstängd`, admin) eller fel.
3. Efter transfers → **manuell, plattformsstyrd Payout** (avsnitt 5.1).

> **Antagande → öppen fråga 2.** "Separate charges and transfers" är en etablerad Stripe Connect-mekanik. Exakt API-form (PaymentIntent på plattformskontot + senare `transfers.create` med `destination` och `transfer_group`) verifieras mot Stripes aktuella Connect-dokumentation vid byggstart. Arkitekturen — "charge på plattformen, transfer senare" — håller oavsett API-detaljer.

### 2.3 transfer_group — håll ordning på pengarna

Varje insamlings charges OCH dess kommande transfer binds med samma **`transfer_group`** (`campaign_<id>`). Det gör att vi vid deadline kan:
- Summera exakt vad insamlingen fått in.
- Veta vilka charges som ska transfereras vs refunderas.
- Hålla bokföringen ren — varje krona spårbar till en insamling.

Detta är också ryggraden i transparensen (M7).

### 2.4 Kantfall i charge-flödet (M5 Block 2.4)

| Kantfall | Hantering i kod |
|---|---|
| **Charge påbörjad före deadline, slutförs strax efter** | En PaymentIntent skapad medan insamlingen var `aktiv` får slutföras (kort kulansmarginal). `settle-campaign` väntar in svävande PaymentIntents innan den räknar utfall, eller `payment_intent.succeeded` strax efter midnatt accepteras om PI:n skapades före deadline. |
| **Strikt nya betalningsförsök efter deadline** | `create-payment-intent` kollar insamlingens status — är den `stängd` → returnera fel, ingen PI skapas. |
| **Betalningen misslyckas** | Webhook `payment_intent.payment_failed` → `donations`-raden sätts `failed` (eller skapas aldrig som `succeeded`). Inget halvt tillstånd. Donatorn ser felet, försöker igen. |
| **Insamlingen `pausad` mitt i aktiv fas** | `create-payment-intent` avvisar nya charges. Befintliga charges ligger kvar på plattformsbalansen — ingen transfer, ingen refund — tills granskaren avgör. |
| **Dubbeldebitering / donator klagar** | Manuell refund via `settle`-verktyg / admin (M16) + Stripes egna verktyg. |

---

## 3. Webhooks — Supabase Edge Functions

**Webhooks är enda sanningen för betalstatus.** Klienten säger aldrig "betald" (byggregel 7, fil 00). En `succeeded`-respons i frontend är en *indikation*; webhooken är *beviset*.

### 3.1 Mottagaren — en Edge Function

En enda Supabase Edge Function, **`stripe-webhook`**, är den publika endpoint Stripe postar till. Den:

1. **Verifierar signaturen** (avsnitt 3.3).
2. **Kollar idempotens** (avsnitt 3.4).
3. **Dispatchar på `event.type`** till rätt hanterare.
4. Svarar `200` snabbt. Tungt arbete läggs i en kö / hanteras kort — Stripe återförsöker om svaret dröjer eller felar.

> **Connect-webhooks.** Events från connected accounts (t.ex. `account.updated`, vissa transfer-/payout-events) levereras som **Connect-webhooks** och bär ett `account`-fält. Plattformsevents (charges på plattformskontot) kommer på plattformens egen webhook-endpoint. Bygg `stripe-webhook` så den hanterar båda — antingen två endpoints eller en endpoint som grenar på om `event.account` finns. Exakt uppdelning verifieras mot Stripes Connect-webhook-dokumentation (öppen fråga 1).

### 3.2 Events vi lyssnar på

| Event | Vad det betyder | Vad `stripe-webhook` gör |
|---|---|---|
| `payment_intent.succeeded` | En donation gick igenom | Sätt `donations.status = succeeded`, fyll i `stripe_charge_id`. Öka insamlingens `insamlat_belopp`. Trigga kvitto (M4/Resend). → realtidsräknaren (avsnitt 6). |
| `payment_intent.payment_failed` | Betalning misslyckades | Sätt `donations.status = failed`. Ingen beloppsökning. |
| `payment_intent.processing` | Swish/asynkron metod väntar | Sätt `donations.status = processing`. Vänta på `succeeded`/`failed`. |
| `charge.refunded` | En charge har refunderats (helt) | Sätt `refunds.status = succeeded`, `donations.status = refunded`. Minska insamlingens `insamlat_belopp`. Trigga donator-notis (M15). |
| `charge.dispute.created` | Chargeback öppnad av donatorns bank | Skapa `disputes`-rad. Flagga insamlingen/insamlaren → M16-larm (avsnitt 5.5). |
| `charge.dispute.closed` | Chargeback avgjord (vunnen/förlorad) | Uppdatera `disputes`-raden med utfallet. |
| `transfer.created` | Transfer till connected account skapad | Sätt `transfers.status = paid` (eller `pending`), fyll i `stripe_transfer_id`. |
| `transfer.reversed` | Transfer återförd | Uppdatera `transfers`-raden. |
| `payout.paid` | Payout nådde insamlarens bankkonto | Markera insamlingen `utbetald` (M1 Block 3) → triggar utbetalningsbeviset (M7). |
| `payout.failed` | Payout misslyckades (t.ex. stängt bankkonto) | Flagga för admin (M16). Insamlaren får uppdatera bankuppgifter via Stripe. |
| `account.updated` | Connected accounts status ändrad | Läs `charges_enabled` / `payouts_enabled` / `details_submitted` → uppdatera `connected_accounts.onboarding_status`. Styr om insamlingen får gå `aktiv`. |

> **Antagande → öppen fråga.** Exakta event-namn för transfer/payout/dispute i Connect-kontext (vilka som är plattforms-events vs connected-account-events, och om t.ex. `payout.*` levereras på connected-account-webhooken) verifieras mot Stripes aktuella event-katalog vid byggstart. Listan ovan är arkitektoniskt rätt; namnen finjusteras mot dokumentationen.

### 3.3 Signaturverifiering

Stripe signerar varje webhook-request med en hemlighet. `stripe-webhook` **måste** verifiera den innan något görs:

```ts
// Edge Function: stripe-webhook  (skiss)
const sig = req.headers.get("stripe-signature");
const body = await req.text();                 // RÅ body krävs — inte JSON-parsad
let event;
try {
  event = await stripe.webhooks.constructEventAsync(
    body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")
  );
} catch (err) {
  return new Response("Invalid signature", { status: 400 });
}
```

- Använd den **råa request-bodyn** — inte en re-serialiserad JSON. Verifieringen slår fel annars.
- `STRIPE_WEBHOOK_SECRET` är en **miljövariabel** (Supabase secrets), aldrig i koden/git (byggregel 9).
- Misslyckad verifiering → `400`, gör ingenting. En overifierad request kan vara en angripare.
- Connect-webhook och plattforms-webhook kan ha **olika** webhook-secrets — lagra båda.

### 3.4 Idempotens — samma event bokförs aldrig två gånger

Stripe **återförsöker** webhooks (vid timeout, 5xx, nätfel). Samma event kan komma in flera gånger. Utan skydd skulle insamlingens belopp ökas dubbelt.

**Lösning — en `webhook_events`-tabell som idempotensnyckel:**

1. Varje Stripe-event har ett unikt `event.id` (`evt_...`).
2. `stripe-webhook` försöker `INSERT` `event.id` i `webhook_events` med en **UNIQUE-constraint**.
3. **Insert lyckas** → eventet är nytt → bearbeta det.
4. **Insert ger unique-violation** → eventet är redan sett → svara `200` direkt, gör ingenting.
5. Lagra utfall/tidsstämpel på raden så vi kan felsöka.

```sql
-- ägs av fil 01, visas här för sammanhang
create table webhook_events (
  stripe_event_id text primary key,   -- evt_... — idempotensnyckeln
  event_type      text not null,
  received_at     timestamptz default now(),
  processed_at    timestamptz,
  status          text default 'received'   -- received | processed | error
);
```

**Dessutom:** alla skrivningar som ett event utlöser körs så långt möjligt i **en databastransaktion** (uppdatera `donations` + öka `insamlat_belopp` + markera `webhook_events`-raden i ett svep) → antingen allt eller inget. Halvbokförda events får inte finnas.

---

## 4. Koppling databas ↔ Stripe

**Principen (M5 Block 7 + byggregel 7):** **Stripe är sanningen för pengarörelser. Databasen speglar Stripe. Webhooks synkar.** Databasen lagrar Stripe-**id:n** som referenser — aldrig kortdata, aldrig bankkontonummer. Tabellerna nedan **ägs och definieras i detalj av fil 01 (Databasplan)** — här visas bara vilka Stripe-id:n som speglas var.

### 4.1 Vilka Stripe-id:n speglas, och i vilken tabell

| Stripe-objekt | Stripe-id (prefix) | Tabell | Kolumn | Not |
|---|---|---|---|---|
| Connected account | `acct_...` | `connected_accounts` | `stripe_account_id` | Ett per insamlare/förening. Plus `onboarding_status`, `charges_enabled`, `payouts_enabled`. |
| Insamling ↔ konto | — | `campaigns` | `connected_account_id` (FK) | Insamlingen pekar på insamlarens connected account. |
| PaymentIntent | `pi_...` | `donations` | `stripe_payment_intent_id` | Skapas vid donation. |
| Charge | `ch_...` | `donations` | `stripe_charge_id` | Fylls av `payment_intent.succeeded`-webhooken. |
| transfer_group | `campaign_<id>` | `campaigns` | `transfer_group` | Ett per insamling, binder charges + transfer. |
| Transfer | `tr_...` | `transfers` | `stripe_transfer_id` | Skapas vid settlement. Pekar på insamling + connected account. |
| Refund | `re_...` | `refunds` | `stripe_refund_id` | Pekar på donationen som refunderades. |
| Payout | `po_...` | `payouts` | `stripe_payout_id` | Payout från connected account till bankkonto. |
| Dispute (chargeback) | `dp_...` | `disputes` | `stripe_dispute_id` | Skapas av `charge.dispute.created`. Pekar på donation + insamling. |
| Webhook-event | `evt_...` | `webhook_events` | `stripe_event_id` (PK) | Idempotensnyckel (avsnitt 3.4). |

### 4.2 Spegelns regler

- **Webhooks skriver, inte klienten.** Pengastatus (`succeeded`, `refunded`, `paid`) sätts uteslutande av `stripe-webhook`. Frontend och vanliga klienter har via RLS **ingen** skrivrätt på de kolumnerna (fil 01 spikar RLS-policyerna).
- **Edge Functions skriver med service role** — de kringgår RLS medvetet och kontrollerat, för de *är* den betrodda parten. Vanliga användarsessioner gör det aldrig.
- **`insamlat_belopp` på `campaigns`** är ett **speglat aggregat** — summan av `succeeded` donationer minus refunds. Det uppdateras av webhooks. Om det driftar mot Stripe är Stripe rätt → ett avstämningsjobb (avsnitt 7) kan räkna om det.
- **Avstämning:** ett schemalagt pg_cron-jobb kan periodiskt jämföra databasens speglade belopp mot Stripes faktiska balans/charges per `transfer_group` och larma vid avvikelse. Stripe vinner alltid en konflikt.

---

## 5. Utbetalning, refund, chargebacks

### 5.1 Utbetalning — transfer + payout

Två steg (M5 Block 3.1):
- **Transfer** = plattformens Stripe-balans → insamlarens connected account (Stripe-internt).
- **Payout** = connected account → insamlarens **svenska bankkonto** (lämnar Stripe).

**`settle-campaign` skapar transfern:**

```ts
// inom settle-campaign, per insamling där medel ska till insamlaren
const transfer = await stripe.transfers.create({
  amount: netto_till_insamlaren_ore,        // gåvor minus Stripe-avgift (avsnitt 5.6)
  currency: "sek",
  destination: connected_account_id,        // acct_...
  transfer_group: `campaign_${campaign_id}`,
  metadata: { campaign_id },
});
```

**Payout-tajming — beslut (M5 Block 3.3):** payouts på connected accounts sätts till **manuell payout-styrning**; plattformen utlöser payout efter att transfern gjorts vid deadline. Det förhindrar att pengar betalas ut för tidigt under fönstret mellan transfer och refund-avstämning. En liten fördröjning (riktmärke några dagar efter stängning) ger marginal att fånga fel.

> **Antagande → öppen fråga 4.** På vissa Express-konfigurationer äger Stripe payout-schemat. Om plattformsstyrd manuell payout inte går: **reservplan** — håll medlen som *otransfererade* på plattformsbalansen, gör transfern först vid deadline, låt payout sedan löpa på Stripes schema. Båda vägar bevarar kärnkravet: **inga pengar når insamlaren före deadline.** Verifieras vid byggstart.

**Statusbyte:** `payout.paid`-webhooken markerar insamlingen `utbetald` (M1 Block 3) → triggar utbetalningsbeviset i M7.

**Kantfall (M5 Block 3.5):** stängt bankkonto → `payout.failed` → admin-flagga, insamlaren uppdaterar bankuppgifter via Stripe Express, payout görs om. Insamlaren avlider/försvinner → pengarna är intakta på Stripe, admin-ärende. Inget förloras.

### 5.2 Refund — undantaget

**Refund är ett undantag, inte en rutin** (M5 Block 4, reviderad enligt Tillägg A1). Ett **missat mål utlöser ingen refund** — pengarna flödar framåt. Refund-koden behålls men anropas bara i två fall:

| Situation | Vilka donationer | Triggas av |
|---|---|---|
| **Bedrägeri** | **Alla** donationer på insamlingen. Upptäckt i valfritt skede | Admin (M16), vid `nedstängd` |
| **Fel** | En enskild missad/felaktig donation (t.ex. dubbeldebitering) | System/admin, manuellt vid behov |

`settle-campaign` anropar alltså **inte** refund som del av normal stängning — den transfererar alla donationer (avsnitt 2.2).

**Refund i kod:**

```ts
const refund = await stripe.refunds.create({
  payment_intent: stripe_payment_intent_id,   // hela gåvan; v1 refunderar inte delar
  metadata: { campaign_id, refund_reason },   // refund_reason: bedrageri | fel
});
```

- Så länge ingen transfer gjorts (medlen ligger på plattformsbalansen) är detta okomplicerat — charge refunderas direkt.
- Webhook `charge.refunded` skriver `refunds.status` + `donations.status = refunded` och minskar `insamlat_belopp`.
- Donatorn notifieras (M15 — pengar-relaterad notis, går alltid fram).
- **v1 refunderar hela gåvor, inte delar** (M5 Block 4.6).

**Bedrägeri efter payout** (det dyra scenariot, M5 Block 4.3): pengarna är redan hos insamlaren → refund från plattformsbalansen går inte → pengarna återkallas i den mån det går med juridiska medel (återkrav, ev. polisanmälan). Arkitekturen minimerar fönstret (medel hålls till deadline + granskning före publicering) men eliminerar det inte.

### 5.3 Vem bär refund-avgiften (M5 Block 4.4)

Stripe behåller i de flesta fall den ursprungliga charge-avgiften vid refund. **Beslut: plattformen (föreningen) bär den icke-återbetalbara avgiften. Donatorn får alltid 100 % tillbaka.** Det frivilliga bidraget är bufferten. I koden: refunden avser **hela** det belopp donatorn gav — plattformen absorberar avgiftsförlusten, den läggs aldrig på refund-beloppet.

> **Antagande → öppen fråga 6.** Stripes exakta avgiftsbehandling vid refund varierar (kort vs Swish, region). Beslutet — donatorn skadeslös, plattformen bär mellanskillnaden — gäller oavsett. Exakt belopp att budgetera verifieras mot Stripes aktuella villkor.

### 5.4 Chargebacks

En chargeback (`charge.dispute.created`) är när donatorns **bank** bestrider betalningen — utanför plattformens kontroll. Den drar **belopp + avgift** (riktmärke ~150 kr) från insamlarens Stripe-saldo.

**I kod:**
- `charge.dispute.created`-webhook → skapa `disputes`-rad, koppla till donation + insamling.
- **Varje chargeback matar M16:s bedrägerilarm.** En enstaka är brus; ett mönster på samma insamling/insamlare är ett ärende (avsnitt 5.5).
- `charge.dispute.closed` → uppdatera raden med utfallet.

**Vem bär den — beror på när (M5 Block 4.5):**

| Tidpunkt | Var pengarna finns | Vem bär det |
|---|---|---|
| **Före utbetalning** | Kvar hos Stripe (ingen transfer/payout) | Ren situation. Beloppet dras från medel som ändå inte hunnit ut. Chargeback-avgiften bärs av plattformen (samma logik som refund-avgiften). |
| **Efter utbetalning** | Redan hos insamlaren | Insamlaren ansvarar — belopp + avgift dras från insamlarens Stripe-saldo. Plattformen bär **bara i sista hand** (insamlaren insolvent, saldot räcker inte) — sällsynt, litet belopp. |

> **Antagande → öppen fråga 9.** Exakt chargeback-avgift (~150 kr är planeringsantagande), svarsfönster, bevisinlämning och kort-vs-Swish-skillnader verifieras mot Stripes aktuella villkor. Principbeslutet — *före utbetalning ren, efter utbetalning insamlarens ansvar, plattformen i sista hand* — gäller oavsett belopp.

### 5.5 Stora gåvor & bedrägerisignaler

- Mycket stor enskild gåva (riktmärke >50 000 kr, M4 Block 1.3) → flagga internt för admin (M16) — penningtvätts-medvetenhet, stoppas inte.
- Mönster av chargebacks → M16-larm.
- Dessa flaggor skrivs av Edge Functions/webhook-hanterare till en larm-/flagg-tabell som M16 läser.

### 5.6 Avgifter i koden (M5 Block 5)

- **Plattformsavgift = 0 kr.** Inget `application_fee` på charges. Plattformen drar inget.
- **Stripe-avgiften bärs av insamlaren** — den dras på plattformskontot vid charge; vid transfer beräknar `settle-campaign` **nettobeloppet** (gåvor minus Stripes avgift) och transfererar det. Insamlaren får netto.
- **Frivilligt bidrag — strikt åtskilt.** En charge, men metadata delar den: `gava_ore` → insamlarens connected account vid transfer; `frivilligt_bidrag_ore` → **föreningens** connected account (separat transfer, eller behålls på plattformsbalansen som föreningens intäkt). De får **aldrig** blandas — `transfer_group` per insamling + separat hantering av bidragsposten är skyddet. En krona avsedd för bönemattor får aldrig hamna i föreningens drift.

> **Antagande → öppen fråga 5.** Exakta Stripe-priser för Sverige (kort + Connect-avgiftskomponenter) verifieras mot aktuell prislista innan siffror visas för insamlare.

---

## 6. Realtidsräknaren — pengasidan

Hela kedjan, pengadelen:

1. Donatorn betalar → `payment_intent.succeeded`-webhook.
2. `stripe-webhook` (efter signatur + idempotens) skriver i **en transaktion**: `donations.status = succeeded` + ökar `campaigns.insamlat_belopp` med donationens gåvodel.
3. Denna `UPDATE` på `campaigns` är den händelse **Supabase Realtime** plockar upp.
4. Realtime sänder det nya beloppet till alla anslutna klienter på insamlingssidan.

**Pengasidan slutar här.** Webhook bekräftar charge → databasen uppdateras → Realtime sänder. **Frontend-delen** — hur räknaren prenumererar, animerar och visar — **detaljeras i fil 03 (BankID, auth & donationsflöde, avsnittet realtidsräknaren). Korsreferens dit.**

Refund speglar: `charge.refunded` → `insamlat_belopp` minskar → Realtime sänder nedjusteringen.

**Viktigt:** räknaren rör sig **bara** på webhook-bekräftad betalning. En klient som "tror" den betalat ändrar aldrig siffran. Webhook är sanningen (byggregel 7).

---

## 7. Säkerhet

| Princip | I praktiken |
|---|---|
| **Webhooks är enda sanningen för betalstatus** | `donations.status`, `insamlat_belopp`, `transfers`, `payouts`, `refunds` skrivs bara av `stripe-webhook` / Edge Functions. Klienten har ingen skrivrätt (RLS, fil 01). En frontend-"success" är aldrig bokföring. |
| **Signaturverifiering** | Varje webhook verifieras mot `STRIPE_WEBHOOK_SECRET` på rå body innan något görs. Misslyckas → `400`, gör inget. |
| **Idempotens** | `webhook_events`-tabell med UNIQUE på `stripe_event_id`. Samma event bokförs aldrig två gånger. Skrivningar i en transaktion. |
| **Hemligheter i miljövariabler** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (plattform + Connect), Resend-nyckel m.m. som Supabase secrets — aldrig i koden eller git (byggregel 9). |
| **Plattformen rör aldrig kortdata** | All känslig betaldata hanteras av Stripe (Stripe Checkout / Stripe-driven betalkomponent). PCI-ansvaret hos Stripe. |
| **Plattformen ser aldrig bankkontonummer** | Insamlarens bankkonto lämnas direkt till Stripe i Account Link-flödet. |
| **Pengarna passerar aldrig föreningens bankkonto** | Charges på plattformens *Stripe-balans* (inom Stripes reglerade system), aldrig på föreningens bank. Det håller plattformen utanför betaltjänstlagen / Finansinspektionen (M5 Block 6). |
| **Edge Functions skriver med service role — medvetet** | Endast de betrodda funktionerna kringgår RLS. Vanliga sessioner aldrig. |
| **Idempotensnyckel även på utgående anrop** | Vid `transfers.create` / `refunds.create` använd Stripes `Idempotency-Key` så att ett återförsök från `settle-campaign` inte skapar dubbla transfers/refunds. |

---

## 8. Swish — MÅSTE verifieras före bygget av betaldelen

Swish ska finnas som betalmetod (M4 Block 3.1 — **obligatoriskt**, inte tillval). Antagandet i M4/M5 är att **Swish erbjuds som betalmetod genom Stripe**, så Swish-betalningar flyter in i exakt samma charge-/transfer-arkitektur som kort.

**Detta antagande MÅSTE verifieras innan betaldelen byggs — och det är osäkert. Var inte tvärsäker.**

Det som ska bekräftas, konkret:
1. **Stöder Stripe Swish som betalmetod alls** för svenska konton? (Stripe har lagt till svenska metoder över tid — men det ändras, och måste kollas mot aktuell dokumentation.)
2. **Fungerar Swish via Stripe för vårt *Connect*-upplägg** specifikt — separate charges and transfers, charge på plattformskontot, connected accounts? En betalmetod kan stödjas för vanliga charges men ha begränsningar i Connect-kontext.
3. **Swish är asynkront** — donatorn godkänner i Swish-appen. Det betyder `payment_intent.processing` → senare `succeeded`/`failed`. `stripe-webhook` måste hantera det asynkrona tillståndet (avsnitt 3.2).
4. **Swish-avgifter** kan skilja sig från kort — påverkar nettoberäkningen (avsnitt 5.6).
5. **Refund/chargeback för Swish** kan behandlas annorlunda än kort (avsnitt 5.3, 5.4).

**Om Swish INTE kan gå genom Stripe i vårt Connect-upplägg:** krävs en separat Swish-integration (Swish Handel via bank/PSP). Då måste Swish-pengaflödet designas om så att det ändå (a) håller medel till deadline och (b) går till rätt insamlare utan att passera plattformen juridiskt. **Det är ett stort omtag** och arkitekturbeslutet parkeras tills utredningen är klar.

> **Detta är den enskilt viktigaste tekniska osäkerheten i pengaflödet (M5 öppen fråga 1). Utreds FÖRE byggstart av betaldelen. Bygg inte `create-payment-intent` med Swish i `payment_method_types` förrän det är bekräftat — bygg kort först, lägg Swish när verifierat.**

---

## 9. Beslut & öppna frågor

### 9.1 Beslut (verkställda från M5)

| Beslut | I denna fil |
|---|---|
| Stripe Connect **Express** som kontotyp | Avsnitt 1.1 |
| Onboarding via **Account Links** (hostad Stripe-flow) | Avsnitt 1.2 |
| **Separate charges and transfers** — charge på plattformskontot, transfer senare | Avsnitt 2 |
| Medlen hålls på plattformens Stripe-balans **till deadline** | Avsnitt 2.2 |
| **Pengarna flödar framåt — missat mål ger ingen auto-refund** (Tillägg A1) | Avsnitt 0, 2.2 |
| **`settle-campaign` transfererar alla donationer; refund bara vid bedrägeri/fel** (Tillägg A1) | Avsnitt 2.2, 5.2 |
| `transfer_group` per insamling som bokföringsryggrad | Avsnitt 2.3 |
| Webhooks är **enda sanningen** för betalstatus | Avsnitt 3, 6, 7 |
| Signaturverifiering + idempotens via `webhook_events`-tabell | Avsnitt 3.3, 3.4 |
| **Stripe är sanningen, databasen speglar, webhooks synkar** | Avsnitt 4 |
| Manuell, plattformsstyrd payout efter deadline | Avsnitt 5.1 |
| Plattformen bär refund-avgiften; donatorn får 100 % | Avsnitt 5.3 |
| Chargeback: före utbetalning ren, efter = insamlarens ansvar | Avsnitt 5.4 |
| 0 kr plattformsavgift; insamlaren bär Stripe-avgiften (netto vid transfer) | Avsnitt 5.6 |
| Frivilligt bidrag strikt åtskilt — separat destination | Avsnitt 5.6 |
| Hemligheter i miljövariabler; plattformen rör aldrig kort-/bankdata | Avsnitt 7 |

### 9.2 Öppna frågor — verifieras före byggstart av betaldelen

| # | Fråga | Påverkar |
|---|---|---|
| 1 | **Swish via Stripe i Connect-upplägget** — viktigast. Stöds Swish som Stripe-betalmetod för svenska connected accounts? Om nej → separat integration + omdesign. | Avsnitt 8 — hela betaldelen |
| 2 | **Exakt Connect-API-form** — kontoskapande (`type: 'express'` vs controller-konfiguration), capability-namn, exakt form för PaymentIntent-på-plattform + senare Transfer. | Avsnitt 1.1, 2 |
| 3 | **Connect-webhooks vs plattforms-webhooks** — vilka events levereras var, en endpoint eller två, webhook-secret per endpoint. | Avsnitt 3.1, 3.2 |
| 4 | **Payout-schema på Express-konton** — kan plattformen styra manuell payout? Om inte → reservplan (transfer-tajming blir kontrollpunkten). | Avsnitt 5.1 |
| 5 | **Exakt Stripe-prissättning för Sverige** (kort + Connect-avgiftskomponenter) — innan siffror visas för insamlare. | Avsnitt 5.6 |
| 6 | **Stripes avgiftsbehandling vid refund** — hur mycket är icke-återbetalbart (kort vs Swish). | Avsnitt 5.3 |
| 7 | **Juridisk bekräftelse** — att separate charges and transfers via plattformskontot inte gör plattformen tillståndspliktig betaltjänst (svensk betaltjänstjurist, M5 Block 6). | Hela arkitekturen |
| 8 | **Exakta event-namn** för transfer/payout/dispute i Connect-kontext mot Stripes aktuella event-katalog. | Avsnitt 3.2 |
| 9 | **Chargeback-villkor** — exakt avgift (~150 kr antagande), svarsfönster, bevisinlämning, kort vs Swish. | Avsnitt 5.4 |

**Hård byggflagga:** betaldelen (Edge Functions `create-payment-intent`, `stripe-webhook`, `settle-campaign`) kan inte byggas färdigt förrän öppna frågor 1–4 är besvarade mot Stripes aktuella dokumentation. Bygg kort-flödet först, lägg Swish när öppen fråga 1 är grön. Verifiera mot dokumentationen — bygg inte runt en osäkerhet tyst (byggregel 10, fil 00).

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första tekniska planen för Stripe & pengaflöde. Stripe Connect-arkitektur (Express, Account Links), charge-flödet (separate charges and transfers, medel hålls till deadline), webhooks (Edge Function, signaturverifiering, idempotens via `webhook_events`), databas↔Stripe-spegling, utbetalning/refund/chargebacks, realtidsräknarens pengadel, säkerhet. Swish-osäkerheten flaggad som hård öppen fråga före byggstart. Verkställer besluten i M5. |
| 1.1 | 2026-05-24 | Återbetalningsmodell reviderad enligt Tillägg-Nya-beslut-2026-05-23 A1 — framåt-flöde, refund bara vid bedrägeri/fel. `settle-campaign` auto-refunderar inte längre vid undermål — den transfererar alla donationer och hanterar förlängning/medlen-används-framåt; refund-koden behålls men anropas bara vid bedrägeri/fel. `undermal_val` borttaget ur `create-payment-intent`-metadata. Avsnitt 0 (snabböversikt + OBS-not), 2.1, 2.2, 5.2 och beslutsloggen 9.1 uppdaterade. |
