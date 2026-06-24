# 🔍 从现有表查询IP地址

> **发现**: 数据库中没有`ip_logs`表，但有其他表可以查看IP  
> **现有表**: `ip_blacklist`, `abuse_scores`, `rate_limits`, `counters`  
> **方法**: 查询这些表获取IP信息

---

## 📊 **现有表分析**

从你的查询结果看到：
- `rate_limits` - 存储rate limiting信息
- `ip_blacklist` - 存储被阻止的IP
- `abuse_scores` - 存储滥用评分（包含IP）
- `counters` - 存储计数器

---

## ✅ **方法1: 查询abuse_scores表（最有用）**

### **查看所有有滥用评分的IP**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score, last_updated FROM abuse_scores ORDER BY score DESC LIMIT 100;"
```

**说明**:
- 这个表包含所有有滥用行为的IP
- 按评分排序，评分越高越可疑
- 可以找出最可疑的IP

---

### **查看高分IP（最可疑）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores WHERE score > 20 ORDER BY score DESC;"
```

**说明**:
- 只显示评分超过20的IP
- 这些IP最可疑，应该被阻止

---

## ✅ **方法2: 查询ip_blacklist表**

### **查看所有被阻止的IP**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until, offense_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY offense_count DESC;"
```

**说明**:
- 查看当前被阻止的IP
- 按违规次数排序
- 可以看到哪些IP被阻止了

---

### **查看所有IP（包括已过期的）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until, offense_count, created_at FROM ip_blacklist ORDER BY offense_count DESC LIMIT 100;"
```

---

## ✅ **方法3: 查询rate_limits表**

### **查看所有有rate limit记录的IP**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, count, reset_time FROM rate_limits ORDER BY count DESC LIMIT 100;"
```

**说明**:
- 查看所有触发rate limiting的IP
- 按请求数排序
- 可以找出请求最多的IP

---

## 🎯 **推荐查询顺序**

### **步骤1: 查看最可疑的IP（abuse_scores）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores ORDER BY score DESC LIMIT 50;"
```

**这个查询最重要**，可以找出：
- 最可疑的IP（评分最高）
- 应该被阻止的IP

---

### **步骤2: 查看请求最多的IP（rate_limits）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, count FROM rate_limits ORDER BY count DESC LIMIT 50;"
```

**可以找出**:
- 请求最多的IP
- 可能的新滥用IP

---

### **步骤3: 查看已被阻止的IP（ip_blacklist）**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, offense_count FROM ip_blacklist ORDER BY offense_count DESC LIMIT 50;"
```

**可以确认**:
- 哪些IP已经被阻止
- 是否需要延长阻止时间

---

## 📊 **分析结果并采取行动**

### **根据查询结果**

1. **如果发现高分IP（abuse_scores）**:
   - 将这些IP添加到IP Access Rules中阻止
   - 或者添加到Custom Rule的IP黑名单中

2. **如果发现请求很多的IP（rate_limits）**:
   - 检查这些IP是否可疑
   - 如果可疑，添加到黑名单

3. **如果发现已被阻止的IP（ip_blacklist）**:
   - 确认阻止是否有效
   - 如果仍然有问题，延长阻止时间

---

## ✅ **创建ip_logs表（可选，用于完整记录）**

如果你想记录所有IP（不仅仅是可疑的），可以创建`ip_logs`表：

```bash
wrangler d1 execute problems-db --remote --command="CREATE TABLE IF NOT EXISTS ip_logs (ip TEXT NOT NULL, pathname TEXT NOT NULL, user_agent TEXT, timestamp INTEGER NOT NULL, count INTEGER DEFAULT 1, last_seen INTEGER NOT NULL, PRIMARY KEY (ip, pathname, DATE(timestamp, 'unixepoch')));"
```

**然后修改middleware记录所有IP**（之前已经添加了代码）

---

## 🎯 **立即行动**

### **最重要的查询**

```bash
wrangler d1 execute problems-db --remote --command="SELECT ip, score FROM abuse_scores ORDER BY score DESC LIMIT 50;"
```

**这个查询会显示**:
- 最可疑的50个IP
- 按滥用评分排序
- 评分越高越可疑

**然后**:
- 将高分IP添加到IP Access Rules中阻止
- 或者添加到Custom Rule的IP黑名单中

---

## 📝 **总结**

### **查看IP的方法**

1. ✅ **查询abuse_scores表**（最有用，显示可疑IP）
2. ✅ **查询rate_limits表**（显示请求最多的IP）
3. ✅ **查询ip_blacklist表**（显示已被阻止的IP）

### **推荐**

- **立即执行**: 查询`abuse_scores`表，找出最可疑的IP
- **然后**: 将这些IP添加到IP Access Rules中阻止

---

**创建时间**: 2025-01-17  
**状态**: ✅ **查询方法已提供**  
**优先级**: 🟢 **高** - 这是找出可疑IP的最直接方法
