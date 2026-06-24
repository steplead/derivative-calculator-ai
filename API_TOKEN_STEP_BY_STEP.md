# 🔑 API Token 配置步骤（逐步指导）

> **当前状态**: Token Name 已填写为 "Block IPs Token"  
> **下一步**: 配置权限和资源

---

## 📋 **步骤1: 配置 Permissions（权限）**

### **操作步骤**

1. **在 "Permissions" 部分**，找到第一个下拉菜单（显示 "Account"）

2. **点击第一个下拉菜单**，选择：**"Zone"**（不是 "Account"）

3. **点击第二个下拉菜单**（显示 "Select..."），选择：**"Firewall Services"**

4. **点击第三个下拉菜单**（权限级别），选择：**"Edit"**（不是 "Read"）

**配置结果应该是**:
```
Permissions:
  Zone → Firewall Services → Edit
```

---

### **（可选）添加读取权限**

如果需要验证规则是否创建成功，可以添加：

1. 点击 **"+ Add more"** 按钮（在 Permissions 部分）

2. 配置：
   - 第一个下拉：**"Zone"**
   - 第二个下拉：**"Zone"**
   - 第三个下拉：**"Read"**

**最终 Permissions 应该是**:
```
Permissions:
  Zone → Firewall Services → Edit
  Zone → Zone → Read
```

---

## 📋 **步骤2: 配置 Account Resources（资源）**

### **重要：需要改为 Zone Resources**

**注意**: 页面显示的是 "Account Resources"，但我们需要的是 **Zone Resources**。

### **操作步骤**

1. **在 "Account Resources" 部分**，找到第一个下拉菜单（显示 "Include"）

2. **保持第一个下拉为 "Include"**（不要改为 "Exclude"）

3. **点击第二个下拉菜单**（显示 "All accounts"），选择：**"Specific zone"** 或 **"Select zone"**

4. **在出现的输入框或下拉中**，选择或输入：`derivativecalculatorai.com`

**配置结果应该是**:
```
Account Resources:
  Include → Specific zone → derivativecalculatorai.com
```

---

## 📋 **步骤3: 跳过其他配置（可选）**

### **Client IP Address Filtering**
- **可以跳过**（除非你需要限制Token只能从特定IP使用）

### **TTL (Time To Live)**
- **可以跳过**（Token永久有效，除非你设置了过期时间）

---

## 📋 **步骤4: 继续创建**

1. **检查配置**:
   - ✅ Token name: Block IPs Token
   - ✅ Permissions: Zone → Firewall Services → Edit
   - ✅ Account Resources: Include → Specific zone → derivativecalculatorai.com

2. **点击 "Continue to summary"** 按钮

3. **在摘要页面检查**，确认无误后点击 **"Create Token"**

4. **立即复制Token**（只显示一次）

---

## ✅ **配置检查清单**

在点击 "Continue to summary" 之前，确认：

- [ ] Token name: `Block IPs Token`
- [ ] Permissions: `Zone → Firewall Services → Edit`
- [ ] Account Resources: `Include → Specific zone → derivativecalculatorai.com`
- [ ] （可选）Permissions: `Zone → Zone → Read`

---

## ❓ **常见问题**

### **Q: 找不到 "Firewall Services" 选项？**

**A**: 
- 确保第一个下拉选择的是 **"Zone"**（不是 "Account"）
- 如果仍然找不到，可能是账户权限问题，需要检查账户类型

---

### **Q: 找不到 "Specific zone" 选项？**

**A**: 
- 在第二个下拉菜单中查找 **"Specific zone"** 或 **"Select zone"**
- 如果只有 "All accounts"，可能需要先选择账户，然后再选择zone

---

### **Q: 配置完成后，如何验证？**

**A**: 
1. 创建Token后，复制Token
2. 编辑 `block-ips.sh`，替换 `API_TOKEN`
3. 运行脚本测试：`./block-ips.sh`
4. 如果成功，说明Token配置正确

---

**创建时间**: 2025-01-17  
**状态**: ✅ **逐步指导已提供**  
**优先级**: 🟢 **最高** - 立即执行
