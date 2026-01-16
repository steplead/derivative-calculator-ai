# 🔍 异常流量排查指南（详细步骤）

> **目标**: 逐一排查异常流量的来源
> **方法**: 使用SQL查询和API端点

---

## 🎯 **方法1: 使用SQL查询（直接）**

### **步骤1: 分析路径分布**

**查询**:
```sql
SELECT path, SUM(count) as total_count
FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY path
ORDER BY total_count DESC
LIMIT 50;
```

**分析**:
- 哪些路径占大部分流量？
- 是否有异常的高流量路径？

---

### **步骤2: 分析路径类别分布**

**查询**:
```sql
SELECT 
    CASE 
        WHEN path LIKE '/api/%' THEN 'API'
        WHEN path LIKE '/_next/static/%' THEN 'Static'
        WHEN path LIKE '/%.png' OR path LIKE '/%.css' OR path LIKE '/%.js' OR path LIKE '/%.woff%' OR path LIKE '/%.svg' THEN 'Static Files'
        WHEN path LIKE '/embed/%' THEN 'Embed'
        ELSE 'Pages'
    END as category,
    SUM(count) as total_count,
    COUNT(DISTINCT path) as unique_paths
FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY category
ORDER BY total_count DESC;
```

**分析**:
- 哪个类别占大部分流量？
- 是否有异常的高流量类别？

---

### **步骤3: 分析时间模式**

**查询**:
```sql
SELECT 
    strftime('%H', datetime(timestamp, 'unixepoch')) as hour,
    SUM(count) as total_count
FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY hour
ORDER BY hour;
```

**分析**:
- 哪个时间段流量最高？
- 是否有异常的时间模式？

---

### **步骤4: 分析状态码分布**

**查询**:
```sql
SELECT 
    status_code,
    SUM(count) as total_count,
    COUNT(DISTINCT path) as unique_paths
FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY status_code
ORDER BY total_count DESC;
```

**分析**:
- 是否有大量404错误？
- 是否有大量403错误？
- 是否有大量429错误？

---

### **步骤5: 分析特定高流量路径**

**查询**（以/directory为例）:
```sql
SELECT 
    path,
    status_code,
    SUM(count) as total_count,
    datetime(MIN(timestamp), 'unixepoch') as first_seen,
    datetime(MAX(timestamp), 'unixepoch') as last_seen
FROM path_stats
WHERE path = '/directory'
  AND timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY path, status_code
ORDER BY total_count DESC;
```

**分析**:
- 这个路径的请求模式是什么？
- 是否有异常的状态码？

---

## 🎯 **方法2: 使用API端点（更方便）**

### **访问流量分析API**

**URL**:
```
https://derivativecalculatorai.com/api/traffic-analysis
```

**认证**:
- 需要Admin API Key（通过`X-Admin-API-Key` header）
- 或者IP白名单

**响应**:
```json
{
  "success": true,
  "period_hours": 24,
  "analysis": {
    "path_distribution": [
      { "path": "/directory", "count": 2279 },
      { "path": "/", "count": 1990 },
      ...
    ],
    "category_distribution": [
      { "category": "Pages", "count": 12525, "unique_paths": 20 },
      { "category": "API", "count": 1, "unique_paths": 1 }
    ],
    "time_pattern": [
      { "hour": "00", "count": 500 },
      { "hour": "01", "count": 600 },
      ...
    ],
    "status_code_distribution": [
      { "status_code": 200, "count": 12000, "unique_paths": 20 },
      { "status_code": 404, "count": 100, "unique_paths": 5 }
    ],
    "top_paths": [
      {
        "path": "/directory",
        "count": 2279,
        "status_codes": [
          { "status_code": 200, "count": 2279 }
        ]
      },
      ...
    ]
  }
}
```

---

## 🔍 **根据结果分析**

### **如果发现是API请求占大部分**

**可能原因**:
- API被滥用
- 爬虫调用API

**优化**:
- 进一步降低API rate limit
- 增强API bot detection

### **如果发现是静态资源占大部分**

**可能原因**:
- 静态资源没有被缓存
- 或者缓存失效

**优化**:
- 优化静态资源缓存
- 确保所有静态资源都被缓存

### **如果发现是页面访问占大部分**

**可能原因**:
- 正常用户访问
- 搜索引擎爬虫
- 其他爬虫

**优化**:
- 在middleware中添加rate limit（已实施）
- 优化页面缓存
- 增强bot detection

### **如果发现是特定路径占大部分**

**可能原因**:
- 某个路径被频繁访问
- 可能是爬虫或滥用

**优化**:
- 针对该路径实施特殊限制
- 或者优化该路径的缓存

### **如果发现有时间模式**

**可能原因**:
- 爬虫在特定时间访问
- 或者正常用户在特定时间访问

**优化**:
- 在特定时间实施更严格的限制
- 或者优化该时间段的缓存

---

## 📝 **排查清单**

### **立即执行**

- [ ] 步骤1: 分析路径分布
- [ ] 步骤2: 分析路径类别分布
- [ ] 步骤3: 分析时间模式
- [ ] 步骤4: 分析状态码分布
- [ ] 步骤5: 分析特定高流量路径

### **根据结果优化**

- [ ] 如果发现是API请求: 进一步降低API rate limit
- [ ] 如果发现是静态资源: 优化静态资源缓存
- [ ] 如果发现是页面访问: 在middleware中添加rate limit（已实施）
- [ ] 如果发现是爬虫: 增强bot detection

---

## ✅ **总结**

### **排查方法**

1. **SQL查询**: 直接查询path_stats表
2. **API端点**: 使用/api/traffic-analysis端点

### **根据结果优化**

- 根据排查结果，针对性优化
- 不要盲目优化，要有数据支撑

---

**创建时间**: 2025-01-16  
**状态**: ✅ **系统性排查方案已创建**  
**下一步**: 执行排查步骤，根据结果优化
