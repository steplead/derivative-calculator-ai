# 🌐 Cloudflare Pages 自定义域名配置指南

## ✅ 当前状态

| 域名 | 状态 | 说明 |
|------|------|------|
| `derivativecalculatorai.com` | ✅ 已配置 | 主域名，正在工作 |
| `www.derivativecalculatorai.com` | ❓ 待配置 | 可选的 www 子域名 |

---

## 🎯 **场景 1：确认当前域名配置**

### **检查方法**

#### 1. 访问 Cloudflare Pages Dashboard
```
https://dash.cloudflare.com/[你的账户ID]/pages/view/derivative-calculator-ai
```

#### 2. 点击 **Custom domains** 标签
你应该看到：
- ✅ `derivativecalculatorai.com` (Active)
- ⚠️ `www.derivativecalculatorai.com` (可能未配置)

---

## 🚀 **场景 2：添加 www 子域名（推荐）**

### **为什么要添加 www？**
- ✅ 用户习惯：很多人会输入 www
- ✅ SEO 最佳实践：避免重复内容
- ✅ 更好的兼容性

### **配置步骤**

#### **Step 1: 在 Cloudflare Pages 添加域名**
1. 访问：https://dash.cloudflare.com/
2. 进入：Pages → derivative-calculator-ai → **Custom domains**
3. 点击：**Set up a custom domain**
4. 输入：`www.derivativecalculatorai.com`
5. 点击：**Activate domain**

#### **Step 2: 配置 DNS 记录**
如果域名不在 Cloudflare，需要在你的 DNS 提供商添加：

```
类型: CNAME
名称: www
值: derivativecalculatorai.pages.io
代理: 启用（橙色云朵）
```

如果域名**已在 Cloudflare**：
```
类型: CNAME
名称: www
目标: derivativecalculatorai.pages.io
代理状态: Proxied (橙色云朵)
```

#### **Step 3: 等待 SSL 证书**
- ⏰ 通常 5-15 分钟
- ✅ 证书自动签发
- 🔒 自动 HTTPS

---

## 🌍 **场景 3：添加其他域名（多域名）**

### **示例：添加 mathcalculator.com**

#### **Step 1: 添加域名到 Cloudflare**
1. 在 Cloudflare 添加你的域名
2. 更改域名 NS 服务器到 Cloudflare

#### **Step 2: 在 Cloudflare Pages 绑定**
1. Pages → derivative-calculator-ai → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入：`mathcalculator.com`
4. 点击 **Activate domain**

#### **Step 3: 配置 DNS**
```
类型: CNAME
名称: @ (或留空)
值: derivativecalculatorai.pages.io
代理: Proxied
```

---

## 📊 **场景 4：域名重定向规则**

### **目标：所有域名指向主域名**

#### **在 Cloudflare Pages 设置重定向**

1. 进入：Pages → derivative-calculator-ai → **Settings** → **Functions**

2. 添加重定向规则（`_redirects` 文件）：

```txt
# 将 www 重定向到主域名
https://www.derivativecalculatorai.com/* https://derivativecalculatorai.com/:splat 301!

# 将其他域名重定向到主域名
https://mathcalculator.com/* https://derivativecalculatorai.com/:splat 301!
```

或者添加到 `public/_redirects` 文件：

```txt
# 主域名规范
https://www.derivativecalculatorai.com/* https://derivativecalculatorai.com/:splat 301!
```

---

## 🔧 **场景 5：Next.js 环境变量配置**

### **确保域名配置正确**

在 `.env.local` 或 Cloudflare Pages 环境变量中：

```bash
NEXT_PUBLIC_SITE_URL=https://derivativecalculatorai.com
```

### **更新 sitemap 生成脚本**

检查 `scripts/generate-sitemap.js`：

```javascript
const BASE_URL = 'https://derivativecalculatorai.com';
```

---

## ✅ **验证域名配置**

### **1. 检查 HTTP 状态**
```bash
curl -I https://derivativecalculatorai.com/
# 应该返回: HTTP/2 200
```

### **2. 检查 HTTPS 证书**
```bash
curl -vI https://derivativecalculatorai.com/ 2>&1 | grep SSL
# 应该显示证书信息
```

### **3. 检查 DNS 解析**
```bash
nslookup derivativecalculatorai.com
# 应该返回 Cloudflare IP
```

### **4. SEO 检查**
访问：
- https://search.google.com/search-console
- 确认所有域名版本都已添加（www 和非 www）
- 设置首选域名：`https://derivativecalculatorai.com`

---

## 🎯 **最佳实践建议**

### **1. 域名规范**
- ✅ 主域名：`https://derivativecalculatorai.com`
- ✅ www 重定向到主域名
- ✅ 全部强制 HTTPS

### **2. SEO 配置**
```javascript
// app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://derivativecalculatorai.com'),
  // ...
}
```

### **3. Sitemap 提交**
- Google Search Console: 提交 sitemap
- Bing Webmaster Tools: 提交 sitemap

### **4. 监控**
- Cloudflare Analytics: 监控流量
- Google Search Console: 监控 SEO
- Uptime monitoring: 确保可用性

---

## ⚠️ **常见问题**

### **Q1: 域名显示 404？**
**A**: 检查 DNS 记录是否正确，等待 5-10 分钟传播

### **Q2: SSL 证书待签发？**
**A**: 等待 15-30 分钟，Cloudflare 会自动签发

### **Q3: 多个域名重复内容？**
**A**: 使用 301 重定向指向主域名

### **Q4: 如何更改主域名？**
**A**:
1. 在 Cloudflare Pages 添加新域名
2. 等待 SSL 证书签发
3. 更新 `.env` 和 `sitemap`
4. 旧域名设置 301 重定向

---

## 📝 **快速配置清单**

- [ ] 主域名 `derivativecalculatorai.com` 已配置 ✅
- [ ] www 子域名已添加（推荐）
- [ ] DNS 记录正确配置
- [ ] SSL 证书已签发
- [ ] 强制 HTTPS 已启用
- [ ] www 重定向到主域名
- [ ] 更新 `NEXT_PUBLIC_SITE_URL`
- [ ] 更新 sitemap
- [ ] 提交到 Google Search Console
- [ ] 配置 Google Analytics

---

## 🎉 **完成！**

你的网站现在应该可以通过以下方式访问：
- ✅ https://derivativecalculatorai.com
- ✅ https://www.derivativecalculatorai.com（如果配置）

所有请求都会自动 HTTPS，并获得 Cloudflare CDN 加速！

---

*最后更新：2025-01-05*
