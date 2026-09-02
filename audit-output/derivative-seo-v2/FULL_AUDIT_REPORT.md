# FULL AUDIT REPORT — DerivativeCalculatorAI.com SEO Phase 0

> 审计日期：2026-08-20 | 只读审计，未修改任何代码/配置/数据/sitemap

---

## 1. 审计范围与限制

**范围**：全站 URL inventory、504 个 Derivative 页面完整识别、100 页分层质量抽查、数学正确性审查、重复内容检测、内链分析、生产环境抽查、sitemap 资格判断。

**限制**：
- 无 GSC 接入（无法获取真实关键词/展现数据）。
- 无法直接查询生产 D1 数据库（需 wrangler CLI + 凭据）。
- 未使用无头浏览器（避免高频轰炸生产环境）。
- 数学验证使用项目现有 nerdamer 引擎 + 已知导数表人工核验，未安装 sympy。

## 2. 项目环境

| 项 | 值 |
|----|-----|
| branch | main |
| commit | 037caf4fa1e10fb99c5739dab51c2fd920074168 |
| Node | v22.22.2 |
| Next.js | 14.2.16 |
| package manager | npm（package-lock.json） |
| 数据源 | public/problems.json（3137条）、data/wiki.json（15条） |

生产版本与本地 commit 是否一致：**Unknown**（无部署日志可交叉验证）。

## 3. 全量 URL 结构

详见 `full-url-inventory.csv`（3168 行）和 `url-inventory-summary.md`。

核心数字：
- 静态页 12 个、题目页 3137 个（可索引 2350）、wiki 15 个、分类页 4 个。
- 可索引题目类型分布：integral 941、limit 905、derivative 504。
- sitemap.xml 仅 9 个 URL，覆盖率 0.38%。

## 4. Derivative 分类

详见 `derivative-category-summary.md`。

504 个可索引 derivative 页面分布：
- Trigonometric 294、Inverse-trig 66、Log 39、Power 33、Exponential 30、Product 17、Quotient 9、Root 9、Basic 7。
- Higher-order / Partial / Implicit / Piecewise-abs：**全部为 0**。

## 5. 100 页抽查方法

- 分层抽样：trig 20、inverse-trig 10、exponential 10、log 10、product 10、quotient 8、power 5、root 5、basic 7，其余随机补齐。
- 随机种子：mulberry32(42)，可复现。
- 每页独立记录 slug/formula/类型/导数结果/数学正确性/评分。

## 6. 评分结果

| 状态 | 数量 |
|------|-----:|
| GREEN | 0 |
| YELLOW | 0 |
| RED | 100 |

**评分模型**（满分 100）：数学正确性 30、步骤解释 20、唯一性 15、搜索意图 10、内链 10、UX/SSR 10、metadata 5。

**自动失败条件触发**：100/100 页触发"SSR 主体为模板文案，真实答案需客户端 JS 渲染"（对应审计规则"页面需要用户操作后才出现唯一主体内容"）。12 页额外触发"数学答案错误"。

详见 `derivative-100-page-audit.csv`。

## 7. 数学错误

**发现 1（确定性 bug）**：nerdamer 引擎对 `ln(x)` 求导返回 `ln`（错误），而非 `1/x`。根因：nerdamer 将 `ln` 解析为未知符号 `ln*x`，求导时当作常数处理。影响 44 个可索引页面（含 `ln(x)`、`ln(2*x)`、`x*ln(x)` 等复合式）。

**发现 2（语义不一致）**：`log(x)` 在 nerdamer 中被当作自然对数（返回 `1/x`），但 `derivative-of-log-x` 页面 description 标注 "base 10"。即：页面承诺的是"以10为底的对数导数"，但引擎算的是自然对数导数。39 个 log 类页面存在此语义偏差。

**独立验证**：`d/dx ln(x) = 1/x` 是标准导数表结论，nerdamer 输出 `ln` 明确错误，无需进一步人工审查即可判定。

## 8. 重复内容

详见 `duplicate-content-clusters.csv`。

- formula 完全重复：0 组（504 页公式各不相同）。
- **description 模板化**：148 个模板覆盖 504 页，最多一个模板（"Calculate the derivative of \<FUNC\> using the Chain Rule"）重复 128 页。
- **SSR 主体模板**：所有页面主体文案相同（howTo 固定模板 + 答案靠客户端 JS）。
- **title 重复拼接**：layout template 与页面 title 冲突，产生双重后缀。

**特别判断**：页面差异主要是"替换了公式字符串"，正文和解题过程完全相同。这属于"只替换表达式"的高风险程序化内容，而非"搜索意图和解题过程不同"的独立价值页面。

## 9. 内链

详见 `internal-link-audit.csv`。

| 指标 | 值 |
|------|-----|
| derivative 页面总数 | 504 |
| 至少1个内部入链 | 504（directory 页全覆盖） |
| 孤岛页 | 0 |
| 点击深度 1-2 | 504（首页→directory→slug） |
| 点击深度 3 | 部分（problems→type→slug 链路断） |
| 无法从首页到达 | 0 |

关键问题：
- `/directory` 页 SSR 正常（1084 个 derivative 链接，用 problems.json fallback）。
- `/problems` 和 `/problems/[type]` 页 SSR 为空（依赖 D1 API，limit≤100，且 SSR 阶段分类数字全 0）。
- Related problems 是 `ORDER BY RANDOM()` 随机生成，非语义相关（`[slug]/page.tsx` 内 D1 用 `ORDER BY RANDOM() LIMIT 10`，静态 fallback 用 `sort(() => 0.5 - Math.random())`）。

## 10. Sitemap 资格

详见 `sitemap-eligibility.csv`。

| 状态 | 数量 |
|------|-----:|
| 当前可安全进入 sitemap | **0** |
| 修复后可进入 | 460（非 ln 类，需先修 SSR 空洞） |
| 应保持 noindex | 787（现有垃圾 slug） |
| 需数学人工审核 | 44（ln bug） |
| 重复或应合并 | 0（但 description 高度模板化） |

**建议**：
- 首批提交：**0 页**。
- 不建议一次释放 100-200 页。
- 绝对不应释放全部 504 页。
- 第二批释放条件：先完成 SSR 预渲染真实答案 + 修 ln 数学 bug + 修软 404，再重新审计评分。

## 11. 生产环境验证

详见 `production-sample-check.md`。

三个决定性发现：
1. 软 404 + 缓存失败（不存在的 slug 返回 200，失败结果被 CDN 缓存 4 小时）。
2. SSR 主体空洞（答案靠客户端 JS）。
3. problems 页 SSR 为空。

## 12. 根因分析

| 根因 | 层级 | 说明 |
|------|------|------|
| RC-1：计算器是客户端组件 | 架构 | `Calculator.tsx` 为 `'use client'`，答案在 useEffect fetch 后渲染，SSR 无答案 |
| RC-2：`[slug]` catch 块返回 200 | 代码 | 渲染异常被 catch 吞掉，返回兜底 UI 而非 404/500 |
| RC-3：CDN 缓存错误响应 | 部署 | 失败结果 `cf-cache-status: HIT` 缓存 4 小时 |
| RC-4：nerdamer 对 ln 的解析缺陷 | 依赖 | `ln(x)` 被当作 `ln*x` |
| RC-5：sitemap 硬编码 9 URL | 代码 | 未接入动态路由 |
| RC-6：problems.json 缺 type 字段 | 数据 | 导致 derivative 归类靠默认逻辑 |

**最大根因判断**：既是**发现（可发现性）问题**（sitemap 0.38%、problems 页空），也是**质量（页面质量）问题**（SSR 空洞、数学 bug）。两者同时存在，但**质量问题是前提**——不修质量，扩大发现只会放大低质量风险。

## 13. 优先级建议

1. **P0** 修软 404（`[slug]` catch 返回 404）
2. **P0** 修 ln/log 数学 bug
3. **P0** 修 title 模板重复
4. **P1** SSR 预渲染真实答案（NO-GO → CONDITIONAL GO 的关键）
5. **P2** 补高阶/偏导/隐函数功能

## 14. 最终决策

**NO-GO**（条件升级后转 CONDITIONAL GO）。

**回答七个关键问题**：

1. **504 页是资产还是库存？** 库存（有 bug 的空壳页）。
2. **预计多少页现在可索引？** 0。
3. **最大根因？** 质量与发现同时存在，质量是前提。
4. **先修什么？** 先修页面模板（SSR 预渲染答案）+ 数学引擎，再修 sitemap。
5. **是否该开发新 100 页？** 否，先升级现有 504 页。
6. **是否先升级现有 504 页？** 是。
7. **继续投入的客观建议？** 值得继续投入，但路径是"先修根因、再扩 sitemap、后补功能"，而非直接扩 sitemap。
