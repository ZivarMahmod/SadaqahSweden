# Beredskapsplan

**Plattform:** Sadaqa Sweden
**Datum:** 2026-05-23
**Status:** Första versionen. Flaggad av extern granskning (FORGE) som saknad del.
**Typ:** Operativt stöddokument — inte en modul. Följer inte modulmallen.

---

## 1. Vad detta dokument är

De 16 modulerna beskriver hur plattformen **ska** fungera. Det här dokumentet beskriver vad vi gör **när verkligheten slår till** — när en bank stänger kontot, när Stripe fryser pengarna, när en fejk-insamling slunkit igenom, när Zivar blir sjuk.

Det är inte en modul. Det är en **beredskapsplan**. Du läser den inte för att bygga något — du läser den så att den dagen något går sönder finns det redan ett papper som säger vad som händer och vem som gör vad.

> **En mening:** Planera för det dåliga nu, lugnt, så att vi slipper improvisera under press senare.

### Grundhållningen — spårbarhet och grindvakt som försäkring

Plattformens största existentiella risk är **debanking**: att en bank eller betalprocessor stänger vårt konto, ofta utan motivering. Svenska banker och Stripe har återkommande gjort just detta mot muslimska föreningar och insamlingar.

Vi kan inte göra oss immuna mot det. Men vi kan göra oss till **det svåraste tänkbara målet**. Grundarens övertygelse — och ryggraden i hela bank-avsnittet:

> **Vårt bästa försvar mot debanking är radikal spårbarhet och sträng grindvakt.**
> Varje krona är spårbar. Varje insamlare är BankID-verifierad (M6). Varje projekt är granskat av en människa innan publicering (M3). Inget når allmänheten ogranskat.
> **"Vi är den mest transparenta, mest spårbara aktören i rummet — det är vår försäkring."**

Plattformen släpper **inte** in vem som helst för vad som helst. Det är inte en begränsning — det är skölden. När en bank ställer frågor ska svaret vara en pärm, inte en axelryckning.

Detta är inte finansiell eller juridisk rådgivning. På flera ställen nedan står **"verifiera själv"** — det betyder: ring banken, begär offert, prata med jurist. Gör det.

---

## 2. Bankberedskap

### Risken

En bank kan säga upp föreningens konto med kort varsel, ofta utan att ange skäl. För en insamlingsplattform är ett stängt bankkonto inte ett besvär — det är **driftstopp**. Pengar fastnar, utbetalningar stannar, förtroendet skadas.

### Grundregeln: aldrig all ekonomi på ett konto

**Från dag 1 — flera bankkonton parallellt.** Inte ett konto med en reservplan i huvudet. Faktiska, öppnade, fungerande konton hos **minst två separata banker**.

- **Konto A** — driftskonto. Löpande utgifter (server, e-post, domän).
- **Konto B** — hos en **annan bank**. Buffert + omedelbar reserv om A stängs.
- Mål: om en bank stänger imorgon kan verksamheten fortsätta **samma dag** på den andra.

> **Viktigt:** Detta gäller föreningens **eget** konto. Donationspengarna i sig rör plattformen aldrig juridiskt — de går via betalprocessorn direkt till insamlaren (M5). Bankberedskapen skyddar **föreningens drift**, inte donationsflödet. De är två skilda saker. Förväxla dem inte.

### Alternativ att utvärdera

Ingen bank är garanterat "muslim-vänlig" — flera nedan har också stängt konton. Det här är en lista att **undersöka**, inte en lista med löften. Verifiera aktuella villkor själv innan beslut.

| Alternativ | Typ | Att kolla |
|---|---|---|
| Storbank (SEB, Swedbank, Nordea, Handelsbanken) | Svensk affärsbank | Mest sannolik som ett av två konton. Var beredd på frågor om verksamheten — möt dem med transparens. |
| **Marginalen Bank** | Svensk nischbank | Mindre aktör, eget riskaptit. Utvärdera som konto B-kandidat. |
| **Resurs Bank** | Svensk nischbank | Som ovan. Kontakta, fråga om föreningskonto. |
| **Wise Business** | Multivaluta-konto (ej svensk bank) | Stark för **EUR-flöden** och internationella betalningar. Inte ersättning för svenskt bankkonto — ett komplement. |
| Kreditkassa / mindre föreningsvänlig aktör | Varierar | Undersök, men kontrollera insättningsgaranti och stabilitet. |

### Konkreta steg

1. ☐ Öppna **driftskonto A** hos en bank vid föreningens registrering.
2. ☐ Öppna **konto B hos en annan bank** inom samma månad. Vänta inte tills A krånglar.
3. ☐ Öppna ett **Wise Business-konto** om/när EUR-flöden blir aktuella.
4. ☐ Vid varje bankkontakt: presentera föreningen ärligt — org.nr, ändamål, granskningsmodell. Var den lätta kunden, inte den gåtfulla.
5. ☐ Spara en **enkel pärm**: stadgar, org.nr, styrelseprotokoll, en sida om hur granskningen fungerar (M3). Den pärmen är svaret när banken frågar.
6. ☐ Se över kontona **var 6:e månad** — fungerar båda, behövs ett tredje?

---

## 3. Betalprocessor-beredskap

### Stripe-risken

Plattformen bygger på **Stripe Connect** (M5) — det är så pengar går från donator direkt till insamlare. Stripe har också stängt konton för muslimska aktörer. Om Stripe stänger oss stannar **donationsflödet helt**, inte bara driften.

Det betyder inte att vi byter processor nu. Det betyder att **vägen ut ska vara känd** — så att vi inte står handfallna den dagen.

### Alternativa processorer på ritbordet

Inget av detta är garanterat — utvärdera teknik, avgifter och villkor själv.

| Alternativ | Styrka | Att kolla |
|---|---|---|
| **Adyen** | Stor, stabil, hanterar marketplace-utbetalningar (motsvarar Connect) | Närmast funktionell ersättare. Kräver mer integration än Stripe. |
| **Klarna Payments** | Stark i Sverige, känd för donatorer | Mindre tydligt stöd för split-payouts till tredje part — utred noga. |
| **Wise Business** | Bra för utbetalningar och valutaväxling | Inte en fullständig checkout-processor — kan täcka delar, inte allt. |

### Grov migrationsväg

Inte byggd nu. Men så här ser den ut, så att en framtida Zivar vet vad som väntar:

1. **Frys nya insamlingar.** Inga nya `aktiv`-insamlingar tar emot pengar via den fallna processorn. Banner: "Tillfälligt stopp för nya donationer."
2. **Låt pågående charges landa.** Donationer som redan påbörjats slutförs om möjligt.
3. **Säkra utbetalningar.** Pengar som hålls hos processorn — se till att de når insamlarna innan kontot helt fryses. Detta är prioritet ett.
4. **Migrera data.** Det som flyttas: insamlar-konton (KYC-status, kontouppgifter), kopplingen insamling ↔ connected account. Donationshistorik bevaras i vår egen databas — den ligger inte hos processorn.
5. **Integrera ny processor.** Realistisk tid: **2–6 veckor** beroende på alternativ (Adyen snabbare för split-payouts, andra långsammare).
6. **Återöppna.** Nya insamlingar tar emot pengar igen.

**Ärenden som fryses under migrering:** nya insamlingar, refunds-i-kö, undermåls-återbetalningar. Berörda insamlare och donatorer ska informeras — det är en incident (se sektion 4).

> **Att-göra nu:** ingenting tekniskt. Bara: håll insamlingshistorik och donationsdata i **vår egen databas**, inte enbart hos Stripe. Då är processorn utbytbar. Detta är en designnotering till M5.

---

## 4. Incidentplan

När något går allvarligt fel improviserar man inte. Man följer ett papper. Här är pappret.

### Roller — bestäm namnen nu

Plattformen drivs av Zivar + två bröder (samma tre som granskar, M3). Tilldela rollerna **i förväg** — skriv in namn här:

| Roll | Ansvar | Namn |
|---|---|---|
| **Talesperson** | Allt utåt — media, donatorer, sociala medier. **Endast denna person uttalar sig.** | _________ |
| **Teknisk operatör** | Kan stänga/pausa plattformen, frysa insamlingar, köra refunds. | Zivar |
| **Donatorkontakt** | Når berörda donatorer, svarar på frågor, hanterar refunds praktiskt. | _________ |

En person kan ha flera roller — men **rollerna ska vara utdelade innan en incident sker**, inte under.

### Generell svarstakt

| Tid efter upptäckt | Vad som ska ha hänt |
|---|---|
| **0–2 timmar** | Incident bekräftad. Roller aktiverade. Hotet stoppat (insamling pausad / plattform i säkert läge). |
| **2–24 timmar** | Berörda kontaktade. Ett kort, ärligt publikt besked om så krävs. |
| **1–7 dagar** | Åtgärdat. Refunds genomförda om aktuellt. Kort intern notering: vad hände, vad ändrar vi. |

### Scenario A — Fejk-insamling som slunkit igenom

Granskning är inte 100 % ("vårt fel men inte dödligt", designprincip 4). En fejk kommer förr eller senare.

1. **Teknisk operatör** sätter insamlingen i `pausad` direkt (M1 Block 3) — donationer fryser.
2. Utredning. Bekräftad fejk → `nedstängd`, refund-process startas (M5).
3. **Donatorkontakt** informerar alla som gav: "En insamling du stöttade visade sig vara oäkta. Du återbetalas fullt." Ärligt, ingen skönmålning.
4. **Talesperson** har ett kort svar redo om frågor kommer: "Vi upptäckte den, stoppade den, återbetalade alla. Så här är vår granskning byggd."
5. Ev. polisanmälan. Beslutsregler: M8.

> Att fånga och återbetala en fejk är **inte ett nederlag att dölja** — det är beviset på att grindvakten fungerar. Hantera det öppet.

### Scenario B — Hack eller dataläcka

1. **Teknisk operatör** sätter plattformen i säkert läge / offline om data aktivt läcker.
2. Stäng hålet. Byt nycklar och lösenord (se sektion 5).
3. Bedöm omfattning: vilka personuppgifter berördes?
4. **GDPR:** personuppgiftsincident ska anmälas till **IMY inom 72 timmar**. Berörda användare informeras om hög risk. Verifiera kraven — detta är en punkt där jurist bör konsulteras.
5. **Talesperson** ger ett ärligt besked. Dölj aldrig en läcka.

### Scenario C — Mediestorm

En negativ artikel, en viral tråd, en anklagelse — sann eller falsk.

1. **Endast talespersonen svarar.** Alla andra hänvisar dit. Tre röster blir kaos.
2. Svara **lugnt, faktabaserat, snabbt** — tystnad läses som skuld.
3. Använd PR-ensidan (sektion 7) som grund.
4. Är kritiken befogad: erkänn, rätta, berätta vad som ändras. Är den felaktig: bemöt med fakta och spårbarhet — "varje krona är dokumenterad, här är hur."

### Scenario D — Stor donator klagar offentligt

1. **Donatorkontakt** når personen **privat** först — snabbt, personligt, lyssnande.
2. Lös det praktiska: refund, förklaring, rättelse.
3. **Talesperson** bemöter det publika sakligt **endast om det inte tystnar privat**.
4. Bjud aldrig in till offentligt gräl. Vänligt, kort, lösningsinriktat.

---

## 5. Kontinuitet — bus factor

**Den hårda sanningen:** Zivar är ensam teknisk operatör. Försvinner Zivar — sjukdom, olycka, annat — vet ingen annan idag hur plattformen körs. Det är den största driftsrisken efter debanking.

Det här löses inte med teknik. Det löses med **ett kuvert och en lista**.

### Vad som måste vara dokumenterat

Skapa ett **nödfallsdokument** — krypterat eller i ett fysiskt förseglat kuvert hos en betrodd person. Innehåll:

- ☐ Var **källkoden** ligger (repo, inloggning).
- ☐ **Lösenord** till alla kritiska konton — lösenordshanterare + huvudlösenord, eller förseglad lista.
- ☐ **Stripe**-konto: inloggning, var connected accounts hör hemma.
- ☐ **Domän**: var den är registrerad, hur den förnyas (en bortglömd domänförnyelse dödar plattformen lika säkert som ett hack).
- ☐ **Bankkonton** (sektion 2): inloggningar, vem som har firmateckningsrätt.
- ☐ **Server/hosting**: leverantör, inloggning, hur man startar om.
- ☐ **E-postdomän**: var den administreras.
- ☐ En **kort drifthandbok**: hur man pausar plattformen, hur man kör en refund, vem man ringer.

### Nödfallskontakter och övertagande

| Situation | Plan |
|---|---|
| **Zivar borta ~3 månader** | En bror tar över drift via nödfallsdokumentet. Plattformen är 95 % självgående (designprincip 3) — mest granskning som behöver en människa. Pausa nya insamlingar om granskning inte hinns med. |
| **Zivar borta ~12 månader eller permanent** | Styrelsen beslutar: rekrytera teknisk hjälp, eller pausa nya insamlingar och låta pågående löpa klart. Inga nya pengar in utan någon som kan sköta dem. |

### Konkreta steg

1. ☐ Skapa nödfallsdokumentet **nu** — inte "när jag hinner".
2. ☐ Ge **minst en betrodd person** (en bror) instruktioner om hur det öppnas.
3. ☐ Säkra att **minst två personer** har firmateckningsrätt på föreningens bankkonton.
4. ☐ Uppdatera dokumentet **var 6:e månad** — lösenord och leverantörer ändras.
5. ☐ Larm i M16 (admin/dashboard) ska kunna nå **mer än en person**, inte bara Zivar.

---

## 6. Försäkring

En ideell förening bör ha grundskydd. Två försäkringar är relevanta:

- **Ansvarsförsäkring** — täcker om föreningen blir skadeståndsskyldig (t.ex. styrelseansvar, skada mot tredje part).
- **Cyberförsäkring** — täcker dataläcka, hack, avbrott. Relevant eftersom plattformen hanterar personuppgifter och pengaflöden.

### Att-göra-punkt

1. ☐ Begär offert från **If**, **Trygg-Hansa** och **Folksam** — alla erbjuder föreningsförsäkring.
2. ☐ Fråga specifikt efter **ansvars- + cyberskydd** för en ideell förening som driver en digital plattform.
3. ☐ Jämför pris och villkor. **Grundskydd ligger sannolikt under 10 000 kr/år** — men det är en uppskattning, inte ett löfte. Verifiera med faktiska offerter.
4. ☐ Teckna innan lansering. En oförsäkrad plattform som hanterar andras pengar är onödigt exponerad.

> Detta är inte försäkringsrådgivning. Be försäkringsbolaget förklara exakt vad som täcks — särskilt för cyberdelen.

---

## 7. Press och kommunikation

### En talesperson — inte tre

Plattformen drivs av tre personer. Utåt är det **en röst**. Tre röster i en kris ger tre versioner, och tre versioner läses som att vi inte vet vad vi gör. Bestäm vem talespersonen är (sektion 4) och håll fast vid det.

### PR-ensida — färdig att skicka

Skriv **en sida** nu, lägg den i en mapp, ha den redo. Det räcker före lansering — inget mer behövs. När en journalist hör av sig ska svaret ta minuter, inte dagar.

PR-ensidan ska kort besvara fyra frågor:

| Fråga | Innehåll |
|---|---|
| **Vilka är vi?** | Sadaqa Sweden — en ideell förening, en svenskspråkig insamlingsplattform för det muslimska samhället i Sverige. Vilka som står bakom. |
| **Vad gör vi?** | Privatpersoner och föreningar driver insamlingar. Pengarna går direkt till insamlaren via betalprocessor. Plattformen håller aldrig pengarna juridiskt. |
| **Hur granskar vi?** | Varje projekt granskas av en människa **innan** publicering (M3). Varje insamlare är BankID-verifierad (M6). Varje insamling visar bevis: start, utbetalning, resultat (M7). Radikal spårbarhet — varje krona dokumenterad. |
| **Vad gör vi INTE?** | Vi tar inte emot vad som helst. Personlig nöd inom Sverige granskas inte (för svår att verifiera). Vi tillåter inte diskriminerande eller sekteristiskt innehåll. Vi släpper inget ogranskat. |

Håll tonen lugn och saklig. PR-ensidan är inte marknadsföring — det är ett faktablad. En sida. Klar.

---

## 8. Plattformens egen ekonomi

Plattformen tar **ingen avgift** av donationer (designsignal, som GoFundMe). Stripe-avgiften bärs av insamlaren (M5). Då måste driften betalas på annat sätt — frivilliga bidrag från donatorer. Frågan: **räcker det?**

### Vad plattformen kostar

Löpande kostnader är låga eftersom plattformen är 95 % självgående:

| Post | Vad det är |
|---|---|
| Server / hosting | Drift av sajten |
| E-posttjänst | Notiser, kvitton (M15) |
| Domän | Årlig avgift |
| Supporttid | Zivars + brödernas tid — "gratis" nu, men en verklig kostnad |

### Räknemodell — var bryts kurvan

Antaganden: snittdonation **300 kr**, frivilligt bidrag i snitt **20 kr** av de donatorer som väljer att ge ett (konvertering **1–3 %** är typiskt på muslimska plattformar). Siffrorna nedan är **illustrativa** — fyll i verkliga kostnader när de är kända.

| Insamlingar/mån | Donationer/mån (~30 per insamling) | Frivilliga bidrag vid 2 % konv. | Uppskattad driftskostnad/mån | Resultat |
|---|---|---|---|---|
| 5 | ~150 | ~60 kr | ~500 kr | **Minus** — försumbar volym |
| 20 | ~600 | ~240 kr | ~800 kr | **Minus** |
| 50 | ~1 500 | ~600 kr | ~1 200 kr | **Minus** |
| 100 | ~3 000 | ~1 200 kr | ~1 500 kr | **Nära balans** |
| 200 | ~6 000 | ~2 400 kr | ~2 000 kr | **Plus** |
| 400 | ~12 000 | ~4 800 kr | ~3 000 kr | **Plus** — tydlig marginal |

**Kurvan bryts runt 100–150 insamlingar/månad** vid dessa antaganden. Under det går plattformen back. Det är **väntat** — i början bär grundarna kostnaden, och kostnaden är liten.

> **Verifiera själv:** byt ut de illustrativa siffrorna mot verkliga server-, e-post- och domänkostnader så fort de är kända. Modellen är ett ramverk, inte ett facit.

### Plan B om frivilliga bidrag inte räcker

1. **Stöd-till-föreningen-donationer.** En tydlig, separat knapp: "Stöd plattformen som håller detta igång." Skild från insamlingsdonationer.
2. **Sänk kostnaden.** Billigare hosting, mer automation — varje sparad krona räknas tidigt.
3. **90-konto senare.** Ett 90-konto (Svensk Insamlingskontroll) ger trovärdighet och öppnar för bredare stöd. Kräver auktoriserad revisor och 75/25-regeln — **inte v1**, men en känd väg framåt. Se föreningsdokumenten.
4. **Grundarna bär mellanskillnaden** tills volymen bär sig. Med de låga kostnaderna är detta hanterbart under uppbyggnadsfasen.

---

## 9. Beredskapschecklista

Kort lista. Bocka av. Detta är minimum innan plattformen hanterar riktiga pengar.

### Bank

- ☐ Driftskonto A öppnat
- ☐ Konto B öppnat hos **annan** bank
- ☐ Wise Business utvärderat för EUR-flöden
- ☐ Föreningspärm sammanställd (stadgar, org.nr, granskningsbeskrivning)

### Betalprocessor

- ☐ Migrationsväg från Stripe nedskriven och förstådd
- ☐ Donationshistorik lagras i **egen databas**, inte bara hos Stripe

### Incident

- ☐ Talesperson utsedd (namn ifyllt i sektion 4)
- ☐ Donatorkontakt utsedd
- ☐ Incidentplanens fyra scenarier lästa av alla tre

### Kontinuitet

- ☐ Nödfallsdokument skapat (kod, lösenord, Stripe, domän, bank, server)
- ☐ Minst en betrodd person vet hur det öppnas
- ☐ Minst två personer har firmateckningsrätt
- ☐ Larm i M16 når mer än en person

### Försäkring

- ☐ Offert begärd från If, Trygg-Hansa, Folksam
- ☐ Ansvars- + cyberförsäkring tecknad

### Press

- ☐ PR-ensidan skriven och sparad

### Ekonomi

- ☐ Räknemodellen ifylld med verkliga driftskostnader
- ☐ Plan B-knapp för plattformsstöd planerad

### Underhåll

- ☐ Hela denna plan granskas om var 6:e månad

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första beredskapsplanen. Flaggad av extern granskning (FORGE). Bank-, processor-, incident-, kontinuitets-, försäkrings-, press- och ekonomiberedskap + checklista. |
