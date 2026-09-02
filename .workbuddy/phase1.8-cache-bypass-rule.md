# Phase 1.8 — Cloudflare Cache Rule: Bypass /api/*

**目标**: 为 `/api/*` 路径配置 Cache Rule，强制 Bypass Cache，消除 API 200 的 cf-cache-status: HIT 和 Age 递增

**状态**: 本地无 CF API Token，需手动操作或用户提供凭据

---

## 方案 A：Dashboard 手动配置（推荐）

### 步骤

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择域名 **derivativecalculatorai.com**
3. 左侧菜单 → **Caching** → **Cache Rules**
4. 点击 **Create Rule**
5. 配置：

| 字段 | 值 |
|------|-----|
| Rule name | `API bypass cache` |
| **When** (Expression) | 自定义表达式：`(http.host eq "derivativecalculatorai.com" and starts_with(http.request.uri.path, "/api/"))` |
| **Then** (Action) | **Bypass cache** |

6. 点击 **Deploy**

### 验证（配置后立即执行）

```bash
# 第一次请求应为 MISS（规则生效后清除了旧缓存）
curl -sS -o /dev/null -D - \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html,application/xhtml+xml" \
  "https://derivativecalculatorai.com/api/derivative?equation=sin(x)&p18-verify=1" 2>&1 \
  | grep -E "(cf-cache-status|Age|Cache-Control|HTTP/2)"

# 3秒后同一 URL
sleep 3
curl -sS -o /dev/null -D - \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html,application/xhtml+xml" \
  "https://derivativecalculatorai.com/api/derivative?equation=sin(x)&p18-verify=1" 2>&1 \
  | grep -E "(cf-cache-status|Age|Cache-Control|HTTP/2)"
```

**期望结果**:
- cf-cache-status: **BYPASS** 或 **DYNAMIC**（不再是 HIT）
- Age: **不存在**
- Cache-Control: 仍然是 `private, max-age=14400`（CF Pages 会继续覆盖，但 Cache Rule 阻止实际缓存）

---

## 方案 B：Cloudflare API（需提供凭据）

### 前置条件
- `CLOUDFLARE_API_TOKEN`（需权限：Zone > Cache Rules > Edit + Account Rulesets > Edit）
- `CLOUDFLARE_ACCOUNT_ID`
- `ZONE_ID`（可通过 API 获取）

### Step 1: 获取 Zone ID

```bash
curl -s "https://api.cloudflare.com/client/v4/zones?name=derivativecalculatorai.com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'])"
```

### Step 2: 检查现有 Cache Rules

```bash
# 检查 http_request_cache_settings phase 是否已有 ruleset
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d, indent=2))"
```

### Step 3: 创建 Cache Rule

**情况 1 — 该 phase 无 ruleset（首次创建）**:

```bash
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
  --request POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "kind": "zone",
    "name": "default",
    "phase": "http_request_cache_settings",
    "rules": [
      {
        "expression": "(http.host eq \"derivativecalculatorai.com\" and starts_with(http.request.uri.path, \"/api/\"))",
        "description": "API bypass cache",
        "action": "set_cache_settings",
        "action_parameters": {
          "cache": false
        },
        "enabled": true
      }
    ]
  }'
```

**情况 2 — 该 phase 已有 ruleset（追加规则）**:

```bash
# 先获取 ruleset_id
RULESET_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result']['id'])")

# 追加规则（注意：PUT 会替换所有规则，需先获取现有规则再加入新规则）
# 更安全的做法：用 POST 创建单条规则
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID/rules" \
  --request POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "expression": "(http.host eq \"derivativecalculatorai.com\" and starts_with(http.request.uri.path, \"/api/\"))",
    "description": "API bypass cache",
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": false
    },
    "enabled": true
  }'
```

### Step 4: 验证规则生效

同方案 A 的验证脚本。

---

## API Token 最低权限

| 权限 | 级别 |
|------|------|
| Zone > Cache Rules | Edit |
| Account Rulesets | Edit |

可以在 Cloudflare Dashboard → My Profile → API Tokens → Create Token 创建专用 Token。

---

## 预期效果

| 响应类型 | 配置前 | 配置后 |
|----------|--------|--------|
| API 200  | HIT (4h cache) | **BYPASS** (no cache) |
| API 400  | BYPASS | BYPASS（不变） |
| API 403  | BYPASS | BYPASS（不变） |
| API 405  | DYNAMIC | DYNAMIC（不变） |

---

## 风险评估

- **正面**: API 响应不再被 CDN 缓存，安全检查（rate limit, UA blacklist）对每个请求生效
- **负面**: 每个 API 请求都到达 origin → Workers 调用量增加（但 API 本身每次请求都要跑 AI 处理，已经是冷路径）
- **影响**: 低。API 请求本身需要 OpenRouter AI 处理（2-10秒），不存在"大量缓存命中节省资源"的场景。CDN 缓存反而绕过了安全层，得不偿失。

---

## Phase 1.8 完成标准

1. ✅ Cloudflare Cache Rule `/api/* → Bypass Cache` 已创建并启用
2. ✅ 线上验证：API 200 不再出现 `cf-cache-status: HIT` 和 `Age` 递增
3. ✅ 线上验证：API 200 出现 `cf-cache-status: BYPASS` 或 `DYNAMIC`
4. ✅ 线上验证：API 400/403/405 缓存状态不变
5. ✅ R1 安全风险正式关闭
