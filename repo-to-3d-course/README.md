# Repo To 3D Course

Converts an educational GitHub repository — a book, course, handbook, lecture notes — into a static,
brutalist **3D reading site**: CSS-3D module covers, a Three.js hero, full-text search, live
per-lesson outlines, reading times, progress that survives a refresh, keyboard navigation, and
light/dark themes. Ships to GitHub Pages with the upstream author's credit and licence intact.

Full playbook: **[SKILL.md](SKILL.md)**.

## Layout

```
SKILL.md                     the workflow: recon -> syllabus -> scaffold -> adapt -> verify -> ship
scripts/scaffold.sh          copy templates (+ upstream content) into a new project
scripts/check_site.mjs       post-build validator: dead links/anchors, escaping, search index
scripts/shots.mjs            headless screenshot matrix (desktop + phone, light + dark, search)
templates/build/catalog.mjs  the only file you rewrite per project: SITE + MODULES
templates/build/render.mjs   markdown -> HTML: Prism, callouts, heading ids, link rewriting
templates/build/pages.mjs    page shells: landing, module, lesson, plain
templates/build/build.mjs    measures content, writes docs/, search index, sitemap, 404
templates/src/assets/        styles.css (design tokens), app.js (reader chrome), hero.js (3D)
templates/package.json       two runtime deps: marked + prismjs
templates/ci-build.yml       CI that fails when committed docs/ is stale
templates/gitignore          node_modules, .shots, logs
```

## Quick start

```bash
git clone --depth 1 <upstream-repo> /tmp/source
bash scripts/scaffold.sh ~/repos/my-course-site /tmp/source
cd ~/repos/my-course-site && npm install
$EDITOR build/catalog.mjs          # SITE identity + credit, then MODULES in reading order
npm run build && npm run check     # both must be clean
npm run serve                      # then, in another shell: npm run shots
```

Output lands in `docs/` — commit it and enable GitHub Pages from `main` `/docs`.

## Non-negotiables

- The author's prose is copied verbatim; only the presentation is new.
- Upstream licence is checked **first**, carried over, and stated on the About page.
- Credit sits in the footer of every page, not in a buried note.
- No trackers, no secrets, no absolute local paths in the generated repo.
