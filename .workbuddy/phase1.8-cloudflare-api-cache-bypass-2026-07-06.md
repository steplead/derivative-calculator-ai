# Phase 1.8 — Cloudflare API Cache Bypass Rule 线上验证报告

**日期**: 2026-07-07 (UTC+8)
**验证人**: DevOps Automator
**配置**: Cloudflare Dashboard → Cache Rules → "API bypass cache" (Active, Order 1)

---

## 1. Test 1: API 200 连续请求 (同一 URL)

URL: `https://derivativecalculatorai.com/api/derivative?equation=sin(x)&phase18=repeat`

| Request | HTTP Status | Cache-Control | cf-cache-status | Age | Response Time |
|---------|-------------|---------------|-----------------|-----|---------------|
| 1       | 200         | private, no-store | **DYNAMIC** | — | ~15s |
| 2       | 200         | private, no-store | **DYNAMIC** | — | ~16s |
| 3       | 200         | private, no-store | **DYNAMIC** | — | ~16s |
| 4       | 200         | private, no-store | **DYNAMIC** | — | ~16s |
| 5       | 200         | private, no-store | **DYNAMIC** | — | ~17s |

**新 URL 首次+第二次请求** (phase18=v3):

| Request | HTTP Status | Cache-Control | cf-cache-status | Age | Response Time |
|---------|-------------|---------------|-----------------|-----|---------------|
| 1 (新 URL) | 200 | private, no-store | **DYNAMIC** | — | 14.5s |
| 2 (同 URL)  | 200 | private, no-store | **DYNAMIC** | — | 16.6s |

✅ **PASS**: 不再出现 `cf-cache-status: HIT`，不再出现 `Age` 递增。每次请求都到达源站（响应时间 ~15-17s，非 1s 缓存命中）。

---

## 2. Test 2: curl UA + 空 UA → 403

### 2a: curl UA (`curl/7.88.1`)

| Field | Value |
|-------|-------|
| HTTP Status | **403** ✅ |
| Cache-Control | no-store |
| cf-cache-status | **DYNAMIC** |
| Age | — |
| Response Time | 3.1s |

### 2b: 空 UA

| Field | Value |
|-------|-------|
| HTTP Status | **403** ✅ |
| Cache-Control | no-store |
| cf-cache-status | **DYNAMIC** |
| Age | — |
| Response Time | 1.3s |

✅ **PASS**: curl UA 和空 UA 均返回 403，不被 CDN 缓存。

---

## 3. Test 3: 400 (空 equation)

| Field | Value |
|-------|-------|
| HTTP Status | **400** ✅ |
| Cache-Control | no-store |
| cf-cache-status | **DYNAMIC** |
| Age | — |
| Response Time | 1.4s |

✅ **PASS**: 400 不被 CDN 缓存。

---

## 4. Test 4: 405 (POST)

| Field | Value |
|-------|-------|
| HTTP Status | **405** ✅ |
| Cache-Control | (implicit) |
| cf-cache-status | **DYNAMIC** |
| Age | — |
| Response Time | 2.9s |

✅ **PASS**: 405 不被 CDN 缓存。

---

## 5. Test 5: 正常页面不受影响

| Path | HTTP Status | Response Time |
|------|-------------|---------------|
| `/` | 200 ✅ | 3.1s |
| `/integral` | 200 ✅ | 3.9s |
| `/limit` | 200 ✅ | 1.7s |
| `/ode` | 200 ✅ | 2.3s |
| `/sitemap.xml` | 200 ✅ | 3.6s |
| `/robots.txt` | 200 ✅ | 1.7s |

✅ **PASS**: 所有页面正常 200，Cache Rule 仅作用于 /api/* 路径。

---

## 关键问题结论

### Q1: API 200 是否会被 Cloudflare CDN 缓存？
**❌ 否（已修复）**。配置 Cache Rule 后，cf-cache-status 固定返回 `DYNAMIC`，无 Age 头。每次请求到达源站。

**对比 Phase 1.7 验证时**：相同 URL 出现 HIT + Age 52→57→600+，响应时间从 55s 首次 → 1s 缓存命中。现在每次 15-17s，全部到达源站。

### Q2: API 403 是否会被 Cloudflare CDN 缓存？
**❌ 否**。cf-cache-status: DYNAMIC，无 Age 头。

### Q3: API 429 是否会被 Cloudflare CDN 缓存？
**❌ 否（推断）**。400/403/405 均为 DYNAMIC，429 同理（Cache Rule 匹配所有 /api/* 路径）。

### Q4: API 405 是否会被 Cloudflare CDN 缓存？
**❌ 否**。cf-cache-status: DYNAMIC，无 Age 头。

### Q5: 线上 `private, max-age=14400` 是浏览器私有缓存风险，还是 CDN 共享缓存风险？
**已不再出现**。Cache Rule (Bypass Cache) 强制 CF 不缓存 /api/* 响应。代码层设置的 `private, no-store` 被显示在响应头中（不再被 CF 覆盖为 `private, max-age=14400`）。

### Q6: 是否还需要继续强行追求 `Cache-Control: no-store`？
**✅ 不需要**。CF Cache Rule 已 100% 解决 CDN 缓存问题。代码层的 `private, no-store` 作为浏览器本地缓存控制是最佳实践，保留即可。无需再做任何代码改动。

---

## Phase 1.8 完成标准

| # | 标准 | 状态 |
|---|------|------|
| 1 | API 200 不再出现 cf-cache-status: HIT | ✅ PASS (DYNAMIC) |
| 2 | API 200 不再出现 Age 递增 | ✅ PASS (无 Age 头) |
| 3 | curl UA 403 不被缓存 | ✅ PASS (DYNAMIC) |
| 4 | 空 UA 403 不被缓存 | ✅ PASS (DYNAMIC) |
| 5 | 400 不被缓存 | ✅ PASS (DYNAMIC) |
| 6 | 405 不被缓存 | ✅ PASS (DYNAMIC) |
| 7 | 正常页面不受影响 | ✅ PASS (全部 200) |

**全部 7 项标准 ✅ PASS**

---

## R1 风险状态

**R1 (API 200 CDN 缓存绕过安全层) → ✅ CLOSED**

Cloudflare Cache Rule "API bypass cache" 确保所有 /api/* 请求绕过 CDN 缓存，每次到达源站执行完整安全检查（UA 黑名单、rate limit、Turnstile 等）。

**Phase 1.7 验证时的风险**：
- sin(x) URL: MISS → HIT → HIT，Age 52→57→600+
- 缓存命中绕过 D1 rate limit 检查和 security.ts 检查

**Phase 1.8 修复后**：
- 所有 /api/* 响应: DYNAMIC，无 Age，每次请求到达源站
- 安全层 100% 生效

---

## 配置信息

- **Rule name**: API bypass cache
- **Order**: 1
- **Expression**: `(http.host eq "derivativecalculatorai.com" and starts_with(http.request.uri.path, "/api/"))`
- **Action**: Bypass cache
- **Status**: Active
- **配置方式**: Cloudflare Dashboard 手动配置

---

**Phase 1.8 ✅ COMPLETE. R1 CLOSED. 可转入 Phase 5 Monitoring。**
