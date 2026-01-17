# 🔍 Embed路径查询（修复版）

> **问题**: Cloudflare D1 Console不支持SQL注释
> **解决方案**: 提供不带注释的SQL查询

---

## ✅ **正确的SQL查询**

### **查询1: 检查所有包含"embed"的路径**

```sql
SELECT path, SUM(count) as total_count 
FROM path_stats 
WHERE path LIKE '%embed%' 
GROUP BY path 
ORDER BY total_count DESC 
LIMIT 20;
```

---

### **查询2: 查询所有高流量路径**

```sql
SELECT path, SUM(count) as total_count 
FROM path_stats 
GROUP BY path 
ORDER BY total_count DESC 
LIMIT 50;
```

---

### **查询3: 查询最近24小时的路径分布**

```sql
SELECT path, SUM(count) as total_count 
FROM path_stats 
WHERE timestamp >= strftime('%s', 'now', '-24 hours')
GROUP BY path 
ORDER BY total_count DESC 
LIMIT 50;
```

---

## 📝 **说明**

Cloudflare D1 Console不支持SQL注释（`--`），所以查询中不能包含注释。

直接复制上面的SQL查询，不要包含任何注释。

---

**创建时间**: 2025-01-16
