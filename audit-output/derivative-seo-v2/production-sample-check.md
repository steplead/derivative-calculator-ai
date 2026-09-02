# 生产环境抽查记录

> 抽查方式：curl + Googlebot 桌面/智能手机 UA，温和频率（每请求带 `_cb` cache-bust 避免干扰 CDN 缓存）。所有结论以实测为准。

## 抽查结果汇总

| # | URL | 普通UA | Googlebot UA | HTTP | robots | canonical | title | H1 | SSR 主体 | 软404 | 结论 |
|---|-----|--------|-------------|------|--------|-----------|-------|-----|---------|-------|------|
| 1 | `/` | 200 | 200 | 200 | index,follow | 正确 | 正确 | 正常 | 完整 | 否 | ✅ |
| 2 | `/integral` | 200 | 200 | 200 | index,follow | 正确 | title重复拼接 | 正常 | 完整 | 否 | ⚠️ title |
| 3 | `/limit` | 200 | 200 | 200 | index,follow | 正确 | title重复拼接 | 正常 | 完整 | 否 | ⚠️ title |
| 4 | `/ode` | 200 | 200 | 200 | index,follow | 正确 | title重复拼接 | 正常 | 完整 | 否 | ⚠️ title |
| 5 | `/calculators` | 200 | 200 | 200 | index,follow | 正确 | title重复拼接 | 正常 | 完整 | 否 | ⚠️ title |
| 6 | `/derivative-of-x-squared` | 200 | 200 | 200 | index | 正确 | 正常 | **缓存HIT时=软404** | 空洞 | 是(缓存) | 🔴 |
| 7 | `/derivative-of-sin-x` | 200 | 200 | 200 | index | 正确 | 正常 | 同上 | 空洞 | 是(缓存) | 🔴 |
| 8 | `/derivative-of-log-x` | 200 | 200 | 200 | index | 正确 | 正常 | 同上 | 空洞 | 是(缓存) | 🔴 |
| 9 | `/derivative-of-e-to-the-2x` | 200 | 200 | 200 | index | 正确 | 正常 | 正常(回源) | 空洞 | 否 | ⚠️ |
| 10 | `/derivative-of-x-times-sin-x` | 200 | 200 | 200 | index | 正确 | 正常 | 正常(回源) | 空洞 | 否 | ⚠️ |
| 11 | `/wiki/chain-rule` | 200 | 200 | 200 | index | 正确 | 正常 | 正常 | 薄(264字符) | 否 | ⚠️ 内容薄 |
| 12 | `/problems/derivative` | 200 | 200 | 200 | index | 正确 | 正常 | 正常 | **空(0链接)** | 否 | 🔴 |
| 13 | `/problems` | 200 | 200 | 200 | index | 正确 | 正常 | 正常 | **空(分类数字全0)** | 否 | 🔴 |
| 14 | `/directory` | 200 | 200 | 200 | index | 正确 | 正常 | 正常 | 1084链接 | 否 | ✅ |
| 15 | `/practice/beginner` | 200 | 200 | 200 | index | — | — | — | — | 否 | 待查 |
| 16 | `/this-slug-does-not-exist-xyz` | 200 | 200 | **200** | — | — | — | "Unable to load calculation" | 空洞 | **是** | 🔴 |

## 三个决定性发现

### 发现 1：软 404 且被 CDN 缓存（最严重）

- 不存在的 slug 也返回 **HTTP 200** + "Unable to load calculation"（`[slug]/page.tsx` 的 catch 块兜底）。
- 部分真实页面（x-squared、sin-x、log-x）在生产环境 SSR 渲染失败，返回同一兜底文案。
- 失败结果被 Cloudflare 缓存：`cf-cache-status: HIT`，`cache-control: public, max-age=14400, s-maxage=7200`，**缓存最长 4 小时**。
- 用 `_cb` cache-bust 强制回源后，x-squared/sin-x 恢复正常（说明是渲染竞态/超时导致的间歇性失败被缓存），但 log-x 回源仍失败。

### 发现 2：SSR 主体内容空洞（致命 SEO 缺陷）

对所有 `/[slug]` 页面，SSR 输出的 `<main>` 内可见文字仅约 247 词，且全部是：

- 面包屑 + H1（"Derivative of x^2"）
- 固定模板文案："To find the derivative of x^2, we use standard differentiation rules. Our AI-powered calculator breaks down the steps and explains the logic."
- "Practice More Problems" 随机相关题目标题

**真实数学答案（如 `2*x`）、解题步骤（Step 1/2/3）、MathDisplay 渲染的公式，全部不在 SSR HTML 中**，而是在客户端 JS 里通过 `fetch('/api/derivative?...')` 动态获取。Googlebot 抓到的每个页面几乎完全相同，只有 H1 里的公式字符串不同。

### 发现 3：problems 页 SSR 为空

- `/problems` 和 `/problems/[type]` 页面依赖 `/api/problems`（D1 数据库，`limit` 封顶 100），但 SSR 渲染时分类数字全为 0、0 个题目链接。
- 对比：`/directory` 页面用 `problems.json` 静态文件 fallback，SSR 正常渲染 1084 个 derivative 链接。
- 说明 problems 页在生产环境 D1 查询失败或返回空，但页面仍返回 200（软 404）。

## 无法确认项

- `/practice/[level]` 页面内容质量（本次未深挖，标记待查）。
- 生产环境 D1 数据库 `problems` 表实际行数与本地 `problems.json` 是否一致（无法直接查询 D1，需 wrangler CLI + 凭据）。
- 生产版本与本地 commit `037caf4` 是否完全一致（无部署日志可交叉验证，标记 Unknown）。
