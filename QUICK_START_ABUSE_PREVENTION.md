# 🚀 快速开始：防滥用配置

> **目标**: 立即减少请求数，避免配额耗尽  
> **时间**: 5-30分钟  
> **优先级**: 🟢 **最高**

---

## ⚡ **最快方法：启用Bot Fight Mode（5分钟）**

### **步骤**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择域名: `derivativecalculatorai.com`
3. 点击左侧菜单: **Security** → **Bots**
4. 选择 **Bot Fight Mode**（免费）
5. 点击 **Save**

**效果**: 立即减少30-50%的bot流量

---

## 🎯 **最重要：创建Rate Limiting规则（15分钟）**

### **规则1: 全局Rate Limiting**

1. 点击左侧菜单: **Security** → **WAF** → **Rate limiting rules**
2. 点击 **Create rule**
3. **Rule name**: `Global Rate Limit`
4. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `contains`
   - **Value**: `/`
5. **Then**:
   - **Action**: `Block`
   - **Rate**: `10 requests per 1 minute`
   - **Duration**: `60 seconds`
6. 点击 **Deploy**

**效果**: 每个IP每分钟最多10个请求，在边缘阻止

---

### **规则2: API Rate Limiting**

1. 点击 **Create rule**
2. **Rule name**: `API Rate Limit`
3. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `contains`
   - **Value**: `/api/`
4. **Then**:
   - **Action**: `Block`
   - **Rate**: `5 requests per 1 minute`
   - **Duration**: `60 seconds`
5. 点击 **Deploy**

**效果**: API请求更严格（5 req/min）

---

## ✅ **推荐：创建WAF规则（20分钟）**

### **规则1: 阻止可疑User-Agent**

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

**效果**: 阻止明显的爬虫

---

### **规则2: 阻止无Referer的API请求**

1. 点击 **Create rule**
2. **Rule name**: `Block API Without Referer`
3. **Expression**:
```
(http.request.uri.path contains "/api/") and 
(not http.referer contains "derivativecalculatorai.com")
```
4. **Action**: `Block`
5. 点击 **Deploy**

**效果**: 阻止直接访问API的请求

---

## 📊 **预期效果**

### **当前**
- 今天已用: 75,809/100,000 (75%)
- 速率: 约1-2 req/s

### **配置后预期**
- 减少约**60-80%**的请求
- 从75,809/天减少到**15,000-30,000/天**
- 保持在100,000/天的限制内

---

## ✅ **验证**

**24小时后**:
1. 进入 Cloudflare Dashboard
2. Workers & Pages → derivative-calculator-ai → Metrics
3. 查看请求数是否下降

**目标**: 请求数应该从75,809/天减少到30,000以下/天

---

## 📝 **详细指南**

完整配置步骤请查看: `AGGRESSIVE_ABUSE_PREVENTION.md`

---

**创建时间**: 2025-01-17  
**状态**: ⚠️ **需要立即配置**  
**优先级**: 🟢 **最高** - 这是最有效的减少请求的方法
