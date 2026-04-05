/**
 * 面板设置页面
 * 统一管理 ClawPanel 的网络代理、npm 源、模型代理等配置
 */
import { api } from '../lib/tauri-api.js'
import { toast } from '../components/toast.js'
import { showConfirm } from '../components/modal.js'
import { createCustomSelect } from '../components/custom-select.js'
import { t, getLang, setLang, getAvailableLangs, onLangChange } from '../lib/i18n.js'
import { isMacPlatform } from '../lib/app-state.js'
import { renderSidebar } from '../components/sidebar.js'

const isTauri = !!window.__TAURI_INTERNALS__

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function platformDefaultDockerEndpoint() {
  const isWin = navigator.platform?.startsWith('Win') || navigator.userAgent?.includes('Windows')
  return isWin ? '//./pipe/docker_engine' : '/var/run/docker.sock'
}

function effectiveDockerEndpoint(cfg) {
  return (cfg?.dockerEndpoint || '').trim() || platformDefaultDockerEndpoint()
}

function effectiveDockerImage(cfg) {
  return (cfg?.dockerDefaultImage || '').trim() || 'ghcr.io/qingchencloud/openclaw'
}

function openclawInstallationIdentity(installation) {
  const rawPath = String(installation?.path || '').trim()
  if (!rawPath) return ''
  const isWin = navigator.platform?.startsWith('Win') || navigator.userAgent?.includes('Windows')
  if (!isWin) return rawPath
  return rawPath
    .replace(/\//g, '\\')
    .replace(/\\openclaw(?:\.exe|\.ps1)?$/i, '\\openclaw.cmd')
    .toLowerCase()
}

function dedupeOpenclawInstallations(list = []) {
  const map = new Map()
  const preferCmd = inst => /openclaw\.cmd$/i.test(String(inst?.path || ''))
  for (const installation of Array.isArray(list) ? list : []) {
    const key = openclawInstallationIdentity(installation)
    if (!key) continue
    const existing = map.get(key)
    if (!existing || (!existing.active && installation.active) || (!preferCmd(existing) && preferCmd(installation))) {
      map.set(key, installation)
    }
  }
  return [...map.values()]
}

const REGISTRIES = [
  { label: () => t('settings.registryTaobao'), value: 'https://registry.npmmirror.com' },
  { label: () => t('settings.registryNpm'), value: 'https://registry.npmjs.org' },
  { label: () => t('settings.registryHuawei'), value: 'https://repo.huaweicloud.com/repository/npm/' },
]

export async function render() {
  const page = document.createElement('div')
  page.className = 'page'

  page.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('settings.title')}</h1>
      <p class="page-desc">${t('settings.desc')}</p>
    </div>

    <div class="config-section" id="proxy-section">
      <div class="config-section-title">${t('settings.networkProxy')}</div>
      <div id="proxy-bar"><div class="stat-card loading-placeholder" style="height:48px"></div></div>
    </div>

    <div class="config-section" id="model-proxy-section">
      <div class="config-section-title">${t('settings.modelProxy')}</div>
      <div id="model-proxy-bar"><div class="stat-card loading-placeholder" style="height:48px"></div></div>
    </div>

    <div class="config-section" id="registry-section">
      <div class="config-section-title">${t('settings.npmRegistry')}</div>
      <div id="registry-bar"><div class="stat-card loading-placeholder" style="height:48px"></div></div>
    </div>

    <div class="config-section" id="openclaw-dir-section">
      <div class="config-section-title">${t('settings.openclawDir')}</div>
      <div id="openclaw-dir-bar"><div class="stat-card loading-placeholder" style="height:48px"></div></div>
    </div>

    <div class="config-section" id="openclaw-search-section">
      <div class="config-section-title">${t('settings.openclawSearchPaths')}</div>
      <div id="openclaw-search-bar"><div class="stat-card loading-placeholder" style="height:96px"></div></div>
    </div>

    <div class="config-section" id="docker-defaults-section">
      <div class="config-section-title">${t('settings.dockerDefaults')}</div>
      <div id="docker-defaults-bar"><div class="stat-card loading-placeholder" style="height:84px"></div></div>
    </div>

    <div class="config-section" id="cli-binding-section">
      <div class="config-section-title">${t('settings.openclawCli')}</div>
      <div id="cli-binding-bar"><div class="stat-card loading-placeholder" style="height:48px"></div></div>
    </div>

    <div class="config-section" id="language-section">
      <div class="config-section-title">${t('settings.language')}</div>
      <div id="language-bar"></div>
    </div>

    ${window.__TAURI_INTERNALS__ ? `<div class="config-section" id="autostart-section">
      <div class="config-section-title">${t('settings.autostart')}</div>
      <div id="autostart-bar"><div class="stat-card loading-placeholder" style="height:48px"></div></div>
    </div>` : ''}

  `

  bindEvents(page)
  loadAll(page)
  return page
}

async function loadAll(page) {
  const tasks = [loadProxyConfig(page), loadModelProxyConfig(page), loadOpenclawDir(page), loadOpenclawSearchPaths(page), loadDockerDefaults(page), loadCliBinding(page)]
  tasks.push(loadRegistry(page))
  if (window.__TAURI_INTERNALS__) tasks.push(loadAutostart(page))
  await Promise.all(tasks)
  loadLanguageSwitcher(page)
}

// ===== UI 自定义 =====

async function loadUICustom(page) {
  const bar = page.querySelector('#ui-custom-bar')
  if (!bar) return
  
  const config = getUIConfig()
  const bubbleStyles = getAvailableBubbleStyles()
  
  bar.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">背景图片</div>
        <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
          <input class="form-input" data-name="ui-bg-image" placeholder="输入图片URL，留空使用默认背景" value="${escapeHtml(config.bgImage || '')}" style="max-width:360px;flex:1">
          <button class="btn btn-secondary btn-sm" data-action="apply-bg">应用</button>
        </div>
      </div>
      
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">模糊度: <span id="ui-blur-value">${config.bgBlur}</span>px</div>
        <input type="range" data-name="ui-bg-blur" min="0" max="30" value="${config.bgBlur}" style="width:200px">
      </div>
      
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">背景亮度: <span id="ui-brightness-value">${Math.round(config.bgBrightness * 100)}</span>%</div>
        <input type="range" data-name="ui-bg-brightness" min="20" max="100" value="${Math.round(config.bgBrightness * 100)}" style="width:200px">
      </div>
      
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">背景透明度: <span id="ui-opacity-value">${Math.round(config.bgOpacity * 100)}</span>%</div>
        <input type="range" data-name="ui-bg-opacity" min="10" max="100" value="${Math.round(config.bgOpacity * 100)}" style="width:200px">
      </div>
      
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">UI透明度: <span id="ui-transparency-value">${Math.round(config.transparency * 100)}</span>%</div>
        <input type="range" data-name="ui-transparency" min="50" max="100" value="${Math.round(config.transparency * 100)}" style="width:200px">
      </div>
      
      <div>
        <div style="display:flex;align-items:center;gap:var(--space-sm)">
          <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-size-sm);cursor:pointer">
            <input type="checkbox" data-name="ui-click-sound" ${config.clickSound ? 'checked' : ''}>
            点击音效
          </label>
        </div>
      </div>
      
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">音量: <span id="ui-volume-value">${Math.round(config.clickSoundVolume * 100)}</span>%</div>
        <input type="range" data-name="ui-volume" min="10" max="100" value="${Math.round(config.clickSoundVolume * 100)}" style="width:200px" ${config.clickSound ? '' : 'disabled'}>
      </div>
      
      <div>
        <div style="font-size:var(--font-size-sm);margin-bottom:8px;font-weight:500">气泡风格</div>
        <select class="form-input" data-name="ui-bubble-style" style="max-width:200px">
          ${bubbleStyles.map(s => `<option value="${s.id}" ${config.bubbleStyle === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      
      <div>
        <button class="btn btn-secondary btn-sm" data-action="reset-ui">恢复默认</button>
      </div>
    </div>
  `
  
  // 绑定事件
  const inputs = bar.querySelectorAll('input[type="range"]')
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      const name = input.dataset.name
      const value = parseInt(input.value)
      
      if (name === 'ui-bg-blur') {
        bar.querySelector('#ui-blur-value').textContent = value
        config.bgBlur = value
      } else if (name === 'ui-bg-brightness') {
        bar.querySelector('#ui-brightness-value').textContent = value
        config.bgBrightness = value / 100
      } else if (name === 'ui-bg-opacity') {
        bar.querySelector('#ui-opacity-value').textContent = value
        config.bgOpacity = value / 100
      } else if (name === 'ui-transparency') {
        bar.querySelector('#ui-transparency-value').textContent = value
        config.transparency = value / 100
      } else if (name === 'ui-volume') {
        bar.querySelector('#ui-volume-value').textContent = value
        config.clickSoundVolume = value / 100
      }
      
      saveUIConfig(config)
    })
  })
  
  // 背景图片应用
  bar.querySelector('[data-action="apply-bg"]')?.addEventListener('click', () => {
    const bgUrl = bar.querySelector('[data-name="ui-bg-image"]').value.trim()
    config.bgImage = bgUrl
    saveUIConfig(config)
    toast(bgUrl ? '背景图片已应用' : '已恢复默认背景', 'success')
  })
  
  // 点击音效开关
  bar.querySelector('[data-name="ui-click-sound"]')?.addEventListener('change', (e) => {
    config.clickSound = e.target.checked
    bar.querySelector('[data-name="ui-volume"]').disabled = !e.target.checked
    saveUIConfig(config)
    toast(e.target.checked ? '点击音效已开启' : '点击音效已关闭', 'success')
  })
  
  // 气泡风格
  bar.querySelector('[data-name="ui-bubble-style"]')?.addEventListener('change', (e) => {
    config.bubbleStyle = e.target.value
    saveUIConfig(config)
    toast('气泡风格已更改', 'success')
  })
  
  // 恢复默认
  bar.querySelector('[data-action="reset-ui"]')?.addEventListener('click', () => {
    const defaultConfig = {
      bgImage: '',
      bgBlur: 8,
      bgOpacity: 0.5,
      bgBrightness: 0.5,
      transparency: 0.85,
      clickSound: true,
      clickSoundVolume: 0.5,
      bubbleStyle: 'modern',
    }
    saveUIConfig(defaultConfig)
    toast('已恢复默认设置', 'success')
    loadUICustom(page)
  })
}

// ===== 网络代理 =====

async function loadProxyConfig(page) {
  const bar = page.querySelector('#proxy-bar')
  if (!bar) return
  try {
    const cfg = await api.readPanelConfig()
    const proxyUrl = cfg?.networkProxy?.url || ''
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
        <input class="form-input" data-name="proxy-url" placeholder="http://127.0.0.1:7897" value="${escapeHtml(proxyUrl)}" style="max-width:360px">
        <button class="btn btn-primary btn-sm" data-action="save-proxy">${t('common.save')}</button>
        <button class="btn btn-secondary btn-sm" data-action="test-proxy" ${proxyUrl ? '' : 'disabled'}>${t('settings.testProxy')}</button>
        <button class="btn btn-secondary btn-sm" data-action="clear-proxy" ${proxyUrl ? '' : 'disabled'}>${t('settings.clearProxy')}</button>
      </div>
      <div id="proxy-test-result" style="margin-top:var(--space-xs);font-size:var(--font-size-xs);min-height:20px"></div>
      <div class="form-hint" style="margin-top:var(--space-xs)">
        ${t('settings.proxyHint')}
      </div>
    `
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

// ===== 模型请求代理 =====

async function loadModelProxyConfig(page) {
  const bar = page.querySelector('#model-proxy-bar')
  if (!bar) return
  try {
    const cfg = await api.readPanelConfig()
    const proxyUrl = cfg?.networkProxy?.url || ''
    const modelProxy = !!cfg?.networkProxy?.proxyModelRequests
    const hasProxy = !!proxyUrl

    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-size-sm);cursor:pointer">
          <input type="checkbox" data-name="model-proxy-toggle" ${modelProxy ? 'checked' : ''} ${hasProxy ? '' : 'disabled'}>
          ${t('settings.modelProxyToggle')}
        </label>
        <button class="btn btn-primary btn-sm" data-action="save-model-proxy">${t('common.save')}</button>
      </div>
      <div class="form-hint" style="margin-top:var(--space-xs)">
        ${hasProxy
          ? t('settings.modelProxyHint')
          : t('settings.modelProxyNoProxy')
        }
      </div>
    `
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

// ===== npm 源设置 =====

async function loadRegistry(page) {
  const bar = page.querySelector('#registry-bar')
  try {
    const current = await api.getNpmRegistry()
    const isPreset = REGISTRIES.some(r => r.value === current)
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
        <select class="form-input" data-name="registry" style="max-width:320px">
          ${REGISTRIES.map(r => `<option value="${r.value}" ${r.value === current ? 'selected' : ''}>${typeof r.label === 'function' ? r.label() : r.label}</option>`).join('')}
          <option value="custom" ${!isPreset ? 'selected' : ''}>${t('settings.registryCustom')}</option>
        </select>
        <input class="form-input" data-name="custom-registry" placeholder="https://..." value="${isPreset ? '' : escapeHtml(current)}" style="max-width:320px;${isPreset ? 'display:none' : ''}">
        <button class="btn btn-primary btn-sm" data-action="save-registry">${t('common.save')}</button>
      </div>
      <div class="form-hint" style="margin-top:var(--space-xs)">${t('settings.registryHint')}</div>
    `
    const select = bar.querySelector('[data-name="registry"]')
    const customInput = bar.querySelector('[data-name="custom-registry"]')
    select.onchange = () => {
      customInput.style.display = select.value === 'custom' ? '' : 'none'
    }
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

// ===== OpenClaw 安装路径 =====

async function loadOpenclawDir(page) {
  const bar = page.querySelector('#openclaw-dir-bar')
  if (!bar) return
  try {
    const info = await api.getOpenclawDir()
    const cfg = await api.readPanelConfig()
    const customValue = cfg?.openclawDir || ''
    const statusText = info.configExists
      ? `<span style="color:var(--success)">${t('settings.configExists')}</span>`
      : `<span style="color:var(--warning)">${t('settings.configMissing')}</span>`
    bar.innerHTML = `
      <div style="margin-bottom:var(--space-xs)">
        <span class="form-hint">${t('settings.currentPath')}:</span>
        <strong style="font-size:var(--font-size-sm)">${escapeHtml(info.path)}</strong>
        <span style="margin-left:var(--space-xs);font-size:var(--font-size-xs)">${statusText}</span>
        ${info.isCustom ? `<span class="clawhub-badge" style="margin-left:var(--space-xs);background:rgba(99,102,241,0.14);color:#6366f1;font-size:var(--font-size-xs)">${t('settings.customBadge')}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
        <input class="form-input" data-name="openclaw-dir" placeholder="${t('settings.dirPlaceholder')}" value="${escapeHtml(customValue)}" style="max-width:420px">
        <button class="btn btn-primary btn-sm" data-action="save-openclaw-dir">${t('common.save')}</button>
        ${info.isCustom ? `<button class="btn btn-secondary btn-sm" data-action="reset-openclaw-dir">${t('settings.resetDefault')}</button>` : ''}
      </div>
      <div class="form-hint" style="margin-top:var(--space-xs)">
        ${t('settings.dirHint')}
      </div>
    `
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

async function handleSaveOpenclawDir(page) {
  const input = page.querySelector('[data-name="openclaw-dir"]')
  const value = (input?.value || '').trim()
  const cfg = await api.readPanelConfig()
  if (value) {
    cfg.openclawDir = value
  } else {
    delete cfg.openclawDir
  }
  await api.writePanelConfig(cfg)
  await loadOpenclawDir(page)
  await loadCliBinding(page)
  const savedMsg = value ? t('settings.customPathSaved') : t('settings.defaultRestored')
  const refreshed = await maybeRefreshGatewayServiceBinding()
  if (refreshed) {
    toast(savedMsg, 'success')
    return
  }
  await promptRestart(savedMsg)
}

async function handleResetOpenclawDir(page) {
  const cfg = await api.readPanelConfig()
  delete cfg.openclawDir
  await api.writePanelConfig(cfg)
  await loadOpenclawDir(page)
  await loadCliBinding(page)
  const refreshed = await maybeRefreshGatewayServiceBinding()
  if (refreshed) {
    toast(t('settings.defaultRestored'), 'success')
    return
  }
  await promptRestart(t('settings.defaultRestored'))
}

async function loadOpenclawSearchPaths(page) {
  const bar = page.querySelector('#openclaw-search-bar')
  if (!bar) return
  try {
    const cfg = await api.readPanelConfig()
    const value = Array.isArray(cfg?.openclawSearchPaths) ? cfg.openclawSearchPaths.join('\n') : ''
    bar.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <textarea class="form-input" data-name="openclaw-search-paths" rows="4" placeholder="${t('settings.searchPathsPlaceholder')}" style="max-width:680px;min-height:108px;resize:vertical">${escapeHtml(value)}</textarea>
        <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-action="save-openclaw-search-paths">${t('common.save')}</button>
        </div>
      </div>
      <div class="form-hint" style="margin-top:var(--space-xs)">
        ${t('settings.searchPathsHint')}
      </div>
    `
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

function parseOpenclawSearchPaths(raw) {
  const values = []
  const seen = new Set()
  for (const part of String(raw || '').split(/[\r\n;]+/)) {
    const value = part.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    values.push(value)
  }
  return values
}

async function handleSaveOpenclawSearchPaths(page) {
  const input = page.querySelector('[data-name="openclaw-search-paths"]')
  const paths = parseOpenclawSearchPaths(input?.value || '')
  const cfg = await api.readPanelConfig()
  if (paths.length > 0) {
    cfg.openclawSearchPaths = paths
  } else {
    delete cfg.openclawSearchPaths
  }
  await api.writePanelConfig(cfg)
  await loadOpenclawSearchPaths(page)
  await loadCliBinding(page)
  toast(paths.length > 0 ? t('settings.searchPathsSaved') : t('settings.searchPathsCleared'), 'success')
}

async function loadDockerDefaults(page) {
  const bar = page.querySelector('#docker-defaults-bar')
  if (!bar) return
  try {
    const cfg = await api.readPanelConfig()
    const endpoint = cfg?.dockerEndpoint || ''
    const image = cfg?.dockerDefaultImage || ''
    const currentEndpoint = effectiveDockerEndpoint(cfg)
    const currentImage = effectiveDockerImage(cfg)
    bar.innerHTML = `
      <div style="margin-bottom:var(--space-xs);display:flex;flex-direction:column;gap:4px">
        <div><span class="form-hint">${t('settings.currentDefault')}:</span> <code style="font-size:var(--font-size-xs)">${escapeHtml(currentEndpoint)}</code></div>
        <div><span class="form-hint">${t('settings.dockerDefaultImage')}:</span> <code style="font-size:var(--font-size-xs)">${escapeHtml(currentImage)}</code></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <input class="form-input" data-name="docker-endpoint" placeholder="${t('settings.dockerEndpointPlaceholder')}" value="${escapeHtml(endpoint)}" style="max-width:680px">
        <input class="form-input" data-name="docker-default-image" placeholder="${t('settings.dockerDefaultImagePlaceholder')}" value="${escapeHtml(image)}" style="max-width:680px">
        <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-action="save-docker-defaults">${t('common.save')}</button>
        </div>
      </div>
      <div class="form-hint" style="margin-top:var(--space-xs)">
        ${t('settings.dockerDefaultsHint')}
      </div>
    `
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

async function handleSaveDockerDefaults(page) {
  const endpointInput = page.querySelector('[data-name="docker-endpoint"]')
  const imageInput = page.querySelector('[data-name="docker-default-image"]')
  const endpoint = (endpointInput?.value || '').trim()
  const image = (imageInput?.value || '').trim()
  const cfg = await api.readPanelConfig()
  if (endpoint) cfg.dockerEndpoint = endpoint
  else delete cfg.dockerEndpoint
  if (image) cfg.dockerDefaultImage = image
  else delete cfg.dockerDefaultImage
  await api.writePanelConfig(cfg)
  await loadDockerDefaults(page)
  toast(t('settings.dockerDefaultsSaved'), 'success')
}

async function maybeRefreshGatewayServiceBinding() {
  if (!isMacPlatform()) return false

  const [versionInfo, dirInfo] = await Promise.all([
    api.getVersionInfo().catch(() => null),
    api.getOpenclawDir().catch(() => null),
  ])
  if (!versionInfo?.cli_path || dirInfo?.configExists === false) {
    return false
  }

  const shouldRefresh = await showConfirm(t('settings.gatewayServiceRefreshConfirm'))
  if (!shouldRefresh) return false

  toast(t('settings.gatewayServiceRefreshing'), 'info')
  try {
    const services = await api.getServicesStatus().catch(() => [])
    const gw = services?.find?.(s => s.label === 'ai.openclaw.gateway') || services?.[0] || null
    const shouldStartAgain = gw?.running === true && gw?.owned_by_current_instance !== false

    await api.uninstallGateway().catch(() => {})
    await api.installGateway()
    if (shouldStartAgain) {
      await api.startService('ai.openclaw.gateway')
    }

    toast(t('settings.gatewayServiceRefreshed'), 'success')
    return true
  } catch (e) {
    toast(`${t('settings.gatewayServiceRefreshFailed')}: ${e?.message || e}`, 'warning')
    return false
  }
}

async function promptRestart(msg) {
  if (!isTauri) { toast(msg, 'success'); return }
  const ok = await showConfirm(`${msg}\n\n${t('settings.restartConfirm')}`)
  if (ok) {
    toast(t('settings.restarting'), 'info')
    try { await api.relaunchApp() } catch { toast(t('settings.restartFailed'), 'warning') }
  } else {
    toast(`${msg}, ${t('settings.effectNextLaunch')}`, 'success')
  }
}

// ===== 事件绑定 =====

function bindEvents(page) {
  page.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const action = btn.dataset.action
    btn.disabled = true
    try {
      switch (action) {
        case 'save-proxy':
          await handleSaveProxy(page)
          break
        case 'test-proxy':
          await handleTestProxy(page)
          break
        case 'clear-proxy':
          await handleClearProxy(page)
          break
        case 'save-model-proxy':
          await handleSaveModelProxy(page)
          break
        case 'save-registry':
          await handleSaveRegistry(page)
          break
        case 'save-openclaw-dir':
          await handleSaveOpenclawDir(page)
          break
        case 'reset-openclaw-dir':
          await handleResetOpenclawDir(page)
          break
        case 'save-openclaw-search-paths':
          await handleSaveOpenclawSearchPaths(page)
          break
        case 'save-docker-defaults':
          await handleSaveDockerDefaults(page)
          break
        case 'bind-cli':
          await handleBindCli(page, btn.dataset.path)
          break
        case 'unbind-cli':
          await handleUnbindCli(page)
          break
      }
    } catch (e) {
      toast(e.toString(), 'error')
    } finally {
      btn.disabled = false
    }
  })

}

function normalizeProxyUrl(value) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(t('settings.proxyUrlInvalid'))
  }
  return url
}

async function handleTestProxy(page) {
  const resultEl = page.querySelector('#proxy-test-result')
  if (resultEl) resultEl.innerHTML = `<span style="color:var(--text-tertiary)">${t('settings.testingProxy')}</span>`
  try {
    const r = await api.testProxy()
    if (resultEl) {
      resultEl.innerHTML = r.ok
        ? `<span style="color:var(--success)">✓ ${t('settings.proxyOk', { status: r.status, ms: r.elapsed_ms, target: escapeHtml(r.target) })}</span>`
        : `<span style="color:var(--warning)">⚠ ${t('settings.proxyWarn', { status: r.status, ms: r.elapsed_ms })}</span>`
    }
  } catch (e) {
    if (resultEl) resultEl.innerHTML = `<span style="color:var(--error)">✗ ${escapeHtml(String(e))}</span>`
  }
}

async function handleSaveProxy(page) {
  const input = page.querySelector('[data-name="proxy-url"]')
  const proxyUrl = normalizeProxyUrl(input?.value || '')
  if (!proxyUrl) {
    toast(t('settings.proxyUrlEmpty'), 'error')
    return
  }
  const cfg = await api.readPanelConfig()
  if (!cfg.networkProxy || typeof cfg.networkProxy !== 'object') {
    cfg.networkProxy = {}
  }
  cfg.networkProxy.url = proxyUrl
  await api.writePanelConfig(cfg)
  toast(t('settings.proxySaved'), 'success')
  await loadProxyConfig(page)
  await loadModelProxyConfig(page)
}

async function handleClearProxy(page) {
  const cfg = await api.readPanelConfig()
  delete cfg.networkProxy
  await api.writePanelConfig(cfg)
  toast(t('settings.proxyCleared'), 'success')
  await loadProxyConfig(page)
  await loadModelProxyConfig(page)
}

async function handleSaveModelProxy(page) {
  const toggle = page.querySelector('[data-name="model-proxy-toggle"]')
  const checked = toggle?.checked || false
  const cfg = await api.readPanelConfig()
  if (!cfg.networkProxy || typeof cfg.networkProxy !== 'object') {
    cfg.networkProxy = {}
  }
  cfg.networkProxy.proxyModelRequests = checked
  await api.writePanelConfig(cfg)
  toast(checked ? t('settings.modelProxyOn') : t('settings.modelProxyOff'), 'success')
}

async function handleSaveRegistry(page) {
  const select = page.querySelector('[data-name="registry"]')
  const customInput = page.querySelector('[data-name="custom-registry"]')
  const registry = select.value === 'custom' ? customInput.value.trim() : select.value
  if (!registry) { toast(t('settings.registryEmpty'), 'error'); return }
  await api.setNpmRegistry(registry)
  toast(t('settings.registrySaved'), 'success')
}

// ===== CLI 绑定 =====

async function loadCliBinding(page) {
  const bar = page.querySelector('#cli-binding-bar')
  if (!bar) return
  try {
    const version = await api.getVersionInfo()
    const cfg = await api.readPanelConfig()
    const boundPath = cfg?.openclawCliPath || ''
    const installations = dedupeOpenclawInstallations(version.all_installations || [])
    const currentPath = version.cli_path || ''

    const sourceLabel = (src) => ({
      standalone: t('dashboard.cliSourceStandalone'),
      'npm-zh': t('dashboard.cliSourceNpmZh'),
      'npm-official': t('dashboard.cliSourceNpmOfficial'),
      'npm-global': t('dashboard.cliSourceNpmGlobal'),
    })[src] || t('dashboard.cliSourceUnknown')

    let html = `<div class="form-hint" style="margin-bottom:var(--space-sm)">${t('settings.cliBindHint')}</div>`

    if (currentPath) {
      html += `<div style="margin-bottom:var(--space-sm);font-size:var(--font-size-sm)">
        <span style="color:var(--text-secondary)">${t('settings.cliCurrent')}:</span>
        <code style="font-size:var(--font-size-xs)">${escapeHtml(currentPath)}</code>
        ${boundPath ? `<span class="clawhub-badge" style="margin-left:var(--space-xs);background:rgba(99,102,241,0.14);color:#6366f1;font-size:var(--font-size-xs)">${t('settings.cliBound')}</span>` : ''}
      </div>`
    }

    if (installations.length > 0) {
      html += '<div style="display:flex;flex-direction:column;gap:var(--space-xs)">'
      // Auto-detect option
      html += `<div style="display:flex;align-items:center;gap:var(--space-sm);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);${!boundPath ? 'background:var(--bg-active);border-color:var(--accent)' : ''}">
        <span style="flex:1;font-size:var(--font-size-sm)">${t('settings.cliAutoDetect')}</span>
        ${boundPath ? '<button class="btn btn-secondary btn-xs" data-action="unbind-cli">' + t('common.reset') + '</button>' : '<span style="color:var(--success);font-size:var(--font-size-xs)">✓ ' + t('settings.cliActive') + '</span>'}
      </div>`
      for (const inst of installations) {
        const isActive = inst.active
        const isBound = boundPath && inst.path === boundPath
        html += `<div style="display:flex;align-items:center;gap:var(--space-sm);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);${isBound ? 'background:var(--bg-active);border-color:var(--accent)' : ''}">
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--font-size-xs);font-family:var(--font-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(inst.path)}">${escapeHtml(inst.path)}</div>
            <div style="font-size:11px;color:var(--text-tertiary)">${sourceLabel(inst.source)}${inst.version ? ' · v' + inst.version : ''}</div>
          </div>
          ${isBound ? '<span style="color:var(--success);font-size:var(--font-size-xs)">✓ ' + t('settings.cliBound') + '</span>' : `<button class="btn btn-secondary btn-xs" data-action="bind-cli" data-path="${escapeHtml(inst.path)}">${t('common.confirm')}</button>`}
        </div>`
      }
      html += '</div>'
    } else {
      html += `<div style="color:var(--text-tertiary);font-size:var(--font-size-sm)">${t('common.noData')}</div>`
    }

    bar.innerHTML = html
  } catch (e) {
    bar.innerHTML = `<div style="color:var(--error)">${t('common.loadFailed')}: ${escapeHtml(String(e))}</div>`
  }
}

async function handleBindCli(page, path) {
  if (!path) return
  const ok = await showConfirm(t('settings.cliSwitchConfirm'))
  if (!ok) return
  const cfg = await api.readPanelConfig()
  cfg.openclawCliPath = path
  await api.writePanelConfig(cfg)
  toast(t('common.saveSuccess'), 'success')
  await loadCliBinding(page)
  await maybeRefreshGatewayServiceBinding()
}

async function handleUnbindCli(page) {
  const cfg = await api.readPanelConfig()
  delete cfg.openclawCliPath
  await api.writePanelConfig(cfg)
  toast(t('common.saveSuccess'), 'success')
  await loadCliBinding(page)
  await maybeRefreshGatewayServiceBinding()
}

// ===== 语言切换 =====

function loadLanguageSwitcher(page) {
  const bar = page.querySelector('#language-bar')
  if (!bar) return
  const langs = getAvailableLangs()
  const current = getLang()
  
  bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap" id="lang-select-container"></div>
    <div class="form-hint" style="margin-top:var(--space-xs)">${t('settings.languageHint')}</div>
  `
  
  const container = bar.querySelector('#lang-select-container')
  const options = langs.map(l => ({ value: l.code, label: l.label }))
  
  const select = createCustomSelect(options, {
    value: current,
    placeholder: t('settings.selectLanguage') || '选择语言',
    onchange: (val) => {
      setLang(val)
      const sidebarEl = document.getElementById('sidebar')
      if (sidebarEl) renderSidebar(sidebarEl)
      const pageEl = page.closest('.page') || page
      render().then(newPage => {
        pageEl.replaceWith(newPage)
      }).catch(() => {})
    }
  })
  
  container.appendChild(select.container)
}

// ===== 开机自启 =====

async function loadAutostart(page) {
  const bar = page.querySelector('#autostart-bar')
  if (!bar) return
  try {
    const { isEnabled, enable, disable } = await import('@tauri-apps/plugin-autostart')
    const enabled = await isEnabled()
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-sm)">
        <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-size-sm);cursor:pointer">
          <input type="checkbox" id="autostart-toggle" ${enabled ? 'checked' : ''}>
          ${t('settings.autostartToggle')}
        </label>
      </div>
      <div class="form-hint" style="margin-top:var(--space-xs)">
        ${t('settings.autostartHint')}
      </div>
    `
    bar.querySelector('#autostart-toggle')?.addEventListener('change', async (e) => {
      try {
        if (e.target.checked) {
          await enable()
          toast(t('settings.autostartEnabled'), 'success')
        } else {
          await disable()
          toast(t('settings.autostartDisabled'), 'success')
        }
      } catch (err) {
        e.target.checked = !e.target.checked
        toast(t('settings.autostartFailed') + ': ' + err, 'error')
      }
    })
  } catch {
    bar.innerHTML = `<div style="color:var(--text-tertiary);font-size:var(--font-size-sm)">${t('settings.autostartUnavailable')}</div>`
  }
}
