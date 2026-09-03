# 待你手动执行的 2 个 Cloudflare Dashboard 操作

> Buddy 已实测确认：这两步**只能由你在 Dashboard 手动做**，Buddy 侧无法用 API 代执行。
> 原因（证据）：`wrangler whoami` 的 OAuth token scope 只有 `zone:read`，**无 `zone:cache_purge`**；
> 磁盘无 `CF_API_TOKEN`/`CF_ZONE_ID`（`.env` 仅 `OPENROUTER_API_KEY`）；关闭原生自动部署是 Dashboard 开关，用 API PATCH 有配错风险。

---

## ① Purge Everything（清边缘旧 HTML 缓存）

路径：
```
Cloudflare Dashboard
→ 选 derivativecalculatorai.com（注意是 Zone，不是 Workers & Pages）
→ Caching
→ Configuration
→ Purge Everything
→ 点 "Purge Everything" 确认
```
目的：清掉可能仍缓存旧 HTML 的边缘节点（Googlebot 易命中的美国 PoP）。
超时时间：`s-maxage=7200`，正常每 2h 自动刷新；但显式 purge 最干净。

## ② 关闭 Cloudflare 原生自动部署（消除双部署竞争）

推荐：**保留 GitHub Actions，关闭 Cloudflare 原生集成**。

路径 A（推荐）：
```
Cloudflare Dashboard
→ Workers & Pages
→ derivative-calculator-ai
→ Settings
→ Builds & deployments
→ Automatic deploys
→ Disable
```

路径 B（备选，若 A 找不到）：
```
同一页 → 把 Production branch 改成一个永远不会 push 的分支
（例如 `disabled` 或 `no-auto-deploy`），让原生集成没有可触发的生产分支。
```
原因：现在 GitHub Actions 的 `wrangler pages deploy` 和 Cloudflare 原生 GitHub 集成
都在监听 `push to main`，同一 commit 产生多个竞争 Production 部署，会出现"active 落在旧构建"的窗口期。
关掉原生集成后，Actions 成为唯一权威部署方，链路干净。

---

## 做完后如何验证（Buddy 可代验）
- Purge 后：Buddy 可用 `curl` 带浏览器 UA 测 `cf-cache-status`，应从 HIT/陈旧 → 重新 MISS/回源取新副本。
- 关闭原生自动部署后：下次 `push to main`，Buddy 查 check-runs 应只剩 `Deploy to Cloudflare Pages`（Actions）一条，不再有 `Cloudflare Pages`（原生）那条。

## 明天（UTC 重置后）看 D1 Usage 闭环
```
Cloudflare Dashboard → Workers & Pages → derivative-calculator-ai → D1 → metrics
看：Rows read / Rows written / Top queries
预期：Rows read 不再一天几百万；Rows written 明显下降（每请求 ~4 → ~1，且 problem API 不再读 problems 表）。
```

## 验证状态（2026-09-03）
- ① Purge Everything：已执行。验证 `derivativecalculatorai.com` 生产缓存头由 `cf-cache-status: HIT (age≈6869)` → `MISS`，即页面已重新回源、服务当前部署副本，边缘陈旧 HTML 已清空。✅
- ② 关闭原生自动部署：本文件提交并 push 后，观察 check-runs 是否只剩 `Deploy to Cloudflare Pages`（Actions），不再出现 `Cloudflare Pages`（原生集成）那条。验证中。

