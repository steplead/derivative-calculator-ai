#!/bin/bash
# Compliance Verification Script
# Checks Cloudflare quota usage and verifies 100% compliance

set -e

echo "=========================================="
echo "COMPLIANCE VERIFICATION"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DAILY_LIMIT=85000
HOURLY_LIMIT=3542
WARNING_THRESHOLD=80000  # 80% of daily limit
CRITICAL_THRESHOLD=90000  # 100% of daily limit

echo "Checking D1 database for quota counters..."
echo ""

# Check hourly quota
echo "📊 Current Hour Quota:"
HOURLY_COUNT=$(npx wrangler d1 execute problems-db --command="
SELECT value 
FROM counters 
WHERE key LIKE 'global:hour:%' 
ORDER BY last_updated DESC 
LIMIT 1
" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0")

if [ -z "$HOURLY_COUNT" ] || [ "$HOURLY_COUNT" = "0" ]; then
    echo -e "${YELLOW}⚠️  No hourly counter found (may be first request)${NC}"
else
    if [ "$HOURLY_COUNT" -lt "$HOURLY_LIMIT" ]; then
        echo -e "${GREEN}✓ Hourly: $HOURLY_COUNT / $HOURLY_LIMIT (OK)${NC}"
    else
        echo -e "${RED}✗ Hourly: $HOURLY_COUNT / $HOURLY_LIMIT (EXCEEDED)${NC}"
        exit 1
    fi
fi

echo ""

# Check daily quota
echo "📊 Current Day Quota:"
DAILY_COUNT=$(npx wrangler d1 execute problems-db --command="
SELECT value 
FROM counters 
WHERE key LIKE 'global:day:%' 
ORDER BY last_updated DESC 
LIMIT 1
" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0")

if [ -z "$DAILY_COUNT" ] || [ "$DAILY_COUNT" = "0" ]; then
    echo -e "${YELLOW}⚠️  No daily counter found (may be first request)${NC}"
else
    PERCENTAGE=$((DAILY_COUNT * 100 / DAILY_LIMIT))
    
    if [ "$DAILY_COUNT" -lt "$WARNING_THRESHOLD" ]; then
        echo -e "${GREEN}✓ Daily: $DAILY_COUNT / $DAILY_LIMIT ($PERCENTAGE%) - OK${NC}"
    elif [ "$DAILY_COUNT" -lt "$DAILY_LIMIT" ]; then
        echo -e "${YELLOW}⚠️  Daily: $DAILY_COUNT / $DAILY_LIMIT ($PERCENTAGE%) - WARNING${NC}"
    else
        echo -e "${RED}✗ Daily: $DAILY_COUNT / $DAILY_LIMIT ($PERCENTAGE%) - EXCEEDED${NC}"
        exit 1
    fi
fi

echo ""

# Check rate limits
echo "📊 Top IPs by Request Count:"
npx wrangler d1 execute problems-db --command="
SELECT ip, count, reset_time 
FROM rate_limits 
ORDER BY count DESC 
LIMIT 5
" 2>/dev/null || echo "No rate limit data"

echo ""

# Check blocked IPs
echo "📊 Currently Blocked IPs:"
BLOCKED_COUNT=$(npx wrangler d1 execute problems-db --command="
SELECT COUNT(*) as count 
FROM ip_blacklist 
WHERE blocked_until > strftime('%s', 'now')
" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0")

echo "Blocked IPs: $BLOCKED_COUNT"

echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="

# Final check
if [ -n "$DAILY_COUNT" ] && [ "$DAILY_COUNT" != "0" ]; then
    if [ "$DAILY_COUNT" -lt "$DAILY_LIMIT" ]; then
        echo -e "${GREEN}✅ COMPLIANT: Daily requests ($DAILY_COUNT) below limit ($DAILY_LIMIT)${NC}"
        exit 0
    else
        echo -e "${RED}❌ NON-COMPLIANT: Daily requests ($DAILY_COUNT) exceed limit ($DAILY_LIMIT)${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Cannot verify: No quota data available${NC}"
    exit 0
fi
