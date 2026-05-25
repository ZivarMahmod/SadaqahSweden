# 03 — Ytor per yta

För varje yta i studion: **Vad den är · Layout · State · Beteende · Edge cases · Implementation-noter**.

Källkod-referens: `source/studio/screens-public.jsx`, `screens-account.jsx`, `screens-internal.jsx`.

---

## 01 · Marketing (startsidan)

**Route:** `/` · **Modul:** M-Marketing · **Chrome:** Public

### Vad det är
Den första sidan en besökare landar på. Sätter ton och förtroende. Visar att plattformen finns, granskar och att vi har riktiga insamlingar igång.

### Layout (i ordning)
1. **Masthead** — N° 01 + Sadaqa Sweden Quarterly + dagens datum (Shawwal/Maj)
2. **Hero (7+5 grid)** — Stor display-rubrik "Ge öppet. Bli granskad. *Visa resultatet.*" + lead + två CTA:s. Höger: I FOKUS-kampanj-kort med foto, progress, "Läs hela storyn"
3. **KPI-strip (4 kolumner)** — 8,4 mkr · 412 granskade · 36 föreningar · 100% till mottagaren
4. **§ 01 Kategorier** — 8 kategorier i 4×2-grid med antal aktiva, klickbara → discovery
5. **§ 02 Så fungerar det** — 3 vertikala kolumner med kontrollpunkterna
6. **§ 03 Pågående insamlingar** — 1 wide + 5 grid (4-3-3-3-3 magazine layout)
7. **§ 04 Trygghetslinjen (forest-deep)** — De tre granskningsprinciperna med romerska siffror
8. **Pull-quote (paper-soft)** — Hadith på Spectral 32px italic
9. **§ 05 För föreningar** — CTA-band med bordered-card
10. **Footer** (från befintlig)

### Demo-interaktion
- Alla CTA:s navigerar — discovery, wizard, catalog
- Kampanj-korten klick → fundraiser

### Implementation-noter
- **Datum-strängen** (Shawwal/Maj) bör räknas dynamiskt — det är hijri-månaden + gregorianska
- **KPI-siffrorna** är aggregat över hela plattformen (cached, uppdateras 4x/dag)
- **I FOKUS-kampanjen** roteras manuellt av admin (M16) — flagga `featured: boolean` på campaign
- **Hadith** — gör en `<HadithRotator>` som visar 1 av ~10 kuraterade hadither, deterministisk på dagen
- **"För föreningar"-CTA** länkar till `/foreningar/anslut` (ej i studion, separat sida)

---

## 02 · Discovery (hitta insamlingar)

**Route:** `/insamlingar` · **Modul:** M11 · **Chrome:** Public

### Vad det är
Listning + filter + sök för alla aktiva insamlingar.

### Layout
1. **Head** — Eyebrow med live-count + h1 + lead
2. **Filter-rad** — Sökruta + sortering-select + zakat-checkbox + grid/list-toggle
3. **Kategori-chips** — Alla / 8 kategorier (toggle på/av)
4. **Aktiv-filter-rad** — Visar bara om filter är aktivt; chips med X för att rensa
5. **Lista** — Grid (3-kolumn) eller list-view (kompakt-rader)
6. **Tomt-state** — Om filter ger 0 träffar

### State
```js
const [cat, setCat] = useState(null);          // 'Vatten' | 'Mat' | etc.
const [sort, setSort] = useState('hot');       // 'hot' | 'new' | 'goal' | 'amount'
const [q, setQ] = useState('');                // söktext
const [view, setView] = useState('grid');      // 'grid' | 'list'
const [zakatOnly, setZakatOnly] = useState(false);
```

### Beteende
- Filtrering på klient (när listan blir > 200, gör server-side med `?cat=…&sort=…`)
- URL ska uppdateras med query-params så filtrerade vyer går att dela: `/insamlingar?cat=vatten&sort=new`
- Pagination: `?page=2` — i studion ej implementerat, default till 24 per sida

### Edge cases
- **Inget matchar:** Tomt-state med "Rensa filter" + "Starta ny insamling"-CTA
- **Inget Zakat-OK i kategorin:** Visa varning + erbjud att ta bort zakat-only-filter
- **Akuta projekt:** Sortera först om `tags.includes('Akut')` (override)

### Implementation
- **Sökning** ska träffa: title, location, org-namn, starter-namn — inte description (för långt)
- **"Slutspurt"-tag** läggs till automatiskt om `daysLeft <= 7 && raised/goal > 0.6`
- **Zakat-OK-tag** sätts av insamlaren i wizard, godkänns av granskaren — det är en deklaration som granskaren validerat

---

## 03 · Fundraiser (insamlingssidan)

**Route:** `/insamlingar/[slug]` · **Modul:** M1 + M7 · **Chrome:** Public

### Vad det är
Plattformens centrala yta. En enskild insamlings publika sida — story, mottagare, bevis, granskning, samtal + donate-CTA.

### Layout
1. **Breadcrumb** — Hem / Insamlingar / Vatten / Diabaly
2. **Editorial masthead** — Eyebrow med kat·land·by + Display-rubrik (split: "En brunn för byn Diabaly." / *280 personer får rent vatten.*) + byline-rad med avatar, BankID-check, trust-poäng + status-tags
3. **Hero-foto** — 21:9 ratio, fullbredd
4. **Two-column body**:
   - **Left (1.7fr)** — 5 tabs: Storyn | Bevis & uppdateringar (3) | Mottagare | Granskning | Samtal & dua (24)
   - **Right (1fr, sticky)** — Donate-kort med belopp-grid + "Ge {kr}"-knapp + 100%-meddelande + spara/dela + Q&A-teaser

### State
```js
const [tab, setTab] = useState('story');     // 'story' | 'proof' | 'recip' | 'review' | 'dua'
const [amount, setAmount] = useState(200);   // sticky donate-amount
```

### Tabb-innehåll

**Storyn** — Lead med drop-cap (5em copper-deep första bokstav) + paragrafer + pull-quote i italic + budgetuppdelning som table

**Bevis & uppdateringar** — Timeline med markerings-prickar i accent-färg. Varje item: datum + typ ("Start" / "Uppdatering" / "Bekräftelse") + titel + body + proof-pillar (`📎 3 dokument · 24 dua`)

**Mottagare** — 3 led: Insamlare → Partner → Utförare. Var och en med org.nr, "Visa intyg →"

**Granskning** — Granskar-beslut med I/II/III principer + verdict-tags

**Samtal & dua** — Sticky dua-knapp (🤲 cirkel) + sorterad lista över kommentarer med dua-räknare per

### Donate-kortet (sticky)

```
148 200 kr
av 200 000 kr · 74%
[============================>      ] (forest)

287 donatörer        12 dagar kvar

VÄLJ BELOPP
[100][200][500][1000][2000][Eget]    (3x2 grid, ink-knappar)

[ Ge 200 kr → ]                       (accent, lg, block)
100% till mottagaren. Plattformen tar inga avgifter — Stripes faktiska kortavgifter visas på kvittot.

[♡ Spara] [⬈ Dela]                    (ghost, sm)
```

### Beteende
- Klick på belopp → uppdaterar "Ge {kr}"-knappen
- "Eget" öppnar number-input in-place
- "Ge 200 kr" → navigerar till `/insamlingar/[slug]/donera?amount=200`
- Spara → toast: "Sparad i favoriter" (kräver inloggning)
- Dela → öppnar share-sheet eller kopierar länken

### Edge cases
- **Insamlingen är slut** — Donate-knappen byts mot "Avslutad — se resultatet" och länkar till sista bevis-uppdatering
- **Pausad** (bevis försenat) — Röd banner överst, donate inaktiverad
- **Bevis-flöde inkomplett** — Tab "Bevis" visar varning men insamlingen kan vara aktiv

### Implementation
- **`updated_at` på campaign** ska visas — om > 14 dagar och pågående, gul-flagga
- **`slug`** genereras från titel vid skapande (slugify, dedupe)
- **Sticky-kortet** kan hamna ihop med footern på långa story-sidor — sätt `scroll-margin-bottom: 80px`

---

## 04 · Donate (donator-flöde)

**Route:** `/insamlingar/[slug]/donera` · **Modul:** M4 · **Chrome:** Public

### Vad det är
Plattat från 3 steg till 1 form + 1 bekräftelse. Belopp + namn-visning + Stripe.

### Layout
2-kolumn (1fr + 1.3fr):
- **Vänster** — Kampanj-sammanfattning med foto, titel, progress-bar, "Så sker utbetalningen"-card
- **Höger** — Step 1 form ELLER Step 2 success

### Step 1 (form)
```
STEG 1 AV 2 · SADAQA
Ge 200 kr.

[ VÄLJ BELOPP
  [100][200][500]
  [1000][2000][5000]   ← 200 är aktiv (ink-bg, paper-text)
  [______________ Annat belopp i kr ]
  
  HUR DU VISAS
  [ Med namn ✓ ]  [ Anonym ]
  
  [ Gå till Stripe-betalning · 200 kr → ]
  🔒 SSL · Stripe · Inga uppgifter sparas på sajten
]
```

### Step 2 (success)
- Stort grönt check
- "Tack — 200 kr är skickade."
- "Kvitto skickat till yasmin@example.com. Du får ett mejl när Yasmin postar nästa transparens-uppdatering."
- CTA: "Tillbaka till sidan" / "Utforska fler →"

### State
```js
const [amount, setAmount] = useState(200);
const [custom, setCustom] = useState('');     // overrider amount om satt
const [anon, setAnon] = useState(false);
const [step, setStep] = useState(1);
```

### Beteende & implementation
- **`?amount=X` i URL** — pre-fill från fundraiser-sidan
- **Riktiga steget mellan 1 och 2** — Stripe Checkout redirect; success_url tar tillbaka hit med ?session_id=…
- **BankID-snabbval** för redan-inloggade — ej i studion, lägg till som extra knapp i Step 1 om `session.user.bankIdVerified`
- **Inga uppgifter sparas** — vi tar e-post från Stripe-customer object, namn från BankID eller anonymt

### Edge cases
- **Tar emot insamlingen pengar?** — Kolla `payment_intent` status innan visa step 2. Vid `requires_action` (3DS), Stripe.js handlar det.
- **Min-belopp** — 50 kr (Swish/Stripe minimum)
- **Max-belopp** — 100 000 kr (över det: kontakta admin för wire transfer)

---

## 05 · Profile (publik profil)

**Route:** `/u/[handle]` · **Modul:** M9 · **Chrome:** Public

### Vad det är
Insamlarens publika sida — historik, badges, transparens. Vad besökare ser innan de donerar.

### Layout
1. **Hero-block** — 180px avatar (bara initialer) + namn (display, 70-80px) + meta-rad + status-tags + trust-poäng-card (clickable för uppdelning)
2. **KPI-strip** — Avslutade | Aktiv just nu | Total insamling | Donatörer totalt
3. **§ Aktivt** — Wide CampaignCard för pågående
4. **§ Historia** — Tabell-rader: år | titel | org | belopp | bevis-tag (komplett/saknar)
5. **§ Kontakt** — Strukturerad form med 4 ämnen-knappar + textarea

### Trust-poäng-uppdelning
Klick på "92/100"-cardet → popup från forest-deep-bg med:
- BankID-verifierad +30
- 8 avslutade insamlingar +24
- Transparens-bevis 7/8 +28
- Föreningskoppling +10
- 1 missad uppdatering −0

### State
```js
const [showTrust, setShowTrust] = useState(false);
```

### Implementation
- **Trust-poängen räknas** server-side, uppdateras vid varje proof-event
- **Handle** — `firstname-lastname` slug; vid kollision suffix
- **"Skicka fråga"-form** — strukturerade ämnen, inte fri text. Q&A publiceras på profilen om insamlaren svarar (default: privat tills svarad)
- **Historik-tabellen** — paginerad om > 20 rader

---

## 06 · Account (mina insamlingar — dashboard)

**Route:** `/mina-sidor` · **Modul:** M2 + M9 · **Chrome:** Insamlare

### Vad det är
Insamlarens hemvy. Tidigare bara en lista — nu ett riktigt dashboard.

### Layout
1. **Header** — "Hej Yasmin." + "+ Ny insamling"-CTA + "Lägg upp bevis"-sekundär
2. **KPI-rad (4 kolumner)** — Pågående nu | Samlat totalt | Donatörer live | Trust-poäng
3. **Todo-kort (3 kolumner)** — Bevis behövs (accent-bordered), Uppdatering schemalagd, Donatorfrågor
4. **Tab-bar** — Aktiva (1) | Utkast (2) | Under granskning (1) | Avslutade (8)
5. **Tabell** — Projekt | Status | Insamlat | Donatörer | Slut | →

### State
```js
const [tab, setTab] = useState('active');
```

### Status-pillar i tabellen
- ● Aktiv (success)
- Utkast (outline)
- ⏳ Hos granskare (accent)
- ✓ Avslutad (outline)

### Implementation
- **Todo-kort genereras** dynamiskt baserat på state:
  - Om någon avslutad insamling saknar slutbevis → "Bevis behövs"-kort
  - Om scheduled-update finns → visa nästa
  - Om obesvarade frågor finns → visa count
- **Klick på tabellrad** → fundraiser-detalj (egen redigeringsvy om är insamlare; ej i studion, separat scope)

---

## 07 · Wizard (skapa insamling)

**Route:** `/mina-sidor/ny` · **Modul:** M2 · **Chrome:** Insamlare

### Vad det är
5-stegs-flow för att skapa en ny insamling.

### Steg
1. **Identitet** — BankID + publikt namn + stad + (frivillig) erfarenhetsbeskrivning
2. **Mottagare** — Anslutet förening / Ny förening + utförare + utbetalningsväg
3. **Mål & budget** — Belopp + dagar + budgetuppdelning (rader)
4. **Story & media** — Titel + kategori + story-textarea + bilder (drag-drop)
5. **Skicka in** — Sammanfattning + intygande-checkbox + "Skicka till granskning"

### Layout
- 5-step stepper högst upp med klickbara segment (visar status med ✓/aktiv/ej-aktiv)
- 2-kolumn body: vänster form (1.6fr) + höger tips-panel (1fr)
- Tips-panelen visar "Vad granskaren tittar på" (3 principerna) + "Behöver du hjälp?"-kort

### State
```js
const [step, setStep] = useState(1);   // 1..5
const [data, setData] = useState({});  // hela formet
```

### Beteende
- "Fortsätt →" går till nästa steg (`Math.min(5, step+1)`)
- "← Föregående" tillbaka
- Klick på stepper hoppar till steget direkt (om ej spärrat)
- Auto-save till localStorage var 10 sek (live in code, ej i studion)
- "Spara som utkast" i step 5 (saved as draft i DB)
- "Skicka in" → POST till granskningskön + redirect till `/mina-sidor` med toast

### Edge cases
- **BankID redan i sessionen** — Steg 1 hoppar över personnummer-input, visar "✓ Verifierad" direkt
- **Föreningar finns inte** — "Ny förening"-flöde startar separat sida `/foreningar/anslut`
- **Bildvalidering** — Min 3, max 10, format JPG/PNG, max 5 MB var, total max 30 MB

### Implementation
- **Wizard-state** sparas i Supabase som `draft_fundraisers` med `current_step`
- **Vid skicka-in** flyttas till `fundraisers` med status `pending_review` + notis till granskar-kön

---

## 08 · Update (transparens-uppdatering)

**Route:** `/mina-sidor/[slug]/uppdatering` · **Modul:** M7 · **Chrome:** Insamlare

### Vad det är
Form där insamlaren postar bevis under och efter en insamling.

### Layout
1. **Header** — "Vad har hänt?" + lead
2. **Form-block** (vit, ink-bordered):
   - Typ-väljare (4 knappar): Bevis | Status | Resultat | Hinder
   - Vilken insamling? (select)
   - Rubrik
   - Vad hände? (textarea)
   - Bevis (drag-drop)
   - Belopp utbetalat (visas bara om typ = "Bevis")
3. **Footer** — Spara utkast / Publicera

### State
```js
const [type, setType] = useState('proof');
```

### Beteende
- Typ "Bevis" eller "Resultat" kräver minst 1 bilaga
- Typ "Hinder" är gult-flaggat och triggar mejl till alla donatorer ("X har postat en uppdatering om hinder")
- Vid publicera → donatorerna får mejl, sidan visar uppdateringen i tab "Bevis"

### Implementation
- **Belopp-utbetalat** matchas mot Stripe payouts → varning om mismatch
- **PDF-kvitton** OCR:as för enkel sökning (M7 nice-to-have)

---

## 09 · Admin (dashboard)

**Route:** `/` (på `admin.sadaqasweden.se`) · **Modul:** M16 · **Chrome:** Admin

### Vad det är
Hela maskinrummets ingång. KPI:er, larm, live-aktivitet.

### Layout
1. **Header** — "Plattformsöversikt" + Exportera rapport + Filter:idag
2. **KPI-rad (4)** — Samlat idag | Aktiva projekt | Väntar på granskning | Stripe-balans
3. **Två-kolumns body:**
   - **Vänster (1.6fr):** Donationer-bar-chart över 24h + Senaste donationer (tabell)
   - **Höger (1fr):** Critical alert-card + Pending review-card + Systemstatus (Stripe/BankID/Supabase/Mail)
4. **Botten-row:**
   - **Vänster (1.4fr):** Topp-insamlingar idag (tabell)
   - **Höger (1fr):** Nya registreringar (lista)

### Beteende
- Filter idag/vecka/månad ändrar alla siffror
- Klick på critical alert → review-detalj
- Auto-refresh var 30 sek (live data)

### Implementation
- **Bar chart** — 24 vertikala staplar, sista 6h är accent-färgade (= "live")
- **Senaste donatörer** uppdaterar via Supabase realtime channel
- **System-status** pollar healthchecks varje minut

---

## 10 · Review (granskningskö)

**Route:** `/granskning` · **Modul:** M3 · **Chrome:** Admin

### Vad det är
Den viktigaste interna vyn. Granskare prövar varje insamling mot tre principer innan publicering.

### Layout (split)
- **Vänster kö (320px)** — Lista med ärenden, ID + ålder + risk-tag + titel + meta
- **Höger detalj (1fr)** — Selected ärende:
  - Header: ID + kategori + h2 titel + meta (vem, stad, mål, ålder) + risk-tag
  - "Bedöm tre principer"-block: I/II/III rader med beskrivning + OK/Fråga/Avslå-knappar per rad
  - Granskar-anteckning (textarea, intern)
  - Decision-rad: Spara utan beslut | Ställ frågor | Avslå | ✓ Godkänn & publicera

### State
```js
const [selected, setSelected] = useState('q1');  // currently inspected case
const [verdicts, setVerdicts] = useState({});    // per-principle decisions
const [note, setNote] = useState('');
```

### Beteende
- **OK/Fråga/Avslå per princip** — färgade knappar (success/copper/danger), inte sticky-state men sparas i `verdicts`
- **Godkänn-knappen** kräver att alla tre principer markerats OK
- **Avslå** kräver anteckning
- **Ställ frågor** öppnar template-modal med strukturerade frågor till insamlaren

### Edge cases
- **Tom kö** — Visa "🍵 Inget att granska — gå och drick te"-empty state
- **Ärende > 48h gammalt** — Röd flagga + auto-tilldelas en annan granskare
- **Två granskare på samma ärende** — Lock-mekanism, andra granskaren ser "Imran granskar just nu"

### Implementation
- **Kö-sorting**: ålder DESC, risk-prio (high först)
- **Tilldelning** kan vara manuell eller round-robin
- **Beslut sparas** atomärt — godkänn skapar `decision` + flyttar fundraiser till `active`

---

## 11 · Team (arbetsyta)

**Route:** `/team` · **Modul:** M17 · **Chrome:** Admin

### Vad det är
Team-medlemmars presence + gemensam todo.

### Layout
1. **Header** — "Arbetsyta" + "6 personer"
2. **Team-grid (3 kolumner × 2 rader)** — Member-cards med avatar + presence-prick (online/away/offline) + namn + roll + city + open tasks
3. **Gemensam todo (tabell)** — Checkbox + uppgift + ansvarig + frist + prio + öppna

### Beteende
- Klick på medlem → DM eller deras profil-vy (ej i studion)
- Todo-rader klick → öppna ärende
- Checkbox för att markera klar

### Implementation
- **Presence** via Supabase realtime channels
- **Todo** är en enkel tabell i DB, delad mellan teamet

---

## 12 · Map (Sverige-karta)

**Route:** `/karta` · **Modul:** M12 · **Chrome:** Public

### Vad det är
Geografisk översikt — var pengar kommer från, var de landar. **Placeholder i studion — riktiga kartan är Leaflet + OpenFreeMap.**

### Layout
1. **Head** — eyebrow + h1 + lead
2. **KPI-rad (4)** — Aktiva insamlingar | Levererade | Verifierade insamlare | Insamlat totalt
3. **Two-column:**
   - **Vänster** — Karta (640x500-ish) med toggle-chips för Län/Kommun/Hjälp-vy + "Visa events"
   - **Höger** — Topplista (10 städer/län) ELLER stad-detaljvy med dess insamlingar
4. **Attribution-rad** — "Bakgrundskarta © OpenStreetMap…"

### Beteende
- Klick på prick / län → side panel visar listans insamlingar
- Toggle-chips byter layer (län vs kommun-prickar)
- K-anonymity: bara län/kommuner med ≥5 insamlingar visar siffror på kommun-nivå

### Implementation
- **Leaflet + OpenFreeMap-tiles** (gratis, EU-baserat)
- **Län-geojson** från Lantmäteriet
- **Kommun-geojson** från SCB öppna data
- **Choropleth** baserat på antal insamlingar per region
- **Aggregat-cache** uppdateras var 6:e timme

---

## 13 · Community (samtal + events)

**Route:** `/community` · **Modul:** M13 + M14 · **Chrome:** Public

### Vad det är
Strukturerade samtal + händelser. **Inte Facebook.**

### Layout
3 tabs: **Samtal | Händelser | Moskéer & föreningar**

### Samtal-vy (default)
- Vänster: lista med trådar (avatar + tag + hot-flag + titel + meta + replies + dua)
- Höger sidpanel: Samtalsregler (forest-deep) + Total dua-räknare

### Händelser-vy
- 2-kolumn grid med event-cards (datum-block + tag + titel + plats + going/cap + Anmäl-knapp)

### State
```js
const [tab, setTab] = useState('threads');
const [duaCount, setDuaCount] = useState({});  // per-thread dua bumps
```

### Beteende
- Dua-knappen 🤲 räknar närvaron — anonym, en gång per användare per tråd
- "+ Nytt samtal" öppnar form med struktur: tag (krav) + titel + body + relaterad-insamling (optional)
- Threads kan moddas av Mahmood (community-mod-roll i M17)

### Implementation
- **Tag-set:** Zakat, Ramadan, Insamlare, Lärande, Allmänt (curerat)
- **"Het"-flagga** sätts automatiskt om ≥10 replies senaste 24h
- **Politik utanför projekt** — soft moderation, mod kan flagga och dölja

---

## 14 · Catalog (föreningskatalog)

**Route:** `/foreningar` · **Modul:** M10 · **Chrome:** Public

### Vad det är
Lista över anslutna föreningar och moskéer.

### Layout
1. **Head** — eyebrow + h1
2. **Stad-chips** — Alla / Stockholm / Göteborg / Malmö / Uppsala / Helsingborg
3. **Tabell-rader** — # + namn + typ/stad + aktiva-count + total-belopp + verifierad-tag + "Se profil"

### Beteende
- Klick på chip filtrerar
- Klick på rad → org-profil (ej i studion)

### Implementation
- **Org-typer:** Hjälporganisation | Moské | Förening
- **Verifierad-status** kräver: org.nr i Bolagsverket + 90-konto eller Stripe Connect-konto + manuell granskning

---

## 15 · Auth (BankID-login)

**Route:** `/logga-in` · **Modul:** M6 · **Chrome:** Ingen (egen layout)

### Vad det är
Login-flödet. BankID först, e-post som fallback.

### Layout
Split två-kolumn:
- **Vänster** — Forest-deep panel med h1 + lead + support-länk i botten
- **Höger** — Tab-väljare BankID/E-post + form

### BankID-flöde
1. Personnummer-input → "Öppna BankID"
2. Spinner + "Öppna BankID-appen…" + "Hoppa till konto (demo)"-länk
3. Vid signering klar → redirect till `account`

### E-post-flöde
- E-post + lösenord → `account`
- "Glömt lösenordet?" → reset-flöde (ej i studion)

### Implementation
- **BankID-stegen** ska implementeras enligt `2-Byggplan/03-BankID-auth-donationsflode.md`
- **Sessionen** via Supabase Auth med custom JWT-claim för bankid-verified

---

## 16 · Audit (inbyggd designgranskning)

**Route:** Endast i studion · **Chrome:** Ingen specifik

### Vad det är
Lista med 17 designproblem från v0.1 + åtgärder. Inte produktion — det här är en *artefakt* från designarbetet som hjälper Claude Code förstå *varför* saker är som de är.

### Layout
1. **Head** — eyebrow + display-rubrik "Otydligheter, hierarkier och saker som *make no sense*" + lead
2. **Summary-rad** — 17 fynd | 8 större | 9 mindre | 17 åtgärdade
3. **Filter-chips** — Alla / Större / Mindre
4. **Grupperad lista per yta** — Marketing, Discovery, Fundraiser… expanderbara rader

### Beteende
- Klick på rad expanderar med PROBLEM (danger-färg) | ÅTGÄRDAT (success-färg)
- "Öppna ytan →"-knapp per surface-grupp

### Implementation
- **Existerar inte i produktionen** — strunta i den när du bygger
- **Behåll som referens** under bygget. Om en design-fråga uppstår, kolla audit-listan: "har vi haft det här problemet förr?"
