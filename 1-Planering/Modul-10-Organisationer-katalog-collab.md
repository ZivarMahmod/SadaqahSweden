# Modul 10 — Organisationer, katalog & collab

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`

---

## 1. Vad modulen är

Modul 10 definierar **hur föreningar och moskéer existerar på plattformen** — som konton, som poster i en katalog, och som samarbetspartners till privatpersoners insamlingar.

Tre saker bor här:
- **Föreningskontot** — en kontotyp utöver privatperson-kontot (M6).
- **Katalogen** — en **självregistrerad** lista över muslimska föreningar och moskéer i Sverige.
- **Collab** — en strukturerad mekanism där en privatperson driver en insamling *med* stöd av en moské eller förening, synligt på insamlingen.

**Den löser:** det muslimska samhället i Sverige har redan organisationer — moskéer, studieförbund, hjälporganisationer. Plattformen ska inte bygga dem från noll. Den ska **samordna befintlig godhet** (princip 13): ge organisationerna en plats att synas och ett sätt att låna sin trovärdighet till de privatpersoner de tror på.

---

## 2. Varför den behövs

Tre konkreta problem:

1. **En privatperson som samlar in är ensam om sin trovärdighet.** Ahmed som samlar till bönematter har bara sitt eget namn och sin KYC. En moské som säger "vi känner Ahmed, vi står bakom det här" lyfter honom enormt — men det finns ingen struktur för det. Collab är strukturen.
2. **Föreningar har ingen samlad, sökbar plats i Sverige.** Det finns ingen svenskspråkig katalog över muslimska föreningar och moskéer. Folk hittar sin lokala moské på Google Maps om de har tur. Katalogen fyller luckan — men byggd så att **vi inte underhåller den manuellt**.
3. **Föreningar vill driva egna insamlingar också.** En moské som renoverar sitt tak ska kunna samla in i föreningens namn, inte tvinga en privatperson att stå som ägare.

Utan M10 är plattformen bara privatpersoner. Med M10 blir den en spegel av samhällets faktiska struktur.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Föreningskonton — vad ett föreningskonto är och hur det driver insamlingar | ✅ Spikad |
| 2 | Självregistrering till katalogen — formuläret, granskningen, målgruppsregeln | ✅ Spikad |
| 3 | Katalogen — hur föreningar visas, söks och kategoriseras | ✅ Spikad |
| 4 | Collab — privatperson + förening som samarbete på en insamling | ✅ Spikad |
| 5 | Verifiering av föreningar — äkthetskontroll och hantering vid missbruk | ✅ Spikad |

Block 2 är **kärnan**. Resten hänger på den: utan en granskad, självregistrerad katalog finns inget för Block 3 att visa och inget för Block 4 att tagga.

---

# BLOCK 1 — Föreningskonton

## 1.1 Vad ett föreningskonto är

**Ett föreningskonto är en kontotyp** — vid sidan av privatperson-kontot (definieras i M6). Det representerar en **juridisk eller organisatorisk enhet**: en ideell förening, en moské, en stiftelse eller motsvarande.

Det är **inte** en separat person. Det ägs och styrs av en eller flera fysiska personer som har **behörighet att företräda föreningen** — de loggar in med sin egen BankID (M6) och *agerar i föreningens namn*.

## 1.2 Hur det skiljer sig från ett privatperson-konto

| Egenskap | Privatperson-konto | Föreningskonto |
|---|---|---|
| **Identitet** | En fysisk person, BankID | En organisation, org.nr |
| **Vem loggar in** | Personen själv | En eller flera **behöriga företrädare**, var och en med egen BankID |
| **Driver insamlingar som** | Sig själv | Föreningen (insamlingens ägare visas som föreningen) |
| **KYC** | Personlig KYC | Org.nr-verifiering + KYC på minst en företrädare (Block 5) |
| **Publik profil (M9)** | Personprofil | Organisationsprofil — kan länkas till katalogposten |
| **Syns i katalogen (Block 3)** | Nej | Ja, efter självregistrering + granskning |
| **Kan ta emot collab-credit (Block 4)** | Nej | Ja |
| **Stripe Connect (M5)** | Connected account på personen | Connected account på organisationen (org.nr) |

**Designbeslut:** Föreningskontot och katalogposten är **två separata saker som kan, men inte måste, vara länkade.**
- En förening kan ha **en katalogpost utan konto** (de vill synas men driver inga insamlingar).
- En förening kan ha **ett konto utan katalogpost** (de driver insamlingar men har inte sökt till katalogen — eller väntar på granskning).
- Det normala målet: **båda, länkade.**

Varför separera: katalogen ska kunna växa snabbt (Block 2) utan att varje post tvingas igenom full KYC. Att synas är lättare än att hantera pengar. Pengar kräver mer (Block 5).

## 1.3 Vem representerar föreningen

**Princip:** en förening agerar genom **behöriga företrädare** — fysiska personer som föreningen själv har utsett.

**Specifikation:**
- **Primär företrädare** — en, obligatorisk. Den person som registrerar föreningen och bär huvudansvaret. Genomgår KYC (Block 5).
- **Ytterligare företrädare** — 0 till flera. Bjuds in av primär företrädare. Kan ges behörighet att skapa/redigera insamlingar i föreningens namn.
- **Roll-lager inom föreningskontot** (detaljerna ägs av M6):
  - *Administratör* — full behörighet, kan bjuda in/ta bort andra, ändra föreningsuppgifter.
  - *Insamlingsansvarig* — kan skapa och driva insamlingar, men inte ändra föreningens grunduppgifter eller företrädarlista.
- **Varje företrädare loggar in med sin egen BankID.** Inget delat lösenord. Lämnar en person föreningen → behörigheten dras in, personens egna BankID rör inte längre kontot.

**Kantfall:**
- **Primär företrädare lämnar/avlider** → en administratör kan utses till ny primär företrädare; om ingen administratör finns blir det ett admin-ärende (M16). Föreningskontot fryses tills en verifierad ny företrädare finns — pengar i pågående insamlingar hålls kvar hos Stripe (M5).
- **Konflikt inom föreningen om vem som företräder** → plattformen tar inte ställning i föreningsinterna tvister ("verktyg, inte polis"). Vid akut konflikt kan kontot pausas av admin tills föreningen själv löst frågan. Detta är en sällsynt händelse — vi skriver ingen tung paragraf för den.

## 1.4 Hur en förening driver egna insamlingar

En förening skapar insamlingar **genom samma flöde som en privatperson** (M2-wizarden) — men:

- **Ägare** på insamlings-objektet (M1 Block 4) blir **föreningen**, inte den inloggade personen.
- Insamlingen visar publikt *"Driven av [Föreningens namn]"* och länkar till organisationsprofilen (M9).
- **Samma granskning** gäller — en förenings insamling granskas mot islamiska principer precis som en privatpersons (M3). Att vara en granskad katalogförening ger **ingen genväg förbi projektgranskningen**. Princip 7: granska före publicering, alltid.
- **Stripe-utbetalning** går till föreningens connected account (org.nr), inte till en privatperson.

**Designbeslut — föreningar får INTE auto-publicera.** Det vore frestande att säga "verifierade föreningar slipper granskning". Vi gör det inte. En verifierad förening kan ändå starta en illa formulerad eller principmässigt tveksam insamling. Granskningen skyddar *projektet*, inte bara *personen bakom*. Det enda en verifierad förening kan få är **snabbare granskning** (lägre misstankegrad → kortare kö-prioritet), vilket spikas i M3 — inte ingen granskning.

---

# BLOCK 2 — Självregistrering till katalogen

**Detta är modulens kärna.** Allt annat hänger på den.

## 2.1 Grundprincipen: plattformen listar inte föreningar — föreningar ansöker

Plattformen bygger **inte** en föreningskatalog genom att samla in uppgifter själv. Det skulle betyda:
- Manuellt underhåll i evighet (Zivar har inte tid — princip 3).
- Inaktuella uppgifter (föreningar flyttar, byter kontakt).
- Risk att lista en förening som inte vill listas.

Istället: **föreningen ansöker själv.** Texten på sidan, ordagrant ungefär:

> **Är ni en förening eller moské och vill synas?**
> Fyll i formuläret nedan — vi publicerar er i katalogen efter granskning.

Föreningen äger sin egen post. De fyller i den, de håller den aktuell, de kan begära att den tas bort. Plattformen är **infrastrukturen**, inte registratorn. Detta är princip 13 (samordna befintlig godhet) och princip 3 (självgående) i ett enda designbeslut.

## 2.2 Vad formuläret frågar

Formuläret är **kort med flit** — friktion vid registrering minskar antalet föreningar som söker. Men det måste fånga nog för att granskningen ska gå att göra.

| Fält | Typ | Obligatoriskt | Publikt | Syfte |
|---|---|---|---|---|
| **Föreningens namn** | Text, max 100 tecken | Ja | Ja | Identitet |
| **Organisationsnummer** | Text, format NNNNNN-NNNN | Ja* | Nej (internt) | Äkthetskontroll (Block 5) |
| **Typ av organisation** | Dropdown | Ja | Ja | Kategorisering (se 2.3) |
| **Plats — stad** | Text/dropdown | Ja | Ja | Sök & karta (M11, M12) |
| **Plats — region/län** | Dropdown | Ja | Ja | Geografisk filtrering |
| **Besöksadress** | Text | Frivilligt | Ja om ifylld | Moskéer: var man hittar dem |
| **Kontaktperson — namn** | Text | Ja | Nej (internt) | Granskning + verifiering |
| **Kontakt — e-post** | E-post | Ja | Valbart | Kontaktverifiering (Block 5) |
| **Kontakt — telefon** | Telefon | Frivilligt | Valbart | Reservkontakt |
| **Webbplats / social media** | URL | Frivilligt | Ja om ifylld | Extra trovärdighet, granskningsobjekt |
| **Kort beskrivning** | Text, max 300 tecken | Ja | Ja | Vad föreningen är/gör |
| **Logotyp / bild** | Bilduppladdning, max 5 MB | Frivilligt | Ja om ifylld | Visuell identitet i katalogen |
| **Bekräftelse: muslimsk organisation** | Kryssruta | Ja | Nej | Self-attest av målgruppsregeln (2.4) |

**\* Organisationsnummer:** obligatoriskt **om föreningen har ett**. Vissa nybildade moskégrupper eller informella församlingar saknar ännu org.nr. Då tillåts ansökan utan org.nr men **flaggas för manuell granskning** och får i katalogen statusen *"Verifierad — kontakt"* i stället för *"Verifierad — org.nr"* (Block 5). Vi stänger inte ute en äkta moské bara för att pappersarbetet inte är klart — princip 4, "vårt fel men inte dödligt", och flexibilitet framför strikt regel (M1-andan kring verifieringsdokument).

**Designbeslut — ingen fältmur.** 13 fält, varav 5 frivilliga. En förening ska kunna fylla i formuläret på under fem minuter. Mer än så och seriösa men upptagna föreningar hoppar av.

## 2.3 Organisationstyper (dropdown)

Fast lista, samma logik som M1:s kategorilista — fritext gör granskning och sökning omöjlig.

- **Moské / böneplats**
- **Islamiskt center / församling**
- **Studie- eller utbildningsförening** (madrasa, koranskola, studiecirklar)
- **Hjälp- / biståndsorganisation**
- **Ungdoms- eller kvinnoförening**
- **Begravnings- / janazah-förening**
- **Övrig muslimsk förening**

"Övrig muslimsk förening" är fångnätet — samma roll som "Övrig sadaqah jariyah" i M1.

## 2.4 Målgruppsregeln — ENDAST muslimska föreningar och moskéer

Detta är en **hård regel** och den är medveten. Princip 12 säger det rakt: *"Muslimsk är målgrupp, inte mur"* — för **insamlingar** granskas projektet, inte personen. **Men föreningskatalogen är ett undantag som principen själv uttryckligen pekar ut:** katalogen listar **endast muslimska föreningar och moskéer**, för det är målgruppen.

**Varför:**
- Katalogen ska kännas **relevant och sammanhållen** för en muslimsk besökare. En allmän föreningskatalog hade varit brus.
- Den ska kunna fungera som en de facto **"hitta din moské / din förening i Sverige"-tjänst** — vilket bara funkar om innehållet är fokuserat.
- Det är ärligt mot vad plattformen är: *en insamlingsplattform för det muslimska samhället i Sverige.*

**Hur andra föreningar hanteras:** en icke-muslimsk förening som söker **avvisas vänligt** — aldrig nedlåtande, aldrig som en anklagelse. Standardformulering ungefär:

> Tack för er ansökan. Den här katalogen är avgränsad till muslimska föreningar och moskéer, eftersom plattformen riktar sig till det muslimska samhället i Sverige. Vi kan därför inte publicera er post — men vi önskar er allt gott i ert arbete.

**Gråzon — hur avgör granskaren vad som är "muslimsk förening"?** Detta kräver omdöme, inte en algoritm:
- **Tydligt ja:** moské, islamiskt center, koranskola, muslimsk hjälporganisation.
- **Tydligt nej:** en allmän idrottsförening, en kommunal verksamhet, en kommersiell aktör, en förening med uttryckligen annan religiös inriktning.
- **Bedömning behövs:** en mångkulturell förening där muslimer är en del; en förening som vänder sig till en folkgrupp som råkar vara övervägande muslimsk men inte är en religiös organisation. Här gäller: **är föreningens syfte att tjäna det muslimska samhället eller den muslimska tron?** Om ja → in. Om föreningen bara råkar ha muslimska medlemmar utan att vara en muslimsk organisation → vänligt nej.
- **Sekterism:** princip 11 — plattformen tar **inte sida mellan inriktningar**. En sunni-moské och en shia-moské är båda välkomna. Granskaren avvisar **inte** en förening för dess inriktning. Det granskaren *kan* avvisa är en förening vars uttalade syfte är att angripa eller exkludera andra muslimska inriktningar (princip 10, anti-diskriminering).

## 2.5 Granskningsflödet

Princip 7 gäller även här: **granska före publicering — alltid.** Ingen katalogpost blir synlig ogranskad.

**Tillstånd för en katalogansökan:**

| Tillstånd | Betyder | Publikt synlig? |
|---|---|---|
| `inskickad` | Föreningen har skickat formuläret. I kö. | Nej |
| `under_granskning` | Granskare tittar. | Nej |
| `komplettering_begärd` | Granskaren behöver mer/bättre uppgifter. Bollen hos föreningen. | Nej |
| `publicerad` | Godkänd. Posten syns i katalogen. | Ja |
| `avvisad` | Inte godkänd (icke-muslimsk, kunde inte verifieras, m.m.). | Nej |
| `vilande` | Tidigare publicerad, nu dold (på begäran eller pga missbruk, Block 5). | Nej |

**Flödet steg för steg:**
1. Föreningen fyller i formuläret → `inskickad`.
2. Granskaren plockar ärendet → `under_granskning`.
3. Granskaren kontrollerar: (a) är detta en muslimsk förening/moské (2.4)? (b) stämmer org.nr (Block 5)? (c) är beskrivningen saklig och fri från diskriminerande/sekteristiskt innehåll (M8)?
4. Beslut:
   - Allt OK → `publicerad`. Föreningen notifieras (M15): *"Er förening är nu synlig i katalogen."*
   - Något oklart → `komplettering_begärd` med tydlig motivering. Föreningen kompletterar → tillbaka till `inskickad`.
   - Inte godkänd → `avvisad` med vänlig motivering (2.4).

**SLA:** riktmärke samma som projektgranskning eller snabbare — katalogansökningar är enklare än insamlingsgranskningar. Exakt SLA spikas i M3. Riktmärke: **5 arbetsdagar.**

**Designbeslut — katalogansökan och insamlingsgranskning delar kö-infrastruktur men är skilda ärendetyper.** Granskaren (M3) ser båda i sin kö, taggade efter typ. En katalogansökan kräver mindre arbete än en insamling — den får inte tränga ut insamlingsgranskningar (insamlingar är tidskänsliga, en katalogpost är inte det). Prioritetslogik ägs av M3.

## 2.6 Kantfall

- **Dubbelregistrering** — samma förening söker två gånger (olika personer i föreningen vet inte om varann). Granskaren ser dubbletten (sökning på org.nr/namn) → slår ihop till en post, kontaktar båda. Vi förbjuder inte, vi städar.
- **Förening byter namn / flyttar / byter kontakt** — föreningen redigerar sin egen post; väsentliga ändringar (namn, org.nr) → ny minigranskning innan de syns. Småändringar (beskrivning, öppettid-länk) → loggas, publiceras direkt.
- **En person registrerar en förening hen inte tillhör** — fångas i Block 5 (kontaktverifiering: vi bekräftar mot en officiell kontaktväg, inte mot den som råkar fylla i formuläret).
- **Förening vill bort ur katalogen** — alltid tillåtet, posten går till `vilande` på begäran. De äger sin synlighet.

---

# BLOCK 3 — Katalogen

## 3.1 Vad katalogen är

Katalogen är den **publika, sökbara listan** över alla `publicerad`-föreningar och moskéer. Den är en del av "Världen runtom" — en anledning att besöka plattformen även när man inte ska donera just nu.

Den är **inte** en insamlingslista (det är M11). Den är en lista över **organisationer**.

## 3.2 Hur en förening visas — katalogkortet

Varje förening visas i listan som ett **katalogkort**:

- **Logotyp / bild** (eller en neutral platshållare per organisationstyp om ingen bild finns).
- **Namn.**
- **Typ** (badge, t.ex. "Moské").
- **Plats** — stad + region.
- **Verifieringsmärke** — *"Verifierad — org.nr"* eller *"Verifierad — kontakt"* (Block 5). Inget märke om föreningen ännu inte fullt verifierats men ändå publicerats i undantagsfall.
- **Kort beskrivning** (de 300 tecknen).
- Diskret räknare om relevant: *"Har drivit 3 insamlingar"* / *"Stöttat 5 insamlingar via collab"* — länkar till organisationsprofilen (M9). Visas bara om siffran > 0; en ny förening ska inte se tom ut.

## 3.3 Föreningsprofilen / organisationssidan

Klick på ett katalogkort → **organisationsprofilen**. Datamässigt ägs profil-ytan av M9; M10 levererar **innehållet**:

- All grundinfo från formuläret (det publika).
- Verifieringsstatus.
- **Insamlingar föreningen driver** (egna insamlingar, Block 1.4).
- **Insamlingar föreningen stöttat via collab** (Block 4).
- Länk till webbplats/social media om angiven.

## 3.4 Moské-sidan specifikt

En moské är en organisationstyp men förtjänar en lite rikare sida — folk söker en moské för att *besöka* den, inte bara läsa om den.

**Moské-sidan i M10 innehåller (grundinfo):**
- Namn, adress, karta-pin.
- Typ av böneplats, kort beskrivning.
- Verifieringsstatus.
- Kontaktväg (det föreningen valt publikt).

**Vad som INTE bor i M10 — kopplas in från M14:**
- **Bönetider och öppettider.** Dessa är dynamiska, ändras dagligen/säsongsvis → ägs av M14 (Events & platsinfo).
- **Events** — fredagsföreläsningar, iftar-arrangemang, ungdomskvällar → ägs av M14.

**Designbeslut — M10 äger moskéns *identitet*, M14 äger moskéns *kalender*.** M10 svarar på "finns den här moskén, var ligger den, är den äkta". M14 svarar på "vad händer där och när". Att hålla isär det betyder att vi kan lansera katalogen (Block A/C i masterkartan) utan att vänta på att hela events-systemet är klart.

## 3.5 Sök & kategorisering inom katalogen

Katalogen filtreras på:
- **Typ** — organisationstyperna i 2.3.
- **Plats** — stad och region/län.
- **Fritextsök** — namn.
- **Verifieringsnivå** — kan filtreras, men default visar alla publicerade.

**Designbeslut — katalogens sök är enklare än M11:s insamlingssök.** En förening är ett stabilt objekt; en insamling har status, mål, deadline. Katalogen behöver inte M11:s fulla maskineri. Vi återanvänder UI-mönster och plats-datamodellen från M11/M12, men katalogsöket är ett eget, lättare ytlager. Den gemensamma plats-taxonomin (län, stad) ägs av M12.

---

# BLOCK 4 — Collab

## 4.1 Vad collab är

**Collab = en privatperson driver en insamling med uttryckligt stöd av en moské eller förening.**

Privatpersonen är fortfarande **ägare** (M1 Block 4) — collab byter inte ägarskap, byter inte vart pengarna går, byter inte vem som bär ansvaret. Det collab gör är att lägga till en **strukturerad collab-credit**: en synlig markering på insamlingen som säger *"Den här insamlingen stöttas av [Föreningens namn]."*

Det är skillnaden mellan:
- Ahmed skriver i sin beskrivning "min moské tycker det här är bra" — **bara ord, overifierat**.
- Ahmed har en collab-credit från Rinkeby moské — **föreningen har aktivt godkänt att stå bakom det här, synligt och verifierat.**

## 4.2 Varför collab finns

Tre skäl, alla i linje med visionen:

1. **Det lyfter privatpersonen.** En privatperson har bara sin KYC. En collab-credit lånar föreningens upparbetade trovärdighet. En donator som tvekar inför ett okänt namn litar mer när en känd moské står bakom.
2. **Det belönar generösa föreningar.** En förening som ställer upp för sina medlemmars initiativ syns för det. Princip 8: vi bär det mänskliga behovet av återkoppling. Föreningen som hjälper får erkännande för att den hjälper.
3. **Det sprider föreningens existens organiskt — utan att vara reklam.** När en moské taggas på en uppskattad insamling exponeras moskén för insamlingens besökare. Det är inte en annons — det är en *naturlig konsekvens* av att ha gjort något bra. Princip 6 (premium genom omsorg, inte prål) och princip 13 (samordna befintlig godhet) möts här.

## 4.3 Strukturen — vad en collab-credit innehåller

En collab-credit är ett **relationsobjekt** mellan en insamling (M1) och en organisation (M10 Block 1):

- **Insamlingen** — vilken insamling det gäller.
- **Organisationen** — vilken förening/moské.
- **Collab-typ** (dropdown — strukturerad, inte fritext):
  - *Initiativtagare* — föreningen bad privatpersonen driva detta.
  - *Stödjer* — föreningen ställer sig bakom initiativet.
  - *Praktisk partner* — föreningen hjälper till med genomförandet (t.ex. logistik, kontakter på plats).
- **Status** — `begärd` / `godkänd` / `avböjd` / `återkallad`.
- **Tidsstämplar** — när begärd, när godkänd.

På insamlingssidan visas en godkänd collab-credit som ett **diskret, snyggt element** — föreningens namn + logotyp + collab-typ, klickbart till organisationsprofilen. Inte en stor banner, inte en annonsruta. Premium genom omsorg.

**M1 Block 4 har redan uttaget:** *"Collab-organisationer — 1 → 0..flera — äger M10."* M10 fyller det uttaget med den här strukturen.

## 4.4 Hur collab begärs och godkänns

**Grundregel: föreningen MÅSTE godkänna att den taggas. Ingen ensidig taggning.**

Detta är icke förhandlingsbart. En privatperson får aldrig kunna sätta en moskés namn på sin insamling utan moskéns aktiva ja. Annars blir collab ett verktyg för att stjäla trovärdighet — exakt motsatsen till vad det är till för.

**Flödet:**

1. **Privatpersonen begär collab** — i M2-wizarden eller från en aktiv insamling: "Vill du att en förening ska stå bakom den här insamlingen? Sök och bjud in dem." Hen väljer en förening **ur katalogen** (måste vara en `publicerad` katalogpost — Block 3) och föreslår collab-typ.
2. **Begäran skickas** → collab-credit skapas med status `begärd`. Föreningens behöriga företrädare notifieras (M15).
3. **Föreningen svarar** via sitt föreningskonto (Block 1):
   - **Godkänner** → status `godkänd`. Collab-credit blir synlig på insamlingen.
   - **Avböjer** → status `avböjd`. Privatpersonen notifieras vänligt; ingenting visas publikt om avböjandet (en förening ska kunna säga nej utan att det syns).
4. **Föreningen kan återkalla** ett godkänt collab senare (`återkallad`) — t.ex. om insamlingen utvecklas på ett sätt föreningen inte vill förknippas med. Då försvinner collab-crediten från insamlingen. Privatpersonen notifieras.

**Tidsfönster:** en `begärd` collab som föreningen inte svarat på inom riktmärke 14 dagar → faller automatiskt till `avböjd` (tyst nej). Insamlingen ska inte fastna i väntan. Princip 3, självgående.

**Kan en insamling ha flera collab?** Ja — 0 till flera (M1 Block 4 säger det). En insamling kan stöttas av både en lokal moské och en hjälporganisation. Men varje collab godkänns separat.

## 4.5 Förhållandet till granskning och ansvar

Viktiga gränsdragningar — collab får inte bli en bakdörr:

- **Collab ersätter inte projektgranskning.** Att en moské godkänt collab betyder inte att insamlingen slipper M3. Granskaren granskar projektet oavsett. En collab-credit *kan* sänka misstankegraden (en känd moské står bakom) men aldrig hoppa över granskningen. Princip 7.
- **Collab flyttar inte juridiskt ansvar.** Pengarna går fortfarande till privatpersonens connected account (M5). Föreningen är inte mottagare, inte utbetalningsmål, inte ansvarig för genomförandet. Detta måste vara **kristallklart i UI** så ingen donator tror att de ger "till moskén".
- **Collab och egen föreningsinsamling är olika saker.** Driver föreningen insamlingen själv (Block 1.4) är föreningen ägare. Stöttar föreningen en privatpersons insamling är det collab. UI:t får aldrig blanda ihop dessa två.

## 4.6 Kantfall

- **Privatpersonen vill tagga en förening som inte finns i katalogen** → går inte. Föreningen måste först självregistrera (Block 2). Detta är medvetet: det driver organiskt fler föreningar in i katalogen, och det garanterar att taggade föreningar är granskade.
- **Insamlingen blir nedstängd som fejk (M1 Block 5) trots collab** → collab-crediten försvinner med insamlingen; föreningen notifieras. Att en förening blev lurad är inte föreningens fel — men det är ett dataingångsvärde i Block 5 om mönstret upprepas.
- **Föreningen vill återkalla collab efter att insamlingen avslutats** → tillåts; crediten blir `återkallad` men händelsen loggas (transparenshistorik, M7) så det inte ser ut som om crediten aldrig fanns.

---

# BLOCK 5 — Verifiering av föreningar

## 5.1 Problemet

En katalog är bara värd något om posterna är **äkta**. En fejk-moské i katalogen, eller en collab-credit från en organisation som inte finns, vore förödande — det är hela trovärdigheten i samma fälla som GoFundMes "publicera först". Block 5 svarar på: **hur vet vi att en moské/förening är på riktigt?**

## 5.2 De två verifieringsnivåerna

| Nivå | Hur den uppnås | Märke i katalogen |
|---|---|---|
| **Verifierad — org.nr** | Org.nr finns och stämmer mot offentligt register; namn matchar | "Verifierad — org.nr" |
| **Verifierad — kontakt** | Inget/ännu inget org.nr, men föreningens existens och kontaktväg bekräftad manuellt | "Verifierad — kontakt" |

**Designbeslut — två nivåer, inte en tröskel.** Att kräva org.nr för *alla* hade stängt ute äkta nybildade moskéer (research: en ideell förening *finns* vid konstituerande möte, org.nr kommer senare via SKV 8400). Att kräva *ingenting* hade öppnat för fejk. Två nivåer löser bägge: org.nr är den starka, snabba vägen; kontaktverifiering är den manuella reservvägen för det som är äkta men pappersmässigt omoget.

## 5.3 Org.nr-kontroll

**Vad granskaren kontrollerar:**
- Org.numret existerar.
- Det är registrerat på en **ideell förening, stiftelse eller trossamfund** — inte ett aktiebolag, inte en enskild firma (en kommersiell aktör hör inte hemma i katalogen).
- Det registrerade namnet **rimligt matchar** det namn föreningen angav.

**Hur:** offentlig registerslagning. **Öppen fråga (5.7):** exakt teknisk källa — manuell slagning vid lansering, automatiserad mot ett register-API när volymen kräver det. Vid lansering är volymen låg → manuellt räcker, princip 3 säger automatisera *när det behövs*, inte i förebyggande syfte.

**Princip 13 i praktiken:** vi bygger inte ett eget föreningsregister. Skatteverket och Bolagsverket har redan sanningen om vilka org.nr som finns. Vi lutar oss mot det.

## 5.4 Kontaktverifiering

Gäller alltid (utöver org.nr) och är **enda** vägen för föreningar utan org.nr.

**Vad granskaren gör:**
- Bekräftar att föreningen kan nås via en **officiell kontaktväg** — en e-post på föreningens egen domän, en publik moské-sida, ett verifierbart telefonnummer.
- Skickar en **bekräftelseförfrågan** till den officiella kontaktvägen (inte bara till personen som fyllde i formuläret) → någon med faktisk koppling till föreningen måste bekräfta.
- Det här fångar fallet "en privatperson registrerar en förening hen inte tillhör" (Block 2.6): personen som fyllde i formuläret är inte beviset — föreningens egen kontaktväg är beviset.

**För moskéer utan org.nr:** granskaren kan komplettera med offentligt belägg — moskén är känd, har en fysisk adress, finns omnämnd. Omdöme, inte kryssruta. Princip 4: vi gör vårt bästa, 100 % säkerhet finns inte.

## 5.5 Vad collab kräver

En förening kan ha en katalogpost utan att driva insamlingar (Block 1.2). Men i det ögonblick föreningen ska **röra pengar eller låna sin trovärdighet** höjs ribban:

- **Driva egen insamling** (Block 1.4) → kräver **org.nr** (för Stripe connected account, M5) **och** KYC på primär företrädare (M6). Pengar kräver full identitet.
- **Godkänna collab** (Block 4) → kräver att föreningen är minst **`publicerad`** i katalogen (alltså minst kontaktverifierad). En collab-credit lånar trovärdighet — den får bara komma från en verifierad post.

**Princip — synlighet är lätt, pengar och trovärdighetslån är svårare.** Stegen är medvetet olika höga.

## 5.6 Vad händer om en förening missköter sig

"Verktyg, inte polis" gäller även här — men en förening i katalogen bär plattformens implicita förtroende, så missbruk får konsekvenser.

**Vad räknas som missbruk:**
- Föreningen driver en insamling som visar sig vara fejk eller principmässigt grovt fel.
- Föreningen ger collab-credit i utbyte mot något (sälja sitt namn) — collab ska vara genuint stöd, inte en handelsvara.
- Diskriminerande eller sekteristiskt agerande (M8, princip 10/11).
- Föreningens uppgifter visar sig medvetet falska.

**Trappan (parallell med M1 Block 5:s pausad/nedstängd-logik):**

| Steg | Åtgärd | Vem beslutar |
|---|---|---|
| 1 | **Påpekande** — granskare kontaktar föreningen, ber om rättelse | Granskare |
| 2 | **Katalogpost → `vilande`** — dold under utredning, befintliga collab fryses | Granskare |
| 3 | **Föreningskonto pausat** — pågående insamlingar pausas, medel hålls hos Stripe (M5) | Granskare/admin |
| 4 | **Permanent nedstängning** — katalogpost borttagen, konto stängt, vid brott ev. polisanmälan | Admin |

Detaljerade beslutsregler och vem som beslutar på varje steg ägs av **M8** (policies & regler) — M10 definierar trappan, M8 fyller den med exakta kriterier.

**Princip — vi anklagar inte, vi agerar på fakta.** En förening som gör fel en gång får ett påpekande, inte en avrättning (princip 4). En förening som upprepat eller grovt missbrukar förtroendet tas bort. Mellan dessa: granskarens omdöme.

## 5.7 Kantfall

- **Förening som var äkta men blir vilande/upplöst** → katalogposten går till `vilande` när vi får vetskap; ingen skam, bara ett faktum. Pågående egna insamlingar hanteras som "insamlaren försvinner" i M1 Block 5.
- **Org.nr finns men föreningen är vilande hos Skatteverket** → granskaren bedömer; en vilande förening kan ändå vara en aktiv moské. Omdöme.
- **Någon kapar ett föreningskonto** → identitetsincident, ägs av M6:s säkerhetshantering; M10 fryser kontot tills M6 löst det.

---

## 5. Designval & motivering (hela Modul 10)

| Beslut | Motivering |
|---|---|
| Föreningskonto och katalogpost är separata men länkbara objekt | Att synas (katalog) och att hantera pengar (konto) kräver olika mycket. Separationen låter katalogen växa snabbt utan att tvinga full KYC på alla. |
| Föreningar driver insamlingar via samma granskning som privatpersoner | Granskningen skyddar projektet, inte personen bakom. Att vara verifierad förening ger snabbare kö (M3), aldrig ingen granskning. Princip 7. |
| Katalogen är ren självregistrering, inte vår lista | Manuellt underhåll skalar inte (princip 3). Föreningen äger och uppdaterar sin egen post. Princip 13. |
| Kort formulär (13 fält, 5 frivilliga) | Friktion vid registrering minskar antal seriösa föreningar som söker. Tillräckligt för granskning, inte mer. |
| Endast muslimska föreningar/moskéer i katalogen | Princip 12 pekar uttryckligen ut katalogen som undantaget. Katalogen ska kännas relevant och sammanhållen — inte en allmän föreningskatalog. |
| Icke-muslimska föreningar avvisas vänligt, aldrig nedlåtande | Premium genom omsorg (princip 6). Ett nej får inte kännas som en anklagelse. |
| Två verifieringsnivåer (org.nr / kontakt) | Org.nr är stark men nybildade moskéer saknar det ännu. Kontaktverifiering är reservvägen så vi inte stänger ute det äkta. Princip 4. |
| Collab kräver alltid föreningens aktiva godkännande | Utan det blir collab ett verktyg för att stjäla trovärdighet. En förening måste kunna säga ja — och nej. |
| Collab-typ är strukturerad dropdown, inte fritext | Donatorn ska förstå *vad* stödet betyder. Fritext blir brus och är osökbart. |
| Collab flyttar inte ägarskap, pengar eller ansvar | Pengar går till privatpersonens konto (M5). UI måste vara kristallklart så ingen donerar "till moskén" av misstag. |
| Endast katalog-publicerade föreningar kan taggas i collab | Garanterar att taggade föreningar är granskade; driver organiskt fler föreningar in i katalogen. |
| M10 äger moskéns identitet, M14 äger dess kalender | Att hålla isär identitet (stabil) och events/öppettider (dynamiska) gör att katalogen kan lanseras utan att hela M14 är klart. |

---

## 6. Kopplingar

**Modul 10 tar in:**
- Roller, behörigheter och KYC från **M6** — vem som får företräda en förening, hur en företrädare verifieras.
- Plats-taxonomin (län, stad) från **M12** — samma geografi som kartan använder.
- Granskningskö och SLA från **M3** — katalogansökningar och föreningars insamlingar går i samma kö, skilda ärendetyper.
- Granskningspolicy och missbruks-kriterier från **M8** — exakt vad som avvisas och vad som utlöser trappan i Block 5.6.

**Modul 10 lämnar ut:**
- Föreningar som ägare av insamlingar till **M1** (Block 1.4) och **M2** (wizard).
- Collab-credit-objektet som fyller M1 Block 4:s collab-uttag och visas på insamlingssidan.
- Katalogdata (föreningar, moskéer, plats) till **M11** (sök/discovery refererar katalogen) och **M12** (moskéer som pins på kartan).
- Moskéns identitet till **M14**, som hänger på öppettider och events.
- Organisationsprofilernas innehåll till **M9** (profilytan).
- Verifieringshändelser och missbrukstrappa-status till **M16** (admin/larm).
- Triggers till **M15**: katalogpost publicerad, collab begärd/godkänd/avböjd, komplettering begärd.

**Beroende-flagga:** Block 4 (collab) kan inte byggas färdigt förrän M1 Block 4:s collab-uttag och M3:s granskning står. Block 1.4 (föreningar driver insamlingar) beror på M5:s Stripe Connect för org.nr-konton.

---

## 7. Säkerhet & anti-kaos

- **Granska före publicering** — ingen katalogpost blir synlig ogranskad (Block 2.5). Princip 7 gäller även katalogen.
- **Ingen ensidig collab-taggning** — en förenings namn kan aldrig sättas på en insamling utan föreningens aktiva ja (Block 4.4). Skyddar mot trovärdighetsstöld.
- **Tvåstegs verifiering** — org.nr mot offentligt register + kontaktverifiering mot officiell kontaktväg fångar fejk-föreningar och kapade registreringar (Block 5).
- **Kontaktverifiering går till föreningens kanal, inte till formulärifyllaren** — fångar "registrerar en förening jag inte tillhör".
- **Missbrukstrappa, inte avrättning** — påpekande → vilande → pausat → nedstängt. Proportionerligt (princip 4), men förtroendebrott får konsekvenser.
- **Pengar kräver mer än synlighet** — egen insamling kräver org.nr + KYC; synlighet räcker med kontaktverifiering. Ribban höjs där risken höjs.
- **Sekterism fångas, inriktning fångas inte** — granskaren avvisar en förening vars syfte är att angripa andra muslimer (princip 10), men aldrig en förening för dess sunni/shia-tillhörighet (princip 11).
- **Föreningskonton: egen BankID per företrädare** — inget delat lösenord; behörighet kan dras in utan att röra resten.

## 8. Automatisering

**Självgående (ingen människa):**
- Katalog-sök, filtrering, kortrendering.
- `begärd` collab faller till `avböjd` efter 14 dagar utan svar.
- Notiser vid alla statusbyten (M15).
- Småändringar i en katalogpost (beskrivning, länk) publiceras direkt, loggas.
- Räknare på katalogkort ("har drivit X insamlingar").

**Kräver människa:**
- Granskning av katalogansökan — är detta en muslimsk förening, stämmer org.nr (Block 2.5, 5.3).
- Bedömning av gråzonsfall (2.4) och föreningar utan org.nr (5.4).
- Missbrukstrappan (5.6) — varje steg är ett människobeslut.
- Sammanslagning av dubbletter.

Riktmärke: katalogen sköter sig själv efter publicering. Människan behövs vid grinden (granskning) och vid missbruk — inte i den dagliga driften.

## 9. Öppna frågor

1. **Teknisk källa för org.nr-kontroll** — manuell slagning vid lansering; vilket register-API automatiseras mot senare? → bedöms tillsammans med M16.
2. **Exakt SLA för katalogansökningar** (riktmärke 5 arbetsdagar) → spikas i M3.
3. **Ska en förening kunna "verifieras uppåt"** — gå från "Verifierad — kontakt" till "Verifierad — org.nr" när org.nr väl finns? Antagande: ja, automatiskt vid nästa redigering. Bekräftas vid bygge.
4. **90-konto** — research nämner att 90-konto (Svensk Insamlingskontroll) är frivilligt och kräver auktoriserad revisor. Ska ett 90-konto visas som ett extra, högre verifieringsmärke i katalogen? → parkerat, bedöms i M8 tillsammans med föreningsdokumenten.
5. **Belöning för generösa föreningar utöver synlighet** — ska en förening som ofta stöttar via collab få en badge på sin organisationsprofil? → bedöms tillsammans med M7:s badgesystem.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 10:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (föreningskonton), Block 2 (självregistrering — formulär, granskning, målgruppsregel), Block 3 (katalogen, moské-sidan), Block 4 (collab — struktur, godkännandeflöde), Block 5 (verifiering, missbrukstrappa) nyskrivna. |
