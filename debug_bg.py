# Debug script to test background image functionality

path = r'C:\Users\17544\Desktop\clawpanel源代码\clawpanel-main\src\lib\ui-custom.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace applyBgImage with a detailed debug version
old = """export function applyBgImage(imageData) {
  _sessionBgImage = imageData
  const config = getUIConfig()
  config.bgImage = imageData
  
  const bgUrl = imageData 
    ? (imageData.startsWith('data:') ? imageData : `url('${imageData}')`)
    : "url('/images/bg.png')"
  
  // 创建或更新 style 元素来设置 #app::before 的背景
  if (!_bgStyleEl) {
    _bgStyleEl = document.createElement('style')
    _bgStyleEl.id = 'dynamic-bg-style'
    document.head.appendChild(_bgStyleEl)
  }
  
  _bgStyleEl.textContent = `#app::before { background-image: ${bgUrl} !important; }`
  console.log('[applyBgImage] Set #app::before background:', bgUrl ? bgUrl.substring(0, 50) : 'default')
}"""

new = """export function applyBgImage(imageData) {
  _sessionBgImage = imageData
  const config = getUIConfig()
  config.bgImage = imageData

  const bgUrl = imageData
    ? (imageData.startsWith('data:') ? imageData : `url('${imageData}')`)
    : "url('/images/bg.png')"

  console.group('[applyBgImage] Debug')
  console.log('imageData length:', imageData ? imageData.length : 0)
  console.log('bgUrl:', bgUrl)

  // Check if #app::before exists
  const appBefore = window.getComputedStyle(document.querySelector('#app'), '::before')
  console.log('#app::before exists:', appBefore !== null)
  console.log('#app::before background-image:', appBefore.backgroundImage)
  console.log('#app::before display:', appBefore.display)
  console.log('#app::before content:', appBefore.content)

  // Create or update style element
  if (!_bgStyleEl) {
    _bgStyleEl = document.createElement('style')
    _bgStyleEl.id = 'dynamic-bg-style'
    document.head.appendChild(_bgStyleEl)
    console.log('Created new style element')
  }

  const css = `#app::before { background-image: ${bgUrl} !important; background-size: cover !important; background-position: center !important; }`
  _bgStyleEl.textContent = css
  console.log('Applied CSS:', css)

  // Verify the style was applied
  console.log('Style element content:', _bgStyleEl.textContent)
  console.log('Style element in document:', document.getElementById('dynamic-bg-style') !== null)

  // Check computed style after a tiny delay
  setTimeout(() => {
    const newStyle = window.getComputedStyle(document.querySelector('#app'), '::before')
    console.log('After apply - background-image:', newStyle.backgroundImage)
    console.log('After apply - background-size:', newStyle.backgroundSize)
    console.groupEnd()
  }, 50)
}"""

content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')