# Modul 18 — Plattformsstyrning & federation

**Lager:** 🔵 Världen runtom *(internt-vänd — som M16 och M17)*
**Datum:** 2026-05-24
**Status:** Full djup — alla 7 block spikade
**Bygger på:** `00-Masterkarta.md`, `Tillägg-Nya-beslut-2026-05-23.md` (sektion B1), `Modul-03-Granskar-flodet.md`, `Modul-06-Identitet-och-auth.md`, `Modul-08-Policies.md`, `Modul-10-Organisationer.md`, `Modul-12-Karta-och-geografisk-insikt.md`, `Modul-16-Admin-och-dashboard.md`, `Modul-17-Team-och-intern-arbetsyta.md`, `Supabase/SAKERHETSREGLER.md`

---

## 1. Vad modulen är

Modul 18 är **hur plattformen styrs när den blir större än en familj**. Idag granskar och stöttar tre bröder hela Sverige (M3, M16, M17). M18 är planen för dagen det inte räcker — då **granskning och support delas ut till betrodda regionala moskéer**, samtidigt som en enda person, Zivar, fortfarande ser hela kedjan och har sista ordet.

Modulen inför en **tre-nivå-styrning**:

- **Superadmin** — Zivar. Högst i kedjan, ser allt, äger plattformen. Subdomän `superadmin.sadaqahsweden.se`.
- **Region-admin** — en betrodd moské eller person per region som driver sin regions granskning och support. Region-admins är **oberoende av varandra** — ingen ser någon annans data. Subdomän `admin.sadaqahsweden.se`.
- **Region-medhjälpare** — några få BankID-verifierade medhjälpare per region-admin som hjälper till med granskning och frågor.

Modulen löser tre saker på en gång:

- **Skalning.** Granskning är plattformens första flaskhals (M3 avsnitt 7, M16 Block 5.5). M18 är hur den flaskhalsen vidgas — fler kalibrerade ögon, regionalt fördelade, utan att kvaliteten faller.
- **Distribuerad support.** Onboarding-pre-checken (Tillägg A2) behöver en mänsklig fråga-väg. M18 gör region-admins till de som svarar regionens frågor — närhet till samhället är en styrka, inte en kostnad.
- **Styrning utan att tappa kontrollen.** Delegerad makt kan missbrukas. M18 spikar skydden — så att en region-admin aldrig blir en okontrollerad furste över sin region.

> M18 bygger inte om plattformen. Den tar M3:s granskningsflöde, M16:s admin-verktyg och M17:s arbetsyta — och lägger till **en region-dimension** och **en admin-nivå-dimension** ovanpå dem. Allt M3, M16 och M17 säger gäller fortfarande; M18 distribuerar det.

---

## 2. Varför den behövs

Utan M18 har plattformen ett inbyggt tak. M3 säger det rakt: *"granskarkapacitet är plattformens första flaskhals"* och *"om plattformen växer snabbt är granskarkapacitet den första saken som spricker"*. M16 säger samma: granskningen *kan inte* göras 95 % självgående — den skalar linjärt med volymen, och svaret är *fler människor*.

Men "fler människor" har två möjliga former, och valet är avgörande:

1. **Centralt — fler granskare i samma team.** M3 Block 1.5 beskriver redan detta: ett utökat granskar-team av förgranskade bröder/vänner. Det fungerar — till en gräns. Det skalar inte till hela Sverige, för det förutsätter att Zivar personligen känner och kalibrerar varje granskare.
2. **Federerat — granskning och support flyttar ut till regionala moskéer.** Det är M18. Det skalar för att det inte är beroende av att en person känner alla. Det är också **rätt för plattformens mening**: det muslimska samhället i Sverige *är* lokalt organiserat kring moskéer. Att låta en betrodd moské i Skåne granska Skånes insamlingar är inte bara effektivt — det är närhet, lokalkännedom och förankring.

Tre konkreta problem M18 löser:

1. **Tre bröder är en enda felpunkt.** Blir de sjuka, bortresta, eller överbelastade samtidigt stannar granskningen för *hela landet*. En federerad modell isolerar belastningen per region.
2. **Lokalkännedom går förlorad i en central modell.** En granskare i Stockholm bedömer en insamling till en liten ort i Norrbotten utan att känna sammanhanget. En region-admin i Norrbotten gör det med lokal kunskap.
3. **Support är osynlig i dagens plan.** Tillägg A2 kräver en fråga-väg *innan* någon binder upp sig i onboarding-kedjan. Den vägen behöver en mottagare. M18 gör region-admins till den mottagaren för sin region.

M18 byggs **sist** — i Bygg-grupp C, efter Steg 16 — men datamodellen måste känna till den från början (Block 7). Det är samma logik som M3:s `mission_id` och M12:s land-nycklade aggregat: bygg uttaget tidigt, aktivera funktionen sent.

---

## 3. Blocköversikt — 7 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Tre-nivå-styrningen — superadmin, region-admin, region-medhjälpare | ✅ Spikad |
| 2 | Regioner — Sveriges 21 län som styrningsdimension | ✅ Spikad |
| 3 | Distribuerad granskning — hur en regions kö blir regionens | ✅ Spikad |
| 4 | Att utse och avsätta en region-admin — förtroende, BankID, livscykel | ✅ Spikad |
| 5 | Risker & skydd — missbruk av delegerad makt och hur det fångas | ✅ Spikad |
| 6 | Distribuerad support — region-admins som regionens fråga-väg | ✅ Spikad |
| 7 | Arkitektur & RLS — region-dimension och admin-nivåer i datamodellen | ✅ Spikad |

Block 1–2 är *strukturen* (vem, var). Block 3–4 är *driften* (hur granskningen distribueras, hur en region-admin tillsätts). Block 5 är *skyddet* (vad som kan gå fel och hur det fångas). Block 6 är *den andra halvan av jobbet* (support, inte bara granskning). Block 7 är *grunden* — RLS-tillägget som gör allt det andra möjligt utan att bryta säkerhetsmodellen.

---

# BLOCK 1 — Tre-nivå-styrningen

Plattformens nuvarande styrning är platt: tre bröder, två roller (admin, granskare — M17 Block 2). M18 lägger till en **vertikal dimension** ovanpå den: tre styrningsnivåer, med superadmin överst.

## 1.1 De tre nivåerna

| Nivå | Vem | Räckvidd | Subdomän |
|---|---|---|---|
| **Superadmin** | Zivar | Hela Sverige — ser allt, alla regioner, hela kedjan | `superadmin.sadaqahsweden.se` |
| **Region-admin** | En betrodd moské/person per region | En region — granskning + support för den regionen | `admin.sadaqahsweden.se` |
| **Region-medhjälpare** | Några få per region-admin | Samma region som sin region-admin | `admin.sadaqahsweden.se` |

**Superadmin** är toppen och den enda nivån som ser plattformen som helhet. Zivar behåller alla M16- och M17-befogenheter — drift, statistik, manuella ingrepp, teamhantering — *plus* de nya superadmin-befogenheterna: utse och avsätta region-admins (Block 4), läsa varje regions data, ta emot överklaganden och rapporter (Block 5). Superadmin är **inte** en region-admin för någon region; superadmin står ovanför alla regioner.

**Region-admin** driver sin regions granskningskö (Block 3) och sin regions support (Block 6). En region-admin har, *inom sin region*, samma slags verktyg som M16/M17 ger en admin — men **scopade till regionen**. En region-admin ser aldrig en annan regions insamlingar, kö, support-ärenden eller data. Riktmärke: **en region-admin-organisation per region** (Block 2.3).

**Region-medhjälpare** är region-adminens utökade armar. Varje region-admin får ha *några få* medhjälpare — begränsat antal, inte 15 (jfr M17:s ton om ett litet, känt team). En medhjälpare granskar och svarar på frågor inom regionen, men har **inte** region-adminens fulla befogenheter: en medhjälpare kan inte utse andra medhjälpare och har inte de mest känsliga verktygen (Block 1.3).

## 1.2 Hur detta förhåller sig till M16/M17:s befintliga roller

M17 Block 2 definierade två roller: **Admin** och **Granskare**. M6 äger rollsystemet tekniskt. M18 **uppfinner inga roller från grunden** — den utvidgar M6:s rollmodell med en *nivå* och ett *scope*, precis som datamodell-flaggan i Tillägg B1 förutser (*"Admin-roll behöver en nivå/scope ... reservera utrymme för `superadmin` vs region-`admin` + region-id"*).

Mappningen, så att inget motsäger M17:

| M18-nivå | Bygger på M17-roll | Skillnad |
|---|---|---|
| Superadmin | M17 "Admin" | Samma befogenheter + nivå `superadmin`, scope = hela Sverige. Det är dagens admin-roll, uppgraderad. |
| Region-admin | M17 "Admin" | M17:s admin-befogenheter men nivå `region-admin`, scope = en region. Ser bara sin region. |
| Region-medhjälpare | M17 "Granskare" | M17:s granskar-befogenheter, scope = en region. Den region-scopade granskaren. |

Det betyder: **dagens tre bröder fortsätter precis som idag.** Innan M18 byggs är de admins/granskare utan region-scope (eller med scope = hela Sverige). M18 lägger bara till möjligheten att skapa konton med ett *region-begränsat* scope. M17:s "tredje, lättare roll (Support)" — som M17 parkerade — kan M18:s region-medhjälpare i praktiken uppfylla, men M18 håller sig till M17:s namn och struktur och bygger ingen separat support-roll.

## 1.3 Vem får göra vad — befogenhetsstegen

| Befogenhet | Superadmin | Region-admin | Region-medhjälpare |
|---|---|---|---|
| Se hela Sverige (alla regioner) | ✅ | ❌ endast egen region | ❌ endast egen region |
| Granska insamlingar | ✅ alla | ✅ egen region | ✅ egen region |
| Fatta granskningsbeslut (godkänn/ändra/avvisa) | ✅ | ✅ egen region | ✅ egen region |
| Besvara support-frågor | ✅ | ✅ egen region | ✅ egen region |
| Utse/avsätta region-admin | ✅ **endast** | ❌ | ❌ |
| Lägga till/ta bort region-medhjälpare | ✅ | ✅ egen region | ❌ |
| Manuella pengaingrepp (refund, nedstängning) | ✅ **endast** | ❌ *(se 3.4)* | ❌ |
| Pausa en insamling | ✅ | ✅ egen region | ✅ egen region |
| Ta emot överklagande | ✅ **endast** | ❌ | ❌ |
| Se plattformens samlade statistik (M16 Block 2) | ✅ | ✅ egen regions delmängd | ❌ |
| Drift-larm för hela plattformen (M16 Block 3) | ✅ | ❌ egen regions delmängd | ❌ |

**Regeln bakom tabellen:** den följer exakt M16 Block 4.2:s logik — *snabba, reversibla* åtgärder (pausa, begära ändring, besvara frågor) får den lägre nivån göra; *permanenta eller pengarörliga* åtgärder (nedstängning, refund) är reserverade för superadmin. M18 *flyttar inte ner* pengamakt till region-nivå. En region-admin granskar och stöttar; men ingen rör en annans pengar utan att superadmin är inblandad. Det är medvetet — det håller den farligaste makten i en hand även när granskningen distribueras.

## 1.4 Kantfall

- **En person som är region-admin i en region men driver en egen insamling i en annan** → två skilda konton, två skilda roller (samma princip som M17 Block 1:s "team-konto skilt från privat användarkonto"). Region-admin-rollen blandas aldrig in i ett privat insamlarkonto.
- **Superadmin är otillgänglig länge** → överklaganden och region-admin-tillsättningar köar (de kräver superadmin per design). Detta är acceptabelt för dessa ovanliga handlingar, men M16:s bus-factor-regel gäller: riktmärke minst två personer med superadmin-nivå (jfr M16/M17 "minst två admins"). Block 4.5 utvecklar.
- **En region-medhjälpare befordras till region-admin** → superadmin höjer nivån; medhjälparens tidigare granskningar ligger kvar i loggen (Block 5.2). Ingen historik tappas.
- **Region-admin vill ge en medhjälpare mer makt än medhjälpar-nivån tillåter** → går inte. Befogenhetssteget är fast; vill man ha en till region-admin är det superadmins beslut (Block 4). Region-admin kan inte dela ut sin egen nivå.

---

# BLOCK 2 — Regioner som styrningsdimension

M18 inför en **region-dimension**. Block 2 spikar exakt vad en region *är* — och håller den konsekvent med M12, så att kartan och styrningen talar samma språk.

## 2.1 Region = ett av Sveriges 21 län

**En region är ett av Sveriges 21 län.** Inget annat. Detta är samma indelning som M12 Block 1.1 redan använder för kartan (*"Sverige, indelad i landets 21 regioner (län)"*) och samma som M12 Block 9.3 hämtar GeoJSON för.

Att återanvända M12:s indelning är ett medvetet beslut, inte en bekvämlighet:

- **Konsekvens.** Kartan visar aktivitet per län; styrningen granskar per län. När Zivar tittar på M12-kartan och M18-styrningen ser han *samma* Sverige. En insamling i Skåne syns i Skånes karta-aggregat *och* går till Skånes region-admins kö.
- **Datamodellen finns redan.** M12 Block 9.4 har en `plats_taxonomi` (län/kommun, stad→region-uppslag) och Tillägg B1 noterar att `insamlar_region` redan finns på `insamling`. M18 ärver detta — den uppfinner ingen ny geografi.
- **21 är rätt grovhet.** Inte 290 kommuner (för många region-admins, omöjligt att bemanna) och inte 3 landsdelar (för grovt, tappar lokalkännedomen). Län är den nivå svenskt civilsamhälle redan är organiserat på — regioner, länsstyrelser, och i praktiken moské-nätverk.

## 2.2 Varför län och inte kommun — och inte något eget

M12 Block 5.2 fastställde redan att **regionnivå (län) är grov nog att aldrig peka ut en individ**, medan kommunnivå inte är det. M18 ärver den slutsatsen: region-admin-strukturen vilar på län eftersom län är den nivå där en granskningskö blir meningsfullt stor *och* en region-admin-roll går att bemanna med en enda moské.

Att uppfinna en egen indelning ("Sydsverige", "Storstockholm") avfärdas — det skulle bryta mot M12, kräva en egen taxonomi, och tvinga fram en gränsdragningsdiskussion plattformen inte behöver.

## 2.3 En region-admin per region — riktmärke, inte lag

Tillägg B1 säger: *"Antal region-admins är begränsat — riktmärke en per region."* M18 spikar detta som ett **riktmärke**:

- **Normalfallet:** en region-admin-organisation (en moské/person) per län. 21 län → upp till 21 region-admins.
- **Riktmärke, inte tvång.** Det är fullt acceptabelt att bara 5 av 21 län har en region-admin tidigt — då granskar superadmin de övriga 16 (Block 3.5). Federationen växer län för län, i takt med att betrodda moskéer kliver fram.
- **Inte fler än en per region.** Två oberoende region-admins i samma län skulle skapa oklarhet om vem som äger regionens kö och support. Behöver en region mer kapacitet är svaret *region-medhjälpare* (Block 1), inte en andra region-admin.
- **Begränsningen är medveten.** En kontrollerad, känd uppsättning region-admins är hela poängen — det speglar M3:s volymstrategi (1.6: kontrollerad volym = kontrollerad risk) och M17:s "mängden är liten och känd". Federation är inte öppen registrering.

## 2.4 Kantfall

- **Län utan region-admin** → superadmin är default-granskare och default-support för det länet (Block 3.5, Block 6.4). En region utan region-admin är aldrig en region utan tillsyn — den faller bara tillbaka till toppen.
- **Insamling utan angiven region** (M1: region är frivilligt, bara stad obligatoriskt — M12 Block 1.4) → samma fallback som M12: stad→region-uppslag via `plats_taxonomi`. Slår uppslaget inte → ärendet går till **superadmins kö** (det kan inte tilldelas en region-admin utan en region). Detta är ett naturligt "Sverige, ospecificerat"-fall, parallellt med M12.
- **Länsindelningen ändras** (sällsynt — Sverige har slagit ihop län historiskt) → en taxonomi-uppdatering i `plats_taxonomi`, hanteras som en datamigrering. M18 binder sig till "Sveriges län" som koncept, inte till en fryst lista — samma hållning som M12 Block 8.4.
- **En insamling i en region, en mottagare i en annan region eller utomlands** → granskningen scopas på **insamlar-regionen** (var insamlaren är), inte hjälp-platsen. Det är insamlaren region-admin känner och stöttar. Hjälp-platsen är M12:s sak, inte M18:s.

---

# BLOCK 3 — Distribuerad granskning

Detta är M18:s kärna i drift: **en regions insamlingar granskas av den regionens admin och medhjälpare.** Block 3 spikar hur M3:s granskningsflöde blir region-scopat — utan att något i M3 motsägs.

## 3.1 Principen — M3:s flöde, scopat per region

M3 beskriver en **gemensam kö för alla tre granskare** (M3 Block 1.1). M18 ändrar inte *flödet* i M3 — kön, auto-tilldelning, prioritering, SLA, checklistan, de tre besluten, eskaleringen, loggen — allt det gäller fullt ut. M18 ändrar bara **vilka som ser vilken kö**:

> Före M18: en nationell kö, alla tre bröder ser allt.
> Efter M18: **en kö per region.** En regions kö ses av den regionens region-admin + medhjälpare. Superadmin ser alla regioners köer.

En insamling som skickas in (M2 → `inskickad`) hamnar i **sin insamlar-regions kö**. Skåne-insamlingar i Skånes kö, Norrbotten-insamlingar i Norrbottens kö. M3:s auto-tilldelning (round-robin + tillgänglighet, M3 Block 1.2) körs **inom regionen** — bland den regionens region-admin och medhjälpare.

## 3.2 Vad som är oförändrat från M3

M18 är ett distributionslager, inte en omskrivning. Allt detta från M3 gäller exakt:

- **Checklistan** (M3 Block 2.2) — region-admins granskar mot samma 12-punkts-checklista.
- **De tre besluten** (M3 Block 3.1) — godkänn / begär ändring / avvisa, samma tillståndsövergångar.
- **Motiveringskravet** (M3 Block 3.2) — inget negativt beslut utan motivering i klartext.
- **Append-only-loggen** (M3 Block 3.4) — varje beslut spårbart till en person med ett skäl. M18 *förstärker* loggens betydelse (Block 5.2) men ändrar den inte.
- **Jäv-regeln** (M3 avsnitt 7) — en granskare granskar aldrig sitt eget eller en närståendes ärende. M18 gör jäv *mer* sannolikt (en region-admin är ofta lokalt sammanflätad med regionens insamlare) och skärper därför hanteringen — se Block 5.3.
- **SLA, prioritering, fast-track** (M3 Block 1.3–1.4, Block 5) — gäller per region.

## 3.3 Vad som är nytt i M18

- **Köns scope.** Kön filtreras på region. En region-admin ser bara sin regions kö.
- **Granskning är en objektiv tillämpning av M8.** Detta var alltid sant (M3 Block 2.2 punkt 4–5 pekar på M8), men Tillägg B1 kräver att det skrivs *uttryckligt* för region-admins: **M8-regelboken är den objektiva måttstocken. En region-admin granskar mot M8, aldrig mot personlig smak.** Block 5.1 utvecklar detta som ett skydd.
- **Andra-granskning för stora/känsliga insamlingar.** M3 Block 4 har redan flergranskar-beslut vid stora belopp. M18 utvidgar: en stor eller känslig insamling i en region får en **andra-granskning** — av superadmin eller av en granskare utanför regionen — så att inte en enskild region-admin ensam släpper fram det mest riskfyllda. Block 5.4 spikar detta.
- **Kalibrering vid tillsättning.** M3 Block 1.5 har redan en kalibreringsprocess för nya granskare (gå igenom M8 + avgjorda ärenden, jämför bedömningar). M18 gör den **obligatorisk för varje ny region-admin och medhjälpare** — Block 4.3.

## 3.4 Region-admins befogenheter i granskningen — och gränsen

En region-admin kan, inom sin region:

- Granska och fatta alla tre besluten (godkänn / begär ändring / avvisa).
- Pausa en insamling i sin region (M16 Block 4 — snabb, reversibel åtgärd).
- Begära andra-granskning (Block 5.4).

En region-admin kan **inte**:

- **Stänga ner en insamling permanent.** Det är `nedstängd` — M16 Block 4.2 reserverar det för admin på den högsta nivån. I M18 betyder det **superadmin**. En region-admin som ser en bekräftad fejk *pausar* den (reversibelt, snabbt) och **eskalerar till superadmin** för nedstängning + refund.
- **Initiera refund.** Pengarörligt → superadmin (M16 Block 4.2, Block 1.3 ovan).
- **Granska över regiongränsen.** En region-admin kan aldrig plocka ett ärende ur en annan regions kö.

Detta är medvetet asymmetriskt, precis som M3 Block 4.2 (lätt att vara försiktig, svårt att vara vårdslös): en region-admin kan *stoppa* allt i sin region snabbt, men de *oåterkalleliga* och *pengarörliga* stegen kräver alltid att superadmin kopplas in. Delegerad granskning, central pengakontroll.

## 3.5 Region utan region-admin

Tillägg B1 och Block 2.4 fastställde: en region utan en utsedd region-admin granskas av **superadmin**. Konkret:

- En insamling i ett län utan region-admin hamnar i en kö som superadmin äger — i praktiken den nationella resterande kön.
- Detta är det **naturliga utgångsläget**: vid M18:s lansering har inga län en region-admin, så superadmin (med dagens bröder) granskar allt — exakt som idag. Federationen tänds region för region. Varje gång en region får en region-admin lyfts den regionens kö ut ur superadmins kö och blir regionens.
- Det finns alltså aldrig ett glapp: en region är antingen tilldelad en region-admin eller tillhör superadmins kö. En insamling kan inte hamna i ingen kö.

## 3.6 Rapportering uppåt

Tillägg B1 kräver: *"Rapportering går hela vägen upp till superadmin."* M18 spikar:

- **Superadmin ser varje regions granskningskö, SLA-status och kölängd** — det är M16 Block 1 Panel B (granskningskö), men nu *per region* och aggregerat till en nationell vy. Superadmin ser om Skånes kö svämmar över medan Norrbottens är tom.
- **Superadmin ser varje regions granskningsbeslut** — godkända, avvisade, ändringsbegärda, med region-admin/medhjälpare som fattade dem. Det är M3:s logg, läst uppifrån.
- **Regionala nyckeltal rullar upp.** M16 Block 2:s statistik (granskningsutfall, leveransgrad, andel godkända/avvisade) blir filtrerbar per region. En region-admin med onormalt hög avvisningsgrad blir synlig för superadmin — input till stickprov (Block 5.5).
- Region-admins ser **bara sin egen regions** rapportering. Rapportering flödar *uppåt* (region → superadmin), aldrig *i sidled* (region → region).

## 3.7 Kantfall

- **En insamling byter region efter inskick** (insamlaren rättar sin plats) → ärendet flyttas till den nya regionens kö. Sällsynt; hanteras som en omtilldelning, loggas.
- **En regions hela team (region-admin + alla medhjälpare) är otillgängligt** → M3 Block 1.2:s kantfall gäller, men M18 lägger till: superadmin kan **överta** en regions kö temporärt. SLA-klockan tickar (M3 Block 1.4) och superadmin får ett M16-larm när en regions kö växer obevakad.
- **En region-admin släpar konstant efter SLA** → M16 Block 3:s larm gäller per region; superadmin ser det och kan agera (fler medhjälpare, eller i värsta fall avsätta — Block 4.4).
- **Ett eskaleringsärende (stort belopp, M3 Block 4) i en region** → kräver flergranskar-beslut *plus* M18:s andra-granskning (Block 5.4). Två lager skydd staplas; det är meningen.

---

# BLOCK 4 — Att utse och avsätta en region-admin

En region-admin har verklig makt över en regions insamlare. Block 4 spikar hur den makten ges, med vilken försiktighet, och hur den tas tillbaka — rent.

## 4.1 Hur en region-admin utses — manuellt, av superadmin, på förtroende

Tillägg B1 är tydlig: en region-admin utses **manuellt av superadmin, baserat på förtroende**. M18 spikar detta:

- **Ingen självregistrering.** En region-admin blir aldrig region-admin genom att ansöka via ett formulär. Detta speglar M17 Block 1 exakt (*"Inga självregistreringar ... en teammedlem läggs till medvetet av en admin"*) — en region-admin *är* en sorts teammedlem, på regional nivå.
- **Utgångspunkten är förtroende.** Typfallet: en moské eller en betrodd person i en region vill hjälpa till. Superadmin känner dem, eller de kommer rekommenderade genom det muslimska samhällets nätverk. Superadmin fattar beslutet att ge dem ett region-admin-konto.
- **Det är ett medvetet, personligt beslut.** Att utse en region-admin är inte en administrativ rutin — det är att delegera granskningsmakt över en hel region. Superadmin tar det beslutet på samma allvar som M3 Block 1.5:s "förgranskade granskare": kandidaten ska vara känd och betrodd *innan* kontot skapas.
- **Bröderskapspakten-andan.** M3 avsnitt 7 och M3 Block 1.5 kopplar granskar-urval till Bröderskapspakten. M18 gör samma: urvalet av region-admins är en föreningsfråga byggd på förtroende och delade värderingar, inte en teknisk process. Plattformen *registrerar* beslutet; människorna *fattar* det.

## 4.2 BankID-kravet — icke-förhandlingsbart

Tillägg B1: *"Alla i kedjan (region-admin + medhjälpare) måste vara BankID-verifierade."* M18 spikar:

- **Varje region-admin och varje region-medhjälpare måste vara BankID-verifierad** innan kontot aktiveras. Inget undantag.
- Detta är striktare än M17:s team-inloggning, som tillåter "BankID *eller* e-post + obligatorisk 2FA" (M17 Block 1). För M18:s federation är **BankID obligatoriskt** — inte 2FA som alternativ. Skälet: en region-admin granskar för en hel region; identiteten bakom det kontot måste vara juridiskt säkrad, inte bara starkt skyddad.
- BankID-verifiering ärvs tekniskt från M6 — M18 definierar inget eget BankID-flöde, den *kräver* M6:s.
- Kravet gäller även medhjälpare. En region-admin som vill lägga till en medhjälpare kan bara göra det för en person som klarat BankID-verifiering.

## 4.3 Onboarding av en ny region-admin

När superadmin beslutat att utse en region-admin:

1. **Superadmin skapar kontot** med nivå `region-admin` och scope = den valda regionen (Block 7).
2. **Region-adminen sätter upp BankID-inloggning** (Block 4.2, via M6).
3. **Kalibrering mot M8.** Innan region-adminen granskar skarpt går hen igenom **M3 Block 1.5:s kalibreringsprocess** — M8-regelboken plus ett antal redan avgjorda ärenden — och jämför sina bedömningar mot de faktiska besluten. Avvikelser diskuteras med superadmin tills bedömningen ligger i linje. För M18 är detta **obligatoriskt**, inte valfritt.
4. **Inledande dubbelgranskning.** Region-adminens första skarpa granskningar dubbelgranskas av superadmin (samma mekanik som M3 Block 1.5 punkt 2). När superadmin ser konsekvent kvalitet får region-adminen granska sin regions rutinärenden självständigt.
5. **Region-adminen landar i `admin.sadaqahsweden.se`** — sin regions arbetsyta (Block 7.4).

Region-medhjälpare onboardas på samma sätt, men **region-adminen** (inte superadmin) är den som bjuder in och kalibrerar — region-adminen ansvarar för sina medhjälpares kvalitet, precis som superadmin ansvarar för region-adminernas.

## 4.4 Offboarding — när en region-admin avgår eller avsätts

Två vägar ut, båda rena (samma anda som M17 Block 4.2:s mjuka offboarding):

- **Region-admin avgår frivilligt** (en moské har inte längre kapacitet, en person kliver av) → superadmin **inaktiverar** kontot. Åtkomsten upphör omedelbart. Regionen faller tillbaka till superadmins kö (Block 3.5) tills en ny region-admin utses. Region-adminens medhjälpare blir antingen vilande eller knyts till superadmin/ny region-admin.
- **Region-admin avsätts** (förtroendebrott, missbruk — Block 5) → superadmin inaktiverar kontot, omedelbart. Här finns inget mjukt — en region-admin som missbrukat sin makt avsätts. Region-adminens medhjälpare granskas (de kan ha varit ovetande eller delaktiga); deras konton ses över.

I båda fallen:

- **All historik ligger kvar i loggen** (M17 Block 4.2-principen, M3:s append-only-logg). En avgången eller avsatt region-admins tidigare granskningsbeslut raderas aldrig — ansvar och spårbarhet bevaras.
- **Pågående ärenden** i den regionens kö flyttas till superadmins kö eller till en ny region-admin. Ingen insamlare tappas bort.
- **En avgången region-admin kan återaktiveras** senare (M17:s "kliver hen tillbaka, återaktivera") — en avsatt region-admin gör det inte utan ett nytt, medvetet förtroendebeslut av superadmin.

## 4.5 Superadmin-nivåns egen kontinuitet

Superadmin är en enda person (Zivar). Det är en felpunkt. M18 ärver M16/M17:s bus-factor-regel (*"minst två admins"*, `Beredskapsplan.md`):

- Riktmärke: **minst en till person har superadmin-nivå** som beredskap — en av bröderna. Detta är inte två likställda superadmins i daglig drift; det är ett skyddsnät så att överklaganden, region-admin-tillsättningar och nedstängningar inte fryser om Zivar är otillgänglig.
- Detta knyts till `Beredskapsplan.md` och är delvis en föreningsfråga (vem är beredskaps-superadmin), inte en ren plattformsfråga. M18 flaggar behovet och reserverar att fler än ett konto kan ha `superadmin`-nivå.

## 4.6 Kantfall

- **Ingen lämplig region-admin finns för ett län** → länet stannar i superadmins kö (Block 3.5). Det är helt acceptabelt — federation är frivillig och växer organiskt. Bättre ingen region-admin än fel region-admin.
- **En region-admin-moské splittras eller upphör som organisation** → kontot är knutet till en *person* med BankID, inte abstrakt till "moskén". Personen kan fortsätta, eller superadmin inaktiverar och utser ny. Att knyta kontot till en BankID-verifierad person, inte en organisation, gör detta hanterbart.
- **En region-admin vill utse sin egen efterträdare** → går inte. Att utse region-admins är superadmins ensamrätt (Block 1.3). En region-admin kan *rekommendera* en efterträdare; superadmin beslutar.
- **En medhjälpare vill bli region-admin i en annan region** → ett nytt, separat förtroendebeslut av superadmin; medhjälpar-rollen i den gamla regionen är skild.

---

# BLOCK 5 — Risker & skydd

Tillägg B1 säger rakt: *"delegerad granskning kan missbrukas — släpper igenom fel, eller nekar av personliga skäl istället för sakskäl."* Zivar flaggade risken själv. Block 5 är M18:s svar — och det är inte förhandlingsbart. Att distribuera makt utan att distribuera skydd är att bygga en svaghet.

## 5.1 Grundrisken — delegerad granskning kan missbrukas

När granskning flyttar från tre bröder Zivar känner till region-admins runt om i landet, uppstår två konkreta missbruksformer:

- **Släppa igenom fel insamlingar.** En region-admin godkänner en insamling som inte borde godkänts — av slarv, av personlig välvilja mot en bekant, eller i värsta fall i samförstånd med en fejk.
- **Neka av personliga skäl.** En region-admin avvisar eller bromsar en legitim insamling — av personlig motvilja, lokal konflikt, eller för att gynna en konkurrerande insamling.

Båda undergräver exakt det plattformen lovar (*"Trygga insamlingar"*). M18 möter dem med **fem skydd** — två som M3 redan har, och tre nya som Tillägg B1 kräver.

## 5.2 Skydd 1–3 — det M3 redan har (gäller fullt ut)

Dessa fanns före M18 och fortsätter att gälla — de är skälet till att distribuerad granskning är *möjlig* utan att bli farlig:

1. **Append-only-loggen** (M3 Block 3.4). Varje granskningsbeslut är spårbart till en namngiven person, med tidsstämpel, och kan aldrig redigeras i efterhand. En region-admin som missbrukar sin makt lämnar ett oförstörbart spår. M18 förstärker detta: superadmin *läser* dessa loggar uppifrån (Block 3.6) — loggen är inte bara passiv historik, den är ett aktivt tillsynsverktyg.
2. **Motiveringskravet** (M3 Block 3.2). Inget negativt beslut kan skickas utan en motivering i klartext. En region-admin som nekar av personliga skäl tvingas ändå skriva ett *sakskäl* — och ett påhittat sakskäl mot en uppenbart legitim insamling syns vid stickprov (Skydd 5) och kan vändas vid överklagande (Skydd 4).
3. **Jäv-regeln** (M3 avsnitt 7). En granskare granskar aldrig sitt eget eller en närståendes ärende. M18 gör jäv mer akut — se Block 5.3.

## 5.3 Jäv i en regional kontext — skärpt hantering

M3:s jäv-regel fanns för tre bröder. M18 gör jäv **mer sannolikt och mer känsligt**: en region-admin är, per definition, lokalt förankrad i sin region. Hen *känner* sannolikt flera av regionens insamlare — det är ofta hela skälet till att hen är lämplig. Men närhet är också jäv-risk.

M18 skärper:

- **En region-admin granskar aldrig en insamling där hen, sin moské, eller en närstående har ett intresse.** Det är M3:s regel, men i M18 inträffar fallet oftare och måste hanteras rutinmässigt.
- **Jäv → ärendet lyfts ur regionens kö.** När en region-admin (eller medhjälpare) har jäv tilldelas ärendet en **medhjälpare utan jäv** i samma region, eller — om hela regionens team har jäv — **superadmin** eller en granskare i en annan region. Ärendet granskas aldrig av någon med intresse i det.
- **Jäv loggas.** Att en granskare avstod på grund av jäv är en logg-rad i sig (M3 avsnitt 7: *"jävsregeln loggas"*).
- **Den exakta definitionen av "närstående" och "intresse"** hör till M8 + Bröderskapspakten (M3 öppen fråga 3). M18 ärver den definitionen, den skriver ingen egen.

## 5.4 Skydd 4 — andra-granskning för stora och känsliga insamlingar

Tillägg B1 kräver: *"Andra-granskning för stora eller känsliga insamlingar."* M18 spikar:

- **Stora insamlingar** — målbelopp över M3 Block 4:s riktmärke (500 000 kr) — utlöser redan M3:s flergranskar-beslut. M18 lägger till: minst en av de granskande ögonen ska komma **utanför regionen** — superadmin, eller en region-admin från en annan region. En enskild region-admin släpper aldrig ensam fram en mycket stor insamling.
- **Känsliga insamlingar** — gränsfall mot M8, kontroversiella ändamål (M3 Block 4.1) — får samma behandling: en andra blick utanför regionen.
- **Varför utanför regionen:** poängen med andra-granskning är att bryta lokal slagsida. Om båda granskarna är från samma region delar de samma lokala kontext — och samma eventuella lokala intresse. En blick utifrån är opartisk.
- Detta staplar ovanpå M3 Block 4 — det ersätter det inte. Ett stort ärende i en region får alltså *både* M3:s flergranskar-enighet *och* M18:s ut-ur-regionen-blick.

## 5.5 Skydd 5 — superadmins stickprov

Tillägg B1: *"Superadmin granskar stickprovsvis (Zivar gör redan detta)."* M18 spikar:

- **Superadmin tar regelbundet stickprov** ur region-admins fattade beslut — läser ett urval godkända *och* avvisade insamlingar mot M8-regelboken, och bedömer om region-adminen granskat objektivt.
- **Stickprovet är datadrivet.** M16 Block 2:s statistik, filtrerad per region (Block 3.6), pekar ut var stickprov behövs: en region-admin med onormalt hög avvisningsgrad, eller onormalt hög andel snabba godkännanden, eller en kö som rör sig misstänkt fort, dras fram automatiskt för superadmins blick. Stickprovet är inte slumpmässigt brus — det är riktad tillsyn.
- **Stickprovet är en M16-funktion i grunden.** M16 äger drift och statistik; M18 lägger till region-dimensionen så att M16:s vyer kan zooma in på en enskild region-admins arbete.
- **Vad stickprovet leder till:** ett enstaka avvikande beslut → en samtal/kalibrering med region-adminen (M3 Block 1.5-andan). Ett mönster av missbruk → avsättning (Block 4.4).

## 5.6 Skydd 6 — överklagande-vägen

Tillägg B1: *"En insamlare som känner sig orättvist nekad kan eskalera till superadmin. Fångar 'nekad av fel skäl'."* M18 spikar **överklagande-vägen** — det enda nya *flödet* M18 inför (resten distribuerar M3):

- **Vem får överklaga:** en insamlare vars insamling avvisats (`avvisad`) av en region-admin eller medhjälpare. Inte en ändringsbegäran — där har insamlaren redan en väg tillbaka (M2). Överklagandet är för det slutgiltiga nekandet.
- **Vart det går:** **direkt till superadmin.** Det går aldrig tillbaka till samma region-admin — hela poängen är en oberoende blick. Subdomänen `superadmin.sadaqahsweden.se` är där superadmin ser överklaganden.
- **Vad superadmin gör:** läser den avvisade insamlingen, region-adminens motivering (motiveringskravet, Skydd 2, säkrar att det *finns* en motivering att läsa), och loggen — och bedömer ärendet om mot M8.
  - Superadmin håller med region-adminen → avvisningen står, insamlaren får ett tydligt slutbesked.
  - Superadmin håller inte med → beslutet rivs upp; insamlingen får en ny granskning (av superadmin eller en annan region). Region-adminen får återkoppling — det är input till kalibrering eller, vid mönster, stickprov/avsättning.
- **Begränsning mot missbruk av själva överklagandet:** en insamlare kan överklaga en avvisning *en gång*. Ett upphävt och sedan på nytt avvisat ärende går inte i oändlig loop. Detta speglar M3:s ton om att inte över-designa — överklagandet är en ventil, inte en evig process.
- **Varför detta är avgörande:** överklagande-vägen är skyddet mot "nekad av fel skäl". Utan den vore en region-admin den slutgiltiga domaren över sin region — och det är precis den okontrollerade makten M18 inte får skapa. Med den vet varje insamlare att en region-admins nej inte är sista ordet.

## 5.7 M8-regelboken som objektiv måttstock — skrivet uttryckligt

Tillägg B1 kräver att detta står *uttryckligt*: **M8-regelboken är den objektiva granskningsmåttstocken. En region-admin granskar mot M8 — aldrig mot personlig smak.**

- Detta var alltid sant för M3:s bröder (M3 Block 2.2 punkt 4–5 pekar på M8). Men för en distribuerad federation av region-admins som superadmin *inte* personligen kalibrerar varje dag, är det inte längre underförstått — det måste vara en uttalad regel.
- **M8 är det som gör region-admins utbytbara och rättvisa.** Två region-admins i två län ska komma till samma beslut om samma insamling, för båda mäter mot samma M8. När de inte gör det är det ett kalibreringsproblem (Block 4.3) eller ett missbruk (stickprov, Block 5.5) — inte en legitim "regional skillnad i smak".
- **Det finns ingen regional policy-variation.** En region-admin kan inte införa egna regler för sin region. Policyn är nationell, den bor i M8, och den ändras bara i M8. En region-admin som tycker M8 har fel lyfter det som ett policyärende till superadmin (samma väg som M3 Block 4.3:s kantfall: en tolkningsoenighet är ett M8-ärende, inte ett granskningsärende).

## 5.8 Kantfall

- **En region-admin och en medhjälpare i samma region är oense** om ett ärende → M3 Block 4.3:s oenighetsstege gäller *inom regionen* (samtal, avsikten + plattformens mening, försiktighetsprincipen). Kan de inte enas → ärendet lyfts till superadmin. M18 bygger ingen "majoritet"-knapp — samma skäl som M3.
- **En region-admin missbrukar systematiskt men subtilt** (varje enskilt beslut ser försvarbart ut) → mönstret fångas av statistik-driven stickprov (Block 5.5), inte av ett enskilt ärende. Det är därför stickprovet är datadrivet och inte slumpmässigt.
- **En medhjälpare missbrukar sin granskning** → region-adminen är första linjens tillsyn (region-adminen ansvarar för sina medhjälpare, Block 4.3), superadmins stickprov är andra linjen. En medhjälpare som missbrukar tas bort av region-adminen; gör region-adminen inte det är *det* i sig en signal om region-adminen.
- **Överklagandet kommer in men superadmin är otillgänglig** → det köar (Block 1.4). Beredskaps-superadmin (Block 4.5) kan ta det. En avvisad insamlare väntar hellre på ett oberoende svar än får ett snabbt från fel instans.
- **En region-admin nekar och insamlaren överklagar inte** (vet inte om vägen) → överklagande-vägen måste vara *synlig* i avvisningsbeskedet. Den avvisade insamlaren ska få veta, i klartext i sitt nej-besked, att hen kan begära att superadmin tittar om. En osynlig överklagande-väg är ingen.

---

# BLOCK 6 — Distribuerad support

Granskning är hälften av en region-admins jobb. Den andra hälften är **support** — att vara regionens fråga-väg. Block 6 spikar det, och kopplar det till Tillägg A2.

## 6.1 Varför support distribueras

Tillägg A2 (onboarding-tröskeln) införde en **fråga-väg**: en lätt kanal där någon kan ställa frågan *"kan jag samla in?"* **innan** hen går igenom hela BankID→Stripe→insamling-kedjan och riskerar att nekas i slutet. A2 säger uttryckligen: *"Frågorna besvaras med fördel av de regionala admins (se B1)."*

M18 levererar den kopplingen:

- **Region-admins är sin regions support.** En insamlare i Skåne som undrar om sitt projekt skulle godkännas ställer frågan till Skånes region-admin.
- **Varför regionalt:** samma skäl som regional granskning. En region-admin känner sin region, talar ofta samma språk, finns nära. Support från någon i samma stad känns annorlunda än support från ett centralt kontor — det är premium genom omsorg (princip 6) tillämpat på support.
- **Det avlastar superadmin.** Utan distribuerad support landar varje fråga i Sverige hos Zivar. Med den bär varje region sin egen frågevolym — samma logik som distribuerad granskning.

## 6.2 Vad region-admin-supporten omfattar

En region-admins support-ansvar för sin region:

- **Pre-check-frågor (A2).** *"Kan jag samla in för det här?"* — region-adminen svarar mot M8-regelboken (samma objektiva måttstock som granskningen, Block 5.7). En region-admin som granskar mot M8 är väl placerad att *förhandssvara* mot M8.
- **Frågor under en pågående insamling.** En insamlare i regionen som kört fast i något.
- **Vägledning, inte beslut.** Support är att hjälpa och förklara. Ett pre-check-svar är *vägledning* — det är inte ett bindande granskningsbeslut. Den faktiska insamlingen granskas fortfarande formellt (M3) när den skickas in. Region-adminen kan säga "det här ser ut att kunna godkännas" men det ersätter inte granskningen.

## 6.3 Förhållandet till FAQ och självbetjäning

Tillägg A2:s första lager är **självbetjäning** — en "Kan jag samla in?"-guide. Tillägg B2 bygger ett **FAQ-system**. M18:s distribuerade support är A2:s *andra* lager — den mänskliga fråga-vägen:

- **Självbetjäning först.** De flesta får svar av guiden/FAQ:n utan en människa. Det håller region-admin-supporten billig (A2:s uttryckliga mål: *"Hålls billig för teamet om guiden är bra"*).
- **Region-admin för resten.** Den som inte fick svar av guiden frågar sin region-admin.
- **Återkoppling till FAQ:n.** En fråga som många region-admins får om och om igen är en signal att FAQ:n (B2) bör få ett nytt svar. Region-admins blir därmed en källa till vad FAQ:n behöver — support-frågorna föder självbetjäningen. (B2 ägs av M19; M18 noterar bara kopplingen.)

## 6.4 Region utan region-admin — supportens fallback

Precis som granskningen (Block 3.5): en region utan region-admin får sin support från **superadmin**. Vid M18:s lansering, innan någon region har en region-admin, är all support superadmins — exakt som idag. Support tänds region för region i takt med federationen.

## 6.5 Kantfall

- **En fråga gäller en annan region** (insamlaren bor i ett län men frågar om en insamling i ett annat) → support-ansvaret följer insamlar-regionen, samma regel som granskningen (Block 2.4). Vid oklarhet hjälper region-adminen att slussa rätt.
- **En region-admin ger ett pre-check-svar som motsägs av den senare granskningen** → granskningen vinner; pre-check är vägledning, inte beslut (Block 6.2). Men ett mönster av sådana motsägelser hos en region-admin är en kalibrerings-signal — region-adminen svarar inte mot M8 konsekvent.
- **Support-volymen blir för tung för en region-admin** → region-medhjälpare avlastar (de svarar också frågor, Block 1). Räcker inte det är det en signal till superadmin, parallellt med granskningens skalningströskel (M3 Block 1.5).
- **En känslig support-fråga** (insamlaren delar privat eller utsatt information i en fråga) → support-konversationer omfattas av integritetspolicyn (M8/GDPR), samma som M3:s interna anteckningar (M3 Block 2.3). Region-admins hanterar support-data under samma regler som granskningsdata.

---

# BLOCK 7 — Arkitektur & RLS

M18 inför två nya dimensioner i datamodellen: en **region-dimension** och en **admin-nivå-dimension**. Block 7 spikar de arkitektoniska konsekvenserna — och, framför allt, RLS-konsekvenserna, eftersom federation rör direkt vid `SAKERHETSREGLER.md`.

## 7.1 Plattformen är inte multi-tenant — och M18 ändrar inte det

`SAKERHETSREGLER.md` säger uttryckligen: *"Sadaqah Sweden är inte multi-tenant. ... Här styrs RLS av ägarskap (en insamlare äger sin insamling) och roll (granskare ser kön, admin ser allt). Tänk ägarskap + roll, inte tenant."* Tillägg B1 säger samma: *"Detta är inte full multi-tenancy, men ett riktigt RLS-tillägg."*

M18 håller den linjen exakt:

- **Det finns ingen `tenant_id`.** M18 inför inget Corevo-aktigt tenant-mönster. Det finns en *region*, men en region är inte en tenant — den är en **scope-dimension för en roll**, inte en isolerad datakund.
- **Skillnaden, konkret:** i en multi-tenant-modell *äger* varje tenant sin data och delar inget. I M18 äger plattformen all data; en region-admin får bara *se en delmängd* via RLS. Insamlingarna i Skåne tillhör inte "Skåne-tenanten" — de tillhör plattformen, och Skånes region-admin har en RLS-policy som låter hen läsa just dem.
- **RLS styrs fortfarande av ägarskap + roll.** M18 lägger till en tredje faktor i roll-delen: **roll-nivå + roll-scope**. Det är en utvidgning av "roll", inte en ny tenant-axel.

## 7.2 De nya dimensionerna i datamodellen

M18 förutsätter tre saker i datamodellen — och Tillägg B1:s datamodell-flaggor säger att **utrymmet ska reserveras nu**, även om federationen byggs i Bygg-grupp C:

| Dimension | Var den bor | Status idag |
|---|---|---|
| **Insamlingens region** | `insamling.insamlar_region` (eller härledd via `plats_taxonomi` stad→region) | Redan flaggat — Tillägg B1: *"`insamlar_region` finns redan i `insamling`"*. M18 kräver att den **fylls och normaliseras** för varje insamling. |
| **Granskningens region-scope** | Granskningsärendet/kön kan filtreras på region | Tillägg B1: *"en granskning bör kunna knytas till en region"*. Reserveras nu. |
| **Admin-rollens nivå + scope** | Rollen bär `superadmin` vs `region-admin`/`region-medhjälpare` + en region-id | Tillägg B1: *"reservera utrymme för `superadmin` vs region-`admin` + region-id"*. Reserveras nu. |

**Förberedande, inte byggande.** Som Tillägg B1 säger: *"Detta är förberedande hänsyn, inte bygge. Ingen federation-funktionalitet byggs före Bygg-grupp C."* M18 Block 7 är specen för *vad federationen kräver av datamodellen* — så att den som bygger datamodellen tidigare (M1, M3, M6) lämnar rätt uttag, och Bygg-grupp C kan koppla in M18 utan en smärtsam ombyggnad.

## 7.3 RLS-konsekvenserna — region-scopad åtkomst

Här är det känsliga. `SAKERHETSREGLER.md` är icke-förhandlingsbar; M18:s RLS-tillägg måste följa den till punkt och pricka.

**Grundmönstret:** en region-admins och medhjälpares åtkomst till insamlingar (och granskningskö, support-ärenden) begränsas av en RLS-policy som matchar **rollens region-scope mot insamlingens region**.

Konsekvenser, enligt `SAKERHETSREGLER.md`:

- **Roll-nivå och region-scope läses från `app_metadata` / JWT-claims — aldrig från `user_metadata`.** `SAKERHETSREGLER.md` punkt 4 är absolut: *"`user_metadata` kan användaren själv skriva ... Läs det aldrig i en policy."* En region-admins nivå och region-id är behörighetsdata — de bor i `app_metadata` (bara serverside skrivbart) eller i JWT-claims via Custom Access Token Hook. En region-admin får aldrig kunna skriva om sitt eget scope och se en annan region.
- **Varje ny policy: `TO`-roll explicit, `auth.uid()`/`auth.jwt()` wrappat i `(select …)`.** `SAKERHETSREGLER.md` punkt 2. En region-scope-policy som läser region-id ur JWT:n wrappar det anropet — annars 10–100× långsammare.
- **Index på varje policy-refererad kolumn.** `insamling.insamlar_region` blir en policy-refererad kolumn → den ska indexeras (`SAKERHETSREGLER.md` punkt 2, lint 0001).
- **Superadmin kringgår inget via en bakdörr.** Superadmin ser allt — men det löses med en *roll-policy* (nivå = `superadmin` → policy tillåter alla rader), inte genom att ge en människa `service_role`-nyckeln. `service_role` lever bara på servern (`SAKERHETSREGLER.md` punkt 1); en superadmin är en `authenticated`-användare vars JWT-claim ger bred RLS-åtkomst. Detta speglar M17 Block 5.1 exakt: *"Även en admin agerar genom appen, aldrig genom databasen."*
- **Region-admins är isolerade från varandra på RLS-nivå.** Tillägg B1: *"Region-admins är isolerade från varandra — ser inte varandras data."* Detta är en RLS-policy: region-admin med scope = Skåne har en policy som bara matchar `insamlar_region = 'Skåne'`. Hen kan tekniskt inte läsa en Norrbotten-rad — inte för att UI:t döljer den, utan för att RLS aldrig returnerar den. Det är samma slags isolering RLS redan ger mellan insamlare (en insamlare ser bara sina egna insamlingar) — bara med region-scope i stället för ägar-id.
- **Eventuella nya `SECURITY DEFINER`-funktioner** (t.ex. en hjälpfunktion som härleder en användares region-scope) följer `SAKERHETSREGLER.md` punkt 3: `private`-schema, `search_path = ''`, explicit REVOKE/GRANT, ingen nästling.
- **Security Advisor körs efter M18:s migrationer** — alla P0-lints gröna, annars pushas inte (`SAKERHETSREGLER.md` punkt 10).

## 7.4 Subdomänerna

**Plattformen har en admin-subdomän** (Zivars beslut 2026-05-24 — förenkling av Tillägg B1:s ursprungliga två):

| Subdomän | För | Vad den visar |
|---|---|---|
| `admin.sadaqahsweden.se` | Hela teamet — superadmin, region-admin, region-medhjälpare | Det `admin_niva` släpper fram: superadmin ser hela Sverige (alla regioners köer, statistik, överklaganden, stickprov, utse/avsätta region-admins); en region-admin/medhjälpare ser bara sin egen region. Samma yta — rollen avgör. |

- **Detta är M17:s arbetsyta, federerad.** M17 Block 3 beskriver "en samlad arbetsyta" som är rollmedveten — *"Ytor man inte har behörighet till syns inte."* Samma princip: en inloggning, `admin_niva` + RLS avgör vad som visas.
- **Subdomänen är en ingång, inte säkerhetsgränsen.** Det som *faktiskt* begränsar en region-admin är RLS (Block 7.3) och `admin_niva` — inte adressen. Därför räcker en subdomän: en andra skulle inte avgränsa något RLS inte redan avgränsar. Säkerhet i djupet (`SAKERHETSREGLER.md`-andan: en perfekt RLS bär även om ett UI-lager fallerar).
- **Superadmin-funktioner gateas av `admin_niva`, aldrig av hostnamnet.** Utse/avsätta region-admin, refund, nedstängning, överklaganden, stickprov — alla kräver `admin_niva='superadmin'` i RLS och UI.
- **Den publika plattformen** (`sadaqahsweden.se`) och den interna `admin.`-subdomänen delar samma databas — *"samma sanning, två fönster"* (M17 Block 5.2), åtskilda av RLS och roll.

## 7.5 Tidsläge och byggordning

- **M18 byggs i Bygg-grupp C, efter Steg 16.** Tillägg B1: *"Byggsteg: efter Steg 16 (Bygg-grupp C, sista lagret)."* M18 förutsätter M3, M6, M10, M16 och M17 färdiga — den distribuerar deras funktionalitet och kan inte byggas innan den finns.
- **Datamodellen anticiperar M18 tidigare.** De tre dimensionerna i Block 7.2 reserveras när M1/M3/M6:s datamodell byggs — `insamlar_region` fylls och normaliseras, granskning görs region-scopbar, admin-rollen får utrymme för nivå + scope. Det är förberedande hänsyn enligt Tillägg B1:s datamodell-flaggor; ingen federation-funktion byggs tidigt.
- **Hård beroende-flagga:** M18 kan inte byggas före M3, M6, M16 och M17. Den är meningsfull först när det finns ett granskningsflöde, ett rollsystem, en driftvy och en arbetsyta att federera.

## 7.6 Kantfall

- **En insamling utan region** når granskning → kan inte RLS-matchas mot en region-admin → faller till superadmins scope (Block 2.4, Block 3.5). RLS-policyn för superadmin (nivå = `superadmin`) fångar den.
- **En region-admins JWT-claim är inaktuell** efter att superadmin ändrat hens scope → claims uppdateras vid nästa token-förnyelse (M6:s sak); tills dess kan en kort fördröjning finnas. För scope-*utvidgning* är det ofarligt; för scope-*indragning* (avsättning, Block 4.4) ska kontot inaktiveras direkt, inte bara scope-ändras — inaktivering drar åtkomsten omedelbart (M17 Block 4.2).
- **Antalet regioner skulle någon gång ändras** (Block 2.4) → en `plats_taxonomi`-migrering; RLS-policymönstret (matcha roll-scope mot insamlings-region) är oberoende av *hur många* regioner som finns.
- **Internationell framtid** — M12 Block 8.4 noterar att kartans datamodell generaliserar bortom Sverige. M18:s region-dimension är "Sveriges län" specifikt; en framtida utlandsexpansion skulle kräva att styrnings-dimensionen generaliseras parallellt med M12:s. Parkerad hook, ingen kod nu — flaggas bara så inget byggs som hårt låser "län" på ett sätt som inte går att generalisera.

---

## 5. Designval & motivering (hela Modul 18)

| Beslut | Motivering |
|---|---|
| Tre styrningsnivåer (superadmin / region-admin / region-medhjälpare) | Granskning skalar inte centralt. En vertikal nivå-dimension distribuerar arbetet utan att tappa en topp som ser allt. |
| M18 distribuerar M3/M16/M17 — bygger inte om dem | M3:s flöde, M16:s verktyg, M17:s arbetsyta gäller fullt ut. M18 lägger bara på region- och nivå-dimensionen. Mindre att bygga, svårare att ha fel i. |
| Region = ett av Sveriges 21 län — samma som M12 | Konsekvens med kartan, datamodellen finns redan (`plats_taxonomi`), och län är rätt grovhet — bemanningsbart med en moské, grovt nog för integritet (M12 Block 5.2). |
| Riktmärke en region-admin per region, inte fler | En andra oberoende region-admin i samma län skapar oklart ägarskap av kön. Mer kapacitet = medhjälpare, inte en andra region-admin. |
| Region-admins utses manuellt av superadmin, på förtroende — ingen självregistrering | Att delegera granskningsmakt över en region är ett medvetet förtroendebeslut, inte en rutin. Speglar M17:s "inga självregistreringar". |
| BankID obligatoriskt för alla i kedjan — striktare än M17:s "BankID eller 2FA" | En region-admin granskar för en hel region; identiteten bakom kontot måste vara juridiskt säkrad, inte bara starkt skyddad. |
| Pengamakt (refund, nedstängning) stannar hos superadmin — distribueras inte | Asymmetrin från M16 Block 4.2: snabba/reversibla åtgärder delegeras, permanenta/pengarörliga reserveras. Distribuerad granskning, central pengakontroll. |
| Region-admins isolerade från varandra via RLS — ser aldrig varandras data | Tillägg B1-krav. En region-admin ska inte kunna läsa en annan regions insamlare. Löses som en RLS-scope-policy, inte UI-döljning. |
| M8-regelboken skrivs uttryckligt som den objektiva måttstocken för region-admins | Det som gör region-admins utbytbara och rättvisa. Utan en uttalad regel riskerar en distribuerad federation att granska efter regional smak. |
| Överklagande-vägen går direkt till superadmin, aldrig tillbaka till samma region-admin | Skyddet mot "nekad av fel skäl". Utan en oberoende blick vore en region-admin sin regions slutgiltiga domare — exakt den okontrollerade makt M18 inte får skapa. |
| Andra-granskning för stora/känsliga insamlingar — minst ett öga utanför regionen | Bryter lokal slagsida. Två granskare från samma region delar samma lokala kontext och eventuella lokala intresse. |
| Superadmins stickprov är datadrivet, inte slumpmässigt | M16:s per-region-statistik pekar ut var tillsyn behövs (hög avvisningsgrad, för snabba godkännanden). Riktad tillsyn fångar subtilt missbruk som ett enskilt ärende inte gör. |
| Support distribueras till region-admins, kopplat till Tillägg A2 | A2:s fråga-väg behöver en mottagare. Regional support = lokalkännedom + närhet, och avlastar superadmin. |
| Ingen `tenant_id` — region är en roll-scope, inte en tenant | `SAKERHETSREGLER.md` är absolut: inte multi-tenant. Plattformen äger all data; region-admin ser en RLS-delmängd. En utvidgning av "roll", inte en ny tenant-axel. |
| Roll-nivå + scope i `app_metadata`/JWT — aldrig `user_metadata` | `SAKERHETSREGLER.md` punkt 4. En region-admin får aldrig kunna skriva om sitt eget scope och nå en annan region. |
| Subdomäner är ingångar, RLS är säkerhetsgränsen | Säkerhet i djupet. En region-admin som nådde superadmin-subdomänen ser ändå bara sin region — RLS släpper inte mer. |
| Datamodellen anticiperar M18 tidigt, federationen byggs i Bygg-grupp C | Tillägg B1:s datamodell-flaggor: bygg uttaget tidigt, aktivera sent. En senare federation får aldrig kräva en smärtsam ombyggnad. |

---

## 6. Kopplingar

**Modul 18 tar in:**
- **Granskningsflödet** — kö, auto-tilldelning, prioritering, SLA, checklistan, de tre besluten, eskalering, append-only-loggen, jäv-regeln — från **M3**. M18 distribuerar detta per region; det ändrar inget i M3.
- **Rollsystemet** från **M6** — M18 utvidgar M6:s roller med nivå + scope, definierar inga roller från grunden. BankID-verifieringen ärvs från M6.
- **Granskningspolicyn (regelboken)** från **M8** — den objektiva måttstocken varje region-admin granskar och förhandssvarar mot.
- **Föreningar/organisationer** från **M10** — en region-admin är ofta en moské; M10 äger organisations-datan.
- **Region-indelningen och `plats_taxonomi`** från **M12** — Sveriges 21 län, stad→region-uppslag.
- **Driftvy, larm, statistik och manuella ingrepps-verktyg** från **M16** — M18 region-scopar dessa och gör dem rapporterbara uppåt till superadmin.
- **Den interna arbetsytan, teamhanteringen och databasgränsen** från **M17** — M18:s subdomäner är M17:s arbetsyta, federerad.
- **Onboarding-pre-checkens fråga-väg** från **Tillägg A2** — M18:s distribuerade support är A2:s mänskliga andra lager.

**Modul 18 lämnar ut:**
- En **region-scopad granskningskö** per region — M3:s kö, distribuerad.
- **Distribuerad support** — region-admins som regionens fråga-väg, vilket A2:s fråga-väg landar i.
- **Rapportering uppåt** — regionala granskningsnyckeltal och köstatus till superadmin, via M16.
- **Överklagande-flödet** — det enda nya flödet M18 inför, från avvisad insamlare till superadmin.
- **Region-dimensionen och admin-nivå-dimensionen** till datamodellen — som M1/M3/M6 ska reservera utrymme för tidigt.

**Tvärgående natur:** M18 äger ingen kärndata. Som M16 och M17 är den en internt-vänd modul som distribuerar och styr — den tar M3/M16/M17:s funktionalitet och federerar den. Den enda *nya* funktionaliteten M18 inför är överklagande-vägen och region-scopningen; resten är distribution.

**Kopplad till M19:** Tillägg B2 (innehåll & FAQ) blir M19. FAQ:n (M19) är självbetjäningslagret som håller M18:s distribuerade support billig — region-admins frågevolym föder FAQ:ns innehåll. M18 noterar kopplingen; M19 äger FAQ-systemet.

---

## 7. Säkerhet & anti-kaos

- **RLS-isolering mellan regioner.** En region-admin kan tekniskt inte läsa en annan regions data — en RLS-scope-policy returnerar aldrig raden. Inte UI-döljning, utan databasnivå-isolering (`SAKERHETSREGLER.md`-modellen, ägarskap + roll utvidgad med scope).
- **Roll-nivå och scope i `app_metadata`/JWT, aldrig `user_metadata`.** En region-admin kan inte skriva om sitt eget scope och nå en annan region. `SAKERHETSREGLER.md` punkt 4, absolut.
- **Pengamakten distribueras aldrig.** Refund och permanent nedstängning kräver superadmin. En region-admin kan stoppa (pausa) men aldrig oåterkalleligt eller pengarörligt agera ensam.
- **Append-only-loggen som tillsynsverktyg.** Varje region-admins beslut är spårbart till en namngiven person och oförstörbart (M3 Block 3.4). Superadmin *läser* loggarna uppifrån — de är aktiv tillsyn, inte passiv historik.
- **Överklagande-vägen.** En avvisad insamlare har alltid en oberoende instans (superadmin) — en region-admins nej är aldrig sista ordet. Vägen måste vara synlig i avvisningsbeskedet.
- **Datadrivet stickprov.** M16:s per-region-statistik pekar ut avvikande region-admins (hög avvisningsgrad, för snabba godkännanden) för riktad superadmin-granskning. Fångar subtilt mönster-missbruk.
- **Andra-granskning utanför regionen** för stora/känsliga insamlingar — bryter lokal slagsida.
- **Skärpt jäv-hantering.** En region-admin är lokalt förankrad → jäv är vanligare → jäviga ärenden lyfts rutinmässigt ur regionens kö.
- **BankID för hela kedjan.** Varje region-admin och medhjälpare juridiskt identitetssäkrad innan kontot aktiveras.
- **Omedelbar offboarding vid avsättning.** En missbrukande region-admin inaktiveras direkt — åtkomsten dras på en gång (M17 Block 4.2), inte bara scope-ändras.

**Verklig risk att flagga:** den största risken i M18 är **en region-admin som blir en okontrollerad furste över sin region** — släpper igenom kompisars insamlingar, nekar konkurrenters, granskar efter lokal smak. M18:s sex skydd (M3-loggen, motiveringskravet, jäv-regeln, andra-granskning, stickprov, överklagande-väg) plus M8 som uttrycklig måttstock finns just för att göra det omöjligt att missbruka makten *osynligt*. Men inget skydd är perfekt — "vårt fel men inte dödligt" (princip 4) gäller: målet är att göra missbruk svårt, snabbt upptäckt och alltid vändbart, inte att garantera att det aldrig sker. Superadmins aktiva tillsyn är inte valfri — en federation utan en vaken topp *blir* en samling furstendömen.

**Andra flaggan:** federationens nytta beror helt på att rätt region-admins utses. En fel-tillsatt region-admin är en större risk än ingen region-admin — därför är urvalet ett medvetet förtroendebeslut (Block 4.1) och därför är "hellre superadmins kö än fel region-admin" (Block 4.6) den rätta hållningen. Federation ska växa långsamt och med omdöme, inte snabbt.

---

## 8. Automatisering

**Självgående (ingen människa):**
- Region-routning av en inskickad insamling — `insamlar_region` (eller stad→region-uppslag) avgör automatiskt vilken regions kö ärendet hamnar i.
- Auto-tilldelning inom regionen — M3:s round-robin + tillgänglighet, körd bland regionens team.
- RLS-scopningen — vad en region-admin ser avgörs automatiskt av rollens nivå + scope.
- Region-scopad kösortering, SLA-färgmarkering och larm — M3/M16:s automatik, per region.
- Rapportering uppåt — regionala nyckeltal aggregeras automatiskt till superadmins nationella vy.
- Statistik-driven utpekning av avvikande region-admins — M16:s statistik flaggar var stickprov behövs.
- Fallback till superadmins kö för regioner utan region-admin och för insamlingar utan region.

**Kräver människa:**
- Att utse och avsätta en region-admin — ett medvetet förtroendebeslut, aldrig automatik (Block 4).
- Kalibrering och inledande dubbelgranskning av en ny region-admin/medhjälpare (Block 4.3).
- Själva granskningsbedömningen — M3 sa det redan: granskningen *kan inte* automatiseras, det är hela poängen med princip 7.
- Att läsa stickprov och bedöma om en region-admin granskar objektivt (Block 5.5).
- Att avgöra ett överklagande (Block 5.6).
- Att besvara support-frågor som självbetjäningen inte fångade (Block 6).

**Den ärliga gränsen:** M18 automatiserar *distributionen* av arbete — routning, scopning, tilldelning, rapportering — men inte *omdömet*. Granskning, tillsyn, förtroendebeslut om vem som blir region-admin, och bedömningen av ett överklagande är och förblir mänskliga. M18 gör att fler människor kan dela omdömesarbetet; den ersätter det inte. Riktmärket: en region-admins normala vecka är att granska sin regions kö och svara några frågor — allt runt omkring (routning, sortering, rapportering) sköter sig självt, exakt som M3 och M16 lovade, nu per region.

---

## 9. Öppna frågor

1. **Exakt antal region-medhjälpare per region-admin** — "några få, inte 15" (Tillägg B1) är riktmärket. Den exakta övre gränsen bör spikas mot driftserfarenhet — sannolikt 2–5. → bekräftas när federationen tas i drift.
2. **Den exakta definitionen av jäv** ("närstående", "intresse") i en regional kontext — ärvs från M8 + Bröderskapspakten (M3 öppen fråga 3), men M18:s skärpta jäv-frekvens (Block 5.3) kan kräva ett förtydligande just för region-admins. → M8 + Bröderskapspakten.
3. **Tröskeln för "stor/känslig insamling" som utlöser andra-granskning** — M18 lutar mot M3 Block 4:s 500 000 kr-riktmärke, men en region-admin-kontext kan motivera en lägre tröskel (en region-admin är mindre kalibrerad än de tre bröderna). → ses över med M3 efter de första federerade månaderna.
4. **Beredskaps-superadmin** — vem, och hur formaliseras den andra superadmin-nivån (Block 4.5)? Delvis föreningsfråga. → `Beredskapsplan.md` + M6.
5. **Hur en region-admin-moské representeras** — kontot knyts till en BankID-verifierad *person* (Block 4.6), men ska plattformen någonstans visa *vilken moské/organisation* en region-admin representerar, kopplat till M10:s organisationer? → bedöms mot M10.
6. **Ersättning för region-admin-arbetet** — region-admins lägger ner verkligt arbete; M3 öppen fråga 4 nämner ersättning för granskararbete. En distribuerad federation gör frågan större. → föreningsfråga, inte plattformsfråga.
7. **Överklagandets exakta gränssnitt** — hur en avvisad insamlare initierar ett överklagande, och hur det presenteras för superadmin. → detaljspecas när M18 byggs i Bygg-grupp C, tillsammans med M15 (notiser).

---

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering) — det är Modul 18:s fullständiga beslutslogg.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första versionen. Ny modul som expanderar Tillägg B1 till full djup. 7 block: tre-nivå-styrningen (superadmin/region-admin/region-medhjälpare), regioner som styrningsdimension (Sveriges 21 län, konsekvent med M12), distribuerad granskning (M3:s flöde region-scopat), att utse/avsätta region-admin (förtroende, BankID, kalibrering, livscykel), risker & skydd (sex skydd inkl. överklagande-väg, andra-granskning, datadrivet stickprov, M8 som uttrycklig måttstock), distribuerad support (region-admins som regionens fråga-väg, kopplat till Tillägg A2), arkitektur & RLS (region-dimension + admin-nivåer som RLS-tillägg, inte multi-tenancy; subdomäner). |
| 1.1 | 2026-05-24 | Subdomän-modellen förenklad till **en** admin-subdomän (`admin.sadaqahsweden.se` för hela teamet; `superadmin.` utgår). 7.4 omskriven. `admin_niva` + RLS är behörighetsgränsen, subdomänen bara en ingång. Genomförs i `2-Byggplan/18-Goal-Subdoman-forenkling.md`. |
