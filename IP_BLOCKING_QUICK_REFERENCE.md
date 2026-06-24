# 🚀 阻止IP快速参考

> **快速指南**: 阻止评分≥100的8个可疑IP  
> **时间**: 5-10分钟

---

## 📋 **IP列表（复制使用）**

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

## 🎯 **快速步骤**

### **1. 进入IP Access Rules**

```
Cloudflare Dashboard
  → 选择域名: derivativecalculatorai.com
  → Security
  → WAF
  → Tools
  → IP Access Rules
```

### **2. 创建规则（重复8次）**

对每个IP:
1. 点击 **"+ Add rule"**
2. **Configuration**: `IP address`
3. **IP address**: `[IP地址]`（从上面的列表复制）
4. **Action**: `Block`
5. **Note**: `High abuse score bot IP`
6. 点击 **"Add"**

### **3. 验证**

- 在IP Access Rules页面查看规则列表
- 确认8个IP都已添加，状态为 **"Active"**

---

## ✅ **完成**

**预期效果**: 立即减少约20-30%的请求

---

**详细步骤**: 查看 `BLOCK_HIGH_SCORE_IPS_GUIDE.md`
