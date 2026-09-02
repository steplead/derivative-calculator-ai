# DerivativeCalculatorAI 项目只读审计报告

> **审计时间**: 2026-07-06
> **审计范围**: 仓库代码、部署配置、CI/CD、Git 历史、安全策略、Cloudflare 状态
> **审计类型**: 只读（无代码修改、无 commit）

---

## 1. 项目一句话总结

**DerivativeCalculatorAI 是一个面向全球学生和工程师的免费在线数学计算工具**，核心功能是输入数学表达式后即刻得到导数/积分/极限/ODE/矩阵的计算结果 + AI 生成的分步讲解。

| 维度 | 结论 |
|---|---|
| 面向谁 | 学生、教师、工程师（英语 + 西语 + 葡语三语） |
| 项目阶段 | **Production MVP** — 已上线、可使用、有真实用户流量，但仍在密集修复反滥用误伤问题 |
| 核心功能 | 5 个计算器（derivative / integral / limit / ODE / matrix） + AI 分步讲解（DeepSeek via OpenRouter） |
| 当前是否可用 | **是** — derivativecalculatorai.com 已上线、Cloudflare Pages 正常运行 |
| 附加产品 | Chrome 浏览器扩展（sidePanel / contextMenu，指向同一域名 API） |

---

## 2. 当前进度状态

| 模块 | 当前状态 | 已完成内容 | 未完成/风险 | 下一步 |
|---|---|---|---|---|
| **前端页面** | ✅ 生产可用 | 首页 + 5 计算器页 + about/contact/privacy/practice/wiki/directory + 3 语本地化 + SEO schema/canonicals + sitemap（9483 URL） | Sitemap 含 ~9500 URL 过大，Google 可能不索引全部；wiki 页面内容质量未验证 | 建议缩减 sitemap 到 <1000 高质量 URL |
| **API 路由** | ✅ 生产可用 | /api/derivative, integral, limit, ode, matrix + 诊断/缓存/流量分析等运维端点 | Python Flask API（api/ 目录）仍存在于仓库但 **已不被 Next.js 调用** — 遗留代码，可能让外人误以为项目用 Python 后端 | 清理或移除 api/ 目录 |
| **计算器逻辑** | ✅ 生产可用 | nerdamer + mathjs 做本地符号计算；DeepSeek via OpenRouter 做 AI 分步讲解；Redis 缓存 AI 响应（30 天 TTL） | nerdamer 边界 case 可能报错，AI fallback 文案偏模板化 | 持续优化 prompt + 测试覆盖 |
| **Anti-abuse / Rate Limit** | ⚠️ 已修复但有残留 | middleware UA 黑名单（curl/python/wget 等）+ looksLikeLegitimateBrowser 白名单爬虫 + D1 rate limit（30/min 页面、20/min API、5/min 可疑 UA）+ 全局配额（30k/day） | **D1 中旧 abuse_scores 数据仍存在**（虽然代码已不再读取它做封禁，但数据未清理）；IP blacklist 表也被滥用做 Turnstile verified 标记（设计怪异）；GLOBAL_QUOTA 30k/day 过激进（真实流量可能超此限导致全站拒绝服务） | 清理 D1 旧数据；审视全局配额合理性 |
| **D1 数据库** | ✅ 运行中 | rate_limits / ip_blacklist / abuse_scores / counters / path_stats 等表 | 无表结构文档；ip_blacklist 表同时存封禁记录和 Turnstile verified 记录（表名语义混乱）；每日读写量大，接近 Cloudflare D1 免费配额 | 整理表结构；将 Turnstile verified 移到独立表 |
| **Cloudflare 部署** | ✅ 生产运行 | Pages 部署 + D1 绑定 + _headers（CSP + 缓存） + middleware matcher 正确排除 _next/* | 无 Cloudflare WAF/Bot Fight Mode 配置记录（靠 MEMORY.md 约定）；Cloudflare 控制台可能有残留的错误规则（Block No Referer 等） | 确认 Cloudflare 控制台无残留误伤规则 |
| **CI/CD** | ✅ 正常 | GitHub Actions → npm build → next-on-pages → wrangler deploy，push main 自动触发 | 需要 CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID 两个 Secret，缺失则 deploy 失败 | 无立即风险 |
| **日志与监控** | ⚠️ 最弱 | path-tracker 写 D1 path_stats 表；console.warn 有限日志 | **无外部监控**（无 Prometheus/Grafana/DataDog）；console 日志在 Cloudflare 免费配额下不可持久查看；无告警机制 | 至少加 Cloudflare Analytics 告警 |
| **scrapy-selenium 相关** | ❌ 不存在 | **仓库中没有任何 scrapy 或 selenium 的依赖、代码或配置** | 唯一出现 `scrapy` 的地方是 middleware.ts 和 turnstile.ts 的 **UA 黑名单字符串**（用于拦截 scrapy UA 的请求），不是项目自身使用 scrapy | anyIP 的判断：**本项目不需要 proxy/IP rotation/scraping 服务** |
| **SEO / Landing Page** | ✅ 生产可用 | robots.txt + sitemap.xml + OG/Twitter cards + canonicals + hreflang + Google Analytics + structured data（FAQ/Breadcrumb/HowTo schema） | sitemap 9483 URL 过大；wiki/directory 页面 SEO 质量未验证 | 精简 sitemap |
| **安全与密钥配置** | ⚠️ 需审视 | OPENROUTER_API_KEY（.env + Cloudflare 环境变量）+ UPSTASH Redis + D1；Turnstile 已配置但 REQUIRED=false；CSP 已配置 | .env.local 含 GEMINI_API_KEY（未在代码中使用）；无 secrets rotation 机制；ip_blacklist 表存 Turnstile verified 记录（30 秒 TTL）设计怪异 | 清理 GEMINI_API_KEY；评估 Turnstile 启用时机 |

---

## 3. 最近 429 问题复盘

### 3.1 根本原因

429 问题是一系列 **安全层误判** 的叠加效应，经历了 5 层错误：

| 层级 | Bug | 影响 |
|---|---|---|
| **第 1 层** | middleware matcher 只排除 `_next/static|_next/image`，未排除 `_next/static/chunks/*.js` | 页面 JS/CSS 请求经过 middleware → D1 rate limit → 429 → 页面版面错乱、按钮不响应 |
| **第 2 层** | `looksLikeLegitimateBrowser()` 含 `Accept: */*` 检查 | 现代浏览器 fetch() API 默认发送 `Accept: */*`，被判定为 bot → 每次加 20 abuse 分 |
| **第 3 层** | `looksLikeLegitimateBrowser()` 含 referer "纯域名" 检查 | 用户从首页 `derivativecalculatorai.com/` 点击到 API → referer 被判 suspicious → 加 20 abuse 分 |
| **第 4 层** | abuse_scores 每次 +20 分，≥30 分就 403 封禁 | **2 次误判就封 IP**；旧分数每小时只衰减 50%（从 100 分降到 <30 分需约 2 小时） |
| **第 5 层** | rate limit 曾设 1 req/min（commit `66266b4`） | 正常用户 1 分钟内点 2 次就 429 |

### 3.2 为什么等 30 分钟仍不恢复？

abuse_scores 的衰减公式是 **每小时衰减 50%**（`Math.pow(0.5, hoursSinceUpdate)`）：
- 2 次误判 → 分数 = 40
- 30 分钟后 → 分数 = 40 × 0.5^(0.5) ≈ 28.3，**仍 ≥ 30 阈值**
- 1 小时后 → 分数 = 40 × 0.5 = 20，**才低于 30**
- 如果 5 次误判 → 分数 = 100 → 需 **约 2 小时** 才能降到 <30

所以即使修正了误判代码，**D1 中的旧分数仍在持续封禁真实用户**。

### 3.3 commit `f8e2557` 具体改了什么？

`f8e2557` 的改动：

1. **完全禁用了 abuse scoring 封禁逻辑** — 不再读取 abuse_scores 表做封禁决策
2. **改为简单 rate limit** — 对非浏览器 UA（middleware 未拦截但 looksLikeLegitimateBrowser 返回 false 的）施以 5 req/min 的 strict rate limit
3. **删除了中等分数（≥15）的 strict rate limit 分支**
4. 理由注释：既然 `looksLikeLegitimateBrowser` 已不再产生 false positive，abuse scoring 就不再必要，纯 rate limit 足够

### 3.4 现在是完全解决，还是绕过？

**是策略性绕过，不是根因修复**。根因（looksLikeLegitimateBrowser 的误判）已在前几个 commit 逐一修复：
- `4ff7e71` 删除了 Accept: */* 检查
- `67bf08a` 删除了 referer 检查
- `4b3c73e` 修复了 middleware matcher
- `5bb70b8` 优化了 Googlebot 白名单

`f8e2557` 则是 **承认旧的 abuse scoring 数据仍会封禁用户**，所以干脆不再用它。这是合理的战术决策，因为：
- 误判源已修复 → 新的 false positive 不会再产生
- 但旧数据无法批量清理 → 禁用比清理更快更安全

### 3.5 残留风险

| 风险 | 严重程度 | 说明 |
|---|---|---|
| **D1 旧 abuse_scores 数据残留** | 低 | 代码不再读取此表做封禁决策，数据不影响功能，但浪费 D1 存储空间 |
| **D1 旧 ip_blacklist 数据残留** | 中 | 表中可能仍有因旧误判产生的封禁记录（blocked_until 未过期），虽然步骤 2 已注释掉检查逻辑，但如果未来有人重新启用该检查，旧数据会重新封禁用户 |
| **ip_blacklist 表语义混乱** | 中 | 同一张表既存"封禁记录"又存"Turnstile verified 记录"（30 秒 TTL），查询和清理容易出错 |
| **Cloudflare CDN 缓存 429 响应** | 低 | middleware 已对页面设 `Cache-Control: public, s-maxage=7200`，理论上 429 响应不带缓存头，但 Cloudflare 可能缓存错误页；需确认无残留 |
| **GLOBAL_QUOTA 30k/day 过激进** | 高 | 如果真实流量增长超过 30k/天，全站会返回"Service temporarily unavailable"；此限制无区分正常/异常流量 |
| **非浏览器 UA 的 5 req/min 限流** | 低 | 某些合法工具（如 Postman 测试、学术 API 客户端）会被限流，但不封禁 |

### 3.6 判断结论

**普通真实用户访问应该正常。** 5 层误判已全部修复：
1. middleware matcher 已排除 `_next/*`
2. Accept: */* 不再被判为 bot
3. referer 不再被判为 suspicious
4. abuse scoring 不再做封禁决策
5. rate limit 已调至合理值（30/min 页面、20/min API）

**是否需要清理 D1 旧数据？**
- `abuse_scores` 表：**建议清理**。虽然代码不读它，但数据残留会让未来维护者困惑
- `ip_blacklist` 表：**建议清理因误判产生的旧封禁记录**（保留 Turnstile verified 记录无意义，30 秒 TTL 已过期）

**是否需要保留轻量 anti-abuse 逻辑？**
- **需要**。当前架构合理：middleware UA 黑名单 → looksLikeLegitimateBrowser → D1 rate limit。这是最低成本防滥用方案
- 但建议：(1) 将 ip_blacklist 和 Turnstile verified 分表；(2) 全局配额放宽到 50k-100k/day；(3) 定期清理 rate_limits 过期数据

---

## 4. 当前系统结构图

```text
┌─────────────────────────────────────────────────────┐
│                    User Browser                       │
│  (Chrome/Safari/Firefox/Edge + Chrome Extension)     │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────┐
│              Cloudflare Edge (CDN)                    │
│  - SSL/TLS termination                               │
│  - DNS (derivativecalculatorai.com)                  │
│  - Static asset caching (1yr immutable)              │
│  - _headers (CSP, X-Frame-Options, etc.)             │
│  - No WAF / No Bot Fight Mode / No Rate Limit Rules  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          Cloudflare Pages (Workers Runtime)           │
│                                                       │
│  ┌─ middleware.ts ──────────────────────────────────┐ │
│  │  1. UA 黑名单 (curl/python/wget/scrapy/etc.)    │ │
│  │     → 403 直接拦截                               │ │
│  │  2. API referer/origin/host 检查                 │ │
│  │     → 403 阻止第三方 hotlink                     │ │
│  │  3. /embed/ → trackPath + skip D1               │ │
│  │  4. 页面请求 → performSecurityCheck (D1)        │ │
│  │     → 429 rate limit / 403 block                 │ │
│  │  5. Locale rewrite (/es, /pt)                    │ │
│  │  6. www → non-www redirect                       │ │
│  │  7. Cache-Control headers (2hr s-maxage)         │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─ Frontend App (Next.js 14 App Router) ──────────┐ │
│  │  page.tsx (首页)                                │ │
│  │  /about /contact /privacy /practice /wiki        │ │
│  │  /directory /calculators                         │ │
│  │  /integral /limit /ode /matrix                   │ │
│  │  /[slug] (动态 problem 页面)                     │ │
│  │  /es /pt (locale rewrite)                        │ │
│  │  Components: Calculator, Graph, StepDisplay,     │ │
│  │    Navbar, Footer, FAQ, Breadcrumbs, TOC, etc.   │ │
│  │  Google Analytics + Structured Data (schema.org) │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─ API Routes (Edge Runtime) ─────────────────────┐ │
│  │  /api/derivative  (nerdamer + AI)                │ │
│  │  /api/integral    (nerdamer + AI)                │ │
│  │  /api/limit       (nerdamer + AI)                │ │
│  │  /api/ode         (nerdamer + AI)                │ │
│  │  /api/matrix      (mathjs)                       │ │
│  │  /api/problems, /api/problem/[slug]              │ │
│  │  /api/diagnostic, cache-metrics, ip-stats, etc.  │ │
│  │                                                   │ │
│  │  每个 API route 调用:                             │ │
│  │    performSecurityCheck() →                      │ │
│  │      1. Host check                              │ │
│  │      2. Global quota (30k/day)                  │ │
│  │      3. [IP blacklist - DISABLED]               │ │
│  │      4. Turnstile (optional, REQUIRED=false)     │ │
│  │      5. looksLikeLegitimateBrowser()             │ │
│  │         → 5 req/min strict limit (non-browser)   │ │
│  │      6. D1 rate limit (20 req/min default)       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─ /embed/[slug]/route.ts ────────────────────────┐ │
│  │  → 403 Forbidden (1yr cache)                    │ │
│  │  (embed widget permanently disabled)             │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
┌─────────────┐ ┌──────────┐ ┌──────────────────┐
│ Cloudflare  │ │ Upstash  │ │ OpenRouter API   │
│ D1 Database │ │ Redis    │ │ (DeepSeek V3)    │
│             │ │          │ │                  │
│ rate_limits │ │ AI       │ │ chat.completions │
│ ip_blacklist│ │ response │ │ .create()        │
│ abuse_scores│ │ cache    │ │ model: deepseek/ │
│ counters    │ │ (30d TTL)│ │ deepseek-chat    │
│ path_stats  │ │          │ │ max_tokens: 1500 │
│ problems    │ │          │ │                  │
└─────────────┘ └──────────┘ └──────────────────┘

┌─────────────────────────────────────────────────────┐
│          Chrome Extension (独立 Vite 项目)            │
│  manifest.json → sidePanel + contextMenus + popup   │
│  调用 derivativecalculatorai.com API                │
│  当前未发布到 Chrome Web Store                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          GitHub CI/CD Pipeline                        │
│  .github/workflows/deploy.yml                        │
│  push main → checkout → setup node 22 → npm ci →    │
│  npm build → next-on-pages → wrangler pages deploy   │
│  Secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          遗留 / 不活跃组件                             │
│  api/ (Python Flask + sympy + Redis) — 不被调用       │
│  .env.local GEMINI_API_KEY — 未在代码中使用           │
│  多个 .md 文档文件（429_ERROR_ANALYSIS, BOT_PROTECTION │
│  GUIDE, 等）— 运维记录，非代码                        │
└─────────────────────────────────────────────────────┘
```

---

## 5. 对 anyIP 销售邮件的判断

**本项目不需要 proxy / IP rotation / scraping infrastructure 服务。**

理由：
1. **仓库中无 scrapy/selenium 依赖或代码** — `scrapy` 仅出现在 UA 黑名单字符串中（用于拦截 scrapy UA 的请求），项目自身不使用任何爬虫工具
2. **api/ 目录的 Python Flask 代码是遗留代码** — 当前 Next.js edge runtime 路由完全替代了 Python 后端，Python 代码未被调用
3. **项目是计算工具，不是数据采集平台** — 没有任何从第三方网站抓取数据的需求
4. **anti-abuse 系统是防御层，不是采集层** — rate limit 和 bot detection 是保护自身 API 不被滥用，不是出去爬数据

**anyIP 大概率是通过 GitHub repo 关键词搜索（或 AI 扫描）发现了 middleware.ts 中的 `scrapy` 字符串和 api/ 目录的 Python 文件，误判为"这个项目用 scrapy/selenium 做爬虫"。实际上 `scrapy` 出现在 UA 黑名单中恰恰说明项目在**防御** scrapy 类工具，而非使用它们。**

建议回复方向：简短告知对方项目是数学计算工具，不使用任何爬虫/proxy 服务，仓库中的 scrapy/selenium 相关内容是反滥用黑名单，而非项目功能。
