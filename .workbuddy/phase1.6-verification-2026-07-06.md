# Phase 1.6 — Security Verification Gap Closure Report

**Date**: 2026-07-06 21:19  
**Commit**: `11444e0` (Phase 1 deployed)

---

## 1. Cache-Control 验证结果

### 1.1 正常页面 200

```http
HTTP/2 200
cache-control: public, max-age=14400, s-maxage=7200, stale-while-revalidate=86400
cf-cache-status: HIT
age: 1535
```

**评估**: ⚠️ MEDIUM RISK
- 页面被 CF CDN 缓存 2 小时（`s-maxage=7200`）
- 缓存页面绕过 middleware UA blacklist — python/curl/wget UA 从 CDN 获取缓存 200
- 页面本身不含敏感数据，风险可控
- 但 UA blacklist 对页面实际无效（仅首次未缓存请求才触发）

### 1.2 正常 API 200

```http
HTTP/2 200
cache-control: public, max-age=14400, s-maxage=300, stale-while-revalidate=600
cf-cache-status: HIT (or MISS)
```

**评估**: 🔴 HIGH RISK
- API 成功响应被 CF CDN 缓存 5 分钟（`s-maxage=300`）
- 缓存 API 响应完全绕过安全层：
  - ❌ Rate limiting 不运行
  - ❌ UA detection 不运行
  - ❌ Global quota 不计数
  - ❌ Host validation 不检查
- 一个成功的 API 请求创建缓存条目 → 5 分钟内所有请求（含脚本/爬虫）直接获得缓存 200
- `max-age=14400` 来自 CF CDN 默认值，与 API handler 设置的 `max-age=300` 不一致

### 1.3 Rate limit 429

middleware.ts 返回 429：
```js
// middleware.ts line 103-111
return NextResponse.json(
    { error: securityResult.error },
    {
        status: 429,
        headers: securityResult.retryAfter ? {
            'Retry-After': securityResult.retryAfter.toString()
        } : undefined
    }
);
```

API route handler 返回 429：
```js
// app/api/derivative/route.ts line 37-47
return NextResponse.json(
    { error: securityResult.error },
    {
        status: 429,
        headers: securityResult.retryAfter ? {
            'Retry-After': String(securityResult.retryAfter),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
        } : undefined
    }
);
```

**评估**: ⚠️ MEDIUM RISK
- **无 `Cache-Control: no-store`**
- CF CDN 默认不缓存 4xx 响应（BYPASS），但不是显式保证
- 若 CF 缓存策略变化或有 WAF 规则介入，429 可被缓存 → 用户被锁定

### 1.4 Bot UA 403 (middleware)

middleware.ts 返回 403：
```js
// middleware.ts line 37-41 / 46-50
return NextResponse.json(
    { error: 'Access denied...' },
    { status: 403 }
);
```

**评估**: ⚠️ MEDIUM RISK
- **无 `Cache-Control: no-store`**
- 同上，CF 默认 BYPASS 4xx，但缺少显式保障

### 1.5 API 400 错误（无参数）

```http
HTTP/2 400
cf-cache-status: BYPASS
(无 Cache-Control 头)
```

**评估**: ✅ LOW RISK
- CF CDN 自动 BYPASS 400 响应，不缓存

---

## 2. 非浏览器 UA 行为验证

### 2.1 页面请求：UA blacklist 被 CDN 缓存绕过

| UA | 页面路径 | HTTP 状态 | cf-cache-status | 说明 |
|---|---|---|---|---|
| `python-requests/2.28.0` | `/` | **200** | HIT | 🔴 middleware UA blacklist 不生效（CDN 缓存） |
| `curl/7.88.1` | `/about` | **200** | HIT | 🔴 同上 |
| 空 UA (`User-Agent: `) | `/about` | **200** | HIT | 🔴 同上 |

**根因**: Cloudflare Pages CDN 缓存静态 HTML，直接返回缓存页面不经过 Workers middleware。UA blacklist 仅在首次请求（MISS）时运行，缓存命中后对所有 UA 都返回 200。

**风险**: 页面内容是公开 HTML，不含敏感数据，实际安全影响低。但设计意图与实际行为不一致。

### 2.2 API 请求：UA blacklist 不覆盖 API 路径

| UA | API 路径 | HTTP 状态 | cf-cache-status | 说明 |
|---|---|---|---|---|
| `python-requests/2.28.0` | `/api/derivative?equation=x` | **200** | HIT | 🔴 缓存命中，安全层不运行 |
| `curl/7.88.1` | `/api/derivative?equation=x` | **200** | HIT | 🔴 同上 |
| 空 UA | `/api/derivative?equation=test_xyz` | **200** | **MISS** | 🔴 新请求，安全层运行但不阻断 |
| `curl/7.88.1` | `/api/derivative?equation=sin(cos(x))` | **200** | MISS | 🔴 新请求，安全层运行但不阻断 |

**根因（双重）**:

1. **Middleware matcher 排除 `/api/`** → middleware 的 UA blacklist（`ABUSE_UA_PATTERNS`）和空 UA 检查 **完全不对 API 路径生效**
2. **API handler 的 `performSecurityCheck()` 不阻断 abusive UA** → `looksLikeLegitimateBrowser()` 返回 false 时仅应用 strict rate limit（5/min），不返回 403

**风险**: 🔴 HIGH — 任何脚本 UA（curl/python/scrapy/httpx）都可以无限调用 API（只需每分钟 ≤5 次），且 CF CDN 缓存进一步放大了这个漏洞。

---

## 3. D1 表状态评估

### 3.1 活跃表

| 表名 | 用途 | 写入频率 | 评估 |
|---|---|---|---|
| `counters` | global quota + rate limit + Turnstile verified | 每请求 3-4 次写 | ✅ 正常（Phase 1 修正了语义） |
| `rate_limits` | IP rate limit tracking | 每请求 1 次写 | ✅ 正常（probabilistic cleanup） |

### 3.2 残留表（Phase 1 死代码清理后不再写入）

| 表名 | 原用途 | 当前状态 | 建议 |
|---|---|---|---|
| `abuse_scores` | 旧 abuse scoring | 不再写入，旧数据残留 | Phase 2 清理 |
| `ip_blacklist` | 旧 IP 封禁 + Turnstile verified | 不再写入（Turnstile 移到 counters） | Phase 2 清理 |

### 3.3 D1 写入配额影响

Phase 1 改动后的 D1 写入次数：
- global quota: 2 写/请求（hour + day counters）
- rate limit: 1-2 写/请求（increment + probabilistic cleanup）
- 总计: 约 3-4 写/请求
- 100k/day 配额 → 约 300-400k D1 写/天 → 在 5M/day 免费限额内 ✅

---

## 4. 发现的风险汇总

| # | 风险 | 严重度 | 说明 | 建议 |
|---|---|---|---|---|
| R1 | API 成功响应被 CDN 缓存 | 🔴 HIGH | `s-maxage=300` → 安全层被绕过 | 改为 `private, no-store` 或降 s-maxage 到 60s 并加 `Vary: User-Agent` |
| R2 | Middleware UA blacklist 不覆盖 API 路径 | 🔴 HIGH | matcher 排除 `/api/` | 在 API handler 的 `performSecurityCheck()` 中复用 ABUSE_UA_PATTERNS |
| R3 | 空 UA 可访问 API | 🔴 HIGH | middleware 不覆盖 API，handler 不阻断空 UA | 在 `performSecurityCheck()` 中加入空 UA → 403 检查 |
| R4 | 所有 429/403/500 响应缺少 `Cache-Control: no-store` | ⚠️ MEDIUM | CF 默认 BYPASS 但非显式 | 在所有错误响应中添加 `Cache-Control: no-store` |
| R5 | 页面缓存绕过 UA blacklist | ⚠️ MEDIUM | CDN HIT 返回缓存 HTML 给所有 UA | 风险实际低（页面不含敏感数据），但设计与行为不一致 |
| R6 | D1 残留数据（abuse_scores / ip_blacklist） | ⚠️ MEDIUM | 不影响功能但混淆维护者 | Phase 2 清理 |
| R7 | API Cache-Control `max-age=14400` 不一致 | ⚠️ LOW | API handler 设置 max-age=300，但响应显示 max-age=14400 | CF CDN 可能合并 middleware 的页面 Cache-Control |

---

## 5. 建议优先级排序

| 优先级 | 改动 | 复杂度 | 影响范围 |
|---|---|---|---|
| P0 | API handler 添加空 UA → 403 | 3 行代码 | 阻断无 UA 的脚本请求 |
| P0 | API handler 复用 ABUSE_UA_PATTERNS → 403 | 10 行代码 | 阻断 curl/python/scrapy 等 |
| P1 | 所有 403/429/400/500 响应添加 `Cache-Control: no-store` | 5 处各 1 行 | 防止 CDN 缓存错误响应 |
| P1 | API 成功响应改为 `private, no-store` 或降低 s-maxage | 4 个文件各改 1 行 | 消除 CDN 缓存绕过安全层的风险 |
| P2 | 页面缓存行为文档化（不做代码改动） | 文档 | 记录设计与实际行为差异 |

**不建议修改**：页面缓存策略（`s-maxage=7200`）— 页面不含敏感数据，缓存是合理的性能优化。
