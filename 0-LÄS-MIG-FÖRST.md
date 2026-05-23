# 0 — Läs mig först

**Projekt:** Sadaqa Sweden *(arbetsnamn)*
**Uppdaterad:** 2026-05-23

Det här är ingången till hela projektet. Är du vilse — börja här.

---

## Mappstrukturen

```
Sadaqa-Sweden/
│
├── 0-LÄS-MIG-FÖRST.md      ← den här filen — kartan över projektet
│
├── 1-Planering/            ← VAD som ska byggas
│       Hela plattformen planerad i detalj. Börja i 00-Masterkarta.md.
│       17 moduler + Beredskapsplan + FORGE-genomgång.
│
├── 2-Byggplan/             ← HUR det byggs
│       Den sekvenserade exekveringsplanen för Claude Code.
│       Databas, Stripe, GitHub-repo, BankID, donationsflöde — steg för steg.
│
├── 3-Foreningsdokument/    ← föreningens juridiska kropp
│       Stadgar, mötesprotokoll, bröderskapspakt, verksamhetsbeskrivning,
│       registreringsguide. Word-filer att granska och dela med styrelsen.
│
├── 4-Bakgrund/             ← VARFÖR projektet finns
│       Ursprungsdokumenten — själsdokumentet, sammanfattningen, todo,
│       det första frö-arbetet. Bakgrund, inte aktuell plan.
│
├── 5-Kod/                  ← själva KODEN
│       Tom tills bygget startar. Detta blir GitHub-repot.
│
└── Supabase/               ← databasens säkerhetsregler
        SAKERHETSREGLER.md (följs vid varje DB-ändring) + den djupa
        fältmanualen. Läses av Claude Code — inte en del av bygget.
```

---

## Var börjar jag?

| Vill du... | Gå till |
|---|---|
| Förstå hela plattformen | `1-Planering/00-Masterkarta.md` |
| Se hur en enskild del fungerar | `1-Planering/Modul-XX-....md` |
| Veta vad vi gör om banken/Stripe stänger | `1-Planering/Beredskapsplan.md` |
| Se vad den externa granskningen ändrade | `1-Planering/FORGE-genomgang.md` |
| Registrera föreningen | `3-Foreningsdokument/Registreringsguide.docx` |
| Förstå varför projektet finns | `4-Bakgrund/Insamlingsplattform-sammanfattning.md` |
| Bygga plattformen | `2-Byggplan/00-Byggplan-oversikt.md` → `5-Kod/` |
| Bygga databasen säkert | `Supabase/SAKERHETSREGLER.md` |

> **Notation:** I dokumenten skrivs modulerna kort som **M1–M16**. *M3 betyder Modul 3* = filen `1-Planering/Modul-03-Granskar-flodet.md`. Hela listan med nummer och namn finns i `1-Planering/00-Masterkarta.md`.

---

## Regeln som håller projektet rent

Tre enkla regler. Följ dem så blir det aldrig rörigt:

1. **Inget löst i roten.** Allt bor i en numrerad mapp. Roten innehåller bara den här filen och de fem mapparna.
2. **Planering och kod blandas aldrig.** `1-Planering` och `2-Byggplan` är text — vad och hur. `5-Kod` är kod. De rör aldrig varandra. När kodfilerna börjar växa förblir planeringen ostörd.
3. **Numren är läsordningen.** 0 → 1 → 2 → 3 → 4 → 5. Den som är ny i projektet kan läsa rakt igenom.

---

## Varför inte en mapp per modul?

Du frågade om mappar per modul vore snyggast. Svar: **inte för planeringen.** Varje modul är *en* fil — en mapp per modul vore tomma lådor med ett papper i var. Platta filer i `1-Planering/` är renast så länge en modul = en fil.

**Mapp-per-modul hör hemma i koden.** När `5-Kod/` fylls kommer varje modul att bli flera filer (databas, logik, gränssnitt) — och *där* blir mappar per modul/funktion rätt. Den indelningen spikas i `2-Byggplan/` innan första kodraden skrivs, just för att koden ska födas organiserad — inte städas i efterhand.

---

## Så växer projektet

| Klart | Härnäst |
|---|---|
| 1-Planering (17 moduler + beredskap) | Bygget i `5-Kod/` — Claude Code kör byggsekvensen steg för steg |
| 2-Byggplan (exekveringsplan + rollout, 7 filer) | |
| 3-Foreningsdokument (utkast) | Föreningen registreras |

All planering är klar — plattform, byggplan och rollout. Startpunkten för bygget är `2-Byggplan/05-Byggsekvens.md`.
