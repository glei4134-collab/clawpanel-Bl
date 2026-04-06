# ClawPanel-Bl 更新日志

基于 [ClawPanel](https://github.com/qingchencloud/clawpanel) 的魔改版本更新日志。

---

## [0.6.0-Bl] - 2026-04-06

### 首次发布

本版本是基于 ClawPanel 原版的魔改版本，聚焦于 UI 增强和 3D 头像系统。

### ✅ 新增功能

#### 3D 头像系统
- Three.js 驱动的 3D 头像展示
- 支持多种角色模型：
  - 机器人 (avatar-robot.glb)
  - 精灵 (avatar-elf.glb)
  - 盔甲士兵 (avatar-armor.glb, soldier-color.glb)
  - 青蛙 (avatar-frog.glb)
  - 浣熊头 (raccoon_head.glb)
- 表情动画控制（眨眼、张嘴等）
- 模型优化加载，支持大文件压缩
- 独立演示页面 `/avatar-3d-demo`

#### 分屏对话模式
- 左/右侧分屏自由切换
- 同步/独立对话模式
- 分屏状态自动保存
- 独立会话管理

#### UI 增强系统
- **气泡风格系统**：现代、经典、简约、渐变四种风格
- **音效系统**：清脆、泡泡、叮咚、机械键盘四种音效 + 静音
- **背景系统**：
  - 自定义背景图片（自动压缩到 500KB）
  - 全局模糊度调节
  - 亮度与透明度独立调节
  - 各区域独立细调
- **侧边栏透明度**：0-100% 透明度实时调节
- **热部署模式**：
  - 开发者工具 (devtools) 启用
  - Vite HMR 热重载
- **拖拽上传**：支持拖拽文件上传
- **UI 设置面板**：浮动面板设计，所有设置一目了然

#### 窗口管理
- 多窗口支持
- 窗口位置和大小记忆
- 可调整大小、最大化、最小化
- `window-manager.js` 独立模块

#### 开发者体验
- Tauri devtools 配置启用
- Playwright 测试框架集成
- 多窗口测试用例
- 分屏功能单元测试

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

### 🔧 代码优化

- **chat.js 修复**：
  - 修复 `const userDiv` 重复赋值的错误
  - 优化消息发送和重试逻辑
- **tauri.conf.json 配置**：
  - 添加 `devtools: true` 热部署支持
  - 添加 `dragDropEnabled: true` 拖拽支持
  - 统一 `withGlobalTauri` 和 `security` 配置

### 📝 文档更新

- **README.md**：魔改版 vs 原版对比，新增功能清单，移除功能说明
- **CONTRIBUTING.md**：3D 模型规范，开发测试指南
- **SECURITY.md**：桌面应用安全注意事项
- **AGENTS.md**：项目级 AI 助手配置

### 🎨 UI/UX 改进

- 统一 Select 样式
- 创建 modal-select 组件
- 优化滑块性能
- 鼠标点击效果 (cursor trail)
- 自定义滚动条样式
- 统一组件设计语言

### 🔨 技术栈

- **前端**: 原生 JavaScript + CSS
- **3D渲染**: Three.js
- **后端**: Tauri v2 (Rust)
- **构建**: Vite
- **桌面**: WebView2 / WebKit
- **测试**: Playwright

---

## 对比原版

| 功能 | ClawPanel (原版) | ClawPanel-Bl (魔改) |
|------|------------------|---------------------|
| 3D 头像 | ❌ 无 | ✅ Three.js 实现 |
| 分屏对话 | ❌ 无 | ✅ 支持 |
| 气泡风格 | ❌ 无 | ✅ 四种风格 |
| 音效系统 | ❌ 无 | ✅ 四种音效 |
| 背景系统 | 简单 | ✅ 高级（模糊/亮度/透明度） |
| 热部署 | ❌ 无 | ✅ devtools + HMR |
| 多窗口 | ❌ 无 | ✅ 支持 |
| UI 设置面板 | ❌ 无 | ✅ 浮动面板 |
| AI 助手 | ✅ 有 | ❌ 移除 |
| 消息渠道 | ✅ 有 | ❌ 移除 |
| 服务管理 | ✅ 有 | ❌ 移除 |
| 模型配置 | ✅ 有 | ❌ 移除 |
| Agent 管理 | ✅ 有 | ❌ 移除 |

---

## 下一步计划

- [ ] 3D 头像与聊天界面集成
- [ ] 更多 3D 模型
- [ ] 自定义头像上传
- [ ] 主题系统增强
- [ ] 动画效果增强

---

**魔改作者**：glei4134
**仓库地址**：https://github.com/glei4134-collab/clawpanel-Bl
**原始项目**：https://github.com/qingchencloud/clawpanel
