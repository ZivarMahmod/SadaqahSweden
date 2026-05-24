# 17 — Goal: Fixar efter Steg 18 (härdning)

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** Ett kort härdningspass efter Steg 18. Verifieringen (3 granskare
+ live-DB) hittade ett medel-fel och tre småfel. Inga nya byggsteg.

---

## Utgångsläge

- **Steg 0–18 är byggda, verifierade och pushade.** Plattformen är kodfärdig.
- Steg 18:s **hårda regel hölls** — inget AI-skrivet religiöst eller juridiskt
  innehåll; alla sidor är tomma stubs. Migrations-ledgern är ren (0053–0059,
  numrerade). RLS på alla 46 publika tabeller.
- Verifieringen hittade: 1 medel (Markdown-sanering), 3 små (private-funktions-
  hygien, juridisk redigeringsspärr, test-luckor).
- `5-Kod/SESSION-GOAL.md` är aktuell statusfil — uppdatera den.

---

## Uppdraget

Bygg **SX1–SX5** nedan, i ordning. Verifiera varje, commita och pusha
(`fix(sx1)`…`fix(sx5)`). **Sluta efter SX5.** Uppdatera `SESSION-GOAL.md`.

---

## Autonomi-regler

Samma som tidigare: alla tekniska val själv, allt via kod/migration/API/CLI,
fråga aldrig droppvis. Migrationer numrerade, idempotenta, med rollback,
applicerade under numrerat repo-namn. `npm run build` + Security Advisor grön
före push.

---

## Steg 0 — Synka arbetskopian (gör först)

Arbetskopian är fortfarande osynkad mot HEAD (känd lokal sync-skada — vissa
filer trunkerade på disk, git-indexet kan vara korrupt). HEAD är hel och rätt.

- Synka working tree mot HEAD (`git restore .` / `git checkout`). Verifiera att
  `5-Kod/app/globals.css` (~430 rader) och `app/layout.tsx` är hela.
- Bygg om git-indexet från HEAD om `git status` felar.
- Bygg eller committa aldrig mot en trunkerad fil.

## SX1 — Riktig Markdown-sanering (MEDEL)

**Problemet.** Innehållets brödtext renderas via `marked` rakt in i
`dangerouslySetInnerHTML` (`lib/innehall/markdown.ts`, publik `[slug]/page.tsx`,
admin `[id]/page.tsx`). Enda skyddet är en **regex-blocklista** vid skrivning.
`marked` saniterar inte HTML — en regex-blocklista är svagare än en riktig
DOM-sanerare och kan kringgås (referens-länkar, autolänkar, attribut). Briefen
kallade saneringen "icke-förhandlingsbar". Risken växer när S3 ger fler konton
redigeringsrätt.

**Krav.** Sanera den renderade HTML:en med en **riktig sanerare** — DOMPurify
(`isomorphic-dompurify` fungerar server-side) eller en `rehype-sanitize`-pipeline
— innan den når `dangerouslySetInnerHTML`. Rå HTML/JS får aldrig nå en renderad
sida, oavsett vad som tog sig förbi skriv-valideringen. Behåll gärna
skriv-valideringen som ett första lager, men render-saneringen är den som måste
vara vattentät.

**Klar när:**
- [ ] All innehålls-HTML DOM-saneras vid rendering (publik + admin).
- [ ] Test som bevisar att ett `<script>` / `onerror=` / `javascript:`-försök i
      brödtext inte renderas som körbar kod.
- [ ] `npm run build` grön, pushad.

## SX2 — Stäng `private`-funktioner mot PUBLIC permanent (LÅG)

**Problemet.** 19 `private`-funktioner skapade i Steg 18 har EXECUTE för
`PUBLIC`/`anon` (Postgres standard — `REVOKE EXECUTE FROM PUBLIC` saknades).
**Inte exploaterbart** — `anon` har ingen USAGE på `private`-schemat (GX1:s
vägg håller). Men det är samma SAKERHETSREGLER-avvikelse som återkommit tre
gånger nu. Fixa det permanent.

**Krav.**
- `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;` —
  städa de 19. `GRANT EXECUTE` bara till `authenticated`/`service_role` där
  funktionen genuint behöver det (t.ex. RLS-hjälpare).
- `ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM
  PUBLIC;` — så att **framtida** funktioner i `private` aldrig får
  PUBLIC-grant per default. Det stoppar återfallet en gång för alla.
- Verifiera mot live-DB efteråt: `anon` kan köra **0** `private`-funktioner;
  inloggade flöden opåverkade.

**Klar när:**
- [ ] `anon` har EXECUTE på 0 `private`-funktioner (bevisat med DB-query).
- [ ] `ALTER DEFAULT PRIVILEGES` på plats — framtida funktioner skyddas.
- [ ] Inloggade flöden fungerar — ingen regression. Security Advisor grön.
- [ ] Pushad.

## SX3 — Juridiska sidor: spärra fri redigering (LÅG)

**Problemet.** Juridiska sidor (`sidtyp='juridisk'`) ska bara ändras via
versioneringsflödet (S8), aldrig via S2:s allmänna `innehall_uppdatera`. Det är
inte bekräftat att den allmänna uppdaterings-RPC:n **avvisar** `juridisk`-rader.

**Krav.** Säkerställ att S2:s allmänna innehålls-uppdatering vägrar röra en
`sidtyp='juridisk'`-rad — den vägen är versioneringsflödet (S8). Lägg spärren i
RPC:n (DB-nivå), inte bara i UI. Rätta även den vilseledande kommentaren i
migration 0059:s header (refererar en RPC `juridisk_lista_versioner` som inte
finns).

**Klar när:**
- [ ] `innehall_uppdatera` (eller motsvarande) avvisar `sidtyp='juridisk'`.
- [ ] Test bevisar det.
- [ ] 0059-headern rättad.
- [ ] `npm run build` grön, pushad.

## SX4 — Test-luckor (LÅG)

**Problemet.** Briefen krävde test för S3 (rättighet + lås) och S4 (append-only)
— de saknas.

**Krav.** Skriv testerna, samma stil som `supabase/tests/`:
- S3: ett beviljat icke-superadmin-konto kan redigera innehåll; ett **låst**
  objekt avvisar samma konto.
- S4: UPDATE och DELETE mot `innehall_andringslogg` misslyckas (append-only).

**Klar när:**
- [ ] Testerna finns och passerar.
- [ ] Pushad.

## SX5 — Gör `zivar.mahmod@corevo.se` till superadmin

**Problemet.** Plattformens superadmin-konto är `admin@corevo.se` — men dess
lösenord är borttappat, så Zivar kommer inte in i admin-/superadmin-ytan. Hans
personliga konto, `zivar.mahmod@corevo.se`, kan han logga in på, men det är bara
`insamlare`. Han är därmed utelåst från hela admin-ytan.

**Krav.** Numrerad seed-migration (samma mönster som H5, migration 0039) som
uppgraderar `zivar.mahmod@corevo.se`: `roll` → `admin`, `admin_niva` →
`superadmin`. Sätts i `service_role`/SECURITY DEFINER-kontext så
`profiles_skydda_falt`-triggern släpper igenom. **Rör inte `admin@corevo.se`** —
det blir kvar som superadmin (beredskaps-/reservkonto; dess lösenord kan
återställas separat senare).

**Klar när:**
- [ ] `zivar.mahmod@corevo.se` har `roll='admin'` och `admin_niva='superadmin'`,
      satt via numrerad migration.
- [ ] Kontot når hela superadmin-ytan vid inloggning (2FA-enroll vid första
      inloggningen är förväntat och rätt).
- [ ] `admin@corevo.se` oförändrat.
- [ ] Pushad.

---

## Batchade uppföljningar — oförändrat

Allt sidinnehåll (Zivar), lärd-granskning, juridisk text (jurist), lärd-profiler,
`RESEND_API_KEY`, leaked-password-toggle, basemap till R2, team-e-post, utse
region-admins. Se `SESSION-GOAL.md`.

---

## När du är klar

Uppdatera `SESSION-GOAL.md` (markera SX1–SX4), sammanfatta, **stoppa**. Efter den
här körningen är hela bygget verifierat klart — kvar är bara innehåll,
lärd-/juristgranskning och lansering.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Härdningspass efter Steg 18. SX1 riktig Markdown-sanering (medel), SX2 stäng `private`-funktioner mot PUBLIC permanent (`ALTER DEFAULT PRIVILEGES`), SX3 spärra fri redigering av juridiska sidor, SX4 test-luckor (S3 + S4). |
| 1.1 | 2026-05-24 | SX5 tillagt — uppgradera `zivar.mahmod@corevo.se` till superadmin (eget känt lösenord; `admin@corevo.se`:s lösenord borttappat). Löser Zivars utelåsning ur admin-ytan. |
| 1.2 | 2026-05-24 | SX6 (admin-subdomän-förenkling) flyttad ut till en egen fristående goal — `2-Byggplan/18-Goal-Subdoman-forenkling.md` — eftersom Code redan fått brief 17 med SX1–SX5. Brief 17 förblir SX1–SX5. |
