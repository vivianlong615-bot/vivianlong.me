# Vivian Long — 3D Portfolio

3D 书桌场景（Henry Heffernan 风格）+ Win95 记事本作品集。

## 本地开发

```bash
cd portfolio-3d
npm install
./start-dev.sh
```

浏览器打开 **http://localhost:8082**，硬刷新 `Cmd + Shift + R`。

## 部署到 GitHub Pages

### 1. 创建 GitHub 仓库

在 GitHub 新建仓库（例如 `portfolio`），**不要**勾选「Add README」（若本地已有代码）。

### 2. 推送代码

在项目根目录（`Zoom/`）执行：

```bash
git init
git add .
git commit -m "Initial portfolio deploy"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

> 若本机未安装 Git，可用 [GitHub Desktop](https://desktop.github.com/) 导入此文件夹并 Publish。

### 3. 开启 GitHub Pages

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
3. 推送 `main` 分支后，Actions 会自动运行 `Deploy to GitHub Pages`
4. 部署完成后访问：`https://你的用户名.github.io/你的仓库名/`

### 4. 本地预构建（可选）

```bash
bash scripts/build-pages.sh
# 静态产物在 portfolio-3d/public/
```

## 贴图补丁（改 3D 颜色/图案后）

```bash
cd portfolio-3d
npm run patch-desk && npm run patch-chair
npm run patch-plant && npm run patch-coffee
npm run patch-logo
```

改完重新 commit 并 push，Pages 会自动重新部署。

## 目录说明

| 路径 | 说明 |
|------|------|
| `portfolio-3d/` | 3D 场景（Webpack + Three.js） |
| `about.html` | 记事本作品集界面 |
| `css/`、`js/`、`assets/` | 作品集静态资源 |
| `scripts/build-pages.sh` | 生产构建脚本 |
| `.github/workflows/deploy.yml` | GitHub Pages 自动部署 |
