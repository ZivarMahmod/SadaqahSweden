# FORGE-genomgång

**Datum:** 2026-05-23
**Vad detta är:** En extern granskning (kodnamn *FORGE*) gav 16 punkter att se över. Det här dokumentet är domen på varje punkt — vad som var giltigt, vad som redan var täckt, vad som tonades ner — och vart varje ändring landade.

---

## 1. Sammanfattande dom

**FORGE överreagerade inte.** Punkterna är verkliga. Men — viktigt — det är **operativa gap, inte arkitektoniska**. Själva plattformsplanen (de 16 modulerna) stod sig. Inget behövde rivas. Det som saknades var *"vad gör vi när verkligheten slår till"* — bank som stänger, Stripe som drar sladden, en incident, en sjukdom.

Tre saker värda att säga rakt:

- **Tier 1 är på riktigt.** Bank- och Stripe-risken mot muslimska organisationer är dokumenterad och allvarlig. Du vet det själv. Det är inte paranoia.
- **Din linje är rätt.** "Spårbarhet + sträng grindvakt = vår försäkring." Den övertygelsen är nu ryggraden i `Beredskapsplan.md`. Det är inte bara riskhantering — det är plattformens hållning.
- **Ett ställe tonade jag ner FORGE.** Användarvillkoren (punkt 10). FORGE lutade mot "djup". Du sa enkelt, inga kontrakt. Du har rätt — se punkt 10.

**Resultat:** 2 nya dokument, kirurgiska tillägg i 4 moduler, 2 moduler kontrollerade och lämnade orörda. Ingen omplanering. Inget kaos.

---

## 2. Ditt enkla flöde — bekräftat

Du beskrev flödet: plattformen frågar *vem är du och vad vill du samla in för* → plattformen granskar för allas säkerhet → insamlaren följer riktlinjer och sätter upp konto → plattformen publicerar → folk donerar → insamlaren delar QR-kod i sitt lokala nätverk.

**Det flödet är sunt och det är redan så planen ser ut.** Det är exakt så LaunchGood och de andra seriösa plattformarna gör — granska *före* publicering, insamlaren kopplar sitt eget utbetalningskonto, delning sker lokalt. Du uppfann inget konstigt. Enda lilla tillägget: QR-koden var inte explicit nämnd — nu inlagd i M2.

Och **"inga kontrakt som låser folk"** — den hållningen är nu inskriven i M8 (se punkt 10).

---

## 3. Tier 1 — existentiella risker

### Punkt 1 — Bankrisken
**✅ Giltig — kritisk.** Landade i `Beredskapsplan.md` §2. Plan B och C: flera bankkonton parallellt från dag 1, aldrig all ekonomi på ett konto. Banker listas som alternativ att *utvärdera* — inte garantier.

### Punkt 2 — Stripe-risken
**✅ Giltig — kritisk.** Landade på två ställen: `Beredskapsplan.md` §3 (full migrationsväg) och **M5 nytt avsnitt 1.5** (betalprocessor-beroende & reservväg — Adyen, Klarna, Wise som kandidater). Nyckelkravet inskrivet: donationshistoriken ligger i *vår egen* databas så att processorn är utbytbar.

### Punkt 3 — Incidentplan
**✅ Giltig.** Landade i `Beredskapsplan.md` §4. Skriven plan med rolltilldelning — vem talar med media, vem stänger plattformen, vem refunderar, inom hur många timmar. Scenarier: fejk-insamling, hack, mediestorm, klagande storddonator.

### Punkt 4 — Föreningens kontinuitet (bus factor)
**✅ Giltig.** Landade i `Beredskapsplan.md` §5. Nödfallsdokument (kod, lösenord, Stripe, domän, bank), två firmatecknare, larm som går till fler än dig. Detta är näst största risken efter debanking — du är i dag ensam teknisk operatör.

---

## 4. Tier 2 — operativa risker

### Punkt 5 — Skalningsplan för granskningen
**✅ Giltig.** Landade i **M3 nytt avsnitt 1.5**. Explicit tröskel (ihållande kö >15 ärenden/vecka eller SLA-glidning mot 72 h) → utökat granskar-team av förgranskade granskare. Inskolning via kalibrering mot regelboken (M8) + dubbelgranskning. Inte permanent styrelse — ett utökat team.

### Punkt 6 — Teknisk arkitektur för skala
**⏭️ Hänvisad till byggplanen (Phase B).** Detta är inte ett gap i modulplaneringen — det var medvetet. Tech-stacken (databas, hosting, köer, CDN, e-post) spikas i Plan-mappen som nästa steg, *innan* första kodraden. FORGE har rätt att det måste göras — det görs härnäst.

### Punkt 7 — Försäkring
**✅ Giltig — men liten.** Landade i `Beredskapsplan.md` §6 som en konkret att-göra-punkt: ansvars- + cyberförsäkring, kolla If/Trygg-Hansa/Folksam, troligen under 10 000 kr/år. Det är ett ärende, inte ett planeringsarbete.

### Punkt 8 — Press- och kommunikationsplan
**🟡 Giltig men nedtonad.** Landade i `Beredskapsplan.md` §7 — men som en *ensida* (vilka vi är, vad vi gör, hur vi granskar, vad vi inte gör) + en talesperson. Ett fullt "press deck" är överarbete före lansering. Ensidan räcker tills den första journalisten ringer.

---

## 5. Tier 3 — borde-vara-där

### Punkt 9 — Plattformens egen ekonomi vid skala
**✅ Giltig.** Landade i `Beredskapsplan.md` §8 — en räknemodell. Ärlig slutsats: ekonomin går troligen back under ~100–150 insamlingar/månad. Det är väntat och okej — grundarna bär mellanskillnaden tidigt, Plan B är stöd-knappen och ev. 90-konto senare.

### Punkt 10 — Avtal med insamlare (ToS)
**🟡 Giltig men modererad — här tonade jag ner FORGE.** FORGE lutade mot "ToS-djup". Du var tydlig: inga kontrakt som låser folk. **Du har rätt.** Landade i **M8 Block 5**: användarvillkoren är *lätta, klarspråkiga villkor man godkänner med en klick* — inte ett undertecknat avtal. De täcker ändå det nödvändiga (vad insamlaren lovar, vad vi får göra vid regelbrott, ansvarsfriskrivning, tvist) och bör läsas av en föreningskunnig jurist före lansering. Lätt — men korrekt.

### Punkt 11 — Skatte-information till insamlare
**✅ Giltig — rakt på.** Landade i **M2 nytt avsnitt 1.6**. En informationsruta i skapande-wizarden: större belopp kan väcka skattefrågor, kontakta Skatteverket/revisor. Informerar — blockerar inte. Skyddar både insamlaren och plattformen.

### Punkt 12 — Klagomålsprocess
**✅ Giltig.** Landade i **M8 nytt avsnitt 6.7** — en publik, donatorvänd process i 4 steg (anmäl → bekräfta → utred → besked), med tidsriktmärken och möjliga utfall.

---

## 6. "Behöver en till översyn" — de fyra punkterna

### Volymbegränsning som strategi — *hur?*
**✅ Giltig — gjord konkret.** Landade i **M3 nytt avsnitt 1.6 (Volymstrategi som riskverktyg)**. Spakar: manuellt godkännande av alla nya insamlingar i tidig fas, tak på antal samtidigt aktiva insamlingar, ev. månadstak på totalbelopp. Kopplat till bank-/processorrisken — kontrollerad volym = kontrollerad risk. Exakta siffror per fas spikas i rollout-planen (Phase C).

### Anonymitet vs trovärdighet
**✅ Redan korrekt hanterad — ingen ändring.** Kontrollerade M4 och M9. En anonym donation räknas redan fullt i totalsumman och i antalet donationer ("142 andra har gett") — bara namnet döljs. Social proof bevaras. M4 och M9 lämnades orörda.

### Chargebacks
**✅ Giltig — rakt på.** Landade i **M5 nytt avsnitt 4.5**. En chargeback drar beloppet + ~150 kr avgift. Principbeslut inskrivet: före utbetalning = ren (medlen finns kvar hos Stripe); efter utbetalning = insamlarens ansvar, plattformen bär bara i sista hand vid insolvens. En chargeback är också en bedrägerisignal → matar M16:s larm.

### Dataportabilitet / GDPR
**✅ Giltig — stärkt.** M8 Block 5 nämnde GDPR men för tunt. Nu inskrivet att de registrerades rättigheter (få ut sin data, radera, korrigera, dataportabilitet) är *tekniska byggkrav* mot M6 och M16 — inte bara policytext.

---

## 7. Vad jag medvetet INTE gjorde

Transparens om var jag höll igen — för att inte göra kaos:

- **Skapade inte 5 separata operativa dokument.** Bank, Stripe, incident, kontinuitet, försäkring, press, ekonomi rymdes alla i *ett* dokument — `Beredskapsplan.md`. Färre filer, lättare att läsa.
- **Skrev inte ett tungt ToS-avtal.** Se punkt 10. Lätta klick-villkor, inte kontrakt.
- **Byggde inte ett press deck.** En ensida räcker (punkt 8).
- **Rörde inte M4 och M9.** De var redan rätt (punkt: anonymitet).
- **Spikade inte tech-stacken här.** Den hör till byggplanen (punkt 6).

Inget av FORGE:s punkter ändrade arkitekturen. Allt var påbyggnad, inget rivande.

---

## 8. Ändringslogg

| Fil | Ändring |
|---|---|
| `Beredskapsplan.md` | **Nytt dokument** — 9 sektioner: bank, betalprocessor, incident, kontinuitet, försäkring, press, ekonomi, checklista |
| `Modul-02-Insamlar-flodet.md` | v1.1 — avsnitt 1.6 Skatte-information; QR-kod i Block 3.4 |
| `Modul-03-Granskar-flodet.md` | v1.1 — avsnitt 1.5 Granskningsskalning; avsnitt 1.6 Volymstrategi |
| `Modul-05-Pengaflode.md` | v1.1 — avsnitt 1.5 Betalprocessor-reservväg; avsnitt 4.5 Chargebacks |
| `Modul-08-Policies-och-regler.md` | v1.1 — avsnitt 6.7 Klagomålsprocess; Block 5 ToS-förtydligande; Block 5 GDPR stärkt |
| `Modul-04` / `Modul-09` | Kontrollerade — inga ändringar behövdes |
| `00-Masterkarta.md` | Hänvisar nu till `Beredskapsplan.md` och detta dokument; modulstatus uppdaterad |

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första genomgången. 16 FORGE-punkter bedömda, 2 nya dokument, 4 moduler uppdaterade, 2 kontrollerade. |
