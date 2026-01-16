# 🔍 异常流量排查方案（系统性方法）

> **目标**: 逐一排查异常流量的来源
> **时间**: 2025-01-16
> **方法**: 系统性分析，逐步缩小范围

---

## 🎯 **排查步骤（按优先级）**

### **步骤1: 分析路径分布** ✅ **最重要**

**目的**: 找出哪些路径占大部分流量

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
- 是否有重复的路径？

---

### **步骤2: 分析路径类别分布** ✅ **重要**

**目的**: 看API、静态资源、页面访问的占比

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

### **步骤3: 分析时间模式** ✅ **重要**

**目的**: 看流量是否有时间模式（爬虫通常在特定时间）

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
- 是否在特定时间有大量请求？

---

### **步骤4: 分析状态码分布** ✅ **有用**

**目的**: 看是否有大量错误请求（404、403等）

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

### **步骤5: 分析特定高流量路径** ✅ **有用**

**目的**: 深入分析高流量路径

**查询**（以/directory为例）:
```sql
SELECT 
    path,
    status_code,
    SUM(count) as total_count,
    MIN(timestamp) as first_seen,
    MAX(timestamp) as last_seen
FROM path_stats
WHERE path = '/directory'
  AND timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY path, status_code
ORDER BY total_count DESC;
```

**分析**:
- 这个路径的请求模式是什么？
- 是否有异常的状态码？
- 是否有异常的时间模式？

---

## 🔍 **高级排查方法**

### **方法1: 使用Cloudflare Workers日志**

**如果可用**:
- 查看Cloudflare Workers日志
- 分析User-Agent
- 分析IP分布
- 分析Referer

**步骤**:
1. 在Cloudflare Dashboard → Workers & Pages → derivative-calculator-ai → Logs
2. 查看最近的日志
3. 分析User-Agent、IP、Referer

---

### **方法2: 创建详细的日志记录**

**可以添加**:
- 记录User-Agent
- 记录IP地址
- 记录Referer
- 记录请求时间

**实施**:
- 在middleware或API路由中添加详细日志
- 存储到D1数据库
- 分析日志数据

---

### **方法3: 使用Cloudflare Log Explorer（付费）**

**如果可用**:
- 使用Cloudflare Log Explorer
- 实时查看请求日志
- 分析User-Agent、IP、Referer
- 过滤和分析特定请求

---

## 📊 **排查清单**

### **立即执行**

- [ ] 步骤1: 分析路径分布
- [ ] 步骤2: 分析路径类别分布
- [ ] 步骤3: 分析时间模式
- [ ] 步骤4: 分析状态码分布
- [ ] 步骤5: 分析特定高流量路径

### **如果数据不足**

- [ ] 方法1: 使用Cloudflare Workers日志
- [ ] 方法2: 创建详细的日志记录
- [ ] 方法3: 使用Cloudflare Log Explorer（付费）

---

## 🎯 **根据排查结果优化**

### **如果发现是API请求**

**优化**:
- 进一步降低API rate limit
- 增强API bot detection

### **如果发现是静态资源**

**优化**:
- 优化静态资源缓存
- 确保所有静态资源都被缓存

### **如果发现是页面访问**

**优化**:
- 在middleware中添加rate limit（已实施）
- 优化页面缓存

### **如果发现是爬虫**

**优化**:
- 增强bot detection
- 更严格地阻止爬虫

---

## 📝 **总结**

### **排查步骤**

1. **路径分布**: 找出高流量路径
2. **类别分布**: 看API、静态资源、页面访问的占比
3. **时间模式**: 看是否有异常的时间模式
4. **状态码分布**: 看是否有大量错误请求
5. **特定路径**: 深入分析高流量路径

### **根据结果优化**

- 根据排查结果，针对性优化
- 不要盲目优化，要有数据支撑

---

**创建时间**: 2025-01-16  
**状态**: ✅ **系统性排查方案**  
**下一步**: 执行排查步骤，根据结果优化
