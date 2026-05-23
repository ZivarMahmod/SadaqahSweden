# Insamlingsplattform – Todo

**Datum:** 2026-05-23
**Senast uppdaterad:** Efter att Block 1 av Modul 1 (Insamling som objekt) spikades

---

## ✅ KLART

### Bönematteinsamlingen (piloten)
- [x] **Bönematteinsamlingens startmeddelande** – skrivet, klart att posta i Facebook-gruppen
- [x] **Vägval för bönematteinsamlingens pengar** – fjärde Swedbank-konto + eget Swish + manuell logg

### Plattformen – strategi och struktur
- [x] **Plattformsfilosofin spikad** – verktyg inte polis, transparens som mål, badgesystem, samordna befintlig godhet
- [x] **Pengaflödet spikat** – Stripe Connect, 0 kr plattformsavgift, insamlaren betalar Stripe-avgiften
- [x] **Bolagsstrukturen spikad** – hybrid: Corevo äger tekniken, ideell förening driver verksamheten, självkostnadsfakturering ±0
- [x] **Föreningens form spikad** – egen förening, du + 2 bröder, ingen hierarki, tre röster
- [x] **Vägen framåt spikad** – start lean med bönematteinsamlingen som pilot, hybrid när konceptet bevisat sig

### Plattformen – planeringsmetod
- [x] **Planeringsmetoden spikad** – planera i lager, varje lager fullständigt, hela plattformen innan första kodraden
- [x] **Plattformens 12 moduler kartlagda** (grovkarta)
- [x] **Modul 1, Block 1 fullständigt spikat** – alla 6 fält (kategori, titel, beskrivning, mottagare, media, plats)
- [x] **Genomgripande designprinciper formulerade** – (B)-modellen, per-fält integritetskontroll, 95 % självgående, "vårt fel men inte dödligt", verktyg inte polis

---

## 🛠️ PLATTFORMSPLANERING – pågående

Hela plattformen planeras innan vi börjar bygga. Status per modul.

### Modul 1: Insamling som objekt
- [x] **Block 1: Identitet & innehåll** ✅ Dokumenterat i `Insamlingsplattform-Modul1-Block1.md`
- [ ] **Block 2: Mål, pengar, tid** ← nästa
- [ ] **Block 3: Livscykel** (tillstånd, övergångar, vem triggar dem)
- [ ] **Block 4: Relationer** (vad pekar in/ut från insamlingen)
- [ ] **Block 5: Regler & kantfall** (vad får ändras efter publicering, av vem)

### Övriga moduler – inte påbörjade
- [ ] Modul 2: Insamlar-flödet
- [ ] Modul 3: Granskar-flödet
- [ ] Modul 4: Donator-flödet
- [ ] Modul 5: Pengaflöde (Stripe Connect-detaljer)
- [ ] Modul 6: Identitet & auth (BankID, profiler, behörigheter)
- [ ] Modul 7: Organisationer & collab
- [ ] Modul 8: Transparens-loopen (uppdateringar, bevis, badges)
- [ ] Modul 9: Notiser & kommunikation
- [ ] Modul 10: Listning, sökning, kategorisering
- [ ] Modul 11: Admin & dashboard
- [ ] Modul 12: Policies & regler (granskningspolicy, ToS, integritet)

---

## 🔥 KVAR ATT GÖRA – nära (denna vecka eller direkt)

### Bönematteinsamlingen
- [ ] **Öppna fjärde Swedbank-kontot** – döp det tydligt, t.ex. "Bönemattor insamling"
- [ ] **Koppla nytt Swish-nummer** till det fjärde kontot
- [ ] **Sätt upp logg-mall i Google Sheets** – datum, namn, summa, meddelande
- [ ] **Posta startmeddelandet i Facebook-gruppen**

### Corevo
- [ ] **Börja dokumentera Corevo-timmar bakåt och framåt** – enkel Sheets, datum + timmar + vad du gjorde

---

## 🟡 KVAR ATT GÖRA – medellång (1–3 månader)

### Föreningen
- [ ] **Prata med dina två bröder** om föreningstanken – gå igenom sammanfattningsdokumentet med dem
- [ ] **Skriv bröderskapspakten** – en kväll, en sida, ni tre tillsammans:
  - Föreningens syfte (en mening)
  - Beslutsregler (enighet vs majoritet)
  - Vad händer om någon vill gå ur
  - Vad händer om föreningen läggs ner
  - Hur ni hanterar oenighet
- [ ] **Bestäm föreningens namn**
- [ ] **Registrera ideell förening hos Skatteverket** – gratis, ca 2 veckor handläggning
- [ ] **Öppna föreningskonto** – när org.nr finns

---

## 🟢 KVAR ATT GÖRA – när planeringen är klar

### Granskning och policies (Modul 12)
- [ ] **Granskningspolicy för insamlingar** – ni tre går igenom 20–30 hypotetiska ansökningar och bestämmer ja/nej + motivering. Plattformens svåraste fråga, inte tekniken.
- [ ] **Beslut om granskningstid (SLA)** – hur snabbt ska en ansökan granskas? Riktmärke från diskussion: 72 timmar
- [ ] **Beslut om hantering av fejk-insamlingar efter publicering** – stänga, återbetala, polisanmäla? Bestäm i förväg.

### Byggande
- [ ] **MVP-bygge** – endast kärnfunktioner, ingenting extra
- [ ] **Stripe Connect-integration**
- [ ] **BankID-inloggning för insamlare** (KYC)
- [ ] **Nyttjandeavtal Corevo ↔ Föreningen** – en sida som dokumenterar att Corevo upplåter plattformen mot självkostnad. Skrivs när det blir relevant.

---

## 📚 NÄSTA SESSION

- **Modul 1, Block 2: Mål, pengar, tid** ← direkt nästa
  - Målbelopp (fast/intervall/öppet?)
  - Valuta (SEK i v1)
  - Insamlingsdeadline vs genomförandedatum
  - Över-/undermåls-hantering
  - Refund-policy
  - Förlängningsregler

---

## 🚨 ATT MINNAS

### Övergripande
- **Bönematteinsamlingen kommer FÖRST.** Plattformen är ett separat projekt. Blanda inte ihop dem.
- **Inga kontrakt skrivs nu.** När föreningen finns och plattformen används – då skrivs en sidas nyttjandeavtal mellan Corevo och föreningen.
- **Bröderskapspakten är inte ett affärsavtal.** Det är en muslimsk överenskommelse i skriftlig form. Skrivs **medan ni fortfarande tycker likadant om allt**.
- **Plattformen ska INTE marknadsföras via Corevo.** Detta sker i bakgrunden, inte ansiktet utåt.
- **Marknadsundersökning skippas** – plattformen byggs även om bara en person använder den. Mission över market fit.

### Planeringsprincipen
- **Vi planerar HELA plattformen som "v1"** – implementeringsordning är en separat plan vi gör senare
- **Allt som dyker upp under en diskussion = planerat innehåll** – tillhör sin modul, även om vi inte kommit dit än
- **Hela kartan klar innan vi skriver första kodraden** – inga halvgjorda byggen, ingen "implementera och se hur det blir"-mentalitet

### Designprinciper för alla moduler
- **(B)-modellen** – strukturen visas publikt, granskaren säkerställer kvalitet vid publicering
- **Per-fält integritetskontroll** – insamlaren kan välja vad som visas publikt även när data är lagrad
- **95 % självgående** – för varje funktion: kan detta automatiseras eller hanteras med smart UX?
- **"Vårt fel men inte dödligt"** – vi gör vårt bästa, accepterar att 100 % är omöjligt
- **Verktyg inte polis** – plattformen tillhandahåller infrastruktur, insamlaren äger sitt eget ansvar

### Det viktigaste
- **Allah vet, och du gör ditt bästa.**

---

## 📁 RELATERADE DOKUMENT

- `Insamlingsplattform-sammanfattning.md` – strategisk bakgrund, bolagsstruktur, filosofi (skrevs först)
- `Insamlingsplattform-Modul1-Block1.md` – fullständig spec av Block 1 av Modul 1
- *(framtida block och moduler dokumenteras i egna filer)*
