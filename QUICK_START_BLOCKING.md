# ⚡ 快速开始：批量阻止IP（5分钟）

> **目标**: 一次性批量阻止所有高分IP  
> **时间**: 5分钟

---

## 🚀 **3步完成**

### **步骤1: 获取配置信息（2分钟）**

#### **获取Zone ID**

1. Cloudflare Dashboard → `derivativecalculatorai.com`
2. 右侧边栏找到 **"Zone ID"**
3. 点击复制

---

#### **创建API Token**

1. Cloudflare Dashboard → 右上角用户图标 → **"My Profile"**
2. 点击 **"API Tokens"** 标签
3. 点击 **"Create Token"** → **"Create Custom Token"**
4. **配置**:
   - **Token name**: `Block IPs Token`
   - **Permissions**: **Zone** → **Firewall Services** → **Edit**
   - **Zone Resources**: **Include** → **Specific zone** → `derivativecalculatorai.com`
5. 点击 **"Create Token"**
6. **复制Token**（只显示一次）

---

### **步骤2: 编辑脚本（1分钟）**

1. 打开 `block-ips.sh`
2. 替换 `ZONE_ID="你的Zone ID"` 为你的Zone ID
3. 替换 `API_TOKEN="你的API Token"` 为你的API Token

---

### **步骤3: 运行脚本（2分钟）**

```bash
./block-ips.sh
```

**脚本会自动**:
- ✅ 批量阻止8个高分IP
- ✅ 检查是否已存在（避免重复）
- ✅ 显示成功/失败统计

---

## ✅ **完成！**

### **验证**

1. Cloudflare Dashboard → Security → WAF → Tools → IP Access Rules
2. 查看规则列表，确认所有IP都已添加

---

## 📋 **IP列表（可直接复制）**

```
198.35.47.192
152.32.191.20
152.32.212.226
161.118.211.239
213.35.120.237
129.150.36.137
34.133.255.234
175.30.48.182
```

---

## 🎯 **预期效果**

- **立即阻止8个高分IP**
- **减少约20-30%的请求**
- **从103,680-190,080请求/天减少到约72,576-133,056请求/天**

---

## 📝 **如果需要阻止更多IP**

### **查询评分≥50的IP**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip FROM abuse_scores WHERE score >= 50 ORDER BY score DESC;"
```

**然后**: 将结果添加到 `block-ips.sh` 中的IPS数组

---

**创建时间**: 2025-01-17  
**状态**: ✅ **快速开始指南已提供**
