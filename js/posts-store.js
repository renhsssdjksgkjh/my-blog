/**
 * 文章数据来源（优先级）：
 * 1) 若配置了 BLOG_POSTS_JSON_URL 且 fetch 成功 → 使用 content/posts.json（Decap CMS 维护），忽略 localStorage 中的文章列表。
 * 2) 否则沿用 localStorage（与 js/posts.js 种子数据配合）。
 *
 * 请用 HTTP 服务打开站点（如 npx serve），以便 fetch 能读到 JSON；直接 file:// 打开时通常会回退到 posts.js 种子。
 */
(function () {
  var KEY = "moji_blog_posts_v1";

  function clonePosts(arr) {
    return JSON.parse(JSON.stringify(arr));
  }

  /** @param {unknown} t */
  function normalizeTags(t) {
    if (t == null) return [];
    if (typeof t === "string") {
      return t
        .split(/[,，]/)
        .map(function (x) {
          return x.trim();
        })
        .filter(Boolean);
    }
    if (Array.isArray(t)) {
      return t
        .map(function (item) {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object" && typeof item.tag === "string") return item.tag.trim();
          return String(item).trim();
        })
        .filter(Boolean);
    }
    return [];
  }

  /** @param {unknown} raw */
  function normalizePost(raw) {
    if (!raw || typeof raw !== "object") return null;
    var p = /** @type {Record<string, unknown>} */ (raw);
    var slug = typeof p.slug === "string" ? p.slug.trim() : "";
    var title = typeof p.title === "string" ? p.title : "";
    var date = typeof p.date === "string" ? p.date : "";
    var excerpt = typeof p.excerpt === "string" ? p.excerpt : "";
    var contentHtml = typeof p.contentHtml === "string" ? p.contentHtml : "";
    var tags = normalizeTags(p.tags);
    if (!slug) return null;
    return { slug: slug, title: title, date: date, excerpt: excerpt, tags: tags, contentHtml: contentHtml };
  }

  /** @param {unknown} arr */
  function validatePostsList(arr) {
    if (!Array.isArray(arr)) return false;
    if (arr.length === 0) return true;
    for (var i = 0; i < arr.length; i++) {
      var p = normalizePost(arr[i]);
      if (!p || !p.slug) return false;
      if (typeof p.title !== "string" || typeof p.date !== "string" || typeof p.excerpt !== "string" || typeof p.contentHtml !== "string") return false;
      if (!Array.isArray(p.tags)) return false;
    }
    return true;
  }

  /** @param {unknown} arr */
  function normalizePostsArray(arr) {
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var p = normalizePost(arr[i]);
      if (p) out.push(p);
    }
    return out;
  }

  window.__POSTS_SEED = clonePosts(window.POSTS || []);
  window.__BLOG_POSTS_STORAGE_KEY = KEY;
  window.__validatePostsArray = validatePostsList;

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!validatePostsList(parsed)) return;
      window.POSTS = normalizePostsArray(parsed);
      window.__POSTS_HYDRATED_FROM_STORAGE = true;
      window.__POSTS_SOURCE = "localStorage";
    } catch (e) {
      console.warn("[posts-store]", e);
    }
  }

  function getJsonUrl() {
    var u = window.BLOG_POSTS_JSON_URL;
    if (typeof u === "string" && u.trim()) return u.trim();
    return "";
  }

  /** @returns {Promise<void>} */
  window.loadBlogPosts = function () {
    var url = getJsonUrl();
    if (!url) {
      loadFromStorage();
      if (!window.__POSTS_SOURCE) window.__POSTS_SOURCE = window.__POSTS_HYDRATED_FROM_STORAGE ? "localStorage" : "seed";
      return Promise.resolve();
    }

    return fetch(url, { credentials: "same-origin", cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(function (data) {
        var list = data && Array.isArray(data.posts) ? data.posts : Array.isArray(data) ? data : null;
        if (!list || !validatePostsList(list)) throw new Error("invalid posts json");
        window.POSTS = normalizePostsArray(list);
        window.__POSTS_FROM_CMS_JSON = true;
        window.__POSTS_HYDRATED_FROM_STORAGE = false;
        window.__POSTS_SOURCE = "cms-json";
      })
      .catch(function (err) {
        console.warn("[posts-store] CMS JSON 加载失败，回退到本地种子或 localStorage:", err && err.message ? err.message : err);
        window.__POSTS_FROM_CMS_JSON = false;
        window.__POSTS_SOURCE = undefined;
        loadFromStorage();
        if (!window.__POSTS_HYDRATED_FROM_STORAGE) {
          window.POSTS = clonePosts(window.__POSTS_SEED);
          window.__POSTS_SOURCE = "seed";
        }
      });
  };

  /** @param {unknown} nextPosts */
  window.savePostsToStorage = function (nextPosts) {
    if (!validatePostsList(nextPosts)) {
      throw new Error("文章数据格式不正确");
    }
    if (window.__POSTS_FROM_CMS_JSON) {
      throw new Error("当前文章来自 CMS 文件（content/posts.json），请打开 admin/index.html（Decap CMS）编辑并提交到 Git，勿在此保存。");
    }
    localStorage.setItem(KEY, JSON.stringify(normalizePostsArray(nextPosts)));
    window.POSTS = normalizePostsArray(nextPosts);
    window.__POSTS_HYDRATED_FROM_STORAGE = true;
    window.__POSTS_SOURCE = "localStorage";
  };

  window.resetPostsToSeed = function () {
    if (window.__POSTS_FROM_CMS_JSON) {
      throw new Error("CMS 模式下无法恢复内置示例；请直接编辑仓库中的 content/posts.json。");
    }
    localStorage.removeItem(KEY);
    window.POSTS = clonePosts(window.__POSTS_SEED);
    window.__POSTS_HYDRATED_FROM_STORAGE = false;
    window.__POSTS_SOURCE = "seed";
  };
})();
