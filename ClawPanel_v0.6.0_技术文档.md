# ClawPanel-Bl v0.6.0 技术文档

## 分屏操作功能

### 技术实现方案

#### 1. 核心数据结构

```javascript
// 分屏配置结构
const DEFAULT_SPLIT_CONFIG = {
  splitEnabled: false,      // 是否启用分屏
  splitType: 'vertical',    // 'vertical' | 'horizontal'
  splitRatio: 0.3,          // 左侧/上方面板占比 (0-1)
  minPaneSize: 200,          // 最小面板尺寸 (px)
  maxPaneSize: 800,          // 最大面板尺寸 (px)
  dividerSize: 6,            // 分隔线宽度 (px)
  rememberSize: true         // 记住用户调整的尺寸
}
```

#### 2. CSS 布局实现

```css
/* 分屏容器 */
.split-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 左右分屏 */
.split-container.vertical {
  flex-direction: row;
}

/* 上下分屏 */
.split-container.horizontal {
  flex-direction: column;
}

/* 分屏面板 */
.split-pane {
  overflow: hidden;
  transition: width 0.2s ease, height 0.2s ease;
}

.split-pane.primary {
  flex: 0 0 var(--split-ratio);
  width: var(--split-ratio);
}

.split-pane.secondary {
  flex: 1;
}

/* 分隔线 */
.split-divider {
  flex-shrink: 0;
  background: var(--border-primary);
  cursor: col-resize; /* 或 row-resize */
  transition: background 0.15s ease;
}

.split-divider:hover {
  background: var(--accent);
}

.split-divider.dragging {
  background: var(--accent);
}
```

#### 3. 拖拽实现逻辑

```javascript
class SplitManager {
  constructor(container, options) {
    this.options = options
    this.isDragging = false
    this.startPos = 0
    this.startRatio = 0
    
    this.divider = container.querySelector('.split-divider')
    this.setupEventListeners()
  }
  
  setupEventListeners() {
    // 鼠标事件
    this.divider.addEventListener('mousedown', this.onMouseDown.bind(this))
    document.addEventListener('mousemove', this.onMouseMove.bind(this))
    document.addEventListener('mouseup', this.onMouseUp.bind(this))
    
    // 触摸事件（移动端支持）
    this.divider.addEventListener('touchstart', this.onTouchStart.bind(this))
    document.addEventListener('touchmove', this.onTouchMove.bind(this))
    document.addEventListener('touchend', this.onTouchEnd.bind(this))
    
    // 双击重置
    this.divider.addEventListener('dblclick', this.onDoubleClick.bind(this))
  }
  
  onMouseDown(e) {
    this.isDragging = true
    this.startPos = this.options.splitType === 'vertical' ? e.clientX : e.clientY
    this.startRatio = this.options.splitRatio
    document.body.style.cursor = this.options.splitType === 'vertical' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }
  
  onMouseMove(e) {
    if (!this.isDragging) return
    
    const currentPos = this.options.splitType === 'vertical' ? e.clientX : e.clientY
    const containerRect = this.divider.parentElement.getBoundingClientRect()
    const containerSize = this.options.splitType === 'vertical' 
      ? containerRect.width 
      : containerRect.height
    
    const delta = currentPos - this.startPos
    const deltaRatio = delta / containerSize
    
    let newRatio = this.startRatio + deltaRatio
    
    // 边界限制
    const minRatio = this.options.minPaneSize / containerSize
    const maxRatio = this.options.maxPaneSize / containerSize
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio))
    
    this.setRatio(newRatio)
  }
  
  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      this.saveConfig()
    }
  }
  
  onDoubleClick() {
    this.setRatio(0.3) // 重置为默认
    this.saveConfig()
  }
  
  setRatio(ratio) {
    this.options.splitRatio = ratio
    document.documentElement.style.setProperty('--split-ratio', `${ratio * 100}%`)
  }
  
  saveConfig() {
    const config = getUIConfig()
    config.splitConfig = this.options
    saveUIConfig(config)
  }
}
```

#### 4. 状态持久化

```javascript
// 保存分屏配置
function saveSplitConfig(config) {
  const uiConfig = getUIConfig()
  uiConfig.splitConfig = {
    ...DEFAULT_SPLIT_CONFIG,
    ...config
  }
  saveUIConfig(uiConfig)
}

// 加载分屏配置
function loadSplitConfig() {
  const uiConfig = getUIConfig()
  return uiConfig.splitConfig || DEFAULT_SPLIT_CONFIG
}
```

---

## 系统通知功能

### 1. 通知核心 API

```javascript
class NotificationManager {
  constructor() {
    this.permission = 'default'
    this.queue = []
    this.maxVisible = 3
  }
  
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持系统通知')
      return false
    }
    
    if (Notification.permission === 'granted') {
      this.permission = 'granted'
      return true
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    }
    
    return false
  }
  
  async show(title, body, options = {}) {
    // 检查权限
    if (this.permission !== 'granted') {
      await this.requestPermission()
    }
    
    if (this.permission !== 'granted') {
      // 回退到 Toast 通知
      this.showToast(title, body, options)
      return null
    }
    
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/images/logo.png',
      badge: options.badge || '/images/badge.png',
      tag: options.tag || 'default',
      silent: options.silent || false,
      requireInteraction: options.requireInteraction || false,
      data: options.data || {}
    })
    
    notification.onclick = () => {
      window.focus()
      notification.close()
      options.onClick?.()
    }
    
    notification.onclose = () => {
      this.removeFromQueue(notification)
    }
    
    this.addToQueue(notification)
    
    // 自动关闭
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), options.timeout || 5000)
    }
    
    return notification
  }
  
  showToast(title, body, options = {}) {
    // 实现 App 内置 Toast 通知作为回退
    const toast = document.createElement('div')
    toast.className = 'notification-toast'
    toast.innerHTML = `
      <div class="toast-icon">${options.type === 'error' ? '❌' : options.type === 'success' ? '✅' : '🔔'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-body">${body}</div>
      </div>
    `
    document.body.appendChild(toast)
    
    requestAnimationFrame(() => toast.classList.add('show'))
    
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, options.timeout || 5000)
  }
}
```

### 2. 通知配置结构

```javascript
const DEFAULT_NOTIFICATION_CONFIG = {
  enabled: true,                    // 启用通知
  soundEnabled: true,                // 播放音效
  soundPreset: 'notify',             // 音效预设
  soundVolume: 0.8,                  // 音量 (0-1)
  systemNotification: true,           // 显示系统通知
  showOnScreen: true,               // 显示屏幕通知
  notifyOnMention: true,            // @我时通知
  notifyOnTaskComplete: true,       // 任务完成通知
  notifyOnError: true,             // 错误通知
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  filter: {
    notifySelf: false,              // 通知自己的消息
    notifyBot: true               // 通知 Bot 消息
  }
}
```

### 3. 消息监听集成

```javascript
// 在 Chat 页面集成通知
class ChatNotificationHandler {
  constructor(chat) {
    this.chat = chat
    this.notificationManager = new NotificationManager()
    this.config = loadNotificationConfig()
  }
  
  async handleNewMessage(message) {
    if (!this.shouldNotify(message)) return
    
    // 播放音效
    if (this.config.soundEnabled) {
      playSound(this.config.soundPreset, this.config.soundVolume)
    }
    
    // 系统通知
    if (this.config.systemNotification && document.hidden) {
      await this.notificationManager.show(
        message.isFromUser ? '新消息' : 'AI 回复',
        message.preview,
        { tag: `msg-${message.id}` }
      )
    }
    
    // 屏幕通知
    if (this.config.showOnScreen) {
      this.showScreenNotification(message)
    }
  }
  
  shouldNotify(message) {
    // 检查免打扰时段
    if (this.isQuietHours()) return false
    
    // 检查过滤器
    if (message.isSelf && !this.config.filter.notifySelf) return false
    if (message.isBot && !this.config.filter.notifyBot) return false
    
    return this.config.enabled
  }
  
  isQuietHours() {
    if (!this.config.quietHours.enabled) return false
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [startH, startM] = this.config.quietHours.start.split(':').map(Number)
    const [endH, endM] = this.config.quietHours.end.split(':').map(Number)
    
    const start = startH * 60 + startM
    const end = endH * 60 + endM
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end
    } else {
      return currentTime >= start || currentTime <= end
    }
  }
}
```

---

## 可能遇到的 Bug 及解决方案

### 分屏功能 Bug

| Bug | 原因 | 解决方案 |
|-----|------|---------|
| 拖拽时面板抖动 | 频繁触发重绘 | 使用 `requestAnimationFrame` 节流 |
| 放开鼠标后位置跳动 | 坐标计算误差 | 使用 `getBoundingClientRect()` 获取精确尺寸 |
| 快速拖拽时比例错误 | 事件丢失 | 使用 `document` 监听而非目标元素 |
| 移动端无法拖拽 | 触摸事件未处理 | 添加 `touchstart/touchmove/touchend` 支持 |
| 窗口过小时分屏异常 | 未限制最小尺寸 | 添加 `resize` 监听自动禁用 |
| 分隔线样式错位 | CSS 盒模型问题 | 使用 `flex-shrink: 0` 固定分隔线 |
| 双击重置无效 | 事件冲突 | `stopPropagation()` 阻止冒泡 |
| 刷新后分屏比例丢失 | 配置未保存 | 确保 `saveConfig` 在 `mouseup` 后调用 |
| 分屏内嵌套分屏冲突 | 全局状态干扰 | 每个分屏实例独立管理状态 |
| 拖拽时选中文本 | 未禁用选择 | `userSelect: none` |

### 通知功能 Bug

| Bug | 原因 | 解决方案 |
|-----|------|---------|
| 通知权限被拒绝 | 用户拒绝/浏览器不支持 | 提供 App 内置 Toast 作为回退 |
| 多次通知同一消息 | 未使用 `tag` 去重 | 设置唯一 `tag` 标识消息 |
| 通知不消失 | `close()` 未调用 | 确保 `setTimeout` 正确清除 |
| 点击通知无效 | `onclick` 未绑定 | 检查 Notification 对象生命周期 |
| 免打扰时段判断错误 | 跨天逻辑未处理 | 正确处理 `start > end` 情况 |
| 音效播放失败 | AudioContext 未初始化 | 在用户首次交互后初始化 |
| 后台标签页通知延迟 | 浏览器节流 | 使用 `setTimeout` 延长延迟或使用 Service Worker |
| 通知图标不显示 | 图标路径错误/缓存 | 使用绝对路径并添加时间戳 |
| iOS Safari 不支持 | API 差异 | 检测兼容性并使用降级方案 |

---

## 浏览器兼容性

### 分屏功能
| 浏览器 | 支持 | 备注 |
|-------|------|------|
| Chrome 90+ | ✅ | 完全支持 |
| Firefox 88+ | ✅ | 完全支持 |
| Safari 14+ | ✅ | 完全支持 |
| Edge 90+ | ✅ | 完全支持 |
| iOS Safari 14+ | ⚠️ | 仅触摸事件 |
| Android Chrome | ⚠️ | 仅触摸事件 |

### 通知功能
| 浏览器 | 支持 | 备注 |
|-------|------|------|
| Chrome 22+ | ✅ | 完全支持 |
| Firefox 22+ | ✅ | 完全支持 |
| Safari 6+ | ⚠️ | 仅支持 `new Notification` |
| Edge 14+ | ✅ | 完全支持 |
| iOS Safari | ❌ | 不支持系统通知 |
| Android Chrome | ⚠️ | 有限支持 |

---

## 性能注意事项

### 分屏功能
1. **避免频繁 DOM 操作** - 使用 CSS Transform 而非改变 width/height
2. **使用 CSS 变量** - 减少 JavaScript 样式计算
3. **事件委托** - 减少事件监听器数量
4. **懒加载内容** - 非可视区域使用 `loading="lazy"`

### 通知功能
1. **限制通知数量** - 最多同时显示 3 条
2. **合并相同通知** - 使用 `tag` 去重
3. **延迟加载音效** - 首屏不加载音效资源
4. **清理闭包引用** - 通知关闭时清理定时器

---

## 文件结构

```
src/
├── lib/
│   ├── ui-custom.js      # 分屏配置存储
│   └── notifications.js   # 通知管理器 (新增)
├── components/
│   └── split-manager.js   # 分屏管理器 (新增)
├── pages/
│   └── chat.js           # 集成分屏和通知
└── style/
    └── split.css         # 分屏样式 (新增)
```

---

## 开发任务清单

### 一、分屏功能任务 (优先级排序)

| 序号 | 任务名称 | 优先级 | 状态 | 说明 |
|------|----------|--------|------|------|
| P0 | 分屏发送消息功能 | 🔴 高 | ✅ 已完成 | 2026-04-05 实现，完整支持发送、接收、流式输出 |
| P1 | 快捷键支持 | 🟡 中 | ✅ 已完成 | 2026-04-05 实现，`Ctrl+\` 切换、`Ctrl+[`/`Ctrl+]` 调整 |
| P2 | 边界吸附功能 | 🟡 中 | ✅ 已完成 | 2026-04-05 实现，25%/50%/75% 自动吸附，阈值 3% |
| P3 | 分屏比例指示器 | 🟡 中 | ✅ 已完成 | 2026-04-05 实现，拖拽时显示比例浮窗 |
| P4 | 分屏预设管理 | 🟢 低 | 待开发 | 保存/加载用户自定义布局 (2:1、1:1、3:1 等) |
| P5 | 水平分屏支持 | 🟢 低 | 待开发 | 从左右分屏扩展到上下分屏 |
| P6 | 多分屏支持 | 🟢 低 | 待开发 | 支持 3+ 个面板同时显示 |

### 二、分屏功能详细实现方案

#### P0: 分屏发送消息功能

**现状分析：**
```javascript
// chat.js:1006-1028
async function sendSplitMessage(input, messages) {
  // TODO: Send to API
  aiDiv.querySelector('.msg-text').innerHTML = '<p>分屏会话回复功能开发中</p>'
}
```

**实现方案：**
```javascript
async function sendSplitMessage(input, messages) {
  const text = input.value.trim()
  if (!text || !_splitSessionKey) return

  const userMsg = { role: 'user', content: text, timestamp: Date.now() }
  
  // 1. 保存用户消息
  await saveMessage(_splitSessionKey, userMsg)
  
  // 2. 显示用户消息
  renderUserMessage(messages, text)
  
  // 3. 显示 AI 思考状态
  const aiDiv = renderAITyping(messages)
  
  try {
    // 4. 发送到 API
    const response = await sendToAPI(text, _splitSessionKey)
    
    // 5. 保存并显示 AI 回复
    const aiMsg = { role: 'assistant', content: response, timestamp: Date.now() }
    await saveMessage(_splitSessionKey, aiMsg)
    renderAIMessage(aiDiv, response)
  } catch (error) {
    renderAIError(aiDiv, error.message)
  }
}
```

#### P1: 快捷键支持

**实现方案：**
```javascript
// 在 main.js 或 chat.js 中添加
document.addEventListener('keydown', (e) => {
  // Ctrl+\ 切换分屏
  if (e.ctrlKey && e.key === '\\') {
    e.preventDefault()
    toggleSplitView()
  }
  
  // Ctrl+[ 减小左面板
  if (e.ctrlKey && e.key === '[' && _splitOpen) {
    e.preventDefault()
    adjustSplitRatio(-0.05)
  }
  
  // Ctrl+] 增大左面板
  if (e.ctrlKey && e.key === ']' && _splitOpen) {
    e.preventDefault()
    adjustSplitRatio(0.05)
  }
})

function adjustSplitRatio(delta) {
  _splitRatio = Math.max(0.2, Math.min(0.8, _splitRatio + delta))
  updateSplitPanels()
  localStorage.setItem('clawpanel-split-ratio', String(_splitRatio))
}
```

#### P2: 边界吸附功能

**实现方案：**
```javascript
const SNAP_POINTS = [0.25, 0.5, 0.75]  // 吸附点
const SNAP_THRESHOLD = 0.03             // 吸附阈值 (3%)

function applySnap(ratio) {
  for (const snap of SNAP_POINTS) {
    if (Math.abs(ratio - snap) < SNAP_THRESHOLD) {
      return snap
    }
  }
  return ratio
}

// 在 mousemove 中使用
document.addEventListener('mousemove', (e) => {
  if (!_splitDragging) return
  
  const newRatio = _splitDragRatio + delta / rect.width
  _splitRatio = applySnap(newRatio)  // 添加吸附
  updateSplitPanels()
})
```

#### P3: 分屏比例指示器

**实现方案：**
```javascript
function updateSplitIndicator() {
  let indicator = document.getElementById('split-ratio-indicator')
  if (!indicator) {
    indicator = document.createElement('div')
    indicator.id = 'split-ratio-indicator'
    indicator.className = 'split-ratio-indicator'
    document.body.appendChild(indicator)
  }
  
  const leftPercent = Math.round(_splitRatio * 100)
  const rightPercent = 100 - leftPercent
  indicator.textContent = `${leftPercent}:${rightPercent}`
}

// CSS
.split-ratio-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.2s;
}

.split-ratio-indicator.visible {
  opacity: 1;
}
```

#### P4: 分屏预设管理

**数据结构：**
```javascript
const SPLIT_PRESETS = {
  '50-50': { ratio: 0.5, name: '均分' },
  '70-30': { ratio: 0.7, name: '左大右小' },
  '30-70': { ratio: 0.3, name: '左小右大' },
  '60-40': { ratio: 0.6, name: '略偏左' },
  '40-60': { ratio: 0.4, name: '略偏右' }
}

// 用户自定义预设
const userPresets = JSON.parse(localStorage.getItem('clawpanel-split-presets') || '{}')
```

**UI 集成：**
- 在分屏工具栏添加预设快捷按钮
- 支持保存当前比例为自定义预设

### 三、通知功能任务 (优先级排序)

| 序号 | 任务名称 | 优先级 | 状态 | 说明 |
|------|----------|--------|------|------|
| N1 | 通知历史功能 | 🟡 中 | ✅ 已完成 | 2026-04-05 实现，存储最近 50 条，支持查询和清除 |
| N2 | 隐私模式 | 🟡 中 | 待开发 | 后台/锁屏时隐藏消息内容 |
| N3 | 自定义音效 | 🟢 低 | 待开发 | 支持用户上传音频文件 |
| N4 | 通知分组 | 🟢 低 | 待开发 | 按会话/时间聚合通知 |

---

## 实施计划

### 阶段一：核心功能 ✅ (2026-04-05 已完成)
1. ✅ 完成分屏发送消息功能 (P0)
2. ✅ 添加快捷键支持 (P1)

### 阶段二：体验优化 ✅ (2026-04-05 已完成)
3. ✅ 实现边界吸附 (P2)
4. ✅ 添加比例指示器 (P3)

### 阶段三：高级功能 (待开发)
5. 分屏预设管理 (P4)
6. 水平分屏支持 (P5)
7. 多分屏支持 (P6)

### 阶段四：通知功能 (待开发)
8. 通知历史功能 (N1)
9. 隐私模式 (N2)
10. 自定义音效 (N3)
11. 通知分组 (N4)
