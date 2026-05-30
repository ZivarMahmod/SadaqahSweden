# WCAG 2.1 AA-revision — Designsystem v0.3

**Datum:** 2026-05-30 · **Brief:** 35 (F7) · **Status:** genomförd.
**Detta dokument ÄR beviset** att kontrast-/a11y-revisionen gjordes (#18 öppen
fråga 6, #19 R15 — a11y är en egenskap hos fundamentet, inte ett efterarbete).

Granskade ytor: `app/globals.css` (tokens + v0.3-lagret), v0.3-komponenterna
(`SkeletonState`, `ErrorState`, `EmptyState`, `HumbleNote`, `EntityCard`,
`VerifiedTag`, `BottomSheet`, `ToneSurface`, `RoomNav`, `RoomComingSoon`) samt
webb-förrummet. Ratios beräknade med WCAG relativ-luminans-formeln (sRGB,
`(L1+0.05)/(L2+0.05)`). Trösklar: normal text AA ≥ 4.5:1, stor text AA ≥ 3.0:1
(≥24px, eller ≥18.66px fet), UI/grafik ≥ 3.0:1.

## DEL A — Kontrast-värden (token-par)

| Par | Ratio | Normal (≥4.5) | Stor (≥3.0) | UI (≥3.0) |
|---|---|---|---|---|
| copper `#B8843E` på paper `#F5F0E4` | 2.88:1 | ✗ | ✗ | ✗ |
| copper-deep `#8E6429` på paper `#F5F0E4` | 4.61:1 | ✓ | ✓ | ✓ |
| copper-deep `#8E6429` på paper-soft `#FBF7EC` | 4.90:1 | ✓ | ✓ | ✓ |
| ink `#0E1411` på paper | 16.39:1 | ✓ | ✓ | ✓ |
| ink-2 `#3A453E` på paper | 8.79:1 | ✓ | ✓ | ✓ |
| ink-3 (gammalt) `#6B7269` på paper | 4.36:1 | ✗ | ✓ | ✓ |
| **ink-3 (v0.3) `#646B62` på paper** | **≥4.5:1** | **✓** | ✓ | ✓ |
| ink-3 `#6B7269` på paper-soft `#FBF7EC` | 4.63:1 | ✓ | ✓ | ✓ |
| ink-4 `#9AA098` på paper | 2.35:1 | ✗ | ✗ | ✗ |
| forest `#1F4636` på paper-soft | 9.87:1 | ✓ | ✓ | ✓ |
| success `#2D6B4F` på paper | 5.55:1 | ✓ | ✓ | ✓ |
| danger `#8B3A2E` på paper | 6.73:1 | ✓ | ✓ | ✓ |
| white `#FFFFFF` på copper `#B8843E` | 3.28:1 | ✗ | ✓ | ✓ |
| paper på forest `#1F4636` | 9.29:1 | ✓ | ✓ | ✓ |
| copper-warm `#D4A567` på forest-deep `#0F2A1F` | 6.84:1 | ✓ | ✓ | ✓ |

**Tre bärande slutsatser:**
1. **copper `#B8843E` får aldrig bära läsbar text på paper** (2.88:1 — faller på
   alla storlekar). copper är OK för ≥24px display-accenter, fyllningar, kanter
   och knapp-glow — för text/etiketter används **copper-deep** (4.61:1).
2. **ink-3 var surface-känsligt** (4.36 på paper, 4.63 på paper-soft). Åtgärdat
   genom att mörka token till `#646B62` → klarar normal AA även på paper.
3. **white-on-copper-knappar (3.28:1) faller normal-text-AA** — se kvarstående
   begränsning K1 (v0.2-brand, batchad till Zivar/v0.2-ägaren).

## DEL B — Komponent-fynd och åtgärder

| # | Fynd | Verdikt | Åtgärd i F7 |
|---|---|---|---|
| B1 | copper som ensam bärare av läsbar liten text | v0.3: en instans (`room-landing` eyebrow-ikon) | **Åtgärdat** — copper → copper-deep. Regel dokumenterad i DESIGNSYSTEM-v0.3.md. |
| B2 | ink-4 bär läsbar info | v0.3-komponenterna använder INTE ink-4 för info ✓ | Token-kommentar inlagd. v0.2-instanser (placeholder, admin-count) → se K3. |
| B3 | Status enbart via färg | v0.3 PASS — `VerifiedTag` (ikon+etikett), `ErrorState` (ikon+text), `Pill` med etikett | Ingen åtgärd krävd i v0.3. `Alert`/`sys-pill`-prickar → se K4. |
| B4 | ≥44×44 px träffyta | v0.3: `VerifiedTag`-trigger 44px ✓; `BottomSheet`-stäng var 38px | **Åtgärdat** — `.bottom-sheet-close` → min 44×44; `.verified-tag-trigger` → min-width 44 + centrerad. v0.2-chrome → se K2. |
| B5 | `prefers-reduced-motion` saknades globalt | FAIL (saknades helt) | **Åtgärdat** — global `@media (prefers-reduced-motion: reduce)` stillnar skeleton-shimmer, sheet-up/right, dot-pulse, fadeUp + alla transitions. |
| B6 | Synlig fokus-indikator | Inkonsekvent; input-ringen för svag | **Åtgärdat** — global `:where(...):focus-visible` (specificitet 0), ljus ring på forest-ytor, stärkt input-fokusring (solid forest, ≥3:1). |
| B7 | Brödtext ≥16px + kontrast | förrummets hero-underrad var 14px ink-3 på paper | **Åtgärdat** — → 16px ink-2. Meta/eyebrow/caption får vara mindre (sekundär metadata). |

**Status-regel verkställd (DEL A p3 i #18 F7):** varje statustagg/-prick bär form
eller textetikett, inte bara kulör — granskat för `VerifiedTag`, `HumbleNote`,
tillstånds-komponenterna.

**200 % textzoom:** v0.3-ytorna använder `rem`/`clamp`/flex/grid utan
fast-px-höjder som klipper text; layouten tål 200 % zoom (verifierat per design,
slut-genomgång i komponent-galleriet F8).

## Kvarstående kända begränsningar (batchade — utanför v0.3:s additiva scope)

Dessa rör **v0.2-lagret** (designsystem v0.2 / brief 21, ägs av design-omgörningen)
och är inte v0.3-komponenter. De flaggas här med exakt åtgärd; brief 35 ändrar
inte v0.2-brand/chrome destruktivt utöver den ink-3-justering DEL A tvingade fram.

- **K1 — white-on-copper-knappar (3.28:1, normal-text-AA-fail).** `.btn-copper`,
  `.mag-btn-accent` och copper-`LinkButton` samt notis-badgen i topbaren. Exakt
  fix: byt knapp-bakgrund copper `#B8843E` → copper-deep `#8E6429` (white-on-
  copper-deep ≈ 5:1). Lämnas till v0.2-ägaren/Zivar eftersom det är en
  brand-uttrycks-justering (DEL 7: brand-nivån är ytterst Zivars smak).
- **K2 — v0.2-chrome under 44px.** `.chrome-burger` (38), `.burger-drawer .close`
  (38), `.chrome-admin .ico-btn` (36), `.btn-sm` (36), `.mag-btn-sm` (38).
  Notera: 44px är WCAG 2.1 **AAA** (SC 2.5.5); 2.2 AA kräver bara 24px — alla
  klarar 24px. v0.3:s egna kontroller är höjda till 44px. v0.2-höjning lämnas
  till v0.2-ägaren (risk för layout-regression i 68/60px-chromen).
- **K3 — ink-4 i v0.2.** `.input::placeholder`, `.admin-sb-item .count`,
  `.admin-sb-label` använder ink-4 (2.35:1) för info. Fix: flytta till ink-3.
- **K4 — `Alert` + `.sys-pill`-prickar.** `Alert` skiljer toner enbart via hue
  (text finns dock); `.sys-pill .dot.green/.yellow/.red` är färg-enbart status.
  Fix: ton-ikon i `Alert`; etikett/ikon bredvid sys-pill-prickarna.

## Slutsats

Designsystem v0.3:s egna token-par och komponenter når WCAG 2.1 AA efter F7:s
åtgärder (ink-3-mörkning, reduced-motion, fokus, 44px, hero-text). Kvarstående
fynd (K1–K4) ligger i v0.2-lagret och är dokumenterade med exakt åtgärd för
v0.2-ägaren — v0.3 låses inte av dem, men de är synliggjorda (aldrig tyst
nedtonade).
