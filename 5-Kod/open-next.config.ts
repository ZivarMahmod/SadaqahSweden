import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sadaqah Sweden — OpenNext-konfiguration för Cloudflare Workers.
// Minimal config tills R2 incremental cache kopplas in (kräver R2-bucket).
// Lägg till `incrementalCache: r2IncrementalCache` när R2-bindingen finns.
export default defineCloudflareConfig({});
