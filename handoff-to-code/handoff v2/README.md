# Sadaqa Sweden — Handoff till Code

**Version:** 0.2 · **Datum:** 2026-05-25 · **Status:** Redo att implementeras

Det här är överlämningspaketet från designstudion till bygget. Det innehåller:

- En **körbar källkod** (`source/`) av den interaktiva designstudion — öppna `source/studio.html` lokalt eller titta i översikten online för att se varje yta i sitt slutgiltiga visuella tillstånd.
- Fem **dokumentationsfiler** som walking-throughar systemet på olika abstraktionsnivåer.

---

## Hur du läser det här

| Vill du... | Börja i |
|---|---|
| Förstå plattformen som helhet | `01-Oversikt.md` |
| Veta vilka färger / typer / komponenter som finns | `02-Designsystem.md` |
| Implementera en specifik route/sida | `03-Ytor-per-yta.md` |
| Veta hur det ska kopplas till Next.js / Supabase / Stripe | `04-Tech-implementation.md` |
| Förstå vad som var problematiskt i v0.1 och varför vi ändrade det | `05-Audit-fynd.md` |
| Se det live, klicka runt | öppna `source/studio.html` |

> **Notation:** I dokumenten refererar **M1–M17** till moduler i `1-Planering/Modul-XX-*.md`. Ytan / sidan står i kursiv (*Marketing*, *Fundraiser*, etc).

---

## Filer i det här paketet

```
handoff/
├── README.md                       ← den här filen
├── 01-Oversikt.md                  ← struktur, rollmodell, route-karta
├── 02-Designsystem.md              ← tokens, typografi, komponenter, chrome
├── 03-Ytor-per-yta.md              ← 17 ytor: layout, state, beteende, edge cases
├── 04-Tech-implementation.md       ← Next.js, Supabase, Stripe, BankID
├── 05-Audit-fynd.md                ← 17 designproblem som åtgärdats i v0.2
│
└── source/                         ← körbar källkod
    ├── studio.html                 ← entry — öppna i webbläsare
    ├── studio/
    │   ├── app.jsx                 ← routing + tweaks-protokoll
    │   ├── components.jsx          ← Shell, Chrome, Sidebar, Hamburger, Frame
    │   ├── data.js                 ← all demo-data + audit-fynd
    │   ├── styles.css              ← magazine-shell + sharper tokens
    │   ├── tweaks-panel.jsx        ← inställningspanel
    │   ├── screens-public.jsx      ← Marketing, Discovery, Fundraiser, Donate, Profile, Catalog, Auth
    │   ├── screens-account.jsx     ← Account, Wizard, Update
    │   └── screens-internal.jsx    ← Admin, Review, Team, Map, Community, Audit, System
    └── assets/
        ├── style.css               ← brand-tokens (fonts, colors, primitives)
        └── shared.js               ← wordmark + ikoner
```

---

## Snabb-installation (när Claude Code tar över)

1. **Kopiera tokens** från `source/assets/style.css` och `source/studio/styles.css` till `5-Kod/app/globals.css` (Next.js). Behåll alla `--*`-variabler.
2. **Komponenter** — strukturen i `components.jsx` (Shell, ChromePublic, ChromeInsamlare, ChromeAdmin, BurgerDrawer) blir React-komponenter i `5-Kod/components/`. JSX:en där är AVSIKTLIGT lättförståelig — den ska gå att läsa rakt av.
3. **Routes** — varje yta i `03-Ytor-per-yta.md` mappar till en Next.js-route. Tabellen i `01-Oversikt.md` listar dem explicit.
4. **Bilder** — alla `picsum.photos`-platsväljare ska bytas mot riktiga foton från en bildbank. Avsnitt i `04-Tech-implementation.md` beskriver var de ligger.
5. **Kartan** — placeholder-SVG byts mot Leaflet + OpenFreeMap som planerat. Attribution-raden i designen är redan rätt formulerad.

---

## Vad är fortfarande utkast

Markeras i resp. yta i `03-Ytor-per-yta.md`:
- **BankID-flödet** — UI-skissen finns, hela popup-/redirect-flödet behöver fyllas i av Claude Code utifrån BankID:s SDK
- **Stripe Connect-onboarding** — vi visar slutet (en grön check). Onboarding-stegen som mottagar-förening måste gå igenom är inte ritade.
- **Notiser** — bell-ikonen finns i admin-chrome och insamlare-chrome men panelen som öppnas är inte designad
- **Wizard steg 4 (story)** — bara plain textarea, ingen rich text. Avsiktligt enkelt.
- **Rapport-exporter** ("Exportera rapport"-knappen i Admin) — knappen finns, CSV/PDF-formatet är inte spec:at

---

## Designprinciperna i klartext

Alla beslut i v0.2 utgår från fyra principer. När du står inför ett val under bygget, gå tillbaka till dem:

1. **Granskning före publicering.** Inget GoFundMe-hål. En insamling syns inte förrän en granskare godkänt den. Designen ska aldrig glida bort från detta — review-kö är en LIVE-yta, inte en eftertanke.
2. **Bevis-loop hela tiden.** Start, utbetalning, resultat. Tomma loopar = visuellt straff (insamlingen pausas, sidan ger varning). Trust-poäng räknas mestadels från bevis-historiken.
3. **Tre chrome-lägen.** Besökare, Insamlare, Admin. Aldrig samma topbar för alla — orientering ska aldrig gå förlorad.
4. **Skarp scandinavian, tidskriftslayout.** Generösa marginaler, redaktionella avdelare, asymmetrisk grid, Spectral 300/400 på rubriker. Inget AI-slop, ingen pastell-gradient-hero, ingen rounded-corner-emoji-CTA.

---

## Hur du tar feedback under bygget

Studion (`studio.html`) är gjord för att klicka igenom och kommentera *innan* du börjar koda en yta. Workflow:

1. Öppna `studio.html`, gå till ytan du ska bygga
2. Läs motsvarande sektion i `03-Ytor-per-yta.md`
3. Bygg
4. Återgå till studion, jämför, justera tills DOM-strukturen matchar visuellt

Studion är **inte** produktionskoden — det är design-referensen.
