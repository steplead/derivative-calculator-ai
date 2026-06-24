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

## 关键约定（勿违反）
- **禁止提交 `vercel.json`**：项目部署到 Cloudflare Pages，vercel.json 会 rewrite API 到不存在的 Python 文件导致部署失败。
- **middleware 不要 export `runtime='edge'`**：Next.js 14.2.x 会报 "edge runtime for rendering is currently experimental"，应省略该导出。
- **不要在 UA 黑名单里写 `bot/crawler/spider`**：会误杀 Googlebot/Bingbot，毁掉 SEO。只封禁脚本类 UA（python/curl/wget 等）。**同时注意 utils/turnstile.ts 的 looksLikeLegitimateBrowser()**：不要用 /bot/i /http/i /client/i /tool/i /library/i 等过宽模式，会误杀浏览器和合法爬虫。正确做法：白名单搜索引擎爬虫 + 黑名单脚本工具。
- **API 的 `includeAi` 不要硬编码 false**：用 `!!process.env.OPENROUTER_API_KEY` 控制，否则产品核心价值（步骤讲解）消失。
- **rate limit 不要设 1 req/min**：会锁死正常用户。页面 30 req/min，API 20 req/min 是合理基线。
- **不要每请求 console.log 诊断信息**：浪费 Cloudflare 免费配额，且可能泄露 IP。包括 turnstile.ts 的验证日志也要去掉。
- **/embed/ 路径在 middleware 中跳过 D1 rate limit 检查**：route handler 直接返回 cached 403，跑 D1 查询只浪费配额。

## Cloudflare 控制台关键约定
- **不要启用 Bot Fight Mode / Super Bot Fight Mode**：会拦截所有非浏览器 UA，包括 Googlebot，且用 JS Challenge 拦截 curl。防滥用改用 Cloudflare Rate Limiting Rules（边缘层、不消耗 Workers 配额）。
- **不要在 Custom Security Rules 里写 Block Known Bots / Block No Referer**：Block Known Bots 杀 SEO；Block No Referer 拦截所有直接访问首页的用户（820 次误伤记录）。
- 防嵌入滥用的正确做法：代码层 middleware 的 API referer 检查 + /embed/ 返回 cached 403，不需要 Cloudflare WAF 规则。

## Git 推送坑
- 远程 `https://github.com/steplead/derivative-calculator-ai.git` 偶发 HTTP2 framing error。
- 解决：`git -c http.version=HTTP/1.1 push origin main`
- 代理偶发 502：加 `-c http.lowSpeedLimit=1000 -c http.lowSpeedTime=120` 延长超时。

## 构建验证清单（改动后必跑）
1. `npx tsc --noEmit` — 类型检查
2. `npm run build` — Next.js 生产构建
3. `npm run pages:build` — @cloudflare/next-on-pages 部署产物构建
- 三者全过才可 push 上线。
