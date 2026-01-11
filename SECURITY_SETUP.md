# 🔒 安全层部署指南 / Security Deployment Guide

## 概述 / Overview

此更新实现了**统一安全层**，彻底解决 API 盗用问题。

This update implements a **Unified Security Layer** to completely solve the API abuse problem.

---

## 🚀 快速开始 / Quick Start

### 1. 设置 D1 数据库表 / Set up D1 Database Tables

```bash
# 运行安全设置脚本 / Run the security setup script
./scripts/setup-security.sh
```

或手动执行 / Or manually execute:

```bash
# 创建安全表 / Create security tables
wrangler d1 execute problems-db --file=./scripts/security_tables.sql
```

### 2. 部署应用 / Deploy Application

```bash
# 构建项目 / Build project
npm run build

# 部署到 Cloudflare Pages / Deploy to Cloudflare Pages
npm run deploy
```

### 3. 验证部署 / Verify Deployment

```bash
# 测试 API / Test API
curl "https://derivative-calculator-ai.com/api/derivative?equation=x^2"

# 检查响应中的版本号 / Check version in response
# 应该看到: "_version": "v3.0-unified-security"
# Should see: "_version": "v3.0-unified-security"
```

---

## 🛡️ 安全功能详解 / Security Features Explained

### 1. IP 黑名单 / IP Blacklist

**功能 / Feature:**
- 自动封禁恶意 IP（滥用分数 ≥ 100）
- 递进式封禁时长：5分钟 → 30分钟 → 24小时 → 7天

**表结构 / Table Schema:**
```sql
CREATE TABLE ip_blacklist (
    ip TEXT PRIMARY KEY,
    blocked_until INTEGER NOT NULL,
    reason TEXT NOT NULL,
    offense_count INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
```

**监控 / Monitor:**
```bash
# 查看被封禁的 IP / View blocked IPs
wrangler d1 execute problems-db --command="SELECT ip, reason, blocked_until FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now');"
```

### 2. 滥用评分系统 / Abuse Scoring System

**功能 / Feature:**
- 每个 IP 有一个滥用分数
- 分数随时间衰减（每小时减少 50%）
- 触发阈值后自动封禁

**评分规则 / Scoring Rules:**
| 违规类型 / Violation Type | 扣分 / Points |
|---|---|
| Bot 检测失败 / Bot Detection Failed | +30 |
| Rate Limit 超限 / Rate Limit Exceeded | +20 |
| 无效 Turnstile / Invalid Turnstile | +50 |
| **封禁阈值 / Block Threshold** | **≥ 100** |

**监控 / Monitor:**
```bash
# 查看高风险 IP / View high-risk IPs
wrangler d1 execute problems-db --command="SELECT ip, score FROM abuse_scores WHERE score > 50 ORDER BY score DESC LIMIT 10;"
```

### 3. D1 Rate Limiting

**功能 / Feature:**
- 持久化 Rate Limiting（跨所有实例）
- 每个窗口 20 次请求
- 高风险 IP 自动降至 5 次/窗口

**表结构 / Table Schema:**
```sql
CREATE TABLE rate_limits (
    ip TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_time INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 4. 增强 Bot 检测 / Enhanced Bot Detection

**检测信号 / Detection Signals:**
- ✅ User-Agent 验证
- ✅ Accept Header 验证
- ✅ Accept-Language 验证
- ✅ Sec-Fetch-* Headers 验证
- ✅ Referer 验证
- ✅ 现代浏览器特征检测

### 5. Turnstile 验证 / Turnstile Verification

**功能 / Feature:**
- 支持 Cloudflare Turnstile CAPTCHA
- 验证成功后清除滥用分数
- 可选强制验证模式

---

## 🔧 管理命令 / Management Commands

### 查看统计 / View Statistics

```bash
# 当前被封禁的 IP 数量 / Count of currently blocked IPs
wrangler d1 execute problems-db --command="SELECT COUNT(*) as blocked_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now');"

# 高风险 IP 数量 / Count of high-risk IPs
wrangler d1 execute problems-db --command="SELECT COUNT(*) as high_risk_count FROM abuse_scores WHERE score > 50;"

# 最近被封禁的 IP / Recently blocked IPs
wrangler d1 execute problems-db --command="SELECT ip, reason, blocked_until, offense_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY blocked_until DESC LIMIT 20;"
```

### 手动管理 IP / Manual IP Management

```bash
# 手动封禁 IP / Manually block an IP
wrangler d1 execute problems-db --command="INSERT INTO ip_blacklist (ip, blocked_until, reason, offense_count, created_at) VALUES ('1.2.3.4', strftime('%s', 'now') + 86400, 'Manual block', 1, strftime('%s', 'now'));"

# 解除封禁 / Unblock an IP
wrangler d1 execute problems-db --command="DELETE FROM ip_blacklist WHERE ip = '1.2.3.4';"

# 清除滥用分数 / Clear abuse score
wrangler d1 execute problems-db --command="DELETE FROM abuse_scores WHERE ip = '1.2.3.4';"
```

### 清理旧数据 / Cleanup Old Data

```bash
# 删除过期的封禁记录 / Delete expired blocks
wrangler d1 execute problems-db --command="DELETE FROM ip_blacklist WHERE blocked_until < strftime('%s', 'now');"

# 删除旧的滥用分数（7天前）/ Delete old abuse scores (7 days)
wrangler d1 execute problems-db --command="DELETE FROM abuse_scores WHERE last_updated < strftime('%s', 'now') - 604800;"

# 删除旧的 rate limit 记录（1天前）/ Delete old rate limit entries (1 day)
wrangler d1 execute problems-db --command="DELETE FROM rate_limits WHERE reset_time < strftime('%s', 'now') - 86400;"
```

---

## 📊 监控和日志 / Monitoring & Logging

### Cloudflare Analytics

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → derivative-calculator-ai
3. 查看 Metrics 和 Logs

### 日志关键词 / Log Keywords

在 Cloudflare Analytics 中搜索以下关键词 / Search for these keywords in Cloudflare Analytics:
- `[BOT_BLOCKED]` - Bot 被拦截 / Bot blocked
- `[BLOCKED_IP]` - IP 被封禁 / IP blocked
- `[RATE_LIMIT]` - Rate limit 超限 / Rate limit exceeded
- `[IP_BLOCKED]` - IP 添加到黑名单 / IP added to blacklist

---

## ⚙️ 配置选项 / Configuration Options

编辑 `utils/security.ts` 中的配置 / Edit configuration in `utils/security.ts`:

```typescript
const SECURITY_CONFIG = {
    RATE_LIMIT: {
        DEFAULT_LIMIT: 20,        // 默认请求限制 / Default request limit
        DEFAULT_WINDOW: 60,       // 时间窗口（秒）/ Time window (seconds)
        STRICT_LIMIT: 5,          // 严格模式限制 / Strict mode limit
        STRICT_WINDOW: 60,        // 严格模式窗口 / Strict mode window
    },
    ABUSE_SCORING: {
        BLOCK_THRESHOLD: 100,     // 封禁阈值 / Block threshold
        DECAY_INTERVAL: 3600,     // 衰减间隔（秒）/ Decay interval (seconds)
        DECAY_AMOUNT: 0.5,        // 衰减系数 / Decay factor
    },
    TURNSTILE: {
        REQUIRED: false,          // 是否强制验证 / Require verification
    },
};
```

---

## 🔍 故障排除 / Troubleshooting

### 问题：D1 数据库不可用 / Issue: D1 Database Not Available

**症状 / Symptom:**
```
[SECURITY_ERROR] D1 database not available
```

**解决方案 / Solution:**
1. 检查 `wrangler.toml` 中的 D1 绑定配置
2. 确认 D1 数据库已创建
3. 验证环境变量配置

### 问题：Rate limiting 失败 / Issue: Rate Limiting Fails

**症状 / Symptom:**
所有请求都被拒绝 / All requests are rejected

**解决方案 / Solution:**
```bash
# 检查 rate_limits 表是否存在 / Check if rate_limits table exists
wrangler d1 execute problems-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name='rate_limits';"

# 如果不存在，重新运行设置脚本 / If not exists, re-run setup script
./scripts/setup-security.sh
```

### 问题：合法用户被封禁 / Issue: Legitimate Users Blocked

**症状 / Symptom:**
正常用户报告被拒绝访问 / Normal users report being blocked

**解决方案 / Solution:**
```bash
# 解除特定 IP 的封禁 / Unblock specific IP
wrangler d1 execute problems-db --command="DELETE FROM ip_blacklist WHERE ip = 'USER_IP_ADDRESS';"

# 检查该 IP 的违规记录 / Check violation history
wrangler d1 execute problems-db --command="SELECT * FROM abuse_scores WHERE ip = 'USER_IP_ADDRESS';"
```

---

## 📈 预期效果 / Expected Results

部署后，你应该看到 / After deployment, you should see:

1. **请求量下降 / Reduced Request Volume**: 294k → 预计 50k-100k/天
2. **错误率降低 / Lower Error Rate**: 14 errors → 接近 0
3. **CPU 时间减少 / Reduced CPU Time**: 6.33k GB-sec → 预计 < 2k GB-sec/天
4. **成本节约 / Cost Savings**: 预计节省 60-80% Workers 计算成本

---

## 🎯 下一步 / Next Steps

1. ✅ 运行数据库设置脚本 / Run database setup script
2. ✅ 部署到生产环境 / Deploy to production
3. ✅ 监控前 24 小时的指标 / Monitor metrics for first 24 hours
4. ✅ 根据实际情况调整配置 / Adjust configuration based on actual data
5. ✅ 设置自动化清理任务 / Set up automated cleanup tasks

---

## 📞 支持 / Support

如有问题，请检查 / If you have issues, please check:
- Cloudflare D1 文档 / [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- Cloudflare Workers 文档 / [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- 项目 Issues / [Project Issues](https://github.com/your-repo/issues)
