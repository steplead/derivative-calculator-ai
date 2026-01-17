# 🚀 路径跟踪系统部署步骤

> **目标**: 部署路径跟踪系统，分析请求路径分布
> **状态**: 代码已提交，需要执行SQL和推送代码

---

## ✅ **步骤1: 创建数据库表**

### **方法1: 使用wrangler（推荐）**

在终端执行：

```bash
cd /Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI
npx wrangler d1 execute problems-db --file=scripts/create_path_stats_table.sql
```

### **方法2: 手动执行SQL**

1. **打开Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com

2. **进入D1数据库**
   - 左侧菜单 → **Workers & Pages** → **D1**
   - 点击 **problems-db** 数据库

3. **执行SQL**
   - 点击 **"Query"** 或 **"Console"** 标签
   - 复制以下SQL并执行：

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

---

## ✅ **步骤2: 推送代码到GitHub**

代码已提交到本地，需要推送到GitHub：

```bash
git push origin main
```

如果需要认证，输入GitHub用户名和密码（或Personal Access Token）。

---

## ✅ **步骤3: 等待Cloudflare Pages部署**

推送后，Cloudflare Pages会自动：

1. **检测代码更新**（1-2分钟）
2. **开始构建**（2-5分钟）
3. **部署**（1-2分钟）
4. **完成**（状态变为"Success"）

**总时间**: 通常5-10分钟

**检查方法**:
- Workers & Pages → derivative-calculator-ai → Deployments
- 查看最新部署状态

---

## ✅ **步骤4: 等待数据积累**

部署完成后，系统会自动开始记录请求路径。

**建议等待时间**:
- **最少**: 1小时（有基本数据）
- **推荐**: 6-12小时（有足够数据）
- **最佳**: 24小时（完整数据）

---

## ✅ **步骤5: 查看路径统计**

### **访问API端点**

```
https://derivativecalculatorai.com/api/path-stats?hours=24
```

### **需要Admin认证**

在请求头中添加admin token：

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://derivativecalculatorai.com/api/path-stats?hours=24"
```

### **响应示例**

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

## 📊 **分析数据**

### **关键指标**

1. **路径占比**:
   - 哪些路径请求最多？
   - API请求占比是多少？
   - 静态资源占比是多少？

2. **错误率**:
   - 哪些路径错误率高？
   - 是否需要优化？

3. **流量分布**:
   - 主要流量来源是什么？
   - 是否需要进一步限制？

---

## ⚠️ **注意事项**

### **1. 数据库存储**

- 表会随时间增长
- 建议定期清理旧数据（保留7-30天）

**清理脚本**:
```sql
DELETE FROM path_stats 
WHERE timestamp < (strftime('%s', 'now') - 86400 * 7); -- 保留7天
```

### **2. 性能影响**

- 路径跟踪是异步的，不会阻塞请求
- 如果数据库操作失败，不会影响请求处理

### **3. 数据准确性**

- 所有请求都会被记录
- 数据是实时的（每次请求都记录）

---

## ✅ **执行清单**

- [ ] **步骤1**: 创建数据库表（执行SQL）
- [ ] **步骤2**: 推送代码到GitHub
- [ ] **步骤3**: 等待Cloudflare Pages部署（5-10分钟）
- [ ] **步骤4**: 等待数据积累（1-24小时）
- [ ] **步骤5**: 查看路径统计（访问`/api/path-stats`）

---

**创建时间**: 2025-01-16  
**状态**: ⏳ **等待执行**  
**下一步**: 执行步骤1和步骤2
