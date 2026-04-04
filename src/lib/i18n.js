/**
 * i18n 国际化核心模块
 * 模块化多语言架构，支持 zh-CN / en / zh-TW / ja / ko
 */
import { buildLocales } from '../locales/index.js'

const LANGS = buildLocales()
const LANG_KEY = 'clawpanel_lang'
const FALLBACK = 'zh-CN'

let _lang = FALLBACK
let _dict = LANGS[FALLBACK]
let _listeners = []

/**
 * 翻译函数
 * @param {string} key - 点分隔路径，如 'sidebar.dashboard'
 * @param {object} [params] - 插值参数，如 { count: 3 } 替换 {count}
 * @returns {string}
 */
export function t(key, params) {
  let val = _resolve(_dict, key)
  if (val === undefined) {
    // fallback 到中文
    val = _resolve(LANGS[FALLBACK], key)
  }
  if (val === undefined) return key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return val
}

function _resolve(obj, path) {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

/** 获取当前语言 */
export function getLang() { return _lang }

/** 获取所有可用语言 */
export function getAvailableLangs() {
  return [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
  ]
}

/** 切换语言 */
export function setLang(lang) {
  if (!LANGS[lang]) return
  _lang = lang
  _dict = LANGS[lang]
  localStorage.setItem(LANG_KEY, lang)
  _listeners.forEach(fn => { try { fn(lang) } catch {} })
}

/** 监听语言变化 */
export function onLangChange(fn) {
  _listeners.push(fn)
  return () => { _listeners = _listeners.filter(cb => cb !== fn) }
}

/** 初始化：localStorage > navigator.language > fallback */
export function initI18n() {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved && LANGS[saved]) {
    _lang = saved
    _dict = LANGS[saved]
    return
  }
  // 强制使用简体中文
  _lang = 'zh-CN'
  _dict = LANGS['zh-CN']
}
