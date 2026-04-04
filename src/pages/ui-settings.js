/**
 * UI设置页面
 */

import { t } from '../lib/i18n.js'
import { getUIConfig, saveUIConfig, applyUIConfig, getBubbleStyle, getAvailableBubbleStyles, getAllBubbleStyles, getBubbleStyleById, saveCustomBubbleStyle, deleteCustomBubbleStyle, getCustomBubbleStyles, applyBgBlur, applyBgBrightness, applyBgImage, saveBgImage, applyBubbleStyle, applySoundPreset, applySoundVolume, applyGlobalAlpha, applyNavSidebarFine, applyMainFine, applyMessagesFine, applySessionFine, applyInputFine, applyNavSidebarBlurFine, applySidebarBlurFine, applyMainBlurFine, applyMessagesBlurFine, applySessionBlurFine, applyInputBlurFine, importCustomSound } from '../lib/ui-custom.js'
import { toast } from '../components/toast.js'

export async function render() {
  const page = document.createElement('div')
  page.className = 'page ui-settings-page'
  
  const config = getUIConfig()
  const bubbleStyles = getAllBubbleStyles()
  const soundPresets = [
    { id: 'click', name: '清脆' },
    { id: 'pop', name: '气泡' },
    { id: 'tap', name: '敲击' },
    { id: 'bell', name: '铃铛' },
    { id: 'none', name: '无' }
  ]
  
  const customSounds = config.customSoundData ? [{ id: 'custom', name: '自定义音效' }] : []

  page.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">UI 设置</h1>
      <p class="page-desc">自定义界面外观、背景和透明度效果</p>
    </div>
    
    <div class="ui-settings-grid">
      <!-- 背景设置 -->
      <div class="ui-settings-card">
        <div class="ui-settings-card-header">
          <span class="ui-settings-card-icon">🖼️</span>
          <h3>背景设置</h3>
        </div>
        <div class="ui-settings-card-body">
          <div class="ui-settings-row">
            <label>背景图片</label>
            <input type="file" id="ui-bg-image" accept="image/*" style="display:none" onchange="handleBgImageSelect(this.files[0])">
            <button class="btn btn-sm btn-secondary" onclick="this.previousElementSibling.click()">${config.bgImage ? '更换' : '选择'}</button>
            ${config.bgImage ? '<button class="btn btn-sm btn-ghost" onclick="clearBgImage()">清除</button><button class="btn btn-sm btn-primary" onclick="handleSaveBgImage()">保存</button>' : ''}
          </div>
          <div class="ui-settings-row">
            <label>模糊度</label>
            <input type="range" min="0" max="10" step="0.1" value="${config.bgBlur || 0}" 
                   oninput="applyBgBlur(this.value); this.nextElementSibling.textContent = parseFloat(this.value).toFixed(1) + 'px'"
                   id="ui-bg-blur">
            <span class="ui-settings-value">${(config.bgBlur || 0).toFixed(1)}px</span>
          </div>
          <div class="ui-settings-row">
            <label>亮度</label>
            <input type="range" min="10" max="100" value="${Math.round((config.bgBrightness || 1) * 100)}" 
                   oninput="applyBgBrightness(this.value); this.nextElementSibling.textContent = this.value + '%'"
                   id="ui-bg-brightness">
            <span class="ui-settings-value">${Math.round((config.bgBrightness || 1) * 100)}%</span>
          </div>
        </div>
      </div>

      <!-- 全局透明度 -->
      <div class="ui-settings-card">
        <div class="ui-settings-card-header">
          <span class="ui-settings-card-icon">💧</span>
          <h3>全局透明度</h3>
        </div>
        <div class="ui-settings-card-body">
          <div class="ui-settings-row full">
            <div class="ui-settings-slider-wrap">
              <input type="range" min="0" max="100" value="${Math.round((config.globalAlpha ?? 0) * 100 / 0.5)}" 
                     oninput="applyGlobalAlpha(this.value); this.parentElement.nextElementSibling.textContent = this.value + '%'"
                     id="ui-global-alpha">
            </div>
            <span class="ui-settings-value">${Math.round((config.globalAlpha ?? 0) * 100 / 0.5)}%</span>
          </div>
          <p class="ui-settings-hint">影响所有区域的基础透明度</p>
        </div>
      </div>

      <!-- 透明度细调 -->
      <div class="ui-settings-card">
        <div class="ui-settings-card-header">
          <span class="ui-settings-card-icon">🔍</span>
          <h3>透明度细调</h3>
        </div>
        <div class="ui-settings-card-body">
          <div class="ui-settings-row">
            <label>侧边栏</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.navSidebarFine ?? 0) * 100)}" 
                   oninput="applyNavSidebarFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-sidebar-fine">
            <span class="ui-settings-value">${(config.navSidebarFine ?? 0) > 0 ? '+' : ''}${(config.navSidebarFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>主区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.mainFine ?? 0) * 100)}" 
                   oninput="applyMainFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-main-fine">
            <span class="ui-settings-value">${(config.mainFine ?? 0) > 0 ? '+' : ''}${(config.mainFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>消息列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.messagesFine ?? 0) * 100)}" 
                   oninput="applyMessagesFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-messages-fine">
            <span class="ui-settings-value">${(config.messagesFine ?? 0) > 0 ? '+' : ''}${(config.messagesFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>会话列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.sessionFine ?? 0) * 100)}" 
                   oninput="applySessionFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-session-fine">
            <span class="ui-settings-value">${(config.sessionFine ?? 0) > 0 ? '+' : ''}${(config.sessionFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>输入区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.inputFine ?? 0) * 100)}" 
                   oninput="applyInputFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-input-fine">
            <span class="ui-settings-value">${(config.inputFine ?? 0) > 0 ? '+' : ''}${(config.inputFine ?? 0) * 100}%</span>
          </div>
        </div>
      </div>

      <!-- 模糊度细调 -->
      <div class="ui-settings-card">
        <div class="ui-settings-card-header">
          <span class="ui-settings-card-icon">✨</span>
          <h3>模糊度细调</h3>
        </div>
        <div class="ui-settings-card-body">
          <div class="ui-settings-row">
            <label>侧边栏</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.navSidebarBlurFine ?? 0) * 100)}" 
                   oninput="applyNavSidebarBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-sidebar-blur-fine">
            <span class="ui-settings-value">${(config.navSidebarBlurFine ?? 0) > 0 ? '+' : ''}${(config.navSidebarBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>主区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.mainBlurFine ?? 0) * 100)}" 
                   oninput="applyMainBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-main-blur-fine">
            <span class="ui-settings-value">${(config.mainBlurFine ?? 0) > 0 ? '+' : ''}${(config.mainBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>消息列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.messagesBlurFine ?? 0) * 100)}" 
                   oninput="applyMessagesBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-messages-blur-fine">
            <span class="ui-settings-value">${(config.messagesBlurFine ?? 0) > 0 ? '+' : ''}${(config.messagesBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>会话列表</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.sessionBlurFine ?? 0) * 100)}" 
                   oninput="applySessionBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-session-blur-fine">
            <span class="ui-settings-value">${(config.sessionBlurFine ?? 0) > 0 ? '+' : ''}${(config.sessionBlurFine ?? 0) * 100}%</span>
          </div>
          <div class="ui-settings-row">
            <label>输入区域</label>
            <input type="range" min="-100" max="100" value="${Math.round((config.inputBlurFine ?? 0) * 100)}" 
                   oninput="applyInputBlurFine(this.value); this.nextElementSibling.textContent = (this.value > 0 ? '+' : '') + this.value + '%'"
                   id="ui-input-blur-fine">
            <span class="ui-settings-value">${(config.inputBlurFine ?? 0) > 0 ? '+' : ''}${(config.inputBlurFine ?? 0) * 100}%</span>
          </div>
        </div>
      </div>

      <!-- 气泡样式 -->
      <div class="ui-settings-card">
        <div class="ui-settings-card-header">
          <span class="ui-settings-card-icon">💬</span>
          <h3>气泡样式</h3>
        </div>
        <div class="ui-settings-card-body">
          <div class="ui-settings-row">
            <label>气泡风格</label>
            <select onchange="applyBubbleStyle(this.value); this.nextElementSibling.textContent = this.options[this.selectedIndex].text" class="ui-settings-select">
              ${bubbleStyles.map(s => `<option value="${s.id}" ${config.bubbleStyle === s.id ? 'selected' : ''}>${s.name}${s.isCustom ? ' ⭐' : ''}</option>`).join('')}
            </select>
            <span class="ui-settings-value">${getBubbleStyleById(config.bubbleStyle || 'modern').name}</span>
          </div>
          <div class="ui-settings-row">
            <label>导入气泡</label>
            <input type="file" id="ui-bubble-import" accept=".json" style="display:none" onchange="handleBubbleImport(this.files[0])">
            <button class="btn btn-sm btn-secondary" onclick="this.previousElementSibling.click()">选择 JSON</button>
          </div>
          <div id="ui-custom-bubbles-list" class="ui-settings-custom-list">
            ${Object.keys(getCustomBubbleStyles()).map(name => `
              <div class="ui-settings-custom-item">
                <span>${getCustomBubbleStyles()[name].name || name}</span>
                <button class="btn btn-sm btn-ghost" onclick="handleDeleteBubble('${name}')">删除</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 音效设置 -->
      <div class="ui-settings-card">
        <div class="ui-settings-card-header">
          <span class="ui-settings-card-icon">🔊</span>
          <h3>音效设置</h3>
        </div>
        <div class="ui-settings-card-body">
          <div class="ui-settings-row">
            <label>音效预设</label>
            <select onchange="applySoundPreset(this.value)" class="ui-settings-select">
              ${soundPresets.map(s => `<option value="${s.id}" ${config.soundPreset === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
              ${customSounds.map(s => `<option value="${s.id}" ${config.soundPreset === s.id ? 'selected' : ''}>${s.name} ⭐</option>`).join('')}
            </select>
          </div>
          <div class="ui-settings-row">
            <label>导入音效</label>
            <input type="file" id="ui-sound-import" accept="audio/*" style="display:none" onchange="handleSoundImport(this.files[0])">
            <button class="btn btn-sm btn-secondary" onclick="this.previousElementSibling.click()">选择音频</button>
          </div>
          <div class="ui-settings-row">
            <label>音量</label>
            <input type="range" min="0" max="100" value="${Math.round((config.clickSoundVolume || 0.6) * 100)}" 
                   oninput="applySoundVolume(this.value); this.nextElementSibling.textContent = this.value + '%'"
                   id="ui-volume">
            <span class="ui-settings-value">${Math.round((config.clickSoundVolume || 0.6) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ui-settings-footer">
      <button class="btn btn-primary btn-lg" onclick="saveAllUISettings()">保存全部设置</button>
    </div>
  `
  
  return page
}

function handleBgImageSelect(file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    applyBgImage(e.target.result)
    const btn = document.querySelector('.ui-settings-page .btn-secondary')
    if (btn) btn.textContent = '更换'
    const fileInput = document.getElementById('ui-bg-image')
    if (fileInput && !document.querySelector('.ui-settings-page .btn-ghost')) {
      const clearBtn = document.createElement('button')
      clearBtn.className = 'btn btn-sm btn-ghost'
      clearBtn.textContent = '清除'
      clearBtn.onclick = clearBgImage
      btn.after(clearBtn)
      const saveBtn = document.createElement('button')
      saveBtn.className = 'btn btn-sm btn-primary'
      saveBtn.textContent = '保存'
      saveBtn.onclick = handleSaveBgImage
      clearBtn.after(saveBtn)
    }
  }
  reader.readAsDataURL(file)
}

function handleSaveBgImage() {
  saveBgImage().then(() => {
    toast('背景图片已保存', 'success')
  }).catch(() => {
    toast('图片太大，无法保存', 'warning')
  })
}

function clearBgImage() {
  applyBgImage(null)
  const panel = document.querySelector('.ui-settings-page')
  if (panel) {
    const btns = panel.querySelectorAll('.btn-sm')
    btns.forEach(b => b.remove())
    const fileInput = document.getElementById('ui-bg-image')
    if (fileInput) {
      const selectBtn = document.createElement('button')
      selectBtn.className = 'btn btn-sm btn-secondary'
      selectBtn.textContent = '选择'
      selectBtn.onclick = () => fileInput.click()
      fileInput.previousElementSibling.after(selectBtn)
    }
  }
}

async function handleBubbleImport(file) {
  if (!file) return
  try {
    const text = await file.text()
    const style = JSON.parse(text)
    if (!style.name || !style.userBg) {
      toast('无效的气泡样式文件', 'warning')
      return
    }
    const name = style.name + '_custom'
    saveCustomBubbleStyle(name, { ...style, name: style.name + ' (自定义)' })
    toast('气泡样式导入成功', 'success')
    window.location.reload()
  } catch (e) {
    toast('导入失败：' + e.message, 'warning')
  }
}

function handleDeleteBubble(name) {
  deleteCustomBubbleStyle(name)
  toast('已删除自定义气泡', 'success')
  window.location.reload()
}

async function handleSoundImport(file) {
  if (!file) return
  try {
    await importCustomSound(file)
    toast('音效导入成功', 'success')
    window.location.reload()
  } catch (e) {
    toast('导入失败：' + e.message, 'warning')
  }
}

// 绑定到 window
window.applyGlobalAlpha = applyGlobalAlpha
window.applyNavSidebarFine = applyNavSidebarFine
window.applyMainFine = applyMainFine
window.applyMessagesFine = applyMessagesFine
window.applySessionFine = applySessionFine
window.applyInputFine = applyInputFine
window.applyNavSidebarBlurFine = applyNavSidebarBlurFine
window.applySidebarBlurFine = applySidebarBlurFine
window.applyMainBlurFine = applyMainBlurFine
window.applyMessagesBlurFine = applyMessagesBlurFine
window.applySessionBlurFine = applySessionBlurFine
window.applyInputBlurFine = applyInputBlurFine
window.applyBgBlur = applyBgBlur
window.applyBgBrightness = applyBgBrightness
window.applyBgImage = applyBgImage
window.applyBubbleStyle = applyBubbleStyle
window.applySoundPreset = applySoundPreset
window.applySoundVolume = applySoundVolume
window.handleBgImageSelect = handleBgImageSelect
window.handleSaveBgImage = handleSaveBgImage
window.clearBgImage = clearBgImage
window.handleBubbleImport = handleBubbleImport
window.handleDeleteBubble = handleDeleteBubble
window.handleSoundImport = handleSoundImport
