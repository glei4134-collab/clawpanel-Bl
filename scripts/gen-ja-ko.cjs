/**
 * Generate ja.json and ko.json by applying translation dictionaries
 * to the en.json structure. Missing translations fallback to English.
 * Run: node scripts/gen-ja-ko.cjs
 */
const fs = require('fs')
const path = require('path')

const LOCALES = path.resolve(__dirname, '../src/locales')
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))

// Deep clone helper
const clone = o => JSON.parse(JSON.stringify(o))

// Apply translation dict to target (mutates target)
function applyTranslations(target, dict) {
  for (const [section, keys] of Object.entries(dict)) {
    if (!target[section]) continue
    for (const [key, val] of Object.entries(keys)) {
      if (target[section][key] !== undefined && val) {
        target[section][key] = val
      }
    }
  }
}

// Load translation patches from separate files
const jaPatches = path.join(__dirname, 'translations', 'ja')
const koPatches = path.join(__dirname, 'translations', 'ko')

function loadPatches(dir) {
  if (!fs.existsSync(dir)) return {}
  const result = {}
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const section = file.replace('.json', '')
    result[section] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  }
  return result
}

// Generate ja.json
const ja = clone(en)
applyTranslations(ja, loadPatches(jaPatches))
fs.writeFileSync(path.join(LOCALES, 'ja.json'), JSON.stringify(ja, null, 2) + '\n', 'utf8')
console.log('✓ ja.json generated')

// Generate ko.json
const ko = clone(en)
applyTranslations(ko, loadPatches(koPatches))
fs.writeFileSync(path.join(LOCALES, 'ko.json'), JSON.stringify(ko, null, 2) + '\n', 'utf8')
console.log('✓ ko.json generated')

console.log('  Translations applied from scripts/translations/{ja,ko}/*.json')
console.log('  Missing keys fallback to English')
