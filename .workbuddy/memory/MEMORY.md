# DerivativeCalculatorAI 项目长期记忆

## 部署架构
- Next.js 14.2.16 (App Router) + @cloudflare/next-on-pages；Cloudflare Pages 项目 `derivative-calculator-ai`；域名 `derivativecalculatorai.com`（无连字符，勿写 derivative-calculator-ai.com）。
- CI/CD：`.github/workflows/deploy.yml`，push main → Actions `wrangler pages deploy .vercel/output/static`（产物路径，next-on-pages 生成）。已弃用 cloudflare/pages-action@v1。
- Secrets 实测在位：`CLOUDFLARE_API_TOKEN`(Pages:Edit)、`CLOUDFLARE_ACCOUNT_ID`。绑定：D1、Upstash Redis、OPENROUTER_API_KEY。新增 server secret：`ADMIN_MONITORING_TOKEN`、`MONITORING_HASH_SALT`（CF Dashboard 配置，缺则 admin 端点 fail closed）。

## ⛔ RC-8 最高危铁律：force-cache 是死代码（2026-09-02 事故）
- Cloudflare Pages + next-on-pages 上 `fetch({cache:'force-cache', next:{revalidate}})` 永远拿不到数据（adapter 不提供 IncrementalCache）。
- 后果：全站数据源失效，`/[slug]` 落到 `parseSlugToMath()` 兜底发布错误公式，3100/3137 页(98.82%)内容错误。
- 铁律：服务端取数只用普通 `fetch`；数据源单一入口 `lib/problems-source.ts`（`loadStaticProblemsSafe`）；页面渲染禁止依赖 D1（题库 `public/problems.json` 优先唯一主源，D1 仅兜底）；`app/layout.tsx` 禁止 fetch（每 PV 成本）。
- **`public/problems.json` 仅字段 slug/formula/title/description/type（+limitTo）；无 difficulty/tags（仅 D1 有）。** 需 difficulty/tags 的路由（/problems/tag/[tag]、/practice/[level]）无法静态化、不在 sitemap。
- 守护：`__tests__/rc8-production-source.test.ts` 全量扫描禁 force-cache。

## 关键约定（勿违反）
- 禁止提交 `vercel.json`（rewrite API 到不存在文件致部署失败）。
- middleware 不要 export `runtime='edge'`（Next 14.2.x 报 experimental）。
- UA 黑名单只封脚本类（python/curl/wget），不要写 bot/crawler/spider（误杀 Googlebot 毁 SEO）；`looksLikeLegitimateBrowser()` 禁用过宽模式（/bot/i /http/i /client/i /tool/i /library/i），且不要因"纯域名 referer"判 suspicious。
- API `includeAi` 用 `!!process.env.OPENROUTER_API_KEY` 控制，不要硬编码 false。
- rate limit 基线：页面 30/min、API 20/min；禁止 1 req/min 锁死用户。
- 禁止每请求 console.log（浪费配额+泄露 IP）；/embed/ 在 middleware 跳过 D1 rate limit；middleware matcher 必须排除 `api|_next|favicon.ico|robots.txt|sitemap.xml|manifest.json|静态资源`（只排除 _next/static 会让 JS/CSS 被 429 版面错乱）。
- abuse 评分激进（false +20，≥30 封 IP），确保无 false positive。

## Cloudflare 控制台约定
- 不要启用 Bot Fight Mode（拦截 Googlebot + JS Challenge 拦 curl）。
- 不要在 Custom Security Rules 写 Block Known Bots / Block No Referer（杀 SEO / 误伤 820 次直接访问）。
- 不要在 Rate Limiting Rules 写 "URI Path contains /"（匹配所有静态资源，浏览器并行加载被 429 → JS 不加载）。
- CF Pages 对 API 200 强制覆盖 Cache-Control → 已用 Cache Rule "API bypass cache"（host eq + starts_with /api/）解决，/api/* 全 DYNAMIC。R1 CLOSED。

## D1 配额铁律（读+写）
- 禁止 `ORDER BY RANDOM()/RAND()`（曾 24h 烧 8M rows_read，免费 5M/日）；`slug != ?` 非范围约束，用 `slug > ?`/`<= ?` + ORDER BY 同序；禁止 `SELECT *`；页面禁止为推荐/相关打 D1（用静态 JSON）；禁止页面自我 fetch `/api/problems?limit=N`。改动后看 EXPLAIN，出现 SCAN/TEMP B-TREE 即不合格。4 必需索引见 `scripts/ensure_d1_indexes.sql`；回归守护 `__tests__/d1-quota.test.ts`。
- **写侧（P1 已修，de8d3b5）**：曾 `middleware`+`security`(`_checkGlobalQuota` 2 写)+`path-tracker`(`trackPath` 1 写) 每 cache-miss 请求 ~4 次 D1 写（免费 50k/日会被打爆）。P1 已移除 `trackPath`/`_checkGlobalQuota`，每请求写入 ~4→仅 `_checkD1RateLimit` 1 次（rate_limits upsert，fail-open）。problem API 的 `SELECT *`+`tags LIKE` 已由 P1-2 改 static-first + 显式列消除。

## 监控/安全约定
- IP 脱敏用 HMAC-SHA256 + `MONITORING_HASH_SALT`（前 16 hex）；admin endpoint 需 `isAdminRequest()`+`adminResponseHeaders()`(no-store)；不输出 IP/UA/env 原文。

## Git 推送坑
- 远程偶发 HTTP2 framing error；有效命令：`GIT_HTTP_LOW_SPEED_LIMIT=1000 GIT_HTTP_LOW_SPEED_TIME=180 git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin main`。不要 `env -u HTTP_PROXY`（无代理设置）。github.com 直连慢，重试即可。

## 生产验证踩坑（非显然）
- curl 默认 UA 被滥用 middleware 拦 403 → 须带浏览器 UA + 匹配 Referer。
- `*.pages.dev` 预览主机发 production Referer 因 host 不匹配 403（验证预览时 Referer 改对应 pages.dev）。
- CDN 检查 PoP 局部：同一 colo 加 `?cb=` 回源全对 = 缓存字节错、代码对；部署瞬间回源的 PoP 缓存旧 HTML（s-maxage=7200 最长 2h 才失效），Googlebot 易命中美国 PoP 不能干等。
- 判据：`/api/problems?limit=3&type=derivative` 无 tag 新代码绝不碰 D1；若返 D1_ERROR 即旧代码未上线。
- 部署后各 PoP 不一致（cache-control public, max-age=14400, s-maxage=7200, swr=86400）；验证须 cache-buster 打源头 + 干净 URL 测现状。

## Sitemap 阴影机制（P2 审计，2026-09-03）
- **`app/sitemap.ts` 已删除**：Next.js 中 `app/sitemap.ts`(MetadataRoute)与静态 `public/sitemap.xml` 都映射 `/sitemap.xml`，app 路由胜出并阴影 9,483 条的静态文件 → production `/sitemap.xml` 实测仅 9 `<loc>`，全部单题页掉出 sitemap。删除 app/sitemap.ts 后 public/sitemap.xml 生效。
- 勿重新添加 `app/sitemap.ts`（会再次阴影 public/sitemap.xml）。sitemap 由 `npm run generate-sitemap`(scripts/generate-sitemap.js) 生成 public/sitemap.xml；当前仍缺 827 个复杂积分 slug（生成器跳过），补缺口跑该命令即可。
- **分类页断裂**：`app/problems/[type]` 的 validTypes=['derivative','integral','limit','ode']，但 problems.json 无 `matrix`/`ode` 类型行 → /problems/ode 空分类(0 题)、/problems/matrix 404；`/matrix` 是 calculator 页非题目类型，命名不一致。

## Cloudflare Pages 部署架构（2026-09-03）
- **两套机制竞争**：① Actions `wrangler pages deploy`(权威) ② Cloudflare 原生 GitHub 集成自动部署(项目连 Git，check-run 名 `Cloudflare Pages`)。曾误判"缺 secret 致 CI 失败"——实测 secret 在位、Actions 绿，真实根因是双部署为同 commit 产生竞争 Production 部署，原生集成未 promote 完时去测 active 停在旧构建。
- **策略**：Actions 唯一部署方；用户已在 CF Dashboard 断开 Git 连接（2026-09-03 验证：空提交后 check-runs 仅剩 `Deploy to Cloudflare Pages` 一条，双部署消除）。
- workflow 已硬化（47303b7/e2044b5）：项目锁定 `npx wrangler`、`--commit-dirty=true`、secret 校验。

## P1 写侧修复完成（2026-09-03, de8d3b5）
- middleware 移除 trackPath；security 移除 _checkGlobalQuota；5 高频 API（derivative/integral/limit/matrix/ode）移除 trackPath。每请求 D1 写入 ~4→1（仅 rate-limit，fail-open）。
- problem API 改 static-first + 显式列 + D1 降级；实测 D1 日读耗尽仍从 static 返 200。
