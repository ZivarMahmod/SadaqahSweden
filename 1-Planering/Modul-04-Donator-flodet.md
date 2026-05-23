# Modul 4 — Donator-flödet

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`. Förutsätter `M5 Pengaflöde` (Stripe) och `M6 Identitet & auth`.

---

## 1. Vad modulen är

Modul 4 definierar **resan för den som ger** — donatorn. Från ögonblicket hen bestämmer sig för att stötta en insamling, genom valen hen gör, betalningen, kvittot, och allt som händer *efter* gåvan.

**Den löser:** M1 säger vad en insamling *är* och vad en donation *pekar på*. Men M1 säger inte *hur det känns* att ge. Donator-flödet är den känslan översatt till konkreta steg. Om det här flödet skaver, friktioner eller känns som ett kassaregister — då tappar plattformen sitt syfte. En donation ska kännas som **sadaqah**, inte som ett köp.

---

## 2. Varför den behövs

Donatorn är den som får hela plattformen att fungera. Insamlaren skapar, granskaren godkänner — men utan donatorn rör sig ingen krona.

Tre problem som Donator-flödet löser:

- **Friktion dödar gåvor.** Varje extra klick, varje oklart fält, varje tvekan är en donator som backar. Research (GoFundMe) är tydlig: noll friktion att *ge* är lika viktigt som noll friktion att *skapa*.
- **Donatorn behöver känna trygghet — inte bara läsa om den.** M7 bygger transparens-loopen, men donatorn möter tryggheten *här*, i ögonblicket hen lämnar ifrån sig pengar.
- **Gåvan är inte slut när charge går igenom.** En donator som får ett bra "efter" kommer tillbaka. Det är skillnaden mellan en engångsgivare och en återkommande.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Donationsögonblicket — belopp eller enheter, snabbval, fri summa | ✅ Spikad |
| 2 | Donatorns val — undermål-valet, anonymitet, meddelande/dua | ✅ Spikad |
| 3 | Betalning — Stripe checkout, Swish, kort, gäst vs inloggad | ✅ Spikad |
| 4 | Kvitto & bekräftelse — vad donatorn får, skattekvitto-frågan | ✅ Spikad |
| 5 | Efter donationen — följa insamlingen, notiser, erbjuda praktisk hjälp | ✅ Spikad |

När alla fem är klara vet vi exakt hur en gåva går till — från knapptryck till långsiktig relation.

**Parkering (ej v1):** Match-funding (GiveMatch-modellen). Se avsnitt 9.

---

# BLOCK 1 — Donationsögonblicket

Skärmen där donatorn väljer **hur mycket** hen ger. Detta är det första friktionspunkten — och den ska vara nästan osynlig.

## 1.1 Två sätt att uttrycka samma gåva

Donatorn kan uttrycka sin gåva på **två sätt** — och de är **samma underliggande charge**:

- **Belopp** — "700 kr".
- **Per-enhet** — "20 mattor" (à 35 kr = 700 kr).

**Detta är inte två betalningar.** Det är två *vyer* av samma transaktion. M1 Block 2 Fält 1 spikade det: per-enhet är en **display-flagga på "fast"-modellen**, inte en egen målbeloppsmodell. M4 verkställer den display-flaggan här.

**Hur det fungerar:**

- Insamlaren har (i wizarden, M2) angett ett **enhetspris** — t.ex. "1 bönematta = 35 kr".
- Finns enhetspris → donationsögonblicket visar **två lägen sida vid sida**: "Ge enheter" och "Ge belopp". Donatorn växlar fritt.
- Saknas enhetspris (öppet mål, katastrof, intervall utan tydlig enhet) → bara belopps-läget visas.
- Oavsett läge: det som skickas till Stripe (M5) är **ett belopp i öre, SEK**. Enhetsantalet sparas som metadata på donationen för visning och bevisräkning.

**Varför detta spelar roll:** "20 mattor" är konkret. Donatorn *ser* sin gåva. "700 kr" är abstrakt. Per-enhet-vyn gör gåvan gripbar utan att komplicera pengaflödet en millimeter — Stripe ser bara ett belopp.

**Kantfall:** Enhetspriset ändras efter att donatorn lagt en gåva i "enhets-läge" → spelar ingen roll, charge är redan ett fast belopp. Enhetspris kan inte ändras efter publicering (det är en del av löftet, M1 Block 5).
**Kantfall:** Donatorn väljer enhetsläge och anger "13 mattor" → tillåts, ojämna tal är OK; beloppet blir 13 × 35 = 455 kr.

## 1.2 Snabbvalsknappar

Donationsögonblicket visar **3–4 snabbvalsknappar** med förvalda belopp.

**Specifikation:**

- **Belopps-läge:** snabbval i kronor. Förslag på standardnivåer: **100 kr · 300 kr · 500 kr · 1000 kr**.
- **Enhets-läge:** snabbval i enheter. T.ex. **1 matta · 5 mattor · 10 mattor · 20 mattor**.
- Snabbvalen är **kategori-medvetna** där det är rimligt — en brunnsinsamling kan ha andra naturliga nivåer än en iftar-insamling. Riktmärke: standardnivåer i v1, kategori-anpassning är en finslipning, inte ett byggkrav.
- **En knapp kan vara förvald** (riktmärke: den näst lägsta — t.ex. 300 kr). Förvald ≠ tvingande; donatorn ändrar med ett klick.

**Varför:** Snabbval tar bort beslutsångest. Donatorn behöver inte *räkna* — bara *känna*. Det sänker friktionen och höjer genomsnittsgåvan, utan att pressa.

## 1.3 Fri summa

Under snabbvalen: ett fält för **fri summa**.

**Specifikation:**

- Donatorn skriver valfritt belopp (eller valfritt enhetsantal).
- **Minsta gåva: 20 kr.** Under det blir Stripe-avgiften en orimlig andel av gåvan, och microtransaktioner skapar onödig refund-/bevis-komplexitet. 20 kr är lågt nog att ingen seriös givare stängs ute.
- **Ingen hård maxgräns** på enskild gåva. En mycket stor enskild gåva (riktmärke över 50 000 kr) flaggas internt för admin — inte för att stoppas, utan för att penningtvätts-medvetenhet hör hemma där M5 och M16 möts.
- Fri summa respekterar samma SEK-låsning som hela plattformen (M1 Block 2 Fält 6).

**Kantfall:** Donatorn skriver "0" eller tomt → knappen "Fortsätt" är inaktiv tills ett giltigt belopp finns.
**Kantfall:** Insamlingen har "fast" mål och är **nästan full** — donatorns gåva skulle överstiga målet. Det är **tillåtet** (M1 Block 2 Fält 3: default är att fortsätta ta emot vid övermål, om övermålsplan finns). Saknas övermålsplan har insamlingen redan auto-stängt och tar inte emot gåvan alls.

## 1.4 Vad detta block INTE gör

- Det tar **inte** betalt. Det samlar bara in *avsikten* (belopp/enheter). Betalning är Block 3.
- Det kräver **inte** inloggning. En besökare kan komma hela vägen hit utan konto — inloggningsfrågan ställs först i Block 3, och även då som ett *erbjudande*, inte ett krav.

---

# BLOCK 2 — Donatorns val

Innan betalning gör donatorn tre val. Alla tre har **förnuftiga defaults** så att en donator som bara vill ge snabbt aldrig fastnar — men varje val är synligt för den som bryr sig.

## 2.1 Undermål-valet — "om målet inte nås"

Det viktigaste valet. M1 Block 2 Fält 4 spikade att donatorn väljer detta **vid donationstillfället**. M4 verkställer det.

**Specifikation:**

- En **kryssruta / val** med två alternativ:
  - **● Ge ändå — pengarna går till projektet** *(default, förvald)*
  - **○ Återbetala mig om målet inte nås**
- **Default = "Ge ändå".** Motivering: de flesta vill det (30k köper ändå mattor — "verktyg, inte polis"), och en friktionsfri default skyddar mot att donatorn fastnar i ett val hen inte tänkt på.
- Valet syns **bara när det är relevant** — för insamlingar med **fast** eller **intervall**-mål. För **öppet** mål finns inget "undermål", så valet visas inte alls (det vore förvirrande).
- Valet sparas på **donationen** (inte på donatorn) — varje gåva har sitt eget undermål-val.

**Vad valet gör tekniskt:**

- "Ge ändå" → vid undermål ingår gåvan i utbetalningen till insamlaren (M5 Block 3).
- "Återbetala mig" → vid undermål får donatorn automatisk refund (M5 Block 4).

**Förklarande mikrotext** intill valet, kort och klar:
> *"Om insamlingen inte når sitt mål senast [deadline] kan insamlaren ändå genomföra projektet i mindre skala. Vill du att din gåva ska gå dit ändå, eller få tillbaka den?"*

**Kantfall:** Donatorn väljer "återbetala mig", insamlingen **når** målet → ingen refund, gåvan ingår normalt. Valet aktiveras bara vid faktiskt undermål.
**Kantfall:** Insamling med **intervall**-mål når lägstanivån men inte max → räknas som "målet nått" (M1 Block 2 Fält 1). Ingen refund triggas. "Återbetala mig" gäller bara om man inte ens når lägstanivån.

## 2.2 Anonymitet

Donatorn väljer hur hen syns.

**Specifikation — tre nivåer:**

| Nivå | Vad andra ser | Vad insamlaren ser |
|---|---|---|
| **Synligt namn** *(default för inloggad)* | Donatorns namn + ev. gåva i donatorlistan | Namn |
| **Anonym** | "Anonym givare" i donatorlistan | "Anonym givare" — insamlaren ser **inte** vem |
| **Anonym utåt, synlig för insamlaren** | "Anonym givare" publikt | Insamlaren ser namnet |

- **Default för inloggad donator:** synligt namn (men ett klick byter till anonym).
- **Default för gästdonator:** anonym — en gäst har inte ett publikt namn att visa ändå. Gästen kan ange ett visningsnamn frivilligt.
- **Beloppet** kan visas eller döljas oberoende av namnet — en separat liten kryssruta "Visa mitt gåvobelopp". Default: belopp visas, namn enligt ovan.
- Anonymitetsvalet gäller **per donation**. Samma person kan vara synlig på en insamling, anonym på nästa.

**Varför tre nivåer och inte två:** Mellannivån finns för en verklig islamisk situation — en givare som vill att gåvan är *dold* (sadaqah i tysthet är högre i värde) men ändå vill att insamlaren ska kunna tacka eller veta vem som stöttat. Det är inte över-engineering; det är att respektera en faktisk andlig motivering.

**Kvittot är alltid icke-anonymt** — donatorn får alltid sitt eget kvitto i eget namn (Block 4). Anonymitet gäller den *publika* visningen, inte donatorns egen dokumentation.

## 2.3 Meddelande / dua till insamlaren

Donatorn kan lämna ett kort **meddelande eller en dua**.

**Specifikation:**

- **Frivilligt.** Fritext, **max 280 tecken**. Kort med flit — det är en hälsning, inte en uppsats.
- **Två synlighetslägen**, donatorn väljer:
  - **Publikt** — visas vid donatorns rad i donatorlistan / community-flödet (M13).
  - **Privat till insamlaren** — bara insamlaren ser det.
- **Default: publikt** för en dua (en dua delad är en uppmuntran för andra), men donatorn kan byta med ett klick.
- Anonym donator kan ändå lämna ett publikt meddelande — det visas som "Anonym givare: [dua]".
- **Inga bilder, inga länkar** i meddelandet. Ren text. Detta är en hälsning, inte en kanal för spam eller länkdelning.

**Anti-kaos:** Meddelandefältet är en yta där hat, sekterism eller spam *kan* dyka upp. Skydd:
- Publika meddelanden går genom samma **automatiska innehållsfilter** som community (M13) — uppenbart olämpligt språk fångas direkt.
- Insamlaren kan **dölja** ett publikt meddelande på sin egen insamling (det refundas inte gåvan — gåvan och meddelandet är skilda saker).
- Upprepade övertramp från samma konto → hanteras av M6/M8.

**Kantfall:** Donatorn lämnar ett publikt meddelande och ångrar sig → kan redigera/ta bort sitt eget meddelande om hen är inloggad. En gäst kan inte (ingen identitet att knyta redigeringsrätten till) — därför uppmanas gäster diskret att tänka efter innan publikt meddelande.

## 2.4 Sammanfattning innan betalning

Innan donatorn går vidare till betalning visas en **lugn sammanfattning**:

> Du ger **20 bönemattor (700 kr)** till *"Bönematter till 50 moskéer"*.
> Om målet inte nås: **din gåva går till projektet ändå.**
> Du visas som: **Anonym givare.**

Ett klick på valfri rad tar tillbaka donatorn till det valet. Sammanfattningen är **inte** ett extra steg — den ligger på samma skärm som "Fortsätt till betalning". Den finns för att donatorn ska känna kontroll, inte för att lägga friktion.

---

# BLOCK 3 — Betalning

Hur gåvan blir en faktisk transaktion. Detta block beskriver donatorns *upplevelse* av betalningen. Den tekniska sanningen om vart pengarna går bor i **M5 Pengaflöde** — M4 refererar, M5 verkställer.

## 3.1 Betalmetoder

Två metoder i v1:

| Metod | För vem | Not |
|---|---|---|
| **Swish** | Svenska donatorer med svenskt mobilnummer | Den självklara förstametoden i Sverige — låg friktion, hög tillit |
| **Kort** (Visa/Mastercard) | Alla, inkl. utländska donatorer | Stripe sköter kortbetalning och ev. valutakonvertering |

- **Swish visas först** och är förvald för en donator som verkar vara i Sverige. Det är det metoden de flesta i målgruppen förväntar sig.
- Kort är alltid tillgängligt som alternativ.
- **Apple Pay / Google Pay** kan aktiveras via Stripe utan extra integrationsarbete — markeras som "lätt påslag", men inget v1-byggkrav. Se Öppna frågor.
- **Ingen faktura, ingen autogiro, inga andra metoder** i v1. Återkommande gåvor (autogiro-liknande) hör ihop med den parkerade "mission"-arkitekturen (M1 Block 4.3) — inte v1.

**Varför Swish är obligatoriskt och inte ett tillval:** En svensk muslimsk insamlingsplattform *utan* Swish skulle kännas främmande. Research (Masterkarta avsnitt 9) pekade ut "SEK/Swish-nativ" som själva marknadsluckan. Swish är inte en bonus — det är en förutsättning.

## 3.2 Checkout-upplevelsen

- Betalningen sker via **Stripe Checkout** (Stripes hostade betalningssida) eller en **Stripe-driven inbäddad betalkomponent**. M5 spikar exakt vilket. Donatorn ska aldrig märka var Stripe slutar och plattformen börjar — upplevelsen ska vara **en obruten, lugn yta**.
- Checkout visar: vad som doneras (belopp/enheter), till vilken insamling, och vem betalningen går till på Stripe-nivå.
- Swish-betalning: donatorn öppnar Swish-appen, godkänner, kommer tillbaka — standard Swish-flöde.
- **Inga mörka mönster.** Inga förbockade extra avgifter som donatorn måste upptäcka och bocka ur. Det enda frivilliga påslaget — det frivilliga bidraget till föreningens drift — presenteras öppet och **oförbockat** (se 3.4).

## 3.3 Gäst kontra inloggad donator

**Grundregeln: man ska kunna ge utan konto.** Att tvinga fram en registrering innan en gåva är ett av de säkraste sätten att förlora donatorn. Research (GoFundMe) bekräftar: friktion vid gåvan = färre gåvor.

| | **Gästdonator** | **Inloggad donator** |
|---|---|---|
| Konto krävs | Nej | Ja (BankID-konto, M6) |
| Kan ge | Ja, fullt ut | Ja |
| Anonymitet default | Anonym | Synligt namn |
| Får kvitto | Ja — via e-post (e-post krävs) | Ja — i appen + e-post |
| Kan följa insamlingen i appen | Nej (men kan via e-postlänk se status) | Ja, fullt (Block 5) |
| Gåvan i donationshistorik / profil | Nej | Ja (M9) |
| Skattekvitto-underlag | Begränsat — se Block 4 | Fullt — personnummer finns via BankID |

**Vad en gäst måste lämna:** en **giltig e-postadress**. Det är det enda. E-posten behövs för kvitto och för eventuell refund-avisering. Inget mer.

**Mjuk inbjudan, aldrig tvång:** Efter en gästdonation visas ett vänligt erbjudande — *"Vill du följa den här insamlingen och se när målet nås? Skapa ett konto med BankID — det tar 10 sekunder."* Donatorn kan ignorera det helt. Gåvan är redan klar.

**Koppling gäst → konto i efterhand:** Skapar en gäst senare ett konto med **samma e-postadress**, kan tidigare gästdonationer knytas till kontot. M6 äger den kopplingsmekaniken; M4 flaggar bara att gåvan ska bära e-posten som nyckel så att kopplingen *är möjlig*.

**Varför BankID för inloggade men inte för gäster:** Inloggning på plattformen sker med BankID (M6) — det är portvakten. Men en *donator* behöver inte den verifieringsnivån för att *ge*; det är *insamlaren* som måste KYC:as (M6), inte givaren. Att kräva BankID av varje givare vore att bygga en mur där research säger att vi ska bygga en öppen dörr.

**Kantfall:** Gäst anger en felstavad e-post → kvittot studsar. Mildring: e-postfältet har enkel formatvalidering, och checkout visar e-posten i bekräftelsen så donatorn kan upptäcka felet.
**Kantfall:** En person ger som gäst och är redan inloggad i en annan flik → vi behandlar varje donationssession för sig; ingen tvingad sammanslagning mitt i ett flöde.

## 3.4 Det frivilliga bidraget vid checkout

Vid checkout får donatorn ett **frivilligt erbjudande** att lägga till ett litet extra belopp som går till **föreningens drift** (inte till insamlingen).

- Detta är "optional tip"-modellen (research: GoFundMe, LaunchGood). Den **ersätter plattformsavgiften** — plattformen tar **0 kr** av insamlingens pengar (princip 1: 0 kr plattformsavgift).
- **Oförbockat.** Donatorn väljer aktivt att lägga till det. Standard är **inget bidrag**.
- Tydlig text: *"Sadaqa Sweden tar ingen avgift av insamlingen. Vill du stötta plattformens egen drift kan du lägga till ett valfritt bidrag — det går till [föreningen], inte till den här insamlingen."*
- **Den fullständiga mekaniken — hur bidraget skiljs från insamlingens pengar och styrs till föreningens konto — spikas i M5 Block 5.** M4 ansvarar bara för att *presentera* erbjudandet ärligt och oförbockat.

**Varför oförbockat och inte förvalt:** Ett förvalt tips är ett mörkt mönster i förklädnad. Det skulle ge mer pengar på kort sikt och kosta förtroende på lång sikt. Princip 6 (premium genom omsorg) och hela plattformens trygghetslöfte gör valet enkelt: donatorn ska *vilja* ge bidraget, aldrig upptäcka att hen råkat.

---

# BLOCK 4 — Kvitto & bekräftelse

Vad donatorn får i handen direkt efter gåvan. Detta ögonblick formar känslan: gjorde jag rätt? Gick det fram?

## 4.1 Bekräftelseskärmen

Direkt efter genomförd betalning visas en **bekräftelseskärm** — lugn, varm, inte ett kassakvitto.

**Innehåll:**

- En tydlig bekräftelse: *"Din gåva är mottagen. Jazak Allahu khayran."*
- Vad som gavs: belopp + ev. enheter, till vilken insamling.
- Undermål-valet, sammanfattat: *"Om målet inte nås går din gåva till projektet"* (eller "...återbetalas till dig").
- Insamlingens nya status — t.ex. en uppdaterad progress bar: *"Tack vare dig och 142 andra: 68 % av målet."*
- En diskret länk vidare — följ insamlingen (inloggad) eller skapa konto (gäst).

**Tonen är tacksamhet, inte transaktion.** Detta är en plats där premiumkänslan (princip 6) och den andliga ramen (princip 8) ska märkas tydligt. Ingen "Tack för ditt köp"-energi.

## 4.2 Kvittot

Donatorn får ett **kvitto** — alltid, oavsett gäst eller inloggad.

**Specifikation:**

- **Kanal:** e-post (alla) + i appen (inloggade, under donationshistorik, M9).
- **Format:** ett enkelt, läsbart e-postkvitto. PDF-bilaga för den som vill spara/skriva ut.
- **Innehåll:**
  - Donatorns namn (eller "Gästdonation" om gäst utan namn — men kvittot är aldrig anonymt *mot donatorn själv*).
  - Belopp i SEK, datum, tid.
  - Vilken insamling, insamlingens ID.
  - Betalmetod (Swish/kort).
  - Ett unikt **kvitto-/transaktions-ID** (kopplat till Stripe-charge, M5).
  - Mottagande part i juridisk mening — viktigt för 4.3.
  - Det frivilliga bidraget redovisas **separat** om sådant gavs ("Gåva till insamling: 700 kr. Frivilligt bidrag till plattformen: 20 kr.").
- Kvittot skickas **automatiskt** — ingen människa rör det (princip 3, 95 % självgående).

**Kantfall:** Kvitto till felstavad e-post studsar → studs loggas; inloggad donator har kvittot i appen ändå; gäst kan begära nytt kvitto via en länk på bekräftelseskärmen som visas en kort stund.

## 4.3 Skattekvitto / gåvoavdrag — vad vi lovar och inte lovar

Detta är en fråga donatorer kommer ställa, och vi ska svara **ärligt och rakt** — inte lova mer än plattformen kan hålla.

**Sakläget (svensk skatterätt, antagande — bekräftas, se Öppna frågor):**

- Skattereduktion för gåvor i Sverige förutsätter att **mottagaren är en av Skatteverket godkänd gåvomottagare**, och att gåvan uppfyller villkoren (bl.a. ett minsta gåvobelopp per gåva och per år).
- Det är **mottagaren** — föreningen eller insamlaren — som måste vara godkänd och som rapporterar gåvor till Skatteverket. Plattformen är inte mottagaren (M5 Block 6: pengarna passerar aldrig juridiskt genom plattformen).

**Beslut för v1:**

- Plattformen **lovar inte skatteavdrag generellt.** Att göra det vore att lova något vi inte kontrollerar.
- Plattformen **utfärdar alltid ett vanligt gåvokvitto** (4.2) — det är dokumentation på att gåvan skett, vem som gav, hur mycket, till vem.
- **Per insamling** kan ett fält finnas: *"Den här insamlingens mottagare är godkänd gåvomottagare hos Skatteverket — din gåva kan vara avdragsgill."* Det fältet är **synligt bara om insamlaren/föreningen styrkt det vid granskning** (M3). Default: fältet visas inte.
- Är fältet aktivt får donatorn information om vad som krävs (t.ex. att lämna personnummer så mottagaren kan rapportera). För en **inloggad** donator finns personnummer redan via BankID (M6); för en **gäst** krävs ett extra, frivilligt steg.

**Varför detta är rätt nivå:** Att bygga ett fullt skatteavdrags-flöde i v1 vore att bygga för ett fåtal godkända mottagare och riskera att vilseleda alla andra. Det ärliga är: alla får ett gåvokvitto; avdragsrätt visas bara där den faktiskt finns och är styrkt. Princip 4 ("vårt fel men inte dödligt") och princip 9 (transparens, inga falska löften) styr detta.

**Öppen fråga:** Exakta svenska beloppsgränser och rapporteringskrav för gåvoskattereduktion — ska verifieras mot aktuell skatterätt innan fältet aktiveras. Se avsnitt 9 och M8.

---

# BLOCK 5 — Efter donationen

Gåvan är inte slut när charge går igenom. Block 5 spikar relationen *efter* — det som gör en engångsgivare till en återkommande, och det som ibland gör en donator till en *medhjälpare*.

## 5.1 Att följa insamlingen

Efter en gåva kan donatorn **följa insamlingen** och se hur den utvecklas.

**Inloggad donator:**

- Insamlingen läggs automatiskt bland "Insamlingar jag stöttat" på profilen (M9).
- Donatorn ser uppdateringar, bevis och statusbyten i transparens-loopen (M7) — start-bevis, utbetalningsbevis, resultatbevis.
- Donatorn kan välja att även "följa" insamlingar hen *inte* gett till (vanlig följa-funktion, hör till M11/M13).

**Gästdonator:**

- Ingen profil att samla i. Men varje kvitto-e-post innehåller en **länk till insamlingens publika sida** — gästen kan när som helst klicka in och se status.
- Når insamlingen sitt mål, eller publiceras resultatbevis, *kan* en gäst få en e-postavisering — **bara om gästen aktivt tackat ja** till det vid donationen (en liten kryssruta, oförbockad). Annars ingen e-post. Princip: aldrig spam (M15).

## 5.2 Notiser

Notiser till donatorn ägs av **M15** — M4 definierar bara *vilka händelser* en gåva ska kunna utlösa.

| Händelse | Notis till donatorn | Default |
|---|---|---|
| Insamlingen nådde sitt mål | "Insamlingen du stöttade nådde målet 🎯" | På (inloggad), opt-in (gäst) |
| Insamlingen förlängd | "Insamlingen du stöttade har förlängts till [datum]" | På (inloggad), opt-in (gäst) |
| Resultatbevis publicerat | "Se vad din gåva blev — resultatet är här" | På (inloggad), opt-in (gäst) |
| Insamlingen utbetald till insamlaren | (Visas i transparens-loopen, ingen separat push) | — |
| Undermål → din gåva refunderas | "Insamlingen nådde inte målet — din gåva återbetalas" | **Alltid på** — detta rör donatorns pengar |
| Insamlingen pausad/nedstängd | "Viktig information om en insamling du stöttade" | **Alltid på** — detta rör donatorns pengar |

**Princip:** Notiser som rör **donatorns pengar** (refund, nedstängning) går alltid fram — de är inte marknadsföring, de är information donatorn har rätt till. Notiser som är *uppmuntran* (mål nått, resultat) är opt-in för gäster, på som default för inloggade, och alltid avstängbara. Allt detaljstyrs i M15.

## 5.3 "Erbjud praktisk hjälp utöver donation"

En insikt från M1 Block 1 Fält 6: hjälp-platsen kan trigga en **personlig koppling**. En donator som ger till en insamling i Mogadishu kan *själv* ha familj eller kontakter där.

**Specifikation:**

- På bekräftelseskärmen (Block 4) och på insamlingens sida visas — **diskret, aldrig påträngande** — ett erbjudande:
  > *"Har du en personlig koppling till [hjälp-platsen]? Insamlaren tar ibland emot praktisk hjälp utöver donationer — kontakter, kunskap, en hand på plats."*
- Klickar donatorn → ett enkelt formulär som skickar ett **meddelande till insamlaren** (inte en publik post). Insamlaren avgör själv om och hur hen svarar.
- Detta är **inte** en chatt, **inte** en marknadsplats för tjänster, **inte** ett krav på insamlaren att svara. Det är en tunn bro — "verktyg, inte polis" (princip 5) och "samordna befintlig godhet" (princip 13).
- Funktionen syns **bara** om insamlaren i wizarden (M2) aktivt sagt ja till att ta emot sådana erbjudanden. Default: av. En insamlare som inte vill ha det slipper helt.

**Varför detta är värt att bygga:** Det är billigt (ett formulär + ett meddelande), det kan inte missbrukas på något allvarligt sätt (insamlaren styr), och det förvandlar plattformen från en pengakanal till en **samordnare av godhet**. En donator som bidrar med en kontakt i Mogadishu har gett något pengar inte kan köpa. Det är exakt princip 13.

**Anti-kaos:** Meddelandena går genom samma innehållsfilter som community (M13). En insamlare som får olämpliga meddelanden kan stänga av funktionen och blockera avsändaren (M6).

## 5.4 Inbjudan att ge igen

- Inloggad donator: profilen (M9) och notiser (M15) kan föreslå relaterade insamlingar — *"Ahmed öppnade en ny iftar-insamling — vill du ge igen?"* (Masterkarta avsnitt 4, M15.)
- Detta är **uppmuntran, inte tjat.** Frekvensstyrning och opt-out bor i M15.
- M4:s roll: bara att se till att en gåva *kan* knytas till donatorns historik så att en relevant inbjudan över huvud taget är möjlig.

---

## 5. Designval & motivering (hela Modul 4)

| Beslut | Motivering |
|---|---|
| Belopp och per-enhet är samma charge, bara olika vy | "20 mattor" gör gåvan gripbar; "700 kr" är abstrakt. Att stödja båda komplicerar inte pengaflödet — Stripe ser bara ett belopp. Verkställer M1 Block 2 Fält 1. |
| Snabbvalsknappar med en mjukt förvald nivå | Tar bort beslutsångest, höjer genomsnittsgåvan — utan att pressa. Förvald ≠ tvingande. |
| Minsta gåva 20 kr | Under det äter Stripe-avgiften gåvan och microtransaktioner skapar refund-/bevis-strul. Lågt nog att ingen seriös givare stängs ute. |
| Undermål-valet default = "Ge ändå" | De flesta vill det (30k köper ändå mattor — princip 5). Friktionsfri default skyddar mot att donatorn fastnar. Verkställer M1 Block 2 Fält 4. |
| Tre nivåer av anonymitet | Mellannivån ("dold publikt, synlig för insamlaren") respekterar en faktisk islamisk motivering — sadaqah i tysthet. Inte över-engineering, utan andlig respekt (princip 8). |
| Gäst kan ge utan konto, bara e-post krävs | Att tvinga registrering innan en gåva förlorar donatorer. Research (GoFundMe) bekräftar. BankID-kravet gäller insamlaren (KYC), inte givaren — princip 12: målgrupp, inte mur. |
| Swish är obligatoriskt, inte ett tillval | En svensk muslimsk plattform utan Swish känns främmande. "SEK/Swish-nativ" är själva marknadsluckan (Masterkarta avsnitt 9). |
| Det frivilliga bidraget är oförbockat | Ett förvalt tips är ett mörkt mönster. Princip 6 (premium genom omsorg) + 0 kr plattformsavgift: donatorn ska vilja ge, aldrig upptäcka att hen råkat. |
| Inget generellt löfte om skatteavdrag | Plattformen är inte mottagaren och kontrollerar inte avdragsrätten. Avdragsfält visas bara där det är styrkt vid granskning. Princip 9: inga falska löften. |
| "Erbjud praktisk hjälp" är opt-in för insamlaren, default av | Funktionen är värdefull men ska aldrig påtvingas. Insamlaren äger sitt utrymme — princip 5 (verktyg, inte polis). |
| Pengar-relaterade notiser går alltid fram | Refund och nedstängning är information donatorn har rätt till, inte marknadsföring. Uppmuntrande notiser är opt-in/avstängbara. |

---

## 6. Kopplingar

**Modul 4 tar in:**

- Insamlings-objektet från **M1** — målmodell, enhetspris, deadline, övermåls-/undermålspolicy, hjälp-plats, status. Allt donatorn ser och väljer mot.
- Roller och konto-status från **M6** — är besökaren gäst eller inloggad; finns BankID-identitet.
- Betalnings-kapacitet från **M5** — vilka metoder, hur checkout fungerar tekniskt.

**Modul 4 lämnar ut:**

- **Donationen** som dataobjekt till **M1** (relationen "Donationer → insamling", M1 Block 4) och till **M5** (charge ska skapas).
- Undermål-valet per donation till **M5** — avgör om gåvan ska kunna refunderas.
- Donatorns publika synlighet + meddelande till **M13** (community — donatorlista, dua-flöde).
- Gåvan + donator-identitet till **M9** (donationshistorik på profilen, för inloggade).
- Händelser (mål nått, refund, resultat) som triggar **M15** (notiser).
- Personlig-koppling-meddelanden till insamlaren — gränssnitt mot **M2** (insamlarens inkorg).
- Det frivilliga bidraget — flaggat och separerat — till **M5 Block 5**.

**Hård beroende-flagga:** Block 3 (betalning) kan inte byggas färdigt förrän M5 spikat Stripe Checkout-uppsättningen. Block 2:s undermål-val är meningslöst utan M5:s refund-mekanik. M4 planeras klart nu; bygget av Block 2–3 väntar på M5.

---

## 7. Säkerhet & anti-kaos

- **Betalning sker hos Stripe** — plattformen hanterar aldrig kortnummer eller känslig betaldata själv. PCI-ansvaret ligger där det ska (Stripe). Princip 13: samordna befintlig godhet.
- **Inga mörka mönster** — inga förbockade extra avgifter, inget förvalt tips. Det enda frivilliga påslaget presenteras öppet och oförbockat.
- **Minsta gåva 20 kr** stänger ute microtransaktioner som annars kan användas för att testa stulna kort eller skapa brus.
- **Mycket stor enskild gåva** (riktmärke >50 000 kr) flaggas internt för admin — penningtvätts-medvetenhet (samordnas med M5/M16).
- **Publika meddelanden filtreras** — samma innehållsfilter som M13. Insamlaren kan dölja olämpliga meddelanden på sin insamling.
- **Gästdonationer kräver giltig e-post** — så att refund och kvitto kan nå donatorn.
- **Undermål-valet är låst per donation** — kan inte ändras i efterhand av någon, vilket skyddar både donatorns vilja och insamlarens förutsägbarhet.
- **"Erbjud praktisk hjälp"** kan inte missbrukas allvarligt — insamlaren styr om funktionen finns, vem som svaras, och kan blockera avsändare.
- **Anonymitet läcker inte** — en anonym donators namn visas aldrig publikt, och vid "anonym utåt" ser insamlaren namnet bara för att hen aktivt fått den rätten.

## 8. Automatisering

**Självgående (ingen människa):**

- Hela donationsflödet — belopp/enheter, val, betalning, charge.
- Kvitto genereras och skickas automatiskt.
- Bekräftelseskärm och progress bar uppdateras direkt.
- Undermål-valet sparas och verkställs automatiskt av M5 vid deadline.
- Notiser triggas automatiskt av händelser (M15).
- Gäst → konto-koppling sker automatiskt vid matchande e-post.
- Innehållsfilter på meddelanden körs automatiskt.

**Kräver människa:**

- Granskning av flaggade publika meddelanden som filtret inte är säkert på.
- Insamlaren beslutar om att dölja ett meddelande.
- Admin tittar på en flaggad mycket stor gåva.
- Aktivering av skatteavdrags-fältet (styrks vid granskning, M3).

Riktmärke: en donation från knapptryck till kvitto rör **ingen människa alls**. Det är 95 %-principen i ren form.

## 9. Öppna frågor

1. **Apple Pay / Google Pay i v1?** Stripe stödjer dem nästan utan extra arbete. Antagande: trolig "lätt på" men inget byggkrav. Bekräftas mot M5.
2. **Exakt presentation av Stripe Checkout** — hostad sida vs inbäddad komponent — påverkar hur sömlös betalningen känns. → spikas i **M5**.
3. **Skatteavdrag:** exakta svenska beloppsgränser, vilka mottagare som kvalificerar, och rapporteringsflödet till Skatteverket. Antagande i Block 4.3 ska verifieras mot aktuell skatterätt. → **M8** + skatterådgivning.
4. **Frivilliga bidragets exakta mekanik** (hur det skiljs från insamlingens pengar och styrs till föreningens konto) → spikas i **M5 Block 5**.
5. **Återkommande gåvor** (donatorn ger automatiskt varje månad) — hör ihop med den parkerade "mission"-arkitekturen (M1 Block 4.3). Inte v1.
6. **Tröskel för "mycket stor gåva"-flagg** (riktmärke 50 000 kr) → bekräftas tillsammans med M5 och M16.

## Parkering — Match-funding (GiveMatch-modellen)

En match-funding-funktion (en sponsor lovar att matcha varje krona upp till ett tak; ger viral referral-effekt) är **medvetet avfärdad för v1**.

- **Varför parkerad:** Den kräver ett **tredjepartsåtagande** — en sponsor som juridiskt och praktiskt förbinder sig att skjuta till matchande medel. Det komplicerar pengaflödet (M5) avsevärt: vem håller matchningsmedlen, vad händer om sponsorn inte betalar, hur visas en matchad gåva för donatorn. Research (GiveMatch, Masterkarta avsnitt 9) bekräftar både potentialen *och* komplexiteten.
- **Varför ändå nämnd:** Det är en stark tillväxtmekanik värd att återkomma till. Datamodellen för en donation bör inte aktivt *hindra* en framtida matchnings-koppling — men inget byggs för det nu.
- **Hör hemma:** ett framtidsspår, planeras tidigast efter att Kärnan är stabil. Pengaflödes-konsekvenserna måste då lösas i M5 först.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 4:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (donationsögonblicket), Block 2 (donatorns val), Block 3 (betalning), Block 4 (kvitto & bekräftelse), Block 5 (efter donationen) nyskrivna. Match-funding parkerad. Verkställer M1 Block 2:s donator-styrda val. |
