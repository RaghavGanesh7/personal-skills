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

/** Escape hand-written copy, honouring `backticks` as inline code. */
export function inlineCode(s) {
  return escapeHtml(s).replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
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
  const body = liftCallouts(lines.slice(start).join("\n").trim());

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

  return { html, headings, title, plain, words: plain.split(" ").filter(Boolean).length };
}
