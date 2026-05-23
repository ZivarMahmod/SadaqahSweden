# Sadaqah Sweden — projektbrief för Claude Code

Det här är repot för **Sadaqah Sweden** — en insamlingsplattform för det muslimska samhället i Sverige. Pengarna går direkt till insamlaren via Stripe, 0 % plattformsavgift. Varje projekt granskas mot islamiska principer *före* publicering. Plattformen är islamiskt medveten men icke-sekteristisk.

Läs den här filen först, varje session.

---

## Förutsättningar (vad som finns)

| Sak | Status |
|---|---|
| Domän | `sadaqahsweden.se` — köpt |
| GitHub-repo | `sadaqahsweden` — skapat, redo |
| Supabase-projekt | `sadaqahsweden` — skapat (free tier), väntar på användning |
| Hosting | **Cloudflare Workers + Static Assets** (via OpenNext-adaptern) — Zivar kopplar repot i Cloudflare-dashboarden. *Plan-texten säger Pages, men adaptern `@opennextjs/cloudflare` deployar Workers; Pages-vägen för Next.js är på utfasning. Se SESSION-GOAL.md.* |
| Stripe, Resend, BankID-broker | **Inte uppsatt än** — behövs först längre fram |

Miljövariabler ligger i `.env.local` (skapas från `.env.example`). Landningssidan kräver inga env-värden för att köra.

---

## Var planen finns

Hela plattformen är planerad i detalj **innan** kod. Planerna ligger i systermappar till det här repot (utanför repot, medvetet — kod och planering blandas inte):

- `../1-Planering/` — `00-Masterkarta.md` + 16 moduler + `Beredskapsplan.md`. *Vad* som ska byggas.
- `../2-Byggplan/` — `00`–`06`: teknikval, databasplan, Stripe, BankID, repo-struktur, byggsekvens, rollout. *Hur* det byggs.

**Startpunkt:** `../2-Byggplan/05-Byggsekvens.md` — de numrerade byggstegen. Och `../2-Byggplan/07-Forutsattningar-och-gap.md` — vad som måste ordnas.

Du får gärna skriva egna, mer detaljerade steg-briefer utifrån planen — men följ planen, avvik aldrig tyst, och var alltid tydlig och noggrann.

---

## Stacken

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4** — frontend.
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions.
- **Stripe Connect (Express)** — betalningar.
- **BankID via broker** — verifiering av insamlare (Zivars parallella spår).
- **Cloudflare Workers + Static Assets** — hosting via OpenNext-adaptern, auto-deploy från GitHub (Workers Builds).
- **Resend** — e-post.

Detaljer och motivering: `../2-Byggplan/00-Byggplan-oversikt.md`.

**Next.js på Cloudflare:** appen deployas till **Cloudflare Workers + Static Assets** via OpenNext-adaptern `@opennextjs/cloudflare`. Paketet `next-on-pages` är utfasat — använd det INTE. Adaptern kräver `nodejs_compat`-flaggan och en någorlunda färsk `compatibility_date` (just nu `2025-12-30` i `wrangler.jsonc`). Adapter, `wrangler.jsonc`, `open-next.config.ts` och `.dev.vars` är inkopplade. Bygg lokalt med `npm run cf-build`; preview i Workers-runtime: `npm run preview`; deploy: `npm run deploy`. Verifiera alltid den aktuella metoden på `opennext.js.org/cloudflare` och `developers.cloudflare.com` — det här området ändras snabbt.

---

## Databassäkerhet — icke-förhandlingsbart

Projektets viktigaste tekniska regel. Läs och följ **`../Supabase/SAKERHETSREGLER.md`** vid VARJE databasändring. Djupare referens: `../Supabase/SUPABASE-FALTMANUAL.md`.

Kärnan, kort:

- **RLS på varje tabell** — i samma migration som skapar den. Ingen tabell utan RLS.
- **`service_role`-nyckeln finns bara på servern** — aldrig i klienten, webbläsaren eller git. Klienten får bara anon-nyckeln.
- **`SECURITY DEFINER`-funktioner**: bara i ett `private`-schema, `SET search_path = ''`, explicit REVOKE/GRANT. Default är `SECURITY INVOKER`.
- **Aldrig `user_metadata` i en RLS-policy** — användaren kan skriva det själv. Roll i `app_metadata` / JWT-claims.
- **Security Advisor körs efter varje migrationsomgång** — alla P0-lints gröna, annars pushas inget.

Bakgrund: ett systerprojekt samlade 80+ databashål för att rollhygienen aldrig stramades åt från start. Sadaqah Sweden gör rätt från migration 001.

## Byggprinciper — gäller varje steg

1. **Ett steg i taget.** Följ byggsekvensen. Verifiera innan nästa steg.
2. **En commit per steg.** Liten, läsbar git-historik.
3. **Databasen ändras bara via migrationer** — numrerade, idempotenta, rollback för destruktiva.
4. **RLS på varje tabell, från dag 1.** Säkerhet sitter i databasen — aldrig bara i frontend.
5. **Webhooks är sanningen för pengar.** Aldrig lita på klienten för betalstatus eller behörighet.
6. **Hemligheter i miljövariabler** — aldrig i koden eller git.
7. **Pengar lagras som heltal i öre.** Aldrig float.
8. **Test där det rör pengar och behörighet.**
9. **Följ planeringen.** Ser du ett problem med planen — flagga det, bygg inte runt det tyst.
10. **Kod bor bara här i `5-Kod/`.** Rör aldrig `../1-Planering/` eller `../2-Byggplan/`.

---

## Nuläge

Repot innehåller en **scaffold**: en vanlig Next.js-app med en färdig, publik landningssida (`app/page.tsx`).

**Nästa steg:** Steg 0 i byggsekvensen — verifiera bygget, koppla in Cloudflare-adaptern (OpenNext) och få landningssidan live på Cloudflare Pages. Därefter Steg 1 — databasens grund (`../2-Byggplan/01-Databasplan.md`).

Kodens fulla mappstruktur (mapp per modul m.m.) definieras i `../2-Byggplan/04-Repo-och-kodstruktur.md` — bygg ut den i takt med stegen.

---

## Kommandon

```bash
npm install      # första gången
npm run dev      # utvecklingsserver (localhost:3000)
npm run build    # produktionsbygge — kör detta för att verifiera
```

---

## Autonomt läge — `/goal`

När Zivar är borta: kör `/goal` för att arbeta autonomt — bygg byggsekvensen steg för steg, verifiera, pusha till `main`, vänta inte. Hela operativregeln finns i `.claude/commands/goal.md`.

Plattformen har **inga användare, ingen trafik, ingen data** än. Du bygger fritt och pushar direkt till `main` — men du verifierar **alltid** före push (`npm run build` grönt), och hemligheter hamnar **aldrig** i git.

## Anti-patterns

- Aldrig hoppa över en migration eller ändra databasen för hand.
- Aldrig publicera en tabell utan RLS.
- Aldrig lita på klienten för betalstatus eller roll/behörighet.
- Aldrig lägga en hemlighet i koden eller commita `.env.local`.
- Aldrig avvika från planeringen tyst — flagga först.
