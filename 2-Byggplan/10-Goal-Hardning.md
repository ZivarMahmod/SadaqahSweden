# 10 — Goal: Härdning efter Steg 12–16

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Den enda ingångspunkten för den här körningen. En **härdnings-
pass** — den stänger luckorna som lämnades öppna under Steg 12–16. Inga nya
byggsteg byggs.

---

## Utgångsläge

- **Steg 0–16 är byggda och pushade.** Bekräfta mot `git log` om du vill.
- Steg 12–16 lämnade några medvetna luckor — de listas och löses här. De är
  dokumenterade i `5-Kod/SESSION-GOAL.md` (avsnitten "Defer" och "Kantfall").
- **Detta är ingen ny byggsekvens.** Steg 17 (federation) och Steg 18 (innehåll
  & FAQ) startas INTE. Bygg bara de fyra härdningspunkterna nedan.

---

## Uppdraget

Bygg **H1–H5** nedan, i ordning. Verifiera varje, commita och pusha till `main`.
Det viktigaste är **H1** — gör den ordentligt, den är säkerhetskritisk.

**Sluta efter H5.** Uppdatera `SESSION-GOAL.md`, sammanfatta, gå inte vidare till
något byggsteg.

---

## Autonomi-regler

Samma som `09-Goal-Steg-12-16.md`: Zivar är inte med. Du fattar alla tekniska val
själv, allt via kod/API/CLI, du frågar aldrig droppvis. Verifiera före push, en
commit per punkt, databasändringar bara via numrerade idempotenta migrationer med
rollback, RLS på varje ny/ändrad tabell, följ `../Supabase/SAKERHETSREGLER.md`,
Security Advisor grön före push.

De få sakerna som faktiskt kräver Zivar är samlade sist — de blockerar inte den
här körningen.

---

## H1 — Riktig 2FA: kontroll vid inloggning, inte bara registrering

**🔴 Säkerhetskritisk. Den viktigaste punkten i körningen.**

**Problemet.** Steg 16 byggde 2FA-*registrering* men inte 2FA-*kontroll vid
inloggning*. `totp_aktiverad` är en permanent flagga som sätts en gång efter
enroll. När den är satt loggar teammedlemmen sedan in med **bara lösenord** —
authenticator-appen efterfrågas aldrig igen. Stulet lösenord = full team-åtkomst.
Det är inte "obligatorisk 2FA", det är "2FA en gång".

**Kravet.** För team-konton (roll `granskare`/`admin`) måste 2FA-koden
**efterfrågas och verifieras vid varje ny inloggning / session**. Ett giltigt
lösenord utan giltig 2FA-kod får aldrig ge åtkomst till en skyddad intern route
eller ett intern-RPC.

**Beslut — så bygger du det.**

- **Använd Supabase Auth inbyggda MFA (TOTP-faktorer).** Den är purpose-built:
  hanterar enroll → challenge → verify, och lyfter sessionens AAL
  (Authenticator Assurance Level) till `aal2` i JWT:n. Då kan du kräva `aal2`
  i middleware och i RLS — riktig enforcement, inte en flagga.
- **Bygg om** den nuvarande egna `totp_secret`-tabellen + `otpauth`-enrollen till
  Supabase MFA. **Inga teammedlemmar finns än** — ombyggnaden kostar ingenting
  nu, och blir dyr senare. Gör den nu.
- Om du efter att ha provat finner att inbyggd MFA genuint inte fungerar med
  resten av stacken: fallback är en per-session `totp_verifierad_at` som
  challenge:as vid varje login. Inbyggd MFA är förstahandsvalet.
- **Stäng även enforcement-hålet** som Steg 16 noterade: i dag sitter kontrollen
  bara i `kraver()` (Server Component-render), så ett direkt RPC-anrop kan kringgå
  den. Med inbyggd MFA: kräv `aal2` i middleware/proxy **och** i RLS-policys för
  de interna tabellerna, så det inte finns någon väg runt.
- **Ingen återvändsgränd.** En teammedlem som tappar sin authenticator får inte
  bli permanent utelåst. Bygg en ren återställningsväg — en admin kan nollställa
  en medlems MFA-faktor (via Supabase Admin API), eller recovery-koder. Du väljer
  formen; kravet är att utelåsning alltid går att lösa utan databasingrepp.

**Klar när:**
- [ ] Ett team-konto kan inte logga in i den interna arbetsytan, eller nå någon
      skyddad intern route eller intern-RPC, utan att ange en giltig 2FA-kod.
- [ ] Kontrollen går inte att kringgå via direkt RPC-anrop (aal2 krävs i
      middleware *och* RLS).
- [ ] En utelåst teammedlem kan återställas rent, utan databasingrepp.
- [ ] Test som bevisar: lösenord-utan-kod nekas; lösenord-med-kod släpps in.
- [ ] `npm run build` grön, Security Advisor grön, pushad.

---

## H2 — Refund-verktyg i admin

**Problemet.** M16 Block 4.1 listar "Initiera refund" som ett kärnverktyg. Steg
15 lade bara enum-värdet `admin_ingrepp_typ='initiera_refund'` — ingen RPC, ingen
UI, inget Stripe-anrop.

**Kravet.** En admin kan från verktygslådan återbetala **en donation eller alla
donationer på en insamling**. Idempotent. Med ett **bekräftelsesteg i klartext**
(M16 Block 4.3 — "Detta refunderar N donationer för X kr. Går inte att ångra.").
Varje refund loggas i `admin_ingreppslogg` i samma transaktion.

**Kontext — läs `02-Stripe-pengaflode.md`, M5 och `Tillägg-Nya-beslut`-A1.**

- Återbetalning är ett **undantag**, inte rutin — bara vid bedrägeri eller fel
  (Tillägg A1). Verktyget speglar det: det är en admin-åtgärd, inte ett
  donator-flöde.
- Pengaflödet är "separate charges and transfers". Har medel redan transfererats
  till insamlaren eller betalats ut — reversera transfern där Stripe tillåter
  det; där det inte går, återbetala så långt det går och flagga resten som en
  manuell åtgärd i ingreppsloggen ("i den mån det går", A1). Du kan
  pengaplumbingen sedan Steg 5–7 — bygg det som den arkitekturen tillåter.

**Klar när:**
- [ ] Admin kan trigga refund (en eller alla) från verktygslådan.
- [ ] Bekräftelsesteg i klartext före verkställande.
- [ ] Idempotent — dubbelklick eller omkörning ger inte dubbla refunds.
- [ ] Loggas i `admin_ingreppslogg`.
- [ ] Testat i Stripe testläge mot testdatan som finns kvar i remote-DB.
- [ ] `npm run build` grön, pushad.

---

## H3 — `skyddad_identitet`-flagga på användarprofilen

**Problemet.** M12 Block 5.3 säger: en insamlare med skyddad identitet får
**aldrig** räknas på kommunnivå på kartan. Fältet finns inte — `geo_aggregat`
kan inte hedra regeln i dag.

**Kravet.**
- Lägg `skyddad_identitet boolean NOT NULL DEFAULT false` på `profiles`.
- Skydda fältet i `profiles_skydda_falt`-triggern — bara admin/service_role får
  sätta det, aldrig användaren själv (samma mönster som federation-flaggorna).
- Wire in i `rakna_om_geo_aggregat`: en insamlare med `skyddad_identitet=true`
  exkluderas från kommunnivå men **räknas fortfarande på regionnivå** (M12
  Block 5.3 — 21 län är grova nog).
- Ge admin en väg att sätta flaggan (egen liten RPC, eller via det befintliga
  överrida-fält-verktyget — du väljer).

**Klar när:**
- [ ] Kolumnen finns, skyddad i `profiles_skydda_falt`.
- [ ] `geo_aggregat` exkluderar skyddade insamlare på kommunnivå, behåller dem på
      regionnivå.
- [ ] Admin kan sätta flaggan via arbetsytan.
- [ ] `npm run build` grön, Security Advisor grön, pushad.

---

## H4 — Hård offboarding: släck sessionen direkt

**Problemet.** `admin_inaktivera_team_medlem` sänker rollen och sätter
`team_inaktiverad_at`, men en redan inloggad person behåller sin session tills
nästa request renderar `kraver()`. Offboarding ska vara omedelbar.

**Kravet.** När en teammedlem inaktiveras ska deras aktiva session **dödas
direkt** — via Supabase Auth Admin API:s sign-out för den användaren, som en del
av offboarding-flödet.

**Klar när:**
- [ ] En inaktiverad teammedlems aktiva session upphör omedelbart, inte vid nästa
      request.
- [ ] Test som bevisar det.
- [ ] `npm run build` grön, pushad.

---

## H5 — Bootstrap: ett riktigt admin-konto

**Problemet.** Ingen profil i databasen har rollen `admin`. `admin@corevo.se` är
`granskare`, `zivar.mahmod@corevo.se` är `insamlare`. Den interna ytans **fulla
admin-vy** — pengaflödespanelen, refund-verktyget (H2), teamhanteringen — kräver
roll `admin`. Det första admin-kontot kan inte skapas via team-invite-flödet
(en invite kräver en admin som skickar den — chicken-and-egg).

**Kravet.** En **numrerad seed-migration** (inte en handpatch på prod) som ger
plattformen sitt första admin-konto:

- Uppgradera `admin@corevo.se` från `granskare` till `admin`. Det är redan det
  interna test-/team-kontot.
- **Rör inte `zivar.mahmod@corevo.se`** — det är ett `insamlare`-konto och ska
  förbli det (M17 Block 1: team-identitet hålls skild från privat donator-/
  insamlare-konto).
- Migrationen sätter `roll` i `service_role`-/`SECURITY DEFINER`-kontext så
  `profiles_skydda_falt`-triggern släpper igenom den (triggern tillåter
  `admin`/`service_role`).
- Efter H1: kontot behöver 2FA-enroll vid första inloggning — förväntat och rätt.

**Klar när:**
- [ ] `admin@corevo.se` har roll `admin`, satt via en numrerad migration i git.
- [ ] `zivar.mahmod@corevo.se` är oförändrat `insamlare`.
- [ ] Hela admin-vyn (`/admin`, alla fyra paneler + verktygslådan) öppnas för
      det kontot.
- [ ] Pushad.

---

## Batchade uppföljningar — kräver Zivar, blockerar inte den här körningen

1. **Leaked password protection** — slå på i Supabase dashboard
   (Authentication → Password security). Pre-existerande Security Advisor-WARN.
2. **`RESEND_API_KEY`** — sätt i miljön. Låser upp e-postkanalen: kvitton, den
   dagliga sammanfattningen (Steg 15), community-notiser via e-post.
3. **Karta-basemap till produktion** — byt från OpenFreeMap till självhostad
   Protomaps PMTiles på Cloudflare R2. Konfig-punkt: `BASEMAP_STYLE_URL` i
   `app/(public)/karta/karta-klient.tsx`.
4. **Team-e-post** — Cloudflare Email Routing för `namn@sadaqahsweden.se`.

Lista det du faktiskt stöter på i `SESSION-GOAL.md` under en tydlig rubrik.

---

## När du är klar

Uppdatera `SESSION-GOAL.md` (markera H1–H5, notera vad du valde och ev. nya
uppföljningar), sammanfatta körningen, **stoppa**. Starta inget byggsteg —
Steg 17 och 18 planeras separat med Zivar.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Härdningspass efter Steg 12–16: riktig 2FA-kontroll vid login (H1), refund-verktyg (H2), skyddad_identitet-flagga (H3), hård offboarding (H4). |
| 1.1 | 2026-05-24 | H5 tillagd — bootstrap av plattformens första admin-konto (`admin@corevo.se` → `admin` via seed-migration). |
