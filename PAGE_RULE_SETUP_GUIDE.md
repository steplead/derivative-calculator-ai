# 📋 Page Rule配置详细步骤

> **目标**: 创建Page Rules缓存所有高流量页面
> **限制**: 免费计划只有3个Page Rules，已用1个，还剩2个

---

## ✅ **规则2: 缓存/directory页面**

### **当前配置**

**URL模式**: `*derivativecalculatorai.com/directory*` ✅

**需要添加的设置**:

1. **Cache Level**: Cache Everything ✅（已选择）

2. **Edge Cache TTL**: 
   - 点击"+ Add a Setting"
   - 选择"Edge Cache TTL"
   - 设置为"1 hour"

### **完整配置**

- **URL模式**: `*derivativecalculatorai.com/directory*`
- **Cache Level**: Cache Everything
- **Edge Cache TTL**: 1 hour

### **保存**

点击"Save and Deploy Page Rule"

---

## ✅ **规则3: 缓存所有其他页面**

### **配置步骤**

1. **URL模式**: `*derivativecalculatorai.com/*`

2. **设置**:
   - **Cache Level**: Cache Everything
   - **Edge Cache TTL**: 1 hour

3. **保存**: 点击"Save and Deploy Page Rule"

### **注意**

- 这个规则会匹配所有页面（包括`/`, `/[slug]`等）
- 但Page Rules按优先级执行，所以：
  - 静态资源（`/_next/static/*`）会先匹配规则1
  - `/directory`会先匹配规则2
  - 其他页面会匹配规则3

---

## 📊 **最终Page Rules配置**

### **优先级（从高到低）**

1. **规则1**（已存在）: `*derivativecalculatorai.com/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: a month

2. **规则2**（新建）: `*derivativecalculatorai.com/directory*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour

3. **规则3**（新建）: `*derivativecalculatorai.com/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour

---

## 🎯 **预期效果**

### **如果所有页面都被Page Rules缓存**

**当前**:
- `/directory`: 2,449次/24小时（每次消耗配额）
- `/`: 2,161次/24小时（每次消耗配额）
- 导数问题页面：每个约400-460次（每次消耗配额）

**优化后**:
- `/directory`: 2,449次/24小时，但只有约24次真正消耗配额（每小时1次）
- `/`: 2,161次/24小时，但只有约24次真正消耗配额（每小时1次）
- 导数问题页面：每个约400-460次，但只有约24次真正消耗配额（每小时1次）

**预期减少**:
- 约10,000-12,000次请求/24小时
- **从约164k → 约50k请求/天**
- **应该完全合规**

---

## ✅ **验证方法**

### **步骤1: 检查Page Rules是否生效**

1. 访问`https://derivativecalculatorai.com/directory`
2. 查看响应头（使用浏览器开发者工具）
3. 应该看到`CF-Cache-Status: HIT`（缓存命中）

### **步骤2: 观察流量变化**

1. 等待24小时
2. 查看Cloudflare Metrics
3. 看请求数是否下降

---

## 📝 **总结**

### **当前状态**

- ✅ 规则2正在创建（`/directory`页面）
- ⏳ 规则3需要创建（所有其他页面）

### **下一步**

1. **完成规则2**: 添加Edge Cache TTL设置，保存
2. **创建规则3**: 缓存所有其他页面
3. **验证效果**: 查看流量是否下降

### **预期效果**

- ✅ 减少约96%的配额消耗
- ✅ 从约164k → 约50k请求/天
- ✅ **应该完全合规**

---

**创建时间**: 2025-01-16  
**状态**: ✅ **规则2正在创建，需要完成配置**  
**下一步**: 添加Edge Cache TTL设置，然后创建规则3
