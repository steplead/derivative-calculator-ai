# P2 Data Quality + SEO Routing Audit — derivative-calculator-ai

**Date:** 2026-09-03 · **Mode:** READ-ONLY audit + 1 small certain fix
**Code state reviewed:** `main` @ current HEAD (post P0/P1 closure, commit `de8d3b5` + CI hardening)
**Method:** read memory/reports → search codebase → full `problems.json` audit script → production sampling (browser UA) → report.

---

## 0. Verdict (回答用户结论)

- **新的 P0 / P1：无。** 页面渲染仍 D1 无关、数学答案正确、soft-404 未回归、D1 写入仍为 ~1/请求、problem API 仍 static-first（实测 `/api/problems?limit=3&type=derivative` 与 `/api/problem/derivative-of-1-x` 均 200）。P0/P1 闭环保持。
- **P2 最重要的 3 个问题**：
  1. **Sitemap 覆盖率崩塌到 9 条**（production `/sitemap.xml` 由 `app/sitemap.ts` 覆盖 `public/sitemap.xml` 的 9,483 条）→ 全部单题页掉出 sitemap。
  2. **`/problems/ode` 是空分类（0 题）** + `/problems/matrix` 不存在（404）→ 分类页不一致/断裂。
  3. **`difficulty`/`tags` 100% 缺失于 `problems.json`** → `/practice/[level]` 三档正文完全相同（近重复薄内容）、`/problems/tag/[tag]` 全靠 D1（超限即 soft-404）。
- **是否建议立即修**：是，但只修"小且确定"的（见 §6）。数据回填（type/difficulty/tags 大规模重写）需你另行批准，不在本 pass 自动提交。

---

## 1. Executive summary

P0/P1 已闭环，本审计聚焦"数据质量 + SEO 路由健康债"。发现 1 个高优先级 P2（sitemap 覆盖崩塌，属回归）、2 个中优先级 P2（分类页断裂、缺字段导致薄/重复内容），以及若干 P2/P3 卫生项（SSR 随机内链 RC-9 未根治、title 近重复 URL 竞争、slug 启发式无限 URL 面）。

**关键数据（全量审计 `scripts/audit_problems_data.py`，3,137 题）：**

| 指标 | 结果 |
|---|---|
| 总数 | 3,137 |
| slug 唯一性 | 3,137 唯一，0 重复 ✅ |
| formula 空 | 0 ✅ |
| title 空 | 0 ✅ |
| description 缺失 | 25（0.8%） |
| type 有值 / 缺失 | 2,064 / **1,073（34%）** |
| type 值分布 | integral 1008 · limit 1041 · derivative 15 · **matrix 0 · ode 0** |
| difficulty 有值 / 缺失 | **0 / 3,137（100% 缺失）** |
| tags 有值 / 缺失 | **0 / 3,137（100% 缺失）** |
| limitTo 缺失 | 2,098（66%） |
| formula 重复组 | 67（多为 同函数+derivative/integral/limit 变体，非错误）|
| title 重复组 | 10（近重复 URL 竞争，见 P2-G）|
| slug/type 一致性 | 0 不一致 ✅ |
| wiki 死链 | 0 ✅ |
| sitemap 未覆盖题目 | **827**（复杂积分 slug 被生成器跳过）|

---

## 2. problems.json 数据质量（要求 1）

### 2.1 健康项
- **slug / formula / title 100% 完整且 slug 唯一** —— 无空值、无重复键。公式与 slug 一致（slug/type 一致性 0 例异常）。
- **wiki `relatedProblems` 死链 0** —— `data/wiki.json` 的 30 条相关引用全部命中真实题目 slug。
- **67 个 formula 重复组属正常**：同一函数（如 `x^2`）的 derivative/integral/limit 变体共用 formula 字符串，不是数据错误。

### 2.2 问题项
- **type 缺失 1,073（34%）**：仅 integral/limit 有显式类型，derivative 仅 15 条显式（其余靠 `filterByType` 把"无 type"当 derivative 兜底）。更关键：**problems.json 里完全没有 `matrix`/`ode` 类型行** —— 见 P2-B/C。
- **difficulty 100% 缺失**：`problems.json` 无 difficulty 字段 → `/practice/[level]` 无法按难度过滤。
- **tags 100% 缺失**：tags 仅存在于 D1 → `/problems/tag/[tag]` 完全 D1 依赖。
- **10 个 title 重复组（近重复 URL 竞争，P2-G）**：如 `Derivative of 1/x` 同时是 `derivative-of-1-x` 与 `derivative-of-1-over-x`；`Derivative of x^2` 是 3 个 slug。多个 URL 争同一主题，稀释 SEO 权重。
- **description 缺失 25 条（0.8%）**、**limitTo 缺失 2,098（66%，可选字段，影响有限）**。

---

## 3. 页面路由与 SEO（要求 2/3）

| 路由 | 实测 | 结论 |
|---|---|---|
| `/` | 200 | ✅ |
| `/problems` | 200 | ✅ |
| `/problems/derivative` | 200 | ✅ 含 1,088 题（15 显式 + 1,073 无 type 兜底）|
| `/problems/integral` | 200 | ✅ 1,008 题 |
| `/problems/limit` | 200 | ✅ 1,041 题 |
| `/problems/ode` | **200 但 0 题** | ⚠️ P2-B 空分类 |
| `/problems/matrix` | **404** | ⚠️ P2-C 不存在（validTypes 不含 matrix）|
| `/problems/tag/[tag]` | 200（D1 可用时 106 题；超限时 0→soft-404）| ⚠️ P2-E D1 依赖 |
| `/[slug]` 单题页 | 200（抽样 4/6，余节流 429）| ✅ canonical 正确 |
| `/directory` | 200 | ✅ D1 无关（static-first）|
| `/wiki` | 200（抽样节流）| ✅ |
| `/sitemap.xml` | **9 `<loc>`** | ❌ P2-A 覆盖崩塌 |
| `/robots.txt` | Allow `/`，Disallow `/api/`，含 Sitemap 指令 | ✅ |
| 不存在页 `/qqqzzz999`、`/not-a-real-page-xyz` | **404** | ✅ soft-404 未回归 |
| `/derivative-of-zzz`（slug 启发式）| **200** | ⚠️ P2-H 无限 URL 面 |

### 3.1 Sitemap 覆盖崩塌（P2-A，最高优先级）
- 实测 production `/sitemap.xml` 仅 **9 个 `<loc>`**（来自 `app/sitemap.ts` 的 9 个静态 URL）。
- 仓库内 `public/sitemap.xml` 实为 **9,483 个 `<loc>`**（由 `scripts/generate-sitemap.js` 在 `pages:build` 时生成，覆盖全部单题页 + 多语言）。
- **根因**：Next.js 中 `app/sitemap.ts` 路由与 `public/sitemap.xml` 静态文件都映射 `/sitemap.xml`，app 路由胜出并**阴影**了 9,483 条的静态文件。Google 实际抓到的 sitemap 只有 9 条 → 全部单题页无法经 sitemap 被发现。
- **附加缺口**：即便用 `public/sitemap.xml`，仍有 **827 个题目未进 sitemap**（复杂积分 slug 被生成器跳过；sitemap 较当前 `problems.json` 偏旧）。
- **修复（小且确定，已实施，见 §5）**：删除 `app/sitemap.ts`，让 `public/sitemap.xml`（9,483）生效；并建议后续跑 `npm run generate-sitemap` 补齐 827 缺口。

### 3.2 分类页正确性与一致性（P2-B/C）
- `app/problems/[type]/page.tsx` 的 `validTypes = ['derivative','integral','limit','ode']`。
- **`/problems/ode` 渲染 0 题**（problems.json 无 `ode` 类型行）→ 空分类页，低价值。
- **`/problems/matrix` 不在 validTypes → 404**，但 `/matrix` 是 sitemap 中的核心计算器页。分类体系与计算器页命名不一致，且 "Related Categories" 链接会指向可能 0 题/404 的项。
- 页面 H1/title/description 与搜索意图匹配（如 "Derivatives Problems - Calculus Library"），但空/缺分类破坏了体验。

### 3.3 canonical / noindex / robots
- 单题页 `generateMetadata` 正确输出 `<link rel="canonical" href="https://derivativecalculatorai.com/<slug>">`（实测 ✅），并支持 `NOINDEX_SLUGS` 与 `alternates.languages`。
- `/problems/tag/[tag]`、`/practice/[level]` **未设置 noindex** —— 薄/D1 依赖页可被索引，建议 noindex 或规范到 `/problems`。
- robots.txt 合理（允许全站、禁 `/api/`、含 Sitemap 指令）。

---

## 4. 内链（要求 4）

- **Related Problems（单题页）**：用 `pickStableRelated`（确定性、slug 字典序、库内零 D1）→ ✅ 稳定、相关、不触发 D1、无随机。
- **Footer.tsx（RC-9 未根治）**：`wikiTopics.sort(()=>0.5-Math.random())` + `problems.sort(...)` **逐请求（edge 运行时）随机打乱**，且**原地 `sort` 突变入参数组**（影响同请求内其他消费者）。SSR HTML 内链不稳定 → 爬取一致性受损。
- **wiki/[slug] "More Calculus Topics"**：同样 `.sort(()=>0.5-Math.random())` 逐请求随机 → 同上。
- **DynamicRecommendations / SmartRecommendations（client 组件）**：`'use client'`，SSR 不输出链接（初始 `recommendations.length===0` 返回 null），随机性仅在浏览器 hydration 后；对爬取无害，但 `DynamicRecommendations` 每 60s 从浏览器打 `/api/problems?limit=100`（现 static-first 不再碰 D1，但仍占 API 限流）。
- **死链**：wiki 相关引用 0 死链 ✅；tag 页 "Popular Tags" 硬编码 10 个 tag（trigonometric/polynomial/.../easy），D1 可用时 `easy` 返 106 题，其余取决于 D1 是否有该 tag。
- **低质量/空链接**：无空 `href`（均指向真实路由或真实 slug）。

---

## 5. API 与前端一致性（要求 5）

- `/api/problems`（P1-2 static-first）：无 `tag` 时只读 `problems.json`，**不碰 D1**（实测 200）。带 `tag` 时因 problems.json 无 tags → D1 fallback（D1 可用时正常、超限时 0→前端显示空）。
- `/api/problem/[slug]`（P1-2）：库内 slug 直接 static 答（200，非 D1_ERROR）；库外走 D1/API fallback。
- **D1 不可用时**：页面（/problems、/directory、单题库内 slug）仍正常渲染（D1 无关）；`/problems/tag/[tag]` 与 `/practice/[level]` 退化为空（soft-404 风险）；问题 API 带 tag 时退化为空。
- 前端渲染与 static 数据源一致（均经 `lib/problems-source.ts`）。

---

## 6. 发现分类与修复顺序

### P0（生产事故/错误答案）—— 无

### P1（配额/可靠性风险）—— 无新发

### P2（SEO / 数据质量 / UX）—— 建议本阶段修
- **P2-A（最高）Sitemap 覆盖崩塌**：删 `app/sitemap.ts`（已实施）→ 恢复 9,483 覆盖；后续 `npm run generate-sitemap` 补 827 缺口。**立即修。**
- **P2-B `/problems/ode` 空分类**：二选一 —— ①补 `ode` 类型题目到 problems.json；②把 `ode` 移出 `validTypes` 并对空分类 noindex/重定向。**建议②（小）。**
- **P2-C `/problems/matrix` 404 + 分类命名不一致**：`matrix` 是计算器页非题目类型，统一分类体系（Related Categories 不链 404/空项）。**小修。**
- **P2-D `/practice/[level]` 近重复薄内容**：①回填 difficulty 并按难度过滤；②或 noindex `/practice`。**建议②（快）或①（需数据回填）。**
- **P2-E `/problems/tag/[tag]` D1 依赖 + soft-404**：①回填 tags + static 化；②或 noindex/移除 tag 页。**建议②（快）或①（需数据回填）。**
- **P2-F SSR 随机内链（RC-9 根治）**：Footer.tsx 与 wiki "More Calculus Topics" 改用确定性选取（如 `pickStableRelated` 式 slug 字典序取前 N），并去掉原地 `sort` 突变。**小修，推荐。**
- **P2-G title 近重复 URL 竞争**：对 10 个重复组设 `canonical` 指向首选 slug，或 301 合并。**需数据决策，建议单独 pass。**
- **P2-H slug 启发式无限 URL 面**：非库/非 D1 的 slug 生成页（如 `/derivative-of-zzz`→200）建议 `noindex` 或对索引要求库成员资格。**小修（noindex）。**

### P3（清理）
- **P3-1** `/problems/[type]` 的 hover 类用了已注释掉的 `color`/`typeColors` 变量 → `hover:border-undefined-500` 等坏 Tailwind（no-op）。清理。
- **P3-2** `revalidate=3600` 在动态页是 no-op（保留无害）。
- **P3-3** D1 索引未进 CI（`ensure_d1_indexes.sql` 手动）。
- **P3-4** description 缺失 25 条（0.8%）——补即可。
- **P3-5** `app/sitemap.ts` 与 `public/sitemap.xml` 重复（并入 P2-A）。

---

## 7. 本次已实施的小修复

- **删除 `app/sitemap.ts`**（commit 待提交）：消除对 `public/sitemap.xml`（9,483 条）的阴影，恢复 sitemap 覆盖。验证：`next build` + `pages:build` 后 `.vercel/output/static/sitemap.xml` 仍为 9,483 `<loc>`，`/sitemap.xml` 路由不再由 app 生成。
- 其余 P2/P3 仅报告，未改代码/数据（数据回填需你批准）。

---

## 8. 验证证据（production，browser UA）

| 检查 | 结果 |
|---|---|
| `/`、`/problems`、`/problems/derivative`、`/directory` | 200 |
| `/problems/integral`、`/problems/limit` | 200 |
| `/problems/ode` | 200（0 题，空分类）|
| `/problems/matrix` | 404 |
| `/problems/tag/easy` | 200（D1 可用时 106 题；超限→0 soft-404）|
| 单题页（抽样） | 200，canonical 正确 |
| `/api/problems?limit=3&type=derivative` | 200（static，非 D1_ERROR）|
| `/api/problem/derivative-of-1-x` | 200（static 数据）|
| `/qqqzzz999`、`/not-a-real-page-xyz` | 404（soft-404 未回归）|
| `/derivative-of-zzz` | 200（slug 启发式生成页，P2-H）|
| `/sitemap.xml` | 9 `<loc>`（P2-A 覆盖崩塌，修复后应为 9,483）|

> 注：同 IP 高频抽样触发 middleware 页面限流（30/min）返 429，属验证噪声，非页面缺陷；关键路径均已用错峰/代码证据确认。

---

## 9. 交付物
- `P2_DATA_SEO_AUDIT_REPORT.md`（本报告）
- `scripts/audit_problems_data.py`（可复跑全量审计，输出 JSON 摘要 `scripts/audit_problems_data.json`）
- 小修复：删除 `app/sitemap.ts`（commit 另列）
