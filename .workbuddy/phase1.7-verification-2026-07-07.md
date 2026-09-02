# Phase 1.7 线上验证报告

**日期**: 2026-07-07
**部署 commit**: `4466e84` (main)
**CI**: 已自动部署到 Cloudflare Pages

---

## 修复内容

3 个 commit 合并到 main：
1. `af213c3` — P0 API security patch (R1-R4)
2. `c18228d` — _headers /api/* 规则（后发现对动态路由不生效）
3. `4466e84` — Cache-Control 从 `.headers.set()` 改为构造函数参数

---

## 线上验证结果

### UA 黑名单覆盖 API ✅

| UA | 首页 | API | Cache-Control | cf-cache-status |
|---|---|---|---|---|
| 裸 curl (无 UA) | 403 | - | - | - |
| curl/7.88.1 | 403 | 403 | - | - |
| python-requests | - | 403 | no-store | BYPASS |
| 空 UA | - | 403 | no-store | BYPASS |
| 浏览器 UA | 200 | 200 | private, max-age=14400 | MISS |

### Cache-Control 头分析

**403/429 错误响应**: `Cache-Control: no-store` + `cf-cache-status: BYPASS` ✅
→ CF 不缓存错误响应，安全层每次生效

**200 API 成功响应**: CF Pages 平台层覆盖为 `Cache-Control: private, max-age=14400`
→ 代码设置的 `private, no-store` 被 CF Pages 默认策略覆盖
→ **但 `private` 指令已禁止 CDN 边缘缓存**，R1 核心风险实际缓解
→ `cf-cache-status: MISS` 证实 CF 不缓存 API 响应在边缘节点

---

## 风险状态更新

| 风险 | 原评级 | 当前状态 | 说明 |
|---|---|---|---|
| R1 HIGH | API缓存绕过安全层 | ✅ **实际缓解** | `private` 禁止 CDN 缓存，`cf-cache-status: MISS` 确认 |
| R2 HIGH | middleware UA blacklist 不覆盖 API | ✅ **完全修复** | security.ts 内 ABUSE_UA_PATTERNS 覆盖 API |
| R3 HIGH | 空 UA 可访问 API | ✅ **完全修复** | security.ts 内空 UA → 403 |
| R4 MEDIUM | 错误响应缺 no-store | ✅ **完全修复** | 403/429 响应均有 no-store + BYPASS |
| R4 残留 | 200 API 响应不是 no-store | ⚠️ **低风险** | 浏览器本地缓存 4h，同一用户同表达式 |
| R5 MEDIUM | 页面缓存绕过 UA blacklist | 📄 **已文档化** | 不做代码改动 |

---

## 残留项（可选优化）

如需完全 `no-store`（含浏览器本地缓存），需配置 **Cloudflare Transform Rule**：

1. 登录 Cloudflare Dashboard → Rules → Transform Rules → Modify Response Header
2. 创建规则：
   - URL Path starts with `/api/`
   - Action: Set static header
   - Header name: `Cache-Control`
   - Header value: `private, no-store`
3. 这会在边缘层强制覆盖 CF Pages 默认的 `private, max-age=14400`

---

## Rollback Plan

- `git revert 4466e84` → 回退构造函数修复
- `git revert c18228d` → 回退 _headers /api/* 规则
- `git revert af213c3` → 回退 P0 security patch
- 或 `git revert 7f4a0bc` → 回退整个 Phase 1.7 merge
