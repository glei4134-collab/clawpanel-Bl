/**
 * UI 自定义功能补丁包
 * 可以独立导入到其他版本的源代码中使用
 * 
 * 使用方法：
 * 1. 将此文件复制到 src/lib/ui-patch.js
 * 2. 在需要使用的页面中 import { initUIPatch } from '../lib/ui-patch.js'
 * 3. 在页面初始化时调用 initUIPatch()
 */

// ============ 图标扩展 ============
const PATCH_ICONS = {
  'palette': '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0 2.2-2 2-2 2-2 2-4.5 10-10 10z"/>',
  'columns': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/>',
}

// ============ UI 配置系统 ============
const UI_CONFIG_KEY = 'gl_ui_config'

const DEFAULT_CONFIG = {
  bgImage: '',
  bgBlur: 0,
  bgOpacity: 0.86,
  bgBrightness: 0.66,
  sidebarAlpha: 0.25,
  contentAlpha: 0.15,
  cardAlpha: 0.2,
  navSidebarBlurFine: 0,
  sidebarBlurFine: 0,
  mainBlurFine: 0,
  messagesBlurFine: 0,
  sessionBlurFine: 0,
  inputBlurFine: 0,
  clickSound: true,
  soundPreset: 'click',
  clickSoundVolume: 0.6,
  bubbleStyle: 'modern',
  bubbleAnimation: true,
}

let _currentConfig = null

export function getUIConfig() {
  if (!_currentConfig) {
    try {
      const saved = localStorage.getItem(UI_CONFIG_KEY)
      _currentConfig = saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG }
    } catch {
      _currentConfig = { ...DEFAULT_CONFIG }
    }
  }
  return _currentConfig
}

export function saveUIConfig(config) {
  _currentConfig = { ...getUIConfig(), ...config }
  try {
    localStorage.setItem(UI_CONFIG_KEY, JSON.stringify(_currentConfig))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('UI config too large to save')
    }
  }
}

// ============ 音效系统 ============
let _audioContext = null
let _clickBuffer = null
let _tempClickVolume = null
let _audioInitialized = false

const SOUND_PRESETS = {
  click: {
    name: '清脆',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(4000 * Math.PI * i / ctx.sampleRate) * Math.exp(-i / (ctx.sampleRate * 0.01))
      }
      return buffer
    }
  },
  pop: {
    name: '泡泡',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02))
      }
      return buffer
    }
  },
  ding: {
    name: '叮咚',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(800 * Math.PI * i / ctx.sampleRate) * Math.exp(-i / (ctx.sampleRate * 0.1))
      }
      return buffer
    }
  },
  none: {
    name: '静音',
    create: () => null
  }
}

export function getSoundPresets() {
  return Object.entries(SOUND_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name
  }))
}

export function initAudioContext() {
  if (!_audioContext) {
    try {
      _audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const config = getUIConfig()
      _clickBuffer = SOUND_PRESETS[config.soundPreset]?.create(_audioContext)
      _audioInitialized = true
      if (_audioContext.state === 'suspended') {
        _audioContext.resume()
      }
    } catch (e) {
      console.warn('Audio init failed:', e)
    }
  }
}

export function playClickSound() {
  const config = getUIConfig()
  if (!config.clickSound || config.soundPreset === 'none') return
  
  try {
    if (!_audioContext) {
      initAudioContext()
    }
    if (_audioContext.state === 'suspended') {
      _audioContext.resume()
    }
    
    const source = _audioContext.createBufferSource()
    const gainNode = _audioContext.createGain()
    
    source.buffer = _clickBuffer
    const volume = _tempClickVolume ?? config.clickSoundVolume ?? 0.6
    if (volume === 0) return
    gainNode.gain.value = volume
    
    source.connect(gainNode)
    gainNode.connect(_audioContext.destination)
    source.start(0)
  } catch (e) {
    // 静默忽略
  }
}

export function setupClickSounds() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('button, a, [role="button"]')) {
      playClickSound()
    }
  }, true)
  
  document.addEventListener('touchstart', () => {
    playClickSound()
  }, true)
  
  initAudioContext()
}

// ============ 背景系统 ============
let _sessionBgImage = null

function getBgDiv() {
  return document.getElementById('ui-bg-div')
}

function ensureBgDiv() {
  let bgDiv = getBgDiv()
  if (!bgDiv) {
    bgDiv = document.createElement('div')
    bgDiv.id = 'ui-bg-div'
    bgDiv.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;background-attachment:fixed;'
    document.body.insertBefore(bgDiv, document.body.firstChild)
  }
  return bgDiv
}

export function applyBgImage(imageData) {
  _sessionBgImage = imageData
  const config = getUIConfig()
  config.bgImage = imageData

  const bgDiv = ensureBgDiv()

  if (imageData) {
    bgDiv.style.backgroundImage = `url(${imageData})`
  } else {
    bgDiv.style.backgroundImage = "url('/images/bg.png')"
  }
}

export async function saveBgImage() {
  if (!_sessionBgImage) return false
  
  const maxSize = 500 * 1024
  let imageData = _sessionBgImage
  
  if (_sessionBgImage.length > maxSize && _sessionBgImage.startsWith('data:image')) {
    try {
      imageData = await compressImage(_sessionBgImage, maxSize)
    } catch (e) {
      console.warn('Image compression failed:', e)
    }
  }
  
  try {
    const config = getUIConfig()
    config.bgImage = imageData
    saveUIConfig(config)
    return true
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('Image too large to save')
      return false
    }
    throw e
  }
}

async function compressImage(dataUrl, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      let { width, height } = img
      const ratio = Math.sqrt(maxSize / (dataUrl.length * 0.75))
      if (ratio < 1) {
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

// ============ 滑块控制（不保存到 localStorage） ============
export function applyBgBlur(val) {
  const config = getUIConfig()
  config.bgBlur = parseFloat(val)
  const bgDiv = getBgDiv()
  if (bgDiv) {
    const brightness = config.bgBrightness || 0.7
    bgDiv.style.filter = `blur(${val}px) brightness(${brightness})`
  }
}

export function applyBgBrightness(val) {
  const config = getUIConfig()
  config.bgBrightness = parseFloat(val) / 100
  const bgDiv = getBgDiv()
  if (bgDiv) {
    const blur = config.bgBlur || 0
    bgDiv.style.filter = `blur(${blur}px) brightness(${config.bgBrightness})`
  }
}

export function applyBgOpacity(val) {
  const config = getUIConfig()
  config.bgOpacity = parseFloat(val) / 100
  const bgDiv = getBgDiv()
  if (bgDiv) {
    bgDiv.style.opacity = config.bgOpacity
  }
}

export function applySidebarAlpha(val) {
  const config = getUIConfig()
  config.sidebarAlpha = val / 100
  
  document.querySelectorAll('.chat-sidebar, #sidebar, .sidebar').forEach(el => {
    el.style.background = `rgba(255, 255, 255, ${config.sidebarAlpha})`
  })
}

// ============ 气泡样式 ============
const BUBBLE_STYLES = {
  modern: {
    name: '现代',
    userBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    userColor: '#fff',
    userShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    assistantBg: 'rgba(255, 255, 255, 0.95)',
    assistantColor: '#1f2937',
    assistantShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    borderRadius: '18px 18px 4px 18px'
  },
  classic: {
    name: '经典',
    userBg: '#6366f1',
    userColor: '#fff',
    userShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
    assistantBg: '#f3f4f6',
    assistantColor: '#1f2937',
    assistantShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    borderRadius: '16px 16px 16px 4px'
  },
  minimal: {
    name: '简约',
    userBg: '#1f2937',
    userColor: '#f9fafb',
    userShadow: 'none',
    assistantBg: '#fff',
    assistantColor: '#374151',
    assistantShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: '4px 16px 16px 16px'
  },
  gradient: {
    name: '渐变',
    userBg: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
    userColor: '#fff',
    userShadow: '0 4px 20px rgba(245, 87, 108, 0.4)',
    assistantBg: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    assistantColor: '#fff',
    assistantShadow: '0 4px 20px rgba(79, 172, 254, 0.4)',
    borderRadius: '20px 20px 4px 20px'
  }
}

function getBubbleStyle(styleId) {
  return BUBBLE_STYLES[styleId] || BUBBLE_STYLES.modern
}

export function getAvailableBubbleStyles() {
  return Object.entries(BUBBLE_STYLES).map(([id, style]) => ({
    id,
    name: style.name
  }))
}

export function applyBubbleStyle(styleId) {
  const config = getUIConfig()
  config.bubbleStyle = styleId
  saveUIConfig(config)
  
  const bubble = getBubbleStyle(styleId)
  document.documentElement.style.setProperty('--bubble-user-bg', bubble.userBg)
  document.documentElement.style.setProperty('--bubble-user-color', bubble.userColor)
  document.documentElement.style.setProperty('--bubble-user-shadow', bubble.userShadow)
  document.documentElement.style.setProperty('--bubble-user-radius', bubble.borderRadius)
  document.documentElement.style.setProperty('--bubble-assistant-bg', bubble.assistantBg)
  document.documentElement.style.setProperty('--bubble-assistant-color', bubble.assistantColor)
  document.documentElement.style.setProperty('--bubble-assistant-shadow', bubble.assistantShadow)
  document.documentElement.style.setProperty('--bubble-assistant-radius', bubble.borderRadius)
}

export function applySoundPreset(presetId) {
  const config = getUIConfig()
  config.soundPreset = presetId
  saveUIConfig(config)
  
  if (_audioContext && SOUND_PRESETS[presetId]) {
    _clickBuffer = SOUND_PRESETS[presetId].create(_audioContext)
  }
}

export function applySoundVolume(val) {
  const config = getUIConfig()
  config.clickSoundVolume = parseFloat(val) / 100
  saveUIConfig(config)
}

// ============ 初始化函数 ============
export function initUIPatch() {
  // 初始化背景
  const config = getUIConfig()
  if (config.bgImage) {
    applyBgImage(config.bgImage)
  }
  
  // 初始化音效
  setupClickSounds()
  
  // 初始化气泡样式
  applyBubbleStyle(config.bubbleStyle || 'modern')
}

// ============ 导出图标扩展 ============
export function getPatchIcons() {
  return PATCH_ICONS
}
