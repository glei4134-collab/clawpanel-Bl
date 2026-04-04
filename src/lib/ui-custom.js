/**
 * UI 自定义模块
 * 支持背景图片、透明度、点击音效等自定义设置
 */

import { writeFile, readFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const UI_CONFIG_KEY = 'gl_ui_config'
const BG_IMAGE_FILENAME = 'background.png'
const BG_IMAGE_DIR = 'clawpanel'

const DEFAULT_CONFIG = {
  bgImage: '',
  bgBlur: 0,
  bgOpacity: 0.2,
  bgBrightness: 0.66,
  sidebarAlpha: 0.25,
  navSidebarAlpha: 0.25,
  chatMainAlpha: 0.0,
  messagesAlpha: 0.0,
  sessionListAlpha: 0.0,
  inputAlpha: 0.0,
  contentAlpha: 0.15,
  cardAlpha: 0.2,
  globalAlpha: 0.0,
  sidebarFine: 0,
  navSidebarFine: 0,
  mainFine: 0,
  messagesFine: 0,
  sessionFine: 0,
  inputFine: 0,
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
  }
  // 每次都从 gl_bg_image 加载背景图片（避免缓存问题）
  try {
    const savedBg = localStorage.getItem('gl_bg_image')
    if (savedBg) _currentConfig.bgImage = savedBg
  } catch {}
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

async function ensureImageDir() {
  try {
    const dirExists = await exists(BG_IMAGE_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir(BG_IMAGE_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }
  } catch (e) {
    console.warn('[UI] Failed to create image dir:', e);
  }
}

export async function saveBgImageToStorage(imageData) {
  try {
    await ensureImageDir();
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const filePath = `${BG_IMAGE_DIR}/${BG_IMAGE_FILENAME}`;
    await writeFile(filePath, bytes, { baseDir: BaseDirectory.AppData });
    const config = getUIConfig();
    config.bgImage = filePath;
    saveUIConfig(config);
    console.log('[UI] Saved bg image to:', filePath);
    return true;
  } catch (e) {
    console.warn('[UI] Failed to save bg image:', e);
    return false;
  }
}

export async function loadBgImageFromStorage() {
  try {
    const config = getUIConfig();
    if (!config.bgImage) return null;
    const filePath = `${BG_IMAGE_DIR}/${BG_IMAGE_FILENAME}`;
    const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });
    if (!fileExists) return null;
    const bytes = await readFile(filePath, { baseDir: BaseDirectory.AppData });
    const base64 = btoa(String.fromCharCode.apply(null, bytes));
    const mimeType = 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.warn('[UI] Failed to load bg image:', e);
    return null;
  }
}

export async function initBgImage() {
  const imageData = await loadBgImageFromStorage();
  if (imageData) {
    await applyBgImage(imageData);
  }
}

// 计算有效透明度：全局 + 细调（细调范围-1到1）
function calcAlpha(baseAlpha, fineVal) {
  fineVal = fineVal ?? 0
  let alpha = baseAlpha + fineVal
  alpha = Math.max(0, Math.min(1, alpha))
  return alpha
}

function calcBlur(baseBlur, fineVal) {
  fineVal = fineVal ?? 0
  let blur = baseBlur + fineVal
  blur = Math.max(0, blur)
  return blur
}

export function applyUIConfig(config) {
  config = config || getUIConfig()
  
  // 应用背景图片
  if (config.bgImage) {
    applyBgImage(config.bgImage)
  }
  
  // 应用模糊度和亮度
  const bgDiv = document.getElementById('ui-bg-layer')
  if (bgDiv) {
    bgDiv.style.filter = `blur(${config.bgBlur || 0}px) brightness(${config.bgBrightness || 0.66})`
    bgDiv.style.opacity = config.bgOpacity || 0.2
  }
  
  // 应用全局透明度到所有区域 - 使用CSS变量
  const globalAlpha = config.globalAlpha ?? 0
  document.documentElement.style.setProperty('--alpha-global', globalAlpha)
  
  // 各区域透明度单独计算后设置CSS变量
  const navSidebarAlpha = calcAlpha(config.navSidebarAlpha ?? 0.25, config.navSidebarFine)
  const sidebarAlpha = calcAlpha(config.sidebarAlpha ?? 0.25, config.sidebarFine)
  const mainAlpha = calcAlpha(config.chatMainAlpha ?? 0, config.mainFine)
  const messagesAlpha = calcAlpha(config.messagesAlpha ?? 0, config.messagesFine)
  const sessionAlpha = calcAlpha(config.sessionListAlpha ?? 0, config.sessionFine)
  const inputAlpha = calcAlpha(config.inputAlpha ?? 0, config.inputFine)
  
  document.documentElement.style.setProperty('--alpha-nav-sidebar', navSidebarAlpha)
  document.documentElement.style.setProperty('--alpha-sidebar', sidebarAlpha)
  document.documentElement.style.setProperty('--alpha-main', mainAlpha)
  document.documentElement.style.setProperty('--alpha-messages', messagesAlpha)
  document.documentElement.style.setProperty('--alpha-session', sessionAlpha)
  document.documentElement.style.setProperty('--alpha-input', inputAlpha)
  
  // 各区域模糊度计算（基于全局 bgBlur + 细调）
  const baseBlur = config.bgBlur || 0
  const navSidebarBlur = calcBlur(baseBlur, config.navSidebarBlurFine)
  const sidebarBlur = calcBlur(baseBlur, config.sidebarBlurFine)
  const mainBlur = calcBlur(baseBlur, config.mainBlurFine)
  const messagesBlur = calcBlur(baseBlur, config.messagesBlurFine)
  const sessionBlur = calcBlur(baseBlur, config.sessionBlurFine)
  const inputBlur = calcBlur(baseBlur, config.inputBlurFine)
  
  document.documentElement.style.setProperty('--blur-nav-sidebar', navSidebarBlur)
  document.documentElement.style.setProperty('--blur-sidebar', sidebarBlur)
  document.documentElement.style.setProperty('--blur-main', mainBlur)
  document.documentElement.style.setProperty('--blur-messages', messagesBlur)
  document.documentElement.style.setProperty('--blur-session', sessionBlur)
  document.documentElement.style.setProperty('--blur-input', inputBlur)
  
  // 应用气泡样式
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
  keyboard: {
    name: '键盘',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 80)
        data[i] = (Math.random() * 2 - 1) * envelope * 0.2 + Math.sin(2 * Math.PI * 300 * t) * envelope * 0.3
      }
      return buffer
    }
  },
  notify: {
    name: '通知',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 20)
        const freq = 880
        data[i] = (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.5) * envelope * 0.3
      }
      return buffer
    }
  },
  success: {
    name: '成功',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 12)
        const freq1 = 523.25, freq2 = 659.25, freq3 = 783.99
        data[i] = (Math.sin(2 * Math.PI * freq1 * t) * 0.3 + Math.sin(2 * Math.PI * freq2 * t) * 0.3 + Math.sin(2 * Math.PI * freq3 * t) * 0.3) * envelope * 0.3
      }
      return buffer
    }
  },
  error: {
    name: '错误',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 25)
        data[i] = (Math.sin(2 * Math.PI * 200 * t) + Math.sin(2 * Math.PI * 180 * t)) * envelope * 0.3
      }
      return buffer
    }
  },
  swoosh: {
    name: '滑过',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.sin(Math.PI * t / 0.1) * Math.exp(-t * 10)
        const freq = 400 + t * 2000
        data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2
      }
      return buffer
    }
  },
  soft: {
    name: '柔和',
    create: (ctx) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 25)
        data[i] = Math.sin(2 * Math.PI * 600 * t) * envelope * 0.25
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

export function importCustomSound(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result
        const config = getUIConfig()
        config.customSoundData = arrayBuffer
        config.soundPreset = 'custom'
        saveUIConfig(config)
        
        if (_audioContext) {
          _audioContext.decodeAudioData(arrayBuffer.slice(0), (buffer) => {
            _clickBuffer = buffer
          }, (err) => {
            console.warn('Failed to decode audio:', err)
          })
        }
        resolve({ name: file.name, duration: buffer?.duration })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function getCustomBubbleStyles() {
  try {
    const data = localStorage.getItem('gl_custom_bubbles')
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveCustomBubbleStyle(name, style) {
  const bubbles = getCustomBubbleStyles()
  bubbles[name] = style
  localStorage.setItem('gl_custom_bubbles', JSON.stringify(bubbles))
}

export function deleteCustomBubbleStyle(name) {
  const bubbles = getCustomBubbleStyles()
  delete bubbles[name]
  localStorage.setItem('gl_custom_bubbles', JSON.stringify(bubbles))
}

export function getAllBubbleStyles() {
  const builtIn = getAvailableBubbleStyles()
  const custom = getCustomBubbleStyles()
  const customStyles = Object.keys(custom).map(key => ({
    id: key,
    name: custom[key].name || key,
    isCustom: true
  }))
  return [...builtIn, ...customStyles]
}

export function getBubbleStyleById(name) {
  if (BUBBLE_STYLES[name]) {
    return BUBBLE_STYLES[name]
  }
  const custom = getCustomBubbleStyles()
  return custom[name] || BUBBLE_STYLES.modern
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

function getImageUrl(imageData) {
  if (!imageData) return null;
  if (imageData.startsWith('data:') || imageData.startsWith('http') || imageData.startsWith('/')) {
    return imageData;
  }
  return imageData;
}

async function loadImageFromDisk(filePath) {
  try {
    const bytes = await readFile(filePath, { baseDir: BaseDirectory.AppData });
    const base64 = btoa(String.fromCharCode.apply(null, bytes));
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.warn('[UI] Failed to load image from disk:', e);
    return null;
  }
}

export async function applyBgImage(imageData) {
  _sessionBgImage = imageData
  const config = getUIConfig()
  config.bgImage = imageData
  
  let imageUrl = getImageUrl(imageData)
  
  if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    const loadedUrl = await loadImageFromDisk(imageUrl)
    if (loadedUrl) {
      imageUrl = loadedUrl
    }
  }
  
  const bgLayer = document.getElementById('ui-bg-layer')
  if (imageUrl) {
    if (bgLayer) {
      bgLayer.setAttribute('style', 'position:fixed;inset:0;z-index:-1;background:url(' + imageUrl + ') center/cover no-repeat fixed;background-color:transparent;pointer-events:none;')
    }
    document.body.style.background = 'url(' + imageUrl + ') center/cover no-repeat fixed'
    document.body.style.backgroundColor = 'transparent'
    let styleEl = document.getElementById('ui-bg-override')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'ui-bg-override'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = '#ui-bg-layer,body,html { background-image: url(' + imageUrl + ') !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; background-attachment: fixed !important; background-color: transparent !important; }'
    console.log('[UI] Set custom image:', imageUrl)
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
  const ok = await saveBgImageToStorage(_sessionBgImage)
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
  config.bgBlur = parseFloat(val)
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
  config.sidebarAlpha = val / 100 * 0.25
  saveUIConfig(config)
  const alpha = config.sidebarAlpha
  document.querySelectorAll('#sidebar').forEach(el => {
    el.style.setProperty('background', `rgba(255, 255, 255, ${alpha})`, 'important')
  })
}

export function applyChatMainAlpha(val) {
  const config = getUIConfig()
  config.chatMainAlpha = val / 100 * 0.25
  saveUIConfig(config)
  document.documentElement.style.setProperty('--header-alpha', config.chatMainAlpha)
}

export function applySessionListAlpha(val) {
  const config = getUIConfig()
  config.sessionListAlpha = val / 100 * 0.25
  saveUIConfig(config)
  // 同时控制会话列表和侧边栏
  document.documentElement.style.setProperty('--sidebar-alpha', config.sessionListAlpha)
}

export function applyMessagesAlpha(val) {
  const config = getUIConfig()
  config.messagesAlpha = val / 100 * 0.5
  saveUIConfig(config)
  document.documentElement.style.setProperty('--messages-alpha', config.messagesAlpha)
}

export function applyInputAlpha(val) {
  const config = getUIConfig()
  config.inputAlpha = val / 100 * 0.25
  saveUIConfig(config)
  document.documentElement.style.setProperty('--input-alpha', config.inputAlpha)
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


// 全局透明度
export function applyGlobalAlpha(val) {
  const config = getUIConfig()
  config.globalAlpha = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

// 各区域细调
export function applySidebarFine(val) {
  const config = getUIConfig()
  config.sidebarFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyNavSidebarFine(val) {
  const config = getUIConfig()
  config.navSidebarFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyMainFine(val) {
  const config = getUIConfig()
  config.mainFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyMessagesFine(val) {
  const config = getUIConfig()
  config.messagesFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applySessionFine(val) {
  const config = getUIConfig()
  config.sessionFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyInputFine(val) {
  const config = getUIConfig()
  config.inputFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

// 模糊度细调
export function applyNavSidebarBlurFine(val) {
  const config = getUIConfig()
  config.navSidebarBlurFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applySidebarBlurFine(val) {
  const config = getUIConfig()
  config.sidebarBlurFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyMainBlurFine(val) {
  const config = getUIConfig()
  config.mainBlurFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyMessagesBlurFine(val) {
  const config = getUIConfig()
  config.messagesBlurFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applySessionBlurFine(val) {
  const config = getUIConfig()
  config.sessionBlurFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}

export function applyInputBlurFine(val) {
  const config = getUIConfig()
  config.inputBlurFine = val / 100
  saveUIConfig(config)
  applyUIConfig(config)
}
