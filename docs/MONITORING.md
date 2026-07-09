# Monitoring & Runbook — Derivative Calculator AI

> 2026-07-09 | Phase 5B-lite — 轻量监控闭环

---

## 1. 线上状态基线 (2026-07-09)

| # | 检查项 | URL | 期望 | 实际 | cf-cache | 结果 |
|---|--------|-----|------|------|----------|------|
| 1 | 首页 | `/` | 200 | 200 | HIT (页面缓存) | PASS |
| 2 | 积分页 | `/integral` | 200 | 200 | — | PASS |
| 3 | 极限页 | `/limit` | 200 | 200 | — | PASS |
| 4 | ODE页 | `/ode` | 200 | 200 | — | PASS |
| 5 | API 求导 | `/api/derivative?equation=sin(x)` | 200 | 200 | DYNAMIC | PASS |
| 6 | API 缓存旁路 | `/api/derivative?equation=x%5E2` | 200 | 200 | DYNAMIC (非HIT) | PASS |
| 7 | Admin health 无 token | `/api/admin/health` | 401 | 401 | DYNAMIC | PASS |
| 8 | 废弃端点 | `/api/unblock-ip` | 410 | 410 | DYNAMIC | PASS |
| 9 | 400 不缓存 | `/api/derivative` (无参数) | 400 | 400 | DYNAMIC | PASS |
| 10 | 405 不缓存 | POST `/api/derivative` | 405 | 405 | DYNAMIC | PASS |

**结论**: 10/10 PASS。CF Cache Rule "API bypass cache" 正常。错误响应携带 no-store，不被 CDN 缓存。

---

## 2. 外部监控方案

### UptimeRobot 免费版 (always-on 云端监控)

| 字段 | 值 |
|------|-----|
| Monitor Type | HTTP(s) |
| Friendly Name | DCAI Homepage |
| URL | `https://derivativecalculatorai.com/` |
| Monitoring Interval | 5 minutes |

**告警**: Email 通知。可选 Slack/Discord Webhook。

**为什么只监控首页**: UptimeRobot 免费版不支持自定义 UA/Referer/Authorization。首页 200 = Pages 正常 + DNS 正常 + CDN 正常。最深检查用本地脚本。

### 本地健康检查脚本 (`scripts/health-check.sh`)

```bash
# 表格输出
./scripts/health-check.sh

# JSON 输出 (日志/CI)
./scripts/health-check.sh --json

# 带 webhook 告警
./scripts/health-check.sh --webhook https://hooks.slack.com/services/xxx

# 带 admin token 深度检查
ADMIN_MONITORING_TOKEN=your_token ./scripts/health-check.sh
```

**Cron (可选)**:
```bash
*/30 * * * * /path/to/scripts/health-check.sh --json >> /tmp/dcai-health.log 2>&1
```

**约束**:
- 请求间隔 2 秒，避免触发 D1 rate limit
- API 请求 timeout 30 秒 (OpenRouter 可能耗时 15-20s)
- 不记录原始 IP/UA/token，纯只读，零副作用

---

## 3. 告警分级

| 级别 | 触发条件 | 响应时间 | 告警渠道 |
|------|---------|---------|---------|
| P0 — 全站宕机 | 首页 502/503/timeout | 立即 | UptimeRobot Email + Webhook |
| P1 — API 不可用 | /api/derivative != 200 | 30 分钟内 | 本地脚本 Webhook |
| P2 — 缓存异常 | API cf-cache-status=HIT | 1 小时内 | 本地脚本 |
| P3 — 降级运行 | Admin health 报 degraded | 4 小时内 | 本地脚本日志 |

---

## 4. 24/48/72 小时观察清单

### 前 24 小时 (2026-07-09 → 2026-07-10)

在 UptimeRobot 注册 + cron 上线后，逐项核实：

- [ ] UptimeRobot 已注册账号并添加首页监控器 (5min 间隔)
- [ ] UptimeRobot Dashboard 显示首页 100% Uptime (首次数据 lag ~15min)
- [ ] 确认 Email 告警联系人已验证 (UptimeRobot → Alert Contacts → Verify)
- [ ] `./scripts/health-check.sh` 手动跑一次，10/10 PASS
- [ ] `curl -sS -o /dev/null -D - https://derivativecalculatorai.com/api/derivative?equation=x \| grep cf-cache-status` 确认输出 DYNAMIC（非 HIT）
- [ ] `curl -sS -o /dev/null -w "%{http_code}" https://derivativecalculatorai.com/api/admin/health` 确认 401（fail-closed）
- [ ] 首页在浏览器中正常加载：计算器输入框可用，输入 `x^2` 能显示结果
- [ ] 等待 30 分钟后重新跑一次 health-check.sh，确认无降级趋势

**如果全部通过**: 系统进入 24h 稳定期。如果任一项失败：走对应 Runbook。

### 第 24–48 小时 (2026-07-10 → 2026-07-11)

这一天的重点是判断"有没有隐性降级"：

- [ ] UptimeRobot 24h 内无任何 Downtime 记录（允许单次 <1min 的网络波动，连续 2+ 次才报警）
- [ ] health-check.sh 跑 3 次（早上、中午、晚上），10/10 PASS
- [ ] 检查 admin/health 的 `checks.d1.latencyMs`：
  - `<100ms` → 正常
  - `100–500ms` → 关注，48h 内复检
  - `>500ms` → 需要排查 D1 表是否过大
- [ ] 检查 admin/health 的 `checks.d1_tables.detail`：
  - `rate_limits` 和 `abuse_scores` 行数是否在可预期范围内
- [ ] 检查 admin/health 的 `checks.openrouter.ok` → 必须为 true
- [ ] 检查 admin/health 的 `checks.redis.ok` → 必须为 true
- [ ] 在浏览器中测试 `/integral`, `/limit`, `/ode` 页面是否正常渲染
- [ ] 确认无新的 abuse IP 被封禁（需 admin/diagnostic 端点，如有）

**如果全部通过**: 系统状态稳定，D1/Redis/OpenRouter 三方依赖健康。

### 第 48–72 小时 (2026-07-11 → 2026-07-12)

这是最终确认阶段——三天数据够判断系统是否真正稳定：

- [ ] UptimeRobot 72h 累计 Uptime ≥ 99.9%（允许不到 5 分钟的波动）
- [ ] health-check.sh 每天至少跑 1 次，72h 内零 FAIL
- [ ] admin/health `d1.latencyMs` 趋势：是否随时间增长？
  - 如果从 50ms → 500ms → 1000ms 直线上升 → D1 表需要清理（未来 Phase）
  - 如果稳定在 <100ms → OK
- [ ] 检查 CF Dashboard → D1 → Usage：
  - Rows read/day 是否接近 500 万 (免费版限制)？
  - Rows written/day 是否接近 10 万？
  - 如果接近上限 → 需要优化 rate limit 逻辑或升级 Plan
- [ ] 检查 CF Dashboard → Workers & Pages → derivative-calculator-ai → Analytics
  - 过去 72h 请求量趋势是否平滑（无异常尖峰）？
  - 429 错误率是否 <2%？
- [ ] 确认 admin endpoint 没有被外部扫描（无陌生 Bearer token 尝试记录）
- [ ] 一周内没有收到用户反馈的 403/429 误封

**如果全部通过**: **系统正式进入维护模式。** 此后只需：
- UptimeRobot 持续监控（自动）
- health-check.sh 按需或低频率运行（如每周一次）
- 有新部署后再跑一次 health-check.sh

**如果任一项失败**: 走对应 Runbook (Section 5)。

---

## 5. 维护模式日常检查清单

72h 确认通过后，进入低维护节奏：

| 频率 | 动作 |
|------|------|
| 持续 | UptimeRobot 首页监控 (自动) |
| 每次部署后 | `./scripts/health-check.sh` |
| 每周 | 手动跑一次 health-check.sh + 看一眼 admin/health |
| 每月 | 检查 CF D1 Usage 配额消耗趋势 |
| 触发式 | UptimeRobot 告警 → 立即排查 |

---

## 6. Runbook

### Scenario 1: 首页 502/503/timeout (P0)

**症状**: UptimeRobot 报首页不可访问

1. 本地验证: `curl -sS -o /dev/null -w "%{http_code}" https://derivativecalculatorai.com/`
2. CF Dashboard → Pages → derivative-calculator-ai → Deployments：最近部署是否成功？
3. GitHub Actions：最近 push CI 是否通过？
4. Cloudflare Status: https://www.cloudflarestatus.com/

**修复**:
- 部署失败: 找到最后一个成功 deployment → Rollback
- CF 故障: 等待恢复
- 代码问题: 本地 `npm run build && npm run pages:build` → 修复 → push

---

### Scenario 2: API 500 或超时 (P1)

**症状**: `/api/derivative` 返回 500 或超时

1. 带 token 查健康: `curl -sS -H "Authorization: Bearer $ADMIN_MONITORING_TOKEN" https://derivativecalculatorai.com/api/admin/health`
2. 检查 `checks.openrouter.ok` → OpenRouter 状态: https://openrouter.ai/status
3. 检查 `checks.d1.ok` 和 `checks.d1.latencyMs`
4. 检查 D1 配额: CF Dashboard → D1 → Usage

**修复**:
- OpenRouter down: AI 解释自动降级，计算器仍可用
- D1 超配额: 等待 UTC 0 点重置，或升级 Plan
- D1 连接失败: 检查 Pages binding

---

### Scenario 3: API 返回 403 (误封用户) (P0)

**症状**: 真实浏览器用户报告 403

1. 用浏览器 UA 验证: `curl -sS -o /dev/null -w "%{http_code}" -H "User-Agent: Mozilla/5.0 ..." -H "Referer: https://derivativecalculatorai.com/" "https://derivativecalculatorai.com/api/derivative?equation=sin(x)"`
2. 如果 403: 检查 `utils/turnstile.ts` 的 `looksLikeLegitimateBrowser()`
   - 是否有新增的过宽 UA 模式？
   - referer 检查是否过于严格？
3. Abuse 评分: `looksLikeLegitimateBrowser` false → +20 分，≥30 分 → 403。2 次误判就封 IP。

**修复**:
- 修改 `looksLikeLegitimateBrowser()` 移除过宽模式
- UA 黑名单不要写 `bot/crawler/spider`
- 不要检查 referer 是否为"纯域名"
- `npm run build && npm run pages:build` → push

---

### Scenario 4: 429 Rate Limit 异常 (P2)

**症状**: 正常用户频繁遇到 429

1. 确认配置: 页面 30/min, API 20/min
2. 带 token 查 admin/health，确认 D1 正常
3. 是否有滥用流量？

**修复**:
- rate limit 不要设 1/min (锁死正常用户)
- 如果 D1 `rate_limits` 表过大: 需清理（本 phase 不做）

---

### Scenario 5: CF Cache Rule 失效 (P2)

**症状**: API 响应 cf-cache-status=HIT

1. 验证: `curl -sS -o /dev/null -D - -H "User-Agent: Mozilla/5.0 ..." -H "Referer: https://derivativecalculatorai.com/" "https://derivativecalculatorai.com/api/derivative?equation=x" | grep cf-cache-status`
2. CF Dashboard → Rules → Cache Rules → "API bypass cache"：存在且 Active？
3. 表达式: `http.host eq "derivativecalculatorai.com" and starts_with(http.request.uri.path, "/api/")`

**修复**: 重新创建 Bypass Cache 规则。CF Pages 会覆盖 API 200 的 Cache-Control，必须依赖 Cache Rule。

---

### Scenario 6: OpenRouter AI 失败 (P3)

**症状**: 计算正常但无 AI 步骤讲解

1. admin/health 查 `openrouter.ok`
2. CF Dashboard → Pages → Settings → Env Vars → `OPENROUTER_API_KEY`
3. OpenRouter 余额: https://openrouter.ai/credits
4. OpenRouter status: https://openrouter.ai/status

**修复**:
- `includeAi` 用 `!!process.env.OPENROUTER_API_KEY` 控制，不要硬编码 false
- API key 丢失: CF Dashboard 重新配置
- 余额不足: 充值
- OpenRouter down: 等待，计算器核心功能不受影响

---

### Scenario 7: D1 数据库问题 (P1)

**症状**: admin/health `checks.d1.ok: false`

1. 查 `checks.d1.detail`: "connection error" = binding 问题，"unexpected result" = 查询异常
2. `checks.d1.latencyMs`: 正常 <100ms，异常 >1000ms
3. `checks.d1_tables.detail`: 检查表大小

**修复**: D1 binding 问题 → CF Pages Settings。超配额 → 等重置或升级。表过大 → 未来 phase 清理。

---

### Scenario 8: Redis/Upstash 不可用 (P3)

**症状**: admin/health `checks.redis.ok: false`

**影响**: Rate limiting 降级到 D1 (功能不受影响，D1 负载增加)

1. admin/health `checks.redis.detail`
2. Upstash console: https://console.upstash.com/
3. 确认 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` env vars

**修复**: Redis 不可用时自动 fallback 到 D1。检查 Upstash 配额。Env var 丢失 → CF Dashboard 重新配置。

---

## 7. 关键信息速查

| 项目 | 值 |
|------|-----|
| 域名 | `derivativecalculatorai.com` |
| CF 项目名 | `derivative-calculator-ai` |
| 框架 | Next.js 14.2.16 + @cloudflare/next-on-pages |
| 部署产物 | `.vercel/output/static` |
| CI/CD | `.github/workflows/deploy.yml` (push to main) |
| D1 | DB (Cloudflare Pages binding) |
| Redis | Upstash (UPSTASH_REDIS_REST_URL/TOKEN) |
| AI | OpenRouter (OPENROUTER_API_KEY) |
| Admin Token | ADMIN_MONITORING_TOKEN (CF Dashboard) |
| IP Hash Salt | MONITORING_HASH_SALT (CF Dashboard) |
| Rate Limit | 页面 30/min, API 20/min |
| CF Cache Rule | "API bypass cache" — Bypass Cache for /api/* |

### 构建验证

```bash
npx tsc --noEmit       # 类型检查
npm run build          # Next.js 构建
npm run pages:build    # CF Pages 产物
```

### Git 推送 (HTTP/2 偶发错误)

```bash
git -c http.version=HTTP/1.1 push origin main
```

---

## 8. 约束确认

| 约束 | 状态 |
|------|------|
| 不做 D1 schema migration | ✅ |
| 不清理 legacy Python API | ✅ |
| 不改 SEO / sitemap | ✅ |
| 不碰 Chrome Extension | ✅ |
| 不引入 Datadog/Prometheus/Grafana | ✅ |
| 不记录原始 IP / 完整 UA | ✅ |
| 不增加每请求 D1 写入 | ✅ |
| 不打印 secret/token/env value | ✅ |
| 低成本可维护 | ✅ |
