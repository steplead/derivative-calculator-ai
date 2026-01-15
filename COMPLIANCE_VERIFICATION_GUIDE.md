# 🔍 100% 合规验证完整指南

> **目标**: 验证 Plan E 是否成功将请求数降至 90,000/day 以下
> **更新**: 2025-01-15

---

## 📊 **验证指标层级**

### **一级指标** ⭐️ **最关键**
决定性指标，直接判断是否合规

### **二级指标** ⚠️ **重要**
辅助指标，帮助诊断问题

### **三级指标** 📈 **参考**
趋势指标，帮助优化性能

---

## 🥇 **一级验证指标**

### **1. Cloudflare Dashboard - 总请求数** ⭐️⭐️⭐️

#### **查看步骤**:
```
1. 访问 https://dash.cloudflare.com
2. 点击 Workers & Pages
3. 选择 derivative-calculator-ai
4. 查看 "Requests today" 或 Analytics
```

#### **关键数字**:
| 时间范围 | 阈值 | 判断 |
|---------|------|------|
| **当前小时** | < 3,750 | ✅ 合规 |
| **当前日** | < 90,000 | ✅ 合规 |
| **24小时滚动** | < 90,000 | ✅ 合规 |

#### **对比基准**:
```
之前: 278,243 requests / 18h = 307,584/day (207.6% over)
目标: < 90,000 requests/day (90% of quota)
```

---

### **2. D1 数据库 - 全局配额计数器** ⭐️⭐️⭐️

#### **查看当前小时计数**:
```bash
npx wrangler d1 execute problems-db --command="
SELECT
  key,
  value,
  datetime(last_updated, 'unixepoch', 'localtime') as updated_at,
  (strftime('%s', 'now') - last_updated) as seconds_ago
FROM counters
WHERE key LIKE 'global:hour:%'
ORDER BY last_updated DESC
LIMIT 5
"
```

#### **查看当前日计数**:
```bash
npx wrangler d1 execute problems-db --command="
SELECT
  key,
  value,
  datetime(last_updated, 'unixepoch', 'localtime') as updated_at,
  (strftime('%s', 'now') - last_updated) as seconds_ago
FROM counters
WHERE key LIKE 'global:day:%'
ORDER BY last_updated DESC
LIMIT 3
"
```

#### **判断标准**:
- ✅ 看到 `global:hour:xxxx` 条目，value < 3,750
- ✅ 看到 `global:day:xxxx` 条目，value < 90,000
- ✅ `seconds_ago` 数值小（计数器在更新）
- ❌ 无条目 = 全局配额未工作
- ❌ value ≥ 90,000 = 已达配额上限

---

### **3. Workers 实时日志** ⭐️⭐️⭐️

#### **启动实时日志流**:
```bash
npx wrangler tail --format pretty
```

#### **关键日志模式**:

**✅ 成功标志**:
```
[GLOBAL_QUOTA] Hourly limit exceeded: 3800/3750
→ 全局配额正在工作并阻止请求

[GLOBAL_QUOTA_BLOCKED] IP: xxx.xxx.xxx.xxx | Reason: Daily quota exceeded
→ 达到日限额，请求被正确阻止

[SECURITY_CHECK] IP: xxx | Endpoint: /api/derivative | Rate Limit: 3
→ 新的 rate limit 配置生效
```

**❌ 失败标志**:
```
[SECURITY_ERROR] D1 database not available
→ 数据库连接失败，全局配额无法工作

FAIL OPEN - allow request
→ 数据库失败时的降级处理，配额限制失效
```

#### **日志统计**:
```bash
# 运行 10 分钟，收集日志
npx wrangler tail --format pretty > worker_logs.txt &
PID=$!
sleep 600
kill $PID

# 统计关键事件
echo "全局配额拒绝次数:"
grep -c "GLOBAL_QUOTA_BLOCKED" worker_logs.txt || echo "0"

echo "Rate limiting 拒绝次数:"
grep -i "rate limit" worker_logs.txt | grep -c "exceeded" || echo "0"

echo "成功请求数:"
grep -c "200 OK" worker_logs.txt || echo "0"
```

---

## 🥈 **二级验证指标**

### **4. HTTP 状态码分布** ⭐️⭐️

#### **Cloudflare Dashboard 查看**:
```
Workers & Pages → Analytics → Status Codes
```

#### **预期分布** (Plan E 生效后):
| 状态码 | 含义 | 预期比例 |
|--------|------|---------|
| **200** | 成功 | 40-60% |
| **429** | Rate limited | 20-40% ⬆️ **应该增加** |
| **403** | Bot blocked | 10-30% ⬆️ **应该增加** |
| **500** | Server error | < 1% |

#### **判断标准**:
- ✅ 429/403 占比显著增加 = 限制措施工作
- ✅ 总请求数显著下降 = 配额控制有效
- ❌ 429/403 无变化，总请求数仍高 = 措施未生效

---

### **5. API 响应时间** ⭐️⭐️

#### **测试命令**:
```bash
# 单次测试
time curl -s -A "Mozilla/5.0" \
  "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" \
  -o /dev/null

# 批量测试（取中位数）
for i in {1..10}; do
  curl -s -o /dev/null -w "%{time_total}\n" \
    -A "Mozilla/5.0" \
    "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false"
  sleep 1
done | sort -n | awk '{a[NR]=$0} END{print a[int(NR/2)]}'
```

#### **判断标准**:
| 指标 | 之前 | Plan E 预期 | 判断 |
|------|------|-------------|------|
| **中位数响应时间** | ~1.06s | < 0.5s | ✅ 改善 |
| **P95 响应时间** | ~2.0s | < 1.0s | ✅ 改善 |
| **超时率** | < 1% | < 0.5% | ✅ 改善 |

---

### **6. Rate Limiting 实际测试** ⭐️⭐️

#### **浏览器测试** (最真实):
```javascript
// 打开 https://derivativecalculatorai.com
// 打开浏览器控制台 (F12)
// 切换到 Network 标签

// 快速刷新页面 5-6 次 (Ctrl+Shift+R 强制刷新)
// 观察请求状态码

// 预期结果:
// - 前 3-4 次: 200 OK
// - 第 5-6 次: 429 Rate Limited
```

#### **命令行测试**:
```bash
bash scripts/verify_plan_e.sh
```

#### **判断标准**:
- ✅ 快速连续请求出现 429 = Rate limiting 工作中
- ✅ 等待 1 分钟后恢复 = Window 正确重置
- ❌ 无 429 出现 = Rate limiting 可能未生效

---

### **7. AI 功能禁用验证** ⭐️⭐️

#### **代码检查**:
```bash
grep -n "includeAi" app/api/*/route.ts | grep -v "//"
```

**预期结果**:
```
app/api/derivative/route.ts:13:    const includeAi = false;
app/api/integral/route.ts:13:     const includeAi = false;
app/api/limit/route.ts:14:        const includeAi = false;
app/api/ode/route.ts:14:           const includeAi = false;
```

#### **API 响应检查**:
```bash
curl -s -A "Mozilla/5.0" \
  "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=true" \
  | python3 -m json.tool | grep -A 2 "ai_explanation"
```

**预期结果**:
```json
"ai_explanation": null
```

#### **判断标准**:
- ✅ 所有 API routes 的 `includeAi = false`
- ✅ API 响应中 `ai_explanation` 始终为 `null`
- ✅ 无 OpenRouter API 调用日志

---

## 🥉 **三级验证指标**

### **8. CPU Time 使用** ⭐️

#### **Cloudflare Dashboard 查看**:
```
Workers & Pages → Analytics → CPU Time
```

#### **对比数据**:
| 指标 | 之前 | Plan E 预期 | 判断 |
|------|------|-------------|------|
| **Median CPU time** | 6.6 ms | < 5 ms | ✅ 改善 |
| **Total CPU time** | 6.17k GB-sec/18h | 按比例下降 | ✅ 改善 |

#### **原因**:
- AI 功能禁用 → 无外部 API 调用
- 更快的超时 → CPU 时间更短

---

### **9. 流量趋势对比** ⭐️

#### **同时段对比**:
```
昨天 12:00 - 今天 06:00 (18h): 278,243 requests
→ 平均: 3.56 req/s = 12,816 req/h

今天 12:00 - 今天 18:00 (6h): [待观察]
→ 目标: < 1.04 req/s = 3,750 req/h (70% reduction)
```

#### **计算方法**:
```bash
# 获取今天同时间段请求数
# Cloudflare Dashboard → Analytics → Requests by time
# 选择今天 12:00 - 18:00
# 记录请求数

# 计算平均请求率
# Average req/s = Total requests / (duration in seconds)
```

#### **判断标准**:
- ✅ 请求率下降 70% (3.56 → < 1.04 req/s)
- ✅ 无明显流量高峰（Rate limiting 平滑流量）
- ❌ 请求率无变化 → 措施未生效

---

### **10. 错误率监控** ⭐️

#### **Cloudflare Dashboard 查看**:
```
Workers & Pages → Analytics → Errors
```

#### **预期分布**:
| 错误类型 | 预期 | 说明 |
|---------|------|------|
| **429 Too Many Requests** | 20-40% | ✅ Rate limiting 工作中 |
| **403 Forbidden** | 10-30% | ✅ Bot detection 工作中 |
| **500 Server Error** | < 1% | ✅ 无系统错误 |
| **503 Service Unavailable** | 可能为 0 | 全局配额拒绝时可能出现 |

#### **判断标准**:
- ✅ 429/403 占比高 = 限制措施有效
- ✅ 500 错误 < 1% = 系统稳定
- ❌ 500 错误 > 5% = 需要调查

---

## 🛠️ **自动化验证工具**

### **一键验证脚本**:
```bash
# 运行完整验证
bash scripts/verify_plan_e.sh
```

**输出内容**:
- ✅ 全局配额计数器值
- ✅ Rate limiting 配置
- ✅ AI 功能状态
- ✅ API 响应测试
- ✅ 响应时间测试
- ✅ 汇总建议

---

### **24小时监控计划**:
```bash
# 设置定时任务（每小时检查一次）
# crontab -e

0 * * * * cd /path/to/project && bash scripts/verify_plan_e.sh >> verification.log 2>&1
```

---

## 📋 **24小时验证清单**

### **T+6 小时**: 初步检查
- [ ] 查看 Cloudflare Dashboard "Requests today"
- [ ] 运行 `bash scripts/verify_plan_e.sh`
- [ ] 检查 Workers 日志是否有 `GLOBAL_QUOTA` 日志

### **T+12 小时**: 中期评估
- [ ] 对比同时段（昨天 vs 今天）请求数
- [ ] 检查 D1 全局配额计数器值
- [ ] 分析 HTTP 状态码分布

### **T+24 小时**: 关键验证
- [ ] 记录完整 24 小时请求数
- [ ] 运行完整验证脚本
- [ ] 判断是否 100% 合规

### **T+48 小时**: 最终确认
- [ ] 确认连续 48 小时合规
- [ ] 趋势分析（是否稳定）
- [ ] 决定是否继续优化或结束

---

## 🎯 **判断标准总结**

### **✅ Plan E 成功的标志**:
1. **当前日请求数 < 90,000** ⭐️ 最关键
2. **D1 全局配额计数器存在且增长**
3. **Workers 日志有 GLOBAL_QUOTA 相关日志**
4. **429/403 状态码占比增加**
5. **API 响应时间 < 0.5s**
6. **Rate limiting 测试出现 429**

### **❌ Plan E 失败的标志**:
1. **当前日请求数 ≥ 100,000** ⭐️ 最关键
2. **D1 全局配额计数器不存在或无增长**
3. **Workers 日志无 GLOBAL_QUOTA 日志**
4. **429/403 状态码占比无变化**
5. **Rate limiting 测试无 429 出现**

### **⚠️ 需要调查的标志**:
1. **请求数 90,000 - 100,000** (临界值)
2. **Workers 日志有 D1 database 错误**
3. **响应时间显著增加**
4. **500 错误率 > 5%**

---

## 🚨 **紧急情况处理**

### **如果请求数 > 100,000**:

#### **Step 1: 检查全局配额**
```bash
npx wrangler d1 execute problems-db --command="
SELECT * FROM counters WHERE key LIKE 'global:%'
"
```

**如果无结果**: 全局配额未工作 → 检查数据库连接
**如果有结果但值 ≥ 90k**: 达到上限但仍在增长 → 配额逻辑有bug

#### **Step 2: 检查 Workers 日志**
```bash
npx wrangler tail --format pretty
```

查找错误: `D1 database not available`, `FAIL OPEN`

#### **Step 3: 临时措施**
- 考虑升级到 Paid Tier ($5/月)
- 临时关闭非核心 API
- 启用维护模式

---

## 📞 **快速参考**

### **最关键的 3 个检查**:
```bash
# 1. Cloudflare Dashboard
open https://dash.cloudflare.com

# 2. D1 全局配额
npx wrangler d1 execute problems-db --command="SELECT * FROM counters"

# 3. Workers 日志
npx wrangler tail --format pretty
```

### **一键验证**:
```bash
bash scripts/verify_plan_e.sh
```

---

## 🎉 **成功标准**

**100% 合规 =**
- ✅ 连续 48 小时 < 90,000 requests/day
- ✅ 全局配额计数器正常工作
- ✅ 无系统错误或异常
- ✅ Rate limiting 和 bot detection 正常运行

---

**生成时间**: 2025-01-15
**文档版本**: 1.0
**用途**: 验证 Plan E 是否达成 100% Cloudflare Free Tier 合规
