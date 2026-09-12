#!/usr/bin/env node
/**
 * Screenshot matrix for reviewing the built site with your own eyes.
 *
 *   npm run serve            # in one shell (serves docs/ on :8787)
 *   node tools/shots.mjs     # in another; writes .shots/*.png
 *
 * Env: SHOT_BASE (default http://localhost:8787), CHROME (browser binary),
 *      SHOT_OUT (default .shots).
 *
 * Every view here has caught a real bug: the hero at desktop and phone width,
 * a lesson in both themes, a code-heavy scroll position, the search overlay,
 * and the module grid (where orphan grid cells and overflowing cover type show up).
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = (process.env.SHOT_BASE || "http://localhost:8787").replace(/\/$/, "");
const OUT = process.env.SHOT_OUT || ".shots";
const CHROME =
  process.env.CHROME ||
  ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome", "/snap/bin/chromium"].find((p) =>
    fs.existsSync(p),
  );

if (!CHROME) {
  console.error("no Chromium found — set CHROME=/path/to/chrome");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// first module + its first lesson, straight from the built sitemap/index
const docs = process.env.SHOT_DOCS || "docs";
const moduleDirs = fs
  .readdirSync(docs, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "assets")
  .map((d) => d.name);
const firstModule = moduleDirs[0];
// take the first lesson in *reading* order, straight from the module's own contents list
let firstLesson = null;
if (firstModule) {
  const indexHtml = path.join(docs, firstModule, "index.html");
  const fromToc = fs.existsSync(indexHtml)
    ? /class="toc__link" href="([^"]+)"/.exec(fs.readFileSync(indexHtml, "utf8"))?.[1]
    : null;
  firstLesson =
    fromToc || fs.readdirSync(path.join(docs, firstModule)).find((f) => f.endsWith(".html") && f !== "index.html");
}

const views = [
  ["home", "/index.html", 1440, 950, {}],
  ["home-modules", "/index.html", 1440, 950, { scroll: "#modules" }],
  ["home-path", "/index.html", 1440, 950, { scroll: "#path" }],
  ["home-dark", "/index.html", 1440, 950, { theme: "dark" }],
  ["home-phone", "/index.html", 412, 900, {}],
  ["module", `/${firstModule}/index.html`, 1440, 950, {}],
  ["module-contents", `/${firstModule}/index.html`, 1440, 950, { scroll: "#contents" }],
  ["lesson", `/${firstModule}/${firstLesson}`, 1440, 1000, { scrollY: 600 }],
  ["lesson-code", `/${firstModule}/${firstLesson}`, 1440, 1000, { scrollY: 2600 }],
  ["lesson-dark", `/${firstModule}/${firstLesson}`, 1440, 1000, { theme: "dark", scrollY: 1600 }],
  ["lesson-phone", `/${firstModule}/${firstLesson}`, 412, 900, { scrollY: 700 }],
  ["search", `/${firstModule}/${firstLesson}`, 1440, 950, { search: process.env.SHOT_QUERY || "the" }],
  ["about", "/about.html", 1440, 1000, {}],
].filter(([, url]) => !url.includes("undefined") && !url.includes("null"));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-gpu", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  headless: true,
});

for (const [name, url, w, h, opt] of views) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => errors.push("failed: " + r.url()));
  await page.setViewport({ width: w, height: h });
  try {
    await page.goto(BASE + url, { waitUntil: "networkidle2", timeout: 45000 });
    if (opt.theme) await page.evaluate((t) => (document.documentElement.dataset.theme = t), opt.theme);
    await page.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
    if (opt.scroll) await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), opt.scroll);
    if (opt.scrollY) await page.evaluate((y) => scrollTo(0, y), opt.scrollY);
    if (opt.search) {
      await page.evaluate(() => document.querySelector("[data-open-search]")?.click());
      await page.type("[data-search-input]", opt.search, { delay: 20 });
      await new Promise((r) => setTimeout(r, 600));
    }
    await new Promise((r) => setTimeout(r, 900)); // let reveals settle and WebGL paint
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`${name.padEnd(16)} ${url}${errors.length ? "  ERRORS: " + errors.slice(0, 3).join(" | ") : ""}`);
  } catch (err) {
    console.error(`${name.padEnd(16)} FAILED ${url} — ${err.message}`);
  }
  await page.close();
}

await browser.close();
console.log(`\nwrote ${OUT}/*.png — open them before declaring the design done`);
