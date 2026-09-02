# Commands & Evidence

> 本文件记录所有审计用到的命令、证据来源和关键结论的支撑证据。区分 Fact / Inference / Unknown。

## 项目环境（Fact）

```
branch:     main
commit:     037caf4fa1e10fb99c5739dab51c2fd920074168
git status: 有未提交改动（.workbuddy/* 及若干 .md），审计未修改任何现有文件
Node:       v22.22.2
npm:        10.9.7
Next.js:    14.2.16
package mgr:package-lock.json (npm)
数据源:     public/problems.json (3137条), data/wiki.json (15条)
```

## 关键命令与证据

### 1. 页面 inventory
```bash
find app -type f -name "page.tsx" -o -name "page.ts" | sort
# → 17 个 page 文件，含 [slug]、[type]、[tag]、[level] 动态路由
```

### 2. 数据规模（Fact）
```bash
python3 -c "import json; d=json.load(open('public/problems.json')); print(len(d))"
# → 3137
grep -c "'" lib/noindex-slugs.ts
# → 787 个 noindex slug
```
可索引 derivative = 504（其中 trig 294 + inverse-trig 66 + log 39 + power 33 + exponential 30 + product 17 + quotient 9 + root 9 + basic 7）。

### 3. 数学引擎 bug（Fact）
```bash
node -e "const n=require('nerdamer'); require('nerdamer/Calculus'); console.log(n('diff(ln(x),x)').toString())"
# → "ln"  （错误，应为 1/x）
node -e "... diff(log(x),x) ..."
# → "x^(-1)"  （nerdamer 将 log 当自然对数）
```
- `ln(x)` 被 nerdamer 解析为 `ln*x`（未知符号），导数返回 `ln`。
- 影响 44 个可索引 ln 类页面 + 39 个 log 语义不一致页面。

### 4. SSR 主体空洞（Fact）
```bash
curl -s -H "User-Agent: Googlebot/2.1" "https://derivativecalculatorai.com/derivative-of-x-squared?_cb=..."
# main 内可见文字仅 ~247 词，全为模板文案
# 无 "2*x"（答案）、无 "Step 1"、无 MathDisplay 渲染
```
`components/Calculator.tsx` 是 `'use client'`，答案在 `useEffect` 里 fetch `/api/derivative` 后客户端渲染。

### 5. 软 404 + 缓存失败（Fact）
```bash
curl -sI "https://derivativecalculatorai.com/this-slug-does-not-exist-xyz"
# → HTTP/2 200（应为 404）
curl -sI "https://derivativecalculatorai.com/derivative-of-log-x"
# → cf-cache-status: HIT, cache-control: public, max-age=14400
```
`[slug]/page.tsx` 的 catch 块返回兜底 UI（"Unable to load calculation"），HTTP 状态仍为 200。

### 6. problems 页空（Fact）
```bash
curl -s ".../problems?_cb=..." | grep -c 'href="/derivative-of-'
# → 0（分类数字全 0）
curl -s ".../directory?_cb=..." | grep -oE 'href="/derivative-of-[a-z0-9-]+"' | sort -u | wc -l
# → 1084
```
`/problems` 依赖 D1 API（limit≤100），SSR 空；`/directory` 用 problems.json fallback，正常。

## 独立验证方式说明

- 数学验证：使用项目现有依赖 `nerdamer` + Calculus 插件（未安装新依赖）。
- 未安装 sympy（避免新增生产依赖）；对发现疑似错误的 ln/log 页面，通过已知导数表人工核验：`d/dx ln(x) = 1/x`，nerdamer 输出 `ln` 明确错误。
- 生产验证：curl + Googlebot UA，未使用无头浏览器（避免高频轰炸）。

## Unknown 项

1. 生产 D1 `problems` 表实际行数与本地 problems.json 是否一致（需 wrangler CLI）。
2. 生产部署版本与本地 commit 是否一致（无部署日志）。
3. `/practice/[level]` 页面内容质量。
4. 44 个 ln 类页面中，有多少在**生产实际渲染时**确实输出了错误答案（本地引擎验证确定错误，但生产是否走同一 nerdamer 路径需进一步确认 API 部署状态）。
