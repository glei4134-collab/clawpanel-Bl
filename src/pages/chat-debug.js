/**
 * 系统诊断页面
 * 全面检测 ClawPanel 各项功能状态，快速定位问题
 */
import { api, getRequestLogs, clearRequestLogs, isTauriRuntime } from '../lib/tauri-api.js'
import { wsClient } from '../lib/ws-client.js'
import { isOpenclawReady, isGatewayRunning } from '../lib/app-state.js'
import { isForeignGatewayError, showGatewayConflictGuidance } from '../lib/gateway-ownership.js'
import { icon, statusIcon } from '../lib/icons.js'
import { toast } from '../components/toast.js'
import { navigate } from '../router.js'
import { t } from '../lib/i18n.js'

export async function render() {
  const page = document.createElement('div')
  page.className = 'page'

  page.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-lg)">
      <h1 class="page-title">${t('chatDebug.title')}</h1>
      <p class="page-desc" style="margin-bottom:1em">${t('chatDebug.desc')}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-refresh">${t('chatDebug.btnRefresh')}</button>
        <button class="btn btn-secondary btn-sm" id="btn-doctor-check">${t('chatDebug.btnDiagConfig')}</button>
        <button class="btn btn-warning btn-sm" id="btn-doctor-fix">${t('chatDebug.btnAutoFix')}</button>
        <button class="btn btn-secondary btn-sm" id="btn-test-ws">${t('chatDebug.btnTestWs')}</button>
        <button class="btn btn-secondary btn-sm" id="btn-network-log">${t('chatDebug.btnNetworkLog')}</button>
        <button class="btn btn-secondary btn-sm" id="btn-fix-pairing">${t('chatDebug.btnFixPairing')}</button>
      </div>
    </div>
    <div id="debug-content">
      <div class="config-section" style="border-left:3px solid var(--border)">
        <div style="display:flex;gap:var(--space-sm);align-items:center">
          <div class="loading-placeholder" style="width:24px;height:24px;border-radius:50%"></div>
          <div class="loading-placeholder" style="width:120px;height:20px;border-radius:4px"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:var(--space-md)">
        <div class="config-section"><div class="config-section-title" style="margin-bottom:8px">${t('chatDebug.sectionAppState')}</div><div class="loading-placeholder" style="height:48px;border-radius:4px"></div></div>
        <div class="config-section"><div class="config-section-title" style="margin-bottom:8px">${t('chatDebug.sectionWs')}</div><div class="loading-placeholder" style="height:48px;border-radius:4px"></div></div>
        <div class="config-section"><div class="config-section-title" style="margin-bottom:8px">${t('chatDebug.sectionNode')}</div><div class="loading-placeholder" style="height:48px;border-radius:4px"></div></div>
        <div class="config-section"><div class="config-section-title" style="margin-bottom:8px">${t('chatDebug.sectionVersion')}</div><div class="loading-placeholder" style="height:48px;border-radius:4px"></div></div>
      </div>
    </div>
    <div id="doctor-output" style="display:none;margin-top:var(--space-md)">
      <div class="config-section">
        <div class="config-section-title">${t('chatDebug.sectionDoctorOutput')}</div>
        <pre style="background:var(--bg-secondary);border-radius:var(--radius);padding:var(--space-sm);font-size:var(--font-size-xs);max-height:300px;overflow:auto;white-space:pre-wrap;word-break:break-all"></pre>
      </div>
    </div>
    <div id="ws-test-log" style="display:none;margin-top:16px;background:var(--bg-secondary);border-radius:6px;padding:12px">
      <div style="font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <span>${t('chatDebug.wsTestTitle')}</span>
        <button class="btn btn-sm" id="btn-clear-log" style="padding:4px 8px;font-size:11px">${t('chatDebug.btnClear')}</button>
      </div>
      <pre id="ws-log-content" style="font-size:11px;line-height:1.5;max-height:400px;overflow:auto;margin:0;color:var(--text-primary)"></pre>
    </div>
    <div id="network-log" style="display:none;margin-top:16px;background:var(--bg-secondary);border-radius:6px;padding:12px">
      <div style="font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <span>${t('chatDebug.networkLogTitle')}</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" id="btn-refresh-network" style="padding:4px 8px;font-size:11px">${t('common.refresh')}</button>
          <button class="btn btn-sm" id="btn-clear-network" style="padding:4px 8px;font-size:11px">${t('chatDebug.btnClear')}</button>
        </div>
      </div>
      <div id="network-log-content" style="font-size:11px;line-height:1.5;max-height:400px;overflow:auto"></div>
    </div>
  `

  page.querySelector('#btn-refresh').addEventListener('click', () => loadDebugInfo(page))
  page.querySelector('#btn-test-ws').addEventListener('click', () => testWebSocket(page))
  page.querySelector('#btn-network-log').addEventListener('click', () => toggleNetworkLog(page))
  page.querySelector('#btn-fix-pairing').addEventListener('click', () => fixPairing(page))
  page.querySelector('#btn-doctor-check').addEventListener('click', () => handleDoctor(page, false))
  page.querySelector('#btn-doctor-fix').addEventListener('click', () => handleDoctor(page, true))
  loadDebugInfo(page)
  return page
}

async function openGatewayConflict(error = null) {
  const services = await api.getServicesStatus().catch(() => [])
  const gw = services?.find?.(s => s.label === 'ai.openclaw.gateway') || services?.[0] || null
  await showGatewayConflictGuidance({ error, service: gw })
}

async function loadDebugInfo(page) {
  const el = page.querySelector('#debug-content')

  const info = {
    timestamp: new Date().toLocaleString('zh-CN'),
    // 应用状态
    appState: {
      openclawReady: isOpenclawReady(),
      gatewayRunning: isGatewayRunning(),
    },
    // WebSocket 状态
    wsClient: {
      connected: wsClient.connected,
      gatewayReady: wsClient.gatewayReady,
      sessionKey: wsClient.sessionKey,
    },
    // 配置文件
    config: null,
    configError: null,
    // 服务状态
    services: null,
    servicesError: null,
    // 版本信息
    version: null,
    versionError: null,
    // Node.js 环境
    node: null,
    nodeError: null,
    // 设备密钥
    connectFrame: null,
    connectFrameError: null,
  }

  // 并行检测所有项目
  await Promise.allSettled([
    // 配置文件
    api.readOpenclawConfig().then(r => { info.config = r }).catch(e => { info.configError = String(e) }),
    // 服务状态
    api.getServicesStatus().then(r => { info.services = r }).catch(e => { info.servicesError = String(e) }),
    // 版本信息
    api.getVersionInfo().then(r => { info.version = r }).catch(e => { info.versionError = String(e) }),
    // Node.js
    api.checkNode().then(r => { info.node = r }).catch(e => { info.nodeError = String(e) }),
  ])

  // 设备密钥检测（需要等配置加载完成）
  try {
    const rawToken = info.config?.gateway?.auth?.token
    const token = (typeof rawToken === 'string') ? rawToken : ''
    info.connectFrame = await api.createConnectFrame('test-nonce', token)
  } catch (e) {
    info.connectFrameError = String(e)
  }

  // 移除 loading 状态并渲染结果
  renderDebugInfo(el, info)
}

function renderDebugInfo(el, info) {
  let html = `<div style="font-family:monospace;font-size:12px;line-height:1.6">`

  // 总体状态概览
  const allOk = info.appState.openclawReady && info.appState.gatewayRunning && info.wsClient.gatewayReady
  html += `<div class="config-section" style="background:${allOk ? 'var(--success-bg)' : 'var(--warning-bg)'};border-left:3px solid ${allOk ? 'var(--success)' : 'var(--warning)'}">
    <div style="font-size:16px;font-weight:600;margin-bottom:8px">${allOk ? `${statusIcon('ok')} ${t('chatDebug.systemOk')}` : `${statusIcon('warn')} ${t('chatDebug.issuesFound')}`}</div>
    <div style="color:var(--text-secondary);font-size:13px">${allOk ? t('chatDebug.allFunctionsOk') : t('chatDebug.someFunctionsError')}</div>
  </div>`

  // 应用状态
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionAppState')}</div>
    <table class="debug-table">
      <tr><td>${t('chatDebug.openclawReady')}</td><td>${info.appState.openclawReady ? statusIcon('ok') : statusIcon('err')}</td></tr>
      <tr><td>${t('chatDebug.gatewayRunning')}</td><td>${info.appState.gatewayRunning ? statusIcon('ok') : statusIcon('err')}</td></tr>
    </table>
  </div>`

  // WebSocket 状态
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionWs')}</div>
    <table class="debug-table">
      <tr><td>${t('chatDebug.connStatus')}</td><td>${info.wsClient.connected ? `${statusIcon('ok')} ${t('chatDebug.connected')}` : `${statusIcon('err')} ${t('chatDebug.notConnected')}`}</td></tr>
      <tr><td>${t('chatDebug.handshakeStatus')}</td><td>${info.wsClient.gatewayReady ? `${statusIcon('ok')} ${t('chatDebug.completed')}` : `${statusIcon('err')} ${t('chatDebug.notCompleted')}`}</td></tr>
      <tr><td>${t('chatDebug.sessionKey')}</td><td>${info.wsClient.sessionKey || t('chatDebug.empty')}</td></tr>
    </table>
  </div>`

  // Node.js 环境
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionNode')}</div>`
  if (info.nodeError) {
    html += `<div style="color:var(--error)">${statusIcon('err')} ${escapeHtml(info.nodeError)}</div>`
  } else if (info.node) {
    html += `<table class="debug-table">
      <tr><td>${t('chatDebug.installStatus')}</td><td>${info.node.installed ? `${statusIcon('ok')} ${t('chatDebug.installed')}` : `${statusIcon('err')} ${t('chatDebug.notInstalled')}`}</td></tr>
      <tr><td>${t('chatDebug.version')}</td><td>${info.node.version || t('chatDebug.unknownLabel')}</td></tr>
    </table>`
  }
  html += `</div>`

  // 版本信息
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionVersion')}</div>`
  if (info.versionError) {
    html += `<div style="color:var(--error)">${statusIcon('err')} ${escapeHtml(info.versionError)}</div>`
  } else if (info.version) {
    html += `<table class="debug-table">
      <tr><td>${t('chatDebug.currentVersion')}</td><td>${info.version.current || t('chatDebug.unknownLabel')}</td></tr>
      <tr><td>${t('chatDebug.recommendedVersion')}</td><td>${info.version.recommended || t('chatDebug.notDetected')}</td></tr>
      <tr><td>${t('chatDebug.panelVersion')}</td><td>${info.version.panel_version || t('chatDebug.unknownLabel')}</td></tr>
      <tr><td>${t('chatDebug.latestUpstream')}</td><td>${info.version.latest || t('chatDebug.notDetected')}</td></tr>
      <tr><td>${t('chatDebug.deviationFromRecommended')}</td><td>${info.version.ahead_of_recommended ? `${statusIcon('warn')} ${t('chatDebug.versionTooHigh')}` : info.version.is_recommended ? `${statusIcon('ok')} ${t('chatDebug.versionAligned')}` : `${statusIcon('warn')} ${t('chatDebug.versionNeedSwitch')}`}</td></tr>
      <tr><td>${t('chatDebug.latestAvailable')}</td><td>${info.version.latest_update_available ? `${statusIcon('warn')} ${t('chatDebug.hasUpdate')}` : `${statusIcon('ok')} ${t('chatDebug.noUpdate')}`}</td></tr>
    </table>`
  }
  html += `</div>`

  // 配置文件
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionConfig')}</div>`
  if (info.configError) {
    html += `<div style="color:var(--error)">${statusIcon('err')} ${escapeHtml(info.configError)}</div>`
  } else if (info.config) {
    const gw = info.config.gateway || {}
    html += `<table class="debug-table">
      <tr><td>gateway.port</td><td>${gw.port || t('chatDebug.notSet')}</td></tr>
      <tr><td>gateway.auth.token</td><td>${gw.auth?.token ? `${statusIcon('ok')} ${t('chatDebug.set')}${typeof gw.auth.token === 'object' ? ' (SecretRef)' : ''}` : `${statusIcon('warn')} ${t('chatDebug.notSet')}`}</td></tr>
      <tr><td>gateway.enabled</td><td>${gw.enabled !== false ? statusIcon('ok') : statusIcon('err')}</td></tr>
      <tr><td>gateway.mode</td><td>${gw.mode || 'local'}</td></tr>
    </table>`
  }
  html += `</div>`

  // 服务状态
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionService')}</div>`
  if (info.servicesError) {
    html += `<div style="color:var(--error)">${statusIcon('err')} ${escapeHtml(info.servicesError)}</div>`
  } else if (info.services?.length > 0) {
    const svc = info.services[0]
    html += `<table class="debug-table">
      <tr><td>${t('chatDebug.cliInstall')}</td><td>${svc.cli_installed !== false ? `${statusIcon('ok')} ${t('chatDebug.installed')}` : `${statusIcon('err')} ${t('chatDebug.notInstalled')}`}</td></tr>
      <tr><td>${t('chatDebug.runStatus')}</td><td>${svc.running ? `${statusIcon('ok')} ${t('chatDebug.running')}` : `${statusIcon('err')} ${t('chatDebug.stopped')}`}</td></tr>
      <tr><td>${t('chatDebug.processPid')}</td><td>${svc.pid || t('chatDebug.none')}</td></tr>
      <tr><td>${t('chatDebug.serviceLabel')}</td><td>${svc.label || t('chatDebug.unknownLabel')}</td></tr>
    </table>`
  }
  html += `</div>`

  // 设备密钥
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionDevice')}</div>`
  if (info.connectFrameError) {
    html += `<div style="color:var(--error)">${statusIcon('err')} ${escapeHtml(info.connectFrameError)}</div>`
  } else if (info.connectFrame) {
    const device = info.connectFrame.params?.device
    html += `<div style="color:var(--success);margin-bottom:8px">${statusIcon('ok')} ${t('chatDebug.deviceKeySuccess')}</div>
    <table class="debug-table">
      <tr><td>${t('chatDebug.deviceId')}</td><td style="font-size:10px;word-break:break-all">${device?.id || t('chatDebug.none')}</td></tr>
      <tr><td>${t('chatDebug.publicKey')}</td><td style="font-size:10px;word-break:break-all">${device?.publicKey ? device.publicKey.substring(0, 32) + '...' : t('chatDebug.none')}</td></tr>
      <tr><td>${t('chatDebug.signTime')}</td><td>${device?.signedAt || t('chatDebug.none')}</td></tr>
    </table>
    <details style="margin-top:8px">
      <summary style="cursor:pointer;color:var(--text-secondary);font-size:12px">${t('chatDebug.viewConnectFrame')}</summary>
      <pre style="background:var(--bg-secondary);padding:8px;border-radius:4px;overflow:auto;max-height:300px;font-size:11px">${escapeHtml(JSON.stringify(info.connectFrame, null, 2))}</pre>
    </details>`
  }
  html += `</div>`

  // 诊断建议
  html += `<div class="config-section">
    <div class="config-section-title">${t('chatDebug.sectionDiagnosis')}</div>
    <ul style="margin:0;padding-left:20px;color:var(--text-secondary);font-size:13px">`

  if (!info.node?.installed) {
    html += `<li style="color:var(--error);margin-bottom:6px">${statusIcon('err')} ${t('chatDebug.diagNodeNotInstalled')}</li>`
  }
  if (info.configError) {
    html += `<li style="color:var(--error);margin-bottom:6px">${statusIcon('err')} ${t('chatDebug.diagConfigMissing')}</li>`
  }
  if (info.servicesError || !info.services?.length || info.services[0]?.cli_installed === false) {
    html += `<li style="color:var(--error);margin-bottom:6px">${statusIcon('err')} ${t('chatDebug.diagCliNotInstalled')}</li>`
  }
  if (info.services?.length > 0 && !info.services[0]?.running) {
    html += `<li style="color:var(--warning);margin-bottom:6px">${statusIcon('warn')} ${t('chatDebug.diagGatewayNotRunning')}</li>`
  }
  if (info.config && !info.config.gateway?.auth?.token) {
    html += `<li style="color:var(--warning);margin-bottom:6px">${statusIcon('warn')} ${t('chatDebug.diagTokenNotSet')}</li>`
  } else if (info.config && typeof info.config.gateway?.auth?.token === 'object') {
    html += `<li style="margin-bottom:6px">${statusIcon('ok')} ${t('chatDebug.diagTokenSecretRef')}</li>`
  }
  if (info.connectFrameError) {
    html += `<li style="color:var(--error);margin-bottom:6px">${statusIcon('err')} ${t('chatDebug.diagDeviceKeyFailed')}</li>`
  }
  if (!info.wsClient.connected && info.services?.length > 0 && info.services[0]?.running) {
    html += `<li style="color:var(--warning);margin-bottom:6px">${statusIcon('warn')} ${t('chatDebug.diagWsNotConnected', { port: info.config?.gateway?.port || 18789 })}</li>`
  }
  if (info.wsClient.connected && !info.wsClient.gatewayReady) {
    html += `<li style="color:var(--warning);margin-bottom:6px">${statusIcon('warn')} ${t('chatDebug.diagWsHandshakeFailed')}</li>`
  }
  if (allOk) {
    html += `<li style="color:var(--success);margin-bottom:6px">${statusIcon('ok')} ${t('chatDebug.diagAllOk')}</li>`
  }

  html += `</ul></div>`
  html += `<div style="margin-top:16px;padding:8px;background:var(--bg-secondary);border-radius:4px;font-size:11px;color:var(--text-tertiary)">${t('chatDebug.checkTime', { time: info.timestamp })}</div>`
  html += `</div>`

  el.innerHTML = html
}

// 配置诊断 / 自动修复（openclaw doctor）
async function handleDoctor(page, fix) {
  const btnCheck = page.querySelector('#btn-doctor-check')
  const btnFix = page.querySelector('#btn-doctor-fix')
  const outputDiv = page.querySelector('#doctor-output')
  const section = outputDiv?.querySelector('.config-section')
  const pre = outputDiv?.querySelector('pre')
  if (!outputDiv || !pre) return

  // 清除之前的提示
  section?.querySelectorAll('.doctor-tip').forEach(el => el.remove())

  if (btnCheck) btnCheck.disabled = true
  if (btnFix) btnFix.disabled = true
  if (fix && btnFix) btnFix.textContent = t('chatDebug.fixing')
  if (!fix && btnCheck) btnCheck.textContent = t('chatDebug.diagnosing')

  outputDiv.style.display = 'block'
  pre.textContent = fix ? t('chatDebug.runningDoctorFix') : t('chatDebug.runningDoctor')
  pre.style.color = 'var(--text-secondary)'

  try {
    const result = fix ? await api.doctorFix() : await api.doctorCheck()
    let text = result.output || ''
    if (result.errors) text += '\n' + result.errors
    const fullText = text.trim()
    pre.textContent = fullText || (result.success ? t('chatDebug.noIssues') : t('chatDebug.diagDone'))
    pre.style.color = result.success ? 'var(--success)' : 'var(--warning)'
    if (fullText.includes('ERR_MODULE_NOT_FOUND') || fullText.includes('Cannot find module')) {
      appendDoctorTip(section, t('chatDebug.installCorrupt'), t('chatDebug.installCorruptHint'))
      toast(t('chatDebug.installCorruptToast'), 'warning')
    } else if (fix && result.success) {
      toast(t('chatDebug.configFixDone'), 'success')
    } else if (fix) {
      toast(t('chatDebug.configFixPartial'), 'warning')
    }
  } catch (e) {
    const errMsg = e?.message || String(e)
    pre.textContent = t('chatDebug.execFailed') + errMsg
    pre.style.color = 'var(--error)'
    if (errMsg.includes('ERR_MODULE_NOT_FOUND') || errMsg.includes('Cannot find module') || errMsg.includes('未找到')) {
      appendDoctorTip(section, t('chatDebug.cliUnavailable'), t('chatDebug.cliUnavailableHint'))
    }
    toast(t('chatDebug.execFailed') + e, 'error')
  } finally {
    if (btnCheck) { btnCheck.disabled = false; btnCheck.textContent = t('chatDebug.btnDiagConfig') }
    if (btnFix) { btnFix.disabled = false; btnFix.textContent = t('chatDebug.btnAutoFix') }
  }
}

function appendDoctorTip(parent, title, body) {
  if (!parent) return
  const tip = document.createElement('div')
  tip.className = 'doctor-tip'
  tip.style.cssText = 'margin-top:var(--space-sm);padding:var(--space-sm);background:rgba(239,68,68,0.08);border-radius:var(--radius);font-size:var(--font-size-sm);color:var(--error);line-height:1.6'
  tip.innerHTML = `<strong>⚠ ${title}</strong><br>${body}`
  tip.querySelector('[data-nav="about"]')?.addEventListener('click', (e) => {
    e.preventDefault()
    navigate('/about')
  })
  parent.appendChild(tip)
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// WebSocket 连接测试
let testWs = null
let testLogs = []

function testWebSocket(page) {
  const logEl = page.querySelector('#ws-test-log')
  const contentEl = page.querySelector('#ws-log-content')
  const clearBtn = page.querySelector('#btn-clear-log')

  logEl.style.display = 'block'
  testLogs = []

  clearBtn.onclick = () => {
    testLogs = []
    contentEl.innerHTML = ''
  }

  addLog(`${icon('search', 14)} ${t('chatDebug.wsTestStart')}`)

  // 关闭旧连接
  if (testWs) {
    testWs.close()
    testWs = null
  }

  // 读取配置
  api.readOpenclawConfig().then(config => {
    const port = config?.gateway?.port || 18789
    const rawToken = config?.gateway?.auth?.token
    const token = (typeof rawToken === 'string') ? rawToken : ''
    const wsHost = isTauriRuntime() ? `127.0.0.1:${port}` : location.host
    const url = `ws://${wsHost}/ws?token=${encodeURIComponent(token)}`

    addLog(`${icon('radio', 14)} ${t('chatDebug.wsAddress', { url })}`)
    addLog(`${icon('key', 14)} ${t('chatDebug.wsToken', { token: token ? token.substring(0, 20) + '...' : t('chatDebug.empty') })}`)
    addLog(`${icon('clock', 14)} ${t('chatDebug.wsConnecting')}`)

    try {
      testWs = new WebSocket(url)

      testWs.onopen = () => {
        addLog(`${statusIcon('ok', 14)} ${t('chatDebug.wsConnected')}`)
        addLog(`${icon('clock', 14)} ${t('chatDebug.wsWaitChallenge')}`)
      }

      testWs.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          addLog(`${icon('inbox', 14)} ${t('chatDebug.wsReceivedMsg')}: ${escapeHtml(JSON.stringify(msg, null, 2))}`)

          // 如果收到 challenge，尝试发送 connect frame
          if (msg.type === 'event' && msg.event === 'connect.challenge') {
            const nonce = msg.payload?.nonce || ''
            addLog(`${icon('lock', 14)} ${t('chatDebug.wsReceivedChallenge')}: ${nonce}`)
            addLog(`${icon('clock', 14)} ${t('chatDebug.wsGeneratingFrame')}`)

            api.createConnectFrame(nonce, token).then(frame => {
              addLog(`${statusIcon('ok', 14)} ${t('chatDebug.wsFrameGenerated')}`)
              addLog(`${icon('send', 14)} ${t('chatDebug.wsSendingFrame')}: ${escapeHtml(JSON.stringify(frame, null, 2))}`)
              testWs.send(JSON.stringify(frame))
            }).catch(e => {
              addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsFrameFailed')}: ${e}`)
            })
          }

          // 如果收到 connect 响应
          if (msg.type === 'res' && msg.id?.startsWith('connect-')) {
            if (msg.ok) {
              addLog(`${statusIcon('ok', 14)} ${t('chatDebug.wsHandshakeOk')}`)
              addLog(`${icon('bar-chart', 14)} Snapshot: ${escapeHtml(JSON.stringify(msg.payload, null, 2))}`)
              const sessionKey = msg.payload?.snapshot?.sessionDefaults?.mainSessionKey
              if (sessionKey) {
                addLog(`${icon('key', 14)} Session Key: ${sessionKey}`)
              }
            } else {
              addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsHandshakeFailed')}: ${msg.error?.message || msg.error?.code || t('common.unknown')}`)
            }
          }
        } catch (e) {
          addLog(`${statusIcon('warn', 14)} ${t('chatDebug.wsParseFailed')}: ${e}`)
          addLog(`${icon('inbox', 14)} ${t('chatDebug.wsRawData')}: ${escapeHtml(evt.data)}`)
        }
      }

      testWs.onerror = (e) => {
        addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsError')}: ${e.type}`)
      }

      testWs.onclose = (e) => {
        addLog(`${icon('plug', 14)} ${t('chatDebug.wsClosed')} - Code: ${e.code}, Reason: ${e.reason || t('chatDebug.empty')}`)
        if (e.code === 1008) {
          addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsOriginRejected')}`)
          addLog(`${icon('lightbulb', 14)} ${t('chatDebug.wsOriginFix')}`)
        } else if (e.code === 4001) {
          addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsAuthFailed')}`)
        } else if (e.code === 1006) {
          addLog(`${statusIcon('warn', 14)} ${t('chatDebug.wsAbnormalClose')}`)
        }
        testWs = null
      }

    } catch (e) {
      addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsCreateFailed')}: ${e}`)
    }
  }).catch(e => {
    addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsConfigReadFailed')}: ${e}`)
  })

  function addLog(msg) {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    const div = document.createElement('div')
    div.style.cssText = 'display:flex;gap:4px;align-items:flex-start;padding:1px 0;white-space:pre-wrap;word-break:break-all'
    div.innerHTML = `<span style="color:var(--text-tertiary);flex-shrink:0">[${timestamp}]</span> ${msg}`
    testLogs.push(div.textContent)
    contentEl.appendChild(div)
    contentEl.scrollTop = contentEl.scrollHeight
  }
}

// 网络日志功能
function toggleNetworkLog(page) {
  const logEl = page.querySelector('#network-log')
  const contentEl = page.querySelector('#network-log-content')
  const refreshBtn = page.querySelector('#btn-refresh-network')
  const clearBtn = page.querySelector('#btn-clear-network')

  if (logEl.style.display === 'none') {
    logEl.style.display = 'block'
    renderNetworkLog(contentEl)
  } else {
    logEl.style.display = 'none'
  }

  refreshBtn.onclick = () => renderNetworkLog(contentEl)
  clearBtn.onclick = () => {
    clearRequestLogs()
    renderNetworkLog(contentEl)
  }
}

function renderNetworkLog(contentEl) {
  const logs = getRequestLogs()

  if (logs.length === 0) {
    contentEl.innerHTML = `<div style="color:var(--text-secondary);padding:8px">${t('chatDebug.noRequests')}</div>`
    return
  }

  // 统计信息
  const total = logs.length
  const cached = logs.filter(l => l.cached).length
  const avgDuration = logs.filter(l => !l.cached).reduce((sum, l) => {
    const ms = parseInt(l.duration)
    return sum + (isNaN(ms) ? 0 : ms)
  }, 0) / (total - cached || 1)

  let html = `
    <div style="padding:8px;background:var(--bg-primary);border-radius:4px;margin-bottom:8px;font-size:12px">
      <div style="display:flex;gap:16px">
        <span>${t('chatDebug.totalRequests')}: <strong>${total}</strong></span>
        <span>${t('chatDebug.cacheHit')}: <strong>${cached}</strong></span>
        <span>${t('chatDebug.avgDuration')}: <strong>${avgDuration.toFixed(0)}ms</strong></span>
      </div>
    </div>
    <table class="debug-table" style="width:100%;font-size:11px">
      <thead>
        <tr style="background:var(--bg-primary)">
          <th style="padding:6px;text-align:left;width:80px">${t('chatDebug.colTime')}</th>
          <th style="padding:6px;text-align:left">${t('chatDebug.colCommand')}</th>
          <th style="padding:6px;text-align:left;max-width:200px">${t('chatDebug.colArgs')}</th>
          <th style="padding:6px;text-align:right;width:80px">${t('chatDebug.colDuration')}</th>
          <th style="padding:6px;text-align:center;width:60px">${t('chatDebug.colCache')}</th>
        </tr>
      </thead>
      <tbody>
  `

  // 倒序显示（最新的在上面）
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i]
    const cachedIcon = log.cached ? statusIcon('ok', 12) : '-'
    const durationColor = log.cached ? 'var(--text-tertiary)' :
                          (parseInt(log.duration) > 1000 ? 'var(--error)' :
                          (parseInt(log.duration) > 500 ? 'var(--warning)' : 'var(--text-primary)'))

    html += `
      <tr>
        <td style="padding:4px;color:var(--text-tertiary)">${log.time}</td>
        <td style="padding:4px;font-family:monospace">${escapeHtml(log.cmd)}</td>
        <td style="padding:4px;font-family:monospace;font-size:10px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(log.args)}">${escapeHtml(log.args)}</td>
        <td style="padding:4px;text-align:right;color:${durationColor}">${log.duration}</td>
        <td style="padding:4px;text-align:center">${cachedIcon}</td>
      </tr>
    `
  }

  html += `</tbody></table>`
  contentEl.innerHTML = html
}

// 一键修复配对问题
async function fixPairing(page) {
  const logEl = page.querySelector('#ws-test-log')
  const contentEl = page.querySelector('#ws-log-content')
  const fixBtn = page.querySelector('#btn-fix-pairing')

  if (fixBtn) { fixBtn.disabled = true; fixBtn.textContent = t('chatDebug.fixing') }
  logEl.style.display = 'block'
  testLogs = []
  logEl.scrollIntoView({ behavior: 'smooth', block: 'start' })

  function addLog(msg) {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    const line = `[${timestamp}] ${msg}`
    testLogs.push(line)
    contentEl.textContent = testLogs.join('\n')
    contentEl.scrollTop = contentEl.scrollHeight
  }

  try {
    addLog(`${icon('wrench', 14)} ${t('chatDebug.fixStarting')}`)

    // 1. 写入 paired.json + controlUi.allowedOrigins
    addLog(`${icon('edit', 14)} ${t('chatDebug.fixWritingPair')}`)
    const result = await api.autoPairDevice()
    addLog(`${statusIcon('ok', 14)} ${result}`)
    addLog(`${statusIcon('ok', 14)} ${t('chatDebug.fixOriginAdded')}`)

    // 2. 停止 Gateway（确保旧进程完全退出，新进程能重新读取配置）
    addLog(`${icon('zap', 14)} ${t('chatDebug.fixStoppingGw')}`)
    try {
      await api.stopService('ai.openclaw.gateway')
    } catch (e) {
      if (isForeignGatewayError(e)) {
        await openGatewayConflict(e)
        throw e
      }
    }
    addLog(`${icon('clock', 14)} ${t('chatDebug.fixWaitExit')}`)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 3. 启动 Gateway（重新加载 openclaw.json 配置）
    addLog(`${icon('zap', 14)} ${t('chatDebug.fixStartingGw')}`)
    try {
      await api.startService('ai.openclaw.gateway')
    } catch (e) {
      if (isForeignGatewayError(e)) {
        await openGatewayConflict(e)
      }
      throw e
    }
    addLog(`${statusIcon('ok', 14)} ${t('chatDebug.fixGwStartSent')}`)

    // 4. 等待 Gateway 就绪
    addLog(`${icon('clock', 14)} ${t('chatDebug.fixWaitReady')}`)
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 5. 检查 Gateway 状态
    addLog(`${icon('search', 14)} ${t('chatDebug.fixCheckStatus')}`)
    const services = await api.getServicesStatus()
    const running = services?.[0]?.running

    if (running) {
      addLog(`${statusIcon('ok', 14)} ${t('chatDebug.fixGwStarted')}`)
    } else {
      addLog(`${statusIcon('warn', 14)} ${t('chatDebug.fixGwMaybeStarting')}`)
    }

    // 6. 测试 WebSocket 连接
    addLog(`${icon('plug', 14)} ${t('chatDebug.fixTestingWs')}`)
    const config = await api.readOpenclawConfig()
    const port = config?.gateway?.port || 18789
    const rawToken = config?.gateway?.auth?.token
    const token = (typeof rawToken === 'string') ? rawToken : ''
    const wsHost = isTauriRuntime() ? `127.0.0.1:${port}` : location.host
    const url = `ws://${wsHost}/ws?token=${encodeURIComponent(token)}`

    const ws = new WebSocket(url)

    ws.onopen = () => {
      addLog(`${statusIcon('ok', 14)} ${t('chatDebug.wsConnected')}`)
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          addLog(`${statusIcon('ok', 14)} ${t('chatDebug.fixReceivedChallenge')}`)
          const nonce = msg.payload?.nonce || ''

          api.createConnectFrame(nonce, token).then(frame => {
            ws.send(JSON.stringify(frame))
            addLog(`${icon('send', 14)} ${t('chatDebug.fixFrameSent')}`)
          })
        }

        if (msg.type === 'res' && msg.id?.startsWith('connect-')) {
          if (msg.ok) {
            addLog(`${statusIcon('ok', 14)} ${t('chatDebug.fixPairSuccess')}`)
            addLog(`${icon('lightbulb', 14)} ${t('chatDebug.fixReconnecting')}`)
            ws.close(1000)
            // 触发主应用的 wsClient 重连，让主界面正常工作
            wsClient.reconnect()
            setTimeout(() => loadDebugInfo(page), 2000)
          } else {
            const errMsg = msg.error?.message || msg.error?.code || t('common.unknown')
            addLog(`${statusIcon('err', 14)} ${t('chatDebug.wsHandshakeFailed')}: ${errMsg}`)
            if (errMsg.includes('origin not allowed')) {
              addLog(`${icon('lightbulb', 14)} ${t('chatDebug.fixOriginStillRejected')}`)
            } else {
              addLog(`${icon('lightbulb', 14)} ${t('chatDebug.fixSuggestManualRestart')}`)
            }
          }
        }
      } catch (e) {
        addLog(`${statusIcon('warn', 14)} ${t('chatDebug.wsParseFailed')}: ${e}`)
      }
    }

    ws.onerror = () => {
      addLog(`${statusIcon('err', 14)} ${t('chatDebug.fixWsConnFailed')}`)
    }

    ws.onclose = (e) => {
      if (e.code === 1008) {
        addLog(`${statusIcon('warn', 14)} ${t('chatDebug.fixOriginRejected1008')}`)
        addLog(`${icon('lightbulb', 14)} ${t('chatDebug.fixRetryHint')}`)
      } else if (e.code !== 1000) {
        addLog(`${statusIcon('warn', 14)} ${t('chatDebug.wsClosed')} - Code: ${e.code}`)
      }
    }

  } catch (e) {
    addLog(`${statusIcon('err', 14)} ${t('chatDebug.fixFailed')}: ${e}`)
    addLog(`${icon('lightbulb', 14)} ${t('chatDebug.fixSuggestManualRestart')}`)
  } finally {
    if (fixBtn) { fixBtn.disabled = false; fixBtn.textContent = t('chatDebug.btnFixPairing') }
  }
}
