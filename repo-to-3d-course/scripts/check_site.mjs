#!/usr/bin/env node
/**
 * Post-build validator for a generated course site.
 *
 *   node tools/check_site.mjs [docsDir]
 *
 * Catches the failures that silently ship: dead internal links, missing
 * figures, search-index anchors that don't exist on the page, double-escaped
 * entities from a renderer that escaped twice, and pages with no content.
 * Exits non-zero with a list, so CI can gate on it.
 */
import fs from "node:fs";
import path from "node:path";

const DOCS = path.resolve(process.argv[2] || "docs");
const problems = [];
const note = (kind, detail) => problems.push(`${kind}: ${detail}`);

if (!fs.existsSync(DOCS)) {
  console.error(`no such directory: ${DOCS}`);
  process.exit(1);
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (p.endsWith(".html")) htmlFiles.push(p);
  }
})(DOCS);

const rel = (p) => path.relative(DOCS, p);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");

  // 1. every relative href/src must resolve on disk
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(raw)) continue;
    const target = raw.split("#")[0].split("?")[0];
    if (!target) continue;
    if (target.startsWith("/")) {
      note("root-relative link breaks under a Pages subpath", `${rel(file)} -> ${raw}`);
      continue;
    }
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) {
      note("dead link", `${rel(file)} -> ${raw}`);
    }
  }

  // 2. in-page anchors must exist
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    const id = m[1];
    if (id === "main" || id === "") continue;
    if (!html.includes(`id="${id}"`)) note("dead anchor", `${rel(file)} -> #${id}`);
  }

  // 3. double-escaped entities mean something was escaped twice
  const dbl = html.match(/&amp;(?:lt|gt|amp|quot|#39);/g);
  if (dbl) note("double-escaped entity", `${rel(file)} (${dbl.length}x, e.g. ${dbl[0]})`);

  // 4. obvious content failures
  if (!/<title>[^<]+<\/title>/.test(html)) note("missing title", rel(file));
  if (html.length < 1200) note("suspiciously small page", `${rel(file)} (${html.length} bytes)`);
  if (/undefined|\[object Object\]|NaN/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) {
    note("template leak", `${rel(file)} contains undefined/[object Object]/NaN`);
  }
}

// 5. search index must point at anchors that exist
const indexPath = path.join(DOCS, "assets", "search-index.json");
if (fs.existsSync(indexPath)) {
  const entries = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  for (const entry of entries) {
    const [file, hash] = entry.u.split("#");
    const target = path.join(DOCS, file);
    if (!fs.existsSync(target)) {
      note("search index -> missing page", entry.u);
      continue;
    }
    if (hash && !fs.readFileSync(target, "utf8").includes(`id="${hash}"`)) {
      note("search index -> missing anchor", `${entry.u} (${entry.h || entry.c})`);
    }
  }
  console.log(`checked ${htmlFiles.length} pages, ${entries.length} search entries`);
} else {
  note("missing search index", "assets/search-index.json");
}

if (problems.length) {
  const shown = problems.slice(0, 40);
  console.error(`\n${problems.length} problem(s):`);
  for (const p of shown) console.error(" - " + p);
  if (problems.length > shown.length) console.error(` ... and ${problems.length - shown.length} more`);
  process.exit(1);
}
console.log("no problems found");
