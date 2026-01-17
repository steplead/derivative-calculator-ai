# 🛡️ Cloudflare规则创建详细步骤

> **目标**: 创建Custom Rule阻止bot和Page Rule缓存静态资源
> **原则**: 详细、可执行

---

## 📋 **步骤1: 创建Custom Rule阻止bot**

### **1.1 进入Custom Rules页面**

1. 在Security rules页面，找到 **"Custom rules"** 部分
2. 点击 **"Create rule"** 按钮（在"Custom rules 1/5 used"旁边）

### **1.2 填写规则基本信息**

1. **Rule name (required)**: 输入 `Block Known Bots`
2. **Description (optional)**: 输入 `Block known bots and crawlers except search engines`

### **1.3 配置匹配条件**

**添加第一个条件**:
1. 在 "When incoming requests match..." 部分
2. 第一个下拉框（Field）: 选择 **"User Agent"**
3. 第二个下拉框（Operator）: 选择 **"contains"**
4. 输入框（Value）: 输入 `bot`
5. 点击 **"And"** 按钮（添加AND条件）

**添加第二个条件**（排除Googlebot）:
1. 第二个条件行出现
2. Field: 选择 **"User Agent"**
3. Operator: 选择 **"does not contain"**
4. Value: 输入 `Googlebot`
5. 点击 **"And"** 按钮（添加AND条件）

**添加第三个条件**（排除Bingbot）:
1. 第三个条件行出现
2. Field: 选择 **"User Agent"**
3. Operator: 选择 **"does not contain"**
4. Value: 输入 `Bingbot`

**最终匹配条件应该是**:
```
User Agent contains "bot" 
AND User Agent does not contain "Googlebot" 
AND User Agent does not contain "Bingbot"
```

### **1.4 配置动作**

1. 在 "Then take action..." 部分
2. **Choose action**: 选择 **"Block"**
3. 描述会显示: "Blocks matching requests and stops evaluating other rules"

### **1.5 设置规则顺序**

1. 在 "Place at" 部分
2. **Select order**: 选择 **"First"**（最高优先级）

### **1.6 保存并部署**

1. 滚动到页面底部
2. 点击蓝色的 **"Save"** 按钮
3. 等待保存完成
4. 规则会自动部署（状态变为"Active"）

---

## 📋 **步骤2: 创建Page Rule缓存静态资源**

### **2.1 进入Page Rules页面**

1. 左侧菜单点击 **"Rules"**
2. 在下拉菜单中选择 **"Page Rules"**
3. 或者直接访问: 左侧菜单 → **"Rules"** → **"Page Rules"**

### **2.2 创建新规则**

1. 点击 **"Create Page Rule"** 按钮（通常在页面顶部）

### **2.3 配置URL匹配**

1. 在 **"If the URL matches"** 输入框
2. 输入以下URL模式（选择一个）:

**选项A（推荐 - 匹配Next.js静态资源）**:
```
*derivativecalculatorai.com/_next/static/*
```

**选项B（更全面 - 匹配所有静态文件）**:
```
*derivativecalculatorai.com/*.{png,jpg,jpeg,gif,webp,svg,ico,css,js,woff,woff2}
```

**建议**: 先使用选项A，如果还有静态资源请求，再添加选项B

### **2.4 配置缓存设置**

点击 **"+ Add a Setting"** 按钮，添加以下设置：

**设置1: Cache Level**
1. 选择 **"Cache Level"**
2. 值: 选择 **"Cache Everything"**

**设置2: Edge Cache TTL**
1. 选择 **"Edge Cache TTL"**
2. 值: 选择 **"1 year"** 或输入 `31536000`（秒）

**设置3: Browser Cache TTL（可选）**
1. 选择 **"Browser Cache TTL"**
2. 值: 选择 **"1 year"** 或输入 `31536000`（秒）

### **2.5 保存规则**

1. 点击页面底部的 **"Save and Deploy"** 按钮
2. 等待部署完成（通常几秒钟）

### **2.6 验证规则**

1. 规则列表会显示新创建的规则
2. 状态应该显示为 **"Active"**
3. 可以点击规则名称查看详情

---

## 📋 **步骤3: 验证规则生效**

### **3.1 检查Custom Rule**

1. 回到 **Security rules** → **Custom rules**
2. 应该看到 **"Block Known Bots"** 规则
3. 状态: **"Active"**（绿色）
4. 等待一段时间后，查看 **"Events"** 列，应该显示被阻止的bot请求数

### **3.2 检查Page Rule**

1. 回到 **Rules** → **Page Rules**
2. 应该看到新创建的缓存规则
3. 状态: **"Active"**
4. 可以点击规则查看详情

### **3.3 测试效果**

**测试bot阻止**:
- 使用bot User-Agent访问网站，应该被阻止
- 使用正常浏览器访问，应该正常

**测试静态资源缓存**:
- 访问静态资源URL（如 `/_next/static/...`）
- 检查响应头，应该包含 `CF-Cache-Status: HIT`

---

## ⚠️ **注意事项**

### **Custom Rule注意事项**

1. **免费版限制**: 最多5个Custom Rules（当前1/5，创建后2/5）
2. **规则顺序**: 设置为"First"确保优先执行
3. **搜索引擎**: 已排除Googlebot和Bingbot，不会影响SEO

### **Page Rule注意事项**

1. **免费版限制**: 最多3个Page Rules
2. **URL匹配**: 使用通配符 `*` 匹配所有子域名和路径
3. **缓存时间**: 1年足够长，静态资源很少变化

---

## 📊 **预期效果**

### **Custom Rule阻止bot**

**预期**:
- 直接阻止已知bot（如 `bot`, `crawler`, `spider`）
- 减少10-20%流量
- 不影响正常用户和搜索引擎

### **Page Rule缓存静态资源**

**预期**:
- 静态资源被缓存，不产生请求
- 减少20-30%流量
- 不影响功能，只加速加载

### **总体预期**

**当前**: 297,594请求/天

**优化后预期**:
- Custom Rule: -10-20% = 约238,075请求/天
- Page Rule: -20-30% = 约166,653请求/天

**最终预期**: 约166,653请求/天
- 仍然超出70k限制（超出138%）
- 但比297k大幅改善（减少44%）

---

## ✅ **执行清单**

### **Custom Rule**

- [ ] 进入Security rules → Custom rules
- [ ] 点击"Create rule"
- [ ] 填写规则名称: `Block Known Bots`
- [ ] 添加条件: User Agent contains "bot"
- [ ] 添加条件: User Agent does not contain "Googlebot"
- [ ] 添加条件: User Agent does not contain "Bingbot"
- [ ] 设置动作: Block
- [ ] 设置顺序: First
- [ ] 保存并部署

### **Page Rule**

- [ ] 进入Rules → Page Rules
- [ ] 点击"Create Page Rule"
- [ ] 输入URL: `*derivativecalculatorai.com/_next/static/*`
- [ ] 添加设置: Cache Level = Cache Everything
- [ ] 添加设置: Edge Cache TTL = 1 year
- [ ] 保存并部署

---

**创建时间**: 2025-01-16  
**状态**: 待执行  
**优先级**: 高
