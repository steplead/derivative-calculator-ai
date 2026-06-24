#!/usr/bin/env python3
"""
自动批量阻止IP脚本
自动获取Zone ID并批量阻止所有高分IP

使用方法:
  python3 auto-block-ips.py [ZONE_ID]

如果提供ZONE_ID作为参数，将直接使用，否则尝试自动获取
"""

import requests
import json
import sys
import time
import os

# 配置
API_TOKEN = "xmKfckP6GNUOSgmNwBc1Fg3oUyDIBIM9QHkPz9bc"
ZONE_NAME = "derivativecalculatorai.com"

# IP列表（评分≥100的IP）
IPS = [
    "198.35.47.192",
    "152.32.191.20",
    "152.32.212.226",
    "161.118.211.239",
    "213.35.120.237",
    "129.150.36.137",
    "34.133.255.234",
    "175.30.48.182"
]

def get_zone_id():
    """获取Zone ID"""
    print("正在查询 Zone ID...")
    
    url = "https://api.cloudflare.com/client/v4/zones"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    params = {"name": ZONE_NAME}
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        # 如果返回403，说明Token没有读取Zone列表的权限
        if response.status_code == 403:
            print("⚠️  Token没有读取Zone列表的权限")
            print("   这是正常的，因为Token只有Firewall Services权限")
            return None
        
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("success") and data.get("result"):
            zones = data["result"]
            if zones:
                zone_id = zones[0]["id"]
                print(f"✅ Zone ID 已找到: {zone_id}")
                return zone_id
            else:
                print("❌ 未找到域名")
                return None
        else:
            print(f"❌ API 响应错误: {data.get('errors', [])}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络请求失败: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析失败: {e}")
        return None
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return None

def get_zone_id_from_args():
    """从命令行参数获取Zone ID"""
    if len(sys.argv) > 1:
        zone_id = sys.argv[1].strip()
        if zone_id:
            print(f"✅ 从命令行参数获取 Zone ID: {zone_id}")
            return zone_id
    
    # 尝试从环境变量获取
    zone_id = os.getenv("CLOUDFLARE_ZONE_ID")
    if zone_id:
        print(f"✅ 从环境变量获取 Zone ID: {zone_id}")
        return zone_id
    
    return None

def block_ip(zone_id, ip):
    """阻止单个IP"""
    url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/firewall/access_rules/rules"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "mode": "block",
        "configuration": {
            "target": "ip",
            "value": ip
        },
        "notes": "High abuse score bot IP - Auto blocked from abuse_scores table"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get("success"):
            return True, None
        else:
            errors = result.get("errors", [])
            # 检查是否已存在
            error_messages = [str(e) for e in errors]
            if any("already exists" in str(e).lower() or "duplicate" in str(e).lower() for e in error_messages):
                return "exists", None
            else:
                return False, errors
                
    except requests.exceptions.RequestException as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

def main():
    """主函数"""
    print("=" * 60)
    print("自动批量阻止IP脚本")
    print("=" * 60)
    print()
    
    # 步骤1: 获取Zone ID
    # 优先从命令行参数或环境变量获取
    zone_id = get_zone_id_from_args()
    
    # 如果未提供，尝试自动获取
    if not zone_id:
        zone_id = get_zone_id()
    
    # 如果仍然没有，提示用户
    if not zone_id:
        print()
        print("=" * 60)
        print("❌ 无法自动获取 Zone ID")
        print("=" * 60)
        print()
        print("请使用以下方式之一提供 Zone ID:")
        print()
        print("方法1: 命令行参数")
        print("  python3 auto-block-ips.py YOUR_ZONE_ID")
        print()
        print("方法2: 环境变量")
        print("  export CLOUDFLARE_ZONE_ID=YOUR_ZONE_ID")
        print("  python3 auto-block-ips.py")
        print()
        print("获取 Zone ID 的方法:")
        print("1. 打开 Cloudflare Dashboard")
        print("2. 选择域名: derivativecalculatorai.com")
        print("3. 在右侧边栏找到 'Zone ID'")
        print("4. 点击复制")
        print()
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("开始批量阻止IP...")
    print(f"总共需要阻止: {len(IPS)} 个IP")
    print("=" * 60)
    print()
    
    # 步骤2: 批量阻止IP
    success_count = 0
    exists_count = 0
    fail_count = 0
    
    for i, ip in enumerate(IPS, 1):
        print(f"[{i}/{len(IPS)}] 正在阻止: {ip}... ", end="", flush=True)
        
        result, error = block_ip(zone_id, ip)
        
        if result is True:
            print("✅ 成功")
            success_count += 1
        elif result == "exists":
            print("⚠️  已存在（跳过）")
            exists_count += 1
        else:
            print("❌ 失败")
            if error:
                print(f"    错误: {error}")
            fail_count += 1
        
        # 避免请求过快
        if i < len(IPS):
            time.sleep(0.5)
    
    # 步骤3: 显示结果
    print()
    print("=" * 60)
    print("结果汇总")
    print("=" * 60)
    print(f"✅ 成功: {success_count}")
    print(f"⚠️  已存在: {exists_count}")
    print(f"❌ 失败: {fail_count}")
    print(f"📊 总计: {len(IPS)}")
    print()
    
    if fail_count == 0:
        print("🎉 所有IP处理完成！")
    else:
        print("⚠️  部分IP处理失败，请检查错误信息")

if __name__ == "__main__":
    main()
