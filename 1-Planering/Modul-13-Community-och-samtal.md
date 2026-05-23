# Modul 13 — Community & samtal

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md` (Block 4 — relationen kommentarer/dua)

---

## 1. Vad modulen är

Modul 13 är **den trygga sociala ytan** på plattformen — kommentarer, dua, reaktioner, samtal kring insamlingar. Den gör plattformen levande utan att göra den till ett socialt nätverk.

**Den löser:** en insamling utan röster är ett formulär. När en donator skriver *"Må Allah belöna er"* och en annan trycker dua-knappen blir insamlingen en plats där människor möts kring godhet. Det är skillnaden mellan att läsa en sida och att känna sig del av något.

> **Kritiskt — läs detta först.** Detta är **INTE en Facebook.** Huvudmålet (insamling) ska alltid vara i centrum. Community är *kryddan*, aldrig rätten. Varje designval i denna modul mäts mot en enda fråga: *håller detta huvudmålet i centrum, eller drar det bort mot ett socialt nätverk?* Drar det bort — byggs det inte.

---

## 2. Varför den behövs — och varför den är farlig

**Varför den behövs.** Masterkartans insikt: *"om de är en platform som du går in på och de inte händer saker kommer inte folk tillbaka."* Tystnad känns dött. En insamling med 40 dua-reaktioner och varma kommentarer känns **levande och trovärdig** — andra har redan litat på den.

**Varför den är farlig — rakt sagt.** Community är **den största kaosrisken på hela plattformen.** Allt annat (insamlingar, granskning, pengar) är strukturerat och granskas före publicering. Community är det enda stället där användare publicerar text **direkt, utan förhandsgranskning**. Det är där:

- diskriminerande språk, sekterism och hat kan dyka upp,
- bråk och trådar som spårar ur kan uppstå,
- plattformen omärkligt kan glida från insamlingsverktyg till socialt nätverk.

Därför är denna modul byggd **restriktivt med flit.** Vi lägger inte till sociala funktioner för att de är trevliga. Varje funktion måste försvara sin plats mot kaosrisken. Principen "anti-kaos by design" (princip 10) är inte en sektion längst ner i denna modul — den är hela modulen.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Vad community ÄR och inte är — strukturen som håller huvudmålet i centrum | ✅ Spikad |
| 2 | Kommentarer & dua — på insamlingar och uppdateringar | ✅ Spikad |
| 3 | Reaktioner — dua-knappen och lätt uppmuntran utan brus | ✅ Spikad |
| 4 | Anti-kaos & moderering — filtrering, rapportering, 95 % självgående | ✅ Spikad |
| 5 | Hur community håller huvudmålet i centrum — de strukturella spärrarna | ✅ Spikad |

När alla fem är klara vet vi exakt vad användare får göra socialt, vad de aldrig får göra, och varför plattformen förblir ett insamlingsverktyg.

---

# BLOCK 1 — Vad community ÄR och inte är

Det grundläggande designvalet. Allt annat i modulen följer härifrån.

## 1.1 Vad community ÄR

**Community är samtal som hänger på ett insamlings-objekt eller en uppdatering — aldrig fristående.**

Varje socialt inlägg på plattformen är **fäst vid något**:

- en **insamling** (M1), eller
- en **uppdatering** på en insamling (M7).

Det finns **inget socialt inlägg som svävar fritt.** Ingen kan publicera en tanke som inte handlar om en konkret insamling eller en konkret uppdatering.

Detta är den enda strukturen. Den är enkel med flit: om allt socialt måste hänga på en insamling, kan community per definition aldrig dra fokus *från* insamlingar — det *är* insamlingar.

## 1.2 Vad community INTE är

| Inte detta | Varför inte |
|---|---|
| **En fri statusvägg / "feed att posta i"** | En vägg blir snabbt brus, självhävdelse och off-topic. Det drar fokus från insamlingar. |
| **Privata meddelanden (DM) mellan användare** | DM är omöjligt att moderera, en grooming-/bedrägerikanal, och kräver heltidsbevakning. Bryter mot 95 %-principen. |
| **Vänner / följare / sociala grafer** | En vänlista gör plattformen till ett nätverk där statusen är *relationer*, inte *godhet*. Fel mål. |
| **Delning av andras inlägg / "repost"** | Förstärkningsmekanik = viralt brus och svår moderering. Vi förstärker insamlingar (M11), inte åsikter. |
| **Profilväggar man postar på** | Profilen (M9) är en historik, inte en anslagstavla. Andra kommenterar inte *på en person*. |

**Designprincip:** vi säger nej till sociala funktioner som standard. En funktion får bara in om den (a) stärker en specifik insamling och (b) inte kan bli en kaoskanal. Det är ett kort filter, och det fäller det mesta.

## 1.3 Designval som håller huvudmålet i centrum

- **Inget eget "community-flöde" i navigationen.** Det finns ingen flik som heter "Community" där folk skrollar samtal. Samtal lever *inne i* insamlingar.
- **Insamlingen är alltid överst.** På en insamlingssida kommer alltid berättelsen, beloppet, framstegen och bevisen *före* kommentarsfältet. Kommentarer är längst ned — synliga, men aldrig det första ögat möter.
- **Att ge går alltid före att prata.** Donations-knappen är alltid mer framträdande än kommentarsfältet. Plattformen vill att du *ger* — samtalet är vad som händer runtomkring.

## 1.4 Kantfall

- **Användare vill diskutera något som inte rör en insamling** (t.ex. en allmän religiös fråga) → det finns ingen yta för det, med flit. Allmänna samtal hör hemma i moskén, inte här. Plattformen är ett insamlingsverktyg.
- **En förening vill ha en "sida att posta på"** → nej. Föreningens yta är dess katalogprofil (M10) och dess insamlingar. Vill den nå ut driver den en insamling eller ett event (M14).
- **Användare vill kontakta en insamlare privat** → ingen DM. Insamlaren kan välja att visa en kontaktväg på insamlingen (M1/M2), men plattformen förmedlar inga privata meddelanden.

---

# BLOCK 2 — Kommentarer & dua

Den primära sociala handlingen: att skriva något. Block 2 spikar var man får kommentera, hur, och vad som tillåts.

## 2.1 Var man får kommentera

Kommentarer finns på **två ställen, båda fästa vid en insamling:**

1. **På insamlingen** — under berättelsen, längst ned på sidan.
2. **På en uppdatering** (M7) — när insamlaren postar "Vi har köpt mattorna", kan donatorer svara just där.

Inget annat. Ingen kommenterar på en profil, ett event eller en kategori-sida.

## 2.2 Vem får kommentera

| Roll | Får kommentera? | Not |
|---|---|---|
| Besökare (ej inloggad) | **Nej** | Anonyma kommentarer är en moderationsmardröm. Lågt tröskelvärde men inte noll. |
| Inloggad användare (donator) | **Ja** | Inloggning via M6 krävs. Namn syns (eller "Anonym givare", se 2.5). |
| Insamlaren | **Ja** | Kan svara på sin egen insamlings kommentarer. |
| Förening (M10) | **Ja** | Som en användare. |
| Granskare / admin | **Ja**, plus moderationsrättigheter | Kan dölja/ta bort (Block 4). |

**Designval — inloggning krävs.** Att tvinga inloggning (BankID-baserad identitet via M6) innebär att **varje kommentar är knuten till en verklig, verifierad person.** Det är den enskilt starkaste anti-kaos-spärren i hela communityn: ingen gömmer sig bakom en anonym engångsidentitet. En person som vet att hatretorik är knuten till deras BankID-identitet beter sig annorlunda.

## 2.3 Ton, längd och format

- **Längd:** kort. Max **500 tecken** per kommentar. En kommentar är en hälsning eller en dua — inte en essä. Korthet dämpar bråk: man kan inte skriva en stridsskrift på 500 tecken.
- **Format:** ren text. Ingen markdown, inga rubriker, inga inbäddade bilder. En kommentar ska se ut som en kommentar.
- **Inga länkar.** URL:er i kommentarer blockeras helt — det dödar spam, phishing och att folk drar trafik till andra insamlingsappar. Vill man peka på en annan insamling får man nämna den; man länkar inte.
- **Inga bilder/filer.** Bara text. Bilder hör hemma i M1:s media-fält och M7:s uppdateringar, granskade.
- **Tonen som efterfrågas:** uppmuntran, dua, tack, frågor till insamlaren. Detta kommuniceras med en mjuk platshållartext i kommentarsfältet, t.ex. *"Lämna en dua eller en hälsning..."* — UX som styr tonen utan att tvinga.

## 2.4 Trådning — ett enda svarssteg

- En kommentar kan få **svar** (t.ex. insamlaren svarar en donator).
- Trådning är **platt — endast ett steg.** Man kan svara på en kommentar, men inte svara på ett svar. Djupa trådar blir bråk-stegar; ett steg räcker för "tack" ↔ "tack själv".
- **Designval:** djup trådning är ett kaosverktyg. Ett svarssteg möjliggör mänsklig återkoppling utan att öppna en debattarena.

## 2.5 Anonymitet i kommentarer

- En donator som gett **anonymt** (M4) kan kommentera som **"Anonym givare"** — namnet döljs publikt men identiteten finns alltid internt (M6) för moderering.
- **Anonymitet utåt, aldrig inåt.** Ingen kommentar är någonsin anonym för systemet. Detta är centralt: anonymitet skyddar den blygsamme givaren (en islamisk dygd), men ger aldrig skydd åt den som missbrukar.

## 2.6 Kantfall

- **Kommentar på en insamling som senare blir `nedstängd` (fejk)** → kommentarerna döljs med insamlingen. De svävar inte vidare.
- **Insamlaren vill stänga av kommentarer på sin insamling** → tillåtet. Ett enkelt val i M2: insamlaren kan slå av kommentarsfältet. Vissa projekt (känsliga, t.ex. begravning) mår bättre utan. Dua-reaktionen (Block 3) finns ändå kvar.
- **Kommentar postas, sedan ångrar sig användaren** → får radera sin egen kommentar inom en kort fönstertid (riktmärke: tills någon svarat på den). Efter det döljs den i stället för att raderas, så en tråd inte blir obegriplig.

---

# BLOCK 3 — Reaktioner

Den lättaste sociala handlingen: att trycka på en knapp. Block 3 är uppmuntran utan ord — och utan brus.

## 3.1 Dua-knappen

**Den centrala reaktionen är "Dua" (دعاء) — "jag ber för detta".**

- En enda knapp på varje insamling och varje uppdatering: *"Gör dua"* med en räknare.
- Att trycka den betyder *"jag har bett för det här projektet."* Det är en handling med andlig mening — inte en tom "like".
- Räknaren visar t.ex. *"217 personer har gjort dua för denna insamling."* — socialt bevis och uppmuntran på samma gång.
- **Inloggning krävs** (M6). En person, en dua per insamling. Ingen knapp-spam.

**Designval — varför "Dua" och inte "Like".** En "like" tillhör det sociala nätverket; den handlar om gillande. "Dua" tillhör den islamiska ramen; den handlar om åkallan. Detta är "islamiskt medveten, inte sekteristisk" (princip 11) i en enda knapp — dua är gemensamt för alla inriktningar, det tar ingen sida.

## 3.2 Andra reaktioner — medvetet få

Utöver Dua finns **en mycket liten uppsättning lätta reaktioner**, och bara sådana som är entydigt positiva:

| Reaktion | Betydelse |
|---|---|
| 🤲 **Dua** | "Jag ber för detta." (Den primära.) |
| ❤️ **Stöd / kärlek** | "Jag står bakom det här." |

**Det är allt.** Två reaktioner.

**Varför inte fler — och inga negativa.**

- **Ingen "tumme ner", ingen "arg", ingen "ledsen".** Negativa reaktioner är ett mobbningsverktyg och förvandlar varje insamling till en omröstning. En insamling ska aldrig kunna "ratas" med ett klick. Vill någon uttrycka en oro finns rapportering (Block 4) — en privat kanal till moderering, inte en publik nedrösning.
- **Få reaktioner = lite brus.** En lång rad emoji-reaktioner blir prål och drar uppmärksamhet till sig själv. Två lugna, positiva reaktioner räcker för att göra en insamling levande. Premium genom omsorg, inte prål (princip 6).

## 3.3 Hur reaktioner visas

- En diskret räknare: *"217 dua · 84 stöd."*
- **Ingen lista över vilka som reagerat.** Man ser *antalet*, inte *vilka*. Detta är medvetet: en namnlista gör reaktionen social-status; ett antal gör den till uppmuntran. Det skyddar också den blygsamme.
- Reaktioner är **aldrig** ett rankningsmått som flyttar en insamling högre i discovery (M11). Discovery rankas på relevans och behov, inte på popularitet — annars vinner de fotogeniska projekten och de tråkiga-men-viktiga försvinner.

## 3.4 Kantfall

- **Användare vill ångra en dua** → går att trycka bort. Det är en handling, inte en låsning.
- **En insamling med noll reaktioner** → ingen tom "0 dua"-text som ser sorglig ut. I stället en mjuk uppmaning: *"Bli den första att göra dua för detta projekt."*
- **Reaktioner på en `nedstängd` insamling** → döljs med insamlingen.

---

# BLOCK 4 — Anti-kaos & moderering

Den hårda kärnan. Block 4 spikar vad som inte tillåts, hur det fångas, och hur communityn sköter sig själv 95 % av tiden **utan en heltidsmoderator** — för det finns ingen.

## 4.1 Vad som inte tillåts

Förbjudet i kommentarer och allt användargenererat innehåll i denna modul:

- **Diskriminerande språk** — mot etnicitet, hudfärg, kön, ursprung, religion. Kopplar **M8 anti-diskrimineringspolicy** direkt.
- **Sekterism** — angrepp mellan islamiska inriktningar (sunni/shia m.fl.). Plattformen är "islamiskt medveten, inte sekteristisk" (princip 11) — sekteristiskt gräl är ett direkt brott mot dess själ.
- **Riktat hat, hot, trakasserier** mot en person eller grupp.
- **Spam** — länkar, reklam, upprepade identiska kommentarer, värvning till andra plattformar.
- **Bedrägeriförsök** — kommentarer som lurar folk att betala utanför plattformen ("Swisha mig direkt").
- **Off-topic-brus** — kommentarer som inte har med insamlingen att göra (politiska utspel, allmänt prat).
- **Olämpligt innehåll** — svordomar riktade mot någon, oanständigheter.

## 4.2 De fyra moderationslagren

Anti-kaos byggs i lager, från billigast och mest automatisk till dyrast och mänsklig.

**Lager 1 — Strukturell spärr (förebyggande, gratis).**
Det mesta kaoset byggs bort *innan* det kan uppstå: inloggning krävs (verklig identitet, M6), inga länkar, 500 teckens gräns, inga DM, ett trådsteg, inga negativa reaktioner. Den billigaste moderering är den som aldrig behövs.

**Lager 2 — Automatisk filtrering (självgående).**
- En **ordlista/mönsterfiltrering** vid publicering: kända diskriminerande och sekteristiska termer, hatuttryck, slurar. Listan ägs av och synkas med **M8**.
- Tydlig träff (slur, hatuttryck) → kommentaren **publiceras inte**, användaren får ett mjukt meddelande: *"Din kommentar kunde inte publiceras — den verkar innehålla språk som inte hör hemma här."*
- Misstänkt men oklart (gränsfall) → kommentaren publiceras men **flaggas tyst för granskning** (Lager 4).
- **Hastighetsspärr:** samma användare kan inte posta många kommentarer på kort tid → dödar spam-skurar.
- *Ärlig begränsning:* ett ordfilter fångar inte allt — folk hittar kringgångar. Det är "vårt fel men inte dödligt" (princip 4). Filtret tar bort grovsoporna; Lager 3 fångar resten.

**Lager 3 — Community-rapportering (självgående).**
- Varje kommentar har en diskret **"Rapportera"**-knapp.
- En rapport flaggar kommentaren internt. Inloggning krävs — ingen anonym rapport-spam.
- **Tröskelregel:** når en kommentar ett antal oberoende rapporter (riktmärke: 3) **döljs den automatiskt** i väntan på en mänsklig blick. Hellre tyst dölja en gränsfallskommentar än låta hat stå kvar i timmar.
- Detta gör communityn till sin egen första moderator — utan att Zivar gör något.

**Lager 4 — Mänsklig granskning (sällan, sista utvägen).**
- En **modereringskö i M16 Admin-dashboard** samlar: filtrets gränsfalls-flaggor + automatiskt dolda kommentarer + rapporter.
- En granskare (du + dina två bröder, samma personer som M3) går igenom kön — riktmärke: en kort genomgång då och då, inte en heltidstjänst.
- Granskaren kan: **återställa** (falsklarm), **permanent dölja**, eller vid grovt/upprepat brott eskalera till **konto-åtgärd** via M6 (varning → tidsbegränsad kommentarsspärr → avstängning).

## 4.3 Hur 95 % självgående uppnås

Detta är inte en förhoppning — det är en konstruktion:

- **Lager 1** tar bort de flesta kaos-vektorerna helt (inga DM, inga länkar, verklig identitet).
- **Lager 2** filtrerar grovsoporna automatiskt.
- **Lager 3** låter communityn själv dölja det som glider igenom.
- **Lager 4** — människan — ser bara den lilla rest som de tre första lagren skickar vidare, och bara när hon själv väljer att titta i kön. Inget kräver omedelbar respons: en automatiskt dold kommentar är redan borta från allmänheten medan den väntar.

**Designval — auto-dölj framför auto-radera.** Systemet *döljer* tyst; en människa *raderar*. En dold kommentar gör ingen skada men kan återställas om filtret hade fel. Detta gör att vi kan vara aggressiva i automatiken utan att vara orättvisa.

## 4.4 Kantfall

- **Falsk-flaggning / rapport-mobb** (folk rapporterar en oskyldig kommentar i grupp) → auto-dölj är medvetet *reversibelt*; granskaren återställer. Upprepad falsk-rapportering loggas mot rapportörens konto.
- **Insamlaren själv postar olämpligt** → samma regler gäller alla. Grovt brott → påverkar insamlingens status (kan leda till `pausad`, M1 Block 3) och insamlarens konto (M6).
- **En hel kommentarstråd spårar ur** (gräl mellan flera) → granskaren kan dölja hela tråden, eller insamlaren kan stänga av kommentarsfältet på just den insamlingen (Block 2.6).
- **Hatkommentar på natten, ingen granskare vaken** → Lager 2 och 3 gör jobbet utan en människa; den når aldrig 3 rapporter utan att döljas. Tidszon är inget problem när maskinen tar första passet.

---

# BLOCK 5 — Hur community håller huvudmålet i centrum

Block 1 sa *vad* community är. Block 5 är garantin: de **strukturella valen** som gör att plattformen aldrig glider från insamlingsverktyg till socialt nätverk — även när den växer.

## 5.1 De strukturella spärrarna

Dessa är inte regler man kan bryta — de är **frånvaro av mekanik.** Det man inte byggt kan inte missbrukas.

| Spärr | Vad den hindrar |
|---|---|
| **Inga privata DM** | Ingen privat kanal → ingen grooming, inget bedrägeri i skuggan, inget moderationssvart hål. |
| **Ingen fri statusvägg** | Inget att posta i utan en insamling → community kan aldrig bli självhävdelse-flöde. |
| **Inga vänner/följare** | Ingen social graf → status mäts inte i relationer. |
| **Ingen delning/repost** | Ingen förstärkningsmotor → inget viralt åsiktsbrus. |
| **Inget community-flöde i menyn** | Ingen yta att "skrolla community" → man kommer till plattformen för insamlingar. |
| **Allt socialt är fäst vid en insamling** | Community *är* insamlingar → kan per definition inte konkurrera med dem. |

## 5.2 Hierarkin på sidan

På varje insamlingssida är ordningen från topp till botten **fast och avsiktlig:**

1. Berättelsen, media, mottagare (M1).
2. Beloppet, framstegen, **donations-knappen** (M1/M4).
3. Uppdateringar och bevis (M7).
4. **Kommentarer och reaktioner (M13)** — sist.

Community är alltid längst ned. Det syns, det är välkomnande, men det är aldrig det som möter ögat först. **Att ge står alltid över att prata.**

## 5.3 Vad som mäter framgång

- Plattformens mätvärden (M16) räknar **insamlingar, donationer, levererade resultat** — inte "antal kommentarer" eller "engagemang".
- Vi optimerar **aldrig** för tid-på-sajten eller kommentarsvolym. Det är de mätvärden som gör sociala nätverk giftiga — de belönar konflikt och beroende.
- En lyckad plattform i vår mening: många insamlingar når sina mål och bevisas. En kommentar är ett trevligt tecken på liv — aldrig ett mål i sig.

## 5.4 Den ärliga gränsdragningen

Community gör plattformen **varm**. Men varje gång vi i framtiden frestas lägga till en social funktion — en feed, en chatt, profiler man kan följa — ska vi gå tillbaka till denna modul och fråga:

> *Stärker detta en specifik insamling? Eller bygger det ett socialt nätverk vid sidan av?*

Bygger det ett nätverk vid sidan av — **säg nej.** Det finns redan ett Facebook. Det finns inget Sadaqa Sweden. Vår styrka är fokus.

## 5.5 Kantfall

- **Plattformen växer och folk efterfrågar mer socialt** → efterfrågan i sig är inte ett skäl. Beslutet mäts mot 5.4, inte mot popularitet.
- **En insamling blir "communityns favorit" med hundratals kommentarer** → fint, men reaktioner och kommentarsvolym påverkar aldrig dess plats i discovery (M11). Behov rankar, inte popularitet.
- **Idén om en allmän "muslimsk anslagstavla" återkommer** → den hör inte hemma här, någonsin. Den vore en annan produkt. Denna modul är ett insamlingsverktygs sociala lager — inget mer.

---

## 5. Designval & motivering (hela Modul 13)

| Beslut | Motivering |
|---|---|
| Allt socialt är fäst vid en insamling eller uppdatering — inga fristående inlägg | Om community *är* insamlingar kan det per definition aldrig dra fokus från huvudmålet. Detta är hela modulens fundament. |
| Inga privata DM | DM är en omoderbar grooming-/bedrägerikanal som kräver heltidsbevakning. Bryter mot 95 %-principen. Det man inte bygger kan inte missbrukas. |
| Inloggning (BankID-baserad, M6) krävs för att kommentera/reagera | Varje kommentar knyts till en verklig, verifierad person. Den enskilt starkaste anti-kaos-spärren — ingen gömmer sig bakom en anonym engångsidentitet. |
| "Dua"-knapp i stället för "Like" | Dua är en handling med andlig mening, gemensam för alla islamiska inriktningar — islamiskt medveten, inte sekteristisk (princip 11). |
| Bara två reaktioner, båda positiva — ingen negativ reaktion | Negativa reaktioner är ett mobbningsverktyg och gör varje insamling till en omröstning. Få reaktioner = lite brus (princip 6). |
| 500 teckens gräns, ren text, inga länkar, inga bilder i kommentarer | Korthet dämpar bråk; länkförbud dödar spam/phishing; ren text håller kommentaren till en hälsning, inte en stridsskrift. |
| Platt trådning — endast ett svarssteg | Djupa trådar blir bråk-stegar. Ett steg räcker för mänsklig återkoppling utan en debattarena. |
| Fyra moderationslager: struktur → autofilter → rapportering → människa | Varje lager fångar vad det föregående släppte igenom; människan ser bara den lilla resten. Så uppnås 95 % självgående utan heltidsmoderator. |
| Auto-dölj, inte auto-radera | En dold kommentar gör ingen skada men kan återställas vid falsklarm — vi kan vara aggressiva i automatiken utan att vara orättvisa. |
| Inget community-flöde i navigationen; community alltid längst ned på sidan | Att ge står strukturellt över att prata. Plattformen förblir ett insamlingsverktyg, inte ett socialt nätverk. |
| Vi mäter aldrig framgång i kommentarsvolym eller tid-på-sajten | Det är de mätvärden som gör sociala nätverk giftiga. Vi mäter insamlingar, donationer och levererade resultat. |

---

## 6. Kopplingar

**Modul 13 tar in:**
- **Insamlings-objektet och dess tillstånd** från **M1** (Block 3 & 4) — community fäster på insamlingar; en `nedstängd` insamling tar sina kommentarer med sig.
- **Uppdateringar** från **M7** — kommentarer fäster även på uppdateringar.
- **Identitet, roller och konto-status** från **M6** — bara inloggade får delta; konto-åtgärder vid grova brott verkställs här.
- **Anti-diskrimineringspolicy och ordlista/mönster** från **M8** — det är M8 som äger *vad* som är förbjudet; M13 tillämpar det.
- **Anonym-givare-flaggan** från **M4** — styr om namn eller "Anonym givare" visas.

**Modul 13 lämnar ut:**
- **Kommentarer, dua, reaktioner** som visas på insamlingssidan (M1) och i uppdateringsflödet (M7).
- **Modereringskö och flaggor** till **M16 Admin-dashboard** — det enda stället en människa behöver agera.
- **Konto-eskaleringar** till **M6** vid upprepat eller grovt brott.
- **Notis-triggers** till **M15** — t.ex. "insamlaren svarade på din kommentar", "någon gjorde dua för din insamling" (opt-in, aldrig spam).
- Reaktioner och kommentarer påverkar **aldrig** rankningen i **M11** — det är ett medvetet *icke*-utflöde.

**Princip-flagga:** M13 äger ingen regel — reglerna bor i M8. M13 äger *mekaniken*: var man får prata, hur lite, och de fyra lagren. Ändras anti-diskrimineringspolicyn i M8 ändras filtret i M13.

---

## 7. Säkerhet & anti-kaos

**Detta är den största kaosrisken på hela plattformen — sägs rakt.** Allt annat granskas före publicering; community är det enda stället där text når allmänheten direkt. Därför är modulen byggd defensivt från grunden.

**Vad som kan gå fel:**
- Diskriminerande språk, sekterism, hat i kommentarer.
- Bråk och trådar som spårar ur.
- Spam, phishing, värvning till andra plattformar.
- Bedrägeri ("betala mig direkt utanför plattformen").
- Plattformen glider omärkligt mot att bli ett socialt nätverk.

**Vad som skyddar — i lager:**
- **Strukturell spärr** (Lager 1): inloggning med verklig identitet, inga DM, inga länkar, 500 tecken, ett trådsteg, inga negativa reaktioner. Det mesta kaoset byggs bort innan det kan uppstå.
- **Automatisk filtrering** (Lager 2): ordlista från M8 blockerar grovt språk vid publicering; hastighetsspärr dödar spam-skurar.
- **Community-rapportering** (Lager 3): 3 rapporter → auto-dölj i väntan på människa.
- **Mänsklig granskning** (Lager 4): liten kö i M16, sista utvägen, konto-eskalering via M6.
- **Auto-dölj framför auto-radera:** vi kan vara aggressiva utan att vara orättvisa.
- **Identitet bakom varje ord:** ingen anonymitet inåt — anonymitet skyddar den blygsamme givaren, aldrig den som missbrukar.

**Ärlig restrisk:** ett ordfilter fångar inte allt; folk hittar kringgångar. Något kommer att slinka igenom. Det är "vårt fel men inte dödligt" (princip 4) — lagren tillsammans gör skadan kortlivad och liten, och vi lär och justerar ordlistan löpande.

## 8. Automatisering

**Självgående (ingen människa):**
- Ordlista-/mönsterfiltrering vid publicering — blockerar tydliga brott direkt.
- Hastighetsspärr mot spam-skurar.
- Auto-dölj vid rapport-tröskel (3 oberoende rapporter).
- Dölj kommentarer/reaktioner när en insamling blir `nedstängd` eller `pausad`.
- Notis-triggers till M15.
- Räknare för dua/stöd och kommentarer.

**Kräver människa:**
- Genomgång av modereringskön i M16 — gränsfall, auto-dolda kommentarer, rapporter.
- Beslut: återställa, permanent dölja, eller eskalera till konto-åtgärd.
- Löpande underhåll av ordlistan i M8 när nya kringgångar dyker upp.

Riktmärke: communityn sköter sig själv **95 %+** av tiden. De tre automatiska lagren bär nästan allt; människan ser bara resten, när hon själv väljer att öppna kön. Inget kräver omedelbar respons — auto-dölj har redan tagit det farliga ur allmänhetens ögon.

## 9. Öppna frågor

1. **Exakt rapport-tröskel för auto-dölj** — 3 är riktmärket. Kan behöva justeras när vi ser verklig volym och falsk-flaggningsmönster. → bekräftas mot drift i M16.
2. **Ordlistans exakta innehåll och underhållsrutin** — listan ägs av M8; M13 flaggar bara behovet av en löpande synkrutin.
3. **Konto-eskaleringsstegen** (varning → kommentarsspärr → avstängning) — exakta steg och tidsgränser → spikas i M6.
4. **Ska insamlaren kunna dölja en enskild kommentar på sin egen insamling** (inte bara stänga av hela fältet)? Lockande, men kan missbrukas för att gömma berättigad kritik → parkerad, lutar mot nej; rapportering till oberoende granskare är den rätta vägen.
5. **Notiser för community-händelser** — vilka triggers, vilken opt-in-nivå → detaljeras i M15.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 13:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (vad community är/inte är), Block 2 (kommentarer & dua), Block 3 (reaktioner), Block 4 (anti-kaos & fyra moderationslager), Block 5 (strukturella spärrar som håller huvudmålet i centrum) nyskrivna. |
