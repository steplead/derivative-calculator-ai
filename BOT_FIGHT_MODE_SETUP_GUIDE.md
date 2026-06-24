# 🤖 Bot Fight Mode 设置指南

> **目标**: 启用Cloudflare Bot Fight Mode自动阻止bot  
> **时间**: 2-3分钟  
> **成本**: 免费

---

## 📍 **导航步骤**

### **步骤1: 登录Cloudflare Dashboard**

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 登录你的账户

---

### **步骤2: 选择域名**

1. 在左侧菜单或顶部，找到并点击域名: **`derivativecalculatorai.com`**
2. 确保你正在查看这个域名的设置

---

### **步骤3: 进入Security设置**

1. 在左侧导航菜单中，找到 **"Security"** 部分
2. 点击 **"Security"** 展开子菜单
3. 你应该看到以下选项：
   - Overview
   - Analytics
   - Web assets
   - Security rules
   - Settings
   - Access

---

### **步骤4: 进入Bots设置**

1. 在 **"Security"** 子菜单中，点击 **"Bots"**
   - 注意：如果看不到 "Bots" 选项，可能需要：
     - 点击 **"Settings"** 查看是否有相关选项
     - 或者直接搜索 "Bots" 或 "Bot Fight"

**如果找不到 "Bots" 选项**:
- 尝试点击 **Security** → **Settings**
- 或者使用顶部搜索框搜索 "Bot Fight Mode"

---

### **步骤5: 启用Bot Fight Mode**

1. 进入Bots页面后，你应该看到几个选项：
   - **Bot Fight Mode**（免费）
   - **Super Bot Fight Mode**（Pro计划，$20/月）

2. **选择 Bot Fight Mode**:
   - 点击 **"Bot Fight Mode"** 选项
   - 或者如果有开关，将其切换到 **"On"**

3. **保存设置**:
   - 点击页面底部的 **"Save"** 按钮
   - 或者如果有确认对话框，点击 **"Confirm"**

---

## 📸 **界面说明**

### **Bots页面应该显示**

**选项1: Bot Fight Mode（免费）**
- 描述: "Automatically challenge known bots"
- 状态: 可以选择启用

**选项2: Super Bot Fight Mode（Pro计划）**
- 描述: "Advanced bot detection with machine learning"
- 状态: 需要升级到Pro计划

---

## ✅ **验证设置**

### **检查是否已启用**

1. 返回 **Security** → **Bots** 页面
2. 确认 **Bot Fight Mode** 显示为 **"On"** 或 **"Enabled"**
3. 你应该看到一些统计信息，比如：
   - "Bots blocked in the last 24 hours"
   - "Bots challenged in the last 24 hours"

---

## 🔍 **如果找不到Bots选项**

### **可能的原因**

1. **界面版本不同**
   - Cloudflare有时会更新界面
   - 选项可能在 **Security** → **Settings** 中

2. **权限问题**
   - 确保你有管理员权限
   - 联系账户所有者

3. **计划限制**
   - 某些功能可能只在特定计划中可用
   - Bot Fight Mode应该在免费计划中可用

### **替代方法**

1. **使用搜索功能**:
   - 在Cloudflare Dashboard顶部搜索框输入 "Bot Fight"
   - 应该会显示相关选项

2. **直接URL**:
   - 尝试访问: `https://dash.cloudflare.com/[你的账户ID]/derivativecalculatorai.com/security/bots`
   - 将 `[你的账户ID]` 替换为你的实际账户ID

3. **联系支持**:
   - 如果仍然找不到，可以联系Cloudflare支持

---

## 📝 **详细路径**

### **完整导航路径**

```
Cloudflare Dashboard
  └─ 选择域名: derivativecalculatorai.com
      └─ 左侧菜单: Security
          └─ Bots
              └─ Bot Fight Mode
                  └─ 启用并保存
```

### **或者通过URL**

如果你知道你的账户ID，可以直接访问：
```
https://dash.cloudflare.com/[账户ID]/derivativecalculatorai.com/security/bots
```

---

## ✅ **启用后的效果**

### **立即生效**

- Bot Fight Mode启用后立即生效
- 不需要等待或重启

### **预期效果**

- **24小时内**: 自动阻止已知的恶意bot
- **减少bot流量**: 约30-50%
- **不影响正常用户**: 正常浏览器访问不受影响

### **监控**

- 可以在 **Security** → **Bots** 页面查看统计信息
- 查看被阻止的bot数量

---

## 🎯 **总结**

### **步骤总结**

1. ✅ 登录 Cloudflare Dashboard
2. ✅ 选择域名: `derivativecalculatorai.com`
3. ✅ 左侧菜单: **Security** → **Bots**
4. ✅ 选择 **Bot Fight Mode**（免费）
5. ✅ 点击 **Save**

### **如果找不到**

- 尝试 **Security** → **Settings**
- 使用搜索框搜索 "Bot Fight"
- 或直接访问URL（如果知道账户ID）

---

**创建时间**: 2025-01-17  
**状态**: ✅ **详细步骤已提供**  
**优先级**: 🟢 **中** - 这是额外的优化，Rate Limiting规则更重要
