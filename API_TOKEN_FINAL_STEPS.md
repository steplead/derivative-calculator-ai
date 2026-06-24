# ✅ API Token 配置完成 - 最后步骤

> **当前状态**: 配置已正确完成  
> **下一步**: 创建Token并复制

---

## ✅ **配置检查（已完成）**

- ✅ Token name: `Block IPs Token`
- ✅ Permissions: `Zone → Firewall Services → Edit`
- ✅ Zone Resources: `Include → Specific zone → derivativecalculatorai.com`
- ✅ Client IP Address Filtering: 未配置（可以跳过）
- ✅ TTL: 未配置（可以跳过）

**配置完全正确！**

---

## 📋 **最后步骤**

### **步骤1: 点击 "Continue to summary"**

1. 滚动到页面底部
2. 找到 **"Continue to summary"** 按钮
3. 点击按钮

---

### **步骤2: 检查摘要页面**

在摘要页面，确认：

- ✅ Token name: Block IPs Token
- ✅ Permissions: Zone → Firewall Services → Edit
- ✅ Zone Resources: Include → Specific zone → derivativecalculatorai.com

**如果一切正确，继续下一步**

---

### **步骤3: 创建Token**

1. 点击 **"Create Token"** 按钮
2. **Token会立即显示**（只显示一次）
3. **立即复制Token**（点击复制按钮或手动复制）

**Token格式**: 类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### **步骤4: 保存Token**

**重要**: Token只显示一次，如果丢失需要重新创建

**保存方式**:
- 复制到安全的地方（密码管理器、文本文件等）
- 或直接复制到 `block-ips.sh` 脚本中

---

## 🚀 **使用Token**

### **步骤1: 获取Zone ID**

1. Cloudflare Dashboard → `derivativecalculatorai.com`
2. 右侧边栏找到 **"Zone ID"**
3. 点击复制

---

### **步骤2: 编辑脚本**

1. 打开 `block-ips.sh`
2. 替换配置：

```bash
ZONE_ID="你的Zone ID"  # 粘贴Zone ID
API_TOKEN="你的API Token"  # 粘贴刚创建的Token
```

---

### **步骤3: 运行脚本**

```bash
./block-ips.sh
```

**脚本会自动**:
- ✅ 批量阻止8个高分IP
- ✅ 检查是否已存在（避免重复）
- ✅ 显示成功/失败统计

---

## ✅ **验证**

### **方法1: 检查规则列表**

1. Cloudflare Dashboard → Security → WAF → Tools → IP Access Rules
2. 查看规则列表
3. 确认所有IP都已添加，状态为 **"Active"**

---

### **方法2: 检查脚本输出**

脚本运行后会显示：
```
=== 结果汇总 ===
成功: 8
失败: 0
总计: 8
```

---

## ❓ **如果Token创建失败**

### **常见错误**

1. **权限不足**
   - 检查账户是否有权限创建Token
   - 检查Zone是否正确

2. **Token格式错误**
   - 确保完整复制Token（没有多余空格）
   - 确保没有截断

3. **Zone ID错误**
   - 确保Zone ID正确
   - 确保Zone ID和Token匹配同一个域名

---

## 📝 **完整操作流程**

1. ✅ 配置Token（已完成）
2. ⏳ 点击 "Continue to summary"
3. ⏳ 检查摘要
4. ⏳ 点击 "Create Token"
5. ⏳ 复制Token
6. ⏳ 获取Zone ID
7. ⏳ 编辑 `block-ips.sh`
8. ⏳ 运行脚本
9. ⏳ 验证规则

---

**创建时间**: 2025-01-17  
**状态**: ✅ **配置完成，等待创建Token**  
**下一步**: 点击 "Continue to summary" → "Create Token" → 复制Token
