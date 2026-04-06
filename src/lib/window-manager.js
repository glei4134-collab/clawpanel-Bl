/**
 * 分屏/多窗口模式事件处理补丁
 * 
 * 问题诊断：
 * 1. background-attachment: fixed 在分屏模式下导致背景显示异常
 * 2. position: fixed 元素在分屏后可能超出视口边界
 * 3. 透明背景层可能遮挡下层可交互元素
 * 4. Toast和Modal的z-index在分屏场景下可能冲突
 * 5. 窗口resize后布局未正确重算
 */

let _initialized = false
let _resizeTimer = null
let _lastWindowSize = { width: 0, height: 0 }

export function initWindowManager() {
  if (_initialized) return
  _initialized = true

  console.log('[WindowManager] 初始化分屏/多窗口事件补丁')

  setupBackgroundLayerFix()
  setupWindowResizeHandler()
  setupFocusRecovery()
  setupToastPositionFix()
  setupModalBoundsFix()
  setupOverlayClickFix()

  _lastWindowSize = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  window.addEventListener('resize', handleWindowResize, { passive: true })
  window.addEventListener('orientationchange', handleOrientationChange)
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize, { passive: true })
  }

  console.log('[WindowManager] 分屏事件补丁已激活')
}

function handleWindowResize() {
  if (_resizeTimer) {
    clearTimeout(_resizeTimer)
  }
  
  const width = window.innerWidth
  const height = window.innerHeight

  if (width === _lastWindowSize.width && height === _lastWindowSize.height) {
    return
  }

  _resizeTimer = setTimeout(() => {
    console.log('[WindowManager] 窗口尺寸变化:', _lastWindowSize, '->', { width, height })
    _lastWindowSize = { width, height }
    
    fixBackgroundLayer()
    fixToastPosition()
    fixModalBounds()
    fixOverlayBounds()
    
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-route]').forEach(el => {
        if (el.getBoundingClientRect().width > 0) {
          el.style.pointerEvents = ''
        }
      })
    })
  }, 100)
}

function handleOrientationChange() {
  console.log('[WindowManager] 屏幕方向改变')
  setTimeout(() => {
    fixAllUI()
  }, 150)
}

function handleViewportResize() {
  if (window.visualViewport) {
    const scale = window.visualViewport.scale || 1
    if (scale !== 1) {
      console.log('[WindowManager] 检测到缩放变化:', scale)
      document.documentElement.style.setProperty('--viewport-scale', scale)
    }
  }
}

function setupBackgroundLayerFix() {
  const fixBgLayer = () => {
    const bgLayer = document.getElementById('ui-bg-layer')
    if (bgLayer) {
      const computed = window.getComputedStyle(bgLayer)
      if (computed.backgroundAttachment === 'fixed') {
        console.log('[WindowManager] 修复背景层: 移除 fixed 定位')
        bgLayer.style.position = 'fixed'
        bgLayer.style.backgroundAttachment = 'scroll'
      }
    }
  }
  
  if (document.readyState === 'complete') {
    fixBgLayer()
  } else {
    window.addEventListener('load', fixBgLayer, { once: true })
  }
}

function fixBackgroundLayer() {
  const bgLayer = document.getElementById('ui-bg-layer')
  if (bgLayer) {
    bgLayer.style.backgroundSize = 'cover'
    bgLayer.style.backgroundPosition = 'center center'
  }
  
  const appBefore = document.querySelector('#app::before')
  if (appBefore && appBefore !== null) {
    const bgDiv = document.getElementById('ui-bg-div')
    if (bgDiv) {
      bgDiv.style.backgroundSize = 'cover'
      bgDiv.style.backgroundPosition = 'center center'
    }
  }
}

function setupWindowResizeHandler() {
  window.__recalcLayout = () => {
    const sidebar = document.getElementById('sidebar')
    const mainCol = document.getElementById('main-col')
    const content = document.getElementById('content')
    
    if (sidebar) {
      const sidebarRect = sidebar.getBoundingClientRect()
      if (sidebarRect.right > window.innerWidth) {
        sidebar.style.width = Math.max(60, window.innerWidth - mainCol?.getBoundingClientRect().left || 0) + 'px'
      }
    }
    
    if (content) {
      content.style.maxWidth = 'none'
    }
  }
}

function setupFocusRecovery() {
  document.addEventListener('click', (e) => {
    const target = e.target
    if (!target) return
    
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }
    
    if (target.closest('[contenteditable="true"]')) {
      return
    }
  }, true)
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[WindowManager] 页面恢复可见，恢复焦点')
      recoverFocus()
    }
  })
  
  window.addEventListener('focus', () => {
    console.log('[WindowManager] 窗口获得焦点')
    recoverFocus()
  })
}

function recoverFocus() {
  const activeEl = document.activeElement
  if (!activeEl || activeEl === document.body || activeEl === document.documentElement) {
    const clickable = document.querySelector('.nav-item:not(.active), .btn:not(:disabled), button:not(:disabled)')
    if (clickable) {
      clickable.focus()
    }
  }
}

function setupToastPositionFix() {
  const fixToastPosition = () => {
    const container = document.querySelector('.toast-container')
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    
    if (containerRect.right > window.innerWidth - 10) {
      container.style.right = '10px'
    }
    
    if (containerRect.bottom > window.innerHeight - 10) {
      container.style.top = '10px'
    }
    
    const currentRight = parseInt(container.style.right) || 20
    if (currentRight > window.innerWidth / 2) {
      container.style.right = '20px'
      container.style.left = 'auto'
    }
  }
  
  window.__fixToastPosition = fixToastPosition
}

function fixToastPosition() {
  if (typeof window.__fixToastPosition === 'function') {
    window.__fixToastPosition()
  }
}

function setupModalBoundsFix() {
  const fixModalBounds = () => {
    const modals = document.querySelectorAll('.modal')
    modals.forEach(modal => {
      const rect = modal.getBoundingClientRect()
      if (rect.left < 0) {
        modal.style.marginLeft = Math.abs(rect.left) + 20 + 'px'
      }
      if (rect.right > window.innerWidth) {
        modal.style.maxWidth = (window.innerWidth - rect.left - 40) + 'px'
      }
      if (rect.bottom > window.innerHeight) {
        modal.style.maxHeight = (window.innerHeight - 40) + 'px'
        modal.style.overflowY = 'auto'
      }
    })
  }
  
  window.__fixModalBounds = fixModalBounds
}

function fixModalBounds() {
  if (typeof window.__fixModalBounds === 'function') {
    window.__fixModalBounds()
  }
}

function setupOverlayClickFix() {
  document.addEventListener('click', (e) => {
    const target = e.target
    
    if (target.classList.contains('modal-overlay') || target.classList.contains('sidebar-overlay')) {
      const rect = target.getBoundingClientRect()
      
      if (e.clientX < rect.left || e.clientX > rect.right || 
          e.clientY < rect.top || e.clientY > rect.bottom) {
        console.log('[WindowManager] 点击位置在overlay外部，忽略')
        return
      }
    }
  }, true)
}

function fixOverlayBounds() {
  const overlays = document.querySelectorAll('.modal-overlay, .sidebar-overlay')
  overlays.forEach(overlay => {
    if (overlay.classList.contains('sidebar-overlay') && overlay.classList.contains('visible')) {
      overlay.style.width = '100%'
      overlay.style.height = '100%'
    }
  })
}

function fixAllUI() {
  fixBackgroundLayer()
  fixToastPosition()
  fixModalBounds()
  fixOverlayBounds()
  
  if (typeof window.__recalcLayout === 'function') {
    window.__recalcLayout()
  }
}

export function getWindowInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: window.screen?.orientation?.type || 'unknown',
    isMultiWindow: false
  }
}

export function forceReflow() {
  const el = document.createElement('div')
  el.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0'
  document.body.appendChild(el)
  void el.offsetWidth
  document.body.removeChild(el)
}

export { fixAllUI }
