# 03 — BankID, auth & donationsflöde

**Projekt:** Sadaqa Sweden *(arbetsnamn)*
**Datum:** 2026-05-23
**Vad detta är:** Djupdykningen i identitet och det inloggningsfria donationsflödet — den tekniska planen för *hur* Claude Code bygger BankID-verifiering, auth-arkitektur, gästdonation och realtidsräknaren.
**Bygger på:** Fil `00-Byggplan-oversikt.md` (teknikvalet), `Modul-06-Identitet-och-auth.md`, `Modul-04-Donator-flodet.md`, `Modul-07-Transparens-loopen.md`.
**Korsrefererar:** Fil `01-Databasplan.md` (datamodellen — tabeller, RLS), fil `02-Stripe-och-pengaflode.md` (charge, webhook, Connect).

> **Läsordning:** Läs `00` först (stacken), sedan `01` (databasen) och `02` (Stripe). Den här filen förutsätter att du känner dem — den pekar in i dem snarare än att upprepa dem.

---

## 1. BankID-integration — via broker

### 1.1 Varför en broker, inte BankID direkt

BankID går **inte** att integrera direkt utan vidare. Att bli en egen "RP" (Relying Party) hos BankID kräver:

- **Eget avtal med en bank** som återförsäljer BankID-åtkomst (BankID säljer inte direkt till tjänster).
- **Eget RP-certifikat** som måste installeras, roteras och driftas säkert.
- Drift av BankID:s egna API:er, statushantering och felkoder.

För en plattform i Zivars storlek är det fel väg. Lösningen: en **broker** — en tjänst som redan har bankavtalet och certifikatet, och som exponerar BankID som ett vanligt **OIDC-flöde** (OpenID Connect). Exempel: **Criipto**, alternativ finns (t.ex. Signicat, Svensk e-identitet, Phosphor/ZignSec).

> ⚠️ **Antagande — flaggas.** Resten av detta avsnitt utgår från en **OIDC-baserad broker av Criipto-typ**. Det är det vanligaste mönstret och det Claude Code bör bygga mot. **Men de exakta API-namnen, scope-namnen och claim-formaten skiljer sig mellan brokers.** Spika brokern *innan* steg "BankID-integration" körs i byggsekvensen (fil 05). Byt broker = byt OIDC-endpoints och claim-mappning — inte hela arkitekturen.

### 1.2 Vad Zivar själv måste ordna — det parallella spåret

Detta är **Zivars parallella spår**. Byggplanen är skriven så att integrationen *slottar in rent* när spåret är klart — men följande kan Claude Code inte göra. Zivar måste:

| # | Vad Zivar måste ordna | Anteckning |
|---|---|---|
| 1 | **Teckna avtal med en BankID-broker** (Criipto el. likvärdig) | Kräver att föreningen finns som juridisk part. Görs efter föreningsregistreringen. |
| 2 | **Få fram broker-credentials** — `client_id`, `client_secret`, OIDC-issuer-URL, ev. domän-/applikationsregistrering | Läggs i miljövariabler. Aldrig i git (regel 9, fil 00). |
| 3 | **Registrera plattformens redirect-URI:er** hos brokern | En för produktion, en för förhandsvisning/test. |
| 4 | **Bekräfta vilka claims brokern returnerar** — exakt namn på personnummer-, namn- och tidsstämpel-claim | Avgör claim-mappningen i 1.4. Skiljer sig mellan brokers. |
| 5 | **Bekräfta testmiljö** — de flesta brokers har en BankID-testmiljö med test-personnummer | Krävs för att bygga och testa utan riktiga BankID. |

**Tills detta är klart:** Claude Code bygger BankID-lagret mot brokerns **testmiljö** och bakom en tydlig integrationsgräns (se 1.5). Hela resten av plattformen — inklusive gästdonation och realtidsräknaren — kan byggas och testas **utan** att broker-avtalet är på plats.

### 1.3 Verifieringsflödet — steg för steg

Detta är flödet när en **insamlare legitimerar sig**. Det är ett OIDC-inloggningsflöde där "inloggningen" *är* identitetsbeviset.

```
  Insamlaren (inloggad donator) klickar "Verifiera dig med BankID"
        │
        ▼
  [1] Plattformen (Next.js, serverside) startar ett OIDC-flöde:
      redirect till brokerns /authorize med scope för BankID
        │
        ▼
  [2] Brokern visar BankID — QR-kod (desktop) / öppna appen (mobil)
        │
        ▼
  [3] Användaren legitimerar sig i BankID-appen
        │
        ▼
  [4] Brokern verifierar mot BankID, returnerar redirect tillbaka
      till plattformens redirect-URI med en "code"
        │
        ▼
  [5] Plattformen (serverside) växlar in code mot ett id_token
      hos brokern — token innehåller verifierade claims:
        - personnummer (verifierat)
        - namn (verifierat)
        - tidsstämpel
        │
        ▼
  [6] Plattformen validerar id_token (signatur, issuer, nonce, exp)
        │
        ▼
  [7] Identiteten kopplas till insamlarens konto som KYC-bekräftelse
      → skrivs till databasen (se 1.4)
```

**Kritiskt:** steg 5–7 sker **alltid serverside** (Next.js Route Handler / Server Action eller en Supabase Edge Function). `client_secret` och de verifierade claimsen får aldrig nå webbläsaren.

### 1.4 Vad som sparas — och hur det kopplas

Brokern returnerar verifierad identitet. Plattformen sparar **minimalt** (M6 Block 5.5, dataminimering):

| Fält | Sparas? | Var | Not |
|---|---|---|---|
| Verifierat **personnummer** | Ja | Egen tabell, **krypterat i vila** | Känslig uppgift (M6 5.5). Visas aldrig publikt. Åtkomst loggas. |
| Verifierat **namn** | Ja | Kopplat till kontot | Skiljs från publikt visningsnamn (M9). |
| **Tidsstämpel** för verifieringen | Ja | Kopplat till kontot | Bevis på *när* KYC skedde. |
| BankID-lösenord / säkerhetskoder | **Nej, aldrig** | — | Plattformen ser dem aldrig (M6 1.1). |
| Rå `id_token` | Nej | — | Validera, extrahera claims, släng token. |

**Koppling till kontot (KYC-bekräftelse):**

- Den verifierade identiteten skrivs till databasen och markerar kontot som **BankID-verifierat** — Steg 1 av de tre KYC-stegen i M6 Block 3.
- **Dubblettspärr (M6 1.3 + 2.x):** ett personnummer får höra till **ett enda** insamlarkonto. Innan kopplingen skrivs: slå upp om personnumret redan finns. Finns det → blockera, hänvisa till befintligt konto. Detta görs serverside, med en **unik databasconstraint** på personnummer-fältet som sista skydd (definieras i fil 01).
- BankID-verifiering är **Steg 1**. Steg 2 (Stripe-onboarding) och Steg 3 (koppling av `stripe_account_id`) ägs av fil 02. **Hård beroende-flagga (M6 avsnitt 6):** insamlar-onboarding är inte *klar* förrän fil 02:s Stripe-del är klar. BankID-delen är fristående och byggs oberoende.

### 1.5 Integrationsgränsen — så slottar det in rent

Bygg BankID-lagret bakom **en tunn, väldefinierad modul** — t.ex. `lib/bankid/` — med ett litet, stabilt internt gränssnitt:

```
  resten av appen  ──▶  lib/bankid/  ──▶  broker (OIDC)
                         ▲
            byter man broker ändras BARA innehållet i lib/bankid/
            — inget annat i kodbasen rörs
```

Internt gränssnitt (konceptuellt):

- `startVerification(kontoId)` → returnerar URL att skicka användaren till.
- `handleCallback(code, state)` → validerar, returnerar `{ personnummer, namn, tidsstämpel }`.
- Allt broker-specifikt (endpoints, claim-namn, secrets) bor **endast** här.

**Resultat:** Zivars broker-spår och Claude Codes bygge är frikopplade. När avtalet är klart byts testmiljö-credentials mot skarpa i miljövariablerna — ingen kodändring utanför `lib/bankid/`.

### 1.6 Step-up — färsk BankID vid känsliga handlingar

M6 Block 5.1 kräver **step-up-autentisering**: även en redan inloggad användare måste göra en **färsk BankID-verifiering** vid:

- Utbetalning / ändring av bankuppgifter (samordnas med fil 02).
- Tilldelning av roll (granskare/admin).

Samma `lib/bankid/`-modul används — flödet är identiskt med 1.3, men resultatet är inte "skapa KYC" utan "bekräfta att rätt person sitter vid tangentbordet just nu". Resultatet är ett **kortlivat, serverside-lagrat bevis** ("BankID bekräftad inom de senaste N minuterna") som den känsliga handlingen kräver.

---

## 2. Auth-arkitektur

### 2.1 Vad Supabase Auth hanterar — och inte

**Supabase Auth** används för **alla inloggade roller**: donator, insamlare, granskare, förening, admin. Den ger:

- Användarkonton, sessioner, `HttpOnly`-cookies (uppfyller M6 5.1).
- E-post + lösenord-inloggning (lösenord hashas av Supabase — uppfyller M6 5.2).
- Inloggning **via BankID-brokern** kopplas in som en **OIDC-provider** (eller hanteras av `lib/bankid/` som efter verifiering skapar/loggar in Supabase-användaren serverside).

**Supabase Auth används INTE för donatorer som gästdonerar.** En gästdonator har inget konto, ingen session, ingen Auth-post. Se avsnitt 3.

### 2.2 Kärnprincipen — roll får ALDRIG ändras av användaren själv

Detta är M6 Block 5.3 — plattformens fundament. **Sanningen om en användares roll får aldrig ligga någonstans användaren kan ändra.**

Konkret förbjudet: roll i en cookie, i `localStorage`, i ett dolt formulärfält, i en URL-parameter, eller i en klient-token användaren kan redigera.

### 2.3 Var rollen lagras — rekommendation och motivering

Två kandidater diskuterades:

| Alternativ | Beskrivning | Bedömning |
|---|---|---|
| **A — Roll i `app_metadata`** | Supabase Auth har `app_metadata` på användaren. Till skillnad från `user_metadata` kan den **inte** ändras av användaren — bara av service-role-nyckeln serverside. | Säkert, men: åtkomstkontroll och logg blir spridd, och föreningskonton/jävsregel (flera relationer per konto) blir trångt i ett enkelt metadata-fält. |
| **B — Egen `roller`-tabell skyddad av RLS** | En separat tabell i Postgres: rad per (konto, roll). Skrivs **endast** via service-role / admin-flöde. RLS gör tabellen **läsbar men aldrig skrivbar** för användaren själv. | Ger en riktig datamodell: jävsregel, kontofrysning, oföränderlig logg, flera firmatecknare per förening — allt får plats. |

**Rekommendation: Alternativ B — egen `roller`-tabell, skyddad av RLS.** Den ägs och definieras i fil `01-Databasplan.md`.

**Motivering:**

- **RLS från dag 1** (regel 5, fil 00): en egen tabell får RLS direkt — `SELECT` tillåts för eget konto, `INSERT`/`UPDATE`/`DELETE` tillåts **aldrig** för vanlig användare, bara via service-role i ett admin-flöde.
- **Säkerheten sitter i databasen** (regel 6): roll-uppslag är en vanlig fråga mot en RLS-skyddad tabell — inte ett frontend-filter.
- **M6 kräver mer än en etikett:** jävsregeln (granskare ≠ granska egen insamling, M6 2.4/4.3), kontofrysning (M6 4.4), oföränderlig roll-logg (M6 5.4) och flera firmatecknare per föreningskonto (M6 öppen fråga 4) kräver riktiga rader och relationer. Ett platt metadata-fält räcker inte.
- **Spårbarhet:** varje rolländring loggas i en **append-only**-tabell (M6 5.4) — naturligt bredvid `roller`-tabellen.

> **Praktiskt tillägg (kan kombineras):** rollen *får* speglas in i sessionens JWT-claims (via en Supabase Auth Hook) **enbart** som bekvämlighet för snabb UI-rendering. Speglingen sätts serverside och kan inte ändras av användaren. **Men sanningskällan är alltid `roller`-tabellen** — och varje känslig handling slår upp den på nytt (2.4). JWT-claimen är ett skyltfönster, tabellen är valvet.

### 2.4 Behörighet slås upp serverside vid varje känslig handling

M6 Block 5.3: **klienten är ett skyltfönster, servern är valvet.**

- Klienten får visa/dölja knappar efter roll — **bara för bekvämlighet**.
- Vid varje känslig handling (godkänn insamling, betala ut, tilldela roll, pausa, stäng ner) frågar servern databasen på nytt: *vad är den här användarens roll, just nu?*
- Uppslaget sker i en Server Action / Route Handler / Edge Function — **aldrig** i klientkod.
- Behörighetsmatrisen (M6 Block 4.2) är facit. Stämmer roll + objektägarskap ("egen"-regeln) inte → handlingen avvisas, oavsett vad klienten skickade.
- **Dubbelt skydd:** även om ett serverside-uppslag skulle missas, fångar **RLS** i Postgres försöket — en användare utan rätt roll kan inte skriva raden. Servern *och* databasen håller.

```
  Klient: "godkänn insamling X"   (knappen syntes — bekvämlighet)
        │
        ▼
  Server Action (serverside):
     1. Vem är användaren?  → från sessionen (konto-ID, ej roll)
     2. Vilken roll?        → SELECT mot roller-tabellen, NU
     3. Får rollen detta?   → behörighetsmatris M6 4.2
     4. Rätt objekt?        → "egen"-regel där den gäller
        │
   nej  ├────────────▶  avvisas (403)
   ja   ▼
     handlingen utförs — och RLS i Postgres är sista nätet
```

---

## 3. Det inloggningsfria donationsflödet

### 3.1 Zivars krav — "klick, klick, skickat"

En donator ska kunna ge **utan konto, utan inloggning, utan friktion**. Detta är M4 Block 3.3 och ett av Zivars fyra hårda krav (fil 00, avsnitt 4). **Inloggning ska aldrig krävas för att donera.**

### 3.2 UX-flödet — exakt

```
  [Publik insamlingssida — ingen inloggning, indexerbar av Google]
        │
        │  Donatorn klickar  ►  "Ge en gåva"
        ▼
  [Donationsögonblicket — M4 Block 1]
     • Belopp ELLER enheter, snabbval 100/300/500/1000, fri summa (min 20 kr)
        │
        ▼
  [Donatorns val — M4 Block 2, alla med defaults]
     • Undermål-val (default "Ge ändå")
     • Anonymitet (default: anonym för gäst)
     • Ev. dua/meddelande
        │
        ▼
  [Betalning — M4 Block 3]
     • Stripe Payment Element, INBÄDDAT på sidan
     • Kort, Apple Pay / Google Pay, ev. Swish
     • ETT fält donatorn själv fyller i: e-post (för kvittot)
        │
        ▼
  [Bekräftelse — M4 Block 4]
     • "Din gåva är mottagen. Jazak Allahu khayran."
     • Kvitto skickas till e-posten automatiskt
     • Mjuk, ignorerbar inbjudan: "Vill du följa insamlingen? Skapa konto."
```

**Ingen Supabase Auth aktiveras någonstans i denna kedja.** Gästen får aldrig en session, aldrig ett lösenordsfält, aldrig en "skapa konto"-vägg. Den enda uppgiften gästen lämnar är **e-postadressen** — och den krävs bara för att kvittot (och en eventuell refund-avisering) ska kunna nå fram (M4 3.3).

### 3.3 Teknikflödet

| Steg | Vad sker | Var |
|---|---|---|
| 1 | Donatorn väljer belopp + val | Klient (publik sida, ingen auth) |
| 2 | Klienten ber servern skapa en betalning | Server Action / Route Handler |
| 3 | Servern skapar en **Stripe PaymentIntent** och returnerar dess `client_secret` | Serverside — **detaljerna ägs av fil 02** |
| 4 | **Stripe Payment Element** renderas inbäddat med `client_secret` | Klient |
| 5 | Donatorn betalar (kort / Apple Pay / Google Pay / ev. Swish) — kortdata når **bara Stripe** | Stripe |
| 6 | Betalningen bekräftas → Stripe-webhook (avsnitt 4) | Edge Function |
| 7 | Kvitto skickas via **Resend** till gästens e-post | Serverside, automatiskt |

**Inbäddat, inte hostad sida:** M4 öppen fråga 2 lät M5 spika hostad sida vs inbäddad komponent. Byggplanen rekommenderar **Stripe Payment Element inbäddat** — donatorn lämnar aldrig insamlingssidan, "en obruten, lugn yta" (M4 3.2). Den slutliga Stripe-konfigurationen bekräftas i **fil 02**.

> **Swish-flagga.** M4 gör Swish obligatoriskt. Swish via Stripe i Sverige måste bekräftas mot Stripes aktuella metodstöd — **ägs av fil 02**. Apple/Google Pay går via samma Payment Element nästan utan extra arbete (M4 öppen fråga 1).

### 3.4 Gästen identifieras bara av e-post

- Gästdonationen sparas med **e-postadressen som nyckel** — ingen `user_id`, ingen Auth-koppling.
- E-posten gör tre saker: (1) tar emot kvittot, (2) möjliggör refund-avisering, (3) gör framtida koppling till ett konto möjlig.
- **Gäst → konto i efterhand (M4 3.3, M6 2.2):** skapar gästen senare ett konto med **samma e-post**, kan tidigare gästgåvor knytas dit. M4/M6 äger kopplingsmekaniken; byggplanens krav: donationsraden **måste** bära e-posten så att kopplingen är *möjlig*. Datamodellen för detta ägs av **fil 01**.
- Enkel formatvalidering på e-postfältet, och e-posten visas i bekräftelsen så gästen kan upptäcka en felstavning (M4 3.3 kantfall).

---

## 4. Realtidsräknaren

Zivars fjärde hårda krav: **insamlat belopp ökar i realtid** när pengarna landar. M7 ger kontexten — progress bar och "tack vare dig och 142 andra" (M4 4.1) — som lever på denna mekanism.

### 4.1 Hela kedjan

```
  [1] Donatorn betalar — Stripe Payment Element
        │
        ▼
  [2] Stripe behandlar betalningen och skickar en WEBHOOK
      till plattformen  →  payment_intent.succeeded
        │  (webhooken är SANNINGEN för pengar — regel 7, fil 00.
        │   Klienten "tror" aldrig att en betalning lyckades.)
        ▼
  [3] Supabase Edge Function tar emot webhooken:
        - verifierar Stripes webhook-signatur   ◄── KRITISKT
        - läser ut belopp + vilken insamling (metadata)
        - skriver donationsraden + uppdaterar insamlingens
          insamlade belopp i databasen
        │   (HUR detta görs korrekt — idempotens, koppling
        │    donation↔insamling↔Stripe — ägs av fil 02)
        ▼
  [4] Databasraden för insamlingen ändras
      (insamlat_belopp ökar)
        │
        ▼
  [5] Supabase REALTIME upptäcker ändringen på raden
      och sänder ut den till alla anslutna klienter
        │
        ▼
  [6] Varje webbläsare som tittar på insamlingssidan
      prenumererar på den raden  →  räknaren tickar upp LIVE
      hos alla samtidiga besökare
```

### 4.2 Detaljer som gör den korrekt

- **Webhooken är enda sanningen.** Räknaren uppdateras *aldrig* för att klienten tror att betalningen gick igenom (regel 7, fil 00). Bara `payment_intent.succeeded`, verifierad signatur, höjer beloppet.
- **Webhook-signatur verifieras alltid** i Edge Function — annars kan vem som helst förfalska "en betalning kom in". Hemligheten ligger i miljövariabel (regel 9).
- **Idempotens:** Stripe kan leverera samma webhook flera gånger. Edge Function måste hantera dubblett-leverans så beloppet inte räknas två gånger. **Mekaniken ägs av fil 02.**
- **Realtime på rätt nivå:** klienten prenumererar på insamlingens rad (eller en aggregerad vy/räknartabell). RLS måste tillåta `SELECT` på det publika beloppet — det *är* publik data. Inga känsliga fält sänds via Realtime-kanalen.
- **Robusthet:** tappar en klient sin Realtime-anslutning ska sidan hämta beloppet på nytt vid återanslutning, så räknaren aldrig "fastnar" på ett gammalt tal.
- **Ingen auth krävs för att se räknaren** — den publika insamlingssidan är fullt läsbar utan konto (M6 Block 2, besökare).

> **Korsreferens:** Stripe-sidan av kedjan — PaymentIntent, metadata, webhook-uppsättning, idempotens, kopplingen donation ↔ insamling ↔ Stripe-konto — beskrivs i sin helhet i **fil `02-Stripe-och-pengaflode.md`**. Den här filen äger Realtime-utsändningen (steg 5–6); fil 02 äger pengasanningen (steg 2–4).

---

## 5. Säkerhet

### 5.1 Gränsen donator ↔ insamlare

Den medvetna asymmetrin i M6 Block 1.2 — **hårt krav där pengar lämnar, lätt väg där pengar kommer in.**

| | **Donator (gäst)** | **Insamlare** |
|---|---|---|
| Konto | Nej | Ja (Supabase Auth) |
| Inloggning | Aldrig — för att donera | Ja |
| BankID | Nej | **Ja — obligatoriskt (KYC Steg 1)** |
| Verifierad identitet | Nej (bara e-post) | Ja — verifierat personnummer |
| Pengarna rör sig | *in* till en insamling | *ut* till insamlaren |
| Risk | Låg — ger sina egna pengar | Hög — tar emot andras pengar |

Logiken: risken sitter hos den som **tar ut** pengar. Därför KYC på insamlaren, öppen dörr för donatorn. Att kräva BankID av varje givare vore att bygga en mur där research säger öppen dörr (M4 3.3, M6 1.2).

### 5.2 Sessioner (M6 Block 5.1)

- Inloggade roller får en **serverside-session**; webbläsaren håller bara en `HttpOnly`-cookie — oläsbar för JavaScript.
- **Sessionen innehåller vem, inte vad.** Konto-ID, aldrig rollen. Rollen slås upp serverside (2.4).
- **Rullande utgång:** donator/besökare — längre, bekväm. Granskare/admin — kortare, oftare omverifiering (mest makt). Exakt livslängd är ett driftbeslut (M6 öppen fråga 5).
- **Step-up:** pengar, roller, bankuppgifter kräver färsk BankID även för inloggad användare (1.6).
- Utloggning dödar sessionen serverside direkt; admin kan tvångslogga-ut alla sessioner på ett konto.

### 5.3 Roller serverside — sammanfattning

Allt i avsnitt 2 gäller: roll i RLS-skyddad tabell, aldrig hos klienten; uppslag vid varje känslig handling; RLS som sista nät; rolländringar i append-only-logg (M6 5.4). **Detta är fundamentet — om det viker, viker hela plattformen.**

### 5.4 Övriga gränser

- **Kortdata når aldrig plattformen** — bara Stripe (PCI-ansvaret ligger rätt; M4 avsnitt 7).
- **Personnummer** krypterat i vila, åtkomst loggad, aldrig publikt, aldrig via Realtime eller URL (M6 5.5).
- **Hemligheter** (broker-secret, Stripe-nycklar, webhook-secret) bara i miljövariabler, aldrig i git (regel 9, fil 00).
- **Ett personnummer = ett insamlarkonto** — unik databasconstraint (1.4).

---

## 6. Beslut & öppna frågor

### 6.1 Beslut spikade i denna fil

| # | Beslut | Motivering |
|---|---|---|
| 1 | BankID via **broker** (Criipto-typ, OIDC) — inte direkt | Direkt-integration kräver bankavtal + eget certifikat. Brokern tar komplexiteten. |
| 2 | BankID-lagret byggs bakom en **tunn integrationsgräns** (`lib/bankid/`) | Byte av broker rör då bara den modulen. Zivars broker-spår och bygget frikopplas. |
| 3 | Roll lagras i en **egen `roller`-tabell skyddad av RLS** (Alt. B) | Ger plats för jävsregel, frysning, logg, flera firmatecknare. RLS gör den oskrivbar för användaren. M6 5.3. |
| 4 | Roll får speglas i JWT-claims **enbart för UI-bekvämlighet** — sanningskällan är tabellen | Snabb rendering utan att klienten blir betrodd. Uppslag sker ändå serverside vid varje känslig handling. |
| 5 | Donationsflödet använder **ingen Supabase Auth** — gästen identifieras bara av e-post | "Klick, klick, skickat". Inloggning ska aldrig krävas för att donera (M4 3.3). |
| 6 | **Stripe Payment Element inbäddat** (rekommendation) | Donatorn lämnar aldrig insamlingssidan — obruten yta. Slutlig Stripe-config bekräftas i fil 02. |
| 7 | Realtidsräknaren = **Stripe-webhook → DB-skrivning → Supabase Realtime** | Webhooken är enda pengasanningen (regel 7). Realtime ger live-räknaren ur lådan. |

### 6.2 Öppna frågor — kräver beslut/åtgärd

| # | Fråga | Ägare / nästa steg |
|---|---|---|
| 1 | **Vilken broker?** Criipto vs Signicat vs annan — pris, testmiljö, claim-format | Zivar väljer **innan** BankID-steget i fil 05 körs |
| 2 | **Broker-avtal + credentials** — Zivars parallella spår (1.2) | Zivar — kräver registrerad förening först |
| 3 | **Exakt claim-mappning** — brokerns namn på personnummer/namn/tidsstämpel | Bekräftas mot vald broker innan claim-mappningen i 1.4 byggs |
| 4 | **Swish via Stripe** — stöds det för svensk marknad i Stripes aktuella utbud? | Ägs av **fil 02** |
| 5 | **Apple/Google Pay i v1** | "Trolig lätt på" via Payment Element — bekräftas i fil 02 (M4 öppen fråga 1) |
| 6 | **Session-livslängd per roll** — exakta tider | Driftbeslut, sätts vid bygge (M6 öppen fråga 5) |
| 7 | **Minst två admins från dag 1** | Rekommenderat (M6 öppen fråga 2) — Zivar bekräftar |
| 8 | **Hostad Stripe-sida vs inbäddad** — denna fil rekommenderar inbäddad; slutligt beslut i fil 02 | Fil 02 (M4 öppen fråga 2) |

### 6.3 Hårda beroenden

- **Insamlar-onboarding är inte klar förrän fil 02 (Stripe-onboarding) är klar.** BankID-delen (Steg 1) är fristående och byggs oberoende. (M6 avsnitt 6.)
- **Realtidsräknarens steg 2–4** (PaymentIntent, webhook, idempotens, koppling) ägs av **fil 02**. Denna fil äger Realtime-utsändningen (steg 5–6).
- **`roller`-tabellen och donationsradens datamodell** definieras i **fil `01-Databasplan.md`** — denna fil specificerar *kraven* på dem.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första versionen. BankID via broker (integrationsgräns + Zivars parallella spår), auth-arkitektur (roll i RLS-skyddad tabell), inloggningsfritt donationsflöde, realtidsräknaren, säkerhetsgränser. Korsrefererar fil 00, 01, 02 och M4/M6/M7. |
