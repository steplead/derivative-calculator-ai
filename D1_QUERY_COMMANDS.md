# 🔍 D1数据库查询命令（正确格式）

> **注意**: 不要包含 `>` 提示符在命令中  
> **格式**: 直接复制命令，不要包含 `>`

---

## ✅ **正确的命令格式**

### **❌ 错误格式（包含提示符）**
```bash
> wrangler d1 execute problems-db --command="SELECT ..."
```

### **✅ 正确格式（不包含提示符）**
```bash
wrangler d1 execute problems-db --command="SELECT ..."
```

---

## 📋 **正确的查询命令**

### **1. 检查表是否存在**

```bash
wrangler d1 execute problems-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name='ip_logs';"
```

**注意**: 
- 不要包含 `>` 符号
- 直接复制上面的命令
- 在终端中粘贴并回车

---

### **2. 如果表不存在，创建表**

```bash
wrangler d1 execute problems-db --command="CREATE TABLE IF NOT EXISTS ip_logs (ip TEXT NOT NULL, pathname TEXT NOT NULL, user_agent TEXT, timestamp INTEGER NOT NULL, count INTEGER DEFAULT 1, last_seen INTEGER NOT NULL, PRIMARY KEY (ip, pathname, DATE(timestamp, 'unixepoch')));"
```

---

### **3. 查看所有表**

```bash
wrangler d1 execute problems-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

### **4. 查询所有IP（如果表存在）**

```bash
wrangler d1 execute problems-db --command="SELECT ip, SUM(count) as total_requests FROM ip_logs WHERE timestamp > strftime('%s', 'now', '-24 hours') GROUP BY ip ORDER BY total_requests DESC LIMIT 100;"
```

---

## 🔧 **如果仍然出错**

### **检查1: 确保在项目目录中**

```bash
cd /Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI
```

### **检查2: 确保wrangler已安装**

```bash
npm list -g wrangler
```

如果没有安装：
```bash
npm install -g wrangler
```

### **检查3: 确保已登录Cloudflare**

```bash
wrangler login
```

---

## 📝 **完整步骤**

### **步骤1: 进入项目目录**

```bash
cd /Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI
```

### **步骤2: 查看所有表**

```bash
wrangler d1 execute problems-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### **步骤3: 如果ip_logs表不存在，创建它**

```bash
wrangler d1 execute problems-db --command="CREATE TABLE IF NOT EXISTS ip_logs (ip TEXT NOT NULL, pathname TEXT NOT NULL, user_agent TEXT, timestamp INTEGER NOT NULL, count INTEGER DEFAULT 1, last_seen INTEGER NOT NULL, PRIMARY KEY (ip, pathname, DATE(timestamp, 'unixepoch')));"
```

### **步骤4: 查询所有IP**

```bash
wrangler d1 execute problems-db --command="SELECT ip, SUM(count) as total_requests FROM ip_logs WHERE timestamp > strftime('%s', 'now', '-24 hours') GROUP BY ip ORDER BY total_requests DESC LIMIT 100;"
```

---

## ✅ **总结**

### **关键点**
- ❌ **不要包含 `>` 符号**（这是shell提示符）
- ✅ **直接复制命令**（不包含提示符）
- ✅ **在终端中粘贴并回车**

### **如果出错**
1. 检查是否在项目目录中
2. 检查wrangler是否已安装
3. 检查是否已登录Cloudflare

---

**创建时间**: 2025-01-17  
**状态**: ✅ **正确命令格式已提供**
