# Skolan — inbäddade verktyg (open source, licenser)

Skolans verktyg är **inbäddade open source-lösningar** — full funktion, ingen
licenskostnad (`6-Vision/04-Beslut-innan-bygge.md` DEL 7: bygg inte hjulet på nytt).

| Verktyg | Paket | Version | Licens | Klass | Var |
|---|---|---|---|---|---|
| Rityta / whiteboard | `@excalidraw/excalidraw` | 0.18.0 | **MIT** | 🟢 klient | `components/skola/verktyg/excalidraw-rityta.tsx` |
| PDF-visning | `pdfjs-dist` | 5.7.284 | **Apache-2.0** | 🟢 klient | `components/skola/verktyg/pdf-visare.tsx` |
| Dokument/PPT-redigering | OnlyOffice Document Server | — | AGPL-3.0 (self-host) | 🔴 stub | `verktyg-panel.tsx` (iframe bakom flagga) |

## Tekniska val (motiverade)

- **Båda klient-verktygen laddas client-only.** `next/dynamic` med `{ ssr: false }`
  ligger i `"use client"`-filer (Next 15 tillåter inte `ssr:false` i Server
  Components, och biblioteken rör `window`/`DOMMatrix` som inte finns på servern).
  Detta håller dem ur OpenNext-server-bundlen och `npm run cf-build` grön.
- **Excalidraw:** CSS importeras i wrappern (`@excalidraw/excalidraw/index.css`),
  `Excalidraw` hämtas via dynamisk import. Scenen sparas **lokalt** (localStorage) —
  ingen server, ingen DB i klient-bygget. Fonter laddas från CDN (default); kan
  self-hostas senare via `window.EXCALIDRAW_ASSET_PATH`.
- **pdf.js:** importeras bara inuti effekt/handler. Workern är **self-hostad** i
  `public/pdf/pdf.worker.min.mjs` (kopierad från paketet) och laddas från samma
  origin (`/pdf/pdf.worker.min.mjs`) — inget tredjepartsanrop, fungerar offline och
  bryts inte av en framtida CSP. Filer öppnas lokalt i webbläsaren — inget laddas upp.
  Render-tasks avbryts vid snabba sid-/zoom-byten (undviker "same canvas"-krasch).
  **OBS:** workern är versionslåst — kopiera om filen om `pdfjs-dist` uppgraderas.
- **OnlyOffice:** kräver en self-hostad Document Server. Stubbad bakom
  `NEXT_PUBLIC_DOCSERVER_URL`. Utan satt URL visas ett ärligt "kommer snart" och
  rityta + PDF fungerar ändå.

## Förutsättning till Zivar/infra

- **Doc-server (valfritt):** för rich dokument/PPT-redigering — self-hosta OnlyOffice
  Document Server och sätt `NEXT_PUBLIC_DOCSERVER_URL`. OnlyOffice Document Server
  är AGPL-3.0 (community); kontrollera licens-efterlevnad vid self-host.
