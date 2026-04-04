/**
 * 迁移脚本：将单体 JSON 语言包拆分为模块化 JS 文件
 * 读取 11 种语言 JSON → 生成 src/locales/modules/*.js
 */
const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.resolve(__dirname, '../src/locales')
const MODULES_DIR = path.resolve(LOCALES_DIR, 'modules')

function readLang(file) {
  const p = path.join(LOCALES_DIR, file)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {}
}

const zhCN = readLang('zh-CN.json')
const en = readLang('en.json')
const zhTW = readLang('zh-TW.json')
const ja = readLang('ja.json')
const ko = readLang('ko.json')
const vi = readLang('vi.json')
const es = readLang('es.json')
const pt = readLang('pt.json')
const ru = readLang('ru.json')
const fr = readLang('fr.json')
const de = readLang('de.json')

// 模块名映射（JSON key → 文件名）
const MODULE_FILE_MAP = {
  common: 'common',
  sidebar: 'sidebar',
  instance: 'instance',
  dashboard: 'dashboard',
  services: 'services',
  settings: 'settings',
  models: 'models',
  agents: 'agents',
  gateway: 'gateway',
  security: 'security',
  communication: 'communication',
  channels: 'channels',
  memory: 'memory',
  cron: 'cron',
  usage: 'usage',
  skills: 'skills',
  chat: 'chat',
  chatDebug: 'chat-debug',
  setup: 'setup',
  about: 'about',
  ext: 'ext',
  logs: 'logs',
  assistant: 'assistant',
  toast: 'toast',
  modal: 'modal',
}

// 确保输出目录存在
if (!fs.existsSync(MODULES_DIR)) {
  fs.mkdirSync(MODULES_DIR, { recursive: true })
}

// 转义 JS 字符串中的特殊字符
function escapeStr(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

// 参数顺序: zhCN, en, zhTW, ja, ko, vi, es, pt, ru, fr, de
const LANG_ORDER = [
  { key: 'zhCN', fallback: null },
  { key: 'en', fallback: null },
  { key: 'zhTW', fallback: 'zhCN' },
  { key: 'ja', fallback: 'en' },
  { key: 'ko', fallback: 'en' },
  { key: 'vi', fallback: 'en' },
  { key: 'es', fallback: 'en' },
  { key: 'pt', fallback: 'en' },
  { key: 'ru', fallback: 'en' },
  { key: 'fr', fallback: 'en' },
  { key: 'de', fallback: 'en' },
]

// 生成一个模块的 JS 源码（11 语言）
function generateModule(sectionKey, sections) {
  const keys = Object.keys(sections.zhCN)
  const lines = []

  lines.push("import { _ } from '../helper.js'")
  lines.push('')
  lines.push('export default {')

  for (const key of keys) {
    const vals = {}
    for (const { key: lk } of LANG_ORDER) {
      vals[lk] = (sections[lk] && sections[lk][key]) || ''
    }

    // 计算可省略的参数（和 fallback 相同时省略）
    const params = LANG_ORDER.map(({ key: lk, fallback }) => {
      if (!fallback) return vals[lk] // zhCN, en 必填
      return vals[lk] === vals[fallback] ? '' : vals[lk]
    })

    // 从尾部截断空参数
    let lastNonEmpty = 1 // 至少保留 zhCN + en
    for (let i = params.length - 1; i >= 2; i--) {
      if (params[i]) { lastNonEmpty = i; break }
    }

    const parts = params.slice(0, lastNonEmpty + 1).map(v => `'${escapeStr(v)}'`)
    lines.push(`  ${safeKey(key)}: _(${parts.join(', ')}),`)
  }

  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

// 确保 key 是合法的 JS 标识符，否则加引号
function safeKey(key) {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key
  return `'${key}'`
}

let totalKeys = 0
let fileCount = 0

for (const [sectionKey, fileName] of Object.entries(MODULE_FILE_MAP)) {
  const zhCNSection = zhCN[sectionKey]
  if (!zhCNSection) {
    console.warn(`⚠ Section "${sectionKey}" not found in zh-CN.json, skipping`)
    continue
  }

  const sections = {
    zhCN: zhCNSection,
    en: en[sectionKey] || {},
    zhTW: zhTW[sectionKey] || {},
    ja: ja[sectionKey] || {},
    ko: ko[sectionKey] || {},
    vi: vi[sectionKey] || {},
    es: es[sectionKey] || {},
    pt: pt[sectionKey] || {},
    ru: ru[sectionKey] || {},
    fr: fr[sectionKey] || {},
    de: de[sectionKey] || {},
  }

  const source = generateModule(sectionKey, sections)
  const outPath = path.join(MODULES_DIR, `${fileName}.js`)
  fs.writeFileSync(outPath, source, 'utf8')

  const keyCount = Object.keys(zhCNSection).length
  totalKeys += keyCount
  fileCount++
  console.log(`✓ ${fileName}.js  (${keyCount} keys)`)
}

console.log(`\n✓ Done: ${fileCount} module files, ${totalKeys} total keys`)
console.log(`  Output: ${MODULES_DIR}`)
