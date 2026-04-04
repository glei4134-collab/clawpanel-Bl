# -*- coding: utf-8 -*-
# 恢复 applySessionListAlpha 函数
with open('src/lib/ui-custom.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = '''export function applySessionListAlpha(val) {
  const config = getUIConfig()
  config.sessionListAlpha = val / 100 * 0.5
  saveUIConfig(config)
  const alpha = config.sessionListAlpha
  // 同时设置背景和移除/应用毛玻璃效果
  document.querySelectorAll('.chat-session-list').forEach(el => {
    el.style.setProperty('background', `rgba(255, 255, 255, ${alpha})`, 'important')
    if (alpha === 0) {
      el.style.setProperty('backdrop-filter', 'none', 'important')
    } else {
      el.style.setProperty('backdrop-filter', '', 'important')
    }
  })
}'''

new_func = '''export function applySessionListAlpha(val) {
  const config = getUIConfig()
  config.sessionListAlpha = val / 100 * 0.5
  saveUIConfig(config)
  const alpha = config.sessionListAlpha
  document.querySelectorAll('.chat-session-list').forEach(el => {
    el.style.setProperty('background', `rgba(255, 255, 255, ${alpha})`, 'important')
  })
}'''

content = content.replace(old_func, new_func)

with open('src/lib/ui-custom.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Reverted')
