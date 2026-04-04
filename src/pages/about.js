/**
 * 关于页面
 * 版本信息、系统环境
 */
import { api } from '../lib/tauri-api.js'
import { toast } from '../components/toast.js'
import { showUpgradeModal, showConfirm } from '../components/modal.js'
import { setUpgrading } from '../lib/app-state.js'
import { icon, statusIcon } from '../lib/icons.js'
import { t, getLang } from '../lib/i18n.js'

export async function render() {
  const page = document.createElement('div')
  page.className = 'page'

  page.innerHTML = `
    <div class="page-header" style="display:flex;align-items:center;gap:16px">
      <div class="app-logo" style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#fff;box-shadow:0 4px 12px rgba(102,126,234,0.4)">G</div>
      <div>
        <h1 class="page-title" style="margin:0">Gl</h1>
        <p class="page-desc" style="margin:0">OpenClaw Management Panel</p>
      </div>
    </div>
    <div class="stat-cards" id="version-cards">
      <div class="stat-card loading-placeholder"></div>
      <div class="stat-card loading-placeholder"></div>
      <div class="stat-card loading-placeholder"></div>
    </div>
    <div class="config-section" style="color:var(--text-tertiary);font-size:var(--font-size-xs)">
      <p>基于 Tauri v2 构建 · Vanilla JS + Vite · Rust 后端</p>
      <p style="margin-top:8px">MIT License</p>
    </div>
  `

  loadData(page)
  return page
}

async function loadData(page) {
  const cards = page.querySelector('#version-cards')
  try {
    const [version, install] = await Promise.all([
      api.getVersionInfo(),
      api.checkInstallation(),
    ])

    // 尝试从 Tauri API 获取 ClawPanel 自身版本号，失败则 fallback
    let panelVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'
    try {
      const { getVersion } = await import('@tauri-apps/api/app')
      panelVersion = await getVersion()
    } catch {
      // 非 Tauri 环境或 API 不可用，使用构建时注入的版本号
    }

    // 异步检查前端热更新
    let panelUpdateHtml = `<span style="color:var(--text-tertiary)">${t('about.checkingUpdate')}</span>`
    checkHotUpdate(cards, panelVersion)

    const isInstalled = !!version.current
    const sourceLabel = version.source === 'official' ? t('about.official') : version.source === 'chinese' ? t('about.chinese') : t('about.unknownSource')
    const btnSm = 'padding:2px 8px;font-size:var(--font-size-xs)'
    const hasRecommended = !!version.recommended
    const aheadOfRecommended = isInstalled && hasRecommended && !!version.ahead_of_recommended
    const driftFromRecommended = isInstalled && hasRecommended && !version.is_recommended && !aheadOfRecommended
    const policyRiskHint = aheadOfRecommended
      ? t('about.policyAhead', { current: version.current, recommended: version.recommended })
      : t('about.policyDefault')

    cards.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">ClawPanel</span></div>
        <div class="stat-card-value">${panelVersion}</div>
        <div class="stat-card-meta" id="panel-update-meta" style="display:flex;align-items:center;gap:8px">${panelUpdateHtml}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">OpenClaw · ${sourceLabel}</span></div>
        <div class="stat-card-value">${version.current || t('about.notInstalled')}</div>
        <div class="stat-card-meta" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${isInstalled && hasRecommended
            ? (aheadOfRecommended
              ? `<span style="color:var(--warning,#f59e0b)">${t('about.aheadOfRecommended', { ver: version.recommended })}</span>
                 <button class="btn btn-primary btn-sm" id="btn-apply-recommended" style="${btnSm}">${t('about.rollbackToRecommended')}</button>`
              : driftFromRecommended
              ? `<span style="color:var(--accent)">${t('about.recommendedStable', { ver: version.recommended })}</span>
                 <button class="btn btn-primary btn-sm" id="btn-apply-recommended" style="${btnSm}">${t('about.switchToRecommended')}</button>`
              : `<span style="color:var(--success)">${t('about.isRecommended')}</span>`)
            : ''}
          ${version.latest_update_available && version.latest ? `<span style="color:var(--text-tertiary)">${t('about.latestUpstream', { ver: version.latest })}</span>` : ''}
          <button class="btn btn-${isInstalled ? 'secondary' : 'primary'} btn-sm" id="btn-version-mgmt" style="${btnSm}">
            ${isInstalled ? t('about.switchVersion') : t('about.installOpenclaw')}
          </button>
          ${isInstalled ? `<button class="btn btn-secondary btn-sm" id="btn-uninstall" style="${btnSm};color:var(--error)">${t('about.uninstall')}</button>` : ''}
        </div>
        <div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--text-tertiary);line-height:1.6">
          ${policyRiskHint}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('about.installPath')}</span></div>
        <div class="stat-card-value" style="font-size:var(--font-size-sm);word-break:break-all">${install.path || t('common.unknown')}</div>
        <div class="stat-card-meta">${install.installed ? t('about.configExists') : t('about.configNotFound')}</div>
      </div>
    `

    const applyRecommendedBtn = cards.querySelector('#btn-apply-recommended')
    if (applyRecommendedBtn && version.recommended) {
      applyRecommendedBtn.onclick = () => doInstall(page, aheadOfRecommended ? t('about.rollbackToRecommendedStable') : t('about.switchToRecommendedStable'), version.source, version.recommended)
    }

    // 版本管理 / 安装
    const versionMgmtBtn = cards.querySelector('#btn-version-mgmt')
    if (versionMgmtBtn) {
      versionMgmtBtn.onclick = () => showVersionPicker(page, version)
    }

    // 卸载
    const uninstallBtn = cards.querySelector('#btn-uninstall')
    if (uninstallBtn) {
      uninstallBtn.onclick = async () => {
        const confirmed = await showConfirm(t('about.confirmUninstall'))
        if (!confirmed) return
        const modal = showUpgradeModal(t('about.uninstallTitle'))
        modal.onClose(() => loadData(page))
        modal.appendLog(t('about.uninstallStarting'))
        let unlistenLog, unlistenProgress, unlistenDone, unlistenError
        const cleanup = () => { unlistenLog?.(); unlistenProgress?.(); unlistenDone?.(); unlistenError?.() }
        try {
          if (window.__TAURI_INTERNALS__) {
            const { listen } = await import('@tauri-apps/api/event')
            unlistenLog = await listen('upgrade-log', (e) => modal.appendLog(e.payload))
            unlistenProgress = await listen('upgrade-progress', (e) => modal.setProgress(e.payload))
            unlistenDone = await listen('upgrade-done', (e) => { cleanup(); modal.setDone(typeof e.payload === 'string' ? e.payload : t('about.uninstallDone')) })
            unlistenError = await listen('upgrade-error', (e) => { cleanup(); modal.setError(t('about.uninstallFailed') + (e.payload || t('common.unknown'))) })
            await api.uninstallOpenclaw(false)
            modal.appendLog(t('about.uninstallTaskStarted'))
          } else {
            const msg = await api.uninstallOpenclaw(false)
            modal.setDone(typeof msg === 'string' ? msg : t('about.uninstallDone'))
            cleanup()
          }
        } catch (e) {
          cleanup()
          modal.setError(t('about.uninstallFailed') + (e?.message || e))
        }
      }
    }
  } catch {
    cards.innerHTML = `<div class="stat-card"><div class="stat-card-label">${t('common.loadFailed')}</div></div>`
  }
}

/**
 * 版本选择器弹窗 — 选择版本（汉化版/原版）+ 版本号
 */
async function showVersionPicker(page, currentVersion) {
  const isInstalled = !!currentVersion.current
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px">
      <div class="modal-title">${isInstalled ? t('about.switchVersion') : t('about.installOpenclaw')}</div>
      <div style="display:flex;flex-direction:column;gap:16px;margin:16px 0">
        <div>
          <label style="font-size:var(--font-size-sm);color:var(--text-secondary);display:block;margin-bottom:8px">${t('about.versionLabel')}</label>
          <div style="display:flex;gap:8px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid var(--border);font-size:var(--font-size-sm);flex:1;justify-content:center;transition:all .15s" id="lbl-official">
              <input type="radio" name="oc-source" value="official" ${currentVersion.source !== 'chinese' ? 'checked' : ''} style="accent-color:var(--primary)">
              ${t('about.official')}
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid var(--border);font-size:var(--font-size-sm);flex:1;justify-content:center;transition:all .15s" id="lbl-chinese">
              <input type="radio" name="oc-source" value="chinese" ${currentVersion.source === 'chinese' ? 'checked' : ''} style="accent-color:var(--primary)">
              ${t('about.chinese')}
            </label>
          </div>
        </div>
        <div>
          <label style="font-size:var(--font-size-sm);color:var(--text-secondary);display:block;margin-bottom:8px">${t('about.selectVersion')}</label>
          <select id="oc-version-select" class="input" style="width:100%;padding:8px 12px;font-size:var(--font-size-sm)">
            <option value="">${t('common.loading')}</option>
          </select>
        </div>
        <div style="font-size:var(--font-size-xs);color:var(--text-tertiary);line-height:1.6;padding:10px 12px;border-radius:8px;background:var(--bg-tertiary)">
          ${t('about.versionPickerHint')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;min-height:18px">
          <div id="oc-action-hint" style="font-size:var(--font-size-xs);color:var(--text-tertiary)"></div>
          <div id="nightly-toggle" style="display:none"></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-sm" data-action="cancel">${t('common.cancel')}</button>
        <button class="btn btn-primary btn-sm" data-action="confirm" disabled id="oc-confirm-btn">${isInstalled ? t('about.btnSwitch') : t('about.btnInstall')}</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  const select = overlay.querySelector('#oc-version-select')
  const confirmBtn = overlay.querySelector('#oc-confirm-btn')
  const hintEl = overlay.querySelector('#oc-action-hint')
  const radios = overlay.querySelectorAll('input[name="oc-source"]')
  const lblChinese = overlay.querySelector('#lbl-chinese')
  const lblOfficial = overlay.querySelector('#lbl-official')

  const close = () => overlay.remove()
  overlay.querySelector('[data-action="cancel"]').onclick = close
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  let versionsCache = {}
  let currentSelect = currentVersion.source === 'chinese' ? 'chinese' : 'official'

  function updateRadioStyle() {
    const sel = currentSelect
    lblChinese.style.borderColor = sel !== 'official' ? 'var(--primary)' : 'var(--border)'
    lblChinese.style.background = sel !== 'official' ? 'var(--primary-bg, rgba(99,102,241,0.06))' : ''
    lblOfficial.style.borderColor = sel === 'official' ? 'var(--primary)' : 'var(--border)'
    lblOfficial.style.background = sel === 'official' ? 'var(--primary-bg, rgba(99,102,241,0.06))' : ''
  }

  function updateHint() {
    const targetSource = currentSelect
    const targetVer = select.value
    if (!targetVer || targetVer === '') { hintEl.textContent = ''; confirmBtn.disabled = true; return }
    const targetTag = select.selectedIndex === 0 ? t('about.tagRecommended') : t('about.tagNeedTest')

    const sameSource = targetSource === currentVersion.source

    if (!isInstalled) {
      confirmBtn.textContent = t('about.btnInstall')
      hintEl.textContent = t('about.hintInstall', { source: targetSource === 'official' ? t('about.official') : targetSource === 'chinese' ? t('about.chinese') : t('about.unknownSource'), ver: targetVer, tag: targetTag })
      confirmBtn.disabled = false
      return
    }

    if (!sameSource) {
      confirmBtn.textContent = t('about.btnSwitch')
      hintEl.innerHTML = `${t('about.hintCurrent')}: <strong>${currentVersion.source === 'official' ? t('about.official') : currentVersion.source === 'chinese' ? t('about.chinese') : t('about.unknownSource')} ${currentVersion.current}</strong> → <strong>${targetSource === 'official' ? t('about.official') : targetSource === 'chinese' ? t('about.chinese') : t('about.unknownSource')} ${targetVer}</strong>${targetTag}`
      confirmBtn.disabled = false
      return
    }

    // 同源，比较版本
    const parseVer = v => v.split(/[^0-9]/).filter(Boolean).map(Number)
    const cur = parseVer(currentVersion.current)
    const tgt = parseVer(targetVer)
    let cmp = 0
    for (let i = 0; i < Math.max(cur.length, tgt.length); i++) {
      if ((tgt[i] || 0) > (cur[i] || 0)) { cmp = 1; break }
      if ((tgt[i] || 0) < (cur[i] || 0)) { cmp = -1; break }
    }

    if (cmp === 0) {
      confirmBtn.textContent = t('about.btnReinstall')
      hintEl.textContent = t('about.hintAlreadyVersion', { ver: targetVer, tag: targetTag })
      confirmBtn.disabled = false
    } else if (cmp > 0) {
      confirmBtn.textContent = t('about.btnUpgrade')
      hintEl.innerHTML = `<span style="color:var(--accent)">${currentVersion.current} → ${targetVer}${targetTag}</span>`
      confirmBtn.disabled = false
    } else {
      confirmBtn.textContent = t('about.btnDowngrade')
      hintEl.innerHTML = `<span style="color:var(--warning,#f59e0b)">${currentVersion.current} → ${targetVer}${targetTag}</span>`
      confirmBtn.disabled = false
    }
  }

  let showNightly = false

  async function loadVersions(source) {
    select.innerHTML = `<option value="">${t('common.loading')}</option>`
    confirmBtn.disabled = true
    hintEl.textContent = ''
    try {
      if (!versionsCache[source]) {
        versionsCache[source] = await api.listOpenclawVersions(source)
      }
      const allVersions = versionsCache[source]
      if (!allVersions.length) {
        select.innerHTML = `<option value="">${t('about.noVersions')}</option>`
        return
      }
      const stable = allVersions.filter(v => !v.includes('nightly') && !v.includes('canary') && !v.includes('alpha') && !v.includes('beta') && !v.includes('rc') && !v.includes('dev') && !v.includes('next'))
      const versions = showNightly ? allVersions : (stable.length > 0 ? stable : allVersions)
      const nightlyCount = allVersions.length - stable.length
      select.innerHTML = versions.map((v, idx) => {
        const isCurrent = isInstalled && v === currentVersion.current && source === currentVersion.source
        return `<option value="${v}">${v}${idx === 0 ? ` (${t('about.recommended')})` : ''}${isCurrent ? ` (${t('about.current')})` : ''}</option>`
      }).join('')
      // nightly 切换提示
      const toggleEl = overlay.querySelector('#nightly-toggle')
      if (toggleEl) {
        if (nightlyCount > 0) {
          toggleEl.style.display = ''
          toggleEl.innerHTML = showNightly
            ? `<a href="#" id="btn-toggle-nightly" style="color:var(--primary);text-decoration:none;font-size:var(--font-size-xs)">${t('about.hidePreview', { count: nightlyCount })}</a>`
            : `<a href="#" id="btn-toggle-nightly" style="color:var(--text-tertiary);text-decoration:none;font-size:var(--font-size-xs)">${t('about.showPreview', { count: nightlyCount })}</a>`
          toggleEl.querySelector('#btn-toggle-nightly').onclick = (e) => { e.preventDefault(); showNightly = !showNightly; loadVersions(source) }
        } else {
          toggleEl.style.display = 'none'
        }
      }
      updateHint()
    } catch (e) {
      select.innerHTML = `<option value="">${t('common.loadFailed')}: ${e.message || e}</option>`
    }
  }

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      currentSelect = radio.value
      updateRadioStyle()
      loadVersions(currentSelect)
    })
  })

  select.addEventListener('change', updateHint)

  confirmBtn.onclick = () => {
    const source = currentSelect
    const ver = select.value
    const action = confirmBtn.textContent
    close()
    doInstall(page, `${action} OpenClaw`, source, ver)
  }

  updateRadioStyle()
  loadVersions(currentSelect)
}

/**
 * 执行安装/升级/降级/切换操作（带进度弹窗）
 */
async function doInstall(page, title, source, version) {
  const modal = showUpgradeModal(title)
  modal.onClose(() => loadData(page))
  let unlistenLog, unlistenProgress, unlistenDone, unlistenError
  setUpgrading(true)

  const cleanup = () => {
    setUpgrading(false)
    unlistenLog?.(); unlistenProgress?.(); unlistenDone?.(); unlistenError?.()
  }

  try {
    if (window.__TAURI_INTERNALS__) {
      const { listen } = await import('@tauri-apps/api/event')
      unlistenLog = await listen('upgrade-log', (e) => modal.appendLog(e.payload))
      unlistenProgress = await listen('upgrade-progress', (e) => modal.setProgress(e.payload))

      unlistenDone = await listen('upgrade-done', (e) => {
        cleanup()
        modal.setDone(typeof e.payload === 'string' ? e.payload : t('about.operationDone'))
      })

      unlistenError = await listen('upgrade-error', async (e) => {
        cleanup()
        const errStr = String(e.payload || t('common.unknown'))
        modal.appendLog(errStr)
        const { diagnoseInstallError } = await import('../lib/error-diagnosis.js')
        const fullLog = modal.getLogText() + '\n' + errStr
        const diagnosis = diagnoseInstallError(fullLog)
        modal.setError(diagnosis.title)
        if (diagnosis.hint) modal.appendLog('')
        if (diagnosis.hint) modal.appendHtmlLog(`${statusIcon('info', 14)} ${diagnosis.hint}`)
        if (diagnosis.command) modal.appendHtmlLog(`${icon('clipboard', 14)} ${diagnosis.command}`)
      })

      await api.upgradeOpenclaw(source, version)
      modal.appendLog(t('about.taskStarted'))
    } else {
      modal.appendLog(t('about.webModeNoLog'))
      const msg = await api.upgradeOpenclaw(source, version)
      modal.setDone(typeof msg === 'string' ? msg : (msg?.message || t('about.operationDone')))
      cleanup()
    }
  } catch (e) {
    cleanup()
    const errStr = String(e)
    modal.appendLog(errStr)
    const { diagnoseInstallError } = await import('../lib/error-diagnosis.js')
    const fullLog = modal.getLogText() + '\n' + errStr
    const diagnosis = diagnoseInstallError(fullLog)
    modal.setError(diagnosis.title)
  }
}

async function checkHotUpdate(cards, panelVersion) {
  const el = () => cards.querySelector('#panel-update-meta')
  try {
    const info = await api.checkFrontendUpdate()
    const meta = el()
    if (!meta) return

    if (info.updateReady) {
      // 已下载更新，等待重载
      const ver = info.manifest?.version || info.latestVersion || ''
      meta.innerHTML = `
        <span style="color:var(--accent)">v${ver} ${t('about.updateReady')}</span>
        <button class="btn btn-primary btn-sm" id="btn-hot-reload" style="padding:2px 8px;font-size:var(--font-size-xs)">${t('about.reloadApp')}</button>
        <button class="btn btn-secondary btn-sm" id="btn-hot-rollback" style="padding:2px 8px;font-size:var(--font-size-xs)">${t('about.rollback')}</button>
      `
      meta.querySelector('#btn-hot-reload')?.addEventListener('click', () => {
        window.location.reload()
      })
      meta.querySelector('#btn-hot-rollback')?.addEventListener('click', async () => {
        try {
          await api.rollbackFrontendUpdate()
          toast(t('about.rollbackSuccess'), 'success')
          setTimeout(() => window.location.reload(), 800)
        } catch (e) {
          toast(t('about.rollbackFailed') + (e.message || e), 'error')
        }
      })
    } else if (info.hasUpdate) {
      // 有新版本可下载
      const ver = info.latestVersion
      const manifest = info.manifest || {}
      const changelog = manifest.changelog || ''
      meta.innerHTML = `
        <span style="color:var(--accent)">${t('about.newVersion')}: v${ver}</span>
        ${changelog ? `<span style="color:var(--text-tertiary);font-size:var(--font-size-xs)">${changelog}</span>` : ''}
        <button class="btn btn-primary btn-sm" id="btn-hot-download" style="padding:2px 8px;font-size:var(--font-size-xs)">${t('about.hotUpdate')}</button>
        <a class="btn btn-secondary btn-sm" href="https://github.com/openclaw/openclaw/releases" target="_blank" rel="noopener" style="padding:2px 8px;font-size:var(--font-size-xs)">${t('about.fullInstaller')}</a>
      `
      meta.querySelector('#btn-hot-download')?.addEventListener('click', async () => {
        const btn = meta.querySelector('#btn-hot-download')
        if (btn) { btn.disabled = true; btn.textContent = t('about.downloading') }
        try {
          await api.downloadFrontendUpdate(manifest.url, manifest.hash || '')
          toast(t('about.downloadDone'), 'success')
          checkHotUpdate(cards, panelVersion)
        } catch (e) {
          toast(t('about.downloadFailed') + (e.message || e), 'error')
          if (btn) { btn.disabled = false; btn.textContent = t('about.retry') }
        }
      })
    } else if (!info.compatible) {
      meta.innerHTML = `<span style="color:var(--text-tertiary)">${t('about.needFullUpdate')}</span> <a class="btn btn-secondary btn-sm" href="https://github.com/openclaw/openclaw/releases" target="_blank" rel="noopener" style="padding:2px 8px;font-size:var(--font-size-xs)">GitHub</a>`
    } else {
      meta.innerHTML = `<span style="color:var(--success)">${t('about.upToDate')}</span>`
    }
  } catch (err) {
    const meta = el()
    if (!meta) return
    meta.innerHTML = `<span style="color:var(--text-tertiary)">${t('about.checkUpdateFailed')}</span>`
  }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}
