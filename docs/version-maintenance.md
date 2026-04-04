# ClawPanel 版本维护说明

这份文档面向 ClawPanel 维护者，说明后续如何维护：

- ClawPanel 自身版本号
- OpenClaw 推荐稳定版映射
- 热更新清单 `latest.json`
- 桌面端图标资源
- 本地回归检查

## 一、维护入口速查

- **改 OpenClaw 推荐稳定版**：编辑仓库根目录 `openclaw-version-policy.json`
- **改 ClawPanel 程序版本号**：执行 `npm run version:set 0.x.y`
- **改前端热更新清单**：编辑 `docs/update/latest.json`
- **重生成桌面图标**：执行 `npm run icon:regen`
- **本地回归**：执行 `npm run build`、`cargo check --manifest-path src-tauri/Cargo.toml`

## 二、如何调整 OpenClaw 推荐稳定版

ClawPanel 现在使用仓库根目录的 `openclaw-version-policy.json` 作为统一版本策略文件。

当前结构示例：

```json
{
  "default": {
    "official": { "recommended": "2026.3.11" },
    "chinese": { "recommended": "2026.3.7-zh.2" }
  },
  "panels": {
    "0.9.0": {
      "official": { "recommended": "2026.3.11" },
      "chinese": { "recommended": "2026.3.7-zh.2" }
    }
  }
}
```

维护建议：

1. **默认推荐版**：改 `default`
2. **某个面板版本的推荐版**：改 `panels.<panel_version>`
3. 如果新面板版本需要绑定独立推荐版，新增一个新的 `panels.<new_version>` 节点
4. 如果没有单独配置某个面板版本，会回退到 `default`

改完这个文件后，Rust 后端和 Web dev 后端都会读取同一份策略，前端各页面也会自动显示新的推荐版本和风险提示。

## 三、如何调整 ClawPanel 程序版本号

ClawPanel 现在以 `package.json` 作为主版本源，并通过脚本同步到其他文件。

当前 `0.11.0` 起，版本同步脚本也会一并维护 `package-lock.json`，避免 npm 锁文件版本与程序版本漂移。

推荐用法：

```bash
npm run version:set 0.9.1
```

这条命令会同步以下文件：

- `package.json`
- `package-lock.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `docs/index.html`

如果你只是想重新同步，不改版本号，也可以执行：

```bash
npm run version:sync
```

## 四、什么时候需要更新 `docs/update/latest.json`

`docs/update/latest.json` 用于桌面端前端热更新提示。

常见维护规则：

1. 发布了新的前端热更新包后，需要同步更新：
   - `version`
   - `minAppVersion`
   - `url`
   - `hash`
   - `releasedAt`
2. 如果 `latest.json` 落后于当前程序版本，ClawPanel 现在**不会再误报有更新**，但用户也看不到最新发布提示，所以仍然建议及时维护
3. 如果热更新资源还没准备好，不要提前把 `latest.json.version` 指到新版本

## 五、如何重生成桌面图标

ClawPanel 桌面端图标源现在使用 `docs/logo.png`。

重生成命令：

```bash
npm run icon:regen
```

它会重生成 `src-tauri/icons` 下的一整套图标资源，包括：

- `icon.icns`
- `icon.ico`
- `32x32.png`
- `128x128.png`
- 其他平台尺寸图标

如果后续只更新 Logo，重新执行一次即可，不需要手动逐个改图标文件。

## 六、本地回归检查建议

每次维护版本策略、程序版本号、热更新清单或桌面图标后，至少执行：

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

如果本次改动涉及安装/检测链路，建议额外确认：

- Windows 下自定义 Node 路径后，CLI 状态能立即刷新
- “关于”页 / “服务管理”页能正确显示推荐稳定版
- 本地版本高于推荐版时，风险提示仍然正确
- 当 `docs/update/latest.json` 版本低于本地版本时，不会再误弹更新提示

## 七、推荐维护顺序

推荐按下面顺序维护：

1. 确认本次要发布的 ClawPanel 版本
2. 执行 `npm run version:set x.y.z`
3. 如有必要，更新 `openclaw-version-policy.json`
4. 重新构建前端 / 检查 Rust 编译
5. 如桌面图标有调整，执行 `npm run icon:regen`
6. 如有前端热更新包，最后再更新 `docs/update/latest.json`

这样可以最大限度避免版本号、推荐版映射和更新清单不一致。
