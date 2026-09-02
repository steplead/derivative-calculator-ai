# Phase 1.7 线上缓存验证最终报告

**日期**: 2026-07-07 21:30 GMT+8
**目的**: 确认 Cloudflare 是否缓存 API 响应，评估 `private` 指令实际效果
**结论**: ⚠️ **API 200 正被 Cloudflare CDN 缓存，`private` 指令无效，当前方案存在安全风险**

---

## 测试 1：同一 URL 连续请求 3 次（API 200）

URL: `https://derivativecalculatorai.com/api/derivative?equation=sin(x)&phase17-repeat=1`

| 请求 | HTTP Status | Cache-Control | cf-cache-status | Age | time_total |
|------|-------------|---------------|-----------------|-----|------------|
| #1   | 200         | private, max-age=14400 | MISS  | —   | 13.73s |
| #2   | 200         | private, max-age=14400 | **HIT**  | **52** | 4.48s |
| #3   | 200         | private, max-age=14400 | **HIT**  | **57** | 1.84s |

**追加验证**（5分钟后复测同一 URL）：

| 请求 | cf-cache-status | Age | time_total |
|------|-----------------|-----|------------|
| #4   | **HIT** | ~600+ | 0.89s |
| #5   | **HIT** | ~600+ | 1.04s |

**新 URL (cos(x)) 对比**：

| 请求 | cf-cache-status | time_total |
|------|-----------------|------------|
| #1 (首次) | MISS | 55.29s |
| #2 (3s后) | **HIT** | 5.06s |

### 结论
- ❌ **出现了 cf-cache-status: HIT**
- ❌ **Age 从 52 增长到 57**（每次递增 ~5 秒，持续增长）
- ❌ **response time 从 55s 降至 1-5s**（CDN 边缘直接返回，不访问 origin）
- **CF Pages 将 `private, max-age=14400` 视为可缓存信号，`private` 指令完全无效**

---

## 测试 2：429 rate limit 响应头

**未能成功触发 429**。原因：
- API rate limit 为 20 req/min，每个请求耗时 2-55 秒
- 顺序请求无法在 60 秒窗口内达到 20 次
- 并行请求受代理限制（SSL/连接错误）

**推断**：429 响应使用 `cache-control: no-store`（同 400），应为 `cf-cache-status: BYPASS`，不会被 CDN 缓存。需后续确认。

---

## 测试 3：405 Method Not Allowed

POST `https://derivativecalculatorai.com/api/derivative?equation=sin(x)`

| 字段 | 值 |
|------|-----|
| HTTP Status | 405 |
| Cache-Control | 无（Next.js 默认） |
| cf-cache-status | **DYNAMIC** |
| Age | 无 |
| time_total | 1.10s |

### 结论
- ✅ 405 **不被缓存**（DYNAMIC = 每次都访问 origin）

---

## 测试 4：400 Bad Request（空 equation）

`https://derivativecalculatorai.com/api/derivative?equation=`

| 字段 | 值 |
|------|-----|
| HTTP Status | 400 |
| Cache-Control | **no-store** |
| cf-cache-status | **BYPASS** |
| Age | 无 |
| time_total | 2.19s |

### 结论
- ✅ 400 **不被缓存**（`no-store` 被尊重，BYPASS）

---

## 测试 5：403 Forbidden（bot UA）

UA: `python-requests/2.28.0`（middleware ABUSE_UA_PATTERNS 黑名单）

| 字段 | 值 |
|------|-----|
| HTTP Status | 403 |
| Cache-Control | **no-store** |
| cf-cache-status | **BYPASS** |
| Age | 无 |
| time_total | 1.69s |

### 结论
- ✅ 403 **不被缓存**（`no-store` 被尊重，BYPASS）

---

## 最终结论（6 个关键问题）

### Q1: API 200 是否会被 Cloudflare CDN 缓存？
**⚠️ 是的。API 200 正在被 Cloudflare CDN 缓存。**
- cf-cache-status: HIT 确认
- Age 递增确认（52→57→600+）
- response time 从 55s 降至 1-5s 确认（CDN 边缘直接返回）
- 缓存时长 = `max-age=14400` = **4 小时**

### Q2: API 403 是否会被 Cloudflare CDN 缓存？
**✅ 不会。** Middleware 403 返回 `no-store`，CF Pages 尊重该指令，cf-cache-status: BYPASS。

### Q3: API 429 是否会被 Cloudflare CDN 缓存？
**大概率不会。** 429 与 400 使用相同 `no-store` 逻辑，预计 BYPASS。（本次未能触发 429 实测）

### Q4: API 405 是否会被 Cloudflare CDN 缓存？
**✅ 不会。** cf-cache-status: DYNAMIC，每次访问 origin。

### Q5: 线上 `private, max-age=14400` 是浏览器私有缓存风险，还是 CDN 共享缓存风险？
**⚠️ 是 CDN 共享缓存风险，不仅是浏览器私有缓存。**
- HTTP 规范定义 `private` = "不缓存到共享缓存（CDN）"
- **但 Cloudflare Pages 不遵守 `private` 指令**
- CF Pages 用 `max-age` 作为缓存资格信号，将 `private, max-age=14400` 视为"在边缘缓存 4 小时"
- **这意味着任何人访问过的 API 结果，在 4 小时内任何其他用户都能从 CDN 直接获取，无需经过 origin 的安全检查**

### Q6: 是否还需要继续强行追求 `Cache-Control: no-store`？
**是的，必须解决 API 200 被 CDN 缓存的问题。但通过 response header 已无法实现。**

原因分析：
- Phase 1.7 尝试了 `response.headers.set('Cache-Control', 'no-store')` → CF Pages 覆盖为 `private, max-age=14400`
- Phase 1.7 尝试了 `new Response(body, { headers: { 'Cache-Control': 'no-store' } })` → CF Pages 同样覆盖
- Phase 1.7 尝试了 `_headers` 文件 → 只对静态资产生效，不对 Workers/Functions 生效
- **CF Pages 对 200 成功响应强制覆盖 Cache-Control，不可通过代码层绕过**

但 400/403 等错误响应的 `no-store` 被 CF Pages **尊重**（不被覆盖）。这说明：
- CF Pages 只覆盖 **200 成功响应** 的 Cache-Control
- CF Pages 不覆盖 **错误响应**（4xx/5xx）的 Cache-Control

---

## 安全风险评估

### 缓存的 API 200 响应绕过的安全层：
1. ❌ Middleware UA 黑名单检查 — 缓存响应直接从 CDN 返回，不经过 middleware
2. ❌ D1 rate limit 检查 — CDN 响应不触发 D1 查询
3. ❌ performSecurityCheck() — 完全绕过
4. ❌ API route 内的 referer/origin 检查 — 不执行
5. ❌ Abuse scoring — 不累积

### 实际影响：
- 用户 A 计算 `sin(x)` → 结果被 CDN 缓存 4 小时
- 用户 B（可能是被封禁 IP/恶意 UA）请求 `sin(x)` → 直接从 CDN 获得 HIT，无需任何安全检查
- **核心价值（AI 步骤讲解）被免费泄露给任何能猜到 URL 的人**

---

## 修复方案

由于 response header 无法阻止 CF Pages 缓存 200 响应，唯一可靠方案：

### 方案 A：Cloudflare Dashboard Cache Rules（推荐，不改代码）
1. 登录 Cloudflare Dashboard → derivativecalculatorai.com → Caching → Cache Rules
2. 创建规则：当 URI Path 匹配 `/api/*` → **Bypass Cache**
3. 效果：所有 API 响应（包括 200）都不在 CDN 缓存
4. 优点：零代码改动、100% 可靠、即时生效
5. 缺点：每个 API 请求都访问 origin（增加 Workers 调用量）

### 方案 B：代码层 workaround（不推荐）
1. 在 API 200 响应中添加 `vary: *` 头 — 但 CF Pages 可能也覆盖 vary
2. 在响应 body 中加入 timestamp 使每次响应不同 — 但破坏 API 结果一致性
3. 返回 200 时手动设置 status=200 但用 `new Response(body, { status: 200, headers: {...} })` — 已验证无效

### 方案 C：混合方案（A + 代码层 no-store）
- Cache Rules bypass + 代码层 `no-store` 双保险
- 即使 Cache Rules 配置失误，`no-store` 仍是 fallback

---

## 状态汇总

| 响应类型 | CF CDN 缓存? | cf-cache-status | Cache-Control | 安全 |
|----------|-------------|-----------------|---------------|------|
| API 200  | ⚠️ **是** (4h) | HIT | private, max-age=14400 | ❌ 绕过所有安全层 |
| API 400  | ✅ 否 | BYPASS | no-store | ✅ 安全 |
| API 403  | ✅ 否 | BYPASS | no-store | ✅ 安全 |
| API 405  | ✅ 否 | DYNAMIC | 无 | ✅ 安全 |
| API 429  | ✅ 否(推断) | BYPASS(推断) | no-store | ✅ 安全 |

---

**验证人**: DevOps Automator
**验证时间**: 2026-07-07 21:30 GMT+8
**关键发现**: Cloudflare Pages 缓存 API 200 响应，`private` 指令无效，需 Cache Rules 修复
