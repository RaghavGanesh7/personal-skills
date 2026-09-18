/* Reader chrome: theme, read/resume progress, search, outline sync, keyboard.
   No framework, no build step — this file ships as-is to docs/assets/. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const REL = document.body.dataset.rel || "";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- storage ---------------- */
  const KEY_READ = "course:read";
  const KEY_LAST = "course:last";
  const KEY_THEME = "course:theme";

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* private mode — progress just won't persist */
      }
    },
    del(key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
  };

  const readSet = () => new Set(store.get(KEY_READ, []));
  const saveRead = (set) => store.set(KEY_READ, Array.from(set));

  /* ---------------- theme ---------------- */
  const themeIcon = () => {
    const icon = $("[data-theme-icon]");
    if (icon) icon.textContent = document.documentElement.dataset.theme === "dark" ? "◓" : "◑";
  };
  themeIcon();
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY_THEME, next);
    } catch {}
    themeIcon();
  };
  $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));

  /* ---------------- diagrams ----------------
     Mermaid is loaded only on pages that contain a diagram, and re-run when the
     theme flips because mermaid bakes its colours into the SVG it emits. A
     diagram it cannot draw keeps showing its own source rather than an error. */
  (function diagrams() {
    if (!$("pre.mermaid")) return;
    const sources = $$("pre.mermaid").map((el) => el.textContent);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";
    script.onload = () => {
      const render = () => {
        const dark = document.documentElement.dataset.theme === "dark";
        $$("pre.mermaid").forEach((el, i) => {
          el.removeAttribute("data-processed");
          el.textContent = sources[i];
        });
        window.mermaid.initialize({
          startOnLoad: false,
          theme: dark ? "dark" : "neutral",
          securityLevel: "strict",
          fontFamily: getComputedStyle(document.body).getPropertyValue("--mono") || "monospace",
        });
        window.mermaid
          .run({ nodes: $$("pre.mermaid"), suppressErrors: true })
          .catch(() => {})
          .finally(() => {
            $$("pre.mermaid").forEach((el) => {
              if (!el.querySelector("svg")) el.closest("figure")?.classList.add("is-unrendered");
            });
          });
      };
      render();
      new MutationObserver(render).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    };
    script.onerror = () => $$("pre.mermaid").forEach((el) => el.closest("figure")?.classList.add("is-unrendered"));
    document.head.appendChild(script);
  })();

  /* ---------------- progress painting ---------------- */
  function paintProgress() {
    const read = readSet();

    $$("[data-lesson]").forEach((el) => {
      el.setAttribute("data-read", read.has(el.dataset.lesson) ? "true" : "false");
    });

    $$("[data-module-progress]").forEach((el) => {
      const slug = el.dataset.moduleProgress;
      const total = Number(el.dataset.total) || 1;
      const done = Array.from(read).filter((id) => id.startsWith(slug + "/")).length;
      const pct = Math.round((done / total) * 100);
      const fill = $(".pbar__fill", el);
      const text = $(".pbar__text", el);
      if (fill) fill.style.width = pct + "%";
      if (text) text.textContent = `${done} / ${total} read${pct === 100 ? " ✓" : ""}`;
    });

    const main = $(".reader");
    if (main) {
      const isRead = read.has(main.dataset.lessonId);
      const btn = $("[data-mark-read]");
      if (btn) {
        btn.setAttribute("aria-pressed", String(isRead));
        btn.textContent = isRead ? "Read ✓" : "Mark as read";
      }
    }
  }

  /* ---------------- resume card (home) ---------------- */
  (function resume() {
    const box = $("[data-resume]");
    const last = store.get(KEY_LAST, null);
    if (!box || !last || !last.url) return;
    const link = $("[data-resume-link]", box);
    link.href = REL + last.url;
    link.textContent = `${last.module} — ${last.title} →`;
    box.hidden = false;
    const cta = $("[data-resume-href]");
    if (cta) {
      cta.href = REL + last.url;
      cta.innerHTML = "Continue reading <b>→</b>";
    }
  })();

  /* ---------------- reader behaviours ---------------- */
  (function reader() {
    const main = $(".reader");
    if (!main) return;

    const id = main.dataset.lessonId;
    const moduleTitle = $(".snav__module b")?.textContent?.trim() || "";
    const title = $(".page__title")?.textContent?.trim() || "";
    store.set(KEY_LAST, { id, url: id + ".html", title, module: moduleTitle });

    const setRead = (value) => {
      const set = readSet();
      value ? set.add(id) : set.delete(id);
      saveRead(set);
      paintProgress();
    };

    $("[data-mark-read]")?.addEventListener("click", () => setRead(!readSet().has(id)));

    // auto-complete near the end of the article
    const done = $("[data-done-card]");
    const bar = $("[data-progress-bar]");
    const article = $(".page");
    let autoMarked = readSet().has(id);

    const onScroll = () => {
      const top = article.offsetTop;
      const height = article.offsetHeight - innerHeight;
      const pct = height > 0 ? Math.min(1, Math.max(0, (scrollY - top) / height)) : 1;
      if (bar) bar.style.width = (pct * 100).toFixed(2) + "%";
      if (pct > 0.9) {
        if (done) done.hidden = false;
        if (!autoMarked) {
          autoMarked = true;
          setRead(true);
        }
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();

    // sidebar drawer
    const snav = $("[data-snav]");
    const openNav = () => {
      snav.classList.add("is-open");
      $(".snav__close")?.focus();
    };
    const closeNav = () => snav.classList.remove("is-open");
    $$("[data-snav-open]").forEach((b) => b.addEventListener("click", openNav));
    $$("[data-snav-close]").forEach((b) => b.addEventListener("click", closeNav));
    snav.addEventListener("click", (e) => {
      if (e.target.closest("a") && innerWidth <= 900) closeNav();
    });
    // keep the current lesson visible in a long sidebar
    $(".snav__list a.is-current")?.scrollIntoView({ block: "center" });

    $("[data-top]")?.addEventListener("click", () =>
      scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }),
    );

    // live outline — highlight the last heading scrolled past
    const items = $$("[data-outline] .mini__item");
    const heads = $$(".prose-h[id]");
    if (items.length && heads.length) {
      const byId = new Map(items.map((li) => [li.querySelector("a").hash.slice(1), li]));
      let active = null;
      const sync = () => {
        let current = heads[0];
        for (const h of heads) {
          if (h.getBoundingClientRect().top <= 130) current = h;
          else break;
        }
        const li = byId.get(current.id);
        if (!li || li === active) return;
        active?.classList.remove("is-active");
        li.classList.add("is-active");
        active = li;
        const box = $(".mini__sticky");
        if (box && li.offsetTop > box.scrollTop + box.clientHeight - 40) {
          box.scrollTop = li.offsetTop - box.clientHeight / 2;
        }
      };
      let queued = false;
      addEventListener(
        "scroll",
        () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            sync();
          });
        },
        { passive: true },
      );
      sync();
    }

    // lesson paging keys
    document.addEventListener("keydown", (e) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "]" && main.dataset.next) location.href = main.dataset.next;
      if (e.key === "[" && main.dataset.prev) location.href = main.dataset.prev;
      if (e.key === "c") {
        e.preventDefault();
        snav.classList.contains("is-open") ? closeNav() : openNav();
      }
      if (e.key === "m") setRead(!readSet().has(id));
    });
  })();

  paintProgress();

  $("[data-reset-progress]")?.addEventListener("click", (e) => {
    store.del(KEY_READ);
    store.del(KEY_LAST);
    paintProgress();
    e.target.textContent = "Progress cleared";
  });

  /* ---------------- copy code ---------------- */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const code = btn.closest(".code")?.querySelector("code");
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = "COPIED";
      btn.classList.add("is-done");
    } catch {
      btn.textContent = "SELECT + COPY";
      getSelection()?.selectAllChildren(code);
    }
    setTimeout(() => {
      btn.textContent = "COPY";
      btn.classList.remove("is-done");
    }, 1600);
  });

  /* ---------------- reveal on scroll ---------------- */
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  }
  // failsafe: never leave content invisible if the observer never fires
  addEventListener("load", () =>
    setTimeout(() => $$(".reveal:not(.is-in)").forEach((el) => el.classList.add("is-in")), 1500),
  );

  /* ---------------- pointer tilt ---------------- */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    $$("[data-tilt]").forEach((el) => {
      const inner = el.querySelector(".card3d__body") || el;
      const base = el.classList.contains("pillar") ? 0 : 18;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `rotateY(${base + x * 16}deg) rotateX(${-y * 12}deg)`;
        inner.style.transition = "transform .08s linear";
      });
      el.addEventListener("pointerleave", () => {
        inner.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1)";
        inner.style.transform = "";
      });
    });
  }

  /* ---------------- search ---------------- */
  (function search() {
    const overlay = $(".search[data-search]");
    const input = $("[data-search-input]");
    const results = $("[data-search-results]");
    if (!overlay || !input || !results) return;

    let index = null;
    let loading = null;
    let active = -1;

    const load = () => {
      if (index) return Promise.resolve(index);
      loading =
        loading ||
        fetch(REL + "assets/search-index.json")
          .then((r) => r.json())
          .then((data) => {
            index = data;
            return data;
          })
          .catch(() => {
            index = [];
            return index;
          });
      return loading;
    };

    const open = () => {
      overlay.hidden = false;
      document.documentElement.style.overflow = "hidden";
      input.focus();
      input.select();
      load().then(() => input.value.length > 1 && run(input.value));
    };
    const close = () => {
      overlay.hidden = true;
      document.documentElement.style.overflow = "";
    };

    $$("[data-open-search]").forEach((b) => b.addEventListener("click", open));
    $$("[data-search-close]").forEach((b) => b.addEventListener("click", close));

    const escapeHtml = (s) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

    const mark = (text, terms) => {
      let out = escapeHtml(text);
      terms.forEach((t) => {
        if (t.length < 2) return;
        out = out.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
      });
      return out;
    };

    function score(entry, terms) {
      let total = 0;
      const h = (entry.h || "").toLowerCase();
      const c = entry.c.toLowerCase();
      const t = entry.t.toLowerCase();
      for (const term of terms) {
        let s = 0;
        if (h.includes(term)) s += h.startsWith(term) ? 14 : 9;
        if (c.includes(term)) s += 5;
        if (t.includes(term)) s += 2;
        if (!s) return 0; // every term must appear somewhere
        total += s;
      }
      return total;
    }

    function run(query) {
      const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
      if (!terms.length) {
        results.innerHTML =
          '<p class="search__hint">Type at least two characters. Results are ranked by heading, then by body text.</p>';
        return;
      }
      const hits = (index || [])
        .map((entry) => ({ entry, s: score(entry, terms) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 40);

      if (!hits.length) {
        results.innerHTML = `<p class="search__empty">Nothing for “${escapeHtml(query)}”. Try a single keyword instead of a phrase.</p>`;
        return;
      }

      results.innerHTML =
        `<p class="search__count">${hits.length} match${hits.length === 1 ? "" : "es"}</p>` +
        hits
          .map(({ entry }) => {
            const where = entry.h ? `${entry.b} · ${entry.c}` : entry.b;
            const title = entry.h || entry.c;
            return `<a class="sresult" href="${REL}${entry.u}">
  <span class="sresult__crumb">${escapeHtml(where)}</span>
  <span class="sresult__title">${mark(title, terms)}</span>
  <span class="sresult__snip">${mark(entry.t.slice(0, 190), terms)}…</span>
</a>`;
          })
          .join("");
      active = -1;
    }

    let timer = null;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => load().then(() => run(input.value)), 90);
    });

    input.addEventListener("keydown", (e) => {
      const items = $$(".sresult", results);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        items[active]?.classList.remove("is-active");
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[active].classList.add("is-active");
        items[active].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        const target = items[active] || items[0];
        if (target) {
          e.preventDefault();
          location.href = target.href;
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        overlay.hidden ? open() : close();
        return;
      }
      if (e.key === "/" && !isTyping(e)) {
        e.preventDefault();
        open();
      }
      if (e.key === "Escape") {
        if (!overlay.hidden) close();
        $("[data-sheet]") && ($("[data-sheet]").hidden = true);
        $("[data-snav]")?.classList.remove("is-open");
      }
    });
  })();

  /* ---------------- shortcuts sheet + global keys ---------------- */
  (function globalKeys() {
    const sheet = $("[data-sheet]");
    $$("[data-sheet-close]").forEach((b) => b.addEventListener("click", () => (sheet.hidden = true)));
    let goPending = false;
    document.addEventListener("keydown", (e) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        sheet.hidden = !sheet.hidden;
      } else if (e.key === "t") {
        toggleTheme();
      } else if (e.key === "g") {
        goPending = true;
        setTimeout(() => (goPending = false), 900);
      } else if (goPending && e.key === "h") {
        location.href = REL + "index.html";
      }
    });
  })();

  function isTyping(e) {
    const el = e.target;
    return (
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
    );
  }
})();
