(function () {
  const meta = window.BLOG_META;
  const posts = window.POSTS || [];
  const listEl = document.getElementById("post-list");
  const titleEl = document.getElementById("site-title");
  const taglineEl = document.getElementById("site-tagline");

  if (titleEl && meta) titleEl.textContent = meta.siteTitle;
  if (taglineEl && meta) taglineEl.textContent = meta.tagline;

  if (!listEl) return;

  const sorted = posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  listEl.innerHTML = sorted
    .map(
      (p, i) => `
    <li class="ui-fade-up-post flex h-full min-h-0" style="animation-delay: ${i * 75}ms">
      <a href="article.html?slug=${encodeURIComponent(p.slug)}"
         class="post-card-ripple-host post-card-motion group flex h-full min-h-0 flex-1 cursor-pointer flex-col rounded-2xl border border-zinc-200/90 bg-white/80 p-6 shadow-sm transition-colors duration-200 ease-out hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-blue-900/60">
        <div class="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <time datetime="${p.date}">${p.date}</time>
          ${p.tags
            .map(
              (t) =>
                `<span class="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">${t}</span>`
            )
            .join("")}
        </div>
        <h2 class="mt-3 font-display text-xl font-semibold tracking-tight text-zinc-950 transition-colors duration-200 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
          ${p.title}
        </h2>
        <p class="mt-2 min-h-0 flex-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">${p.excerpt}</p>
        <span class="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
          阅读全文
          <svg class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </a>
    </li>`
    )
    .join("");

  if (typeof window.attachPointerRipple === "function") {
    window.attachPointerRipple(listEl, "a.post-card-ripple-host");
  }
})();
