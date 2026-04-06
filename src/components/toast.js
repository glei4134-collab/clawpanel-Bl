/**
 * Toast 通知组件
 */
let _container = null

const NOTIFICATION_HISTORY_KEY = 'clawpanel-notification-history'
const MAX_HISTORY_SIZE = 50

function ensureContainer() {
  if (!_container) {
    _container = document.createElement('div')
    _container.className = 'toast-container'
    document.body.appendChild(_container)
  }
  return _container
}

function getNotificationHistory() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveNotificationToHistory(notification) {
  const history = getNotificationHistory()
  history.unshift(notification)
  if (history.length > MAX_HISTORY_SIZE) {
    history.pop()
  }
  localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history))
}

export function clearNotificationHistory() {
  localStorage.removeItem(NOTIFICATION_HISTORY_KEY)
}

export function getNotificationHistoryData() {
  return getNotificationHistory()
}

export async function showSystemNotification(title, body, options = {}) {
  if (!('Notification' in window)) {
    return false
  }
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/images/logo.png',
      tag: options.tag || 'default',
      silent: options.silent || false
    })
    
    notification.onclick = () => {
      window.focus()
      notification.close()
      options.onClick?.()
    }
    
    setTimeout(() => notification.close(), options.timeout || 5000)
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      return showSystemNotification(title, body, options)
    }
  }
  
  return false
}

export function toast(message, type = 'info', options = {}) {
  const duration = options.duration || 3000
  const action = options.action
  const timestamp = Date.now()
  
  const notification = {
    id: `notif-${timestamp}`,
    message: typeof message === 'string' ? message : '',
    type,
    timestamp,
    read: false
  }
  
  if (options.tag) {
    notification.tag = options.tag
  }
  
  saveNotificationToHistory(notification)

  const container = ensureContainer()
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.dataset.notifId = notification.id

  const textSpan = document.createElement('span')
  if (options.html) {
    textSpan.innerHTML = message
  } else {
    textSpan.textContent = message
  }
  el.appendChild(textSpan)

  if (action instanceof HTMLElement) {
    el.appendChild(action)
  }

  container.appendChild(el)

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(20px)'
    el.style.transition = 'all 250ms ease'
    setTimeout(() => el.remove(), 250)
  }, duration)
}
