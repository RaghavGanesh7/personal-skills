/**
 * Markdown -> page-ready HTML.
 *
 * Everything that makes the prose readable happens here: build-time syntax
 * highlighting, single-cell tables lifted into real callouts, stable heading
 * ids (so the search index can deep-link), and .md links rewritten to .html.
 */
import { Marked } from "marked";
import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";

// add whatever your content actually uses — an unknown language degrades to plain text
loadLanguages(["javascript", "typescript", "jsx", "tsx", "json", "python", "bash", "sql", "yaml", "markup", "css", "java", "go", "rust", "c", "cpp"]);

const LANG_ALIAS = { js: "javascript", ts: "typescript", py: "python", sh: "bash", shell: "bash", yml: "yaml", html: "markup", text: null, txt: null, none: null, "": null };

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

export function decodeEntities(s) {
  return s.replace(/&(#39|amp|lt|gt|quot|apos|nbsp);/g, (m, k) => ENTITIES[k] ?? m);
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Many authors write asides as a single-cell markdown table:
 *   | NOTE: |
 *   | :--- |
 *   | body text |
 * Lift those into real <aside> callouts. Delete this pass if your source uses
 * blockquotes or admonition syntax instead — and add one for what it does use.
 */
function liftCallouts(md) {
  return md.replace(
    /^\|[ \t]*([^|\n]+?)[ \t]*\|[ \t]*\n\|[ \t]*:?-{3,}:?[ \t]*\|[ \t]*\n\|[ \t]*([\s\S]+?)[ \t]*\|[ \t]*$/gm,
    (all, rawTag, body) => {
      const tag = rawTag.replace(/:$/, "").trim();
      const key = tag.toLowerCase();
      const type = key.startsWith("note")
        ? "note"
        : key.startsWith("warn")
          ? "warning"
          : key.startsWith("tip")
            ? "tip"
            : "wip";
      const inner = body.replace(/\s*\|\s*\n\s*\|\s*/g, " ").trim();
      return `<aside class="callout callout--${type}" data-tag="${escapeHtml(tag)}">\n\n${inner}\n\n</aside>`;
    },
  );
}

/** Escape hand-written copy (catalog blurbs, ledes), honouring `code` and **bold**. */
export function inlineCode(s) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

/**
 * Many course repos repeat a metadata block directly under the lesson title:
 *
 *   # Title
 *   > one-line epigraph
 *   **Type:** Build
 *   **Time:** ~45 minutes
 *
 * Pull it apart so the page header can render it as a lede and chips, instead of
 * leaving four bold lines stranded at the top of the prose. Sources without this
 * shape simply return empty values and nothing changes.
 */
function liftFrontMatter(body) {
  const facts = {};
  let epigraph = "";
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if (!epigraph && (m = /^>\s*(.+)$/.exec(line))) { epigraph = m[1].trim(); i++; continue; }
    if ((m = /^\*\*([A-Za-z][A-Za-z ]{1,24}):\*\*\s*(.+)$/.exec(line))) { facts[m[1].trim()] = m[2].trim(); i++; continue; }
    break;
  }
  return { facts, epigraph, body: lines.slice(i).join("\n") };
}

/**
 * Mermaid parses node labels as markdown, so a label that happens to start with
 * a list or quote marker — `["- log sigmoid"]`, `["4. AI libraries"]`, `["*"]` —
 * renders as the words UNSUPPORTED MARKDOWN: LIST instead of the diagram, and
 * mermaid reports success while doing it. Escaping the marker keeps the label
 * identical on screen and costs nothing everywhere else. A literal \n in a label
 * is likewise printed as the characters "\n"; mermaid 11 wants <br/>.
 */
const escapeLabel = (label) =>
  label
    .replace(/(^|\\n)(\s*)(\d+)\.(\s)/g, (_, a, sp, n, tail) => `${a}${sp}${n}\\.${tail}`)
    .replace(/(^|\\n)(\s*)>(\s)/g, (_, a, sp, tail) => `${a}${sp}\\>${tail}`)
    .replace(/(^|\\n)(\s*)([-*+])(\s|$)/g, (_, a, sp, ch, tail) => `${a}${sp}\\${ch}${tail}`);

export function escapeMermaidLabels(src) {
  return src
    .replace(/"([^"\n]*)"/g, (_, label) => `"${escapeLabel(label).replace(/\\n/g, "<br/>")}"`)
    // an unquoted label cannot carry a backslash — mermaid's lexer rejects it —
    // so quote it first, which is also what makes the escape legal
    .replace(/\[([^\]"\n]*)\]/g, (all, label) =>
      /^\s*(?:[-*+]\s|\d+\.\s|>)/.test(label) ? `["${escapeLabel(label)}"]` : all,
    );
}

/** Mermaid diagrams are hydrated in the browser by app.js; ship the source. */
function mermaidHost(code) {
  return `<figure class="mermaid-figure">
  <pre class="mermaid">${escapeHtml(escapeMermaidLabels(code))}</pre>
  <figcaption class="fig__cap"><span class="label">Diagram</span></figcaption>
</figure>\n`;
}

function highlight(code, lang) {
  const name = lang in LANG_ALIAS ? LANG_ALIAS[lang] : lang;
  if (name && Prism.languages[name]) {
    try {
      return Prism.highlight(code, Prism.languages[name], name);
    } catch {
      /* fall through to plain text */
    }
  }
  return escapeHtml(code);
}

/**
 * Render one markdown file into page-ready HTML.
 * Returns { html, headings, title, words, plain }.
 */
export function renderMarkdown(md, { linkBase = "", dropFirstHeading = false } = {}) {
  const lines = md.split("\n");
  // Some repos repeat a course/series banner as the first H1; set
  // SITE.dropBannerHeading when that is true, so the real title is line 2.
  let title = null;
  let start = 0;
  if (dropFirstHeading && /^# /.test(lines[0] || "")) start = 1;
  for (let i = start; i < Math.min(start + 4, lines.length); i++) {
    if (/^# /.test(lines[i])) {
      title = lines[i].replace(/^#\s+/, "").trim();
      start = i + 1;
      break;
    }
  }
  const front = liftFrontMatter(lines.slice(start).join("\n").trim());
  const body = liftCallouts(front.body);

  const headings = [];
  const used = new Map();
  const renderer = {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const base = slugify(decodeEntities(text));
      const n = (used.get(base) || 0) + 1;
      used.set(base, n);
      const id = n > 1 ? `${base}-${n}` : base;
      const plain = decodeEntities(text.replace(/<[^>]+>/g, ""));
      const level = Math.min(depth, 6);
      if (depth <= 3) headings.push({ id, text: plain, depth });
      return `<h${level} id="${id}" class="prose-h prose-h${depth}"><a class="prose-h__anchor" href="#${id}" aria-label="Link to this section">#</a>${text}</h${level}>\n`;
    },
    code({ text, lang }) {
      const label = (lang || "text").split(/\s+/)[0];
      // fences that are not code: diagrams, and whatever widget syntax the
      // source invented (see the "Embedded runtimes" note in SKILL.md)
      if (label === "mermaid") return mermaidHost(text);
      const cls = LANG_ALIAS[label] === null ? "" : ` class="language-${LANG_ALIAS[label] || label}"`;
      return `<figure class="code">
  <figcaption class="code__bar"><span class="code__lang">${escapeHtml(label)}</span><button class="code__copy" type="button" data-copy aria-label="Copy code">COPY</button></figcaption>
  <pre class="code__pre"><code${cls}>${highlight(text, label)}</code></pre>
</figure>\n`;
    },
    codespan({ text }) {
      return `<code class="inline-code">${escapeHtml(decodeEntities(text))}</code>`;
    },
    link({ href, title: t, tokens }) {
      const inner = this.parser.parseInline(tokens);
      let url = href;
      if (/^(https?:)?\/\//.test(href) || href.startsWith("#") || href.startsWith("mailto:")) {
        // leave absolute + in-page links alone
      } else if (/\.md(#.*)?$/i.test(href)) {
        url = href
          .replace(/README\.md/i, "index.html")
          .replace(/toc\.md/i, "index.html#contents")
          .replace(/\.md/i, ".html");
        if (linkBase) url = linkBase + url;
      }
      const ext = /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${url}"${t ? ` title="${escapeHtml(t)}"` : ""}${ext}>${inner}</a>`;
    },
    image({ href, title: t, text }) {
      return `<img src="${href}" alt="${escapeHtml(text || "")}"${t ? ` title="${escapeHtml(t)}"` : ""} loading="lazy">`;
    },
    blockquote({ tokens }) {
      return `<blockquote class="quote">${this.parser.parse(tokens)}</blockquote>\n`;
    },
  };

  const parser = new Marked({ gfm: true, breaks: false }, { renderer });
  const html = parser.parse(body);
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return {
    html,
    headings,
    title,
    plain,
    words: plain.split(" ").filter(Boolean).length,
    facts: front.facts,
    epigraph: front.epigraph,
  };
}
