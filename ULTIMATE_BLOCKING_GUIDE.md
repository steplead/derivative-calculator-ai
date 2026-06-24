# 🛡️ 最强阻止方案完整指南（客观，不迎合）

> **目标**: 一次性批量阻止所有高分IP，避免重复，最全面方案  
> **方法**: 检查已封IP + API批量阻止 + 分析ASN  
> **时间**: 15-20分钟

---

## 📋 **完整流程**

### **步骤1: 检查已封禁的IP（避免重复）**

#### **查询当前已封禁的IP**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until, offense_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY offense_count DESC;"
```

**目的**: 查看哪些IP已经在代码层面被封禁

**注意**: 
- 这些IP在代码层面被封禁（消耗Worker配额）
- 建议也在Cloudflare层面阻止（不消耗Worker配额）

---

#### **查询所有IP（包括已过期的）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, offense_count, datetime(blocked_until, 'unixepoch') as expire_time FROM ip_blacklist ORDER BY offense_count DESC LIMIT 50;"
```

**目的**: 查看所有曾经被封禁的IP

---

### **步骤2: 获取需要阻止的IP列表**

#### **查询评分≥100的IP（8个）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores WHERE score >= 100 ORDER BY score DESC;"
```

**IP列表**:
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

---

#### **查询评分≥50的IP（更全面）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores WHERE score >= 50 ORDER BY score DESC;"
```

**目的**: 获取更全面的IP列表

---

### **步骤3: 获取Cloudflare配置信息**

#### **获取Zone ID**

1. Cloudflare Dashboard → `derivativecalculatorai.com`
2. 右侧边栏找到 **"Zone ID"**
3. 点击复制

**或者**:
- Overview页面右侧边栏显示Zone ID

---

#### **创建API Token**

1. Cloudflare Dashboard → 右上角用户图标 → **"My Profile"**
2. 点击 **"API Tokens"** 标签
3. 点击 **"Create Token"**
4. 点击 **"Create Custom Token"**
5. **配置**:
   - **Token name**: `Block IPs Token`
   - **Permissions**:
     - **Zone** → **Firewall Services** → **Edit**
   - **Zone Resources**: 
     - **Include** → **Specific zone** → 选择 `derivativecalculatorai.com`
6. 点击 **"Continue to summary"** → **"Create Token"**
7. **复制Token**（只显示一次，保存好）

---

### **步骤4: 使用脚本批量阻止**

#### **方法A: 使用bash脚本（推荐）**

1. **编辑脚本** `block-ips.sh`:
   - 替换`ZONE_ID`为你的Zone ID
   - 替换`API_TOKEN`为你的API Token

2. **添加执行权限**:
   ```bash
   chmod +x block-ips.sh
   ```

3. **运行脚本**:
   ```bash
   ./block-ips.sh
   ```

**脚本会自动**:
- 批量阻止所有IP
- 检查是否已存在（避免重复）
- 显示成功/失败统计

---

#### **方法B: 使用Node.js脚本**

1. **编辑脚本** `block-ips.js`:
   - 替换`ZONE_ID`和`API_TOKEN`

2. **运行脚本**:
   ```bash
   node block-ips.js
   ```

---

#### **方法C: 使用Python脚本**

1. **安装依赖**:
   ```bash
   pip install requests
   ```

2. **编辑脚本** `block-ips.py`:
   - 替换`ZONE_ID`和`API_TOKEN`

3. **运行脚本**:
   ```bash
   python block-ips.py
   ```

---

### **步骤5: 验证规则是否生效**

#### **方法1: 检查规则列表**

1. Cloudflare Dashboard → Security → WAF → Tools → IP Access Rules
2. 查看规则列表
3. 确认所有IP都已添加，状态为 **"Active"**

---

#### **方法2: 使用API查询**

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules?configuration.target=ip&page=1&per_page=50" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

---

## 🎯 **最全面方案（客观）**

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

**查询**:
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
1. 查询高分IP的ASN（使用ipinfo.io）
2. 如果发现主要ASN，阻止整个ASN
3. 预期减少约50-70%的请求

---

### **方案4: 组合策略（最强）**

**同时实施**:
1. ✅ **代码层面阻止**（已存在）
2. ✅ **Cloudflare层面阻止**（使用API批量添加）
3. ✅ **阻止评分≥50的IP**（更全面）
4. ✅ **分析ASN，阻止主要ASN**（最有效）
5. ✅ **保持现有规则**（Rate Limiting、Custom Rules、Bot Fight Mode）

**预期效果**:
- 减少约80-95%的请求
- 从103,680-190,080请求/天减少到约5,184-38,016请求/天
- **完全合规**

---

## 📝 **完整操作清单**

### **准备工作（5分钟）**

- [ ] 获取Zone ID
- [ ] 创建API Token
- [ ] 检查已封禁的IP（避免重复）

### **批量阻止（5分钟）**

- [ ] 编辑脚本（替换ZONE_ID和API_TOKEN）
- [ ] 运行脚本批量阻止IP
- [ ] 验证规则是否生效

### **后续优化（10分钟）**

- [ ] 查询评分≥50的IP
- [ ] 批量阻止这些IP
- [ ] 分析IP的ASN
- [ ] 阻止主要ASN

---

## ✅ **总结**

### **批量阻止方法**

1. ✅ **使用Cloudflare API脚本**（推荐，最快，一次性完成）
2. ✅ **使用Cloudflare Dashboard**（如果支持批量导入）
3. ✅ **逐个添加**（如果以上方法都不支持）

### **推荐**

- **使用bash脚本**（最简单，最快）
- **脚本会自动检查重复**（避免重复添加）

### **预期效果**

- **立即阻止8个高分IP**
- **减少约20-30%的请求**
- **如果阻止评分≥50的IP，减少约40-60%的请求**
- **如果阻止主要ASN，减少约50-70%的请求**

---

**创建时间**: 2025-01-17  
**状态**: ✅ **完整方案和脚本已提供**  
**优先级**: 🟢 **最高** - 立即执行
