# 07 — Förutsättningar & gap-analys

**Datum:** 2026-05-23
**Vad detta är:** Vad som finns på plats, vad som saknas, och vägen till något verkligt på domänen ikväll. Läs `00-Byggplan-oversikt.md` för stacken.

---

## 1. Vad som finns (Zivars förutsättningar)

| Sak | Status | Not |
|---|---|---|
| **Domän** | ✅ `sadaqahsweden.se` köpt | Bekräfta exakt stavning |
| **GitHub-repo** | ✅ `sadaqahsweden` skapat | Privat, redo — men tomt |
| **Supabase-projekt** | ✅ `sadaqahsweden` skapat | Free tier — se §3 |
| **Planering** | ✅ Komplett | `1-Planering/` + `2-Byggplan/` |
| **Kod-scaffold** | ✅ Klar | Landningssida i `5-Kod/` |

---

## 2. Vad som saknas — och vad det blockerar

| Saknas | Blockerar | Brådska |
|---|---|---|
| **Cloudflare Pages-projekt** | Att deploya / visa något på domänen | 🟢 Zivar sätter upp det |
| **Supabase env-värden** i `.env.local` | Steg 1 (databas) och framåt | 🟡 Behövs för Steg 1 |
| **DNS → Cloudflare Pages** | Att `sadaqahsweden.se` visar sidan | 🟡 Efter deploy |
| **Stripe-konto** | Steg 5 (pengaflöde) | 🟢 Inte ikväll |
| **Resend-konto** | Steg 6 (e-post) | 🟢 Inte ikväll |
| **BankID-broker-avtal** | Skarp verifiering av insamlare | 🟢 Parallellt spår |
| **Registrerad förening** | Skarp drift med riktiga pengar | 🟢 Innan Fas 0-pilot |

**Viktigt:** gapen är **konton och nycklar — inte planering.** Själva planen har inga blockerande luckor. Claude Code kan starta Steg 0–1 direkt.

---

## 3. Supabase free tier — en flagga

Free tier räcker gott för utveckling, men: den **pausar projektet efter ca en veckas inaktivitet** och har begränsad kapacitet. Det är inget problem nu. Men **innan skarp lansering (rollout Fas 1)** bör projektet uppgraderas till Pro (ca 25 USD/mån) så det aldrig pausas mitt i en insamling. Lägg in det i `Beredskapsplan.md`-ekonomin.

---

## 4. Vägen till något verkligt ikväll

Målet ikväll: landningssidan live på Cloudflare Pages. Ingen databas, inga nycklar krävs för det.

1. **Kör appen lokalt.** I `5-Kod/`: `npm install` (några minuter), sedan `npm run dev` → öppna `localhost:3000`. Du ser landningssidan.
2. **Verifiera bygget.** `npm run build` — ska gå igenom grönt.
3. **Koppla in Cloudflare-adaptern.** Claude Code lägger till OpenNext-adaptern (`@opennextjs/cloudflare`) och konfigurerar bygget för Cloudflare. Detta är en del av Steg 0 — se `CLAUDE.md` och `00-Byggplan-oversikt.md`.
4. **Koppla till GitHub.** I `5-Kod/`: `git init`, commit allt, lägg till `sadaqahsweden`-repot som remote, `git push`.
5. **Cloudflare Pages.** Koppla `sadaqahsweden`-repot till ditt Cloudflare Pages-projekt och sätt byggkommandot för OpenNext (Claude Code ger dig exakt kommando). Cloudflare bygger och deployar — du får en adress som funkar direkt.
6. **Koppla domänen.** Lägg till `sadaqahsweden.se` i Cloudflare Pages-projektet och peka DNS:en dit.

> Claude Code gör steg 1–4 åt dig i terminalen. Steg 5–6 gör du i Cloudflare — du är redan i gång med Pages-uppsättningen.

**Viktig ordning:** låt Claude Code koppla in OpenNext-adaptern (steg 3) *innan* Cloudflare bygger repot — annars försöker Cloudflare bygga en vanlig Next.js-app och det blir fel.

---

## 5. Checklista innan skarp drift (riktiga pengar)

Inte ikväll — men innan rollout Fas 0/1 (se `06-Rollout-plan.md`):

- [ ] Föreningen registrerad, organisationsnummer (se `3-Foreningsdokument/`)
- [ ] Bankkonton hos minst två banker (se `Beredskapsplan.md`)
- [ ] Stripe Connect-konto, verifierat
- [ ] BankID-broker-avtal på plats
- [ ] Supabase uppgraderad till Pro
- [ ] Resend-konto för e-post
- [ ] Användarvillkor granskade av jurist (M8)
- [ ] Incidentplan genomläst med styrelsen (`Beredskapsplan.md`)

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-23 | Förutsättningar, gap-analys, väg till live-landningssida, checklista före skarp drift. |
