# Modul 17 — Team & intern arbetsyta

**Lager:** 🔵 Världen runtom *(internt-vänd — som M16)*
**Datum:** 2026-05-23
**Status:** Full djup — alla 5 block spikade
**Bygger på:** `00-Masterkarta.md`, `Modul-06-Identitet-och-auth.md`, `Modul-16-Admin-och-dashboard.md`, `Modul-03-Granskar-flodet.md`

---

## 1. Vad modulen är

Modul 17 är **arbetsytan för teamet som driver Sadaqah Sweden** — Zivar och de vänner som hjälper till på sin fritid. Det är den *interna* sidan av plattformen: en plats man loggar in på, ser vad man ska göra, och gör det.

Den lägger inte till någon publik funktion. Den ordnar **människorna bakom plattformen** — deras konton, roller, vem som gör vad — och ger dem ett samlat verktyg.

**Skillnaden mot M16:** M16 är *driftvyn* (statistik, larm, övervakning). M17 är *arbetsytan och teamet* — själva inloggningen, teamhanteringen, och skalet som M16:s driftvy och M3:s granskningskö visas inuti. M17 omsluter, M16 är en panel i den.

---

## 2. Varför den behövs

Zivar driver det här, och vänner hjälper till på sin fritid. Utan ett rent teamlager uppstår tre problem:

1. **Oklart vem som får göra vad.** En vän som granskar ska inte kunna göra utbetalningsingrepp. Utan roller blir allt eller inget.
2. **Oklart vem som gjorde vad.** När något blev fel måste man kunna se vem som tog beslutet — inte för att skuldbelägga, utan för att lära och rätta.
3. **Frestelsen att peta i databasen direkt.** Det är den farligaste genvägen. M17 stänger den: arbetsytan *är* verktyget, databasen rörs aldrig för hand.

M17 gör teamet organiserat, ansvaret spårbart, och databasen förseglad.

---

## 3. Blocköversikt — 5 block

| Block | Innehåll | Status |
|---|---|---|
| 1 | Teammedlemmar & konton | ✅ Spikad |
| 2 | Roller & vem-gör-vad | ✅ Spikad |
| 3 | Den samlade arbetsytan | ✅ Spikad |
| 4 | Onboarding & offboarding | ✅ Spikad |
| 5 | Säkerhet & gränsen mot databasen | ✅ Spikad |

---

# BLOCK 1 — Teammedlemmar & konton

**Vad blocket är:** vad en teammedlem är och hur ett team-konto finns till.

- **En teammedlem är personal** — inte en vanlig användare. Vanliga användare (donatorer, insamlare) registrerar sig själva. Teammedlemmar gör det aldrig.
- **Inga självregistreringar.** En teammedlem läggs till *medvetet* av en admin (Block 4). Mängden är liten och känd — Zivar plus några betrodda vänner.
- **Ett team-konto har:** namn, kontaktuppgift, en roll (Block 2), en stark inloggning, och en aktiv/inaktiv-status.
- **Stark inloggning, obligatoriskt.** Team-konton är mäktiga — de ska skyddas hårdare än vanliga konton. **BankID** för inloggning, alternativt e-post + obligatorisk tvåfaktor. Detaljerna ärvs från M6.
- **En person = ett konto, team-rollen kan pausas.** En teammedlem har ett enda konto — det blir aldrig två. Vill en teammedlem driva en egen insamling **pausas team-rollen** under tiden: personen agerar då som vanlig insamlare, utan åtkomst till teamets verktyg. När insamlingen är klar **återupptas** rollen. Kontot raderas aldrig, historiken består.

**Kantfall:** En teammedlem som också vill vara insamlare → samma konto, ingen andra inloggning. Team-rollen pausas medan hen driver sin insamling och återupptas efteråt. Granskar-rollen får aldrig granska sin egen insamling (jävsregeln, M3) — pausen är det som håller det rent: en granskare med en pågående egen insamling har ingen aktiv granskar-roll alls.

---

# BLOCK 2 — Roller & vem-gör-vad

**Vad blocket är:** vilka roller teamet har, och hur ansvar blir spårbart.

## 2.1 Rollerna (v1)

Två roller räcker i början. Håll det lenat.

| Roll | Får göra | Får INTE göra |
|---|---|---|
| **Admin** | Allt internt: granska, se drift & statistik (M16), göra manuella ingrepp, lägga till/ta bort teammedlemmar, byta roller | — |
| **Granskare** | Granska insamlingar (M3): se kön, fatta beslut, begära komplettering | Hantera teamet, göra pengaingrepp, se känsliga driftdelar |

- **Admin** = Zivar och kärnan. **Granskare** = vännerna som hjälper till på sin fritid — de flesta börjar här.
- En **tredje, lättare roll** (t.ex. "Support" — kan läsa och svara men inte besluta) är förberedd som framtidsspår, men byggs inte i v1.
- Roller ärvs tekniskt från M6:s rollsystem — lagras serverside, kan aldrig ändras av personen själv.

## 2.2 Vem gjorde vad — spårbarhet

- **Varje konsekvenshandling loggas med vem + när.** Granskningsbeslut (redan i M3:s logg), teamändringar, manuella ingrepp.
- Loggen är **append-only** — kan inte redigeras i efterhand.
- I arbetsytan finns en **aktivitetsvy**: "vad jag gjort" för varje person, och för admin "vad teamet gjort".
- Syftet är inte kontroll uppifrån — det är att svaret på *"vem tog det här beslutet?"* alltid finns, lugnt och tydligt.

---

# BLOCK 3 — Den samlade arbetsytan

**Vad blocket är:** den enda interna platsen teamet loggar in på.

## 3.1 Principen

**En inloggning → en arbetsyta → alla interna verktyg.** Teammedlemmen ska inte jaga länkar eller ha flera konton. Hen loggar in en gång och är hemma.

## 3.2 Vad arbetsytan innehåller

| Yta | Vad den visar | För vem |
|---|---|---|
| **Översikt** | "Din dag" — din granskningskö, vad som väntar på dig | Alla |
| **Granskning** | Granskningskön och granskningsvyn (M3) | Granskare, Admin |
| **Drift & statistik** | Driftöversikt, larm, nyckeltal (M16) | Admin |
| **Team** | Teammedlemmar, roller, onboarding (denna modul) | Admin |
| **Min aktivitet** | Vad just jag har gjort | Alla |

- **Rollmedveten.** En granskare ser granskning + sin aktivitet. En admin ser allt. Ytor man inte har behörighet till syns inte.
- M16:s driftvy och M3:s granskningskö är **paneler inuti** den här arbetsytan — inte separata sajter.

## 3.3 Tonläge

Arbetsytan ska kännas lika omsorgsfull som den publika plattformen — lugn, tydlig, snabb. Teamet jobbar ideellt på sin fritid; verktyget ska inte vara en plåga att öppna. Premium genom omsorg gäller även här.

---

# BLOCK 4 — Onboarding & offboarding

**Vad blocket är:** hur en teammedlem kommer in och hur hen tas bort — rent och fint.

## 4.1 Onboarding

1. En **admin bjuder in** en person (e-postinbjudan).
2. Personen **sätter upp sin inloggning** (BankID / 2FA).
3. Admin **tilldelar en roll** (Granskare eller Admin).
4. Personen **landar i arbetsytan** — ser direkt vad hen kan göra.

Inbjudan är medveten och spårad. Ingen blir teammedlem av misstag.

## 4.2 Offboarding

- En admin **inaktiverar** en teammedlem → åtkomsten upphör omedelbart.
- Personens **tidigare handlingar ligger kvar i loggen** — historik och ansvar bevaras alltid.
- Inga kvarglömda konton. Teamlistan speglar alltid vilka som faktiskt är med.

## 4.3 Princip

Åtkomst ska vara **lätt att ge och lätt att dra tillbaka**. När en vän har en tung period i livet och kliver av ska det gå mjukt — inaktivera, inget drama, historiken kvar. Kliver hen tillbaka senare, återaktivera.

---

# BLOCK 5 — Säkerhet & gränsen mot databasen

**Vad blocket är:** den hårda regeln om att verktyget — inte databasen — är teamets yta.

## 5.1 Ingen rör databasen direkt

**Ingen teammedlem får direkt databasåtkomst. Inte ens admin.** Arbetsytan är det enda verktyget.

- Ingen loggar in i Supabases egen dashboard för att redigera data. Ingen kör SQL för hand.
- **Varför:** en handgjord query kan radera fel sak utan ångra-knapp; den går förbi loggen, så ansvarsspåret bryts; den går förbi reglerna som appen annars upprätthåller (RLS, validering).
- Databasens nycklar (Supabase service-role-nyckeln) lever **bara på servern**, i miljövariabler — de lämnas aldrig ut till en person.
- En teammedlem autentiserar som en användare med en roll. RLS avgör vad hen ser och får göra. Även en admin agerar **genom appen**, aldrig genom databasen.

## 5.2 Arbetsytan är ett samspelat verktyg

Arbetsytan och den publika plattformen delar samma databas under ytan — men teamet ser en *intern vy*, byggd för deras arbete. Det är samma sanning, två fönster. RLS och roller håller fönstren åtskilda.

## 5.3 Inloggningsskydd

- BankID eller obligatorisk tvåfaktor för alla team-konton.
- Sessioner som rör känsliga ingrepp loggas extra.
- Riktmärke: minst **två** admins från start (bus factor — `Beredskapsplan.md`).

## 5.4 E-postkonton för teamet — en driftnotering

Teammedlemmar vill troligen ha adresser som `namn@sadaqahsweden.se`. **Detta är inte plattformskod — det är drift.** Hålls åtskilt från, men i linje med, plattformen.

- **Enkel start:** Cloudflare Email Routing (gratis, ni är redan på Cloudflare) — vidarebefordrar `namn@sadaqahsweden.se` till personens vanliga inkorg.
- **Riktiga brevlådor senare:** Google Workspace eller Zoho Mail, om teamet växer och behöver det.
- Det här byggs inte av Claude Code — det är en uppgift för Zivar. Listas i `Beredskapsplan.md`-anda som en att-göra-punkt.

---

## 5. Designval & motivering

| Beslut | Motivering |
|---|---|
| Egen modul, skild från M16 | M16 är driftvyn (vad händer i plattformen). M17 är teamet och arbetsytan (vilka vi är, vad var och en får göra). Olika frågor. |
| Teammedlemmar registrerar sig aldrig själva | Personal läggs till medvetet. Självregistrering hör till donatorer och insamlare — inte till dem som styr. |
| En person = ett konto, pausbar team-roll | Ett andra konto för samma person är onödig dubblering och splittrar historiken. En team-roll som pausas medan personen driver en egen insamling är renare — allt på ett konto, jäv hanteras av pausen. Zivars beslut 2026-05-24; ersätter den tidigare två-konto-modellen. |
| Två roller i v1 (Admin, Granskare) | Täcker verkligheten — Zivar styr, vänner granskar. Fler roller är komplexitet utan nytta nu. |
| En samlad arbetsyta, rollmedveten | En inloggning, en plats. Teamet jobbar ideellt — verktyget får inte vara rörigt. |
| Ingen direkt databasåtkomst, för någon | Skyddar mot oåterkalleliga misstag, bevarar ansvarsspåret, och håller reglerna (RLS) intakta. Den farligaste genvägen stängs. |
| Append-only aktivitetslogg | "Vem gjorde vad" måste alltid gå att svara på — och svaret får inte kunna ändras. |
| Mjuk offboarding (inaktivera, behåll historik) | Vänner hjälper på fritiden; livet växlar. Att kliva av ska vara odramatiskt, historiken bevarad. |

---

## 6. Kopplingar

**M17 tar in:**
- Roller och behörighet från **M6** — M17 använder M6:s rollsystem, lägger till team-rollerna och team-vyn.
- Granskningskön och granskningsvyn från **M3** — visas som en panel i arbetsytan.
- Driftöversikt, larm och statistik från **M16** — visas som en panel i arbetsytan.

**M17 lämnar ut:**
- Den inloggade arbetsytan som teamet faktiskt arbetar i.
- Teamets aktivitetslogg — vem gjorde vad.
- Behörighetsgränserna som styr vad granskare kontra admin kan göra i alla interna verktyg.

**Hård beroende-flagga:** M17 kan inte byggas före M6 (auth & roller). Den är meningsfull först när M3 (granskning) och M16 (drift) finns att visa i arbetsytan — därför sent i byggsekvensen.

---

## 7. Säkerhet & anti-kaos

- **Databasen är förseglad.** Ingen människa rör den direkt — den enskilt viktigaste regeln i modulen.
- **Roller serverside.** En teammedlem kan inte ge sig själv mer behörighet.
- **Append-only logg.** Ansvarsspåret kan inte suddas.
- **Stark inloggning.** BankID / 2FA — team-konton är mäktiga mål.
- **Omedelbar offboarding.** Åtkomst dras direkt när någon kliver av.
- **Jäv:** en granskare granskar aldrig en insamling hen själv har intresse i (regeln bor i M3 — M17 ser till att rollen respekterar den).
- **Minst två admins** — ingen ensam felpunkt.

## 8. Automatisering

**Självgående:** rollbaserad åtkomst (rätt vyer visas automatiskt), aktivitetsloggning, inaktivering som drar åtkomst direkt, "din dag"-översikten som samlar det som väntar.

**Kräver människa:** att bjuda in och rollsätta en ny teammedlem, att besluta om offboarding. Det ska vara medvetna handlingar — inte automatik.

## 9. Öppna frågor

1. **Tredje rollen ("Support")** — behövs den, och i så fall med exakt vilken behörighet? Parkerad till dess teamet är större.
2. **BankID kontra 2FA** för team-inloggning — vilket blir obligatoriskt? Spikas tillsammans med M6.
3. **E-postlösning** — Cloudflare Email Routing nu, Google Workspace/Zoho senare? Zivars beslut, drift.
4. **Notiser till teamet** (ny ansökan i kön, larm) — kanal och frekvens spikas mot M15.

## 10. Beslutslogg

Se avsnitt 5 (Designval & motivering).

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Första versionen. Ny modul efter att teamlagret identifierats som ett gap. 5 block: teammedlemmar, roller, arbetsyta, onboarding, databasgräns. |
| 1.1 | 2026-05-24 | Block 1 omskriven: en person = ett konto med **pausbar team-roll**, ersätter den tidigare två-konto-modellen. Beslut ur `2-Byggplan/11-Steg-17-federation-utkast.md` avsnitt E; byggs i Steg 17 (se `2-Byggplan/12-Goal-Steg-17-federation.md`, F7). Designval-tabellen uppdaterad. |
