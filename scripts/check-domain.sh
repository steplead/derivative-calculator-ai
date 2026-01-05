#!/bin/bash

# 域名健康检查脚本
# 使用方法: ./scripts/check-domain.sh

echo "🔍 检查域名配置状态..."
echo ""

MAIN_DOMAIN="derivativecalculatorai.com"
WWW_DOMAIN="www.derivativecalculatorai.com"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📊 域名健康检查"
echo "================"
echo ""

# 检查主域名
echo -n "1. 主域名 ($MAIN_DOMAIN): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$MAIN_DOMAIN/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 正常 (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ 异常 (HTTP $HTTP_CODE)${NC}"
fi

# 检查 www 子域名
echo -n "2. WWW 子域名 ($WWW_DOMAIN): "
HTTP_CODE_WWW=$(curl -s -o /dev/null -w "%{http_code}" https://$WWW_DOMAIN/)
if [ "$HTTP_CODE_WWW" = "200" ]; then
    echo -e "${GREEN}✅ 正常 (HTTP $HTTP_CODE_WWW)${NC}"
elif [ "$HTTP_CODE_WWW" = "404" ]; then
    echo -e "${YELLOW}⚠️  未配置 (HTTP $HTTP_CODE_WWW)${NC}"
else
    echo -e "${RED}❌ 异常 (HTTP $HTTP_CODE_WWW)${NC}"
fi

# 检查 HTTPS 强制
echo -n "3. HTTPS 强制: "
HTTP_CODE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://$MAIN_DOMAIN/)
if [ "$HTTP_CODE_HTTP" = "301" ] || [ "$HTTP_CODE_HTTP" = "302" ]; then
    echo -e "${GREEN}✅ 已强制重定向到 HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  未强制 HTTPS (HTTP $HTTP_CODE_HTTP)${NC}"
fi

# 检查 sitemap
echo -n "4. Sitemap: "
SITEMAP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$MAIN_DOMAIN/sitemap.xml)
if [ "$SITEMAP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问 (HTTP $SITEMAP_CODE)${NC}"
fi

# 检查 robots.txt
echo -n "5. Robots.txt: "
ROBOTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$MAIN_DOMAIN/robots.txt)
if [ "$ROBOTS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问 (HTTP $ROBOTS_CODE)${NC}"
fi

# 检查新页面
echo ""
echo "📄 SEO 页面检查"
echo "================"

PAGES=("/problems" "/calculators" "/embed/derivative-of-x-squared")

for page in "${PAGES[@]}"; do
    echo -n "  $page: "
    PAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$MAIN_DOMAIN$page)
    if [ "$PAGE_CODE" = "200" ]; then
        echo -e "${GREEN}✅${NC}"
    elif [ "$PAGE_CODE" = "404" ]; then
        echo -e "${YELLOW}⚠️  待部署${NC}"
    else
        echo -e "${RED}❌ (HTTP $PAGE_CODE)${NC}"
    fi
done

echo ""
echo "✨ 检查完成！"
echo ""
echo "📚 相关文档:"
echo "  - 域名配置: docs/CUSTOM_DOMAIN_GUIDE.md"
echo "  - 部署配置: docs/DEPLOYMENT_SETUP.md"
