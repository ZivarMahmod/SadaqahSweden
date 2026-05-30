# Slutrapport — Designsystem v0.3 + IA (brief 35)

**Instans:** Design (DB-fri) · **Branch:** `bygg/design` (worktree `../sadaqa-design`)
**Datum:** 2026-05-30 · **Status:** brief 35 KLAR (Förkrav + F1–F9). Bygget grönt, branchen pushad.
**Migrationer:** INGA skapade (block lämnat orört — annan instans äger databasen).

> Branchen är pushad till `origin/bygg/design` (aldrig `main`). Live-deploy-
> verifieringen (F9:s sista punkt) är medvetet uppskjuten till Coworks merge —
> se "Avvikelse 1" nedan. `npm run cf-build` är grön i varje pushat tillstånd.

---

## Per punkt

| Punkt | Vad | Commit | cf-build |
|---|---|---|---|
| Förkrav | Baslinjen var redan grön — ingen fix-commit behövdes | (ingen) | ✓ grön |
| F1 | utility-tonläget: `data-tone="utility"`-scope + tondensitets-variabler + `ToneSurface`-konvention (server-säker, INTE React-context — ChromePublic är server). Ikon-set utökat (info/refresh/cloud-off/sun/book-open). | `5b91556` | ✓ |
| F2 | Tillstånds-grammatik: `SkeletonState` (variant/lines, ingen spinner), `ErrorState` (onRetry + offline-variant). `EmptyState` (v0.2) oförändrad/fryst. | `e206b42` | ✓ |
| F3 | `EntityCard`-familjen (#18-kontrakt + `footer`/`compact`-extensions). `InsamlingCard` ombyggd som tunn adapter — API oförändrat (`InsamlingCard`, `InsamlingCardData`, `kr`). Ingen betygs-/röst-prop. | `b795709` | ✓ |
| F4 | `HumbleNote` — ink-3 + info-ikon, aldrig danger/ruta, skild från `Alert`, prop-styrd copy. | `722d52a` | ✓ |
| F5 | `BottomSheet` (fokus-trap/ESC/overlay, sidopanel ≥768px), `VerifiedTag` (Tag+attribution+förklaring, ≥44px, typ-diskriminator, aldrig banderoll), arabisk textstil (`.ar-text`, RTL-isolering, bytbart `--font-arabic`). | `3a344ac` | ✓ |
| F6 | `lib/navigation.ts` (fem rum, ramverks-neutral). `ChromePublic` topbar ur konfig via `RoomNav` (aktiv-markering; all server-logik intakt). Drawer: rummen + `DRAWER_SECONDARY`. Statiskt webb-förrum. `RoomComingSoon`-platshållare + fyra rum-routes. Ingen migration. | `e038c06` | ✓ |
| F7 | WCAG 2.1 AA-revision: ink-3 mörkad #6B7269→#646B62, global `prefers-reduced-motion`, global `:focus-visible` + stärkt input-ring, ≥44px på v0.3-kontroller. Bevis: `docs/A11Y-REVISION-v0.3.md`. | `849f4cf` | ✓ |
| F8 | Komponent-galleri `/admin/designsystem` (intern, utility, mock-data) + `docs/DESIGNSYSTEM-v0.3.md` (8 delar) + länk i `5-Kod/CLAUDE.md`. | `838e2db` | ✓ |
| F9 | Verifiering: frysta importer intakta (grep), nya routes finns, slut-cf-build grön. | denna commit | ✓ |

Alla åtta "Klar när"-block är uppfyllda i kod. Verifiering utöver cf-build:
`tsc --noEmit` grön i varje omgång; en **WCAG-revisions-subagent** beräknade alla
kontrast-ratios (audit of record i `A11Y-REVISION-v0.3.md`); en **kodgransknings-
subagent** granskade hela diffen mot `16f9f5e` — **inga high-confidence-fynd**
(InsamlingCard-adaptern verifierad fält-för-fält mot originalet; ChromePublics
server-logik bevarad byte-för-byte; förrummet rent; tonläges-/fokus-CSS
icke-regressiv).

---

## Autonoma beslut (de viktiga)

1. **Tonläges-mekanism = `data-tone` + CSS-scoping, INTE en React-`ToneProvider`.**
   `ChromePublic`/route-layouter är server-komponenter; en context-provider hade
   tvingat `"use client"` på konsumenterna. `<ToneSurface>` sätter bara
   `data-tone` och är server-säker. Komponenter läser densitet ur `--tone-*`.
2. **Ikoner: behöll repo:ts bespoke `Icon` (ingen lucide-react infördes).**
   Briefen nämner "Lucide" löst, men repo har en egen ikon-uppsättning.
   Nav-konfig lagrar ett ikon-NAMN (sträng) → ramverks-neutralt, bättre för
   "en karta, två ytuttryck" än en komponent-referens. Utökade setet additivt.
3. **Webb-förrummet gjordes HELT statiskt** (ingen DB, ingen `aktuellAnvandare`).
   /goal säger mock-data/ingen DB; #19 förbjuder central feed. Den tidigare
   feed-/aggregat-tunga delen ersattes av de fem rummen som lugna ingångar.
   Personalisering (inloggad-state) bor kvar i `ChromePublic`.
4. **De fem rummen lades ÄVEN först i drawern.** Topbar-navet göms < 1100px
   (v0.2-CSS); utan rummen i drawern hade mobil-webben saknat rums-navigation.
   Brief säger "rummen i topbaren, inte i drawern" — tolkat som desktop-idealet;
   drawern är mobil-fallbacken (+ sekundära ytor). Medvetet a11y-/mobil-val.
5. **Rum-routes vs catch-all:** explicita `/ge /min-vardag /gemenskap /kunskap`
   skapade som `RoomComingSoon`-landningar (vinner över catch-all `/[slug]`).
   Karta pekar på befintliga `/karta`. Inga 404 — ofärdiga rum visar lugn
   "öppnar snart" + länkar till redan-liveytor (insamlingar/events/föreningar/faq).
6. **Drawer-sekundärlänkar härleddes ur `footer.tsx`** (verifierat existerande
   slugs som catch-allen renderar som lugna platshållare) → inga 404.
7. **InsamlingCard-adaptern reproducerar den exakta v0.2-vyn** via `EntityCard` +
   `footer`/`statusTag`/`thumbnail`-props; densitets-variablernas editorial-
   värden satta så griden matchar (eyebrow 12px, titel 22px, gap 14, pad 24).

## Avvikelser från brief 35 (löst till /goal:s fördel — /goal är senast/överordnad)

1. **F9 live-deploy-verifiering uppskjuten.** Brief 35 F9 vill verifiera
   `sadaqahsweden.se/` (200, fem rum i topbaren) efter push. Men /goal säger
   "pusha branchen, ALDRIG main" + "annan instans äger databasen" + Cowork
   mergar. En branch-push utlöser ingen deploy. Därför: `cf-build` grön + branch
   pushad är min leverans; **live-verifieringen sker vid Coworks merge till main.**
2. **Inga migrationer** (brief reserverade `0079`, lämnas oanvänt) — /goal:
   skriv inga migrationer. F6:s nav-konfig är en statisk fil (vilket #18 ändå
   föredrar). Block orört.
3. **Rapportfil:** `_rapport-design.md` (per /goal), inte `_rapport-gemenskap.md`
   (doc-57:s äldre block, ersatt av /goal).

## Vad `app/(public)/page.tsx` visade FÖRE omarbetningen

En marknadsförings-/discovery-landning som server-läste Supabase: publik
totalsumma + antal (aggregat), tre featured aktiva insamlingar (`InsamlingCard`),
och en kategori-grid med per-kategori-räkning. Plus statiska sektioner (hero, tre
steg, granskningslöfte, förenings-CTA). Den feed-/aggregat-tunga delen
(featured + kategorier + stats) togs bort; hero, granskningslöfte och
förenings-CTA behölls statiskt; de fem rummen blev förrummets kärna.

## A11y — kvarstående kända begränsningar (i v0.2-lagret, ej v0.3)

Fullt i `docs/A11Y-REVISION-v0.3.md`. v0.3:s egna token-par/komponenter når AA.
Kvarstår i v0.2 (flaggat till v0.2-ägaren/Zivar, ej tyst nedtonat):
- **K1:** white-on-copper-knappar 3.28:1 (fail normal text) → byt knapp-bg till
  copper-deep. Brand-justering = Zivars smak (DEL 7), därför inte ändrad här.
- **K2:** v0.2-chrome < 44px (chrome-burger 38, ico-btn 36, btn-sm 36, mag-btn-sm 38).
  44px är AAA/2.2 kräver 24px (alla klarar). v0.3:s egna kontroller höjda.
- **K3:** ink-4 bär info i `.input::placeholder`, `.admin-sb-item .count/.label`.
- **K4:** `Alert` skiljer toner via hue; `.sys-pill`-prickar är färg-enbart status.

## Batchade mänskliga uppföljningar (blockerar inte bygget)

- Visuell smak-genomgång av förrummet + galleriet mot handoff v2.1 (brand-nivån
  är Zivars smak; v0.3 sätter golvet "återhållet, ingen kitsch").
- Slutgiltigt arabiskt mus'haf-/naskh-typsnitt väljs i brief 46, byts på ett
  ställe (`--font-arabic`).
- K1 (copper-knappar) — brand-/AA-beslut till v0.2-ägaren.

## Konsumtion av v0.3 (för briefs 38–51)

Kontrakt: `docs/DESIGNSYSTEM-v0.3.md`. Varje yt-brief: använd rätt tonläge, skriv
sin `EntityCard`-adapter, använd tillstånds-grammatiken, lägg sina nivå-2-flikar
i `lib/navigation.ts`, ersätt sitt rums `RoomComingSoon`. Brief 38 fyller
`VerifiedTag`:s fem betydelser. Brief 51 importerar `lib/navigation.ts` för
app-bottennavet + placerar `EntityCard.compact` på app-hemmet.

## Efter brief 35 (pågående — /goal: "fortsätt … tills Cowork säger stopp")

Fortsätter med strikt TVÄRGÅENDE delade komponenter klustren behöver (mock-data),
INTE domän-komponenter som ägs av sina briefar (QiblaDial/ReaderView/PrayerRow/
Calendar → 46/47/48). Nästa: `RoomTabs`/`Tabs` (nivå-2-flik-navigering som varje
rum behöver men ingen yta renderar än). Loggas nedan allteftersom.

### Tillägg efter F9
- (fylls på)
