# ✅ Page Rule完整配置步骤

> **规则2**: 缓存/directory页面
> **当前状态**: URL和Cache Level已设置，需要添加Edge Cache TTL

---

## ✅ **当前配置（正确）**

- **URL模式**: `*derivativecalculatorai.com/directory*` ✅
- **Cache Level**: Cache Everything ✅

---

## ⚠️ **还需要添加的设置**

### **步骤：添加Edge Cache TTL**

1. **点击 "+ Add a Setting" 按钮**

2. **选择 "Edge Cache TTL"**

3. **设置为 "1 hour"**

### **完整配置应该是**

- **URL模式**: `*derivativecalculatorai.com/directory*`
- **Cache Level**: Cache Everything
- **Edge Cache TTL**: 1 hour

---

## ✅ **保存规则**

配置完成后，点击 **"Save and Deploy Page Rule"** 按钮

---

## 🎯 **下一步：创建规则3**

规则2保存后，需要创建规则3来缓存所有其他页面：

1. **点击 "Create Page Rule"**
2. **URL模式**: `*derivativecalculatorai.com/*`
3. **设置**:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour
4. **保存**

---

## 📊 **最终配置**

### **3个Page Rules（优先级从高到低）**

1. **规则1**（已存在）: `*derivativecalculatorai.com/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: a month

2. **规则2**（正在创建）: `*derivativecalculatorai.com/directory*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour

3. **规则3**（需要创建）: `*derivativecalculatorai.com/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 hour

---

## ✅ **总结**

### **当前步骤**

1. ✅ URL模式已设置
2. ✅ Cache Level已设置
3. ⏳ **需要添加Edge Cache TTL: 1 hour**
4. ⏳ 保存规则

### **下一步**

1. 完成规则2（添加Edge Cache TTL，保存）
2. 创建规则3（缓存所有其他页面）
3. 验证效果

---

**创建时间**: 2025-01-16  
**状态**: ✅ **配置基本正确，需要添加Edge Cache TTL**  
**下一步**: 添加Edge Cache TTL设置，保存规则
