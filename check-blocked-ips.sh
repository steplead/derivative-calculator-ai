#!/bin/bash

# 检查已封禁的IP脚本
# 使用方法: 
# 1. chmod +x check-blocked-ips.sh
# 2. ./check-blocked-ips.sh

echo "=== 检查当前已封禁的IP ==="
echo ""

# 查询当前已封禁的IP
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, blocked_until, offense_count, datetime(blocked_until, 'unixepoch') as expire_time FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY offense_count DESC;"

echo ""
echo "=== 检查所有曾经封禁的IP（包括已过期）==="
echo ""

# 查询所有IP（包括已过期的）
wrangler d1 execute problems-db --remote --command="SELECT ip, reason, offense_count, datetime(blocked_until, 'unixepoch') as expire_time FROM ip_blacklist ORDER BY offense_count DESC LIMIT 50;"
