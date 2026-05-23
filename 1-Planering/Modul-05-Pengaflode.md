# Modul 5 — Pengaflöde

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 6 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md` (särskilt Block 2), `Modul-04-Donator-flodet.md`. Förutsätter `M6 Identitet & auth`.

> **Teknisk modul — läs så här:** Detta är den tekniska sanningen om pengarna. Den är konkret och nämner Stripe-begrepp vid namn. Där en aktuell Stripe-detalj kan ha ändrats sedan planen skrevs står antagandet **uttryckligen** i texten och i avsnitt 9 (Öppna frågor). Var beslutsam om *arkitekturen*, ödmjuk om *exakta API-detaljer*.

---

## 1. Vad modulen är

Modul 5 definierar **hur pengarna rör sig** — från donatorns kort/Swish, genom Stripe, till insamlarens konto. Och lika viktigt: hur de **inte** rör sig — varför de aldrig juridiskt passerar genom plattformen.

**Den löser:** M1 antog (Block 2) att "Stripe håller medlen till insamlingsdeadline" — utan det fungerar inte refund vid undermål. M4 antog att betalning, kvitto och refund är möjliga. **M5 bevisar att de antagandena håller**, eller säger rakt ut var de inte gör det. M5 sätter ramarna uppåt: pengaflödet är inte fri konst — det avgör vad resten av plattformen får lova.

---

## 2. Varför den behövs

Tre skäl till att pengaflödet måste spikas i detalj — och tidigt:

- **M1 Block 2 vilar på ett antagande som bara M5 kan bekräfta.** "Stripe håller medlen till deadline" är förutsättningen för refund vid undermål. Är den fel, faller M1 Block 2 Fält 4. Den måste verifieras, inte hoppas på.
- **Juridiken är avgörande.** Om pengar juridiskt passerar genom plattformen blir plattformen en **betaltjänst** — och då krävs tillstånd från Finansinspektionen. Det är en oöverstiglig tröskel för ett föreningsprojekt. Hela arkitekturen är byggd för att undvika det. Det måste vara *medvetet* designat, inte en lycklig slump.
- **Avgifterna formar löftet.** "0 kr plattformsavgift" (princip 1) är ett kärnlöfte. M5 måste visa exakt hur det går ihop ekonomiskt — annars är det en tom slogan.

---

## 3. Blocköversikt — 6 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Stripe Connect-arkitektur — connected accounts, onboarding | ✅ Spikad |
| 2 | Charge-flödet — hur en donation blir en charge, hur medel hålls | ✅ Spikad |
| 3 | Utbetalning — när och hur pengar når insamlaren | ✅ Spikad |
| 4 | Refund — vid undermål, vid fejk/nedstängning, vem bär avgiften | ✅ Spikad |
| 5 | Avgifter — 0 kr plattformsavgift, Stripe-avgift, Swish, frivilligt bidrag | ✅ Spikad |
| 6 | Juridiken — varför pengarna aldrig passerar plattformen | ✅ Spikad |

När alla sex är klara vet vi exakt var varje krona befinner sig, vem som äger den, och vem som bär varje kostnad.

---

# BLOCK 1 — Stripe Connect-arkitektur

## 1.1 Grundmodellen — plattform + connected accounts

Plattformen använder **Stripe Connect**. Det betyder:

- **Plattformskontot** — Sadaqa Sweden (föreningens) eget Stripe-konto. Det *orkestrerar* betalningar men är **inte** den som tar emot insamlingarnas pengar.
- **Connected accounts** — varje **insamlare** (och varje **förening**) får ett eget, separat Stripe-konto, kopplat till plattformskontot. Insamlingens pengar tillhör insamlarens connected account — inte plattformen.

Detta är den arkitektoniska kärnan. Pengarna lever i insamlarens Stripe-konto, inte i plattformens. Plattformen är en **dirigent**, inte en **kassör**. (Det är också grunden för Block 6 — juridiken.)

```
   Donator
      │  betalning (Swish/kort)
      ▼
 ┌─────────────────────────────────────────────┐
 │            STRIPE                            │
 │                                              │
 │  Plattformskonto (Sadaqa Sweden)             │
 │     └─ orkestrerar, äger inte medlen         │
 │                                              │
 │  Connected account: Insamlare Ahmed          │
 │     └─ insamlingens medel bor HÄR            │
 │     └─ hålls tills deadline                  │
 │     └─ betalas ut till Ahmeds bankkonto      │
 └─────────────────────────────────────────────┘
      │  payout (efter deadline)
      ▼
   Insamlarens svenska bankkonto
```

## 1.2 Vilken Connect-kontotyp — beslut: Express

Stripe Connect erbjuder olika kontotyper (vanligen kallade **Standard**, **Express** och **Custom/Controller-konfigurationer**). **Beslut för v1: Stripe Connect Express.**

**Motivering:**

| Typ | Vad det innebär | Bedömning för oss |
|---|---|---|
| **Standard** | Insamlaren skapar/har ett fullständigt eget Stripe-konto, eget Stripe-dashboard, sköter mycket själv. | För tungt för en privatperson som bara vill samla in till bönemattor. Hög friktion vid onboarding. |
| **Express** | Stripe sköter en **färdig, smidig onboarding-flow** (identitet, bankkonto, regelefterlevnad). Insamlaren får en lättviktig Express-dashboard. Plattformen behåller kontroll över utbetalningstajming. | **Vald.** Rätt balans: låg friktion för insamlaren, Stripe bär KYC/regelbördan, plattformen styr payout-tajmingen. |
| **Custom** | Plattformen bygger hela onboarding- och dashboard-upplevelsen själv, bär mer regelansvar. | Mycket utvecklingsarbete. Onödigt för v1 — Express ger det vi behöver. |

**Varför Express är rätt val mot principerna:**

- **Princip 13 — samordna befintlig godhet.** Stripe har redan licensen, identitetsverifieringen, regelefterlevnaden. Express låter oss *använda* det i stället för att bygga om det. Vi bygger inte en KYC-motor; vi lutar oss mot Stripes.
- **Princip 3 — 95 % självgående.** Express onboarding är en hostad flow. Zivar behöver inte verifiera insamlares bankuppgifter manuellt — Stripe gör det.
- **Princip 6 — premium genom omsorg.** Express-flowen är genomarbetad och trygg. En halvfärdig egenbyggd onboarding skulle skava.

> **Antagande (→ Öppna frågor):** Stripes Connect-kontotyper och deras exakta namn/kapabiliteter utvecklas över tid. Beslutet "Express-liknande hostad onboarding med plattformsstyrd payout" är robust som *arkitektur*. Exakt produktnamn och konfiguration ska verifieras mot Stripes aktuella Connect-dokumentation vid byggstart.

## 1.3 Hur insamlaren onboardas till Stripe

Onboarding sker **som en del av insamlar-flödet (M2)** — men den tekniska sanningen bor här.

**Flödet:**

1. Insamlaren skapar sin insamling (M2 wizard) och blir godkänd av granskaren (M3). Insamlingen är då redo att publiceras.
2. **Innan insamlingen kan gå `aktiv`** måste insamlaren ha ett verifierat connected account. Plattformen skapar ett Express-konto åt insamlaren och skickar hen genom Stripes hostade **onboarding-länk** (Account Link).
3. I Stripes flow lämnar insamlaren det Stripe kräver — typiskt: namn, personnummer/identitet, adress, **svenskt bankkontonummer** för utbetalning, och eventuell verksamhetsinformation.
4. Stripe verifierar. När kontot har de kapabiliteter som behövs (kan ta emot charges, kan ta emot payouts) → insamlaren är redo.
5. Insamlingen kan nu publiceras → `aktiv` (M1 Block 3).

**Vad insamlaren konkret måste göra:**

- Lämna sin identitet och ett **svenskt bankkonto** till Stripe (inte till plattformen — plattformen ser aldrig bankkontonumret).
- Genomgå Stripes verifiering. För de flesta privatpersoner är detta klart på minuter.

**Förening kontra privatperson:**

- En **privatperson** onboardas som individ.
- En **förening** onboardas som organisation/företag (Stripe har en separat flow för det — kräver typiskt org.nr och uppgift om firmatecknare).
- Båda får ett connected account. Skillnaden är vilken Stripe-flow de möter; arkitekturen är densamma.

**Relation till M6:** M6 äger plattformens egen identitet (BankID-inloggning, vem som är vem på *plattformen*). M5/Stripe äger den *betalningsrelaterade* identitetsverifieringen (KYC för att få ta emot pengar). De är två lager: M6 säger "du är inloggad och får skapa en insamling"; M5/Stripe säger "ditt konto är verifierat och får ta emot pengar". **Båda måste vara gröna innan insamlingen går `aktiv`.**

**Kantfall:** Insamlaren blir granskningsgodkänd men slutför aldrig Stripe-onboardingen → insamlingen fastnar i ett "godkänd men ej publicerbar"-läge. Påminnelse via M15. Insamlingen kan inte ta emot en enda krona förrän kontot är klart — vilket är rätt: ingen donation utan en verifierad mottagare.
**Kantfall:** Stripe nekar verifiering av en insamlare → insamlingen kan inte publiceras. Detta hanteras som ett ärende mot insamlaren (M2/M6). Det är ovanligt och hör till "kantfall löses av människor" (M1 princip).

## 1.4 Föreningens eget connected account

Föreningen (Sadaqa Sweden själv) har **också** ett connected account — eller tar emot på sitt ordinarie plattformskonto. Detta är destinationen för det **frivilliga bidraget** (Block 5). Det hålls strikt åtskilt från varje insamlings medel. Spikas i Block 5.

## 1.5 Betalprocessor-beroende & reservväg

Hela pengaflödet vilar på **en enda part: Stripe.** Det är medvetet (princip 13 — samordna befintlig godhet) och rätt för v1. Men det är också en **enskild felpunkt** som måste sägas rakt ut.

**Risken, konkret:** Stripe har förr **stängt konton för muslimska organisationer** — ibland utan tydlig motivering, ibland med hänvisning till bredd-svepande riskbedömningar. Sker det Sadaqa Sweden står hela plattformens pengaflöde stilla. Det är inte ett teoretiskt kantfall; det är ett känt mönster i branschen och måste planeras för.

**Hållning för v1:** vi bygger på Stripe nu — men **låser inte fast oss mentalt eller arkitektoniskt**. Reservvägen behöver inte byggas, men den ska vara **känd** innan den behövs.

**Alternativa processorer som hålls på ritbordet** (realistiska kandidater att utreda om en flytt blir nödvändig):

| Kandidat | Varför den är intressant | Att utreda |
|---|---|---|
| **Adyen** | Etablerad marknadsplats-/plattformsfunktionalitet (split payments, connected-konton), stark europeisk närvaro | Onboarding-friktion, om Swish stöds, kontotyper motsvarande Connect Express |
| **Klarna Payments** | Svensk aktör, stark i Norden, känd för svenska donatorer | Om marknadsplats-/utbetalningsmodell finns som motsvarar "håll medel till deadline" |
| **Wise Business** | Låga avgifter, internationella utbetalningar — relevant om hjälpen landar utomlands | Om split/connected-modell finns alls; kan vara komplement snarare än ersättare |

**Grov migrationsväg — vad en flytt skulle innebära:**

- **Tid:** en processor-flytt är ett **stort ingrepp**, inte en konfigurationsändring — riktmärke flera veckors arbete (ny integration, ny onboarding-flow, testning, omverifiering).
- **Vilken data som måste flyttas:** insamlares connected accounts måste **återskapas hos den nya processorn** (identitet och bankkonto onboardas om — gammal KYC följer inte med). Donations-historik, kvitto-ID och `transfer_group`-koppling stannar i plattformens egen databas och påverkas inte; det är *betalningsinfrastrukturen* som byts, inte plattformens data.
- **Vilka ärenden som fryses under flytten:** **nya charges** kan behöva pausas under övergångsfönstret; **pågående insamlingar** kan behöva hållas i ett kontrollerat läge tills medel och konton är på plats; **utbetalningar** sker först när insamlare har verifierade konton hos den nya processorn.
- **Donatorn ska aldrig drabbas ekonomiskt** av en flytt — redan givna medel hålls säkert (hos den gamla processorn tills de transfererats/refunderats), inget förloras.

> **Detta behöver inte byggas nu.** Vägen ska bara vara känd, så att en kontostängning blir en hanterbar kris och inte ett dödsfall. Den **fulla operativa planen** — exakt vad som görs, i vilken ordning, av vem — bor i `Beredskapsplan.md`. M5 äger bara medvetenheten och den grova vägen.

---

# BLOCK 2 — Charge-flödet

Detta är blockets kärna och hela plattformens hemlighet: **hur en donation blir en charge, och varför medlen hålls hos Stripe till deadline.**

## 2.1 Hur en donation blir en charge

När en donator slutför betalning (M4 Block 3):

1. M4 har samlat in: belopp (i öre, SEK), vilken insamling, undermål-valet, ev. frivilligt bidrag, donatorns e-post.
2. M5 skapar en **charge** (via en Stripe **PaymentIntent**) — donatorn betalar med Swish eller kort.
3. Stripe behandlar betalningen. Lyckas den → pengarna finns nu **hos Stripe**, öronmärkta mot rätt connected account.
4. Donationen registreras som ett dataobjekt (kopplat till insamlingen, M1 Block 4) med Stripe-charge-ID, undermål-val och metadata (t.ex. enhetsantal från M4).
5. M4 visar bekräftelse och skickar kvitto; progress bar uppdateras.

## 2.2 KRITISKT — medlen hålls hos Stripe till deadline

Detta är **förutsättningen som M1 Block 2 bygger på.** M1 antog det; M5 bekräftar **hur**.

**Vald metod: Separate charges and transfers.**

Stripe Connect erbjuder flera sätt att flytta pengar till ett connected account. De två relevanta:

| Metod | Hur det fungerar | Lämplig för oss? |
|---|---|---|
| **Destination charges** | Vid betalningstillfället går pengarna *direkt* mot det connected account som är destination. Pengen "landar" hos insamlaren med en gång. | **Nej.** Då sitter pengarna hos insamlaren redan vid donationen — refund vid undermål blir krångligt eller omöjligt, för pengarna kan redan vara utbetalda. |
| **Separate charges and transfers** | Charge skapas **på plattformskontot**. Pengarna ligger på plattformens Stripe-balans. En **separat transfer** till insamlarens connected account görs *senare* — när plattformen bestämmer (dvs. vid deadline). | **JA — vald.** Plattformen kontrollerar tajmingen. Pengarna kan hållas tills deadline, och refund är fullt möjligt fram tills transfern gjorts. |

**Så här fungerar det konkret:**

1. **Under insamlingens `aktiv`-fas:** varje donation blir en charge **på plattformens Stripe-konto**. Pengarna ackumuleras på plattformens Stripe-balans, bokförda mot rätt insamling via metadata. **Ingen transfer görs ännu.**
2. **Insamlingen är `aktiv` → `stängd`** när deadline passerar (M1 Block 3, systemtriggat).
3. **Vid stängning** avgör plattformen utfallet (mål nått / undermål) och vad varje donations undermål-val innebär.
4. **Sedan** görs transfers till insamlarens connected account — för de donationer som ska gå dit. Donationer märkta "återbetala mig" vid undermål transfereras **inte** — de refunderas i stället (Block 4).
5. Därefter sker payout från connected account till insamlarens bankkonto (Block 3).

**Detta bekräftar M1 Block 2 Fält 4:** Eftersom pengarna ligger på **plattformens Stripe-balans** ända tills transfern görs, och transfern görs **först vid deadline**, är **refund vid undermål fullt tekniskt möjligt**. En charge kan refunderas så länge den inte är en del av en redan genomförd transfer/payout-kedja. M1:s antagande **håller**.

> **Antagande (→ Öppna frågor):** "Separate charges and transfers" är en etablerad Stripe Connect-mekanik. Det finns en alternativ väg — **manual payouts** på destination charges — men den är klumpigare för vårt fall. Beslutet är *separate charges and transfers*. Exakt API-form (PaymentIntent på plattformskontot + senare Transfer med rätt `destination` och `transfer_group`) ska verifieras mot Stripes aktuella Connect-dokumentation vid byggstart. Arkitekturen — "charge på plattformen, transfer senare" — är robust oavsett API-detaljer.

## 2.3 transfer_group — hålla ordning på pengarna

Varje insamlings charges och kommande transfers binds samman med ett gemensamt **`transfer_group`** (ett ID per insamling). Det gör att vi vid deadline kan:

- Summera exakt vad en insamling fått in.
- Veta vilka charges som ska transfereras och vilka som ska refunderas.
- Hålla bokföringen ren — varje krona spårbar till rätt insamling.

Detta är också ryggraden i transparensen (M7): vi kan visa exakt vad som kom in och vad som hände med det.

## 2.4 Kantfall i charge-flödet

- **Charge påbörjas före deadline, slutförs strax efter** (M1 Block 5.2): en PaymentIntent som skapats medan insamlingen var `aktiv` men bekräftas några sekunder efter midnatt → **räknas med**. Riktmärke: en kort kulans-marginal (t.ex. PaymentIntents skapade före deadline får slutföras). Strikt nya betalningsförsök efter deadline → avvisas (insamlingen är `stängd`, tar inte emot nya charges).
- **Betalningen misslyckas** (kort nekas, Swish avbryts) → ingen donation registreras, donatorn ser felet i checkout, kan försöka igen. Inget halvt tillstånd.
- **Insamlingen `pausad` mitt under aktiv fas** (M1 Block 3.4) → nya charges fryses; redan inkomna charges ligger kvar på plattformsbalansen, ingen transfer görs, ingen refund görs — allt väntar tills granskaren avgör.
- **Dubbeldebitering / donator klagar** → Stripes egna verktyg + manuell refund (Block 4).

---

# BLOCK 3 — Utbetalning

När och hur pengarna når insamlaren.

## 3.1 Två steg — transfer och payout

Det är viktigt att skilja på två saker:

- **Transfer** = pengar flyttas från plattformens Stripe-balans → insamlarens connected account (Stripe-internt).
- **Payout** = pengar flyttas från insamlarens connected account → insamlarens **svenska bankkonto** (lämnar Stripe).

Båda måste ske för att pengarna ska nå insamlaren på riktigt.

## 3.2 Vad triggar utbetalning

```
 Insamlingen aktiv
        │  deadline passerar (system, M1 Block 3)
        ▼
 Insamlingen STÄNGD
        │  system räknar: mål nått? undermål? per-donation undermål-val?
        ▼
 ┌──────────────────────────────────────────────┐
 │ För donationer som ska gå till insamlaren:    │
 │   → TRANSFER till connected account           │
 │ För donationer märkta "återbetala mig" vid    │
 │   undermål:                                   │
 │   → REFUND (Block 4), ingen transfer          │
 └──────────────────────────────────────────────┘
        │
        ▼
 Connected account har medlen
        │  PAYOUT till bankkonto
        ▼
 Insamlingen → UTBETALD (M1 Block 3)
```

**Steg för steg:**

1. **Deadline passerar** → insamlingen `stängd` (systemtriggat, M1 Block 3).
2. **Systemet räknar utfallet.** Mål nått eller undermål. För varje donation: ska den till insamlaren eller refunderas (Block 4)?
3. **Transfers görs** till insamlarens connected account för alla donationer som ska dit.
4. **Payout till bankkontot.** Här finns ett designval — se 3.3.
5. **Insamlaren bekräftar** (M1 Block 3.3: "stängd → utbetald" triggas av "system + insamlaren"). Insamlaren får en notis (M15), ser i sin Express-dashboard / på plattformen att utbetalningen är på väg, och kontrollerar att bankkontot stämmer.
6. Insamlingen → `utbetald` (M1 Block 3). Detta triggar **utbetalningsbeviset** i transparens-loopen (M7).

## 3.3 Payout-tajming — beslut

**Beslut: payouts till connected accounts sätts till manuell payout-styrning (manual payout schedule), och plattformen utlöser payout efter att transfern gjorts vid deadline.**

**Motivering:**

- Med manuell payout-styrning bestämmer **plattformen** när pengarna lämnar Stripe till bankkontot — inte ett automatiskt dagligt schema. Det ger kontroll: payout sker först efter att utfallet är klart och eventuella refunds är hanterade.
- Det förhindrar att pengar betalas ut "för tidigt" till insamlaren under den korta fönstret mellan transfer och refund-avstämning.
- En liten **fördröjning** (riktmärke: payout initieras inom någon eller några dagar efter stängning) ger marginal för att fånga uppenbara problem innan pengarna lämnar Stripe helt. Det är inte byråkrati — det är ett sista säkerhetsnät i linje med princip 4 ("vårt fel men inte dödligt": vi vill ha en chans att fånga ett fel medan det fortfarande går).

> **Antagande (→ Öppna frågor):** Stripe styr payout-scheman per connected account (automatiskt dagligt/veckovis, eller manuellt). Beslutet "manuell payout, plattformsstyrd, efter deadline" är robust. Exakt hur payout-schemat sätts på Express-konton ska verifieras mot Stripes aktuella dokumentation — på vissa Express-konfigurationer äger Stripe payout-schemat. Faller den styrningen bort, är reservplanen: håll medlen som *otransfererade* på plattformsbalansen och gör transfern först vid deadline (då blir transfer-tajmingen kontrollpunkten, och payout får löpa på Stripes schema därefter). Antingen vägen bevarar kärnkravet: **inga pengar når insamlaren före deadline.**

## 3.4 Hur lång tid tar det

- **Insamlaren ska veta i förväg** att pengarna inte kommer dagen efter deadline. Plattformen kommunicerar tydligt (M2): "Pengarna betalas ut inom [riktmärke några bankdagar] efter att insamlingen stängt."
- Den faktiska tiden från payout-initiering till pengar på bankkontot styrs av Stripe + svenska banksystemet (typiskt ett par bankdagar).
- Transparens mot insamlaren här är en del av premiumkänslan (princip 6) — inga oväntade väntetider.

## 3.5 Kantfall i utbetalning

- **Insamlaren har bytt/stängt sitt bankkonto** → payout misslyckas, pengarna stannar på connected account. Insamlaren får uppdatera bankuppgifter (via Stripe Express-flow), payout görs om. Inget pengar förloras.
- **Insamlaren försvinner efter stängning** (M1 Block 5.2): pengarna ligger kvar på connected account / plattformsbalansen. Ingen panik — de är inte borta. Hanteras som ärende; resultatfasen är det egentliga problemet, inte pengarnas säkerhet.
- **Insamlaren avlider** (M1 Block 5.2): admin-ärende. Pengarna är intakta på Stripe. Utbetalning till dödsbo/ombud eller refund avgörs av admin. Öppen fråga om ombudsfält parkerad till M6.
- **Insamling `nedstängd` innan utbetalning** (fejk bekräftad) → ingen transfer, ingen payout. Refund-process i stället (Block 4).

---

# BLOCK 4 — Refund

När pengar går tillbaka till donatorn. Detta block besvarar också **M1:s öppna fråga nr 4**: vem bär den icke-återbetalbara Stripe-avgiften vid refund.

## 4.1 När refund sker

Tre situationer:

| Situation | Vilka donationer refunderas | Triggas av |
|---|---|---|
| **Undermål** | Bara donationer märkta "återbetala mig" (M4 Block 2.1) | System, automatiskt vid stängning |
| **Fejk / nedstängning** | **Alla** donationer på insamlingen | Admin, vid `nedstängd` |
| **Insamlaren avbryter / mottagaren faller bort** | Beror på fallet — alla eller delar | Granskare/admin, manuellt |

## 4.2 Refund vid undermål

- Insamlingen `stängd`, målet ej nått.
- För varje donation märkt **"återbetala mig"** (M4 Block 2.1) → automatisk refund av den charge som ligger på plattformsbalansen. Eftersom ingen transfer gjorts (Block 2.2) är detta okomplicerat — charge refunderas direkt.
- Donationer märkta **"ge ändå"** transfereras normalt till insamlaren (Block 3).
- Donatorn notifieras (M4 Block 5.2 — pengar-relaterad notis, går alltid fram).
- Detta är **systemtriggat och självgående** — ingen människa rör en undermåls-refund. Det är 95 %-principen.

## 4.3 Refund vid fejk / nedstängning

- Insamlingen blir `nedstängd` (M1 Block 5.2, beslut i M8).
- **Alla** donationer refunderas — oavsett vad donatorn valde om undermål. Vid fejk finns inget legitimt projekt att "ge ändå" till.
- Om transfer/payout **ännu inte skett** (vanligast, eftersom pengar hålls till deadline) → refunds görs från plattformsbalansen, enkelt.
- Om pengar **redan betalats ut** (fejk upptäckt sent) → svårare. Pengarna är hos insamlaren. Då krävs återkrav, ev. polisanmälan. Detta är det dyra scenariot — och själva skälet till att **granska före publicering** (princip 7) och att hålla medlen till deadline. Arkitekturen minimerar fönstret där detta kan hända, men kan inte eliminera det helt ("vårt fel men inte dödligt").
- Donatorerna notifieras (M4 Block 5.2).

## 4.4 Vem bär Stripe-avgiften vid refund — BESLUT (M1 öppen fråga nr 4)

Här är problemet. När en charge görs tar Stripe en avgift (Block 5). När man **refunderar** en charge får man tillbaka beloppet till donatorn — men **Stripe behåller (i de flesta fall) den ursprungliga charge-avgiften.** Refund är inte gratis: någon har redan betalat avgiften för att ta emot pengen, och den kommer inte tillbaka.

Frågan: vem bär den kostnaden?

**Beslut: plattformen (föreningen) bär den icke-återbetalbara Stripe-avgiften vid refund. Donatorn får alltid tillbaka 100 % av sin gåva.**

**Motivering — punkt för punkt:**

- **Donatorn ska aldrig straffas för att ha gett.** Att ge tillbaka 98,5 % av en gåva med förklaringen "Stripe tog resten" är ett trovärdighetsmord. En donator som får tillbaka mindre än hen gav kommer aldrig ge igen. Princip 6 (premium genom omsorg), princip 9 (transparens som styrka).
- **Att lägga det på insamlaren är fel.** Vid **undermål** har insamlaren inte gjort något fel — projektet nådde bara inte ända fram. Att då också debitera hen refund-avgifter för pengar hen aldrig fick vore orättvist. Vid **fejk** finns ingen ärlig insamlare att debitera.
- **Att lägga det på donatorn är värst.** Se första punkten.
- **Plattformen är den enda kvar — och den har en buffert.** Det **frivilliga bidraget** (Block 5) finns just för att täcka plattformens kostnader. Refund-avgifter vid undermål och fejk är en sådan kostnad. Det är en hanterbar, ovanlig utgift — undermål med många "återbetala mig"-väljare är inte normalfallet, eftersom default är "ge ändå" (M4 Block 2.1).

**Konsekvens att vara medveten om:** detta är en **reell kostnad** för föreningen. Den är liten per refund (en charge-avgift) men kan summera vid en stor nedstängd fejk-insamling. Det är priset för att hålla löftet "din gåva är trygg". Det priset är värt att betala — och det är ännu ett skäl till att granska hårt före publicering så att fejk-nedstängningar är sällsynta.

> **Antagande (→ Öppna frågor):** Stripes exakta behandling av avgifter vid refund kan variera (i vissa fall/regioner/produkter återförs delar av avgiften, i andra inte; Swish-återbetalningar kan behandlas annorlunda än kort). Beslutet — **donatorn hålls skadeslös, plattformen bär mellanskillnaden** — gäller oavsett. Exakt belopp att budgetera ska verifieras mot Stripes aktuella avgiftsvillkor och mot Swish-villkoren.

## 4.5 Chargebacks — när donatorn bestrider via sin bank

Refund (4.1–4.4) är när **plattformen eller systemet** lämnar tillbaka en gåva. En **chargeback** är något annat: det är när en donator **bestrider sin egen betalning via sin bank eller kortutgivare** — utanför plattformen. Banken driver in pengarna och plattformen/insamlaren får ingen valmöjlighet i samma mening. Det är ett block M5 tidigare inte täckte — refund ja, chargeback nej. Här spikas det.

**Vad en chargeback kostar:** en chargeback drar **beloppet + en avgift** från insamlarens Stripe-saldo. Riktmärke för avgiften: **~150 kr per chargeback** (verifieras mot Stripes aktuella villkor — se Öppna frågor). Till skillnad från en vanlig refund är det donatorns bank, inte plattformen, som styr förloppet.

**Principbeslut — vem bär en chargeback, beror på *när* den sker:**

| Tidpunkt | Var pengarna finns | Vem bär det |
|---|---|---|
| **Chargeback FÖRE utbetalning** | Medlen finns kvar hos Stripe (ingen transfer/payout gjord) | **Ren situation.** Pengarna dras tillbaka direkt från medel som ändå inte hunnit ut. Ingen blir personligen drabbad — beloppet fanns kvar. Chargeback-avgiften bärs då av plattformen (samma logik som refund-avgiften, 4.4 — donatorn ska aldrig straffas, insamlaren har inte felat). |
| **Chargeback EFTER utbetalning** | Pengarna är redan hos insamlaren | **Insamlaren ansvarar.** Beloppet + avgiften dras från insamlarens Stripe-saldo. Insamlaren har fått pengarna och bär därför återkravet. Plattformen bär **bara i sista hand** — om insamlaren är insolvent och saldot inte räcker. |

**Sista-hand-ansvaret — "vårt fel men inte dödligt" (princip 4):** att plattformen täcker en chargeback efter utbetalning ska vara **sällsynt** (kräver att en chargeback kommer in *efter* payout *och* att insamlaren saknar täckning). Beloppen är små per fall. Det är en hanterbar kostnad ur det frivilliga bidragets buffert — inte ett scenario att över-designa kring. Vi tar det när det händer, lär, går vidare.

**En chargeback är också en bedrägerisignal.** Att en donator bestrider en betalning kan betyda missnöje — men ett *mönster* av chargebacks på samma insamling eller samma insamlare är en varningsflagga för bedrägeri eller stulna kort. Varje chargeback **matar därför M16:s larm** (admin/dashboard), på samma sätt som stora gåvor flaggas (M4 Block 1.3). En enstaka chargeback är brus; flera är ett ärende.

> **Antagande (→ Öppna frågor):** Exakt chargeback-avgift och hur Stripe hanterar bestridanden (svarsfönster, bevisinlämning, Swish kontra kort) ska verifieras mot Stripes aktuella villkor. ~150 kr är ett planeringsantagande. Principbeslutet — *före utbetalning = ren, efter = insamlarens ansvar, plattformen i sista hand* — gäller oavsett exakt belopp.

## 4.6 Kantfall i refund

- **Donatorn har bytt kort / Swish-nummer sedan gåvan** → refund går normalt tillbaka till den ursprungliga betalkällan via Stripe; om den källan inte längre fungerar hanterar Stripe det enligt sina rutiner. I sällsynta fall krävs manuell hantering.
- **Gästdonator** → refund går till betalkällan; donatorn aviseras på sin e-post. Ingen inloggning behövs.
- **Partiell refund** → tekniskt möjligt, men i v1 refunderar vi **hela** gåvor, inte delar. Enklare, tydligare, färre kantfall.
- **Donatorn vill ha refund "för att hen ångrar sig"** efter att ha gett till en frisk, aktiv insamling → **nej.** En genomförd sadaqah återköps inte på begäran. Refund finns för undermål och fejk — inte som ångerrätt. (Undantag: tekniskt fel, dubbeldebitering — då självklart.) Detta hör delvis till M8 (villkor).

---

# BLOCK 5 — Avgifter

Hur ekonomin går ihop. Detta block visar att "0 kr plattformsavgift" inte är en tom slogan.

## 5.1 0 kr plattformsavgift — vad det betyder

**Plattformen (Sadaqa Sweden) tar 0 kr av insamlingens pengar.** Princip 1. Inget application fee på charges, ingen procentsats, ingen fast avgift som plattformen drar.

Det betyder **inte** att betalning är gratis — det finns en kostnad, och den är **Stripes** avgift. Frågan är bara vem som bär den. Se 5.2.

Research (Masterkarta avsnitt 9 — GoFundMe, LaunchGood) är tydlig: 0 % plattformsavgift + frivilligt tips är en **förtroendesignal**. Det säger till donatorn: vi tjänar inte på din gåva.

## 5.2 Stripe-avgiften — insamlaren bär den

Varje charge kostar en Stripe-avgift. Riktmärke för svenska kort: **ca 1,4 % + 1,80 kr per transaktion** (EU-kort; andra kort och betalmetoder kan ha andra nivåer).

**Beslut: insamlaren bär Stripe-avgiften. Den dras från insamlingens medel.**

**Motivering:**

- Plattformen tar 0 kr — den kan inte också subventionera Stripe-avgiften för varje insamling, det vore ekonomiskt ohållbart för en förening.
- Insamlaren är den som tar emot pengarna och drar nytta av betalningsinfrastrukturen. Att avgiften för *att ta emot* en gåva landar på *mottagaren* är logiskt och standard.
- Det görs **transparent**. Insamlaren ser i M2, redan vid skapande: "Stripe tar ca 1,4 % + 1,80 kr per donation. Plattformen tar 0 kr." Och progress bar / utbetalning visar netto kontra brutto ärligt (M7).

**Hur det tekniskt går till:** Med "separate charges and transfers" görs charge på plattformskontot; Stripe drar sin avgift där. När transfern till insamlaren beräknas vid deadline är det **nettobeloppet** (efter Stripes avgift) som transfereras. Insamlaren får alltså in donationer minus Stripe-avgift.

> **Antagande (→ Öppna frågor):** Exakta Stripe-priser för Sverige (kort, och Connect-relaterade tillägg) ändras över tid. ~1,4 % + 1,80 kr är ett rimligt planeringsantagande för EU-kort men ska verifieras mot Stripes aktuella prislista innan siffror visas för insamlare. Connect kan dessutom ha egna avgiftskomponenter (t.ex. för aktiva connected accounts eller payouts) — detta ska kartläggas i budgeten.

## 5.3 Swish via Stripe

- Swish ska finnas som betalmetod (M4 Block 3.1 — obligatoriskt, inte tillval).
- **Antagande:** Swish erbjuds som betalmetod **genom Stripe**, så att Swish-betalningar flyter in i samma charge-/transfer-arkitektur som kortbetalningar. Det är det rena valet — en enda pengaflödesmodell, inte två parallella.
- Swish har **egna avgiftsvillkor** som kan skilja sig från kort. Samma princip gäller: insamlaren bär avgiften, plattformen tar 0 kr.

> **Antagande (→ Öppna frågor, viktigt):** Att Swish är tillgängligt *som Stripe-betalmetod* för svenska connected accounts måste **verifieras tidigt** — det är en bärande del av M4 och M5. Om Swish **inte** kan gå genom Stripe krävs en separat Swish-integration (Swish Handel via en bank/PSP), och då måste pengaflödet för Swish-donationer designas om så att det ändå (a) håller medel till deadline och (b) går till rätt insamlare utan att passera plattformen juridiskt. Detta är den enskilt viktigaste tekniska osäkerheten i M5 och ska utredas före byggstart. Arkitekturbeslutet om Swish *inte* går via Stripe parkeras tills den utredningen är gjord.

## 5.4 Det frivilliga bidraget — "optional tip"

Plattformens egen drift (serverkostnader, Stripe-Connect-kostnader, framtida utveckling) finansieras av det **frivilliga bidraget** som donatorn kan välja att lägga till vid checkout (M4 Block 3.4).

**Hur det hålls strikt åtskilt:**

Detta är **kritiskt** att få rätt. Det finns två helt olika sorters pengar och de får aldrig blandas:

| Pengaström | Vart den går | Konto |
|---|---|---|
| **Projektinsamlingar** — donationer till en insamling | Till **insamlaren** | Insamlarens connected account |
| **Frivilligt bidrag** — donatorns tip till plattformen | Till **föreningen** (Sadaqa Sweden) | Föreningens eget konto/connected account |
| **Stöd direkt till föreningen** — en insamling *för* föreningens egen verksamhet | Till **föreningen** | Föreningens eget connected account |

**Mekanik vid en donation med frivilligt bidrag:**

- Donatorn betalar t.ex. 720 kr: **700 kr gåva + 20 kr frivilligt bidrag**.
- Det är **en betalning** för donatorn (en charge), men M5 delar upp den:
  - 700 kr (minus Stripe-avgift) → transfereras till **insamlarens** connected account vid deadline.
  - 20 kr → tillfaller **föreningens** konto.
- Kvittot (M4 Block 4.2) redovisar de två posterna **separat och tydligt**.

**Skillnaden projektinsamling vs stöd till föreningen — varför den måste vara knivskarp:**

- En **projektinsamling** ("bönemattor till 50 moskéer") → pengarna är **insamlarens**, för det projektet. Plattformen tar 0 kr.
- En **insamling för föreningens egen drift/verksamhet** är en *egen* insamlingstyp där **föreningen själv är insamlare** och föreningens connected account är mottagare. Den ska vara **tydligt märkt** som "Stöd Sadaqa Sweden" så ingen donator tror att ett driftstöd går till ett hjälpprojekt, eller tvärtom.
- Det **frivilliga bidraget** är inte en insamling alls — det är ett påslag på en *annan* gåva. Det ska aldrig kunna förväxlas med projektets pengar.

**Varför detta är så viktigt:** Om en krona avsedd för bönemattor hamnar i föreningens drift — eller omvänt — är förtroendet borta och man är dessutom illa ute juridiskt och redovisningsmässigt. `transfer_group` per insamling (Block 2.3) och en separat hantering av bidragsposten är skyddet. Varje krona ska kunna spåras till exakt en destination.

## 5.5 Sammanfattning — vem betalar vad

| Part | Betalar | Får |
|---|---|---|
| **Donatorn** | Sin gåva (+ ev. frivilligt bidrag, oförbockat) | Kvitto. Vid undermål med "återbetala mig" / vid fejk: 100 % tillbaka |
| **Insamlaren** | Stripe-avgiften (~1,4 % + 1,80 kr/donation), dras från insamlingens medel | Nettobeloppet av alla gåvor, utbetalt till bankkontot |
| **Plattformen (föreningen)** | 0 kr av insamlingen. Bär refund-avgifter vid undermål/fejk | Det frivilliga bidraget — driftens finansiering |

---

# BLOCK 6 — Juridiken

Varför pengarna **aldrig juridiskt passerar genom plattformen** — och varför det håller plattformen utanför Finansinspektionens betaltjänstregler.

## 6.1 Problemet vi undviker

Om Sadaqa Sweden **tar emot** donatorers pengar och sedan **vidarebefordrar** dem till insamlare, så **förmedlar plattformen betalningar**. Det är en **betaltjänst** enligt svensk/EU-rätt (betaltjänstlagen, ytterst PSD2). Att driva en betaltjänst kräver **tillstånd från Finansinspektionen** — eller registrering som betaltjänstleverantör. Det är:

- Dyrt.
- Tungt reglerat (kapitalkrav, regelefterlevnad, rapportering).
- I praktiken **omöjligt för ett föreningsprojekt** att bära.

Om plattformen hamnar där är projektet dött. Därför är hela arkitekturen byggd för att **plattformen aldrig blir betaltjänsten**.

## 6.2 Lösningen — Stripe ÄR betaltjänsten

**Princip 13 — samordna befintlig godhet: "Stripe har licensen."**

- **Stripe är en reglerad betaltjänstleverantör.** Stripe har tillstånden, licenserna, regelefterlevnaden. Stripe är redan den juridiska betaltjänsten.
- Med Stripe Connect är **Stripe** den part som tar emot donatorns pengar och håller dem. **Connected accounts tillhör insamlarna.** Pengarna lever, juridiskt, i Stripes reglerade miljö och är öronmärkta mot insamlarens konto.
- **Plattformen rör aldrig pengarna.** Den har ingen egen kassa där donatorernas pengar passerar. Den **instruerar** Stripe (skapa charge, gör transfer vid deadline, gör payout) — men pengarna går donator → Stripe → insamlarens connected account → insamlarens bank. Plattformskontots roll är teknisk orkestrering inom Stripes Connect-modell, inte att vara en mellanhand som äger pengarna.

**Liknelse:** Plattformen är som en **anslagstavla och en dirigent**, inte en bank. Den visar insamlingar och säger åt Stripe vad som ska hända. Stripe — den licensierade aktören — håller och flyttar pengarna.

## 6.3 Varför "separate charges and transfers" är förenligt med detta

Man kan invända: "men charges görs på *plattformens* Stripe-konto (Block 2.2) — håller då inte plattformen pengarna?"

Svar: pengarna ligger på plattformens **Stripe-balans** — inom **Stripes** reglerade system, inte i föreningens bank. Stripe är fortfarande den som juridiskt håller och behandlar medlen. Plattformskontot är en konstruktion *inuti* Stripe Connect. Pengarna landar aldrig på föreningens eget bankkonto på vägen till insamlaren. Det är skillnaden som räknas.

> **Antagande (→ Öppna frågor, viktigt):** Den exakta juridiska gränsdragningen — i vilken grad "separate charges and transfers" via plattformskontot kan ses som betalningsförmedling, och hur Stripes Connect-villkor placerar ansvaret — **ska bekräftas med juridisk rådgivning** (svensk betaltjänstjurist) innan lansering. Stripe Connect är specifikt byggt för marknadsplats-/plattformsupplägg och denna modell används av många plattformar, vilket är ett starkt indicium att den håller — men M5 är planering, inte ett juridiskt utlåtande. Detta är den viktigaste juridiska öppna frågan.

## 6.4 Vad detta kräver av plattformen

För att hålla sig på rätt sida:

- **Marknadsför sig aldrig som betaltjänst eller bank.** Plattformen är ett verktyg som kopplar ihop insamlare, donatorer och Stripe.
- **Tar aldrig emot donationer på föreningens vanliga bankkonto** som sedan ska vidare till insamlare. Allt projektpengaflöde går genom Stripe Connect.
- **Föreningens egna pengar** (frivilliga bidraget, stöd till föreningen) går till föreningens *eget* connected account / konto — det är föreningens egna intäkter, inte vidareförmedling. Det är en helt annan sak juridiskt.
- **Följer Stripes Connect-villkor** för plattformar — vilka i sig är utformade för att hålla plattformen rätt placerad.

## 6.5 Vad detta INTE löser (ärlighet)

- Det löser inte **insamlarens** egna skyldigheter — en insamlare som tar emot stora belopp kan ha egna skatte-/redovisningsskyldigheter. Det är insamlarens ansvar ("verktyg, inte polis", princip 5). Plattformen kan informera, inte bära det.
- Det löser inte **penningtvätts-medvetenhet** — Stripe har egna kontroller, men plattformen bör ändå flagga onormala mönster (M4 Block 1.3 stora gåvor, M16 admin).
- Det gör inte plattformen immun mot allt — det placerar bara den juridiska betaltjänst-rollen där den hör hemma: hos Stripe.

---

## 5. Designval & motivering (hela Modul 5)

| Beslut | Motivering |
|---|---|
| Stripe Connect som hela pengaflödets grund | Stripe har licensen, KYC:n, regelefterlevnaden. Princip 13 — vi bygger inte om en betaltjänst. |
| Stripe Connect **Express** som kontotyp | Rätt balans: låg onboarding-friktion för insamlaren, Stripe bär KYC-bördan, plattformen behåller payout-kontroll. Standard är för tungt, Custom är onödigt utvecklingsarbete. |
| **Separate charges and transfers** — inte destination charges | Charge på plattformskontot + senare transfer = plattformen styr tajmingen. Pengarna kan hållas till deadline. Detta är vad som gör M1 Block 2:s refund-löfte tekniskt sant. |
| Medlen hålls hos Stripe till insamlingsdeadline | Förutsättningen M1 Block 2 byggde på. Bekräftad: refund vid undermål är möjligt eftersom ingen transfer skett. |
| Manuell, plattformsstyrd payout efter deadline | Plattformen ska avgöra payout-tajming, inte ett auto-schema. Ger marginal att fånga fel innan pengar lämnar Stripe. |
| **Plattformen bär refund-avgiften** (M1 öppen fråga 4) | Donatorn får alltid 100 % tillbaka — att straffa en givare är trovärdighetsmord. Insamlaren har inte felat vid undermål. Det frivilliga bidraget finns för att täcka sådana kostnader. |
| 0 kr plattformsavgift | Princip 1. Forskning: 0 % + frivilligt tips är en förtroendesignal. |
| Insamlaren bär Stripe-avgiften, transparent | Plattformen kan inte subventionera varje transaktion. Mottagaren bär kostnaden för att ta emot — logiskt och standard. Visas öppet i M2. |
| Frivilligt bidrag strikt åtskilt från insamlingspengar | En krona avsedd för bönemattor får aldrig hamna i föreningens drift. `transfer_group` + separat bidragshantering. Förtroende + redovisning. |
| Hela gåvor refunderas, inte delar (v1) | Enklare, tydligare, färre kantfall. |
| Refund är inte ångerrätt | En genomförd sadaqah återköps inte på begäran. Refund finns för undermål och fejk. |
| Chargeback: före utbetalning = ren, efter = insamlarens ansvar | Före payout finns medlen kvar hos Stripe — ingen drabbas. Efter payout har insamlaren fått pengarna och bär återkravet. Plattformen bär bara i sista hand vid insolvens — sällsynt, litet belopp ("vårt fel men inte dödligt"). En chargeback matar dessutom M16:s bedrägerilarm. |
| Stripe-beroendet erkänns; reservväg hålls känd, ej byggd | Stripe har stängt konton för muslimska organisationer förr — en enskild felpunkt. Alternativ (Adyen, Klarna Payments, Wise Business) och en grov migrationsväg hålls på ritbordet; full operativ plan i `Beredskapsplan.md`. |
| Pengarna passerar aldrig föreningens bankkonto | Det är det som håller plattformen utanför betaltjänstlagen / Finansinspektionen. Stripe är betaltjänsten. |

---

## 6. Kopplingar

**Modul 5 tar in:**

- Mål, modell, deadline, övermåls-/undermålspolicy från **M1 Block 2** — avgör utfallsberäkning vid stängning.
- Insamlingens tillstånd från **M1 Block 3** — `stängd` triggar transfer/payout, `nedstängd` triggar full refund.
- Donationen med belopp, undermål-val och frivilligt bidrag från **M4** — råmaterialet för varje charge.
- Insamlarens/föreningens identitet från **M6** — vem som ska onboardas till ett connected account.

**Modul 5 lämnar ut:**

- Charge-flödet som **M4 Block 3** bygger sin betalningsupplevelse på.
- Bekräftelse att refund vid undermål är möjlig — uppfyller **M1 Block 2 Fält 4**.
- Transfer- och payout-händelser som triggar tillståndsbyte `stängd → utbetald` i **M1 Block 3**.
- Utbetalningshändelsen som triggar **utbetalningsbeviset** i **M7** (transparens-loopen).
- Netto/brutto-data (gåvor minus Stripe-avgift) som **M7** visar ärligt.
- Refund- och nedstängningshändelser som triggar pengar-relaterade notiser i **M15**.
- Det frivilliga bidragets flöde till föreningens konto — gränssnitt mot **M16** (drift/ekonomi).
- Stora-belopp-flaggor till **M16** (penningtvätts-medvetenhet).

**Hård beroende-flagga uppåt:** M1 Block 2 och M4 Block 2–3 kan inte byggas färdigt förrän M5:s Stripe-arkitektur är verifierad. M5 *sätter ramen* — den är inte fri konst, den avgör vad resten får lova.

---

## 7. Säkerhet & anti-kaos

- **Plattformen rör aldrig kortdata** — Stripe hanterar all känslig betaldata. PCI-ansvaret ligger hos Stripe.
- **Pengarna passerar aldrig föreningens bankkonto** — håller plattformen utanför betaltjänstlagen (Block 6).
- **Medlen hålls till deadline** — minimerar fönstret där en fejk-insamling kan komma undan med pengar. Tillsammans med granskning-före-publicering (princip 7) är detta huvudskyddet mot bedrägeri.
- **`transfer_group` per insamling** — varje krona spårbar till rätt insamling; ingen sammanblandning.
- **Frivilligt bidrag strikt separerat** — projektpengar och driftspengar kan aldrig blandas.
- **Manuell payout efter deadline** — sista chansen att fånga ett fel innan pengar lämnar Stripe.
- **Donatorn hålls alltid skadeslös vid refund** — 100 % tillbaka, alltid.
- **Stora gåvor flaggas** — penningtvätts-medvetenhet (med M4 Block 1.3 och M16).
- **Stripe bär KYC** — insamlarens identitet verifieras av en reglerad aktör, inte av en överbelastad ensam administratör.

**Kvarstående risk (ärlighet):** Den verkligt dyra situationen är en fejk som upptäcks **efter** payout. Arkitekturen minimerar men eliminerar inte den. Försvaret är hård granskning före publicering + medlen hållna till deadline. Princip 4 gäller: "vårt fel men inte dödligt" — något kan slinka igenom, vi lär och justerar.

## 8. Automatisering

**Självgående (ingen människa):**

- Charge skapas vid varje donation.
- Medel ackumuleras på plattformsbalansen mot rätt insamling.
- Vid deadline: utfallsberäkning, transfers, undermåls-refunds — automatiskt.
- Payout initieras enligt plattformens regel.
- Stripe-avgiften dras automatiskt; netto beräknas automatiskt.
- Frivilligt bidrag separeras och styrs till föreningens konto automatiskt.
- Stripe Express onboarding är en hostad flow — ingen manuell verifiering av insamlares bankuppgifter.

**Kräver människa:**

- Refund vid **fejk/nedstängning** — beslutet att stänga ner (M8), själva refund-körningen kan vara halvautomatisk.
- Återkrav när pengar redan betalats ut till en fejk-insamlare.
- Insamlare som Stripe nekar verifiering.
- Insamlaren avlider / försvinner — admin-ärende.
- Avstämning av föreningens egen ekonomi (M16).

Riktmärke: ett **lyckat** pengaflöde — donation → hållna medel → transfer → payout — rör **ingen människa**. Människan kallas bara in när något gått fel. 95 %-principen.

## 9. Öppna frågor

1. **Swish via Stripe — viktigast.** Kan Swish erbjudas som Stripe-betalmetod för svenska connected accounts? Hela M4/M5 antar ja. Om nej krävs separat Swish-integration och omdesign av Swish-pengaflödet. **Utreds före byggstart.**
2. **Juridisk bekräftelse av betaltjänst-gränsen.** Att "separate charges and transfers" via plattformskontot inte gör plattformen till en tillståndspliktig betaltjänst — ska bekräftas av svensk betaltjänstjurist. Stark indikation att det håller (Connect är byggt för detta), men kräver utlåtande.
3. **Stripe Connect kontotyp — exakt konfiguration.** "Express-liknande hostad onboarding + plattformsstyrd payout" är beslutat som arkitektur. Exakt produktnamn/konfiguration verifieras mot Stripes aktuella Connect-dokumentation.
4. **Payout-schema på Express-konton.** På vissa Express-konfigurationer äger Stripe payout-schemat. Om plattformsstyrd manuell payout inte är möjlig: reservplan är att hålla medel som otransfererade på plattformsbalansen och göra transfern vid deadline. Verifieras.
5. **Exakt Stripe-prissättning för Sverige** (kort + Connect-relaterade avgiftskomponenter). ~1,4 % + 1,80 kr är planeringsantagande — verifieras mot aktuell prislista innan siffror visas för insamlare.
6. **Stripes avgiftsbehandling vid refund.** Hur mycket av charge-avgiften som är icke-återbetalbar (kort vs Swish) ska verifieras — påverkar hur stor budget föreningen behöver för refund-kostnader.
7. **Tröskel för "stor gåva"-flagg** och penningtvättsrutiner — samordnas med M4 och M16.
8. **Utländska kort / valutakonvertering** — Stripe konverterar vid charge (M1 Block 2 Fält 6). Eventuella extra avgifter för utländska kort kartläggs i prisutredningen (punkt 5).
9. **Chargeback-villkor** — exakt chargeback-avgift (~150 kr är planeringsantagande), svarsfönster och bevisinlämning (kort vs Swish) verifieras mot Stripes aktuella villkor. Påverkar budget och hur 4.5 verkställs.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 5:s fullständiga beslutslogg. Den besvarar bland annat **M1 öppen fråga nr 4** (vem bär Stripe-avgiften vid refund: plattformen) och bekräftar **M1 Block 2:s antagande** (medlen hålls hos Stripe till deadline — refund vid undermål är tekniskt möjligt).

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (Stripe Connect-arkitektur, Express valt), Block 2 (charge-flödet, separate charges and transfers, medel hålls till deadline), Block 3 (utbetalning), Block 4 (refund — M1 öppen fråga 4 besvarad), Block 5 (avgifter, frivilligt bidrag), Block 6 (juridiken) nyskrivna. Bekräftar förutsättningen som M1 Block 2 byggde på. |
| 1.1 | 2026-05-23 | Kirurgiska tillägg efter extern granskning. Block 1: nytt avsnitt 1.5 — betalprocessor-beroende & reservväg (Stripe som enskild felpunkt, alternativ Adyen/Klarna Payments/Wise Business, grov migrationsväg, hänvisning till `Beredskapsplan.md`). Block 4: nytt avsnitt 4.5 — chargebacks (princip: före utbetalning ren, efter utbetalning insamlarens ansvar, plattformen i sista hand; matar M16:s larm); tidigare 4.5 Kantfall blev 4.6. Beslutslogg utökad med två rader. |
