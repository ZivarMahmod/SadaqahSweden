---
title: "Supabase anon-RLS + SECURITY DEFINER RPC-mönster (Sadaqa)"
date: 2026-05-30
category: conventions
module: supabase-db
problem_type: convention
component: database
severity: high
applies_when:
  - "Skriver en RLS-policy som inkluderar rollen anon"
  - "Bygger en klient-anropbar RPC i public-schemat"
  - "En ny migration bygger PÅ den befintliga live-databasen"
tags: [supabase, rls, security-definer, anon, postgres, migrations]
---

# Supabase anon-RLS + SECURITY DEFINER RPC-mönster (Sadaqa)

## Context

Under backend-bygget av vision-lagret (briefs 31–50, migrationer 0063–0110)
återkom samma klass av fel om och om igen och kostade ~5 korrigerande
migrationer (0089, 0099, 0101 + omtag på 0064/0094/0097/0098). Alla bottnade i
hur Sadaqa-DB:n har låst `private`-schemat och hur strikt-läget för RLS +
SECURITY DEFINER fungerar för `anon`-rollen. Mönstret är icke-uppenbart:
migrationen **applicerar utan fel** men funktionen/policyn failar **vid
anrop** (runtime) eller matchar tyst aldrig — så `apply_migration: success`
och en grön Security Advisor ger falskt lugn. Det här dokumentet gör reglerna
explicita så nästa migration blir rätt på första försöket.

Bakgrund som skapar fällan: `private`-schemat är REVOKE:at från
anon/authenticated (migr 0001/0051/0060). Migr **0050** gav tillbaka USAGE +
EXECUTE till **`authenticated`** — men **aldrig till `anon`**.

## Guidance

**Regel 1 — Klient-RPC, två fall efter vem som anropar:**

- **Endast `authenticated`** → bygg `public` SECURITY **INVOKER**-wrapper som
  anropar en `private` SECURITY **DEFINER**-impl. Linter-rent (varken 0028 eller
  0029-WARN). Fungerar för att `authenticated` har USAGE på `private` (0050).

  ```sql
  CREATE FUNCTION private.gor_x(...) RETURNS ... LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = '' AS $$ ... $$;
  REVOKE EXECUTE ON FUNCTION private.gor_x(...) FROM PUBLIC;
  GRANT  EXECUTE ON FUNCTION private.gor_x(...) TO authenticated;

  CREATE FUNCTION public.gor_x(...) RETURNS ... LANGUAGE sql
    SET search_path = '' AS $$ SELECT private.gor_x(...); $$;   -- INVOKER (default)
  REVOKE EXECUTE ON FUNCTION public.gor_x(...) FROM PUBLIC, anon;
  GRANT  EXECUTE ON FUNCTION public.gor_x(...) TO authenticated;
  ```

- **Anropbar av `anon`** (publika siffror, kvitto-via-token, intag utan konto)
  → bygg **ETT enda `public` SECURITY DEFINER** (ingen wrapper→private).
  Wrapper→private FAILAR för anon vid runtime: `permission denied for schema
  private`. Detta ger en **avsiktlig 0028-WARN** — accepteras.

  ```sql
  CREATE FUNCTION public.publik_siffra(...) RETURNS integer LANGUAGE sql
    STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT count(*) ... $$;
  REVOKE EXECUTE ON FUNCTION public.publik_siffra(...) FROM PUBLIC;
  GRANT  EXECUTE ON FUNCTION public.publik_siffra(...) TO anon, authenticated;
  ```

**Regel 2 — En RLS-policy `TO anon` får ALDRIG anropa en `private.*`-funktion.**
PostgREST evaluerar hela `USING`/`WITH CHECK` som anon-rollen; `anon` saknar
EXECUTE på `private` → `permission denied for function aktuell_roll` och anon
ser då **ingenting**, inte ens raderna policyn skulle släppa. **Dela policyn i
två:** en `TO anon, authenticated` som bara rör tabellens egna kolumner, och en
separat `TO authenticated` som får använda `private.*`.

```sql
-- publik: bara tabellkolumner, INGA private-fn
CREATE POLICY x_publik ON public.x FOR SELECT TO anon, authenticated
  USING (status = 'publicerad');
-- intern: private-fn OK (bara authenticated)
CREATE POLICY x_intern ON public.x FOR SELECT TO authenticated
  USING (private.aktuell_roll() = 'admin' OR private.har_operativ_roll('moderator'));
```

**Regel 3 — Verifiera ALLTID live-schemat före varje migration.** Briefer
skriver engelska namn (campaigns/collectors/donations) men live-DB:n är svensk
(`insamling`, `donation`, `organisation`). Gissa ALDRIG kolumn-/enum-namn — kör
en `information_schema.columns`-query och, för en publik-synlighets-gate,
**läs den befintliga policyns uttryck** (`pg_get_expr(polqual, polrelid)`) och
återanvänd det exakt. Ett textfält accepterar vilket literal som helst →
migrationen "lyckas" med fel värde och matchar tyst aldrig.

## Why This Matters

`apply_migration: success` + grön advisor är INTE bevis på korrekthet för dessa
tre fall:

- plpgsql validerar inte SQL i funktionskroppen vid `CREATE` → en
  kolumn-/schema-referens som inte finns upptäcks först vid anrop.
- En `TO anon`-policy som rör `private.*` failar bara när en anon-klient
  faktiskt läser tabellen — aldrig i en migration, aldrig i advisorn.
- Ett `text`-statusfält tar emot vilket värde som helst → fel literal i en
  policy/RPC blir en tyst korrekthetsbugg (raden matchar aldrig).

Enda pålitliga grinden är **exekverings-bevis**: `set local role anon` (eller
`set role authenticated` + jwt-claim) och faktiskt anropa funktionen / läsa
tabellen och kontrollera returnerade rader. RLS-grindar i hela detta bygge
verifierades så.

## When to Apply

- Varje gång en RLS-policy inkluderar `anon`.
- Varje gång en `public`-RPC ska kunna anropas utan inloggning.
- Före varje migration som rör en befintlig live-tabell (kolumn-/enum-namn).

## Examples

**Fel (0064/0093/0096 första försöket) → permission denied vid anrop:**

```sql
-- anon GRANT:as men wrappern når private → runtime "permission denied for schema private"
CREATE FUNCTION public.stodmedlems_antal() ... LANGUAGE sql
  AS $$ SELECT private.stodmedlems_antal(); $$;   -- INVOKER-wrapper
GRANT EXECUTE ON FUNCTION public.stodmedlems_antal() TO anon;
```

**Rätt (0099-fix) — bevisat med `set local role anon; select ...`:**

```sql
CREATE FUNCTION public.stodmedlems_antal() RETURNS integer LANGUAGE sql
  STABLE SECURITY DEFINER SET search_path = ''
  AS $$ SELECT count(*)::integer FROM public.memberships
        WHERE status IN ('aktiv','gratis_manad'); $$;
GRANT EXECUTE ON FUNCTION public.stodmedlems_antal() TO anon, authenticated;
```

**Fel (0084 fraga_select) → anon fick `permission denied for function aktuell_roll`,
såg 0 publika frågor. Rätt (0089) = split-policy** (`fraga_publik TO anon` utan
private-fn + `fraga_intern TO authenticated`). Bevis: anon såg bara den publika
publicerade raden.

**Fel (0097/0098) → gissade `organisation.status`/`verifierad`/`skapad_av`.
Live har inget av det.** Rätt: läste `organisation_select_publik`-policyns
uttryck → `katalog_status = 'publicerad'`, ägare = `forenings_konto_user_id`.

## Related

- `5-Kod/docs/SAKERHET-FORBUDSLISTA.md` — RPC-wrapper-konventionen + säkerhetsbasens standarder (brief 31)
- `../Supabase/SAKERHETSREGLER.md` — RLS/DEFINER-grundreglerna (icke-förhandlingsbar)
- `2-Byggplan/_rapport-backend.md` — hela backend-bygget 31–50, hårda lärdomar + verifieringsgränser
- Migrationer: 0050 (authenticated får private-USAGE), 0089/0099/0101 (korrigeringarna detta dok generaliserar)
