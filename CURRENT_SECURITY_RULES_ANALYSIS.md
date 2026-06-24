# 📊 当前安全规则配置分析

> **时间**: 2025-01-17  
> **状态**: 已有3个Custom Rules和1个Rate Limiting规则  
> **问题**: 请求仍然很高，需要优化

---

## ✅ **当前配置**

### **Custom Rules (3/5 used)**

1. **Block Embed Widget**
   - 匹配: URI Path starts with `/embed/`
   - 动作: Block
   - 状态: Active ✅

2. **Block High Traffic Bot IPs and Scanners**
   - 匹配: IP Source Address equals... (具体IP列表)
   - 动作: Block
   - 状态: Active ✅

3. **Block Known Bots**
   - 匹配: User Agent contains bot, User Agent... (具体规则)
   - 动作: Block
   - 状态: Active ✅

### **Rate Limiting Rules (1/1 used)**

1. **Block API Abuse**
   - 匹配: URI Path contains `/api/`
   - 动作: Block
   - 状态: Active ✅

---

## ⚠️ **问题分析**

### **为什么请求还是很高？**

1. **Rate Limiting规则只覆盖API** ⚠️
   - 当前只有1个Rate Limiting规则，只针对`/api/`
   - **页面请求没有被限制**（`/`, `/directory`, `/[slug]`等）
   - 页面请求占主要流量（从之前的分析看，页面请求占60-70%）

2. **Custom Rules可能不够全面** ⚠️
   - 只阻止了特定的IP和User-Agent
   - 可能有很多新的bot没有被覆盖
   - 需要更通用的bot检测规则

3. **没有全局Rate Limiting** ⚠️
   - 每个IP可以无限制地访问页面
   - 即使有1 req/min的代码限制，但如果有大量不同IP，总请求仍然很高

---

## ✅ **优化建议**

### **优先级1: 添加全局Rate Limiting规则** ⚠️ **最重要**

**问题**: 当前Rate Limiting规则已用完（1/1），需要删除或修改现有规则

**方案A: 修改现有规则（推荐）**

修改 "Block API Abuse" 规则：
- **当前**: 只匹配 `/api/`
- **修改为**: 匹配所有请求（包括页面和API）
- **限制**: `10 requests per 1 minute`（全局限制）

**步骤**:
1. 点击 "Block API Abuse" 规则
2. 编辑规则
3. 修改匹配条件：从 `URI Path contains /api/` 改为 `URI Path contains /`
4. 修改限制：`10 requests per 1 minute`
5. 保存

**效果**: 每个IP每分钟最多10个请求（包括所有路径）

---

**方案B: 删除现有规则，创建新规则**

如果无法修改，可以：
1. 删除 "Block API Abuse" 规则
2. 创建新的全局Rate Limiting规则

**新规则配置**:
- **名称**: `Global Rate Limit - All Requests`
- **匹配**: `URI Path contains /`
- **限制**: `10 requests per 1 minute`
- **动作**: Block
- **持续时间**: 60 seconds

---

### **优先级2: 优化Custom Rules** ✅

**当前问题**:
- Custom Rules已用3/5，还有2个可用
- 但可能需要更通用的规则

**建议添加的规则**:

#### **规则1: 阻止无Referer的API请求**

**配置**:
- **名称**: `Block API Without Referer`
- **匹配**: 
  - `URI Path contains /api/`
  - AND `http.referer does not contain derivativecalculatorai.com`
- **动作**: Block

**效果**: 阻止直接访问API的请求（可能是爬虫或滥用）

---

#### **规则2: 阻止可疑User-Agent（更全面）**

**配置**:
- **名称**: `Block Suspicious User-Agents Extended`
- **匹配**:
```
(http.user_agent contains "bot") or 
(http.user_agent contains "crawler") or 
(http.user_agent contains "spider") or 
(http.user_agent contains "scraper") or
(http.user_agent eq "") or
(http.user_agent contains "python") or
(http.user_agent contains "curl") or
(http.user_agent contains "wget")
```
- **动作**: Block

**效果**: 阻止更多类型的爬虫和自动化工具

---

### **优先级3: 启用Bot Fight Mode** ✅ **最简单**

**步骤**:
1. 进入 Cloudflare Dashboard
2. Security → Bots
3. 选择 **Bot Fight Mode**（免费）
4. 保存

**效果**: 自动阻止已知的恶意bot，减少30-50%的bot流量

---

## 📊 **预期效果**

### **当前**
- Custom Rules: 3/5 used
- Rate Limiting Rules: 1/1 used（只覆盖API）
- 请求数: 75,809/100,000 (75%)

### **优化后预期**
- 添加全局Rate Limiting: 减少50-70%的请求
- 优化Custom Rules: 减少20-30%的bot流量
- 启用Bot Fight Mode: 减少30-50%的bot流量

**总计**: 预期减少约**60-80%**的请求

---

## 🎯 **推荐行动方案**

### **立即执行（5-10分钟）**

1. ✅ **启用Bot Fight Mode**
   - Security → Bots → Bot Fight Mode
   - 立即生效，减少bot流量

2. ✅ **修改Rate Limiting规则**
   - 编辑 "Block API Abuse"
   - 改为全局限制（匹配所有请求）
   - 限制：10 requests per 1 minute

### **后续优化（15-20分钟）**

3. ✅ **添加Custom Rules**
   - 规则1: 阻止无Referer的API请求
   - 规则2: 阻止可疑User-Agent（更全面）

---

## ✅ **详细配置步骤**

### **步骤1: 修改Rate Limiting规则**

1. 进入 Cloudflare Dashboard
2. Security → Security rules → Rate limiting rules
3. 点击 "Block API Abuse" 规则
4. 点击编辑（铅笔图标）
5. **修改匹配条件**:
   - 从: `URI Path contains /api/`
   - 改为: `URI Path contains /`
6. **修改限制**:
   - 从: 当前限制（可能是15 req/10秒）
   - 改为: `10 requests per 1 minute`
7. 点击 **Save**

---

### **步骤2: 启用Bot Fight Mode**

1. 进入 Cloudflare Dashboard
2. Security → Bots
3. 选择 **Bot Fight Mode**（免费）
4. 点击 **Save**

---

### **步骤3: 添加Custom Rules**

#### **规则1: 阻止无Referer的API请求**

1. Security → Security rules → Custom rules
2. 点击 **Create rule**
3. **Rule name**: `Block API Without Referer`
4. **When incoming requests match**:
   - **Field**: `URI Path`
   - **Operator**: `contains`
   - **Value**: `/api/`
   - **AND**
   - **Field**: `Referer`
   - **Operator**: `does not contain`
   - **Value**: `derivativecalculatorai.com`
5. **Then**:
   - **Action**: `Block`
6. 点击 **Deploy**

---

#### **规则2: 阻止可疑User-Agent（更全面）**

1. 点击 **Create rule**
2. **Rule name**: `Block Suspicious User-Agents Extended`
3. **When incoming requests match**:
   - 使用 **Expression Editor**:
```
(http.user_agent contains "bot") or 
(http.user_agent contains "crawler") or 
(http.user_agent contains "spider") or 
(http.user_agent contains "scraper") or
(http.user_agent eq "") or
(http.user_agent contains "python") or
(http.user_agent contains "curl") or
(http.user_agent contains "wget")
```
4. **Then**:
   - **Action**: `Block`
5. 点击 **Deploy**

---

## ✅ **总结**

### **当前配置**
- ✅ 已有3个Custom Rules和1个Rate Limiting规则
- ⚠️ Rate Limiting只覆盖API，页面请求没有被限制
- ⚠️ 这是请求仍然很高的主要原因

### **关键优化**
1. ⚠️ **修改Rate Limiting规则**：改为全局限制（最重要）
2. ✅ **启用Bot Fight Mode**：自动阻止bot（最简单）
3. ✅ **添加Custom Rules**：更全面的bot检测

### **预期效果**
- 减少约**60-80%**的请求
- 从75,809/天减少到**15,000-30,000/天**

---

**创建时间**: 2025-01-17  
**状态**: ⚠️ **需要修改Rate Limiting规则和启用Bot Fight Mode**  
**优先级**: 🟢 **最高** - 修改Rate Limiting规则是最关键的优化
