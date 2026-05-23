# Insamlingsplattform – Modul 1, Block 2: Mål, pengar, tid

**Datum:** 2026-05-23
**Status:** Pågående — Fält 1 till ~70 % klart, Fält 2–6 ej påbörjade
**Bakgrund:** Block 2 av Modul 1. Specificerar hela den ekonomiska och tidsmässiga ramen för en insamling — målbelopp, valuta, deadlines, övermål, undermål, refund, förlängning. Bygger ovanpå Block 1.

---

## 1. Vad detta dokument är

Ett **pågående** planeringsdokument. Alla beslut som Zivar bekräftat dokumenteras under "Avgjort". Allt som diskuterats och föreslagits men inte fått ett tydligt ja markeras som "Föreslaget — väntar på bekräftelse". Allt som inte diskuterats listas som öppet under "Vad som återstår".

Block 1-dokumentet (`Insamlingsplattform-Modul1-Block1.md`) är referens för planeringsmetod, designprinciper och hur Modul 1 hänger ihop.

---

## 2. Block 2 i översikt — 6 fält

| Fält | Innehåll | Status |
|---|---|---|
| 1 | Målbelopps-modell | 🟡 Pågående — stort bekräftat, detaljer väntar |
| 2 | Datum-struktur (deadline + genomförandedatum) | ⏳ Ej påbörjat |
| 3 | Övermål-policy | ⏳ Ej påbörjat |
| 4 | Undermål-policy + refund | ⏳ Ej påbörjat |
| 5 | Förlängningsregler | ⏳ Ej påbörjat |
| 6 | Valuta-struktur | ⏳ Ej påbörjat |

Ordningen är bekräftad av Zivar i sessionen ("yes vi kör på den ordingen").

---

## 3. Övergripande flagga från sessionen

**Pengaflödet under insamlingen styr nästan allt i Block 2.** Hur Stripe Connect är konfigurerat — pengarna går direkt till insamlarens konto vid varje donation, eller hålls hos Stripe tills nåt villkor nås — avgör om "refund vid undermål" ens är tekniskt möjligt.

Detaljerna spikas i **Modul 5 (pengaflöde)**, men vi måste göra pragmatiska antaganden i Block 2 för att inte fastna. Förutsättning från Block 1: Stripe Connect, 0 kr plattformsavgift, pengarna passerar aldrig juridiskt genom plattformen.

---

## 4. Fält 1: Målbelopps-modell

### 4.1 Frågor som måste besvaras

- Vilka modeller ska finnas i v1?
- Vad räknas som "målet nått" per modell?
- Får målet eller modellen ändras efter publicering?
- Min/max-gränser för målbelopp?

### 4.2 Avgjort

**Tre modeller i v1**, bekräftat av Zivar:

- **Fast** — exakt målbelopp ("35 000 kr för 1000 mattor à 35 kr"). Tydligast, mest GoFundMe-likt. Progress bar mot exakt mål.
- **Intervall** — min–max ("30–50 000 kr"). Erkänner att leverantörspris varierar. Passar leverantörsdrivna insamlingar (bönematteinsamlingen är detta).
- **Öppet** — ingen tröskel ("vi samlar så mycket vi kan, fördelar efter mängd"). Passar katastrofer där "räcker det till 50 eller 500 familjer" är okänt från start.

**Bevistryck per modell** (kopplat till Modul 8 transparens-loop):

- Fast → skarpaste tryck (sa 1000 mattor, ser 1000 mattor)
- Intervall → tryck på lägstanivån (se 4.3)
- Öppet → tryck på fördelningslogik, inte volym

Granskaren bedömer vid ansökan vilken modell som passar projektet.

### 4.3 Föreslaget — väntar på Zivars bekräftelse

Nördens läsning, just framlagd i sessionen. Tre frågor till Zivar i 4.5.

**Vad räknas som "målet nått":**

- **Fast:** 100 % av målet inne = nått.
- **Intervall (30–50k):** lägstanivån räknas som nått. När 30k är inne har insamlingen bevisat sin minsta lovade leverans. Allt mellan 30k och 50k är "extra" som möjliggör större volym. Progress bar full vid 30k, sen stretch-markering mot 50k. Övermål-trigger sker vid 50k (mekaniken spikas i Fält 3). Bevistryck: minst 30k:s leverans måste bevisas, eventuell extra-volym dokumenteras separat.
- **Öppet:** "målet nått" är inte relevant — det finns ingen tröskel. När deadline triggar är det som finns vad som finns. Insamlaren har förbundit sig till en fördelningspolicy ("efter mängd").

**Får målet/modellen ändras efter publicering:**

- Höjas: ja om genuint motiverat, men kräver granskar-godkännande. Måste motiveras tydligt så donatorer förstår.
- Sänkas: nej. Pengar redan donerade ska inte plötsligt täcka mindre.
- Modell ändras (fast → intervall etc.): nej. Ändrar löftet till donatorn.

**Min/max-gränser:**

- Minimum: parkeras till Modul 12 (granskningspolicy).
- Maximum: ingen hård gräns, men över tröskelvärde (t.ex. 500k) triggar utökad granskning. Parkeras till Modul 3.

### 4.4 Avfärdade utan parkering

- **Stretch goals (Kickstarter-trösklar)** — kan lösas inom intervall-modellen. UI/bevis-röra utan motsvarande värde.
- **Match-funding (sponsor matchar varje krona)** — kräver tredjepartsåtagande, komplicerar pengaflödet. Inte v1.

### 4.5 Öppna frågor till Zivar

1. Köper du intervall-mekaniken: lägstanivå = "målet nått", extra volym = stretch?
2. Köper du regelverket för ändringar efter publicering (höja ja med granskning, sänka aldrig, byta modell aldrig)?
3. Köper du att min/max-gränser inte spikas här utan parkeras till respektive policymodul?

---

## 5. Sidospår och parkeringar från Block 2-sessionen

Två insikter som inte tillhör Fält 1 direkt men dök upp under diskussionen. Båda parkeras med full specifikation så vi inte tappar dem.

### 5.1 Per-enhet UX vid donation

**Vad det är:** vid själva donations-ögonblicket kan donatorn välja att uttrycka sin gåva som *enheter* ("jag betalar för 20 mattor") eller som *belopp* ("jag betalar 23 kr"). Båda möjliga, samma underliggande charge mot Stripe.

**Teknisk verifiering:** Stripe är *inte* flaskhals. Stripe bryr sig om belopp, inget annat. UI:t visar val, plattformen räknar 20 × 35 = 700 kr lokalt, skickar 70 000 öre till Stripe. Stripe vet inget om mattor och behöver inte heller.

**Status:** Bekräftat av Zivar att detta hör hemma som UI/display, inte ny målbelopps-modell.

**Parkeras till:** **Modul 4 (donator-flöde).** Där spikar vi exakt hur valet visas, vilka insamlingar som har enhets-vy aktiverad, hur det interagerar med målbeloppet i UI:t.

### 5.2 Återkommande insamlingar — utvecklat koncept

**Korrigering från sessionen:** Nördens första analys missade poängen. Modellen handlar inte om återkommande *donationer* (auto-debit månadsvis). Den handlar om återkommande *insamlingar* — insamlaren har en pågående mission och öppnar en ny cykel varje månad. Donatorn ger när han känner för det, behöver inte vara med varje cykel.

**Modellen (reformulerad av Nörden, bekräftad av Zivar):**

> Insamlare X driver en pågående mission ("Mat till föräldralösa i Mogadishu"). Varje månad öppnar han en cykel, samlar in från donatorer som ger när de vill, stänger, åker, levererar, bevisar. Nästa månad: ny cykel, samma mission. Missionen lever så länge insamlaren driver den.

**Sex utvecklingsspår** — föreslagna i sessionen, riktningen accepterad av Zivar ("tror vi side tracka lite"), men varje enskild punkt återbesöks när vi når Modul 1 framtidsspår.

1. **"Mission" som lager ovanför insamlingen.** Donatorn ser missionens helhet (12 cykler, Y kr totalt, Z mottagare över tid), aktuell cykel, och full historik. Skapar tillit genom synlig historik. Namnet "mission" är preliminärt.

2. **Auto-skapande av nästa cykel.** När cykel stänger erbjuder plattformen insamlaren att starta nästa cykel med förfylld titel ("+1 månad"), samma kategori, plats, mottagar-mall. Bara media och uppdatering är nytt.

3. **Fast-track granskning genom diff.** Ny cykel jämförs automatiskt mot förra:
   - Identisk (förutom datum) → ingen granskning, bara verifiera att insamlaren fortfarande är godkänd → publicera direkt
   - Liten ändring (ny media, justerad beskrivning) → granskaren ser bara diffen, godkänner snabbt
   - Stor ändring (annan plats, annan mottagar-typ, annan kategori) → full granskning som vanligt

4. **Notiser till tidigare donatorer.** Opt-in. "Ahmed startade ny cykel — vill du ge igen?" Löser discovery-problemet utan auto-debit. Hör hemma i Modul 9 men måste planeras tillsammans med mission-objektet.

5. **Anti-mönster fångas via diff-systemet.** Om insamlaren öppnar en cykel som drastiskt avviker från missionens tema (t.ex. mat-till-Mogadishu-mission får plötsligt en "ny moské i Eskilstuna"-cykel), diff-systemet kategoriserar det som stor ändring → full granskning. Skydd inbyggt i mekaniken.

6. **Cykel-deadline fast eller flytande.** Reflex: fast som default (alltid t.ex. 27–30 varje månad) skapar ritual för donatorer. Flytande möjligt vid behov.

**Parkeras till:** Modul 1 framtidsspår som "återkommande insamlingstyp". Inte v1, men planerat. Granskningsmekaniken (punkt 3) hör hemma i Modul 3. Notiserna (punkt 4) hör hemma i Modul 9.

---

## 6. Vad som återstår av Block 2

### 6.1 Färdigställa Fält 1

Bekräfta de tre öppna frågorna i 4.5. Sen är Fält 1 klart.

### 6.2 Fält 2: Datum-struktur

Ej påbörjat. Centrala frågor som väntar:

- Ett datum eller två? Separat insamlingsdeadline (när pengaflödet stänger) och genomförandedatum (när det levereras till mottagaren)?
- Hur visas båda för donatorn?
- Vad får sätta datum (insamlaren själv, eller med granskningsgodkännande)?
- Min/max-tidsfönster för en insamling?
- Vad händer om genomförandedatumet passerar utan att insamlaren rapporterat?

### 6.3 Fält 3: Övermål-policy

Ej påbörjat. Centrala frågor:

- Stänger insamlingen vid övermål eller fortsätter ta emot?
- Vid intervall: vad händer mellan lägsta och högsta nivån, och vad händer vid högstanivån?
- Beror policyn på modell-typ (fast vs intervall vs öppet)?
- Hur kommuniceras övermål till donatorer (transparens)?

### 6.4 Fält 4: Undermål-policy + refund

Ej påbörjat. Centrala frågor:

- Får insamlaren ändå genomföra projektet med vad som finns, eller refundas allt?
- **Kritisk fråga:** kan plattformen *tekniskt* refunda om Stripe Connect skickar pengar direkt till insamlarens konto? (kopplar till Modul 5)
- Vem bär refund-Stripe-avgiften?
- Får donatorn välja vid donationstillfället: "ge ändå om undermål" eller "vill ha tillbaka"?

### 6.5 Fält 5: Förlängningsregler

Ej påbörjat. Centrala frågor:

- Får insamlaren skjuta deadline? Hur många gånger? Med vilket godkännande?
- Vad ser donatorn vid förlängning?
- Notifieras tidigare donatorer?

### 6.6 Fält 6: Valuta-struktur

Ej påbörjat. Centrala frågor:

- SEK i v1 är halvspikat. Vad är strukturen för fler valutor senare?
- Hur visas belopp för donator (alltid SEK eller dynamiskt)?
- Stripe Connect hanterar valutakonvertering, men hur reflekteras det i mål och progress bar?

---

## 7. Beslutsloggsammanfattning (Block 2 hittills)

Endast beslut Zivar bekräftat. Förslag som ännu inte fått ja står under 4.3.

| Beslut | Motivering |
|---|---|
| **Ordningen på Block 2-fälten bekräftad** | Målbelopps-modell först, sen datum, övermål, undermål, förlängning, valuta. |
| **Tre målbelopps-modeller i v1: fast, intervall, öppet** | Täcker huvudtyperna utan över-engineering. Alternativen (stretch, match-funding) skapar mer röra än värde. |
| **Per-enhet är inte ny modell, det är display-flag på fast** | Stripe bryr sig om belopp, inte enheter. "Köp 20 mattor" och "köp för 700 kr" är samma underliggande charge. Hör hemma i presentation. |
| **Återkommande insamlingar planeras nu men byggs inte i v1** | Annan produkt-arkitektur. Insamlaren-driven cykel, inte donator-driven subscription. Passar plattformens filosofi ("verktyg, inte polis"). Sex utvecklingsspår dokumenterade i 5.2. |
| **Stretch goals och match-funding avfärdas utan parkering** | Stretch löses inom intervall-modellen. Match-funding kräver tredjepartsåtagande som komplicerar pengaflödet. |

---

## 8. Vad händer härnäst

Bekräfta de tre öppna frågorna i 4.5 så Fält 1 stänger. Sen Fält 2: Datum-struktur (deadline + genomförandedatum).

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 0.1 | 2026-05-23 | Första utkast. Fält 1 till ~70 % klart (tre modeller bekräftade, detaljer för mål-nått, ändringar och min/max väntar på bekräftelse). Per-enhet och återkommande utvecklade och parkerade. Fält 2–6 ej påbörjade. |
