# 18 — Goal: Förenkla till en admin-subdomän

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** En liten, fristående uppgift — slå ihop plattformens två
admin-subdomäner till en. Ingen migration, ren frontend + config.

---

## Utgångsläge

- Plattformen har idag två admin-subdomäner: `admin.sadaqahsweden.se` och
  `superadmin.sadaqahsweden.se` (byggt i Steg 17 F6).
- Beslut (Zivar, 2026-05-24): det ska vara **en**. Subdomänen är en ingång,
  inte en säkerhetsgräns — `admin_niva` + RLS avgör allt. Två subdomäner tillför
  noll säkerhet och noll funktion, bara en extra DNS-post och förvirring.
- M18 7.4 är redan uppdaterad till en-subdomän-modellen.

## Uppdraget

Slå ihop till en admin-subdomän. `admin.sadaqahsweden.se` behålls för hela
teamet (superadmin, region-admin, medhjälpare). `superadmin.sadaqahsweden.se`
utgår. En commit (`fix: en admin-subdomän`), pushad.

## Autonomi-regler

Alla tekniska val själv, allt via kod/CLI, fråga aldrig droppvis. `npm run build`
grön före push.

## Steg

1. **Synka arbetskopian mot HEAD först** — känd lokal sync-skada; verifiera att
   `5-Kod/app/globals.css` (~430 rader) och `app/layout.tsx` är hela. Bygg
   aldrig mot trunkerade filer.
2. `middleware.ts` + `lib/host.ts`: ta bort `superadmin`-hosttypen. Kvar:
   `publik` + `admin`. Hela teamet loggar in på `admin.sadaqahsweden.se`.
3. **Kritiskt:** varje superadmin-exklusiv funktion (utse/avsätta region-admin,
   refund, nedstängning, överklaganden, stickprov) ska gateas av
   `admin_niva='superadmin'` — i RLS **och** i UI — aldrig av hostnamnet. Hittar
   du en `host === 'superadmin'`-koll som styr en behörighet är det en latent
   bugg; flytta den till `admin_niva`.
4. `wrangler.jsonc`: ta bort `superadmin.sadaqahsweden.se`-routen. Kvar:
   `sadaqahsweden.se`, `www.sadaqahsweden.se`, `admin.sadaqahsweden.se`.
5. Ta bort eller peka om alla kod-referenser till `superadmin.sadaqahsweden.se`.

## Klar när

- [ ] Ingen kod refererar `superadmin.sadaqahsweden.se`; host-typer är `publik`
      + `admin`.
- [ ] Superadmin-funktioner gateas av `admin_niva`, inte host — bevisat.
- [ ] `wrangler.jsonc` har bara de tre domänerna.
- [ ] `npm run build` grön, pushad.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Fristående goal: slå ihop de två admin-subdomänerna till en (`admin.sadaqahsweden.se`; `superadmin.` utgår). Flyttad ut ur brief 17 (var SX6) — Code hade redan fått brief 17 med SX1–SX5. |
