# Skolan — fillagring (uppskjuten till backend-instansen)

**Status: uppskjuten.** Det här klient-bygget (`bygg/skola-klient`) skriver INGEN
databas, INGA migrationer och INGEN Storage-konfiguration — backend (tabeller, RLS,
buckets, signerade URL:er) ägs av en annan instans (se `57-MASTER-Parallell-bygg.md`,
lager-split: rutorna 2 & 3 skriver inga migrationer).

Det fulla Storage-kontraktet är redan specat och ska byggas av backend-instansen,
inte här:

- Privat Supabase Storage-bucket **`skola`** (`public = false`).
- Sökväg: `skola/{class_id}/{assignment_id}/{profil_id}/{filnamn}` för inlämningar,
  `skola/material/{larare_profil_id}/{filnamn}` för lärarmaterial.
- Läsning via **signerad URL** (kort TTL) genom en SECURITY DEFINER-RPC som speglar
  tabell-RLS (eleven/läraren/gruppen). Aldrig publik bucket.

Detaljerna finns i `2-Byggplan/56b-Skolan-Teknisk-underlag.md` §1. När backend
landar byts klient-byggets mock-källor (`lib/skola/mock.ts`) mot riktiga queries +
signerade URL:er — UI:t behöver ingen ombyggnad.

> I klient-bygget hanteras filer lokalt i webbläsaren (PDF öppnas lokalt,
> Excalidraw-scen sparas i localStorage). Inget laddas upp någonstans.
