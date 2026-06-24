# 🔍 如何查看所有IP（客观方法）

> **目标**: 查看所有访问网站的IP地址  
> **限制**: Cloudflare免费计划不提供IP列表  
> **解决方案**: 使用代码记录或付费服务

---

## ❌ **Cloudflare免费计划的限制**

### **无法直接查看IP列表**

**Cloudflare Analytics**:
- 只显示国家/地区统计
- 不显示具体IP地址
- 免费计划限制

**Cloudflare Logs**:
- 需要Logpush服务（付费）
- 免费计划不支持

---

## ✅ **方法1: 使用代码记录IP到D1数据库（免费）**

### **步骤1: 创建D1表**

```sql
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
```

### **步骤2: 在middleware中记录IP**

修改 `middleware.ts`:

```typescript
import { getRequestContext } from '@cloudflare/next-on-pages';

async function logIP(ip: string, pathname: string, userAgent: string) {
    try {
        const ctx = getRequestContext();
        const db = ctx.env?.DB;
        
        if (!db) return;
        
        const timestamp = Math.floor(Date.now() / 1000);
        const today = new Date().toISOString().split('T')[0];
        
        // 记录IP（每天每个IP每个路径一条记录，更新count）
        await db.prepare(
            `INSERT INTO ip_logs (ip, pathname, user_agent, timestamp, count, last_seen)
             VALUES (?, ?, ?, ?, 1, ?)
             ON CONFLICT(ip, pathname, DATE(timestamp, 'unixepoch'))
             DO UPDATE SET count = count + 1, last_seen = ?`
        ).bind(ip, pathname, userAgent, timestamp, timestamp, timestamp).run();
    } catch (e) {
        // 静默失败，不影响请求
        console.error('[IP_LOG] Error:', e);
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || '';
    
    // 记录IP（异步，不阻塞）
    logIP(ip, pathname, userAgent).catch(() => {});
    
    // ... 其他代码
}
```

### **步骤3: 查询所有IP**

**使用wrangler CLI**:

```bash
# 查看所有IP（过去24小时）
wrangler d1 execute problems-db --command="
SELECT 
    ip, 
    COUNT(*) as request_count,
    SUM(count) as total_requests,
    MAX(last_seen) as last_seen,
    GROUP_CONCAT(DISTINCT pathname) as paths
FROM ip_logs
WHERE timestamp > strftime('%s', 'now', '-24 hours')
GROUP BY ip
ORDER BY total_requests DESC
LIMIT 100;
"

# 查看请求最多的IP
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

## ✅ **方法2: 使用Cloudflare Workers Analytics（有限）**

### **步骤**

1. Workers & Pages → derivative-calculator-ai → Metrics
2. 查看请求统计
3. **限制**: 不显示具体IP，只显示统计

---

## ✅ **方法3: 使用Cloudflare Logpush（付费）**

### **步骤**

1. Cloudflare Dashboard → Analytics → Logs → Logpush
2. 配置日志导出到:
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - Datadog
   - Splunk
   - 等
3. 在导出的日志中查看IP

**成本**: 需要Logpush服务（付费）

---

## ✅ **方法4: 创建API端点查看IP（简单）**

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
        
        const result = await db.prepare(
            `SELECT 
                ip, 
                SUM(count) as total_requests,
                COUNT(DISTINCT pathname) as unique_paths,
                MAX(last_seen) as last_seen,
                GROUP_CONCAT(DISTINCT pathname) as paths
            FROM ip_logs
            WHERE timestamp > strftime('%s', 'now', '-24 hours')
            GROUP BY ip
            ORDER BY total_requests DESC
            LIMIT 100`
        ).all();
        
        return NextResponse.json({
            ips: result.results || [],
            total: result.results?.length || 0
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
```

### **访问**

```
https://derivativecalculatorai.com/api/admin/ips
```

**需要**: 管理员认证（根据`isAdminRequest`的实现）

---

## 🎯 **推荐方案**

### **最简单: 使用代码记录IP到D1**

**优点**:
- ✅ 免费
- ✅ 可以查询所有IP
- ✅ 可以分析请求模式

**缺点**:
- ⚠️ 消耗D1配额
- ⚠️ 需要创建表和查询代码

### **实施步骤**

1. 创建D1表（使用wrangler CLI）
2. 修改middleware记录IP
3. 使用wrangler CLI查询IP
4. 或创建API端点查看IP

---

## 📝 **总结**

### **查看所有IP的方法**

1. ✅ **代码记录到D1**（免费，推荐）
2. ❌ **Cloudflare Analytics**（不显示IP）
3. ❌ **Cloudflare Logs**（需要付费）
4. ✅ **创建API端点**（需要管理员权限）

### **推荐**

- **最简单**: 使用代码记录IP到D1数据库
- **然后**: 使用wrangler CLI查询
- **或**: 创建API端点查看

---

**创建时间**: 2025-01-17  
**状态**: ✅ **方法已提供**  
**优先级**: 🟢 **根据需求选择**
