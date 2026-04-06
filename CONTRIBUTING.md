# 贡献指南

## 关于本版本

ClawPanel-Bl 是 [ClawPanel](https://github.com/qingchencloud/clawpanel) 的魔改版本。

本版本聚焦于 **UI 增强** 和 **3D 头像系统**，移除了大部分需要 OpenClaw 后端的功能。

## 提交问题

- 欢迎提交 Issue 报告 Bug 或建议功能
- 请确认问题是否在原始版本中存在
- 魔改功能问题请在本仓库提交

## 分支与提交规范

### 分支策略

- 所有开发基于 `main` 分支
- 新功能分支：`feature/功能描述`
- 修复分支：`fix/问题描述`
- 3D 相关：`feature/3d-xxx`
- UI 相关：`feature/ui-xxx`

### 提交格式

```
<类型>: 简要描述
```

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 Bug |
| docs | 文档变更 |
| style | 代码格式 |
| refactor | 重构 |
| 3d | 3D 相关 |

## PR 流程

1. Fork 本仓库并克隆到本地
2. 从 `main` 创建新分支
3. 完成开发并进行本地测试
4. 提交并推送到你的 Fork 仓库
5. 发起 Pull Request

## 代码规范

- **前端**：使用 Vanilla JS，不引入第三方框架
- **3D渲染**：使用 Three.js
- **注释**：所有代码注释使用中文
- **风格**：简洁清晰，避免过度封装
- **命名**：变量和函数使用 camelCase，CSS 类名使用 kebab-case
- **资源**：静态资源本地化，禁止引用远程 CDN
- **异步**：页面 `render()` 中禁止阻塞式 await，数据加载走后台异步

## 3D 模型规范

- 模型格式：`.glb` (GLTF Binary)
- 模型大小：建议不超过 5MB
- 模型命名：`avatar-{角色}.glb`
- 存放目录：`public/models/`

## 开发测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 测试 3D 头像
访问 /avatar-3d-demo

# 构建生产版本
npm run tauri build
```

## 许可证

本项目继承 [ClawPanel](https://github.com/qingchencloud/clawpanel) 的 AGPL-3.0 许可证。
