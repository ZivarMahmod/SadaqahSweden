# Säkerhet — permanenta förbudslistan + säkerhetsbasens standarder

**Status:** Bindande spärr. Skapad av brief 31 (säkerhetsbasen, F9).
**Källa:** `6-Vision/omraden/17-sakerhet.md` E + `2-Byggplan/30-Vision-Bygg-ROADMAP.md`
(permanenta nej + A–N-principerna) + `04-Beslut-innan-bygge.md` DEL 7.

Den här filen är en **dokumenterad spärr i repot**. Varje framtida brief läser
den. Bryter en design mot den — bygg inte; flagga.

---

## 1. Den permanenta förbudslistan — får ALDRIG byggas

Dessa är permanenta nej. Ingen brief, ingen körning, inget framtida beslut
bygger dem utan att hela visionen omförhandlas:

- **Privata meddelanden / DM** — inget privat meddelandesystem, någonsin (princip B).
- **Betyg, recensioner, topplistor** — av någon eller något (princip A).
- **Givar-topplista / publika gåvobelopp per givare** — anonymitet är standard
  (DEL 7 pkt 17). Ingen "största givare"-lista.
- **Plats-/rörelsespårning / spårnings-SDK** — plats- och andlig data stannar på
  enheten (princip I). Ingen analytics-SDK som spårar individer.
- **Plattforms-verifierat halal-lager** — plattformen gör aldrig en religiös
  produktbedömning (princip H, DEL 7).
- **Gamifiering av tillbedjan** — inga streaks, märken, poäng, "X % läst",
  qada-tracker (princip C).
- **AI-genererade religiösa svar / publik fråge-vägg** — plattformen uttalar
  aldrig religiös sanning själv (princip E). Koran v1 är inte AI-driven (DEL 7 pkt 6).
- **Partnerförmedling / dejting** (princip K).
- **Försäljning/delning av användardata / annonser** (princip G).
- **Blockkedja / publik "oföränderlig huvudbok"** — transparens byggs med
  RLS + audit, inte en publik kedja.
- **Forum per förening** (DEL 7 pkt 23 — permanent nej).
- **Funktionsgrindande prenumeration** — allt uppdragskritiskt + allt religiöst
  är gratis (Modell B, DEL 7). Bara icke-religiösa power-verktyg + kosmetik grindas.
- **Tweaks-panelen i produktion** (DEL 7 pkt 23).

## 2. "Enheten, inte servern"-principen

Religiöst avslöjande inställningar (bönerutin, kalender-påminnelser, kartans
plats) **serverlagras aldrig som standard**. Serverlagring kräver ett
uttryckligt beslut + en art. 9-samtyckesgrind (`Art9ConsentGate` →
`consent_records`). `consent_records` är grinden, inte en inbjudan att serverlagra.

## 3. Säkerhetsbasens standarder — varje framtida brief följer dessa

Byggda av brief 31 (migr 0063–0069). Konsumeras av briefs 36–50:

- **Signerade URL:er för alla bilagor** — bevisfoton, dokument, profilbilder,
  art. 9-underlag serveras via `getSignadUrl` (`lib/storage.ts`, F4) med kort TTL
  (default 120 s). **Aldrig** en publik storage-URL för användaruppladdat
  material. Känsligt → privat bucket `kansliga-underlag`.
- **`rate_limit_traff` på varje ny publik skriv-endpoint** (F3). Anropas
  server-side (server-action / route handler) via admin-klienten (`service_role`);
  IP läses från `CF-Connecting-IP`. Rå IP lagras aldrig (sha256-hash).
- **`Art9ConsentGate` framför varje art. 9-yta** (F7, design-lane-komponent).
  Backend-kontraktet: `public.samtycke_ge` / `public.samtycke_aterkalla` +
  `private.har_samtycke(uid, purpose)`. Nya syften: `ALTER TYPE
  public.consent_purpose ADD VALUE '...'`.
- **`private.audit(...)` på varje känslig läs-/skrivåtgärd** (F2). `context`
  innehåller **aldrig** art. 9-fritext eller känsliga värden — bara identifierare
  och metadata.
- **Fält-kryptering för art. 9-fritext i vila** (F6) — `private.kryptera_falt` /
  `private.dekryptera_falt` (pgcrypto, `service_role`). Nyckel i server-env
  `SADAQA_FALT_NYCKEL`, **aldrig** i DB. Framtida fält som MÅSTE krypteras i vila:
  imam-/kris-förfrågningarnas fritext (briefs 50/36/9), och varje fält en
  konsumerande brief markerar som art. 9-fritext. (TLS i transit = Cloudflare,
  host-nivå, byggs inte.)
  - **Supabase-not 2026:** Vault (`vault.create_secret`) är förstahandsval för
    *hemligheter*; pgcrypto-hjälparna täcker *fält-i-vila* där nyckeln hålls utanför
    DB. Båda giltiga; välj per fall.
- **RPC-konvention (linter-renhet):** klient-anropbara RPC:er byggs som
  **public SECURITY INVOKER-wrapper → private SECURITY DEFINER-impl**. `authenticated`
  har USAGE på `private` (migr 0050) + EXECUTE på impl:en. Ger noll
  Security Advisor-lints (0028/0029). Rena server-jobb (gallring, kryptering,
  rate-limit) är DEFINER i `private`/`public` med GRANT bara `service_role`.

## 4. Registerförteckning art. 30 (`processing_register`) — mall för J1/jurist

`processing_register` är ett **dokument, inte en tabell** (brief 31 beslut 6).
J1/jurist fyller tabellen nedan per behandling:

| Ändamål | Datakategori | Art. 6-grund | Art. 9-grund | Mottagare | Lagringstid | Säkerhetsåtgärd |
|---|---|---|---|---|---|---|
| *(ex)* Insamlaransökan | Identitet, kontakt | Avtal/berättigat intresse | 9.2.a samtycke | Granskningsråd | *(J1)* | RLS + audit + signerad URL |
| *(ex)* Bönerutin (om serverlagrad) | Religiös praktik | — | 9.2.a samtycke | Ingen | *(J1)* | Enheten först; annars fält-kryptering |
| *(ex)* Imam-/kris-förfrågan | Religiös, ev. hälsa | — | 9.2.a samtycke | Imam/handläggare | *(J1)* | Fält-kryptering i vila + signerad URL |

Gallringstider + `jurist_godkand` fylls i `public.data_retention_jobs` (F5)
efter J1. Schemaläggning av `private.kor_gallring()` (pg_cron / scheduled edge
function) är ett drift-/J1-steg — aktiveras inte i kod förrän J1 svarat.

## 5. Re-homing-noter

- **Dataskydd-panelen** (registrerades rättigheter, F8 — `mina_uppgifter_export` +
  `begar_radering` + samtyckeshantering) ska ytas i rummet **Min vardag** av
  brief 35/51. Interim-RPC:erna finns; UI-komponenten byggs i design-lane.
- **`Art9ConsentGate`** anpassas till designsystem v0.3 av brief 35.

## 6. Storage-buckets — nulägesfynd (F4)

Vid F4 (2026-05-30) fanns **inga** storage-buckets före migrationen → **inget
publikt-bucket-fynd att åtgärda**. Privat bucket `kansliga-underlag`
(public=false) skapad med restriktiv storage-RLS (egen mapp + admin-läsning).

---

## Versionshistorik
| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-30 | Skapad av brief 31 F9 (säkerhetsbasen). Förbudslista, "enheten inte servern", säkerhetsbasens standarder, art.30-mall, re-homing, F4-nulägesfynd. |
