/**
 * 主题管理（日间/夜间模式）
 */
const THEME_KEY = 'clawpanel-theme'

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  applyTheme(theme)
}

export function toggleTheme(onApply) {
  const html = document.documentElement
  const current = html.dataset.theme || 'light'
  const next = current === 'dark' ? 'light' : 'dark'

  // 设置扩散起点：白切黑从左下角，黑切白从右上角
  const toDark = next === 'dark'
  html.style.setProperty('--theme-reveal-x', toDark ? '0%' : '100%')
  html.style.setProperty('--theme-reveal-y', toDark ? '100%' : '0%')

  const doApply = () => {
    applyTheme(next)
    if (onApply) onApply(next)
  }

  if (document.startViewTransition) {
    document.startViewTransition(doApply)
  } else {
    doApply()
  }
  return next
}

export function getTheme() {
  return document.documentElement.dataset.theme || 'light'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(THEME_KEY, theme)
}
