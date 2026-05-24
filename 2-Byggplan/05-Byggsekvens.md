# 05 — Byggsekvens

**Datum:** 2026-05-23
**Vad detta är:** De numrerade byggstegen. Claude Code kör dem **i ordning, ett i taget**. Varje steg pekar tillbaka till rätt modul i `1-Planering/` (vad som ska byggas) och rätt fil i `2-Byggplan/` (hur).

Läs `00-Byggplan-oversikt.md` först — teknikval och byggfilosofi gäller varje steg här.

> **Läs även `1-Planering/Tillägg-Nya-beslut-2026-05-23.md`.** Det innehåller nyare
> beslut som ändrar eller utökar modulerna (bl.a. återbetalningsmodellen för Steg 5–7,
> Swish-bekräftelse, superadmin/admin-federation). Säger tillägget och en modultext
> olika — tillägget vinner.

---

## Så läses ett steg

Varje steg har: **Mål** · **Bygger** (vilka moduler) · **Förutsätter** (vilka steg före) · **Plan-referens** · **Klar när** (en checklista som måste vara grön innan nästa steg börjar).

Ett steg ≈ en arbetsorder för Claude Code. Stora steg kan delas i en egen detaljerad brief när de körs — den här filen är masterlistan.

---

## Bygg-grupp A — plattformen fungerar och är trygg

### Steg 0 — Fundament
**Mål:** Tomt men deployande skelett.
**Bygger:** Ingen modul — infrastrukturen.
**Förutsätter:** —
**Plan-referens:** Fil 04 (Repo & kodstruktur).
**Klar när:**
- [ ] GitHub-repot skapat (privat), mappstruktur enligt fil 04.
- [ ] Next.js-app + Tailwind igång lokalt.
- [ ] Supabase-projekt skapat, kopplat.
- [ ] OpenNext Cloudflare-adaptern inkopplad; Cloudflare Pages kopplat till repot — appen deployar grönt.
- [ ] Miljövariabler + `.env.example` på plats, inga hemligheter i git.

### Steg 1 — Databasens grund
**Mål:** Kärnschemat finns, säkrat.
**Bygger:** Datamodellen för M1–M8.
**Förutsätter:** Steg 0.
**Plan-referens:** Fil 01 (Databasplan), M1.
**Klar när:**
- [ ] Migration(er) skapar enums + kärntabeller (profiles, kategori, insamling, media, mottagare, donation, granskning m.fl.).
- [ ] RLS aktiv på varje tabell.
- [ ] `mission`-tabell + nullbart `mission_id` finns (reserverat).
- [ ] TypeScript-typer auto-genererade.

### Steg 2 — Auth & roller
**Mål:** Inloggning och behörighet som inte går att förfalska.
**Bygger:** M6 (auth-delen).
**Förutsätter:** Steg 1.
**Plan-referens:** Fil 03, M6.
**Klar när:**
- [ ] Supabase Auth igång för inloggade roller.
- [ ] Roll lagras serverside (roller-tabell, RLS-skyddad), slås upp serverside.
- [ ] Behörighetsmatrisen från M6 respekteras av RLS.
- [ ] Auth-skalet är förberett så BankID-verifiering (Zivars parallella spår) kan slottas in.

### Steg 3 — Insamlings-objektet & insamlar-flödet
**Mål:** En insamlare kan skapa och skicka in en insamling.
**Bygger:** M1, M2.
**Förutsätter:** Steg 2.
**Plan-referens:** M1 (objektet + livscykel), M2 (wizard), Fil 01.
**Klar när:**
- [ ] Skapande-wizarden fungerar, sparar utkast.
- [ ] Tillståndsmaskinen (M1 Block 3) styr status — klienten kan aldrig sätta status fritt.
- [ ] En insamlare kan skicka in ett utkast till granskning.

### Steg 4 — Granskar-flödet
**Mål:** En granskare kan godkänna eller avvisa.
**Bygger:** M3.
**Förutsätter:** Steg 3.
**Plan-referens:** M3, M8 (regelboken granskaren tillämpar).
**Klar när:**
- [ ] Granskningskö + granskningsvy fungerar.
- [ ] Beslut (godkänn / avvisa / ändringsbegäran) med motivering, allt loggat.
- [ ] Insamlingen byter tillstånd korrekt vid beslut.

### Steg 5 — Stripe Connect & pengaplumbing
**Mål:** Pengar kan flöda — tekniskt verifierat.
**Bygger:** M5.
**Förutsätter:** Steg 3 (insamlingen finns).
**Plan-referens:** Fil 02 (Stripe & pengaflöde), M5.
**Klar när:**
- [ ] Insamlaren kan onboarda sitt Stripe Connect-konto.
- [ ] PaymentIntent skapas enligt "separate charges and transfers".
- [ ] Webhook-Edge-Function tar emot events, signaturverifierad, idempotent.
- [ ] En testbetalning speglas korrekt i databasen.

### Steg 6 — Donator-flödet & realtidsräknaren
**Mål:** "Klick, klick, skickat" — och räknaren rör sig live.
**Bygger:** M4.
**Förutsätter:** Steg 5.
**Plan-referens:** Fil 03 (donationsflöde + realtid), M4.
**Klar när:**
- [ ] En gäst kan donera utan konto — Payment Element, inget login.
- [ ] Kvitto skickas (Resend).
- [ ] Insamlingens insamlade belopp ökar i realtid för alla som tittar (Supabase Realtime).

### Steg 7 — Transparens-loopen
**Mål:** Bevis stänger loopen.
**Bygger:** M7.
**Förutsätter:** Steg 6.
**Plan-referens:** M7.
**Klar när:**
- [ ] De tre obligatoriska bevisen (start / utbetalning / resultat) kan laddas upp.
- [ ] Utbetalning (transfer till insamlaren) sker vid deadline.
- [ ] Badge tilldelas automatiskt när loopen stängs.

> **Slut Bygg-grupp A.** Plattformen fungerar hela vägen: skapa → granska → publicera → donera → bevisa → utbetala. Trygg och fungerande.

---

## Bygg-grupp B — trovärdig och levande

### Steg 8 — Profiler & användarsidor
**Bygger:** M9. **Förutsätter:** Steg 7. **Plan-referens:** M9.
**Klar när:** publik profil med insamlingar, utmärkelser och transparens-historik fungerar.

### Steg 9 — Listning, sökning & discovery
**Bygger:** M11. **Förutsätter:** Steg 3. **Plan-referens:** M11.
**Klar när:** startflöde, sök och filter fungerar; insamlingar är indexerbara med delningskort.

### Steg 10 — Notiser & kommunikation
**Bygger:** M15. **Förutsätter:** Steg 6. **Plan-referens:** M15.
**Klar när:** transaktionella notiser och opt-in-notiser skickas via rätt kanaler.

---

## Bygg-grupp C — en värld

### Steg 11 — Organisationer, katalog & collab
**Bygger:** M10. **Plan-referens:** M10.

### Steg 12 — Karta & geografisk insikt
**Bygger:** M12. **Plan-referens:** M12.

### Steg 13 — Community & samtal
**Bygger:** M13. **Plan-referens:** M13.

### Steg 14 — Events & platsinfo
**Bygger:** M14. **Plan-referens:** M14.

### Steg 15 — Admin & dashboard
**Bygger:** M16. **Plan-referens:** M16.
**Klar när:** drift, statistik och larm-vy fungerar — det som håller plattformen 95 % självgående.

### Steg 16 — Team & intern arbetsyta
**Bygger:** M17. **Förutsätter:** Steg 2 (auth), 4 (granskning), 15 (drift). **Plan-referens:** M17.
**Klar när:** teamet kan logga in i en samlad arbetsyta, roller styr vad var och en ser, onboarding/offboarding fungerar — och ingen har direkt databasåtkomst.

### Steg 17 — Plattformsstyrning & federation
**Mål:** Regionala admins kan dela granskning och support — plattformen blir inte en flaskhals.
**Bygger:** M18.
**Förutsätter:** Steg 4 (granskning), 15 (admin/drift), 16 (team).
**Plan-referens:** M18, `1-Planering/Tillägg-Nya-beslut-2026-05-23.md` B1.
**Klar när:**
- [ ] Tre admin-nivåer (superadmin / region-admin / medhjälpare), RLS-skyddade.
- [ ] Granskning kan region-scopas — en regions insamlingar hamnar i regionens kö.
- [ ] Skydden på plats (M8 som måttstock, överklagande-väg, stickprov, andra-granskning).
- [ ] Subdomäner `superadmin.` / `admin.sadaqahsweden.se`.

### Steg 18 — Innehåll & FAQ
**Mål:** Publikt informationsinnehåll + FAQ, superadmin-redigerbart.
**Bygger:** M19.
**Förutsätter:** Steg 15 (admin). De juridiska sidorna (Villkor, Integritet) kan byggas tidigare — de behövs före skarp lansering.
**Plan-referens:** M19, `1-Planering/Tillägg-Nya-beslut-2026-05-23.md` B2.
**Klar när:**
- [ ] Footer-sidorna finns med riktigt innehåll — ingen död länk.
- [ ] CMS-light: superadmin kan lägga till/ändra redigerbart innehåll live.
- [ ] FAQ-ytan fungerar.
- [ ] Juridiska sidor (Villkor, Integritet) på plats.

---

## Parallellt spår — BankID

BankID-verifieringen av insamlaren (Zivars eget spår) löper **parallellt**, inte som ett numrerat steg. Den ansluter till auth-skalet från **Steg 2** så snart brokeravtalet finns. Se fil 03. Tills dess kan en insamlare ha en provisorisk verifieringsstatus — men ingen utbetalning sker till en overifierad insamlare.

---

## Vad som inte är byggsteg

`Beredskapsplan.md` (bank-, betal- och incidentberedskap) och föreningsregistreringen är **operativa spår** — de byggs inte i kod, men ska vara på plats. Bankkonton och brokeravtal behövs innan Steg 5–6 kan gå skarpt.

---

## Rollout

Vilka steg som faktiskt **lanseras för riktiga användare**, och i vilken ordning, står i `06-Rollout-plan.md`. Byggordning ≠ lanseringsordning.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första byggsekvensen. 16 steg i tre bygg-grupper + parallellt BankID-spår. |
| 1.1 | 2026-05-23 | Steg 16 (Team & intern arbetsyta, M17) tillagt — 17 steg. |
| 1.2 | 2026-05-24 | Steg 17 (M18 Plattformsstyrning & federation) och Steg 18 (M19 Innehåll & FAQ) tillagda — 19 steg. Pekare till Tillägg-Nya-beslut tillagd. |
