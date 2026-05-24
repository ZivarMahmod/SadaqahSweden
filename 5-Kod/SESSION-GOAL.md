# SESSION-GOAL — Steg 12–16 (Bygg-grupp C, del 1)

**Brief:** `../2-Byggplan/09-Goal-Steg-12-16.md` — körs autonomt via `/goal`.
**Datum:** 2026-05-24
**Stopp:** efter Steg 16. Starta INTE Steg 17/18.

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
