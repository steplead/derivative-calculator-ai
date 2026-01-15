#!/bin/bash
# Quick Rate Limit Test
# Tests if rate limiting is working on production

echo "=========================================="
echo "RATE LIMITING TEST - PRODUCTION"
echo "=========================================="
echo "Testing: https://derivativecalculatorai.com"
echo "Expected limit: 10 requests per minute"
echo ""

SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0
ERROR_COUNT=0

echo "Starting test: Sending 15 rapid requests..."
echo ""

for i in {1..15}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false" --max-time 5)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo "Request $i: ✅ 200 OK (Total success: $SUCCESS_COUNT)"
    elif [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
        echo "Request $i: 🔴 429 RATE LIMITED (Total rate limited: $RATE_LIMIT_COUNT)"
    else
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo "Request $i: ⚠️  $HTTP_CODE (Total errors: $ERROR_COUNT)"
    fi

    # Small delay to avoid overwhelming
    sleep 0.2
done

echo ""
echo "=========================================="
echo "TEST RESULTS"
echo "=========================================="
echo "Successful (200): $SUCCESS_COUNT"
echo "Rate Limited (429): $RATE_LIMIT_COUNT"
echo "Errors: $ERROR_COUNT"
echo ""

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    RATE_LIMIT_HIT=$(($SUCCESS_COUNT + $RATE_LIMIT_COUNT))
    echo "✅ RATE LIMITING DETECTED"
    echo "   Rate limiting triggered after approximately $RATE_LIMIT_HIT requests"
    echo "   Status: COMPLIANT ✅"
    exit 0
else
    echo "❌ RATE LIMITING NOT DETECTED"
    echo "   Sent 15 requests, none were rate limited"
    echo "   This may indicate:"
    echo "   1. Rate limiting not working (NEEDS FIX)"
    echo "   2. Rate limit window not started yet"
    echo "   3. Rate limiting applied per-IP (you may be hitting different IPs)"
    echo "   Status: NEEDS INVESTIGATION ⚠️"
    exit 1
fi
