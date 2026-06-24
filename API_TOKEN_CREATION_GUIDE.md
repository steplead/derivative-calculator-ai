# 🔑 Cloudflare API Token 创建指南（详细步骤）

> **目标**: 创建用于批量阻止IP的API Token  
> **权限**: Zone → Firewall Services → Edit  
> **时间**: 2分钟

---

## 📋 **步骤1: 点击 "Create Custom Token"**

在API Token管理页面：
1. 找到顶部的 **"Create Custom Token"** 部分
2. 点击右侧的 **"Get started"** 蓝色按钮

**为什么选择自定义Token？**
- 预配置模板中没有 "Firewall Services" 权限
- 需要自定义权限来批量阻止IP

---

## 📋 **步骤2: 配置Token**

### **Token名称**

- **Token name**: `Block IPs Token`（或任何你喜欢的名称）

---

### **权限设置（关键）**

1. **点击 "Add permissions"** 或 **"Add"** 按钮

2. **选择权限**:
   - **Zone** → **Firewall Services** → **Edit**
   
   **如何找到**:
   - 在权限列表中，找到 **"Zone"** 分类
   - 展开 **"Zone"**
   - 找到 **"Firewall Services"**
   - 选择 **"Edit"**（不是 "Read"）

3. **（可选）添加读取权限**:
   - **Zone** → **Zone** → **Read**（用于验证规则）

---

### **Zone Resources（重要）**

1. **选择 "Include"**（不是 "Exclude"）

2. **选择 "Specific zone"**

3. **在下拉菜单中选择**: `derivativecalculatorai.com`

**为什么重要？**
- 限制Token只能访问你的域名
- 更安全，即使Token泄露也不会影响其他域名

---

## 📋 **步骤3: 创建Token**

1. 点击 **"Continue to summary"** 按钮

2. **检查摘要**:
   - 确认权限: Zone → Firewall Services → Edit
   - 确认Zone: derivativecalculatorai.com

3. 点击 **"Create Token"** 按钮

---

## 📋 **步骤4: 复制Token（重要）**

1. **Token会立即显示**（只显示一次）
2. **立即复制Token**（点击复制按钮或手动复制）
3. **保存到安全的地方**（如果丢失，需要重新创建）

**Token格式**: 类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## ✅ **完成！**

### **现在你可以**:

1. **编辑 `block-ips.sh`**:
   - 替换 `API_TOKEN="你的API Token"` 为刚创建的Token

2. **运行脚本**:
   ```bash
   ./block-ips.sh
   ```

---

## 🔒 **安全建议**

### **Token权限最小化**

- ✅ 只给必要的权限（Firewall Services → Edit）
- ✅ 只限制到特定Zone（derivativecalculatorai.com）
- ✅ 不要给全局权限

### **Token管理**

- ✅ 保存Token到安全的地方
- ✅ 如果Token泄露，立即删除并重新创建
- ✅ 定期检查Token使用情况

---

## ❓ **常见问题**

### **Q: 找不到 "Firewall Services" 权限？**

**A**: 
- 确保选择的是 **"Zone"** 分类（不是 "Account"）
- 展开 **"Zone"** 后，查找 **"Firewall Services"**
- 如果仍然找不到，可能是账户权限问题

---

### **Q: 创建Token后，脚本仍然失败？**

**A**: 检查：
1. Token是否正确复制（没有多余空格）
2. Zone ID是否正确
3. Token权限是否包含 "Firewall Services → Edit"
4. Zone Resources是否设置为 "derivativecalculatorai.com"

---

### **Q: 可以使用预配置模板吗？**

**A**: 
- 预配置模板中没有 "Firewall Services" 权限
- 必须使用 **"Create Custom Token"** 创建自定义Token

---

## 📝 **完整配置示例**

```
Token name: Block IPs Token

Permissions:
  - Zone → Firewall Services → Edit
  - Zone → Zone → Read (可选)

Zone Resources:
  - Include → Specific zone → derivativecalculatorai.com
```

---

**创建时间**: 2025-01-17  
**状态**: ✅ **详细步骤已提供**  
**优先级**: 🟢 **最高** - 立即执行
