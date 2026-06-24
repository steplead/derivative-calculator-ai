# 🚀 使用 API Token 批量阻止 IP（立即执行）

> **Token 已创建**: `xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc`  
> **下一步**: 获取 Zone ID → 编辑脚本 → 运行脚本

---

## ⚠️ **重要：立即保存 Token**

**Token 只显示一次，请立即复制并保存！**

**Token**: `xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc`

**保存方式**:
- 复制到安全的地方（密码管理器、文本文件等）
- 或直接复制到 `block-ips.sh` 脚本中（下一步）

---

## 📋 **步骤1: 获取 Zone ID（1分钟）**

### **方法1: 从 Cloudflare Dashboard 获取**

1. 打开新标签页，访问 Cloudflare Dashboard
2. 选择域名：`derivativecalculatorai.com`
3. 在右侧边栏找到 **"Zone ID"**
4. 点击复制

---

### **方法2: 使用 API 查询（如果 Dashboard 找不到）**

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones?name=derivativecalculatorai.com" \
  -H "Authorization: Bearer xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc" \
  -H "Content-Type: application/json"
```

**从响应中查找**: `"id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`（这就是 Zone ID）

---

## 📋 **步骤2: 编辑脚本（1分钟）**

### **打开 `block-ips.sh`**

1. 找到文件：`/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/block-ips.sh`

2. 编辑以下两行：

```bash
ZONE_ID="你的Zone ID"  # 替换为你的Zone ID
API_TOKEN="你的API Token"  # 替换为 xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc
```

**替换后应该是**:
```bash
ZONE_ID="你的Zone ID"  # 例如: "abc123def456ghi789"
API_TOKEN="xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc"
```

---

## 📋 **步骤3: 测试 Token（可选，但推荐）**

### **使用 Cloudflare 提供的测试命令**

在终端运行：

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc"
```

**预期响应**:
```json
{
  "result": {
    "id": "...",
    "status": "active",
    ...
  },
  "success": true
}
```

**如果看到 `"success": true`，说明 Token 工作正常！**

---

## 📋 **步骤4: 运行脚本（2分钟）**

### **确保脚本有执行权限**

```bash
chmod +x block-ips.sh
```

### **运行脚本**

```bash
./block-ips.sh
```

**脚本会自动**:
- ✅ 批量阻止8个高分IP
- ✅ 检查是否已存在（避免重复）
- ✅ 显示成功/失败统计

**预期输出**:
```
开始批量阻止IP...
总共需要阻止: 8 个IP

正在阻止: 198.35.47.192... ✅ 成功
正在阻止: 152.32.191.20... ✅ 成功
...
=== 结果汇总 ===
成功: 8
失败: 0
总计: 8
```

---

## ✅ **步骤5: 验证规则（1分钟）**

### **方法1: 检查 Cloudflare Dashboard**

1. Cloudflare Dashboard → Security → WAF → Tools → IP Access Rules
2. 查看规则列表
3. 确认所有IP都已添加，状态为 **"Active"**

---

### **方法2: 使用 API 查询**

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules?configuration.target=ip&page=1&per_page=50" \
  -H "Authorization: Bearer xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc" \
  -H "Content-Type: application/json"
```

**从响应中查找**: 应该能看到刚添加的8个IP规则

---

## 🎯 **预期效果**

- **立即阻止8个高分IP**
- **减少约20-30%的请求**
- **从103,680-190,080请求/天减少到约72,576-133,056请求/天**

---

## ❓ **如果脚本失败**

### **常见错误**

1. **Zone ID 错误**
   - 检查 Zone ID 是否正确
   - 确保 Zone ID 和 Token 匹配同一个域名

2. **Token 权限不足**
   - 检查 Token 权限是否包含 "Firewall Services → Edit"
   - 检查 Zone Resources 是否设置为 "derivativecalculatorai.com"

3. **IP 已存在**
   - 脚本会自动检测并跳过已存在的IP
   - 这是正常的，不影响结果

---

## 📝 **完整操作清单**

- [ ] 复制并保存 Token
- [ ] 获取 Zone ID
- [ ] 编辑 `block-ips.sh`（替换 ZONE_ID 和 API_TOKEN）
- [ ] （可选）测试 Token
- [ ] 运行脚本：`./block-ips.sh`
- [ ] 验证规则是否生效

---

**创建时间**: 2025-01-17  
**状态**: ✅ **Token 已创建，等待执行**  
**下一步**: 获取 Zone ID → 编辑脚本 → 运行脚本
