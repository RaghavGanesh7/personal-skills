/**
 * Static build: markdown in content/ -> a 3D brutalist course site in docs/.
 *
 * Everything site-specific lives in catalog.mjs. This file only measures the
 * content, renders it and writes the output tree (plus search index, sitemap,
 * 404 and .nojekyll).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODULES, SITE, OMITTED } from "./catalog.mjs";
import { renderMarkdown, slugify, escapeHtml, inlineCode } from "./render.mjs";
import { shell, landing, modulePage, lessonPage, plainPage } from "./pages.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(root, SITE.contentDir || "content");
const SRC = path.join(root, "src");
const OUT = path.join(root, "docs");
const WPM = SITE.wpm || 220;
// Search-result snippet length. The index is one JSON file the browser fetches
// on first search, so on a very large course this number is the download size:
// ~5,000 entries x 260 chars is 2.2MB (345KB gzipped). Shorten it, not the index.
const SNIPPET = SITE.snippetChars || 160;

const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};
const minutes = (words) => Math.max(1, Math.round(words / WPM));
const clean = (s) => String(s || "").replace(/[*_`]/g, "").trim();

function plainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Work out what a content file *is* from its title line and filename.
 * Upstream repos label units in a dozen ways; add your own patterns here.
 */
function lessonMeta(file, title, override = {}) {
  const t = title || "";
  let m;
  if ((m = /^(?:Chapter|Lesson|Part|Section|Module|Day|Week|Unit)\s+(\d+)\s*[:.–-]\s*(.+)$/i.exec(t))) {
    return { kind: "lesson", n: Number(m[1]), title: clean(m[2]), short: `L${m[1]}`, ...override };
  }
  if ((m = /^(\d{1,2})\s*[.)–-]\s*(.+)$/.exec(t))) {
    return { kind: "lesson", n: Number(m[1]), title: clean(m[2]), short: `L${Number(m[1])}`, ...override };
  }
  if ((m = /^Appendix\s+([A-Z0-9]+)\s*[:.–-]\s*(.+)$/i.exec(t))) {
    return { kind: "appendix", n: null, title: clean(m[2]), short: m[1].toUpperCase(), ...override };
  }
  if ((m = /^(\d{1,2})[-_]/.exec(file))) {
    return { kind: "lesson", n: Number(m[1]), title: clean(t || file), short: `L${Number(m[1])}`, ...override };
  }
  if (/^(foreword|intro|introduction|overview|preface|start|README)$/i.test(file)) {
    return { kind: "front", n: null, title: clean(t) || "Introduction", short: "IN", ...override };
  }
  if (/^(exercises?|practice|lab|labs)$/i.test(file)) {
    return { kind: "extra", n: null, title: clean(t) || "Exercises", short: "EX", ...override };
  }
  return { kind: "extra", n: null, title: clean(t || file), short: "–", ...override };
}

// ---------- pass 1: load + measure every lesson ----------
let lessonCounter = 0;
const modules = MODULES.map((module, moduleIndex) => {
  const lessons = module.files.map((entry) => {
    const spec = typeof entry === "string" ? { file: entry } : entry;
    const file = spec.file;
    const md = read(path.join(CONTENT, module.slug, `${file}.md`));
    const rendered = renderMarkdown(md, { linkBase: "", dropFirstHeading: SITE.dropBannerHeading });
    const meta = lessonMeta(file, spec.title || rendered.title, spec);
    if (meta.kind === "lesson" && meta.n == null) meta.n = ++lessonCounter;
    return {
      file,
      md,
      ...meta,
      html: rendered.html,
      headings: rendered.headings,
      words: rendered.words,
      minutes: minutes(rendered.words),
      facts: rendered.facts, // the source's own metadata block, as chips
      epigraph: rendered.epigraph, // its one-line hook, as a lede
    };
  });
  const words = lessons.reduce((a, l) => a + l.words, 0);
  return { ...module, num: module.num ?? moduleIndex + 1, lessons, words, minutes: minutes(words) };
});

const stats = {
  modules: modules.length,
  lessons: modules.reduce((a, m) => a + m.lessons.filter((l) => l.kind === "lesson").length, 0),
  words: modules.reduce((a, m) => a + m.words, 0),
  minutes: modules.reduce((a, m) => a + m.minutes, 0),
};

// ---------- output tree ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

// recursive: src/assets may hold subdirectories (a vendored runtime, fonts, …)
fs.cpSync(path.join(SRC, "assets"), path.join(OUT, "assets"), { recursive: true });

// figures ship next to the pages that reference them, so relative src="images/..." keeps working
for (const module of modules) {
  for (const dir of SITE.assetDirs || ["images", "img", "assets", "figures"]) {
    const from = path.join(CONTENT, module.slug, dir);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(OUT, module.slug, dir), { recursive: true });
  }
}

// ---------- landing ----------
write(
  path.join(OUT, "index.html"),
  shell({
    title: `${SITE.title} — ${SITE.tagline}`,
    rel: "",
    bodyClass: "is-home",
    content: landing({ modules, stats, omitted: OMITTED }),
    modules: ["hero.js"],
  }),
);

// ---------- modules + lessons ----------
const index = [];

for (const module of modules) {
  const support = (module.support || SITE.support || [])
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`)
    .join(" · ");

  const aboutHtml = `<h2>What this module covers</h2>
<p>${inlineCode(module.blurb)}</p>
${module.status ? `<p>It is module <b>${String(module.num).padStart(2, "0")}</b> of ${modules.length}; its state upstream is <b>${escapeHtml(module.status)}</b>. Everything below is ${escapeHtml(SITE.author)}'s text, unedited.</p>` : ""}
${support ? `<aside class="callout callout--tip" data-tag="SUPPORT THE AUTHOR"><p>This material is free to read. If it earns a place on your shelf, support the author: ${support}.</p></aside>` : ""}`;

  write(
    path.join(OUT, module.slug, "index.html"),
    shell({
      title: `${module.title} — ${SITE.title}`,
      description: module.blurb,
      rel: "../",
      accent: module.accent,
      bodyClass: "is-module",
      content: modulePage(module, { rel: "../", contentHtml: aboutHtml }),
    }),
  );

  module.lessons.forEach((lesson, i) => {
    write(
      path.join(OUT, module.slug, `${lesson.file}.html`),
      shell({
        title: `${lesson.title} — ${module.title} — ${SITE.shortTitle || SITE.title}`,
        description: `${module.title}: ${lesson.title}. ${lesson.minutes} minute read.`,
        rel: "../",
        accent: module.accent,
        bodyClass: "is-reader",
        content: lessonPage({
          module,
          lesson,
          prev: module.lessons[i - 1] || null,
          next: module.lessons[i + 1] || null,
          contentHtml: lesson.html,
          rel: "../",
        }),
      }),
    );

    // search index: the lesson itself, then one entry per H2 section
    const url = `${module.slug}/${lesson.file}.html`;
    index.push({ b: module.title, s: module.slug, c: lesson.title, u: url, h: "", t: plainText(lesson.md).slice(0, SNIPPET) });
    // split on real headings only: prompt templates and shell transcripts are
    // full of "## Role" lines *inside* fenced blocks, and those are not anchors
    const parts = lesson.md.replace(/^```[\s\S]*?^```/gm, "").split(/^##\s+(.+)$/m);
    for (let k = 1; k < parts.length; k += 2) {
      index.push({
        b: module.title,
        s: module.slug,
        c: lesson.title,
        u: `${url}#${slugify(parts[k])}`,
        h: clean(parts[k]),
        t: plainText(parts[k + 1] || "").slice(0, SNIPPET),
      });
    }
  });
}

write(path.join(OUT, "assets", "search-index.json"), JSON.stringify(index));

// ---------- standalone pages (preface, syllabus, credits, ...) ----------
const extraPages = [];
for (const page of SITE.pages || []) {
  const r = renderMarkdown(read(path.join(CONTENT, page.source)), {
    linkBase: "",
    dropFirstHeading: SITE.dropBannerHeading,
  });
  write(
    path.join(OUT, `${page.slug}.html`),
    shell({
      title: `${page.title} — ${SITE.title}`,
      rel: "",
      bodyClass: "is-page",
      content: plainPage({ kicker: page.kicker || "", title: page.title, lede: page.lede || "", contentHtml: r.html }),
    }),
  );
  extraPages.push(`${page.slug}.html`);
}

// ---------- about this edition ----------
{
  const licence = SITE.licence;
  const aboutHtml = `<h2>What this is</h2>
<p>${inlineCode(SITE.about || `<b>${SITE.title}</b> is course material by ${SITE.author}. This site is an independent reading edition of it: the same words, rebuilt as a website you can actually finish.`)}</p>
<h2>What was added</h2>
<ul>
<li><b>A reader, not a repo.</b> Lessons are pages with a live outline, reading times, prev/next paging and a progress bar.</li>
<li><b>Full-text search</b> across every lesson, ranked heading-first (<kbd>⌘K</kbd> or <kbd>/</kbd>).</li>
<li><b>Progress tracking</b> in your browser's local storage — nothing is sent anywhere, and <em>Reset my progress</em> in the footer clears it.</li>
<li><b>Build-time syntax highlighting</b>, so a ${stats.lessons}-lesson course still loads fast on a phone.</li>
<li><b>Brutalist design</b>: hard edges, real contrast, one accent per module, and 3D only where it helps you recognise where you are.</li>
</ul>
<h2>Credit and licence</h2>
<p>The material is by <a href="${SITE.authorUrl || SITE.upstream}" target="_blank" rel="noopener">${escapeHtml(SITE.author)}</a>${licence ? ` and licensed <a href="${licence.url}" target="_blank" rel="noopener">${escapeHtml(licence.name)}</a>` : ""}. It is reproduced here unmodified, with attribution. The original source lives at <a href="${SITE.upstream}" target="_blank" rel="noopener">${escapeHtml(SITE.upstreamLabel || SITE.upstream)}</a>.</p>
<p>The site code — build, styles and interactions — is MIT licensed and lives at <a href="${SITE.repo}" target="_blank" rel="noopener">this repository</a>.</p>
<h2>Keyboard</h2>
<p>Press <kbd>?</kbd> anywhere for the full list.</p>`;

  write(
    path.join(OUT, "about.html"),
    shell({
      title: `About this edition — ${SITE.title}`,
      rel: "",
      bodyClass: "is-page",
      content: plainPage({
        kicker: "About",
        title: "About this edition",
        lede: `${stats.words.toLocaleString("en-US")} words, ${stats.lessons} lessons, zero trackers.`,
        contentHtml: aboutHtml,
      }),
    }),
  );
}

// ---------- 404 ----------
write(
  path.join(OUT, "404.html"),
  shell({
    title: `Not found — ${SITE.title}`,
    rel: "",
    bodyClass: "is-page",
    content: plainPage({
      kicker: "404",
      title: "Nothing here",
      lede: "That page isn't part of this course.",
      contentHtml: `<p><a href="index.html">Back to the course →</a></p>`,
    }),
  }),
);

// ---------- sitemap ----------
const urls = ["index.html", "about.html", ...extraPages].concat(
  modules.flatMap((m) => [`${m.slug}/index.html`, ...m.lessons.map((l) => `${m.slug}/${l.file}.html`)]),
);
if (SITE.baseUrl) {
  const base = SITE.baseUrl.replace(/\/$/, "");
  write(path.join(OUT, "sitemap.txt"), urls.map((u) => `${base}/${u}`).join("\n"));
}

console.log(
  `built ${urls.length} pages · ${modules.length} modules · ${stats.lessons} lessons · ` +
    `${stats.words.toLocaleString("en-US")} words · ${index.length} search entries`,
);
