# 📊 path_stats表查询语句

> **注意**: Cloudflare D1 Console可能不支持SQL注释，请单独执行查询语句

---

## ✅ **正确的查询语句（无注释）**

### **查询1: API路径的所有状态码**

```sql
SELECT path, status_code, SUM(count) as total_count
FROM path_stats
WHERE path LIKE '/api/%'
GROUP BY path, status_code
ORDER BY path, status_code;
```

### **查询2: API路径统计（按路径汇总）**

```sql
SELECT path, SUM(count) as total_count
FROM path_stats
WHERE path LIKE '/api/%'
GROUP BY path
ORDER BY total_count DESC;
```

### **查询3: 所有路径的最新记录**

```sql
SELECT * FROM path_stats
ORDER BY timestamp DESC
LIMIT 50;
```

### **查询4: 路径分布（按类别）**

```sql
SELECT 
    CASE 
        WHEN path LIKE '/api/%' THEN 'API'
        WHEN path LIKE '/_next/static/%' THEN 'Static'
        WHEN path LIKE '/%.png' OR path LIKE '/%.css' OR path LIKE '/%.js' THEN 'Static Files'
        ELSE 'Pages'
    END as category,
    SUM(count) as total_count
FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY category
ORDER BY total_count DESC;
```

### **查询5: 状态码分布**

```sql
SELECT status_code, SUM(count) as total_count
FROM path_stats
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY status_code
ORDER BY status_code;
```

### **查询6: API路径的详细统计**

```sql
SELECT 
    path,
    status_code,
    SUM(count) as total_count,
    datetime(MIN(timestamp), 'unixepoch') as first_seen,
    datetime(MAX(timestamp), 'unixepoch') as last_seen
FROM path_stats
WHERE path LIKE '/api/%'
GROUP BY path, status_code
ORDER BY path, status_code;
```

---

## ⚠️ **注意事项**

### **Cloudflare D1 Console限制**

1. **不支持SQL注释**: 不要在SQL语句中使用 `--` 注释
2. **一次执行一条语句**: 如果需要执行多条语句，请分开执行
3. **时间戳格式**: 使用Unix时间戳（秒）

---

## 🎯 **推荐查询顺序**

### **步骤1: 检查是否有API路径记录**

```sql
SELECT path, status_code, SUM(count) as total_count
FROM path_stats
WHERE path LIKE '/api/%'
GROUP BY path, status_code
ORDER BY path, status_code;
```

### **步骤2: 如果仍然没有数据，检查所有最新记录**

```sql
SELECT * FROM path_stats
ORDER BY timestamp DESC
LIMIT 20;
```

### **步骤3: 从网站界面实际使用API**

1. 访问 `https://derivativecalculatorai.com`
2. 使用计算器功能
3. 等待几分钟后再次查询

---

**创建时间**: 2025-01-16  
**状态**: ✅ **提供正确的查询语句**  
**下一步**: 执行查询1，检查API路径记录
