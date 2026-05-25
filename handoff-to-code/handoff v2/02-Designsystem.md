# 02 — Designsystem

Det här dokumentet listar **allt visuellt språk** som finns i Sadaqa Sweden — färger, typografi, komponenter, chrome-lägen. Alla tokens som CSS-variabler finns i två filer:

- `source/assets/style.css` — grundtokens, fonts, primitives (från v0.1)
- `source/studio/styles.css` — sharper-magazine-lagret (lagt till i v0.2)

När du implementerar: kopiera dessa två filer rakt av till Next.js `app/globals.css` (eller dela upp i två filer).

---

## 1. Färger

### Brand-paletten

| Token | Hex | Användning |
|---|---|---|
| `--forest` | `#1F4636` | Primary — sidebar, primary-knapp, brand-mark |
| `--forest-deep` | `#0F2A1F` | Mörkast — admin-sidebar, hero-sektion på dark mode, drawer |
| `--forest-mid` | `#2D5947` | Mid forest — sekundär grön |
| `--forest-soft` | `rgba(31, 70, 54, 0.08)` | Tinted background, hover-state |
| `--forest-line` | `rgba(31, 70, 54, 0.14)` | Subtila gröna kanter |

### Yt-paletten (paper)

Lättad till nästan-vitt i v0.2 enligt feedback:

| Token | Hex | Användning |
|---|---|---|
| `--paper` | `#FCFBF7` | Page background, default canvas |
| `--paper-soft` | `#FFFFFF` | Cards, lyfta paneler |
| `--paper-deep` | `#F2EDDF` | Djupare creme, accent-block |
| `--paper-line` | `#E5DECA` | Mjuka kantlinjer på paper |

### Ink (text)

| Token | Hex | Användning |
|---|---|---|
| `--ink` | `#0E1411` | Rubriker, primär text |
| `--ink-1` | `#1A211C` | Brödtext |
| `--ink-2` | `#3A453E` | Sekundär text, meta |
| `--ink-3` | `#6B7269` | Hjälptext, captions |
| `--ink-4` | `#9AA098` | Dim text, dividers |
| `--ink-line` | `rgba(14, 20, 17, 0.10)` | Default hairlines |

### Accent (kontroll via Tweaks)

`--accent` och `--accent-deep` kan styras av användaren i Tweaks-panelen. Default är copper:

| Token | Default | Användning |
|---|---|---|
| `--accent` / `--copper` | `#B8843E` | Highlights, CTA-glow, italics i hero |
| `--accent-deep` / `--copper-deep` | `#8E6429` | Hover, eyebrows, link-state |
| `--copper-warm` | `#D4A567` | Wordmark "Sweden", varmt på mörk bg |

### Status

| Token | Hex | Användning |
|---|---|---|
| `--success` | `#2D6B4F` | "Granskad", "BankID-verifierad", godkänn-knapp |
| `--success-soft` | `rgba(45, 107, 79, 0.10)` | Success-tinted background |
| `--danger` | `#8B3A2E` | "Risk", "Avslå", critical alerts |
| `--danger-soft` | `rgba(139, 58, 46, 0.10)` | Danger-tinted background |
| `--warning` | `#B8843E` (samma som copper) | Medel-risk, pending |

### Sage (sekundär grön — sparsamt använd)

| Token | Hex | Användning |
|---|---|---|
| `--sage` | `#C6CFC4` | Mjuka pillars |
| `--sage-deep` | `#8FA28D` | Dämpad text på sage-bg |

---

## 2. Typografi

### Fonts (alla från Google Fonts)

| Variabel | Family | Vikter | Användning |
|---|---|---|---|
| `--font-display` | **Spectral** | 300, 400, 500, 600 (+ ital 400, 500) | Rubriker, mag-display, mag-h1, mag-h2 |
| `--font-ui` | **Manrope** | 300, 400, 500, 600, 700, 800 | Body, knappar, formulärtext |
| `--font-mono` | **JetBrains Mono** | 400, 500 | Eyebrow-labels, tabular data, timestamps |

Tweak-panelen tillåter byte till Playfair, Fraunces, EB Garamond, Inter, Work Sans — men **default är Spectral + Manrope** och det är det vi designar mot.

### Skala (CSS-klasser från `styles.css`)

| Klass | Storlek | Vikt | Användning |
|---|---|---|---|
| `.mag-display` | `clamp(40px, 5.4vw, 84px)` | 300 | Hero-rubrik, audit-sidans titel |
| `.mag-h1` | `clamp(40px, 4.8vw, 68px)` | 400 | Sektionsrubriker, sidtitlar |
| `.mag-h2` | `clamp(28px, 2.6vw, 42px)` | 400 | Sub-sektionsrubriker |
| `.mag-h3` | `22px` | 500 | Kort-titlar, små rubriker |
| `.mag-lead` | `clamp(20px, 1.6vw, 26px)` | 300 | Lead-text under rubrik |
| body | `16px` | 400 | Default |

### Tre typografiska principer

1. **Spectral i light weights** (300/400) — aldrig bold. Tunghet kommer från storlek, inte vikt.
2. **`text-wrap: balance`** på rubriker, **`text-wrap: pretty`** på paragrafer.
3. **`letter-spacing: -0.014em` till -0.022em** på stora rubriker, **+0.10em till +0.24em** + uppercase på eyebrow-labels.

### Eyebrow-mönster (återkommer hela appen)

```html
<div class="f-mono" style="font-size: 11px; color: var(--accent-deep); letter-spacing: 0.16em">
  § 01 — KATEGORIER
</div>
```

eller med `<Eyebrow>`-komponent:

```jsx
<Eyebrow num="N° 01">Sadaqa Sweden Quarterly</Eyebrow>
```

---

## 3. Radii — sharper i v0.2

V0.1 hade radii från 4 till 28px. V0.2 är skarpare:

| Token | Storlek | Användning |
|---|---|---|
| `--sr-0` | `0` | Inga rundade hörn — accent-block, "bordered" cards |
| `--sr-1` | `2` | Tags, små pillars, KPI-celler |
| `--sr-2` | `4` | Knappar, inputs, default-cards |
| `--sr-3` | `6` | Större kort, sektion-block |
| `--sr-4` | `10` | Mjuka kort (sparsamt) |

> **Regel:** Använd 4 (`--sr-2`) som default. Använd 0 för "editorial"-känsla (rubrik-block, bordered-cards). Undvik allt över 10.

---

## 4. Shadows

| Token | Definition | Användning |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(14,20,17, 0.04)` | Subtila kort |
| `--shadow-2` | `0 2px 8px rgba(14,20,17, 0.05)` | Default-kort, hover |
| `--shadow-3` | `0 8px 24px rgba(14,20,17, 0.08)` | Lyfta paneler, modals |
| `--shadow-4` | `0 24px 48px rgba(14,20,17, 0.12)` | Stora overlays |
| `--shadow-copper` | `0 8px 22px rgba(184,132,62,0.22)` | Glow på accent-knappar |

---

## 5. Layout-primitiver

### Containers

| Klass | Max-width | Padding |
|---|---|---|
| `.mag-container` | `1360px` | `0 56px` |
| `.mag-container-tight` | `1180px` | `0 56px` |
| `.mag-container-narrow` | `880px` | `0 40px` |

### Magazine grid

12-kolumn grid med 32px gutter:

```html
<div class="mag">
  <div class="mag-col-7">…</div>
  <div class="mag-col-5">…</div>
</div>
```

Klasserna `.mag-col-{1..12}` finns. För att starta en kolumn senare: `.mag-col-start-{2,3,4}`.

### Spacing

Inga utility-klasser för spacing — använd `style={{ marginTop: 56 }}` inline eller skriv specifika klasser per sektion. Skalan vi använder:
**8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 56 / 64 / 80 / 96 / 120**

---

## 6. Komponenter — vad finns färdigt

Alla i `source/studio/components.jsx`. Kort-beskrivning per komponent:

### `<Btn variant size block>`
- `variant`: `primary | accent | secondary | ghost | onforest`
- `size`: `sm | lg` (default: medium 48px)
- `block`: full bredd
- Sharper radius (4px), 48px höjd default

### `<Tag tone>`
- `tone`: `default | accent | danger | success | outline | dark`
- 22px höjd, 2px radius — kompakt

### `<Eyebrow num>`
- Liten mono-text med stroke-prefix för sektioner

### `<ProgressBar value max thick dark>`
- `thick`: 6px istället för 2px
- `dark`: för mörka bakgrunder

### `<Photo src caption sharp tags ratio>`
- `src` är nyckel i `STUDIO_DATA.photos` (t.ex. `well`, `mosqueInt`) eller direkt URL
- `sharp`: radius 0
- `tags`: array av strängar som visas som corner-tags
- `caption`: nedre vänster, uppercase mono

### `<CampaignCard campaign onNav wide compact>`
- `wide`: bredare layout med foto till vänster + text till höger (för hero-positioner)
- `compact`: list-rad (för discovery list-vy och profile-history)

### `<Section number title lead right>`
- Standardiserad sektionsrubrik med eyebrow + h1 + lead + optional right-side action

### `<Field label sub>`
- Form-fält wrapper med label + hjälptext

### `<RadioCard label sub selected>`
- "Cards" som agerar som radio-knappar

---

## 7. Chrome-lägena

Tre olika topbar/navigation-uppsättningar. Tillämpas baserat på `screen.role`:

### `ChromePublic`
- 68px hög, sticky-top
- Logo + nav-links + "Logga in" + "Starta insamling" + hamburger
- Bakgrund: `var(--paper-soft)`
- Aktiv länk: underline med `var(--accent)`-färg

### `ChromeInsamlare`
- Samma som ovan men med:
- Avatar-pill med initialer + förnamn
- Bell-ikon (notiser)
- Primary-CTA är "+ Ny insamling" istället för "Starta"

### `ChromeAdmin`
- 60px, vitare bakgrund
- "Maskinrum" wordmark + crumbs ("Maskinrum / Dashboard")
- Systemstatus-pillars (Stripe, BankID, pending review)
- Bell + settings + avatar-pill med ADMIN-roll-label
- Tillsammans med `AdminSidebar` (240px vänster) som ger dashboard-känslan

### `BurgerDrawer`
- Mörk drawer från höger, glider in över allt
- Items i Spectral 24px, mono-suffix med modul-ref (M1, M2, etc)
- Sektioner: "PLATTFORMEN", "STÖTTA", "MITT KONTO"
- Stänger via overlay-klick, ESC eller close-knapp

---

## 8. Foton & bilder

I studion: `picsum.photos` med seed för deterministiska grayscale-bilder. Inte produktionsmaterial.

I produktionen ska:

- **Hero-foton på fundraiser-sidor** — riktiga foton från insamlaren (krav i wizard-steg 4)
- **Marketing-hero** — ett kuraterat foto från en aktiv granskad insamling (rouleras)
- **Discovery-kort** — vart projekt visar sin egen bild
- **Profile-portraits** — inga foton, bara initialer i färgad fyrkant (`bg: forest`, `color: paper`, square 4px radius)
- **Org-loggor** — föreningarna laddar upp i admin

Bilder ska serveras via Next.js `<Image>` eller en CDN, optimerade till webp.

---

## 9. Ikoner

Lokalt anpassad Lucide-stil. Alla finns inline i `source/assets/shared.js` under `SADAQA.icon(name, size)`:

`arrow-right, arrow-left, check, check-circle, shield, shield-check, star, star-filled, heart, user, users, building, map-pin, map, calendar, search, filter, plus, x, menu, chevron-right, chevron-down, home, dashboard, inbox, briefcase, list, grid, edit, eye, eye-off, message, bell, log-out, settings, trending, pie, bar, wallet, credit-card, lock, flag, document, file-check, package, globe, clock, sparkles, info, alert, gift, thumbs-up, megaphone, tag, play, external, help`

I produktion: byt ut mot `lucide-react`-paketet i Next.js. Strok-vikt 1.6–2 default, storlek 18px default.

---

## 10. Animation

Sparsamt, korta ease-outs:

| Användning | Duration | Easing |
|---|---|---|
| Hover-färgskifte | 140–160ms | `ease` |
| Kort-entry | 360ms | `cubic-bezier(0.2, 0.6, 0.2, 1)` |
| Vy-byte | 200–250ms | `ease-out` |
| Pulse (på dot-indikatorer) | 2.4s | `ease-in-out infinite` |
| BankID-spinner | 1s | `linear infinite` |

**Förbjudet:** scale-bounce, slide-in-from-side på sidkor, parallax. Vill du betona — ändra opacity eller färg, inte position.

---

## 11. Brand-mark + Wordmark

Stjärnan ("rub el hizb"-stiliserad) finns som SVG i `source/assets/shared.js` som `SADAQA.STAR_SVG`. Storlek skalar med wordmark-size.

Wordmark-mönster:
- **Sadaqa** i Spectral 500 (default) eller 22px
- **Sweden** i Manrope 600 11px, uppercase, letterSpacing 0.24em, copper-färg, position offset upward 2px från Sadaqa-baseline

På mörk bg: lägg till klass `wordmark-light` — text blir paper, Sweden blir copper-warm.

---

## 12. Vad får du *inte* göra

Sammanfattning av AI-slop-undvikande regler:

- **Inga gradient-bakgrunder** på sektioner (utom under foton — där 40%→45% opacity gradient mot bottenkanten är OK)
- **Inga emoji-CTA:s** — använd ikoner från Lucide-setet (dua-knappen 🤲 är ett UNDANTAG, det är en symbolisk handgesture, inte en emoji-decoration)
- **Ingen Inter, Roboto, Arial** för rubriker — alltid Spectral
- **Inga rounded corners > 10px**
- **Inga skalade hover-effekter** (`transform: scale()`) — använd kant-färg eller `translateY(-1px)`
- **Aldrig "Title Case On Buttons"** — sentence case på svenska
- **Inga superlativ i copy** — "bäst", "snabbast", "trygg" är ord vi *visar* med design, inte säger
