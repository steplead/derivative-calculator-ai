# ⚠️ Cloudflare免费计划Rate Limiting限制

> **问题**: Rate Limiting规则只能选择10秒周期  
> **原因**: Cloudflare免费计划的限制  
> **解决方案**: 调整请求数限制，或使用其他方法

---

## 🔍 **Cloudflare免费计划限制**

### **Rate Limiting规则限制**

**免费计划**:
- 最小周期: **10秒**（无法选择更长周期）
- 持续时间: **10秒**（无法选择更长）
- 规则数量: **1个**（已用完）

**Pro计划** ($20/月):
- 可以设置更长的周期（1分钟、5分钟等）
- 可以设置更长的持续时间
- 更多规则数量

---

## ✅ **解决方案1: 降低请求数（推荐）**

### **当前配置**
- Period: `10 seconds`（无法修改）
- Requests: `10`
- 效果: 每10秒10个请求 = **每分钟60个请求**

### **建议修改**
- Period: `10 seconds`（保持）
- Requests: `2`（降低）
- 效果: 每10秒2个请求 = **每分钟12个请求**

**或者更严格**:
- Period: `10 seconds`
- Requests: `1`（最严格）
- 效果: 每10秒1个请求 = **每分钟6个请求**

---

## ✅ **解决方案2: 使用Custom Rules（更灵活）**

### **优势**
- Custom Rules还有2个配额（3/5 used）
- 可以设置更复杂的条件
- 不受10秒周期限制

### **规则1: 基于请求频率的阻止**

**配置**:
- **名称**: `Block High Frequency Requests`
- **匹配**: 使用Expression Editor
- **表达式**:
```
(http.request.count.ge.5) and 
(http.request.timestamp.le.10)
```
- **动作**: Block

**说明**:
- 如果10秒内超过5个请求，则阻止
- 相当于每分钟30个请求的限制

---

### **规则2: 阻止快速连续请求**

**配置**:
- **名称**: `Block Rapid Requests`
- **匹配**: 使用Expression Editor
- **表达式**:
```
(http.request.count.ge.3) and 
(http.request.timestamp.le.5)
```
- **动作**: Block

**说明**:
- 如果5秒内超过3个请求，则阻止
- 相当于每分钟36个请求的限制

---

## ✅ **解决方案3: 组合策略（最有效）**

### **策略1: 降低Rate Limiting请求数**

修改当前规则：
- Period: `10 seconds`（保持）
- Requests: `2`（从10降低到2）
- Duration: `10 seconds`（保持）

**效果**: 每分钟最多12个请求

---

### **策略2: 添加Custom Rule补充**

创建新规则：
- **名称**: `Block Rapid Page Requests`
- **匹配**: 
  - `URI Path does not contain /api/`
  - AND `URI Path does not contain /_next/`
- **使用Expression Editor**:
```
(http.request.count.ge.3) and 
(http.request.timestamp.le.5)
```
- **动作**: Block

**效果**: 页面请求5秒内超过3个则阻止

---

### **策略3: 启用Bot Fight Mode**

1. Security → Bots
2. 选择 **Bot Fight Mode**（免费）
3. 保存

**效果**: 自动阻止已知bot，减少30-50%的bot流量

---

## 📊 **预期效果对比**

### **当前配置**
- 10 requests per 10 seconds = 60 requests/minute
- 请求数: 75,809/天

### **方案1: 降低到2 requests per 10 seconds**
- 2 requests per 10 seconds = 12 requests/minute
- **预期减少**: 约80%的请求
- **预期结果**: 从75,809/天减少到约15,000/天

### **方案2: 降低到1 request per 10 seconds**
- 1 request per 10 seconds = 6 requests/minute
- **预期减少**: 约90%的请求
- **预期结果**: 从75,809/天减少到约7,500/天

---

## 🎯 **推荐配置**

### **立即执行**

1. **修改Rate Limiting规则**
   - Period: `10 seconds`（保持）
   - Requests: `2`（从10降低到2）
   - Duration: `10 seconds`（保持）
   - 保存

2. **启用Bot Fight Mode**
   - Security → Bots → Bot Fight Mode
   - 保存

### **可选优化**

3. **添加Custom Rule**（如果还有配额）
   - 创建规则阻止快速连续请求
   - 补充Rate Limiting规则

---

## ✅ **总结**

### **问题**
- Cloudflare免费计划Rate Limiting只能选择10秒周期
- 无法设置1分钟或更长周期

### **解决方案**
1. ✅ **降低请求数**：从10降低到2（每10秒2个请求 = 每分钟12个）
2. ✅ **启用Bot Fight Mode**：自动阻止bot
3. ✅ **添加Custom Rules**：补充限制（可选）

### **预期效果**
- 减少约**80%**的请求
- 从75,809/天减少到约**15,000/天**

---

**创建时间**: 2025-01-17  
**状态**: ✅ **解决方案已提供**  
**优先级**: 🟢 **高** - 降低请求数是最简单有效的方法
