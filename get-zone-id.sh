#!/bin/bash

# 获取 Zone ID 脚本
# 使用方法: ./get-zone-id.sh

API_TOKEN="xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc"

echo "正在查询 Zone ID..."
echo ""

RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=derivativecalculatorai.com" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json")

# 提取 Zone ID
ZONE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ZONE_ID" ]; then
  echo "✅ Zone ID 已找到:"
  echo ""
  echo "${ZONE_ID}"
  echo ""
  echo "请复制上面的 Zone ID，然后编辑 block-ips.sh"
else
  echo "❌ 未找到 Zone ID"
  echo ""
  echo "完整响应:"
  echo "$RESPONSE"
fi
