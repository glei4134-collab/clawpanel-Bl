# ClawPanel 钉钉接入指南

本文面向 **ClawPanel / OpenClaw** 用户，说明如何把钉钉企业内部应用接入为消息渠道，并完成最小可用联调。

## 适用方案

当前 ClawPanel 走的是 **钉钉企业内部应用 + 机器人能力 + Stream 模式 + `dingtalk-connector` 插件** 方案。

这不是自定义 Webhook 机器人方案，也不是 DEAP Agent 方案。

## 前置条件

在开始前，请确认：

- 你已经安装并初始化 OpenClaw
- Gateway 可以正常运行
- ClawPanel 已能读写 `~/.openclaw/openclaw.json`
- 你拥有钉钉企业内部应用的创建和发布权限

## 一、在钉钉开放平台创建应用

1. 打开钉钉开放平台
2. 进入 **应用开发**
3. 选择 **企业内部开发**
4. 创建一个新的企业内部应用

建议先准备好应用名称、图标和应用描述，便于后续在钉钉侧识别机器人。

## 二、给应用添加机器人能力

在应用能力中添加 **机器人**。

关键点：

- 消息接收方式必须选择 **Stream 模式**
- 不要使用 Webhook 模式

如果这里选错，插件即使安装成功，机器人通常也不会正常收发消息。

## 三、配置权限

至少确认已开通下列权限：

- `Card.Streaming.Write`
- `Card.Instance.Write`
- `qyapi_robot_sendmsg`

如果你后续还想使用文档相关能力，再补充文档 API 所需权限。

## 四、获取凭证

在钉钉应用的 **凭证与基础信息** 页面，记录：

- `Client ID`
- `Client Secret`

在 ClawPanel 中的字段映射如下：

| ClawPanel 字段 | 钉钉后台字段 | 说明 |
|---|---|---|
| `clientId` | Client ID / AppKey | 必填 |
| `clientSecret` | Client Secret / AppSecret | 必填 |
| `gatewayToken` | `gateway.auth.token` | Gateway 开启 token 鉴权时填写 |
| `gatewayPassword` | `gateway.auth.password` | Gateway 开启 password 鉴权时填写 |

## 五、发布应用版本

这一步非常重要。

在你完成机器人能力、权限和基础信息配置后，需要 **发布应用版本**。

如果没有发布，常见现象包括：

- 插件已经安装成功，但机器人在钉钉里没有响应
- 卡片能力不生效
- 某些权限看起来已配置，但实际上线上不可用

## 六、在 ClawPanel 中接入钉钉

打开 **消息渠道** 页面，选择 **钉钉**。

填写：

- `Client ID`
- `Client Secret`
- `Gateway Token` 或 `Gateway Password`（仅在 Gateway 启用了鉴权时填写）

填写规则：

- 如果 `gateway.auth.mode = token`，填写 `Gateway Token`
- 如果 `gateway.auth.mode = password`，填写 `Gateway Password`
- 如果 Gateway 未开启鉴权，这两个都可以留空

从当前版本开始，ClawPanel 在打开钉钉配置弹窗时会自动读取 `openclaw.json` 中的 `gateway.auth`：

- 如果 `gateway.auth.mode = token`，会自动带出 `Gateway Token`
- 如果 `gateway.auth.mode = password`，会自动带出 `Gateway Password`

建议先点击 **校验凭证**，确认 `Client ID / Client Secret` 可用后，再点击保存。

## 七、ClawPanel 保存时会自动做什么

保存钉钉渠道时，ClawPanel 会自动完成以下动作：

- 写入 `channels.dingtalk-connector`
- 自动补齐 `plugins.allow`
- 自动启用 `gateway.http.endpoints.chatCompletions.enabled = true`
- 首次缺少插件时自动安装 `@dingtalk-real-ai/dingtalk-connector`

从当前版本开始：

- **首次保存**：如果检测到插件未安装，会自动安装插件
- **后续保存**：如果插件已经存在，只更新配置，不会重复安装

## 八、手动配置时的最小示例

如果你不通过 ClawPanel，而是手改 `~/.openclaw/openclaw.json`，最小示例如下：

```json5
{
  "channels": {
    "dingtalk-connector": {
      "enabled": true,
      "clientId": "你的 Client ID / AppKey",
      "clientSecret": "你的 Client Secret / AppSecret",
      "gatewayToken": "如果 gateway.auth.mode=token 则填这里",
      "gatewayPassword": ""
    }
  },
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

注意：不要整段覆盖已有的 `gateway` 节点，而是将 `http.endpoints.chatCompletions.enabled` 追加到已有配置中。

## 九、保存后建议执行的检查

### 1. 检查插件是否已加载

```bash
openclaw plugins list
```

确认输出中存在：

```text
dingtalk-connector
```

### 2. 检查 Gateway 是否运行

```bash
curl http://127.0.0.1:18789/health
```

### 3. 如有需要，重启 Gateway

```bash
openclaw gateway restart
```

## 十、私聊与群聊测试方法

### 1. 私聊机器人

先确认以下前置条件：

- 应用版本已经发布
- 应用可见范围包含你当前的测试账号
- 你是该企业/组织内成员

推荐操作路径：

1. 在钉钉客户端搜索你的应用名或机器人名
2. 如果搜索不到，再到 **工作台 / 全部应用** 中查找该应用
3. 打开后发一条简单消息，例如“你好”

说明：

- 不同客户端版本中，私聊入口文案可能略有差异
- 如果机器人已发布但依然完全搜不到，优先检查 **可见范围** 和 **应用发布状态**
- 如果首次私聊收到的是 **配对码**，请在终端执行 `openclaw pairing approve dingtalk-connector <配对码>` 完成授权；如需先查看待审批项，可执行 `openclaw pairing list dingtalk-connector`

### 2. 添加到群聊并测试

根据钉钉开放平台“添加机器人到钉钉群”的使用说明，常见路径如下：

1. 打开目标群聊
2. 进入 **群设置**
3. 找到 **智能群助手**、**机器人** 或相近入口
4. 点击 **添加机器人**
5. 搜索你的机器人名称并添加
6. 返回群聊，先发送 `@机器人 你好` 做测试

说明：

- 不同客户端里入口名称可能是“智能群助手”或“机器人”
- 企业内部应用机器人一般只在组织内部可见，外部群或不在可见范围内的成员可能搜不到
- 群里建议优先使用 `@机器人` 触发，便于判断消息是否被正确路由到机器人
- 如果已经加群但仍不响应，请继续检查连接器配置里的 `groupPolicy` 是否被设为 `disabled`

## 十一、建议的联调顺序

建议按下面顺序测试：

1. 先在钉钉里 **私聊机器人**，发一条简单消息，例如“你好”
2. 确认私聊通了之后，再把机器人拉入群聊
3. 再测试群聊消息和卡片回包

这样更容易判断问题到底在：

- 应用基础配置
- 消息接收模式
- 群聊权限
- 会话隔离策略

## 十二、常见问题

### Q1: 出现 405 错误

通常说明 `chatCompletions` 端点未启用。

检查 `openclaw.json` 中是否存在：

```json5
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

### Q2: 出现 401 错误

通常说明钉钉连接器填写的 `gatewayToken` / `gatewayPassword` 与 Gateway 实际鉴权配置不一致。

重点检查：

- `gateway.auth.mode`
- `gateway.auth.token`
- `gateway.auth.password`

### Q3: 机器人无响应

按顺序检查：

1. Gateway 是否运行
2. 机器人消息接收方式是否为 **Stream 模式**
3. `Client ID / Client Secret` 是否正确
4. 钉钉应用版本是否已经发布
5. 应用可见范围是否包含当前测试账号
6. 首次私聊是否还在等待配对审批

### Q4: AI Card 不显示，只能看到纯文本

通常是权限未开齐。

至少检查：

- `Card.Streaming.Write`
- `Card.Instance.Write`

修改权限后，记得重新发布应用版本。

### Q5: 搜不到机器人，没法私聊，也没法加到群里

优先检查：

- 应用是否已经发布
- 应用可见范围是否包含当前测试人
- 当前测试人是否属于该企业/组织
- 机器人是否是企业内部应用机器人，而不是另一个同名应用

如果是群聊场景，还要确认：

- 目标群是你当前组织内可用的群
- 加群入口中搜索的是机器人/应用当前发布名称

### Q6: 机器人在群里已添加，但还是不响应

优先检查：

- 是否已经把机器人真正添加进该群
- 发消息时是否使用了 `@机器人`
- `groupPolicy` 是否被设为 `disabled`
- Gateway 日志里是否能看到群消息进入

### Q7: 保存时为什么以前总是重复安装插件？

旧逻辑在每次保存渠道配置时都会执行插件安装。

当前版本已经修复为：

- 检测插件已安装时，直接更新配置
- 仅在插件缺失时执行安装

### Q8: 为什么会看到“dangerous code patterns”警告？

这是 OpenClaw 对插件代码的静态审计提示，不一定等于本次安装失败的根因。

它表示插件中检测到了如下模式之一：

- `child_process`
- 环境变量读取 + 网络发送

是否接受该插件，仍需要你根据插件来源和使用场景自行判断。

### Q9: 为什么会出现 duplicate plugin id detected？

这是旧版本安装器把临时备份目录放在 `~/.openclaw/extensions/` 下导致的。

当前版本已经改为：

- 把备份目录移动到 `~/.openclaw/backups/plugin-installs/`
- 保存配置和安装插件时会顺手清理旧的 `.__clawpanel_backup` 遗留目录

## 十三、高级配置

`dingtalk-connector` 还支持一些高级项，当前 P0 页面未全部暴露到 UI，可以在 `openclaw.json` 中手工添加，例如：

- `separateSessionByConversation`
- `groupSessionScope`
- `sharedMemoryAcrossConversations`
- `asyncMode`
- `ackText`

这些适合后续做更细的群聊/私聊隔离、异步回执和高级会话策略。

## 十四、当前可完成与仍需人工完成的部分

ClawPanel 当前已经可以帮助你完成：

- 配置钉钉渠道
- 校验 `Client ID / Client Secret`
- 自动安装插件
- 自动补齐 OpenClaw 关键配置

但以下动作仍必须由你在钉钉侧人工完成：

- 创建企业内部应用
- 添加机器人能力
- 选择 Stream 模式
- 配置权限
- 发布应用版本
- 在钉钉里把机器人拉入私聊或群聊并发起真实测试
