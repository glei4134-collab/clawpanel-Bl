/**
 * 统一 UI 设置面板组件
 * 被 ui-settings.js 完整页面和 chat.js 浮动面板共同使用
 */

import { createCustomSelect } from './custom-select.js'
import { getUIConfig, saveUIConfig, applyUIConfig, getAvailableBubbleStyles, getSoundPresets, applyBubbleStyle, applySoundPreset, applySoundVolume, saveSoundVolume, applyBgBlur, saveBgBlur, applyBgBrightness, saveBgBrightness, applyGlobalAlpha, saveGlobalAlpha, applyPanelAlpha, savePanelAlpha, applyPanelBlur, savePanelBlur, applyNavSidebarFine, saveNavSidebarFine, applyMainFine, saveMainFine, applyMessagesFine, saveMessagesFine, applySessionFine, saveSessionFine, applyInputFine, saveInputFine, applyNavSidebarBlurFine, saveNavSidebarBlurFine, applySidebarBlurFine, saveSidebarBlurFine, applyMainBlurFine, saveMainBlurFine, applyMessagesBlurFine, saveMessagesBlurFine, applySessionBlurFine, saveSessionBlurFine, applyInputBlurFine, saveInputBlurFine } from '../lib/ui-custom.js'

export function getUISettingsHTML(options = {}) {
  const {
    compact = false,  // 紧凑模式（用于浮动面板）
    showTitle = true,
    showHeader = true
  } = options

  const config = getUIConfig()
  const bubbleStyles = getAvailableBubbleStyles()
  const soundPresets = getSoundPresets()

  let html = ''

  // 标题栏（可选）
  if (showHeader) {
    html += `
      <div class="ui-settings-panel-header">
        <h2>🎨 UI 设置</h2>
        <p class="ui-settings-desc">自定义界面外观和效果</p>
      </div>
    `
  }

  // 气泡风格 - placeholder
  html += `
    <div class="ui-settings-section">
      <div class="ui-settings-section-title">💬 气泡风格</div>
      <div class="ui-settings-row" id="ui-panel-bubble-select"></div>
    </div>
  `

  // 音效 - placeholder
  html += `
    <div class="ui-settings-section">
      <div class="ui-settings-section-title">🔊 音效</div>
      <div class="ui-settings-row" id="ui-panel-sound-select"></div>
      <div class="ui-settings-row">
        <label>音量</label>
        <input type="range" min="10" max="100" value="${Math.round((config.clickSoundVolume || 0.6) * 100)}" 
               oninput="window.applySoundVolume(this.value); this.nextElementSibling.textContent = this.value + '%'" 
               onchange="window.saveSoundVolume(this.value)">
        <span>${Math.round((config.clickSoundVolume || 0.6) * 100)}%</span>
      </div>
    </div>
  `

  // 光标尾巴（仅完整模式显示）
  if (!compact) {
    const cursorConfig = window.__getCursorTrail ? window.__getCursorTrail() : { enabled: true, color: '#6366f1', size: 8, density: 3 }
    html += `
      <div class="ui-settings-section">
        <div class="ui-settings-section-title">🖱️ 光标特效</div>
        <div class="ui-settings-row">
          <label>尾巴开关</label>
          <input type="checkbox" ${cursorConfig.enabled ? 'checked' : ''} onchange="window.__setCursorTrail({ ...(window.__getCursorTrail() || {}), enabled: this.checked })">
        </div>
        <div class="ui-settings-row">
          <label>尾巴颜色</label>
          <input type="color" value="${cursorConfig.color || '#6366f1'}" onchange="window.__setCursorTrail({ ...(window.__getCursorTrail() || {}), color: this.value })">
        </div>
        <div class="ui-settings-row">
          <label>尾巴大小</label>
          <input type="range" min="4" max="16" value="${cursorConfig.size || 8}" 
                 oninput="window.__setCursorTrail({ ...(window.__getCursorTrail() || {}), size: parseInt(this.value) }); this.nextElementSibling.textContent = this.value + 'px'" 
                 onchange="window.saveCursorTrailSize(this.value)">
          <span>${cursorConfig.size || 8}px</span>
        </div>
        <div class="ui-settings-row">
          <label>尾巴密度</label>
          <input type="range" min="1" max="5" value="${cursorConfig.density || 3}" 
                 oninput="window.__setCursorTrail({ ...(window.__getCursorTrail() || {}), density: parseInt(this.value) }); this.nextElementSibling.textContent = this.value" 
                 onchange="window.saveCursorTrailDensity(this.value)">
          <span>${cursorConfig.density || 3}</span>
        </div>
      </div>
    `
  }

  // 透明度细调（仅完整模式显示）
  if (!compact) {
    html += `
      <div class="ui-settings-section">
        <div class="ui-settings-section-title">🔍 透明度细调</div>
        <div class="ui-settings-grid">
          <div class="ui-settings-row">
            <label>侧边栏</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.navSidebarFine ?? 0) * 100)}" 
                   oninput="window.applyNavSidebarFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveNavSidebarFine(this.value)">
            <span>${(config.navSidebarFine ?? 0) > 0 ? '+' : ''}${(config.navSidebarFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>主区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.mainFine ?? 0) * 100)}" 
                   oninput="window.applyMainFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveMainFine(this.value)">
            <span>${(config.mainFine ?? 0) > 0 ? '+' : ''}${(config.mainFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>消息列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.messagesFine ?? 0) * 100)}" 
                   oninput="window.applyMessagesFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveMessagesFine(this.value)">
            <span>${(config.messagesFine ?? 0) > 0 ? '+' : ''}${(config.messagesFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>会话列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.sessionFine ?? 0) * 100)}" 
                   oninput="window.applySessionFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveSessionFine(this.value)">
            <span>${(config.sessionFine ?? 0) > 0 ? '+' : ''}${(config.sessionFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>输入区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.inputFine ?? 0) * 100)}" 
                   oninput="window.applyInputFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveInputFine(this.value)">
            <span>${(config.inputFine ?? 0) > 0 ? '+' : ''}${(config.inputFine ?? 0) * 100}%</span>
          </div>
        </div>
      </div>
    `
  }

  // 模糊度细调（仅完整模式显示）
  if (!compact) {
    html += `
      <div class="ui-settings-section">
        <div class="ui-settings-section-title">✨ 模糊度细调</div>
        <div class="ui-settings-grid">
          <div class="ui-settings-row">
            <label>侧边栏</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.navSidebarBlurFine ?? 0) * 100)}" 
                   oninput="window.applyNavSidebarBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveNavSidebarBlurFine(this.value)">
            <span>${(config.navSidebarBlurFine ?? 0) > 0 ? '+' : ''}${(config.navSidebarBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>主区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.mainBlurFine ?? 0) * 100)}" 
                   oninput="window.applyMainBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveMainBlurFine(this.value)">
            <span>${(config.mainBlurFine ?? 0) > 0 ? '+' : ''}${(config.mainBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>消息列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.messagesBlurFine ?? 0) * 100)}" 
                   oninput="window.applyMessagesBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveMessagesBlurFine(this.value)">
            <span>${(config.messagesBlurFine ?? 0) > 0 ? '+' : ''}${(config.messagesBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>会话列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.sessionBlurFine ?? 0) * 100)}" 
                   oninput="window.applySessionBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveSessionBlurFine(this.value)">
            <span>${(config.sessionBlurFine ?? 0) > 0 ? '+' : ''}${(config.sessionBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>输入区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.inputBlurFine ?? 0) * 100)}" 
                   oninput="window.applyInputBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'" 
                   onchange="window.saveInputBlurFine(this.value)">
            <span>${(config.inputBlurFine ?? 0) > 0 ? '+' : ''}${(config.inputBlurFine ?? 0) * 100}%</span>
          </div>
        </div>
      </div>
    `
  }

  return html
}

// 导出便捷函数（用于 window 调用）
export function initUISettingsPanel(container) {
  // 将必要的函数暴露到 window
  window.applyBubbleStyle = (val) => {
    applyBubbleStyle(val)
  }
  window.applySoundPreset = (val) => {
    applySoundPreset(val)
  }
  window.applySoundVolume = applySoundVolume
  window.saveSoundVolume = saveSoundVolume

  // 初始化自定义 select 组件
  const config = getUIConfig()
  const bubbleStyles = getAvailableBubbleStyles()
  const soundPresets = getSoundPresets()

  const bubbleContainer = container?.querySelector('#ui-panel-bubble-select')
  if (bubbleContainer) {
    const bubbleSelect = createCustomSelect(
      bubbleStyles.map(s => ({ value: s.id, label: s.name })),
      {
        value: config.bubbleStyle || 'modern',
        onchange: (val) => window.applyBubbleStyle(val)
      }
    )
    bubbleContainer.appendChild(bubbleSelect.container)
  }

  const soundContainer = container?.querySelector('#ui-panel-sound-select')
  if (soundContainer) {
    const soundSelect = createCustomSelect(
      soundPresets.map(s => ({ value: s.id, label: s.name })),
      {
        value: config.soundPreset || 'click1',
        onchange: (val) => window.applySoundPreset(val)
      }
    )
    soundContainer.appendChild(soundSelect.container)
  }

  // 透明度细调
  window.applyNavSidebarFine = applyNavSidebarFine
  window.saveNavSidebarFine = saveNavSidebarFine
  window.applyMainFine = applyMainFine
  window.saveMainFine = saveMainFine
  window.applyMessagesFine = applyMessagesFine
  window.saveMessagesFine = saveMessagesFine
  window.applySessionFine = applySessionFine
  window.saveSessionFine = saveSessionFine
  window.applyInputFine = applyInputFine
  window.saveInputFine = saveInputFine

  // 模糊度细调
  window.applyNavSidebarBlurFine = applyNavSidebarBlurFine
  window.saveNavSidebarBlurFine = saveNavSidebarBlurFine
  window.applySidebarBlurFine = applySidebarBlurFine
  window.saveSidebarBlurFine = saveSidebarBlurFine
  window.applyMainBlurFine = applyMainBlurFine
  window.saveMainBlurFine = saveMainBlurFine
  window.applyMessagesBlurFine = applyMessagesBlurFine
  window.saveMessagesBlurFine = saveMessagesBlurFine
  window.applySessionBlurFine = applySessionBlurFine
  window.saveSessionBlurFine = saveSessionBlurFine
  window.applyInputBlurFine = applyInputBlurFine
  window.saveInputBlurFine = saveInputBlurFine
}
