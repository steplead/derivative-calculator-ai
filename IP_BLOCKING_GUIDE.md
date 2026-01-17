# 🚫 IP黑名单指南

> **目标**: 识别并禁用造成滥用最多的IP地址
> **时间**: 2025-01-16
> **数据来源**: Cloudflare Security Analytics

---

## 📊 **Top Source IPs（造成滥用最多的IP）**

### **根据Security Analytics数据（Last 24 hours）**

| 排名 | IP地址 | 请求数 | 占比 | 建议 |
|------|--------|--------|------|------|
| 1 | **74.7.241.32** | 98.15k | 77.2% | ⚠️ **必须禁用** |
| 2 | **74.7.242.57** | 24.5k | 19.3% | ⚠️ **必须禁用** |
| 3 | **74.7.241.17** | 2.15k | 1.7% | ⚠️ **建议禁用** |

**关键发现**:
- ⚠️ **3个IP地址占了98.2%的请求**
- ⚠️ **这些IP明显是bot或爬虫**
- ⚠️ **74.7.241.32单独占了77.2%的请求**

---

## 🔍 **如何查看造成滥用最多的IP**

### **方法1: Cloudflare Security Analytics（推荐）**

#### **步骤1: 进入Security Analytics页面**

1. 登录Cloudflare Dashboard
2. 选择域名 `derivativecalculatorai.com`
3. 进入 **Security** → **Analytics**

#### **步骤2: 查看Top Source IPs**

1. 在Security Analytics页面，找到 **"Top statistics"** 部分
2. 查看 **"Source IPs"** 卡片
3. 这里会显示请求数最多的IP地址

#### **步骤3: 分析IP地址**

**需要关注的特征**:
- ⚠️ **请求数异常高**（例如：> 1k/24小时）
- ⚠️ **占比很高**（例如：> 10%）
- ⚠️ **设备类型**: Desktop（99.98%）
- ⚠️ **操作系统**: Unknown/Others（98.7%）

**这些特征表明是bot或爬虫**:
- 正常用户不会产生如此高的请求数
- 正常用户会有不同的设备类型和操作系统

---

### **方法2: Cloudflare Events日志**

#### **步骤1: 进入Events页面**

1. 在 **Security** → **Analytics** 页面
2. 点击 **"Events"** 标签

#### **步骤2: 查看被拦截的请求**

1. 在Events页面，查看 **"Sampled logs"** 表格
2. 查看 **"IP address"** 列
3. 识别频繁出现的IP地址

#### **步骤3: 分析IP模式**

**需要关注**:
- ⚠️ **频繁出现的IP地址**
- ⚠️ **所有请求都被拦截（Action taken: Block）**
- ⚠️ **来自同一个国家（例如：United States）**

---

### **方法3: 使用Cloudflare Log Explorer（如果可用）**

#### **步骤1: 进入Log Explorer**

1. 在Cloudflare Dashboard，进入 **Analytics & logs** → **Log Explorer**

#### **步骤2: 查询高流量IP**

**查询语句**:
```
fields ClientIP, ClientRequestPath, ClientRequestMethod
| filter ClientRequestPath != "/_next/static"
| stats count() by ClientIP
| sort count desc
| limit 20
```

**这将显示**:
- 请求数最多的IP地址
- 每个IP的请求路径
- 请求方法

---

## ✅ **应该禁用的IP地址**

### **基于Security Analytics数据**

#### **必须禁用的IP（Top 3）**

1. **74.7.241.32**
   - 请求数: 98.15k/24小时
   - 占比: 77.2%
   - **这是最主要的滥用来源**

2. **74.7.242.57**
   - 请求数: 24.5k/24小时
   - 占比: 19.3%
   - **第二大的滥用来源**

3. **74.7.241.17**
   - 请求数: 2.15k/24小时
   - 占比: 1.7%
   - **虽然较少，但仍然异常**

#### **建议禁用的IP范围**

**如果这些IP来自同一个ASN或IP段**:
- 可以考虑禁用整个IP段
- 但需要谨慎，避免误伤正常用户

---

## 🔧 **如何禁用IP地址**

### **方法1: 使用IP Access Rules（推荐）**

#### **步骤1: 进入IP Access Rules页面**

1. 登录Cloudflare Dashboard
2. 选择域名 `derivativecalculatorai.com`
3. 进入 **Security** → **WAF** → **Tools**
4. 点击 **"IP Access Rules"**

#### **步骤2: 添加第一个IP（74.7.241.32）**

1. 点击 **"+ Add rule"** 或 **"Create rule"**
2. 配置：
   - **Configuration**: 选择 "IP address"
   - **IP address**: 输入 `74.7.241.32`
   - **Action**: 选择 `Block`
   - **Note** (可选): 输入 "High traffic bot IP - 98.15k requests/24h"
3. 点击 **"Add"** 或 **"Save"**

#### **步骤3: 添加第二个IP（74.7.242.57）**

1. 重复步骤2
2. 配置：
   - **IP address**: 输入 `74.7.242.57`
   - **Action**: 选择 `Block`
   - **Note** (可选): 输入 "High traffic bot IP - 24.5k requests/24h"
3. 点击 **"Add"** 或 **"Save"**

#### **步骤4: 添加第三个IP（74.7.241.17）**

1. 重复步骤2
2. 配置：
   - **IP address**: 输入 `74.7.241.17`
   - **Action**: 选择 `Block`
   - **Note** (可选): 输入 "High traffic bot IP - 2.15k requests/24h"
3. 点击 **"Add"** 或 **"Save"**

#### **步骤5: 验证规则**

1. 在IP Access Rules页面，查看已创建的规则
2. 确认3个IP地址都已添加
3. 确认Action都是 `Block`

---

### **方法2: 使用Custom Rule（如果IP Access Rules不可用）**

#### **步骤1: 创建Custom Rule**

1. 在 **Security** → **WAF** → **Custom rules** 页面
2. 点击 **"+ Create rule"**

#### **步骤2: 配置规则**

1. **Rule name**: `Block High Traffic Bot IPs`
2. **Expression**: 使用 "Edit expression" 链接，输入：
   ```
   (ip.src eq 74.7.241.32) or (ip.src eq 74.7.242.57) or (ip.src eq 74.7.241.17)
   ```
3. **Action**: 选择 `Block`
4. **Place at**: 选择 `Custom`，然后选择 `Block Embed Widget`（确保在"Block Known Bots"之前执行）

#### **步骤3: 保存规则**

1. 点击 **"Save"** 保存
2. 等待规则部署完成

---

## 📊 **预期效果**

### **如果IP黑名单生效**

**预期结果**:
- ✅ 这3个IP的请求会被直接拦截（在规则匹配之前）
- ✅ 到达origin的请求会进一步减少（从1.27k → 可能降到几百）
- ✅ 规则匹配的负担会减少（因为请求在更早的阶段被拦截）

### **监控方法**

1. **在Security Analytics页面**:
   - 查看 "Mitigated by Cloudflare" 数量是否增加
   - 查看 "Served by origin" 数量是否减少
   - 查看Top Source IPs，确认这些IP不再出现

2. **在IP Access Rules页面**:
   - 查看规则的触发次数
   - 确认IP被正确拦截

3. **在Custom Rules页面**:
   - 查看 "Block Known Bots" 规则的触发次数
   - 确认触发次数是否减少（因为部分请求被IP黑名单拦截）

---

## 🔍 **如何持续监控和识别新的滥用IP**

### **定期检查Security Analytics**

**建议频率**: 每天或每周检查一次

**检查步骤**:
1. 进入 **Security** → **Analytics** 页面
2. 查看 **"Top statistics"** → **"Source IPs"**
3. 识别新的高流量IP
4. 如果发现异常IP，添加到黑名单

### **识别异常IP的特征**

**需要关注的IP**:
- ⚠️ **请求数异常高**（> 1k/24小时）
- ⚠️ **占比很高**（> 10%）
- ⚠️ **设备类型**: Desktop（99%+）
- ⚠️ **操作系统**: Unknown/Others（90%+）
- ⚠️ **所有请求都被拦截**（Action taken: Block）

**这些特征表明是bot或爬虫**:
- 正常用户不会产生如此高的请求数
- 正常用户会有不同的设备类型和操作系统

---

## 📝 **总结**

### **应该禁用的IP地址**

1. **74.7.241.32** (98.15k请求/24小时，77.2%)
2. **74.7.242.57** (24.5k请求/24小时，19.3%)
3. **74.7.241.17** (2.15k请求/24小时，1.7%)

### **如何查看造成滥用最多的IP**

1. **Security Analytics**: 查看Top Source IPs
2. **Events日志**: 查看被拦截的请求
3. **Log Explorer**: 查询高流量IP（如果可用）

### **如何禁用IP**

1. **IP Access Rules**: 推荐方法，直接添加IP到黑名单
2. **Custom Rule**: 如果IP Access Rules不可用，创建Custom Rule

### **预期效果**

- ✅ 这3个IP的请求会被直接拦截
- ✅ 到达origin的请求会进一步减少
- ✅ 规则匹配的负担会减少

---

**创建时间**: 2025-01-16  
**状态**: ✅ **已识别需要禁用的IP地址**  
**优先级**: 🔴 **高** - 建议立即禁用这3个IP地址
