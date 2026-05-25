# 01 — Översikt

## Vad är Sadaqa Sweden

En svenskspråkig insamlingsplattform för det muslimska samhället i Sverige.

**Vad som skiljer den från GoFundMe:**

1. **Granskning före publicering** — varje projekt prövas mot tre principer av en utbildad granskare. Inget syns offentligt förrän granskaren godkänt.
2. **BankID-verifierade insamlare** — alla som startar en insamling är identitetsverifierade. Trust-poäng räknas över tid baserat på bevis-historik.
3. **Transparens-loop** — insamlaren måste posta bevis (kvitton, bilder, dokument) vid start, utbetalning och resultat. Tomt = pausad insamling.
4. **Stripe Connect** direkt till mottagar-förening — plattformen tar inga avgifter (uppstartsåret), 100% till mottagaren.

---

## Rollmodellen — tre + en

| Roll | Vem | Vad ser hen | Chrome-läge |
|---|---|---|---|
| **Besökare** | Vem som helst på nätet | Publika ytor: marketing, discovery, fundraiser-sidor, profile, catalog, map, community | `ChromePublic` |
| **Donator** | Besökare som donerar | Samma + Stripe-flöde + kvitto-mejl | `ChromePublic` |
| **Insamlare** | BankID-verifierad person | Allt ovan + sitt eget Account-dashboard + wizard + uppdaterings-formulär | `ChromeInsamlare` |
| **Granskare / Admin / Team** | Internt team (Yasmin, Imran, etc.) | Allt + maskinrum: admin-dashboard, granskningskö, team-arbetsyta | `ChromeAdmin` (med sidebar) |

Det finns även en **system-roll** för dokumentationsytor i designen (Audit, Designsystem). De byggs inte i produktionen utan finns bara i studion.

---

## Route-kartan

Alla ytor i studion mappar mot en route i Next.js. Här är hela listan:

### Publika ytor (`role: public`)

| # | Studio-id | Route | Modul | Filnamn (befintlig) |
|---|---|---|---|---|
| 01 | `marketing` | `/` | M-Marketing | `app/page.tsx` |
| 02 | `discovery` | `/insamlingar` | M11 | `app/insamlingar/page.tsx` |
| 03 | `fundraiser` | `/insamlingar/[slug]` | M1 + M7 | `app/insamlingar/[slug]/page.tsx` |
| 04 | `donate` | `/insamlingar/[slug]/donera` | M4 | `app/insamlingar/[slug]/donera/page.tsx` |
| 05 | `profile` | `/u/[handle]` | M9 | `app/u/[handle]/page.tsx` |
| 06 | `catalog` | `/foreningar` | M10 | `app/foreningar/page.tsx` |
| 07 | `map` | `/karta` | M12 | `app/karta/page.tsx` |
| 08 | `community` | `/community` | M13 + M14 | `app/community/page.tsx` |
| 09 | `auth` | `/logga-in` | M6 | `app/logga-in/page.tsx` |

### Insamlare-ytor (`role: account`)

| # | Studio-id | Route | Modul |
|---|---|---|---|
| 10 | `account` | `/mina-sidor` | M2 + M9 |
| 11 | `wizard` | `/mina-sidor/ny` | M2 |
| 12 | `update` | `/mina-sidor/[slug]/uppdatering` | M7 |

### Admin-ytor (`role: admin`, subdomän `admin.sadaqasweden.se`)

| # | Studio-id | Route | Modul |
|---|---|---|---|
| 13 | `admin` | `/` (på admin-subdomän) | M16 |
| 14 | `review` | `/granskning` | M3 |
| 15 | `team` | `/team` | M17 |

> Subdomän-modellen är planerad enligt `2-Byggplan/18-Goal-Subdoman-forenkling.md`. Middleware i Next.js dirigerar baserat på subdomän.

---

## Komponentpyramiden

Studion är byggd som en pyramid — komponenter återanvänds över hela appen:

```
                          App (routing, tweaks)
                       /                          \
              StudioSidebar              StageFrame
                                           |
                       +-------------------+-------------------+
                       |                   |                   |
                ChromePublic       ChromeInsamlare       ChromeAdmin
                       |                   |                   |
                       +--------- screen content -----------+
                                           |
                       +-------------------+-------------------+
                       |                   |                   |
                CampaignCard         Btn, Tag, Photo     KPI-rad, Tabell
                       |                                       
                ProgressBar
```

Det betyder att en `CampaignCard` ser likadan ut i marketing, discovery och profile — bara olika props. Det är medvetet.

---

## Hur ytorna pratar med varandra

Inte tekniskt — utan i flödet en användare går igenom:

```
Marketing  →  Discovery  →  Fundraiser  →  Donate  →  Tack-sida
   ↓                            ↑
   →  Map  →  Discovery (filtrerad på stad)
   →  Catalog  →  Org-profil (M10, ej i studion)
   →  Wizard  →  Review (intern)  →  publicerat  →  Update (insamlaren)
   
   Auth  →  Account  →  {Wizard, Update, Profile}
   
   Admin  →  Review-detalj  →  {godkänn / fråga / avslå}
        →  Team  →  Inkommande / Inbox
```

Studio-sidebaren låter dig hoppa fritt mellan dessa, men i produkten finns naturliga gångvägar via knappar och länkar.

---

## Vilka data ligger var

I studion finns all demodata i `studio/data.js` (`window.STUDIO_DATA`). Strukturen där speglar **schemat** som ska in i Supabase:

| Studio-objekt | Supabase-tabell | Spec |
|---|---|---|
| `campaigns[]` | `fundraisers` | `2-Byggplan/01-Databasplan.md` |
| `categories[]` | `categories` | (enkel lookup-tabell) |
| `cities[]` | (härleds från `fundraisers.city`) | aggregat-vy |
| `threads[]` | `community_threads` | M13 |
| `events[]` | `events` | M14 |
| `audit[]` | (existerar bara i designen) | — |
| `user` | `users` + `bankid_verifications` | M6 |

---

## Verktygslådan — vad du har som hjälp

- **`source/studio.html`** — körbar designreferens, klickbar genom alla ytor
- **`source/studio/data.js`** — komplett demodata, samma struktur som DB
- **`source/assets/shared.js`** — wordmark + alla ikoner (Lucide-stil, inline SVG)
- **`source/studio/components.jsx`** — alla chrome-lägen och delade UI-bitar
- **`05-Audit-fynd.md`** — 17 lärdomar från v0.1 som ska *inte* återupprepas

---

## Vad finns *inte* i studion

För att hålla designen ren och inte fejka tekniska beslut har det här lämnats utanför:

- **Riktiga BankID-stegen** (Open BankID-appen, signering, callbacks) — bara start- och slut-UI:t finns
- **Stripe Connect-onboarding** (KYC-stegen för förening) — bara success-state
- **E-postutskick** — kvitton, "ny donation"-mejl, granskningsbeslut-mejl
- **Push-notiser** — bell-ikon visas men panel ej spec:ad
- **Cookie-banner** — GDPR-bannern ska byggas men ej i studion
- **404 / 500 / underhållsläge**

Alla dessa täcks i `2-Byggplan/`-mappen.
