# Modul 11 — Listning, sökning & discovery

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`, `Modul-10-Organisationer-katalog-collab.md`

---

## 1. Vad modulen är

Modul 11 definierar **hur en besökare hittar något att stötta.** Startsidan, söket, filtren, kategorisidorna, och mekaniken som styr vilka insamlingar som visas var.

Den löser den enda fråga en ny besökare har: *"Jag vill ge sadaqah — vad ska jag ge till?"*

Den är **inte** insamlingens innehåll (M1), inte donationsflödet (M4), inte katalogen över föreningar (M10). Den är **bryggan** mellan en besökare och en insamling — och bryggan i andra riktningen: mellan en insamlare och de besökare som redan finns på plattformen.

---

## 2. Varför den behövs

Två problem, två målgrupper:

**Problemet för besökaren.** En person öppnar plattformen med en vilja att ge men ingen specifik insamling i huvudet. Om hon möts av en tom sökruta eller en oordnad lista hoppar hon av. Hon behöver bli **ledd** till något meningsfullt — snabbt, lugnt, utan att behöva veta vad hon letar efter.

**Problemet för insamlaren — och det är det stora.** På GoFundMe bygger varje insamlare sitt **eget** nätverk från noll. Du delar din länk på din Facebook, till dina vänner. Når du inte ut själv, når du ingen. Plattformen ger dig ingen trafik.

Sadaqa Sweden ska vara motsatsen: **en samlingsplats där all trafik är delad.** En besökare som kom för Ahmeds bönematter får också se Fatimas brunnsprojekt. Varje aktiv insamling drar nytta av varje annan insamlings besökare. **Trafiken bygger sig själv.** Det är M11:s själ — och det är skälet att en plattform över huvud taget slår en samling enskilda insamlingslänkar.

Utan M11 är plattformen en hög med insamlingar ingen hittar. Med M11 är den en marknadsplats för godhet där flödet rör sig av sig självt.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Startflödet — vad besökaren ser först, hur delad trafik fungerar | ✅ Spikad |
| 2 | Sök & filter — kategori, plats, modell, status | ✅ Spikad |
| 3 | Kategorisidor & sortering — popularitetsranking, dubblettavstyrning | ✅ Spikad |
| 4 | Geografisk filtrering — hjälp-plats, region, koppling till kartan | ✅ Spikad |
| 5 | Discovery som donationsmotor — dubblettvarning, relaterade insamlingar | ✅ Spikad |

Block 1 sätter riktningen; Block 5 är den mekanism som gör M11 till en *motor* och inte bara en *katalog*.

---

# BLOCK 1 — Startflödet

## 1.1 Vad besökaren ser först

Startsidan har **ett jobb**: på några sekunder leda en obeslutsam besökare till en insamling hon vill stötta — utan att hon behöver söka.

**Startsidans struktur, uppifrån och ner:**

1. **Lugn hero-yta** — en mening om vad plattformen är (*"Insamlingar för det muslimska samhället i Sverige — granskade, trygga, bevisade."*) + en sökruta. Inget skrik, ingen karusell av effekter. Princip 6: premium genom omsorg, inte prål.
2. **"Aktiva nu"** — ett urval pågående insamlingar (se 1.3 för urvalslogik).
3. **Kategori-ingångar** — de fasta kategorierna (M1 Block 1) som klickbara ytor: Mosképrojekt, Vatten, Mat, Utbildning, Akut katastrofhjälp osv. För besökaren som vet *vilken sorts* godhet hon vill ge.
4. **"Nära dig" / geografiskt urval** — insamlingar kopplade till besökarens region eller en region hon väljer (Block 4).
5. **"Snart i mål"** — insamlingar nära sin deadline eller sitt målbelopp. Skapar en mild, ärlig brådska och hjälper insamlingar över linjen.
6. **Lugn statistik-rad** — diskret: *"X insamlingar har nått sitt mål"* / *"X kr har gått direkt till mottagare"*. Bevis på att plattformen levererar, inte en reklamsiffra. Datakällan är M16.

**Vad startsidan INTE har:** ingen oändlig scroll, ingen algoritmisk feed som suger tid, inga popups. Plattformen är ett verktyg för att ge — inte en uppmärksamhetsfälla. Princip 6.

## 1.2 Hur "trafiken bygger sig själv"

Detta är blockets kärnidé. Mekaniken:

- **Varje insamling har en egen länk** (M1: slug + slumpat ID). En insamlare delar den länken — på sin Whatsapp, i sin moské, var hon vill. Det är hennes egen räckvidd.
- **Men varje besökare som kommer in via den länken landar inuti plattformen** — och plattformen visar henne *mer*. På Ahmeds insamlingssida finns "Relaterade insamlingar" (Block 5). På startsidan hon klickar vidare till finns allas insamlingar.
- **Resultatet:** Ahmed marknadsför oavsiktligt också Fatima. Fatima marknadsför oavsiktligt också Ahmed. Den som drar in 100 besökare drar nytta av alla andras 100 besökare tillbaka.
- **Ju fler aktiva insamlingar, desto mer trafik per insamling.** Det är en positiv spiral — motsatsen till GoFundMes nollsummespel där varje insamlare är ensam.

**Designbeslut — plattformen "stjäl" inte en insamlares besökare, den *delar* dem.** En besökare som kom för Ahmed och ger till Ahmed gör precis det. Men en besökare som kom för Ahmed, redan gett, och fortfarande vill ge — henne leds vidare. Discovery aktiveras i de lägen där den hjälper, inte för att dra bort uppmärksamhet från insamlingen besökaren faktiskt kom för. Princip 5: verktyg, inte polis — vi tvingar ingen vidare, vi gör vägen vidare lätt.

## 1.3 Urvalslogik för "Aktiva nu" på startsidan

Vilka insamlingar visas på den begränsade hero-ytan? Detta får inte vara godtyckligt och får inte gå att köpa.

**Urvalet är en blandning — medvetet, så att ingen enskild faktor dominerar:**
- En del **populära** (popularitetspoäng, se Block 3).
- En del **nya** (publicerade senaste dagarna — så nya insamlingar får syre).
- En del **snart i mål** (hjälp dem över linjen).
- En del **roterande slump** bland alla aktiva (så att även en stillsam insamling då och då syns).

**Designbeslut — alltid lite slump i urvalet.** En ren popularitetsranking skapar en vinnare-tar-allt-effekt: den som redan syns får mer, den som inte syns dör. En liten roterande slumpkomponent ger varje granskad, seriös insamling en chans att mötas av rätt person. Princip 9-andan: plattformen ska lyfta godhet brett, inte bara toppen.

**Ingen betald placering. Någonsin.** Placering på startsidan kan inte köpas. Det skulle korrumpera hela förtroendemodellen. Den enda vägen till synlighet är att vara en bra, granskad insamling.

## 1.4 Vad en inloggad besökare ser

- **Gäst / utloggad:** den allmänna startsidan ovan.
- **Inloggad:** samma, plus en lätt personlig topp — *"Insamlingar i kategorier du gett till tidigare"*, *"Ahmed som du stöttade har en ny insamling"* (kopplar M15-notiser och M9-historik). Lätt personalisering, inte en algoritmisk feed.

**Kantfall — plattformen är ny, få insamlingar finns.** Tidigt finns kanske 5 aktiva insamlingar totalt. Då degraderar startsidan elegant: "Aktiva nu" visar helt enkelt *alla*, "Snart i mål" och "Nära dig" göms om de blir tomma. En tom sektion visas aldrig — den försvinner. Princip 6: inga trasiga kanter.

---

# BLOCK 2 — Sök & filter

## 2.1 Vad söket är

En **sökruta + ett filterpanel**. Besökaren som vet vad hon letar efter ska hitta det på under tio sekunder.

**Fritextsöket matchar mot:** titel, kort beskrivning, mottagarbeskrivning, hjälp-plats. Inte mot lång beskrivning fält för fält — det skapar brusiga träffar. Titeln väger tyngst.

## 2.2 Filtren

Alla filter går att kombinera. De speglar direkt fält på insamlings-objektet (M1) — inget filter finns som inte motsvarar riktig data.

| Filter | Värden | Källa (M1) |
|---|---|---|
| **Kategori** | De fasta kategorierna, multi-val | M1 Block 1, Fält 1 |
| **Hjälp-plats** | Land + region (var hjälpen landar) | M1 Block 1, Fält 6A |
| **Insamlar-plats** | Stad/region (var insamlaren finns) | M1 Block 1, Fält 6B |
| **Målbelopps-modell** | Fast / Intervall / Öppet | M1 Block 2, Fält 1 |
| **Status** | Aktiv / Snart i mål / Stängd / Avslutad-levererad | M1 Block 3 |
| **Insamlingstyp** | Privatperson / Förening / Collab-stöttad | M1 + M10 |

**Designbeslut — två separata platsfilter, för de svarar på olika frågor.**
- *Hjälp-plats* = "jag vill stötta insamlingar som hjälper Somalia". Princip: hjälp-plats är publik och detaljerad (M1).
- *Insamlar-plats* = "jag vill stötta insamlingar i min egen stad / mitt eget samhälle". Princip: insamlar-plats är integritetsskyddad — filtret arbetar bara mot stad/region, aldrig mot adress.

Att slå ihop dem hade dödat den ena halvan av varför folk söker geografiskt. De hålls isär. Geografisk filtrering fördjupas i Block 4.

## 2.3 Default-vy och vad som INTE syns

- **Default:** söket visar **bara `aktiv`** (och `aktiv`-undertillståndet "snart i mål"). Det är vad en besökare kan agera på.
- **`stängd` / `utbetald` / `avslutad_levererad`** — syns bara om besökaren aktivt filtrerar fram dem (t.ex. "visa avslutade — se vad som lyckats"). Avslutade insamlingar är **bevis och inspiration**, inte brus i det aktiva flödet.
- **`utkast`, `inskickad`, `under_granskning`, `ändring_begärd`, `avvisad`** — syns **aldrig** i sök. De är inte publika (M1 Block 3). Princip 7: inget ogranskat når allmänheten.
- **`pausad` / `nedstängd`** — syns inte i sökresultat. En pausad insamling är direktlänkbar (visar banner) men ska inte aktivt rekommenderas till någon.

## 2.4 Sortering inom sökresultat

Besökaren kan sortera på:
- **Relevans** (default vid fritextsök).
- **Populärast** (popularitetspoäng, Block 3).
- **Nyast.**
- **Snart i mål** (närmast deadline eller målbelopp).

**Ingen sortering på "störst belopp insamlat".** Det skulle lyfta de redan stora och begrava de små — tvärtemot "de små som händer runt om i Sverige" (Block 5). Plattformen lyfter aktivt det lilla.

## 2.5 Kantfall

- **Sök utan träffar** → tom-tillstånd som *leder vidare*: "Inga aktiva insamlingar matchar. Titta i kategorin X, eller se vad som händer nära dig." Aldrig en återvändsgränd.
- **Filterkombination som ger noll** → samma — föreslå att lossa ett filter.
- **Besökaren söker på en specifik förening** → katalog-träff (M10) erbjuds vid sidan av insamlings-träffar: "Letar du efter en förening? Se [Föreningens namn] i katalogen."

---

# BLOCK 3 — Kategorisidor & sortering

## 3.1 Vad en kategorisida är

Varje fast kategori (M1) har en **egen sida** — `/kategori/vatten`, `/kategori/utbildning` osv. En kategorisida är:
- En **ingång** för besökaren som vet vilken sorts godhet hon vill ge.
- En **landningsyta** för SEO — någon som googlar "samla in till brunnar Sverige" ska landa här.
- Den yta där **dubblettavstyrning** (3.3) får sin starkaste effekt.

**Innehåll:** kort förklaring av kategorin → de aktiva insamlingarna i kategorin → längst ner ett urval avslutade-levererade i kategorin (bevis: "så här har det gått förut").

## 3.2 Popularitetsranking inom en kategori

Insamlingar inom en kategori sorteras default på **popularitetspoäng**. Poängen är en sammanvägning — medvetet flerfaktoriell så ingen enskild siffra kan gamas:

| Faktor | Varför den räknas |
|---|---|
| **Antal donationer** (inte belopp) | Många små givare = brett förtroende. Antal, inte summa, så en stor insamling inte automatiskt vinner. |
| **Donationstakt senaste dagarna** | Fångar momentum — något som rör sig just nu. |
| **Engagemang** (dua, kommentarer, M13) | Folk bryr sig om den. |
| **Färskhet** | En lätt nyhets-boost så nya insamlingar inte begravs. |
| **Transparens-signaler** (M7) | Insamlare som lägger uppdateringar och har bevishistorik rankas något högre — vi belönar öppenhet. |

**Designbeslut — popularitet mäter brett förtroende, inte stora plånböcker.** Antal donationer väger tyngre än totalbelopp. En insamling med 200 gåvor på 50 kr är "populärare" än en med 2 gåvor på 5000 kr. Det speglar samhällets uppskattning, inte ett fåtal storgivare — och det matchar sadaqah-andan: den lilla återkommande gåvan.

**Poängen går inte att köpa och visas inte som en naken siffra.** Besökaren ser ordningen och mjuka signaler ("populär", "rör sig snabbt"), inte ett tal hon kan jaga. Manipulation (fejk-donationer för att klättra) fångas i M5/M16:s avvikelsedetektion.

## 3.3 Kategorisidan styr donatorn mot befintliga insamlingar

Detta är en av modulens viktigaste idéer och den gäller **två** målgrupper:

**För donatorn:** en person som vill "ge till vatten" möts på kategorisidan av **befintliga, granskade brunnsinsamlingar**. Hon behöver inte, och uppmuntras inte att, starta en egen. Att ge till en pågående insamling är snabbare för henne och bättre för mottagaren (samlade medel > splittrade). Kategorisidan gör det självklara valet — *stötta något som redan finns* — till det lättaste valet.

**För den blivande insamlaren:** om en kategori redan är välbefolkad ser en person som funderar på att starta en till att behovet redan adresseras. Detta knyter direkt an till Block 5:s dubblettvarning vid skapande.

**Designbeslut — discovery före skapande.** Plattformen visar alltid hellre en donator till en befintlig insamling än uppmuntrar en ny. Inte för att förbjuda nya — princip 5, verktyg inte polis — utan för att samordnad godhet (princip 13) ger mer hjälp per krona. Den nya insamlingen skapas när den verkligen behövs, inte av vana.

## 3.4 Kantfall

- **Kategori utan aktiva insamlingar** → sidan visar avslutade-levererade ("så här har vatten-insamlingar gått tidigare") + en mjuk inbjudan: "Ingen aktiv insamling i den här kategorin just nu — vill du starta en?" Här *uppmuntras* skapande, för här finns ingen dubblett att styra mot.
- **Insamling taggad i flera kategorier** (M1 tillåter multi-val) → syns på alla sina kategorisidor. Dess popularitetspoäng är densamma överallt.
- **Väldigt populär kategori med många insamlingar** → paginering + filtren från Block 2 inom kategorisidan, så listan inte blir oöverskådlig.

---

# BLOCK 4 — Geografisk filtrering

## 4.1 De två geografiska frågorna

Geografi möter besökaren på två helt olika sätt — exakt de två platsfält M1 Block 1 definierade:

1. **"Var landar hjälpen?"** → hjälp-plats. En besökare med rötter i Somalia vill se insamlingar som hjälper Somalia. En som följer Gaza vill se Gaza-insamlingar.
2. **"Vad händer i mitt samhälle?"** → insamlar-plats. En besökare i Malmö vill se vad muslimer i Malmö samlar in till — sin lokala moské, sina grannar.

Båda är legitima. Båda har egna filter (Block 2) och egna ingångar.

## 4.2 Filtrering på hjälp-plats

- Besökaren väljer **land** och, om hon vill, **region/specifik plats**.
- Resultatet: alla aktiva insamlingar vars hjälp landar där.
- Hjälp-plats är **detaljerad och publik** (M1: "desto mer desto bättre") → filtret kan vara fingranigt.
- Ingång på startsidan: en lista över **vanliga hjälp-länder/regioner** med antal aktiva insamlingar — "Somalia (4), Gaza (7), Syrien (3)".

## 4.3 Filtrering på insamlar-plats

- Besökaren väljer **stad eller region** i Sverige.
- Resultatet: aktiva insamlingar drivna av insamlare där.
- **Integritetsgräns:** filtret arbetar **bara** mot stad/region. Aldrig mot gata/adress — det fältet är insamlarens privata val (M1 Block 1, per-fält integritetskontroll). M11 får aldrig läcka det.
- Ingång: "Nära dig"-sektionen på startsidan (Block 1.1), baserad på besökarens valda eller härledda region.

## 4.4 Kopplingen till kartan (M12)

M11 levererar **listvyn** av geografisk data; **M12 levererar kartvyn** av samma data. De är två fönster mot samma underliggande plats-data på insamlings-objektet.

- Från M12:s Sverige-karta → klick på en region → leder in i M11:s filtrerade lista för den regionen.
- Från M11:s geografiska filter → en "visa på karta"-knapp → öppnar M12.
- **Den gemensamma plats-taxonomin** (län, kommuner, vanliga hjälp-länder) ägs av **M12** — M11 konsumerar den så att filter och karta alltid talar samma geografiska språk.

**Designbeslut — M11 äger "hitta i en lista", M12 äger "se på en karta".** Att dela upp det betyder att den textbaserade discovery:n (M11) kan byggas och lanseras tidigare (bygg-grupp B), medan den visuella kartan (M12, bygg-grupp C) kommer senare — utan att den ena väntar på den andra.

## 4.5 Kantfall

- **Besökaren tillåter ingen platsdelning** → "Nära dig" göms eller ber henne välja region manuellt. Aldrig tvång, aldrig en trasig sektion.
- **Hjälp-plats "Hela landet" eller "Globalt"** → samlas under en egen ingång ("Insamlingar utan en enskild plats") så de inte försvinner ur det geografiska flödet.
- **Region utan insamlingar** → tom-vy som leder vidare (samma princip som Block 2.5).

---

# BLOCK 5 — Discovery som donationsmotor

Discovery är inte sök. Sök är "besökaren letar". Discovery är **plattformen som visar besökaren något hon inte visste att hon letade efter** — och styr blivande insamlare mot det som redan finns. Detta block gör M11 till en *motor*.

## 5.1 Dubblettvarning vid skapande

**Var:** i M2:s skapande-wizard, när en person fyller i kategori + hjälp-plats + mottagare.
**M11 levererar mekaniken**, M2 äger wizardens UI.

**Vad som händer:** systemet söker fram **befintliga aktiva insamlingar som liknar** den som håller på att skapas — samma kategori, samma/närliggande hjälp-plats, liknande mottagare — och visar dem:

> *"Det finns redan 3 aktiva insamlingar för vatten i Somalia. Vill du stötta en av dem i stället? Att samla pengarna på ett ställe hjälper mottagaren mer."*

Med de befintliga insamlingarna som klickbara kort.

**Designbeslut — varning, inte spärr.** Personen kan alltid fortsätta och skapa sin insamling ändå. Princip 5: verktyg, inte polis. Vi *informerar* om att en likvärdig insats finns, vi *förbjuder* inte. Skälet att vissa ändå skapar en till är legitimt: hon kanske vill stötta en *specifik* by, eller driva insatsen genom sin egen moské. Det avgör hon — vi ger henne bara fakta hon annars saknat.

**Effekten:** mängden onödiga dubbletter sjunker. De insamlingar som ändå skapas är de som verkligen tillför något. Princip 13: samordna befintlig godhet hellre än att multiplicera den.

**M1 Block 5 säger redan:** *"Två insamlingar till samma sak — inte förbjudet. Discovery (M11) visar befintliga insamlingar vid skapande."* Detta block fyller den utfästelsen.

## 5.2 Relaterade insamlingar på insamlingssidan

På varje aktiv insamlings sida, diskret men närvarande: **"Relaterade insamlingar"** — ett litet urval andra insamlingar som liknar denna (kategori, hjälp-plats).

**Detta är trafikmotorn från Block 1.2 i praktiken.** Besökaren som kom för Ahmed och vill ge mer leds vidare. Besökaren som gett klart får en mjuk väg djupare in i plattformen i stället för att stänga fliken.

**Placering med omsorg:** relaterade insamlingar ligger **efter** donationsknappen och insamlingens egen story — aldrig före, aldrig som en distraktion från insamlingen besökaren faktiskt kom för. Vi delar trafik, vi kapar den inte (Block 1.2). Princip 6: omsorg i detaljen.

## 5.3 "De små som händer runt om i Sverige"

Visionen lyfter dem särskilt: de små, stillsamma insamlingarna runt om i landet som ingen känner till — den lokala moskén i en mindre stad, en familj som samlar till ett begravningsbehov i sitt grannskap. På en ren popularitetsplattform syns de aldrig. De drunknar.

**M11:s svar — aktiv synlighet för det lilla:**
- **Slumpkomponenten** i "Aktiva nu"-urvalet (Block 1.3) ger varje granskad insamling, även den minsta, en chans att möta rätt person.
- En egen, återkommande yta: **"Små insamlingar nära dig"** / **"Mindre insamlingar som behöver fler"** — lyfter medvetet insamlingar med få donationer hittills, sorterat geografiskt så de möter sitt lokala samhälle.
- **Sortering på "snart i mål"** (Block 2.4) hjälper också det lilla — en liten insamling med lågt mål når ofta "snart i mål"-status snabbt och får då en knuff.

**Designbeslut — plattformen lyfter aktivt det lilla, för marknaden gör det inte själv.** Lämnas allt åt popularitet vinner alltid de redan stora. Att medvetet ge syre åt de små är ett värdeval i linje med princip 9 (lyft godhet, anklaga ingen) och hela idén om att samordna *all* befintlig godhet — inte bara den synliga.

## 5.4 Personlig discovery för den inloggade

För en inloggad besökare väver M11 in lätt historikbaserad discovery (data från M9, notiser via M15):
- *"Du gav till en utbildningsinsamling — här är fler i samma kategori."*
- *"Ahmed, som du stöttade tidigare, har öppnat en ny insamling."* (Knyter an till M1:s parkerade mission-koncept — när återkommande insamlingar aktiveras blir detta starkt.)

**Gräns:** detta är *förslag*, aldrig en algoritmisk feed som är designad att maximera tid på sajten. Plattformen vill att besökaren ska *ge och gå i frid* — inte fastna. Princip 6, och hela plattformens karaktär: ett verktyg för godhet, inte en uppmärksamhetsekonomi.

## 5.5 Kantfall

- **Dubblettsökningen vid skapande hittar inget riktigt likvärdigt** → ingen varning visas; personen skapar utan friktion. Vi varnar bara när det finns en genuin överlappning.
- **"Relaterade insamlingar" har inget att visa** (tidig plattform, smal kategori) → sektionen göms helt. Aldrig en tom ruta.
- **En insamling lyfts i "små insamlingar" men är i själva verket misstänkt** → samma som överallt: pausade/nedstängda insamlingar lyfts aldrig av någon discovery-mekanism (Block 2.3). Discovery rekommenderar bara `aktiv` i gott skick.

---

## 5. Designval & motivering (hela Modul 11)

| Beslut | Motivering |
|---|---|
| Startsidan leder, den låter inte besökaren leta | En obeslutsam besökare som möts av en tom sökruta hoppar av. Startsidan ska föreslå, lugnt, på sekunder. |
| Delad trafik — varje insamling drar nytta av alla andras besökare | Kärnan i varför en plattform slår enskilda insamlingslänkar. GoFundMes nollsummespel byts mot en positiv spiral. |
| Slumpkomponent i alla framträdande urval | Ren popularitet ger vinnare-tar-allt. En liten roterande slump ger varje granskad insamling en chans. Lyfter det lilla. |
| Ingen betald placering, någonsin | Köpt synlighet korrumperar förtroendemodellen. Enda vägen upp är att vara en bra, granskad insamling. |
| Två separata platsfilter (hjälp-plats / insamlar-plats) | De svarar på olika frågor — "var landar hjälpen" vs "vad händer i mitt samhälle". Att slå ihop dem dödar den ena. |
| Insamlar-platsfilter arbetar bara mot stad/region | Adress är insamlarens privata fält (M1 per-fält integritet). M11 får aldrig läcka det. |
| Default-vy visar bara aktiva insamlingar | Besökaren ska se det hon kan agera på. Avslutade är bevis, inte brus — syns på begäran. |
| Popularitet = antal donationer, inte belopp | Brett förtroende, inte storgivare. Matchar sadaqah-andan: den lilla återkommande gåvan. |
| Popularitetspoäng visas aldrig som naken siffra | En synlig siffra blir något att jaga och gama. Mjuka signaler räcker. |
| Kategorisidan styr donatorn mot befintliga insamlingar | Samlade medel hjälper mottagaren mer än splittrade. Discovery före skapande. Princip 13. |
| Dubblettvarning vid skapande är en varning, inte en spärr | Verktyg, inte polis. Vi informerar om att en likvärdig insats finns; insamlaren beslutar. |
| Relaterade insamlingar placeras efter donationsknappen | Vi delar trafik, vi kapar den inte. Insamlingen besökaren kom för får komma först. |
| Plattformen lyfter aktivt de små insamlingarna | Marknaden lyfter dem aldrig själv. Att ge syre åt det lilla är ett medvetet värdeval (princip 9). |
| Discovery är förslag, aldrig en tidsmaximerande feed | Plattformen vill att besökaren ger och går i frid — inte fastnar. Princip 6. |
| M11 äger listvyn, M12 äger kartvyn av samma geo-data | Låter den textbaserade discovery:n lanseras tidigare (grupp B) utan att vänta på kartan (grupp C). |

---

## 6. Kopplingar

**Modul 11 tar in:**
- Insamlings-objektet från **M1** — kategori, plats, mål/modell, status, media. Varje filter och sortering speglar ett riktigt M1-fält.
- Donationsdata från **M4** — antal donationer och donationstakt föder popularitetspoängen.
- Engagemangsdata från **M13** — dua och kommentarer ingår i popularitetspoängen.
- Transparens-signaler från **M7** — uppdaterings-/bevishistorik ger en mjuk rankningsboost.
- Plats-taxonomin (län, kommuner, hjälp-länder) från **M12** — gemensam geografi för filter och karta.
- Föreningar/katalogdata från **M10** — så ett föreningssök kan erbjuda en katalog-träff vid sidan av insamlings-träffar.
- Användarens historik från **M9** — underlag för personlig discovery.
- Aggregerad statistik från **M16** — siffrorna i startsidans statistik-rad.

**Modul 11 lämnar ut:**
- Dubblettsöknings-mekaniken som **M2** visar i skapande-wizarden.
- "Relaterade insamlingar" som visas på insamlingssidan (yta delad med M1/M2).
- Geografiskt filtrerade listor som **M12** länkar in i från kartan.
- Discovery-triggers till **M15** — "ny insamling i en kategori du gett till", "insamlare du stöttat har startat något nytt".

**Beroende-flagga:** Popularitetspoängen (Block 3) kan inte byggas färdig förrän M4 (donationsdata) och M13 (engagemang) levererar sina signaler. M11 kan lanseras med en enklare popularitetsmodell (bara antal donationer + färskhet) och förfinas när M13 finns — den ordningen matchar bygg-grupperna i masterkartan.

---

## 7. Säkerhet & anti-kaos

- **Inget ogranskat syns** — sök och discovery rekommenderar bara `aktiv` i gott skick. `utkast`, `inskickad`, `under_granskning`, `avvisad` är osynliga; `pausad`/`nedstängd` lyfts aldrig av någon mekanism. Princip 7.
- **Ingen betald placering** — synlighet kan inte köpas; förtroendemodellen hålls ren (Block 1.3).
- **Manipuleringsskydd för popularitet** — poängen är flerfaktoriell och visas aldrig som en naken siffra; fejk-donationer för att klättra fångas av M5/M16:s avvikelsedetektion.
- **Integritetsgräns i geografiskt filter** — insamlar-platsfiltret rör bara stad/region, aldrig adress (M1 per-fält integritet).
- **Anti-vinnare-tar-allt** — slumpkomponent och aktiv synlighet för det lilla hindrar att en handfull stora insamlingar äter all uppmärksamhet.
- **Dubblettavstyrning** — dubblettvarning vid skapande (Block 5.1) minskar splittrad insamling och kaos i kategorierna utan att förbjuda något.
- **Tom-tillstånd leder alltid vidare** — ingen sökning och inget filter slutar i en återvändsgränd; besökaren tappas aldrig.

## 8. Automatisering

**Självgående (ingen människa):**
- All sökning, filtrering och sortering.
- Popularitetspoäng räknas om löpande av systemet.
- Urval för startsidans sektioner (populärt/nytt/snart i mål/slump) genereras automatiskt.
- Dubblettsökning vid skapande körs automatiskt i wizarden.
- Relaterade insamlingar och personlig discovery genereras automatiskt.
- Tomma sektioner göms automatiskt.

**Kräver människa:**
- I princip ingenting i den dagliga driften — M11 är nästan helt självgående.
- Justering av popularitetsformelns viktning är ett sällan-beslut (när data visar att den lyfter fel saker) — ägs av M16/admin, inte en daglig uppgift.
- Inget i M11 kräver att Zivar agerar för att en besökare ska hitta en insamling.

Riktmärke: M11 är en av de mest självgående modulerna. När den väl är byggd matar den sig själv från M1-, M4- och M13-data.

## 9. Öppna frågor

1. **Exakt viktning i popularitetsformeln** — hur mycket väger donationstakt mot antal mot engagemang? Sätts grovt vid bygge, justeras mot verklig data via M16.
2. **Hur stor slumpkomponenten ska vara** i startsidans urval — för liten och det lilla syns inte, för stor och startsidan känns godtycklig. Kalibreras efter lansering.
3. **Härledd kontra vald region** för "Nära dig" — ska besökarens region gissas (IP/grov geo) eller alltid väljas manuellt? Lutar mot: fråga en gång, kom ihåg valet. Bekräftas mot M6:s integritetslinje.
4. **SEO-omfattning för kategorisidor** — hur långt vi går med strukturerad data och landningssidor → bedöms tillsammans med M16.
5. **När personlig discovery blir för mycket** — var går gränsen mellan hjälpsamt förslag och uppmärksamhetsfälla? Principen är satt (Block 5.4); den exakta dosen bevakas efter lansering.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 11:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (startflödet, delad trafik), Block 2 (sök & filter), Block 3 (kategorisidor, popularitetsranking, dubblettavstyrning), Block 4 (geografisk filtrering, koppling till M12), Block 5 (discovery som donationsmotor, dubblettvarning, de små insamlingarna) nyskrivna. |
