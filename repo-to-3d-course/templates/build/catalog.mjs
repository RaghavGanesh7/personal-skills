/**
 * THE ONLY FILE YOU MUST EDIT.
 *
 * `SITE` is the identity and copy of the site; `MODULES` is the syllabus —
 * which source files become pages, in what order, under which accent colour.
 * Nothing else in build/ knows anything about your subject matter.
 */

export const SITE = {
  // --- identity -----------------------------------------------------------
  title: "Course Title Here",
  shortTitle: "COURSE", // used in <title> suffixes; keep it short
  tagline: "One sentence on what this material teaches and who it is for.",
  badge: "CT", // 2-3 characters for the square mark in the top bar
  wordmark: "COURSE <em>TITLE</em>", // inline HTML allowed; <em> is the inverted chip
  coverEyebrow: "Course<br>Title", // small type at the top of every 3D cover; <br> and <em> allowed
  edition: "", // e.g. "2nd Edition" — shown on each cover, omit to hide

  // --- credit (never drop this) -------------------------------------------
  author: "Original Author",
  authorUrl: "https://github.com/original-author",
  upstream: "https://github.com/original-author/original-repo",
  upstreamLabel: "original-author/original-repo",
  licence: { name: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
  support: [], // e.g. [{ label: "Buy the book", url: "https://..." }]

  // --- this site ----------------------------------------------------------
  repo: "https://github.com/your-handle/your-site-repo",
  baseUrl: "https://your-handle.github.io/your-site-repo", // for sitemap.txt; "" to skip
  footerLine: "Free to read, forever",
  about: "", // optional paragraph for about.html; falls back to a generated one

  // --- vocabulary ---------------------------------------------------------
  // What one top-level unit is called: Book/Module/Part/Track/Unit.
  unitLabel: "Module",
  unitLabelPlural: "Modules",

  // --- hero ---------------------------------------------------------------
  // Keep lines SHORT — this is display type at up to 8.5rem.
  heroLines: ["LEARN", "THE", "THING", "PROPERLY"],
  heroFillLine: 2, // index of the line drawn as a filled accent block
  heroOutlineLine: 3, // index of the line drawn as outlined type
  heroKicker: "", // small chip above the title; falls back to computed stats
  ticker: ["CONCEPT", "ANOTHER", "THIRD", "FOURTH"], // marquee words at the hero base

  // --- landing copy -------------------------------------------------------
  seriesTitle: "The Course",
  seriesNote: "", // falls back to "N modules, best taken in order."
  conceptsTitle: "The ideas that carry the rest",
  ctaTitle: "", // closing call-to-action heading; falls back to "Start at the beginning."
  ctaLine: "", // one line under it; `code` allowed
  // Optional "pillars" row: the 2-4 ideas the whole course hangs on.
  // Omit or empty the array to hide the block entirely.
  concepts: [
    // { name: "First Big Idea", body: "One line on why it matters; `code` is allowed.", module: "module-one" },
  ],

  // --- standalone pages (rendered from single markdown files) -------------
  // Each becomes /<slug>.html, appears in the top nav and starts the learning path.
  pages: [
    // { source: "preface.md", slug: "preface", title: "Preface", kicker: "Start here · 10 min", lede: "Why this exists and how to read it." },
  ],

  // --- content pipeline ---------------------------------------------------
  contentDir: "content", // where the upstream markdown lives in this repo
  wpm: 220, // reading-time divisor
  dropBannerHeading: false, // true when every file repeats a series H1 banner on line 1
  assetDirs: ["images", "img", "figures"], // copied next to each module's pages
};

/**
 * One entry per module, in reading order.
 *
 * slug      directory under contentDir/ AND the URL segment
 * files     markdown basenames (no .md) in reading order; a string, or
 *           { file, title, kind, short } to override what the parser guessed
 * accent    the module's colour — used for its cover, buttons and nav marker
 * accentInk text colour on top of that accent (#111111 or #ffffff)
 * status    optional label ("complete", "draft") shown next to the module number
 */
export const MODULES = [
  {
    slug: "module-one",
    num: 1,
    title: "Module One",
    subtitle: "The short hook for this module",
    blurb: "Two lines on what this module covers and what the reader can do afterwards.",
    accent: "#FFE500",
    accentInk: "#111111",
    status: "complete",
    files: ["intro", "ch1", "ch2"],
  },
  {
    slug: "module-two",
    num: 2,
    title: "Module Two",
    subtitle: "The short hook for this module",
    blurb: "Two lines on what this module covers and what the reader can do afterwards.",
    accent: "#4D5BFF",
    accentInk: "#FFFFFF",
    status: "complete",
    files: ["intro", "ch1"],
  },
];

/** Anything in the upstream repo you deliberately did not build, for honesty. */
export const OMITTED = [
  // { title: "Draft Appendix", note: "unfinished upstream" },
];

/**
 * Accent palette that survives both themes (pick one per module):
 * #FFE500 yellow · #4D5BFF blue · #FF4FA3 pink · #00D4A0 green
 * #FF6B1A orange · #B8FF3C lime · #9B5CFF violet · #00C2FF cyan
 * Use #111111 ink on light accents and #FFFFFF on saturated ones.
 */
