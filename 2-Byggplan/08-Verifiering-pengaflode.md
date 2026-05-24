# 08 — Verifiering: pengaflödet (Steg 5–7, testläge)

**Datum:** 2026-05-24
**Vad detta är:** En komplett körbar verifiering av hela pengaflödet i Stripe **testläge**, end-to-end. Den vänder Steg 5–7 från *"strukturellt klart"* (kod finns) till *"verifierat"* (kod har kört och speglat verkligheten korrekt).
**Läs först:** `00-Byggplan-oversikt.md`, `02-Stripe-pengaflode.md`, `5-Kod/SESSION-GOAL.md`.

---

## 0. Beslutet bakom denna brief

Zivar beslutade 2026-05-24: **testa hela pengaflödet nu, innan Steg 12 byggs.**

Skäl: Steg 8–11 är redan byggda *ovanpå* antagandet att pengaflödet fungerar (notiser triggar på donation-events, transparens-bevis på transfer-events, profilers track record läser donationsdata). En bugg i plumbingen som upptäcks efter Steg 12–18 sitter i schema och triggers som allt annat redan litar på — dyr att gräva fram sent. Verifiera grunden innan fler våningar byggs.

**Avgränsning:**
- **Testläge.** `sk_test_…` / `pk_test_…`. Inga riktiga pengar.
- **Ingen BankID.** Verifiering v1 = Stripes egen KYC i Connect-onboardingen. BankID-brokern är ett separat spår, ej med här.
- **Ingen skarp lansering.** Föreningen, bankkonto, live-nycklar — allt det är finalen, inte detta.

---

## 1. Kedjan som testas

Pengaflödet är fem länkar. Testet går igenom dem i ordning. Brister en länk — stannar vi där, fixar, kör om.

```
[1] Insamlare onboardar Stripe Connect-konto  (Stripes KYC)
        ↓  account.updated-webhook → connected_accounts.status = enabled
[2] Insamling skapas → skickas in → granskas → godkänns
        ↓  fatta_granskar_beslut → status = aktiv + connected_account_id satt
[3] Gäst donerar  (Payment Element, inget login)
        ↓  create-payment-intent → donation-rad status = skapad
[4] Stripe bekräftar → webhook speglar i DB
        ↓  payment_intent.succeeded → donation = succeeded, insamlat_ore↑,
           realtidsbroadcast, kvitto
[5] Settle vid deadline → transfer till insamlaren
        ↓  settle-campaign → transfers-rad, insamling = stangd, utbetald_ore↑
```

---

## 2. Rollfördelning — vem gör vad

| Steg | Zivar | Claude Code |
|---|---|---|
| Stripe-konto, nycklar, webhook-endpoints | ✅ (eget Stripe-konto) | — |
| Deploya Edge Functions, sätta secrets/Vault | stödjer | ✅ (Supabase CLI / MCP) |
| Browser-flöden (onboarding-klick, donations-formulär) | ✅ | — |
| Verifiera DB-state efter varje checkpoint | — | ✅ (`execute_sql` via Supabase MCP) |
| Läsa Edge Function-loggar | — | ✅ (`get_logs` via Supabase MCP) |
| Diagnos + buggfix | godkänner | ✅ |

Testet är samarbete: Zivar klickar de mänskliga stegen, Code verifierar och fixar.

---

# DEL A — Zivars setup (engångs, innan testet)

Gör A1–A6 i ordning. A7 är valfritt. Räkna ~1 timme.

### A1 — Stripe-konto i testläge

1. Logga in på `dashboard.stripe.com`. Slå på **Testläge** (toggle uppe till höger).
2. Aktivera **Connect**: Stripe-dashboard → sök "Connect" → **Get started**. Välj plattformsupplägg (Express). Detta behöver bara göras en gång, i testläge räcker det att aktivera.

### A2 — Hämta nycklar

Stripe-dashboard (testläge) → **Developers → API keys**:
- **Secret key** → `sk_test_…`
- **Publishable key** → `pk_test_…`

Webhook-secrets (`whsec_…`) hämtas i **A5**, efter att endpointerna skapats.

### A3 — Var varje nyckel ska — VIKTIGT

Nycklar hör hemma på **två olika ställen**. Blandas de ihop fungerar inget. `.env.example` i repot är ofullständig — den här tabellen gäller.

| Nyckel / värde | Hör hemma i | Vem |
|---|---|---|
| `STRIPE_SECRET_KEY` = `sk_test_…` | Supabase → Edge Function **secrets** | Zivar |
| `STRIPE_WEBHOOK_SECRET` = `whsec_…` (platform-endpoint) | Supabase Function secrets | Zivar (efter A5) |
| `STRIPE_WEBHOOK_SECRET_CONNECT` = `whsec_…` (connect-endpoint) | Supabase Function secrets | Zivar (efter A5) |
| `NEXT_PUBLIC_SITE_URL` = `https://sadaqahsweden.se` | Supabase Function secrets | Zivar |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_…` | **Cloudflare** (frontend) env vars | Zivar |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Injiceras **automatiskt** i Edge Functions | ingen |
| `edge_functions_base_url` / `service_role_key` | Supabase → **Vault** (ej Function secrets) | Zivar (A6) |
| `RESEND_API_KEY` / `RESEND_FROM` | Supabase Function secrets | Zivar (A7, valfritt) |
| `PLATFORM_ASSOCIATION_ACCOUNT_ID` | — | hoppa över (tip-flödet, ej i test) |
| `STRIPE_ENABLE_SWISH` | — | lämna osatt (kort-flödet testas först) |

Sätt Supabase Function secrets via CLI:
```
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx NEXT_PUBLIC_SITE_URL=https://sadaqahsweden.se --project-ref dcfrvomfztgkbfoegwge
```
(eller Supabase-dashboard → Edge Functions → Secrets.)

### A4 — Deploya Edge Functions

Sex funktioner ska deployas. `_shared/` är inte en funktion — den bundlas in automatiskt av importerna.

| Funktion | verify_jwt |
|---|---|
| `create-connected-account` | true |
| `create-account-link` | true |
| `create-payment-intent` | true |
| `settle-campaign` | true |
| `skicka-kvitto` | true |
| `stripe-webhook` | **false** ← Stripe POSTar utan JWT; signaturen är autentiseringen |

Code deployar (Supabase CLI hanterar `_shared` + flaggan rent):
```
supabase functions deploy stripe-webhook --no-verify-jwt --project-ref dcfrvomfztgkbfoegwge
supabase functions deploy create-connected-account create-account-link create-payment-intent settle-campaign skicka-kvitto --project-ref dcfrvomfztgkbfoegwge
```

### A5 — Registrera webhook-endpoints (TVÅ stycken)

Funktionen tar emot på **en URL** men behöver **två endpoints** — events ligger på olika ställen i Stripe. Båda pekar på samma URL:

`https://dcfrvomfztgkbfoegwge.supabase.co/functions/v1/stripe-webhook`

Stripe-dashboard (testläge) → **Developers → Webhooks → Add endpoint**:

**Endpoint 1 — plattformens events** ("Events on your account"):
`payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.processing`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `transfer.created`, `transfer.reversed`, `transfer.updated`
→ kopiera **Signing secret** → `STRIPE_WEBHOOK_SECRET`

**Endpoint 2 — connected accounts events** ("Events on Connected accounts"):
`account.updated`, `payout.created`, `payout.paid`, `payout.failed`, `payout.canceled`
→ kopiera **Signing secret** → `STRIPE_WEBHOOK_SECRET_CONNECT`

Sätt båda i Supabase Function secrets (A3). Utan endpoint 2 flippar aldrig connected-account-status till `enabled` → donationer blockeras.

### A6 — Vault-secrets för pg_cron (utbetalnings-jobbet)

Cron-jobbet `settle-due-insamlingar-hourly` läser från Supabase **Vault** (inte Function secrets). Saknas de loggar jobbet bara `NOTICE` och hoppar — ingen felaktig pengaflyt, men ingen auto-settle.

Supabase-dashboard → **Project Settings → Vault → New secret** (×2):
- `edge_functions_base_url` = `https://dcfrvomfztgkbfoegwge.functions.supabase.co`  *(ingen trailing slash)*
- `service_role_key` = service-role-JWT (Project Settings → API → service_role)

### A7 — Resend (valfritt — kvitto-mejl)

Utan `RESEND_API_KEY` hoppar `skicka-kvitto` med `503 {pending:true}` — donationen lyckas ändå, bara mejlet uteblir. Vill du verifiera kvittot: skapa nyckel på `resend.com`, verifiera domän `sadaqahsweden.se`, sätt `RESEND_API_KEY` + `RESEND_FROM` i Function secrets.

---

# DEL B — Testkörningen (checkpoints)

Kör CP1 → CP9 i ordning. Varje checkpoint: **handling → förväntat → verifiera → om fel**. En röd checkpoint stoppar testet (se Del C).

Förbered ett testkonto för insamlaren (egen e-post du når) och ett för granskaren — Zivars eget konto kan vara granskare.

### CP0 — Seeda roller (Code)

En insamlare kräver normalt BankID. I testet kringgår vi det med direkt SQL.

```sql
-- testanvändarens profil → insamlare, bankid-flagga satt
update public.profiles
set roll = 'insamlare', bankid_verifierad = true
where e_post = '<insamlare-test@…>';

-- granskaren
update public.profiles set roll = 'granskare'
where e_post = '<granskare@…>';
```
⚠️ Triggern `private.profiles_skydda_falt` skyddar `roll` + `bankid_verifierad` — ändring kräver `service_role`. **Code:** kör via service_role-anslutning. Blockerar triggern ändå — slå av den i en transaktion (`alter table … disable trigger`), uppdatera, slå på igen. Bekräfta enum-värdena mot `0001_extensions_helpers_enums.sql` (`public.anvandar_roll`).

### CP1 — Insamlar-onboarding (Stripe KYC)

- **Handling (Zivar):** Logga in som insamlaren → gå till `/stripe/onboarding` → starta. Server-action anropar `create-connected-account` → `create-account-link` → du skickas till Stripes hostade onboarding. Fyll i testdata (Stripe accepterar fiktiva uppgifter i testläge; använd autofyll-knappen för identitet/bank). Slutför → du landar på `/stripe/onboarding/retur`.
- **Förväntat:** `account.updated`-webhook → connected-account flippar till `enabled`.
- **Verifiera (Code):**
  ```sql
  select profile_id, status, charges_enabled, payouts_enabled, details_submitted
  from public.connected_accounts;
  ```
  → `status='enabled'`, `charges_enabled=true`, `payouts_enabled=true`.
  ```sql
  select event_type, status from public.webhook_events order by created_at desc limit 5;
  ```
  → `account.updated` med `status='processed'`.
- **Om fel:** `charges_enabled=false` → endpoint 2 (A5) saknas/fel secret, eller KYC ej slutförd. Loggar: `get_logs` på `stripe-webhook`.

### CP2 — Skapa + skicka in insamling

- **Handling (Zivar):** Som insamlaren → skapa-wizarden → fyll obligatoriska fält, sätt en deadline nära i tiden, ladda upp en bild → skicka in till granskning.
- **Förväntat:** `insamling.status` går `utkast → inskickad`, en `granskning`-rad skapas.
- **Verifiera (Code):**
  ```sql
  select public_id, status, connected_account_id, insamling_deadline
  from public.insamling order by created_at desc limit 1;
  ```
  → `status='inskickad'`.
- **Om fel:** statusövergång nekad → `insamling_status_skydd`-triggern; läs felet i server-action-svaret.

### CP3 — Granska + godkänn

- **Handling (Zivar):** Logga in som granskaren → `/granskning` → öppna ärendet → godkänn.
- **Förväntat:** `fatta_granskar_beslut` sätter `inskickad → aktiv`. 0012-hooken `knyt_connected_account_till_insamling` sätter `connected_account_id` automatiskt (insamlaren har ett enabled-konto sedan CP1).
- **Verifiera (Code):**
  ```sql
  select public_id, status, connected_account_id from public.insamling
  order by created_at desc limit 1;
  ```
  → `status='aktiv'` **och** `connected_account_id` IS NOT NULL.
- **Om fel:** `connected_account_id` NULL trots enabled-konto → hooken kopplade inte; `account.updated`-backfill borde fånga det vid nästa account-event, men gräv i `0012`-hooken.

### CP4 — Gäst-donation

- **Handling (Zivar):** Öppna `/insamlingar/<public_id>/donera` i ett **inkognitofönster** (ingen inloggning). Välj belopp, ange e-post. Betala med Stripe testkort **`4242 4242 4242 4242`**, valfritt framtida utgångsdatum, valfri CVC/postnr.
- **Förväntat:** `create-payment-intent` skapar `donation`-rad `status='skapad'`; Payment Element bekräftar.
- **Verifiera (Code):**
  ```sql
  select public_id, status, belopp_ore, stripe_payment_intent_id
  from public.donation order by created_at desc limit 1;
  ```
  → en rad finns, `stripe_payment_intent_id` satt.
- **Om fel:** Payment Element renderas inte → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` saknas i Cloudflare-env. `409 connected-account…` → CP1/CP3 ej gröna.

### CP5 — Webhook speglar betalningen

- **Förväntat:** `payment_intent.succeeded` → `donation` flippas `succeeded`, `bekraftad=true`, `stripe_charge_id` + `stripe_avgift_ore` satta; `insamling.insamlat_ore` ökat.
- **Verifiera (Code):**
  ```sql
  select status, bekraftad, stripe_avgift_ore, stripe_charge_id from public.donation
  order by created_at desc limit 1;
  select insamlat_ore, insamlat_netto_ore from public.insamling order by created_at desc limit 1;
  select event_type, status, error_message from public.webhook_events
  order by created_at desc limit 5;
  ```
  → donation `succeeded`; `insamlat_ore` = gåvobeloppet; webhook `processed`.
- **Om fel:** webhook `status='error'` → läs `error_message` + `get_logs`. Ingen webhook alls → endpoint 1 (A5) eller `STRIPE_WEBHOOK_SECRET` fel.

### CP6 — Realtidsräknaren

- **Handling (Zivar):** Ha insamlingssidan `/insamlingar/<public_id>` öppen i en flik *under* CP4. Siffran ska röra sig när donationen landar (broadcast på kanal `campaign:<id>`, event `belopp_updated`).
- **Om fel:** siffran rör sig inte men CP5 är grön → frontend prenumererar inte rätt; data är korrekt i DB. Logga som frontend-bugg, blockerar inte pengaflödet.

### CP7 — Kvitto (om A7 gjordes)

- **Förväntat:** `skicka-kvitto` anropas av webhooken → mejl till `donator_epost`.
- **Verifiera:** mejl mottaget; `get_logs` på `skicka-kvitto` visar `resend_id`.
- **Om fel utan A7:** `503 {pending:true}` är förväntat — hoppa CP7.

### CP8 — Settle (utbetalning till insamlaren)

- **Handling (Code):** Anropa `settle-campaign` direkt — vänta inte på cron. Först `dry_run`, sedan skarpt:
  ```
  POST https://dcfrvomfztgkbfoegwge.supabase.co/functions/v1/settle-campaign
  Authorization: Bearer <service_role_key>
  body: { "insamling_id": "<uuid>", "dry_run": true }      # förhandsvisa
  body: { "insamling_id": "<uuid>", "force": true }        # kör (force = hoppa deadline-koll)
  ```
- **Förväntat:** `transfers`-rad `status='paid'` med `stripe_transfer_id`; `insamling.status='stangd'`; `transfer.created`-webhook sätter `utbetald_ore`.
- **Verifiera (Code):**
  ```sql
  select belopp_ore, status, stripe_transfer_id, syfte from public.transfers;
  select status, utbetald_ore, stangd_at from public.insamling order by created_at desc limit 1;
  ```
  → transfer `paid`; insamling `stangd`; `utbetald_ore` > 0.
- **Bonus:** verifiera pg_cron-vägen separat — sätt `insamling_deadline` i dåtid via SQL, kör `select private.kor_settle_for_due_insamlingar();`, kontrollera att den POSTar (inte bara `NOTICE` → då saknas Vault, A6).

### CP9 — Transparens-loopen (auto-bevis)

- **Förväntat:** 0013-triggrarna ska ha skapat auto-bevis: **start-bevis** när insamlingen blev `aktiv` (CP3), **utbetalnings-bevis** när transfern blev `paid` (CP8).
- **Verifiera (Code):** kontrollera rader i `transparens_bevis` + vyn `transparens_tidslinje` för insamlingen. Bekräfta kolumnnamn mot `0013_transparens_loop.sql`.
- **Om fel:** auto-bevis saknas → triggervillkoren i 0013 matchade inte; gräv där.

---

# DEL C — Buggprotokoll (när en checkpoint är röd)

1. **Stanna.** Gå inte vidare till nästa CP — länkarna är beroende, ett fel nedåt maskerar orsaken.
2. **Diagnos.** `get_logs` på den inblandade Edge Functionen + `webhook_events.error_message`. Avgör: konfigfel (Del A) eller kodbugg.
3. **Konfigfel** → Zivar rättar i Del A, kör om CP:n.
4. **Kodbugg** → Code fixar. Migrationsändring = ny numrerad migration (`0017_…`) med rollback, aldrig handredigering. Edge Function-ändring → redeploya.
5. **Kör om** från den röda CP:n.
6. **Logga** varje hittad bugg + fix i `5-Kod/SESSION-GOAL.md` under en ny rubrik "Verifiering Steg 5–7".

---

# DEL D — Kända fällor & beslut (lös dessa innan testet)

- **Env-var-scope.** Frontend-nyckeln (`pk_test_…`) i Cloudflare; allt annat i Supabase Function secrets; cron-värdena i Vault. Tre olika ställen — se A3-tabellen. Detta är den vanligaste felkällan.
- **`supabase/config.toml` saknas** i repot. `verify_jwt` per funktion behöver antingen `--no-verify-jwt`-flaggan vid deploy (A4) eller en `config.toml`. **Code:** skapa `config.toml` med `[functions.stripe-webhook] verify_jwt = false` så inställningen överlever framtida deploys — annars måste flaggan kommas ihåg varje gång.
- **Två webhook-endpoints, inte en.** `account.updated` + `payout.*` ligger på connected-account-nivå och kräver endpoint 2. Glöms den → connected-account flippar aldrig till `enabled` → CP4 blockeras med `409`.
- **`create-payment-intent` är `verify_jwt=true`** men anropas av gäster. Det fungerar: server-action skickar Supabase anon-nyckeln som Bearer, vilket är en giltig JWT. Ändra inte till `--no-verify-jwt`.
- **`profiles_skydda_falt`-triggern** blockerar seedning av `roll`/`bankid_verifierad` — se CP0, kör som service_role.
- **`NEXT_PUBLIC_SITE_URL`** måste sättas som Supabase-secret. Görs den inte faller `_shared/stripe.ts` tillbaka på `localhost:3000` → Stripe-onboardingens retur-URL pekar fel.
- **Settle i test:** använd `force:true` (hoppar deadline-kollen) eller `dry_run:true` (förhandsvisar). Vänta inte på cron.
- **Swish:** `STRIPE_ENABLE_SWISH` lämnas osatt → bara kort testas, enligt plan (Tillägg A3 — kort först).
- **Refundmodellen:** settle-campaign gör **aldrig** auto-refund vid undermål — pengar flödar framåt (Tillägg A1). Testet ska inte förvänta sig refund vid lågt utfall. Refund är ett separat admin-flöde, ej med här.

---

## Klar när

- [ ] A1–A6 gjorda (A7 valfritt).
- [ ] CP1 — connected-account `enabled`.
- [ ] CP2 — insamling `inskickad`.
- [ ] CP3 — insamling `aktiv` + `connected_account_id` satt.
- [ ] CP4 — gäst-donation skapad.
- [ ] CP5 — webhook speglar: donation `succeeded`, `insamlat_ore` ökat.
- [ ] CP6 — realtidsräknaren rör sig (annars: frontend-bugg loggad, ej blockerande).
- [ ] CP7 — kvitto mottaget (om A7 gjordes).
- [ ] CP8 — transfer `paid`, insamling `stangd`, `utbetald_ore` satt.
- [ ] CP9 — auto-bevis (start + utbetalning) finns i transparens-loopen.
- [ ] Buggar hittade under testet fixade och omkörda.
- [ ] `5-Kod/SESSION-GOAL.md` uppdaterad: Steg 5–7 = **verifierat**.

När allt är grönt: pengaflödet är bevisat. Steg 12–18 kan byggas på en grund som vi *vet* håller.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första verifieringsbriefen. End-to-end test av Steg 5–7 i Stripe testläge, ingen BankID. |
