/**
 * Notification Manager - 统一通知管理模块
 * 支持：系统通知、应用内 Toast、音效、页面失焦检测、免打扰模式
 */

import { isTauriRuntime } from './tauri-api.js'
import { toast as showToast } from '../components/toast.js'

const STORAGE_KEY = 'clawpanel-notification-settings'

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  soundVolume: 0.8,
  soundPreset: 'chime',
  systemNotificationEnabled: true,
  toastEnabled: true,
  doNotDisturb: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  showOnPageHidden: true,
  excludeOwnMessages: true,
  excludeBotMessages: false,
}

let settings = { ...DEFAULT_SETTINGS }
let _tauriNotification = null
let _audioContext = null
let _pageHidden = false
let _notificationQueue = []
let _isProcessingQueue = false

const SOUND_PRESETS = {
  chime: { freq: 880, duration: 0.15, type: 'sine' },
  bubble: { freq: 660, duration: 0.2, type: 'sine' },
  bell: { freq: 523, duration: 0.3, type: 'triangle' },
  click: { freq: 1000, duration: 0.05, type: 'square' },
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e)
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save notification settings:', e)
  }
}

export function getNotificationSettings() {
  return { ...settings }
}

export function updateNotificationSettings(newSettings) {
  settings = { ...settings, ...newSettings }
  saveSettings()
}

function initTauriNotification() {
  if (!isTauriRuntime() || _tauriNotification) return
  try {
    _tauriNotification = window.__TAURI__.notification
  } catch (e) {
    console.warn('Tauri notification not available:', e)
  }
}

function initAudioContext() {
  if (_audioContext) return
  try {
    _audioContext = new (window.AudioContext || window.webkitAudioContext)()
  } catch (e) {
    console.warn('AudioContext not available:', e)
  }
}

export async function playSound(preset = 'chime', volume = 0.8) {
  if (!settings.soundEnabled) return
  if (!_audioContext) initAudioContext()
  if (!_audioContext) return

  if (_audioContext.state === 'suspended') {
    await _audioContext.resume()
  }

  const config = SOUND_PRESETS[preset] || SOUND_PRESETS.chime
  const oscillator = _audioContext.createOscillator()
  const gainNode = _audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(_audioContext.destination)

  oscillator.type = config.type
  oscillator.frequency.setValueAtTime(config.freq, _audioContext.currentTime)

  gainNode.gain.setValueAtTime(volume * settings.soundVolume, _audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, _audioContext.currentTime + config.duration)

  oscillator.start(_audioContext.currentTime)
  oscillator.stop(_audioContext.currentTime + config.duration)
}

function isDoNotDisturbTime() {
  if (!settings.doNotDisturb) return false

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [startH, startM] = settings.doNotDisturbStart.split(':').map(Number)
  const [endH, endM] = settings.doNotDisturbEnd.split(':').map(Number)
  const startTime = startH * 60 + startM
  const endTime = endH * 60 + endM

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime
  } else {
    return currentTime >= startTime || currentTime < endTime
  }
}

function shouldNotify(options = {}) {
  if (isDoNotDisturbTime() && !options.force) return false
  if (options.isOwnMessage && settings.excludeOwnMessages) return false
  if (options.isBotMessage && settings.excludeBotMessages) return false
  return true
}

async function showSystemNotification(title, body, options = {}) {
  if (!settings.systemNotificationEnabled) return false
  if (!shouldNotify(options)) return false

  initTauriNotification()

  if (_tauriNotification) {
    try {
      await _tauriNotification.sendNotification({
        title,
        body,
        icon: options.icon || '/images/logo.png',
      })
      return true
    } catch (e) {
      console.warn('Tauri notification failed:', e)
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: options.icon || '/images/logo.png',
        tag: options.tag || 'default',
        silent: options.silent || false,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        options.onClick?.()
      }

      setTimeout(() => notification.close(), options.timeout || 5000)
      return true
    } catch (e) {
      console.warn('Web Notification failed:', e)
    }
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        return showSystemNotification(title, body, options)
      }
    } catch (e) {
      console.warn('Notification permission request failed:', e)
    }
  }

  return false
}

function showToastNotification(title, body, options = {}) {
  if (!settings.toastEnabled) return
  if (!shouldNotify(options)) return

  const message = title ? `${title}: ${body}` : body
  showToast(message, options.type || 'info', {
    duration: options.duration || 4000,
    tag: options.tag,
  })
}

async function processNotification(options) {
  const { title, body, systemOnly = false, toastOnly = false, ...rest } = options

  if (!toastOnly) {
    const systemSuccess = await showSystemNotification(title, body, rest)
    if (systemSuccess) {
      await playSound()
      return
    }
  }

  if (!systemOnly) {
    showToastNotification(title, body, rest)
    if (settings.soundEnabled) {
      playSound().catch(() => {})
    }
  }
}

async function processQueue() {
  if (_isProcessingQueue || _notificationQueue.length === 0) return

  _isProcessingQueue = true
  const notification = _notificationQueue.shift()

  try {
    await processNotification(notification)
  } catch (e) {
    console.error('Failed to process notification:', e)
  }

  _isProcessingQueue = false

  if (_notificationQueue.length > 0) {
    setTimeout(processQueue, 300)
  }
}

export async function notify(options) {
  if (!shouldNotify(options)) return

  const notification = {
    title: options.title || 'ClawPanel',
    body: options.body || '',
    tag: options.tag || `notif-${Date.now()}`,
    ...options,
  }

  if (_pageHidden && settings.showOnPageHidden) {
    _notificationQueue.push(notification)
    if (!_isProcessingQueue) {
      processQueue()
    }
  } else if (document.hidden && settings.showOnPageHidden) {
    _notificationQueue.push(notification)
    if (!_isProcessingQueue) {
      processQueue()
    }
  } else {
    await processNotification(notification)
  }
}

export function notifyNewMessage(message, options = {}) {
  return notify({
    title: '新消息',
    body: message,
    type: 'info',
    ...options,
  })
}

export function notifyAgentResponse(response, options = {}) {
  return notify({
    title: 'Agent 响应',
    body: response,
    type: 'success',
    ...options,
  })
}

export function notifyError(error, options = {}) {
  return notify({
    title: '错误',
    body: error,
    type: 'error',
    ...options,
  })
}

export function notifyWarning(message, options = {}) {
  return notify({
    title: '警告',
    body: message,
    type: 'warning',
    ...options,
  })
}

export function initNotificationManager() {
  loadSettings()
  initTauriNotification()
  initAudioContext()

  document.addEventListener('visibilitychange', () => {
    _pageHidden = document.hidden
  })

  window.addEventListener('blur', () => {
    _pageHidden = true
  })

  window.addEventListener('focus', () => {
    _pageHidden = false
    _notificationQueue = []
  })

  document.addEventListener('click', () => {
    if (!_audioContext) initAudioContext()
  }, { once: true })

  window.__clawpanel_notify = notify
  window.__clawpanel_notifyNewMessage = notifyNewMessage
  window.__clawpanel_notifyError = notifyError

  console.log('[NotificationManager] Initialized')
}

export { notify as default }
