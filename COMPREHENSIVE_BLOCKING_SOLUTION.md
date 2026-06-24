# 🛡️ 全面阻止方案：批量阻止和避免重复（客观）

> **目标**: 一次性阻止所有高分IP，避免重复阻止  
> **方法**: 检查已封IP + 批量阻止新IP + 最强方案  
> **原则**: 最全面、最客观、最强

---

## 🔍 **步骤1: 检查已封禁的IP**

### **查询当前已封禁的IP**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until, offense_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY offense_count DESC;"
```

**目的**: 查看哪些IP已经被封禁，避免重复添加

---

### **查询所有IP（包括已过期的）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until, offense_count, datetime(blocked_until, 'unixepoch') as expire_time FROM ip_blacklist ORDER BY offense_count DESC LIMIT 50;"
```

**目的**: 查看所有曾经被封禁的IP

---

## 📊 **步骤2: 对比分析**

### **需要阻止的IP列表（评分≥100）**

```
198.35.47.192  - 624分
152.32.191.20  - 304分
152.32.212.226 - 229分
161.118.211.239- 210分
213.35.120.237 - 210分
129.150.36.137 - 191分
34.133.255.234 - 153分
175.30.48.182  - 153分
```

### **对比已封禁的IP**

**如果IP已经在ip_blacklist表中**:
- ✅ 已经在代码层面被封禁
- ⚠️ 但可能只在代码层面，不在Cloudflare IP Access Rules中
- ⚠️ 建议也在Cloudflare层面阻止（更早阻止，不消耗Worker配额）

---

## ✅ **批量阻止方案**

### **方案1: Cloudflare API批量导入（最强大）**

**如果Cloudflare支持API批量导入**:

#### **步骤1: 获取Cloudflare API Token**

1. Cloudflare Dashboard → 右上角用户图标 → **"My Profile"**
2. 点击 **"API Tokens"** 标签
3. 点击 **"Create Token"**
4. 选择 **"Edit zone DNS"** 模板
5. 权限设置:
   - **Zone** → **Zone** → **Edit**
   - **Zone** → **Zone Settings** → **Edit**
6. 点击 **"Continue to summary"** → **"Create Token"**
7. **复制Token**（只显示一次）

---

#### **步骤2: 使用API批量创建规则**

**创建脚本** `block-ips.sh`:

```bash
#!/bin/bash

# Cloudflare配置
ZONE_ID="你的Zone ID"  # 从Cloudflare Dashboard获取
API_TOKEN="你的API Token"

# IP列表
IPS=(
  "198.35.47.192"
  "152.32.191.20"
  "152.32.212.226"
  "161.118.211.239"
  "213.35.120.237"
  "129.150.36.137"
  "34.133.255.234"
  "175.30.48.182"
)

# 批量创建规则
for IP in "${IPS[@]}"; do
  curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{
      \"mode\": \"block\",
      \"configuration\": {
        \"target\": \"ip\",
        \"value\": \"${IP}\"
      },
      \"notes\": \"High abuse score bot IP - Auto blocked\"
    }"
  echo "Blocked: ${IP}"
done
```

**使用方法**:
1. 替换`ZONE_ID`和`API_TOKEN`
2. 运行: `bash block-ips.sh`

---

### **方案2: Cloudflare Dashboard批量导入（如果支持）**

**步骤**:
1. IP Access Rules页面
2. 查找 **"Import"** 或 **"Bulk import"** 选项
3. 如果支持，使用CSV格式:

```csv
IP Address,Action,Note
198.35.47.192,Block,High abuse score bot IP (624 points)
152.32.191.20,Block,High abuse score bot IP (304 points)
152.32.212.226,Block,High abuse score bot IP (229 points)
161.118.211.239,Block,High abuse score bot IP (210 points)
213.35.120.237,Block,High abuse score bot IP (210 points)
129.150.36.137,Block,High abuse score bot IP (191 points)
34.133.255.234,Block,High abuse score bot IP (153 points)
175.30.48.182,Block,High abuse score bot IP (153 points)
```

---

### **方案3: 使用Cloudflare Terraform（高级）**

**如果使用Terraform管理基础设施**:

```hcl
resource "cloudflare_access_rule" "block_high_score_ips" {
  zone_id = var.cloudflare_zone_id
  
  for_each = toset([
    "198.35.47.192",
    "152.32.191.20",
    "152.32.212.226",
    "161.118.211.239",
    "213.35.120.237",
    "129.150.36.137",
    "34.133.255.234",
    "175.30.48.182"
  ])
  
  configuration {
    target = "ip"
    value  = each.value
  }
  
  mode  = "block"
  notes = "High abuse score bot IP - Auto blocked"
}
```

---

## 🎯 **最全面方案（客观，不迎合）**

### **方案1: 代码层面 + Cloudflare层面双重阻止（最强）**

**为什么需要双重阻止？**

1. **代码层面阻止**（已存在）:
   - ✅ 在Worker中阻止，消耗Worker配额
   - ✅ 已经通过`ip_blacklist`表实现

2. **Cloudflare层面阻止**（需要添加）:
   - ✅ 在边缘阻止，不消耗Worker配额
   - ✅ 更早阻止，请求不会到达Worker
   - ✅ 更有效

**结论**: **即使IP已在代码层面被封禁，也应该在Cloudflare层面阻止**

---

### **方案2: 阻止所有评分≥50的IP（更全面）**

**查询所有评分≥50的IP**:

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores WHERE score >= 50 ORDER BY score DESC;"
```

**然后**: 批量阻止这些IP

**预期效果**:
- 阻止更多可疑IP
- 预期减少约40-60%的请求

---

### **方案3: 分析ASN，阻止整个ASN（最有效）**

**步骤**:
1. 查询高分IP的ASN
2. 如果发现主要ASN，阻止整个ASN
3. 预期减少约50-70%的请求

---

### **方案4: 组合策略（最强）**

**同时实施**:
1. ✅ **代码层面阻止**（已存在，通过ip_blacklist表）
2. ✅ **Cloudflare层面阻止**（需要添加IP Access Rules）
3. ✅ **阻止评分≥50的IP**（更全面）
4. ✅ **分析ASN，阻止主要ASN**（最有效）
5. ✅ **保持现有规则**（Rate Limiting、Custom Rules、Bot Fight Mode）

**预期效果**:
- 减少约80-95%的请求
- 从103,680-190,080请求/天减少到约5,184-38,016请求/天
- **完全合规**

---

## 📋 **完整操作流程**

### **步骤1: 检查已封禁的IP**

```bash
# 查询当前已封禁的IP
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY blocked_until DESC;"
```

**记录**: 哪些IP已经被封禁

---

### **步骤2: 查询需要阻止的IP**

```bash
# 查询评分≥50的IP（更全面）
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores WHERE score >= 50 ORDER BY score DESC;"
```

**对比**: 哪些IP需要新增阻止

---

### **步骤3: 批量阻止新IP**

**方法A: 使用Cloudflare API（推荐）**

创建脚本批量阻止（见上面的脚本）

**方法B: 使用Cloudflare Dashboard**

如果支持批量导入，使用CSV格式

**方法C: 逐个添加**

如果以上方法都不支持，逐个添加

---

### **步骤4: 分析ASN，阻止主要ASN**

**查询IP的ASN**:
- 使用 https://ipinfo.io/ 查询
- 或使用命令行: `whois 198.35.47.192`

**如果发现主要ASN**:
- 创建IP Access Rules阻止整个ASN

---

## ✅ **最强方案总结（客观）**

### **立即执行**

1. **检查已封禁的IP**（避免重复）
2. **批量阻止评分≥50的IP**（更全面）
3. **分析ASN，阻止主要ASN**（最有效）

### **预期效果**

- **减少约80-95%的请求**
- **从103,680-190,080请求/天减少到约5,184-38,016请求/天**
- **完全合规**

---

**创建时间**: 2025-01-17  
**状态**: ✅ **最全面方案已提供**  
**优先级**: 🟢 **最高** - 这是最强阻止方案
