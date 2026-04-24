(function () {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("slug");
  if (slug) slug = slug.trim();

  if (!slug) {
    try {
      const recovered = window.sessionStorage.getItem("moji_pending_article_slug");
      if (recovered) {
        slug = String(recovered).trim();
        window.sessionStorage.removeItem("moji_pending_article_slug");
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (slug) {
    try {
      const canonical = new URL("article.html", window.location.href);
      canonical.searchParams.set("slug", slug);
      const cur = window.location.pathname + window.location.search;
      const want = canonical.pathname + canonical.search;
      if (cur !== want) {
        window.history.replaceState(null, "", want);
      }
    } catch (e2) {
      /* ignore */
    }
  }

  const posts = window.POSTS || [];
  const post = slug ? posts.find((p) => p.slug === slug) : null;

  function articleHrefFor(sl) {
    try {
      return new URL("article.html?slug=" + encodeURIComponent(sl), window.location.href).href;
    } catch (e3) {
      return "article.html?slug=" + encodeURIComponent(sl);
    }
  }

  const titleEl = document.getElementById("article-title");
  const dateEl = document.getElementById("article-date");
  const tagsEl = document.getElementById("article-tags");
  const bodyEl = document.getElementById("article-body");
  const missingEl = document.getElementById("article-missing");
  const docShell = document.getElementById("article-doc-shell");
  const navDesktop = document.getElementById("article-nav-desktop");
  const navMobile = document.getElementById("article-nav-mobile");
  const tocDesktop = document.getElementById("article-toc-desktop");
  const tocMobile = document.getElementById("article-toc-mobile");

  if (!post) {
    if (docShell) docShell.classList.add("hidden");
    if (missingEl) {
      missingEl.classList.remove("hidden");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          missingEl.classList.add("ui-fade-in");
        });
      });
    }
    document.title = "未找到文章";
    return;
  }

  document.title = `${post.title} · ${window.BLOG_META?.siteTitle || "博客"}`;

  if (docShell) docShell.classList.remove("hidden");

  if (titleEl) titleEl.textContent = post.title;
  if (dateEl) {
    dateEl.dateTime = post.date;
    dateEl.textContent = post.date;
  }
  if (tagsEl) {
    tagsEl.innerHTML = post.tags
      .map(
        (t) =>
          `<span class="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">${t}</span>`
      )
      .join("");
  }
  if (bodyEl) bodyEl.innerHTML = post.contentHtml;

  function buildPostNavHtml() {
    return posts
      .map((p) => {
        const active = p.slug === slug;
        const cls = active
          ? "doc-side-link doc-side-link-active cursor-pointer"
          : "doc-side-link cursor-pointer text-zinc-600 hover:bg-sky-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-sky-950/40 dark:hover:text-zinc-100";
        return `<a class="${cls} block rounded-lg px-2 py-1.5 transition-colors duration-200" href="${articleHrefFor(p.slug)}">${escapeHtml(p.title)}</a>`;
      })
      .join("");
  }

  const navHtml = buildPostNavHtml();
  if (navDesktop) navDesktop.innerHTML = navHtml;
  if (navMobile) navMobile.innerHTML = navHtml;

  function bindNavSlugBackup(root) {
    if (!root) return;
    root.addEventListener(
      "pointerdown",
      function (e) {
        var a = e.target && e.target.closest && e.target.closest("a[href*='article.html']");
        if (!a || !root.contains(a)) return;
        try {
          var u = new URL(a.getAttribute("href") || "", window.location.href);
          var s = u.searchParams.get("slug");
          if (s) window.sessionStorage.setItem("moji_pending_article_slug", String(s).trim());
        } catch (ex) {
          /* ignore */
        }
      },
      true
    );
  }
  bindNavSlugBackup(navDesktop);
  bindNavSlugBackup(navMobile);

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugifyHeading(text, index, used) {
    let base = text
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fff-]/g, "")
      .slice(0, 48);
    if (!base) base = "section";
    let id = `h-${base}`;
    let n = 0;
    while (used.has(id)) {
      n += 1;
      id = `h-${base}-${n}`;
    }
    used.add(id);
    return id;
  }

  function enhanceHeadingsAndToc() {
    if (!bodyEl) return;
    const headings = bodyEl.querySelectorAll("h2, h3");
    const used = new Set();
    /** @type {{ id: string; text: string; level: number }[]} */
    const items = [];

    headings.forEach((el, i) => {
      const tag = el.tagName.toLowerCase();
      const level = tag === "h3" ? 3 : 2;
      const text = el.textContent || "";
      const id = slugifyHeading(text, i, used);
      el.id = id;
      el.classList.add("scroll-target");
      items.push({ id, text, level });
    });

    if (items.length === 0) {
      const empty = '<p class="px-2 text-xs text-zinc-500 dark:text-zinc-400">本篇暂无小节标题</p>';
      if (tocDesktop) tocDesktop.innerHTML = empty;
      if (tocMobile) tocMobile.innerHTML = empty;
      return;
    }

    const tocHtml = items
      .map((item) => {
        const pad = item.level === 3 ? "pl-3" : "";
        return `<a class="toc-link ${pad} mb-0.5 block cursor-pointer rounded-md px-2 py-1 text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" href="#${item.id}" data-toc-target="${item.id}">${escapeHtml(item.text)}</a>`;
      })
      .join("");

    if (tocDesktop) tocDesktop.innerHTML = tocHtml;
    if (tocMobile) tocMobile.innerHTML = tocHtml;
  }

  enhanceHeadingsAndToc();

  function setActiveToc(id) {
    document.querySelectorAll("[data-toc-target]").forEach((a) => {
      const on = a.getAttribute("data-toc-target") === id;
      a.classList.toggle("toc-link-active", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }

  const headingEls = bodyEl ? Array.from(bodyEl.querySelectorAll("h2.scroll-target, h3.scroll-target")) : [];
  const headerLine = 112;

  function updateTocFromScroll() {
    if (headingEls.length === 0) return;
    let current = headingEls[0].id;
    for (let i = 0; i < headingEls.length; i += 1) {
      const h = headingEls[i];
      const top = h.getBoundingClientRect().top;
      if (top <= headerLine) current = h.id;
    }
    setActiveToc(current);
  }

  if (headingEls.length > 0) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            updateTocFromScroll();
            ticking = false;
          });
        }
      },
      { passive: true }
    );
    updateTocFromScroll();
  }

  document.querySelectorAll("[data-toc-target]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.getAttribute("data-toc-target");
      if (id) setActiveToc(id);
    });
  });

  const rippleSelNav = "a.doc-side-link, a.doc-side-link-active";
  const rippleSelToc = "a.toc-link, a.toc-link-active";
  if (typeof window.attachPointerRipple === "function") {
    if (navDesktop) window.attachPointerRipple(navDesktop, rippleSelNav);
    if (navMobile) window.attachPointerRipple(navMobile, rippleSelNav);
    if (tocDesktop) window.attachPointerRipple(tocDesktop, rippleSelToc);
    if (tocMobile) window.attachPointerRipple(tocMobile, rippleSelToc);
  }
})();
