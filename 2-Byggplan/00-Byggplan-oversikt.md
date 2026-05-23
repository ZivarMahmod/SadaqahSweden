# 00 — Byggplan: översikt

**Projekt:** Sadaqa Sweden *(arbetsnamn)*
**Datum:** 2026-05-23
**Vad detta är:** Bryggan mellan planeringen (`1-Planering/`) och koden (`5-Kod/`). Planeringen säger *vad* plattformen är. Den här mappen säger *hur* den byggs — med vilken teknik, i vilken ordning, efter vilka principer. Börja här.

---

## 1. Hur den här mappen hänger ihop

`2-Byggplan/` har sju filer. Läs dem i ordning.

| Fil | Innehåll |
|---|---|
| **00 Byggplan: översikt** (denna) | Teknikval, byggfilosofi, hur Claude Code arbetar |
| **01 Databasplan** | Datamodellen — alla tabeller, relationer, säkerhetsprinciper |
| **02 Stripe & pengaflöde** | Stripe Connect tekniskt — hur databasen och pengarna kopplas korrekt |
| **03 BankID, auth & donationsflöde** | Identitet, inloggningsfri donation, realtidsräknaren |
| **04 Repo & kodstruktur** | GitHub-repot och den interna mappstrukturen i `5-Kod/` |
| **05 Byggsekvens** | De numrerade byggstegen — vad Claude Code kör, i vilken ordning |
| **06 Rollout-plan** | Vad som lanseras för riktiga användare, och när — i fyra faser |

Den här filen + 05 är de viktigaste. 01–04 är djupdykningarna.

---

## 2. Teknikvalet

> ⚠️ **Detta är byggets mest grundläggande beslut.** Allt annat bygger på det. Vill du ändra något — särskilt frontend — säg det **nu**, innan Claude Code börjar. Att byta efteråt är dyrt.

| Lager | Val | Varför |
|---|---|---|
| **Frontend** | Next.js (App Router) + TypeScript + Tailwind CSS | SSR/SEO — publika insamlingssidor måste indexeras av Google och ge snygga delningskort i sociala medier. Hela discovery-tesen ("trafiken bygger sig själv", M11) kräver det. |
| **Databas & backend** | Supabase — Postgres + Auth + Realtime + Storage + Edge Functions | Postgres = rätt databas (inte SQLite). RLS = säkerhet i databasen, inte i frontend. Realtime = realtidsräknaren direkt ur lådan. Storage = bilder. Edge Functions = Stripe-webhooks. Du kan Supabase sedan Corevo. |
| **Betalning** | Stripe Connect (Express) | Pengarna går direkt till insamlaren — plattformen rör dem aldrig juridiskt (M5). Express = enklast onboarding för insamlaren. |
| **Identitet** | BankID via broker (t.ex. Criipto) | BankID kräver eget avtal + certifikat. En broker tar den komplexiteten. Detta är ditt parallella spår — se fil 03. |
| **Hosting** | Cloudflare Pages (frontend) + Supabase (managed databas) | Next.js körs på Cloudflare via OpenNext-adaptern `@opennextjs/cloudflare` — ett extra lager, men officiellt stött. Auto-deploy från GitHub. |
| **E-post** | Resend | Transaktionsmejl — kvitton, granskningsbesked, notiser. |
| **Bakgrundsjobb** | Supabase pg_cron + Edge Functions | Deadline-stängning, utbetalnings-triggers, notiser — schemalagt i databasen. |
| **Kod** | GitHub-repo, auto-deploy till Cloudflare Pages | En commit → en deploy. |

**Varför Next.js och inte Vite (som i Corevo):** Corevo är en intern POS — ingen behöver googla den. Sadaqa Sweden lever tvärtom på publik synlighet: en insamling måste kunna hittas, delas och förhandsvisas snyggt. Det är skälet, och det enda stället där den här plattformen medvetet avviker från Corevos stack.

**Detta svarar på FORGE punkt 6** (teknisk arkitektur för skala) — Postgres, riktig hosting, bakgrundsjobb, CDN och e-postleverantör är alla spikade här, innan första kodraden.

---

## 3. Byggfilosofin — så arbetar Claude Code

Tio regler. De gäller varje byggsteg.

1. **Ett steg i taget.** Byggsekvensen (fil 05) körs i ordning. Inget hoppande, inget parallellbygge av beroende steg.
2. **Verifiera innan nästa steg.** Varje steg har en "Klar när"-lista. Den ska vara grön innan nästa steg börjar.
3. **En commit per steg.** Liten, läsbar git-historik. Commit-meddelandet säger vad steget gjorde.
4. **Databasen ändras bara via migrationer.** Numrerade, versionshanterade, idempotenta. Destruktiva migrationer har en rollback. Databasen ändras aldrig för hand.
5. **RLS från dag 1.** Varje ny tabell får Row Level Security direkt — aldrig "vi lägger till säkerhet sen".
6. **Säkerhet sitter i databasen.** Ett frontend-filter är aldrig säkerhet. Om RLS inte skyddar det, är det inte skyddat.
7. **Webhooks är sanningen för pengar.** Betalstatus bekräftas bara av Stripe-webhooks — aldrig av klienten.
8. **Test där det rör pengar och behörighet.** Inte 100 % täckning — men pengaflöde, granskningsbeslut och roller ska ha test.
9. **Hemligheter i miljövariabler.** Aldrig nycklar, tokens eller lösenord i koden eller i git.
10. **Följ planeringen.** Bygg vad modulen i `1-Planering/` säger. Ser du ett problem med planen — flagga det, bygg inte runt det tyst.

---

## 4. Zivars fyra hårda krav — var de hanteras

Du gav fyra konkreta krav. Här är var vart och ett bor i byggplanen:

| Krav | Hanteras i |
|---|---|
| **Databasen byggs med rätt principer** | Fil 01 — Databasplan |
| **Korrekt koppling databas ↔ Stripe** | Fil 02 — Stripe & pengaflöde |
| **BankID verifierar insamlaren** (ditt parallella spår) | Fil 03 — BankID, auth & donationsflöde |
| **Inloggningsfri donation** — "klick, klick, skickat" | Fil 03 — donationsflödet |
| **Insamlat belopp ökar i realtid** när pengarna landar | Fil 03 — realtidsräknaren |
| **Repo upplagt på GitHub, rätt struktur** | Fil 04 — Repo & kodstruktur |

---

## 5. Byggordningen i stort

Bygget följer masterkartans tre bygg-grupper. Detaljerna — varje steg — står i fil **05 Byggsekvens**.

**Bygg-grupp A — "plattformen fungerar och är trygg"**
Fundament (repo, Supabase, Cloudflare Pages) → databas → auth & roller → insamlings-objektet → insamlar-flöde → granskning → Stripe Connect → de tre obligatoriska bevisen.
→ *Resultat:* en insamlare kan skapa, granskas, publicera, ta emot pengar. En donator kan ge. Reglerna håller.

**Bygg-grupp B — "plattformen är trovärdig och levande"**
Donator-flödet fullt ut, realtidsräknaren, transparens-loopen, profiler, discovery, notiser.

**Bygg-grupp C — "plattformen är en värld"**
Katalog, karta, community, events, admin-dashboard.

Exakt vad som *lanseras* när — för riktiga användare — är en egen fråga: **rollout-planen** (kommer som nästa dokument efter den här mappen). Byggordning ≠ lanseringsordning.

---

## 6. Vad Claude Code aldrig gör

- Aldrig hoppa över en migration eller ändra databasen för hand.
- Aldrig publicera en tabell utan RLS.
- Aldrig lita på klienten för betalstatus eller behörighet.
- Aldrig lägga en hemlighet i koden eller i git.
- Aldrig bygga klart ett steg utan att "Klar när"-listan är grön.
- Aldrig blanda in kod i `1-Planering/` eller `2-Byggplan/` — kod bor bara i `5-Kod/`.
- Aldrig avvika från planeringen tyst — flagga först.

---

## 7. Så använder du den här mappen

1. Läs den här filen (00) — du vet nu stacken och reglerna.
2. Läs 01–04 för djupet i databas, Stripe, identitet och repo.
3. Kör **05 Byggsekvens** steg för steg. Varje steg pekar tillbaka till rätt modul i `1-Planering/` för *vad* som ska byggas.
4. Koden växer i `5-Kod/`. Planeringen rörs aldrig.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första byggplanen. Teknikval spikat, byggfilosofi, koppling till de sex filerna. |
