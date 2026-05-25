# 05 — Audit-fynd från v0.1 → v0.2

Den här filen listar **17 designproblem** vi hittade i v0.1 och hur de är åtgärdade i v0.2. Det är inte bara historia — det är *aktiv vägledning* för Claude Code. Om du står inför ett liknande val under bygget, kolla här först.

Listan finns också i studion under fliken "Audit · 17 fynd" och i `source/studio/data.js` under `STUDIO_DATA.audit`.

> **Severity:** *Större* = bröt en princip / underminerade förtroendet. *Mindre* = irritation eller polish.

---

## Marketing — 3 fynd

### M-01 · Större — Hero-stacken kändes som "kassaregister"
**Problem:** Det stora kortspelet med produktbild över mörk yta liknade ett SaaS-kassasystem. Risk att signalera fel kategori — vi är inte en POS-leverantör.
**Åtgärdat:** Bytt mot ett enskilt, stort foto med en tunn kampanj-overlay. Inget kortspel. Hero-text till vänster, foto till höger.
**För Claude Code:** Marketing-hero ska aldrig se ut som en produkt-mockup-stack. Foto som *innehåll*, inte foto som *produkt*.

### M-02 · Mindre — För många section-eyebrows ovanpå varandra
**Problem:** Varje sektion hade "STAR · LABEL"-eyebrow — repetitivt och stökigt.
**Åtgärdat:** Tunn numrerad rule (`§ 01 — KATEGORIER`) som tidskrifts-section-break. Mindre dekor, mer struktur.
**För Claude Code:** Använd `<Section number="§ 01" title="…" />`-komponenten — den är spec:ad i `02-Designsystem.md`.

### M-03 · Mindre — "Powered by Corevo" i footern
**Problem:** Plattformen är inte byggd på Corevo. Det är *design-systemet* vi lånar visuellt — inte tekniken. Vilseledande för läsare.
**Åtgärdat:** Tagit bort. Footern blev renare.
**För Claude Code:** Ingen "powered by X" i footern. Org.nr-raden räcker. Om partnerskap ska visas, gör det medvetet på en "om oss"-sida.

---

## Discovery — 2 fynd

### D-01 · Större — Filtren såg ut men gjorde inget
**Problem:** Kategori-pillarna, sortering, sökrutan — alla var dekorativa. Användaren förstod inte vad som hände vid klick.
**Åtgärdat:** Riktig filtrering nu på klient-state. Klick på kategori filtrerar listan; sortering ändrar ordningen; sök filtrerar på titel + plats.
**För Claude Code:** **Bygg filter med state från start**, inte som "polish-later". Filter som inte fungerar är värre än inga filter.

### D-02 · Mindre — Listan saknade tom-state
**Problem:** När inget matchade visades bara… inget. Förvirrande.
**Åtgärdat:** Tomt-läge med tydlig CTA: "Inget matchade — rensa filter eller starta en ny insamling".
**För Claude Code:** Varje listvy MÅSTE ha tom-state. Lägg till från första iterationen, inte sist.

---

## Fundraiser — 2 fynd

### F-01 · Större — Donationskolumnen var inte sticky
**Problem:** På långa story-sidor förlorade man donate-knappen — måste scrolla upp. Konverteringsdödare.
**Åtgärdat:** Höger kolumn sticky med pris, progress, CTA. Stannar i blicken.
**För Claude Code:** `position: sticky; top: 24px; align-self: flex-start;` på donate-aside. Testa på sidor med 3000+ ord story.

### F-02 · Mindre — Fem tabbar i oklar ordning
**Problem:** "Storyn → Mottagare → Bevis → Granskning → Dua" — varför just den ordningen? Bevis är ofta det viktigaste.
**Åtgärdat:** Omflyttat: **Storyn → Bevis → Mottagare → Granskning → Samtal**. Bevis lyfts som det näst-första, eftersom det är det som skiljer Sadaqa från GoFundMe.
**För Claude Code:** Bevis-fliken default-öppnad om insamlingen har bevis-uppdateringar **OCH** användaren har scrollat förbi storyn (kan vänta med detta).

---

## Donate — 2 fynd

### Do-01 · Större — Tre steg lät byråkratiskt
**Problem:** "Belopp → Uppgifter → Bekräftelse" var tre steg. Donator hatar former — tre steg gör det värre.
**Åtgärdat:** Plattat till **1 form-steg + 1 success-steg**. Belopp + namn-visning + Stripe i ett kort. "Som anonym" är en tydlig knapp, inte gömd checkbox.
**För Claude Code:** Stripe Checkout sköter card-detaljer — vi behöver bara samla in belopp + anonym-val + (frivilligt) e-post. Färre fält = högre konvertering.

### Do-02 · Mindre — Beloppsknapparna var inkonsekventa
**Problem:** 50/100/200/500/1000/Eget — fungerade okej, men "Eget" hoppade på sin egen rad.
**Åtgärdat:** Sex jämna chips i 3×2-grid, "Eget" blir input-fält in-place när man klickar.
**För Claude Code:** Default-beloppen kan A/B-testas — vi börjar med 100/200/500/1000/2000/5000.

---

## Profile — 2 fynd

### P-01 · Större — Trust-poäng utan kontext
**Problem:** "92/100" utan förklaring = misstanke. Hur räknas det?
**Åtgärdat:** Klick på poängen ger uppdelning: "BankID +30, 8 avslutade +24, transparens-bevis +28, föreningskoppling +10".
**För Claude Code:** Trust-poäng MÅSTE vara transparent. Använd `trust_scores`-vyn i Postgres och visa breakdown i UI.

### P-02 · Mindre — Inget sätt att kontakta insamlaren
**Problem:** Saknades helt. Vissa vill ställa en fråga innan de donerar.
**Åtgärdat:** "Skicka fråga"-knapp. Öppnar strukturerad form (inte fri text). Q&A blir publikt om insamlaren svarar.
**För Claude Code:** Bygg som tabell `fundraiser_questions` med status `pending/answered/private`. Insamlaren kan välja "publicera"/"privat" vid svar.

---

## Account — 2 fynd

### A-01 · Större — Sidan kändes inte som dashboard
**Problem:** En lista med projektkort räckte inte. Insamlaren vill se: pengar in idag, donatörer denna vecka, beviskö, granskningsstatus.
**Åtgärdat:** Dashboard-vy med KPI-rad högst upp, todo-kort, kö av väntande uppgifter, sen tabell över aktiva projekt.
**För Claude Code:** KPI-räkningar görs i en server-component med 30s cache. Realtime för "287 donatörer (↑14 senaste 7 dgr)"-delta är overkill — uppdatera vid varje sidladdning.

### A-02 · Mindre — Skapa-knappen var gömd
**Problem:** Primary CTA "Starta ny insamling" satt i högerhörnet, lätt att missa.
**Åtgärdat:** Promint plats i header + "+ Ny insamling" i ChromeInsamlare-topbar.
**För Claude Code:** Primary action ska vara på *minst två* ställen på dashboard: i header och i tom-state om ingen insamling finns.

---

## Map — 1 fynd

### Map-01 · Större — Kartan var en SVG-form
**Problem:** Användaren förväntar sig en interaktiv karta — vi gav en silhuett.
**Åtgärdat (i studion):** Sverige-silhuett med klickbara stad-prickar; klick → sidopanel med stadens insamlingar. K-anonymitet (≥5 insamlingar för kommun-siffror).
**Åtgärdat (i produktion):** Leaflet + OpenFreeMap + länkartor från Lantmäteriet. Studion är PLATSHÅLLARE.
**För Claude Code:** Implementera enligt skärmbild användaren delade — choropleth med län-grenser, klickbara, attribution-rad fix.

---

## Community — 1 fynd

### C-01 · Mindre — Threads och events blandades
**Problem:** En "Community"-sida som visade båda samtal och events skapade förvirring.
**Åtgärdat:** Tabb-delning: "Samtal" och "Händelser" på samma sida, default på samtal. Dua-knappen behållen — det är det som skiljer från Facebook.
**För Claude Code:** Behåll URL-deep-linking: `/community?tab=events` öppnar direkt på events-tabben.

---

## Globalt — 2 fynd

### G-01 · Större — Topbar var samma överallt oavsett roll
**Problem:** Insamlare och admin såg samma navigering som besökare. Orienteringen försvann.
**Åtgärdat:** **Tre chrome-lägen**:
- **Publik** — logo + main nav + hamburger + login
- **Insamlare** — samma + "Mina sidor"-genväg + avatar + "+ Ny insamling"
- **Admin** — dashboard-sidebar + minimal topbar med breadcrumbs och systemstatus

**För Claude Code:** Det här är den viktigaste arkitektur-principen i v0.2. Implementera som tre olika `(layout)`-grupper i Next.js. Aldrig en topbar som gör allt.

### G-02 · Mindre — Hamburgare saknades
**Problem:** På mindre skärmar — ingen menyfallback.
**Åtgärdat:** Hamburgare på alla publika ytor (höger sida av topbar). Öppnar en mörk drawer med destinationer i serif.
**För Claude Code:** Drawer är **alltid tillgänglig**, även på desktop — den är inte bara en mobile fallback. Den fungerar som sekundär navigation till djupare ytor.

---

## Sammanfattning — principer som föll ur audit:en

1. **Inget UI som inte gör något.** Filter, knappar, formulärfält — alla ska fungera från första iteration. Polish kan vänta, men funktion får inte.
2. **Tom-states är en feature, inte ett fallback.** Bygg dem från början.
3. **Förklara siffror.** Trust-poäng, statistik, "X dagar kvar" — varifrån kommer talet? Visa.
4. **Sticky CTA:s på långa sidor.** Donate, "Spara", "Kontakt" — håll dem i blicken.
5. **Olika chrome för olika roller.** Aldrig en universal-topbar.
6. **Färre steg är nästan alltid bättre.** Donator-flöde, BankID-login — om vi kan slippa ett steg, slipper vi.
7. **Bevis är inte en bonus, det är produkten.** Trust kommer från transparens-loopen — visa bevis först, inte sist.

---

## Hur listan användes i designen

Studion (`source/studio.html`) har en *inbyggd* audit-sida (`#audit`) som visar samma 17 fynd. Den är inte i produktion — den är en design-artefakt. När du implementerar:

- Läs audit-listan **innan** du börjar bygga en yta
- Notera hur problemet löstes — kopiera lösningen inte bara visuellt utan strukturellt
- Om något nytt designproblem uppstår under bygget — **dokumentera det** så vi kan addera till listan i v0.3

Audit:en är levande. Den ska följa med projektet.
