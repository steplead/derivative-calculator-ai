# 🔍 trackPath 403响应未记录问题

> **问题**: API请求返回403，但path_stats表中没有403记录
> **时间**: 2025-01-16

---

## 🔍 **问题分析**

### **查询结果**

```sql
SELECT * FROM path_stats WHERE status_code = 403 ORDER BY timestamp DESC LIMIT 20;
```

**结果**: 无数据

### **这意味着**

1. ❌ 即使API请求被bot检测阻止（返回403），trackPath也没有记录
2. ❌ trackPath在403响应时可能没有被调用，或者调用失败了
3. ❌ 需要检查代码逻辑

---

## 🔍 **代码检查**

### **当前代码逻辑**

```typescript
export async function GET(req: NextRequest) {
    // 1. 请求开始时记录（200状态码）
    trackPath('/api/derivative', 200).catch(...);
    
    if (!expression) {
        trackPath('/api/derivative', 400).catch(...);
        return NextResponse.json({ error: ... }, { status: 400 });
    }
    
    // 2. 安全检查
    const securityResult = await performSecurityCheck(...);
    
    // 3. 如果被阻止，记录403
    if (!securityResult.success) {
        trackPath('/api/derivative', securityResult.blocked ? 403 : 429).catch(...);
        return NextResponse.json({ error: ... }, { status: ... });
    }
    
    // 4. 成功处理...
}
```

### **问题**

**trackPath在请求开始时调用（200状态码）**:
- 即使请求后来被阻止，也会先记录200
- 然后在403响应时再次调用trackPath（403状态码）
- 但可能403的trackPath调用失败了

---

## ⚠️ **可能的原因**

### **原因1: trackPath在403响应时调用失败**

**可能**:
- trackPath是异步的，可能在响应返回后才执行
- 或者执行失败但没有报错

### **原因2: 时间戳分组问题**

**可能**:
- 200和403的记录在同一个小时
- UPDATE语句可能只更新了200的记录，没有插入403的记录

### **原因3: 路径标准化问题**

**可能**:
- normalizePath可能有问题
- 导致路径不匹配

---

## ✅ **解决方案**

### **方案1: 移除请求开始时的trackPath调用**

**问题**: 
- 请求开始时记录200，但请求可能被阻止
- 导致记录不准确

**解决**:
- 只在响应时记录路径
- 记录正确的状态码

### **方案2: 确保403响应时trackPath被调用**

**检查**:
- 确保trackPath在403响应时被调用
- 确保trackPath执行成功

### **方案3: 修复时间戳分组逻辑**

**问题**:
- 同一个路径、同一个小时、不同状态码可能冲突
- 需要按(path, timestamp, status_code)分组

---

## 🔧 **建议的修复**

### **修复1: 移除请求开始时的trackPath调用**

```typescript
export async function GET(req: NextRequest) {
    // ❌ 移除这行
    // trackPath('/api/derivative', 200).catch(...);
    
    if (!expression) {
        trackPath('/api/derivative', 400).catch(...);
        return NextResponse.json({ error: ... }, { status: 400 });
    }
    
    const securityResult = await performSecurityCheck(...);
    
    if (!securityResult.success) {
        trackPath('/api/derivative', securityResult.blocked ? 403 : 429).catch(...);
        return NextResponse.json({ error: ... }, { status: ... });
    }
    
    // 成功时记录200
    trackPath('/api/derivative', 200).catch(...);
    return NextResponse.json({ result: ... }, { status: 200 });
}
```

### **修复2: 修复数据库表结构**

**当前表结构**:
```sql
PRIMARY KEY (path, timestamp)
```

**问题**: 同一个路径、同一个小时、不同状态码会冲突

**建议**: 改为
```sql
PRIMARY KEY (path, timestamp, status_code)
```

或者分别记录不同状态码。

---

## 🎯 **立即测试**

### **从网站界面实际使用API**

1. 访问 `https://derivativecalculatorai.com`
2. 使用计算器功能（输入方程式，如 `x^2`）
3. 点击计算
4. 等待几分钟
5. 查询path_stats表

这样可以触发真实的浏览器请求，不会被bot检测阻止，应该返回200状态码。

---

## 📊 **验证方法**

### **查询所有API路径（不限制状态码）**

```sql
SELECT path, timestamp, status_code, count 
FROM path_stats 
WHERE path LIKE '/api/%'
ORDER BY timestamp DESC;
```

### **查询所有非200状态码的记录**

```sql
SELECT path, timestamp, status_code, count 
FROM path_stats 
WHERE status_code != 200
ORDER BY timestamp DESC 
LIMIT 20;
```

---

**创建时间**: 2025-01-16  
**状态**: ⚠️ **trackPath在403响应时未记录，需要修复**  
**下一步**: 修复代码，移除请求开始时的trackPath调用，只在响应时记录
