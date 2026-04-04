/**
 * UI 自定义模块
 * 支持背景图片、透明度、点击音效等自定义设置
 */

const UI_CONFIG_KEY = 'gl_ui_config'

const DEFAULT_CONFIG = {
  bgImage: '',
  bgBlur: 0,
  bgOpacity: 0.2,
  bgBrightness: 0.66,
  sidebarAlpha: 0.25,
  chatMainAlpha: 0.0,
  sessionListAlpha: 0.0,
  contentAlpha: 0.15,
  cardAlpha: 0.2,
  clickSound: true,
  soundPreset: 'click',
  clickSoundVolume: 0.6,
  bubbleStyle: 'modern',
  bubbleAnimation: true,
}

let _audioContext = null
let _clickBuffer = null
let _currentConfig = null
let _audioInitialized = false

export function getUIConfig() {
  if (!_currentConfig) {
    try {
      const saved = localStorage.getItem(UI_CONFIG_KEY)
      _currentConfig = saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG }
    } catch {
      _currentConfig = { ...DEFAULT_CONFIG }
    }
    // 自动从 gl_bg_image 加载背景图片（避免 localStorage quota 问题）
    if (!_currentConfig.bgImage) {
      try {
        const savedBg = localStorage.getItem('gl_bg_image')
        if (savedBg) _currentConfig.bgImage = savedBg
      } catch {}
    }
  }
  return _currentConfig
}

export function saveUIConfig(config) {
  _currentConfig = { ...getUIConfig(), ...config }
  // Always strip bgImage to avoid localStorage quota issues
  const { bgImage, ...configToSave } = _currentConfig
  try {
    localStorage.setItem(UI_CONFIG_KEY, JSON.stringify(configToSave))
  } catch (e) {
    console.warn('[UI] Failed to save config:', e)
  }
  applyUIConfig(_currentConfig)
}

export function saveBgImageToStorage(imageData) {
  try {
    localStorage.setItem('gl_bg_image', imageData)
    return true
  } catch (e) {
    console.warn('[UI] Failed to save bg image:', e)
    return false
  }
}

export function loadBgImageFromStorage() {
  try {
    return localStorage.getItem('gl_bg_image')
  } catch (e) {
    return null
  }
}

export function applyUIConfig(config) {
  config = config || getUIConfig()
  
  const bgUrl = config.bgImage ? (config.bgImage.startsWith('data:') ? config.bgImage : `url('\''${config.bgImage}'\'')`) : 'url("/images/bg.png")'
  document.documentElement.style.setProperty('--bg-image-url', bgUrl)
  
  document.documentElement.style.setProperty('--bg-blur', `${config.bgBlur || 0}px`)
  document.documentElement.style.setProperty('--bg-opacity', config.bgOpacity || 0.86)
  document.documentElement.style.setProperty('--bg-brightness', config.bgBrightness || 0.66)
  
  document.documentElement.style.setProperty('--sidebar-alpha', config.sidebarAlpha || 0.25)
  document.documentElement.style.setProperty('--content-alpha', config.contentAlpha || 0.15)
  document.documentElement.style.setProperty('--card-alpha', config.cardAlpha || 0.2)
  
  const bubbleStyle = getBubbleStyle(config.bubbleStyle || 'modern')
  document.documentElement.style.setProperty('--bubble-user-bg', bubbleStyle.userBg)
  document.documentElement.style.setProperty('--bubble-user-color', bubbleStyle.userColor)
  document.documentElement.style.setProperty('--bubble-user-shadow', bubbleStyle.userShadow)
  document.documentElement.style.setProperty('--bubble-user-radius', bubbleStyle.borderRadius)
  document.documentElement.style.setProperty('--bubble-assistant-bg', bubbleStyle.assistantBg)
  document.documentElement.style.setProperty('--bubble-assistant-color', bubbleStyle.assistantColor)
  document.documentElement.style.setProperty('--bubble-assistant-shadow', bubbleStyle.assistantShadow)
  document.documentElement.style.setProperty('--bubble-assistant-radius', bubbleStyle.borderRadius)
}

const SOUND_PRESETS = {
  click: {
    name: '清脆',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 50)
        data[i] = (Math.sin(2 * Math.PI * 2000 * t) * 0.5 + Math.sin(2 * Math.PI * 800 * t) * 0.3) * envelope
      }
      return buffer
    }
  },
  pop: {
    name: '气泡',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 30)
        const freq = 1500 + Math.sin(t * 100) * 300
        data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
      }
      return buffer
    }
  },
  tap: {
    name: '敲击',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 60)
        data[i] = (Math.random() * 2 - 1) * envelope * 0.3
      }
      return buffer
    }
  },
  bell: {
    name: '铃铛',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 15)
        const freq = 1200
        data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5
      }
      return buffer
    }
  },
  none: {
    name: '无',
    create: () => null
  }
}

export function getSoundPresets() {
  return Object.keys(SOUND_PRESETS).map(key => ({
    id: key,
    name: SOUND_PRESETS[key].name
  }))
}

function createClickSoundBuffer(ctx, preset = 'click') {
  const creator = SOUND_PRESETS[preset] || SOUND_PRESETS.click
  return creator.create(ctx)
}

export function initAudioContext() {
  try {
    if (!_audioContext) {
      _audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    const config = getUIConfig()
    _clickBuffer = createClickSoundBuffer(_audioContext, config.soundPreset || 'click')
    _audioInitialized = true
    if (_audioContext.state === 'suspended') {
      _audioContext.resume()
    }
  } catch (e) {
    console.warn('Audio init failed:', e)
  }
}

export function playClickSound() {
  const config = getUIConfig()
  if (!config.clickSound || config.soundPreset === 'none' || config.clickSoundVolume === 0) return
  try {
    if (!_audioContext || !_clickBuffer) {
      initAudioContext()
    }
    if (_audioContext.state === 'suspended') {
      _audioContext.resume()
    }
    const source = _audioContext.createBufferSource()
    const gainNode = _audioContext.createGain()
    source.buffer = _clickBuffer
    gainNode.gain.value = config.clickSoundVolume || 0.6
    source.connect(gainNode)
    gainNode.connect(_audioContext.destination)
    source.start(0)
  } catch (e) {}
}

export function setupClickSounds() {
  document.addEventListener('click', (e) => {
    const target = e.target
    const isClickable = 
      target.tagName === 'BUTTON' || 
      target.closest('.btn') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.classList.contains('nav-item') ||
      target.classList.contains('chat-split-tab') ||
      target.classList.contains('toggle-switch')
    if (isClickable) {
      playClickSound()
    }
  }, true)
}

const BUBBLE_STYLES = {
  modern: {
    name: '简约',
    userBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    userColor: '#ffffff',
    assistantBg: 'rgba(255,255,255,0.95)',
    assistantColor: '#18181b',
    borderRadius: '20px',
    padding: '12px 18px',
    userShadow: '0 4px 16px rgba(102,126,234,0.5)',
    assistantShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  cute: {
    name: '可爱',
    userBg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%)',
    userColor: '#333333',
    assistantBg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    assistantColor: '#333333',
    borderRadius: '24px 24px 24px 6px',
    padding: '14px 20px',
    userShadow: '0 4px 20px rgba(255,154,158,0.5)',
    assistantShadow: '0 4px 20px rgba(168,237,234,0.5)',
  },
  dark: {
    name: '暗色',
    userBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    userColor: '#ffffff',
    assistantBg: 'rgba(40,40,55,0.95)',
    assistantColor: '#e4e4e7',
    borderRadius: '16px 16px 16px 4px',
    padding: '12px 16px',
    userShadow: '0 4px 16px rgba(0,0,0,0.6)',
    assistantShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  gaming: {
    name: '电竞',
    userBg: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    userColor: '#ffffff',
    assistantBg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    assistantColor: '#ffffff',
    borderRadius: '8px',
    padding: '10px 14px',
    userShadow: '0 0 25px rgba(0,210,255,0.6)',
    assistantShadow: '0 0 25px rgba(56,239,125,0.6)',
  },
  sunset: {
    name: '日落',
    userBg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    userColor: '#ffffff',
    assistantBg: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
    assistantColor: '#ffffff',
    borderRadius: '20px 20px 6px 20px',
    padding: '14px 20px',
    userShadow: '0 4px 20px rgba(255,107,107,0.5)',
    assistantShadow: '0 4px 20px rgba(108,92,231,0.5)',
  },
}

export function getBubbleStyle(name) {
  return BUBBLE_STYLES[name] || BUBBLE_STYLES.modern
}

export function getAvailableBubbleStyles() {
  return Object.keys(BUBBLE_STYLES).map(key => ({
    id: key,
    name: BUBBLE_STYLES[key].name
  }))
}

let _sessionBgImage = null

export function applyBgImage(imageData) {
  _sessionBgImage = imageData
  const config = getUIConfig()
  config.bgImage = imageData
  const bgLayer = document.getElementById('ui-bg-layer')
  if (imageData) {
    if (bgLayer) {
      bgLayer.setAttribute('style', 'position:fixed;inset:0;z-index:-1;background:url(' + imageData + ') center/cover no-repeat fixed;background-color:transparent;pointer-events:none;')
    }
    document.body.style.background = 'url(' + imageData + ') center/cover no-repeat fixed'
    document.body.style.backgroundColor = 'transparent'
    let styleEl = document.getElementById('ui-bg-override')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'ui-bg-override'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = '#ui-bg-layer,body,html { background-image: url(' + imageData + ') !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; background-attachment: fixed !important; background-color: transparent !important; }'
    console.log('[UI] Set custom image, length:', imageData.length)
  } else {
    if (bgLayer) {
      bgLayer.setAttribute('style', 'position:fixed;inset:0;z-index:-1;background:url(./images/bg.png) center/cover no-repeat fixed;background-color:#0f172a;pointer-events:none;')
    }
    document.body.style.background = 'url(./images/bg.png) center/cover no-repeat fixed'
    console.log('[UI] Set default image')
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
      console.warn('[UI] Image compression failed:', e)
    }
  }
  const ok = saveBgImageToStorage(imageData)
  const config = getUIConfig()
  config.bgImage = imageData
  saveUIConfig(config)
  return ok
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

export function getSessionBgImage() {
  return _sessionBgImage
}

function getBgDiv() {
  return document.getElementById('ui-bg-layer')
}

export function applyBgBlur(val) {
  const config = getUIConfig()
  config.bgBlur = parseInt(val)
  saveUIConfig(config)
  const bgDiv = getBgDiv()
  if (bgDiv) {
    bgDiv.style.filter = `blur(${val}px) brightness(${config.bgBrightness || 0.7})`
  }
}

export function applyBgBrightness(val) {
  const config = getUIConfig()
  config.bgBrightness = parseFloat(val) / 100
  saveUIConfig(config)
  const bgDiv = getBgDiv()
  if (bgDiv) {
    bgDiv.style.filter = `blur(${config.bgBlur || 0}px) brightness(${config.bgBrightness})`
  }
}

export function applyBgOpacity(val) {
  const config = getUIConfig()
  config.bgOpacity = parseFloat(val) / 100
  saveUIConfig(config)
  const bgDiv = getBgDiv()
  if (bgDiv) {
    bgDiv.style.opacity = config.bgOpacity
  }
}

export function applySidebarAlpha(val) {
  const config = getUIConfig()
  config.sidebarAlpha = 1 - parseInt(val) / 100
  saveUIConfig(config)
  document.querySelectorAll('.chat-sidebar, #sidebar, .sidebar').forEach(el => {
    el.style.background = `rgba(255, 255, 255, ${config.sidebarAlpha})`
  })
}

export function applyChatMainAlpha(val) {
  const config = getUIConfig()
  config.chatMainAlpha = val / 100
  saveUIConfig(config)
  const alpha = config.chatMainAlpha
  document.querySelectorAll('.chat-main, #main-col, #content, .chat-page, #app').forEach(el => {
    el.style.background = `rgba(255, 255, 255, ${alpha})`
  })
}

export function applySessionListAlpha(val) {
  const config = getUIConfig()
  config.sessionListAlpha = val / 100
  saveUIConfig(config)
  const alpha = config.sessionListAlpha
  document.querySelectorAll('.chat-session-list, .chat-sidebar, #chat-sidebar, #sidebar').forEach(el => {
    el.style.background = `rgba(255, 255, 255, ${alpha})`
  })
}

export function applyBubbleStyle(styleId) {
  const config = getUIConfig()
  config.bubbleStyle = styleId
  saveUIConfig(config)
}

export function applySoundPreset(presetId) {
  const config = getUIConfig()
  config.soundPreset = presetId
  saveUIConfig(config)
  initAudioContext()
}

export function applySoundVolume(val) {
  const config = getUIConfig()
  config.clickSoundVolume = parseFloat(val) / 100
  saveUIConfig(config)
}
