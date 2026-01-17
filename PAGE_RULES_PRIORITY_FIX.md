# ⚠️ Page Rules优先级顺序问题

> **问题**: Page Rules的优先级顺序不正确
> **影响**: 规则1会匹配所有URL，导致规则2和规则3可能永远不会被触发
> **解决方案**: 调整规则优先级顺序

---

## 🔍 **当前配置（有问题）**

### **当前顺序（从高到低）**

1. **规则1**（位置1）: `*derivativecalculatorai.com/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 2 hours

2. **规则2**（位置2）: `*derivativecalculatorai.com/directory*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: a month

3. **规则3**（位置3）: `*derivativecalculatorai.com/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: a month

### **问题** ⚠️

**Page Rules按优先级执行（从高到低）**:
- 规则1（`*derivativecalculatorai.com/*`）会匹配所有URL
- 包括`/directory`和`/_next/static/*`
- **这意味着规则2和规则3可能永远不会被触发**

**结果**:
- `/directory`会被规则1匹配（2小时缓存），而不是规则2（1个月缓存）
- `/_next/static/*`会被规则1匹配（2小时缓存），而不是规则3（1个月缓存）

---

## ✅ **正确的优先级顺序**

### **应该的顺序（从高到低）**

1. **规则1**（最具体）: `*derivativecalculatorai.com/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: a month
   - **优先级最高**（最具体）

2. **规则2**（次具体）: `*derivativecalculatorai.com/directory*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour（建议改为1小时，而不是1个月）
   - **优先级第二**

3. **规则3**（最通用）: `*derivativecalculatorai.com/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour
   - **优先级最低**（最通用）

---

## 🔧 **如何调整优先级**

### **步骤1: 调整规则顺序**

1. **使用拖拽功能**:
   - 点击规则3（`/_next/static/*`）的拖拽手柄（六个点）
   - 拖拽到最上面（位置1）

2. **或者使用箭头按钮**:
   - 点击规则3的向上箭头，直到它到达位置1
   - 点击规则2的向上箭头，直到它到达位置2
   - 规则1会自动降到位置3

### **步骤2: 调整规则2的缓存时间**

**当前**: Edge Cache TTL: a month
**建议**: Edge Cache TTL: 1 hour

**原因**:
- `/directory`页面内容可能更新
- 1小时缓存可以大幅减少流量，同时保持内容相对新鲜

**如何修改**:
1. 点击规则2的编辑按钮（扳手图标）
2. 修改Edge Cache TTL为"1 hour"
3. 保存

---

## 📊 **调整后的最终配置**

### **正确的优先级顺序（从高到低）**

1. **规则1**: `*derivativecalculatorai.com/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: a month
   - **匹配**: 静态资源

2. **规则2**: `*derivativecalculatorai.com/directory*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour（需要修改）
   - **匹配**: `/directory`页面

3. **规则3**: `*derivativecalculatorai.com/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour（需要修改为1小时）
   - **匹配**: 所有其他页面

---

## ✅ **预期效果**

### **如果优先级顺序正确**

**匹配逻辑**:
- `/_next/static/*` → 匹配规则1（1个月缓存）
- `/directory` → 匹配规则2（1小时缓存）
- `/` → 匹配规则3（1小时缓存）
- `/[slug]` → 匹配规则3（1小时缓存）

**效果**:
- 所有页面都被缓存
- 静态资源缓存1个月
- 页面缓存1小时
- **大幅减少配额消耗**

---

## 📝 **总结**

### **当前问题**

- ⚠️ 规则优先级顺序不正确
- ⚠️ 规则1会匹配所有URL，导致规则2和规则3可能永远不会被触发

### **需要做的**

1. **调整规则顺序**: 最具体的规则在最上面
2. **修改规则2的缓存时间**: 从1个月改为1小时
3. **修改规则3的缓存时间**: 从2小时改为1小时（可选）

### **正确的顺序**

1. `/_next/static/*`（最具体）
2. `/directory*`（次具体）
3. `/*`（最通用）

---

**创建时间**: 2025-01-16  
**状态**: ⚠️ **规则优先级顺序不正确，需要调整**  
**下一步**: 调整规则顺序，修改缓存时间
