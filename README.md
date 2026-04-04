# ClawPanel-Bl

基于 [ClawPanel](https://github.com/qingchencloud/clawpanel) 的魔改版本。

原始仓库：[qingchencloud/clawpanel](https://github.com/qingchencloud/clawpanel)

## 基于原版的特殊功能

### UI 模糊度细调系统
- 全局模糊度调节（背景图片模糊）
- 各区域独立模糊度细调：侧边栏、主区域、消息列表、会话列表、输入区域
- 细调范围 -100% ~ +100%，在全局基础上加减

### 本地无损背景存储
- 背景图片存储到本地磁盘（`$APPDATA/clawpanel/background.png`）
- 不受 localStorage 5MB 限制
- 保持原图质量

### 亮度与透明度独立调节
- 背景亮度独立调节（0% ~ 100%+）
- 背景透明度独立调节
- 各区域透明度细调

## 已移除/未实现功能

- ❌ AI 助手（需要 OpenClaw 后端对接）
- ❌ 消息渠道管理（Telegram/Discord/飞书等）
- ❌ 服务管理（OpenClaw 启停控制）
- ❌ 模型配置管理
- ❌ Gateway 配置
- ❌ Agent 管理
- ❌ 记忆管理
- ❌ 定时任务
- ❌ 扩展工具
- ❌ 自动更新机制

## 期望实现的功能

- [ ] 完整的 UI 设置面板
- [ ] 主题切换（暗色/亮色）
- [ ] 气泡动画开关
- [ ] 侧边栏折叠功能
- [ ] 分屏模式
- [ ] 自定义背景模糊/亮度默认值
- [ ] 音效预览功能
- [ ] 设置导入/导出

## 技术栈

- **前端**: 原生 JavaScript + CSS
- **后端**: Tauri v2 (Rust)
- **构建**: Vite

## 项目结构

```
clawpanel/
├── src/                    # 前端源码
│   ├── pages/              # 页面模块
│   ├── components/         # 通用组件
│   ├── lib/                # 工具库
│   ├── style/             # 样式文件
│   ├── router.js          # 路由
│   └── main.js            # 入口
├── src-tauri/             # Rust 后端
│   ├── src/               # Tauri 命令
│   ├── Cargo.toml        # Rust 依赖
│   └── tauri.conf.json   # Tauri 配置
├── public/                # 静态资源
├── index.html            # HTML 入口
├── vite.config.js        # Vite 配置
└── package.json          # 前端依赖
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
