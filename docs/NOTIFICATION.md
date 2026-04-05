# ClawPanel 通知系统使用指南

## 概述

ClawPanel 提供了一套完整的通知管理方案，支持：

- ✅ **系统通知** - Windows/macOS 原生桌面通知
- ✅ **应用内 Toast** - 页面内弹窗提示
- ✅ **音效提示** - 多种音效预设
- ✅ **页面失焦检测** - 最小化/切换标签时自动弹出系统通知
- ✅ **免打扰模式** - 支持夜间勿扰时段
- ✅ **消息过滤** - 可排除自己/Bot 发送的消息

## 快速开始

### 1. 引入模块

```javascript
import {
  initNotificationManager,
  notify,
  notifyNewMessage,
  notifyError,
  notifyWarning,
  notifyAgentResponse,
  playSound,
  getNotificationSettings,
  updateNotificationSettings
} from './lib/notification-manager.js'
```

### 2. 初始化

在应用启动时调用 `initNotificationManager()`：

```javascript
// main.js
import { initNotificationManager } from './lib/notification-manager.js'

initNotificationManager()
```

### 3. 发送通知

#### 基础用法

```javascript
// 通用通知
notify({
  title: '新消息',
  body: 'Agent 已完成任务',
  type: 'info',  // info | success | warning | error
  tag: 'unique-id'  // 用于去重
})

// 快捷方法
notifyNewMessage('你好，有什么可以帮助你的吗？')
notifyAgentResponse('任务已完成')
notifyError('连接失败')
notifyWarning('磁盘空间不足')
```

#### 页面失焦时通知

```javascript
// 当页面最小化或切换标签时，自动弹出系统通知
notify({
  title: '新消息',
  body: '收到一条新消息',
  isOwnMessage: false,  // 可选：排除自己发送的消息
  isBotMessage: false   // 可选：排除 Bot 消息
})
```

#### 仅系统通知

```javascript
notify({
  title: '后台任务',
  body: '下载已完成',
  systemOnly: true  // 不显示 Toast，仅系统通知
})
```

#### 强制通知（忽略免打扰）

```javascript
notify({
  title: '紧急',
  body: '系统需要重启',
  force: true  // 即使在免打扰时段也会通知
})
```

### 4. 音效控制

```javascript
// 播放音效
playSound('chime')   // 清脆音
playSound('bubble')  // 泡泡音
playSound('bell')    // 叮咚音
playSound('click')   // 点击音

// 获取/更新设置
const settings = getNotificationSettings()
updateNotificationSettings({
  soundEnabled: true,
  soundVolume: 0.5,
  soundPreset: 'bell'
})
```

## 配置选项

### 默认设置

```javascript
const DEFAULT_SETTINGS = {
  soundEnabled: true,           // 是否启用音效
  soundVolume: 0.8,             // 音量（0-1）
  soundPreset: 'chime',         // 音效预设
  systemNotificationEnabled: true,  // 启用系统通知
  toastEnabled: true,           // 启用应用内 Toast
  doNotDisturb: false,          // 免打扰模式
  doNotDisturbStart: '22:00',  // 免打扰开始时间
  doNotDisturbEnd: '08:00',    // 免打扰结束时间
  showOnPageHidden: true,      // 页面失焦时显示通知
  excludeOwnMessages: true,    // 排除自己发送的消息
  excludeBotMessages: false    // 排除 Bot 消息
}
```

### 免打扰时段

免打扰模式支持跨天设置（如 22:00-08:00）：

```javascript
updateNotificationSettings({
  doNotDisturb: true,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00'
})
```

## Tauri 集成

### 必需依赖

项目已配置 `tauri-plugin-notification`：

**Cargo.toml:**
```toml
tauri-plugin-notification = "2"
```

**lib.rs:**
```rust
.plugin(tauri_plugin_notification::init())
```

**capabilities/default.json:**
```json
{
  "permissions": [
    "notification:default",
    "notification:allow-is-permission-granted",
    "notification:allow-request-permission",
    "notification:allow-notify",
    "notification:allow-show"
  ]
}
```

### 系统通知权限

首次使用系统通知时，操作系统会请求权限：

- **Windows**: 系统通知中心
- **macOS**: 系统偏好设置 > 通知
- **Linux**: 桌面环境通知设置

## 音效预设

| 预设 | 频率 | 时长 | 类型 | 适用场景 |
|------|------|------|------|---------|
| chime | 880Hz | 0.15s | sine | 常规通知 |
| bubble | 660Hz | 0.2s | sine | 消息提示 |
| bell | 523Hz | 0.3s | triangle | 重要提醒 |
| click | 1000Hz | 0.05s | square | 轻微反馈 |

## 技术实现

### 页面失焦检测

```javascript
// 方式一：Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面失焦
  }
})

// 方式二：Window Focus/Blur
window.addEventListener('blur', () => { /* 失焦 */ })
window.addEventListener('focus', () => { /* 聚焦 */ })
```

### 通知队列

当连续收到多条通知时，系统会自动排队处理，避免通知刷屏：

```javascript
// 队列间隔：300ms
// 最大队列长度：无限制（页面聚焦后清空）
```

### 回退机制

如果 Tauri 原生通知不可用，系统会自动回退到 Web Notification API：

```javascript
if (_tauriNotification) {
  // 使用 Tauri 原生通知
} else if ('Notification' in window) {
  // 回退到 Web Notification API
} else {
  // 最后回退到 Toast
}
```

## 测试

打开 `docs/notification-example.html` 进行测试：

```bash
# 使用任意 HTTP 服务器
npx serve .
# 或
python -m http.server 8080
```

然后访问 `http://localhost:8080/docs/notification-example.html`

## 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Web Notification | ✅ | ✅ | ✅ | ✅ |
| AudioContext | ✅ | ✅ | ✅ | ✅ |
| Visibility API | ✅ | ✅ | ✅ | ✅ |
| Tauri Notification | ✅ (桌面) | ✅ (桌面) | ✅ (桌面) | ✅ (桌面) |

## 常见问题

### 1. 音效不播放
- 检查是否启用了音效：`getNotificationSettings().soundEnabled`
- 检查音量是否太低
- 确保用户已与页面有过交互（AudioContext 需要用户手势激活）

### 2. 系统通知不弹出
- 检查浏览器/系统通知权限是否授权
- 检查 `systemNotificationEnabled` 设置
- 检查是否在免打扰时段

### 3. 页面失焦但没通知
- 确保 `showOnPageHidden` 为 `true`
- 确保不是免打扰时段
- 确保不是自己发送的消息（如果 `excludeOwnMessages` 为 `true`）

## API 参考

### 函数

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `initNotificationManager()` | - | void | 初始化通知管理器 |
| `notify(options)` | NotificationOptions | Promise | 发送通知 |
| `notifyNewMessage(message, options?)` | string, NotificationOptions? | Promise | 发送新消息通知 |
| `notifyError(error, options?)` | string, NotificationOptions? | Promise | 发送错误通知 |
| `notifyWarning(message, options?)` | string, NotificationOptions? | Promise | 发送警告通知 |
| `notifyAgentResponse(response, options?)` | string, NotificationOptions? | Promise | 发送 Agent 响应通知 |
| `playSound(preset?, volume?)` | string?, number? | Promise | 播放音效 |
| `getNotificationSettings()` | - | Settings | 获取当前设置 |
| `updateNotificationSettings(newSettings)` | Settings | void | 更新设置 |

### NotificationOptions

```typescript
interface NotificationOptions {
  title?: string           // 通知标题
  body?: string           // 通知内容
  type?: 'info' | 'success' | 'warning' | 'error'  // Toast 类型
  tag?: string            // 通知标签（用于去重）
  icon?: string           // 通知图标
  duration?: number       // Toast 显示时长（ms）
  timeout?: number        // 系统通知超时（ms）
  silent?: boolean        // 是否静音
  systemOnly?: boolean    // 仅系统通知
  toastOnly?: boolean     // 仅 Toast
  force?: boolean         // 强制通知（忽略免打扰）
  isOwnMessage?: boolean  // 是否自己发送的消息
  isBotMessage?: boolean  // 是否 Bot 消息
  onClick?: Function      // 点击回调
}
```

## 更新日志

### v0.6.0
- 新增完整的通知管理模块
- 支持 Tauri 原生通知
- 支持页面失焦检测
- 支持多种音效预设
- 支持免打扰时段
- 支持消息过滤
