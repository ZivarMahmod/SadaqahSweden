# Modul 9 — Profiler & användarsidor

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`, `Modul-08-Policies-och-regler.md`, `4-Bakgrund/Insamlingsplattform-sammanfattning.md`

---

## 1. Vad modulen är

Modul 9 definierar **den publika sidan för en person eller förening** — profilen. Vad den visar, hur den visar det, vad som kan döljas, hur den skiljer sig mellan en privatperson och en förening, och hur den känns.

**Den löser:** transparens-loopen (M7) producerar bevis och badges — men de behöver en *plats att leva*. Profilen är den platsen. Den är också där donatorn svarar på frågan *"vem är personen bakom den här insamlingen, och vad har hen gjort förut?"* — vilket är själva grunden för förtroende.

**Vad M9 INTE är:** den är inte auth (vem du är, vad du får göra — det är M6). Den är inte föreningskatalogen (M10). Den är *vad andra ser om dig*.

---

## 2. Varför den behövs

Tre skäl:

1. **Förtroende byggs över tid, inte per insamling.** En förstagångsinsamlare och en som genomfört åtta projekt med resultatbevis är inte lika trovärdiga — och de ska inte se likadana ut. Profilen är minnet som gör historik synlig. Utan den startar varje insamlare från noll varje gång.

2. **Transparens-loopen behöver en hemvist.** M7 bygger badges och bevis. Designprincip 8 säger att badges "bär det tvivlande hjärtat". Men en badge som ingen ser bär ingenting. Profilen är där det goda arbetet syns och där den som stängt loopen får sin trovärdighet.

3. **Premiumkänslan bor mycket här.** Masterkartan säger det rakt: *"Premiumkänslan bor mycket här."* En profil är en av de mest besökta ytorna på plattformen. Känns den billig känns hela plattformen billig.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Profilens innehåll — vad en publik profil visar | ✅ Spikad |
| 2 | Utmärkelser & hur de visas — badgesystemet från M7 på profilen | ✅ Spikad |
| 3 | Profilens integritet — per-fält kontroll, anonymitet | ✅ Spikad |
| 4 | Profil för olika roller — privatperson kontra förening | ✅ Spikad |
| 5 | Premiumkänsla — konkreta UX-detaljer | ✅ Spikad |

När alla fem är klara vet vi exakt vad en profil *visar*, vad den *döljer*, hur den *skiljer sig per roll* och hur den *känns*.

---

# BLOCK 1 — Profilens innehåll

Vad en publik profil visar. Profilen finns för **två kontotyper** — privatperson och förening (Block 4 reder ut skillnaden). Block 1 beskriver den gemensamma grunden, med privatpersonen som utgångspunkt.

## 1.1 Profilens delar

| Del | Innehåll | Obligatoriskt | Publikt som default |
|---|---|---|---|
| **Namn** | Personens namn (förening: föreningens namn) | Ja | Ja |
| **Profilbild** | En bild/avatar | Nej (annars en lugn standard-avatar) | Ja |
| **Kort presentation** | Max ~200 tecken, fritext — "vem är jag, varför samlar jag in" | Nej | Ja, om ifylld |
| **Plats** | Stad/region — samma integritetslogik som M1 insamlar-plats | Nej | Per-fält enligt Block 3 |
| **Medlem sedan** | Datum kontot skapades | — | Ja |
| **Insamlingar drivna** | Lista över personens insamlingar | — | Ja (med filter, se 1.2) |
| **Utmärkelser/badges** | Från M7 — se Block 2 | — | Ja |
| **Transparens-historik** | Sammanställd track record — se 1.3 | — | Ja |
| **Taggade föreningar** | Föreningar/moskéer personen samarbetat med — se 1.4 | — | Ja |
| **Verifierad-markering** | Att personen är BankID-verifierad (M6) | — | Ja |

**Princip:** profilen är **mager men ärlig**. Den är ingen social media-profil med flöde, statusuppdateringar och vänlista. Den visar exakt en sak: *kan jag lita på den här personen med min sadaqah?* Allt på profilen ska tjäna den frågan.

## 1.2 Insamlingar drivna — listan

- Visar personens insamlingar som **kort** (samma kort-format som listning/discovery, M11).
- Varje kort visar tillstånd (M1 Block 3): `aktiv`, `avslutad_levererad`, `väntar_på_resultat`, osv.
- **Grupperas eller filtreras** i: Aktiva · Avslutade · Övriga. Besökaren ser snabbt vad som pågår.
- `utkast`, `inskickad`, `under_granskning`, `ändring_begärd`, `avvisad` syns **aldrig publikt** — endast för profilägaren själv på sin egen profil. Det publika visar bara det som varit eller är live.
- **Nedstängda insamlingar:** en `nedstängd` insamling (fejk, M8 Block 6) — se 1.3 om hur det hanteras på profilen.
- Tom historik (ny användare, inga insamlingar än): en lugn, varm tom-yta — ingen pinsam blank ruta. Se Block 5.

## 1.3 Transparens-historik — track record

Detta är profilens hjärta. En **ärlig sammanställning** av hur personen skött sina tidigare insamlingar — byggd direkt på transparens-loopen (M7).

Visar:
- **Antal insamlingar genomförda.**
- **Hur många som nått `avslutad_levererad`** (alla tre bevis inne).
- **Hur många som står i `väntar_på_resultat` eller `avslutad_utan_resultat`** — visas sakligt, utan dom.
- **Total summa som passerat genom personens insamlingar** (frivilligt att visa — Block 3).

**Tonprincip — kritisk:** transparens-historiken **anklagar aldrig**. Designprincip 9: *"plattformen visar bara historik."* En person med en `avslutad_utan_resultat` får inte en röd varningsskylt — historiken visar bara faktum: två levererade, en utan resultatbevis. Donatorn drar sin egen slutsats. Plattformen dömer inte.

**Nedstängd-fallet:** en `nedstängd` insamling är allvarligare än ett uteblivet resultatbevis — det är bekräftad fejk eller allvarligt brott (M8 Block 6). Den får synas på profilen sakligt ("insamling stängd efter utredning"), men i praktiken stängs ofta hela kontot vid bekräftad fejk (M6/M8) och då är profilen inte längre aktiv. Plattformen häng­er inte ut — den redovisar fakta.

## 1.4 Taggade föreningar

- En insamling kan ha **collab-organisationer** kopplade (M1 Block 4 → M10) — föreningar/moskéer som stöttat.
- På personens profil samlas dessa som "Samarbetat med: [förening] [moské]".
- Det fungerar som ett socialt förtroendekapital: en privatperson som upprepat samarbetat med en känd moské lånar trovärdighet från den.
- Kopplingen är **dubbelriktad och bekräftad** — en person kan inte ensidigt tagga en förening hen inte samarbetat med. Bekräftelsemekaniken ägs av M10.

## 1.5 Kantfall

- **Personen har bara avvisade insamlingar:** profilen visar då inga publika insamlingar alls (avvisade syns aldrig publikt). Profilen ser ut som en ny användares. Ingen offentlig skam för en avvisad ansökan — avvisning är inte ett brott.
- **Personen har en aktiv insamling men noll historik:** profilen visar den aktiva + tydligt "första insamlingen". Block 5 beskriver hur det presenteras varmt, inte misstänkt.
- **Donator utan egna insamlingar:** en ren donator kan ha ett konto men ingen "insamlare-profil" i egentlig mening. Block 3 + Block 4 reder ut hur mycket en sådan profil ens visar (default: mycket lite, ofta inget publikt alls).

---

# BLOCK 2 — Utmärkelser & hur de visas

Block 2 kopplar **badgesystemet från M7** till profilen. M7 *äger* badgesystemet (vilka badges finns, när de tilldelas). M9 äger *hur de syns på profilen*.

## 2.1 Vad en badge är — och inte är

Designprincip 8, ordagrant från visionen: *"Badges bevisar inte fromhet; de bär det tvivlande hjärtat."*

- En badge är **inte** ett betyg på personens tro eller värde inför Allah. Sadaqah är komplett när pengarna lämnar handen.
- En badge **är** en återkoppling i dunya — ett verktyg för det mänskliga hjärtat som behöver se att arbetet landade.
- Därför: badges visas **vackert men dämpat**. De firar — de skryter inte. Tonen är "tack och väl gjort", inte "nivå 7 uppnådd".

## 2.2 Badge-typer (referens — definieras i M7)

M7 spikar den slutliga listan. M9 planerar visningen mot åtminstone dessa:

| Badge (exempel) | Tilldelas när | Källa |
|---|---|---|
| **Resultat levererat** | En insamling når `avslutad_levererad` (alla tre bevis) | M7 |
| **Transparent insamlare** | Flera insamlingar i rad med fullständig loop | M7 |
| **Verifierad** | BankID-verifierad person/KYC klar | M6 |

Badgesystemet kan växa — M9:s visningsyta måste tåla fler badge-typer utan att bli plottrig.

## 2.3 Hur badges visas på profilen

- **En egen, lugn sektion** på profilen — "Utmärkelser". Inte utspridda glittrande ikoner överallt.
- Varje badge har: **ikon · namn · en mening som förklarar vad den betyder · datum den uppnåddes**.
- **Hover/tap** ger den korta förklaringen — så en besökare som inte känner systemet förstår direkt.
- **Per-insamling:** en `avslutad_levererad`-insamling visar en liten diskret bekräftelse-markering på sitt eget kort i listan (1.2) — så historiken är läsbar utan att öppna varje insamling.
- **Ingen badge = ingen markering.** En profil utan badges visar bara ingen utmärkelse-sektion (eller en mjuk "inga utmärkelser än"). Aldrig en negativ markering. Frånvaro av badge är inte en stämpel — det är bara frånvaro.

## 2.4 Hur "bra arbete" lyfts snyggt

- **Senaste utmärkelsen** kan lyftas högt på profilen — "Senast: Resultat levererat, mars 2026".
- En insamlare med stark historik kan få sin transparens-historik visad som en **lugn sammanfattningsrad** högst upp ("8 insamlingar · 8 resultat levererade") — ett rent, ärligt förtroende­kvitto.
- Detta data kan också mata **discovery (M11)** — välskötta insamlare/insamlingar kan lyftas i flödet. Men den mekaniken ägs av M11; M9 levererar bara datat.

## 2.5 Kantfall

- **Person med många badges:** sektionen får inte bli en pokal­hylla som skriker. Visa de viktigaste/senaste, "visa alla" fäller ut resten. Dämpning skalar.
- **Badge dras tillbaka** (t.ex. en insamling visar sig vara fejk efter att badge tilldelats): M7/M8 äger återkallandet; M9 slutar då bara visa badgen. Ingen "badge borttagen"-skylt — frånvaro räcker.
- **Förening kontra person:** föreningar kan ha egna badge-typer (Block 4). Visningslogiken är densamma.

---

# BLOCK 3 — Profilens integritet

Designprincip 2: **per-fält integritetskontroll.** Block 3 tillämpar den principen på profilen. Användaren bestämmer fält för fält vad som är publikt.

## 3.1 Grundmodellen

Samma trelagersmodell som M1:

```
Data LAGRAS  →  Plattformen/granskaren ser det som behövs  →  Besökaren ser bara det publika
```

- **Allt** som behövs för granskning och drift lagras (M6/M8).
- Användaren styr **per fält** vad som blir publikt på profilen.
- Default-inställningarna är satta så att en användare som aldrig rör inställningarna ändå har en trygg, rimlig profil — integritet by default, inte by effort.

## 3.2 Per-fält-tabell — profilen

| Profilfält | Publikt som default | Kan döljas? | Not |
|---|---|---|---|
| Namn | Ja | Begränsat | En insamlare måste visa *något* namn — anonym insamlare underminerar förtroende. Förnamn + initial kan tillåtas (öppen fråga 9.2) |
| Profilbild | Ja om uppladdad | Ja | Standard-avatar om ingen |
| Kort presentation | Ja om ifylld | Ja | |
| Stad/region | Stad: ja. Region: val | Ja | Aldrig gatuadress publikt — samma som M1 insamlar-plats |
| Medlem sedan | Ja | Nej | Lågkänsligt, bygger förtroende — låst publikt |
| Insamlingar drivna | Ja | Nej | Kärnan i en insamlar-profil. Kan inte gömmas — annars är profilen meningslös |
| Transparens-historik | Ja | Delvis | Antal/utfall: publikt. Total summa: kan döljas |
| Total summa insamlad | Ja | Ja | Vissa vill inte exponera summor — tillåtet att dölja |
| Taggade föreningar | Ja | Ja | |
| Badges | Ja | Nej | En badge är till för att synas. Att dölja den motverkar hela syftet |
| Kontaktuppgifter (e-post, telefon) | **Nej** | — | Aldrig publikt. Kontakt sker via plattformen |

**Princip:** det som rör **förtroende** (insamlingar, badges, medlem sedan, ett namn) är publikt och kan i regel inte gömmas — annars går det inte att lita på profilen. Det som rör **personen privat** (adress, kontakt, summor) styr användaren själv.

## 3.3 Donatorns anonymitet

En donator kan välja att synas **anonymt** — på insamlingens donatorlista och i community.

- **Anonym = publik anonymitet.** Identiteten lagras alltid internt (Stripe + plattform, M5/M6) — för kvitto, refund, bokföring och granskning. "Anonym" betyder att *andra besökare* inte ser namnet, inte att personen är osynlig för systemet.
- Donatorn väljer per donation (M4) — kan ge anonymt en gång och med namn nästa.
- En anonym donation visas som "Anonym givare" — aldrig tomt, aldrig fejkat namn.
- **Ren donator utan egna insamlingar:** har i praktiken ingen publik profilsida av betydelse. Default: en sådan profil är inte publikt åtkomlig alls. En person blir en "publik profil" först när hen driver en insamling.

## 3.4 Vad profilägaren ser om sig själv

- Profilägaren ser sin **egen profil fullt ut** — inklusive `utkast`, `inskickad`, `under_granskning`, avvisade insamlingar.
- En tydlig **förhandsvy "så här ser andra din profil"** — så användaren förstår exakt vad som är publikt. Detta är en omsorgsdetalj som hör ihop med Block 5: integritet man inte kan *se* är ingen riktig integritet.

## 3.5 Kantfall

- **Användaren döljer allt som går att dölja:** profilen krymper till namn + insamlingar + badges + medlem sedan. Det är fortfarande en fungerande, trovärdig insamlar-profil — minimi-nivån är medvetet satt så att en maximalt privat profil ändå håller.
- **Användaren vill ta bort sin profil helt:** kopplar till M6 (kontoradering) och M8 Block 5 (GDPR — bokföringsdata kan inte raderas). En profil med genomförda insamlingar kan inte spårlöst försvinna; den kan anonymiseras så långt lagen tillåter. M6 äger den processen.
- **Förening kan inte vara anonym:** en förening i katalogen (M10) måste vara identifierbar. Anonymitet finns bara för privatpersoner som donatorer, inte för föreningar.

---

# BLOCK 4 — Profil för olika roller

En profil betyder olika saker för en **privatperson** och en **förening**. Block 4 spikar skillnaden. Föreningskonton ägs av M10 — M9 äger hur en förenings *profil* ser ut.

## 4.1 De två profiltyperna

| | **Privatperson** | **Förening / moské** |
|---|---|---|
| Identitet | Person, BankID-verifierad (M6) | Organisation, verifierad vid katalog-registrering (M10) |
| Namn | Personnamn | Föreningens/moskéns namn |
| Hur den uppstår | Konto skapas via BankID | Självregistrering till katalogen, granskas (M10) |
| Finns i föreningskatalogen? | Nej | Ja (M10) |
| Profilbild | Personavatar | Logotyp |
| Kärninnehåll | Egna insamlingar, badges, track record | Egna insamlingar **+** föreningsinfo (vad föreningen gör, var den finns) |
| Kan ha öppettider/platsinfo? | Nej | Ja — moské-öppettider m.m. (M14) |
| Kan vara collab-partner? | Nej (collab stöttar; man är inte själv stödet) | Ja — kan tagga sig som collab på privatpersoners insamlingar (M10) |
| Anonymitet | Som donator: ja | Aldrig — föreningar ska vara identifierbara |

## 4.2 Privatpersonsprofilen

- Den profil Block 1–3 beskriver. Fokus: *den här människan och hennes track record.*
- Mager, ärlig, förtroende-orienterad.
- Drivs av piloten — bönematteinsamlaren är en privatperson, så denna profil är den som måste sitta först och bäst.

## 4.3 Föreningsprofilen

Föreningsprofilen är en **utbyggd** profil. Den har allt privatpersonens har, plus:

- **Föreningssektion:** vad föreningen är, dess ändamål, ort. Datakälla: M10 (katalogregistreringen).
- **Plats & öppettider:** för moskéer — adress, öppettider, böne­tider om relevant. Ägs av M14, visas på profilen.
- **Events:** kommande händelser föreningen arrangerar (M14).
- **Kopplade insamlare:** privatpersoner som taggat föreningen som collab — den dubbelriktade kopplingen från Block 1.4, sedd från föreningens håll.
- **Föreningsbadges:** föreningen kan ha egna utmärkelser (t.ex. "Verifierad förening"). M7/M10 äger definitionen.

**Princip:** föreningsprofilen är en knytpunkt — den binder ihop föreningens egna insamlingar, dess events, dess plats och de privatpersoner den stöttar. Privatpersonsprofilen är en enskild persons historik. Olika tyngdpunkt, samma grundbygge.

## 4.4 En person, två roller

- En person kan vara **både** privat insamlare *och* styrelsemedlem/medlem i en förening.
- Det är **två skilda profiler/konton** — personens privata profil och föreningens profil. De blandas inte.
- En person som agerar för föreningen gör det via föreningskontot; agerar hen privat, via sitt eget. M6 äger roll- och behörighetslogiken; M9 ser bara till att de två profilerna är tydligt åtskilda så ingen besökare förväxlar dem.
- **Granskar-rollen syns aldrig på en profil.** Att en person är granskare (en av de tre i styrelsen) är en intern roll (M6) — den exponeras inte publikt på profilen. En granskare som *också* driver en egen insamling syns bara som insamlare, som vem som helst. Detta skyddar mot intryck av jäv och håller granskningen opersonlig.

## 4.5 Kantfall

- **Förening utan egna insamlingar:** en moské kan finnas i katalogen (M10) och ha en profil utan att själv ha drivit en insamling — den är ändå en giltig profil (info, plats, events, collab-kopplingar). Föreningsprofilen är inte beroende av insamlingshistorik på samma sätt som privatpersonsprofilen.
- **Föreningen läggs ner / lämnar katalogen:** profilen arkiveras. Tidigare insamlingar den drev finns kvar (de hör till insamlings-objekten, M1) men föreningsprofilen visas som inaktiv. M10 äger processen.
- **Privatperson vill "uppgradera" till förening:** det är ingen uppgradering — det är en separat registrering av ett nytt föreningskonto (M10). Den privata profilen och historiken finns kvar parallellt.

---

# BLOCK 5 — Premiumkänsla

Masterkartan: *"Premiumkänslan bor mycket här."* Designprincip 6: **premium genom omsorg, inte prål** — *"lugn, tydlighet, snygga detaljer och inga trasiga kanter. Inte genom effekter."* Block 5 gör den principen konkret för profilen.

## 5.1 Vad premium INTE är

Säg det rakt först, så vi inte glider fel:

- Inte animationer som rör sig hela tiden.
- Inte gradient-explosioner, glittrande badges, konfetti.
- Inte "gamification" som gör sadaqah till ett poängspel.
- Inte täthet — en profil proppfull av widgets, siffror och knappar känns billig, inte rik.

Premium på den här plattformen är **lugn**. En profil ska kännas som ett välstädat, ljust rum — inte som en arkadhall.

## 5.2 Konkreta UX-detaljer som ger premiumkänsla

| Detalj | Vad det betyder konkret |
|---|---|
| **Generös luft** | Rikligt med mellanrum. Innehåll får andas. Inget trängs |
| **En tydlig hierarki** | Ögat vet direkt vart det ska: namn → track record → insamlingar → badges. En sak är viktigast per sektion |
| **Lugn, begränsad färgpalett** | Få färger, mjuka toner. Färg används sparsamt och meningsfullt — en accent, inte en regnbåge |
| **Genomtänkt typografi** | Läsbar, rofylld text. Tillräcklig radhöjd. Inga skrikiga rubriker. (Hör ihop med att Zivar har dyslexi — läsbarhet är inte kosmetika, det är funktion) |
| **Mjuka, konsekventa former** | Samma hörnradie, samma kort-stil överallt. Konsekvens *är* premium |
| **Vänliga tom-ytor** | Ny profil utan insamlingar: en varm, kort mening ("Här kommer [namn]s insamlingar att visas") — aldrig en blank ruta eller ett felmeddelande |
| **Diskreta, snabba interaktioner** | Hover och tap svarar mjukt och direkt. Inga laggiga eller ryckiga övergångar. "Inga trasiga kanter" |
| **Respektfull ton i all text** | Statustexter, tom-ytor, felmeddelanden — alltid varma och mänskliga. "Väntar på resultat", inte "MISSLYCKAD" |
| **Värdiga bilder** | Cover-bilder från insamlingarna visas i konsekvent format, väl beskurna. Bildäkthetspolicyn (M8 Block 4) gör att inga billiga stockbilder förstör intrycket |
| **Snabb laddning** | En profil som laddar direkt känns dyrare än en som hackar. Prestanda är en premiumkänsla |

## 5.3 Tonen i transparens-historiken

Detta är den känsligaste ytan att få rätt:

- En person med perfekt historik: visas **lugnt stolt** — "8 insamlingar, 8 resultat levererade". Ingen pokal, ingen fanfar. Ett rent kvitto.
- En person med en utebliven resultatrapport: visas **sakligt och utan dom** — "2 levererade · 1 väntar på resultat". Ingen röd färg, ingen varningstriangel, ingen anklagande text. Designprincip 9: plattformen visar, anklagar inte.
- En **ny** person utan historik: visas **välkomnande** — "Ny på Sadaqa Sweden" eller "Första insamlingen" som en neutral, varm markör. Aldrig som en misstankeflagga. Alla börjar någonstans.

Premium genom omsorg betyder här: **ingen användare ska känna sig uthängd, dömd eller pinsam av sin egen profil.** Profilen redovisar verkligheten med värdighet — för den välskötte insamlaren *och* för den som snubblat.

## 5.4 Profilen som helhetsupplevelse

- Profilen ska kännas **personlig men inte privat-utlämnande** — den berättar vem personen är som insamlare, inte allt om personens liv.
- Den ska kännas **trovärdig vid första anblick** — en besökare ska inom några sekunder kunna känna "den här personen kan jag lita på" eller "här finns en historik värd att titta närmare på".
- Den ska kännas **omsorgsfullt byggd** — varje detalj på plats, inget halvfärdigt, inga trasiga kanter. Det är respekt för både insamlaren och donatorn.

## 5.5 Kantfall

- **Profil på liten skärm:** premiumkänslan måste hålla i mobil — luft, hierarki och läsbarhet skalar ner utan att bli rörig. Mobil är troligen majoriteten av besökarna.
- **Mycket innehåll** (förening med många insamlingar, events, collab-kopplingar): hierarki och "visa mer"-utfällning håller sidan lugn. Mängd får aldrig bli plotter.
- **Trasig bild / saknad data:** mjuk fallback (standard-avatar, neutral platshållare) — aldrig en trasig bildikon eller "undefined". Inga trasiga kanter, bokstavligt.

---

## 5. Designval & motivering (hela Modul 9)

| Beslut | Motivering |
|---|---|
| Profilen är mager och förtroende-orienterad, inte ett socialt flöde | Profilen ska svara på exakt en fråga: kan jag lita på den här personen? Allt annat är brus |
| Transparens-historik är profilens hjärta | Förtroende byggs över tid. Utan synlig historik startar varje insamlare från noll varje gång |
| Historiken anklagar aldrig — visar bara fakta | Designprincip 9. `avslutad_utan_resultat` får ingen röd flagga. Donatorn drar slutsatsen, plattformen dömer inte |
| Avvisade/utkast-insamlingar syns aldrig publikt | En avvisad ansökan är inte ett brott. Ingen offentlig skam för att ha sökt och fått nej |
| Per-fält integritet med trygga defaults | Designprincip 2. Integritet by default — en användare som aldrig rör inställningar har ändå en trygg profil |
| Förtroende-fält (insamlingar, badges, namn) kan inte gömmas | En profil där allt förtroendebärande är dolt är meningslös att lita på |
| "Anonym" = publik anonymitet, inte total | Identitet behövs alltid för kvitto, refund, granskning. Anonymitet skyddar mot andra besökare, inte mot systemet |
| Förening kan aldrig vara anonym | Föreningar i katalogen måste vara identifierbara — det är hela poängen med en katalog |
| Förhandsvy "så här ser andra din profil" | Integritet man inte kan se är ingen riktig integritet. Premium genom omsorg |
| Privatperson och förening är skilda profiler/konton | Olika identitet, olika verifiering, olika syfte. Att blanda dem skapar förvirring |
| Granskar-rollen syns aldrig på en profil | Skyddar mot intryck av jäv och håller granskningen opersonlig. En granskare som driver egen insamling syns som vilken insamlare som helst |
| Premium = lugn, inte effekter | Designprincip 6. En profil full av animationer och glitter känns billig. Premium är det välstädade rummet |
| Ingen användare ska känna sig uthängd av sin egen profil | Värdighet för både den välskötte och den som snubblat. Plattformen redovisar med respekt |
| Mobil-först premiumkänsla | Majoriteten av besökarna är troligen på mobil — premiumkänslan måste hålla på liten skärm |

---

## 6. Kopplingar

**Modul 9 tar in:**
- Konto, roller och verifieringsstatus från **M6** — vem profilen tillhör, om den är BankID-verifierad.
- Badges och bevis från **M7** — utmärkelserna och transparens-historiken som visas.
- Insamlings-objekten och deras tillstånd från **M1** — listan över drivna insamlingar.
- Collab-kopplingar och föreningsdata från **M10** — taggade föreningar, föreningsprofilens innehåll.
- Plats, öppettider och events från **M14** — på föreningsprofilen.
- Anti-diskriminerings- och innehållspolicy från **M8** — gäller fritext på profilen (presentation).

**Modul 9 lämnar ut:**
- Profilsidor som **M11** (discovery) länkar till från insamlingskort och sökresultat.
- Track record-data som **M11** kan använda för att lyfta välskötta insamlare i flödet.
- Profillänken som **M13** (community) hänger på kommentarer/dua — vem som skrev.
- Föreningsprofiler som **M10** och **M12** (kartan) pekar mot.
- Den publika ytan som **M15** (notiser) kan länka till ("din insamling fick en ny badge — se din profil").

**Beroende-flagga:** M9 är meningsfull först när M7 (badges, bevis) och M1 (insamlingar) finns. Den hör därför hemma i bygg-grupp B — efter att Kärnan producerar något att visa.

---

## 7. Säkerhet & anti-kaos

- **Per-fält integritet** — adress, kontaktuppgifter och summor läcker aldrig mot användarens vilja. Trygga defaults.
- **Förhandsvy av egen publik profil** — användaren kan alltid verifiera vad som är synligt; inga obehagliga överraskningar.
- **Avvisade/utkast-insamlingar är osynliga publikt** — ingen kan kartlägga vem som fått nej.
- **Transparens-historik kan inte manipuleras av användaren** — den byggs av M7/M1-data, inte av fritext personen skriver om sig själv. Track record är fakta, inte självbeskrivning.
- **Anti-diskriminering** — fritext på profilen (presentation) lyder M8 Block 3; olämpligt innehåll fångas.
- **Granskar-rollen är dold** — minskar intryck av jäv och skyddar granskarna.
- **Förening kan inte fejka collab-kopplingar** — kopplingen är dubbelriktad och bekräftad (M10).
- **Ingen uthängning** — `avslutad_utan_resultat` och `nedstängd` redovisas sakligt; plattformen brännmärker inte.

**Kvarstående risk, sagt rakt:** en publik profil med track record kan kännas pressande — en insamlare kan uppleva `väntar_på_resultat` på sin profil som en offentlig stämpel även om vi formulerar den neutralt. Det går inte att designa bort helt; transparens har ett pris. Det vi gör: håller tonen saklig, färgen neutral, och språket mänskligt. Bättre en mild upplevd press att leverera än ett system utan ansvar alls.

---

## 8. Automatisering

**Självgående (ingen människa):**
- Profilen byggs och uppdateras automatiskt — ny insamling, ny badge, nytt tillstånd speglas direkt utan att någon rör profilen.
- Transparens-historiken räknas om automatiskt från M1/M7-data.
- Tom-ytor, fallback-bilder och standard-avatarer visas automatiskt vid saknad data.
- Slug/URL för profilen genereras automatiskt (samma princip som M1 — läsbar slug + permanent ID).

**Kräver människa:**
- Användaren själv: profilbild, presentation, integritetsinställningar.
- Granskaren: fritext på profilen omfattas av M8-policy men granskas i praktiken vid behov/rapport, inte rutinmässigt vid varje ändring (profiltext är lägre risk än insamlingstext).

Riktmärke: profilen är till ~95 % självgående. Den speglar bara data andra moduler redan producerar — den har inget eget arbetsflöde som kräver Zivar.

---

## 9. Öppna frågor

1. **Ren donator-profil** — ska en person som bara donerar ha någon publik profilsida alls? Default i denna plan: nej, en publik profil uppstår först vid första insamlingen. Bekräftas mot M4/M6.
2. **Namnformat för insamlare** — fullt namn, eller får förnamn + initial räcka publikt? Avvägning mellan integritet och förtroende. Bör spikas tillsammans med M6.
3. **Egna föreningsbadge-typer** — vilka utmärkelser kan en *förening* få (utöver "Verifierad förening")? Definieras i M7/M10.
4. **Kontaktväg via profilen** — ska en besökare kunna kontakta en insamlare via plattformen (utan att se e-post)? Om ja, hör mekaniken ihop med M13/M15.
5. **Hur länge en nedstängd insamling/ett stängt konto syns publikt** — sakligt redovisat, men hur länge? Kopplar till M6 (kontoradering) och M8 Block 6.
6. **Profil-URL-format** — slug + slumpat ID som M1, eller annat? Liten teknisk fråga, bekräftas vid bygge.

---

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 9:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (profilens innehåll, transparens-historik), Block 2 (utmärkelser & visning, kopplat till M7), Block 3 (per-fält integritet, anonymitet), Block 4 (privatperson kontra förening, en person/två roller), Block 5 (premiumkänsla — konkreta UX-detaljer). |
