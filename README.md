# 墨迹 · 个人博客

零构建的静态个人博客：HTML + [Tailwind CSS](https://tailwindcss.com/)（CDN）+ 原生 JavaScript。文章可由 **`content/posts.json`** 提供，并通过 [Decap CMS](https://decapcms.org/) 在浏览器中编辑、提交到 Git。

## 功能概览

- 首页文章列表、关于页、暗色主题（`js/theme.js`）
- 文章详情页带侧栏导航与目录（`article.html`，依赖 URL 参数 **`?slug=...`**）
- 演示用后台登录（`login.html`）与文章管理面板（`dashboard.html`）；若已成功加载 CMS JSON，后台表单为只读
- 可选 **Decap CMS**（`admin/index.html`）维护 `content/posts.json`

## 本地预览

请使用静态 HTTP 服务打开仓库根目录（直接 `file://` 打开时，`fetch` 可能无法读取 `content/posts.json`，会回退到 `js/posts.js` 中的内置文章）。

```bash
npx serve
```

浏览器访问终端输出的地址（一般为 `http://localhost:3000`），再打开 `index.html` 或根路径。

### 关于 `npx serve` 与文章页

[`serve`](https://github.com/vercel/serve) 默认会开启 **clean URLs**：把 `article.html?slug=...` **301** 重定向到 **`/article`**，且 **`Location` 不带查询串**，导致 `article.js` 读不到 `slug`、一直显示「未找到这篇文章」。  
本仓库根目录已提供 **`serve.json`**：

- **`"cleanUrls": false`**：避免把 `article.html?slug=...` **301** 到无查询串的 `/article`。
- **`"directoryListing": false`**：访问站点根路径 **`/`** 时不显示目录列表。
- **`rewrites`**：
  - **`/` → `index.html`**：根路径直接打开首页。
  - **`/article`、`/article/` → `article.html`**：无后缀地址也能返回文章页脚本；无 `?slug=` 时由 **`article.js`** 显示「未找到」（不再自动跳回首页，避免与缓存/旧链接冲突）。

在**项目根目录**执行 `npx serve` 时会自动读取 `serve.json`。若仍异常，可在 Network 里检查 `article.html` 的请求链。

换用 **`python -m http.server`** 等不做 clean URL 的服务器也可避免 301 丢参数问题（但不会自带上述 `serve.json` 行为；根路径可能仍显示目录列表，可手动打开 `index.html`）。

## 文章与站点信息

| 内容 | 位置 |
|------|------|
| 站点标题、标语、关于页简介 | `js/posts.js` 中的 `BLOG_META` |
| 正式文章列表（JSON） | `content/posts.json` |
| 加载 JSON 的开关与地址 | `js/posts.js` 中的 `BLOG_POSTS_JSON_URL`（设为 `""` 可关闭远程 JSON，仅用 localStorage + 内置种子） |
| 合并逻辑与 localStorage | `js/posts-store.js` |

文章页链接格式：

```text
article.html?slug=你的slug
```

示例：`article.html?slug=tailwind-blog-setup`（slug 需与 JSON 或内置数据一致）。

## Decap CMS

1. 将 **`admin/config.yml`** 里的 `backend.repo` 改为你的 GitHub 仓库，例如 `用户名/仓库名`，并确认 `branch` 与默认分支一致。
2. 浏览器打开 **`admin/index.html`**。GitHub 登录需按 [Decap GitHub Backend](https://decapcms.org/docs/github-backend/) 与托管商（常用 Netlify OAuth）完成配置。
3. 在 CMS 中编辑 **`content/posts.json`** 并保存后，变更会进入 Git 历史；部署站点后前台会拉取最新 JSON。

媒体上传目录：`content/uploads/`（见 `config.yml` 中 `media_folder`）。

## 目录结构（节选）

```text
index.html          # 首页
article.html        # 文章页（需 ?slug=）
about.html          # 关于
login.html          # 后台登录（演示账号见页面说明）
dashboard.html      # 文章管理（依赖登录状态）
admin/
  index.html        # Decap CMS 入口
  config.yml        # CMS 与 backend 配置
content/
  posts.json        # 文章数据源
  uploads/          # CMS 媒体（可选）
js/
  posts.js          # 站点元数据、内置文章兜底
  posts-store.js    # 加载 JSON / localStorage
  home.js           # 首页列表
  article.js        # 文章正文与目录
  dashboard.js      # 后台表单逻辑
  auth.js           # 简单登录状态（localStorage）
css/custom.css      # 排版与组件补充样式
```

## 部署提示

- **GitHub Pages（项目站，子路径）**：站点根 URL 形如 `https://用户名.github.io/仓库名/`，若站内链接出现资源加载错误，可能需要为子路径增加统一前缀（当前链接多为相对路径，一般可工作）。
- **用户页仓库 `用户名.github.io`**：站点在域名根路径，相对路径通常无需改动。

## 许可证

若未特别指定，可按你的需要自行添加 `LICENSE` 文件。
