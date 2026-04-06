path = r'C:\Users\17544\Desktop\clawpanel源代码\clawpanel-main\src\lib\ui-custom.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace applyBgImage with simpler test version
old = '''export function applyBgImage(imageData) {
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
}'''

new = '''export function applyBgImage(imageData) {
  _sessionBgImage = imageData
  const config = getUIConfig()
  config.bgImage = imageData

  // 直接在 body 后面添加一个测试 div
  let testBg = document.getElementById('test-bg-div')
  if (!testBg) {
    testBg = document.createElement('div')
    testBg.id = 'test-bg-div'
    testBg.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;'
    document.body.appendChild(testBg)
  }

  if (imageData) {
    testBg.style.backgroundImage = `url(${imageData})`
    testBg.style.backgroundSize = 'cover'
    testBg.style.backgroundPosition = 'center'
    console.log('[applyBgImage] Set test div background, data length:', imageData.length)
  } else {
    testBg.style.backgroundImage = "url('/images/bg.png')"
    console.log('[applyBgImage] Reset to default background')
  }
}'''

content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')