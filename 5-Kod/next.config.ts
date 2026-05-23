import type { NextConfig } from "next";

// Sadaqah Sweden körs som en FULL Next.js-app (SSR) — inte statisk export.
// SSR krävs för SEO, Supabase-auth, server components mot databasen och OpenNext.
// Hosting: Cloudflare Workers via OpenNext-adaptern (@opennextjs/cloudflare).
// Sätt ALDRIG output: "export" här.
const nextConfig: NextConfig = {};

export default nextConfig;

// Aktivera Cloudflare-bindings under `next dev` så Worker-resurser kan användas
// från server-kod lokalt. Krävs av adaptern för bindings i dev-läge.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
