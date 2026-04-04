# ClawPanel

OpenClaw 可视化管理面板，基于 Tauri v2 的跨平台桌面应用。

## 功能特点

- 🎨 **UI 自定义** - 背景图片、透明度、模糊度、亮度独立调节
- 🔊 **音效系统** - 多种音效预设，实时音量调节
- 💬 **气泡样式** - 多种气泡风格可选
- 🖼️ **无损背景** - 本地磁盘存储，保持原图质量
- 🌐 **多语言** - 支持中英日韩等语言

## 技术栈

- **前端**: 原生 JavaScript + CSS
- **后端**: Tauri v2 (Rust)
- **构建**: Vite

## 项目结构

```
clawpanel/
├── src/                    # 前端源码
│   ├── pages/              # 页面模块
│   ├── components/          # 通用组件
│   ├── lib/                # 工具库
│   ├── style/              # 样式文件
│   ├── router.js           # 路由
│   └── main.js             # 入口
├── src-tauri/              # Rust 后端
│   ├── src/                # Tauri 命令
│   ├── Cargo.toml          # Rust 依赖
│   └── tauri.conf.json     # Tauri 配置
├── public/                  # 静态资源
├── index.html               # HTML 入口
├── vite.config.js          # Vite 配置
└── package.json            # 前端依赖
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run tauri build
```

## 系统要求

- Windows 10+ / macOS 10.15+ / Linux
- WebView2 Runtime (Windows)

## 许可证

AGPL-3.0
