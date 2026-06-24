#!/bin/bash

# Cloudflare批量阻止IP脚本
# 使用方法: 
# 1. 替换下面的ZONE_ID和API_TOKEN
# 2. chmod +x block-ips.sh
# 3. ./block-ips.sh

# ========== 配置 ==========
ZONE_ID="你的Zone ID"  # 从Cloudflare Dashboard获取
API_TOKEN="你的API Token"  # 从Cloudflare Dashboard创建

# ========== IP列表（评分≥100的IP）==========
IPS=(
  "198.35.47.192"
  "152.32.191.20"
  "152.32.212.226"
  "161.118.211.239"
  "213.35.120.237"
  "129.150.36.137"
  "34.133.255.234"
  "175.30.48.182"
)

# ========== 批量阻止 ==========
echo "开始批量阻止IP..."
echo "总共需要阻止: ${#IPS[@]} 个IP"
echo ""

success_count=0
fail_count=0

for IP in "${IPS[@]}"; do
  echo -n "正在阻止: ${IP}... "
  
  RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{
      \"mode\": \"block\",
      \"configuration\": {
        \"target\": \"ip\",
        \"value\": \"${IP}\"
      },
      \"notes\": \"High abuse score bot IP - Auto blocked from abuse_scores table\"
    }")
  
  # 检查响应
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ 成功"
    ((success_count++))
  else
    # 检查是否已存在
    if echo "$RESPONSE" | grep -q "already exists\|duplicate"; then
      echo "⚠️  已存在（跳过）"
    else
      echo "❌ 失败"
      echo "   响应: ${RESPONSE}"
      ((fail_count++))
    fi
  fi
  
  # 避免请求过快
  sleep 0.5
done

echo ""
echo "=== 结果汇总 ==="
echo "成功: ${success_count}"
echo "失败: ${fail_count}"
echo "总计: ${#IPS[@]}"
