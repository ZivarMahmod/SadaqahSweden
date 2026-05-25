# source/legacy-v0.1/

Det här är **alla original-HTML-filerna från v0.1** av designarbetet — innan studion (`../studio.html`) byggdes.

## Varför de finns kvar

- De har copy och innehåll som kan plockas över till produktion
- De visar den exakta visuella utgångspunkten innan v0.2-uppdateringen
- Vissa detaljer i story-flow, microcopy och kantfall är lättare att läsa i ett platt HTML-dokument än i den interaktiva studion

## Hur du använder dem

**Ta INTE** dessa som mall för Next.js-bygget. Det är studion (`../studio.html`) som är den auktoritativa visuella referensen för v0.2.

**Använd** dem för:
- Lyfta copy / text-strängar in i komponenterna
- Förstå story-flödet på fundraiser-sidan (`fundraiser.html` har den långa Diabaly-storyn fullskriven)
- Se hur tabbar och sektioner var organiserade förra varianten
- Jämföra med v0.2 för att förstå varför ändringar gjordes (se `../../05-Audit-fynd.md`)

## Filerna

| Fil | Yta | Status i v0.2 |
|---|---|---|
| `index.html` | Designkatalog (v0.1 entry) | Ersatt av `../studio.html` |
| `marketing.html` | Startsida | Uppdaterad i `MarketingScreen` |
| `discovery.html` | Hitta insamlingar | Uppdaterad i `DiscoveryScreen` |
| `fundraiser.html` | Insamlingssida | Uppdaterad i `FundraiserScreen` |
| `donate.html` | Donator-flöde | Plattad från 3 steg till 1 i `DonateScreen` |
| `profile.html` | Publik profil | Uppdaterad i `ProfileScreen` |
| `account.html` | Mina insamlingar | Förändrad till dashboard i `AccountScreen` |
| `wizard.html` | Skapa insamling | Uppdaterad i `WizardScreen` |
| `update.html` | Transparens-uppdatering | Uppdaterad i `UpdateScreen` |
| `admin.html` | Admin dashboard | Helt omarbetad i `AdminScreen` |
| `review.html` | Granskningskön | Uppdaterad i `ReviewScreen` |
| `team.html` | Team-arbetsyta | Uppdaterad i `TeamScreen` |
| `map.html` | Sverige-karta | Strukturen ändrad i `MapScreen` (riktig karta = Leaflet i prod) |
| `community.html` | Community & events | Uppdaterad i `CommunityScreen` |
| `catalog.html` | Föreningskatalog | Uppdaterad i `CatalogScreen` |
| `auth.html` | BankID-login | Uppdaterad i `AuthScreen` |
| `byggplan.html` | Designgenomgång & byggplan (internt) | Behållen som internt designdok |

Alla v0.2-versioner finns som React-komponenter i `../studio/screens-*.jsx`.
