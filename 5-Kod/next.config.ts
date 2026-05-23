import type { NextConfig } from "next";

// Sadaqah Sweden körs som en FULL Next.js-app (SSR) — inte statisk export.
// SSR krävs för SEO, Supabase-auth, server components mot databasen och OpenNext.
// Hosting: Cloudflare Pages via OpenNext-adaptern (@opennextjs/cloudflare).
// OpenNext-adapterns konfiguration kopplas in i Steg 0 — se 2-Byggplan/05-Byggsekvens.md.
// Sätt ALDRIG output: "export" här.
const nextConfig: NextConfig = {};

export default nextConfig;
