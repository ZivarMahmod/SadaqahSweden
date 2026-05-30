# Designsystem v0.3 — integrationskontrakt

**Brief:** 35 · **Status:** byggt. Det här dokumentet är *kontraktet* varje
yt-brief (38–51) konsumerar. Uppfinn aldrig ett eget designspråk eller ett eget
kort — använd det som står här. Verifierings-yta: `/admin/designsystem`
(komponent-galleriet). A11y-bevis: [`A11Y-REVISION-v0.3.md`](./A11Y-REVISION-v0.3.md).

---

## 1. Vad v0.3 är

En **additiv utvidgning** av v0.2 (handoff v2.1, brief 21). v0.3 lägger till det
v0.2 inte täckte — nya katalogkort, religiösa läsytor, en kalender, en karta,
ett samtalssystem — och informationsarkitekturen (fem rum) som binder ihop dem.

- **Inga nya färg-tokens.** Samma `--color-*` som v0.2.
- **Inga nya typsnitt** utom den arabiska textstilen (ett medvetet undantag, F5).
- **Ingen ny radie-skala.** Samma `--sr-0…--sr-4`.
- **v0.2 ändras aldrig destruktivt.** Enda undantaget: WCAG-revisionen (F7) fick
  mörka `--color-ink-3` (#6B7269 → #646B62) för AA. Krockar löses annars till
  v0.2:s fördel.

Allt v0.3-CSS ligger i `app/globals.css` under rubriken "DESIGNSYSTEM v0.3".

---

## 2. De två tonlägena (`editorial` / `utility`)

Två tonlägen, **ett** system (#18 R7). Det finns ingen utility-färgpalett — samma
tokens, färger och radier; bara spacing-densitet, typografi-grad och
siffer-framträdande skiljer.

- **editorial** = v0.2 oförändrat (default). Magasinslagret: drop-cap,
  pull-quote, `mag-lead`, stora Spectral-displayer. Lugna landningar, läsytor.
- **utility** = nytt i v0.3. Tätare spacing, Manrope-driven funktionell text,
  framträdande/tabulära siffror, ingen drop-cap/pull-quote. Verktygsytor.

**`surface_mode`-konventionen:** INGEN databaskolumn. En yta taggar sig själv
genom att rendera sitt innehåll i `<ToneSurface tone="utility">`
(`components/ui/tone.tsx`), som sätter `data-tone="utility"`. CSS
(`[data-tone="utility"]`) ger då den tätare behandlingen. Server-säker.

v0.3-komponenter läser densiteten ur `--tone-*`-variabler och blir tonmedvetna
automatiskt.

**Vilket läge gäller var:**

| Yta | Tonläge |
|---|---|
| Webb-förrummet, topbar | editorial |
| Rum: Ge, Gemenskap, Kunskap | editorial |
| Rum: Min vardag, Karta | utility |
| Bönetider, qibla, kalender, kart-sheet, dashboards | utility |
| Läsytor (Koran) | editorial |
| Komponent-galleriet | utility |

---

## 3. Tillstånds-grammatiken (laddar / tomt / fel / klart)

Fyra tillstånd, en design var. **Varje listande/hämtande yta i hela bygget
använder dessa — ingen yt-brief uppfinner sina egna.** Aldrig bara happy path.

| Tillstånd | Komponent | Not |
|---|---|---|
| laddar | `SkeletonState` | Lugn skelett-platshållare (paper-deep). `variant` (text/list/card/block) + `lines`/`count` formar efter kommande layout. **Aldrig en spinner på en tom sida** — spinner bara för BankID/betalning (extern väntan). |
| tomt | `EmptyState` (v0.2, fryst API) | Alltid en mening om *varför* tomt + en väg vidare. Varm ton, men copy är alltid prop-styrd. Religiösa ytor: ingen jargong-ton. |
| fel | `ErrorState` | Ärligt, icke-skrämmande, alltid `onRetry` ("Försök igen"). `variant="offline"` = diskret rad (religiösa verktyg faller tillbaka på sparad data — felet ska knappt synas). Skild från `Alert`. |
| klart | (ingen egen komponent) | Det normala. |

---

## 4. `EntityCard`-familjen

En gemensam kort-stomme. **Insamlings-, förenings-, event-, imam- och FAQ-kort
är *konfigurationer* av den — inget nytt kort designas separat** (#18 R3). Ingen
byggare gör ett nytt kort utan att visa varför stommen inte räcker.

Renderings-kontrakt (`components/ui/entity-card.tsx`):

| Prop | Typ | Not |
|---|---|---|
| `eyebrow` | `string` | Typ/kategori (Eyebrow-stil). |
| `title` | `string` | Spectral-titel. |
| `metaLines` | `string[]` | 1–2 meta-rader. |
| `statusTag` | `ReactNode?` | Statustagg (overlay på thumbnail om sådan finns). |
| `thumbnail` | `ReactNode?` | Bild/Photo. |
| `progress` | `number?` | **Bara insamlingar.** ProgressBar-andel. |
| `dateBlock` | `ReactNode?` | **Bara events.** |
| `action` | `ReactNode?` | Valfri åtgärd. |
| `footer` | `ReactNode?` | v0.3-extension: fri fot (t.ex. insamlingens belopps-rad). |
| `href` | `string?` | Hela kortet blir en länk. |
| `compact` | `boolean?` | App-hemmets kort-anatomi (anatomin här; brief 51 placerar den). |

**INGEN betygs-, stjärn- eller röst-prop. Aldrig (princip A).**

**Adapter-mönstret:** varje område skriver en *tunn adapter* som mappar sin
entitet → EntityCard-props. `InsamlingCard` (`insamling-card.tsx`) är
referens-adaptern — dess exporterade API (`InsamlingCard`, `InsamlingCardData`,
`kr`) är oförändrat; inuti delar den stommen. Förening (#2), event (#3), imam
(#10), FAQ-träff (#9) skriver sina egna adaptrar likadant.

---

## 5. `HumbleNote` · `VerifiedTag` · `BottomSheet` · arabisk textstil

- **`HumbleNote`** (`humble-note.tsx`) — lågmäld ärlighets-not för religiös
  osäkerhet (#7 hög-latitud, #8 "beräkning, inte dekret"). ink-3 + diskret
  info-ikon, **aldrig** danger/varningsruta. Skild från `Alert` (Alert =
  fel/info/success i ett flöde). **Texten är alltid prop-styrd — ingen default
  religiös copy** (princip E). Komponenten *bär* osäkerhet, uttalar aldrig en
  religiös bedömning.
- **`VerifiedTag`** (`verified-tag.tsx`) — DESIGN-mönstret för "Verifierad X"
  (35 äger designen, **38 äger semantiken/de fem betydelserna**). Tag + en
  attributions-rad (`by`/`at`/`method`) + `explanation` vid tryck. `kind`-prop
  håller de fem markeringarna visuellt åtskilda. **Aldrig en banderoll.** ≥44px
  träffyta. Brief 38 fyller i de fem konkreta betydelserna.
- **`BottomSheet`** (`bottom-sheet.tsx`) — nerifrån på mobil, sidopanel från
  höger på desktop (≥768px). Fokus-trap, ESC, overlay-klick stänger. Byggd EN
  gång; återanvänds av kartan (42) och valfria detaljvyer.
- **Arabisk textstil** (`.ar-text` i globals.css) — definierad EN gång. Sätt
  `lang="ar" dir="rtl"`. **RTL-ISOLERING (#18 R8):** bara textblocket vänds
  (`unicode-bidi: isolate`) — resten av appen är svensk LTR. Typsnittet
  (`--font-arabic`) ägs av #6/brief 46 och byts på **ett** ställe.

---

## 6. Navigationskonfigurationen — de fem rummen

`lib/navigation.ts` är **EN sanningskälla** för informationsarkitekturen.
Ramverks-neutral data (ingen JSX; `icon` är ett namn ur Icon-setet). Webb-topbar
(`RoomNav`) OCH app-bottennav (brief 51) importerar **samma fil** — en karta, två
ytuttryck (princip N).

- **Nivå 1 — de fem rummen**, i ordning: **Ge · Min vardag · Karta · Gemenskap ·
  Kunskap.** Var och en: `key`, `label`, `icon`, `href`, `tone`, `description`.
- **Nivå 2 — `tabs`** per rum. **Brief 35 fyllde bara i det säkert kända** (de
  flikar #18/#19 listar + redan liveytor). **Varje yt-brief lägger till sina egna
  nivå-2-flikar i samma fil** när den bygger sitt rum. Ofärdiga flikar har
  `comingSoon: true` och pekar tills vidare på rummets `RoomComingSoon`-landning.
- **Nivå 3 — `DRAWER_SECONDARY`** (om/juridik) i drawern.

Rum vars yta inte byggts än har en lugn `RoomComingSoon`-landning (aldrig en 404).
När en yt-brief bygger sitt rum ersätter den platshållaren och lyfter `comingSoon`.

---

## 7. De permanenta designsystem-reglerna (A–N + #18)

Bindande för alla framtida briefar:

- **Ingen gamifiering av tillbedjan (C).** Ingen progress-mätare av
  prestationstyp, ingen streak, ingen "X % läst", ingen badge, ingen konfetti.
  `ProgressBar` är **bara** för insamlingars belopp — aldrig för tillbedjan.
- **Inga betyg/recensioner/rangordning (A).** Ingen stjärn-/röst-/topplista-
  komponent. `EntityCard` har ingen betygs-prop.
- **Healthy-by-design (D).** Inga badge-larm, ingen oändlig feed, inga
  manipulativa mönster. Tomma tillstånd lockar aldrig tillbaka. Animation
  respekterar `prefers-reduced-motion`.
- **Plattformen bygger behållaren, aldrig substansen (E).** Ingen plattforms-
  skriven religiös copy i komponent-defaults. `HumbleNote`/`VerifiedTag` bär
  ärligheten, påstår aldrig religiös substans.
- **Ingen religiös kitsch (#18 R5).** Inga dekorativa islamiska mönsterytor,
  ingen halvmåne-/stjärn-klyscha (utom v0.2:s godkända `rub el hizb`-mark), ingen
  emoji som dekor.
- **Ingen användarstyrd temaväxling (DEL 7 pkt 23).** Ingen tweaks-panel i
  produktion. v0.3 är *ett* fast system.
- **Inget mörkt läge på webben i v1.** (Appen respekterar systemets mörka läge —
  app-lagrets ansvar, brief 51.)
- **Appen är samma plattform (N).** En navigationskarta → två ytuttryck. Ingen
  app-exklusiv komponent, ingen webb-exklusiv navigation.

---

## 8. A11y-golvet (WCAG 2.1 AA)

Fullständig revision: [`A11Y-REVISION-v0.3.md`](./A11Y-REVISION-v0.3.md). I korthet:

- **copper `#B8843E` bär aldrig läsbar text på paper** (2.88:1). För text/etiketter
  används **copper-deep `#8E6429`** (4.61:1). copper-länkar understryks alltid.
- **ink-4 `#9AA098` bär aldrig läsbar info** — bara dividers/dim.
- **ink-3** är mörkad till `#646B62` (klarar AA på paper).
- **Status bärs aldrig av färg ensam** — alltid form eller textetikett.
- **≥44×44 px effektiv träffyta** för klickbara taggar / `VerifiedTag` /
  v0.3-kontroller.
- **`prefers-reduced-motion`** stillnar all animation globalt.
- **Synlig fokus-indikator** på alla interaktiva element; korrekt fokushantering
  i `BottomSheet` (trap) och `BurgerDrawer`.
- **Brödtext ≥16px**; layouten tål 200 % textzoom.
