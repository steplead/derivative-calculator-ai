# 🛡️ Cloudflare规则配置详细指南

> **目标**: 在Cloudflare层面直接限制流量
> **原则**: 客观可行，基于数据

---

## ✅ **代码优化已完成**

### **已执行的优化**

1. ✅ **Rate limit**: 2 → 1 req/min（减少50%）
2. ✅ **全局配额**: 85k → 70k/天（强制限制）
3. ✅ **Bot threshold**: 50 → 30（更快阻止）
4. ✅ **Bot penalty**: 15 → 20（更快累积）

---

## 🎯 **Cloudflare规则方案（客观）**

### **规则1: 修改现有Rate Limiting规则** ⚠️ **最有效**

**当前规则**: "Block API Abuse"
- 限制: 15 req/10秒
- 问题: 太宽松，与代码限制不一致

**修改方案**:
- 限制: **1 req/60秒**（与代码一致）
- 动作: Block
- 持续时间: 60秒

**创建步骤**:
1. Security rules → Rate limiting rules
2. 点击"Block API Abuse"规则
3. 点击编辑（铅笔图标或"Edit"）
4. 修改"When rate exceeds":
   - Requests: **1**
   - Period: **60 seconds**
5. 保存

**预期效果**:
- 与代码限制一致（1 req/min）
- 在边缘执行，不消耗Worker配额
- 如果API占50%流量，减少约50%总流量

---

### **规则2: 创建Page Rule缓存静态资源** ✅ **有效**

**目的**: 在Cloudflare边缘缓存静态资源，减少请求

**创建步骤**:
1. 左侧菜单点击 **"Rules"** → **"Page Rules"**
2. 点击 **"Create Page Rule"**
3. **URL匹配**:
   ```
   *derivativecalculatorai.com/*.{png,jpg,jpeg,gif,webp,svg,ico,css,js,woff,woff2}
   ```
   或者更简单：
   ```
   *derivativecalculatorai.com/_next/static/*
   *derivativecalculatorai.com/*.png
   *derivativecalculatorai.com/*.css
   *derivativecalculatorai.com/*.js
   ```
4. **Settings**:
   - **Cache Level**: Cache Everything
   - **Edge Cache TTL**: 1 year (31536000 seconds)
   - **Browser Cache TTL**: 1 year
5. 保存

**预期效果**:
- 静态资源被缓存，不产生请求
- 如果静态资源占30%流量，减少约30%总流量

**注意**: 免费版只有3个Page Rules，如果已用完，需要删除旧的或合并规则

---

### **规则3: 创建Custom Rule阻止bot** ✅ **有效**

**目的**: 在Cloudflare边缘直接阻止已知bot

**创建步骤**:
1. Security rules → Custom rules → Create rule
2. **Rule name**: `Block Known Bots`
3. **When incoming requests match**:
   - **Field**: `User Agent`
   - **Operator**: `contains`
   - **Value**: `bot`
   - 点击 **"And"** 添加条件
   - **Field**: `User Agent`
   - **Operator**: `does not contain`
   - **Value**: `Googlebot`
   - 点击 **"And"** 添加条件
   - **Field**: `User Agent`
   - **Operator**: `does not contain`
   - **Value**: `Bingbot`
4. **Then take action**: `Block`
5. 保存并部署

**或者使用表达式**:
```
(http.user_agent contains "bot" and not http.user_agent contains "Googlebot" and not http.user_agent contains "Bingbot")
or (http.user_agent contains "crawler" and not http.user_agent contains "Googlebot")
or (http.user_agent contains "spider" and not http.user_agent contains "Googlebot")
```

**预期效果**:
- 直接阻止已知bot
- 减少10-20%流量
- 不影响正常用户和搜索引擎

---

### **规则4: 创建Custom Rule限制可疑请求** ⚠️ **可选**

**目的**: 阻止没有Referer的API请求（可能是直接调用）

**创建步骤**:
1. Security rules → Custom rules → Create rule
2. **Rule name**: `Block API Without Referer`
3. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `starts with`
   - **Value**: `/api/`
   - 点击 **"And"**
   - **Field**: `Referer`
   - **Operator**: `is absent`
4. **Then take action**: `Block`
5. 保存并部署

**预期效果**:
- 阻止直接API调用（没有Referer）
- 减少5-10%流量
- 可能影响正常使用（如果用户直接访问API）

**注意**: 这个规则可能过于严格，建议先测试

---

## 📊 **预期效果（客观计算）**

### **如果所有规则都生效**

**当前**: 297,594请求/天

**规则1 (API Rate Limiting 1 req/min)**:
- 如果API占50%: -50% = 148,797请求

**规则2 (静态资源缓存)**:
- 如果静态资源占30%: -30% = 104,158请求

**规则3 (Bot Detection)**:
- 如果bot占20%: -20% = 83,326请求

**最终预期**: 约83,326请求/天
- **仍然超出70k限制**（超出19%）
- 但比297k大幅改善（减少72%）

---

## ⚠️ **客观限制**

### **Cloudflare免费版限制**

1. **Rate Limiting规则**: 只有1个（已用完）
   - 需要修改现有规则，不能创建新的

2. **Custom Rules**: 最多5个（当前1个，还有4个可用）
   - 可以创建规则2、3、4

3. **Page Rules**: 免费版有3个
   - 需要检查是否已用完

---

## ✅ **推荐执行顺序（客观）**

### **优先级1: 修改现有Rate Limiting规则** ⚠️ **最有效**

**为什么**:
- 直接限制API请求频率
- 与代码限制一致
- 在边缘执行，不消耗配额

### **优先级2: 创建Page Rule缓存静态资源** ✅ **有效**

**为什么**:
- 静态资源可能占很大比例
- 缓存后不产生请求
- 不影响功能

### **优先级3: 创建Custom Rule阻止bot** ✅ **有效**

**为什么**:
- 直接阻止已知bot
- 减少bot流量
- 不影响正常用户

### **优先级4: 创建Custom Rule限制可疑请求** ⚠️ **可选**

**为什么**:
- 可能过于严格
- 建议先测试其他规则效果
- 如果仍然超出，再考虑

---

## 📝 **执行清单**

### **代码修改** ✅

- [x] Rate limit: 2 → 1 req/min
- [x] 全局配额: 85k → 70k/天
- [x] Bot threshold: 50 → 30
- [x] Bot penalty: 15 → 20

### **Cloudflare规则** ⚠️

- [ ] **规则1**: 修改现有Rate Limiting规则（15 req/10秒 → 1 req/60秒）
- [ ] **规则2**: 创建Page Rule缓存静态资源
- [ ] **规则3**: 创建Custom Rule阻止bot
- [ ] **规则4**: 创建Custom Rule限制可疑请求（可选）

---

## 🎯 **客观结论**

### **基于数据**

1. **代码优化已完成**
   - Rate limit: 1 req/min
   - 全局配额: 70k/天
   - Bot threshold: 30

2. **Cloudflare规则需要创建**
   - 修改现有Rate Limiting规则（最有效）
   - 创建Page Rule缓存静态资源
   - 创建Custom Rule阻止bot

3. **预期效果**
   - 297k → 约83k请求/天
   - 仍然超出70k限制（超出19%）
   - 但比297k大幅改善（减少72%）

### **如果仍然超出**

**进一步优化**:
- Rate limit: 1 → 0.5 req/min（极端）
- 全局配额: 70k → 60k/天（更保守）
- 或升级到付费计划

---

**分析时间**: 2025-01-16  
**原则**: 客观，不迎合，基于数据  
**状态**: 代码优化已完成，Cloudflare规则需要创建
