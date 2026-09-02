# Phase 5 — Minimum Monitoring Audit (只读)

**日期**: 2026-07-08
**范围**: 只读审计，不改代码

---

## 1. Existing Monitoring Items Audit

| # | Existing Monitoring Item | Location | What It Measures | Protected? | Risk | Keep / Improve / Remove |
|---|---|---|---|---|---|---|
| 1 | **path_stats D1 table** | `utils/path-tracker.ts` → D1 `path_stats` | 每小时按路径+状态码聚合请求量 | ✅ admin-only via `/api/path-stats` | **MEDIUM**: 每请求写入 D1（middleware + 5 API routes 都 trackPath），消耗 D1 quota。无自动 cleanup，7 天后数据膨胀 | **Improve**: 加 probabilistic cleanup；考虑只 track /api/* 路径 |
| 2 | **counters D1 table** | `utils/security.ts` → D1 `counters` | global:hour / global:day 全局请求计数，用于 quota 检查 | ✅ admin-only via `/api/ip-stats` 间接暴露 | **LOW**: 只写 quota 相关 key，自然过期 | **Keep** — 已有 cleanup 机制（key 自动过期） |
| 3 | **rate_limits D1 table** | `utils/security.ts` → D1 `rate_limits` | 每 IP 请求计数+reset_time，用于 rate limit | ✅ admin-only via `/api/ip-stats` | **LOW**: 1% probabilistic cleanup | **Keep** — Phase 1 已优化 |
| 4 | **ip_blacklist D1 table** | `utils/security.ts` → D1 `ip_blacklist` | 被封禁 IP + reason + blocked_until | ✅ admin-only via `/api/ip-stats` | **LOW**: 已有 `blocked_until` 自动过期 | **Keep** |
| 5 | **abuse_scores D1 table** | `utils/security.ts` → D1 `abuse_scores` | 每 IP abuse 分数 + last_updated | ✅ admin-only via `/api/ip-stats` | **LOW**: Phase 1 已移除 scoring logic，但表和数据仍在 D1 中 | **Keep** (表保留，逻辑已禁用) |
| 6 | **/api/diagnostic** | `app/api/diagnostic/route.ts` | D1/DB 可用性、request headers、env vars | ✅ `isAdminRequest()` | **HIGH**: 返回 `request.headers` **完整原文**（含 User-Agent、IP via cf-connecting-ip），违反 Phase 5 原则 #5 | **Improve**: 移除 headers 原文输出，只输出关键摘要 |
| 7 | **/api/ip-stats** | `app/api/ip-stats/route.ts` | rate_limits top50 + blocked IPs + high abuse score IPs | ✅ `isAdminRequest()` | **HIGH**: 返回 IP **原文**、reason 原文、offense_count，违反原则 #5 | **Improve**: IP 哈希化或只返回摘要统计 |
| 8 | **/api/cache-metrics** | `app/api/cache-metrics/route.ts` | Redis cache hit/miss 计数 + hit rate + savings | ✅ `isAdminRequest()` | **LOW**: 只返回计数统计，不泄露敏感信息 | **Keep** |
| 9 | **/api/path-stats** | `app/api/path-stats/route.ts` | D1 path_stats 查询，支持 hours 参数 | ✅ `isAdminRequest()` | **LOW**: 只返回路径统计 | **Keep** — 基础数据源 |
| 10 | **/api/traffic-analysis** | `app/api/traffic-analysis/route.ts` | 24h 流量分析：路径分布、分类、时段、状态码分布、top20 路径 | ✅ `isAdminRequest()` | **LOW**: 只返回聚合统计 | **Keep** — 最有价值的分析 endpoint |
| 11 | **/api/test-redis** | `app/api/test-redis/route.ts` | Redis 连接测试 + ratelimit 测试 + env var 是否存在 | ✅ `isAdminRequest()` | **MEDIUM**: 检查 `UPSTASH_REDIS_REST_URL/TOKEN` 是否 set（只返回 boolean，不泄露值），但 verdict 信息对攻击者有用 | **Keep** — 诊断必需 |
| 12 | **/api/unblock-ip** | `app/api/unblock-ip/route.ts` | 解封 IP（DELETE ip_blacklist + abuse_scores + rate_limits） | ✅ `isAdminRequest()` | **HIGH**: 需要 IP 原文参数 — admin 操作必需，但应记录操作日志 | **Keep** — admin 必需 |
| 13 | **Cache metrics in-memory** | `utils/cache.ts` (cacheHits/cacheMisses vars) | Redis cache hit/miss 计数（进程内，重启丢失） | — | **LOW**: 服务器重启丢失，无持久化 | **Keep** — 轻量级，够用 |
| 14 | **console.error/warn** | 5 API routes + path-tracker + cache + security | 错误日志输出到 Cloudflare Workers 容器日志 | — | **MEDIUM**: Workers 免费版无持久日志（Real-time Log 需付费）；部分 console.error 包含 IP 或 UA 信息（如 `[API] Error tracking path`） | **Improve**: 清理敏感信息；关键错误写 D1 |
| 15 | **GitHub Actions CI** | `.github/workflows/deploy.yml` | Build + Deploy 到 CF Pages | — | **LOW**: 无 failure notification（无 Slack/email webhook） | **Improve**: 加 failure notification step |
| 16 | **Cloudflare Analytics** | Cloudflare Dashboard (无代码) | Requests/bandwidth/threats/SSL (免费版) | — | **LOW**: 免费版有基础数据但无 path breakdown | **Keep** — 免费，不需代码 |
| 17 | **Cloudflare Cache Rule** | Dashboard: "API bypass cache" | /api/* cf-cache-status 监控 | — | **LOW**: 确保无 HIT | **Keep** — Phase 1.8 已验证 |
| 18 | **Uptime / health check** | 无 | — | ❌ | **HIGH**: 无任何 uptime monitoring | **Create**: 新建 `/api/admin/health` + 外部 uptime check |

---

## 2. D1 表 Row Count Estimate

| Table | Write Frequency | Read Frequency | Cleanup | Estimated Rows (7 days) |
|-------|----------------|---------------|---------|------------------------|
| `path_stats` | 每请求 (middleware + 5 API) | admin query only | ❌ 无自动清理 | ~5-10k (每小时+路径+状态码组合) |
| `counters` | quota check 时写入 | quota check | ❌ 无自动清理（key 自然过期但不 DELETE） | ~50-100 (hour/day key) |
| `rate_limits` | 每 IP 首次请求 + 计数更新 | rate limit check | 1% probabilistic DELETE | ~100-500 (active IPs) |
| `ip_blacklist` | 仅封禁时写入 | admin query | blocked_until 自然过期但不 DELETE | ~10-50 |
| `abuse_scores` | **Phase 1 已禁用 scoring logic** | admin query | ❌ 无清理 | ~20-50 (历史残留) |
| `problems` | 静态数据 | 页面渲染 | — | ~300+ (seed data) |

**D1 write pressure per request**: 2-3 writes (path_stats + counters + rate_limits)
**D1 read pressure per request**: 2-4 reads (quota check + rate limit check)

---

## 3. Monitoring Gap Analysis

### ✅ Already Covered (Good)

- **Path-level request tracking** — path_stats 按路径+状态码聚合
- **Global quota monitoring** — counters table global:hour/day
- **Rate limit per-IP** — rate_limits table
- **IP blocking** — ip_blacklist + abuse_scores
- **Redis cache health** — /api/test-redis + /api/cache-metrics
- **Traffic analysis** — /api/traffic-analysis (24h 分布+状态码)
- **Admin auth** — `isAdminRequest()` on all admin endpoints

### ❌ Gaps (Need to Add)

| Gap | Priority | What's Missing |
|-----|----------|---------------|
| **No unified health endpoint** | P0 | 无 `/api/admin/health` 汇总关键指标，无法做外部 uptime monitoring |
| **No API latency tracking** | P0 | D1 counters 只记数量，不记耗时。无法知道 API 平均/p95 响应时间 |
| **No OpenRouter failure tracking** | P1 | API route 内 console.error 不持久化。不知道 AI 失败率 |
| **No fallback explanation tracking** | P1 | 同上，不知道 fallback 触发频率 |
| **No 4xx/5xx counter by endpoint** | P1 | path_stats 有数据但无聚合 endpoint 按 API+状态码汇总 |
| **No blocked UA type counter** | P2 | middleware 直接 403，不记 count。不知道哪种 UA 被封最多 |
| **No CI failure notification** | P2 | GitHub Actions deploy.yml 无 webhook |
| **path_stats 无自动 cleanup** | P2 | 7 天后膨胀，需 periodic DELETE |
| **Sensitive data in diagnostic/ip-stats** | P1 | IP/UA 原文暴露 |

---

## 4. Admin Auth Current State

```typescript
// utils/admin-auth.ts
isAdminRequest(headers):
  1. X-Admin-API-Key header === process.env.ADMIN_API_KEY
  2. IP in process.env.ADMIN_IPS whitelist
  3. Production + no auth configured → deny
  4. Dev + localhost → allow
```

**Production auth**: 需要 `ADMIN_API_KEY` 或 `ADMIN_IPS` 环境变量。
**CF Pages 环境变量**: 当前是否设置了 `ADMIN_API_KEY`？需确认。

---

## 5. Key Findings Summary

1. **已有相当丰富的监控数据**（path_stats、counters、rate_limits、traffic-analysis），但缺乏一个统一的 health/summary endpoint
2. **最大安全风险**: `/api/diagnostic` 和 `/api/ip-stats` 泄露 IP/UA 原文
3. **最大功能缺失**: 无 API latency tracking、无 OpenRouter failure tracking
4. **path_stats 是最有价值的数据源**，但每请求写入 D1 且无自动清理
5. **CI pipeline 无 failure notification**
6. **admin auth 机制已存在**但需确认 `ADMIN_API_KEY` 是否在 CF Pages 环境变量中配置

---

**下一步**: 等用户确认后，设计最小监控指标 + `/api/admin/health` endpoint + 修复安全风险。
