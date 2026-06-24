# 🚨 超激进防滥用方案

> **当前问题**: 过去30分钟3,334请求（约1.2-2.2 req/s）  
> **推算**: 如果持续24小时 = 103,680-190,080请求/天  
> **仍然超出**: 100,000/天的限制  
> **需要**: 更激进的解决方案

---

## 📊 **当前情况分析**

### **数据**
- **过去30分钟**: 3,334请求
- **速率**: 约1.2-2.2 req/s
- **如果持续24小时**: 约103,680-190,080请求/天
- **问题**: 仍然远高于100,000/天的限制

### **已实施的措施**
1. ✅ Rate Limiting规则：Global Rate Limit（10 req/10秒 = 60 req/分钟）
2. ✅ Custom Rules：3个规则在阻止bot
3. ✅ Bot Fight Mode：已启用
4. ✅ 代码限制：1 req/min

### **为什么还是高？**
1. **Rate Limiting太宽松**: 10 req/10秒 = 每分钟60个请求，仍然太多
2. **大量不同IP**: 每个IP 60 req/分钟，如果有大量IP，总请求仍然很高
3. **需要更激进的限制**

---

## ✅ **方案1: 降低Rate Limiting限制（最重要）**

### **当前配置**
- Period: 10 seconds
- Requests: 10
- 效果: 每10秒10个请求 = **每分钟60个请求**

### **建议修改**

#### **选项A: 降低到2 requests per 10 seconds**
- Period: 10 seconds
- Requests: **2**（从10降低到2）
- 效果: 每10秒2个请求 = **每分钟12个请求**
- **预期减少**: 约80%的请求

#### **选项B: 降低到1 request per 10 seconds（最激进）**
- Period: 10 seconds
- Requests: **1**（从10降低到1）
- 效果: 每10秒1个请求 = **每分钟6个请求**
- **预期减少**: 约90%的请求

### **修改步骤**
1. Security → Security rules → Rate limiting rules
2. 点击 "Global Rate Limit" 规则
3. 编辑
4. 修改 "When rate exceeds": 从 `10` 改为 `2` 或 `1`
5. 保存

---

## ✅ **方案2: 使用Transform Rules阻止（免费计划支持）**

### **优势**
- 免费计划支持
- 在边缘执行，不消耗Worker配额
- 可以重定向或阻止请求

### **规则1: 阻止无User-Agent的请求**

**配置**:
1. Security → Security rules → Transform rules
2. 点击 "Create rule"
3. **Rule name**: `Block No User-Agent`
4. **When incoming requests match**:
   - Field: `User Agent`
   - Operator: `equals`
   - Value: (留空)
5. **Then**:
   - Action: `Block`

**效果**: 阻止没有User-Agent的请求（通常是bot）

---

### **规则2: 阻止可疑Referer的请求**

**配置**:
1. 点击 "Create rule"
2. **Rule name**: `Block Suspicious Referer`
3. **When incoming requests match**:
   - Field: `Referer`
   - Operator: `does not contain`
   - Value: `derivativecalculatorai.com`
   - AND
   - Field: `URI Path`
   - Operator: `contains`
   - Value: `/api/`
4. **Then**:
   - Action: `Block`

**效果**: 阻止来自外部网站的API请求

---

## ✅ **方案3: 优化代码 - 更早返回（减少处理时间）**

### **在middleware中更早阻止**

修改 `middleware.ts`，在安全检查之前就阻止：

```typescript
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // ULTRA AGGRESSIVE: 在边缘就阻止可疑请求
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    // 阻止无User-Agent的请求
    if (!userAgent || userAgent.trim() === '') {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
        );
    }
    
    // 阻止可疑User-Agent
    const suspiciousPatterns = ['bot', 'crawler', 'spider', 'scraper', 'python', 'curl', 'wget'];
    if (suspiciousPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
        );
    }
    
    // 阻止API请求无Referer
    if (pathname.startsWith('/api/') && !referer.includes('derivativecalculatorai.com')) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
        );
    }
    
    // ... 继续其他检查
}
```

**效果**: 在代码层面更早阻止，减少处理时间

---

## ✅ **方案4: 使用Cloudflare Firewall Rules（如果支持）**

### **检查是否可用**

1. Security → WAF → Firewall rules
2. 查看是否有 "Create rule" 选项

### **如果可用，创建规则**

**规则1: 阻止可疑请求**
- Match: `(http.user_agent contains "bot") or (http.user_agent eq "")`
- Action: Block

**规则2: 限制请求频率**
- Match: `(http.request.count.ge.5) and (http.request.timestamp.le.10)`
- Action: Block

---

## ✅ **方案5: 组合策略（最有效）**

### **立即执行**

1. **降低Rate Limiting限制**
   - 从10降低到2（或1）
   - 预期减少80-90%的请求

2. **添加Transform Rules**
   - 阻止无User-Agent的请求
   - 阻止可疑Referer的API请求

3. **优化代码**
   - 在middleware中更早阻止可疑请求

### **预期效果**

**当前**:
- 过去30分钟: 3,334请求
- 如果持续24小时: 约103,680-190,080请求/天

**优化后预期**:
- 降低Rate Limiting到2 req/10秒: 约20,736-38,016请求/天
- 降低Rate Limiting到1 req/10秒: 约10,368-19,008请求/天
- **应该完全合规**

---

## 🎯 **推荐执行顺序**

### **优先级1: 降低Rate Limiting限制** ⚠️ **最重要**

1. Security → Security rules → Rate limiting rules
2. 点击 "Global Rate Limit"
3. 编辑
4. 修改 "When rate exceeds": 从 `10` 改为 `2`（或 `1`）
5. 保存

**时间**: 2分钟  
**效果**: 立即减少80-90%的请求

---

### **优先级2: 添加Transform Rules** ✅ **推荐**

1. Security → Security rules → Transform rules
2. 创建规则阻止无User-Agent的请求
3. 创建规则阻止可疑Referer的API请求

**时间**: 10分钟  
**效果**: 额外减少20-30%的bot请求

---

### **优先级3: 优化代码** ✅ **可选**

修改 `middleware.ts`，在安全检查之前就阻止可疑请求

**时间**: 15分钟  
**效果**: 减少处理时间，更快响应

---

## 📊 **预期效果对比**

### **当前**
- 过去30分钟: 3,334请求
- 速率: 1.2-2.2 req/s
- 如果持续24小时: 103,680-190,080请求/天

### **方案1: 降低到2 req/10秒**
- 预期: 约20,736-38,016请求/天
- **减少**: 约80%
- **状态**: ✅ 完全合规

### **方案2: 降低到1 req/10秒**
- 预期: 约10,368-19,008请求/天
- **减少**: 约90%
- **状态**: ✅ 完全合规，有大量安全余量

---

## ✅ **总结**

### **问题**
- 当前Rate Limiting限制太宽松（10 req/10秒）
- 仍然超出100,000/天的限制

### **解决方案**
1. ⚠️ **降低Rate Limiting限制**（最重要，立即执行）
2. ✅ **添加Transform Rules**（额外保护）
3. ✅ **优化代码**（可选，减少处理时间）

### **推荐**
- **立即**: 将Rate Limiting从10降低到2（或1）
- **预期**: 减少80-90%的请求
- **结果**: 完全合规，有大量安全余量

---

**创建时间**: 2025-01-17  
**状态**: ⚠️ **需要立即降低Rate Limiting限制**  
**优先级**: 🟢 **最高** - 这是最直接有效的方法
