// Sadaqah Sweden — M19 Markdown-lager.
// Två lager (SX1 — Steg 18-fixar):
//   1. Write-time validering — allowlist mot uppenbara HTML/JS-försök.
//      Ger superadmin ett vänligt felmeddelande.
//   2. Render-time DOM-sanering — den vattentäta grinden. Saniteras med
//      sanitize-html (pure JS, edge-safe — använder htmlparser2 internt).
//      Rå HTML/JS når aldrig dangerouslySetInnerHTML, oavsett vad som tog
//      sig förbi lager 1.
//
// Hård regel (M19 Block 8.2): rå HTML och skript får aldrig nå den
// renderade sidan. SX1 byter den tidigare regex-blocklistan mot en
// riktig sanerare för render-vägen.

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const FORBIDDEN_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /<\s*[a-zA-Z]/, message: "HTML-taggar är inte tillåtna" },
  { pattern: /<\s*\//, message: "HTML-taggar är inte tillåtna" },
  { pattern: /javascript\s*:/i, message: "javascript: URL är inte tillåtet" },
  { pattern: /\bon[a-z]+\s*=/i, message: "event-handlers (on*) är inte tillåtna" },
  { pattern: /<!--/, message: "HTML-kommentarer är inte tillåtna" },
  { pattern: /data\s*:\s*text\/html/i, message: "data:-URL till HTML är inte tillåtet" },
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

// Strikt allowlist — endast strukturella Markdown-element. Inga inline
// stylings, inga skript-attribut, inga rå-iframes.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "strong", "em", "u", "s", "del", "ins",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote",
    "a",
    "code", "pre",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel", "target"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href"],
  disallowedTagsMode: "discard",
  // Tvinga säkra länkattribut.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
  },
};

export function renderMarkdown(input: string): string {
  if (!input) return "";
  const v = validateMarkdown(input);
  if (!v.ok) {
    return `<p><em>Innehållet kunde inte renderas: ${escapeHtml(v.reason)}</em></p>`;
  }
  const rawHtml = marked.parse(input, { async: false }) as string;
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
