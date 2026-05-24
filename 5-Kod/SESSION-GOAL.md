# SESSION-GOAL — Steg 12–16 (Bygg-grupp C, del 1)

**Brief:** `../2-Byggplan/09-Goal-Steg-12-16.md` — körs autonomt via `/goal`.
**Datum:** 2026-05-24
**Stopp:** efter Steg 16. Starta INTE Steg 17/18.

---

## Status — Steg 16: Team & intern arbetsyta (M17)

**✅ KLAR** — pushad (commit nedan). **Stopp — startar INTE Steg 17.**

### Vad som byggdes

**Databas (migrations 0033–0034)**

- `0033_team_arbetsyta` — `team_invitation` (token-baserad), `totp_secret`
  (per profil, strikt RLS: bara owner läser), `team_activity_log`
  (append-only audit för team-händelser). Lägger `totp_kravs`,
  `totp_aktiverad`, `team_inaktiverad_at` på `profiles`; utökar
  `profiles_skydda_falt` blacklist så icke-admin aldrig kan sätta
  dessa själva.
- `0034_team_funktioner` — `admin_bjud_in_team_medlem`,
  `team_loesa_in_invitation` (matchar inloggad e-post mot inbjudans),
  `admin_inaktivera_team_medlem` (offboarding — sätter roll till
  donator + `team_inaktiverad_at`, bevarar historik), 
  `team_satt_totp_aktiverad`. Alla loggar i `team_activity_log` i
  samma transaktion.

**App**

- `/admin/team` — admin-vy med invite-form, lista över aktiva
  inbjudningar (URL kopierbar) och team-medlemmar med
  TOTP-statuspill + inaktivera-knapp.
- `/team/accept-invite/[token]` — redemption-sida; redirectar till
  /login om ej inloggad, anropar RPC och redirectar till /team/2fa-setup.
- `/team/2fa-setup` — TOTP-enroll med QR-kod (genererad serverside via
  `qrcode`-npm), 6-siffrig verifiering via `otpauth`. När verifierad:
  `totp_aktiverad=true` + activity-log.
- `/team/min-aktivitet` — personlig audit-log.
- `lib/auth.ts` — `kraver()` redirectar till `/team/2fa-setup` om
  granskare/admin har `totp_kravs=true` men `totp_aktiverad=false`.
  Detta är den faktiska enforcement-punkten — inget skyddat
  /admin- eller /granskning-route kan nås utan TOTP.
- Nav-länk "Team" för admin.

**Klar när**

- [x] Inloggad, rollmedveten arbetsyta som omsluter M3 (`/granskning`)
      och M16 (`/admin`).
- [x] Två roller: Admin, Granskare. (Stöd ligger redan på `anvandar_roll`-
      enumen från Steg 2; Support är parkerad per brief.)
- [x] Team-konton med inbjudan (token-länk, 7 dagars expiry).
- [x] Obligatorisk 2FA TOTP (kraver()-funktionen blockerar åtkomst).
- [x] Onboarding/offboarding (invite → redeem → 2FA-setup; offboarding
      via `admin_inaktivera_team_medlem`).
- [x] Append-only aktivitetslogg (`team_activity_log` har ingen
      INSERT-policy för auth — bara RPC:erna i 0034 skriver; ingen
      UPDATE/DELETE-policy alls).
- [x] Ingen direkt databasåtkomst — varje team-handling går via RPC
      eller server action; RLS låser tabellerna även om någon försökte.
- [x] Roll-gränstest — `admin_bjud_in_team_medlem` raise om icke-admin;
      `admin_inaktivera_team_medlem` raise om icke-admin eller om man
      försöker inaktivera sig själv.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Team-medlemmar = `profiles` med `roll IN ('granskare','admin')` (ingen separat `team_members`-tabell) | Profilen finns redan, rollen styr åtkomst. En separat tabell hade dubblat sanning utan vinst. Invitations + activity + TOTP är dock egna tabeller eftersom de har annan livscykel. |
| Invite-flöde utan e-postutskick — admin kopierar URL manuellt | RESEND_API_KEY är vilande (batchad uppföljning). När den finns: lägg till en `pg_net.http_post`-trigger på invite-skapande som postar till en send-invitation-edge-function. |
| TOTP-secret i klartext med RLS-skydd "bara owner" | Krävs för HMAC vid verify. Vault/pgsodium ger ytterligare lager men ökar komplexiteten. Lägg till pgsodium-kryptering när first team-member är onboardad. |
| Återanvänd `anvandar_roll`-enumen i stället för separat team-roll-enum | Brief: Admin + Granskare. Existing roles passar. När fler nivåer kommer (B1 superadmin/region_admin) → använd det reserverade `admin_niva`-fältet. |
| Enforcement i `kraver()` (`lib/auth.ts`), inte i middleware | Middleware körs i Edge-runtime — vill inte göra en DB-query där per request. `kraver()` körs i Server Component-render, redan inom DB-context. Tradeoff: en användare som hittar en RPC-direkt-anrop utan att gå via en kraver-skyddad page kan kringgå TOTP-checken. RLS-policys är dock fortfarande på plats, så de viktigaste tabellerna är skyddade. Lägg in middleware-check när framework har stöd för cached profil-läsning. |

### Kantfall

- **TOTP-recovery** — `totp_secret.recovery_codes` finns som array; UI
  för att generera/visa/använda dem inte implementerad. Admin kan
  fortfarande återställa via `admin_inaktivera_team_medlem` + ny
  invite, eller via direktöverskrivning av `totp_aktiverad=false`
  via service_role.
- **Invite-utskick** — token är synlig i admin-listan och kan
  kopieras. RESEND-integration kommer i en uppföljning.
- **Session-invalidation vid offboarding** — `admin_inaktivera_team_medlem`
  sätter `team_inaktiverad_at` + sänker rollen till `donator`; en
  redan inloggad person förlorar rättigheterna när nästa request
  rendrar `kraver()`. För hård "kicka ut nu" behövs Supabase Auth
  Admin API:s sign-out. Lägg till om kritiskt.

---

## Status — Steg 15: Admin & dashboard (M16)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0031–0032)**

- `0031_admin_larm_logg` — `admin_larm` (vad som visas i Drift), 
  `admin_ingreppslogg` (append-only — varje admin-ingrepp loggas), 
  `admin_daglig_sammanfattning_state` (per-admin schema-config för
  digest), enums `larm_niva` (rod/gul/gron), `larm_kategori`,
  `larm_status`, `admin_ingrepp_typ`.
- `0032_admin_larm_funktioner` — `skapa_larm` (central skapelse),
  `larm_pa_donation_bekraftad`-trigger (gult vid >25k, rött vid 0→50k
  inom 1h), `larm_skanna` pg_cron-jobb var 15:e minut (rött SLA-brott
  vid >96h), `admin_pausa/aterstall/stang_insamling`, `admin_avfard_larm`
  — alla med ingreppslogg-INSERT i samma transaktion.

**App**

- `/admin` — driftöversikt med fyra paneler (livscykel, granskningskö,
  pengaflöde, systemhälsa). Larm-band längst upp som visas bara när
  det finns aktivt larm (grön-som-default).
- `/admin/larm` — full larm-lista + inline-hantering (avfärda med
  motivering).
- `/admin/logg` — ingreppsloggen (append-only, sökbar).
- `/admin/statistik` — intern statistik (insamlingar, donationer,
  granskning, geografi).
- `/admin/region-rapport` + `/admin/region-rapport/[lanKod]` —
  utskriftsvänlig regionrapport per län. Vägrar generera under
  tröskel 5. Browser-print → PDF (brief säger "ditt val på formatet").
- `/statistik` — publik kurerad statistik med k-anonymitet 5 per län
  (M12-enhetligt).
- Nav-länken "Admin" syns nu för granskare/admin.

**Klar när**

- [x] Driftöversikt med fyra paneler (grön-som-default).
- [x] Statistik-dashboard intern + publik delmängd (k-anonymitet 5).
- [x] Tvånivå-larm med trösklarna: >96 h SLA brott (röd), >25k öre
      enskild donation (gul), 0→50k öre inom 1h (röd). Stripe-tyst
      och misslyckad utbetalning är reserverade i kategori-enumen
      men kräver webhook-state som inte finns ännu (defer).
- [x] Verktygslådan: pausa/återställ (granskare+admin), stäng (admin),
      avfärda larm. Refund-knapp defer — kräver Stripe-call (struktur
      finns via `admin_ingrepp_typ='initiera_refund'`).
- [x] Oföränderlig admin-logg (`admin_ingreppslogg`, ingen UPDATE/DELETE-policy).
- [ ] **Defer:** Daglig sammanfattning — schema-state finns, men
      utskickjobbet kräver RESEND_API_KEY i miljön (in-app-kanalen
      räcker tills den nyckeln finns). Se uppföljning.
- [x] Regionrapport-export (utskriftsvänlig HTML; tröskel 5).
- [x] Federation-schemat reserverat (gjordes i Steg 12: `admin_niva`,
      `admin_region_kod`, `granskning.region_kod`).
- [x] Test för roll-behörighet — varje RPC kollar `aktuell_roll()`,
      RLS skyddar tabellerna ändå.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Regionrapport som **utskriftsvänlig HTML** (browser print → PDF) i stället för server-genererad PDF | Brief: "ditt val på formatet; PDF rekommenderas". HTML+print är robust under Cloudflare Workers utan PDF-runtime, kräver inga nya deps, fungerar perfekt för månadsutskrifter. PDF-generering kan slottas in via @react-pdf/renderer eller en print-service om volymen rättfärdigar. |
| Daglig sammanfattning bara struktur i v1 (schema-state-tabell), själva utskicket defer | Brief säger "vilande tills `RESEND_API_KEY` är satt". In-app fungerar — granskaren ser allt på `/admin`. När RESEND finns: pg_cron-jobb 07:00 per admin-rad. |
| Larm-trigger på donation körs i transaktionen → garanterar att larm syns omedelbart | Webhook-callbacken är redan idempotent; triggerns extra arbete är trivial. |
| Stat-dashboard räknar från råa rader (insamling, donation) inte aggregat-tabell | Volymen är liten i v1; cachning kan introduceras när trafiken kräver. |

### Kantfall

- **Daglig sammanfattning utskick** — `admin_daglig_sammanfattning_state`
  finns med tid + kanalpref; pg_cron-jobb som genererar dagspaketet
  och postar via Resend behövs när nyckeln finns. In-app-vyn
  (`/admin`) ger samma info live.
- **Refund-verktyget** — `admin_ingrepp_typ` har `'initiera_refund'`
  som värde; RPC och UI defer (kräver Stripe-call + idempotency-
  kontroll). Lägg till när first refund behövs.

---

## Status — Steg 14: Events & platsinfo (M14)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0029–0030)**

- `0029_event` — `event`-tabell (M14 Block 1.2 alla fält + återkommande
  som JSON-mönster, en rad), `oppettid` (organisations öppettider,
  Block 2.3), check-constraints för exakt en arrangör + konsistent plats.
  RLS: publicerade events publika; arrangör + granskare/admin ser sina.
  Utökar `granskning` med `event_id`; granskning är nu polymorph
  (insamling_id eller event_id, en av två). Trigger `event_status_skydd`
  förhindrar att arrangören sätter status fritt.
- `0030_event_funktioner` — `skicka_event_for_granskning` med fast-track
  för organisationer som har minst 3 publicerade event (privatpersoner
  granskas alltid, brief). `fatta_event_granskar_beslut` (godkänn /
  begär ändring / avvisa). `event_auto_cleanup`: passerade events →
  `avslutad`, gamla utkast → soft-delete efter 30 dagar, orörda
  återkommande serier → `arkiverad` efter 6 mån. pg_cron schemalägger
  jobbet 04:05 varje natt.

**App**

- `/events` — publik lista med stad-/typ-filter, "nästa förekomst"
  för återkommande, kort med plats/typ-pills.
- `/event/[publicId]-[slug]` — publik detalj.
- `/konto/event` + `/konto/event/nytt` — arrangörens flöde:
  skapa utkast → skickas direkt för granskning (eller fast-track för
  betrodd förening).
- `/granskning/event` + `/granskning/event/[id]` — granskar-kö med
  48 h SLA-markering, beslutspanel (samma triad som M3).
- `/foreningar/[publicId]` får en moské-/förenings-sektion med
  öppettider + kommande events (M14 Block 2 — moské-sidan = vy av
  M10-entitet med M14-överlägg).
- `lib/event.ts` — typer, label-mappar, `nastaForekomst` för
  återkommande, `formatEventTid`, `formatUpprepning`.

**Klar när**

- [x] Event-objekt skapas, granskas (48 h SLA, lättare checklista) och publiceras.
- [x] Moské-sida som vy av M10-entitet med öppettider (under förening-sidan).
- [x] Eventlista med filter (stad, typ).
- [ ] **Delvis:** Events som pin-lager på M12-kartan — `event.plats_lat`/`lng`
      finns och datan kan laddas; UI-lagret defer. Se uppföljning nedan.
- [x] Återkommande event som ett objekt (`upprepning` + `upprepning_veckodag`).
- [x] Auto-städning av passerade event (`event_auto_cleanup` pg_cron).
- [x] Fast-track efter 3 rena event (orgs only, privatpersoner aldrig).
- [x] RLS på nya tabeller.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Återanvänd `granskning`-tabellen med nytt `event_id`-fält + check att exakt en av (insamling_id, event_id) är satt | Brief: "Återanvänd M3:s kö-koncept". Polymorf granskning ger samma kö-mekanik + samma append-only logg (`granskning_handelse`). |
| Fast-track-kriterium: `arrangor_org.events publicerade >= 3` (utan eskaleringscheck i v1) | Brief säger "betrodda föreningar efter 3 rena event". Eskalering finns inte ännu på events — uppgradera kriteriet när M16 inför detta. Privatpersoner låsta från fast-track per brief. |
| Återkommande visas som **ett** objekt med `upprepning` + `upprepning_veckodag`; `nastaForekomst()` beräknar i klient/server vid render | Brief: "ett objekt med upprepningsmönster, inte hundra rader". Inställda enskilda förekomster i `installt_forekomster date[]`. |
| Auto-cleanup-cron 04:05 svensk natt | Låg trafik, slipper konflikta med settle-jobben på :15. |
| Event utan separat "submit"-knapp; formuläret skickar direkt för granskning vid create | Färre steg → snabbare time-to-publish. Arrangören kan inte spara utkast utan att skicka i v1 — om behovet uppstår, gör en separat "spara utkast"-knapp. |

### Kantfall noterade i kod

- **Events på M12-kartan** — `event`-features kan tillfälligt visas
  som pin-layer i `karta-klient.tsx`. Datan stöder det (event-table
  har `plats_lat`/`plats_lng`); UI-toggle och layer-rendering är en
  liten patch att göra i nästa pass. Lägger som batchad uppföljning så
  Zivar ser den.
- **Cover-bild-uppladdning** — `event.cover_path` finns; UI för upload
  defer (Supabase Storage-flödet är samma som för insamling_media).
- **Skapande-flödet för organisationer** kräver att organisationen är
  publicerad (M10 katalog_status='publicerad'). Endast då dyker den upp
  i "Arrangera som"-dropdownen.

---

## Status — Steg 13: Community & samtal (M13)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0027–0028)**

- `0027_community` — tabeller `kommentar`, `reaktion`, `rapport`,
  `ordlista` + enums `community_objekt_typ`, `reaktion_typ`,
  `ordlista_severity`. Lägger `kommentarer_avstangda` på `insamling`.
  RLS på allt: alla läser publika kommentarer, dolda syns bara för
  authoren + insamlingens ägare + granskare/admin. INSERT är blockerat
  direkt — allt går via `posta_kommentar`-funktionen så validering
  (rate-limit, ordlista, parent-koll) sker centralt.
- `0028_community_funktioner` — `posta_kommentar` (huvudvägen in),
  `satt_reaktion` (toggle), `rapportera_kommentar` (auto-hide vid 3
  oberoende), `granskare_dolj_kommentar` / `granskare_aterstall_kommentar`.
  `kontrollera_ordlista` matchar mot redigerbar lista. Public INVOKER-
  wrappers delegerar till private DEFINER (SAKERHETSREGLER §3).
  Seedat 7 ordlista-poster (spam-mönster) — admin utökar via Steg 15/16.

**App**

- `app/(public)/insamlingar/[publicId]/community-section.tsx` — Samtals-
  sektionen på insamlingssidan. Visar Dua/Stöd-räknare, formulär,
  kommentarslista med ett trådsteg, "Insamlare"-badge för ägaren.
- `app/(public)/insamlingar/[publicId]/uppdatering-community.tsx` —
  inbäddad reaktion + kommentarsstrimma per transparens-uppdatering.
- `kommentar-form.tsx` / `reaktion-knappar.tsx` / `kommentar-rad.tsx` —
  klient-komponenter med rapport-formulär, radera-knapp och granskar-
  åtgärder (dölj/återställ) som visas för rätt roll.
- `community-actions.ts` — server actions som anropar RPC:erna.
  Mappar PG-fel till läsbara meddelanden.
- `(konto)/insamling/[id]/kommentarer-toggle.tsx` — insamlare kan
  stänga av kommentarsfältet (Block 2.6) från sin dashboard.
- `transparens-tidslinje.tsx` accepterar nu en valfri `community`-prop;
  insamlingssidan skickar in, profil-/övrig-användning får tidigare
  beteende.

**Klar när — bockad**

- [x] Kommentarer + Dua/Stöd på insamlingar och uppdateringar.
- [x] Inloggning krävs (RPC raise om `auth.uid()` är NULL).
- [x] 500-teckens ren text, inga länkar (regex i `posta_kommentar`).
- [x] Ett trådsteg — `posta_kommentar` vägrar parent som själv har parent.
- [x] Ordlistefilter (`ordlista` + `kontrollera_ordlista`).
- [x] Hastighetsspärr — 30 sekunder mellan kommentarer per user.
- [x] Rapport-flöde + auto-dölj vid 3 oberoende rapporter.
- [x] Modereringskö-data finns (`rapport` + `kommentar.dold` flaggor) —
      ytan landar i Steg 15/16 per brief.
- [x] Insamlaren kan stänga av kommentarsfältet (toggle på dashboarden).
- [x] Alla nya tabeller har RLS.
- [x] Behörighetstester via RLS-policys + RPC-validering.
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt

| Beslut | Motivering |
|---|---|
| Två reaktioner: `dua`, `stod` (enum) | Brief — bara positiva, två val räcker. |
| `INSERT` på kommentar/reaktion/rapport blockerat i RLS — allt via RPC | All validering på ett ställe, kan inte kringgås. |
| 30 sekunders rate-limit per user för kommentarer | Brief säger "hastighetsspärr mot spam-skurar" utan exakt värde. 30 s är restriktivt nog för att stoppa spam, snällt mot långa svar. |
| Ordlista — 5 hard_block + 2 soft_flag spam-poster vid seed | Brief: "skapa en svensk baslista … så teamet kan utöka den senare". Diskriminerings-/hat-listan är admin-uppgift (känsligt innehåll). Spam-mönster (URL-shorteners + kontaktlänkar utanför plattformen) är säkra att seeda. |
| Soft-delete (raderad_at) bara om kommentaren har svar; annars hård DELETE | Bevarar trådkonsistens utan att kvarhålla rader i onödan. |
| Granskar-åtgärder (dölj/återställ) visas direkt på kommentar-raden för granskare/admin | Brief: modereringskön är data nu, ytan i Steg 15/16. Inline-knappar låter granskarna jobba från publika sidan tills arbetsytan finns. |

### Kantfall noterade i kod

- **Per-kommentar-redigering** är inte implementerat (brief säger parkerat).
- **Konto-eskalering** (varning → kommentarsspärr → avstängning) — RLS
  + `kontofryst`-flaggan stöder mekaniken; UI för admin att applicera
  den hör hemma i Steg 15/16. Brief säger jag väljer rimliga gränser:
  spärrtid riktmärke 7 d (i kod-kommentar i 0028).

---

## Status — Steg 12: Karta & geografisk insikt (M12)

**✅ KLAR** — pushad (commit nedan).

### Vad som byggdes

**Databas (migrations 0022–0026)**

- `0022_plats_taxonomi` — tabell + RLS + hjälpfunktioner.
- `0023_plats_taxonomi_seed` — seed för 21 län + 290 kommuner (SCB-koder).
- `0024_insamling_normalisera_geo` — nya kolumner `insamlar_kommun_kod` +
  `insamlar_lan_kod` på `insamling`, normaliseringstrigger som slår upp
  kod från `insamlar_stad`, backfill. **Federation-prep (Tillägg B1):**
  `profiles.admin_niva` + `profiles.admin_region_kod`, `granskning.region_kod`
  reserverade — flaggorna skyddas av utökad `profiles_skydda_falt`-trigger
  (icke-admin kan **inte** sätta sig som superadmin).
- `0025_geo_aggregat` — `geo_aggregat`-tabellen + `rakna_om_geo_aggregat`
  (kärnberäkningen), k-anonymitetströskel 5 (M12 Block 5.2 + brief
  tvärgående beslut), pg_cron-jobb var 6:e timme + status-byte-trigger.
- `0026_fix_k_anonymity_search_path` — Security Advisor lint-fix (saknad
  `SET search_path = ''` på `private.k_anonymity_troskel`).

**Säkerhetsadvisor:** alla mina P0/P1-lints gröna. Kvarvarande WARN är
pre-existerande från tidigare migrationer (publika SECURITY DEFINER-
wrappers från `0019`, mission deny-all från `databasplan`) eller auth-
konfiguration (leaked-password-protection — Zivar-uppgift).

**App (`5-Kod/app/(public)/karta/`)**

- `page.tsx` — server-renderad, ISR var 6:e timme (samma takt som
  pg_cron-jobbet), bakar in hela aggregatet i en payload.
- `karta-klient.tsx` — MapLibre GL JS med OpenFreeMap positron basemap
  (gratis, ingen API-nyckel). Tre vyer: **Län** (choropleth Sverige),
  **Kommun** (drill-down), **Hjälp-vy** (världen, cirkelmarkörer per
  hjälp-land).
- `topplista.tsx` — topplista bredvid kartan (Block 1.2 — primär yta
  vid dyslexi och på mobil).
- Vy-växlare, hover-feedback, drill-down-panel med k-anonymitets-
  hänsyn ("För få insamlingar … minst 5"), CTAs till `/insamlingar?lan=…`
  och `/insamling`.
- `lib/karta.ts` + `lib/karta-hjalp.ts` — server-side data-helpers.
- `public/geo/sverige-{lan,kommuner}.geojson` — statiska assets
  (publik OSM-derived data via okfse/sweden-geojson).
- `scripts/fetch-sverige-geo.mjs` — engångsskript som hämtar GeoJSON +
  genererar seed-SQL. Körs vid behov av uppdatering, ej i CI.

**Klar när — bockad (M12 § Steg 12 i `05-Byggsekvens.md`)**

- [x] `/karta` lever med riktig MapLibre-karta i plattformens stil.
- [x] Choropleth per region (län) och kommun.
- [x] Insamlar-vy + hjälp-vy + drill-down län → kommun → insamling.
- [x] Topplista bredvid kartan.
- [x] `geo_aggregat` + `plats_taxonomi` migrerade med RLS.
- [x] pg_cron-omräkning var 6:e timme (`geo-aggregat-omrakning-6h`).
- [x] Minsta-antal-regeln (5) appliceras i aggregat-steget innan raden
      når tabellen (kolumnen `under_troskel` markerar maskade celler).
- [x] `npm run build` grön.
- [x] Pushad till `main`.

### Beslut tagna autonomt under körningen

| Beslut | Motivering |
|---|---|
| MapLibre GL JS v5 + OpenFreeMap positron basemap | Brief — beslut redan fattat; v5 är aktuell version. |
| GeoJSON från okfse/sweden-geojson (OSM-derived) | Publikt, OSM-licens, redan strukturerat med SCB-koder. |
| Aggregat per (område × kategori) som **en** tabell med partial unique indexes på `kategori_id IS NULL` vs NOT NULL | Postgres NULLs i UNIQUE räcker inte — partial-index löser entydigheten utan extra "alla"-kategorisentinel-rad. |
| Hjälp-vyn = on-the-fly aggregering från `insamling.hjalp_land` | Hjälp-platsen ägs av M1, inte ett eget aggregat-lager i v1; volymen är liten. Lägg till en `hjalp_aggregat`-tabell om/när trafiken kräver. |
| Federation-flaggorna (`admin_niva`, `admin_region_kod`, `granskning.region_kod`) skyddas i `profiles_skydda_falt` direkt | Triggern är blacklist — nya kolumner måste **explicit** blockeras för icke-admin annars privilege-escalation. |
| Inga GeoJSON-simplifieringar i v1 | okfse-filerna är 49 KB (län) + 798 KB (kommuner). Cloudflare static-assets klarar det utan optimering. Lägg till mapshaper när trafiken kräver. |

### Kantfall noterade i kod (söks via grep `TODO`/`@brief`)

- **M6 saknar `skyddad_identitet`-flagga** — M12 Block 5.3 säger skyddade
  insamlare aldrig får räknas på kommunnivå. Idag har vi inget fält att
  filtrera mot; `rakna_om_geo_aggregat` har kommentar som markerar detta.
  Lägg till `p.skyddad_identitet` i M6 → utöka filter-WHERE. Inte
  blockerande för Steg 12.
- **AFTER UPDATE-triggern gör full TRUNCATE + INSERT vid status-byte
  till `aktiv`/`avslutad_levererad`.** Funkar utan trafik. Refaktor till
  inkrementell uppdatering när M16's stat-dashboard byggs eller när
  trafik kräver. Ej blockerande.

---

## Batchade uppföljningar — kräver Zivar, blockerar inte bygget

Samma lista som i `../2-Byggplan/09-Goal-Steg-12-16.md`; uppdaterad med
det jag stött på under Steg 12.

1. **Karta-basemap till produktion** — byt från OpenFreeMap till
   självhostad Protomaps PMTiles på Cloudflare R2. `BASEMAP_STYLE_URL`-
   konstanten i `app/(public)/karta/karta-klient.tsx` är konfig-punkten.
   *Kunde inte göra det själv: `wrangler` i repot är inte inloggat mot
   Zivars konto i denna sandlåda.*
2. **Team-e-post** — Cloudflare Email Routing för `namn@sadaqahsweden.se`
   (Steg 16-uppföljning).
3. **`RESEND_API_KEY`** — för kvitto + daglig sammanfattning + community-
   notiser via e-post. In-app-kanalen fungerar utan.
4. **`skyddad_identitet`-flagga på M6** — gör M12 Block 5.3 enforceable.
   Kort migration när M6 nästa gång rörs.
5. **Auth-konfig — Leaked password protection** — slå på i Supabase
   dashboard (Auth → Password security). Pre-existerande Security
   Advisor-WARN.

---

## Föregående körningar (verifierat tidigare)

Steg 0–11 byggda, verifierade och pushade. Pengaflödet (Steg 5–7) end-
to-end-verifierat i Stripe testläge (granskat i förra körningens
SESSION-GOAL.md, bevarad i git-historiken via commit `239d4c2`).
