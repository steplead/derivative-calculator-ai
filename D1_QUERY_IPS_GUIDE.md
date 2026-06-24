# 🔍 使用D1数据库查看所有IP - 完整指南

> **数据库**: problems-db  
> **目标**: 查询所有访问网站的IP地址  
> **方法**: 使用wrangler CLI或Cloudflare Dashboard

---

## 📊 **当前D1数据库状态**

从截图看到：
- **数据库名称**: problems-db
- **UUID**: 83d5e571-4a16-4255-a...
- **Queries**: 1.11k
- **Size**: 1.25 MB
- **Rows read**: 69.98k
- **Rows written**: 1.19k

---

## ✅ **方法1: 使用wrangler CLI查询（推荐）**

### **步骤1: 检查表是否存在**

```bash
wrangler d1 execute problems-db --command="
SELECT name FROM sqlite_master WHERE type='table' AND name='ip_logs';
"
```

**如果表不存在，需要先创建**:

```bash
wrangler d1 execute problems-db --command="
CREATE TABLE IF NOT EXISTS ip_logs (
    ip TEXT NOT NULL,
    pathname TEXT NOT NULL,
    user_agent TEXT,
    timestamp INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    last_seen INTEGER NOT NULL,
    PRIMARY KEY (ip, pathname, DATE(timestamp, 'unixepoch'))
);

CREATE INDEX IF NOT EXISTS idx_ip_logs_timestamp ON ip_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip ON ip_logs(ip);
"
```

---

### **步骤2: 查询所有IP（过去24小时）**

```bash
wrangler d1 execute problems-db --command="
SELECT 
    ip, 
    SUM(count) as total_requests,
    COUNT(DISTINCT pathname) as unique_paths,
    MAX(last_seen) as last_seen,
    GROUP_CONCAT(DISTINCT pathname) as paths
FROM ip_logs
WHERE timestamp > strftime('%s', 'now', '-24 hours')
GROUP BY ip
ORDER BY total_requests DESC
LIMIT 100;
"
```

---

### **步骤3: 查询请求最多的IP**

```bash
wrangler d1 execute problems-db --command="
SELECT 
    ip, 
    SUM(count) as total_requests,
    COUNT(DISTINCT pathname) as unique_paths,
    MAX(last_seen) as last_seen
FROM ip_logs
WHERE timestamp > strftime('%s', 'now', '-24 hours')
GROUP BY ip
ORDER BY total_requests DESC
LIMIT 50;
"
```

---

### **步骤4: 查询特定IP的详细信息**

```bash
wrangler d1 execute problems-db --command="
SELECT 
    ip,
    pathname,
    user_agent,
    count,
    timestamp,
    last_seen
FROM ip_logs
WHERE ip = '74.7.241.32'
ORDER BY timestamp DESC
LIMIT 20;
"
```

---

## ✅ **方法2: 在代码中启用IP记录**

### **检查middleware是否已记录IP**

查看 `middleware.ts` 是否已经有IP记录逻辑。如果没有，需要添加：

```typescript
import { getRequestContext } from '@cloudflare/next-on-pages';

async function logIP(ip: string, pathname: string, userAgent: string) {
    try {
        const ctx = getRequestContext();
        const db = ctx.env?.DB;
        
        if (!db) return;
        
        const timestamp = Math.floor(Date.now() / 1000);
        
        await db.prepare(
            `INSERT INTO ip_logs (ip, pathname, user_agent, timestamp, count, last_seen)
             VALUES (?, ?, ?, ?, 1, ?)
             ON CONFLICT(ip, pathname, DATE(timestamp, 'unixepoch'))
             DO UPDATE SET count = count + 1, last_seen = ?`
        ).bind(ip, pathname, userAgent, timestamp, timestamp, timestamp).run();
    } catch (e) {
        console.error('[IP_LOG] Error:', e);
    }
}
```

---

## ✅ **方法3: 创建API端点查看IP（需要管理员权限）**

### **创建API端点**

`app/api/admin/ips/route.ts`:

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAdminRequest } from '@/utils/admin-auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // 需要管理员权限
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const ctx = getRequestContext();
        const db = ctx.env?.DB;
        
        if (!db) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 });
        }
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const hours = parseInt(searchParams.get('hours') || '24');
        
        const result = await db.prepare(
            `SELECT 
                ip, 
                SUM(count) as total_requests,
                COUNT(DISTINCT pathname) as unique_paths,
                MAX(last_seen) as last_seen,
                GROUP_CONCAT(DISTINCT pathname) as paths
            FROM ip_logs
            WHERE timestamp > strftime('%s', 'now', '-${hours} hours')
            GROUP BY ip
            ORDER BY total_requests DESC
            LIMIT ?`
        ).bind(limit).all();
        
        return NextResponse.json({
            ips: result.results || [],
            total: result.results?.length || 0,
            hours: hours
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
```

### **访问API**

```
https://derivativecalculatorai.com/api/admin/ips?limit=100&hours=24
```

**需要**: 管理员认证（根据`isAdminRequest`的实现）

---

## 🎯 **快速查询命令**

### **查看所有IP（过去24小时）**

```bash
wrangler d1 execute problems-db --command="
SELECT ip, SUM(count) as requests
FROM ip_logs
WHERE timestamp > strftime('%s', 'now', '-24 hours')
GROUP BY ip
ORDER BY requests DESC;
"
```

### **查看请求最多的前10个IP**

```bash
wrangler d1 execute problems-db --command="
SELECT ip, SUM(count) as requests
FROM ip_logs
WHERE timestamp > strftime('%s', 'now', '-24 hours')
GROUP BY ip
ORDER BY requests DESC
LIMIT 10;
"
```

### **查看特定IP段的所有IP**

```bash
wrangler d1 execute problems-db --command="
SELECT ip, SUM(count) as requests
FROM ip_logs
WHERE ip LIKE '74.7.241.%'
AND timestamp > strftime('%s', 'now', '-24 hours')
GROUP BY ip
ORDER BY requests DESC;
"
```

---

## 📝 **注意事项**

### **1. 表可能不存在**

如果查询出错，说明`ip_logs`表不存在，需要先创建：

```bash
wrangler d1 execute problems-db --command="
CREATE TABLE IF NOT EXISTS ip_logs (
    ip TEXT NOT NULL,
    pathname TEXT NOT NULL,
    user_agent TEXT,
    timestamp INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    last_seen INTEGER NOT NULL,
    PRIMARY KEY (ip, pathname, DATE(timestamp, 'unixepoch'))
);
"
```

### **2. 数据可能为空**

如果表存在但没有数据，说明middleware还没有记录IP。需要：
1. 检查middleware是否有IP记录逻辑
2. 确保代码已部署
3. 等待一段时间让数据积累

### **3. 查询性能**

- 如果数据量很大，查询可能较慢
- 建议使用LIMIT限制结果数量
- 使用索引加速查询

---

## ✅ **总结**

### **查看所有IP的方法**

1. ✅ **使用wrangler CLI**（推荐，最直接）
2. ✅ **创建API端点**（需要管理员权限）
3. ✅ **使用Cloudflare Dashboard**（如果支持SQL查询）

### **推荐步骤**

1. **检查表是否存在**
2. **如果不存在，创建表**
3. **确保middleware记录IP**
4. **使用wrangler CLI查询**

---

**创建时间**: 2025-01-17  
**状态**: ✅ **完整指南已提供**  
**优先级**: 🟢 **根据需求使用**
