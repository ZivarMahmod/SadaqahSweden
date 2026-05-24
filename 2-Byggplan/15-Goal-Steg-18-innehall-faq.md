# 15 — Goal: Steg 18 (Innehåll & FAQ — systemet, M19)

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Den enda ingångspunkten för den här körningen. Steg 18 bygger
**M19 — Innehåll & FAQ**. Det sista byggsteget. Läs den här filen först.

**Du bygger SYSTEMET — inte innehållet.** Det är hela poängen med den här
körningen. Se den hårda regeln nedan.

---

## Utgångsläge

- **Steg 0–17 är byggda, verifierade och pushade** (inkl. fix-passen FX + GX).
- **Den här körningen = Steg 18 = M19.** Sista byggsteget. Efter den är
  plattformen kodfärdig.
- Plan-referens: `../1-Planering/Modul-19-Innehall-och-FAQ.md` (Block 1–8) är
  *vad* som ska byggas. Den här briefen säger *hur* och löser in Zivars beslut
  om verifieringslager och lärd-granskning. Säger M19 och briefen olika —
  **briefen vinner.**
- `5-Kod/SESSION-GOAL.md` är aktuell statusfil — uppdatera den.

---

## 🔴 HÅRD REGEL — Code skriver inget sidinnehåll

Den här körningen bygger **innehållssystemet och tomrummen**. Den fyller dem inte.

- **Code skriver INGEN sidtext** — varken religiös, juridisk eller annan prosa.
  Plattformens röst är Zivars; de religiösa texterna är de lärdas; de juridiska
  är juristens.
- Varje footer-sida skapas som en **tom stub**: rätt slug, titel, sidtyp, status
  `kommer_snart`. Ingen brödtext.
- **Religiöst substantiella sidor** (Sadaqa & Zakat, Granskningen, "Kan jag samla
  in?"-guiden, religiösa FAQ-svar) får dessutom `verifieringsstatus =
  behöver_lärd` — de kan inte publiceras förrän en lärd fyllt och verifierat dem.
- **Juridiska sidor** (Villkor, Integritet) skapas som stubs med `sidtyp =
  juridisk`; texten är juristens (batchad uppföljning).
- Bygg systemet så att tomrummen är tydliga och säkra. Zivar och de lärda fyller
  innehållet efteråt — via det superadmin-verktyg du bygger i S2.

Detta är Zivars uttryckliga beslut: ingen overifierad religiös info får ut. Bryt
inte mot det genom att "hjälpa till" med utkasttext.

---

## Uppdraget

Bygg **S1–S8** nedan, i ordning. Verifiera varje, commita och pusha
(`feat(s1)`…`feat(s8)`). En commit per S-punkt.

**Sluta efter S8.** Uppdatera `SESSION-GOAL.md`, sammanfatta. Steg 18 är sista
byggsteget — efter den finns inget nästa steg att starta.

---

## Autonomi-regler

Samma som tidigare briefer: alla tekniska val själv, allt via kod/migration/API/
CLI, fråga aldrig droppvis. Migrationer numrerade, idempotenta, med rollback,
**applicerade under sitt numrerade repo-namn**. RLS på varje ny tabell. Följ
`../Supabase/SAKERHETSREGLER.md`. `npm run build` + Security Advisor grön före
varje push. Mänskliga steg batchas sist.

---

## Beslut som redan är fattade — stanna inte för dessa

- **Verifieringslager (Zivars beslut).** Utöver M19:s `status`-fält
  (`utkast`/`kommer_snart`/`publicerad`) får varje innehållsobjekt ett
  **`verifieringsstatus`**: `ej_tillämpligt` (ej religiöst) · `behöver_lärd` ·
  `verifierad`. Regel: ett objekt med `behöver_lärd` kan **inte** sättas till
  `publicerad`. Bara `ej_tillämpligt` eller `verifierad` får publiceras.
- **Verifierat innehåll pekar på en lärd-profil.** `verifierad`-objekt bär
  `verifierad_av` (FK → lärd-profil, S5) + `verifierad_datum`. Publika sidan
  visar ett "verifierad av [namn]"-märke som länkar till profilen.
- **Lås.** Varje innehållsobjekt har `låst boolean`. Låst innehåll kan inte
  redigeras — bara superadmin kan låsa upp. Skyddar fastställd, verifierad text
  från att pillas på.
- **M19:s öppna frågor:** brödtextformat → Markdown (enklast, säkrast,
  saniterat). Fri FAQ-sökning → bygg en enkel sökruta direkt. Övriga öppna
  frågor (juridisk text, personuppgiftsansvarig) → batchade, blockerar inte.
- **Format-säkerhet:** brödtext är Markdown, saniterad. Rå HTML/JS når aldrig en
  renderad sida (M19 Block 8.2 — icke-förhandlingsbart).

---

## Steg 0 — Synka arbetskopian (gör först, före S1)

Arbetskopian har varit osynkad mot HEAD: `5-Kod/app/globals.css` och
`5-Kod/app/layout.tsx` har legat fysiskt trunkerade på disk medan HEAD-versionen
är hel (globals.css ska vara ~430 rader). Buggfix-passet (brief 16) ombads
åtgärda detta men hoppade över det — gör inte om det misstaget.

- Synka working tree mot HEAD så de matchar (`git restore .` / `git checkout`).
  Trunkeringen är korruption, inte riktiga ändringar — HEAD är det rätta läget.
- Verifiera att `5-Kod/app/globals.css` är hel (~430 rader) och `app/layout.tsx`
  hel **innan du rör något**.
- Felar `git status` med korrupt index — bygg om indexet från HEAD.
- **Bygg eller committa aldrig mot en trunkerad fil.** Får du inte arbetskopian
  hel — stanna och rapportera, fortsätt inte till S1.

## S1 — Datamodell: innehåll, FAQ, verifiering

**Mål:** Tabellerna för innehållssidor, FAQ-poster och verifieringslagret.

**Plan-referens:** M19 Block 1.2, 4.2; beslut ovan.

**Bygg:**
- `innehallssida` — fält enligt M19 Block 1.2 (slug, titel, brödtext, sidtyp
  `informativ`/`juridisk`, status, senast_ändrad + vem, ikraftträdandedatum för
  juridiska) **plus** `verifieringsstatus`, `verifierad_av`, `verifierad_datum`,
  `låst`.
- `faq_post` — fält enligt M19 Block 4.2 (fråga, svar, kategori, ordning,
  status, senast_ändrad) **plus** samma verifieringsfält + `låst`.
- Enums för status och verifieringsstatus.
- RLS: publik läsväg når **bara** `publicerad`-innehåll — aldrig utkast,
  aldrig redigeringsfält. Skrivåtkomst enligt S3.
- Constraint/trigger: `behöver_lärd` → kan inte bli `publicerad`.

**Klar när:** tabeller + enums + RLS finns; publik roll kan inte läsa utkast;
publiceringsspärren för `behöver_lärd` bevisad med test; `npm run build` grön;
pushad.

## S2 — CMS-light: superadmins redigeringsyta

**Mål:** Superadmin skapar och redigerar sidor + FAQ-poster live, utan deploy.

**Plan-referens:** M19 Block 3.

**Bygg:** en redigeringsyta inne i `superadmin.sadaqahsweden.se` — skapa/ändra
innehållssida och FAQ-post, Markdown-editor (saniterad), spara som utkast,
publicera, avpublicera. Status- och verifieringsstatus-hantering. Juridiska
sidor (`sidtyp=juridisk`) följer Block 7:s versioneringsflöde (S8).

**Klar när:** superadmin kan skapa/redigera/publicera/avpublicera innehåll;
Markdown saniteras (ingen rå HTML/JS renderas — bevisat); `npm run build` grön;
pushad.

## S3 — Granulära redigeringsrättigheter + lås

**Mål:** Superadmin kan ge specifika konton redigeringsrätt; låst innehåll går
inte att pilla på.

**Plan-referens:** Zivars beslut; M19 Block 3.2, 8.2.

**Bygg:**
- Default: bara superadmin redigerar innehåll. Superadmin kan **bevilja
  innehålls-redigeringsrätt till specifika konton** (en behörighet ovanpå
  M6/M18:s rollmodell — inte en ny roll, en beviljad förmåga). Beviljas och
  återkallas av superadmin.
- **Lås:** ett `låst` innehållsobjekt kan inte redigeras av någon — bara
  superadmin kan låsa upp. Verifierad, fastställd text låses så den inte ändras
  av misstag.
- RLS + RPC-guards enforcar både rättigheten och låset på databasnivå — inte
  bara i UI.

**Klar när:** superadmin kan bevilja/återkalla redigeringsrätt; ett låst objekt
kan inte ändras av ett beviljat konto (RLS bevisar det); test för rättighet +
lås; `npm run build` grön; pushad.

## S4 — Ändringslogg

**Mål:** Full spårbarhet på allt innehåll.

**Plan-referens:** Zivars beslut; M19 Block 7.2.

**Bygg:** en **append-only ändringslogg** — varje skapande, ändring,
publicering, av-/påpublicering, låsning, verifiering av en sida eller FAQ-post
loggas med vem, när och vad. Logg-raden kan aldrig redigeras eller raderas.
Superadmin kan läsa loggen per objekt och samlat.

**Klar när:** varje innehållsändring ger en oföränderlig logg-rad; superadmin
kan läsa historiken; test bevisar append-only; `npm run build` grön; pushad.

## S5 — Lärd-profiler & verifierat-märke

**Mål:** Lärda/talesmän finns som profiler; verifierat innehåll pekar på dem.

**Plan-referens:** Zivars beslut.

**Bygg:**
- **Lärd-profil** — en profiltyp på plattformen för en lärd / betrodd talesman.
  Namn, presentation, **valfria** kontaktuppgifter (opt-in — får aldrig vara
  obligatoriskt). En lärd-profil kan kopplas till ett konto på plattformen.
- **Verifierat-märke:** ett `verifierad`-innehållsobjekt visar publikt ett
  "verifierad av [namn]"-märke som länkar till den lärdes profil.
- **Likabehandling, inbyggt:** lärd-profiler särbehandlas inte efter inriktning
  (sunni/shia/m.fl.) — ingen rangordning, ingen inriktnings-flagga som styr
  synlighet. Alla lärda visas i samma struktur, neutralt.
- Bygg **strukturen** — profiltypen, kopplingen, märket. Vilka faktiska personer
  som blir lärd-profiler, och deras texter, är Zivars sak senare (batchad).

**Klar när:** lärd-profiler kan skapas (av superadmin); ett verifierat
innehållsobjekt visar märket länkat till rätt profil; kontaktuppgifter är
opt-in; RLS på nya tabeller; `npm run build` grön; pushad.

## S6 — Publika innehållssidor + funktions-grinden

**Mål:** De tio footer-sidorna finns — som stubs — och ingen länk är död.

**Plan-referens:** M19 Block 1, 6.

**Bygg:**
- Skapa alla tio footer-sidor (M19 Block 1.1) som **tomma innehålls-stubs** —
  rätt slug, titel, sidtyp, status `kommer_snart`. De religiöst substantiella
  (Sadaqa & Zakat, Granskningen, "Kan jag samla in?"-guiden) får
  `verifieringsstatus = behöver_lärd`. **Ingen brödtext skrivs av dig.**
- Publik rendering: en `publicerad`-sida renderar sitt innehåll (server-side,
  edge-cachad); en `kommer_snart`-sida renderar den lugna platshållaren (M19
  Block 6.2 — titel, vänlig text, väg vidare, plattformens ton).
- Funktions-grinden: varje footer-länk leder alltid någonstans meningsfullt —
  aldrig en död länk, aldrig en 404.
- Validera footern mot innehållskartan: varje footer-länk har en innehållssida.

**Klar när:** alla tio sidor finns som stubs; footern har noll döda länkar;
`kommer_snart`-platshållaren renderas lugnt; publicerade sidor renderar
innehåll; `npm run build` grön; pushad.

## S7 — FAQ-ytan

**Mål:** Den strukturerade publika fråga/svar-ytan.

**Plan-referens:** M19 Block 4.

**Bygg:** en publik FAQ-sida — poster grupperade i kategorier (M19 Block 4.3),
ordningsbara, en enkel sökruta. En post utan färdigt svar (`utkast`) syns aldrig
publikt. Religiösa FAQ-svar skapas som `behöver_lärd` om de seedas alls — annars
lämnas FAQ:n tom för Zivar att fylla. **Skriv inga FAQ-svar.**

**Klar når:** FAQ-ytan renderar publicerade poster per kategori med sökruta;
utkast/`behöver_lärd` läcker aldrig; `npm run build` grön; pushad.

## S8 — Juridiska sidorna: behållare & versionering

**Mål:** Villkor och Integritet har ett disciplinerat hem — texten kommer från
jurist.

**Plan-referens:** M19 Block 7.

**Bygg:**
- Villkor och Integritet som `sidtyp = juridisk`-stubs.
- **Versionering:** varje publicerad version av en juridisk sida sparas (kastas
  aldrig); `ikraftträdandedatum` per version; en äldre version går att visa.
- Juridiska sidor kan **inte** fritt-redigeras live — de följer
  versioneringsflödet (M19 Block 7.3). `sidtyp=juridisk` är grinden.
- **Skriv ingen juridisk text.** Den kommer från en föreningskunnig jurist
  (batchad). Stubsen står som `kommer_snart` tills texten finns.

**Klar när:** Villkor + Integritet finns som juridiska stubs; versionering med
ikraftträdandedatum fungerar; juridiska sidor kan inte fritt-redigeras;
`npm run build` grön; pushad.

---

## Batchade uppföljningar — kräver Zivar/andra, blockerar inte bygget

1. **Allt sidinnehåll** — Zivar (och de lärda) fyller de informativa sidorna,
   FAQ:n och "Kan jag samla in?"-guiden via superadmin-verktyget.
2. **Lärd-granskning** — religiöst substantiellt innehåll måste verifieras av en
   lärd innan det publiceras. Lanseringskrav (se uppdaterad M19).
3. **Juridisk text** — Villkor + Integritet skrivs och granskas av en
   föreningskunnig jurist före skarp lansering. Personuppgiftsansvarig (M8 öppen
   fråga 3) måste fastställas.
4. **Vilka som blir lärd-profiler** — Zivars beslut, känsligt, tas i lugn takt.
5. Kvarvarande sedan tidigare: `RESEND_API_KEY`, leaked-password-toggle, basemap
   till R2, team-e-post, utse region-admins. Se `SESSION-GOAL.md`.

---

## När du är klar

Uppdatera `SESSION-GOAL.md` (markera S1–S8, lista vad som lämnats som tomrum för
Zivar/lärda/jurist), sammanfatta körningen, **stoppa**. Steg 18 är sista
byggsteget — plattformen är kodfärdig. Det som återstår är innehåll, lärd- och
juristgranskning, och lansering.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första goal-briefen för Steg 18 (M19 Innehåll & FAQ). Bygger systemet — S1 datamodell + verifieringslager, S2 CMS-light, S3 granulära rättigheter + lås, S4 ändringslogg, S5 lärd-profiler + verifierat-märke, S6 publika sidor + funktions-grind, S7 FAQ, S8 juridiska sidorna. Hård regel: Code skriver inget sidinnehåll — allt religiöst/juridiskt lämnas som verifierbara tomrum. |
