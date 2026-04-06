---
description: 发布新版本（打 tag + 推送，触发跨平台构建）
---

## 版本号约定

- 格式: `x.y.z`（如 `0.7.0`）
- tag 格式: `v0.7.0`（带 `v` 前缀）

## 发布前检查

1. 确认所有功能改动已提交并推送，CI 全部通过（main 分支绿灯）

2. 确认工作区干净：
// turbo
```bash
git status
```

## 更新版本号

`version:set` 会自动同步以下文件，不需要手动改：
- `package.json` — npm 版本
- `src-tauri/tauri.conf.json` — Tauri 版本
- `src-tauri/Cargo.toml` → `Cargo.lock` — Rust 版本
- `docs/index.html` — JSON-LD `softwareVersion`、下载链接文件名（`ClawPanel_x.y.z_xxx`）、版本徽标（`vx.y.z 最新版`）

// turbo
```bash
npm run version:set 0.7.0
```

运行后检查输出，确认 4 个文件都标记了 ✅。

## 更新 CHANGELOG

在 `CHANGELOG.md` 顶部（`## [上一版本]` 之前）加入新版本记录，格式：

```markdown
## [0.7.0] - 2026-03-08

### 新功能 (Features)

- **功能名** — 一句话描述

### 改进 (Improvements)

- **改进名** — 一句话描述
```

内容要覆盖本次版本的所有变更，包括新功能、改进、修复、安全更新等。

## 提交并推送

```bash
git add -A
git commit -m "chore: release v0.7.0"
```

### ⚠️ 推送注意事项

如果本次提交包含 `.github/workflows/` 文件的改动，IDE 内置的 OAuth token 没有 `workflow` scope，会被 GitHub 拒绝。需要在**系统终端**（非 IDE 终端）用自己的 git 凭据推送：

```bash
git push origin main
```

如果不含 workflow 文件改动，IDE 内 push 即可。

## 打 tag 并触发发布

```bash
git tag v0.7.0
git push origin v0.7.0
```

推送 tag 后，GitHub Actions 会自动：
- 并行构建 macOS ARM64 / macOS Intel / Linux / Windows 四个平台
- 创建 GitHub Release 并上传安装包
- 构建前端 web 包并上传为 Release Asset
- 更新 `docs/update/latest.json`（前端热更新清单）
- 所有平台构建完成后统一写入 Release Notes

## 查看构建进度

前往仓库 **Actions** 页面，找到 `Release` 工作流查看实时日志。

## 手动触发（不打 tag）

在 GitHub Actions 页面手动触发 `Release` 工作流，输入版本号（如 `v0.7.0`）。

## 发布后验证

- [ ] Release 页面出现四个平台的安装包（.dmg ×2, .exe, .msi, .AppImage, .deb）
- [ ] Release Notes 内容正确（有下载表格 + changelog）
- [ ] `latest` 标签指向新 Release
- [ ] 官网 https://claw.qt.cool 下载链接指向新版本
- [ ] `docs/update/latest.json` 已被 CI 自动更新

## 发布后同步

Mac 堡垒机上的 ClawPanel 项目需要手动同步（如有需要）：
```bash
ssh mac "cd /Users/admin/Desktop/clawpanel && export https_proxy=http://127.0.0.1:7897 && git pull"
```

## 回滚

如果发布有问题，在 GitHub Releases 页面将该 Release 设为 Draft 或删除，然后修复后重新打 tag：
```bash
git tag -d v0.7.0
git push origin :refs/tags/v0.7.0
# 修复问题后
git tag v0.7.0
git push origin v0.7.0
```
