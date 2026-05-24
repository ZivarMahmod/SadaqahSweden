# 16 — Goal: Buggfix — rubriker ligger ovanpå texten

**Datum:** 2026-05-24
**Typ:** Autonom byggorder för Claude Code — körs via `/goal`.
**Vad detta är:** En fokuserad buggfix. En CSS-klasskrock gör att alla
display-rubriker renderas **ovanpå** brödtexten under dem — hela sajten, live.
En rotorsak, ~178 förekomster.

---

## Buggen

Display-rubriker (`<h1>`/`<h2>`/`<h3>` med stor serif-text) renderas ovanpå
innehållet direkt under dem — två lager text på varandra, oläsbart. Syns på
**hela live-sajten** (startsidans "Granskningslöftet"-sektion, katalogen
"Föreningar & moskéer", insamlingar, admin-ytorna — överallt).

**Rotorsak (verifierad mot byggd CSS).** `app/globals.css` definierar
typografiklasserna `.h-1`, `.h-2`, `.h-3`. Men `h-1`/`h-2`/`h-3` är **också
Tailwind v4:s inbyggda `height`-utilities** (`height: 0.25rem / 0.5rem /
0.75rem` = 4/8/12 px). Båda selektorerna är `.h-1` — **identisk specificitet**.
Per CSS-property vinner sista regeln i källordning. Den egna regeln sätter
`font-size`/`line-height` men **aldrig `height`** — så Tailwinds `height: 4px`
står kvar.

Resultat på varje `<h1 className="h-1">`: ~64 px text i en **4 px hög** låda.
Texten svämmar över; nästa syskon (`<p>`, `<ul>`, kort) läggs bara 4–12 px under
rubrikens överkant → rubriken hamnar ovanpå brödtexten.

**Regression.** Infördes i commit `4d3b944` ("design: Fas A+B — port
designsystem"). Federationsarbetet (Steg 17, F1–GX3) är **oskyldigt** — rör inte
detta.

**Omfattning:** ~178 användningar — ca 35× `h-1`, 31× `h-2`, 112× `h-3` — över
hela appen (publika sidor, `(intern)/admin`, `(intern)/granskning`, `(auth)`,
`(konto)`).

---

## Uppdraget

Fixa rotorsaken — en gång, rent — så buggen försvinner överallt. Commita och
pusha (`fix: rubrik-överlapp — döp om typografiklasser`).

---

## Autonomi-regler

Du fattar alla tekniska val själv. `npm run build` grön före push. Ingen
migration (ren frontend-fix). Verifiera resultatet (se Klar när).

---

## Steg

1. **Återställ trunkerade arbetsfiler först.** `app/globals.css` och
   `app/layout.tsx` ligger fysiskt trunkerade i arbetskopian (en lokal
   sync-skada, separat från överlapp-buggen). Återställ dem från git
   (`git show HEAD:5-Kod/app/globals.css` etc.) innan något annat — annars
   bygger du mot stympade filer.

2. **Döp om typografiklasserna så krocken försvinner.** Byt `.h-1`/`.h-2`/`.h-3`
   till namn som **inte** kan kollidera med någon Tailwind-utility. Riktmärke:
   `.heading-1`/`.heading-2`/`.heading-3` (tydligt icke-Tailwind). Verifiera mot
   Tailwind v4:s utility-namn att det valda namnet är fritt.
   - Uppdatera klassdefinitionerna i `app/globals.css`.
   - Uppdatera **varje användning** i alla `.tsx`-filer.

3. **Var noga vid omdöpningen.** `h-1`/`h-2`/`h-3` förekommer i `className` ofta
   tillsammans med andra klasser (t.ex. `className="h-1 mt-3"`). Byt bara de
   förekomster som är **typografi** (på rubrik-/display-element). Finns någon
   genuin Tailwind-`h-1`-höjd-användning (en 4 px hög spacer e.d.) — rör den
   inte. Gå igenom träffarna, byt rätt.

4. **Verifiera att inget typografi-`h-N` är kvar** som fortfarande krockar.

---

## Klar när

- [ ] `app/globals.css` + `app/layout.tsx` är hela (inte trunkerade).
- [ ] Typografiklasserna är omdöpta; inget namn krockar med en Tailwind-utility.
- [ ] Varje typografi-användning i `.tsx` använder det nya namnet.
- [ ] Display-rubriker renderas i full höjd — ingen rubrik ligger ovanpå
      brödtexten. Verifiera på minst: startsidan ("Granskningslöftet"),
      `/foreningar`, en insamlingssida, en admin-sida.
- [ ] `npm run build` grön.
- [ ] Pushad.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Buggfix: typografiklasserna `.h-1/.h-2/.h-3` krockar med Tailwind v4:s `height`-utilities → rubriker får 4 px höjd och hamnar ovanpå brödtexten på hela sajten. Regression från commit `4d3b944`. Fix: döp om typografiklasserna; återställ trunkerade `globals.css`/`layout.tsx` först. |
