# ClawPanel-Bl

基于 [ClawPanel](https://github.com/qingchencloud/clawpanel) 的魔改版本。

原始仓库：[qingchencloud/clawpanel](https://github.com/qingchencloud/clawpanel)

## 魔改版本 vs 原版

### ✅ 新增功能

#### 3D 头像系统
- Three.js 驱动的 3D 头像展示
- 支持多种角色模型（机器人、精灵、盔甲士兵、青蛙等）
- 表情动画控制（眨眼、张嘴等）
- 模型优化加载

#### 分屏对话模式
- 左/右侧分屏自由切换
- 同步/独立对话模式
- 分屏状态自动保存

#### UI 增强系统
- **气泡风格系统**：现代、经典、简约、渐变四种风格
- **音效系统**：清脆、泡泡、叮咚、机械键盘四种音效 + 静音
- **背景系统**：自定义图片、自动压缩、模糊度/亮度/透明度独立调节
- **侧边栏透明度**：0-100% 透明度实时调节
- **热部署模式**：开发者工具 + Vite HMR 热重载
- **拖拽上传**：支持拖拽文件上传

#### 窗口管理
- 多窗口支持
- 窗口位置和大小记忆
- 可调整大小、最大化、最小化

### ❌ 移除功能

为简化项目体积，移除了以下功能：

- ~~AI 助手模块~~
- ~~消息渠道管理（Telegram/Discord/飞书等）~~
- ~~服务管理（OpenClaw 启停控制）~~
- ~~模型配置管理~~
- ~~Gateway 配置界面~~
- ~~Agent 管理模块~~
- ~~记忆管理模块~~
- ~~定时任务模块~~
- ~~扩展工具模块~~
- ~~自动更新机制~~

### ⚙️ 保留功能

- 基础聊天界面
- 消息收发（需 OpenClaw 后端）
- WebSocket 实时通信
- 基础 UI 样式
- 路由系统

## 技术栈

- **前端**: 原生 JavaScript + CSS
- **3D渲染**: Three.js
- **后端**: Tauri v2 (Rust)
- **构建**: Vite
- **桌面**: WebView2 / WebKit

## 项目结构

```
clawpanel-bl/
├── src/
│   ├── pages/                 # 页面模块
│   │   ├── chat.js           # 聊天页面（含分屏）
│   │   └── avatar-3d-demo.js # 3D头像演示
│   ├── components/            # 组件
│   │   ├── avatar-3d/        # 3D头像组件
│   │   ├── sidebar.js
│   │   └── ui-settings-panel.js
│   ├── lib/                   # 工具库
│   │   ├── 3d/               # Three.js 封装
│   │   ├── tauri-api.js
│   │   ├── ws-client.js
│   │   └── window-manager.js
│   ├── style/                # 样式文件
│   └── locales/              # 多语言
├── src-tauri/                # Rust 后端
├── public/models/            # 3D模型文件(.glb)
└── index.html
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建桌面应用
npm run tauri build
```

## 系统要求

- Windows 10+ / macOS 10.15+ / Linux
- WebView2 Runtime (Windows)

## 许可证

AGPL-3.0

---

魔改作者：[glei4134](https://github.com/glei4134-collab)
