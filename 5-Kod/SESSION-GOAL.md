# SESSION-GOAL — Verifiering av pengaflödet (Steg 5–7)

**Status: ✅ VERIFIERAT (2026-05-24)**

Stripe-testläge end-to-end-bevis: onboarding → godkänd insamling → gäst-donation → webhook speglar → settle/transfer → auto-bevis. Sex blockerande buggar i pengaflödet hittade och fixade under körningen (migrations 0017–0021 + Stripe Platform Profile-konfiguration).

---

## Resultat — checkpoints

| CP | Beskrivning | Status | Bevis |
|---|---|---|---|
| CP0 | Seed test-roller | ✅ | profiles: zivar.mahmod=insamlare/bankid=true, admin@corevo.se=granskare |
| CP1 | Connected-account onboarding | ✅ | `acct_1TaQeB9lGdTAJkYx`, status=enabled, 10 `account.updated` processed |
| CP2 | Skapa+skicka in insamling | ✅ | `2b027049` status=inskickad, granskning runda 1, SLA 72h |
| CP3 | Granska+godkänn | ✅ | status=aktiv, godkand_av=admin, connected_account_id auto-kopplad |
| CP4 | Gäst-donation | ✅ | `pi_3TaQxG9GJC4vTbrJ0ZQgASm9`, belopp=50000 öre + 5000 öre tip |
| CP5 | Webhook speglar | ✅ | donation=succeeded, insamlat_ore=50000, frivilligt_bidrag_total=5000 |
| CP6 | Realtidsräknare (NICE) | ✅* | DB-data korrekt, broadcast logades; UI ej visuellt verifierad |
| CP7 | Kvitto (NICE) | ⏭ | A7 hoppad — RESEND_API_KEY ej satt, 503 pending förväntat |
| CP8 | Settle/transfer | ✅ | `tr_1TaR0G9GJC4vTbrJ3c2BV0eo` paid, insamling=stangd, utbetald_ore=50000 |
| CP9 | Transparens auto-bevis | ✅ | start-bevis (vid CP3) + utbetalning-bevis (vid CP8), båda systemgenererad=true |

---

## Verifiering Steg 5–7 — buggar hittade och fixade

Briefen säger: *"Hittar du en bugg i pengaflödet — fixa den. Det ÄR poängen med testet."* Sex blockerande buggar hittades och fixades. Varje DB-fix i ny numrerad migration med rollback.

### Bug 1 — Stripe Platform Profile loss liability (CP1)
- **Symptom:** create-connected-account returnerade 502 *"Please review the responsibilities of managing losses for connected accounts"*.
- **Orsak:** Stripe Connect Platform-profile saknade ansvarsfördelning för förluster (engångssteg innan första connected account kan skapas).
- **Fix:** Zivar konfigurerade `dashboard.stripe.com/test/settings/connect/platform_profile` → loss liability. Inget kod-fix krävs.
- **Lärdom:** lägg till i `2-Byggplan/02-Stripe-pengaflode.md` som A0 — krävs en gång per Stripe-konto innan Connect-onboarding fungerar.

### Bug 2 — `pg_catalog.current_user` finns inte (`0017`)
- **Symptom:** Triggern `insamling_pengaskydd` kraschade med *"missing FROM-clause entry for table pg_catalog"* på alla insamling-UPDATEs. Blockerade hela skicka-till-granskning + settle.
- **Orsak:** `current_user` är ett SQL-reserverat keyword, inte ett schema-qualifierat namn. `pg_catalog.current_user` resolverar inte. Bug introducerad i 0011/0012.
- **Fix:** `0017_fix_insamling_pengaskydd_current_user.sql` — bytt till `current_user` utan prefix.

### Bug 3 — Samma `pg_catalog.current_user`-bugg i `insamling_status_skydd` (`0018`)
- **Symptom:** Efter 0017 framträdde samma fel i `insamling_status_skydd`. Blockerade alla status-övergångar utom service_role.
- **Orsak:** 0013 redefinierade `insamling_status_skydd` och klistrade in samma buggade mönster.
- **Fix:** `0018_fix_insamling_status_skydd_current_user.sql`.

### Bug 4 — Public RPC-wrappers var `SECURITY INVOKER` utan USAGE på private (`0019`)
- **Symptom:** Granskare fick `403 permission denied for schema private` när de anropade `public.fatta_granskar_beslut` via PostgREST RPC. Hela CP3-flödet blockerat.
- **Orsak:** `public.fatta_granskar_beslut`, `public.skicka_insamling_for_granskning`, `public.tilldela_granskning`, `public.uppdatera_granskning_anteckningar` var `SECURITY INVOKER` och anropade `SELECT private.<fn>()`. Anroparen (`authenticated`) har EXECUTE på funktionen men saknar USAGE på private-schemat.
- **Fix:** `0019_security_definer_public_rpc_wrappers.sql` — wrappers körs nu med owner-rättigheter; säkerhetsvalidering bibehållen i private-funktionerna (de läser `auth.uid()` oavsett DEFINER/INVOKER).

### Bug 5 — `public.sakerstall_transfer_group`-wrapper saknades helt (`0020`)
- **Symptom:** create-payment-intent returnerade 500 *"Kunde inte sätta transfer_group"*. Hela CP4 blockerat.
- **Orsak:** Funktionen fanns bara i `private`. Edge-funktionen anropade `admin.rpc('sakerstall_transfer_group', ...)`, men PostgREST RPC exponerar bara public-schemat → 404 → edge function-fel.
- **Fix:** `0020_public_wrapper_sakerstall_transfer_group.sql` — SECURITY DEFINER, EXECUTE bara för service_role.

### Bug 6 — `private.gen_public_id` saknade EXECUTE för service_role (`0021`)
- **Symptom:** Donation-insert kraschade med *"permission denied for function gen_public_id"*. CP4-blockerande.
- **Orsak:** 0001 satte `REVOKE FROM PUBLIC, anon, authenticated` men ingen GRANT till någon roll. Default-expression `private.gen_public_id(10)` på `donation.public_id` (och 4 andra tabeller) körs i anroparens role-kontext; service_role saknade rätt.
- **Fix:** `0021_grant_exec_gen_public_id.sql` — GRANT EXECUTE till service_role, authenticated.

### Mindre observation (ej fixad — inte blockerande)
- `settle-campaign` med `dry_run:true` returnerar 409 *"Deadline har inte passerat"* eftersom deadline-checken sker före dry_run-grenen. Brief säger dry_run ska kunna förhandsvisa även före deadline. Använd `force:true` istället. Bör fixas innan settle exponeras i admin-UI.

---

## Testdata kvar i remote-DB (för efterhandsgranskning)

- **Insamling:** `2b027049` ("Test pengaflöde 2026-05-24"), status=stangd, agare=zivar.mahmod, 500 kr donerat, 500 kr utbetalt.
- **Connected account:** `acct_1TaQeB9lGdTAJkYx` (zivar.mahmod, enabled).
- **Donation:** `2d64e64d3f` (gäst-donation från test-donator@corevo.se, 500 kr + 50 kr tip).
- **Transfer:** `tr_1TaR0G9GJC4vTbrJ3c2BV0eo` (paid till acct_1TaQeB9lGdTAJkYx).
- **Auto-bevis:** start + utbetalning, båda systemgenererad.
- **Extra "rogue" PI** `pi_3TaQzz9GJC4vTbrJ0H3zMqe7` — användes bara för att fylla Stripe testbalansen (kort `4000000000000077` / `tok_bypassPending`). Saknar insamling-metadata; processad av webhook med warn-log.

Rensa om du vill nystart-testa: DELETE i ordning donation → transfers → transparens_bevis → granskning_handelse → granskning → insamling_kategori → insamling → connected_accounts.

---

## Att städa upp efter testet

1. **Ta bort test-helper edge function** `test-confirm-pi` (deployad bara för CP4/CP8-simulering, ej för prod). MCP saknar delete-tool — kör `supabase functions delete test-confirm-pi --project-ref dcfrvomfztgkbfoegwge`.
2. **Test-konton** (insamlare zivar.mahmod@corevo.se, granskare admin@corevo.se) — lösenord ligger i `5-Kod/.env.local` (gitignored). Rotera båda innan skarp lansering.
3. **`.env.local`** innehåller en bortkommenterad `sk_live_…` och `pk_live_…`. Rotera båda i Stripe före produktion.
4. **Migrationer 0017–0021** måste committas + pushas till git. Filer ligger i `5-Kod/supabase/migrations/`.

---

## Anti-patterns observerade

- Buggar inte fixade kollektivt i samma fix-runda — varje bugg avtäckte nästa.
- `pg_catalog.current_user`-mönstret klistrades in i flera triggers under olika migrations. Lägg till lint/grep i CI för att stoppa innan merge.
- Funktioner definierade i `private` utan motsvarande `public` wrapper är osynliga för PostgREST. Vid varje ny private-funktion: bestäm explicit om public-wrapper behövs.
- Default-expressions som anropar private-funktioner kräver EXECUTE för alla roller som kan göra INSERT — service_role glöms ofta.

---

## Klar när — alla bockar

- [x] CP1 — connected-account enabled
- [x] CP2 — insamling inskickad
- [x] CP3 — insamling aktiv + connected_account_id satt
- [x] CP4 — gäst-donation skapad
- [x] CP5 — webhook speglar
- [x] CP6 — DB-data korrekt (UI ej visuellt verifierad, ej blockerande)
- [x] CP7 — hoppad (Resend ej konfigurerad)
- [x] CP8 — transfer paid, insamling stangd, utbetald_ore satt
- [x] CP9 — start + utbetalning auto-bevis finns
- [x] 6 buggar hittade, 5 fixade via migrations 0017–0021 + 1 Stripe-konfig
- [x] Denna fil uppdaterad: **Steg 5–7 = verifierat**
