# 09 — Goal: Steg 12–16 (Bygg-grupp C, del 1)

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Den enda ingångspunkten för den här körningen. Läs den här filen
först. Den säger vad som ska byggas, i vilken ordning, vilka beslut som redan är
fattade (så du aldrig behöver stanna och gissa), och var du ska sluta.

---

## Utgångsläge — var projektet står

- **Steg 0–11 är byggda, verifierade och pushade.** Bekräfta mot `git log` om du
  vill — alla elva steg ligger på `main`.
- **Pengaflödet (Steg 5–7) är verifierat end-to-end** i Stripe testläge och
  granskat. Sex buggar hittade och fixade (migrationer 0017–0021). Klart.
- **Den här körningen = Steg 12–16.** Bygg-grupp C, del 1.
- **Ignorera `../SESSION-GOAL.md` i projektroten** — den är inaktuell (visar bara
  Steg 0–4). `5-Kod/SESSION-GOAL.md` är den som gäller; uppdatera den för den här
  körningen.

---

## Uppdraget

Bygg **Steg 12, 13, 14, 15 och 16** ur `05-Byggsekvens.md`, i den ordningen, ett
steg i taget. Verifiera varje steg, commita och pusha till `main` innan nästa.

**Sluta efter Steg 16.** Starta INTE Steg 17 (federation) eller Steg 18 (innehåll
& FAQ). Zivar vill ha en avstämning före dem — de kräver beslut och insats från
honom som inte är förberedda än. Avsluta körningen rent på steg-gränsen efter 16.

Kommer du inte hela vägen till 16 — det är okej. Varje steg du rört ska vara på
riktigt klart (Klar när-listan grön, pushad). Hellre fyra solida steg än fem
halvbyggda.

---

## Autonomi-regler — så jobbar du i den här körningen

Zivar är inte med. Det här är hela poängen med en `/goal`:

- **Du fattar alla tekniska val själv.** Bibliotek, komponentstruktur, hur en
  migration skrivs, namn, UI-detaljer — ditt beslut. Fråga aldrig.
- **Allt görs via kod / API / CLI.** Du går aldrig in i någon dashboard manuellt.
- **Du routar aldrig rutinbeslut till Zivar.** De öppna frågorna i modulerna är
  redan besvarade nedan med riktmärken — använd dem. Är något ändå oklart: välj
  det enklaste alternativet som uppfyller modulens krav, notera valet i
  `SESSION-GOAL.md`, gå vidare.
- **Genuint blockerat** (saknad nyckel, extern dependency du inte når) — bara då
  passerar du något. Notera det och fortsätt. Inget i Steg 12–16 ska vara
  blockerat; allt nedan är byggbart utan Zivar.
- **De få sakerna som faktiskt kräver Zivar** är samlade sist (avsnittet
  "Batchade uppföljningar") — de blockerar inte bygget och du ska inte vänta på
  dem.

Allt annat i `/goal`-kommandot gäller som vanligt: verifiera före push, en
commit per steg, databasändringar bara via numrerade migrationer, RLS på varje ny
tabell, följ `../Supabase/SAKERHETSREGLER.md`, Security Advisor grön före push.

---

## Beslut som redan är fattade — stanna inte för dessa

Modulerna har "Öppna frågor". Här är de avgjorda för den här körningen så att du
kan bygga rakt igenom. Säger en modultext och det här avsnittet olika — **det här
vinner** (det är nyare). Läs även `../1-Planering/Tillägg-Nya-beslut-2026-05-23.md`.

### Tvärgående

- **Publik geografisk integritet — tröskel 5, enhetligt.** All publik data på
  kommunnivå (kartan i M12 *och* statistiken i M16) visas bara om kommunen har
  **minst 5** insamlingar; annars döljs siffran / slås ihop till regionnivå.
  Detta löser motsägelsen mellan M12 (sa 5) och M16 (sa 1–2) — **5 gäller båda.**
  Regionnivå (21 län) har ingen tröskel.
- **Email-kanalen är vilande tills `RESEND_API_KEY` är satt.** Det är ett känt
  läge sedan pengaflödes-verifieringen (CP7). Bygg notiser/sammanfattningar så
  att in-app-kanalen fungerar fullt ut och e-post degraderar tyst när nyckeln
  saknas — samma mönster som redan finns. Det är ingen blockare.

### Steg 12 — Karta

- **Kartmotor:** MapLibre GL JS (M12 Block 9.1).
- **Basemap i den här körningen: OpenFreeMap** (gratis, ingen API-nyckel, ingen
  R2 krävs). M12 Block 9.2 + kantfall 9.7 tillåter detta uttryckligen som väg.
  Den självhostade Protomaps-PMTiles-på-R2-lösningen är en *batchad uppföljning*
  (se sist) — bygg inte den nu, men lägg basemap-källan bakom en enkel
  konfigurationspunkt så bytet senare blir en rad.
- **Choropleth-geodata:** 21 län + 290 kommuner, GeoJSON från Lantmäteriet/SCB
  öppna data. Hämta, förenkla geometrin för webben.
- **`geo_aggregat` nycklas per (område × kategori)** (M12 Block 6.3), inte bara
  per område. **`plats_taxonomi`** seedas (län/kommun + stad→region-uppslag).
  Båda finns specade i `01-Databasplan.md`.
- **Omräkning:** pg_cron var 6:e timme + vid tillståndsbyte till `aktiv` /
  `avslutad_levererad`. pg_cron är redan i bruk (settle-jobbet).
- **Minsta-antal-tröskel: 5** på kommunnivå, ingen tröskel på region.
- **Regionrapport-export** byggs i Steg 15 (det är ett M16-föreningsverktyg) —
  M12 levererar bara aggregatet. **Bygg inte** historiskt hjälp-lager (parkerat).

### Steg 13 — Community

- Kommentarer + reaktioner på **insamlingar och M7-uppdateringar**. Inloggning
  krävs. 500 tecken, ren text, inga länkar, inga bilder. Platt trådning — **ett**
  svarssteg. Två reaktioner: **Dua** och **Stöd**, inga negativa.
- **Auto-dölj vid 3 oberoende rapporter.** Hastighetsspärr mot spam-skurar.
- **Ordlista:** skapa en svensk **baslista** av diskriminerande/sekteristiska
  termer och slurar, lagrad som redigerbar data (egen tabell), så teamet kan
  utöka den senare. Den ägs formellt av M8 — men du bygger en fungerande
  startuppsättning nu, det är ingen Zivar-blockare.
- Insamlaren kan **stänga av hela kommentarsfältet** på sin insamling (Block 2.6).
  **Bygg inte** per-kommentar-döljning för insamlare (parkerat — nej).
- **Modereringskö:** bygg kö-datan och flaggorna i det här steget. Själva
  modererings-*ytan* renderas i admin/arbetsytan (Steg 15 + 16).
- Konto-eskalering (varning → kommentarsspärr → avstängning): bygg mekaniken,
  välj rimliga default-tidsgränser själv (t.ex. 7 dagars spärr). Inte blockerande.

### Steg 14 — Events

- Event-objekt enligt fält-tabellen i M14 Block 1.2. **Moské-sidan = en vy av en
  M10-katalogentitet** (M10 byggdes i Steg 11) — inget eget objekt.
- Event-granskning: lättare checklista, återanvänd M3:s kö-koncept. **SLA 48 h.**
  **Fast-track efter 3 rena event** för betrodda föreningar; aldrig för
  privatpersoner.
- Återkommande event = **ett** objekt med upprepningsmönster, inte hundra rader.
- **Bygg inte:** anmälan/biljetter, bönetider, fritextsök i eventlistan (filter
  räcker), kommentarstråd på events — alla parkerade för v1.
- Auto-städning av passerade/döda events enligt Block 5.4.
- Events matar M12-kartan som ett **eget, av-/påslagbart pin-lager**.

### Steg 15 — Admin & dashboard (M16)

- Larm-trösklar (riktmärken — använd dem rakt av): rött SLA-larm vid **> 96 h**;
  enskild donation **> 25 000 kr** = gult larm; en ny insamling **0 → > 50 000 kr
  inom 1 h** = rött larm + auto-paus; många donationer från samma kort på kort
  tid = rött.
- **K-anonymitet för publik kommun-statistik: tröskel 5** (enhetligt med M12).
- **Daglig sammanfattning:** e-post-digest, en gång per dygn, default kl. 07:00
  (tiden konfigurerbar). E-post vilande tills `RESEND_API_KEY` finns; in-app
  fungerar.
- Behörighet: M16 **lyder** M6:s rollmatris — definiera inga egna roller. Mappa
  verktygslådan mot granskare/admin exakt enligt M16 Block 4.2.
- **Regionrapport-export** byggs här som föreningsverktyg — PDF (ditt val på
  formatet; PDF rekommenderas), genereras aldrig för ett område under tröskel 5.

### Steg 16 — Team & intern arbetsyta (M17)

- Arbetsyta-skalet som M16:s driftvy och M3:s granskningskö renderas **inuti**.
  Två roller i v1: **Admin** och **Granskare**. Ingen tredje roll ("Support" är
  parkerad).
- Team-konton: **inga självregistreringar** — admin bjuder in. Onboarding /
  offboarding. **Append-only aktivitetslogg.**
- **Stark inloggning för team-konton: e-post + lösenord + obligatorisk 2FA
  (TOTP).** BankID är ett senare uttag, inte v1 — konsekvent med Tillägg A5
  (ingen BankID-broker i v1). Detta avgör M17:s öppna fråga 2.
- **Ingen direkt databasåtkomst för någon** — arbetsytan är enda verktyget.
- Team-e-postadresser (`namn@sadaqahsweden.se`) byggs **inte** av dig — det är en
  driftuppgift för Zivar (se batchade uppföljningar).

---

## Datamodell-förberedelse för federation — gör detta, bygg inte mer

Tillägg-Nya-beslut B1 inför senare en region-baserad admin-federation (Steg 17,
nästa körning). Den **byggs inte nu** — men datamodellen ska känna till den så att
Steg 17 inte kräver en smärtsam ombyggnad. När du bygger Steg 15 och 16:

- **Admin-nivå/scope:** dagens roll `admin` räcker inte för tre nivåer
  (superadmin / region-admin / medhjälpare). Reservera utrymme — t.ex. ett
  nullbart `admin_niva`-fält + nullbart `region_id` — utan att bygga någon
  federations-logik eller -UI.
- **Granskning region-scopas:** lägg ett nullbart region-fält på granskning så
  att en regions kö kan filtreras fram senare.
- **`insamlar_region` på insamling:** säkerställ att fältet fylls och
  normaliseras (det kopplar även M12-kartan).

Detta är **förberedande schema-utrymme, inget mer.** Bygg ingen federation.

---

## Stegen — Klar när

Varje steg pekar på sin modul i `../1-Planering/` för *vad*, och på
`01-Databasplan.md` för schema. Modulerna är fulldjupa — följ dem.

### Steg 12 — Karta & geografisk insikt (M12)
**Klar när:** `/karta` lever med en riktig, geografiskt korrekt MapLibre-karta i
plattformens stil; choropleth per region/kommun; insamlar-vy + hjälp-vy;
topplista bredvid kartan; drill-down region → kommun → insamling; `geo_aggregat`
+ `plats_taxonomi` migrerade med RLS; pg_cron-omräkning var 6:e timme; minsta-
antal-regeln (5) appliceras i aggregat-steget; `npm run build` grön; pushad.

### Steg 13 — Community & samtal (M13)
**Klar när:** kommentarer + Dua/Stöd på insamlingar och uppdateringar; inloggning
krävs; 500-teckens ren text utan länkar; ett trådsteg; ordlistefilter +
hastighetsspärr + rapportering med auto-dölj vid 3; modereringskö-data finns;
insamlaren kan stänga av kommentarsfältet; alla nya tabeller har RLS; test för
behörighet (vem får kommentera/moderera); `npm run build` grön; pushad.

### Steg 14 — Events & platsinfo (M14)
**Klar när:** event-objekt skapas, granskas (48 h SLA, lättare checklista) och
publiceras; moské-sida som vy av M10-entitet med öppettider; eventlista med
filter; events som pin-lager på M12-kartan; återkommande event som ett objekt;
auto-städning av passerade event; fast-track efter 3 rena event; RLS på nya
tabeller; `npm run build` grön; pushad.

### Steg 15 — Admin & dashboard (M16)
**Klar när:** driftöversikt med fyra paneler (grön-som-default); statistik-
dashboard (intern + publik kurerad delmängd, k-anonymitet 5); tvånivå-larm med
trösklarna ovan; verktygslådan (pausa/återställ/stäng/refund/överrida/
larmhantering) rollmappad mot M6; oföränderlig admin-logg; daglig sammanfattning;
regionrapport-export; federation-schemat reserverat (se ovan); test för
roll-behörighet på verktygen; `npm run build` grön; pushad.

### Steg 16 — Team & intern arbetsyta (M17)
**Klar när:** en inloggad, rollmedveten arbetsyta som omsluter M3:s granskningskö
och M16:s driftvy; två roller (Admin, Granskare); team-konton med inbjudan,
obligatorisk 2FA, onboarding/offboarding; append-only aktivitetslogg; ingen
direkt databasåtkomst; test för rollgränserna; `npm run build` grön; pushad.

**Efter Steg 16: stoppa.** Uppdatera `SESSION-GOAL.md`, sammanfatta körningen, gå
inte vidare till Steg 17.

---

## Batchade uppföljningar — kräver Zivar, blockerar inte bygget

Samlade här så de tas i ett svep efter körningen. Inget av detta hindrar dig från
att bygga Steg 12–16 fullt ut.

1. **Karta i produktion:** byt basemap från OpenFreeMap till självhostad
   Protomaps PMTiles på Cloudflare R2 (skapa R2-bucket, bygg Sverige-extrakt,
   ladda upp). Rör prestanda/ägarskap, inte funktion. Kan du göra det via
   `wrangler` om CLI:t är inloggat — gör det och flytta ner punkten; annars
   lämna den här.
2. **Team-e-post:** Cloudflare Email Routing för `namn@sadaqahsweden.se` (Steg 16).
3. **`RESEND_API_KEY`:** sätt i miljön så e-postkanalen (kvitton, daglig
   sammanfattning, community-notiser via e-post) går live.

Lista det du faktiskt stöter på i `SESSION-GOAL.md` under en tydlig rubrik så
Zivar ser hela högen samlad.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första goal-briefen för Bygg-grupp C del 1 (Steg 12–16). Öppna frågor avgjorda med riktmärken; M12/M16-integritetströskeln enad till 5; federation-schemat reserverat; stopp efter Steg 16. |
