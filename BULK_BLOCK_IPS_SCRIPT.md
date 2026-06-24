# 🚀 批量阻止IP脚本（完整方案）

> **目标**: 一次性阻止所有高分IP  
> **方法**: Cloudflare API批量创建规则  
> **时间**: 5-10分钟

---

## 📋 **准备工作**

### **步骤1: 获取Zone ID**

1. Cloudflare Dashboard → `derivativecalculatorai.com`
2. 右侧边栏找到 **"Zone ID"**
3. 点击复制

**或者**:
- 在Overview页面，右侧边栏显示Zone ID

---

### **步骤2: 创建API Token**

1. Cloudflare Dashboard → 右上角用户图标 → **"My Profile"**
2. 点击 **"API Tokens"** 标签
3. 点击 **"Create Token"**
4. 点击 **"Create Custom Token"**
5. **配置**:
   - **Token name**: `Block IPs Token`
   - **Permissions**:
     - **Zone** → **Firewall Services** → **Edit**
     - **Zone** → **Zone** → **Read** (如果需要)
   - **Zone Resources**: 
     - **Include** → **Specific zone** → 选择 `derivativecalculatorai.com`
6. 点击 **"Continue to summary"** → **"Create Token"**
7. **复制Token**（只显示一次，保存好）

---

## 🔧 **方法1: 使用curl命令（最简单）**

### **创建脚本文件**

创建文件 `block-ips.sh`:

```bash
#!/bin/bash

# Cloudflare配置
ZONE_ID="你的Zone ID"  # 替换为你的Zone ID
API_TOKEN="你的API Token"  # 替换为你的API Token

# IP列表（评分≥100的IP）
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

echo "开始批量阻止IP..."

# 批量创建规则
for IP in "${IPS[@]}"; do
  echo "正在阻止: ${IP}"
  
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
    echo "✅ 成功阻止: ${IP}"
  else
    echo "❌ 失败: ${IP}"
    echo "响应: ${RESPONSE}"
  fi
  
  # 避免请求过快
  sleep 0.5
done

echo "完成！"
```

### **使用方法**

1. 创建文件: `block-ips.sh`
2. 替换`ZONE_ID`和`API_TOKEN`
3. 添加执行权限: `chmod +x block-ips.sh`
4. 运行: `./block-ips.sh`

---

## 🔧 **方法2: 使用Node.js脚本（更强大）**

### **创建脚本文件**

创建文件 `block-ips.js`:

```javascript
const https = require('https');

// Cloudflare配置
const ZONE_ID = '你的Zone ID';  // 替换为你的Zone ID
const API_TOKEN = '你的API Token';  // 替换为你的API Token

// IP列表（评分≥100的IP）
const IPS = [
  '198.35.47.192',
  '152.32.191.20',
  '152.32.212.226',
  '161.118.211.239',
  '213.35.120.237',
  '129.150.36.137',
  '34.133.255.234',
  '175.30.48.182'
];

async function blockIP(ip) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      mode: 'block',
      configuration: {
        target: 'ip',
        value: ip
      },
      notes: `High abuse score bot IP - Auto blocked from abuse_scores table`
    });

    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const result = JSON.parse(responseData);
        if (result.success) {
          resolve({ ip, success: true });
        } else {
          reject({ ip, success: false, errors: result.errors });
        }
      });
    });

    req.on('error', (error) => {
      reject({ ip, success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function blockAllIPs() {
  console.log('开始批量阻止IP...\n');

  const results = [];

  for (const ip of IPS) {
    try {
      console.log(`正在阻止: ${ip}...`);
      const result = await blockIP(ip);
      results.push(result);
      console.log(`✅ 成功阻止: ${ip}\n`);
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({ ip, success: false, error });
      console.log(`❌ 失败: ${ip}`);
      console.log(`错误: ${error.error || error.errors}\n`);
    }
  }

  console.log('\n=== 结果汇总 ===');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);

  if (failCount > 0) {
    console.log('\n失败的IP:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.ip}`);
    });
  }
}

blockAllIPs().catch(console.error);
```

### **使用方法**

1. 创建文件: `block-ips.js`
2. 替换`ZONE_ID`和`API_TOKEN`
3. 运行: `node block-ips.js`

---

## 🔧 **方法3: 使用Python脚本**

### **创建脚本文件**

创建文件 `block-ips.py`:

```python
import requests
import time

# Cloudflare配置
ZONE_ID = '你的Zone ID'  # 替换为你的Zone ID
API_TOKEN = '你的API Token'  # 替换为你的API Token

# IP列表（评分≥100的IP）
IPS = [
    '198.35.47.192',
    '152.32.191.20',
    '152.32.212.226',
    '161.118.211.239',
    '213.35.120.237',
    '129.150.36.137',
    '34.133.255.234',
    '175.30.48.182'
]

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

print('开始批量阻止IP...\n')

success_count = 0
fail_count = 0

for ip in IPS:
    print(f'正在阻止: {ip}...', end=' ')
    
    data = {
        'mode': 'block',
        'configuration': {
            'target': 'ip',
            'value': ip
        },
        'notes': 'High abuse score bot IP - Auto blocked from abuse_scores table'
    }
    
    url = f'https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/firewall/access_rules/rules'
    
    try:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        
        if result.get('success'):
            print('✅ 成功')
            success_count += 1
        else:
            print('❌ 失败')
            print(f'  错误: {result.get("errors", [])}')
            fail_count += 1
    except Exception as e:
        print('❌ 失败')
        print(f'  错误: {e}')
        fail_count += 1
    
    # 避免请求过快
    time.sleep(0.5)

print(f'\n=== 结果汇总 ===')
print(f'成功: {success_count}')
print(f'失败: {fail_count}')
```

### **使用方法**

1. 安装requests: `pip install requests`
2. 创建文件: `block-ips.py`
3. 替换`ZONE_ID`和`API_TOKEN`
4. 运行: `python block-ips.py`

---

## ✅ **验证方法**

### **方法1: 检查规则列表**

1. Cloudflare Dashboard → Security → WAF → Tools → IP Access Rules
2. 查看规则列表
3. 确认所有IP都已添加，状态为 **"Active"**

---

### **方法2: 使用API查询规则**

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules?configuration.target=ip&configuration.value=198.35.47.192" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

---

## 📝 **完整IP列表（所有评分≥50的IP）**

### **如果只想阻止评分≥100的IP（8个）**

```
198.35.47.192
152.32.191.20
152.32.212.226
161.118.211.239
213.35.120.237
129.150.36.137
34.133.255.234
175.30.48.182
```

### **如果想阻止所有评分≥50的IP（更全面）**

**先查询**:
```bash
wrangler d1 execute problems-db --remote --command="SELECT ip FROM abuse_scores WHERE score >= 50 ORDER BY score DESC;"
```

**然后**: 将结果添加到脚本中的IPS数组

---

## 🎯 **推荐方案**

### **立即执行**

1. **获取Zone ID和API Token**（5分钟）
2. **使用脚本批量阻止**（2分钟）
3. **验证规则是否生效**（1分钟）

### **预期效果**

- **立即阻止8个高分IP**
- **减少约20-30%的请求**
- **从103,680-190,080请求/天减少到约72,576-133,056请求/天**

---

## ✅ **总结**

### **批量阻止方法**

1. ✅ **使用Cloudflare API**（推荐，最快）
2. ✅ **使用Cloudflare Dashboard**（如果支持批量导入）
3. ✅ **逐个添加**（如果以上方法都不支持）

### **推荐**

- **使用bash脚本**（最简单，最快）
- **或使用Node.js脚本**（更强大，有错误处理）

---

**创建时间**: 2025-01-17  
**状态**: ✅ **完整脚本已提供**  
**优先级**: 🟢 **最高** - 立即执行
