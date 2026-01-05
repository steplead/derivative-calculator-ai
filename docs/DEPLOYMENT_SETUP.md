# 🚀 自动部署配置指南

## ✅ 已完成

- ✅ 创建 GitHub Actions 工作流：`.github/workflows/deploy.yml`
- ✅ 配置自动构建和部署到 Cloudflare Pages

---

## 🔧 需要你手动配置（一次性）

### **步骤 1：获取 Cloudflare API Token**

1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择模板：**Edit Cloudflare Workers** (或自定义)
4. 权限设置：
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Zone** → **Zone** → **Read** (可选)
   - **Account Resources** → 选择你的账户
5. 点击 "Continue to summary" → "Create Token"
6. **复制 Token**（只显示一次！）

### **步骤 2：获取 Cloudflare Account ID**

1. 访问：https://dash.cloudflare.com/
2. 点击任意域名或 Pages 项目
3. 在右侧边栏找到 **Account ID**
4. 复制 ID

### **步骤 3：配置 GitHub Secrets**

1. 访问你的 GitHub 仓库：
   ```
   https://github.com/steplead/derivative-calculator-ai
   ```

2. 进入：**Settings** → **Secrets and variables** → **Actions**

3. 点击 **New repository secret**，添加以下两个 secrets：

   #### Secret 1: `CLOUDFLARE_API_TOKEN`
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: 粘贴步骤 1 获取的 API Token
   - 点击 "Add secret"

   #### Secret 2: `CLOUDFLARE_ACCOUNT_ID`
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: 粘贴步骤 2 获取的 Account ID
   - 点击 "Add secret"

---

## ✨ 完成！现在开始自动部署

配置完成后：

### **自动触发**
每次 `push` 到 `main` 分支时自动部署：
```bash
git add .
git commit -m "feat: new feature"
git push origin main
# 🚀 自动开始构建和部署！
```

### **手动触发**
访问 GitHub Actions 页面：
```
https://github.com/steplead/derivative-calculator-ai/actions
```
点击 "Deploy to Cloudflare Pages" → "Run workflow"

---

## 📊 部署流程

```
Push to main
    ↓
GitHub Actions 触发
    ↓
1. 安装依赖
2. 生成 sitemap
3. Next.js 构建
4. Cloudflare Pages 适配
5. 部署到 Cloudflare
    ↓
✅ 自动上线（约 3-5 分钟）
```

---

## 🔍 查看部署状态

### GitHub Actions
```
https://github.com/steplead/derivative-calculator-ai/actions
```

### Cloudflare Pages
```
https://dash.cloudflare.com/[account-id]/pages/view/derivative-calculator-ai
```

---

## 🧪 本地测试部署

在推送前测试构建：
```bash
npm run pages:build
```

---

## ⚠️ 常见问题

### Q: 部署失败？
**A**: 检查 Secrets 是否正确配置：
- `CLOUDFLARE_API_TOKEN` 权限是否足够
- `CLOUDFLARE_ACCOUNT_ID` 是否正确

### Q: 构建成功但页面 404？
**A**: 等待 2-3 分钟让 Cloudflare CDN 全球传播

### Q: 如何回滚？
**A**: 在 Cloudflare Pages Dashboard → Deployment History → Rollback

---

## 📝 当前配置摘要

- **部署平台**: Cloudflare Pages
- **构建工具**: Next.js + @cloudflare/next-on-pages
- **触发条件**: Push to main branch
- **构建时间**: ~3-5 分钟
- **CDN**: 全球 Cloudflare 边缘网络

---

*配置完成后，每次推送代码都会自动部署！* 🎉
