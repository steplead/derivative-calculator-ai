# 🛡️ 激进防滥用策略

> **问题**: 请求仍然很高（75,809/100,000已用），需要更激进的防护  
> **时间**: 2025-01-17  
> **策略**: 使用Cloudflare边缘规则在到达Worker之前阻止滥用

---

## 🚨 **当前问题**

### **数据**
- **今天已用**: 75,809/100,000 (75%)
- **过去30分钟**: 3,319请求
- **速率**: 约1-2 req/s
- **问题**: 即使设置了1 req/min限制，请求仍然很高

### **根本原因**
1. **大量不同IP**: 每个IP 1 req/min，但如果有大量IP，总请求仍然很高
2. **代码限制在Worker内执行**: 仍然消耗配额
3. **需要边缘阻止**: 在到达Worker之前阻止

---

## ✅ **新策略：Cloudflare边缘规则**

### **核心思路**
- **在Cloudflare边缘阻止**，不消耗Worker配额
- **使用WAF规则和Rate Limiting规则**
- **更严格的限制**

---

## 🎯 **方案1: Cloudflare Rate Limiting规则** ⚠️ **最重要**

### **规则1: 全局Rate Limiting（所有请求）**

**配置**:
- **名称**: Global Rate Limit - All Requests
- **匹配条件**: `(http.request.uri.path contains "/")`
- **限制**: `10 requests per 1 minute`（每分钟10个请求）
- **动作**: Block
- **持续时间**: 60 seconds

**说明**:
- 限制每个IP每分钟最多10个请求（包括所有路径）
- 在边缘执行，不消耗Worker配额
- 比代码限制更宽松（允许10 req/min vs 1 req/min），但可以阻止大量请求

---

### **规则2: API Rate Limiting（更严格）**

**配置**:
- **名称**: API Rate Limit - Strict
- **匹配条件**: `(http.request.uri.path contains "/api/")`
- **限制**: `5 requests per 1 minute`（每分钟5个请求）
- **动作**: Block
- **持续时间**: 60 seconds

**说明**:
- API请求更严格（5 req/min）
- 在边缘执行，不消耗Worker配额

---

### **规则3: 页面Rate Limiting**

**配置**:
- **名称**: Page Rate Limit
- **匹配条件**: `(not http.request.uri.path contains "/api/") and (not http.request.uri.path contains "/_next/")`
- **限制**: `20 requests per 1 minute`（每分钟20个请求）
- **动作**: Block
- **持续时间**: 60 seconds

**说明**:
- 页面请求允许更多（20 req/min），因为页面被缓存
- 在边缘执行，不消耗Worker配额

---

## 🎯 **方案2: Cloudflare WAF规则** ✅ **推荐**

### **规则1: 阻止已知Bot**

**配置**:
- **名称**: Block Known Bots
- **匹配条件**: `(cf.bot_management.score lt 30)`
- **动作**: Block

**说明**:
- 使用Cloudflare的Bot Management评分
- 评分低于30的请求被阻止
- 需要Bot Fight Mode或Super Bot Fight Mode（可能需要升级）

---

### **规则2: 阻止可疑User-Agent**

**配置**:
- **名称**: Block Suspicious User-Agents
- **匹配条件**: 
```
(http.user_agent contains "bot") or 
(http.user_agent contains "crawler") or 
(http.user_agent contains "spider") or 
(http.user_agent contains "scraper") or
(http.user_agent eq "")
```
- **动作**: Block

**说明**:
- 阻止明显的爬虫User-Agent
- 在边缘执行，不消耗Worker配额

---

### **规则3: 阻止无Referer的API请求**

**配置**:
- **名称**: Block API Without Referer
- **匹配条件**: 
```
(http.request.uri.path contains "/api/") and 
(not http.referer contains "derivativecalculatorai.com")
```
- **动作**: Block

**说明**:
- API请求必须有Referer（来自网站本身）
- 阻止直接访问API的请求
- 在边缘执行，不消耗Worker配额

---

## 🎯 **方案3: 启用Cloudflare Bot Fight Mode** ✅ **最简单**

### **配置步骤**

1. 进入 Cloudflare Dashboard → `derivativecalculatorai.com`
2. 点击 **Security** → **Bots**
3. 选择 **Bot Fight Mode** 或 **Super Bot Fight Mode**
4. 保存

**说明**:
- **Bot Fight Mode**（免费）: 自动阻止已知的恶意bot
- **Super Bot Fight Mode**（Pro计划，$20/月）: 更高级的bot检测

**效果**:
- 自动阻止大量bot请求
- 在边缘执行，不消耗Worker配额
- 减少约30-50%的bot流量

---

## 🎯 **方案4: 代码优化 - 更严格的限制**

### **修改`utils/security.ts`**

**当前配置**:
```typescript
RATE_LIMIT: {
    DEFAULT_LIMIT: 1,         // 1 req/min
    DEFAULT_WINDOW: 60,      // seconds
}
```

**建议修改**:
```typescript
RATE_LIMIT: {
    DEFAULT_LIMIT: 1,         // 保持1 req/min（已经很严格）
    DEFAULT_WINDOW: 120,      // 改为2分钟（更严格）
}
```

**或者**:
```typescript
RATE_LIMIT: {
    DEFAULT_LIMIT: 1,         // 1 req/2min
    DEFAULT_WINDOW: 120,      // 2 minutes
}
```

---

## 📊 **预期效果**

### **方案1: Cloudflare Rate Limiting规则**

**效果**:
- 每个IP每分钟最多10个请求（全局）
- 在边缘阻止，不消耗Worker配额
- **预期减少**: 约50-70%的请求

### **方案2: Cloudflare WAF规则**

**效果**:
- 阻止已知bot和可疑请求
- 在边缘阻止，不消耗Worker配额
- **预期减少**: 约30-50%的bot流量

### **方案3: Bot Fight Mode**

**效果**:
- 自动阻止已知恶意bot
- 在边缘阻止，不消耗Worker配额
- **预期减少**: 约30-50%的bot流量

### **组合效果**

**如果同时实施**:
- Rate Limiting规则: -50-70%
- WAF规则: -30-50%（bot流量）
- Bot Fight Mode: -30-50%（bot流量）

**总计**: 预期减少约**60-80%**的请求

---

## ✅ **推荐实施顺序**

### **优先级1: 启用Bot Fight Mode** ⚠️ **最简单，立即生效**

1. 进入 Cloudflare Dashboard
2. Security → Bots → Bot Fight Mode
3. 启用

**时间**: 5分钟  
**成本**: 免费  
**效果**: 立即减少30-50%的bot流量

---

### **优先级2: 创建Rate Limiting规则** ⚠️ **最重要**

1. 进入 Cloudflare Dashboard
2. Security → WAF → Rate limiting rules
3. 创建规则1（全局Rate Limiting）
4. 创建规则2（API Rate Limiting）
5. 创建规则3（页面Rate Limiting）

**时间**: 15分钟  
**成本**: 免费（Rate Limiting规则免费）  
**效果**: 减少50-70%的请求

---

### **优先级3: 创建WAF规则** ✅ **推荐**

1. 进入 Cloudflare Dashboard
2. Security → WAF → Custom rules
3. 创建规则1（阻止已知Bot）
4. 创建规则2（阻止可疑User-Agent）
5. 创建规则3（阻止无Referer的API请求）

**时间**: 20分钟  
**成本**: 免费（WAF规则免费）  
**效果**: 减少30-50%的bot流量

---

## 📝 **详细配置步骤**

### **步骤1: 启用Bot Fight Mode**

1. 登录 Cloudflare Dashboard
2. 选择域名: `derivativecalculatorai.com`
3. 点击左侧菜单: **Security** → **Bots**
4. 选择 **Bot Fight Mode**（免费）或 **Super Bot Fight Mode**（Pro计划）
5. 点击 **Save**

---

### **步骤2: 创建Rate Limiting规则**

#### **规则1: 全局Rate Limiting**

1. 点击左侧菜单: **Security** → **WAF** → **Rate limiting rules**
2. 点击 **Create rule**
3. **Rule name**: `Global Rate Limit - All Requests`
4. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `contains`
   - **Value**: `/`
5. **Then**:
   - **Action**: `Block`
   - **Rate**: `10 requests per 1 minute`
   - **Duration**: `60 seconds`
6. 点击 **Deploy**

#### **规则2: API Rate Limiting**

1. 点击 **Create rule**
2. **Rule name**: `API Rate Limit - Strict`
3. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `contains`
   - **Value**: `/api/`
4. **Then**:
   - **Action**: `Block`
   - **Rate**: `5 requests per 1 minute`
   - **Duration**: `60 seconds`
5. 点击 **Deploy**

#### **规则3: 页面Rate Limiting**

1. 点击 **Create rule**
2. **Rule name**: `Page Rate Limit`
3. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `does not contain`
   - **Value**: `/api/`
   - **AND**
   - **Field**: `URI Path`
   - **Operator**: `does not contain`
   - **Value**: `/_next/`
4. **Then**:
   - **Action**: `Block`
   - **Rate**: `20 requests per 1 minute`
   - **Duration**: `60 seconds`
5. 点击 **Deploy**

---

### **步骤3: 创建WAF规则**

#### **规则1: 阻止可疑User-Agent**

1. 点击左侧菜单: **Security** → **WAF** → **Custom rules**
2. 点击 **Create rule**
3. **Rule name**: `Block Suspicious User-Agents`
4. **Expression**:
```
(http.user_agent contains "bot") or 
(http.user_agent contains "crawler") or 
(http.user_agent contains "spider") or 
(http.user_agent contains "scraper") or
(http.user_agent eq "")
```
5. **Action**: `Block`
6. 点击 **Deploy**

#### **规则2: 阻止无Referer的API请求**

1. 点击 **Create rule**
2. **Rule name**: `Block API Without Referer`
3. **Expression**:
```
(http.request.uri.path contains "/api/") and 
(not http.referer contains "derivativecalculatorai.com")
```
4. **Action**: `Block`
5. 点击 **Deploy**

---

## ✅ **验证方法**

### **1. 检查Rate Limiting规则**

1. 进入 Cloudflare Dashboard
2. Security → WAF → Rate limiting rules
3. 查看规则是否激活
4. 查看规则触发的次数

### **2. 检查WAF规则**

1. 进入 Cloudflare Dashboard
2. Security → WAF → Custom rules
3. 查看规则是否激活
4. 查看规则触发的次数

### **3. 检查Bot Fight Mode**

1. 进入 Cloudflare Dashboard
2. Security → Bots
3. 查看Bot Fight Mode是否启用
4. 查看阻止的bot数量

### **4. 检查请求数**

**24小时后**:
1. 进入 Cloudflare Dashboard
2. Workers & Pages → derivative-calculator-ai → Metrics
3. 查看请求数是否下降
4. **目标**: 从75,809/天减少到30,000-40,000/天

---

## ✅ **总结**

### **问题**:
- 请求仍然很高（75,809/100,000已用）
- 代码限制在Worker内执行，仍然消耗配额

### **解决方案**:
1. ✅ **启用Bot Fight Mode**（最简单，立即生效）
2. ✅ **创建Rate Limiting规则**（在边缘阻止）
3. ✅ **创建WAF规则**（阻止bot和可疑请求）

### **预期效果**:
- 减少约**60-80%**的请求
- 从75,809/天减少到**15,000-30,000/天**
- 保持在100,000/天的限制内

---

**创建时间**: 2025-01-17  
**状态**: ⚠️ **需要手动配置Cloudflare规则**  
**优先级**: 🟢 **高** - 这是最有效的减少请求的方法
