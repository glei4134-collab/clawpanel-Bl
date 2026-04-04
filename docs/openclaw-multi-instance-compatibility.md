# OpenClaw 多实例兼容性优化方案

更新时间：2026-03-31 01:07:53 +08:00

## 背景

当前 ClawPanel 已经具备“实例切换”的一部分界面与数据结构，但底层仍然以单一 OpenClaw 根目录为默认前提。这会在以下场景中产生明显冲突：

1. 同一台机器存在多个 OpenClaw 安装目录。
2. 用户手动切换了实例，但某些页面仍然读写旧路径。
3. Tauri 桌面端与 Web dev-api 对实例的理解不一致。
4. 多个 OpenClaw 同时运行时，Gateway 名称、Bonjour 广播、端口、配置文件读写可能相互干扰。

这个问题不是单个页面写死路径，而是“实例选择层”和“本地路径解析层”没有完成统一抽象。

## 现状诊断

### 1. 现有能力

当前仓库已经有三类相关能力：

1. 面板设置页支持单个自定义 OpenClaw 路径。
2. 前端侧边栏支持实例切换 UI。
3. Web dev-api 具备实例列表、添加、删除、切换能力。

### 2. 当前架构缺口

#### 2.1 单路径配置不等于多实例支持

Tauri 侧当前通过 `clawpanel.json.openclawDir` 决定唯一生效目录，本质上仍然是“全局单路径覆盖”，不是“多实例上下文切换”。

#### 2.2 大量命令直接依赖单一根目录

Rust 侧很多命令直接调用统一的 `openclaw_dir()`，例如：

1. Agent 管理
2. Memory
3. Skills
4. Messaging
5. Service
6. Pairing
7. Config 读写

这意味着只要当前根目录解析不正确，多个页面都会一起读错目录。

#### 2.3 桌面端与 Web 端实例模型不一致

前端 API 里 `instance_*` 被标记为仅 Web 后端实现，说明“实例管理”目前主要停留在 dev-api 层，而桌面端大量本地读写命令仍走 Tauri Rust 本地目录解析。

结果就是：

1. 前端能显示实例切换。
2. 真实文件读写却未必跟随实例切换。
3. 用户会感觉“切了实例，但操作的还是另一个 OpenClaw”。

#### 2.4 本地多实例冲突缺少显式选择

当系统中检测到多个 OpenClaw 安装时，当前没有统一的冲突选择弹窗，也没有清晰的“当前操作对象是谁”的确认流程。对于会修改配置、插件、Agent 文件的操作，这个缺口风险很高。

## 根因

根因可以归纳为一句话：

> ClawPanel 目前有“实例列表”，但没有“实例上下文驱动的路径解析内核”。

也就是说，实例是 UI 概念，不是系统级资源定位概念。

## 目标

本次优化的目标不是简单把路径输入框改成下拉框，而是建立完整的一套实例上下文机制。

### 功能目标

1. 支持同时管理多个本地 OpenClaw 安装目录。
2. 支持远程实例、Docker 实例、本地实例统一出现在实例中心。
3. 所有本地文件读写类能力都基于“当前激活实例”解析路径。
4. 检测到多个候选 OpenClaw 时，必须弹窗让用户明确选择。
5. 用户可以手动新增、重命名、移除、设为默认本地实例。
6. 高风险操作前能明确显示当前目标实例与路径。

### 体验目标

1. 不允许“静默写错目录”。
2. 不允许“界面切换了实例，后端仍操作旧实例”。
3. 当前激活实例必须在侧边栏、详情页、设置页都可见。
4. 冲突时优先询问用户，不做隐式猜测。

## 设计原则

1. 统一实例抽象，不再区分“本地路径选择”和“实例切换”两套逻辑。
2. 本地实例必须有稳定 ID，不能只靠路径字符串临时判断。
3. 路径解析必须收敛到单一入口函数，禁止业务模块自行拼接根目录。
4. 冲突选择必须是显式交互，不能偷偷回退默认目录。
5. Web 模式与桌面模式的数据模型必须一致。

## 数据模型改造

建议将“实例”扩展为统一模型：

```json
{
  "activeInstanceId": "local-main",
  "instances": [
    {
      "id": "local-main",
      "name": "本机主实例",
      "type": "local",
      "openclawDir": "C:/Users/user/.openclaw",
      "gatewayPort": 18789,
      "version": "3.28.0",
      "detected": true,
      "isDefault": true,
      "fingerprint": "sha1:...",
      "lastSeenAt": 1774890473
    },
    {
      "id": "local-dev",
      "name": "开发实例",
      "type": "local",
      "openclawDir": "D:/OpenClaw/dev",
      "gatewayPort": 28789,
      "version": "3.28.0",
      "detected": false,
      "isDefault": false,
      "fingerprint": "sha1:...",
      "lastSeenAt": 1774890473
    },
    {
      "id": "remote-xxxx",
      "name": "远程节点",
      "type": "remote",
      "endpoint": "http://192.168.1.8:18789"
    }
  ]
}
```

### 字段说明

1. `id`：稳定实例 ID。
2. `type`：`local`、`remote`、`docker`。
3. `openclawDir`：仅本地实例必填。
4. `fingerprint`：用于识别是否是同一个 OpenClaw 实例，避免路径变更后丢失绑定关系。
5. `activeInstanceId`：全局激活实例，不再由单独的 `openclawDir` 决定一切。

## 路径解析内核

### 统一入口

新增统一上下文解析函数：

1. Rust：`resolve_active_instance_context()`
2. Node dev-api：`resolveActiveInstanceContext()`

返回结构建议为：

```json
{
  "id": "local-dev",
  "type": "local",
  "name": "开发实例",
  "openclawDir": "D:/OpenClaw/dev",
  "configPath": "D:/OpenClaw/dev/openclaw.json",
  "agentsDir": "D:/OpenClaw/dev/agents",
  "workspaceDir": "D:/OpenClaw/dev/workspace"
}
```

### 禁止继续直接使用全局根目录

后续所有本地资源读写都应从实例上下文取值，不再在业务代码中直接调用全局默认目录。需要逐步替换以下模式：

1. `openclaw_dir().join("openclaw.json")`
2. `openclaw_dir().join("agents")`
3. `OPENCLAW_DIR + ...`
4. 基于固定 `~/.openclaw` 的路径常量

## 实例发现与冲突检测

### 自动发现来源

建议本地实例发现至少覆盖以下来源：

1. 默认目录：`~/.openclaw`
2. 面板历史记录中的自定义目录
3. 用户手动添加过的目录
4. 最近成功运行 Gateway 的目录

### 判定一个目录是不是有效 OpenClaw

满足以下条件之一即可视为候选实例：

1. 存在 `openclaw.json`
2. 存在 `agents`、`logs`、`workspace` 等关键结构
3. 通过读取配置可得到有效 Gateway 配置或版本信息

### 冲突弹窗触发条件

出现以下任一情况时必须弹窗：

1. 启动时发现 2 个及以上本地有效实例，且尚未指定默认实例。
2. 当前默认实例路径不存在，但发现其他可用实例。
3. 用户执行高风险写操作时，当前实例存在歧义。
4. 发现 Bonjour 名称或 Gateway 端口冲突，需要区分具体实例。

## 交互方案

### 1. 启动冲突选择弹窗

当发现多个本地 OpenClaw 时，弹出实例选择框，展示：

1. 实例名称
2. 完整路径
3. OpenClaw 版本
4. Gateway 端口
5. 最近使用时间
6. 配置文件状态

提供按钮：

1. 设为当前实例
2. 设为默认实例
3. 查看详情
4. 手动选择其他目录

### 2. 侧边栏实例切换器增强

当前侧边栏已有实例切换区域，后续应增强为：

1. 本地实例与远程实例分组显示
2. 当前实例显示路径简写
3. 高风险页面顶部显示“当前实例路径”
4. 切换实例后触发全局上下文刷新

### 3. 设置页改造

当前“OpenClaw 安装路径”单输入框应升级为“本地实例管理器”：

1. 列出全部本地实例
2. 支持新增目录
3. 支持校验目录有效性
4. 支持设为默认
5. 支持删除失效记录

## 实施分期

### Phase 1：先打通实例上下文内核

目标：所有本地读写命令都能跟随当前实例。

改造项：

1. 定义统一实例模型。
2. 将 `activeInstanceId` 作为全局当前实例标识。
3. 在 Rust 与 dev-api 中新增统一上下文解析函数。
4. Agent、Config、Memory、Skills 先切到新解析层。

### Phase 2：补齐实例发现与冲突弹窗

目标：多实例存在时不再隐式写默认目录。

改造项：

1. 启动扫描候选实例。
2. 新增实例冲突弹窗。
3. 新增“记住我的选择”。
4. 启动阶段写入最近使用实例。

### Phase 3：统一桌面端与 Web 端实例能力

目标：两套运行模式具有一致的数据模型与行为。

改造项：

1. 将 `instance_*` 能力从仅 Web 实现，补齐到 Tauri 端或抽象成统一后端层。
2. 清理前端 `WEB_ONLY_CMDS` 中与实例管理相关的分支差异。
3. 统一实例切换后的缓存失效与页面刷新策略。

### Phase 4：增加保护性提示与审计

目标：降低误操作风险。

改造项：

1. 高风险写操作展示当前实例标识。
2. 写配置前生成实例级备份。
3. 记录最近操作的实例与路径。

## 受影响模块

以下模块需要优先排查和改造：

1. `src-tauri/src/commands/mod.rs`
2. `src-tauri/src/commands/config.rs`
3. `src-tauri/src/commands/agent.rs`
4. `src-tauri/src/commands/memory.rs`
5. `src-tauri/src/commands/skills.rs`
6. `src-tauri/src/commands/messaging.rs`
7. `src-tauri/src/commands/service.rs`
8. `scripts/dev-api.js`
9. `src/lib/tauri-api.js`
10. `src/lib/app-state.js`
11. `src/components/sidebar.js`
12. `src/pages/settings.js`

## 迁移建议

### 配置兼容

旧版本仅有：

```json
{
  "openclawDir": "D:/OpenClaw/dev"
}
```

迁移后建议自动转换为：

```json
{
  "activeInstanceId": "local-migrated",
  "instances": [
    {
      "id": "local-migrated",
      "name": "迁移实例",
      "type": "local",
      "openclawDir": "D:/OpenClaw/dev",
      "isDefault": true
    }
  ]
}
```

### 兼容策略

1. 首次迁移保留旧字段一段时间，只读不再写。
2. 新逻辑优先读取实例模型。
3. 若实例模型缺失，再回退读取旧 `openclawDir`。
4. 一旦成功迁移，可在后续版本移除旧字段写入。

## 验收标准

满足以下条件，才算多实例兼容完成：

1. 两个本地 OpenClaw 共存时，用户启动面板会看到明确选择。
2. 切换本地实例后，Agent、Config、Skills、Memory、Channels 页面都读写对应实例目录。
3. Tauri 与 Web 模式下，实例切换行为一致。
4. 当前实例信息在 UI 中可见，不存在“我不知道现在在改谁”的状态。
5. 任意高风险写操作都不会静默落到错误目录。

## 明确不建议的方案

以下做法不建议采用：

1. 继续在更多页面增加单独的路径输入框。
2. 只在前端记住当前实例，不改底层路径解析。
3. 发现多个实例时自动猜测“最近修改时间最新的那个”。
4. 仅修补 Agent 页面，不统一 Config、Memory、Skills 等其他模块。

## 建议的下一步落地顺序

1. 先把实例数据模型统一下来。
2. 再实现 Rust 和 dev-api 的上下文解析内核。
3. 然后改 Agent 与 Config 两条主链路做首批验证。
4. 最后补冲突弹窗和设置页实例管理器。

这样可以避免 UI 先做完，底层路径仍然写错的问题再次出现。