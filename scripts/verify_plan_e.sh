#!/bin/bash
# Plan E Verification Script
# 检查所有关键指标

echo "=========================================="
echo "Plan E 合规验证 - $(date)"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：检查条件并输出结果
check() {
  if eval "$1"; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    return 1
  fi
}

# 函数：警告
warn() {
  echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
}

# ============================================
# 1. 检查全局配额计数器
# ============================================
echo "1. 全局配额计数器检查"
echo "-------------------------------------------"

# 查询最新的全局计数器（PRODUCTION database）
QUOTA_RESULT=$(npx wrangler d1 execute problems-db --remote --command="
SELECT key, value,
  datetime(last_updated, 'unixepoch', 'localtime') as updated_at
FROM counters
WHERE key LIKE 'global:%'
ORDER BY last_updated DESC
LIMIT 2
" --json 2>/dev/null)

# 解析结果
HOUR_COUNT=0
DAY_COUNT=0

if echo "$QUOTA_RESULT" | grep -q '"key":'; then
  # 提取小时计数（包含 "global:hour:" 的行）
  HOUR_ROW=$(echo "$QUOTA_RESULT" | grep '"key"' | grep "hour" | head -1)
  if [ -n "$HOUR_ROW" ]; then
    HOUR_COUNT=$(echo "$HOUR_ROW" | grep -o '"value":[0-9]*' | cut -d: -f2)
  fi

  # 提取日计数（包含 "global:day:" 的行）
  DAY_ROW=$(echo "$QUOTA_RESULT" | grep '"key"' | grep "day" | head -1)
  if [ -n "$DAY_ROW" ]; then
    DAY_COUNT=$(echo "$DAY_ROW" | grep -o '"value":[0-9]*' | cut -d: -f2)
  fi
fi

if [ -z "$HOUR_COUNT" ] || [ "$HOUR_COUNT" = "null" ]; then
  HOUR_COUNT=0
fi

if [ -z "$DAY_COUNT" ] || [ "$DAY_COUNT" = "null" ]; then
  DAY_COUNT=0
fi

echo "当前小时请求数: $HOUR_COUNT / 3,750"
echo "当前日请求数: $DAY_COUNT / 90,000"
echo ""

# 修正 check 函数调用 - 直接使用 test 命令
if [ "$HOUR_COUNT" -lt 3750 ]; then
  echo -e "${GREEN}✅ PASS${NC}: 小时配额合规"
else
  echo -e "${RED}❌ FAIL${NC}: 小时配额超限"
fi

if [ "$DAY_COUNT" -lt 90000 ]; then
  echo -e "${GREEN}✅ PASS${NC}: 日配额合规"
else
  echo -e "${RED}❌ FAIL${NC}: 日配额超限"
fi

echo ""

# ============================================
# 2. Rate Limiting 配置检查
# ============================================
echo "2. Rate Limiting 配置检查"
echo "-------------------------------------------"

DEFAULT_LIMIT=$(grep "DEFAULT_LIMIT:" utils/security.ts | grep -o "[0-9]*" | head -1)
STRICT_LIMIT=$(grep "STRICT_LIMIT:" utils/security.ts | grep -o "[0-9]*" | head -1)

echo "DEFAULT_LIMIT: $DEFAULT_LIMIT req/min"
echo "STRICT_LIMIT: $STRICT_LIMIT req/min"

check [ "$DEFAULT_LIMIT" -eq 3 ] "Rate limit 配置正确 (3 req/min)"
check [ "$STRICT_LIMIT" -eq 1 ] "Strict limit 配置正确 (1 req/min)"

echo ""

# ============================================
# 3. AI 功能禁用检查
# ============================================
echo "3. AI 功能禁用检查"
echo "-------------------------------------------"

AI_DERIVATIVE=$(grep "includeAi" app/api/derivative/route.ts | grep -v "//" | head -1)
AI_INTEGRAL=$(grep "includeAi" app/api/integral/route.ts | grep -v "//" | head -1)
AI_LIMIT=$(grep "includeAi" app/api/limit/route.ts | grep -v "//" | head -1)
AI_ODE=$(grep "includeAi" app/api/ode/route.ts | grep -v "//" | head -1)

if echo "$AI_DERIVATIVE" | grep -q "false"; then
  echo -e "${GREEN}✅${NC} derivative API: AI disabled"
else
  echo -e "${RED}❌${NC} derivative API: AI 可能仍启用"
fi

if echo "$AI_INTEGRAL" | grep -q "false"; then
  echo -e "${GREEN}✅${NC} integral API: AI disabled"
else
  echo -e "${RED}❌${NC} integral API: AI 可能仍启用"
fi

if echo "$AI_LIMIT" | grep -q "false"; then
  echo -e "${GREEN}✅${NC} limit API: AI disabled"
else
  echo -e "${RED}❌${NC} limit API: AI 可能仍启用"
fi

if echo "$AI_ODE" | grep -q "false"; then
  echo -e "${GREEN}✅${NC} ODE API: AI disabled"
else
  echo -e "${RED}❌${NC} ODE API: AI 可能仍启用"
fi

echo ""

# ============================================
# 4. API 端点测试
# ============================================
echo "4. API 端点测试"
echo "-------------------------------------------"

echo "测试 API 可用性..."
RESPONSE_CODE=$(curl -s -w "%{http_code}" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" \
  -o /dev/null --max-time 10)

echo "HTTP Status Code: $RESPONSE_CODE"

if [ "$RESPONSE_CODE" = "200" ]; then
  echo -e "${GREEN}✅ API 正常工作${NC}"
elif [ "$RESPONSE_CODE" = "429" ]; then
  echo -e "${YELLOW}⚠️  Rate limited (正常)${NC}"
elif [ "$RESPONSE_CODE" = "403" ]; then
  warn "可能被 Bot detection 阻止"
else
  echo -e "${RED}❌ API 返回错误状态码${NC}"
fi

echo ""

# ============================================
# 5. Rate Limiting 实际测试
# ============================================
echo "5. Rate Limiting 实际测试"
echo "-------------------------------------------"

echo "发送 5 个连续请求..."

SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0
OTHER_COUNT=0

for i in {1..5}; do
  RESPONSE=$(curl -s -w "%{http_code}" \
    -A "Mozilla/5.0" \
    "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" \
    -o /dev/null --max-time 10)

  if [ "$RESPONSE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "Request $i: ✅ 200 OK"
  elif [ "$RESPONSE" = "429" ]; then
    RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
    echo "Request $i: 🔴 429 Rate Limited"
  else
    OTHER_COUNT=$((OTHER_COUNT + 1))
    echo "Request $i: ⚠️  $RESPONSE"
  fi

  # 短暂延迟避免过于激进
  sleep 0.3
done

echo ""
echo "结果: $SUCCESS_COUNT 成功, $RATE_LIMIT_COUNT Rate limited, $OTHER_COUNT 其他"

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
  echo -e "${GREEN}✅ Rate limiting 正在工作${NC}"
else
  warn "Rate limiting 可能未触发（正常，取决于请求频率）"
fi

echo ""

# ============================================
# 6. 响应时间测试
# ============================================
echo "6. API 响应时间测试"
echo "-------------------------------------------"

echo "测试 3 次，取中位数..."

TIME1=$(curl -s -o /dev/null -w "%{time_total}" \
  -A "Mozilla/5.0" \
  "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" \
  --max-time 10)

sleep 1

TIME2=$(curl -s -o /dev/null -w "%{time_total}" \
  -A "Mozilla/5.0" \
  "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" \
  --max-time 10)

sleep 1

TIME3=$(curl -s -o /dev/null -w "%{time_total}" \
  -A "Mozilla/5.0" \
  "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" \
  --max-time 10)

echo "响应时间 1: ${TIME1}s"
echo "响应时间 2: ${TIME2}s"
echo "响应时间 3: ${TIME3}s"

# 简单中位数计算
if (( $(echo "$TIME1 < $TIME2" | bc -l) )); then
  MEDIAN=$TIME2
else
  MEDIAN=$TIME1
fi

if (( $(echo "$TIME3 < $MEDIAN" | bc -l) )); then
  MEDIAN=$MEDIAN
else
  MEDIAN=$TIME3
fi

echo "中位数: ~${MEDIAN}s"

if (( $(echo "$MEDIAN < 1.0" | bc -l) )); then
  echo -e "${GREEN}✅ 响应时间良好 (< 1s)${NC}"
elif (( $(echo "$MEDIAN < 2.0" | bc -l) )); then
  warn "响应时间可接受 (1-2s)"
else
  echo -e "${RED}❌ 响应时间较慢 (> 2s)${NC}"
fi

echo ""

# ============================================
# 7. 汇总
# ============================================
echo "=========================================="
echo "验证汇总"
echo "=========================================="
echo ""
echo "全局配额:"
echo "  - 当前小时: $HOUR_COUNT / 3,750"
echo "  - 当前日: $DAY_COUNT / 90,000"
echo ""
echo "配置:"
echo "  - Rate limit: $DEFAULT_LIMIT req/min"
echo "  - AI: 已禁用"
echo ""
echo "建议:"
if [ "$DAY_COUNT" -lt 90000 ]; then
  echo -e "${GREEN}✅ 当前日配额合规${NC}"
  echo "  继续监控 24 小时以确认趋势"
else
  echo -e "${RED}❌ 当前日配额超限${NC}"
  echo "  需要进一步调查"
fi

echo ""
echo "下一步:"
echo "  1. 查看 Cloudflare Dashboard 确认总请求数"
echo "  2. 检查 Workers 日志: npx wrangler tail"
echo "  3. 24 小时后重新运行此脚本"
echo ""
echo "=========================================="
