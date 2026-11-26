# DerivativeCalculatorAI 项目长期记忆

## 部署架构
- Next.js 14.2.16 (App Router) + @cloudflare/next-on-pages；CF Pages 项目 `derivative-calculator-ai`；域名 `derivativecalculatorai.com`（无连字符）。
- CI/CD：`.github/workflows/deploy.yml`，push main → `wrangler pages deploy .vercel/output/static`。**Actions 是唯一部署方**（CF 原生 Git 集成已于 2026-09-03 断开，勿重连，会产生竞争 Production 部署）。
- 绑定：D1、Upstash Redis、OPENROUTER_API_KEY；server secret `ADMIN_MONITORING_TOKEN`/`MONITORING_HASH_SALT`（缺则 admin 端点 fail closed）。

## ⛔ RC-8 最高危铁律：force-cache 是死代码（2026-09-02 事故）
- next-on-pages 不提供 IncrementalCache，`fetch({cache:'force-cache', next:{revalidate}})` 永远拿不到数据 → 曾致 98.82% 页面内容错误。
- 服务端取数只用普通 `fetch`；数据源单一入口 `lib/problems-source.ts`；页面渲染禁止依赖 D1；`app/layout.tsx` 禁止 fetch。
- `public/problems.json` 只有 slug/formula/title/description/type(+limitTo)，**无 difficulty/tags**（仅 D1 有）。
- 守护：`__tests__/rc8-production-source.test.ts` 全量扫描禁 force-cache。

## 关键约定（勿违反）
- 禁止提交 `vercel.json`（会致部署失败）。middleware 不要 export `runtime='edge'`。
- UA 黑名单只封脚本类（python/curl/wget），**绝不写 bot/crawler/spider**（误杀 Googlebot）。`looksLikeLegitimateBrowser()` 禁用 /bot/i /http/i /client/i /tool/i /library/i 等过宽模式。
- rate limit：页面 30/min、API 20/min，禁止 1 req/min 锁死用户。禁止每请求 console.log。
- middleware matcher 必须排除 `api|_next|favicon.ico|robots.txt|sitemap.xml|manifest.json|静态资源`（只排 _next/static 会让 JS/CSS 被 429 版面错乱）。/embed/ 跳过 D1 rate limit。
- API `includeAi` 用 `!!process.env.OPENROUTER_API_KEY`，不要硬编码 false。
- CF 控制台：不启用 Bot Fight Mode；不写 Block Known Bots / Block No Referer；Rate Limiting 不写 "URI Path contains /"。CF Pages 会覆盖 API 的 Cache-Control → 靠 Cache Rule "API bypass cache" 解决。

## D1 配额铁律
- 禁 `ORDER BY RANDOM()`（曾 24h 烧 8M rows_read，免费额度 5M/日）；`slug != ?` 非范围约束，用 `slug > ?` + 同序 ORDER BY；禁 `SELECT *`；页面禁止为推荐/相关打 D1；禁止页面自我 fetch `/api/problems`。改后看 EXPLAIN，出现 SCAN/TEMP B-TREE 即不合格。索引见 `scripts/ensure_d1_indexes.sql`；守护 `__tests__/d1-quota.test.ts`。
- 写侧 P1 已修（de8d3b5）：每 cache-miss 请求 D1 写 ~4 → 仅 `_checkD1RateLimit` 1 次（fail-open）。**不要复活 trackPath / _checkGlobalQuota**。

## Git 推送
- 远程偶发 HTTP2 framing error，用：`GIT_HTTP_LOW_SPEED_LIMIT=1000 GIT_HTTP_LOW_SPEED_TIME=180 git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin main`。不要 `env -u HTTP_PROXY`。

## 生产验证踩坑
- curl 默认 UA 被 middleware 拦 403 → 必须带浏览器 UA + 匹配 Referer。
- `*.pages.dev` 预览发 production Referer 会 403（Referer 改成对应 pages.dev）。
- 部署后各 PoP 缓存旧 HTML（s-maxage=7200，最长 2h）；验证须 cache-buster 打源头 + 干净 URL 测现状。

## Sitemap 机制
- **`app/sitemap.ts` 已删除且禁止重建**（会阴影 `public/sitemap.xml`，曾致 9,483 条掉到 9 条）。sitemap 由 `npm run generate-sitemap`（`scripts/generate-sitemap.js`）生成 `public/sitemap.xml`。
- **索引策略是 owner 决策**：`SITEMAP_URLS` 是精选白名单，不是全量。2026-11-07 owner 批准 18 条；2026-11-27 owner 批准「积分/极限各 top 100」→ 218 条。扩表前必须问。
- 2026-09-03 的「缺 827 个复杂积分 slug」是审计脚本正则假阳性，勿再为它动作。
- 分类页断裂遗留：`app/problems/[type]` 的 validTypes 含 `ode`，但题库无 ode/matrix 类型 → /problems/ode 空、/problems/matrix 404（未修）。

## 数据回填（P2 评估，待 owner 批准，勿自动执行）
- `difficulty`/`tags` 在 problems.json 100% 缺失；D1 那套回填是确定性前缀规则，可原样移植（L1 覆盖 40.2%，L2 公式 token 派生补到 99.9%）。`type` 缺失 1,073 条全是 `derivative-of-*` 前缀。
- 方案/批次/验收门见 `P2_DATA_BACKFILL_STRATEGY.md`；要生效还需 `Problem` 类型加 `tags?` + 渲染层 + `/problems/tag` 去 D1。

## ⛔ 构建铁律：Tailwind v4 必须 `source(none)`
- `app/globals.css` 首行 `@import "tailwindcss" source(none);`，只扫 `@source` 的 `app/` 与 `components/`。**禁止改回裸 import。**
- 裸 import 开自动内容检测：仓库里任何非 gitignore 文件（agent 记忆 md、`.wrangler/`）出现类似 `bg-[url(&#x27;...)]` 的文本就会被编译成 `url()`，css-loader 报 `Cannot find module './&'`，整包冷构建失败。已复发两次（11-07、11-25）。
- 曾 A/B 实测：差异规则全部来自非源码文件，站点 535 个类名覆盖完全一致。

## 第三方脚本接入（2026-11-25 pvuv.ai 事故）
- 用厂商原样 raw `<script defer>`，**不要** `next/script afterInteractive`（依赖 hydration，站点曾整站 hydration failure a41419a）。
- 必须**同时**改 `lib/security-headers.ts` 与 `public/_headers`（`__tests__/security-headers.test.ts` 断言逐字符相等）。只改代码不改 CSP = 浏览器静默拦掉，11-23 的 pvuv 白挂两天。
- 验收走真浏览器（Playwright）：`GET f.js 200` + `POST ingest 204` + console 无 CSP violation。

## ⛔ 数学显示 / 归一化铁律（2026-11-26，c7f8acb）
- `normalizeExpression` 裸指数**只吃一个原子**：`/(^|[^A-Za-z_])[eE]\^([A-Za-z0-9_.]+(?:\^[A-Za-z0-9_.]+)*)/` → `exp($2)`。曾写 `e\^([^()]*)`，把 `e^x - 1/x` 变成 `exp(x - 1/x)`，153 条公式受害。改前跑 `__tests__/ssr-integral-limit.test.ts`。
- `[slug]` 页答案统一入口 `solveForType(formula, type, limitTo)`；积分/极限也必须过 `prettifyRaw`/`prettifyLatex`。
- **显示不变量**：答案里出现 6+ 位整数（= 常数未回代）→ 返回 null（无卡片 + noindex）；仅 steps 脏时降级为「有答案无步骤」。
- 索引门控：解不出答案的库页面一律 noindex。基线 noindex 1,588 / 3,159 root 页。
- **生产 nerdamer 把常数数值化**：`e≈325368125/119696244`、`ln2≈49180508/70952475`、`ln10≈250513404/108796589`。e 有两种形态都要覆盖：raw 是 PRODUCT `LOW^(-kx)*HIGH^(kx)`；LaTeX 是 FRACTION `\frac{HIGH^{E}}{LOW^{E}}`（可带前导系数 `2 \cdot ` 或尾随因子 `\cdot x`）。已折叠：ln(ratio)、`ln(1/B)+ln(A)` 和式、raw 分数形、尾部 `\cdot 1`。
- **正则转义**：匹配字面 `\cdot` 必须写 4 个反斜杠 `\\\\cdot`；正则字面量里 `\s`/`\d` 只写单反斜杠（`\\s` 会变字面「反斜杠 s」）。
- **判断只看 `.next/server/app/*.html` 或线上**：本地 jest 的 nerdamer 是符号版，永不出 ratio。生产串回归见 `__tests__/prettify-production-strings.test.ts`。
