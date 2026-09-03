# P2 数据回填方案评估（仅审计 + 批量修复策略，不自动改 3000+ 条数据）

> 阶段定位：P0/P1 CLOSED，P2-H / P2-B / P2-D/E CLOSED，sitemap 9,483 保持正常。
> 本文件只做**评估与批量修复策略设计**，不执行任何 `problems.json` 数据写入。
> 执行需在后续单独 Prompt 中批准，并按"每批单独提交 + 验证"推进。

---

## 0. 一句话结论

`difficulty` / `tags` / `type` 三项缺失**可以 100% 确定性回填，且全部在本地完成、不碰 D1、不耗配额**。
根因不是"数据没有"，而是** D1 里那套回填逻辑（`scripts/update_tags.sql` + `update_all_tags.sql`）是确定性前缀规则，从未同步进 `public/problems.json`**。把它原样移植到本地 JSON 即可。
"827 个复杂积分 slug 没进 sitemap" 是**审计脚本假阳性**，真实情况是所有 3,137 题都已在 sitemap（各 3 locale）；该项应重构为"页质量评估"（结论：质量合格，保持索引）。

---

## 1. 现状（基于真实数据，非推测）

来源：`scripts/audit_problems_data.json` + 直接读 `public/problems.json` / `data/problems.json`（两文件 md5 相同，3,137 条，非分裂）。

| 字段 | 有值 / 总数 | 备注 |
|---|---|---|
| `slug` | 3,137 / 3,137 | 唯一，0 重复 |
| `formula` | 3,137 / 3,137 | 0 缺失 |
| `title` | 3,137 / 3,137 | 0 缺失 |
| `description` | 3,112 / 3,137 | 缺 25 |
| `type` | 2,064 / 3,137 | **缺 1,073**（全部是 `derivative-of-*` slug，anomaly 样本证实） |
| `difficulty` | 0 / 3,137 | **100% 缺失**，仅 D1 有 |
| `tags` | 0 / 3,137 | **100% 缺失**，仅 D1 有 |
| `limitTo` | 1,039 / 3,137 | 缺 2,098（limit 题专用，非本次重点） |

### 1.1 "827 缺口"是假阳性（重要纠正）
- 审计脚本 `sitemap_coverage` 把 slug 含 `+` 的复杂积分（如 `integral-of--1-over-1+x2`）判为"不在 sitemap"。
- **实证**：在当前 `public/sitemap.xml`（9,483 `<loc>`）里 grep 这些 slug，每个都有 **3 个 `<loc>`**（en/es/pt）。即 3,137 题**全部已在 sitemap**。
- 根因：审计正则未处理 slug 中的 `+` / 特殊字符 → 误报 827。
- **重构为页质量评估**：这些复杂积分页都有 `formula` + `title` + `description`（仅 25 条 description 缺失，且不在这些 slug 中），属正常题目页，**质量合格，保持索引**。无需为"数量"加任何东西。
- 附带：`sitemap_slugs_not_in_problems: 10` 提示 sitemap 比 problems.json 多 10 个 slug —— 这些是 stale/orphan 入口（如旧 `matrix`/`ode` 相关），应单独核查（见 §5 备注），不影响本次回填。

### 1.2 title 近重复是真重复（P2-G）
审计发现 10 个 `title` 重复组。抽验确认**公式完全相同**：
- `derivative-of-x-squared` / `derivative-of-x-minus-to-minus-the-minus-2` / `derivative-of-x2` → 均 `x^2`、"Derivative of x^2"
- `derivative-of-e-to-the-x` / `derivative-of-e-x` → 均 `e^x`
→ 是真实重复内容，需要 canonical / 合并处理（§4）。

---

## 2. 关键发现：D1 回填逻辑可原样移植到本地 JSON

`scripts/add_tags_column.sql` 给 D1 `problems` 表加了 `tags TEXT` / `difficulty TEXT DEFAULT 'medium'` / `views`。
`scripts/update_all_tags.sql` + `scripts/update_tags.sql` 用**确定性前缀规则**回填，例如：
```sql
UPDATE problems SET tags='derivative,trigonometric', difficulty='intermediate' WHERE slug LIKE 'derivative-of-sin%';
UPDATE problems SET tags='derivative,polynomial',   difficulty='beginner'    WHERE slug LIKE 'derivative-of-x%';
UPDATE problems SET tags='integral,trigonometric',  difficulty='intermediate' WHERE slug LIKE 'integral-of-sin%';
```
- `tags` 是逗号分隔字符串（如 `derivative,trigonometric`）。
- `difficulty` 取值 `beginner / intermediate / advanced` —— **正好对应 `/practice/[level]` 三档**（这正是 /practice 现在三档同内容、被迫 noindex 的根因：缺 difficulty 无法分流）。

**同一套 `slug LIKE` 前缀规则可直接对本地 `public/problems.json` 跑**（Node/Python 一次性变换），无需查询 D1、零配额风险、零 hot-path 影响。这就是回填的"主引擎"。

---

## 3. 三条路线对比

| 路线 | 做法 | 覆盖 | 风险 | 结论 |
|---|---|---|---|---|
| **A. type 确定性派生** | `slug.startsWith('derivative-of-')` → `type='derivative'`；其余沿用已有值 | 100%（1,073 全补） | 零（纯本地、幂等） | **立即做，最小批** |
| **B. tags+difficulty 两层本地回填** | L1 移植 D1 前缀规则；L2 公式 token 派生补全残留 | 99.9%（见下） | 低（本地_transform，脚本可审计） | **主推** |
| **C. D1 导出合并** | 一次性 `SELECT slug,tags,difficulty` 导出 D1 合并进 JSON | 取决于 D1 实际填充率 | 中（一次性 ~3k 行读，免费 5M/日内可接受；但多一层外部依赖 + D1 数据本身也来自路线 B 的同款规则） | 不推荐（B 已自给，且 B 不依赖外源） |

### 路线 B 两层设计（已量化验证可行性）
- **Layer 1（移植现有 D1 规则）**：对 `public/problems.json` 应用 `update_all_tags.sql` + `update_tags.sql` 的前缀/逐 slug 规则。
  - 实测覆盖 **1,262 / 3,137（40.2%）**，且这部分 `tags`/`difficulty` 是**人工精标值**（质量最高）。
- **Layer 2（公式 token 派生，补全残留）**：对 L1 后仍缺 `tags` 的 1,875 条，扫 `formula` 字符串打函数标签：
  - `sin/cos/tan/...` → `trigonometric`；`ln/log` → `logarithmic`；`e^/2^/...` → `exponential`；`sqrt/cbrt/x^(` → `radical`；含 `/` → `fraction`；含 `x` → `polynomial`。
  - `difficulty` 启发式：项数 ≥3 或嵌套 ≥3 → `advanced`；项数=2 或嵌套≥1 → `intermediate`；否则 `beginner`。
  - 实测 L2 覆盖 **1,873 / 1,875**；仅 2 个常量 slug（`derivative-of-pi`、`derivative-of-constant`）需硬编码 `tags='constant'`。
  - **合计 L1+L2 = 3,135 / 3,137（99.9%）确定性覆盖，0 条遗漏需人工。**
- **difficulty 质量提示**：L2 token 启发式分布偏 `intermediate/advanced`（实测 beginner 40 / intermediate 1495 / advanced 1602），不如 L1 精标准确。策略：L1 命中用精标值，L2 仅兜底 → 兼顾准确与覆盖。

### 路线 B 要让 tags 真正"生效"还需（执行阶段，非数据回填本身）
- `lib/problems-source.ts` 的 `Problem` 类型已有 `difficulty?: string`，但**无 `tags` 字段**；D1 fallback 查询（`app/[slug]/page.tsx:258`）只 `SELECT ... difficulty` 不含 `tags`。
- 回填后需配套小改：① 类型加 `tags?`；② 渲染层展示 tags 徽章；③ `/problems/tag/[tag]` 改读静态 JSON（去 D1 依赖，现因 D1 超限 soft-404 才被 noindex）—— 此时可考虑解除 P2-E noindex。
- `/practice/[level]` 改按 `difficulty` 过滤（现三档同内容）→ 分流后解除 P2-D noindex。
- 这些是小代码改动，与数据回填解耦，可分批独立验证。

---

## 4. P2-G title 近重复：canonical 策略

- 10 个组均为**真重复**（同 formula）。
- **推荐：canonical 而非 301**。
  - 每组选最干净/最短 slug 为主（如 `derivative-of-x-squared`、`derivative-of-e-to-the-x`）。
  - 其余加 `<link rel="canonical" href="/主slug">`，页面保持可访问（保留任何既有直达链接，避免 301 误伤 inbound）。
  - 那些丑陋的自动生成 slug（如 `derivative-of-x-minus-to-minus-the-minus-2`）虽可 301，但 canonical 更稳，先 canonical；若后续确认无外链再考虑 301。
- 批量做法：脚本按重复组（从审计 `duplicate_title_groups` 取）给非主 slug 加 canonical 元数据，**不改标题、不改内容、不动 slug**。
- 另：P2-H 已把"仅 heuristic 解析"的 slug noindex；这些重复 slug 都在题库内（真实 library 条目），**不在 P2-H 范围内**，仍可索引，只是需 canonical 收敛权重。

---

## 5. 推荐批处理顺序（每批单独提交 + 验证；不一次改 3000+）

| 批 | 内容 | 规模 | 风险 | 验收门 |
|---|---|---|---|---|
| **批 1** | type 确定性派生（`derivative-of-*`→`derivative`） | ~1,073 条（脚本改） | 零 | audit 显示 type 缺失→0；slug 唯一性不变；test/build/pages:build 过 |
| **批 2** | tags+difficulty Layer 1（移植 D1 前缀/逐 slug 规则） | ~1,262 条 | 低 | audit 显示这部分 tags/difficulty 填充；difficulty 取值 ∈ {beginner,intermediate,advanced} |
| **批 3** | Layer 2 token 派生补全 + 2 常量硬编码 | ~1,875 条 | 低 | audit 显示 tags 缺失→≤2、difficulty 缺失→0；全量 99.9% 覆盖 |
| **批 4** | 代码配套：`tags?` 类型 + 渲染 + `/problems/tag` 改静态 | 代码 | 低 | 静态页展示 tags；/tag 不再依赖 D1；评估后解除 P2-E noindex |
| **批 5** | P2-G canonical 元数据（10 组） | ~20-30 条 | 低 | 生产 cache-buster：非主 slug 含 canonical；主 slug 自引用 |
| **批 6（可选）** | `/practice/[level]` 按 difficulty 分流 + 解除 P2-D noindex | 代码 | 中 | 三档内容真正不同；生产 /practice/beginner?cb 仍 200 且内容差异 |

> 边界（严格遵守用户指令）：**不自动改 3000+ 条**；每批单独 commit；不碰 P0/P1、不恢复 Cloudflare 原生 Git 部署、不动 D1 hot path、不引入 `Math.random`、不提交 `sitemap.xml` lastmod 噪音。

### 顺带建议（非阻塞，另立小项）
- **修审计脚本假阳性**：`audit_problems_data.py` 的 `sitemap_coverage` 正则需处理 slug 中的 `+` / locale 前缀，避免再误报 827。属测量纪律修复，不影响数据。
- **核查 10 个 sitemap orphan slug**：`sitemap_slugs_not_in_problems` 指向 sitemap 比题库多的 10 个入口，可能是旧 `matrix`/`ode` 残留，应确认是否该从 sitemap 移除（与 P2-B 同源）。

---

## 6. 通用验收门（每批通用）

1. `python3 scripts/audit_problems_data.py` → 目标字段缺失数下降、slug 唯一性仍 0、无新增异常。
2. `npm test` 165/165（含 RC-8 源码扫描守卫）。
3. `npm run build` + `npm run pages:build` 通过；`public/sitemap.xml` 还原（不提交 lastmod 噪音）；bundled sitemap 仍 9,483 `<loc>`。
4. 生产 cache-buster 抽样：相关页 200、noindex/canonical 符合预期、sitemap 未回退。

---

## 7. 待用户批准的决策点

1. 是否按批 1→6 顺序推进（还是只做批 1-3 数据回填、代码配套暂缓）？
2. 路线 B 的 L2 token 派生标签质量是否可接受（函数名粗粒度），还是要求更细 taxonomy？
3. P2-G 用 canonical（推荐）还是 301？
4. 批 4/批 6 解除 noindex 的时机（建议数据回填 + 内容差异化后再解）。
