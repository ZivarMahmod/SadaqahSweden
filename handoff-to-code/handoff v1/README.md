# Handoff to Code — Sadaqa Sweden

Den här mappen är en komplett designöverlämning från designern till Claude Code.
Den innehåller hela den klickbara designkatalogen + ett detaljerat byggspec-dokument.

> **▶ Claude Code: läs `00-START-HÄR.md` först.** Den sätter den här handoffen
> i rätt sammanhang (projektet är redan delvis byggt och live) och tar bort
> oklarheterna mellan design, plan och befintlig kod. `DESIGN-KARTA.md` säger
> vilken design-fil som hör till vilken route och vilket byggsteg.

---

## Vad ligger här

```
handoff-to-code/
├── README.md                  ← den här filen
├── byggplan.html              ← LÄS DETTA FÖRST — designgenomgång + byggplan
│
├── index.html                 ← Designkatalogen — överblick över alla ytor
│
├── marketing.html             ← Publik startsida (M11)
├── discovery.html             ← Listning & sök (M11)
├── fundraiser.html            ← Insamlingssidan (M1 + M7)
├── donate.html                ← Donator-flödet, 4 steg (M4)
├── wizard.html                ← Skapa-insamling, 5 steg (M2)
├── account.html               ← Insamlarens hemvy (M2)
├── update.html                ← Transparens-uppdatering (M7)
├── profile.html               ← Publik profil (M9)
├── catalog.html               ← Föreningskatalog (M10)
├── map.html                   ← Karta över Sverige (M12)
├── community.html             ← Community + events (M13 + M14)
├── auth.html                  ← Logga in via BankID/e-post (M6)
├── review.html                ← Granskningsvy (M3)
├── admin.html                 ← Admin/drift (M16)
├── team.html                  ← Team-arbetsyta (M17)
│
└── assets/
    ├── style.css              ← Designsystemets tokens — 94 CSS-variabler
    └── shared.js              ← Ordmärke, ikoner, footer, gemensam chrome
```

---

## Så använder Claude Code det här

1. **Öppna `byggplan.html` i browser.** Det är ett långt, navigerbart spec som täcker:
   - Designgenomgång: vad designern (jag) ser brister i, per yta + genomgripande
   - Verkliga övervägningar: GDPR, Skatteverket, Stripe-realiteter, bedrägeri-mönster
   - Arkitektur + filstruktur i Next.js App Router
   - Designsystem översatt till Tailwind v4
   - Per-route bygg-spec med komponentträd, server actions, kod-snippets
   - Tredjepart-integrationer: Criipto (BankID), Stripe Connect, R2, Resend
   - Tillstånds-matris (tom / loading / fel / success) per yta
   - Mobile breakpoints
   - A11y + i18n-krav
   - Byggsekvens kopplad till `2-Byggplan/05-Byggsekvens.md`

2. **Öppna `index.html`** för att navigera mellan alla designade ytor och se helheten.

3. **Per Steg i byggsekvensen:** Öppna motsvarande HTML-fil, identifiera komponenter, bygg primitiver först, sedan sidan med riktiga states (inte bara happy path).

4. **`assets/style.css`** är källan för alla designtokens. Kopiera den orörd till `app/tokens.css` och exponera värdena som Tailwind v4 `@theme`-variabler.

---

## Viktigt att veta

- **Designen är en grund, inte ett facit.** Hela § 01 i byggplan.html listar designbrister som måste fixas innan launch.
- **Bilderna är placeholdrar.** Riktiga foton ska komma från insamlarna, granskas, och laddas upp till R2.
- **Inga riktiga interaktioner är kopplade — det är HTML, inte React än.** Använd designen som visuell sanning + kod-spec som funktions-sanning.
- **Visuell DNA:** Spectral (display) + Manrope (UI) + JetBrains Mono (siffror), djupgrön/cream/koppar, 8-uddig stjärna som diskret motiv.
- **Powered by Corevo** ligger som tunn watermark i footer på publika sidor — behåll.

---

## Mappar i Sadaqa Sweden-projektet att referera till

| Vad | Var |
|---|---|
| 17 modulers planering | `1-Planering/` |
| Byggsekvens | `2-Byggplan/05-Byggsekvens.md` |
| Databas-säkerhet | `Supabase/SAKERHETSREGLER.md` |
| Kod ska byggas i | `5-Kod/` |

---

*Skapad av designern. Frågor → backa till mig (chat) innan ni bygger om något stort.*
