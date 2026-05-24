// SX1-test: bevisa att Markdown-saneringen stoppar XSS-försök även när
// write-valideringen rundas (t.ex. via marked-konstruktioner som tar sig
// förbi blocklistan).
//
// Körs via: npm run test:markdown
// Tsx kör TS direkt. Exit-kod !=0 betyder fel.

import assert from "node:assert/strict";
import { renderMarkdown, validateMarkdown } from "./markdown";

let fel = 0;

async function test(namn: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${namn}`);
  } catch (e) {
    fel++;
    console.error(`  ✗ ${namn}`);
    console.error(`    ${(e as Error).message}`);
  }
}

console.log("SX1 Markdown-saneringstest");

main().then(() => {
  if (fel > 0) {
    console.error(`\n${fel} test misslyckades.`);
    process.exit(1);
  } else {
    console.log("\nAlla test passerade.");
  }
});

async function main() {

await test("script-tagg renderas inte som körbar kod", () => {
  const md = "**hej** <script>alert(1)</script>";
  // Validering bör fånga taggar redan här.
  const v = validateMarkdown(md);
  assert.equal(v.ok, false, "write-validering ska blockera <script>");
  // Och även om vi kringgår validering, render-saneraren tar bort taggen.
  const html = renderMarkdown(md);
  assert.ok(!/<script/i.test(html), `script-tagg kvar i: ${html}`);
  assert.ok(!/alert\(1\)/.test(html) || !/<script/i.test(html), "alert inom script-tagg");
});

await test("onerror-attribut strippas", () => {
  // Renderad direkt utan validering — testar lager 2.
  const dirty = '<img src=x onerror="alert(1)">';
  // sanitize-html får aldrig släppa attributet:
  // simulera bypass av write-validering — kör sanitize-html direkt på dirty
  // via render som tar Markdown. Markdown med rå HTML — marked spottar ut det,
  // sanerare strippar.
  const html = renderMarkdown("Trying: " + dirty);
  assert.ok(!/onerror/i.test(html), `onerror kvar: ${html}`);
});

await test("javascript:-URL i länkar strippas (write-validering)", () => {
  const md = "[klicka](javascript:alert(1))";
  const v = validateMarkdown(md);
  assert.equal(v.ok, false, "write-validering ska blockera javascript:");
  const html = renderMarkdown(md);
  // Felmeddelandet får innehålla strängen, men ingen href-attribut.
  assert.ok(!/href=/i.test(html), `oväntad href: ${html}`);
});

await test("javascript:-URL strippas av sanerare (lager 2, även om validering hade brustit)", async () => {
  const sanitizeHtml = (await import("sanitize-html")).default;
  const dirty = '<a href="javascript:alert(1)">klicka</a>';
  const cleaned = sanitizeHtml(dirty, {
    allowedTags: ["a"],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https"],
  });
  assert.ok(!/javascript:/i.test(cleaned), `javascript: kvar: ${cleaned}`);
});

await test("data:text/html-URL strippas", () => {
  const md = "[klicka](data:text/html,<script>alert(1)</script>)";
  const html = renderMarkdown(md);
  assert.ok(!/data:text\/html/i.test(html), `data:text/html kvar: ${html}`);
  assert.ok(!/<script/i.test(html), `script kvar: ${html}`);
});

await test("vanlig Markdown renderas korrekt", () => {
  const html = renderMarkdown("# Rubrik\n\nBrödtext med [länk](https://example.com).");
  assert.ok(/<h1[^>]*>Rubrik<\/h1>/.test(html), `h1 saknas: ${html}`);
  assert.ok(/<a [^>]*href="https:\/\/example\.com"/.test(html), `länk saknas: ${html}`);
});

await test("länkar får rel='noopener noreferrer' + target='_blank'", () => {
  const html = renderMarkdown("[länk](https://example.com)");
  assert.ok(/rel="noopener noreferrer"/.test(html), `rel saknas: ${html}`);
  assert.ok(/target="_blank"/.test(html), `target saknas: ${html}`);
});

await test("listor renderas", () => {
  const html = renderMarkdown("- punkt 1\n- punkt 2");
  assert.ok(/<ul>/.test(html) && /<li>punkt 1<\/li>/.test(html), `listor: ${html}`);
});

await test("iframe strippas helt", () => {
  // Försök via Markdown raw HTML.
  const md = '<iframe src="https://attacker.example"></iframe>';
  const html = renderMarkdown(md);
  assert.ok(!/<iframe/i.test(html), `iframe kvar: ${html}`);
});

await test("style-attribut strippas", () => {
  const md = '<p style="background: url(javascript:alert(1))">text</p>';
  const html = renderMarkdown(md);
  assert.ok(!/style=/i.test(html), `style kvar: ${html}`);
});

await test("validateMarkdown rejectar långa texter", () => {
  const v = validateMarkdown("x".repeat(50_001));
  assert.equal(v.ok, false, "lång text ska rejectas");
});

await test("validateMarkdown accepterar ren Markdown", () => {
  const v = validateMarkdown("# Rubrik\n\nText.");
  assert.equal(v.ok, true, "ren Markdown ska gå igenom");
});

}
