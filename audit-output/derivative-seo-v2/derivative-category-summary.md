# Derivative 页面分类汇总

> 数据源：`public/problems.json`（3137 条）经 `lib/noindex-slugs.ts` 过滤后，可索引 derivative 页面共 **504 个**。

## 分类统计

| 分类 | 数量 | 占比 | 代表 URL | 是否有独立步骤逻辑 | 数学/模板风险 |
|------|-----:|-----:|----------|------------------|--------------|
| Trigonometric | 294 | 58.3% | `/derivative-of-sin-x` | ❌ 无 | 低 |
| Inverse trigonometric | 66 | 13.1% | `/derivative-of-arcsin-x` | ❌ 无 | 低 |
| Logarithmic | 39 | 7.7% | `/derivative-of-log-x` | ❌ 无 | 🔴 高（见下） |
| Power | 33 | 6.5% | `/derivative-of-x-squared` | ❌ 无 | 低 |
| Exponential | 30 | 6.0% | `/derivative-of-e-to-the-2x` | ❌ 无 | 低 |
| Product rule | 17 | 3.4% | `/derivative-of-x-times-sin-x` | ❌ 无 | 中 |
| Rational/quotient | 9 | 1.8% | `/derivative-of-1-over-x` | ❌ 无 | 中 |
| Root/radical | 9 | 1.8% | `/derivative-of-sqrt-x` | ❌ 无 | 低 |
| Basic polynomial | 7 | 1.4% | `/derivative-of-x-cubed` | ❌ 无 | 低 |
| **Higher-order derivative** | **0** | 0% | — | — | 缺失 |
| **Partial derivative** | **0** | 0% | — | — | 缺失 |
| **Implicit differentiation** | **0** | 0% | — | — | 缺失 |
| **Piecewise/abs/domain edge** | **0** | 0% | — | — | 缺失 |
| **合计** | **504** | 100% | | | |

## 关键结论

1. **所有 504 个页面均无独立步骤逻辑**：页面 SSR 只渲染固定模板文案（`To find the derivative of X, we use standard differentiation rules...`），真实步骤和答案完全依赖客户端 JS 调用 `/api/derivative` 后动态生成。Googlebot 抓不到任何真实解题内容。

2. **高意图功能全部缺失**：higher-order、partial、implicit、piecewise/abs 四类页面数量为 **0**。这正是竞品（derivative-calculator.net、Symbolab）占领长尾词的核心武器。

3. **🔴 Logarithmic 类存在确定性数学 bug**：
   - nerdamer 引擎把 `ln(x)` 当作未知符号（`ln*x`），导致 `diff(ln(x), x)` 返回 `ln`（应为 `1/x`）。
   - 39 个 log 类页面中，用 `ln(...)` 语法的约 **44 个可索引页面**（含部分归入其他类的复合式）导数计算结果错误。
   - `log(x)` 在 nerdamer 中被当作自然对数（返回 `1/x`），但页面文案标注 "base 10"，语义不一致。

4. **分类单一化**：trig + inverse-trig 占 71.4%，而链式法则、商法则、隐函数等高频搜索意图几乎无覆盖。
