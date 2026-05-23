# 06 — Rollout-plan

**Datum:** 2026-05-23
**Vad detta är:** Planen för *vad som lanseras för riktiga användare, och när*. Byggsekvensen (fil 05) säger i vilken ordning koden byggs. Den här filen säger i vilken ordning den **släpps**. Det är inte samma sak.

---

## 1. Principen

Plattformen är omfattande — 16 moduler. Att släppa allt på en gång är fel av tre skäl: det blir omöjligt att underhålla buggar, det överväldigar granskningsteamet, och det gör plattformen svår att förstå för nya användare.

**Tre regler styr rollouten:**

1. **Lansera smalt och välbyggt.** Hellre en liten plattform som gör *en sak* utmärkt än en stor som gör tio saker halvbra. Fas 1 är insamlingens kärnflöde — felfritt. Inget mer.
2. **Väx successivt, i takt med att grunden bevisar sig.** Nästa fas öppnas först när den förra är stabil. Inte efter ett datum — efter ett bevis.
3. **Bakficka, inte bantning.** Funktioner som inte är med vid lansering är inte borttagna — de är planerade och förberedda (uttaget finns), men *aktiveras när användare faktiskt efterfrågar dem*. Vi gissar inte vad folk vill ha. Vi väntar på signalen.

> **Konsekvens framför frestelse:** Lanseringsscopet är spikat. När det kliar att lägga till "bara en sak till" före lansering — svaret är nej, det går i bakfickan. Disciplinen *är* kvaliteten.

---

## 2. Rollouten är också riskhantering

Det här hänger ihop med `Beredskapsplan.md`. En liten, kontrollerad, spårbar plattform är precis vad som håller banker och Stripe lugna. Snabb, okontrollerad tillväxt är vad som triggar "ni är för riskfyllda".

Att lansera smalt med volym-spakarna på (manuell granskning av allt, tak på antal aktiva insamlingar — M3) är därför inte bara buggvänligt. Det är debanking-försvaret i praktiken: vi växer i en takt där varje krona förblir granskad och spårbar.

---

## 3. De fyra faserna

| Fas | Vad släpps | Volym | Öppnas för nästa fas när |
|---|---|---|---|
| **0 — Pilot** | Kärnloopen, sluten | Nära noll, allt manuellt | Loopen funkar fläckfritt på riktiga pengar |
| **1 — Mjuk publik** | Insamlingens kärnflöde | Spakar på, kontrollerad | Granskningen håller, ingen allvarlig incident |
| **2 — Levande** | Transparens, profiler, notiser | Spakar gradvis lösare | Stabil drift, teamet skalar |
| **3 — Världen** | Katalog, karta, community, events | Öppen | — (bit för bit, efter efterfrågan) |

### Fas 0 — Pilot (sluten lansering)

**Mål:** Bevisa hela loopen med riktiga pengar — minimal risk.

- **Scope:** Bygg-grupp A klar (skapa → granska → donera → bevisa → utbetala).
- **Vilka:** Endast inbjudna insamlare. Börja med din egen bönematte-insamling — den var pilot från start. Kanske 1–5 insamlingar totalt.
- **Volym:** Allt manuellt godkänt. Tak nära noll.
- **Förutsätter:** Bankkonton, Stripe Connect och BankID-broker på plats (`Beredskapsplan.md`). Föreningen registrerad.
- **Klar när:** Minst en insamling gått hela vägen — inklusive utbetalning och resultatbevis — utan problem.

### Fas 1 — Mjuk publik lansering

**Mål:** En konkret, välbyggd, *smal* plattform — öppen för allmänheten. Kärnan, inget annat.

- **Scope:** Bygg-grupp A fullt ut + det minsta av B som krävs för förtroende: enkla profiler och discovery (så folk hittar insamlingar och ser vem som står bakom). Exakt det flöde du beskrev: *plattformen frågar vem du är och vad du samlar till → granskar → insamlaren kopplar sitt konto → publiceras → folk donerar → insamlaren delar QR-kod i sitt nätverk.*
- **Volym:** Spakarna PÅ (M3 volymstrategi) — varje insamling manuellt godkänd, tak på antal samtidigt aktiva, eventuellt start i en region. Kontrollerad tillväxt.
- **Inte med (i bakfickan):** karta, community, events, katalog, djupt badge-system, återkommande insamlingar. Se §4.
- **Klar när:** Granskningsteamet har bevisat att det håller takten, ingen allvarlig incident, drift och ekonomi stabila.

### Fas 2 — Trovärdig och levande

**Mål:** Plattformen känns levande, inte bara funktionell.

- **Scope:** Resten av Bygg-grupp B — hela transparens-loopen synlig, badges, notiser, rikare profiler, bättre discovery.
- **Volym:** Spakarna gradvis lösare. Granskarteamet utökas (M3) i takt med volymen.

### Fas 3 — Världen, bit för bit

**Mål:** Plattformen blir en plats man går in på, inte bara en man donerar via.

- **Scope:** Bygg-grupp C — katalog, karta, community, events. **Släpps en bit i taget**, i den ordning efterfrågan visar — inte allt på en gång.
- **Community sist och försiktigt** — det är plattformens största kaosrisk (M13). Släpps när allt annat är stabilt.

---

## 4. Bakfickan

Det här är medvetet tillbakahållet. Allt är planerat och förberett — uttaget finns i planen och datamodellen — men funktionen aktiveras först när riktiga användare efterfrågar den.

| I bakfickan | Planerat i | Släpps när |
|---|---|---|
| Återkommande insamlingar / "mission"-lagret | M1 framtidsspår | Insamlare ber om att driva pågående insatser |
| Per-enhet-donation ("köp 20 mattor") | M4 | Tidigast fas 2, om det efterfrågas |
| AI-skrivassistent för beskrivningar | M1 / M2 | Efter att wizarden bevisat sig |
| Video-uppladdning | M1 | När bild inte räcker och volymen bär kostnaden |
| Match-funding | M4 | Om en partner vill matcha — kräver tredjepartsåtagande |
| Fler valutor än SEK | M1 Block 2 | Om en tydlig internationell användning uppstår |
| Event-biljetter / anmälan | M14 | Om föreningar efterfrågar det |

**Regeln:** en sak flyttas ur bakfickan när *användare frågar efter den* — inte när vi tror att den vore kul. Efterfrågan är signalen.

---

## 5. Vad som ALDRIG väntar

Vissa saker är inte "fas 2-finlir" — de måste finnas redan vid Fas 0, annars ska inget släppas alls:

- **Granskning före publicering** — ingen insamling når allmänheten ogranskad.
- **Spårbarhet** — varje krona spårbar, varje insamlare BankID-verifierad.
- **Säkerheten i databasen** — RLS på allt, roller serverside.
- **Transparens-loopens tre bevis** — start, utbetalning, resultat.
- **Anti-diskriminering och anti-kaos** — inbyggt, inte påklistrat.
- **Beredskapen** — bankkonton hos flera banker, incidentplan (`Beredskapsplan.md`).

Det här är inte funktioner som rullas ut. Det är grunden plattformen står på.

---

## 6. Beslut & principer

| Beslut | Motivering |
|---|---|
| Fyra faser, inte en stor lansering | Omöjligt att underhålla buggar och granska volym om allt släpps samtidigt. |
| Nästa fas öppnas av ett *bevis*, inte ett *datum* | Pressa fram en fas innan grunden håller skapar just det kaos vi vill undvika. |
| Bakficka i stället för bantning | Funktionerna är värdefulla — men ska aktiveras av efterfrågan, inte gissning. |
| Lanseringsscopet är spikat | "Bara en sak till" före lansering är hur smala, välbyggda plattformar blir spretiga. |
| Kontrollerad volym från start | Lika mycket debanking-försvar som buggkontroll — se §2. |
| Community släpps sist | Största kaosrisken (M13) — släpps först när allt annat är stabilt. |

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första rollout-planen. Fyra faser, bakficka, koppling till volymstrategi och beredskap. |
