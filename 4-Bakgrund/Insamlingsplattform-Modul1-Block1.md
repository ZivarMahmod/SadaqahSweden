# Insamlingsplattform – Modul 1, Block 1: Identitet & innehåll

**Datum:** 2026-05-23
**Status:** Klart
**Bakgrund:** Detta är **första delen** av plattformens detaljplanering. Modul 1 är "Insamling som objekt" — kärnan i hela plattformen, allt annat refererar hit. Block 1 av Modul 1 specificerar vad en insamling **är** (innehåll, identitet).

---

## 1. Planeringsmetoden – så jobbar vi

För att slippa om-arbete på en plattform med pengaflöde och granskning (där arkitekturskifte är extremt dyrt) planerar vi enligt följande:

1. **Hela plattformen planeras innan första kodraden skrivs.**
   En produkt med "armar, ben och skosnören" — vi vet att alla delar finns innan vi bygger. Vi kanske inte bygger skosnörena först, men vi vet att de existerar.

2. **Planera i lager, varje lager fullständigt.**
   Inte 10 % av varje lager och iterera 20 gånger. Ta ett block till botten, sedan nästa. Detaljer per fält när vi tar fältet — annars planerar vi i evighet.

3. **Allt vi planerar = del av plattformen ("v1").**
   "v2" som term är slopad. Implementeringsordning är en *separat* plan vi gör senare när hela kartan är klar.

4. **Insamlaren av idéer ÄGER flödet, han säger till när ett stycke är klart.**
   Nörden styr vilken fråga som tas härnäst. Zivar avgör när vi gått tillbottenklart med ett ämne.

---

## 2. Modul 1 i översikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Identitet & innehåll | ✅ Klart |
| 2 | Mål, pengar, tid | ⏳ Nästa |
| 3 | Livscykel | ⏳ |
| 4 | Relationer | ⏳ |
| 5 | Regler & kantfall | ⏳ |

När alla 5 block är klara vet vi exakt vad ett insamlings-objekt **är** och hur det beter sig. Då går vi vidare till Modul 2.

---

## 3. Plattformens 12 moduler – grovkartan

För kontext (innehållet i varje modul detaljeras när vi når den):

1. **Insamling som objekt** ← vi är här
2. Insamlar-flödet
3. Granskar-flödet
4. Donator-flödet
5. Pengaflöde
6. Identitet & auth
7. Organisationer & collab
8. Transparens-loopen
9. Notiser & kommunikation
10. Listning, sökning, kategorisering
11. Admin & dashboard
12. Policies & regler

---

## 4. Block 1: alla 6 fält – fullständig specifikation

### Fält 1 – Kategori

**Vad fältet är:** vad insamlaren samlar till.

**Specifikation:**
- **Form:** Fast lista med dropdown (i v1, kan öppnas upp till fritext senare när vi förstår driften bättre)
- **Multi-val:** En insamling kan tagga *flera* kategorier
- **Självreglering:** Fler kategorier = fler bevis i resultatfasen. Taggar man tre kategorier måste man bevisa alla tre i resultatleveransen. Tvingar fokus utan att hindra.
- **Hierarki:** Platt struktur i v1, ingen huvudkategori → underkategori
- **Obligatoriskt:** Ja
- **Publikt synligt:** Ja
- **Granskare kan ändra:** Ja (om kategori är fel mot ändamål kan granskaren föreslå/ändra)

**Kategorilista (utgångspunkt, finslipas innan lansering):**
- Mosképrojekt (renovering, bygge, utrustning)
- Religiösa varor (bönemattor, Quran, böcker)
- Vatten (brunnar, klassisk sadaqah jariyah)
- Mat (Ramadan iftar, hunger, Qurban/Eid)
- Utbildning (madrasa, Quran-undervisning, stipendier)
- Akut katastrofhjälp (krig, jordbävning, översvämning)
- Föräldralösa & utsatta barn
- Sjukvård (utomlands)
- Begravning / Janazah
- Övrig sadaqah jariyah

**Implikation för andra moduler:**
- Resultatbevis-modulen (Modul 8) måste känna till alla taggade kategorier och kräva bevis per kategori

---

### Fält 2 – Titel

**Vad fältet är:** namnet på insamlingen.

**Specifikation:**
- **Maxlängd:** 80 tecken
- **Format:** Klartext + specialtecken. Inga emoji. Inga ALL CAPS-titlar. Plattformen ska kännas seriös, inte clickbait.
- **Obligatoriskt:** Ja
- **Publikt synligt:** Ja
- **Slug/URL:** Auto-genererad från titeln + kort slumpat ID-suffix
  - Exempel: `/insamling/bonematter-7842`
  - ID är **slumpat** (6–8 tecken), inte sekventiellt — vi exponerar inte plattformens volym
  - Vid lookup går vi på ID, slugen är bara läsbarhet och SEO
  - Vid titel-ändring genereras ny slug, ID är permanent → gamla länkar redirectar automatiskt

**Implikation för andra moduler:**
- URL-strukturen styrs här, gäller hela plattformen

---

### Fält 3 – Beskrivning

**Vad fältet är:** hela storyn om insamlingen.

**Specifikation:**
- **Två fält i ett:**
  - **Kort beskrivning** — max 200 tecken. Syns i listkort, sökresultat, social-media-preview. Tvingar insamlaren formulera kärnan.
  - **Lång beskrivning** — max 5000 tecken (~800 ord). Syns på insamlingens egen sida.
- **Format:** Markdown-light (bold, italic, listor, eventuellt H2/H3). Inte HTML, inte rik editor.
- **Inline-bilder i beskrivningen:** Nej. Bilder hör hemma i Media-fältet — granskaren behöver veta exakt var att titta.
- **Externa länkar:** Tillåtna i lång beskrivning (leverantör, moskéns hemsida, etc.). Granskningsobjekt — granskaren ser var länkarna pekar och godkänner.
- **Obligatoriskt:** Ja (både kort och lång)
- **Publikt synligt:** Ja
- **Maxlängder är "rimliga i början":** justeras om insamlare ber om mer

**Skapande-stöd:**
- En **wizard** vid skapande hjälper insamlaren strukturera tänket
- Wizard ställer 4–5 strukturerande frågor: *Vad samlar du till? Varför? Hur ska pengarna användas? När levereras resultatet? Vad kan du bevisa?*
- Svaren blir basen i lång beskrivning, insamlaren formulerar i sina egna ord
- Markdown-editor med live preview + formatting buttons + tooltips
- Goda exempel att inspireras av

**Varför inte AI-skrivassistent i v1:**
- Komplexitet (API-koppling, prompt-design, kostnad per generation, error-handling)
- Homogenisering är gift för plattformen — donatorer ger till *människor* de litar på. Ahmeds knasiga, ostrukturerade text är *mer trovärdig* än AI-polerad perfektion. Den oslipade rösten är plattformens själ.
- Granskningsproblem — om AI skrev, vad granskar vi? Sanningen i ändamålet eller AI:ns formulering?
- AI som hjälpverktyg kan komma i Modul 2 efter att wizarden är klar

---

### Fält 4 – Mottagare

**Vad fältet är:** vem/vad får projektet eller resultatet.

**Specifikation:**
- **Halvstrukturerat — två delar:**
  - **Mottagartyp** (dropdown): Moské / Madrasa eller utbildningsinstitution / Sjukhus eller vårdinrättning / Familj eller individ (utomlands) / Område eller by / Organisation / Annat
  - **Mottagarbeskrivning** (fritext, max 500 tecken): *"50 moskéer i Sverige, identifierade via lokala kontakter"* eller *"by X i Somaliland, ca 300 invånare, kontakt via Imam Y"*
- **Antal mottagar-entiteter:** En per insamling. Är det kollektivt (50 moskéer, en stad, 200 familjer) behandlas det som en *kollektiv* mottagare med detaljer i fritexten. Vi modellerar inte 50 separata mottagare — det vore över-engineering.
- **Obligatoriskt:** Ja
- **Publikt synligt:** Ja
- **Verifieringsdokument:** Bifogas för granskning **när det är möjligt**. När det inte är (kläder till behövande på okänd plats, abstrakta mottagargrupper) → granskaren bedömer rimligheten från fall till fall. **Flexibilitet, inte strikt regel.**

**Vad är "mottagare" specifikt:**
- Insamlaren genomför själv (modell A): mottagaren är slut-beneficiaren, inte mellanhanden
- Om insamlaren väljer att skicka pengar via en organisation eller förening är det insamlarens process — plattformen modellerar inte detta separat
- Personlig nöd inom Sverige (modell C) är **ute** av v1. Familj/individ-typ syftar på utomlands

**Implikation för andra moduler:**
- Verifieringsfas i granskningen (Modul 3) hanterar mottagar-bevisning från fall till fall

---

### Fält 5 – Media

**Vad fältet är:** bilder (och i framtiden video) som visar målet, anledningen, nuläget.

**Specifikation:**
- **En media-struktur, olika roller beroende på fas:**
  - **Cover-bild** — 1 obligatorisk, visas främst
  - **Gallery** — upp till 5–10 bilder
  - **Update** — kommer i Modul 8 (transparens-loopen)
  - **Result_proof** — kommer i Modul 8
  - **Payout_proof** — kommer i Modul 5/8
- **Tekniskt:** En `insamling_media`-tabell med ett **roll-fält** (cover / gallery / update / result_proof / payout_proof). Inte separata tabeller per fas.
- **Format:** jpeg, png, webp. **Inte gif** (animerade gifs blir clickbait), inte raw/tiff.
- **Filstorlek:** Max 5 MB per bild. Komprimeras till webp serverside för effektiv leverans (lagrar original + komprimerad).
- **Webp är primärt output-format** — Cloudflare/Vercel Edge och de flesta CDN serverar webp som default.
- **Video:** **Inte direktuppladdning i v1.** Kostnad: transcoding, lagring, bandwidth, granskningskomplexitet. **Extern länk** (YouTube/Vimeo) tillåten i lång beskrivning, embedas vid visning.
- **Obligatoriskt:** 1 cover-bild minimum
- **Publikt synligt:** Ja

**Granskningsregel (insikt från diskussionen):**
- Bilder ska vara **relevanta och autentiska** för ämnet
- Inte stockbilder, inte dramatiserade
- Renoveringsprojekt → före-bilder + planer för efter
- Inga "high graphic"-bilder som överdriver eller manipulerar

---

### Fält 6 – Plats

**Vad fältet är:** geografisk plats för insamlingen.

**Specifikation: TVÅ separata platsfält**

**Plats där hjälpen landar (mottagar-plats) — publikt synligt, detaljerad:**
- **Primärt land** (obligatoriskt, dropdown) — Sverige, Somalia, Gaza, Pakistan, Bangladesh, Sudan, etc.
- **Specifik plats** (rekommenderat, fritext) — "Stockholm", "Mogadishu och omnejd", "Gaza", "Hela landet"
- **GPS-koordinater** (frivilligt, möjliggör kartvisualisering senare)
- **Princip:** *desto mer desto bättre* — folk vill se vart hjälpen går, och kan koppla in om de har personlig anknytning

**Plats där insamlingen sker (insamlar-plats) — minimum stad, integritetsskyddad:**
- **Stad** (obligatorisk, publik)
- **Region** (frivillig, publik)
- **Detaljer (gata/adress)** (frivilliga, insamlaren styr själv om de visas eller bara finns internt för granskning)
- **Princip:** integritet — insamlaren ska känna sig skyddad. Bara stad obligatoriskt, allt utöver väljer insamlaren.

**Obligatoriskt:** Ja (åtminstone primärt land + stad)
**Publikt synligt:** Hjälp-plats fullt; insamlar-plats per fält enligt insamlarens val

**Strategisk bieffekt (planerat innehåll till Modul 10/11):**
- Insamlar-plats möjliggör geografisk insikt om muslimska samhället i Sverige
  - Vilka kommuner driver mest? Vad brister i Jönköping? Vad gör Karlstad rätt?
  - Föreningen kan pusha värdet ("den här staden har gjort så mycket via plattformen")
- Mottagar-plats kan trigga personlig koppling → folk med anknytning erbjuder praktisk hjälp utöver donation

---

## 5. Genomgripande designprinciper (från Block 1-diskussionen)

Dessa principer återkommer genom hela plattformen.

### Princip 1: Publika vs interna fält – (B)-modellen
Strukturen visas publikt. Granskningen säkerställer kvalitet *vid* publicering. Innan publicering kan drafts vara halvfärdiga. Vid publicering = godkänt och tydligt. **Granskaren är vakt vid grinden, inte censor.**

### Princip 2: Per-fält integritetskontroll
Vissa fält har en `visibility_public` toggle som insamlaren styr per fält. Data lagras → granskaren ser allt internt → donatorn ser bara det som är publikt. Påverkar databasstrukturen genom hela plattformen.

### Princip 3: 95 % självgående
När vi designar varje modul ska vi fråga: *kan detta automatiseras eller hanteras med smart UX så Zivar inte behöver agera?* Zivar har inte tid att granska heltid. Plattformen måste sköta sig själv så långt det går.

### Princip 4: "Vårt fel men inte dödligt"
Pragmatisk filosofi. Vi gör vårt bästa, accepterar att 100 % är omöjligt. Räddar oss från över-design kring varje gränsfall. Om något passerar — det är vårt fel men inte dödligt. Lär, justera, fortsätt.

### Princip 5: Verktyg, inte polis
Plattformen tillhandahåller infrastruktur, insamlaren äger sitt eget ansvar. Vi tvingar inte fram en strukturering av *hur* insamlaren utför jobbet — bara att resultatet bevisas.

---

## 6. Parkerade insikter – tilldelade rätt modul

Allt nedanstående **planeras** in i sin modul. Implementeringsordning är separat fråga.

### Till Modul 2 (insamlar-flöde)
- **Skapande-wizard** med 4–5 strukturerande frågor (kärnfunktion vid skapande)
- **AI-skrivassistent** – stöd för formulering. Implementeras efter wizarden är klar
- **Granskningsstatus syns för insamlaren** – var den befinner sig i processen

### Till Modul 3 (granskar-flöde)
- **Granskare kan ändra fält** under granskning (åtminstone kategori). Detaljer per fält spikas i Block 5.
- **Ändringsbegäran-mekanik:** granskare → tydlig motivering → insamlaren → svarar/redigerar → tillbaka. Flera rundor möjliga. Status-tillstånd ("väntar på insamlare" / "väntar på granskare"). Loggning så ingen kan säga "det stod inte så".
- **Verifieringsfas** med mottagar-bevisning från fall till fall (vissa kan dokumentera, andra inte)
- **Mottagare som inte kan dokumentera** – granskaren bedömer från beskrivningen + sin egen kunskap

### Till Modul 7 (organisationer & collab)
- **Strukturerad collab-credit** på insamlingar — föreningar som stöttat en insamling kan synas
- Belönar generösa föreningar, sprider deras existens organiskt utan att vara reklam

### Till Modul 8 (transparens-loopen)
- **Uppdaterings-media** med roll `update` i samma media-struktur
- **Resultat-bevis-media** med roll `result_proof`
- **Utbetalnings-bevis-media** med roll `payout_proof`

### Till Modul 9 (notiser & kommunikation)
- **"Erbjud praktisk hjälp utöver donation"** — donator med personlig koppling till mottagar-platsen kan erbjuda hjälp på plats, inte bara pengar

### Till Modul 10 (listning, sökning, kategorisering)
- **Popularitetsranking inom kategorier** — om en kategori är populär kan donatorn se befintliga insamlingar istället för att skapa en till, donationer sprids över flera kategorier
- **Geografisk filtrering** — visa insamlingar för specifik hjälp-plats

### Till Modul 11 (admin & dashboard)
- **Geografisk insiktsdashboard** för muslimska samhället i Sverige
- Statistik: aktiva insamlingar, total samlat, kommun-aktivitet, trender över tid
- Föreningen kan pusha värdet som data till städer/regioner

### Till Modul 12 (policies & regler)
- **Anti-diskrimineringspolicy** — språk mot folkgrupper är otillåtet, fångas i granskning
- **Bildkvalitet/autenticitet-policy** — relevant, autentisk, inte stockbilder eller dramatisering
- **Granskningskriterier per kategori** — olika kategorier kräver olika bevisning
- **Insamlare = vem som helst** — krav på att vara muslim är inte beslutat ännu, men plattformens granskning sitter primärt på *projektet*, inte personen. Spikas i denna modul.

---

## 7. Granskningsregler som dök upp under Block 1

Sammanfattning av allt som hör till granskningen, från Block 1-diskussionen:

1. **Kategorin granskas mot ändamålet** — granskare kan föreslå/ändra om fel
2. **Mottagar-rimlighet** — bevis när möjligt, bedömning från fall till fall annars
3. **Bildernas autenticitet och relevans** — inga stockbilder, inga dramatiserade bilder
4. **Externa länkar i beskrivning** — granskaren ser var de pekar
5. **Diskriminerande språk fångas** — anti-diskrimineringspolicy
6. **Tydlighet för donator** — vid publicering måste det vara begripligt vad pengarna går till
7. **Insamlare är KYC-verifierade** — seriösa personer (detaljer kommer i Modul 6)

Detaljerad granskningspolicy och beslutsregler dokumenteras i Modul 12 när vi når den.

---

## 8. Beslutsloggsammanfattning

Större beslut och deras motivering, för framtida-Zivar och framtida-Nörden:

| Beslut | Motivering |
|---|---|
| **Insamlaren genomför själv (modell A) är huvudmodellen** | Det är bönematteinsamlingens modell, det är vad piloten lär oss, allt vi planerar designar mot detta |
| **Insamlaren får skicka pengar via organisation (modell B) — men det modelleras inte separat** | Plattformen bryr sig om vad som lovas och vad som levereras, inte HUR insamlaren utför däremellan. "Verktyg, inte polis." |
| **Personlig nöd i Sverige (modell C) är UTE** | Omöjligt att granska sanningshalten i "min mammas cancer". GoFundMes mardröm. En enda fejk-insamling som glider igenom kan slakta plattformens trovärdighet. |
| **Flera kategorier per insamling tillåtet** | Med kostnad i bevisledet — taggar man tre kategorier måste man bevisa alla tre. Självreglerande, tvingar fokus utan att hindra. |
| **Fast lista för kategorier (inte fritext)** | Fritext gör granskning omöjlig — vi vet inte vilka kriterier att applicera |
| **Slug + ID-suffix för URL** | Alltid unik, läsbar, ändringssäker (titel kan ändras, ID kvar, gamla länkar redirectar) |
| **Två fält för beskrivning (kort + lång)** | Kort tvingar formulera kärnan, lång ger plats för storyn. Båda behövs. |
| **Wizard istället för AI-skrivassistent** | Folk vet *vad* de vill säga, de vet bara inte *i vilken ordning*. Wizard löser det. AI som tillägg senare. |
| **En mottagar-entitet per insamling (kollektiv om många)** | Inte modellera 50 separata moskéer = över-engineering. Kollektivet behandlas som en mottagare. |
| **TVÅ platsfält (hjälp + insamlar)** | Hjälp-plats för discovery och transparens; insamlar-plats för integritet och geografisk insikt om samhället |
| **(B)-modellen för publika fält** | Strukturen är publik, granskningen säkerställer kvalitet. Renaste modellen — granskaren är vakt vid grinden, inte censor. |

---

## 9. Vad händer härnäst

**Modul 1, Block 2: Mål, pengar, tid.** Vi gräver hela den ekonomiska och tidsmässiga ramen:
- Målbelopp (fast, intervall, eller öppet?)
- Valuta-struktur (SEK i v1, struktur för fler?)
- Insamlingsdeadline vs genomförandedatum (två datum, ska båda finnas?)
- Vad händer vid **över**mål (fortsätter ta emot eller stänger?)
- Vad händer vid **under**mål (insamlaren får ändå eller refund?)
- Refund-policy generellt
- Förlängningsregler

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första utkast. Block 1 av Modul 1 fullständigt dokumenterat, 6 fält + 5 genomgripande principer + parkerade insikter till modul 2–12. |
