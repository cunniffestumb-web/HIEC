# HIEC 2.0 部署指南

## 环境要求

- Node.js 18 或更高版本；
- 可选：DeepSeek 服务端密钥；
- 浏览器建议使用最新版 Chrome、Edge 或 Firefox。

## 访问范围

- `http://localhost:5173/`：只有启动服务的这台电脑可以访问。
- `http://局域网IP:5173/`：同一 Wi-Fi 或局域网内的设备可以访问，当前电脑的局域网 IP 会在启动日志中打印。
- 公网长期访问：需要把项目部署到 Render、Railway、VPS 或已登录的 Vercel。单纯把 `localhost` 发给别人不能访问。

当前静态公网地址：[https://cunniffestumb-web.github.io/HIEC/](https://cunniffestumb-web.github.io/HIEC/)。它由 GitHub Pages 提供 HTTPS，不要求 ICP 备案，适合网页、PWA、3D 场景和离线演示。

临时隧道地址只适合当天演示，依赖本机服务和隧道进程，不能当作比赛材料中的永久链接。

## 中国大陆访问建议

本项目可以使用 Vercel、Render 或 GitHub Pages 提供 HTTPS 公网地址，不需要购买域名，也不需要 ICP 备案。需要明确的是：不备案的海外托管平台无法保证中国大陆所有网络环境都能稳定访问，延迟还会受运营商和平台线路影响。

为了让大陆用户尽量低延迟，建议按以下顺序选择：

1. 先用 Vercel 自动分配的 HTTPS 域名做公开演示，部署最快，静态页面由 CDN 分发，默认离线模式不依赖后端模型。
2. 如果实际测试发现部分校园网或移动网络不稳定，再把同一份静态文件迁移到可从大陆稳定访问的海外对象存储/CDN，或使用团队已有的境外节点。
3. 不建议把 GitHub Pages 作为唯一访问入口。它适合作为代码仓库和备用演示地址，但大陆访问速度和可达性不稳定。

页面中的 3D 场景、PWA 安装和离线缓存均不要求登录。AI 在线问答需要在托管平台环境变量中配置服务端密钥；未配置时会自动使用离线演示回答。

GitHub Pages 只发布静态文件，不执行 `应用/api/` 下的 Node/Vercel 函数。因此该地址会使用离线演示模式；要启用服务端 AI 接口，请使用 Render 或 Vercel，并将根目录设置为 `应用`。

## PWA 安装

公网 HTTPS 地址部署后，在手机浏览器打开首页或任意页面即可看到“安装到手机”入口。支持的浏览器会直接弹出安装提示；其他浏览器会提示从浏览器菜单选择“添加到主屏幕”。安装后网页以独立窗口打开，并可在弱网时继续使用已缓存的基础页面和两个重点课程。

当前版本没有把 APK 假装成已经生成的下载包。等公网地址稳定后，可以用 Capacitor 将同一套 PWA 封装成 Android APK，再配置签名、版本号和下载页；APK 与网页共用前端代码，适合后续分享。

## 启动

在当前目录执行：

```bash
npm install
npm start
```

浏览器访问 `http://localhost:5173/`。

默认使用离线演示模式，不需要网络或 API 密钥。运行前复制 `.env.example` 为 `.env`，并设置以下内容即可切换在线模型：

```text
HIEC_AI_MODE=deepseek
DEEPSEEK_API_KEY=你的服务端密钥
DEEPSEEK_MODEL=deepseek-chat
```

## 检查

```bash
npm run check
npm audit --omit=dev
```

## Render 部署

将项目放入 GitHub 仓库，在 Render 新建 Web Service，设置根目录为 `应用`，构建命令为 `npm ci`，启动命令为 `npm start`，健康检查路径为 `/api/health`。也可以让 Render 读取上一级目录的 `render.yaml`。

默认离线模式不需要任何密钥。在线 DeepSeek 模式只在托管平台的环境变量中设置 `HIEC_AI_MODE=deepseek`、`DEEPSEEK_API_KEY` 和可选的 `DEEPSEEK_MODEL`，不要写入 HTML、JavaScript 或截图。

如果只是个人演示，也可以进入功能页的 API 设置，选择“DeepSeek（浏览器直连）”，填写 DeepSeek API 地址、模型和自己的 Key。浏览器直连依赖模型服务允许跨域请求，Key 会保存在当前浏览器本地，不建议把这种配置作为多人共享网址的生产方案。

## Vercel 部署

在 `应用` 目录执行 `vercel --prod` 并完成登录。Vercel 会托管静态页面和 `api/` 下的 AI、健康检查、配置函数。由于 Vercel 不承载本项目的长连接 WebSocket，3D 协作页会自动退回本地演示；需要多人实时同步时使用 Render 或 Railway。

## 演示建议

优先打开 `chemistry.html` 或 `3d-collaboration.html`，展示分子结构、旋转缩放、讨论消息和在线人数。解剖、历史、天文场景仍可从首页或 `scenarios.html` 进入。
