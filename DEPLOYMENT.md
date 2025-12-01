# 部署指南

本项目包含两个版本：
1. **微信小程序版本** - 部署到微信开发者平台
2. **Web 版本** - 可部署到 Vercel、Netlify 等静态网站托管平台

---

## 一、微信小程序部署

### 前置要求
- 已注册微信小程序账号
- 已获取 AppID
- 已安装微信开发者工具

### 部署步骤

1. **配置 AppID**
   ```bash
   # 编辑 miniprogram/project.config.json
   # 将 appid 字段改为你的小程序 AppID
   ```

2. **使用微信开发者工具**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 项目目录选择本项目的 `miniprogram` 文件夹
   - AppID 填入你的小程序 AppID

3. **预览和调试**
   - 在开发者工具中点击"预览"
   - 使用微信扫描二维码在真机上测试

4. **上传代码**
   - 在开发者工具中点击"上传"
   - 填写版本号和项目备注
   - 上传成功后登录微信公众平台

5. **提交审核**
   - 登录[微信公众平台](https://mp.weixin.qq.com/)
   - 进入"版本管理"
   - 提交审核并等待审核通过
   - 审核通过后点击"发布"

---

## 二、Web 版本部署到 Vercel

### 前置要求
- GitHub 账号
- Vercel 账号（可使用 GitHub 登录）

### 方法 1：通过 Vercel 网站部署（推荐）

1. **推送代码到 GitHub**
   ```bash
   # 如果还未推送，执行以下命令
   git add .
   git commit -m "Add web version"
   git push origin main
   ```

2. **连接 Vercel**
   - 访问 [Vercel](https://vercel.com/)
   - 使用 GitHub 账号登录
   - 点击 "New Project"

3. **导入项目**
   - 选择你的 GitHub 仓库 `pension-optimize`
   - 点击 "Import"

4. **配置项目**
   ```
   项目名称: pension-optimize
   Framework Preset: Other
   Root Directory: ./
   Build Command: (留空)
   Output Directory: web
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成
   - 获得访问链接，如：`https://pension-optimize.vercel.app`

### 方法 2：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 在项目根目录执行
   vercel

   # 首次部署会询问以下问题：
   # ? Set up and deploy "E:\github\pension-v2.0"? [Y/n] y
   # ? Which scope do you want to deploy to? [选择你的账户]
   # ? Link to existing project? [N/y] n
   # ? What's your project's name? pension-optimize
   # ? In which directory is your code located? ./
   ```

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

### 方法 3：自定义域名

1. **在 Vercel 项目设置中**
   - 进入项目的 "Settings" -> "Domains"
   - 添加你的自定义域名
   - 按照提示配置 DNS 记录

2. **DNS 配置示例**
   ```
   类型: CNAME
   名称: www (或 @)
   值: cname.vercel-dns.com
   ```

---

## 三、部署到其他平台

### Netlify

1. **通过网站部署**
   - 访问 [Netlify](https://www.netlify.com/)
   - 点击 "Add new site" -> "Import an existing project"
   - 选择 GitHub 仓库
   - 配置：
     ```
     Build command: (留空)
     Publish directory: web
     ```

2. **通过 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --dir=web --prod
   ```

### GitHub Pages

1. **创建 GitHub Actions 工作流**

   创建 `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2

         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./web
   ```

2. **启用 GitHub Pages**
   - 进入仓库 Settings -> Pages
   - Source 选择 `gh-pages` 分支
   - 访问 `https://username.github.io/pension-optimize`

---

## 四、环境配置

### 修改城市配置

如需支持其他城市，编辑以下文件：

**微信小程序版本：**
```javascript
// miniprogram/config/cityConfig.js
const CITY_CONFIG = {
  北京: { ... },
  上海: {
    city: "上海",
    avgSalary: 11000,  // 修改为上海的数据
    baseMin: 6500,
    baseMax: 32000,
    // ... 其他配置
  }
};
```

**Web 版本：**
```javascript
// web/js/cityConfig.js
const CITY_CONFIG = {
  北京: { ... },
  上海: { ... }  // 添加新城市
};
```

### 更新 HTML 中的城市选项

```html
<!-- web/index.html -->
<select id="city" name="city" required>
  <option value="北京">北京</option>
  <option value="上海">上海</option>
  <!-- 添加更多城市 -->
</select>
```

---

## 五、常见问题

### Q1: Vercel 部署后无法访问？
**A:** 检查 `vercel.json` 配置是否正确，确保 `web` 目录存在且包含 `index.html`。

### Q2: 计算结果不正确？
**A:** 检查 `cityConfig.js` 中的参数是否为最新的政策数据。

### Q3: 如何更新已部署的版本？
**A:**
- Vercel: 推送代码到 GitHub 后会自动重新部署
- 微信小程序: 重新上传代码并提交审核

### Q4: 如何查看部署日志？
**A:**
- Vercel: 在项目的 "Deployments" 页面查看详细日志
- Netlify: 在 "Deploys" 页面查看构建日志

### Q5: Web 版本支持 HTTPS 吗？
**A:** Vercel 和 Netlify 自动提供免费的 SSL 证书，所有部署都支持 HTTPS。

---

## 六、性能优化建议

### 1. 启用缓存
Vercel 已在 `vercel.json` 中配置了缓存策略：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        }
      ]
    }
  ]
}
```

### 2. 压缩资源
生产环境建议启用 Gzip 压缩（Vercel 和 Netlify 默认启用）。

### 3. 图片优化
如果添加图片资源，建议使用 WebP 格式并压缩。

---

## 七、监控和分析

### Vercel Analytics
```bash
# 在 Vercel 项目设置中启用 Analytics
# 无需修改代码，自动收集访问数据
```

### Google Analytics
在 `web/index.html` 的 `<head>` 中添加：
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>
```

---

## 八、技术支持

- **项目地址**: https://github.com/manmonthW/pension-optimize
- **问题反馈**: 提交 GitHub Issues
- **文档更新**: 查看项目 README.md

---

## 九、许可证

本项目采用 MIT 许可证，可自由使用和修改。
