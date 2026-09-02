# DerivativeCalculatorAI 项目长期记忆

## 部署架构
- 框架：Next.js 14.2.16 (App Router) + @cloudflare/next-on-pages
- 托管：Cloudflare Pages，项目名 `derivative-calculator-ai`
- 域名：`derivativecalculatorai.com`（无连字符；不要写成 `derivative-calculator-ai.com`）
- CI/CD：`.github/workflows/deploy.yml`，push 到 main 自动触发部署到 Cloudflare Pages
- 部署产物路径：`.vercel/output/static`（next-on-pages 生成）
- 部署命令：`npx wrangler pages deploy .vercel/output/static --project-name=derivative-calculator-ai --branch=main`（已弃用 cloudflare/pages-action@v1）
- **CI 部署依赖两个 GitHub Secret**：`CLOUDFLARE_API_TOKEN`（需 Cloudflare Pages:Edit 权限）、`CLOUDFLARE_ACCOUNT_ID`。未配置则 CI 第7步 deploy 必失败。
- 绑定：Cloudflare D1（DB）、Redis（UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN）、OPENROUTER_API_KEY
- **新增 env var（Phase 5A）**：`ADMIN_MONITORING_TOKEN`（admin endpoint Bearer auth）、`MONITORING_HASH_SALT`（IP HMAC-SHA256 盐）。两者都是 server-side secret，不以 NEXT_PUBLIC_ 开头，production 必须在 CF Dashboard Settings → Environment Variables 配置。缺任一 → admin monitoring 端点 fail closed（401/503）。见 `.env.example`。

## 关键约定（勿违反）
- **禁止提交 `vercel.json`**：项目部署到 Cloudflare Pages，vercel.json 会 rewrite API 到不存在的 Python 文件导致部署失败。
- **middleware 不要 export `runtime='edge'`**：Next.js 14.2.x 会报 "edge runtime for rendering is currently experimental"，应省略该导出。
- **不要在 UA 黑名单里写 `bot/crawler/spider`**：会误杀 Googlebot/Bingbot，毁掉 SEO。只封禁脚本类 UA（python/curl/wget 等）。**同时注意 utils/turnstile.ts 的 looksLikeLegitimateBrowser()**：不要用 /bot/i /http/i /client/i /tool/i /library/i 等过宽模式，会误杀浏览器和合法爬虫。正确做法：白名单搜索引擎爬虫 + 黑名单脚本工具。
- **API 的 `includeAi` 不要硬编码 false**：用 `!!process.env.OPENROUTER_API_KEY` 控制，否则产品核心价值（步骤讲解）消失。
- **rate limit 不要设 1 req/min**：会锁死正常用户。页面 30 req/min，API 20 req/min 是合理基线。
- **不要每请求 console.log 诊断信息**：浪费 Cloudflare 免费配额，且可能泄露 IP。包括 turnstile.ts 的验证日志也要去掉。
- **/embed/ 路径在 middleware 中跳过 D1 rate limit 检查**：route handler 直接返回 cached 403，跑 D1 查询只浪费配额。
- **middleware matcher 必须排除所有 `_next/*` 路径**：不能只排除 `_next/static|_next/image`。Next.js 页面 JS 从 `/_next/static/chunks/*.js` 加载，如果 matcher 不排除这些路径，它们会经过 middleware → D1 rate limit → 429 → CSS/JS 加载失败 → 版面错乱。正确 matcher：`'/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|css|js|map|woff|woff2|ttf|eot)$).*)'`
- **不要在 looksLikeLegitimateBrowser() 里检查 referer 是否为"纯域名"**：`https://derivativecalculatorai.com/`（首页 URL）是完全合法的 referer，把它判定为"suspicious"会导致真实用户从首页发起 API 请求时被 403 封禁。referer 不是可靠的 bot 检测信号。
- **abuse 评分系统很激进**：`looksLikeLegitimateBrowser` 返回 false 时每次加 20 分，≥30 分就 403 封禁。任何误判 2 次就封 IP。确保 `looksLikeLegitimateBrowser` 不产生 false positive 至关重要。

## Cloudflare 控制台关键约定
- **不要启用 Bot Fight Mode / Super Bot Fight Mode**：会拦截所有非浏览器 UA，包括 Googlebot，且用 JS Challenge 拦截 curl。防滥用改用 Cloudflare Rate Limiting Rules（边缘层、不消耗 Workers 配额）。
- **不要在 Custom Security Rules 里写 Block Known Bots / Block No Referer**：Block Known Bots 杀 SEO；Block No Referer 拦截所有直接访问首页的用户（820 次误伤记录）。
- **不要在 Cloudflare Rate Limiting Rules 里写 "URI Path contains /"**：这会匹配所有请求（包括 JS/CSS 静态资源），浏览器并行加载 10+ 个 JS chunk 时全部被 429 拦截 → JavaScript 不加载 → 按钮点击无反应。应用层 D1 rate limit（30/min 页面, 20/min API）已足够防滥用，不需要 Cloudflare 边缘限流规则。
- 防嵌入滥用的正确做法：代码层 middleware 的 API referer 检查 + /embed/ 返回 cached 403，不需要 Cloudflare WAF 规则。
- **⚠️ CF Pages 对 API 200 响应强制覆盖 Cache-Control**：代码层设置的 `no-store` 或 `private, no-store` 被 CF Pages 替换为 `private, max-age=14400`。`private` 指令不被 CF Pages 尊重。400/403/405 等错误响应的 `no-store` 被尊重（BYPASS/DYNAMIC）。**已通过 CF Cache Rules 解决**：Rule "API bypass cache" (Expression: `http.host eq "derivativecalculatorai.com" and starts_with(http.request.uri.path, "/api/")`, Action: Bypass Cache, Active) 确保 /api/* 所有响应 cf-cache-status=DYNAMIC，无 Age 头，不被 CDN 缓存。R1 CLOSED。

## D1 配额铁律（2026-09-02 事故沉淀）
- **绝对禁止在 D1 上写 `ORDER BY RANDOM()` / `ORDER BY RAND()`**：RANDOM() 不可索引，SQLite 必须先物化+排序全表再应用 LIMIT，每次执行读取整表行数。曾因此 24h 烧掉 8M rows_read（免费额度 5M/日）。
- **`slug != ?` 不是范围约束**，无法 seek 索引；要用 `slug > ?` / `slug <= ?` 这类可做 B-tree range seek 的谓词，并让 `ORDER BY` 与索引同序（避免 TEMP B-TREE）。
- **禁止 `SELECT *`**：只取渲染所需列。
- **页面渲染路径上禁止为"推荐/相关"内容打 D1**：优先用静态 JSON（`/problems.json`，force-cache，0 rows），D1 仅作最后 fallback 且必须走索引 + LIMIT。
- **禁止页面自我 fetch `/api/problems?limit=N`**：会额外计 N rows_read/次，且多一次 HTTP 往返。
- **改动 D1 查询后必须看 EXPLAIN QUERY PLAN**：出现 `SCAN <table>` 或 `USE TEMP B-TREE FOR ORDER BY` 即不合格。
- 4 个必需索引（见 `scripts/ensure_d1_indexes.sql`，幂等）：`problems.slug`、`rate_limits.ip`（曾长期缺失，middleware 每请求都查）、`counters.key`、`path_stats.path`。
- 回归守护：`__tests__/d1-quota.test.ts`（源码扫描禁 RANDOM + 运行时断言 rows_read ≤ 2×limit）。
- 本地验证索引脚本：用 python sqlite3 建 3137 行副本 + wrangler 式解析（去注释、按 `;` 切分）跑一遍，再 EXPLAIN 对比新旧计划。

## 监控/安全约定
- **IP 脱敏必须用 HMAC-SHA256 + salt**：`utils/monitoring-sanitize.ts` 的 `hashIp()` 使用 HMAC-SHA256 + `MONITORING_HASH_SALT` 环境变量，输出前 16 hex 字符。不可用简单 32-bit hash（IPv4 空间可枚举反推）。
- **admin endpoint 必须 admin auth + no-store**：所有 `/api/admin/*` 和 diagnostic/stats endpoint 需 `isAdminRequest()` + `adminResponseHeaders()`（含 `Cache-Control: no-store`）。
- **不要输出 IP/UA/env var 原文**：用 `hashIp()` 替代 IP、`classifyUa()` 替代 UA、boolean 替代 env var 值。
- **ADMIN_MONITORING_TOKEN 必须在 CF Dashboard 设置**：未配置时 production 所有 admin endpoint 返回 401（fail closed）。

## Git 推送坑
- 远程 `https://github.com/steplead/derivative-calculator-ai.git` 偶发 HTTP2 framing error。
- 解决：`git -c http.version=HTTP/1.1 push origin main`
- 代理偶发 502：加 `-c http.lowSpeedLimit=1000 -c http.lowSpeedTime=120` 延长超时。

## 构建验证清单（改动后必跑）
1. `npx tsc --noEmit` — 类型检查
2. `npm run build` — Next.js 生产构建
3. `npm run pages:build` — @cloudflare/next-on-pages 部署产物构建
- 三者全过才可 push 上线。
- **沙箱 safe-delete 保护会中断 `npm run build`**：清理 `.next` 时报 `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] count:50`。解法：该命令加 `dangerouslyDisableSandbox`。
- **`npm run build` 会顺带重写 `public/sitemap.xml` 全部 `lastmod`**（脚本副作用，URL 数量不变）。提交前用 `git checkout -- public/sitemap.xml` 或只 add 目标文件排除它。
- **额外检查**：如果用了 Tailwind 任意值（如 `max-w-[80rem]`），确认构建后的 CSS 文件中确实生成了该类。Tailwind v4 可能不生成未在 content 中扫描到的任意值类，导致样式丢失。优先使用标准 utility 类（如 `max-w-7xl`）。
