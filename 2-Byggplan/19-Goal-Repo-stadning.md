# 19 — Goal: Städa repo-trädet

**Datum:** 2026-05-24
**Typ:** Autonom uppgift för Claude Code — körs via `/goal`.
**Vad detta är:** Repo-trädet har ~59 oincheckade ändringar — planeringsdokument,
goal-briefs och dokumentation som aldrig committats, plus lite genererat skräp.
Den här uppgiften gör trädet rent. Ingen kod, ingen migration.

---

## Uppdraget

Få `git status` rent — ett tydligt commit, pushat till `main`.

## Steg

1. **Index först.** Felar `git status` (oläsbart/korrupt index) — bygg om
   indexet från HEAD innan något annat.

2. **Verifiera arbetskopian.** Innan du stagear något: kontrollera att inga
   `5-Kod/`-källfiler är trunkerade i arbetskopian (jämför mot HEAD — t.ex.
   `app/globals.css` ska vara ~430 rader). Är någon fil stympad — återställ den
   från HEAD. **Committa aldrig en trunkerad fil.**

3. **Utöka `.gitignore`** (repo-roten) — lägg till:
   - `.claude/` — lokala Claude Code-inställningar, ska inte versionshanteras.
   - `.playwright-mcp/` — genererade Playwright-artefakter (skräp).

4. **Sluta spåra lokalfilen.** `.claude/settings.local.json` är redan trackad:
   `git rm --cached .claude/settings.local.json` (filen ligger kvar på disk,
   slutar bara följa med i git).

5. **Radera skräpet.** Ta bort `.playwright-mcp/`-mappens `page-*.yml`-filer.

6. **Commita allt övrigt** — planeringsdokumenten (`1-Planering/`,
   `2-Byggplan/`, `4-Bakgrund/`, `handoff-to-code/`, rotens `.md`-filer,
   `5-Kod/CLAUDE.md` m.fl.). Ett commit:
   `chore: committa planering, briefs och dokumentation; ignorera lokala filer`.

7. **Pusha** till `main`.

## Klar när

- [ ] `.gitignore` ignorerar `.claude/` och `.playwright-mcp/`.
- [ ] `.claude/settings.local.json` är inte längre trackad.
- [ ] Inga trunkerade filer committade.
- [ ] `git status` är rent — noll oincheckade ändringar.
- [ ] Pushad till `main`.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-05-24 | Repo-städning — committa planering/briefs/dokumentation (~59 filer), ignorera `.claude/` + `.playwright-mcp/`, sluta tracka `settings.local.json`. |
