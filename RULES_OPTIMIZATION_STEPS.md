# 🎯 Cloudflare规则优化详细步骤

> **当前状态**: "Block Known Bots"规则触发了134.11k次/24小时
> **时间**: 2025-01-16
> **目标**: 优化规则，拦截更多bot，减少总流量

---

## 📊 **当前规则状态分析**

### **Custom Rules (2/5 used)**

1. **Order 1: "Block Embed Widget"**
   - **匹配条件**: URI Path starts with `/embed/`
   - **动作**: Block
   - **24小时事件**: **2** ✅ **很少，说明embed请求很少**
   - **状态**: Active

2. **Order 2: "Block Known Bots"**
   - **匹配条件**: User Agent contains bot and User Agent does n... (被截断)
   - **动作**: Block
   - **24小时事件**: **134.11k** ⚠️ **非常高！**
   - **状态**: Active

### **Rate Limiting Rules (1/1 used)**

1. **Order 1: "Block API Abuse"**
   - **匹配条件**: URI Path contains `/api/`
   - **动作**: Block
   - **24小时事件**: **3** ✅ **很少**
   - **状态**: Active

---

## 🔍 **关键发现**

### **1. "Block Known Bots"规则正在工作** ✅

**数据**:
- 24小时触发: **134.11k次**
- 这说明规则正在拦截大量bot

**但问题**:
- 如果规则已经拦截了134.11k次，为什么总流量还是146k/天？
- 可能还有漏网的bot没有被拦截

### **2. "Block Embed Widget"规则几乎不触发** ✅

**数据**:
- 24小时触发: **2次**
- 这说明embed请求很少，或者已经被其他规则拦截

**结论**:
- ✅ Widget不是主要流量来源（已确认）

---

## ✅ **优化步骤：加强"Block Known Bots"规则**

### **步骤1: 查看"Block Known Bots"规则详情**

1. 在Custom Rules页面，找到 **"Block Known Bots"** 规则
2. 点击规则名称或右侧的 **"..."** 菜单
3. 选择 **"Edit"** 或 **"View"**

### **步骤2: 检查当前匹配条件**

**当前匹配条件可能是**:
```
User Agent contains bot
AND User Agent does not contain Googlebot
AND User Agent does not contain Bingbot
AND User Agent does not contain YandexBot
```

**需要确认**:
- ✅ 规则是否包含所有常见的bot User-Agent？
- ✅ 是否排除了搜索引擎bot（应该排除）？
- ✅ 规则是否正确匹配所有bot？

### **步骤3: 优化匹配条件**

**可以添加更多bot检测**:

```
(User Agent contains bot)
OR (User Agent contains crawler)
OR (User Agent contains spider)
OR (User Agent contains scraper)
OR (User Agent contains curl)
OR (User Agent contains wget)
OR (User Agent contains python-requests)
OR (User Agent contains go-http-client)
OR (User Agent contains Java/)
OR (User Agent contains okhttp)
OR (User Agent contains axios)
OR (User Agent contains node-fetch)
OR (User Agent contains SemrushBot)
OR (User Agent contains AhrefsBot)
OR (User Agent contains MJ12bot)
OR (User Agent contains DotBot)
OR (User Agent contains BLEXBot)
AND User Agent does not contain Googlebot
AND User Agent does not contain Bingbot
AND User Agent does not contain YandexBot
AND User Agent does not contain Baiduspider
```

### **步骤4: 修改规则**

1. 点击 **"Edit"**
2. 在 **"Match"** 或 **"Expression"** 字段，修改匹配条件
3. 添加更多bot检测条件（如上所示）
4. 点击 **"Deploy"** 或 **"Save"**

---

## ✅ **步骤5: 添加新的Bot检测规则**

### **5.1 创建规则：阻止可疑User-Agent**

1. 在Custom Rules页面，点击 **"+ Create rule"**
2. 配置如下：

**Rule name**: `Block Suspicious User-Agents`

**Expression** (使用Cloudflare Expression Editor):
```
(http.user_agent contains "curl" or http.user_agent contains "wget" or http.user_agent contains "python-requests" or http.user_agent contains "go-http-client" or http.user_agent contains "Java/" or http.user_agent contains "okhttp" or http.user_agent contains "axios" or http.user_agent contains "node-fetch" or http.user_agent contains "Postman" or http.user_agent contains "Insomnia")
```

**Action**: `Block`

**Deploy**

### **5.2 创建规则：阻止空User-Agent**

1. 在Custom Rules页面，点击 **"+ Create rule"**
2. 配置如下：

**Rule name**: `Block Empty User-Agent`

**Expression**:
```
(http.user_agent eq "")
```

**Action**: `Block`

**Deploy**

### **5.3 创建规则：阻止常见爬虫工具**

1. 在Custom Rules页面，点击 **"+ Create rule"**
2. 配置如下：

**Rule name**: `Block Common Scrapers`

**Expression**:
```
(http.user_agent contains "SemrushBot" or http.user_agent contains "AhrefsBot" or http.user_agent contains "MJ12bot" or http.user_agent contains "DotBot" or http.user_agent contains "BLEXBot" or http.user_agent contains "DataForSeoBot" or http.user_agent contains "MegaIndex" or http.user_agent contains "Barkrowler")
```

**Action**: `Block`

**Deploy**

---

## ✅ **步骤6: 检查规则顺序**

### **6.1 确认规则顺序**

**当前顺序**:
1. Order 1: "Block Embed Widget"
2. Order 2: "Block Known Bots"

**建议顺序**:
- ✅ "Block Known Bots"应该在前面（因为它拦截更多请求）
- ✅ 但当前顺序也可以（因为embed规则更具体）

**如果需要调整顺序**:
1. 点击规则右侧的 **"..."** 菜单
2. 选择 **"Move up"** 或 **"Move down"**
3. 调整到合适的位置

---

## ✅ **步骤7: 查看规则日志**

### **7.1 查看"Block Known Bots"规则日志**

1. 在Custom Rules页面，找到 **"Block Known Bots"** 规则
2. 点击规则名称
3. 查看 **"Events"** 或 **"Logs"** 标签
4. 分析被拦截的请求：
   - User-Agent分布
   - 请求路径分布
   - 请求来源IP分布

### **7.2 识别漏网的Bot**

**方法**:
1. 在 **Analytics** → **Traffic** 查看请求的User-Agent分布
2. 识别高请求数但看起来像bot的User-Agent
3. 添加到"Block Known Bots"规则或创建新规则

---

## ✅ **步骤8: 监控和验证**

### **8.1 监控规则触发次数**

1. 在Custom Rules页面，查看各规则的 **"Events last 24h"**
2. 观察：
   - "Block Known Bots"规则触发次数是否增加（说明拦截更多bot）
   - 新创建的规则是否触发

### **8.2 监控总请求数**

1. 在 **Workers & Pages** → **Metrics**
2. 查看总请求数
3. 观察是否下降（说明bot被拦截）

### **8.3 验证正常用户访问**

1. 在 **Analytics** → **Web Analytics**
2. 查看访问数（排除bot后）
3. 确认正常用户访问不受影响

---

## 📊 **预期效果**

### **如果Bot防护加强**

**预期结果**:
- ✅ "Block Known Bots"规则触发次数增加（从134.11k → 可能增加到140k+）
- ✅ 总请求数下降（从146k → 可能降到10k-20k）
- ✅ Bot流量占比下降（从92% → 可能降到50%以下）
- ✅ 正常用户访问不受影响（Web Analytics显示4次访问保持不变）

### **如果效果不明显**

**可能需要**:
- 检查规则配置是否正确
- 分析是否有漏网的bot（查看规则日志）
- 考虑升级到Cloudflare Pro计划（使用Bot Management）

---

## 📝 **总结**

### **关键步骤**

1. ✅ **查看"Block Known Bots"规则详情**
2. ✅ **优化匹配条件**（添加更多bot检测）
3. ✅ **添加新的Bot检测规则**（阻止可疑User-Agent、空User-Agent、常见爬虫工具）
4. ✅ **检查规则顺序**
5. ✅ **查看规则日志**（识别漏网的bot）
6. ✅ **监控和验证**（观察规则触发次数和总请求数）

### **预期效果**

- ✅ Bot流量占比下降
- ✅ 总请求数下降
- ✅ 正常用户访问不受影响

---

**创建时间**: 2025-01-16  
**状态**: ⚠️ **需要执行**  
**优先级**: 🔴 **最高** - 优化"Block Known Bots"规则，拦截更多bot
