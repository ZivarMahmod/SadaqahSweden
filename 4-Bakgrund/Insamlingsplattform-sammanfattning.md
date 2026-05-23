# Insamlingsplattform – diskussionssammanfattning

**Datum:** 2026-05-23
**Status:** Grundläggande struktur och filosofi spikad. Plattformsbygge inte påbörjat. Egen bönematteinsamling är pilot.

---

## Vad detta dokument är

Det här är en sammanfattning av allt vi har pratat igenom i en lång session. Det är **inte** en kravspec eller plan – det är ett retrospektivt dokument som fångar vad du tänkt, vilka val du gjort, vilka alternativ vi förkastat och varför. Om du svänger fel framöver eller glömmer en överenskommelse, läs det här först.

---

## 1. Hur det började

Du satte upp en Facebook-grupp för en insamling till bönemattor som ska delas ut till moskéer. Snittpris 30–50 kr per matta från en kinesisk leverantör. Mål: 1000 mattor. Beställning inom 14 dagar från att insamlingen drar igång. Det är **din egen första insamling** och samtidigt en pilot där du lär dig hela cykeln innan plattformen byggs.

Vi skrev startmeddelandet för gruppen tillsammans. Det är klart.

---

## 2. Den korta vägen – pengahanteringen för bönematteinsamlingen

För själva bönematteinsamlingen valde du den enklaste lagliga vägen:

- **Fjärde kontot i Swedbank** – ett separat konto döpt till något i stil med "Bönemattor insamling"
- **Eget Swish-nummer** kopplat till just det kontot (Swedbank tillåter flera Swish per person, ett per konto)
- **Manuell logg** i Google Sheets: datum, namn, summa, meddelande
- **Transparens uppåt:** veckovisa uppdateringar i gruppen om insamlat belopp, kvitto från leverantören när beställning läggs, slutbilder när mattorna är levererade

Vi förkastade insamlingsplattformar som BetterNow/GoFundMe för det här tillfället eftersom avgifterna (1500–4000 kr på 30–50 000 kr) inte var värda overheaden, och vi förkastade att starta en ideell förening redan nu eftersom det är overkill för en enskild insamling.

**Detta är inte plattformen.** Detta är din egen insamling. Plattformen är ett separat projekt som vi övergick till att diskutera.

---

## 3. Plattformsidén – vad det är och vad det inte är

Idén växte fram medan du skrev. Den slutgiltiga formen:

**En insamlingsplattform riktad mot det muslimska samhället i Sverige.** Som GoFundMe i grundkoncept – privatpersoner kan starta projekt, andra kan donera, alla kan följa flödet – men med några skarpa skillnader:

- **Sharia-medveten granskning:** projekt granskas mot islamiska principer innan publicering. Insamlingar som krockar med islam (alkohol, grisar, riba-relaterat osv) tas inte upp.
- **Transparens som design-princip:** plattformen försöker säkerställa att man får tillbaka resultatet, inte bara att man gav pengar. Donatorer ska kunna komma tillbaka och se vad som faktiskt hände.
- **Trafiken bygger sig själv:** en samlingsplats där alla aktiva insamlingar drar nytta av varandras besökare, istället för att varje insamlare måste bygga eget nätverk från noll.
- **Inte vinstdrivande:** plattformen ska bara täcka sina egna kostnader, inte gå med vinst.

### Filosofiska kärnpunkter du landade i

Det här är inte slogans – det är beslutsregler du formulerade själv:

1. **"Plattformen ger verktyg, inte polis"** – samma logik som Corevo. Plattformen tillhandahåller infrastruktur, insamlaren äger sitt eget ansvar.

2. **"Transparens är ett mål, inte ett tvång"** – du kan inte tvinga någon att leverera resultatbevis, men du kan göra det socialt belönande. Den som stänger loopen får trovärdighet. Den som inte stänger den får ingen badge. Plattformen anklagar aldrig någon, den visar bara historik.

3. **Bygg för det andliga idealet, respektera den mänskliga svagheten** – för en muslim är sadaqah komplett när pengarna lämnar handen. Allah har sett. Belöningen är skriven. Resultatet i denna värld är bonus. Men plattformen lever i dunya, och människor behöver återkoppling för att orka fortsätta ge. Badgesystemet är inte för att bevisa fromhet – det är ett verktyg för det mänskliga hjärtat som tvivlar.

4. **Samordna befintlig godhet** – plattformen ska inte göra allt själv. När den växt nog ska den samarbeta med existerande föreningar som hanterar handledning av nya insamlare. Du löser inte allt själv, du kopplar ihop redan existerande styrkor (samma princip som Stripe-valet).

### Transparens-loopen

Vi landade i en konkret struktur med tre obligatoriska händelser per insamling:

1. **Start** – beskrivning, mål, mottagare
2. **Utbetalning** – bevis när pengarna lämnar plattformen (screenshot/kvitto)
3. **Resultat** – bild/video/uppdatering när det som lovats är genomfört

Mellan dessa kan insamlaren posta valfria uppdateringar. Den som stänger alla tre får badgen "Resultat levererat" – som följer med deras profil till nästa insamling. Tripadvisor-modellen: plattformen anklagar ingen, marknaden reglerar sig själv.

---

## 4. Pengaflödet – Stripe Connect

Efter att ha vägt tre alternativ (eget Stripe Connect, egen FI-registrering som betaltjänstleverantör, ideell förening med bankgiro) valde du **Stripe Connect**.

### Hur det fungerar

```
Donator → Stripe → Insamlarens egna Stripe-konto
              ↓
        Plattformsavgift = 0 kr
        Insamlaren betalar Stripe-avgiften (~1,4% + 1,80 kr)
```

Pengarna passerar **aldrig juridiskt genom plattformen**. Stripe håller dem och skickar direkt till insamlaren. Plattformen är förmedlare av tjänsten, inte av pengarna. Det betyder att vi slipper Finansinspektionens betaltjänstregler – Stripe har redan licensen.

### Två lager av pengaflöden

Vi identifierade att det finns två olika typer av pengar som rör sig kring plattformen:

- **Projektinsamlingar** (bönematta, brunn, etc.) → Stripe Connect → direkt till insamlaren
- **Stöd till föreningen** (drift, marknadsföring, möten, resor, lön när motiverad) → föreningens eget konto

De två blandas aldrig.

### Varför vi inte gick på FI-registrering

Egen FI-registrering är 4–6 månaders process med AML-policy, riskbedömningar och compliance från dag 1. Det är overkill för en oprövad idé. Det kan eventuellt bli aktuellt om plattformen växer extremt, men inte nu.

---

## 5. Bolagsstrukturen – hybridmodellen

Det här är den mest komplexa delen vi diskuterade. Vi vägde fyra alternativ och landade i en hybrid med en specifik nyans du själv formulerade.

### De fyra alternativen vi vägde

1. **Allt under Corevo AB** – snabbast men signalerar fel mot muslimska samhället (förtjänat eller inte, ett AB ser ut som vinstdrivande)
2. **Ren ideell förening, fristående från Corevo** – maximal trovärdighet, men du tappar all strategisk koppling till Corevo och alla framtida möjligheter att flytta värde
3. **Hybrid** – Corevo äger tekniken, föreningen driver verksamheten utåt
4. **Vänta med strukturen, börja som projekt under Corevo** – lean startup, validera först

**Du valde 3 med start av 4.** Bönematteinsamlingen är din valideringsfas innan plattformen byggs.

### Den slutgiltiga strukturen

```
PRIVATPERSON (du)
├── Lägger ner tid på plattformsutveckling – initialt utan ersättning (din amal)
├── Får eventuell utdelning från Corevo AB om dess ANDRA verksamheter går bra
└── En av tre i föreningens styrelse – kan ta lön där om/när det är motiverat
    av faktiskt arbete och föreningens kassa tillåter

COREVO AB
├── Äger plattformens kod, design, varumärke
├── Bär kostnaden för server, domän, licenser, tredjepartstjänster
├── Fakturerar föreningen EXAKT självkostnad (självkostnadsfakturering, ±0)
└── Genererar vinst från sina ANDRA verksamheter (Corevo Kyl m.fl.)
    – plattformen är NEUTRAL i Corevos bokföring

IDEELL FÖRENING (du + två bröder)
├── Driver insamlingsverksamheten utåt
├── Betalar Corevos självkostnadsfakturor varje månad
├── Tar emot stora donationer för drift (möten, resor, marknadsföring)
├── Kan betala styrelse lön när motiverat av faktiskt arbete och kassa tillåter
└── Granskar insamlingar enligt islamiska principer
```

### Varför du valde att Corevo äger plattformen (inte föreningen)

Det här är en nyans jag missade först. Du formulerade det själv så här:

> *"Corevo bygger detta för föreningen, inte för personerna som driver föreningen. Indirekt är det föreningens plattform, men det är Corevos ägande."*

Logiken: du som privatperson lägger ner tiden. Du är den som ska sitta kl 02 och fixa en bugg när Stripe har ändrat sitt API. Det är **din skapelse**. Föreningen får använda den fritt, men du behöver skydd mot en framtid där:

- En ny styrelse i föreningen säger *"plattformen är vår, du ska göra X med den"*
- Du har lagt 5 år av kvällar på något du inte längre har sista ordet över
- Konflikter uppstår om kodbasen ska open-sourceas, säljas, eller läggas ner

Som ägare av tekniken kan du alltid säga: *"Föreningen får använda den så länge missionen lever. Om missionen dör, dör plattformen med den, och koden är min att göra vad jag vill med."*

Det är **ansvarsmässigt ägande**, inte affärsmässigt.

### Självkostnadsfakturering – hur det skiljer sig från min första rekommendation

Jag rekommenderade först att Corevo skulle bära plattformens kostnader själv utan att fakturera föreningen. Du korrigerade mig: Corevo ska fakturera föreningen **exakt sina egna kostnader, ±0, inte en extra öre**. Det är **smartare** av flera skäl:

1. **Corevos bokföring blir ren** – inte en olönsam gren utan motpart. Logisk kostnad → logisk intäkt → resultat 0
2. **Föreningens bokföring blir ren** – en faktisk driftskostnad är normalt och förväntat
3. **Du har dokumenterat värde** – när föreningen betalar finns ett papper på att tjänsten är värd något

### Skatteverket-vakten

Det vi måste vara medvetna om: Skatteverket tittar noga på transaktioner mellan närstående parter. Du är ordförande i föreningen *och* ägare till Corevo. Det betyder att fakturorna mellan dem är "transaktioner mellan närstående" och måste vara marknadsmässiga.

**Lösningen:** exakt självkostnad är det säkraste priset av alla. Det finns ingen vinst att flytta, så det finns inget att ifrågasätta. Det krävs:

- **Separat bokföring för plattformen i Corevo** – server, domäner, licenser allt brytbart
- **Fakturering baserat på faktisk kostnad** varje månad eller kvartal (inte avrundat "för enkelhetens skull")
- **Dokumentation per faktura:** *"Drift av plattform [domän], period: server X kr, domän Y kr, e-posttjänst Z kr, backup W kr. Totalt: N kr."*

Det tar 5 minuter per faktura och skyddar dig totalt mot framtida frågor.

### Din egen tid – två sätt att hantera den

Vi diskuterade om din tid på plattformen ska vara ett dokumenterat värde eller bara din amal. Två alternativ:

- **Alternativ A: Din tid är din amal** – ingen ersättning, ingen dokumentation. Du gör det för Allah. Renast.
- **Alternativ B: Din tid är ett bidrag från Corevo som dokumenteras** – ingen cash, men bokfört värde. Bra om plattformen ska värderas senare.

Min rekommendation till dig: **Alternativ A** initialt. Du kan alltid byta till B senare.

**Sidoanteckning:** Corevo-timmarna du redan lagt ner (5 månader) bör börja dokumenteras i ett enkelt Sheets (datum, antal timmar, vad du gjorde). Inte för att fakturera nu – för att ha papper på vad som hänt om någon någon gång frågar.

---

## 6. Föreningen – det mänskliga fundamentet

Föreningen blir egen, inte ansluten till befintliga föreningar i Linköping. Du och två bröder som du känt sen barndomen, alla muslimer med samma avsikt. Ingen hierarki – tre röster.

### Vad jag flaggade som risk (inte för att ni inte litar på varandra)

Avsikten räcker inte för att hålla en juridisk struktur frisk över lång tid. Inte för att någon är dålig människa – för att **livet händer**: en flyttar utomlands, en gifter sig och får inte tid, en hamnar i kris, oenighet uppstår om en specifik granskning.

Ni behöver enkla regler från dag 1 *medan ni fortfarande tycker likadant om allt*. När ni inte längre tycker likadant – det är då reglerna behövs, och då är det för sent att skriva dem.

### "Bröderskapspakten" – en sida, en kväll, signerad

Inte juridiskt språk. Bara fyra eller fem saker ni skriver ner tillsammans:

1. **Vad föreningen är till för** – en mening eller två. Er kompass när framtida beslut blir svåra.
2. **Hur beslut fattas** – tre röster, behövs enighet eller räcker majoritet? Tips: vissa saker kräver enighet (avveckling, stora ekonomiska beslut), andra räcker majoritet (löpande granskning).
3. **Vad händer om en av er vill gå ur** – ersättare väljs av de två kvarvarande, period för överlämning.
4. **Vad händer med plattformen om föreningen läggs ner** – bestäms i förväg. Tips: resterande medel går till välgörande ändamål ni alla tre godkänner.
5. **Hur ni hanterar oenighet** – innan ni eskalerar, sätt er ner. Be gemensam vän/imam medla. Aldrig gå till myndigheter mot varandra – det är hela poängen med er broderskap.

Du sa själv att det här inte är ett affärsskontrakt utan en muslimsk överenskommelse. Det stämmer. Men skrivet på papper blir det starkare än mundlig avsikt, även mellan bröder.

---

## 7. Vad vi diskuterade och förkastade

För framtida referens, så du minns *varför* du inte gick andra vägar:

- **Insamlingsplattformar (BetterNow, GoFundMe, etc.) för bönematteinsamlingen** – avgifterna åt upp för stor del av insamlingen, mer overhead än värde
- **Allt under Corevo AB permanent** – signalerar vinstdrift, kan skada förtroendet i muslimska samhället
- **Ren ideell förening fristående från Corevo** – fint i teorin men du tappar alla strategiska fördelar med Corevo, och du tappar skydd mot framtida kontrollförlust
- **Egen FI-registrering som betaltjänstleverantör** – 4–6 månader, AML-krav, compliance-tunghet. Inte värt det för oprövad idé. Stripe Connect har redan licensen.
- **Bygga plattformen direkt utan validering** – ingen idé att bygga något komplext för en idé som inte testats. Bönematteinsamlingen är pilot. Du lär dig hela cykeln innan plattformen byggs.

---

## 8. Vad vi inte hunnit klart med

Vi började på **plattformskonceptet i detalj** (hur den faktiskt fungerar för användarna, vad som behövs i v1, vad som kan vänta). Det avbröts för att du först ville ha det här dokumentet. Vi tar det härnäst.

Andra trådar som väntar:
- **Granskningsprocessen** – hur ni tre i föreningen praktiskt granskar insamlingar enligt islamiska principer (det här är troligen den svåraste delen, inte tekniken)
- **Marknad och konkurrens** – finns det redan muslimska insamlingsplattformar i Sverige eller globalt? Vad gör de bra/dåligt?
- **Teknisk stack** – vad ni faktiskt ska bygga med
- **Konkret roadmap** – från piloten till plattform live, steg för steg

---

## 9. En sista påminnelse till framtida-dig

Du är inte här för att bygga ett företag. Du är här för att bygga något *för Allah*, och företaget är bara strukturen runt om som gör det möjligt och skyddat. När du svänger fel framöver – och du kommer göra det, vi alla gör det – läs det här först. Särskilt avsnitt 3 om filosofin och avsnitt 6 om föreningen.

Allah vet, och du gör ditt bästa.
