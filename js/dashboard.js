(function () {
  if (typeof window.AdminAuth === "undefined" || !window.AdminAuth.isLoggedIn()) {
    window.location.replace("login.html");
    return;
  }

  var editingSlug = null;
  var statusEl = document.getElementById("admin-status");
  var listEl = document.getElementById("admin-post-list");
  var form = document.getElementById("admin-post-form");
  var importInput = document.getElementById("admin-import-file");

  if (!form || !listEl) return;

  function applyCmsReadOnlyUi() {
    if (!window.__POSTS_FROM_CMS_JSON) return;
    var banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.className =
      "mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100";
    banner.innerHTML =
      "当前文章来自 <strong>content/posts.json</strong>。请使用 <a href=\"admin/index.html\" class=\"font-semibold underline decoration-blue-700/40 underline-offset-2 hover:opacity-90\">Decap CMS</a> 编辑并推送到 Git；下方表单与导入/恢复已禁用，仍可导出 JSON 作备份。";
    if (statusEl && statusEl.parentNode) {
      statusEl.insertAdjacentElement("afterend", banner);
    } else {
      form.parentNode.insertBefore(banner, form);
    }
    Array.prototype.forEach.call(form.elements, function (el) {
      el.disabled = true;
    });
    ["admin-btn-new", "admin-btn-reset-seed"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = true;
    });
    if (importInput) {
      importInput.disabled = true;
      var lab = importInput.closest("label");
      if (lab) {
        lab.classList.add("pointer-events-none", "cursor-not-allowed", "opacity-50");
      }
    }
  }

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.className =
      "rounded-xl border px-4 py-3 text-sm " +
      (isError
        ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200");
    if (!msg) statusEl.classList.add("hidden");
    else statusEl.classList.remove("hidden");
  }

  function getPosts() {
    return JSON.parse(JSON.stringify(window.POSTS || []));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function normalizeSlug(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");
  }

  function parseTags(str) {
    return String(str || "")
      .split(/[,，]/)
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
  }

  function renderList() {
    var posts = window.POSTS || [];
    if (posts.length === 0) {
      listEl.innerHTML =
        '<li class="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">暂无文章</li>';
      return;
    }

    listEl.innerHTML = posts
      .map(function (p) {
        return (
          '<li class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">' +
          '<div class="min-w-0 flex-1">' +
          '<p class="font-medium text-zinc-900 dark:text-zinc-50">' +
          escapeHtml(p.title) +
          "</p>" +
          '<p class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">' +
          escapeHtml(p.slug) +
          " · " +
          escapeHtml(p.date) +
          "</p></div>" +
          '<div class="flex shrink-0 flex-wrap gap-2">' +
          '<button type="button" class="admin-edit cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors duration-200 hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500" data-slug="' +
          escapeAttr(p.slug) +
          '">编辑</button>' +
          '<button type="button" class="admin-delete cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors duration-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900/60 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-950/30" data-slug="' +
          escapeAttr(p.slug) +
          '">删除</button>' +
          "</div></li>"
        );
      })
      .join("");

    listEl.querySelectorAll(".admin-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadIntoForm(btn.getAttribute("data-slug"));
      });
    });
    listEl.querySelectorAll(".admin-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removePost(btn.getAttribute("data-slug"));
      });
    });
  }

  function loadIntoForm(slug) {
    var p = (window.POSTS || []).find(function (x) {
      return x.slug === slug;
    });
    if (!p) return;
    editingSlug = slug;
    form.slug.value = p.slug;
    form.slug.readOnly = true;
    form.title.value = p.title;
    form.date.value = p.date;
    form.tags.value = p.tags.join(", ");
    form.excerpt.value = p.excerpt;
    form.contentHtml.value = p.contentHtml;
    setStatus("正在编辑：" + p.title);
  }

  function clearForm() {
    editingSlug = null;
    form.reset();
    form.slug.readOnly = false;
    setStatus("");
  }

  function removePost(slug) {
    if (window.__POSTS_FROM_CMS_JSON) {
      setStatus("CMS 模式下请在 Decap 中删除文章。", true);
      return;
    }
    if (!slug) return;
    var title =
      ((window.POSTS || []).find(function (p) {
        return p.slug === slug;
      }) || {}).title || slug;
    if (!confirm("确定删除「" + title + "」？\n建议先导出 JSON 备份。")) return;
    var posts = getPosts().filter(function (p) {
      return p.slug !== slug;
    });
    if (posts.length === (window.POSTS || []).length) return;
    try {
      window.savePostsToStorage(posts);
    } catch (err) {
      setStatus(err.message || String(err), true);
      return;
    }
    if (editingSlug === slug) clearForm();
    renderList();
    setStatus("已删除");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (window.__POSTS_FROM_CMS_JSON) {
      setStatus("当前为 CMS 数据源，请使用 admin/index.html（Decap）编辑。", true);
      return;
    }
    var slugInput = normalizeSlug(form.slug.value);
    var title = form.title.value.trim();
    var date = form.date.value.trim();
    var excerpt = form.excerpt.value.trim();
    var tags = parseTags(form.tags.value);
    var contentHtml = form.contentHtml.value;

    if (!editingSlug && !slugInput) {
      setStatus("请填写 slug（英文或拼音，用于网址）", true);
      return;
    }
    if (!title) {
      setStatus("请填写标题", true);
      return;
    }
    if (!date) {
      setStatus("请填写日期", true);
      return;
    }

    var posts = getPosts();
    var newPost = {
      slug: editingSlug || slugInput,
      title: title,
      date: date,
      excerpt: excerpt,
      tags: tags,
      contentHtml: contentHtml,
    };

    try {
      if (editingSlug) {
        var ix = posts.findIndex(function (p) {
          return p.slug === editingSlug;
        });
        if (ix === -1) {
          setStatus("找不到正在编辑的文章", true);
          return;
        }
        newPost.slug = editingSlug;
        posts[ix] = newPost;
      } else {
        if (
          posts.some(function (p) {
            return p.slug === slugInput;
          })
        ) {
          setStatus("slug 已存在，请换一个", true);
          return;
        }
        newPost.slug = slugInput;
        posts.unshift(newPost);
      }
      window.savePostsToStorage(posts);
    } catch (err) {
      setStatus(err.message || String(err), true);
      return;
    }

    renderList();
    clearForm();
    setStatus("已保存到本机浏览器");
  });

  document.getElementById("admin-btn-new")?.addEventListener("click", function () {
    clearForm();
    setStatus("已清空表单，可新建文章");
  });

  document.getElementById("admin-btn-reset-seed")?.addEventListener("click", function () {
    if (window.__POSTS_FROM_CMS_JSON) {
      setStatus("CMS 模式下无法恢复内置示例。", true);
      return;
    }
    if (
      !confirm(
        "确定恢复为「内置示例文章」？\n将清除本机已保存的所有自定义文章（建议先导出备份）。"
      )
    ) {
      return;
    }
    try {
      window.resetPostsToSeed();
    } catch (err) {
      setStatus(err.message || String(err), true);
      return;
    }
    location.reload();
  });

  document.getElementById("admin-btn-export")?.addEventListener("click", function () {
    var data = JSON.stringify(window.POSTS || [], null, 2);
    var blob = new Blob([data], { type: "application/json;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "blog-posts-backup.json";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    setStatus("已下载 blog-posts-backup.json");
  });

  if (importInput) {
    importInput.addEventListener("change", function () {
      if (window.__POSTS_FROM_CMS_JSON) {
        setStatus("CMS 模式下无法导入到本机；请直接编辑 content/posts.json。", true);
        importInput.value = "";
        return;
      }
      var file = importInput.files && importInput.files[0];
      importInput.value = "";
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(String(reader.result || ""));
          if (typeof window.__validatePostsArray === "function" && !window.__validatePostsArray(parsed)) {
            setStatus("JSON 格式不符合文章列表要求", true);
            return;
          }
          window.savePostsToStorage(parsed);
          location.reload();
        } catch (err) {
          setStatus("无法解析 JSON：" + (err.message || String(err)), true);
        }
      };
      reader.readAsText(file, "utf-8");
    });
  }

  function doLogout() {
    if (window.AdminAuth) window.AdminAuth.logout();
    window.location.replace("login.html");
  }

  document.getElementById("admin-btn-logout")?.addEventListener("click", doLogout);
  document.getElementById("admin-btn-logout-mobile")?.addEventListener("click", doLogout);

  renderList();
  applyCmsReadOnlyUi();
  if (window.__POSTS_FROM_CMS_JSON) {
    setStatus("当前文章来自 content/posts.json（Decap CMS / Git），后台表单为只读。");
  } else if (window.__POSTS_HYDRATED_FROM_STORAGE) {
    setStatus("当前显示的是本机已保存的文章；与仓库内 CMS JSON 或 posts.js 默认数据可能不同。");
  }
})();
