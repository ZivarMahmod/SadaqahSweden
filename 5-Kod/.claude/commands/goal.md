---
description: Sätt ett mål och arbeta autonomt mot det — bygg, verifiera, pusha till main, utan att vänta på Zivar.
---

# /goal — autonomt byggläge

Du går nu in i **autonomt byggläge**. Zivar är borta. Ditt jobb: bygg så mycket som möjligt, verifiera, och pusha till `main` — utan att vänta på honom.

## Målet

$ARGUMENTS

Om inget mål står ovanför är målet: **bygg så många steg som möjligt av `../2-Byggplan/05-Byggsekvens.md`, i ordning, verifiera varje, pusha till `main`.**

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
- **Säkerheten byggs in enligt planen** (RLS m.m.). Det är specen, inte en checkpoint.

## Arbetsloopen

För varje steg i byggsekvensen:

1. Bygg steget enligt planen (`../2-Byggplan/` + rätt modul i `../1-Planering/`).
2. Verifiera — `npm run build` + stegets "Klar när"-lista.
3. Commita och pusha till `main` med ett tydligt meddelande.
4. Uppdatera `SESSION-GOAL.md`.
5. Gå **direkt vidare** till nästa steg. Stanna inte för att fråga.

Fortsätt loopen tills du får slut på definierat arbete, slår i en äkta blockerare, eller når kontextgränsen.

## Hard stops — du noterar och går vidare, du väntar aldrig tyst

- **Saknad nyckel/credential** (Stripe, BankID-broker, ev. Supabase): bygg allt som *inte* kräver den, notera det blockerade i `SESSION-GOAL.md`, gå vidare till nästa byggbara sak.
- **Ett steg går inte att verifiera** trots rimliga försök: notera felet tydligt, hoppa till ett oberoende steg om sådant finns, annars stanna med full statusrapport.
- **Slut på arbete eller kontextgränsen nås:** uppdatera `SESSION-GOAL.md` till en komplett statusbild och stanna.

## Beslut

Lämnar planen en lucka: fatta det rimligaste beslutet utifrån planens principer, notera det i `SESSION-GOAL.md`, fortsätt. Du stannar inte för att fråga Zivar.

## SESSION-GOAL.md — mall

```
# SESSION-GOAL

**Mål:** [målet]
**Uppdaterad:** [datum + tid]

## Steg-status
- [x] Steg 0 — Fundament — KLART, pushad
- [ ] Steg 1 — Databas — pågår
- [ ] Steg 2 — ...

## Byggt denna session
- [en kort rad per avklarat steg, med commit-referens]

## Blockerat — väntar på Zivar
- [t.ex. "Steg 5 Stripe — saknar STRIPE_SECRET_KEY i .env.local"]

## Beslut jag fattade
- [beslut + en rad varför]

## Nästa
- [vad nästa session / Zivar behöver veta för att fortsätta]
```

Lämna alltid `SESSION-GOAL.md` i ett tillstånd där Zivar på 30 sekunder ser vad som är byggt, vad som är blockerat och vad som är nästa.
