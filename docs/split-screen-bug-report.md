# 分屏功能缺陷分析报告

**项目**: ClawPanel-Bl  
**审查日期**: 2026-04-06  
**审查范围**: 分屏布局计算、窗口大小变化监听、拖拽分隔条、子视图状态同步  
**严重级别**: 🔴严重 🟠中等 🟡轻微

---

## 缺陷清单

### 🔴 BUG-001: 拖拽过程中移出窗口边界后鼠标释放无法捕获

**严重级别**: 🔴 严重  
**影响范围**: Windows 分屏/多窗口模式  
**复现步骤**:
1. 打开聊天页面并开启分屏
2. 将分隔条拖动到接近窗口边缘
3. 将鼠标移动到窗口外侧（松开鼠标）
4. 将鼠标移回窗口内
5. 观察: 分隔条仍然显示拖拽状态，无法恢复正常

**根因分析**:  
[mousemove#L1109-L1130](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\pages\chat.js#L1109-L1130)  
[mouseup#L1132-L1141](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\pages\chat.js#L1132-L1141)  

```javascript
// 问题代码
document.addEventListener('mousemove', (e) => {
  if (!_splitDragging) return
  // ...
})

document.addEventListener('mouseup', () => {
  if (_splitDragging) {
    _splitDragging = false
    // ...
  }
})
```

当鼠标在窗口外释放时，window 的 mouseup 事件可能不会被正确触发。

**修复方案**:
```javascript
document.addEventListener('mouseup', (e) => {
  if (_splitDragging) {
    _splitDragging = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    const divider = document.getElementById('chat-split-divider')
    if (divider) divider.style.background = 'var(--border-primary)'
    hideSplitIndicator()
  }
})

// 在 window 对象上添加额外的 mouseup 监听器作为降级
window.addEventListener('mouseup', handleWindowBlur)
```

---

### 🔴 BUG-002: 窗口 resize 后分屏比例未重新计算导致布局错乱

**严重级别**: 🔴 严重  
**影响范围**: 所有分屏场景  
**复现步骤**:
1. 打开聊天页面，开启分屏，调整比例为 30:70
2. 将窗口拖动到最小化尺寸
3. 再将窗口最大化
4. 观察: 分屏比例可能显示不正确，或右侧面板宽度异常

**根因分析**:  
当前代码中 `chat.js` 没有监听 `window.resize` 事件来重新计算分屏布局。

**修复方案**:  
在 chat.js 中添加 resize 监听器，或在现有的 window-manager.js 中添加分屏相关的 resize 处理。

---

### 🔴 BUG-003: 分屏视图克隆时事件监听器未正确转移

**严重级别**: 🔴 严重  
**影响范围**: 分屏后右侧面板的输入框和按钮  
**复现步骤**:
1. 打开聊天页面，开启分屏
2. 在右侧面板的输入框中输入文本
3. 点击发送按钮
4. 观察: 可能出现事件未绑定或发送逻辑异常

**根因分析**:  
[setupLeftPanelEvents#L1172-L1204](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\pages\chat.js#L1172-L1204)  
[setupRightPanelEvents#L1351-L1390](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\pages\chat.js#L1351-L1390)  

`cloneNode(true)` 只复制 DOM 结构，不复制事件监听器。代码通过 ID 重命名后手动绑定事件，但存在遗漏。

**修复方案**:  
改用事件委托模式或确保所有事件都正确绑定。

---

### 🟠 BUG-004: 分屏指示器可能超出窗口边界

**严重级别**: 🟠 中等  
**影响范围**: 分屏拖拽时的小屏幕场景  
**复现步骤**:
1. 将窗口尺寸调整为 800x500
2. 打开聊天页面并开启分屏
3. 拖动分隔条
4. 观察: split-ratio-indicator 可能超出窗口边界

**根因分析**:  
[chat.css#L2255-L2276](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\style\chat.css#L2255-L2276)  
```css
.split-ratio-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* 没有边界检测 */
}
```

**修复方案**:  
添加 CSS 边界限制或 JavaScript 边界检测。

---

### 🟠 BUG-005: 双击重置比例时未保存到 localStorage

**严重级别**: 🟠 中等  
**影响范围**: 双击分隔条重置比例  
**复现步骤**:
1. 打开聊天页面，开启分屏，调整比例为 30:70
2. 双击分隔条（重置为 50:50）
3. 刷新页面
4. 观察: 比例仍然是 30:70

**根因分析**:  
[setupSplitDivider#L1056-L1058](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\pages\chat.js#L1056-L1058)  

```javascript
divider.addEventListener('dblclick', () => {
  setSplitRatio(0.5)  // 这个函数内部会保存到 localStorage
})
```

实际上 `setSplitRatio` 已经保存到 localStorage，但需要验证。

---

### 🟠 BUG-006: 分屏关闭时未清理残留的全局事件监听器

**严重级别**: 🟠 中等  
**影响范围**: 频繁开关分屏  
**复现步骤**:
1. 多次开关分屏功能
2. 观察: 内存占用可能持续增长

**根因分析**:  
每次 `renderSplitView()` 都会创建新的 DOM 元素和事件监听器，但没有清理旧的。

---

### 🟡 BUG-007: 分屏比例极端值时最小宽度限制失效

**严重级别**: 🟡 轻微  
**影响范围**: 键盘快捷键调整比例  
**复现步骤**:
1. 打开分屏
2. 连续按 Ctrl+[ 缩小左侧面板
3. 当比例接近 0.2 时继续按
4. 观察: 可能出现负值或异常比例

**根因分析**:  
[adjustSplitRatio#L1072-L1074](file:///c:\Users\17544\Desktop\clawpanel-Bl-main\src\pages\chat.js#L1072-L1074)  

```javascript
function adjustSplitRatio(delta) {
  setSplitRatio(_splitRatio + delta)
}
```

`setSplitRatio` 内部有边界检查，但连续快速调用可能导致竞态。

---

### 🟡 BUG-008: touch 事件支持缺失

**严重级别**: 🟡 轻微  
**影响范围**: 平板/移动设备  
**复现步骤**:
1. 在平板上使用触摸操作
2. 尝试拖动分隔条
3. 观察: 触摸操作无法调整分隔条

**根因分析**:  
只有 `mousedown/mousemove/mouseup` 事件，没有 touch 事件支持。

---

## 边界测试矩阵

| 测试场景 | 窗口尺寸 | 预期结果 | 实际结果 |
|---------|---------|---------|---------|
| 最小窗口开启分屏 | 800x500 | 两面板最小宽度200px | 待验证 |
| 最大化后比例保持 | 任意→最大化 | 比例保持 | 待验证 |
| 分屏切换侧边栏 | 分屏开/关 | 布局正常 | 待验证 |
| 拖拽到边界 | 鼠标移出窗口 | 正常释放 | 🔴失败 |
| 快速连续调整 | 多次Ctrl+[ | 比例正常 | 待验证 |
| 分屏中新建会话 | 分屏中 | 右面板刷新 | 待验证 |

---

## 修复优先级

1. **立即修复**: BUG-001 (拖拽释放问题)
2. **立即修复**: BUG-002 (resize 布局问题)
3. **高优先级**: BUG-003 (事件监听器转移)
4. **中优先级**: BUG-004, BUG-005, BUG-006
5. **低优先级**: BUG-007, BUG-008
