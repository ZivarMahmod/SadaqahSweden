# Modul 15 — Notiser & kommunikation

**Lager:** 🔵 Världen runtom — men **tvärgående** (triggas av nästan alla moduler)
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`, `Modul-07-Transparens-loopen.md`, alla moduler som triggar notiser

---

## 1. Vad modulen är

Modul 15 definierar **hur plattformen når användaren** — varje e-post, varje push-notis, varje in-app-notis. Den säger *vilka kanaler* som finns, *vad* som triggar en notis, *när* en kanal används, och *hur användaren styr* vad hen får.

**Den löser:** En plattform som inte hörs av sina användare glöms bort — en donator som gav för tre veckor sedan vet inte att resultatbeviset just kom. Men en plattform som hörs *för mycket* blir avstängd, ignorerad, avregistrerad. M15 är balanspunkten: nå användaren, **aldrig spamma hen.**

**Den löser inte:** Innehållet i notiserna ägs av modulerna som triggar dem (M7 äger vad ett resultatbevis säger). M15 äger *leveransen* — kanal, timing, frekvens, samtycke.

---

## 2. Varför den behövs

Tre saker faller om notiser görs slarvigt:

- **Återkopplingen.** Princip 8 säger: *bygg för det andliga idealet, respektera den mänskliga svagheten — människan i dunya behöver återkoppling.* En donation utan kvitto, ett resultatbevis ingen får veta om — den mänskliga svagheten lämnas utan svar.
- **Premiumkänslan.** Princip 6: premium genom omsorg. En notis som kommer i rätt stund med rätt ton känns *omtänksam*. En notis som kommer fel känns billig och påträngande. Notiser är en av de tydligaste platserna där premium vinns eller förloras.
- **Förtroendet.** Spam dödar förtroende snabbare än nästan något annat. En plattform som mejlar fem gånger i veckan blir "ännu en avsändare jag filtrerar bort". Då tappar vi även de notiser som faktiskt betyder något.

Rakt sagt: **den största risken i den här modulen är inte att vi notifierar för lite — det är att vi notifierar för mycket.** Hela M15 är designad mot den risken.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Kanaler — e-post, push, in-app, och när var och en används | ✅ Spikad |
| 2 | Notistyper — vad som triggar en notis, modul för modul | ✅ Spikad |
| 3 | Opt-in & frekvens — hur användaren styr, digest mot spam | ✅ Spikad |
| 4 | Transaktionella vs engagemang-notiser — skillnaden, vad som alltid skickas | ✅ Spikad |
| 5 | Återkommande-donator-notiser — "ny cykel öppnad — vill du ge igen?" | ✅ Spikad |

---

# BLOCK 1 — Kanaler

Tre kanaler. Varje kanal har en tydlig roll — de överlappar inte godtyckligt.

## 1.1 De tre kanalerna

| Kanal | Vad den är | Räckvidd | Påträngande? |
|---|---|---|---|
| **In-app-notis** | En notisklocka inne på plattformen — en lista som väntar tills användaren kommer in | Bara aktiva besökare | Minst — användaren kom självmant |
| **E-post** | Mejl till användarens registrerade adress | Alla med konto + gäster med kvitto | Medel — kan läsas när det passar |
| **Push-notis** | Avisering på telefon/dator även när plattformen är stängd | Bara de som aktivt sagt ja | Mest — avbryter användaren |

## 1.2 När varje kanal används

Grundregeln: **ju mer påträngande kanalen är, desto högre tröskel för att använda den.**

**In-app-notis — används brett.**
- Allt som rör användaren samlas här: granskningsbeslut, ny donation till min insamling, ny uppdatering på en insamling jag följer, badge tilldelad.
- Det är "minnesytan" — väntar tålmodigt tills användaren loggar in. Den kan vara generös eftersom den aldrig avbryter.

**E-post — används för det som är viktigt eller måste dokumenteras.**
- **Allt transaktionellt** (Block 4): kvitto, granskningsbeslut, utbetalningsbesked. E-post ger ett spårbart, sparbart kvitto.
- **Sammanfattningar/digest** (Block 3): "Det här hände den här veckan."
- Aldrig styckvisa engagemang-mejl — sådant går i digest eller in-app.

**Push-notis — används snålt, bara för det tidskänsliga och personliga.**
- En insamling **du själv driver** når sitt mål.
- En insamling **du själv driver** kräver din åtgärd (granskaren begärde ändring).
- En insamling **du följer** levererade sitt resultatbevis.
- **Aldrig** för: events (M14, uttryckligt beslut), allmänna tips, "kolla in nya insamlingar".

**Designval — push är ett privilegium, inte en standardkanal.** Push avbryter användaren i hens liv. Vi använder den bara när informationen är både **tidskänslig** och **personligt relevant**. Allt annat tål att vänta i in-app-listan eller ett mejl. Det är premium genom omsorg: en plattform som pushar sällan, men alltid om något som faktiskt angår dig, blir en plattform vars push man inte stänger av.

## 1.3 Kanalval per notis

Varje notistyp i Block 2 har en **standarduppsättning kanaler**. Användaren kan i inställningarna (Block 3) snäva åt — men aldrig vidga en transaktionell notis bort (Block 4). Faller en kanal (push ej tillåten av användaren) levereras notisen ändå via in-app, och vid behov e-post.

## 1.4 SMS

**SMS finns inte i v1.** Resonemang: SMS kostar per meddelande, kräver en separat leverantör, och uppfattas i Sverige som mer privat/påträngande än de tre kanalerna ovan. Push täcker behovet av "nå telefonen". Parkerat — se Öppna frågor.

---

# BLOCK 2 — Notistyper

Vad som triggar en notis, **modul för modul.** Detta är M15:s kärntabell — den visar att M15 är tvärgående: nästan varje modul matar den.

## 2.1 Notistabellen

Kolumnen **Typ**: **T** = transaktionell (skickas alltid, se Block 4), **E** = engagemang (opt-in).
Kanaler: **A** = in-app, **M** = e-post, **P** = push.

| # | Trigger | Källmodul | Mottagare | Typ | Standardkanaler |
|---|---|---|---|---|---|
| 1 | Insamling inskickad — mottagningsbekräftelse | M3 | Insamlaren | T | A, M |
| 2 | Granskningsbeslut: **godkänd** | M3 | Insamlaren | T | A, M, P |
| 3 | Granskningsbeslut: **ändring begärd** | M3 | Insamlaren | T | A, M, P |
| 4 | Granskningsbeslut: **avvisad** | M3 | Insamlaren | T | A, M |
| 5 | Donation mottagen — **kvitto** | M4/M5 | Donatorn | T | M (A om inloggad) |
| 6 | Ny donation till min insamling | M4 | Insamlaren | E | A |
| 7 | Min insamling nådde målet | M1/M5 | Insamlaren | E (men hög prioritet) | A, P |
| 8 | Insamling jag följer: **ny uppdatering** | M7 | Följare | E | A |
| 9 | Insamling jag följer/stöttat: **resultatbevis levererat** | M7 | Donatorer + följare | E (men viktig) | A, P |
| 10 | Insamling jag stöttat: **förlängd** | M1 | Tidigare donatorer | E | A, M |
| 11 | Insamling jag stöttat: **utbetald till insamlaren** | M5 | Tidigare donatorer | E | A |
| 12 | **Utbetalningsbesked** — pengar på väg till mitt konto | M5 | Insamlaren | T | A, M |
| 13 | **Refund verkställd** (undermål, "återbetala mig") | M5 | Donatorn | T | A, M |
| 14 | Badge tilldelad | M7 | Insamlaren | E | A, P |
| 15 | Kommentar/dua på min insamling | M13 | Insamlaren | E | A |
| 16 | Min kommentar fick svar | M13 | Kommentaren | E | A |
| 17 | Påminnelse: resultatbevis saknas (genomförandedatum nått) | M7 | Insamlaren | T | A, M |
| 18 | Påminnelse: utkast/ändring obesvarad, snart arkiverat | M1/M2 | Insamlaren | T | A, M |
| 19 | Insamling jag stöttat: status `avslutad_levererad` | M7 | Donatorer | E | A |
| 20 | Mitt konto/KYC kräver en åtgärd | M6 | Användaren | T | A, M |
| 21 | Säkerhet: ny inloggning, kontoändring | M6 | Användaren | T | A, M |
| 22 | Förening: ert katalog-konto godkänt/avvisat | M10 | Föreningskontot | T | A, M |
| 23 | Förening: någon vill samarbeta (collab) på en insamling | M10 | Föreningskontot | E | A, M |
| 24 | Event publicerat/avvisat | M14 | Arrangören | T | A, M |
| 25 | **Engagemang-digest** — "det här hände den här veckan" | M15 (samlar M11, M14) | Användaren | E | M |
| 26 | Återkommande donator: **ny cykel öppnad** | M1 framtidsspår | Tidigare donatorer | E | A, M |

## 2.2 Vad tabellen visar

- **M15 är tvärgående.** 12 olika moduler matar in i tabellen. Det bekräftar masterkartan: "Notiser triggas av händelser i nästan sagt alla andra moduler."
- **Push används bara på 5 rader** (2, 3, 7, 9, 14) — alla tidskänsliga *och* personliga. Aldrig på events, aldrig på allmänna tips.
- **Transaktionellt går alltid via e-post** — det ska finnas ett spårbart kvitto.
- **Det mesta engagemang stannar in-app** — den icke-påträngande kanalen bär huvuddelen.

## 2.3 Designprincip för notistexten

Varje notis ska kännas som **en omtänksam upplysning, inte en uppmaning eller ett krav.** Ton:

- **Granskningsbeslut:** rakt och respektfullt, aldrig nedlåtande — även "avvisad" skrivs med värdighet.
- **Resultatbevis levererat:** glädje, inte transaktion — *"Insamlingen du stöttade har levererat sitt resultat. Här är beviset."*
- **Påminnelser:** mjuka, "verktyg, inte polis" — *"Genomförandedatumet har passerat. När du har resultatet, ladda gärna upp det här."* Aldrig anklagande.

Innehållet ägs av källmodulen; M15 sätter **tonramen** så att hela plattformen låter likadant.

---

# BLOCK 3 — Opt-in & frekvens

Hur användaren styr vad hen får. **Aldrig spam** — det är inte en ambition, det är en designspärr.

## 3.1 Notisinställningar — användaren bestämmer

Varje konto har en **notispanel**. Strukturen är medvetet enkel (läsaren har ADHD — inga 40 kryssrutor):

- **Grupperade kategorier**, inte en rad per notistyp. Användaren ställer in *grupper*:
  - "Mina insamlingar" (allt om insamlingar jag driver)
  - "Insamlingar jag stöttat" (uppdateringar, resultat, förlängningar)
  - "Community" (kommentarer, dua)
  - "Upptäck nytt" (digest, tips — ren engagemang)
- **Per grupp** väljer användaren: kanaler (in-app / e-post / push) på eller av.
- **Transaktionella notiser visas men kan inte stängas av** (Block 4) — de står i panelen som "Alltid på" med en kort förklaring varför.

**Designval — grupper, inte en kryssruta per notistyp.** 26 notistyper × 3 kanaler = 78 reglage. Det är en mardröm för vem som helst, särskilt för en användare med ADHD. Fyra begripliga grupper räcker. Princip 6, premium genom omsorg: en inställningssida ska kännas lugn, inte överväldigande.

## 3.2 Smarta defaults

De flesta ändrar aldrig sina inställningar. Därför måste **defaults vara rätt från start:**

- **Transaktionellt:** alla kanaler dess standard (Block 2-tabellen) — på, går inte att stänga.
- **"Mina insamlingar":** på, alla kanaler — om du driver en insamling vill du veta vad som händer med den.
- **"Insamlingar jag stöttat":** in-app + e-post på, push av — du vill veta, men inte bli avbruten.
- **"Community":** in-app på, e-post + push av.
- **"Upptäck nytt":** in-app av, **digest-mejl på** (en lugn veckosammanfattning), push av.

Resultatet: en ny användare som aldrig rör inställningarna får exakt rätt mängd — det viktiga når fram, inget brus.

## 3.3 Digest — sammanslagning mot överbelastning

Det enskilt viktigaste anti-spam-verktyget.

- **Engagemang-notiser med låg brådska buntas ihop** till ett samlat meddelande i stället för att skickas styckvis.
- **In-app:** notisklockan grupperar — *"3 nya donationer till din insamling"* i stället för tre separata rader.
- **E-post-digest:** en **veckovis** sammanfattning (notistyp 25): nya insamlingar i kategorier du följer, kommande events nära dig, uppdateringar du missat. Ett mejl — inte tjugo.
- **Frekvensspärr:** även om många saker händer på en dag får plattformen **aldrig** skicka fler än ett digest-mejl per dygn. Hård regel i koden, inte en riktlinje.

**Designval — digest är default för engagemang.** En aktiv insamling kan generera tio händelser om dagen. Tio separata mejl = avregistrering. Ett digest = en trevlig veckopuls. Sammanslagning skyddar både användaren och plattformens leveransbarhet (e-postdomänens rykte).

## 3.4 Avregistrering

- Varje engagemang-mejl har en **tydlig avregistreringslänk** (lagkrav, och rätt sak att göra).
- Avregistrering ska vara **ett klick** — ingen "är du säker"-tröskel, ingen utloggning krävs.
- Transaktionella mejl har ingen avregistrering (de är en del av tjänsten, inte marknadsföring) — men de innehåller en länk till notispanelen.

**Att göra avregistrering svår är anti-premium.** En användare som lätt kan dämpa oss men väljer att stanna är värd tio som är fast. Princip: verktyg, inte polis — det gäller även vår relation till användaren.

## 3.5 Tysta timmar

- Push-notiser skickas **inte** mellan 22:00 och 08:00. Köas och levereras på morgonen.
- Undantag: säkerhetsnotiser (ny inloggning, notistyp 21) — de är tidskänsliga på riktigt.
- E-post och in-app har inga tysta timmar (de avbryter inte).

---

# BLOCK 4 — Transaktionella vs engagemang-notiser

Den viktigaste begreppsskillnaden i modulen. Den avgör vad användaren kan stänga av — och vad hen aldrig kan.

## 4.1 De två slagen

| | **Transaktionell** | **Engagemang** |
|---|---|---|
| **Vad** | Information användaren *behöver* — en konsekvens av en handling hen gjort | Information som *lockar tillbaka* — något hen kan vara intresserad av |
| **Exempel** | Kvitto, granskningsbeslut, utbetalningsbesked, refund, säkerhetsnotis, KYC-åtgärd | Ny insamling i min kategori, kommentar, badge, event-digest |
| **Samtycke** | **Skickas alltid.** Kan inte stängas av | **Opt-in.** Användaren styr fritt |
| **Varför** | Användaren har rätt att få veta vad som hände med sina pengar / sitt konto | Trevligt, inte nödvändigt — får aldrig påtvingas |
| **Kanal** | Alltid e-post (spårbart kvitto) + in-app | Mest in-app, digest-mejl, sällan push |

## 4.2 Regeln

> **Transaktionella notiser skickas alltid — de är en del av tjänsten.** Att stänga av kvittot vore som att stänga av kvittot i en butik. Engagemang-notiser är opt-in — de lockar, och det man lockas av väljer man själv.

Detta är inte bara hänsyn — det är delvis **lagkrav**. Ett donationskvitto och ett besked om att pengar är på väg är information användaren har rätt till. En marknadsförande "kolla in den här nya insamlingen" kräver samtycke (GDPR/marknadsföringsregler — detaljer bor i M8).

## 4.3 Gränsfall — när det inte är uppenbart

Vissa notiser ligger i gränslandet. Beslut:

| Notis | Klassad som | Motivering |
|---|---|---|
| Resultatbevis levererat på insamling jag stöttat (typ 9) | **Engagemang**, men hög prioritet | Det är inte ett krav att jag får veta — men det är hela poängen med transparens-loopen, så det får push som default och stängs sällan av |
| Insamling jag stöttat förlängd (typ 10) | **Engagemang** | Trevligt att veta, inte nödvändigt. Opt-in, men på som default |
| Påminnelse: ditt resultatbevis saknas (typ 17) | **Transaktionell** | Det är en konsekvens av insamlarens eget åtagande — hen *behöver* veta att klockan tickar |
| Badge tilldelad (typ 14) | **Engagemang** | Ren glädje-/återkopplingsnotis. Princip 8: bär det tvivlande hjärtat — men ingen *behöver* den |

**Princip vid tvivel:** Är notisen en *konsekvens av en handling användaren gjort, som hen har rätt att få veta*? → transaktionell. Är den *en inbjudan att engagera sig*? → engagemang. Tveka mot engagemang — det skyddar användaren från påtvingade utskick.

## 4.4 Vad transaktionellt aldrig får bli

Rakt sagt — en vanlig och ful fälla: att smyga in marknadsföring i ett transaktionellt mejl. Ett kvitto-mejl med "Förresten, här är tre andra insamlingar du borde ge till!" är **förbjudet i v1**. Transaktionella mejl håller sig till sitt ärende. Det skyddar förtroendet och håller den juridiska gränsen ren. Vill vi visa fler insamlingar finns digesten och plattformen själv — för det har användaren sagt ja.

---

# BLOCK 5 — Återkommande-donator-notiser

Den notisklass som kopplar mest direkt till plattformens framtid: **mission-konceptet** (M1 Block 4.3 — återkommande insamlingar).

## 5.1 Vad det är

En **mission** är en pågående insats ("Mat till föräldralösa i Mogadishu") som öppnar en ny insamlings-*cykel* varje månad. En donator gav i cykel 3. Cykel 4 öppnar nu. Den här notisklassen är hur vi mjukt frågar: *"Vill du ge igen?"*

> *"Ahmed öppnade en ny cykel — vill du ge igen?"*

Detta är inte ett autogiro. Donatorn drogs aldrig per automatik — hen **bjuds in**, och väljer fritt. Det är skillnaden mellan en prenumeration (passiv) och en återkommande gåva (aktiv, medveten varje gång).

## 5.2 Notiserna i denna klass

| Trigger | Mottagare | Kanal | Ton |
|---|---|---|---|
| Ny cykel öppnad i en mission jag tidigare gett till | Tidigare cykel-donatorer | A, M | Varm inbjudan, aldrig press: *"En ny cykel av [mission] har öppnat. Vill du vara med igen?"* |
| Mission levererade resultat för en cykel jag gav till | Den cykelns donatorer | A, P | Glädje + kvitto på att gåvan landade: *"Maten du var med och betalade har delats ut. Här är beviset."* |
| Insamling jag stöttat **förlängd** | Tidigare donatorer | A, M | Lugn upplysning (notistyp 10) |
| Insamling jag stöttat **levererade resultat** | Tidigare donatorer | A, P | Hela transparens-loopens belöning (notistyp 9) |

## 5.3 Varför detta är värt en egen block

- **Återkommande givare är plattformens ryggrad.** En engångsdonator ger en gång. En återkommande givare bär en mission år efter år. Att vårda den relationen är att vårda plattformens överlevnad.
- **Det stänger transparens-loopen.** Princip 8 och 9: människan behöver återkoppling. Att den som gav i cykel 3 får se *resultatet* av cykel 3 — och därför känner sig trygg att ge i cykel 4 — är hela loopen i ett enda andetag.
- **Det är premium genom omsorg.** En notis som säger "tack för att du var med, här är vad det blev, och här är nästa möjlighet" känns omtänksam. Den känns som en relation, inte en transaktion.

## 5.4 Spärrar mot att detta blir nag

Återkommande-notiser har en uppenbar risk: att bli tjat. Konkreta spärrar:

- **En notis per ny cykel — inte fler.** Öppnas cykel 4 får tidigare donatorn *en* inbjudan. Ger hen inte → **ingen påminnelse**, ingen "du missade att ge". Tystnad är ett svar och respekteras.
- **Resultatet skickas före nästa inbjudan.** En donator får alltid se resultatet av sin förra gåva *innan* hen bjuds in att ge igen. Aldrig "ge igen" innan vi visat vad förra gåvan blev. Det vore att be om förtroende man inte förtjänat ännu.
- **Opt-out per mission.** En donator kan säga "sluta berätta om just den här missionen" utan att lämna alla notiser.
- **Faller under "Insamlingar jag stöttat"-gruppen** (Block 3) — samma reglage, ingen extra notiskanal smygs in.

## 5.5 Förhållande till M1:s framtidsspår

Mission-konceptet är **parkerat till efter v1** (M1 Block 4.3). Därför:

- Notistyperna i 5.2 som rör **mission specifikt** (rad 1–2) är planerade men aktiveras när mission-funktionen byggs.
- Notistyperna som rör **vanliga insamlingar** (förlängd, resultat levererat — rad 3–4) finns **i v1** — de kräver ingen mission, bara en insamling och en lista tidigare donatorer.
- **Datamodellen i M15 förbereds för mission-notiser från start** — samma princip som M1:s `mission_id`-fält: bygg uttaget nu, aktivera funktionen senare. Ingen migrering ska behövas.

---

## 5. Designval & motivering (hela Modul 15)

| Beslut | Motivering |
|---|---|
| Tre kanaler med tydligt skilda roller (in-app brett, e-post för viktigt/dokumenterat, push snålt) | Ju mer påträngande kanal, desto högre tröskel. Användaren ska aldrig känna sig jagad. |
| Push bara för tidskänsligt + personligt (5 av 26 notistyper) | Push avbryter användaren i hens liv. En plattform som pushar sällan men alltid relevant blir en man inte stänger av. |
| Inget SMS i v1 | Kostar per meddelande, kräver egen leverantör, uppfattas som mest privat. Push täcker behovet. Parkerat. |
| Notisinställningar grupperade i 4 kategorier, inte 78 reglage | Läsaren har ADHD; alla användare mår bra av enkelhet. Premium = en lugn inställningssida. |
| Smarta defaults — rätt mängd utan att användaren rör något | De flesta ändrar aldrig inställningar. Defaulten ÄR upplevelsen för majoriteten. |
| Digest som default för engagemang, max 1 digest-mejl/dygn | Tio styckvisa mejl = avregistrering. Ett digest = en trevlig veckopuls. Skyddar även e-postdomänens rykte. |
| Transaktionella notiser kan aldrig stängas av | Kvitto, utbetalningsbesked, refund — användaren har rätt att veta vad som hände med pengarna. Delvis lagkrav. |
| Engagemang-notiser är alltid opt-in | Det man lockas av väljer man själv. Påtvingad marknadsföring dödar förtroende. |
| Ingen marknadsföring i transaktionella mejl | Att smyga in "ge till dessa också" i ett kvitto bryter förtroendet och den juridiska gränsen. Förbjudet. |
| Ett-kliks avregistrering, ingen tröskel | Att göra avregistrering svår är anti-premium. Verktyg, inte polis — gäller även vår relation till användaren. |
| Tysta timmar för push (22–08), undantag säkerhet | Att väcka någon för en badge är respektlöst. Premium genom omsorg. |
| Återkommande-donator: en inbjudan per cykel, aldrig påminnelse | Tystnad är ett svar. "Du missade att ge" är nag, inte omsorg. |
| Resultat skickas alltid före nästa inbjudan | Be aldrig om förtroende (ny gåva) innan du visat vad förra gåvan blev. Stänger transparens-loopen. |
| Mission-notiser planeras nu, aktiveras med mission-funktionen | Samma princip som M1:s `mission_id` — bygg uttaget nu, slipp migrera senare. |

---

## 6. Kopplingar

**Modul 15 tar in** (triggers — modulen är tvärgående, nästan allt matar den):

- Granskningsbeslut och kö-händelser från **M3** (notistyp 1–4).
- Donationer och kvitto-data från **M4**.
- Utbetalning, refund, charge-status från **M5** (notistyp 5, 12, 13).
- Insamlingens livscykel-händelser (mål nått, förlängd, status) från **M1**.
- Konto-, KYC- och säkerhetshändelser från **M6** (notistyp 20, 21).
- Uppdateringar, bevis, badges från **M7** (notistyp 8, 9, 14, 17, 19).
- Katalog- och collab-händelser från **M10** (notistyp 22, 23).
- Kommentarer och dua från **M13** (notistyp 15, 16).
- Event publicerat/avvisat och event-data för digest från **M14** (notistyp 24, 25).
- Mission-cykel-händelser från **M1 framtidsspår** (notistyp 26).
- Discovery-data (nya insamlingar i en kategori) från **M11** för digesten.

**Modul 15 lämnar ut:**

- Levererade notiser till **användaren** över tre kanaler.
- Notispreferenser som **M9** (profil) och M6 kan visa/hantera i kontoinställningar.
- Leverans- och öppningsstatistik till **M16** (admin-dashboard) — hur många notiser, leveransbarhet, avregistreringsgrad.

**Designnot:** M15 ska byggas som en **central notistjänst** — alla moduler skickar en händelse *till* M15, och M15 ensam avgör kanal, timing, digest och samtycke. Ingen annan modul skickar mejl direkt. Det är så reglerna i Block 3 och 4 kan garanteras på ett ställe i stället för att varje modul måste komma ihåg dem.

---

## 7. Säkerhet & anti-kaos

- **Spam-spärr i koden, inte som riktlinje** — max 1 digest-mejl/dygn, en mission-inbjudan per cykel: hårda regler i den centrala notistjänsten.
- **Transaktionellt går alltid fram** — ingen kan av misstag konfigurera bort ett kvitto eller ett utbetalningsbesked.
- **Samtycke hålls på ett ställe** — den centrala notistjänsten kontrollerar opt-in före varje engagemang-notis; ingen modul kan kringgå det.
- **Avregistrering respekteras omedelbart** — ett klick, ingen fördröjning, ingen mörk-mönster-tröskel.
- **Ingen marknadsföring i transaktionella mejl** — håller den juridiska gränsen (GDPR, marknadsföringsregler — M8) ren.
- **Leveransbarhet skyddas** — genom att inte spamma håller plattformens e-postdomän gott rykte; viktiga mejl hamnar inte i skräpposten.
- **Säkerhetsnotiser prioriteras** — ny inloggning/kontoändring kringgår tysta timmar; en kontokapning ska upptäckas direkt.
- **Notisinnehåll läcker inte** — en notis avslöjar bara det mottagaren har rätt att se (per-fält integritet, princip 2); t.ex. en donations-notis till insamlaren visar inte en anonym donators namn.

## 8. Automatisering

**Självgående (ingen människa):** all notisleverans — varje rad i Block 2-tabellen triggas av en systemhändelse och skickas utan att någon trycker på en knapp. Digest-sammanslagning, frekvensspärr, tysta timmar-köning, kanalval, opt-in-kontroll, avregistreringshantering, mission-inbjudningar.

**Kräver människa:** i princip ingenting i den löpande driften. Det enda en människa rör är **mallarna** — texten och tonen i varje notistyp skrivs en gång (av Zivar/teamet) och justeras sällan. Ändras en mall gäller den alla framtida notiser av den typen.

Riktmärke: M15 är en av plattformens mest självgående moduler — 100 % av leveransen är automatisk. Det är 95 %-självgående-principen i renaste form: en plattform som pratar med tusentals användare utan att Zivar skickar ett enda meddelande för hand.

## 9. Öppna frågor

1. **SMS som fjärde kanal** — parkerat. Bedöms om push-täckningen visar sig otillräcklig (t.ex. för äldre användare utan app-aviseringar påslagna).
2. **Exakt digest-frekvens** — v1 är veckovis. Om användardata visar att vissa vill ha dagligt eller månatligt kan en frekvensväljare läggas till i notispanelen.
3. **Notisspråk** — v1 är svenska genomgående. Om en betydande del av användarna föredrar annat språk (arabiska, engelska, somaliska) bedöms flerspråkiga notismallar — koppling till en bredare språkfråga för hela plattformen.
4. **In-app-notisernas livslängd** — hur länge en läst notis ligger kvar i klockan innan den auto-arkiveras. Riktmärke 60 dagar; finjusteras.
5. **Mission-notisernas exakta utformning** — aktiveras med mission-funktionen (M1 framtidsspår); texten spikas då tillsammans med M1.
6. **Leveransleverantör för e-post** — vilken tjänst (t.ex. transaktionell e-postleverantör) som används är ett tekniskt val för implementeringsplanen, inte för planeringen.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 15:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Alla 5 block spikade: kanaler, notistyper (26-raders tvärgående tabell), opt-in & frekvens (digest, smarta defaults), transaktionellt vs engagemang, återkommande-donator-notiser kopplade till mission-konceptet. |
