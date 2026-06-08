# 3D 作品集入口（Henry Heffernan 风格）

基于 [henryheffernan.com](https://henryheffernan.com/) 的 3D 书桌场景，显示器内嵌你的 Win95 记事本作品集（`about.html`），**原有文案与图片内容未改**。

## 本地运行

```bash
cd portfolio-3d
npm install
npm run dev
```

浏览器打开终端里显示的地址（通常是 `http://localhost:8080`）：

1. BIOS 加载屏 → 点击 **START**
2. 3D 书桌场景 → 鼠标移入显示器可放大
3. 显示器内为 `about.html`（关于我 / 实习 / 商业设计等）
4. 窗口标题栏 **×** 返回 3D 桌面

## 生产构建

```bash
cd portfolio-3d
npm run build
npm start
```

Express 会同时提供 3D 入口（`public/`）与根目录静态页（`about.html`、`css/`、`js/`、`assets/`）。

## 页面说明

| 文件 | 用途 |
|------|------|
| `portfolio-3d/` | 3D 入口（Webpack + Three.js） |
| `about.html` | 作品集主界面（Win95 窗口） |
| `cover.html` | 原刮刮卡封面页（备用） |

## 资源来源

3D 模型、贴图、音效来自 Henry 开源项目；已通过 `henryheffernan.com` 下载至 `portfolio-3d/static/`。
