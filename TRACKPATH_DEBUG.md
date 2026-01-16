# 🔍 trackPath调试指南

> **问题**: API路径没有被记录，即使从网站界面测试（返回429）
> **时间**: 2025-01-16

---

## 🔍 **问题分析**

### **当前状态**

- ✅ 从网站界面测试API（返回429错误）
- ❌ path_stats表中没有API路径记录
- ✅ 页面路径有记录（说明trackPath系统工作）

### **可能的原因**

1. **trackPath在API路由中没有执行**
   - 代码中有trackPath调用
   - 但可能执行失败或没有正确记录

2. **数据库操作失败**
   - trackPath是异步的，可能失败但没有报错
   - 需要检查是否有错误日志

3. **路径标准化问题**
   - normalizePath可能有问题
   - 导致路径不匹配

---

## 🔍 **调试步骤**

### **步骤1: 检查trackPath函数**

**当前代码**:
```typescript
export async function trackPath(path: string, statusCode: number = 200): Promise<void> {
    try {
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return; // 静默失败
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const hourTimestamp = Math.floor(timestamp / 3600) * 3600;
        const normalizedPath = normalizePath(path);

        // UPDATE first
        const updateResult = await db.prepare(`
            UPDATE path_stats 
            SET count = count + 1
            WHERE path = ? AND timestamp = ? AND status_code = ?
        `).bind(normalizedPath, hourTimestamp, statusCode).run();

        if (updateResult.meta.changes === 0) {
            // INSERT if no existing record
            await db.prepare(`
                INSERT INTO path_stats (path, timestamp, status_code, count)
                VALUES (?, ?, ?, 1)
            `).bind(normalizedPath, hourTimestamp, statusCode).run();
        }
    } catch (error) {
        console.error('[PATH_TRACKER] Error tracking path:', error);
    }
}
```

**问题**:
- 如果数据库操作失败，只是console.error，没有其他提示
- 需要检查是否有错误日志

---

## ✅ **可能的修复**

### **问题1: UPDATE语句可能有问题**

**当前UPDATE语句**:
```sql
UPDATE path_stats 
SET count = count + 1
WHERE path = ? AND timestamp = ? AND status_code = ?
```

**问题**: 
- 主键是 `(path, timestamp, status_code)`
- UPDATE应该可以工作，但可能有问题

### **问题2: 路径标准化可能有问题**

**normalizePath函数**:
```typescript
if (normalized.startsWith('/api/')) {
    const parts = normalized.split('/');
    if (parts.length >= 3) {
        return `/${parts[1]}/${parts[2]}`; // /api/derivative
    }
}
```

**检查**: 
- `/api/derivative` 应该被标准化为 `/api/derivative`
- 应该没问题

---

## 🔧 **建议的修复**

### **修复1: 添加更详细的日志**

修改trackPath函数，添加更详细的日志：

```typescript
export async function trackPath(path: string, statusCode: number = 200): Promise<void> {
    try {
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            console.warn('[PATH_TRACKER] DB not available');
            return;
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const hourTimestamp = Math.floor(timestamp / 3600) * 3600;
        const normalizedPath = normalizePath(path);

        console.log(`[PATH_TRACKER] Tracking: ${normalizedPath}, status: ${statusCode}, hour: ${hourTimestamp}`);

        // UPDATE first
        const updateResult = await db.prepare(`
            UPDATE path_stats 
            SET count = count + 1
            WHERE path = ? AND timestamp = ? AND status_code = ?
        `).bind(normalizedPath, hourTimestamp, statusCode).run();

        console.log(`[PATH_TRACKER] UPDATE result: ${updateResult.meta.changes} changes`);

        if (updateResult.meta.changes === 0) {
            // INSERT if no existing record
            const insertResult = await db.prepare(`
                INSERT INTO path_stats (path, timestamp, status_code, count)
                VALUES (?, ?, ?, 1)
            `).bind(normalizedPath, hourTimestamp, statusCode).run();

            console.log(`[PATH_TRACKER] INSERT result: ${insertResult.meta.changes} changes`);
        }
    } catch (error) {
        console.error('[PATH_TRACKER] Error tracking path:', error);
    }
}
```

### **修复2: 检查数据库连接**

确保D1数据库绑定正确。

---

## 🎯 **立即测试**

### **方法1: 检查Cloudflare Workers日志**

1. 在Cloudflare Dashboard
2. Workers & Pages → derivative-calculator-ai → Logs
3. 查看是否有 `[PATH_TRACKER]` 日志
4. 查看是否有错误信息

### **方法2: 手动测试trackPath**

创建一个测试API端点来测试trackPath：

```typescript
// app/api/test-track/route.ts
import { trackPath } from '@/utils/path-tracker';

export async function GET() {
    await trackPath('/api/test-track', 200);
    return Response.json({ success: true });
}
```

然后访问这个端点，查询path_stats表。

---

## 📊 **验证方法**

### **查询所有记录（不限制路径）**

```sql
SELECT * FROM path_stats
ORDER BY timestamp DESC
LIMIT 50;
```

查看是否有任何新的记录。

### **查询特定时间范围**

```sql
SELECT * FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-1 hour')
ORDER BY timestamp DESC;
```

---

**创建时间**: 2025-01-16  
**状态**: ⚠️ **trackPath可能没有执行，需要调试**  
**下一步**: 检查Cloudflare Workers日志，或添加更详细的日志
