#!/bin/bash
# =============================================================================
# Phase 5B-lite: External Health Check Script
# =============================================================================
# Runs comprehensive read-only checks against the live site.
# Exit code 0 = all pass, 1 = any fail.
#
# Usage:
#   ./scripts/health-check.sh                    # console output
#   ./scripts/health-check.sh --json             # JSON output
#   ./scripts/health-check.sh --webhook <url>    # send alert to webhook on failure
#
# Requires: ADMIN_MONITORING_TOKEN env var for deep health checks.
# =============================================================================

SITE="https://derivativecalculatorai.com"
BROWSER_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
ADMIN_TOKEN="${ADMIN_MONITORING_TOKEN:-}"
OUTPUT_MODE="table"
WEBHOOK_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) OUTPUT_MODE="json"; shift ;;
    --webhook) WEBHOOK_URL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

PASS=0
FAIL=0
RESULTS=()
DELAY=2  # seconds between requests to avoid rate limiting

check() {
  local name="$1"
  local url="$2"
  local expect_status="$3"
  local extra_header="${4:-}"
  local method="${5:-GET}"
  local check_cache="${6:-false}"

  local status
  status=$(curl -sS -o /dev/null -w "%{http_code}" \
    --max-time 30 \
    --noproxy '*' \
    -H "User-Agent: ${BROWSER_UA}" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
    ${extra_header:+-H "$extra_header"} \
    ${method:+-X "$method"} \
    "$url" 2>/dev/null) || status="000"

  local cache_note=""
  if [[ "$check_cache" == "true" ]]; then
    sleep 1
    local cache_val
    cache_val=$(curl -sS -o /dev/null -D - --max-time 30 \
      --noproxy '*' \
      -H "User-Agent: ${BROWSER_UA}" \
      -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
      ${extra_header:+-H "$extra_header"} \
      "$url" 2>/dev/null | grep -i '^cf-cache-status:' | tr -d '\r' | awk '{print $2}') || cache_val=""
    if [[ -n "$cache_val" ]]; then
      cache_note=" cf-cache=${cache_val}"
      if [[ "$cache_val" == "HIT" ]]; then
        cache_note=" cf-cache=HIT(BAD)"
      fi
    fi
  fi

  local result="PASS"
  if [[ "$status" != "$expect_status" ]]; then
    result="FAIL"
    FAIL=$((FAIL + 1))
  else
    PASS=$((PASS + 1))
  fi

  if [[ "$cache_note" == *"HIT(BAD)"* ]]; then
    result="FAIL"
    FAIL=$((FAIL + 1))
    PASS=$((PASS > 0 ? PASS - 1 : 0))
  fi

  RESULTS+=("${result}|${name}|${status}|${expect_status}${cache_note}")
  sleep "$DELAY"
}

# --- Run all checks ---

check "Homepage" "${SITE}/" "200"
check "/integral" "${SITE}/integral" "200"
check "/limit" "${SITE}/limit" "200"
check "/ode" "${SITE}/ode" "200"
check "API /derivative" "${SITE}/api/derivative?equation=sin(x)" "200" "Referer: ${SITE}/"
check "API cache bypass" "${SITE}/api/derivative?equation=x%5E2" "200" "Referer: ${SITE}/" "GET" "true"

if [[ -n "$ADMIN_TOKEN" ]]; then
  check "Admin health" "${SITE}/api/admin/health" "200" "Authorization: Bearer ${ADMIN_TOKEN}"
else
  check "Admin health (401)" "${SITE}/api/admin/health" "401"
fi

check "Unblock-ip (410)" "${SITE}/api/unblock-ip" "410"
check "400 not cached" "${SITE}/api/derivative" "400" "Referer: ${SITE}/"
check "405 not cached" "${SITE}/api/derivative?equation=x" "405" "" "POST"

# --- Output ---

if [[ "$OUTPUT_MODE" == "json" ]]; then
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"passed\": ${PASS},"
  echo "  \"failed\": ${FAIL},"
  echo "  \"checks\": ["
  for i in "${!RESULTS[@]}"; do
    IFS='|' read -r result name status expect cache <<< "${RESULTS[$i]}"
    cache="${cache:-}"
    comma=""
    [[ $i -lt $((${#RESULTS[@]} - 1)) ]] && comma=","
    echo "    {\"name\": \"${name}\", \"result\": \"${result}\", \"status\": \"${status}\", \"expected\": \"${expect}\"${cache:+, \"cache\": \"${cache# }\"}}${comma}"
  done
  echo "  ]"
  echo "}"
else
  printf "\n%-30s %-8s %-8s %-10s %s\n" "CHECK" "RESULT" "STATUS" "EXPECT" "NOTE"
  printf "%-30s %-8s %-8s %-10s %s\n" "-----" "------" "------" "------" "----"
  for r in "${RESULTS[@]}"; do
    IFS='|' read -r result name status expect cache <<< "$r"
    cache="${cache:-}"
    if [[ "$result" == "PASS" ]]; then
      color="\033[32m"
    else
      color="\033[31m"
    fi
    printf "%-30s ${color}%-8s\033[0m %-8s %-10s %s\n" "$name" "$result" "$status" "$expect" "$cache"
  done
  echo ""
  echo "Passed: ${PASS}  Failed: ${FAIL}  Total: $((PASS + FAIL))"
  echo "Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
fi

# --- Webhook alert on failure ---
if [[ -n "$WEBHOOK_URL" && "$FAIL" -gt 0 ]]; then
  ALERT_MSG="DerivativeCalculatorAI Health Check FAILED: ${FAIL} of $((PASS + FAIL)) checks failed at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  FAILED_NAMES=$(printf '%s\n' "${RESULTS[@]}" | grep '^FAIL' | cut -d'|' -f2 | tr '\n' ', ' | sed 's/,$//')
  curl -sS -o /dev/null -X POST -H "Content-Type: application/json" \
    --noproxy '*' \
    -d "{\"text\": \"${ALERT_MSG}\nFailed: ${FAILED_NAMES}\"}" \
    "$WEBHOOK_URL" 2>/dev/null || true
fi

if [[ "$FAIL" -eq 0 ]]; then
  exit 0
else
  exit 1
fi
