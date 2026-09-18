#!/usr/bin/env node
/**
 * Render every mermaid diagram in the built site and fail on any that mermaid
 * refuses to draw.
 *
 *   npm run serve           # in one shell
 *   node tools/check_diagrams.mjs
 *
 * This exists because mermaid does not throw on a bad label: it draws the words
 * "UNSUPPORTED MARKDOWN: LIST" into the diagram and returns successfully, so a
 * broken diagram looks exactly like a working one to every other check.
 *
 * Env: SHOT_BASE (default http://localhost:8787), CHROME, MERMAID_URL.
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = (process.env.SHOT_BASE || "http://localhost:8787").replace(/\/$/, "");
const DOCS = process.env.SHOT_DOCS || "docs";
const MERMAID =
  process.env.MERMAID_URL || "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";
const CHROME =
  process.env.CHROME ||
  ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome", "/snap/bin/chromium"].find(
    (p) => fs.existsSync(p),
  );

if (!CHROME) {
  console.error("no Chromium found — set CHROME=/path/to/chrome");
  process.exit(1);
}

// pull every diagram straight out of the built pages
const sources = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(p, "utf8");
      for (const m of html.matchAll(/<pre class="mermaid">([\s\S]*?)<\/pre>/g)) {
        sources.push({ page: path.relative(DOCS, p), src: decode(m[1]) });
      }
    }
  }
};
const decode = (s) =>
  s.replace(/&(amp|lt|gt|quot|#39);/g, (_, k) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[k]);
walk(DOCS);

if (!sources.length) {
  console.log("no mermaid diagrams in the build");
  process.exit(0);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-gpu"],
  headless: true,
});
const page = await browser.newPage();
await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
await page.addScriptTag({ url: MERMAID });

const bad = await page.evaluate(async (srcs) => {
  window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
  const failures = [];
  for (let i = 0; i < srcs.length; i++) {
    try {
      const { svg } = await window.mermaid.render(`check${i}`, srcs[i]);
      const err = svg.match(/UNSUPPORTED MARKDOWN: \w+|Syntax error[^<]*/i);
      if (err) failures.push({ i, msg: err[0] });
    } catch (e) {
      failures.push({ i, msg: String(e.message || e).split("\n")[0].slice(0, 120) });
    }
  }
  return failures;
}, sources.map((s) => s.src));

await browser.close();

console.log(`checked ${sources.length} diagrams across the build`);
if (!bad.length) {
  console.log("no problems found");
  process.exit(0);
}
console.log(`\n${bad.length} diagram(s) will not render:`);
for (const f of bad) console.log(` - ${sources[f.i].page}: ${f.msg}`);
process.exit(1);
