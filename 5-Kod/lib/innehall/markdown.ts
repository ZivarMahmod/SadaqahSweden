// Sadaqah Sweden — M19 Markdown-lager.
// Två lager: write-time validering (allowlist mot HTML/JS) + render-time
// (marked → ren HTML, ingen DOM-lib krävs på edge runtime).
//
// Hård regel (M19 Block 8.2): rå HTML och skript får ALDRIG nå den
// renderade sidan. Block-listan körs vid SKRIV-tillfället — accepterar bara
// klassisk Markdown-syntax. Felmeddelande till superadmin.

import { marked } from "marked";

const FORBIDDEN_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /<\s*[a-zA-Z]/, message: "HTML-taggar är inte tillåtna" },
  { pattern: /<\s*\//, message: "HTML-taggar är inte tillåtna" },
  { pattern: /javascript\s*:/i, message: "javascript: URL är inte tillåtet" },
  { pattern: /\bon[a-z]+\s*=/i, message: "event-handlers (on*) är inte tillåtna" },
  { pattern: /<!--/, message: "HTML-kommentarer är inte tillåtna" },
  { pattern: /data\s*:\s*text\/html/i, message: "data:-URL till HTML är inte tillåtet" },
  { pattern: /\\u00[0-9a-f]{2}/i, message: "JS unicode-escape är inte tillåtet" },
];

export function validateMarkdown(input: string): { ok: true } | { ok: false; reason: string } {
  if (input.length > 50_000) {
    return { ok: false, reason: "Brödtexten är för lång (max 50000 tecken)" };
  }
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(input)) {
      return { ok: false, reason: message };
    }
  }
  return { ok: true };
}

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function renderMarkdown(input: string): string {
  if (!input) return "";
  const v = validateMarkdown(input);
  if (!v.ok) {
    return `<p><em>Innehållet kunde inte renderas: ${escapeHtml(v.reason)}</em></p>`;
  }
  const html = marked.parse(input, { async: false }) as string;
  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
