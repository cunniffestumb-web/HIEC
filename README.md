# HIEC 技术优化版

这是原项目的独立技术优化副本。原项目目录保持不变，现有宣传册、PPT、PDF 和四个教学场景均保留在本目录中。

## 目录

- `应用/`：可运行的全栈展示应用。
- `应用/server.js`：静态文件服务、AI 代理、健康检查和 WebSocket 协作服务。
- `应用/docs/`：架构、API 和部署说明。
- `应用/vendor/`：本地 Three.js 和 Font Awesome 资源。
- `材料-原版/`：原始宣传材料备份。
- `技术优化报告.md`：本次改造和项目全景说明。

## 启动

要求 Node.js 18 或更高版本。在 `应用` 目录执行：

```bash
npm install
npm start
```

访问 `http://localhost:5173/`。

服务默认监听 `0.0.0.0`。同一 Wi-Fi 下的其他设备可访问终端打印的局域网地址；`localhost` 只代表当前电脑。

## 公网访问

当前电脑上的临时公网预览地址不会作为永久网址写入项目，因为它依赖本机进程，关闭服务后会失效。要让所有人长期访问，请将本目录上传到 GitHub 后使用 Render 部署，项目根目录选择 `HIEC-技术优化版`，服务根目录选择 `应用`；根目录的 `render.yaml` 已准备好配置。

当前已启用 GitHub Pages 公网预览：[https://cunniffestumb-web.github.io/HIEC/](https://cunniffestumb-web.github.io/HIEC/)。该地址提供 HTTPS，不要求 ICP 备案，适合手机浏览器访问和“安装到手机”PWA。GitHub Pages 发布的是 `应用/`，本地的 `材料-原版/` 不参与网站部署。

GitHub Pages 是静态托管，因此默认离线演示、化学和历史交互、3D 场景、学习记录与 PWA 均可用；`/api` 服务端接口需要使用下方的 Render 或 Vercel 部署方式。

也可以在 Vercel 登录后进入 `应用` 目录执行 `vercel --prod`。Vercel 适合公开网页和 AI 接口，WebSocket 协作会自动降级为本地演示；需要真实 WebSocket 协作时使用 Render 或 Railway。海外托管平台不需要 ICP 备案，但中国大陆不同运营商的访问速度和稳定性可能有差异，建议先用 Vercel HTTPS 域名实测，再决定是否迁移到已有的境外 CDN 节点。

默认是离线演示模式，不需要 API 密钥。功能页的 API 设置可以直接填写 DeepSeek 地址、模型和 Key；也可以复制 `应用/.env.example` 为 `应用/.env`，配置 `HIEC_AI_MODE=deepseek` 和 `DEEPSEEK_API_KEY`，使用服务端代理。浏览器直连只适合个人或比赛演示，Key 会保存在当前浏览器本地；公共部署建议使用服务端代理。

## 主要演示入口

- `index.html`：项目总览。
- `anatomy.html`：解剖学场景。
- `chemistry.html`：化学分子场景。
- `history.html`：历史场景。
- `astronomy.html`：天文场景。
- `3d-collaboration.html`：化学分子 3D 协作和 WebSocket 演示。

化学和历史页面已经加入可完成的引导探究、知识检测、本地学习报告和移动端布局；公网 HTTPS 部署后，手机浏览器可通过“安装到手机”添加为 PWA。APK 适合在公网地址稳定后用 Capacitor 封装并签名发布，当前不把未签名包当作可分享成品。

## 检查

```bash
npm run check
npm audit --omit=dev
```
