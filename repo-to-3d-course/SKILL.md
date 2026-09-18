---
name: repo-to-3d-course
description: >-
  Turn any educational GitHub repository (a book, course, handbook, lecture notes, awesome-list
  curriculum) into a fast, static, brutalist 3D course website that people can actually read:
  module covers rendered in CSS 3D, a Three.js hero, full-text search, live per-lesson outlines,
  reading times, progress that survives a refresh, keyboard navigation, light/dark themes — then
  ship it to GitHub Pages with the upstream author's credit and licence intact.
metadata:
  version: 1.1.0
  author: Raghav Ganesh
  license: MIT
  tags:
    - static-site
    - education
    - documentation
    - markdown
    - three-js
    - brutalist-design
    - github-pages
    - content-pipeline
---

# Repo To 3D Course (Educational Repo → Readable 3D Website)

Educational repos are written to be *stored*, not read: a flat list of `ch1.md` files, a README
index, and no way to find anything. This skill converts one into a **static reading site** — one
HTML page per lesson, a real table of contents, search across everything, progress tracking, and
enough 3D to make the structure memorable — without changing a word of the author's prose.

The output is plain HTML/CSS/JS in `docs/`, buildable with two npm dependencies and servable by
GitHub Pages. No framework, no client-side router, no trackers.

---

## When to Use This Skill

Use it when the user points at a repository of teaching material and wants a website:

- "turn this book/course repo into a website", "make this readable", "build a site from these notes"
- "make it 3D / modern / beautiful / brutalist", "like <that other site we built>"
- a repo of `.md` chapters, lecture notes, a handbook, a syllabus, or exercise write-ups
- a personal notes or study repo that has outgrown GitHub's markdown viewer

Do **not** use it for: API reference docs (use a docs generator), a single README (just write a
page), or anything where the content must be authored from scratch — this skill presents existing
material, it does not write curriculum.

---

## Ground Rules (read before touching anything)

1. **The author's words are not yours to edit.** Copy the markdown verbatim. Fix presentation, never
   prose. No paraphrasing, no "improving" examples, no AI-written summaries inserted into chapters.
2. **Check the upstream licence first** (`LICENSE`, `LICENSE.txt`, README footer). Record it and
   carry it into the new repo unchanged.
   - Permissive (MIT/Apache/CC-BY/CC-BY-SA): fine; attribute, keep the licence file, note any
     share-alike obligation.
   - **CC-…-ND (no derivatives)**: reproducing the text *unmodified* with attribution for free
     reading is the author's own distribution intent; a re-presentation layer is acceptable, but say
     so plainly in the site's About page and in the final report to the user, and do not alter the text.
   - **No licence at all**: all rights reserved. Tell the user before building anything public, and
     offer a private repo or a local-only build instead.
3. **Credit is load-bearing UI, not a footnote.** Author name in the footer of every page, an About
   page naming the licence and linking upstream, and the author's own support/purchase links if they
   exist. Never present the site as the origin of the material.
4. **Two licences in one repo**: upstream licence for the content tree, MIT (or the user's choice)
   for the build/styles/scripts. Spell the split out in `LICENSE`.
5. **No secrets, ever**: no tokens, no local absolute paths, no analytics, no personal data in the
   generated site or its repo.

---

## What You Produce

```
<project>/
  content/                upstream markdown, copied verbatim (+ its figures)
  build/
    catalog.mjs           THE config: SITE identity + MODULES syllabus  <- the only file you rewrite
    render.mjs            markdown -> HTML (Prism, callouts, heading ids, link rewriting)
    pages.mjs             page shells: landing, module, lesson, plain
    build.mjs             measures content, writes docs/, search index, sitemap, 404
  src/assets/             styles.css (design system), app.js (reader chrome), hero.js (Three.js)
  tools/                  check_site.mjs (validator), check_diagrams.mjs, shots.mjs
  docs/                   BUILD OUTPUT — committed, served by GitHub Pages
  .github/workflows/      CI: rebuild and fail if docs/ is stale
```

Pages: landing (hero + stats + module grid + learning path + concepts + features + CTA), one
overview per module (3D cover, stats, contents), one page per lesson (sticky module nav, live
outline, progress bar, prev/next, copy-ready code), plus `about.html`, `404.html`, any standalone
pages (preface/syllabus), `sitemap.txt`, `.nojekyll`.

---

## Workflow

### Phase 1 — Recon the source repo

```bash
git clone --depth 1 <upstream-url> <scratch>/source && cd <scratch>/source
ls -R | head -60                                   # shape of the content tree
cat LICENSE* 2>/dev/null | head -20                # licence: do this before anything else
find . -name '*.md' | wc -l                        # 20 pages or 2000?
find . -name '*.md' -exec cat {} + | wc -c         # and how much prose
sed -n 1,8p */ch1.md                               # banner H1? epigraph? metadata block?
grep -rhoE '^```[a-zA-Z0-9]*' . | sort | uniq -c   # fence languages — and non-code fences
grep -rn '<img\|<figure' --include=*.md . | head   # figure markup and image paths
grep -rhoE '\]\([^)]*\)' --include=*.md . | grep -v http | sort | uniq -c | sort -rn | head
grep -rn '^| ' --include=*.md . | head             # single-cell tables used as callouts?
grep -rhoE '^\*\*[A-Za-z ]+:\*\*' --include=*.md . | sort | uniq -c | head  # metadata block?
ls site web docs public 2>/dev/null                # does the source ship its own web runtime?
```

Record: content root, file naming scheme, unit vocabulary (chapter/lesson/part), title line format,
callout convention, figure convention, image directory names, fence languages, and anything that is
a stub/draft/cancelled (those get listed as omitted, not shipped as empty pages).

Three findings change the plan and are easy to miss:

- **A lesson may be a directory, not a file** (`phases/<unit>/<lesson>/docs/en.md` plus sibling
  `assets/`, `code/`, `quiz.json`). Then you need the flattening pass in Phase 3, not a plain copy.
- **Non-code fences are content.** ```` ```mermaid ```` is a diagram; ```` ```figure ```` or
  ```` ```widget ```` is usually a hook into the source's own web runtime. Count them —
  531 figure blocks is not something to drop, it is something to port (see *Embedded runtimes*).
- **A repeated metadata block** under every title (`**Type:** … **Time:** …`) is structure, not
  prose: `render.mjs` lifts it into `facts` and the epigraph into a lede, and the lesson header
  renders them as chips. Nothing to configure, but check that it fired.

### Phase 2 — Decide the syllabus

Write down, before coding: the module list in **reading order**, each module's slug (URL segment =
content directory), which files belong to it and in what order, one accent colour per module, and a
one-line blurb plus a short subtitle for each. Skip README/TOC files — the site generates better
ones. Decide the vocabulary (`unitLabel`: Book, Module, Part, Track).

### Phase 3 — Scaffold and import the content

```bash
bash <skill>/scripts/scaffold.sh <project> <scratch>/source   # copies templates + content
cd <project> && npm install
```

If a lesson is a **directory** rather than a file, skip scaffold's copy (omit the second argument)
and flatten instead:

```bash
bash <skill>/scripts/scaffold.sh <project>
node <skill>/scripts/flatten_tree.mjs <scratch>/source <project> \
  --units phases --lesson docs/en.md --assets assets
```

That writes `content/<unit>/<lesson>.md`, namespaces each lesson's images under
`content/<unit>/assets/<lesson>/`, rewrites the links the move invalidates, and drops
`tools/.units.json` — the syllabus skeleton for Phase 4.

Two rules make the rewriting safe, and both exist because the naive version corrupted real text:
**mask fenced code before touching links** (`expert[indices[i]](x)` in a Python block is a valid
markdown link to a regex), and **resolve each link against the file's real location, rewriting only
when it lands exactly on a known lesson** (a blind `../../<name>/` rewrite turned the
`../../etc/passwd` in a sandbox-escape lesson into a link). Re-run the importer whenever you re-pull
upstream; treat it as a one-shot script and edit it when the layout differs.

Diff the result against the source before moving on — the importer should change links and image
paths and nothing else.

### Phase 4 — Fill in `build/catalog.mjs`

This is the whole configuration surface. Fill `SITE` (identity, credit, licence, hero lines,
vocabulary, standalone pages) and `MODULES` (one entry per module, in order). Keep `heroLines`
short — they render at up to 8.5rem. Pick accents from the palette comment at the bottom of the
file and set `accentInk` to `#111111` on light accents, `#FFFFFF` on saturated ones.

### Phase 5 — Adapt the pipeline to the source's quirks

`render.mjs` is where per-repo reality lives. Typical edits:

- `loadLanguages([...])` — add the languages the content actually uses.
- `liftCallouts()` — the shipped version converts single-cell markdown tables (`| NOTE: |`) into
  `<aside>` callouts. If the source uses blockquote admonitions (`> **Note**`), GitHub alerts
  (`> [!NOTE]`), or `:::note` fences, replace that pass with one that matches — a callout convention
  left unhandled ships as a stray table or a bare quote on every page.
- `SITE.dropBannerHeading` — set `true` when every file repeats a series H1 on line 1.
- `link()` — extend the rewriting if the repo links to `.ipynb`, directories, or bare filenames.
- `lessonMeta()` in `build.mjs` — add a pattern for the source's title convention if the built-in
  set (`Chapter N:`, `Lesson N:`, `Part N.`, `NN - Title`, `Appendix X:`, `01_file.md`) misses.

Notebooks (`.ipynb`): convert to markdown *first* (e.g. `jupyter nbconvert --to markdown`) into
`content/`, then treat as markdown. Do not teach the build about notebooks.

**Diagrams** come free: a ```` ```mermaid ```` fence renders as a `<figure class="mermaid-figure">`
and `app.js` loads mermaid from a CDN only on pages that contain one, re-running it when the theme
flips. Labels are escaped at build time — see the pitfalls table for why that is not optional.

### Embedded runtimes — port the author's widgets, don't drop them

If the source ships its own site (`site/`, `web/`, `docs/`) it may contain the *real* value: an
interactive-figure engine, a quiz runner, an animated explainer library, hooked up from a fenced
block like ```` ```figure\nkv-cache\n``` ````. Rendering that fence as a "see the original site"
placeholder throws away the best part of the material. Check first, because porting is often cheap:

1. **Is it self-contained?** Grep the runtime for `import `, `require(`, `fetch(`, and for globals
   it expects. Vanilla files that draw SVG and read CSS variables port as-is; anything reaching for
   a framework, an API or the source's own DOM does not.
2. **Copy it verbatim** into `src/assets/<runtime>/` (the build now copies `src/assets` recursively).
   It is the author's code — keep it unedited and say so in the licence split.
3. **Learn what it provides by executing it, not by parsing it.** These bundles end with a
   registration call; run each one in `node:vm` against a stub `window`/`document` that captures the
   registration, and write an id → file manifest. A regex over the same files missed 47 of 556 ids.
4. **Load per page.** Emit only that page's slice of the manifest into `<head>` (via `shell({ head })`)
   and let the runtime's own lazy loader pull the one or two bundles it needs. 1.9MB of widgets must
   never become 1.9MB on every lesson.
5. **Re-theme it through your tokens.** Map the runtime's variables onto the design system on the
   figure wrapper (`--blueprint: var(--accent)`, `--rule-soft: …`) so the widgets take the module
   accent and both themes instead of shipping a second palette.
6. **Watch for class-name collisions.** Generic names (`.label`, `.card`, `.grid`) in the vendored
   runtime or in mermaid's own SVG will inherit your component rules — this is what makes every
   diagram render in SHOUTING CAPS. Reset them inside the figure wrapper.

### Phase 6 — Build and validate (gate)

```bash
npm run build        # must print the page/module/lesson/word counts
npm run check        # tools/check_site.mjs: dead links, dead anchors, double-escaped entities,
                     # search-index anchors, template leaks ("undefined" in a page)
npm run serve &      # needed by the next one
npm run diagrams     # tools/check_diagrams.mjs: renders every mermaid block, fails on any
                     # that won't draw (skip only if the source has no diagrams)
```

All must be clean before you look at the design. `check_site.mjs` exists because every one of those
failures has shipped silently at least once; `check_diagrams.mjs` exists because mermaid does not
throw on a bad label — it draws the words `UNSUPPORTED MARKDOWN: LIST` into the SVG and *returns
successfully*, so a broken diagram looks identical to a working one from every other angle.

Read the check output before believing it. A validator that flags real prose is a validator people
learn to ignore: this material legitimately contains the words `NaN` and `undefined`, so the
template-leak rule matches only template-hole shapes (`[object Object]`, `<h1>undefined</h1>`,
`href="NaN"`) outside `<code>`/`<pre>`. If a rule fires on content, fix the rule.

### Phase 7 — Look at it (gate)

```bash
npm run serve            # one shell (docs/ on :8787)
npm run shots            # another shell -> .shots/*.png
```

Then actually open the PNGs and check:

- hero: does the 3D cross the headline or the CTA buttons? is the lede readable?
- module grid: orphan cells, overflowing cover type, cards of wildly different heights?
- lesson: prose measure ~70ch, code blocks not overflowing, callouts tagged, figures bordered?
- dark theme: is anything invisible? are the hard shadows too loud?
- phone (412px): does the 3D drown the text? does the contents FAB appear?
- search overlay: results ranked heading-first, terms highlighted?

Iterate here. This is the phase that decides whether the site feels designed or generated.

### Phase 8 — Ship

```bash
# README.md (what it is, features, build, credit), LICENSE (split: content vs code)
git init -b main && git add -A && git commit -m "Build the 3D reading edition of <material>"
gh repo create <repo-name> --public --source=. --remote=origin --push \
  --description "<one line>"
gh api -X POST repos/<owner>/<repo>/pages -f 'source[branch]=main' -f 'source[path]=/docs'
gh api repos/<owner>/<repo>/pages --jq .status     # poll until "built"
curl -s -o /dev/null -w "%{http_code}\n" https://<owner>.github.io/<repo>/
```

Then verify the **live** site in a real browser (`SHOT_BASE=https://<owner>.github.io/<repo> npm run
shots`) — CDN scripts, Google Fonts and relative paths behave differently under a Pages subpath than
on localhost. Report the live URL, the counts, and any licence caveat to the user.

---

## Design Rules

The look is **brutalist**: structure you can see, no ornament, no rounded corners, no gradients.

- **Tokens only.** Light palette on `:root`, dark overrides redefine *tokens* (`--paper`, `--ink`,
  `--accent`, `--shadow`), never component rules. One `--accent` per module drives cover, buttons,
  nav marker and progress.
- **Type**: one display face (Archivo Black) for headings, one grotesk (Space Grotesk) for UI, one
  serif (Literata) for body prose at ~1.0625rem/1.75, one mono (JetBrains Mono) for code, labels and
  chips. Uppercase + wide tracking for labels; tight negative tracking for display.
- **Edges**: 2px ink borders, hard offset shadows (`5px 5px 0`), zero border-radius anywhere. In
  dark mode dim the shadow (`color-mix(in srgb, var(--ink) 34%, var(--paper))`) or it screams.
- **Prose measure** 70-74ch. Reading comes first; the chrome never competes with it.
- **3D, three places only**: (1) one Three.js hero whose geometry *means* something about the
  subject — nested shells for containment/hierarchy, a lattice for graphs, a stack for layers;
  (2) each module as a CSS-3D object (front face + spine + back board) with pointer tilt;
  (3) subtle card tilt on interactive tiles. Never on prose.
- **Motion budget**: reveal-on-scroll (opacity + 18px rise), 0.12-0.18s hover transforms, one slow
  marquee. Everything gated on `prefers-reduced-motion`, plus a failsafe that reveals content if the
  observer never fires. A print stylesheet strips the chrome.
- **Accessibility**: skip link, visible focus rings, real `<kbd>`/`<aside>`/`<figure>` semantics,
  contrast checked in both themes, text never baked into images.

Reader features that make long material finishable: live outline synced to scroll position, reading
time from real word counts, auto "mark as read" at 90% scroll, resume-where-you-left-off on the
landing page (localStorage only), heading-first search, `[`/`]` paging, `c` contents, `m` mark read,
`t` theme, `?` shortcut sheet, `⌘K` or `/` for search.

---

## Pitfalls That Cost Real Time

| Symptom | Cause / fix |
|---|---|
| `marked.Marked is not a constructor` | v18 exports `{ Marked }`; renderer methods take **token objects** (`heading({tokens, depth})`), use `this.parser.parseInline(tokens)` |
| Raw `<<`, `&`, `<div>` inside `<code>` | marked does **not** escape codespan text — escape it yourself in the `codespan` renderer |
| Search links land at the top of the page | heading ids were slugified from *escaped* HTML (`&#39;`) while the index slugified raw markdown — decode entities before slugifying, on both sides |
| `&amp;quot;` in the outline/TOC | heading plain text taken from parsed inline HTML, then escaped again — decode once, escape once |
| 3D cover renders as a flat dark rectangle | a `filter` on the `transform-style: preserve-3d` element flattens the 3D context; put the filter on an ancestor or drop it |
| Cover spine invisible | side faces only show on the side you rotate *toward*: spine on the left needs **positive** `rotateY` |
| Cover title overflows the cover | size cover type in `cqw` with `container-type: inline-size`, never `vw` — the same component renders at 132px and 300px |
| WebGL bleeding through buttons | transparent buttons over a canvas; give every button an opaque `--btn-bg` |
| Whole sections blank in a screenshot | `.reveal { opacity: 0 }` with no failsafe — add a post-load timeout that reveals anything the IntersectionObserver missed |
| Outline highlight never appears | IO `rootMargin` bands leave gaps; sync from scroll position instead ("last heading with `top <= 130px`") |
| 404s only on GitHub Pages | root-relative (`/assets/...`) paths break under a `/<repo>/` subpath — keep every href depth-relative (`rel` prefix per page) |
| Snap-packaged Chromium writes no screenshot | confinement blocks paths outside `$HOME`; use puppeteer-core with an explicit `executablePath`, output under the project |
| Grid shows empty bordered cells | `auto-fit` with a fixed minmax leaves orphans; pin explicit column counts per breakpoint |
| Diagram renders the words `UNSUPPORTED MARKDOWN: LIST` | mermaid parses labels as markdown, so `["- log sigmoid"]`, `["4. AI libraries"]` and `["*"]` are lists. `escapeMermaidLabels()` escapes the marker; unquoted labels must be **quoted first**, because mermaid's lexer rejects a backslash outside quotes |
| `\n` shows up inside a diagram label | mermaid 11 does not honour a literal `\n`; it wants `<br/>` (handled in `escapeMermaidLabels`) |
| Every diagram renders in SHOUTING CAPS | mermaid names its own SVG groups `.label`/`.edgeLabel`, which inherit the site's uppercase label chip — reset `text-transform` inside the figure wrapper |
| Cover title breaks mid-word (`FOUNDATIO/NS`) | `cqw` alone is not enough for a long unbreakable word; size the type from the longest word (`112 / longest` cqw) |
| Search results jump to a heading that isn't there | the index split `^## ` across the whole file, including headings **inside fenced blocks** (prompt templates are full of `## Role`); strip fences before splitting |
| Literal `**bold**` on the About page | hand-written catalog copy runs through `inlineCode()`, which honoured only backticks |
| `ENOTDIR`/missing assets after vendoring a runtime | `build.mjs` copied `src/assets` file-by-file; it must be `cpSync(..., { recursive: true })` |
| Importer silently corrupts prose | a whole-file `../` rewrite hits `../../etc/passwd` in a sandbox lesson, and a `](x)` regex hits `expert[indices[i]](x)` in a code block — mask fences, and rewrite only links that resolve exactly onto a known lesson |
| Search feels heavy on a phone | the index is one JSON fetch: 5,000 entries × 260-char snippets is 2.2MB. `SITE.snippetChars` (160) halves it; check the gzipped size, not the raw one |
| Commits land under the wrong GitHub account | a mis-set `user.email` attributes the push to whoever owns that address; verify with `gh api repos/<o>/<r>/commits --jq '.[0].author.login'` |

---

## Reference

**Catalog fields** — `SITE`: `title`, `shortTitle`, `tagline`, `badge`, `wordmark`, `coverEyebrow`,
`edition`, `author`, `authorUrl`, `upstream`, `upstreamLabel`, `licence{name,url}`, `support[]`,
`repo`, `baseUrl`, `footerLine`, `about`, `unitLabel`, `unitLabelPlural`, `heroLines[]`,
`heroFillLine`, `heroOutlineLine`, `heroKicker`, `ticker[]`, `seriesTitle`, `seriesNote`,
`conceptsTitle`, `concepts[]`, `ctaTitle`, `ctaLine`, `pages[]`, `contentDir`, `wpm`,
`dropBannerHeading`, `assetDirs[]`, `snippetChars`. `MODULES[]`: `slug`, `num`, `title`, `subtitle`, `blurb`,
`accent`, `accentInk`, `status`, `support[]`, `files[]` (string or `{file,title,kind,short}`).

**Scripts** — `scripts/scaffold.sh <project> [content-src]` (never overwrites an existing
`catalog.mjs`), `scripts/flatten_tree.mjs <source> <project>` (nested lesson directories -> flat
content tree; `--units`, `--lesson`, `--assets`, `--unit-intro`, `--keep-num`),
`scripts/check_site.mjs` (validator, also wired into CI), `scripts/check_diagrams.mjs` (renders
every mermaid block; needs a running `npm run serve`), `scripts/shots.mjs` (screenshot matrix; env:
`SHOT_BASE`, `CHROME`, `SHOT_OUT`, `SHOT_QUERY`).

**Templates** — `templates/build/*.mjs`, `templates/src/assets/*`, `templates/package.json`,
`templates/gitignore`, `templates/ci-build.yml`.

---

## Definition Of Done

- [ ] Upstream licence identified, honoured, and stated on the About page and in the final report
- [ ] Author credited in the footer of every page, with links upstream and to their support channels
- [ ] `npm run build`, `npm run check` and (when the source has diagrams) `npm run diagrams` clean
- [ ] Screenshots reviewed at 1440px and 412px, in light and dark
- [ ] Every module has its own accent; no placeholder copy (`Module One`, `lorem`) left anywhere
- [ ] Keyboard map works; reduced-motion and print paths verified
- [ ] Any vendored runtime ported, re-themed, lazy-loaded per page, and named in the licence split
- [ ] `docs/` committed, Pages enabled from `/docs`, live URL returns 200 and was opened in a browser
- [ ] The pushed commit is attributed to the intended GitHub account
- [ ] README documents build steps and credit; `LICENSE` states the content/code split
- [ ] No secrets, absolute local paths, or trackers anywhere in the repo
