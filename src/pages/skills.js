/**
 * Skills 页面
 * 基于 openclaw skills CLI，按状态分组展示所有 Skills
 */
import { api } from '../lib/tauri-api.js'
import { toast } from '../components/toast.js'
import { createCustomSelect } from '../components/custom-select.js'
import { t } from '../lib/i18n.js'

let _loadSeq = 0

function esc(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function render() {
  const page = document.createElement('div')
  page.className = 'page'
  page.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('skills.title')}</h1>
      <p class="page-desc">${t('skills.desc')}</p>
    </div>
    <div class="tab-bar" id="skills-main-tabs">
      <div class="tab active" data-main-tab="installed">${t('skills.tabInstalled')}</div>
      <div class="tab" data-main-tab="store">${t('skills.tabStore')}</div>
    </div>
    <div id="skills-tab-installed" class="config-section">
      <div class="stat-card loading-placeholder" style="height:96px"></div>
    </div>
    <div id="skills-tab-store" class="config-section" style="display:none">
      <div class="clawhub-toolbar" style="margin-bottom:var(--space-sm)">
        <div id="install-source-select-container" style="min-width:160px"></div>
        <input class="input clawhub-search-input" id="skill-install-search" placeholder="${t('skills.searchPlaceholder')}" type="text" style="flex:1">
        <button class="btn btn-primary btn-sm" data-action="install-source-search">${t('skills.search')}</button>
        <button class="btn btn-secondary btn-sm" data-action="skillhub-setup" id="btn-skillhub-setup" style="display:none">${t('skills.installCLI')}</button>
        <a class="btn btn-secondary btn-sm" id="btn-browse-source" href="https://skillhub.tencent.com" target="_blank" rel="noopener">${t('skills.browse')}</a>
      </div>
      <div class="form-hint" id="store-hint" style="margin-bottom:var(--space-sm);display:flex;align-items:center;gap:var(--space-xs)">
        <span id="skillhub-status"></span>
      </div>
      <div id="install-source-results" class="clawhub-list" style="max-height:calc(100vh - 320px);overflow-y:auto">
        <div class="clawhub-empty" style="padding:var(--space-xl);text-align:center">${t('skills.searchEmpty')}</div>
      </div>
    </div>
  `
  bindEvents(page)
  loadSkills(page)
  return page
}

async function loadSkills(page) {
  const el = page.querySelector('#skills-tab-installed')
  if (!el) return
  const seq = ++_loadSeq

  el.innerHTML = `<div class="skills-loading-panel">
    <div class="stat-card loading-placeholder" style="height:96px"></div>
    <div class="form-hint" style="margin-top:8px">${t('skills.loading')}</div>
  </div>`

  try {
    const data = await api.skillsList()
    if (seq !== _loadSeq) return
    renderSkills(el, data)
  } catch (e) {
    if (seq !== _loadSeq) return
    el.innerHTML = `<div class="skills-load-error">
      <div style="color:var(--error);margin-bottom:8px">${t('skills.loadFailed')}: ${esc(e?.message || e)}</div>
      <div class="form-hint" style="margin-bottom:10px">${t('skills.loadFailedHint')}</div>
      <button class="btn btn-secondary btn-sm" data-action="skill-retry">${t('skills.retry')}</button>
    </div>`
  }
}

function renderSkills(el, data) {
  const skills = data?.skills || []
  const cliAvailable = data?.cliAvailable !== false
  const source = data?.source || ''
  const cliDiag = data?.diagnostic?.cli || null
  const eligible = skills.filter(s => s.eligible && !s.disabled)
  const missing = skills.filter(s => !s.eligible && !s.disabled && !s.blockedByAllowlist)
  const disabled = skills.filter(s => s.disabled)
  const blocked = skills.filter(s => s.blockedByAllowlist && !s.disabled)

  const summary = t('skills.summaryDetail', { eligible: eligible.length, missing: missing.length, disabled: disabled.length })
  let sourceHint = ''
  if (source === 'local-scan') {
    if (cliDiag?.status === 'timeout') sourceHint = t('skills.sourceLocalScanTimeout')
    else if (cliDiag?.status === 'parse-failed') sourceHint = t('skills.sourceLocalScanParseFailed')
    else if (cliDiag?.status === 'exec-failed') sourceHint = t('skills.sourceLocalScanExecFailed')
    else sourceHint = cliAvailable ? t('skills.sourceLocalScan') : t('skills.sourceLocalScanNoCli')
  } else if (cliAvailable) {
    sourceHint = t('skills.sourceCLI')
  }

  el.innerHTML = `
    <div class="clawhub-toolbar">
      <input class="input clawhub-search-input" id="skill-filter-input" placeholder="${t('skills.filterPlaceholder')}" type="text">
      <button class="btn btn-secondary btn-sm" data-action="skill-retry">${t('skills.refresh')}</button>
      <a class="btn btn-secondary btn-sm" href="https://clawhub.ai/skills" target="_blank" rel="noopener">ClawHub</a>
      ${sourceHint ? `<span class="form-hint" style="margin-left:auto;color:${source === 'local-scan' ? 'var(--warning)' : 'var(--text-tertiary)'}">${esc(sourceHint)}</span>` : ''}
    </div>

    <div class="skills-summary" style="margin-bottom:var(--space-lg);color:var(--text-secondary);font-size:var(--font-size-sm)">
      ${t('skills.summary', { total: skills.length, detail: summary })}
    </div>

    ${eligible.length ? `
    <div class="clawhub-panel" style="margin-bottom:var(--space-lg)">
      <div class="clawhub-panel-title" style="color:var(--success)">${t('skills.eligibleGroup')} (${eligible.length})</div>
      <div class="clawhub-list skills-scroll-area skills-trending-scroll" id="skills-eligible">
        ${eligible.map(s => renderSkillCard(s, 'eligible')).join('')}
      </div>
    </div>` : ''}

    ${missing.length ? `
    <div class="clawhub-panel" style="margin-bottom:var(--space-lg)">
      <div class="clawhub-panel-title" style="color:var(--warning);display:flex;align-items:center;gap:var(--space-sm)">
        <span>${t('skills.missingGroup')} (${missing.length})</span>
        <button class="btn btn-secondary btn-sm" data-action="skill-ai-fix" style="font-size:var(--font-size-xs);padding:2px 8px">${t('skills.aiFixBtn')}</button>
      </div>
      <div class="clawhub-list skills-scroll-area skills-installed-scroll" id="skills-missing">
        ${missing.map(s => renderSkillCard(s, 'missing')).join('')}
      </div>
    </div>` : ''}

    ${disabled.length ? `
    <div class="clawhub-panel" style="margin-bottom:var(--space-lg)">
      <div class="clawhub-panel-title" style="color:var(--text-tertiary)">${t('skills.disabledGroup')} (${disabled.length})</div>
      <div class="clawhub-list skills-scroll-area skills-search-scroll" id="skills-disabled">
        ${disabled.map(s => renderSkillCard(s, 'disabled')).join('')}
      </div>
    </div>` : ''}

    ${blocked.length ? `
    <div class="clawhub-panel" style="margin-bottom:var(--space-lg)">
      <div class="clawhub-panel-title" style="color:var(--text-tertiary)">${t('skills.blockedGroup')} (${blocked.length})</div>
      <div class="clawhub-list">
        ${blocked.map(s => renderSkillCard(s, 'blocked')).join('')}
      </div>
    </div>` : ''}

    ${!skills.length ? `
    <div class="clawhub-panel">
      <div class="clawhub-empty" style="text-align:center;padding:var(--space-xl)">
        <div style="margin-bottom:var(--space-sm)">${t('skills.noSkills')}</div>
        <div class="form-hint">${t('skills.noSkillsHint')}</div>
      </div>
    </div>` : ''}

    <div id="skill-detail-area"></div>
  `

  // 实时过滤
  const input = el.querySelector('#skill-filter-input')
  if (input) {
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase()
      el.querySelectorAll('.skill-card-item').forEach(card => {
        const name = (card.dataset.name || '').toLowerCase()
        const desc = (card.dataset.desc || '').toLowerCase()
        card.style.display = (!q || name.includes(q) || desc.includes(q)) ? '' : 'none'
      })
    })
  }
}

function renderSkillCard(skill, status) {
  const emoji = skill.emoji || '📦'
  const name = skill.name || ''
  const desc = skill.description || ''
  const source = skill.bundled ? t('skills.bundled') : (skill.source || t('skills.custom'))
  const missingBins = skill.missing?.bins || []
  const missingEnv = skill.missing?.env || []
  const missingConfig = skill.missing?.config || []
  const installOpts = skill.install || []

  let statusBadge = ''
  if (status === 'eligible') statusBadge = `<span class="clawhub-badge installed">${t('skills.eligible')}</span>`
  else if (status === 'missing') statusBadge = `<span class="clawhub-badge" style="background:rgba(245,158,11,0.14);color:#d97706">${t('skills.missingDeps')}</span>`
  else if (status === 'disabled') statusBadge = `<span class="clawhub-badge" style="background:rgba(107,114,128,0.14);color:#6b7280">${t('skills.disabled')}</span>`
  else if (status === 'blocked') statusBadge = `<span class="clawhub-badge" style="background:rgba(239,68,68,0.14);color:#ef4444">${t('skills.blocked')}</span>`

  let missingHtml = ''
  if (missingBins.length) missingHtml += `<div class="form-hint" style="margin-top:4px">${t('skills.missingCmd')}: ${missingBins.map(b => `<code>${esc(b)}</code>`).join(', ')}</div>`
  if (missingEnv.length) missingHtml += `<div class="form-hint" style="margin-top:4px">${t('skills.missingEnv')}: ${missingEnv.map(e => `<code>${esc(e)}</code>`).join(', ')} <span style="color:var(--text-tertiary);font-size:var(--font-size-xs)">${t('skills.missingEnvHint')}</span></div>`
  if (missingConfig.length) missingHtml += `<div class="form-hint" style="margin-top:4px">${t('skills.missingConfig')}: ${missingConfig.map(c => `<code>${esc(c)}</code>`).join(', ')} <span style="color:var(--text-tertiary);font-size:var(--font-size-xs)">${t('skills.missingConfigHint')}</span></div>`

  let installHtml = ''
  if (status === 'missing') {
    if (installOpts.length) {
      installHtml = `<div style="margin-top:6px">${installOpts.map(opt =>
        `<button class="btn btn-primary btn-sm" style="margin-right:6px;margin-top:4px" data-action="skill-install-dep" data-kind="${esc(opt.kind)}" data-install='${esc(JSON.stringify(opt))}' data-skill-name="${esc(name)}">${esc(opt.label)}</button>`
      ).join('')}</div>`
    } else if (missingBins.length && !missingEnv.length && !missingConfig.length) {
      installHtml = `<div class="form-hint" style="margin-top:6px;color:var(--text-tertiary);font-size:var(--font-size-xs)">${t('skills.noAutoInstall')}: ${missingBins.map(b => `<code>brew install ${esc(b)}</code> / <code>npm i -g ${esc(b)}</code>`).join(' / ')}</div>`
    }
  }

  return `
    <div class="clawhub-item skill-card-item" data-name="${esc(name)}" data-desc="${esc(desc)}">
      <div class="clawhub-item-main">
        <div class="clawhub-item-title">${emoji} ${esc(name)}</div>
        <div class="clawhub-item-meta">${esc(source)}${skill.homepage ? ` · <a href="${esc(skill.homepage)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(skill.homepage)}</a>` : ''}</div>
        <div class="clawhub-item-desc">${esc(desc)}</div>
        ${missingHtml}
        ${installHtml}
      </div>
      <div class="clawhub-item-actions">
        <button class="btn btn-secondary btn-sm" data-action="skill-info" data-name="${esc(name)}">${t('skills.detail')}</button>
        ${!skill.bundled ? `<button class="btn btn-sm" style="color:var(--error);border:1px solid var(--error);background:transparent;font-size:var(--font-size-xs)" data-action="skill-uninstall" data-name="${esc(name)}">${t('skills.uninstall')}</button>` : ''}
        ${statusBadge}
      </div>
    </div>
  `
}

async function handleInfo(page, name) {
  const detail = page.querySelector('#skill-detail-area')
  if (!detail) return
  detail.innerHTML = `<div class="form-hint" style="margin-top:var(--space-md)">${t('skills.loadingDetail')}</div>`
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  try {
    const skill = await api.skillsInfo(name)
    const s = skill || {}
    const reqs = s.requirements || {}
    const miss = s.missing || {}

    let reqsHtml = ''
    if (reqs.bins?.length) {
      reqsHtml += `<div style="margin-top:8px"><strong>${t('skills.reqBins')}:</strong> ${reqs.bins.map(b => {
        const ok = !(miss.bins || []).includes(b)
        return `<code style="color:var(--${ok ? 'success' : 'error'})">${ok ? '✓' : '✗'} ${esc(b)}</code>`
      }).join(' ')}</div>`
    }
    if (reqs.env?.length) {
      reqsHtml += `<div style="margin-top:4px"><strong>${t('skills.reqEnv')}:</strong> ${reqs.env.map(e => {
        const ok = !(miss.env || []).includes(e)
        return `<code style="color:var(--${ok ? 'success' : 'error'})">${ok ? '✓' : '✗'} ${esc(e)}</code>`
      }).join(' ')}</div>`
    }

    detail.innerHTML = `
      <div class="clawhub-detail-card">
        <div class="clawhub-detail-title">${esc(s.emoji || '📦')} ${esc(s.name || name)}</div>
        <div class="clawhub-detail-meta">
          ${t('skills.detailSource')}: ${esc(s.source || '')} · ${t('skills.detailPath')}: <code>${esc(s.filePath || '')}</code>
          ${s.homepage ? ` · <a href="${esc(s.homepage)}" target="_blank" rel="noopener">${esc(s.homepage)}</a>` : ''}
        </div>
        <div class="clawhub-detail-desc" style="margin-top:8px">${esc(s.description || '')}</div>
        ${reqsHtml}
        ${(s.install || []).length && !s.eligible ? `<div style="margin-top:8px"><strong>${t('skills.installOptions')}:</strong> ${s.install.map(i => `<span class="form-hint">→ ${esc(i.label)}</span>`).join(' ')}</div>` : ''}
      </div>
    `
  } catch (e) {
    detail.innerHTML = `<div style="color:var(--error);margin-top:var(--space-md)">${t('skills.detailLoadFailed')}: ${esc(e?.message || e)}</div>`
  }
}

async function handleInstallDep(page, btn) {
  const kind = btn.dataset.kind
  let spec
  try { spec = JSON.parse(btn.dataset.install) } catch { spec = {} }
  const skillName = btn.dataset.skillName || ''
  btn.disabled = true
  btn.textContent = t('skills.installing')
  try {
    await api.skillsInstallDep(kind, spec)
    toast(t('skills.depInstalled', { name: skillName }), 'success')
    await loadSkills(page)
  } catch (e) {
    toast(`${t('skills.installFailed')}: ${e?.message || e}`, 'error')
    btn.disabled = false
    btn.textContent = spec.label || t('skills.retry')
  }
}

// ===== 统一源搜索/安装系统 =====
let _installSource = 'skillhub' // 当前选中的安装源
let _skillhubInstalled = false // SkillHub CLI 是否已安装

function getInstallSource() { return _installSource }

async function handleSourceSearch(page) {
  const input = page.querySelector('#skill-install-search')
  const results = page.querySelector('#install-source-results')
  if (!input || !results) return
  const q = input.value.trim()
  if (!q) { results.innerHTML = `<div class="clawhub-empty">${t('skills.searchKeyword')}</div>`; return }
  const source = getInstallSource()
  // SkillHub 未安装时友好提示（先实时检测一次，避免竞态误判）
  if (source === 'skillhub' && !_skillhubInstalled) {
    try {
      const info = await api.skillsSkillHubCheck()
      _skillhubInstalled = !!info.installed
    } catch { /* ignore */ }
  }
  if (source === 'skillhub' && !_skillhubInstalled) {
    results.innerHTML = `<div style="padding:var(--space-lg);text-align:center">
      <div style="color:var(--warning);margin-bottom:8px">${t('skills.skillhubNeedCLI')}</div>
      <div class="form-hint" style="margin-bottom:12px">${t('skills.skillhubNeedCLIHint')}</div>
      <button class="btn btn-primary btn-sm" data-action="skillhub-setup">${t('skills.skillhubSetup')}</button>
    </div>`
    return
  }
  results.innerHTML = `<div class="form-hint">${t('skills.searching')}</div>`
  try {
    const items = source === 'skillhub' ? await api.skillsSkillHubSearch(q) : await api.skillsClawHubSearch(q)
    if (!items?.length) { results.innerHTML = `<div class="clawhub-empty">${t('skills.noResults')}</div>`; return }
    const installAction = source === 'skillhub' ? 'source-install-skillhub' : 'source-install-clawhub'
    results.innerHTML = items.map(item => `
      <div class="clawhub-item">
        <div class="clawhub-item-main">
          <div class="clawhub-item-title">${esc(item.slug || item.name || '')}</div>
          <div class="clawhub-item-desc">${esc(item.description || item.summary || '')}</div>
        </div>
        <div class="clawhub-item-actions">
          <button class="btn btn-primary btn-sm" data-action="${installAction}" data-slug="${esc(item.slug || item.name || '')}">${t('skills.install')}</button>
        </div>
      </div>
    `).join('')
  } catch (e) {
    const errMsg = String(e?.message || e)
    const isRateLimit = /rate.?limit|429|too many/i.test(errMsg)
    if (isRateLimit) {
      results.innerHTML = `<div style="padding:var(--space-lg);text-align:center">
        <div style="color:var(--warning);margin-bottom:8px">${t('skills.rateLimited')}</div>
        <div class="form-hint">${source === 'clawhub' ? t('skills.rateLimitClawHub') : t('skills.rateLimitRetry')}</div>
      </div>`
    } else {
      results.innerHTML = `<div style="color:var(--error);padding:var(--space-sm)">${t('skills.searchFailed')}: ${esc(errMsg)}</div>`
    }
  }
}

async function handleSourceInstall(page, btn, source) {
  const slug = btn.dataset.slug
  btn.disabled = true
  btn.textContent = t('skills.installing')
  try {
    if (source === 'skillhub') await api.skillsSkillHubInstall(slug)
    else await api.skillsClawHubInstall(slug)
    toast(t('skills.skillInstalled', { name: slug }), 'success')
    btn.textContent = t('skills.installed')
    btn.classList.remove('btn-primary')
    btn.classList.add('btn-secondary')
    // 后台刷新已安装列表（不阻塞 UI）
    loadSkills(page).catch(() => {})
  } catch (e) {
    toast(`${t('skills.installFailed')}: ${e?.message || e}`, 'error')
    btn.disabled = false
    btn.textContent = t('skills.install')
  }
}

async function handleSkillUninstall(page, btn) {
  const name = btn.dataset.name
  if (!name) return
  if (!confirm(t('skills.confirmUninstall', { name }))) return
  btn.disabled = true
  btn.textContent = t('skills.uninstalling')
  try {
    await api.skillsUninstall(name)
    toast(t('skills.uninstalled', { name }), 'success')
    await loadSkills(page)
  } catch (e) {
    toast(`${t('skills.uninstallFailed')}: ${e?.message || e}`, 'error')
    btn.disabled = false
    btn.textContent = t('skills.uninstall')
  }
}

async function handleSkillHubSetup(page) {
  const statusEl = page.querySelector('#skillhub-status')
  if (statusEl) statusEl.textContent = t('skills.skillhubInstalling')
  try {
    await api.skillsSkillHubSetup(true)
    _skillhubInstalled = true
    toast(t('skills.skillhubInstalled'), 'success')
    if (statusEl) statusEl.textContent = '✅'
    // 隐藏安装按钮
    const setupBtn = page.querySelector('#btn-skillhub-setup')
    if (setupBtn) setupBtn.style.display = 'none'
  } catch (e) {
    toast(`${t('skills.skillhubInstallFailed')}: ${e?.message || e}`, 'error')
    if (statusEl) statusEl.textContent = '❌'
  }
}

async function checkSkillHubStatus(page) {
  const statusEl = page.querySelector('#skillhub-status')
  const setupBtn = page.querySelector('#btn-skillhub-setup')
  if (!statusEl) return
  try {
    const info = await api.skillsSkillHubCheck()
    _skillhubInstalled = !!info.installed
    if (info.installed) {
      statusEl.innerHTML = `<span style="color:var(--success)">✅ v${info.version}</span>`
      if (setupBtn) setupBtn.style.display = 'none'
    } else {
      statusEl.innerHTML = `<span style="color:var(--warning)">${t('skills.skillhubNeedCLI')}</span>`
      if (setupBtn && _installSource === 'skillhub') setupBtn.style.display = ''
    }
  } catch {
    statusEl.textContent = ''
  }
}

function switchInstallSource(page, source) {
  _installSource = source
  const results = page.querySelector('#install-source-results')
  const setupBtn = page.querySelector('#btn-skillhub-setup')
  const browseBtn = page.querySelector('#btn-browse-source')
  if (results) results.innerHTML = `<div class="clawhub-empty">${t('skills.searchKeyword')}</div>`
  if (source === 'skillhub') {
    if (browseBtn) browseBtn.href = 'https://skillhub.tencent.com'
    checkSkillHubStatus(page)
  } else {
    if (setupBtn) setupBtn.style.display = 'none'
    if (browseBtn) browseBtn.href = 'https://clawhub.ai/skills'
  }
}

function bindEvents(page) {
  // 主 Tab 切换（已安装 / 搜索安装）
  page.querySelectorAll('#skills-main-tabs .tab').forEach(tab => {
    tab.onclick = () => {
      page.querySelectorAll('#skills-main-tabs .tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      const key = tab.dataset.mainTab
      page.querySelector('#skills-tab-installed').style.display = key === 'installed' ? '' : 'none'
      page.querySelector('#skills-tab-store').style.display = key === 'store' ? '' : 'none'
      // 切到商店 tab 时检测 SkillHub 状态
      if (key === 'store') checkSkillHubStatus(page)
    }
  })

  // 安装源下拉切换
  const sourceContainer = page.querySelector('#install-source-select-container')
  if (sourceContainer) {
    const sourceSelect = createCustomSelect([
      { value: 'skillhub', label: t('skills.sourceSkillHub') },
      { value: 'clawhub', label: t('skills.sourceClawHub') }
    ], {
      value: _installSource || 'skillhub',
      onchange: (val) => switchInstallSource(page, val)
    })
    sourceContainer.appendChild(sourceSelect.container)
  }

  page.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    switch (btn.dataset.action) {
      case 'skill-retry':
        await loadSkills(page)
        break
      case 'skill-info':
        await handleInfo(page, btn.dataset.name)
        break
      case 'skill-install-dep':
        await handleInstallDep(page, btn)
        break
      case 'install-source-search':
        await handleSourceSearch(page)
        break
      case 'source-install-skillhub':
        await handleSourceInstall(page, btn, 'skillhub')
        break
      case 'source-install-clawhub':
        await handleSourceInstall(page, btn, 'clawhub')
        break
      case 'skillhub-setup':
        await handleSkillHubSetup(page)
        break
      case 'skill-uninstall':
        await handleSkillUninstall(page, btn)
        break
    }
  })

  page.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && e.target?.id === 'skill-install-search') {
      e.preventDefault()
      await handleSourceSearch(page)
    }
  })
}
