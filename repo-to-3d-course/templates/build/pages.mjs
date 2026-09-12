import { SITE, OMITTED } from "./catalog.mjs";
import { escapeHtml } from "./render.mjs";

// Module blurbs are hand-written with markdown-ish backticks; honour just that one bit.
const rich = (s) => escapeHtml(s).replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#FFE500"/><rect x="1.5" y="1.5" width="29" height="29" fill="none" stroke="#111" stroke-width="3"/><text x="16" y="23" font-family="Arial Black,Arial,sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="#111">JS</text></svg>`,
  );

export function shell({
  title,
  description = SITE.tagline,
  rel = "",
  bodyClass = "",
  accent = "",
  content,
  scripts = [],
  modules = [],
}) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="color-scheme" content="light dark">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;1,7..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}assets/styles.css">
<script>try{var t=localStorage.getItem('course:theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){}</script>
</head>
<body class="${bodyClass}"${accent ? ` style="--accent:${accent}"` : ""} data-rel="${rel}">
<a class="skip-link" href="#main">Skip to content</a>
${topbar(rel)}
${content}
${footer(rel)}
${searchOverlay()}
${shortcutsSheet()}
<script src="${rel}assets/app.js" defer></script>
${scripts.map((s) => `<script src="${rel}assets/${s}" defer></script>`).join("\n")}
${modules.map((m) => `<script type="module" src="${rel}assets/${m}"></script>`).join("\n")}
</body>
</html>
`;
}

function topbar(rel) {
  return `<div class="readbar" aria-hidden="true"><span class="readbar__fill" data-progress-bar></span></div>
<header class="bar">
  <a class="bar__mark" href="${rel}index.html">
    <span class="bar__badge">${escapeHtml(SITE.badge)}</span>
    <span class="bar__wordmark">${SITE.wordmark}</span>
  </a>
  <nav class="bar__nav" aria-label="Site">
    <a href="${rel}index.html#modules">${escapeHtml(SITE.unitLabelPlural)}</a>
    <a href="${rel}index.html#path">Path</a>
    ${(SITE.pages || []).map((pg) => `<a href="${rel}${pg.slug}.html">${escapeHtml(pg.title)}</a>`).join("\n    ")}
    <a href="${rel}about.html">About</a>
  </nav>
  <div class="bar__tools">
    <button class="btn btn--sm" type="button" data-open-search>Search <kbd>⌘K</kbd></button>
    <button class="btn btn--icon" type="button" data-theme-toggle title="Toggle light / dark" aria-label="Toggle light or dark theme"><span data-theme-icon>◑</span></button>
  </div>
</header>`;
}

function footer(rel) {
  return `<footer class="foot">
  <div class="foot__grid">
    <div class="foot__block">
      <h3 class="label">The Material</h3>
      <p>Written by <strong>${escapeHtml(SITE.author)}</strong>${SITE.licence ? `, licensed <a href="${SITE.licence.url}" target="_blank" rel="noopener">${escapeHtml(SITE.licence.name)}</a>` : ""}. Every word is theirs — only the reading experience is new.</p>
      <a class="foot__link" href="${SITE.upstream}" target="_blank" rel="noopener">Original repository ↗</a>
    </div>
    <div class="foot__block">
      <h3 class="label">This Edition</h3>
      <p>A static, 3D-flavoured brutalist reader: offline-friendly, no trackers, no paywall, keyboard-first.</p>
      <a class="foot__link" href="${SITE.repo}" target="_blank" rel="noopener">Source for this site ↗</a>
    </div>
    <div class="foot__block">
      <h3 class="label">Keys</h3>
      <ul class="keylist">
        <li><kbd>⌘K</kbd> search</li>
        <li><kbd>[</kbd> <kbd>]</kbd> prev / next</li>
        <li><kbd>c</kbd> contents</li>
        <li><kbd>t</kbd> theme</li>
        <li><kbd>?</kbd> all shortcuts</li>
      </ul>
    </div>
  </div>
  <div class="foot__base">
    <span>© ${escapeHtml(SITE.author)} — text</span>
    <span class="foot__dot">◆</span>
    <span>${escapeHtml(SITE.footerLine || "Free to read, forever")}</span>
    <span class="foot__dot">◆</span>
    <button class="foot__reset" type="button" data-reset-progress>Reset my progress</button>
  </div>
</footer>`;
}

function searchOverlay() {
  return `<div class="search" data-search hidden>
  <div class="search__scrim" data-search-close></div>
  <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search the modules">
    <div class="search__head">
      <span class="search__icon">⌕</span>
      <input class="search__input" type="search" placeholder="Search every lesson…" aria-label="Search" data-search-input autocomplete="off" spellcheck="false">
      <button class="btn btn--sm" type="button" data-search-close>ESC</button>
    </div>
    <div class="search__body" data-search-results>
      <p class="search__hint">Type at least two characters. Results are ranked by heading, then by body text.</p>
    </div>
  </div>
</div>`;
}

function shortcutsSheet() {
  return `<div class="sheet" data-sheet hidden>
  <div class="search__scrim" data-sheet-close></div>
  <div class="sheet__panel" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
    <h2 class="sheet__title">Keyboard</h2>
    <dl class="sheet__list">
      <dt><kbd>⌘K</kbd> / <kbd>/</kbd></dt><dd>Open search</dd>
      <dt><kbd>]</kbd></dt><dd>Next lesson</dd>
      <dt><kbd>[</kbd></dt><dd>Previous lesson</dd>
      <dt><kbd>c</kbd></dt><dd>Toggle lesson contents</dd>
      <dt><kbd>m</kbd></dt><dd>Mark lesson read / unread</dd>
      <dt><kbd>t</kbd></dt><dd>Light / dark</dd>
      <dt><kbd>g</kbd> then <kbd>h</kbd></dt><dd>Go home</dd>
      <dt><kbd>Esc</kbd></dt><dd>Close anything</dd>
    </dl>
    <button class="btn" type="button" data-sheet-close>Got it</button>
  </div>
</div>`;
}

/** The CSS-3D object used as each module's "cover": front face, spine, back board. */
export function cover(module, { size = "md" } = {}) {
  const n = String(module.num).padStart(2, "0");
  return `<div class="card3d card3d--${size}" style="--accent:${module.accent};--accent-ink:${module.accentInk || "#111111"}" aria-hidden="true">
  <div class="card3d__body">
    <div class="card3d__spine"><span>${escapeHtml(SITE.badge)} · ${escapeHtml(module.title.toUpperCase())}</span></div>
    <div class="card3d__cover">
      <span class="card3d__eyebrow">${SITE.coverEyebrow || SITE.wordmark}</span>
      <span class="card3d__title">${escapeHtml(module.title)}</span>
      <span class="card3d__num">${escapeHtml(SITE.unitLabel.toUpperCase())}<br><b>${n}</b></span>
      ${SITE.edition ? `<span class="card3d__edition">${escapeHtml(SITE.edition)}</span>` : ""}
    </div>
    <div class="card3d__pages"></div>
  </div>
</div>`;
}

export function landing({ modules, stats, omitted = OMITTED }) {
  const first = modules[0]?.lessons?.[0];
  const startHref = first ? `${modules[0].slug}/${first.file}.html` : "#modules";
  const moduleCards = modules
    .map(
      (b) => `<article class="mcard reveal" style="--accent:${b.accent};--accent-ink:${b.accentInk}" data-module="${b.slug}" data-tilt>
  <a class="mcard__hit" href="${b.slug}/index.html" aria-label="Open ${escapeHtml(b.title)}"></a>
  <div class="mcard__art">${cover(b)}</div>
  <div class="mcard__meta">
    <span class="label">${escapeHtml(SITE.unitLabel)} ${String(b.num).padStart(2, "0")}${b.status ? ` · ${escapeHtml(b.status)}` : ""}</span>
    <h3 class="mcard__title">${escapeHtml(b.title)}</h3>
    <p class="mcard__sub">${rich(b.subtitle)}</p>
    <p class="mcard__blurb">${rich(b.blurb)}</p>
    <ul class="chiprow">
      <li class="chip">${b.lessons.length} pages</li>
      <li class="chip">${b.minutes} min</li>
      <li class="chip">${b.words.toLocaleString("en-US")} words</li>
    </ul>
    <div class="mcard__progress" data-module-progress="${b.slug}" data-total="${b.lessons.length}">
      <div class="pbar"><span class="pbar__fill" style="width:0%"></span></div>
      <span class="pbar__text">0 / ${b.lessons.length} read</span>
    </div>
    <span class="mcard__go">Open this ${escapeHtml(SITE.unitLabel.toLowerCase())} <b>→</b></span>
  </div>
</article>`,
    )
    .join("\n");

  return `<main id="main">
<section class="hero">
  <canvas class="hero__canvas" data-hero-canvas aria-hidden="true"></canvas>
  <div class="hero__grid" aria-hidden="true"></div>
  <div class="hero__inner">
    <p class="hero__kicker"><span class="dot"></span> ${escapeHtml(SITE.heroKicker || `${stats.modules} ${SITE.unitLabelPlural.toLowerCase()} · ${stats.lessons} lessons · free to read`)}</p>
    <h1 class="hero__title">
      ${SITE.heroLines
        .map(
          (line, i) =>
            `<span class="hero__line${i === SITE.heroFillLine ? " hero__line--fill" : ""}${i === SITE.heroOutlineLine ? " hero__line--outline" : ""}">${escapeHtml(line)}</span>`,
        )
        .join("\n      ")}
    </h1>
    <p class="hero__lede">${escapeHtml(SITE.tagline)} ${stats.words.toLocaleString("en-US")} words, re-cut into a reader with search, progress and a proper table of contents.</p>
    <div class="hero__cta">
      <a class="btn btn--lg btn--solid" href="${startHref}" data-resume-href>Start reading <b>→</b></a>
      <a class="btn btn--lg" href="#modules">Browse the ${escapeHtml(SITE.unitLabelPlural.toLowerCase())}</a>
    </div>
    <div class="hero__resume" data-resume hidden>
      <span class="label">Pick up where you left off</span>
      <a class="hero__resume-link" href="#" data-resume-link></a>
    </div>
  </div>
  <div class="hero__ticker" aria-hidden="true">
    <div class="hero__ticker-track">${Array(3)
      .fill((SITE.ticker || []).map((w) => `<span>${escapeHtml(w)}</span><span>◆</span>`).join(""))
      .join("")}</div>
  </div>
</section>

<section class="stats">
  ${[
    [SITE.unitLabelPlural, stats.modules],
    ["Lessons", stats.lessons],
    ["Words", stats.words.toLocaleString("en-US")],
    ["Reading hours", Math.round(stats.minutes / 60)],
  ]
    .map(
      ([k, v], i) => `<div class="stat reveal" style="--i:${i}"><b class="stat__v">${v}</b><span class="label">${k}</span></div>`,
    )
    .join("")}
</section>

<section class="section" id="modules">
  <header class="section__head">
    <h2 class="section__title">${escapeHtml(SITE.seriesTitle || "The Course")}</h2>
    <p class="section__note">${escapeHtml(SITE.seriesNote || `${stats.modules} ${SITE.unitLabelPlural.toLowerCase()}, best taken in order.`)}</p>
  </header>
  <div class="mgrid">${moduleCards}</div>
  ${
    omitted.length
      ? `<aside class="omitted">
    <span class="label">Not included</span>
    <ul>${omitted.map((c) => `<li><b>${escapeHtml(c.title)}</b> — ${escapeHtml(c.note)}</li>`).join("")}</ul>
  </aside>`
      : ""
  }
</section>

<section class="section section--ink" id="path">
  <header class="section__head">
    <h2 class="section__title">The Learning Path</h2>
    <p class="section__note">The order matters more than the speed. Here's the route through the material.</p>
  </header>
  <ol class="path">
    ${(SITE.pages || [])
      .map(
        (pg, i) =>
          `<li class="path__step reveal"><span class="path__n">${String(i).padStart(2, "0")}</span><div><h3>${escapeHtml(pg.pathTitle || pg.title)}</h3><p>${escapeHtml(pg.lede || "")}</p><a class="tlink" href="${pg.slug}.html">${escapeHtml(pg.title)} →</a></div></li>`,
      )
      .join("")}
    ${modules
      .map(
        (b, i) => `<li class="path__step reveal" style="--accent:${b.accent}"><span class="path__n">${String(i + (SITE.pages || []).length).padStart(2, "0")}</span><div><h3>${escapeHtml(b.title)}</h3><p>${rich(b.blurb)}</p><a class="tlink" href="${b.slug}/index.html">${escapeHtml(b.title)} →</a></div></li>`,
      )
      .join("")}
  </ol>
  ${
    (SITE.concepts || []).length
      ? `<div class="pillars">
    <h3 class="pillars__title">${escapeHtml(SITE.conceptsTitle || "The ideas that carry the rest")}</h3>
    <div class="pillars__row">
      ${(SITE.concepts || [])
        .map(
          (c, i) =>
            `<a class="pillar" href="${c.module}/index.html" data-tilt><span class="pillar__n">${String(i + 1).padStart(2, "0")}</span><h4>${escapeHtml(c.name)}</h4><p>${rich(c.body)}</p><span class="pillar__go">→</span></a>`,
        )
        .join("")}
    </div>
  </div>`
      : ""
  }
</section>

<section class="section" id="how">
  <header class="section__head">
    <h2 class="section__title">Built To Be Read</h2>
    <p class="section__note">The features that make a ${stats.words.toLocaleString("en-US")}-word series survivable.</p>
  </header>
  <div class="fgrid">
    ${[
      ["⌕", "Search everything", "One index across every lesson. Headings rank first, so you land on the section, not the page."],
      ["◱", "Real table of contents", "Every lesson carries a live outline that tracks where you are as you scroll."],
      ["◉", "Progress that sticks", "Lessons mark themselves read at the end and resume where you stopped — stored locally, never uploaded."],
      ["⌘", "Keyboard-first", "Bracket keys turn pages, <kbd>c</kbd> opens contents, <kbd>m</kbd> marks read. Never touch the mouse."],
      ["❖", "Copy-ready code", "Every snippet is syntax-highlighted at build time with a one-click copy button."],
      ["◐", "Light and dark", "A paper mode for daylight and a high-contrast night mode, both honouring your system setting."],
    ]
      .map(
        ([icon, h, p]) => `<article class="feat reveal"><span class="feat__icon" aria-hidden="true">${icon}</span><h3>${h}</h3><p>${p}</p></article>`,
      )
      .join("")}
  </div>
</section>

<section class="cta">
  <div class="cta__inner">
    <h2>${escapeHtml(SITE.ctaTitle || "Start at the beginning.")}</h2>
    <p>${SITE.ctaLine ? rich(SITE.ctaLine) : `The first page of <b>${escapeHtml(modules[0]?.title || "")}</b> is where this starts.`}</p>
    <a class="btn btn--lg btn--solid" href="${startHref}">Start reading <b>→</b></a>
  </div>
</section>
</main>`;
}

export function modulePage(module, { rel = "../", contentHtml }) {
  const first = module.lessons.find((c) => c.kind === "lesson") || module.lessons[0];
  const rows = module.lessons
    .map(
      (c, i) => `<li class="toc__row" data-lesson="${module.slug}/${c.file}">
  <a class="toc__link" href="${c.file}.html">
    <span class="toc__n">${c.kind === "lesson" ? String(c.n).padStart(2, "0") : c.short}</span>
    <span class="toc__body">
      <span class="toc__title">${escapeHtml(c.title)}</span>
      ${c.headings.length ? `<span class="toc__sections">${c.headings.filter((h) => h.depth === 2).slice(0, 6).map((h) => escapeHtml(h.text)).join(" · ")}</span>` : ""}
    </span>
    <span class="toc__min">${c.minutes}m</span>
    <span class="toc__tick" data-tick aria-hidden="true">✓</span>
  </a>
</li>`,
    )
    .join("\n");

  return `<main id="main" class="modulepage">
<section class="mhero" style="--accent:${module.accent};--accent-ink:${module.accentInk}">
  <div class="mhero__inner">
    <div class="mhero__text">
      <p class="label"><a href="${rel}index.html#modules">${escapeHtml(SITE.unitLabelPlural)}</a> / ${escapeHtml(SITE.unitLabel)} ${String(module.num).padStart(2, "0")}${module.status ? ` · ${escapeHtml(module.status)}` : ""}</p>
      <h1 class="mhero__title">${escapeHtml(module.title)}</h1>
      <p class="mhero__sub">${rich(module.subtitle)}</p>
      <p class="mhero__blurb">${rich(module.blurb)}</p>
      <ul class="chiprow">
        <li class="chip">${module.lessons.length} pages</li>
        <li class="chip">${module.minutes} min total</li>
        <li class="chip">${module.words.toLocaleString("en-US")} words</li>
      </ul>
      <div class="mhero__cta">
        <a class="btn btn--lg btn--solid" href="${first.file}.html">Start reading <b>→</b></a>
        <a class="btn btn--lg" href="#contents">Contents</a>
      </div>
      <div class="mhero__progress" data-module-progress="${module.slug}" data-total="${module.lessons.length}">
        <div class="pbar"><span class="pbar__fill" style="width:0%"></span></div>
        <span class="pbar__text">0 / ${module.lessons.length} read</span>
      </div>
    </div>
    <div class="mhero__art" data-tilt>${cover(module, { size: "lg" })}</div>
  </div>
</section>
<section class="section modulepage__about">
  <div class="prose prose--narrow">${contentHtml}</div>
</section>
<section class="section" id="contents">
  <header class="section__head">
    <h2 class="section__title">Contents</h2>
    <p class="section__note">Every page in this ${escapeHtml(SITE.unitLabel.toLowerCase())}, in order. Times assume ~${SITE.wpm || 220} words a minute.</p>
  </header>
  <ol class="toc">${rows}</ol>
</section>
</main>`;
}

export function lessonPage({ module, lesson, prev, next, contentHtml, rel = "../" }) {
  const outline = lesson.headings
    .filter((h) => h.depth <= 3)
    .map(
      (h) => `<li class="mini__item mini__item--d${h.depth}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`,
    )
    .join("");

  const sidebar = module.lessons
    .map(
      (c) => `<li data-lesson="${module.slug}/${c.file}"><a href="${c.file}.html" class="${c.file === lesson.file ? "is-current" : ""}">
  <span class="snav__n">${c.kind === "lesson" ? String(c.n).padStart(2, "0") : c.short}</span>
  <span class="snav__t">${escapeHtml(c.title)}</span>
  <span class="snav__tick" data-tick aria-hidden="true">✓</span>
</a></li>`,
    )
    .join("");

  const navBtn = (c, dir) =>
    c
      ? `<a class="pager__item pager__item--${dir}" href="${c.file}.html">
  <span class="label">${dir === "prev" ? "← Previous" : "Next →"}</span>
  <b>${escapeHtml(c.title)}</b>
</a>`
      : `<span class="pager__item pager__item--${dir} is-empty">
  <span class="label">${dir === "prev" ? "← Previous" : "Next →"}</span>
  <b>${dir === "prev" ? "Module start" : "End of this module"}</b>
</span>`;

  return `<main id="main" class="reader" style="--accent:${module.accent};--accent-ink:${module.accentInk}"
  data-lesson-id="${module.slug}/${lesson.file}" data-module="${module.slug}"
  data-prev="${prev ? prev.file + ".html" : ""}" data-next="${next ? next.file + ".html" : ""}">
  <aside class="snav" data-snav>
    <div class="snav__head">
      <a class="snav__module" href="index.html" style="--accent:${module.accent}">
        <span class="label">${escapeHtml(SITE.unitLabel)} ${String(module.num).padStart(2, "0")}</span>
        <b>${escapeHtml(module.title)}</b>
      </a>
      <button class="btn btn--icon snav__close" type="button" data-snav-close aria-label="Close contents">✕</button>
    </div>
    <ol class="snav__list">${sidebar}</ol>
    <div class="snav__foot"><a href="${rel}index.html#modules">All modules →</a></div>
  </aside>

  <article class="page">
    <header class="page__head">
      <p class="page__crumbs"><a href="${rel}index.html">Home</a> <span>/</span> <a href="index.html">${escapeHtml(module.title)}</a></p>
      <h1 class="page__title">${escapeHtml(lesson.title)}</h1>
      <div class="page__meta">
        <span class="chip">${lesson.minutes} min read</span>
        <span class="chip">${lesson.words.toLocaleString("en-US")} words</span>
        <button class="chip chip--btn" type="button" data-mark-read>Mark as read</button>
      </div>
    </header>
    <div class="prose" data-prose>${contentHtml}</div>
    <nav class="pager" aria-label="Chapter navigation">
      ${navBtn(prev, "prev")}
      ${navBtn(next, "next")}
    </nav>
    <div class="page__done" data-done-card hidden>
      <span class="label">Lesson complete</span>
      <p>Nice. That's <b>${lesson.minutes} minutes</b> of ${escapeHtml(module.title)} behind you.</p>
      ${next ? `<a class="btn btn--solid" href="${next.file}.html">Continue to ${escapeHtml(next.title)} →</a>` : `<a class="btn btn--solid" href="${rel}index.html#modules">Pick the next module →</a>`}
    </div>
  </article>

  <aside class="mini">
    <div class="mini__sticky">
      <h2 class="label">On this page</h2>
      <ol class="mini__list" data-outline>${outline || '<li class="mini__item"><a href="#main">Top</a></li>'}</ol>
      <div class="mini__tools">
        <button class="btn btn--sm" type="button" data-snav-open>Contents <kbd>c</kbd></button>
        <button class="btn btn--sm" type="button" data-top>Top ↑</button>
      </div>
    </div>
  </aside>
  <button class="fab" type="button" data-snav-open aria-label="Open contents">☰ Contents</button>
</main>`;
}

export function plainPage({ title, kicker, contentHtml, lede = "" }) {
  return `<main id="main">
<section class="phero">
  <p class="label">${escapeHtml(kicker)}</p>
  <h1 class="phero__title">${escapeHtml(title)}</h1>
  ${lede ? `<p class="phero__lede">${lede}</p>` : ""}
</section>
<section class="section">
  <div class="prose prose--narrow">${contentHtml}</div>
</section>
</main>`;
}
