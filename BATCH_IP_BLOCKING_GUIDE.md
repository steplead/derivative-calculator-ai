# 🚫 批量禁用IP地址指南

> **目标**: 批量禁用多个IP地址
> **时间**: 2025-01-16
> **需要禁用的IP**: 3个必须禁用的IP + 多个监控IP

---

## 📋 **需要禁用的IP地址列表**

### **必须禁用的IP（优先级1）**

1. `103.56.208.204` - 漏洞扫描（请求`/xmlrpc.php`）
2. `74.7.241.32` - 高流量bot（98.15k请求/24小时）
3. `74.7.241.17` - 高流量bot（1.31k请求/24小时）

### **需要监控的IP（优先级2）**

1. `104.160.45.224` - 如果请求数增加，考虑禁用
2. `85.208.96.197` - 如果请求数增加，考虑禁用
3. `4.43.184.113` - 如果请求数增加，考虑禁用

### **可疑IP段（优先级3）**

1. `185.191.171.x` - 多个相似IP，可能是bot网络
2. `17.22.x.x` - 多个相似IP，可能是bot网络

---

## ✅ **方法1: 使用Custom Rule批量禁用（推荐）**

### **优点**

- ✅ **一次配置，批量禁用**
- ✅ **易于管理**（所有IP在一个规则中）
- ✅ **易于更新**（添加新IP只需修改一个规则）

### **步骤**

#### **步骤1: 创建Custom Rule**

1. 登录Cloudflare Dashboard
2. 选择域名 `derivativecalculatorai.com`
3. 进入 **Security** → **WAF** → **Custom rules**
4. 点击 **"+ Create rule"**

#### **步骤2: 配置规则**

**Rule name**: `Block High Traffic Bot IPs and Scanners`

**Expression**: 使用 "Edit expression" 链接，输入：

```
(ip.src eq 103.56.208.204) or (ip.src eq 74.7.241.32) or (ip.src eq 74.7.241.17) or (ip.src eq 104.160.45.224) or (ip.src eq 85.208.96.197) or (ip.src eq 4.43.184.113)
```

**Action**: `Block`

**Place at**: `Custom` → `Block Embed Widget`（确保在"Block Known Bots"之前执行）

#### **步骤3: 保存规则**

1. 点击 **"Save"** 保存
2. 等待规则部署完成

---

## ✅ **方法2: 使用IP Access Rules逐个添加**

### **优点**

- ✅ **更精确的控制**
- ✅ **可以为每个IP添加不同的备注**

### **缺点**

- ❌ **需要逐个添加**（较慢）
- ❌ **管理多个规则**

### **步骤**

#### **步骤1: 进入IP Access Rules页面**

1. 登录Cloudflare Dashboard
2. 选择域名 `derivativecalculatorai.com`
3. 进入 **Security** → **WAF** → **Tools**
4. 点击 **"IP Access Rules"**

#### **步骤2: 批量添加IP地址**

**必须禁用的IP**:
1. `103.56.208.204` - Note: "Vulnerability scanner - /xmlrpc.php"
2. `74.7.241.32` - Note: "High traffic bot - 98.15k requests/24h"
3. `74.7.241.17` - Note: "High traffic bot - 1.31k requests/24h"

**需要监控的IP**:
4. `104.160.45.224` - Note: "Monitor - 416 requests/24h"
5. `85.208.96.197` - Note: "Monitor - Multiple requests"
6. `4.43.184.113` - Note: "Monitor - Multiple requests"

**配置每个IP**:
- **Configuration**: 选择 "IP address"
- **IP address**: 输入IP地址
- **Action**: 选择 `Block`
- **Note**: 输入原因
- 点击 **"Add"** 或 **"Save"**

---

## ✅ **方法3: 使用IP段/范围（如果支持）**

### **优点**

- ✅ **可以禁用整个IP段**
- ✅ **一次性禁用多个IP**

### **缺点**

- ❌ **可能误伤正常用户**
- ❌ **需要谨慎使用**

### **步骤**

#### **如果Cloudflare支持IP段**

**可疑IP段**:
1. `185.191.171.0/24` - 禁用整个185.191.171.x段
2. `17.22.0.0/16` - 禁用整个17.22.x.x段

**配置**:
- **Configuration**: 选择 "IP range" 或 "CIDR"
- **IP range**: 输入IP段（例如：`185.191.171.0/24`）
- **Action**: 选择 `Block`
- **Note**: 输入原因（例如："Suspicious IP range - Multiple bot IPs"）

**注意**: ⚠️ **使用IP段需要谨慎，可能误伤正常用户**

---

## ✅ **方法4: 使用Cloudflare API批量添加（高级）**

### **优点**

- ✅ **可以批量添加大量IP**
- ✅ **可以自动化**

### **缺点**

- ❌ **需要API访问权限**
- ❌ **需要编程知识**

### **步骤**

#### **步骤1: 获取API Token**

1. 在Cloudflare Dashboard，进入 **My Profile** → **API Tokens**
2. 创建新的API Token
3. 权限：Zone → Zone Settings → Edit
4. 权限：Zone → Zone → Edit

#### **步骤2: 使用API批量添加**

**API端点**: `POST https://api.cloudflare.com/client/v4/zones/{zone_id}/firewall/access_rules/rules`

**请求体**:
```json
{
  "mode": "block",
  "configuration": {
    "target": "ip",
    "value": "103.56.208.204"
  },
  "notes": "Vulnerability scanner"
}
```

**批量添加脚本** (Python示例):
```python
import requests

zone_id = "YOUR_ZONE_ID"
api_token = "YOUR_API_TOKEN"
headers = {
    "Authorization": f"Bearer {api_token}",
    "Content-Type": "application/json"
}

ips_to_block = [
    "103.56.208.204",
    "74.7.241.32",
    "74.7.241.17",
    "104.160.45.224",
    "85.208.96.197",
    "4.43.184.113"
]

for ip in ips_to_block:
    data = {
        "mode": "block",
        "configuration": {
            "target": "ip",
            "value": ip
        },
        "notes": f"Blocked IP - {ip}"
    }
    response = requests.post(
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/firewall/access_rules/rules",
        headers=headers,
        json=data
    )
    print(f"Blocked {ip}: {response.status_code}")
```

---

## 🎯 **推荐方案**

### **方案1: 使用Custom Rule批量禁用（推荐）** ✅

**优点**:
- ✅ 一次配置，批量禁用
- ✅ 易于管理
- ✅ 易于更新

**步骤**:
1. 创建Custom Rule
2. 使用Expression包含所有需要禁用的IP
3. 保存规则

**Expression示例**:
```
(ip.src eq 103.56.208.204) or (ip.src eq 74.7.241.32) or (ip.src eq 74.7.241.17) or (ip.src eq 104.160.45.224) or (ip.src eq 85.208.96.197) or (ip.src eq 4.43.184.113)
```

---

## 📝 **完整Expression（包含所有需要禁用的IP）**

### **必须禁用的IP + 监控IP**

```
(ip.src eq 103.56.208.204) or (ip.src eq 74.7.241.32) or (ip.src eq 74.7.241.17) or (ip.src eq 104.160.45.224) or (ip.src eq 85.208.96.197) or (ip.src eq 4.43.184.113)
```

### **如果还要禁用可疑IP段（谨慎使用）**

```
(ip.src eq 103.56.208.204) or (ip.src eq 74.7.241.32) or (ip.src eq 74.7.241.17) or (ip.src eq 104.160.45.224) or (ip.src eq 85.208.96.197) or (ip.src eq 4.43.184.113) or (ip.geoip.asnum eq 185.191.171) or (ip.geoip.asnum eq 17.22)
```

**注意**: ⚠️ **使用IP段需要谨慎，可能误伤正常用户**

---

## 🔧 **如何更新规则（添加新IP）**

### **方法1: 编辑Custom Rule**

1. 在 **Security** → **WAF** → **Custom rules** 页面
2. 找到 **"Block High Traffic Bot IPs and Scanners"** 规则
3. 点击规则名称，选择 **"Edit"**
4. 点击 **"Edit expression"** 链接
5. 在Expression中添加新的IP：
   ```
   (ip.src eq 103.56.208.204) or (ip.src eq 74.7.241.32) or ... or (ip.src eq NEW_IP_ADDRESS)
   ```
6. 点击 **"Save"** 保存

---

## 📊 **预期效果**

### **如果IP黑名单生效**

**预期结果**:
- ✅ 这些IP的请求会被直接拦截
- ✅ 到达origin的请求会进一步减少
- ✅ 规则匹配的负担会减少

### **监控方法**

1. **在Security Analytics页面**:
   - 查看 "Mitigated by Cloudflare" 数量是否增加
   - 查看 "Served by origin" 数量是否减少
   - 查看Top Source IPs，确认这些IP不再出现

2. **在Custom Rules页面**:
   - 查看规则的触发次数
   - 确认IP被正确拦截

---

## 📝 **总结**

### **推荐方案**

**使用Custom Rule批量禁用**:
- ✅ 一次配置，批量禁用
- ✅ 易于管理和更新
- ✅ 推荐用于批量禁用多个IP

### **Expression（复制使用）**

```
(ip.src eq 103.56.208.204) or (ip.src eq 74.7.241.32) or (ip.src eq 74.7.241.17) or (ip.src eq 104.160.45.224) or (ip.src eq 85.208.96.197) or (ip.src eq 4.43.184.113)
```

### **下一步**

1. **立即**: 创建Custom Rule，使用上面的Expression
2. **验证**: 确认规则生效
3. **监控**: 持续监控效果，根据需要添加新IP

---

**创建时间**: 2025-01-16  
**状态**: ✅ **已提供批量禁用IP的方法**  
**优先级**: 🔴 **高** - 建议立即批量禁用这些IP地址
