# Design-karta — yta → route → steg → status → säkerhet

Slår ihop tre källor till en tabell: `README.md`:s ytlista, `byggplan.html`:s
filstruktur, och `../2-Byggplan/05-Byggsekvens.md`:s steg. Detta är svaret på
*"vart tar den här design-filen vägen och när byggs den?"*.

Läs `00-START-HÄR.md` först.

---

## Fas A — Designsystemet (engångsjobb, före alla ytor)

| Vad | Från | Till | byggplan.html-sektion |
|---|---|---|---|
| Designtokens | `assets/style.css` | `5-Kod/app/globals.css` (Tailwind v4 `@theme`) | Globalt theme |
| Primitiv-bibliotek | specas i byggplan | `5-Kod/components/ui/` | Primitiv-bibliotek + bilaga B |
| Delad chrome (wordmark, ikoner, footer) | `assets/shared.js` | `5-Kod/components/layout/` | Komponent-bibliotek (bilaga B) |

---

## Fas B + C — De 17 ytorna

**Status-koder:**
`RESTYLA` = sidan finns i `5-Kod/app/` — byt utseende till designen + lägg riktiga states.
`BYGG NYTT` = sidan finns inte — bygg från scratch, design = visuell sanning, byggplan.html = funktionell sanning.

| Design-fil | Route i `5-Kod/app/` | Modul | Steg | Status | Säkerhets-touchpoint |
|---|---|---|---|---|---|
| `index.html` | — | — | — | Designkatalog, **bygg ej** | — |
| `marketing.html` | `/` (`page.tsx`) | M11 | 0 / 9 | RESTYLA (enkel version finns) | StatStrip läser donations-summa serverside; vid 0 dölj/byt copy |
| `auth.html` | `(auth)/login`, `(auth)/registrera` | M6 | 2 | RESTYLA | HIBP på, inga lösenord i klartext, CAPTCHA, fel på svenska |
| `wizard.html` | `(konto)/insamling/ny/[steg]` | M2 | 3 | RESTYLA → bygg ut. Finns som utkast+redigera-form, **inte** 5-stegs-wizard | Status via tillståndsmaskin i DB, ej klient. Utkast ägs av insamlare (RLS) |
| `account.html` | `(konto)/insamling` | M2 | 3 | RESTYLA (mina-insamlingar-lista finns) | RLS: insamlare ser bara sina egna |
| `fundraiser.html` | `/insamlingar/[publicId]` | M1 + M7 | 3 | RESTYLA (publik detaljvy finns) | Publik läsning via RLS; `insamlat_ore` skrivs aldrig av klient |
| `review.html` | `(intern)/granskning` + `[id]` | M3 | **4 ⏭️** | BYGG NYTT | Endast granskar/admin-roll (RLS + server). Varje beslut loggas |
| — (inget designkort) | `(konto)/stripe-onboarding` | M5 | 5 | BYGG NYTT | Connect-länkar serverside; `connected_account_id` skrivs ej av klient |
| `donate.html` | `/insamlingar/[publicId]/donera` | M4 | 6 | BYGG NYTT | `PaymentIntent` serverside, klient sätter ej belopp. Webhook = sanning. Gäst utan konto |
| `update.html` | `(konto)/insamling/[id]/uppdatering` | M7 | 7 | BYGG NYTT | Bevis-filer i privat bucket + signerade URL:er. Endast ägaren laddar upp |
| `profile.html` | `/profil/[handle]` | M9 | 8 | BYGG NYTT | Publik läsning via RLS; endast publika fält exponeras |
| `discovery.html` | `/insamlingar` | M11 | 9 | BYGG NYTT | Serverside-filtrering, empty state, paginering |
| `catalog.html` | `/foreningar` | M10 | 11 | BYGG NYTT | RLS på `organisation` + `collab` |
| `map.html` | `/karta` | M12 | 12 | BYGG NYTT — riktig MapLibre-karta, **inte** mockupens SVG-blobbar | Geodata endast som aggregat (minsta-antal-regeln). **Full spec: `1-Planering/Modul-12` — 9 block, inkl. teknik (Block 9)** |
| `community.html` | `/community` | M13 + M14 | 13–14 | BYGG NYTT | Kommentarer/dua kräver inloggning + moderering + RLS |
| `admin.html` | `(intern)/admin` | M16 | 15 | BYGG NYTT | Endast admin-roll. Ingen direkt DB-åtkomst |
| `team.html` | `(intern)/team` | M17 | 16 | BYGG NYTT | Roll styr vy. MFA / AAL2 för känsliga handlingar |

---

## Per yta — bygg alla tillstånd, inte bara happy path

Design-mockupen visar oftast bara "allt gick bra". `byggplan.html` har en
tillståndsmatris per yta. För varje yta du bygger eller restylar — implementera:

- **Tomt** — ingen data än (0 insamlingar, 0 donationer, 0 resultat).
- **Laddar** — skeleton/spinner medan data hämtas.
- **Fel** — nätverksfel, behörighet saknas, validering misslyckas.
- **Success** — happy path.

En yta utan sina riktiga tillstånd är inte klar.

---

## Definition of done per yta

- [ ] Designtokens används (inga hårdkodade färger/mått utanför `@theme`).
- [ ] Alla fyra tillstånd (tomt / laddar / fel / success) finns.
- [ ] **Varje synlig kontroll fungerar på riktigt** — filter, flikar, sök, sliders,
  paginering, knappar, länkar kopplade till riktig data. Ingen död mockup-kontroll
  shippas (se `00-START-HÄR.md` § 8). Uppskjutet → `// TODO (Mn)` med skäl.
- [ ] Säkerhets-touchpoint ovan hanterad enligt `../Supabase/SAKERHETSREGLER.md`.
- [ ] Behörighet i DB/RLS — frontend-kontroll är bara UX.
- [ ] Mobil-breakpoints enligt `byggplan.html`.
- [ ] `npm run build` grönt + en commit för steget.

---

*Komplement till designöverlämningen, 2026-05-23.*
