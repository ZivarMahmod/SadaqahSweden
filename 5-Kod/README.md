# Sadaqah Sweden

Insamlingsplattform för det muslimska samhället i Sverige. Pengarna går direkt till insamlaren via Stripe, 0 % plattformsavgift. Varje projekt granskas mot islamiska principer före publicering.

## Kom igång

```bash
npm install
npm run dev
```

Öppna [localhost:3000](http://localhost:3000).

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Stripe Connect · Cloudflare Workers (OpenNext).

## Projektets dokumentation

Planeringen ligger utanför repot, i systermapparna:

- `../1-Planering/` — plattformens 17 moduler, masterkarta, beredskapsplan.
- `../2-Byggplan/` — teknikval, databasplan, byggsekvens, rollout-plan.
- `CLAUDE.md` — projektbrief och byggprinciper (läs den först).

## Status

Steg 0 inkopplat: Next.js-scaffold + OpenNext Cloudflare-adapter (`wrangler.jsonc`, `open-next.config.ts`, `.dev.vars`). `npm run cf-build` producerar `.open-next/worker.js` grönt. Nästa steg: databasen — se `../2-Byggplan/05-Byggsekvens.md`.
