# Phase 0 — Baseline Snapshot / 只读基线确认

> **时间**: 2026-07-06 19:42
> **分支**: main
> **最新 commit**: f8e2557 fix: disable abuse scoring block that trapped real users for hours
> **审计类型**: 只读（无代码修改、无 commit）

---

## 1. Git 状态

| 项目 | 状态 |
|---|---|
| 当前分支 | `main` |
| 未提交文件 | 3 个（.workbuddy/audit-report, .workbuddy/memory/2026-07-06, AUDIT_REPORT_2026-07-06）— 均为审计报告，非代码 |
| Stash | 空 |
| Working tree | 除3个审计报告文件外 clean |

### 最近 10 commits

```
f8e2557 fix: disable abuse scoring block that trapped real users for hours
eec95f2 fix(layout): use max-w-7xl instead of max-w-[80rem]
f1217ea fix(layout): add max-width to main container
4ff7e71 fix(security): remove Accept */* check
67bf08a fix(security): remove false-positive referer check
4b3c73e fix: middleware matcher excluded /_next/chunks/*.js
5bb70b8 fix: stop app-layer from blocking Googlebot & legit requests
7eedb7b fix: upgrade Node.js to 22 in CI
97ddcb2 ci: replace deprecated pages-action@v1 with wrangler pages deploy
ca37982 fix: unblock SEO crawlers, restore AI, fix fatal config & rate-limit
```

---

## 2. 部署链路

### GitHub Actions workflow

```yaml
# .github/workflows/deploy.yml
触发: push main + workflow_dispatch
步骤:
  1. checkout@v4
  2. setup-node@v4 (node 22)
  3. npm ci --legacy-peer-deps
  4. npm run build (env: NEXT_PUBLIC_SITE_URL=https://derivativecalculatorai.com)
  5. npx @cloudflare/next-on-pages → .vercel/output/static
  6. npx wrangler@latest pages deploy .vercel/output/static --project-name=derivative-calculator-ai --branch=main
Secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
```

### Wrangler 配置

```toml
# wrangler.toml
name = "derivative-calculator-ai"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat", "nodejs_als"]
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "problems-db"
database_id = "83d5e571-4a16-4255-ab9a-5f8a95b11b6b"
```

### 环境变量引用

| 变量 | 引用位置 | Cloudflare 环境变量 | .env |
|---|---|---|---|
| OPENROUTER_API_KEY | 5 个 API route (derivative/integral/limit/ode/matrix) | ✅ Dashboard 设置 | ✅ .env |
| UPSTASH_REDIS_REST_URL | cache.ts, test-redis route | ✅ Dashboard 设置 | ❌ 仅 Cloudflare |
| UPSTASH_REDIS_REST_TOKEN | cache.ts, test-redis route | ✅ Dashboard 设置 | ❌ 仅 Cloudflare |
| TURNSTILE_SECRET_KEY | turnstile.ts | ❌ 未设置（REQUIRED=false，不影响功能） | ❌ |
| SKIP_SECURITY | security.ts, diagnostic route | ❌ 未设置 | ❌ |
| GEMINI_API_KEY | ❌ **无代码引用** | ❌ | ✅ .env.local（遗留，未使用） |

---

## 3. 生产入口确认

### Next.js App Router 页面

| 路径 | 类型 | 状态 |
|---|---|---|
| / | 首页 | ✅ edge runtime |
| /about | 静态页 | ✅ |
| /contact | 静态页 | ✅ |
| /privacy | 静态页 | ✅ |
| /practice/[level] | 动态页 | ✅ |
| /wiki | 列表页 | ✅ |
| /wiki/[slug] | 动态页 | ✅ |
| /directory | 列表页 | ✅ |
| /calculators | 列表页 | ✅ |
| /integral | 计算器页 | ✅ |
| /limit | 计算器页 | ✅ |
| /ode | 计算器页 | ✅ |
| /matrix | 计算器页 | ✅ |
| /[slug] | 动态 problem 页 | ✅ |
| /es, /pt | locale rewrite | ✅ middleware 处理 |

### API 路由

| 路径 | runtime | 依赖 | 状态 |
|---|---|---|---|
| /api/derivative | edge | nerdamer + OpenAI + Redis cache | ✅ 核心产品 |
| /api/integral | edge | nerdamer + OpenAI + Redis cache | ✅ |
| /api/limit | edge | nerdamer + OpenAI + Redis cache | ✅ |
| /api/ode | edge | nerdamer + OpenAI + Redis cache | ✅ |
| /api/matrix | edge | mathjs + security | ✅ |
| /api/problems | edge | D1 | ✅ |
| /api/problem/[slug] | edge | D1 | ✅ |

### 运维 API（非核心产品）

| 路径 | 功能 | 保留建议 |
|---|---|---|
| /api/diagnostic | 安全检查诊断 | Phase 2 可移除或限 admin |
| /api/cache-metrics | Redis 缓存指标 | Phase 2 可移除或限 admin |
| /api/test-redis | Redis 连接测试 | Phase 2 可移除或限 admin |
| /api/ip-stats | IP 统计 | Phase 2 可移除或限 admin |
| /api/unblock-ip | 手动解封 IP | Phase 2 可移除或限 admin |
| /api/path-stats | 路径统计 | Phase 2 可移除或限 admin |
| /api/traffic-analysis | 流量分析 | Phase 2 可移除或限 admin |

### middleware.ts

```text
Request → middleware.ts
  1. UA 黑名单 → 403 (curl/python/wget/scrapy 等)
  2. API referer/origin/host 检查 → 403 (第三方 hotlink)
  3. /embed/ → trackPath + skip D1
  4. 页面请求 → performSecurityCheck (D1) → 429/403
  5. Locale rewrite (/es, /pt)
  6. www → non-www 301 redirect
  7. Cache-Control headers (2hr s-maxage)
```

---

## 4. 本地验证结果

| 步骤 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 依赖安装 | `npm ci --legacy-peer-deps` | ✅ 成功 | 有 audit warnings |
| 生产构建 | `npm run build` | ✅ 成功 | 所有页面正常生成 |
| Pages 构建 | `npm run pages:build` | ✅ 成功 | 3.83s, _worker.js/index.js 生成 |
| 类型检查 | `npx tsc --noEmit` | ✅ 零错误 | TypeScript 完全通过 |
| Lint | `npm run lint` | ✅ 通过（30 warnings） | 25 个 no-console + 3 个 exhaustive-deps + 2 个 no-img-element |
| 测试 | `npm test` | ✅ 34/34 通过 | 仅 sanitize.test.ts（覆盖率极低） |
| npm audit | `npm audit` | ⚠️ 24 vulnerabilities (4 critical) | Handlebars XSS + math-codegen RCE + Next.js DoS/Cache |

### Lint warnings 分类

| 类别 | 数量 | 严重性 |
|---|---|---|
| no-console | 25 | 低（生产环境 console 不影响用户） |
| react-hooks/exhaustive-deps | 3 | 中（可能导致 stale closure） |
| @next/next/no-img-element | 2 | 低（本项目 images: unoptimized=true，Next/Image 不适用） |

### npm audit critical 漏洞

| 漏洞 | 包 | 影响 | 评估 |
|---|---|---|---|
| Handlebars XSS (3个) | handlebars (间接依赖) | 不直接使用，是 mathjs 的间接依赖 | 低风险：本项目不在客户端渲染 Handlebars 模板 |
| math-codegen RCE | math-codegen (interval-arithmetic-eval 间接依赖) | 不直接使用，是 function-plot 的间接依赖 | 低风险：function-plot 仅客户端渲染图形 |
| Next.js DoS/Cache (3个) | next@14.2.16 | Server Actions DoS + Image Optimization Cache | 中风险：本项目用 Cloudflare Pages edge runtime，Server Actions 未使用；Image Optimization 已禁用 |

### 测试覆盖情况

**当前只有 1 个测试文件**：`utils/sanitize.test.ts`，34 个测试，覆盖 `escapeHtml` / `sanitizeLimitValue` / `deepSanitizeObject` 的 XSS/注入防护。

**未覆盖的关键模块**：
- middleware.ts（请求拦截流程）
- security.ts（rate limit / abuse scoring / IP blacklist）
- turnstile.ts（browser detection）
- cache.ts（Redis 缓存）
- 5 个计算器 API route（核心产品逻辑）
- 各前端组件（Calculator, Graph, StepDisplay 等）

---

## 5. 基线总结

### ✅ 通过项

| 项目 | 状态 |
|---|---|
| Git clean (除审计报告) | ✅ |
| npm ci | ✅ |
| npm run build | ✅ |
| npm run pages:build | ✅ |
| tsc --noEmit | ✅ |
| npm run lint | ✅ (warnings only) |
| npm test | ✅ 34/34 |
| CI/CD workflow | ✅ 完整 |
| Wrangler config | ✅ D1 binding 正确 |

### ⚠️ 需关注项

| 项目 | 严重性 | 说明 |
|---|---|---|
| 测试覆盖率极低 | 高 | 只有 sanitize.test.ts，核心产品逻辑无测试 |
| npm audit 4 critical | 中 | 间接依赖，不直接影响生产，但建议升级 |
| GEMINI_API_KEY 未使用 | 低 | .env.local 遗留，不影响功能 |
| 3 个 exhaustive-deps warnings | 低 | 可能导致 stale closure，但不影响生产 |
| 运维 API 未限 admin | 中 | diagnostic/ip-stats/unblock-ip 等无鉴权 |

### 📋 Phase 0 产出

- 基线报告：`.workbuddy/optimization-baseline-2026-07-06.md`
- 所有验证均通过，可以安全进入 Phase 1
- Phase 1 的分支策略：从 main 创建 `fix/phase1-anti-abuse` 分支
