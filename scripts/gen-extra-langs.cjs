/**
 * Generate vi/es/pt/ru/fr/de locale JSON files
 * Base: en.json → apply translations → write {lang}.json
 */
const fs = require('fs')
const path = require('path')

const LOCALES = path.resolve(__dirname, '../src/locales')
const PATCHES = path.resolve(__dirname, 'translations')
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))

const LANGS = ['vi', 'es', 'pt', 'ru', 'fr', 'de']

function clone(o) { return JSON.parse(JSON.stringify(o)) }

function loadPatches(dir) {
  if (!fs.existsSync(dir)) return {}
  const merged = {}
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const mod = f.replace('.json', '')
    merged[mod] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  }
  return merged
}

function applyTranslations(target, dict) {
  for (const [section, entries] of Object.entries(dict)) {
    if (!target[section]) continue
    for (const [key, val] of Object.entries(entries)) {
      if (target[section][key] !== undefined) {
        target[section][key] = val
      }
    }
  }
}

for (const lang of LANGS) {
  const result = clone(en)
  const patchDir = path.join(PATCHES, lang)
  const patches = loadPatches(patchDir)
  applyTranslations(result, patches)
  const outPath = path.join(LOCALES, `${lang}.json`)
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8')
  const patchCount = Object.keys(patches).length
  console.log(`✓ ${lang}.json generated (${patchCount} patch modules applied)`)
}
console.log('  Missing keys fallback to English')
