# 🛡️ 阻止高分IP详细步骤指南

> **目标**: 阻止评分≥100的8个可疑IP  
> **方法**: 使用Cloudflare IP Access Rules  
> **时间**: 10-15分钟

---

## 📋 **需要阻止的IP列表**

### **评分≥100的IP（8个）**

```
1. 198.35.47.192  - 624分 🔴 极高
2. 152.32.191.20  - 304分 🔴 极高
3. 152.32.212.226 - 229分 🔴 高
4. 161.118.211.239- 210分 🔴 高
5. 213.35.120.237 - 210分 🔴 高
6. 129.150.36.137 - 191分 🟠 中高
7. 34.133.255.234 - 153分 🟠 中高
8. 175.30.48.182  - 153分 🟠 中高
```

---

## ✅ **详细步骤**

### **步骤1: 登录Cloudflare Dashboard**

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 登录你的账户
3. 选择域名: **`derivativecalculatorai.com`**

---

### **步骤2: 进入IP Access Rules页面**

1. 在左侧导航菜单中，找到 **"Security"**
2. 点击 **"Security"** 展开子菜单
3. 点击 **"WAF"**（Web Application Firewall）
4. 在WAF页面，找到 **"Tools"** 部分
5. 点击 **"IP Access Rules"**

**或者直接路径**:
- Security → WAF → Tools → IP Access Rules

---

### **步骤3: 创建第一个IP阻止规则**

1. 在IP Access Rules页面，点击 **"+ Add rule"** 或 **"Create rule"** 按钮

2. **配置规则**:
   - **Configuration**: 选择 **"IP address"**
   - **IP address**: 输入 `198.35.47.192`
   - **Action**: 选择 **"Block"**
   - **Note** (可选): 输入 `High abuse score bot IP (624 points)`

3. 点击 **"Add"** 或 **"Save"**

4. **重复步骤3**，为每个IP创建规则

---

### **步骤4: 批量创建规则（推荐方法）**

**如果支持批量导入**:

1. 在IP Access Rules页面，查找 **"Import"** 或 **"Bulk import"** 选项
2. 如果支持，使用以下格式:

```
198.35.47.192,Block,High abuse score bot IP (624 points)
152.32.191.20,Block,High abuse score bot IP (304 points)
152.32.212.226,Block,High abuse score bot IP (229 points)
161.118.211.239,Block,High abuse score bot IP (210 points)
213.35.120.237,Block,High abuse score bot IP (210 points)
129.150.36.137,Block,High abuse score bot IP (191 points)
34.133.255.234,Block,High abuse score bot IP (153 points)
175.30.48.182,Block,High abuse score bot IP (153 points)
```

**如果不支持批量导入**:
- 需要逐个创建（8次）

---

## 📝 **完整IP列表（复制使用）**

### **IP列表（按评分排序）**

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

### **带注释的列表（用于Note字段）**

```
198.35.47.192 - High abuse score bot IP (624 points)
152.32.191.20 - High abuse score bot IP (304 points)
152.32.212.226 - High abuse score bot IP (229 points)
161.118.211.239 - High abuse score bot IP (210 points)
213.35.120.237 - High abuse score bot IP (210 points)
129.150.36.137 - High abuse score bot IP (191 points)
34.133.255.234 - High abuse score bot IP (153 points)
175.30.48.182 - High abuse score bot IP (153 points)
```

---

## 🎯 **逐个创建规则（详细步骤）**

### **规则1: 198.35.47.192**

1. 点击 **"+ Add rule"**
2. **Configuration**: 选择 **"IP address"**
3. **IP address**: 输入 `198.35.47.192`
4. **Action**: 选择 **"Block"**
5. **Note**: 输入 `High abuse score bot IP (624 points)`
6. 点击 **"Add"**

### **规则2: 152.32.191.20**

1. 点击 **"+ Add rule"**
2. **Configuration**: 选择 **"IP address"**
3. **IP address**: 输入 `152.32.191.20`
4. **Action**: 选择 **"Block"**
5. **Note**: 输入 `High abuse score bot IP (304 points)`
6. 点击 **"Add"**

### **规则3-8: 重复上述步骤**

为剩余的6个IP创建规则:
- 152.32.212.226
- 161.118.211.239
- 213.35.120.237
- 129.150.36.137
- 34.133.255.234
- 175.30.48.182

---

## ✅ **验证规则是否生效**

### **方法1: 检查规则列表**

1. 在IP Access Rules页面
2. 查看规则列表
3. 确认8个IP都已添加，状态为 **"Active"**

---

### **方法2: 测试IP是否被阻止**

**使用curl测试**:
```bash
curl -I https://derivativecalculatorai.com/ -H "CF-Connecting-IP: 198.35.47.192"
```

**应该返回**: 403 Forbidden

**注意**: 这个测试可能不准确，因为Cloudflare可能不会接受伪造的IP头

---

### **方法3: 检查Cloudflare Analytics**

**24小时后**:
1. Security → Analytics → Events
2. 搜索这些IP
3. 应该看到这些IP的请求被阻止

---

## 📊 **预期效果**

### **阻止前**
- 过去30分钟: 3,334请求
- 如果持续24小时: 约103,680-190,080请求/天

### **阻止后预期**
- 减少约20-30%的请求
- 约72,576-133,056请求/天
- **仍然可能超出限制**

### **如果仍然超出**
- 需要进一步阻止更多IP
- 或分析ASN，阻止整个ASN

---

## 🎯 **后续优化**

### **如果阻止8个IP后仍然超出限制**

#### **步骤1: 阻止更多IP**

**阻止评分≥50的IP**:
```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores WHERE score >= 50 ORDER BY score DESC;"
```

**然后**: 将这些IP也添加到IP Access Rules

---

#### **步骤2: 分析ASN，阻止整个ASN**

**查询IP的ASN**:
- 使用 https://ipinfo.io/198.35.47.192
- 查看ASN号码和组织名称

**如果发现主要ASN**:
1. IP Access Rules → Create rule
2. **Configuration**: 选择 **"ASN"**
3. **ASN**: 输入ASN号码（如AS16509）
4. **Action**: 选择 **"Block"**
5. 点击 **"Add"**

---

## 📝 **快速参考**

### **导航路径**

```
Cloudflare Dashboard
  └─ 选择域名: derivativecalculatorai.com
      └─ Security
          └─ WAF
              └─ Tools
                  └─ IP Access Rules
                      └─ + Add rule
```

### **规则配置**

- **Configuration**: IP address
- **IP address**: [IP地址]
- **Action**: Block
- **Note**: High abuse score bot IP ([分数] points)

---

## ✅ **总结**

### **步骤总结**

1. ✅ 登录Cloudflare Dashboard
2. ✅ Security → WAF → Tools → IP Access Rules
3. ✅ 点击 "+ Add rule"
4. ✅ 为每个IP创建规则（8次）
5. ✅ 验证规则是否生效

### **需要阻止的IP（8个）**

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

### **预期效果**

- 立即减少约20-30%的请求
- 从103,680-190,080请求/天减少到约72,576-133,056请求/天

---

**创建时间**: 2025-01-17  
**状态**: ✅ **详细步骤已提供**  
**优先级**: 🟢 **最高** - 立即执行
