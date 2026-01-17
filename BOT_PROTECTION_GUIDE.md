# 🛡️ Bot防护详细操作指南

> **目标**: 加强Bot防护，减少高流量问题
> **时间**: 2025-01-16
> **当前状态**: Bot流量占比约92%（134.85k / 146k）

---

## 📊 **当前数据确认**

### **Cloudflare Web Analytics（排除Bot后）**

- **访问数（24小时）**: 4
- **页面浏览（24小时）**: 4
- **过滤条件**: "Exclude bots equals Yes"

### **Cloudflare Metrics（包含所有流量）**

- **请求数（24小时）**: 约146k
- **"Block Known Bots"规则触发**: 134.85k次
- **Bot流量占比**: 约92%

**结论**: 高流量主要是bot，不是正常用户。

---

## ✅ **步骤1: 检查"Block Known Bots"规则配置**

### **1.1 登录Cloudflare Dashboard**

1. 访问 https://dash.cloudflare.com
2. 选择你的域名 `derivativecalculatorai.com`

### **1.2 查看"Block Known Bots"规则**

1. 进入 **Security** → **WAF** → **Custom rules**
2. 找到 **"Block Known Bots"** 规则（Order 2）
3. 点击规则名称或右侧的 **"..."** 菜单
4. 选择 **"Edit"** 或 **"View"**

### **1.3 检查规则配置**

**当前配置应该是**:
- **匹配条件**: `User Agent contains bot` AND `User Agent does not contain Googlebot` AND ...
- **动作**: `Block`

**需要确认**:
- ✅ 规则是否包含所有常见的bot User-Agent？
- ✅ 是否排除了Googlebot（应该排除，因为需要SEO）
- ✅ 规则是否正确匹配所有bot？

### **1.4 查看规则日志**

1. 在规则详情页面，点击 **"View logs"** 或 **"Events"**
2. 查看被拦截的请求：
   - User-Agent分布
   - 请求路径分布
   - 请求来源IP分布
3. 识别是否有漏网的bot

---

## ✅ **步骤2: 分析被拦截的Bot**

### **2.1 查看规则触发详情**

1. 在 **Security** → **WAF** → **Custom rules**
2. 点击 **"Block Known Bots"** 规则
3. 查看 **"Events last 24h"** 图表
4. 点击图表查看详细数据

### **2.2 分析User-Agent分布**

**需要检查**:
- 哪些User-Agent被拦截了？
- 是否有常见的bot User-Agent没有被拦截？
- 是否有漏网的bot？

**常见bot User-Agent**:
- `bot`, `crawler`, `spider`, `scraper`
- `curl`, `wget`, `python-requests`
- `SemrushBot`, `AhrefsBot`, `MJ12bot`
- `Baiduspider`, `YandexBot`, `Bingbot`

### **2.3 识别漏网的Bot**

**方法**:
1. 在Cloudflare Dashboard查看 **Analytics** → **Traffic**
2. 查看请求的User-Agent分布
3. 识别可疑的User-Agent（高请求数但看起来像bot）
4. 添加到"Block Known Bots"规则

---

## ✅ **步骤3: 优化"Block Known Bots"规则**

### **3.1 添加更多bot检测条件**

**当前规则可能只匹配**:
```
User Agent contains bot
AND User Agent does not contain Googlebot
AND ...
```

**可以添加**:
```
(User Agent contains bot)
OR (User Agent contains crawler)
OR (User Agent contains spider)
OR (User Agent contains scraper)
OR (User Agent contains curl)
OR (User Agent contains wget)
OR (User Agent contains python-requests)
OR (User Agent contains SemrushBot)
OR (User Agent contains AhrefsBot)
OR (User Agent contains MJ12bot)
AND User Agent does not contain Googlebot
AND User Agent does not contain Bingbot
AND User Agent does not contain YandexBot
```

### **3.2 修改规则**

1. 在 **Security** → **WAF** → **Custom rules**
2. 点击 **"Block Known Bots"** 规则
3. 选择 **"Edit"**
4. 修改 **"Match"** 条件，添加更多bot检测
5. 点击 **"Deploy"**

---

## ✅ **步骤4: 添加新的Bot检测规则**

### **4.1 创建新规则：阻止可疑User-Agent**

1. 在 **Security** → **WAF** → **Custom rules**
2. 点击 **"+ Create rule"**
3. 配置如下：

**Rule name**: `Block Suspicious User-Agents`

**Expression**:
```
(http.user_agent contains "curl" or http.user_agent contains "wget" or http.user_agent contains "python-requests" or http.user_agent contains "go-http-client" or http.user_agent contains "Java/" or http.user_agent contains "okhttp" or http.user_agent contains "axios" or http.user_agent contains "node-fetch")
```

**Action**: `Block`

**Deploy**

### **4.2 创建新规则：阻止空User-Agent**

1. 在 **Security** → **WAF** → **Custom rules**
2. 点击 **"+ Create rule"**
3. 配置如下：

**Rule name**: `Block Empty User-Agent`

**Expression**:
```
(http.user_agent eq "")
```

**Action**: `Block`

**Deploy**

### **4.3 创建新规则：阻止可疑请求模式**

1. 在 **Security** → **WAF** → **Custom rules**
2. 点击 **"+ Create rule"**
3. 配置如下：

**Rule name**: `Block Rapid Requests`

**Expression**:
```
(cf.rate_limit.triggered eq true)
```

**Action**: `Block`

**Deploy**

---

## ✅ **步骤5: 使用Cloudflare Bot Management（如果可用）**

### **5.1 检查Bot Management可用性**

1. 在 **Security** → **Bots**
2. 查看是否有 **"Bot Management"** 选项
3. 如果可用，启用它

**注意**: Bot Management需要Pro计划或更高版本。

### **5.2 配置Bot Management**

1. 在 **Security** → **Bots**
2. 选择 **"Bot Management"**
3. 配置bot检测规则：
   - **Verified bots**: 允许（如Googlebot）
   - **Likely automated**: 阻止或挑战
   - **Likely human**: 允许

---

## ✅ **步骤6: 进一步限制可疑请求**

### **6.1 降低Rate Limit**

**当前状态**:
- Rate limit: 1 req/min（已经很严格）

**可以优化**:
1. 在 **Security** → **WAF** → **Rate limiting rules**
2. 找到 **"Block API Abuse"** 规则
3. 选择 **"Edit"**
4. 降低rate limit（例如：0.5 req/min）
5. 点击 **"Deploy"**

### **6.2 添加IP黑名单**

**如果发现特定IP频繁请求**:

1. 在 **Security** → **WAF** → **Tools**
2. 选择 **"IP Access Rules"**
3. 点击 **"+ Add rule"**
4. 配置：
   - **IP Address**: 输入可疑IP
   - **Action**: `Block`
5. 点击 **"Add"**

---

## ✅ **步骤7: 监控和验证**

### **7.1 监控规则触发次数**

1. 在 **Security** → **WAF** → **Custom rules**
2. 查看 **"Block Known Bots"** 规则的触发次数
3. 观察是否增加（说明规则更有效）

### **7.2 监控总请求数**

1. 在 **Workers & Pages** → **Metrics**
2. 查看总请求数
3. 观察是否下降（说明bot被拦截）

### **7.3 验证正常用户访问**

1. 在 **Analytics** → **Web Analytics**
2. 查看访问数（排除bot后）
3. 确认正常用户访问不受影响

---

## 📊 **预期效果**

### **如果Bot防护加强**

**预期结果**:
- ✅ "Block Known Bots"规则触发次数增加
- ✅ 总请求数下降（从146k → 可能降到10k-20k）
- ✅ Bot流量占比下降（从92% → 可能降到50%以下）
- ✅ 正常用户访问不受影响

### **如果效果不明显**

**可能需要**:
- 检查规则配置是否正确
- 分析是否有漏网的bot
- 考虑升级到Cloudflare Pro计划（使用Bot Management）

---

## 📝 **总结**

### **关键步骤**

1. ✅ **检查"Block Known Bots"规则配置**
2. ✅ **分析被拦截的Bot**
3. ✅ **优化"Block Known Bots"规则**
4. ✅ **添加新的Bot检测规则**
5. ✅ **使用Cloudflare Bot Management（如果可用）**
6. ✅ **进一步限制可疑请求**
7. ✅ **监控和验证**

### **预期效果**

- ✅ Bot流量占比下降
- ✅ 总请求数下降
- ✅ 正常用户访问不受影响

---

**创建时间**: 2025-01-16  
**状态**: ⚠️ **需要执行**  
**优先级**: 🔴 **最高** - 加强Bot防护，减少高流量问题
