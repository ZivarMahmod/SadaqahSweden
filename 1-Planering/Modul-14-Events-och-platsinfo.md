# Modul 14 — Events & platsinfo

**Lager:** 🔵 Världen runtom
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-01-Insamling-som-objekt.md`, `Modul-10-Organisationer-katalog-collab.md`, `Modul-12-Karta-och-geografisk-insikt.md`

---

## 1. Vad modulen är

Modul 14 definierar **events och platsinfo** — det som gör plattformen levande *mellan* insamlingar. Ett **event** är en händelse som är bra för det muslimska samhället: en föreläsning, en insamlingskväll, ett Eid-firande, en iftar. **Platsinfo** är grundfakta om moskéer och platser: öppettider, adress, kommande events.

**Den löser:** Din egen insikt — *"om de är en platform som du går in på och de inte händer saker kommer inte folk tillbaka."* En ren insamlingssajt besöks när man ska donera, sen inte. Events ger en anledning att gå in även de veckor man inte ger.

**Den löser inte:** Events är **inte** huvudmålet. Huvudmålet är alltid insamling (Kärnan). Events är krydda, inte huvudrätt. Block 4 är hela modulen ägnad åt att hålla den ordningen.

---

## 2. Varför den behövs

Tre problem som events löser:

- **Återbesöksproblemet.** Insamlingar har lång cykel — en donator ger, sen händer inget synligt för dem på veckor. Events fyller tomrummet med färska anledningar att komma tillbaka.
- **Förankringsproblemet.** Plattformen ska kännas som en *plats för det muslimska samhället i Sverige*, inte ett betalformulär. Moské-sidor med öppettider gör plattformen till något man slår upp i vardagen.
- **Förtroendeproblemet.** En förening som arrangerar verkliga, fysiska events i sitt namn på plattformen blir mer verklig. Det stärker katalogen (M10) och därmed insamlingarna de driver.

Men en risk måste sägas rakt: **events kan svälla och stjäla fokus.** En eventflik som blir en social kalender drar uppmärksamhet från insamlingar. Därför är den här modulen byggd med en hård prioriteringsordning inbyggd, inte som efterhandsjustering.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Event som objekt — vad ett event *är*, vem skapar, granskning | ✅ Spikad |
| 2 | Moské- & platsinfo — moské-sidan, öppettider, koppling till katalogen | ✅ Spikad |
| 3 | Eventflöde & discovery — hur events hittas, koppling till karta | ✅ Spikad |
| 4 | Events vs insamlingar — hur de samexisterar utan att events tar över | ✅ Spikad |
| 5 | Anti-kaos för events — granskning, förbud, automatisk städning | ✅ Spikad |

När alla fem är klara vet vi exakt vad ett event *är*, hur det hittas, och hur det hålls underordnat insamlingarna.

---

# BLOCK 1 — Event som objekt

Vad ett event är, som dataobjekt och som verklighet.

## 1.1 Vad ett event är

Ett **event** är en **fysisk eller digital händelse, bunden till en tidpunkt och en plats, som är till nytta för det muslimska samhället i Sverige.** Det är inte en insamling. Det tar inte emot pengar på plattformen (se kantfall nedan). Det är en *anslagstavla-post med struktur*.

**Exempel på godkända event:**

- Föreläsning eller seminarium (islamisk kunskap, samhälle, ungdom)
- Insamlingskväll eller välgörenhetsmiddag
- Eid-firande, gemensam iftar i Ramadan
- Kurs eller studiecirkel (Quran, arabiska)
- Familjedag, ungdomsträff, systerträff
- Öppet hus i en moské

## 1.2 Event-objektets fält

| Fält | Form | Obligatoriskt | Publikt | Not |
|---|---|---|---|---|
| Titel | Text, max 80 tecken | Ja | Ja | Inga emoji, inga ALL CAPS — samma stil som M1 |
| Typ | Dropdown (fast lista, se 1.1) | Ja | Ja | Granskaren får ändra |
| Beskrivning | Markdown-light, max 2000 tecken | Ja | Ja | Kortare än insamlingens — event ska vara snabbläst |
| Datum & tid | Datum + starttid + ev. sluttid | Ja | Ja | Återkommande hanteras i 1.4 |
| Plats | Strukturerad, se 1.3 | Ja | Ja | Fysisk adress eller "Digitalt" |
| Arrangör | Koppling till förening/moské (M10) eller privatperson (M6) | Ja | Ja | Se 1.5 |
| Cover-bild | 1 bild, jpeg/png/webp, max 5 MB | Nej (rekommenderad) | Ja | Samma media-regler som M1 Fält 5 |
| Kontakt | E-post eller telefon för frågor | Nej | Valfritt publikt | Per-fält integritetskontroll |
| Anmälningslänk | Extern URL | Nej | Ja | Plattformen hanterar **inte** anmälan i v1 |
| Kostnad | Fritext ("Gratis", "50 kr vid dörren") | Nej | Ja | Plattformen tar **inte** betalt för event |

**Designval — ingen anmälan, ingen biljettförsäljning i v1.** Att bygga anmälningshantering och biljettbetalning är en hel produkt i sig. Det skulle dessutom blanda ihop pengaflödet med Stripe Connect (M5) som är byggt för *insamlingar*, inte biljetter. Externa länkar (arrangörens eget formulär) räcker. Parkerat — se Öppna frågor.

## 1.3 Plats på ett event

Två sorters plats, väljs vid skapande:

- **Fysisk plats:** Namn (t.ex. "Stockholms moské"), adress, stad. Om eventet hålls i en moské som finns i katalogen (M10) → eventet **länkas till moské-sidan** (Block 2) i stället för att adressen skrivs om. En källa, ingen dubbelinmatning.
- **Digital plats:** "Digitalt event" + extern länk (Zoom, YouTube). Ingen fysisk adress.

GPS-koordinater hämtas automatiskt från moské-sidan eller adressen — föder kartan (M12, Block 3).

## 1.4 Återkommande event

Många event återkommer — fredagsföreläsning varje vecka, månatlig systerträff.

- **Beslut:** Ett event-objekt kan markeras **återkommande** med ett enkelt mönster: *varje vecka / varje månad* + veckodag.
- Plattformen genererar **inte** hundra separata objekt. Det är **ett** objekt med ett upprepningsmönster. Discovery (Block 3) visar "nästa förekomst".
- **Granskning:** Ett återkommande event granskas **en gång** vid skapande. Arrangören kan inte smyga in nytt innehåll via upprepningen — ändras beskrivning eller plats går objektet tillbaka till granskning (samma princip som M1 Block 5: ändrar man löftet, granskas det om).
- **Inställd förekomst:** Arrangören kan markera en enskild förekomst som inställd utan att radera hela serien.

**Kantfall:** Återkommande event utan slutdatum → tillåtet, men Block 5 städar bort serier som inte rörts på 6 månader (arrangören har sannolikt slutat).

## 1.5 Vem får skapa ett event

| Skapare | Får skapa event? | Villkor |
|---|---|---|
| **Förening/moské i katalogen (M10)** | Ja | Konto i katalogen, godkänt. Detta är huvudvägen. |
| **Privatperson (M6, BankID-verifierad)** | Ja, begränsat | Se nedan |
| **Gäst (ej inloggad)** | Nej | Måste minst ha BankID-konto |

**Privatperson får skapa event — men med striktare granskning.** Resonemang: en förening har ett namn och ett rykte att förlora; en privatperson är svårare att hålla ansvarig. Därför:

- Privatpersonens första event granskas **alltid manuellt och noggrant** (ingen fast-track).
- Eventet visar tydligt **"Arrangeras av privatperson"** — inte ett föreningsnamn donatorn felaktigt litar på.
- En privatperson som vill arrangera regelbundet uppmuntras i UX:t att i stället registrera sin förening i katalogen (M10). Det styr beteendet rätt utan förbud — "verktyg, inte polis".

**Kantfall:** Privatperson skapar event "i en moskés namn" utan att vara kopplad → granskaren stoppar det. Arrangörsfältet får bara peka på en M10-entitet om personen faktiskt har behörighet i den (M6 styr behörigheten).

## 1.6 Granskning av event

Inget event når allmänheten ogranskat — **princip 7, granska före publicering, gäller events precis som insamlingar.**

- Event går genom samma granskningskö-koncept som M3, men med en **lättare checklista** (events är lägre risk än insamlingar — inga pengar byter händer på plattformen).
- Granskaren bedömer: är detta verkligen till nytta för communityn? Är språket fritt från diskriminering och sekterism (princip 10, 11)? Är arrangören den hen utger sig för att vara?
- **SLA för event-granskning:** riktmärke 48 timmar — kortare än insamlingens 72 h, eftersom checklistan är lättare. Event är ofta tidskänsliga.
- Event-tillstånd: `utkast` → `inskickad` → `granskas` → `publicerat` / `avvisad`. Efter eventdatum passerat → `avslutat` (automatiskt, system).

**Designval — fast-track för betrodda föreningar.** En förening i katalogen som redan fått 3 event godkända utan anmärkning får sina kommande event **auto-publicerade med stickprovsgranskning i efterhand**. Det är 95 %-självgående-principen: granskaren ska inte läsa varje fredagsföreläsning från en moské vi redan litar på. Privatpersoner får aldrig fast-track.

---

# BLOCK 2 — Moské- & platsinfo

Moské-sidan: grundinfo, öppettider, kommande events. En levande plats-sida.

## 2.1 Vad en moské-sida är

En **moské-sida** är den publika sidan för en moské eller ett islamiskt center. Den är **inte ett eget objekt** — den är en **vy av en M10-katalogentitet av typen "moské"**. Katalogen (M10) äger datan; M14 ger den ett ansikte med öppettider och eventflöde.

**Designval — moské-sidan är en vy, inte ett nytt objekt.** Att skapa ett separat "moské"-objekt vid sidan av katalogentiteten skulle ge två sanningar att hålla synkade. En källa: M10. M14 lägger bara till två saker ovanpå — öppettider (2.3) och eventflödet (Block 3).

## 2.2 Vad moské-sidan visar

| Sektion | Källa | Not |
|---|---|---|
| Namn, logga, kort beskrivning | M10 katalog | Föreningen fyller i vid registrering |
| Adress + karta-pin | M10 katalog → M12 | Klickbar, öppnar kartläge |
| Öppettider | M14 Block 2 (se 2.3) | Det moské-sidan tillför |
| Kontakt (telefon, e-post, webb) | M10 katalog | Per-fält integritetskontroll |
| Kommande events | M14 Block 3 | Filtrerat på denna arrangör |
| Pågående insamlingar | M1 + M10 | Insamlingar denna moské driver eller stöttar (collab) |
| Avslutade insamlingar / historik | M7 transparens | Bevis och badges — bygger förtroende |

**Strategisk effekt:** Moské-sidan blir en knutpunkt. Någon slår upp öppettiderna för fredagsbönen, ser en pågående insamling och en kommande iftar. Världen runtom lockar — och leder tillbaka till Kärnan (insamlingen).

## 2.3 Öppettider

Öppettider är den enda nya datastrukturen i Block 2.

- **Form:** Veckoschema — för varje veckodag: stängt / öppettider (från–till). Möjlighet till flera tidsspann per dag (många moskéer är öppna kring varje bönetid).
- **Specialtider:** Fritextfält för avvikelser — "Ramadan: öppet till 23:00", "Stängt Eid-dagen". Enkelt, inte en kalendermotor.
- **Ägs av:** Föreningen/moskén själv (M10-kontot). De redigerar fritt utan granskning — öppettider är inte ett löfte till en donator, det är praktisk info. Princip: verktyg, inte polis.
- **Bönetider:** **Visas INTE i v1.** Resonemang nedan.

**Designval — inga bönetider i v1.** Det är frestande att visa salah-tider på moské-sidan. Men: bönetider är beräknade (olika metoder — MWL, ISNA, Umm al-Qura — och olika inriktningar räknar olika). Att visa "fel" bönetid skadar förtroendet allvarligt, och att ta sida i beräkningsmetod krockar med princip 11 (islamiskt medveten, inte sekteristisk). Det finns redan utmärkta dedikerade appar för detta — princip 13, samordna befintlig godhet, säger: bygg inte om det. Moskén kan länka sin föredragna bönetidskälla i kontaktfältet. Parkerat — se Öppna frågor.

## 2.4 Vad gör man om moskén inte har ett konto

En moské kan finnas fysiskt men inte ha registrerat sig i katalogen (M10).

- **Då finns ingen moské-sida.** Vi skapar inte sidor åt moskéer utan deras medverkan — det är M10:s självregistreringsprincip (masterkartan: "Vi listar inte föreningar åt dem").
- Ett event kan ändå anges på en fysisk adress utan att moskén har en sida — adressen skrivs då som fritext (Block 1.3).
- UX uppmuntrar: "Arrangerar du i en moské som inte finns här? Be dem registrera sig."

---

# BLOCK 3 — Eventflöde & discovery

Hur events hittas.

## 3.1 Var events syns

Events har **en egen, tydligt avgränsad yta** — inte inflätade i insamlingsflödet (det är hela Block 4:s poäng).

| Yta | Vad den visar | Not |
|---|---|---|
| **Eventlista** ("Vad händer") | Kommande events, sorterade närmast i tid först | Egen flik, skild från insamlingsflödet |
| **Moské-sida** | Den moskéns kommande events | Block 2 |
| **Kartan (M12)** | Events som pins, filtrerbart lager | Se 3.3 |
| **Startsidan** | EN diskret modul, "På gång nära dig" | Se Block 4 — strikt begränsad |

## 3.2 Filter och sortering i eventlistan

- **Sortering:** Alltid kronologiskt — närmast i tid överst. Förflutna events visas inte i listan (de finns kvar på arrangörens sida som historik).
- **Filter:** Stad/region · Eventtyp (föreläsning, Eid, iftar...) · Digitalt/fysiskt · Arrangör.
- **Geografisk default:** Om användaren angett hemstad (M9-profil) defaultas listan till den staden. Annars hela Sverige. Aldrig en tom upplevelse.
- **Ingen sökruta för fritext i v1.** Eventvolymen är liten i början; filter räcker. Läggs till om volymen motiverar det.

## 3.3 Events på kartan (koppling M12)

- Varje fysiskt event med koordinater blir en **pin på Sverige-kartan** (M12).
- Events är ett **eget kartlager** som kan slås på/av — det får inte tränga undan insamlings-pins, som är kartans huvudsyfte.
- Klick på en event-pin → eventets sida. Klick på en moské-pin → moské-sidan med dess events.
- **Designval:** Kartan ägs av M12; M14 *matar* den med event-data men bestämmer inte kartans utseende. Tydlig ägandegräns, samma princip som M1 ↔ M12.

## 3.4 Eventets egen sida

Varje event har en egen sida (slug + slumpat ID, exakt som M1 Fält 2 — `/event/iftar-stockholm-4471`).

Innehåll: cover-bild, titel, typ, datum/tid, plats (med karta-pin och länk till moské-sidan om kopplad), beskrivning, arrangör (länk till M10-sida eller "Privatperson"), ev. anmälningslänk, ev. kostnad, dela-knapp.

**Ingen kommentarstråd på event i v1.** Community-interaktion (M13) är byggd kring insamlingar, där den tjänar transparens-loopen. En kommentarsfunktion på events öppnar en ny moderationsyta utan att tjäna huvudmålet. Reaktioner/dua hör hemma på insamlingar, inte på en iftar-annons.

---

# BLOCK 4 — Events vs insamlingar

Hur de två samexisterar — **utan att events stjäl fokus.** Huvudmålet är ALLTID insamling. Det här blocket är inte en åsikt; det är en uppsättning konkreta designspärrar.

## 4.1 Grundregeln

> **Insamlingar är huvudrätten. Events är kryddan.** Varje designbeslut i M14 ska kunna besvara frågan: *leder detta till mer insamling, eller bara till mer surfande?* Om svaret är "bara surfande" — begränsa det.

Det här är princip 1 i masterkartans norrstjärna i praktiken: *"Världen lockar, Kärnan levererar."* Events lockar. Men de får aldrig bli destinationen.

## 4.2 Konkreta spärrar som håller ordningen

| Spärr | Vad den gör | Varför |
|---|---|---|
| **Skild yta** | Events har egen flik, inte inflätade i insamlingsflödet | En donator som söker en insamling möter inte event-brus |
| **Startsidan: max 1 event-modul** | Endast EN diskret rad "På gång" på startsidan, under insamlingarna | Insamlingar äger startsidans översta, viktigaste yta |
| **Ingen push för events** | Events triggar **aldrig** push-notiser (M15) | Push är dyrbar uppmärksamhet — reserverad för insamlingar och transaktionellt |
| **Event-notiser är opt-in och digest** | Vill man ha event-tips får man välja det; levereras samlat, inte styckvis | M15 Block 3 & 4 — events är ren engagemang-notis |
| **Inga pengar på event** | Event tar inte emot donationer på plattformen | Tar man betalt blir eventet en konkurrent till insamlingen om plånboken |
| **Event-sidan pekar mot insamlingar** | Arrangörens pågående insamlingar visas på event-sidan och moské-sidan | Eventet blir en *väg in* till Kärnan, inte en återvändsgränd |

## 4.3 Den produktiva kopplingen — events som tratt till insamling

Events ska inte bara *inte skada* insamlingar — de ska **mata** dem:

- En **insamlingskväll** (eventtyp) länkar direkt till den insamling den samlar för. Eventet blir marknadsföring för insamlingen.
- En **moské-sida** visar både kommande events och pågående insamlingar sida vid sida — den som kom för öppettiderna ser insamlingen.
- En förening som arrangerar ett uppskattat Eid-firande bygger förtroende → deras nästa insamling möts av ett varmare community.

Så ser den rätta ordningen ut: event är en **anledning att komma**, insamling är **anledningen plattformen finns**. Tratten pekar inåt, mot Kärnan.

## 4.4 Vad vi medvetet INTE bygger

Rakt sagt — dessa skulle förskjuta fokus och avfärdas i v1:

- **Eventflöde som social kalender med RSVP, "vänner som går", aktivitetsflöde** → det gör plattformen till Facebook. Princip: M13 säger uttryckligen "inte Facebook". Gäller events dubbelt.
- **Biljettförsäljning** → blandar in ett andra pengaflöde, konkurrerar med donationen. (Se Block 1.2.)
- **Push-notiser för events** → se 4.2.
- **Events överst på startsidan** → den ytan tillhör insamlingar, alltid.

---

# BLOCK 5 — Anti-kaos för events

Granskning, förbud och automatisk städning. Skydd byggt in i mekaniken (princip 10).

## 5.1 Granskning — vad granskaren stoppar

Event-granskningen (Block 1.6) tillämpar **policyn i M8**. Granskaren stoppar:

- **Diskriminerande eller hatiskt innehåll** — riktat hat mot grupp, etnicitet, kön (princip 10, M8 anti-diskrimineringspolicy).
- **Sekteristiskt innehåll** — event som tar polemisk strid mellan inriktningar, eller utestänger muslimer på sekteristisk grund (princip 11, "islamiskt medveten, inte sekteristisk").
- **Politiska kampanjevent** — partipolitik, valmöten. Plattformen är för det muslimska samhället, inte en politisk arena.
- **Kommersiella event förklädda till community** — produktförsäljning, MLM, "investeringsseminarium".
- **Event utan verklig community-nytta** — privata fester, sådant som inte hör hemma på en samhällsplattform.
- **Vilseledande arrangörsuppgift** — någon utger sig för en moské/förening utan behörighet (Block 1.5).
- **Olämpliga eller icke-autentiska bilder** — samma bildäkthetsregel som M1 Fält 5.

## 5.2 Vad som inte tillåts — hård lista

| Inte tillåtet | Hanteras av |
|---|---|
| Insamling av pengar via event-objektet | Block 1.2 — strukturellt omöjligt, inget pengafält finns |
| Anmälningsavgift som plattformen tar | Block 1.2 — plattformen hanterar inte betalning för event |
| Diskriminering, hat, sekterism | Granskning (5.1) + M8 |
| Partipolitiska event | Granskning (5.1) |
| Kommersiell försäljning förklädd | Granskning (5.1) |
| Privatperson som låtsas vara förening | Granskning + M6-behörighet |

## 5.3 Anmälan av publicerat event

Trots granskning kan något slinka igenom (princip 4, "vårt fel men inte dödligt").

- Varje publicerat event har en **diskret "Anmäl"-länk** (samma mekanik som M13 community).
- Anmälan → granskaren får en notis (M15) → bedömer → kan sätta eventet `avvisad` och avpublicera.
- Avpublicering av ett kommande event → arrangören notifieras med motivering (M15, transaktionell).

## 5.4 Automatisk städning — inaktuella events försvinner

Detta är 95 %-självgående-principen för events. Allt nedan sker **utan en människa**.

| Situation | Vad systemet gör | Tidsgräns |
|---|---|---|
| Eventdatum har passerat | Event → `avslutat`, försvinner ur eventlistan | Vid midnatt efter eventdatum |
| Avslutat event | Visas kvar på arrangörens sida som historik, inte i flöden | Permanent som historik |
| Återkommande event utan aktivitet | Serien arkiveras (arrangören har sannolikt slutat) | 6 månader utan redigering eller ny förekomst |
| Event-utkast aldrig inskickat | Påminnelse, sen mjuk arkivering | 30 dagar (lättare än M1:s 60 — events är tidskänsliga) |
| Event i `inskickad` men granskning hinner inte före eventdatum | Auto-avvisas med vänlig motivering: "hann inte granskas i tid" | När eventdatum passeras |

**Designval — passerade events skräpar aldrig ner.** Inget är tråkigare på en levande plattform än en lista full av events som redan varit. Tidsbaserad auto-städning gör att eventlistan **alltid** är aktuell utan att någon rensar manuellt. Premium genom omsorg (princip 6) — en ren, aktuell yta är en omsorgshandling.

## 5.5 Kantfall

- **Event ställs in efter publicering:** Arrangören markerar `inställt`. Eventet visas kvar med tydlig "INSTÄLLT"-stämpel tills datumet passerat. Anmälda (om extern länk användes) är arrangörens ansvar att meddela — "verktyg, inte polis".
- **Förening lämnar katalogen (M10) med kommande events:** Events knutna till en avregistrerad förening avpubliceras automatiskt — utan en aktiv katalogentitet finns ingen ansvarig arrangör.
- **Samma event skapas dubbelt:** Inte förbjudet (samma resonemang som M1 Block 5: två insamlingar till samma sak). Granskaren kan slå ihop eller be arrangören välja. Sällsynt — låg-prioritet.
- **Event i det förflutna skapas:** Datum i dåtid → går inte att skicka in. Ett event är per definition framåtblickande.

---

## 5. Designval & motivering (hela Modul 14)

| Beslut | Motivering |
|---|---|
| Event tar aldrig emot pengar på plattformen | Ett andra pengaflöde skulle konkurrera med insamlingen om plånboken och blanda ihop Stripe Connect (M5). Externa länkar räcker. |
| Ingen anmälan/biljett i v1 | En hel produkt i sig. Arrangörens egen länk löser det. Parkerat. |
| Privatpersoner får skapa event — men hårdare granskad, märkt "Privatperson" | Inkluderande utan att vara naivt: en förening har rykte att förlora, en privatperson är svårare att hålla ansvarig. |
| Fast-track för betrodda föreningar (3 rena event) | 95 %-självgående. Granskaren ska inte läsa varje fredagsföreläsning från en moské vi redan litar på. |
| Moské-sidan är en vy av M10-entiteten, inte ett eget objekt | En källa till sanning. Inga två databaser att synka. |
| Inga bönetider i v1 | Beräkningsmetoder skiljer sig mellan inriktningar (princip 11). Fel tid skadar förtroendet. Dedikerade appar gör det bättre (princip 13). |
| Events har en skild yta, inte inflätade i insamlingsflödet | Hela Block 4: huvudmålet är insamling. Donatorn ska inte möta event-brus när hen söker en insamling. |
| Events triggar aldrig push (M15) | Push är dyrbar uppmärksamhet, reserverad för Kärnan och transaktionellt. Events är ren engagemang-notis. |
| Återkommande event = ett objekt med mönster, inte hundra objekt | Undviker att fylla databas och flöden med dubbletter. Granskas en gång. |
| Tidsbaserad auto-städning av passerade/döda events | En levande plattform får aldrig visa en lista full av events som redan varit. 95 %-självgående, premium genom omsorg. |
| Ingen kommentarstråd på events | M13 community är byggd kring insamlingar och transparens-loopen. Kommentarer på en iftar-annons öppnar moderationsyta utan att tjäna huvudmålet. |

---

## 6. Kopplingar

**Modul 14 tar in:**

- Föreningar och moskéer från **M10** (vem som får arrangera, moské-sidans grunddata).
- Roller och behörigheter från **M6** (vem som får skapa event, behörighet i en förening).
- Granskningskö-koncept och SLA-tänk från **M3** (event-granskningen är en lättare variant).
- Regelboken från **M8** (anti-diskriminering, sekterism, vad granskaren stoppar).
- Insamlingsobjekt från **M1** (vilka insamlingar en arrangör driver, visas på moské-/event-sida).
- Användarens hemstad från **M9** (geografisk default i eventlistan).

**Modul 14 lämnar ut:**

- Event- och moské-data som **M12** ritar som pins på kartan.
- Event-flödet som **M11** (discovery) kan visa intill insamlingsflödet — strikt avgränsat (Block 4).
- Triggers till **M15** — event publicerat/avvisat (transaktionellt till arrangören), event-digest (opt-in engagemang till användare).
- Förtroendesignaler till **M10** — en förening med uppskattade events stärker sin katalog-närvaro.

**Beroende-flagga:** M14 kan inte byggas färdigt förrän M10 (katalogen) finns — moské-sidan är en vy av en M10-entitet. M14 hör till bygg-grupp C, efter M10.

---

## 7. Säkerhet & anti-kaos

- **Granska före publicering** — inget event når allmänheten ogranskat (princip 7). Tillståndsmaskinen har ingen övergång `utkast` → `publicerat`.
- **Inget pengaflöde på event** — strukturellt omöjligt att samla in pengar via ett event-objekt; inget fält finns. Eliminerar en hel klass bedrägerier.
- **Arrangörsverifiering** — arrangörsfältet får bara peka på en M10-entitet om personen har behörighet där (M6). "Privatperson"-märkning där förtroendet inte är garanterat.
- **Anmäl-funktion** — det som slinker igenom kan fångas av communityn (5.3).
- **Automatisk städning** — passerade och döda events försvinner av sig själva; ytan hålls ren utan manuellt arbete (5.4).
- **Anti-diskriminering & anti-sekterism** — byggt in i granskningschecklistan (5.1), inte efterhandskontroll.
- **Fokusskydd** — Block 4:s spärrar skyddar Kärnan från att events tar över. Anti-kaos handlar här inte bara om bedrägeri utan om *uppmärksamhetsdisciplin*.

## 8. Automatisering

**Självgående (ingen människa):** event → `avslutat` efter datum, borttagning ur flöden, arkivering av döda serier och utkast, auto-avvisning av event som inte hann granskas, koordinat-hämtning för kartan, fast-track-publicering för betrodda föreningar, geografisk default i eventlistan, "nästa förekomst"-beräkning för återkommande event.

**Kräver människa:** event-granskningsbeslut (förstagångs och privatpersoner), bedömning av anmälda events, hopslagning av dubbletter, gränsfall i 5.5.

Riktmärke: när väl betrodda föreningar fått fast-track rullar de allra flesta events utan att en granskare rör dem. Granskaren ser nästan bara förstagångs-arrangörer och privatpersoner.

## 9. Öppna frågor

1. **Anmälan/biljetter inom plattformen** — parkerat för v1. Bedöms när event-volymen är känd. Skulle kräva en egen produktdiskussion och troligen ett separat, enkelt pengaflöde skilt från M5.
2. **Bönetider på moské-sidan** — parkerat. Om det införs senare måste beräkningsmetod hanteras neutralt (princip 11) eller hämtas från moskéns egen angivna källa.
3. **Fritextsök i eventlistan** — utelämnat i v1, läggs till om eventvolymen växer förbi vad filter klarar.
4. **Exakt antal rena event för fast-track** (riktmärke 3) — finjusteras tillsammans med M3 när granskningsdriften är känd.
5. **Event-historik på personprofiler (M9)** — ska en privatpersons arrangerade event synas på profilen som en utmärkelse? Bedöms i M9.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 14:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Alla 5 block spikade: event som objekt, moské- & platsinfo, eventflöde & discovery, events vs insamlingar (fokusspärrar), anti-kaos & auto-städning. |
