# 📸 截图说明

> **时间**: 2025-01-16
> **内容**: CLS问题详情和IP黑名单规则配置

---

## 📊 **截图1: CLS问题详情**

### **这是什么？**

这是Cloudflare Web Analytics的CLS（Cumulative Layout Shift）问题详情页面，显示导致布局偏移的具体元素。

### **关键信息**

**问题元素**:
- **Element**: `button.px-8.py-4.bg-blue-600.hover:bg-blue-700.text-white.font-bold.rounded-xl...`
- **CLS Score**: **0.257** ⚠️ **Poor（差）**
- **Counts**: 1次
- **Path**: `/` (首页)

**CLS百分位数**:
- CLS-P50: 0.257
- CLS-P75: 0.257
- CLS-P90: 0.257
- CLS-P99: 0.257

**布局偏移详情**:
- **Previous**: `{x: 0, y: 0, width: 0, height: 0, ...}`
- **Current**: `{x: 0, y: 0, width: 0, height: 0, ...}`

### **问题分析**

**这个button元素**:
- 是Calculator组件中的"Calculate"按钮
- 导致CLS分数0.257（Poor级别）
- 可能是因为按钮在加载时尺寸变化，导致布局偏移

**我们已经修复了这个问题**:
- ✅ 在`components/Calculator.tsx`中添加了固定高度 `h-[52px]`
- ✅ 添加了 `style={{ minHeight: '52px' }}`
- ✅ 这应该能解决CLS问题

---

## 🚫 **截图2: IP黑名单规则配置**

### **这是什么？**

这是Cloudflare WAF Custom Rules的规则配置页面，用于创建IP黑名单规则。

### **关键信息**

**规则配置**:
- **Rule name**: `Block High Traffic Bot IPs`
- **Expression**: 
  ```
  (ip.src eq 74.7.241.32) or (ip.src eq 74.7.242.57) or (ip.src eq 74.7.241.17)
  ```
- **Action**: `Block`
- **Place at**: `Last`

### **规则说明**

**这个规则的作用**:
- ✅ 阻止3个高流量bot IP地址
- ✅ 这些IP占了98.2%的请求
- ✅ 规则会在最后执行（Place at: Last）

**需要修改的地方**:
- ⚠️ **Place at应该改为更早的位置**（例如：在"Block Embed Widget"之后）
- ⚠️ 这样可以更早拦截这些IP，减少处理负担

---

## ✅ **建议的修改**

### **修改规则顺序**

**当前配置**:
- Place at: `Last`

**建议配置**:
- Place at: `Custom`
- Select which rule this will fire after: `Block Embed Widget`

**原因**:
- ✅ 这样可以更早拦截这些IP
- ✅ 减少后续规则的处理负担
- ✅ 提高拦截效率

---

## 📝 **总结**

### **截图1: CLS问题**

- ✅ 显示导致CLS问题的button元素
- ✅ CLS分数0.257（Poor）
- ✅ 我们已经修复了这个问题（添加固定高度）

### **截图2: IP黑名单规则**

- ✅ 显示正在创建的IP黑名单规则
- ✅ 规则配置正确（阻止3个高流量bot IP）
- ⚠️ 建议修改规则顺序（从Last改为Custom，在"Block Embed Widget"之后）

---

**创建时间**: 2025-01-16  
**状态**: ✅ **CLS问题已修复，IP黑名单规则配置正确**  
**建议**: 修改规则顺序，使其更早执行
