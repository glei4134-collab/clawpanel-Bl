# AGENTS.md - 智能自动化助手

## 我是谁

我是这个项目的 AI 助手，当发生特定事件或你提出相关请求时，我会自动调用相应技能来完成任务。

---

## 自动触发规则

### 🚨 事件驱动（自动执行）

当以下事件发生时，**立即自动执行**：

| 事件 | 自动执行 | 产出 |
|------|---------|------|
| **代码变更后** | `verify-quality` 扫描 | 代码质量报告 |
| **提交 commit 前** | `verify-change` 检查 | 变更影响分析 |
| **创建新模块/目录** | `verify-module` + `gen-docs` | 结构校验 + 文档骨架 |
| **修改安全相关代码** | `verify-security` 扫描 | 安全漏洞报告 |
| **收到 PR/Issue 通知** | `github` 自动处理 | 状态更新/回复 |

### 💬 智能触发（理解意图）

当我识别到你的意图时，自动选择最合适的技能：

| 你的请求 | 我理解为你想要 | 自动使用技能 |
|----------|---------------|-------------|
| "总结一下这个" | 总结内容 | `summarize` |
| "天气怎么样" | 查天气 | `weather` |
| "检查代码" | 代码质量 | `verify-quality` |
| "扫描安全" | 安全检查 | `verify-security` |
| "这个 PR/Issue..." | GitHub 操作 | `github` / `gh-issues` |
| "之前的讨论..." | 搜索历史 | `session-logs` |
| "博客/新闻..." | 监控信息源 | `blogwatcher` |
| "帮我创建个技能" | 创建技能 | `skill-creator` |
| "PDF 怎么处理" | PDF 操作 | `nano-pdf` |
| "视频提取帧" | 视频处理 | `video-frames` |
| "GIF 搜索" | GIF 搜索 | `gifgrep` |
| "问问 Gemini" | Gemini 查询 | `gemini` |
| "邮件..." | 邮件管理 | `himalaya` |
| "模型用了多少" | 使用统计 | `model-usage` |

---

## 项目已实现的 UI 功能 (v0.5.5)

### 🎨 气泡风格系统
- 现代 (Modern) - 渐变紫色
- 经典 (Classic) - 纯色蓝色
- 简约 (Minimal) - 深色背景
- 渐变 (Gradient) - 粉红渐变

### 🔊 音效系统
- 4种音效预设：清脆、泡泡、叮咚、机械键盘 + 静音
- 实时音量调节
- AudioContext 优化，响应 < 10ms

### 🖼️ 背景系统
- 自定义背景图片（自动压缩到 500KB）
- 模糊度、亮度、透明度独立调节
- 滑块实时预览，不频繁保存 localStorage

### 📐 侧边栏透明度
- 0-100% 透明度调节
- 实时预览效果

### 📱 分屏模式
- 左/右侧分屏切换
- 状态自动保存

### ⚙️ UI 设置面板
- 浮动面板设计
- 所有设置一目了然
- 实时预览调节效果

---

## 快速命令

| 命令 | 我做的事 |
|------|---------|
| "自动巡检" | 运行所有质量/安全检查 |
| "新功能 [描述]" | 用 multi-agent 分解并执行 |
| "安装工作流 [名称]" | 用 clawflows 搜索并安装 |
| "报告" | 汇总当前项目状态 |
| "打包插件" | 生成可独立集成的 UI 插件包 |
| "构建 exe" | 构建 Tauri 可执行文件 |

---

## 文件位置

- **项目级**：`./AGENTS.md` - 仅对本项目生效
- **全局级**：`~/.config/opencode/skills/skill-automation/SKILL.md` - 对所有项目生效

---

## 产出物

### 插件包
- `clawpanel-ui-plugin-v0.5/` - 可独立集成的 UI 插件

### 构建产物
- `src-tauri/target/release/clawpanel.exe` - 主程序
- `src-tauri/target/release/bundle/msi/Gl_0.5.5_x64_en-US.msi` - MSI 安装包
- `src-tauri/target/release/bundle/nsis/Gl_0.5.5_x64-setup.exe` - NSIS 安装包

---

*最后更新：2026-04-04*
