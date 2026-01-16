# 📊 请求路径分析方案（免费替代Log Explorer）

> **问题**: Cloudflare Log Explorer是付费的，Metrics没有路径细分数据
> **解决方案**: 在代码层面实现路径统计功能

---

## 🎯 **方案概述**

### **实现方式**

1. **在middleware中记录请求路径**
   - 每个请求都会记录路径到D1数据库
   - 异步执行，不影响请求性能

2. **提供API端点查看统计**
   - `/api/path-stats` - 查看路径统计（需要admin认证）

3. **路径标准化**
   - 自动分组相似路径（如`/_next/static/*`）
   - 自动分组API端点（如`/api/derivative`）

---

## 📋 **实施步骤**

### **步骤1: 创建数据库表**

执行SQL脚本创建`path_stats`表：

```bash
# 使用wrangler执行SQL
npx wrangler d1 execute problems-db --file=scripts/create_path_stats_table.sql
```

或手动执行：
```sql
CREATE TABLE IF NOT EXISTS path_stats (
    path TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (path, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_path_stats_timestamp ON path_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_path_stats_path ON path_stats(path);
```

### **步骤2: 代码已创建**

以下文件已创建：
- ✅ `utils/path-tracker.ts` - 路径跟踪工具
- ✅ `app/api/path-stats/route.ts` - 统计API端点
- ✅ `middleware.ts` - 已更新，添加路径跟踪

### **步骤3: 部署代码**

1. 提交代码到GitHub
2. Cloudflare Pages自动部署
3. 等待部署完成（5-10分钟）

### **步骤4: 查看统计**

部署完成后，访问：
```
https://derivativecalculatorai.com/api/path-stats?hours=24
```

需要admin认证（在请求头中添加admin token）。

---

## 📊 **使用示例**

### **查看24小时路径统计**

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://derivativecalculatorai.com/api/path-stats?hours=24"
```

**响应示例**:
```json
{
  "success": true,
  "period_hours": 24,
  "total_requests": 297594,
  "total_success": 297580,
  "total_error": 14,
  "paths": [
    {
      "path": "/api/derivative",
      "count": 150000,
      "success_count": 149990,
      "error_count": 10
    },
    {
      "path": "/_next/static/*",
      "count": 80000,
      "success_count": 80000,
      "error_count": 0
    },
    {
      "path": "/",
      "count": 30000,
      "success_count": 30000,
      "error_count": 0
    }
  ],
  "total_paths": 50
}
```

---

## 🔍 **路径标准化规则**

### **自动分组**

1. **Next.js静态资源**: `/_next/static/*` → `/_next/static/*`
2. **API端点**: `/api/derivative?equation=x^2` → `/api/derivative`
3. **静态文件**: `/images/logo.png` → `/*.png`
4. **其他路径**: 保持原样

### **好处**

- 减少数据库存储
- 更容易分析主要路径
- 避免路径参数导致的碎片化

---

## ⚠️ **注意事项**

### **1. 数据库存储**

**表会随时间增长**:
- 每个路径每小时一条记录
- 建议定期清理旧数据（保留7-30天）

**清理脚本**:
```sql
DELETE FROM path_stats 
WHERE timestamp < (strftime('%s', 'now') - 86400 * 7); -- 保留7天
```

### **2. 性能影响**

**异步执行**:
- 路径跟踪是异步的，不会阻塞请求
- 如果数据库操作失败，不会影响请求处理

### **3. 数据准确性**

**采样**:
- 所有请求都会被记录
- 数据是实时的（每次请求都记录）

---

## ✅ **优势**

### **相比Cloudflare Log Explorer**

1. ✅ **免费**: 使用D1数据库，不额外收费
2. ✅ **实时**: 每次请求都记录
3. ✅ **可定制**: 可以自定义路径分组规则
4. ✅ **历史数据**: 可以保留历史数据进行分析

### **相比Metrics**

1. ✅ **路径细分**: 可以看到每个路径的请求数
2. ✅ **可查询**: 可以通过API查询数据
3. ✅ **可分析**: 可以分析路径占比、错误率等

---

## 📝 **下一步**

### **立即执行**

1. ✅ **创建数据库表**: 执行SQL脚本
2. ✅ **部署代码**: 提交到GitHub，等待部署
3. ⏳ **等待数据积累**: 部署后等待几小时，让数据积累
4. ⏳ **查看统计**: 访问`/api/path-stats`查看路径分布

### **24小时后**

1. **分析路径分布**:
   - 查看哪些路径请求最多
   - 分析API请求占比
   - 分析静态资源占比

2. **根据数据优化**:
   - 如果API请求多，进一步限制
   - 如果静态资源多，优化缓存
   - 如果其他路径多，针对性优化

---

**创建时间**: 2025-01-16  
**状态**: ✅ **代码已创建，需要部署**  
**下一步**: 创建数据库表，部署代码，等待数据积累
