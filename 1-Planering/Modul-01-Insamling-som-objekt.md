# Modul 1 — Insamling som objekt

**Lager:** 🟢 Kärnan
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, samt frö-arbetet i `4-Bakgrund/Insamlingsplattform-Modul1-Block1.md` och `-Block2.md`

---

## 1. Vad modulen är

Modul 1 definierar **vad en insamling är** — som dataobjekt och som verklighet. Inte hur man skapar den (M2), inte hur man granskar den (M3), inte hur man ger till den (M4). Bara: vad *är* den, vilka egenskaper har den, hur beter den sig över tid, vilka regler styr den.

**Den löser:** allt annat på plattformen pekar på insamlings-objektet. Om objektet är otydligt blir hela plattformen otydlig. Den här modulen gör objektet skarpt.

---

## 2. Varför den behövs först

Du kan inte planera "hur granskaren granskar" innan du vet *vad* som granskas. Du kan inte planera donationsflödet innan du vet vad en donation pekar på. Insamlings-objektet är navet — fem ekrar går ut från det, och alla andra moduler är ekrar.

Därför är M1 modul nummer ett, och därför planeras den till botten innan något annat.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Identitet & innehåll — vad insamlingen *säger* | ✅ Spikad |
| 2 | Mål, pengar, tid — den ekonomiska och tidsmässiga ramen | ✅ Spikad |
| 3 | Livscykel — insamlingens tillstånd och övergångar | ✅ Spikad |
| 4 | Relationer — vad som pekar in i och ut från objektet | ✅ Spikad |
| 5 | Regler & kantfall — vad som får ändras, av vem, vad som händer när det går fel | ✅ Spikad |

När alla fem är klara vet vi exakt vad ett insamlings-objekt *är* och hur det *beter sig*.

---

# BLOCK 1 — Identitet & innehåll

Vad insamlingen säger om sig själv. Sex fält.

## Fält 1 — Kategori

**Vad fältet är:** vad insamlaren samlar till.

**Specifikation:**
- **Form:** Fast lista, dropdown. (Kan öppnas mot fritext senare när vi förstår driften — inte i v1.)
- **Multi-val:** En insamling får tagga *flera* kategorier.
- **Självreglering:** Fler kategorier = fler bevis i resultatfasen. Taggar du tre kategorier måste du bevisa alla tre. Tvingar fokus utan att förbjuda bredd.
- **Hierarki:** Platt i v1. Ingen huvud-/underkategori.
- **Obligatoriskt:** Ja. **Publikt:** Ja. **Granskaren får ändra:** Ja.

**Kategorilista (utgångspunkt, finslipas före lansering):**
Mosképrojekt · Religiösa varor (bönemattor, Quran, böcker) · Vatten (brunnar) · Mat (iftar, hunger, Qurban) · Utbildning (madrasa, stipendier) · Akut katastrofhjälp · Föräldralösa & utsatta barn · Sjukvård (utomlands) · Begravning/Janazah · Övrig sadaqah jariyah.

**Kantfall:** Insamlaren taggar fel kategori → granskaren ändrar i granskningen, med motivering. Ingen kategori passar → "Övrig sadaqah jariyah" är fångnätet.

## Fält 2 — Titel

**Vad fältet är:** namnet på insamlingen.

**Specifikation:**
- **Maxlängd:** 80 tecken. **Obligatoriskt:** Ja. **Publikt:** Ja.
- **Format:** Klartext + specialtecken. Inga emoji. Inga ALL CAPS-titlar. Seriöst, inte clickbait — fångas i granskning.
- **Slug/URL:** Auto-genererad från titeln + slumpat ID-suffix. Ex: `/insamling/bonematter-7842`.
  - ID är **slumpat** (6–8 tecken), inte sekventiellt — vi exponerar inte plattformens volym.
  - Uppslag sker på ID. Slugen är bara läsbarhet + SEO.
  - Titeländring → ny slug, **ID permanent** → gamla länkar redirectar automatiskt.

**Kantfall:** Två insamlingar med samma titel → olika ID-suffix, ingen krock. Tom titel → går inte att skicka in.

## Fält 3 — Beskrivning

**Vad fältet är:** hela storyn.

**Specifikation — två fält i ett:**
- **Kort beskrivning** — max 200 tecken. Syns i listkort, sökresultat, social preview. Tvingar fram kärnan.
- **Lång beskrivning** — max 5000 tecken (~800 ord). Syns på insamlingens egen sida.
- **Format:** Markdown-light (fet, kursiv, listor, ev. H2/H3). Inte HTML, inte rik editor.
- **Inline-bilder:** Nej. Bilder hör hemma i Media-fältet — granskaren ska veta var att titta.
- **Externa länkar:** Tillåtna i lång beskrivning. Granskningsobjekt — granskaren ser vart de pekar.
- **Obligatoriskt:** Ja (båda). **Publikt:** Ja.

**Skapande-stöd:** En wizard (planeras i M2) ställer 4–5 strukturerande frågor och svaren blir basen för lång beskrivning. **Ingen AI-skrivassistent i v1** — homogenisering är gift, donatorer ger till *människor* de litar på; Ahmeds oslipade text är mer trovärdig än AI-polerad perfektion.

**Kantfall:** Insamlaren ber om mer än 5000 tecken → maxlängder är "rimliga i början", justeras vid behov.

## Fält 4 — Mottagare

**Vad fältet är:** vem/vad får projektet eller resultatet.

**Specifikation — halvstrukturerat, två delar:**
- **Mottagartyp** (dropdown): Moské / Madrasa eller utbildningsinstitution / Sjukhus eller vårdinrättning / Familj eller individ (utomlands) / Område eller by / Organisation / Annat.
- **Mottagarbeskrivning** (fritext, max 500 tecken): t.ex. *"50 moskéer i Sverige, identifierade via lokala kontakter"*.
- **Antal mottagar-entiteter:** En per insamling. Kollektiv (50 moskéer, 200 familjer) = *en kollektiv mottagare* med detaljer i fritext. Vi modellerar inte 50 separata — det är över-engineering.
- **Obligatoriskt:** Ja. **Publikt:** Ja.
- **Verifieringsdokument:** Bifogas för granskning **när det är möjligt**. När det inte är (kläder till behövande på okänd plats) → granskaren bedömer rimligheten från fall till fall. **Flexibilitet, inte strikt regel.**

**Vad "mottagare" är:** slut-beneficiaren, inte mellanhanden. Skickar insamlaren pengar via en organisation är det insamlarens process — plattformen modellerar inte det separat ("verktyg, inte polis"). **Personlig nöd inom Sverige (modell C) är ute av v1** — omöjligt att granska sanningshalten, GoFundMes mardröm. Familj/individ-typ syftar på utomlands.

## Fält 5 — Media

**Vad fältet är:** bilder (video senare) som visar mål, anledning, nuläge.

**Specifikation:**
- **En media-struktur, roll-fält styr fasen:** `cover` / `gallery` / `update` / `result_proof` / `payout_proof`. En tabell `insamling_media` med rollkolumn — inte separata tabeller per fas.
- **Cover:** 1 obligatorisk, visas främst. **Gallery:** upp till 5–10 bilder.
- `update`, `result_proof`, `payout_proof` fylls i M7 (transparens-loopen) och M5.
- **Format:** jpeg, png, webp. **Inte gif** (animerat = clickbait), inte raw/tiff.
- **Filstorlek:** Max 5 MB/bild. Komprimeras till webp serverside (original + komprimerad lagras).
- **Video:** Ingen direktuppladdning i v1 (transcoding/lagring/bandbredd/granskningskomplexitet). Extern länk (YouTube/Vimeo) tillåten i lång beskrivning, embedas vid visning.
- **Obligatoriskt:** 1 cover-bild. **Publikt:** Ja.

**Granskningsregel:** Bilder ska vara **relevanta och autentiska**. Inte stockbilder, inte dramatiserade, inga "high graphic"-bilder som överdriver. Renoveringsprojekt → före-bilder + planer.

## Fält 6 — Plats

**Vad fältet är:** geografisk plats. **TVÅ separata platsfält.**

**A. Hjälp-plats (där hjälpen landar) — publikt, detaljerad:**
- **Primärt land** (obligatoriskt, dropdown).
- **Specifik plats** (rekommenderad, fritext) — "Mogadishu och omnejd", "Gaza", "Hela landet".
- **GPS-koordinater** (frivilligt — möjliggör kartvisualisering i M12).
- **Princip:** *desto mer desto bättre* — folk vill se vart hjälpen går.

**B. Insamlar-plats (där insamlingen sker) — integritetsskyddad:**
- **Stad** (obligatorisk, publik).
- **Region** (frivillig, publik).
- **Gata/adress** (frivillig — insamlaren styr själv om det visas eller bara finns internt för granskning).
- **Princip:** integritet. Bara stad obligatoriskt; allt utöver väljer insamlaren (per-fält integritetskontroll).

**Obligatoriskt:** Ja (minst primärt land + stad). **Publikt:** Hjälp-plats fullt; insamlar-plats per fält enligt insamlarens val.

**Strategisk bieffekt:** Insamlar-plats föder geografisk insikt om muslimska samhället i Sverige (M12 + M16). Hjälp-plats kan trigga personlig koppling → folk med anknytning erbjuder praktisk hjälp utöver donation (M15).

---

# BLOCK 2 — Mål, pengar, tid

Hela den ekonomiska och tidsmässiga ramen. Sex fält.

> **Övergripande flagga:** Pengaflödet (M5) styr Block 2. Antagandet vi planerar mot — bekräftas i M5: **Stripe håller medlen tills insamlingsdeadline, utbetalning sker då** (inte per donation direkt). Det ger plattformen kontroll vid stängning och håller refund vid bedrägeri/fel tekniskt möjlig fram tills medlen transfererats. Allt nedan bygger på det antagandet.

> **OBS — återbetalningsmodellen reviderad (Tillägg-Nya-beslut-2026-05-23 A1).** Den ursprungliga undermåls-modellen i Fält 4 (donatorn väljer per donation "ge ändå / återbetala mig", automatisk refund vid missat mål) **utgår**. Ny modell: pengarna flödar framåt — de används för saken oavsett om exakt mål nås; missat mål ger ingen automatisk återbetalning. Fält 4 nedan är uppdaterat enligt detta.

## Fält 1 — Målbelopps-modell

**Tre modeller i v1:**

- **Fast** — exakt målbelopp ("35 000 kr för 1000 mattor"). Tydligast. Progress bar mot exakt mål.
- **Intervall** — min–max ("30 000–50 000 kr"). Erkänner att leverantörspris varierar. Bönematteinsamlingen är denna.
- **Öppet** — ingen tröskel ("vi samlar så mycket vi kan"). Passar katastrofer.

**Vad räknas som "målet nått":**
- **Fast:** 100 % av målet inne.
- **Intervall:** **lägstanivån** = "målet nått". Vid 30k är minsta lovade leverans bevisad. 30k→50k är "extra volym". Progress bar full vid 30k, sen stretch-markering mot 50k. Övermål-trigger vid 50k.
- **Öppet:** "målet nått" är inte relevant. När deadline triggar är det som finns vad som finns. Insamlaren har förbundit sig till en fördelningspolicy.

**Bevistryck per modell** (kopplar till M7):
- Fast → skarpast (sa 1000 mattor, ska visa 1000 mattor).
- Intervall → tryck på lägstanivåns leverans; extra-volym dokumenteras separat.
- Öppet → tryck på fördelningslogiken, inte volymen.

**Granskaren bedömer** vid ansökan vilken modell som passar projektet.

**Får målet/modellen ändras efter publicering:**
- **Höjas:** Ja, om genuint motiverat — kräver granskar-godkännande, måste motiveras så donatorer förstår.
- **Sänkas:** Nej. Redan donerade pengar ska inte plötsligt täcka mindre.
- **Byta modell** (fast→intervall etc.): Nej. Ändrar löftet till donatorn.

**Min/max-gränser:** Minimum parkeras till M8 (granskningspolicy). Maximum: ingen hård gräns, men över tröskel (riktmärke 500 000 kr) triggar **utökad granskning** (spikas i M3).

**Per-enhet är ingen egen modell** — det är en display-flagga på "fast". Donatorn kan uttrycka gåvan som enheter ("20 mattor") eller belopp ("700 kr"); samma underliggande charge. Spikas i M4.

**Avfärdat:** Stretch goals (löses inom intervall-modellen) · Match-funding (kräver tredjepartsåtagande, komplicerar pengaflödet — parkerat till M4).

## Fält 2 — Datum-struktur

**Två datum, olika roll:**

**A. Insamlingsdeadline** — när pengaflödet stänger.
- **Obligatoriskt.** Hård gräns: efter detta tar insamlingen inte emot fler donationer.
- **Tidsfönster:** min 7 dagar, standard-max 60 dagar. Granskaren kan godkänna längre (katastrofer, stora projekt).
- Insamlaren *föreslår*, granskaren *godkänner* som del av granskningen.

**B. Genomförandedatum** — när resultatet ska vara levererat till mottagaren.
- **Obligatoriskt men "uppskattat"** — en signal, inte en hård juridisk deadline. Insamlaren lovar ett *ungefärligt* leveransdatum.
- Passerar genomförandedatum utan resultatbevis → transparens-loopen (M7) triggar påminnelse, och insamlingen visar publikt "Väntar på resultat". Inte straff — "verktyg, inte polis" — men **synligt**.

**Visning för donatorn:** Båda visas. "Insamlingen stänger om 12 dagar. Förväntad leverans: augusti 2026."

**Kantfall:** Genomförandedatum före insamlingsdeadline → inte tillåtet (kan inte leverera innan insamlingen ens stängt). Öppet-modell utan tydligt slut → insamlingsdeadline är ändå obligatorisk; "öppet" gäller beloppet, inte tiden.

## Fält 3 — Övermål-policy

**Vad händer när målet passeras.**

- **Default: insamlingen fortsätter ta emot** efter att målet nåtts. Folk vill ge — vi stoppar dem inte i onödan.
- **Villkor:** för att tillåta övermål måste insamlaren ha deklarerat en **övermålsplan** i wizarden (M2) — *"Extra medel går till: fler mattor / nästa moské / samma kategori"*. Granskas. Utan deklarerad plan → insamlingen **auto-stänger vid målet**.
- Insamlaren kan aktivt välja **auto-stäng vid mål** även om plan finns.
- **Intervall:** mellan min och max = extra volym (ingen separat övermål-händelse). Vid max (50k) → övermål-trigger → samma logik som ovan.
- **Öppet:** övermål-begreppet finns inte.

**Transparens:** Vid övermål visas tydligt på insamlingen: *"Detta projekt har nått sitt mål. Extra medel går till: [övermålsplan]."* Donatorn vet alltid vad en krona över målet gör.

## Fält 4 — Undermål-policy

**Vad händer när deadline nås men målet inte.**

- **Pengarna flödar framåt.** Medlen används för saken oavsett om exakt mål nås. 30k istället för 35k köper färre mattor men ändå mattor. "Verktyg, inte polis." Detta är keep-what-you-raise-modellen och den rätta för vår filosofi.
- **Missat mål utlöser ingen automatisk återbetalning.** Missar en insamling 50 000 med 49 998 återbetalas ingenting per automatik.
- **Vid missat mål — två vägar:** insamlingen kan **förlängas en gång** (se Fält 5), eller så **används medlen som de är** för en skalad insats. Insamlaren rapporterar utfallet via transparens-loopen (M7).
- **Donatorns per-donation-val "ge ändå / återbetala mig" utgår.** Det är inte längre en kryssruta vid donation (M4 Block 2 uppdaterat).
- **Icke-förhandlingsbart krav:** donatorn ska **vid gåvotillfället** tydligt veta att gåvan används för saken oavsett om exakt mål nås. Transparens vid gåvotillfället ersätter det tidigare valet — utan det är det ett förtroendebrott.
- **Bevistryck justeras:** når insamlingen bara 60 % visar transparens-loopen det ärligt — resultatet bevisas mot vad som faktiskt samlades in, inte mot det ursprungliga målet.

**Varför (Tillägg A1):** sadaqah som getts är Islamiskt oåterkallelig; givaren vill att saken hjälps oavsett slutsumma. Enklare flöde, färre tillstånd.

**Återbetalning är ett undantag** — inte en del av undermåls-policyn. Den sker bara vid **bedrägeri** (upptäckt i valfritt skede, pengar återkallas i den mån det går med juridiska medel) eller **fel** (missad/felaktig donation). Refund-flödet, och vem som bär den icke-återbetalbara Stripe-avgiften, **spikas i M5** — flaggat som öppen fråga där.

## Fält 5 — Förlängningsregler

**Får insamlaren skjuta insamlingsdeadline?**

- **Ja — max 2 gånger** per insamling.
- **Kort förlängning** (≤14 dagar) utan andra ändringar → **auto-godkänns**. (95 %-självgående-principen.)
- **Lång förlängning** (>14 dagar) eller andra ändringar samtidigt → **granskar-godkännande** krävs.
- **Donatorn ser:** "Insamlingen förlängd till [datum]" tydligt på sidan.
- **Tidigare donatorer notifieras** (M15, opt-in) — "Insamlingen du stöttade har förlängts."
- Genomförandedatum kan också skjutas — men varje skjutning **loggas och syns publikt** i transparens-loopen.

**Kantfall:** Insamlaren vill förlänga en tredje gång → inte tillåtet automatiskt; admin/granskare-bedömning (kan vara legitimt vid katastrof). Förlängning efter att deadline redan passerat → inte tillåtet; insamlingen är då stängd, en ny insamling får skapas.

## Fält 6 — Valuta-struktur

- **SEK i v1. Hårt.** Hela plattformen är Sverige-fokuserad.
- Insamlings-objektet har ett `currency`-fält (default `SEK`) — strukturen finns för fler valutor, men UI låser till SEK i v1.
- Mål, progress bar och alla belopp visas **alltid i SEK**.
- Utländsk donator med utländskt kort → Stripe sköter konverteringen vid charge; insamlingen ser fortfarande SEK.
- Hjälp-plats kan vara utomlands — det påverkar inte valutan, insamlingen sker i SEK.

---

# BLOCK 3 — Livscykel

En insamling är inte statisk. Den rör sig genom **tillstånd**. Block 3 spikar alla tillstånd, alla övergångar, och **vem som triggar varje övergång**. Det här är insamlingens tillståndsmaskin.

## 3.1 Alla tillstånd

| Tillstånd | Betyder | Tar emot pengar? | Publikt synlig? |
|---|---|---|---|
| `utkast` | Insamlaren bygger. Ej inskickad. | Nej | Nej (bara insamlaren) |
| `inskickad` | I granskningskön, väntar på granskare. | Nej | Nej |
| `under_granskning` | Granskare tittar aktivt. | Nej | Nej |
| `ändring_begärd` | Granskaren vill ha ändringar. Bollen hos insamlaren. | Nej | Nej |
| `avvisad` | Granskaren sa nej. | Nej | Nej |
| `aktiv` | Publicerad och live. | **Ja** | Ja |
| `stängd` | Insamlingsdeadline passerad. | Nej | Ja |
| `utbetald` | Pengar utbetalda till insamlaren. | Nej | Ja |
| `väntar_på_resultat` | Genomförandedatum nått, resultatbevis saknas. | Nej | Ja |
| `avslutad_levererad` | Alla tre bevis inne. Badge tilldelad. | Nej | Ja |
| `avslutad_utan_resultat` | Stängd, resultatbevis kom aldrig. Ingen badge. | Nej | Ja |
| `pausad` | Granskare/admin pausade (misstanke under utredning). | Nej | Ja, med banner |
| `nedstängd` | Fejk eller allvarligt brott. Stängd permanent. | Nej | Ja, med banner |

## 3.2 Tillståndsdiagram

```
utkast
  │ (insamlaren skickar in)
  ▼
inskickad ──▶ under_granskning ──┬──▶ avvisad  (slut)
  ▲                              │
  │                              ├──▶ ändring_begärd ──┐
  │                              │                     │
  └──────────(insamlaren svarar)─┘◀────────────────────┘
                                 │
                                 ▼ (granskaren godkänner)
                              aktiv ──────────────────────────┐
                                 │                            │
              (deadline passerar)│            (förlängning)────┘
                                 ▼
                              stängd
                                 │ (utbetalning genomförs, M5)
                                 ▼
                              utbetald
                                 │ (genomförandedatum passerar)
                    ┌────────────┴────────────┐
                    ▼                         ▼
        (resultatbevis inne)        (inget resultatbevis)
                    │                         │
                    ▼                         ▼
         avslutad_levererad          väntar_på_resultat
              (badge ✓)                       │
                                  (bevis kommer sent → avslutad_levererad)
                                  (bevis kommer aldrig → avslutad_utan_resultat)

   pausad / nedstängd  ◀── kan triggas från aktiv, stängd, utbetald,
                           väntar_på_resultat (granskare/admin)
```

## 3.3 Vem triggar varje övergång

| Övergång | Triggas av | Villkor |
|---|---|---|
| utkast → inskickad | **Insamlaren** | Alla obligatoriska fält ifyllda |
| inskickad → under_granskning | **Granskaren** (eller system, auto-tilldelning) | Granskare plockar ärendet |
| under_granskning → ändring_begärd | **Granskaren** | Måste ange tydlig motivering |
| ändring_begärd → inskickad | **Insamlaren** | Insamlaren svarar/redigerar och skickar tillbaka |
| under_granskning → avvisad | **Granskaren** | Måste ange motivering. Vid stora belopp ev. två granskare (M3) |
| under_granskning → aktiv | **Granskaren** | Godkänd. Insamlingsdeadline börjar räknas |
| aktiv → aktiv (förlängd) | **Insamlaren** / system | Enligt Block 2 Fält 5 |
| aktiv → stängd | **System** | Insamlingsdeadline passerad — automatiskt |
| stängd → utbetald | **System + insamlaren** | Utbetalning via Stripe (M5). Insamlaren bekräftar konto |
| utbetald → väntar_på_resultat | **System** | Genomförandedatum passerat, resultatbevis saknas |
| utbetald/väntar → avslutad_levererad | **System** | Alla tre bevis godkända i transparens-loopen (M7) |
| väntar_på_resultat → avslutad_utan_resultat | **System** | Tidsgräns för resultatbevis passerad (riktmärke: 90 dagar efter genomförandedatum) |
| → pausad | **Granskare / admin** | Misstanke, anmälan, utredning pågår |
| pausad → aktiv / nedstängd | **Granskare / admin** | Utredning klar — återställs eller stängs |
| → nedstängd | **Admin** | Fejk bekräftad eller allvarligt brott (M8) |

**Designval — systemet triggar så mycket som möjligt.** Deadline-passering, statusbyten efter utbetalning, badge-tilldelning: allt automatiskt. Människan (granskare/admin) triggar bara det som kräver omdöme. Det är 95 %-självgående-principen i praktiken.

## 3.4 Kantfall i livscykeln

- **Insamlaren skickar aldrig in ett utkast:** utkast som legat orört länge (riktmärke 60 dagar) → påminnelse, sen mjuk arkivering. Ingen panik — "vårt fel men inte dödligt".
- **Insamlaren svarar aldrig på `ändring_begärd`:** efter X dagar (riktmärke 30) → auto-arkiveras. Kan återupplivas.
- **Insamling i `aktiv` men insamlaren försvinner:** ingen åtgärd behövs medan den är aktiv — pengarna hålls hos Stripe. Problemet uppstår först i resultatfasen → hanteras i Block 5.
- **`pausad` mitt under aktiv insamling:** donationer fryses, redan givna medel hålls. Löser sig granskaren — återgång till `aktiv` eller `nedstängd` med refund-process.

---

# BLOCK 4 — Relationer

Vad pekar **in i** och **ut från** insamlings-objektet. Det här är ekrarna från navet. Varje relation säger vilken modul som äger den andra änden.

## 4.1 Relationskarta

```
                    ┌───────────────────────────┐
   M6 Insamlare ───▶│                           │◀─── M3 Granskare
   (ägare, 1)       │                           │     (godkände, 1)
                    │     INSAMLING (M1)        │
   M4 Donationer ──▶│                           │◀─── M1 Kategori-taggar
   (många)          │                           │     (1..flera)
                    │                           │
   M1 Media ───────▶│                           │───▶ M1 Mottagare
   (cover+gallery)  │                           │     (1, kollektiv om många)
                    │                           │
   M7 Uppdateringar │                           │───▶ M5 Stripe-objekt
   & bevis ────────▶│                           │     (connected account, charges)
   (många)          └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
   M10 Collab-org         M13 Kommentarer/dua    M12 Plats-data
   (0..flera)             (många)                (→ kartan)
```

## 4.2 Relationerna i detalj

| Relation | Riktning | Kardinalitet | Äger andra änden | Not |
|---|---|---|---|---|
| Insamlare (ägare) | in | 1 insamling → 1 insamlare | M6 | En insamling har exakt en ägare |
| Godkännande granskare | in | 1 → 1 | M3 | Loggas vem som godkände |
| Donationer | in | 1 → många | M4 | Varje donation pekar på en insamling |
| Kategori-taggar | in | 1 → 1..flera | M1 Block 1 | Multi-val |
| Media | in | 1 → 1..många | M1 Block 1 | cover obligatorisk |
| Uppdateringar & bevis | ut | 1 → många | M7 | start/utbetalning/resultat + fria |
| Mottagare | ut | 1 → 1 | M1 Block 1 | Kollektiv om många |
| Stripe-objekt | ut | 1 → 1 connected account | M5 | charges hänger på insamlingen |
| Collab-organisationer | ut | 1 → 0..flera | M10 | Föreningar som stöttat |
| Kommentarer / dua | ut | 1 → många | M13 | Strukturerad community |
| Plats-data → kartan | ut | 1 → kart-aggregat | M12 | Hjälp-plats + insamlar-plats |
| Mission (återkommande) | in | 0..1 mission → många insamlingar | M1 framtidsspår | Se 4.3 |

## 4.3 Parkerad relation — Mission (återkommande insamlingar)

En **mission** är ett lager *ovanför* insamlingen: en pågående insats ("Mat till föräldralösa i Mogadishu") som öppnar en ny insamlings-*cykel* varje månad. Donatorn ger när hen vill, behöver inte vara med varje cykel.

- Relation: 1 mission → många insamlingar (cyklerna).
- Donatorn ser missionens helhet (alla cykler, totalsumma, mottagare över tid) + aktuell cykel.
- **Inte v1** — annan produkt-arkitektur. Planeras som "återkommande insamlingstyp" i M1 framtidsspår. Fast-track-granskning via diff hör till M3; notiser till tidigare donatorer hör till M15.

Anledningen att den nämns redan här: relationen *insamling ↔ mission* måste finnas i datamodellen från start (ett nullbart `mission_id`-fält) så att vi inte måste migrera senare. Bygg uttaget nu, aktivera funktionen senare.

---

# BLOCK 5 — Regler & kantfall

Vad får ändras efter publicering, av vem — och vad händer när verkligheten går sönder.

## 5.1 Vad får ändras efter publicering (`aktiv`)

| Fält | Får ändras? | Av vem | Krav |
|---|---|---|---|
| Titel | Ja | Insamlaren | Loggas. Ny slug, ID kvar. Stor ändring → granskare notifieras |
| Kort beskrivning | Ja, små ändringar | Insamlaren | Loggas |
| Lång beskrivning | Ja, små ändringar | Insamlaren | Loggas. Ändring som ändrar *ändamålet* → granskare |
| Kategori | Nej direkt | Granskaren | Insamlaren får begära ändring → granskare |
| Mottagare | **Nej** | — | Det är löftet. Ändring kräver granskning, i praktiken ny insamling |
| Media — lägga till | Ja | Insamlaren | Cover-byte loggas |
| Media — ta bort cover | Ja om ersätts | Insamlaren | Får aldrig sakna cover |
| Målbelopp | Höja: ja. Sänka: nej | Insamlaren (höja) | Höjning kräver granskar-godkännande + motivering |
| Målbelopps-modell | **Nej** | — | Ändrar löftet till donatorn |
| Insamlingsdeadline | Ja, förlängning | Insamlaren | Enligt Block 2 Fält 5 |
| Genomförandedatum | Ja | Insamlaren | Loggas, syns publikt |
| Plats | **Nej** | Granskaren | Ändring kräver granskning |

**Princip:** Allt som ändrar **löftet till donatorn** (mottagare, modell, sänkt mål, byte av plats) är låst eller kräver granskning. Allt som bara förbättrar *berättelsen* (titel, text, fler bilder) är fritt — men loggas. **Ändringslogg är publikt synlig** i en diskret "redigeringshistorik" — transparens, ingen kan säga "det stod inte så".

## 5.2 Kantfall — när verkligheten går sönder

**Insamlaren försvinner i resultatfasen.**
System påminner (M15). Passerar genomförandedatum → `väntar_på_resultat`, syns publikt. Passerar 90 dagar → `avslutad_utan_resultat`, ingen badge, profilhistoriken visar det. Plattformen anklagar inte — den visar bara fakta. Donatorn drog sin lärdom; insamlaren bär sitt ansvar inför Allah och inför nästa insamlings trovärdighet.

**Insamlaren avlider.**
Admin-hantering. Finns collab-organisation (M10) kopplad → kontaktas, kan ev. ta över resultatrapporteringen. Annars → `avslutad_utan_resultat` med en respektfull notering, ingen skam. Öppen fråga: vill vi ha ett "anhörig-/ombud"-fält? Parkerat till M6.

**Mottagaren faller bort** (byn drabbas av nytt krig, moskén läggs ner).
Insamlaren rapporterar via en uppdatering. Granskare/admin bedömer: omdirigera till likvärdig mottagare (kräver granskning, donatorer notifieras) eller refund. Hör ihop med M3 + M8.

**Insamlingen visar sig vara fejk efter publicering.**
→ `pausad` direkt, sen utredning. Bekräftad fejk → `nedstängd`, refund-process startas (M5), ev. polisanmälan. Beslutsregler och vem som beslutar: M8.

**Två insamlingar till samma sak.**
Inte förbjudet. Discovery (M11) visar befintliga insamlingar i samma kategori/plats vid skapande, så donationer kan samlas i stället för splittras — men vi tvingar ingen. "Verktyg, inte polis."

**Insamlaren vill avbryta sin egen insamling.**
- Före betydande donationer (riktmärke <1000 kr eller <5 donationer) → får avbrytas, `nedstängd` på egen begäran, eventuella donationer refundas.
- Efter betydande donationer → kräver kontakt med granskare; refund-process eftersom donatorerna gav i förtroende.

**Donation kommer in i sista sekunden / efter deadline.**
Charge som påbörjats före deadline men slutförs strax efter → räknas. Strikt efter → avvisas av Stripe-integrationen (M5).

## 5.3 Genomgripande regelprinciper

1. **Löftet är heligt.** Det donatorn såg när hen gav får inte tyst ändras. Allt som rör löftet låses eller granskas.
2. **Ändringar loggas, alltid.** Publik redigeringshistorik. Transparens slår tillit-på-ord.
3. **Systemet straffar inte — det visar.** `avslutad_utan_resultat` är ingen brännmärkning, det är ett faktum utan badge. Marknaden (donatorerna) drar slutsatsen.
4. **Kantfall löses av människor, inte av regler.** Vi skriver inte en paragraf för varje olycka. Granskare/admin har omdöme. "Vårt fel men inte dödligt."

---

## 5. Designval & motivering (hela Modul 1)

| Beslut | Motivering |
|---|---|
| Insamlaren genomför själv (modell A) är huvudmodellen | Bönematteinsamlingens modell, det piloten lär oss. Allt designas mot detta. |
| Personlig nöd i Sverige (modell C) är ute | Omöjligt att granska sanningshalten i "min mammas cancer". En enda fejk som glider igenom kan slakta trovärdigheten. |
| Fast lista för kategorier | Fritext gör granskning omöjlig — vi vet inte vilka kriterier att applicera. |
| Slumpat ID-suffix i URL | Unik, läsbar, ändringssäker — och exponerar inte plattformens volym. |
| Wizard, inte AI-skrivassistent (v1) | Folk vet *vad* de vill säga, inte i vilken ordning. AI-polering homogeniserar och dödar trovärdighet. |
| Intervall: lägstanivå = "målet nått" | Erkänner leverantörsverklighet utan att svika löftet. Lägsta lovade leverans måste alltid bevisas. |
| Keep-what-you-raise — pengarna flödar framåt vid undermål (Tillägg A1) | "Verktyg, inte polis" — 30k köper ändå mattor. Missat mål ger ingen auto-refund; insamlingen förlängs en gång eller medlen används för en skalad insats. Donatorn vet vid gåvotillfället att gåvan används oavsett utfall. Refund är ett undantag (bedrägeri/fel). |
| Övermål kräver deklarerad plan | Donatorn ska alltid veta vad en krona över målet gör. Utan plan → auto-stäng vid mål. |
| Två datum (insamling + genomförande) | Pengaflödets slut och leveransens slut är olika saker. Donatorn behöver se båda. |
| Stripe håller medlen till deadline | Ger plattformen kontroll vid stängning och håller refund vid bedrägeri/fel tekniskt möjlig fram tills transfer. Förutsättning, bekräftas i M5. |
| `mission_id` finns i datamodellen från start | Återkommande insamlingar är parkerade — men relationen måste finnas så vi slipper migrera. Bygg uttaget nu. |
| Publik ändringslogg | Transparens är billigare och starkare än förtroende-på-ord. |

---

## 6. Kopplingar

**Modul 1 tar in:**
- Ägare och roller från **M6** (vem får skapa, vem äger).
- Granskningsbeslut från **M3** (godkänd/avvisad/ändring).
- Donationer från **M4**.

**Modul 1 lämnar ut:**
- Objektet som **M2** bygger via wizarden och redigerar.
- Objektet som **M3** granskar.
- Mål, modell, datum, undermåls-/förlängningspolicy som **M5** verkställer i Stripe (framåt-flöde; refund bara vid bedrägeri/fel).
- Bevis-krav (per kategori, per modell) som **M7** kräver in.
- Tillståndet som **M11** filtrerar och listar på.
- Plats-data som **M12** ritar på kartan.
- Statusen som styr vad **M13** (community) och **M15** (notiser) gör.

**Hård beroende-flagga:** M1 Block 2 kan inte byggas färdigt förrän M5 bekräftat hur Stripe håller medel. Planeringen är klar; bygget av Block 2 väntar på M5.

---

## 7. Säkerhet & anti-kaos

- **Granska före publicering** — inget insamlings-objekt blir publikt utan att passera M3. Tillståndsmaskinen gör det omöjligt att hoppa över granskning (det finns ingen övergång utkast → aktiv).
- **Löftet låst** — mottagare, modell och plats kan inte tyst ändras efter att donatorer gett.
- **Publik ändringslogg** — varje ändring syns; manipulation blir synlig.
- **Slumpade ID:n** — ingen kan gissa eller skrapa insamlingar sekventiellt.
- **Per-fält integritetskontroll** — insamlarens adress läcker inte; bara det hen valt visas.
- **Anti-diskriminering** — diskriminerande språk i titel/beskrivning fångas i granskning (regel bor i M8).
- **Bildäkthet** — stockbilder och dramatiserade bilder fångas i granskning.

## 8. Automatisering

**Självgående (ingen människa):** deadline-passering, statusbyten efter utbetalning, badge-tilldelning, slug-generering, bildkomprimering, påminnelser, arkivering av döda utkast, övermåls-auto-stäng.

**Kräver människa:** granskningsbeslut (M3), kantfall i 5.2 (mottagare faller bort, fejk, dödsfall), målhöjning, lång förlängning.

Riktmärke: ~95 % av en insamlings livscykel rullar utan att Zivar eller en granskare rör den.

## 9. Öppna frågor

1. **Anhörig-/ombudsfält** på insamlingen (för fallet att insamlaren avlider eller blir långvarigt oförmögen)? → bedöms i M6.
2. **Exakt minsta målbelopp** → M8 (granskningspolicy).
3. **Exakt tröskel för utökad granskning** (riktmärke 500 000 kr) → M3.
4. **Vem bär den icke-återbetalbara Stripe-avgiften vid refund** → M5.
5. **Tidsgräns för resultatbevis** innan `avslutad_utan_resultat` (riktmärke 90 dagar) → bekräftas i M7.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 1:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Full djup. Block 1 (6 fält) konsoliderat från frö-arbetet. Block 2 färdigställt (alla 6 fält, öppna frågor besvarade). Block 3 (livscykel), Block 4 (relationer), Block 5 (regler & kantfall) nyskrivna. |
| 1.1 | 2026-05-24 | Återbetalningsmodell reviderad enligt Tillägg-Nya-beslut-2026-05-23 A1 — framåt-flöde, refund bara vid bedrägeri/fel. Block 2 Fält 4 omarbetat: undermåls-policyn är nu framåt-flöde (förlängning eller skalad insats), per-donation-valet "ge ändå / återbetala mig" utgår, transparens vid gåvotillfället krävs. Designval, kopplingar och OBS-not i Block 2 uppdaterade. |
