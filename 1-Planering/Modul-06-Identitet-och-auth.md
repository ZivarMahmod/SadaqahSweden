# Modul 6 — Identitet & auth

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`

---

## 1. Vad modulen är

Modul 6 svarar på två frågor: **vem är vem**, och **vem får göra vad**.

Den definierar inloggning, kontotyper, KYC (identitetskontroll) för den som vill samla in pengar, rollerna på plattformen och den behörighetsmatris som styr varje knapp i hela systemet.

**Den löser:** alla andra moduler frågar M6 "får den här personen göra det här?". Är svaret otydligt blir hela plattformen otrygg. M6 är portvakten — den gör svaret skarpt.

---

## 2. Varför den behövs

En insamlingsplattform flyttar **andra människors pengar**. Då måste tre saker vara sanna:

- Vi vet **vem** som samlar in (annars är bedrägeri gratis).
- Vi vet **vad** varje person får göra (annars kan vem som helst godkänna sin egen insamling).
- Sanningen om vem och vad **kan inte ändras av användaren själv** (annars är hela skyddet teater).

Research sa det rakt: BetterNows styrka är att varje insamling hänger på en verifierad identitet. GoFundMes svaghet är hål i just det. M6 är vårt svar — KYC på den som samlar in, men utan att låsa ute privatpersoner.

M6 är också **principen "muslimsk är målgrupp, inte mur" i teknisk form**: vi verifierar *identitet*, inte *tro*. Granskningen sitter på projektet (M3), inte på personen.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Inloggning — hur man kommer in (BankID, e-post) | ✅ Spikad |
| 2 | Konton & kontotyper — de sex typerna av användare | ✅ Spikad |
| 3 | KYC för insamlare — vad som krävs för att få samla in | ✅ Spikad |
| 4 | Roller & behörigheter — behörighetsmatrisen | ✅ Spikad |
| 5 | Säkerhet & dataskydd — sessioner, hur roll lagras säkert | ✅ Spikad |

När alla fem är klara vet vi exakt vem som finns på plattformen och vad var och en får göra.

---

# BLOCK 1 — Inloggning

Hur en människa kommer in på plattformen. **Två metoder, olika krav beroende på vad du ska göra.**

## 1.1 BankID — för insamlare

**Vad det är:** svensk e-legitimation. Den enda metoden som verifierar att en person *är* den hen säger.

**Specifikation:**
- **BankID är obligatoriskt för att bli insamlare.** Du kan inte samla in pengar utan att ha legitimerat dig med BankID.
- BankID levererar: **verifierat personnummer, verifierat namn**. Det är grunden för KYC (Block 3).
- Inloggning sker via BankID-appen — QR-kod på desktop, öppna-appen på mobil.
- Plattformen lagrar **inte** BankID-lösenord eller säkerhetskoder. Vi får bara verifieringssvaret (namn, personnummer, tidsstämpel) från BankID-leverantören.

**Varför BankID som primär metod för insamlare:**
- **Svensk verklighet.** I Sverige *är* BankID identitet. Folk litar på det, alla har det, ingen tycker det är konstigt.
- **KYC blir gratis och vattentät.** Vi behöver inte bygga eget pass-/körkortsflöde. BankID *är* KYC.
- **Bedrägeriskydd.** En fejk-insamlare kan inte gömma sig — bakom varje insamling finns ett verifierat personnummer. Det avskräcker innan det ens händer.
- **Princip 13 — samordna befintlig godhet.** BankID har redan löst identitet i Sverige. Vi bygger inte om hjulet.

## 1.2 E-post + lösenord ELLER BankID — för donatorer och besökare

**Vad det är:** den lätta vägen in för den som bara vill ge eller titta.

**Specifikation:**
- **Donator/besökare väljer själv:** e-post + lösenord, *eller* BankID.
- **E-post + lösenord:** klassiskt. Lösenord lagras hashat (Block 5). E-postverifiering via länk innan kontot är aktivt.
- **BankID även här** för den som vill — då slipper donatorn skapa ännu ett lösenord, och kontot blir automatiskt identitetsverifierat.
- **Gästdonation kräver ingen inloggning alls** — se Block 2. Donatorn anger bara e-post för kvittot.

**Varför inte BankID-tvång för donatorer:**
- **Friktion vid donation är gift.** Research (GoFundMe): noll friktion att ge är heligt. Tvinga BankID på en 100-kronorsdonation → folk hoppar av.
- Donatorn flyttar *sina egna* pengar *till* plattformen. Risken ligger inte där. Insamlaren flyttar pengar *ut* — där behövs verifieringen.
- **Asymmetrin är medveten:** hårt krav där pengar lämnar (insamlare), lätt väg där pengar kommer in (donator).

## 1.3 Kantfall

- **Person utan BankID vill bli insamlare:** kan inte i v1. Hårt krav. Att bygga ett alternativt ID-flöde (pass/körkort + manuell granskning) är möjligt senare men är en helt egen, dyr funktion — parkeras (öppen fråga 1).
- **Donator har redan ett besökarkonto och vill bli insamlare:** kontot *uppgraderas* — samma konto, BankID läggs till, kontotyp byter (Block 2). Ingen ny inloggning skapas.
- **BankID-tjänsten nere:** insamlar-onboarding pausar tills den är uppe igen. Donationer via e-post/gäst fungerar fortfarande — plattformen står inte still.
- **Två konton, samma person:** ett personnummer kan bara höra till **ett** insamlarkonto. Försök att BankID-verifiera ett andra konto med samma personnummer → blockeras, hänvisas till det befintliga.

---

# BLOCK 2 — Konton & kontotyper

Plattformen har **sex kontotyper**. En kontotyp är *vad användaren är*. Rollen (Block 4) är *vad användaren får göra* — de hänger ihop men är inte samma sak.

## 2.1 De sex typerna

| Typ | Inloggad? | Identitetsverifierad? | Vad det är |
|---|---|---|---|
| **Besökare** | Nej | Nej | Vem som helst som surfar in. Kan läsa, bläddra, söka. Kan gästdonera. |
| **Donator** | Ja | Frivilligt (BankID om vald) | Har konto. Ger, sparar kvitton, följer insamlingar, ser sin gåvohistorik. |
| **Insamlare** | Ja | **Ja — BankID, obligatoriskt** | Får skapa och driva insamlingar. Genomgått KYC (Block 3). |
| **Förening** | Ja | Ja — via firmatecknare med BankID | Föreningskonto. Driver insamlingar i föreningens namn. Listas i katalogen (M10). |
| **Granskare** | Ja | Ja — BankID + manuellt tilldelad | Bedömer insamlingar mot islamiska principer (M3). Du + dina två bröder. |
| **Admin** | Ja | Ja — BankID + manuellt tilldelad | Driftansvar. Full översikt, kantfallshantering, kan stänga ner. |

## 2.2 Typerna i detalj

**Besökare.** Ingen inloggning. Plattformen ska vara *fullt läsbar* utan konto — varje krav på registrering för att bara titta är friktion. Besökaren kan **gästdonera**: ge utan konto, anger bara e-post för kvitto (donationsdetaljer spikas i M4). En besökare som gästdonerar och senare skapar konto med samma e-post → tidigare gästgåvor kan knytas till kontot.

**Donator.** Ett inloggat konto, lätt att skapa (e-post eller BankID). Donatorn får: gåvohistorik, sparade kvitton, möjlighet att följa insamlingar, notiser (M15), en publik profil (M9 — donatorn väljer själv vad som visas). En donator har **inte** rätt att skapa insamlingar — det kräver uppgradering till insamlare.

**Insamlare.** En donator + BankID-verifiering + genomförd KYC (Block 3) = insamlare. **Insamlare = vem som helst.** Det finns *inget* krav på att vara muslim för att bli insamlare. Det är medvetet och spikat:
- Granskningen sitter på **projektet** (gör insamlingen krockar med islam?), inte på personen.
- Princip 12: muslimsk är målgrupp, inte mur.
- Att kräva trosbevis vore omöjligt att verifiera *och* fel — en icke-muslim som vill samla in till en brunn ska få göra det.

**Förening.** Ett föreningskonto representerar en **ideell förening eller moské** (M10 hanterar katalog och självregistrering). Föreningskontot ägs av en eller flera fysiska personer (firmatecknare) som loggar in med sitt eget BankID och *agerar för* föreningen. Föreningskontots KYC bygger på: organisationsnummer + firmatecknarens BankID-verifierade identitet. Detaljerna kring föreningskonton, behörighet för flera personer på samma föreningskonto och katalogregistrering **ägs av M10** — M6 levererar bara identitetsgrunden (firmatecknaren *är* verifierad).

**Granskare.** En förtroenderoll. Tilldelas **manuellt av admin** — man kan inte ansöka om att bli granskare via ett formulär. Granskaren måste vara BankID-verifierad. I praktiken: Zivar + två bröder vid start. Granskar-flödet (kö, beslut, SLA) ägs av M3 — M6 levererar bara behörigheten.

**Admin.** Maskinrummets nyckel. Tilldelas manuellt, ytterst få personer (vid start: Zivar). BankID-verifierad. Admin kan göra allt en granskare kan + driftåtgärder (Block 4). Admin är den enda rollen som kan tilldela andra roller.

## 2.3 Hur en kontotyp byter

```
Besökare ──(skapar konto)──▶ Donator ──(BankID + KYC)──▶ Insamlare
                                  │
                                  └──(admin tilldelar)──▶ Granskare / Admin

Förening = eget spår: skapas via M10:s självregistrering,
           firmatecknarens BankID kopplar in identiteten från M6.
```

**En person, ett konto.** Vi skapar inte separata konton för "Ahmed donator" och "Ahmed insamlare". Det är *samma konto* som får fler behörigheter. Det håller historiken samlad och profilen (M9) ärlig.

## 2.4 Kantfall

- **Granskare vill driva en egen insamling:** tillåtet — granskaren är också en person. **Men** en granskare får aldrig granska sin egen insamling. Jävsregeln spikas i M3; M6:s ansvar är att behörighetssystemet *kan* uttrycka "den här insamlingen får inte tilldelas den här granskaren".
- **Admin vill donera:** självklart tillåtet, admin är också en människa.
- **Konto raderas:** se Block 5 + GDPR i M8. En insamlare med pågående insamling kan inte radera kontot mitt i — historiken och pengaansvaret måste bestå.

---

# BLOCK 3 — KYC för insamlare

KYC = "Know Your Customer". Här: **exakt vad som krävs för att en person ska få samla in pengar.** Det är plattformens viktigaste bedrägerispärr.

## 3.1 De tre stegen till insamlare

För att gå från donator till insamlare krävs **tre saker, i ordning:**

**Steg 1 — BankID-verifierad identitet.**
- Personen legitimerar sig med BankID.
- Plattformen får och lagrar: verifierat namn, verifierat personnummer, tidsstämpel för verifieringen.
- Detta är grunden. Utan ett verifierat personnummer finns ingen insamlare.

**Steg 2 — Stripe-onboarding (KYC hos Stripe).**
- Insamlaren kopplas till ett **Stripe-anslutet konto** (Stripe Connect — ägs av M5).
- Stripe kör sin **egen** KYC: identitet, kontouppgifter, ev. ytterligare kontroller enligt finansregelverk.
- Plattformen *äger inte* detta steg — Stripe gör det. **Princip 13: samordna befintlig godhet.** Stripe har betaltillståndet och den juridiska KYC-skyldigheten. Vi lutar oss på den.
- Insamlaren kan inte ta emot en enda krona förrän Stripe-onboarding är **klar och godkänd**.

**Steg 3 — Koppling till plattformskontot.**
- Det BankID-verifierade kontot (Steg 1) och det Stripe-anslutna kontot (Steg 2) **låses ihop**.
- Plattformen sparar en `stripe_account_id` på insamlarkontot.
- Först nu är personen en fullvärdig insamlare och kan skicka in en insamling till granskning (M3).

```
Donator
  │ Steg 1: BankID-verifiering → personnr + namn
  ▼
BankID-verifierad
  │ Steg 2: Stripe-onboarding → Stripe kör sin KYC
  ▼
Stripe-godkänd
  │ Steg 3: konto + Stripe-konto låses ihop
  ▼
Insamlare ✓ (får skapa insamlingar)
```

## 3.2 Vad KYC INTE kräver

Lika viktigt att säga rakt:

- **Inget krav på att vara muslim.** Insamlare = vem som helst. Granskningen sitter på projektet (M3), inte personen. Detta är spikat (Block 2, princip 12).
- **Inget krav på medlemskap i en förening.** Privatpersoner får samla in. (BetterNow låser detta — vi gör inte. Hybridmodellen: KYC på privatpersonen i stället.)
- **Inget krav på trosintervju, rekommendationsbrev eller liknande.** Det vore omöjligt att verifiera och fel mot principen.

## 3.3 Varför två KYC-lager (BankID + Stripe)

De gör **olika** jobb och båda behövs:

| Lager | Svarar på | Ägs av |
|---|---|---|
| BankID | "Är du en verklig, identifierbar person i Sverige?" | M6 |
| Stripe-onboarding | "Får du juridiskt ta emot pengar, och vart går de?" | M5 / Stripe |

BankID ger oss en *namngiven, spårbar* person. Stripe ger oss en *betalningsmottagare som klarar finansregelverket*. En insamlare måste vara båda.

## 3.4 Kantfall

- **BankID godkänt men Stripe-onboarding fastnar** (Stripe begär komplettering): kontot är "insamlare påbörjad" men kan inte publicera. Insamlaren ser tydligt vad Stripe väntar på. Plattformen kan inte lösa det — Stripe äger det — men M2:s UI guidar.
- **Stripe avvisar onboarding helt:** personen blir inte insamlare. Sällsynt; admin kan kontaktas men kan inte överrida Stripe.
- **Insamlarens personnummer dyker upp i en bedrägeriutredning:** admin kan **frysa** insamlarrollen (Block 4) — kontot finns kvar, men kan inte skapa nya insamlingar. Beslutsregler för detta bor i M8.
- **Insamlaren byter bank/kontonummer:** hanteras i Stripe (M5). M6 påverkas inte — identiteten är samma personnummer.

---

# BLOCK 4 — Roller & behörigheter

**Vem får göra vad.** Det här är behörighetsmatrisen — plattformens mest centrala tabell. Varje knapp i hela systemet kollar mot den.

## 4.1 De fem rollerna (besökare är "ingen roll")

| Roll | Kort beskrivning |
|---|---|
| **Besökare** | Ej inloggad. Läser och gästdonerar. |
| **Donator** | Inloggad. Ger, följer, sparar kvitton. |
| **Insamlare** | Donator + BankID + Stripe-KYC. Skapar och driver insamlingar. |
| **Förening** | Som insamlare, men i föreningens namn. Listas i katalog (M10). |
| **Granskare** | Bedömer insamlingar mot islamiska principer. |
| **Admin** | Drift, kantfall, kan stänga ner. Tilldelar roller. |

## 4.2 Behörighetsmatris

✅ = får · ❌ = får inte · ➖ = ej tillämpligt · *(egen)* = bara på sitt eget objekt

| Handling | Besökare | Donator | Insamlare | Förening | Granskare | Admin |
|---|---|---|---|---|---|---|
| Läsa publika insamlingar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Söka & filtrera (M11) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gästdonera | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Donera inloggad / spara kvitto | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Följa insamling / få notiser (M15) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kommentera / ge dua (M13) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Skapa insamling (utkast)** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Skicka insamling till granskning** | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ✅ *(egen)* | ✅ |
| Redigera insamling — fritt fält | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ✅ *(egen)* | ✅ |
| Redigera insamling — låst/löftesfält | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Posta uppdatering / ladda upp bevis (M7) | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ➖ | ✅ |
| Förlänga deadline (kort, auto) | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ➖ | ✅ |
| Begära målhöjning / lång förlängning | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ➖ | ✅ |
| **Granska — godkänna / avvisa / begära ändring** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ändra kategori/plats på insamling | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Pausa en insamling** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Stänga ner en insamling (nedstängd)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Avbryta sin egen insamling | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ➖ | ✅ |
| **Utlösa / hantera utbetalning (M5)** | ❌ | ❌ | ✅ *(egen, bekräfta)* | ✅ *(egen, bekräfta)* | ❌ | ✅ |
| **Utlösa refund** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Granska sin egen insamling | ➖ | ➖ | ❌ | ❌ | **❌ (jäv)** | ❌ |
| Se all data inkl. icke-publika fält | ❌ | ❌ | ✅ *(egen)* | ✅ *(egen)* | ✅ | ✅ |
| Tilldela roller (granskare/admin) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Frysa ett insamlarkonto | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Se admin-dashboard & statistik (M16) | ❌ | ❌ | ❌ | ❌ | Delvis | ✅ |
| Hantera GDPR-begäran (M8) | ❌ | ❌ | ➖ | ➖ | ❌ | ✅ |

## 4.3 De viktigaste reglerna ur matrisen

- **Bara granskare och admin godkänner.** En insamlare kan aldrig publicera sig själv — det finns ingen sådan knapp. Princip 7: granska före publicering, alltid.
- **Bara admin stänger ner permanent.** `nedstängd` (M1 Block 3) är ett tungt beslut — det reserveras för admin. Granskaren kan *pausa* (mjukt, reversibelt); admin *stänger ner* (hårt).
- **Bara admin tilldelar roller.** Ingen kan göra sig själv till granskare. Förtroenderoller delas ut av en människa, uppifrån.
- **Jävsregeln är inbyggd.** En granskare som också är insamlare får aldrig granska sin egen insamling — systemet vägrar tilldelningen. (Tilldelningslogiken bor i M3; M6 garanterar att behörighetssystemet *kan* uttrycka regeln.)
- **"Egen"-begränsningen är genomgående.** En insamlare kan redigera, förlänga, posta bevis och bekräfta utbetalning — men **bara på sina egna insamlingar**. Aldrig på någon annans.
- **Utbetalning: insamlaren *bekräftar*, systemet/Stripe *verkställer*.** Insamlaren trycker inte på en "betala ut till mig"-knapp som flyttar pengar fritt — utbetalning följer M5:s regler och insamlingens livscykel (M1 Block 3).

## 4.4 Kantfall

- **Roll fryst:** en fryst insamlare behåller läs- och donatorrättigheter men tappar alla insamlar-rader i matrisen tills frysningen hävs.
- **Granskare avgår:** admin tar bort granskarrollen. Personens konto blir åter donator/insamlare. Hens tidigare granskningsbeslut står kvar (loggade, M3).
- **Ensam admin blir otillgänglig:** verklig risk — om Zivar är enda admin och blir sjuk står driften still. **Rekommendation:** minst två admins från dag ett (öppen fråga 2).

---

# BLOCK 5 — Säkerhet & dataskydd

Hur identitet och behörighet hålls **säkert**. Kärnregeln: **användaren får aldrig kunna ändra sanningen om sin egen roll.**

## 5.1 Sessioner

**Vad en session är:** beviset på att "den här webbläsaren tillhör en inloggad person" mellan sidladdningar.

- Efter lyckad inloggning skapas en **session-token**, lagrad serverside. Webbläsaren håller bara en referens (säker, `HttpOnly`-cookie — kan inte läsas av JavaScript).
- **Sessionen innehåller inte rollen.** Den innehåller bara *vem* användaren är (konto-ID). *Vad* användaren får göra slås upp serverside vid varje känslig handling. Se 5.3 — detta är hela poängen.
- **Livslängd:** rullande utgång. Donator/besökare — längre, bekväm session. Granskare/admin — kortare, kräver omverifiering oftare (de har mest makt).
- **Utloggning** dödar sessionen serverside direkt. En stulen cookie blir värdelös.
- **Känsliga handlingar kräver färsk verifiering.** Att betala ut pengar, ändra bankuppgifter eller tilldela en roll → BankID-omverifiering även om man redan är inloggad. (Step-up-autentisering.)

## 5.2 Lösenord (för e-postkonton)

- Lösenord lagras **aldrig i klartext** — endast som en stark, saltad hash (t.ex. argon2/bcrypt).
- Krav på rimlig längd; vanliga svaga lösenord blockeras.
- Lösenordsåterställning via tidsbegränsad engångslänk till verifierad e-post.
- BankID-konton har inget lösenord alls — en attackyta mindre.

## 5.3 Hur roll & behörighet lagras säkert — kärnregeln

**Sanningen om en användares roll får ALDRIG ligga någonstans användaren kan ändra.**

Det betyder konkret:

- **Rollen lagras serverside**, i databasen, kopplad till konto-ID. Punkt.
- **Rollen ligger aldrig** i en cookie, i `localStorage`, i ett dolt formulärfält, i en URL-parameter eller i någon klient-token användaren kan redigera.
- **Varje känslig handling slår upp rollen på nytt serverside.** Klienten kan visa eller dölja en knapp för bekvämlighet — men servern litar *aldrig* på vad klienten påstår. Klickar någon "godkänn insamling" frågar servern: *vad är den här användarens roll i databasen, just nu?* Är svaret inte granskare/admin → handlingen avvisas, oavsett vad klienten skickade.
- **Princip:** klienten är ett skyltfönster, servern är valvet. Allt som rör pengar, godkännande och roller avgörs i valvet.

Varför detta är så hårt formulerat: om en donator kan ändra ett fält till `role: admin` är hela plattformen öppen. Det här är inte ett kantfall — det är fundamentet.

## 5.4 Rolländringar loggas

- Varje roll-tilldelning och varje kontofrysning **loggas**: vem ändrade, vad, när, varför.
- Loggen är åtkomlig för admin (M16). Den är **oföränderlig** — append-only.
- Det gör maktutövning spårbar. Ingen kan tyst göra sig själv till admin utan att det syns.

## 5.5 Koppling till GDPR (M8)

M6 *samlar in* personuppgifter (personnummer, namn, e-post, BankID-verifieringar). **Hur de skyddas, hur länge de sparas och hur en användare får ut eller raderar sina data ägs av M8 (integritetspolicy/GDPR).** M6:s ansvar:

- Personnummer behandlas som **känslig uppgift** — krypterat i vila, åtkomst loggad, visas aldrig publikt (aldrig på en profil i M9).
- **Dataminimering:** vi lagrar bara det BankID och Stripe faktiskt ger oss och som vi behöver. Inga "kan vara bra att ha"-fält.
- En användares **publika** identitet (visningsnamn på M9) är skild från den **verifierade** identiteten (personnummer). Donatorn ser visningsnamnet; bara granskare/admin ser den verifierade kopplingen — och då bara vid behov.
- **Radering:** en användare kan begära radering (M8). Men: en insamlare med slutförd insamling och utbetalda pengar kan inte radera den ekonomiska historiken — bokförings- och bedrägeriskäl. Då anonymiseras kontot i stället för att raderas. Exakt gräns spikas i M8.

## 5.6 Kantfall

- **Stulen session-cookie:** begränsad skada — rollen ligger inte i cookien, känsliga handlingar kräver BankID-omverifiering. Användaren kan logga ut alla sessioner.
- **Insamlaren förlorar tillgång till sitt BankID** (nytt, byte av bank): BankID följer personnumret, inte enheten — nytt BankID, samma identitet, samma konto. Inget på plattformen går sönder.
- **Misstänkt intrång på ett konto:** admin kan tvångslogga-ut alla sessioner och frysa kontot. Insamlarens pengar är ändå skyddade — de ligger hos Stripe (M5), inte på plattformen.

---

## 5. Designval & motivering (hela Modul 6)

| Beslut | Motivering |
|---|---|
| BankID obligatoriskt för insamlare | Svensk verklighet — BankID *är* identitet. Ger gratis, vattentät KYC. Bakom varje insamling finns ett spårbart personnummer. Princip 13. |
| E-post *eller* BankID för donatorer; gästdonation utan konto | Friktion vid donation är gift (research, GoFundMe). Risken ligger hos den som tar ut pengar, inte den som ger. Asymmetrin är medveten. |
| Insamlare = vem som helst, inget muslimkrav | Granskningen sitter på projektet (M3), inte personen. Princip 12: muslimsk är målgrupp, inte mur. Trosbevis vore omöjligt att verifiera och fel. |
| Två KYC-lager: BankID + Stripe-onboarding | De svarar på olika frågor — "verklig person?" vs "får juridiskt ta emot pengar?". Båda behövs. Princip 13: Stripe äger finansregelverket. |
| En person = ett konto, som uppgraderas | Håller historik samlad och profilen (M9) ärlig. Inga parallella "donator-jag" och "insamlare-jag". |
| Sex kontotyper, fem roller | Speglar verkliga aktörer utan över-modellering. Besökare = "ingen roll" är enklare än en tom rollpost. |
| Granskare/admin tilldelas manuellt, aldrig via ansökan | Förtroenderoller delas ut av en människa uppifrån. Ingen kan göra sig själv till granskare. |
| Bara admin stänger ner permanent; granskare pausar | Skiljer mjukt reversibelt (paus) från hårt permanent (nedstängd). Tungt beslut → högsta rollen. |
| Jävsregel inbyggd: granskare ≠ granska egen insamling | En granskare är också en människa som får samla in — men aldrig döma i egen sak. |
| Roll lagras serverside, slås upp vid varje känslig handling | Den enskilt viktigaste säkerhetsregeln. Klienten är skyltfönster, servern är valvet. Annars är plattformen öppen. |
| Step-up BankID för pengar/roller/bankuppgifter | En stulen session ska inte räcka för att flytta pengar eller dela ut makt. |
| Personnummer = känslig uppgift, krypterad, aldrig publik | GDPR och grundläggande respekt. Publik identitet (M9) är skild från verifierad identitet. |
| Rolländringar i oföränderlig logg | Maktutövning ska vara spårbar. Ingen tyst självbefordran. |

---

## 6. Kopplingar

**Modul 6 tar in:**
- Verifierad identitet (namn, personnummer) från **BankID-leverantören**.
- KYC-resultat (godkänd/avvisad betalningsmottagare) från **Stripe / M5**.
- Föreningens organisationsnummer och firmatecknarkoppling från **M10**.
- Beslut om kontofrysning (regler) från **M8**.

**Modul 6 lämnar ut:**
- Ägare och roll till **M1** (vem äger insamlingen, vem får skapa).
- Behörigheten "får granska" till **M3**, plus jävsregelns datagrund.
- Den verifierade insamlaridentiteten till **M5** (kopplad `stripe_account_id`).
- Identitet som **M7** stämplar på bevis och uppdateringar (vem postade).
- Publik vs verifierad identitet till **M9** (profilen visar bara den publika).
- Behörighetskontroll till **M11, M13, M15, M16** — vem får göra vad, överallt.
- Personuppgifts-inventariet till **M8** (vad samlas in, för GDPR).

**Hård beroende-flagga:** insamlar-onboarding (Block 3) kan inte byggas färdigt förrän M5 bekräftat exakt hur Stripe Connect-onboarding fungerar. Identitetsdelen (BankID) är fristående och kan byggas oberoende.

---

## 7. Säkerhet & anti-kaos

- **Roll serverside, alltid uppslagen** — användaren kan aldrig förfalska vad hen får göra. Plattformens fundament.
- **BankID bakom varje insamlare** — bedrägeri har ett namn och ett personnummer. Avskräcker före det händer.
- **Step-up-autentisering** — pengar, roller och bankuppgifter kräver färskt BankID även för inloggad användare.
- **Ett personnummer = ett insamlarkonto** — ingen kan multiplicera identiteter.
- **Oföränderlig roll-logg** — maktutövning är spårbar, ingen tyst självbefordran.
- **Personnummer krypterat, aldrig publikt** — läcker inte via profil eller URL.
- **Kontofrysning** — admin kan stoppa en misstänkt insamlare utan att radera historiken.
- **Pengarna ligger hos Stripe, inte plattformen** — även ett kontointrång når inte donatorernas medel.

**Verklig risk att säga rakt:** är Zivar enda admin är driften en sjukdag från stillastående, och en komprometterad admin är total. Minst två admins, från dag ett. Se öppen fråga 2.

---

## 8. Automatisering

**Självgående (ingen människa):** BankID-inloggning och -verifiering, sessionshantering och -utgång, lösenordsåterställning, e-postverifiering, behörighetsuppslag vid varje handling, blockering av dubbletter på personnummer, step-up-prompt vid känsliga handlingar, loggning av rolländringar.

**Kräver människa:** tilldela granskar-/adminroll (admin), frysa ett insamlarkonto (admin), hantera GDPR-raderingsbegäran (admin, M8), bedöma kantfall där Stripe-onboarding fastnat.

Riktmärke: identitets- och inloggningslagret rullar i princip helt utan att Zivar rör det. Det enda återkommande manuella är att dela ut roller — vilket sker sällan.

---

## 9. Öppna frågor

1. **Alternativ identitetsväg för personer utan BankID** som vill bli insamlare (pass/körkort + manuell granskning)? Parkerat — egen, dyr funktion. Inte v1.
2. **Antal admins vid lansering.** Rekommendation: minst två (kontinuitet + säkerhet). Behöver bekräftas.
3. **Anhörig-/ombudsfält** på insamlarkontot — för fallet att insamlaren avlider eller blir långvarigt oförmögen (ärvt från M1 öppen fråga 1). Beslut: ett *frivilligt* ombudsfält på insamlarkontot bör finnas — men exakt vad ombudet får göra spikas tillsammans med M5 (utbetalning) och M7 (resultatrapportering).
4. **Får ett föreningskonto ha flera inloggande personer** (flera firmatecknare)? Lutar mot ja — men ägs och spikas av M10.
5. **Exakt session-livslängd per roll** — sätts vid bygge, ett driftbeslut snarare än ett planbeslut.

---

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 6:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (inloggning), Block 2 (sex kontotyper), Block 3 (KYC, tre steg), Block 4 (behörighetsmatris), Block 5 (sessioner, säker rollagring, GDPR-koppling) nyskrivna. |
