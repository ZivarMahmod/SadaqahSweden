---
description: Sätt ett mål och arbeta autonomt mot det — bygg, verifiera, pusha till main, utan att vänta på Zivar.
---

# /goal — autonomt byggläge

Du går nu in i **autonomt byggläge**. Zivar är borta. Ditt jobb: bygg så mycket som möjligt, verifiera, och pusha till `main` — utan att vänta på honom.

## Målet

$ARGUMENTS

Om inget mål står ovanför är målet: **bygg så många steg som möjligt av `../2-Byggplan/05-Byggsekvens.md`, i ordning, verifiera varje, pusha till `main`.**

## Vad resultatet ska vara

Hela plattformen blir **inte** klar på en körning — det är inte målet, och du ska inte mäta dig mot det. Målet är:

**Så långt genom byggsekvensen du kan — och varje steg du rört är på riktigt klart.**

"Klart" gäller **per steg**, inte för plattformen. Ett steg är klart när dess "Klar när"-lista är grön, verifierad och pushad. Kom du till Steg 4 med fyra solida, pushade steg — lyckad körning. Kom du till Steg 9 — bättre. Båda är framgång.

Två sätt att misslyckas — undvik båda:

- **Halvbyggt.** Ett steg du börjat men inte verifierat och pushat = kaos. Känner du att du inte hinner slutföra ett steg innan du stannar — påbörja det inte. Avsluta alltid på en ren steg-gräns.
- **Skumma förbi.** Att ytligt "passera" ett steg — bygga slarvigt och gå vidare — sår fel som fortplantar sig. En hård men byggbar uppgift bygger du ordentligt, hela vägen.

Du passerar **bara** det som är genuint blockerat — en saknad nyckel eller extern dependency du inte har. Det noterar du i `SESSION-GOAL.md` och går vidare. Allt annat bygger du, ordentligt, till verifierat-och-pushat.

Resultatet är ett repo där allt som byggts fungerar och är verifierat, inget är halvbyggt eller trasigt, och `SESSION-GOAL.md` visar exakt hur långt du kom.

## Steg 1 — orientera

Läs `CLAUDE.md`, `../2-Byggplan/00-Byggplan-oversikt.md` och `../2-Byggplan/05-Byggsekvens.md`. Skapa eller uppdatera `SESSION-GOAL.md` i repo-roten (mall längst ner).

## Förutsättningar — det här ändrar hur du arbetar

Plattformen har **inga användare, inga besökare, ingen trafik, ingen data**. Den är inte omtalad för någon. Det finns inget i produktion att skydda. Därför:

- Du **väntar aldrig** på Zivars godkännande för att bygga, migrera eller pusha.
- `main` är inte heligt — commita direkt till `main`, pusha ofta. (Branch/PR-flödet i fil 04 gäller senare, när fler bygger.)
- Du pausar **aldrig** vid "är det här säkert för riktiga användare" — det finns inga.
- Granskningssteg och människa-i-loopen som planen beskriver styr hur den **färdiga plattformen** behandlar riktiga insamlingar. Det är inte byggsteg du ska vänta på.

## Vad du ändå alltid gör — inte över-försiktighet, bara att bygga rent

- **Verifiera före varje push.** `npm run build` grönt + stegets "Klar när"-lista uppfylld. Trasig kod pushas aldrig till `main`.
- **Ett steg i taget, i ordning.** Bygg inte vidare ovanpå ett overifierat steg — fel fortplantar sig.
- **Databasändringar bara via migrationer.** Numrerade, idempotenta.
- **Hemligheter aldrig i git.** `.env.local` är gitignorad — håll det så. Inga nycklar i koden.
- **Databassäkerheten är icke-förhandlingsbar.** Följ `../Supabase/SAKERHETSREGLER.md` vid varje databasändring — RLS på varje tabell, `service_role` aldrig i klienten, `SECURITY DEFINER` bara i `private`-schema, Security Advisor grön före push. Det är specen, inte en checkpoint.

## Arbetsloopen

För varje steg i byggsekvensen:

1. Bygg steget enligt planen (`../2-Byggplan/` + rätt modul i `../1-Planering/`).
2. Verifiera — `npm run build` + stegets "Klar när"-lista.
3. Commita och pusha till `main` med ett tydligt meddelande.
4. Uppdatera `SESSION-GOAL.md`.
5. Gå **direkt vidare** till nästa steg. Stanna inte för