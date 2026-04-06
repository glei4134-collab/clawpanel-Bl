# UI 补丁包使用说明

## 快速集成

### 1. 复制文件
将 `src/lib/ui-patch.js` 复制到目标项目的 `src/lib/` 目录

### 2. 导入模块
在需要使用 UI 功能的页面中导入：

```javascript
import { 
  initUIPatch,
  applyBgImage,
  saveBgImage,
  applyBgBlur,
  applyBgBrightness,
  applyBgOpacity,
  applySidebarAlpha,
  applyBubbleStyle,
  applySoundPreset,
  applySoundVolume,
  getAvailableBubbleStyles,
  getSoundPresets
} from '../lib/ui-patch.js'
```

### 3. 初始化
在页面初始化时调用：

```javascript
onMount(() => {
  initUIPatch()
})
```

## API 函数

### 背景控制
| 函数 | 说明 |
|------|------|
| `applyBgImage(imageData)` | 设置背景图片（base64 或 URL） |
| `saveBgImage()` | 保存背景图片到 localStorage（自动压缩到 500KB） |
| `applyBgBlur(val)` | 设置模糊度（0-50） |
| `applyBgBrightness(val)` | 设置亮度（10-100） |
| `applyBgOpacity(val)` | 设置透明度（0-100） |
| `applySidebarAlpha(val)` | 设置侧边栏透明度（0-100） |

### 气泡风格
| 函数 | 说明 |
|------|------|
| `getAvailableBubbleStyles()` | 获取所有气泡风格列表 |
| `applyBubbleStyle(styleId)` | 应用气泡风格（modern/classic/minimal/gradient） |

### 音效
| 函数 | 说明 |
|------|------|
| `getSoundPresets()` | 获取所有音效预设列表 |
| `applySoundPreset(presetId)` | 应用音效预设（click/pop/ding/none） |
| `applySoundVolume(val)` | 设置音量（10-100） |

### 初始化
| 函数 | 说明 |
|------|------|
| `initUIPatch()` | 初始化所有 UI 功能 |

## UI 设置面板模板

```javascript
function showUISettingsPanel() {
  const bubbleStyles = getAvailableBubbleStyles()
  const soundPresets = getSoundPresets()
  const config = getUIConfig()
  
  const panel = document.createElement('div')
  panel.className = 'ui-settings-float-panel'
  panel.innerHTML = `
    <div class="ui-settings-float-header">
      <span>UI 设置</span>
      <button onclick="hideUISettingsPanel()">&times;</button>
    </div>
    <div class="ui-settings-float-content">
      <div class="ui-settings-section">
        <div class="ui-settings-section-title">气泡风格</div>
        <select onchange="applyBubbleStyle(this.value)">
          ${bubbleStyles.map(s => 
            `<option value="${s.id}" ${config.bubbleStyle === s.id ? 'selected' : ''}>${s.name}</option>`
          ).join('')}
        </select>
      </div>
      
      <div class="ui-settings-section">
        <div class="ui-settings-section-title">音效</div>
        <select onchange="applySoundPreset(this.value)">
          ${soundPresets.map(s => 
            `<option value="${s.id}" ${config.soundPreset === s.id ? 'selected' : ''}>${s.name}</option>`
          ).join('')}
        </select>
        <input type="range" min="10" max="100" value="${config.clickSoundVolume * 100}" 
          oninput="applySoundVolume(this.value)">
      </div>
      
      <div class="ui-settings-section">
        <div class="ui-settings-section-title">背景设置</div>
        <input type="file" accept="image/*" onchange="handleBgImageSelect(this.files[0])">
        <button onclick="applyBgImage('')">清除</button>
        <button onclick="saveBgImage()">保存</button>
      </div>
    </div>
  `
  document.body.appendChild(panel)
}

function handleBgImageSelect(file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => applyBgImage(e.target.result)
  reader.readAsDataURL(file)
}

window.showUISettingsPanel = showUISettingsPanel
```

## 图标扩展

如果需要使用 `palette` 和 `columns` 图标：

```javascript
import { getPatchIcons } from '../lib/ui-patch.js'

// 在 icons.js 中添加
const PATCH_ICONS = getPatchIcons()
Object.assign(PATHS, PATCH_ICONS)
```

## CSS 样式

需要添加的最小样式：

```css
/* UI 设置面板 */
.ui-settings-float-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.ui-settings-float-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.ui-settings-section {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.ui-settings-section-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
```
