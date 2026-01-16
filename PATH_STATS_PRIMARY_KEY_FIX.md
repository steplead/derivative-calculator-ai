# 🔧 path_stats表主键冲突问题

> **问题**: 没有403状态码记录
> **根本原因**: 数据库表主键设计问题

---

## 🔍 **问题分析**

### **当前表结构**

```sql
CREATE TABLE IF NOT EXISTS path_stats (
    path TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (path, timestamp)  -- ⚠️ 问题在这里
);
```

### **问题**

**主键是 `(path, timestamp)`**:
- 同一个路径、同一个小时只能有一条记录
- 如果先记录了200状态码，再记录403状态码，会冲突
- UPDATE会更新200的记录，INSERT会失败（主键冲突）

**示例**:
1. 请求开始时：`trackPath('/api/derivative', 200)` → INSERT成功
2. 请求被阻止：`trackPath('/api/derivative', 403)` → INSERT失败（主键冲突），UPDATE会更新200的记录

**结果**: 403状态码的记录被覆盖或丢失

---

## ✅ **解决方案**

### **方案1: 修改主键为 (path, timestamp, status_code)** ⚠️ **推荐**

**优点**:
- 可以同时记录不同状态码
- 数据更准确

**SQL**:
```sql
-- 删除旧表
DROP TABLE IF EXISTS path_stats;

-- 创建新表
CREATE TABLE path_stats (
    path TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (path, timestamp, status_code)  -- ✅ 包含status_code
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_path_stats_timestamp ON path_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_path_stats_path ON path_stats(path);
CREATE INDEX IF NOT EXISTS idx_path_stats_status ON path_stats(status_code);
```

### **方案2: 移除请求开始时的trackPath调用** ⚠️ **简单但不够准确**

**修改代码**:
- 移除请求开始时的`trackPath('/api/derivative', 200)`调用
- 只在响应时记录正确的状态码

**缺点**:
- 如果请求成功，需要确保在响应时记录
- 可能遗漏某些成功请求

---

## 🎯 **推荐方案**

### **方案1: 修改数据库表结构（推荐）**

**步骤**:
1. 在Cloudflare Dashboard的D1 Console执行：
   ```sql
   DROP TABLE IF EXISTS path_stats;
   
   CREATE TABLE path_stats (
       path TEXT NOT NULL,
       timestamp INTEGER NOT NULL,
       status_code INTEGER NOT NULL DEFAULT 200,
       count INTEGER NOT NULL DEFAULT 1,
       PRIMARY KEY (path, timestamp, status_code)
   );
   
   CREATE INDEX IF NOT EXISTS idx_path_stats_timestamp ON path_stats(timestamp);
   CREATE INDEX IF NOT EXISTS idx_path_stats_path ON path_stats(path);
   CREATE INDEX IF NOT EXISTS idx_path_stats_status ON path_stats(status_code);
   ```

2. 代码已经正确，不需要修改

**优点**:
- 可以同时记录不同状态码
- 数据更准确
- 不需要修改代码

---

## 📊 **修复后的效果**

### **修复前**

- 同一个路径、同一个小时只能有一条记录
- 403状态码的记录被200覆盖

### **修复后**

- 同一个路径、同一个小时可以有不同状态码的记录
- 可以准确统计：
  - 200状态码的请求数
  - 403状态码的请求数
  - 429状态码的请求数

---

## 🔍 **验证查询**

### **修复后可以查询**

```sql
-- 查询API路径的所有状态码
SELECT path, status_code, SUM(count) as total_count
FROM path_stats
WHERE path LIKE '/api/%'
GROUP BY path, status_code
ORDER BY path, status_code;
```

**预期结果**:
```
path                | status_code | total_count
/api/derivative     | 200         | 1000
/api/derivative     | 403         | 50
/api/derivative     | 429         | 10
/api/integral       | 200         | 800
/api/integral       | 403         | 30
```

---

**创建时间**: 2025-01-16  
**状态**: ⚠️ **需要修改数据库表结构**  
**下一步**: 在D1 Console执行SQL修改表结构
