# Slutrapport — Skolan, klient-/frontend-delarna

**Branch:** `bygg/skola-klient` (egen worktree `../sadaqa-skola`, pushad — aldrig main)
**Instans:** Ruta 3 (skola-klient) i `57-MASTER-Parallell-bygg.md` lager-splitten
**Datum:** 2026-05-30
**Uppdrag:** Bygg Skolans rena klient-/frontend-delar mot mock/flaggad data. INGA
migrationer, INGEN DB (backend ägs av annan instans). `npm run cf-build` grön före
varje push.

---

## Sammanfattning

Hela skol-frontenden är byggd och navigerbar i Kunskap-rummet mot exempeldata bakom
feature-flaggor. Zivar kan klicka runt i en riktig skola: gå in i klasser, se
uppgifter/inlämning/feedback, bläddra i biblioteket, spela quiz, bygga en studieplan,
använda rityta/PDF-läsare och öva på Koran-skrift-canvasen. Allt som hänger på obyggd
backend (klass-RLS, inlämning, gemensamt bibliotek, riktig Koran-text, Stripe) är byggt
som **vilande, flaggat skal** och wire:as in utan ombygge när backend landar.

- **Två commits, pushade.** `npm run cf-build` grön (EXIT=0), `tsc --noEmit` rent.
- **Inga migrationer, inga DB-anrop** i skol-ytorna (mock-only, verifierat).

---

## Byggt (klient-delen av varje fas)

| Fas | Klient-del byggd nu | Vilande/uppskjutet (backend) |
|---|---|---|
| F1 datamodell | — (ägs av backend) | hela schemat + RLS |
| F2 roller/grind | Mock-entitlement (`harTillgang`), lärar-ansökan-UI (grindad), gå-med-via-kod | RPC:er, riktig RLS |
| F3 klasser/ämnen | Klasslista, klass-detalj, gå-med, lärar-ansökan, ämnen | skapa/arkivera mot DB |
| F4 uppgifter→inlämning→feedback | Hela vyn (uppgift, min inlämning, status, feedback) mot mock | skriv-vägar + Storage-bilagor |
| F5 grupparbeten | Gruppyta-vy + gruppmedlemmar i gruppuppgift | Realtime-närvaro, gemensam inlämning mot DB |
| F6 bibliotek | Lärar-material + privata bokmärken (filter) | gemensamt verifierat bakom `SKOLA_GEMENSAMT_BIBLIOTEK` (#34) |
| F7 studieplan/cross-ref | Premium-grindad byggare + cross-reference, ärligt uppsälj | entitlement mot riktig membership |
| F8 verktyg | **Excalidraw-rityta + pdf.js-läsare** (fullt klient) | OnlyOffice-dokument stub bakom `NEXT_PUBLIC_DOCSERVER_URL` |
| F9 quiz | Spelare (privat poäng, ingen topplista) + lista | skapa-quiz mot DB, live-Kahoot |
| F10 Koran-skrift | **Canvas (Pointer Events, pressure, getCoalescedEvents)** mot demo-ayah bakom `SKOLA_KORAN_DEMO` | riktig text/uttal bakom `SKOLA_KORAN_DATA` (#6/#7) |
| F11 Kunskap-rummets ytor | `/kunskap` + `/kunskap/skola`-ytor, sub-nav, states (loading/empty/error) | — |
| F12 premium-grind/Stripe | Grind-UI + uppsälj utan mörka mönster | Stripe bakom `SKOLA_STRIPE_AKTIV` (#12) |

### Filer

- **Kontrakt:** `5-Kod/lib/skola/{flags,typer,mock,demo-ayah}.ts`
- **Ytor:** `5-Kod/app/(public)/kunskap/` (hub + `skola/` med layout, hem, klasser,
  klasser/[id], bibliotek, verktyg, quiz, quiz/[id], koran-skrift, studieplan,
  loading, error)
- **Komponenter:** `5-Kod/components/skola/` (koran-skrift-canvas, verktyg/{excalidraw,
  pdf,panel}, quiz-spelare, bibliotek-lista, studieplan-byggare, klass-åtgärder, notiser,
  skola-nav)
- **Docs:** `5-Kod/docs/SKOLA-VERKTYG.md`, `5-Kod/docs/SKOLA-STORAGE.md`

---

## Feature-flaggor (`5-Kod/lib/skola/flags.ts`, `.env.example`)

| Flagga | Default | Styr |
|---|---|---|
| `SKOLA_AKTIV` | `true` | Hela skol-ytan synlig |
| `SKOLA_GEMENSAMT_BIBLIOTEK` | `false` | Gemensamt verifierat bibliotek (kräver #34) |
| `SKOLA_KORAN_DATA` | `false` | Riktig Koran-text/uttal (kräver #6/#7) |
| `SKOLA_KORAN_DEMO` | `true` | Demo-ayah för skriv-canvasen |
| `NEXT_PUBLIC_DOCSERVER_URL` | tom | OnlyOffice doc-server (tom = stub) |
| `SKOLA_STRIPE_AKTIV` | `false` | Riktig premium-betalning (kräver #12) |

---

## Autonoma beslut

| Beslut | Val | Skäl |
|---|---|---|
| Koran-skrift-canvas | Egen HTML5-canvas + Pointer Events (ingen lib) | 56b §3 ville lätt beroende; ingen tung kedja behövdes, full kontroll på tryck/coalesced/DPR |
| Rityta | `@excalidraw/[email protected]` (MIT) | 56b §2 förvalt; React 19-kompatibelt |
| PDF | `[email protected]` (Apache-2.0), worker via CDN-version | 56b §2; main-build, klient-only |
| Demo-ayah | Tre välkända korta verser (al-Fātiḥa 1, al-ʿAsr 1, al-Ikhlāṣ 1), tydligt märkta DEMO | Aldrig fejkat innehåll; riktig allmänt känd text som spår-mall, ersätts av #6 |
| Hemvist | `/kunskap` + `/kunskap/skola` i `(public)`-gruppen | 56b §8 publik ingång; #35:s fem-rums-IA ej byggd ännu |
| Nav | La "Kunskap" i publik nav (topbar + drawer) | Annars kunde Zivar inte klicka sig in. **Reconcile-punkt** (se nedan) |
| Premium-grind | Mock `harTillgang()`; studieplan låst → ärligt uppsälj + transparent förhandsvisning | F7/F12 healthy-by-design |
| Scen-/streck-lagring | Lokalt (localStorage/i minnet), aldrig server | Dataminimering (särskilt barn) + ingen DB |

---

## Reconcile-punkter för Cowork (vid merge)

**Delade filer som rörts (alla additivt — kan krocka med #35:s fem-rums-IA/nav-config):**
1. `components/layout/site-nav.tsx` — `/kunskap`-länk (topbar + drawer). Nav-config ägs av
   #35; flytta in där när den finns.
2. `app/layout.tsx` — la till **Amiri**-fonten (`--font-arabic`) för Koran-skrift-canvasen.
   Rent additivt (en `next/font`-import + en className-variabel).
3. `app/(public)/kunskap/page.tsx` — Kunskap-rummets hub-route. #35 äger rummets slutliga
   IA; min hub är en hållbar ingång tills dess.
4. `eslint.config.mjs` — la till `public/**` i `ignores` (annars lintar eslint den
   self-hostade, minifierade pdf.js-workern → falska fel). Konventionellt korrekt.

**Datakoppling (inget UI-ombygge):**
5. **Mock → riktig data:** `lib/skola/mock.ts`-getters har samma returtyper som
   `lib/skola/typer.ts`. Backend-instansen byter dem mot Supabase-queries; UI orört.
6. **`harTillgang` / membership:** mock-grinden speglar `private.school_har_tillgang`-
   signaturen — koppla mot riktig membership-tabell när #12 finns.

---

## Batchade uppföljningar (kräver människa/backend — blockerar inte)

- **Backend-instansen:** F1-schema + RLS, RPC:er (F2), Storage-bucket `skola` (56b §1),
  inlämnings-/gruppinlämnings-vägar. Klient-kontraktet ligger redo.
- **#34 religiöst register:** låser upp gemensamt verifierat bibliotek (`SKOLA_GEMENSAMT_BIBLIOTEK`).
- **#6/#7 Koran/bön-ljud:** låser upp riktig Koran-text + recitation (`SKOLA_KORAN_DATA`).
- **#12 + Stripe-produkter + lärar-pris:** låser upp riktig premium (`SKOLA_STRIPE_AKTIV`).
- **Doc-server (valfritt):** OnlyOffice för dokument/PPT (`NEXT_PUBLIC_DOCSERVER_URL`).
- **Lärd-råd:** verifierar gemensamt bibliotek + spel-gränsen mot tillbedjan + adab kring
  digital Koran-skrift.
- **Jurist:** minderårig-/föräldrasamtycke, GDPR art. 9 för lärande-data.

---

## Säkerhets-/principefterlevnad (klient-nivå)

- **Inga DB-anrop i skol-ytorna** — allt mot `lib/skola/mock.ts`. (Ingen `createClient()`
  under `app/(public)/kunskap/` eller `components/skola/`.)
- **Religiöst innehåll grindas aldrig** av premium — bara power-verktyg (studieplan,
  cross-reference, verktyg). Läsning är alltid fritt.
- **Healthy-by-design:** quiz bara för kunskap/ord, privat poäng, ingen topplista; ingen
  streak/poäng/tävling på Koran-skrift eller recitation.
- **Lärar-behörighet default STÄNGD** — ansök→godkänn, aldrig self-serve.
- **Demo-ayah tydligt märkt** teknisk platshållare; ingen recitation i demo-läget.

---

## Verifiering

- `tsc --noEmit`: **rent** (före och efter granskningsfixar).
- `npm run lint` (eslint): **grön (0 errors)** — skol-koden ger 0 problem; kvarvarande
  3 warnings är förbefintliga i filer jag inte rört (karta, admin-sidebar, ett script).
  (CLAUDE.md varnar att Cloudflare kan faila tyst på ESLint-fel — därför explicit kört.)
- `npm run cf-build`: **grön (EXIT=0)** — baseline (orörd worktree) + efter bygget +
  efter granskningsfixarna.
- **Live (Playwright mot `next dev`):** hem, koran-skrift, verktyg (Excalidraw monterad)
  och quiz renderar alla **HTTP 200 med noll console-errors**. Koran-canvasen och
  Excalidraw monterar utan `window`/SSR-fel; mall-texten ritas i **Amiri** (verifierat
  visuellt). Quiz-flödet testat interaktivt (svar → rätt-markering → nästa). Layouten
  verifierad på **mobil bredd (390px)**: sub-nav scrollar, verktygsrader wrappar,
  klickytor ≥48px — touch-vänligt.

### Självgranskning (adversarial subagent) — åtgärdat

En granskar-subagent gick igenom diffen. Verdikt: säkert att bygga vidare på.
Bekräftat: inga DB-/Supabase-anrop i skol-ytorna, `ssr:false` bara i `"use client"`,
pdfjs bara i handler, premium grindar aldrig religiöst innehåll, markdown saneras.
Åtgärdade fynd:

- **HIGH:** PDF-render avbröts inte vid snabba sid-/zoom-byten → "same canvas"-krasch.
  Fix: håller render-task, `cancel()` i cleanup, sväljer `RenderingCancelledException`.
  **Runtime-verifierad:** laddade en 3-sidig PDF via den self-hostade workern
  (`/pdf/pdf.worker.min.mjs`, samma origin), bläddrade sidor + zoomade snabbt upprepat —
  **0 console-errors** (ingen "same canvas"-krasch). Fixen håller i praktiken.
- **LOW:** pdf.js-workern flyttad från CDN till **self-hostad** (`public/pdf/`,
  samma origin) — offline-säker, CSP-säker, matchar "inget laddas upp"-löftet.
- **LOW:** PDF-omritning nycklas nu på dokument-version (inte filnamn) — öppna om en
  fil med samma namn fungerar.
- **Touch-mål:** höjt från 44 → **48px** (nav/zoom/filter/bokmärke/ta-bort/cross-ref).
