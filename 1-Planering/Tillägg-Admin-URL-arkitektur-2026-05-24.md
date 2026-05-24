# Tillägg — Admin URL-arkitektur (2026-05-24)

**Vad detta är:** Beslut om hur admin-flöden (superadmin, region-admin, region-helper) bor i URL-strukturen. Reviderar `Tillägg-Nya-beslut-2026-05-23.md` punkt B1 där det stod att superadmin och admin skulle bo på egna subdomäner. **Detta dokument vinner över B1's subdomän-formulering.**

**Bakgrund:** B1 introducerade tre admin-nivåer (superadmin / region-admin / region-helper) och nämnde `superadmin.sadaqahsweden.se` + `admin.sadaqahsweden.se` utan motivering. Memory-beslutet samma datum sa motsatsen: `/admin` som subpath på `sadaqahsweden.se`. Konflikten löstes 2026-05-24 efter genomgång.

---

## Beslut

Admin-flöden för **alla tre nivåer** bor som **subpath på `sadaqahsweden.se`**, inte på subdomäner.

- **Superadmin (Zivar):** `sadaqahsweden.se/superadmin`
- **Region-admin (moské per region):** `sadaqahsweden.se/admin`
- **Region-helper:** delar `/admin`-ytan, begränsad av roll
- **Team (M17 intern arbetsyta):** `sadaqahsweden.se/team`
- **Granskning (M3):** redan på `sadaqahsweden.se/granskning` (delad mellan granskare och admin)

Allt under route-grupp `(intern)/` i Next.js — speglar `04-Repo-och-kodstruktur.md`.

---

## Varför inte subdomäner

Federation kräver inte subdomäner. De påstådda fördelarna gäller inte plattformen som den ser ut nu:

| Argument för subdomän | Bedömning |
|---|---|
| "Federation kräver det" | Falskt. Region-scope = RLS på rader, inte hostname. Tre admin-nivåer = roll-baserad routing. |
| Cookie-isolation mot XSS på publik sajt | Marginalvinst. RLS region-scopear redan; worst case är angriparen agerar som en region-admin i sin region. Inte kaskad. |
| Worker-route-policy (IP-allowlist, WAF) | Subpath löser det via path-matching. Subdomän skulle göra det aningen lättare — inte värt arkitektur-skiftet. |
| Region-branding (Göteborgs moské egen vy) | Tillägg B1 levererar bara *en* delad `admin.`-subdomän för alla region-admins. Argumentet bortfaller. |
| Visuell signal i URL-fält | Kosmetiskt. `/superadmin` i path är lika tydligt som `superadmin.` i host. |
| Wildcard-cert/DNS-kostnad | Cloudflare gör detta gratis. Inte ett argument för någon sida. |

Kostnaden för subdomäner som inte återbetalas:

- Auth-cookies kräver `Domain=.sadaqahsweden.se` + `SameSite`-omsorg för att fungera över subdomäner. Komplexitet utan motsvarande vinst.
- En extra deploy-yta att underhålla i framtiden om det visar sig vara fel.

---

## Hur de tre nivåerna skiljs åt

Inte via URL — via **roll + UI + RLS**:

| Nivå | Roll-värde | UI-yta | RLS-scope |
|---|---|---|---|
| Superadmin | `roll = "superadmin"` | `/superadmin` — ser allt över alla regioner | `bypass` på admin-tabeller, full insyn |
| Region-admin | `roll = "admin"` + `region_id` | `/admin` — bara sin regions kö och data | RLS filtrerar på `region_id` |
| Region-helper | `roll = "admin_helper"` + `region_id` + `parent_admin_id` | `/admin` — begränsad meny, inga slutgiltiga beslut | RLS filtrerar på `region_id`, write begränsat |
| Team (M17) | `roll = "team"` | `/team` — intern arbetsyta, ingen granskning | egen scope |

Roll-skydd i databasen via RLS är säkerhets-spärren. Frontend-routing är UX, inte säkerhet (`04-Repo-och-kodstruktur.md` §4 sista raden).

---

## Datamodell-konsekvenser

Inga nya krav utöver de som redan står i `Tillägg-Nya-beslut-2026-05-23.md` under "Datamodell-flaggor":

- `roll` på användare utökas: `besokare`, `donator`, `insamlare`, `forening`, `granskare`, `admin_helper`, `admin`, `superadmin`, `team`.
- `region_id` på användare när rollen är `admin` eller `admin_helper`.
- `parent_admin_id` på `admin_helper` (vem den hör till).
- `insamlar_region` på `insamling` (finns redan, säkerställ ifyllnad).

Migrationer för federationen byggs i Bygg-grupp C (efter Steg 16). Förberedande fält reserveras nu om de saknas (en migration tidigare).

---

## Senare uttag (om hotbilden ändras)

Subdomän kan flyttas in senare utan att data ändras. Vad som skulle krävas:

1. Lägga `admin.sadaqahsweden.se` som custom_domain i Cloudflare → samma Worker.
2. Worker-route som mappar host → samma Next.js-app, med en host-header som flaggar "admin-läge".
3. Auth-cookies behåller `Domain=.sadaqahsweden.se` så sessioner fungerar.
4. UI gömmer publika sektioner på admin-hosten.

Detta är två-tre dagars jobb om det behövs. Ingen ombyggnad. Subpath-beslutet stänger inte dörren — det väljer bara default.

Triggers som skulle motivera uttaget:

- Bekräftad XSS-incident på publika sidor som hotar admin-cookies (efter incident-respons + härdning).
- Krav på mTLS / IP-allowlist som bara ska gälla admin (subdomän gör Worker-rule-attachment renare).
- Branding-krav från regionala moskéer som vill ha egen URL.

---

## Konsekvenser för befintliga dokument

| Dokument | Ändring |
|---|---|
| `Tillägg-Nya-beslut-2026-05-23.md` §B1 | Subdomäner `superadmin.sadaqahsweden.se` + `admin.sadaqahsweden.se` ersätts av subpath `/superadmin` + `/admin`. B1's övriga innehåll (tre nivåer, region-admins, BankID-krav, skydd mot missbruk) gäller oförändrat. |
| `2-Byggplan/04-Repo-och-kodstruktur.md` §2 | Route-grupp `(intern)/` matchar redan beslutet — `(intern)/admin/`, `(intern)/team/`, `(intern)/granskning/`. Lägg till `(intern)/superadmin/` när M18 byggs. Ingen ändring behövs nu. |
| `1-Planering/Modul-16-Admin-och-dashboard.md` | Inget om subdomän skrivet där. Inga uppdateringar krävs. |
| `1-Planering/Modul-18-Plattformsstyrning-och-federation.md` | Om det refererar subdomäner — uppdatera till subpath. |

---

## Beslutslogg

| Beslut | Motivering |
|---|---|
| **Subpath för alla admin-nivåer** | Federation kräver det inte tekniskt. Memory har stated reasoning (kostnad, enkelhet, roll-skydd räcker). Tillägg B1 hade ingen motivering för subdomän. Memory vinner. |
| **`/superadmin` separat path från `/admin`** | Tydlig URL-stämpel på vilken nivå man är på. Audit-spår blir lättare. Ingen extra kostnad jämfört med `/admin` med roll-gating. |
| **Region-helper delar `/admin` med region-admin** | Helper är en delmängd av admin. Egen path skulle vara overengineering. UI begränsar via roll. |
| **Subdomän som senare uttag, inte default** | Stäng inte dörren. Om hotbilden ändras kan subdomän läggas till utan ombyggnad. |

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Första versionen. Reviderar `Tillägg-Nya-beslut-2026-05-23.md` punkt B1 — subdomäner utgår, subpath är default för alla tre admin-nivåer. |
