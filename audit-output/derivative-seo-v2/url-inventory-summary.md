# 全量 URL Inventory 汇总

> 数据源交叉验证：App Router 路由 + `public/problems.json` + `data/wiki.json` + `app/sitemap.ts` + `lib/noindex-slugs.ts`

## 精确数量统计

| 类别 | 数量 | 说明 |
|------|-----:|------|
| 静态页面 | 12 | /, /integral, /limit, /ode, /matrix, /calculators, /problems, /directory, /wiki, /about, /contact, /privacy |
| 题目页（problems.json） | 3137 | 全部由 `/[slug]` 动态路由渲染 |
| ├─ 可索引题目页 | 2350 | 排除 noindex 后 |
| ├─ noindex 垃圾 slug | 787 | 已在 `lib/noindex-slugs.ts` 中 |
| Wiki 词条 | 15 | `/wiki/[slug]` |
| problems/[type] 分类页 | 4 | derivative/integral/limit/ode |
| practice/[level] | 若干 | 动态 |
| **全量 URL 总数** | **~3168** | 详见 full-url-inventory.csv |

## 可索引题目页类型分布

| 类型 | 可索引数量 |
|------|-----------:|
| integral | 941 |
| limit | 905 |
| derivative（含无 type 默认归入） | 504 |
| 其中 derivative 显式标记 | 仅 5 |

## Sitemap 覆盖情况

| 项 | 值 |
|----|-----|
| sitemap.xml 实际 URL 数 | **9** |
| 可索引内容总量 | ~2375 |
| sitemap 覆盖率 | **0.38%** |

`sitemap.ts` 只硬编码 9 个静态 URL，题目页、wiki 词条、分类页全部缺失。

## 关键差异说明（与之前审计基线）

此前审计报告称"derivative 可索引 504 个（显式标记仅 5）"。经本轮源码深挖确认：

- **Fact**：`problems.json` 中 `type` 字段大量为 `null`（缺失），这些页面被 `problems/[type]` 页面的逻辑 `!p.type || p.type === 'derivative'` 默认归为 derivative。
- **Fact**：504 个 derivative 页面中，slug 前缀 `derivative-of-` 的占 501 个，其余 3 个为其他前缀。
- **结论**：504 这个数字准确，但"显式标记仅 5"的表述有误导性——实际是数据文件本身缺少 type 字段，而非"只有 5 个真 derivative"。
