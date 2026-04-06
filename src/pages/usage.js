/**
 * 使用情况页面 — 对接 OpenClaw Gateway sessions.usage API
 * 展示 Token 用量、费用、Top Models/Providers/Tools/Agents 等分析数据
 */
import { wsClient } from '../lib/ws-client.js'
import { toast } from '../components/toast.js'
import { icon } from '../lib/icons.js'
import { t } from '../lib/i18n.js'

let _page = null, _unsubReady = null

export async function render() {
  const page = document.createElement('div')
  page.className = 'page'
  _page = page

  page.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('usage.title')}</h1>
      <p class="page-desc">${t('usage.desc')}</p>
    </div>
    <div class="usage-toolbar" style="display:flex;gap:8px;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap">
      <button class="btn btn-sm ${_days === 1 ? 'btn-primary' : 'btn-secondary'}" data-days="1">${t('usage.today')}</button>
      <button class="btn btn-sm ${_days === 7 ? 'btn-primary' : 'btn-secondary'}" data-days="7">${t('usage.days7')}</button>
      <button class="btn btn-sm ${_days === 30 ? 'btn-primary' : 'btn-secondary'}" data-days="30">${t('usage.days30')}</button>
      <button class="btn btn-sm btn-secondary" id="btn-usage-refresh">${icon('refresh-cw', 14)} ${t('usage.refresh')}</button>
    </div>
    <div id="usage-content">
      <div class="stat-card loading-placeholder" style="height:120px"></div>
    </div>
  `

  page.querySelectorAll('[data-days]').forEach(btn => {
    btn.onclick = () => {
      _days = parseInt(btn.dataset.days)
      page.querySelectorAll('[data-days]').forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary') })
      btn.classList.remove('btn-secondary'); btn.classList.add('btn-primary')
      loadUsage(page)
    }
  })
  page.querySelector('#btn-usage-refresh')?.addEventListener('click', () => loadUsage(page))

  loadUsage(page)
  return page
}

export function cleanup() {
  _page = null
  if (_unsubReady) { _unsubReady(); _unsubReady = null }
}

let _days = 7

async function loadUsage(page) {
  const el = page.querySelector('#usage-content')
  el.innerHTML = `<div class="stat-card loading-placeholder" style="height:120px"></div>
    <div class="stat-card loading-placeholder" style="height:200px;margin-top:var(--space-md)"></div>`

  if (!wsClient.connected) {
    el.innerHTML = `<div class="usage-empty">
      <div style="color:var(--text-tertiary);margin-bottom:8px">${t('usage.gwConnecting')}</div>
      <div class="form-hint">${t('usage.gwWait')}</div>
    </div>`
    // 自动等待连接就绪后重试
    if (_unsubReady) _unsubReady()
    _unsubReady = wsClient.onReady(() => {
      if (_unsubReady) { _unsubReady(); _unsubReady = null }
      if (_page) loadUsage(_page)
    })
    return
  }

  try {
    const now = new Date()
    const end = now.toISOString().slice(0, 10)
    const start = new Date(now.getTime() - (_days - 1) * 86400000).toISOString().slice(0, 10)
    const data = await wsClient.request('sessions.usage', { startDate: start, endDate: end, limit: 20 })
    renderUsage(el, data)
  } catch (e) {
    el.innerHTML = `<div class="usage-empty">
      <div style="color:var(--error);margin-bottom:8px">${t('usage.loadFailed')}: ${esc(e?.message || e)}</div>
      <div class="form-hint">${t('usage.loadFailedHint')}</div>
      <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="this.closest('.page').querySelector('#btn-usage-refresh').click()">${t('usage.retry')}</button>
    </div>`
  }
}

function renderUsage(el, data) {
  if (!data) { el.innerHTML = `<div class="usage-empty">${t('usage.noData')}</div>`; return }

  const totals = data.totals || {}
  const a = data.aggregates || {}
  const msgs = a.messages || {}
  const tools = a.tools || {}

  const fmtTokens = (n) => {
    if (n == null || n === 0) return '0'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
    return String(n)
  }
  const fmtCost = (n) => n != null && n > 0 ? '$' + n.toFixed(4) : '$0'
  const fmtRate = (errors, total) => {
    if (!total) return '—'
    const pct = (errors / total * 100).toFixed(1)
    return pct + '%'
  }

  // ── 概览卡片 ──
  const overviewHtml = `
    <div class="stat-cards" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('usage.messages')}</span></div>
        <div class="stat-card-value">${msgs.total || 0}</div>
        <div class="stat-card-meta">${msgs.user || 0} ${t('usage.userMsgs')} · ${msgs.assistant || 0} ${t('usage.assistantMsgs')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('usage.toolCalls')}</span></div>
        <div class="stat-card-value">${tools.totalCalls || 0}</div>
        <div class="stat-card-meta">${t('usage.toolKinds', { count: tools.uniqueTools || 0 })}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('usage.errors')}</span></div>
        <div class="stat-card-value">${msgs.errors || 0}</div>
        <div class="stat-card-meta">${t('usage.errorRate')} ${fmtRate(msgs.errors, msgs.total)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('usage.totalTokens')}</span></div>
        <div class="stat-card-value">${fmtTokens(totals.totalTokens)}</div>
        <div class="stat-card-meta">${fmtTokens(totals.input)} ${t('usage.input')} · ${fmtTokens(totals.output)} ${t('usage.output')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('usage.cost')}</span></div>
        <div class="stat-card-value">${fmtCost(totals.totalCost)}</div>
        <div class="stat-card-meta">${fmtCost(totals.inputCost)} ${t('usage.input')} · ${fmtCost(totals.outputCost)} ${t('usage.output')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">${t('usage.sessions')}</span></div>
        <div class="stat-card-value">${(data.sessions || []).length}</div>
        <div class="stat-card-meta">${data.startDate || ''} ~ ${data.endDate || ''}</div>
      </div>
    </div>
  `

  // ── Top 排行 ──
  const renderTop = (title, items, keyFn, valueFn) => {
    if (!items || !items.length) return ''
    const rows = items.slice(0, 5).map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-primary)">
        <span style="font-size:var(--font-size-sm);color:var(--text-primary);font-weight:500">${esc(keyFn(item))}</span>
        <span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-family:var(--font-mono)">${valueFn(item)}</span>
      </div>
    `).join('')
    return `
      <div class="usage-top-card">
        <div class="usage-top-title">${title}</div>
        ${rows}
      </div>
    `
  }

  const topModels = renderTop(t('usage.topModels'),
    a.byModel, m => m.model || t('usage.unknownModel'), m => fmtCost(m.totals?.totalCost) + ' · ' + fmtTokens(m.totals?.totalTokens))
  const topProviders = renderTop(t('usage.topProviders'),
    a.byProvider, p => p.provider || t('usage.unknownProvider'), p => fmtCost(p.totals?.totalCost) + ' · ' + t('usage.times', { count: p.count }))
  const topTools = renderTop(t('usage.topTools'),
    (tools.tools || []), item => item.name, item => t('usage.timesCall', { count: item.count }))
  const topAgents = renderTop(t('usage.topAgents'),
    a.byAgent, item => item.agentId || 'main', item => fmtCost(item.totals?.totalCost))
  const topChannels = renderTop(t('usage.topChannels'),
    a.byChannel, c => c.channel || 'webchat', c => fmtCost(c.totals?.totalCost))

  const topsHtml = `<div class="usage-tops-grid">${topModels}${topProviders}${topTools}${topAgents}${topChannels}</div>`

  // ── Token 分类 ──
  const tokenBreakdownHtml = `
    <div class="config-section" style="margin-top:var(--space-lg)">
      <div class="config-section-title">${t('usage.tokenBreakdown')}</div>
      <div style="display:flex;gap:var(--space-lg);flex-wrap:wrap;padding:var(--space-md)">
        <div><span style="display:inline-block;width:10px;height:10px;background:var(--error);border-radius:2px;margin-right:6px"></span>${t('usage.outputTokens')} ${fmtTokens(totals.output)}</div>
        <div><span style="display:inline-block;width:10px;height:10px;background:var(--accent);border-radius:2px;margin-right:6px"></span>${t('usage.inputTokens')} ${fmtTokens(totals.input)}</div>
        <div><span style="display:inline-block;width:10px;height:10px;background:var(--success);border-radius:2px;margin-right:6px"></span>${t('usage.cacheRead')} ${fmtTokens(totals.cacheRead)}</div>
        <div><span style="display:inline-block;width:10px;height:10px;background:var(--warning);border-radius:2px;margin-right:6px"></span>${t('usage.cacheWrite')} ${fmtTokens(totals.cacheWrite)}</div>
      </div>
    </div>
  `

  // ── 每日用量 ──
  const daily = a.daily || []
  let dailyHtml = ''
  if (daily.length > 0) {
    const maxTokens = Math.max(...daily.map(d => d.tokens || 0), 1)
    const bars = daily.map(d => {
      const pct = Math.max(1, Math.round((d.tokens || 0) / maxTokens * 100))
      const date = (d.date || '').slice(5) // MM-DD
      return `<div class="usage-daily-bar-wrap" title="${d.date}: ${fmtTokens(d.tokens)} tokens · ${d.messages || 0} msgs">
        <div class="usage-daily-bar" style="height:${pct}%"></div>
        <div class="usage-daily-label">${date}</div>
      </div>`
    }).join('')
    dailyHtml = `
      <div class="config-section" style="margin-top:var(--space-lg)">
        <div class="config-section-title">${t('usage.dailyUsage')}</div>
        <div class="usage-daily-chart">${bars}</div>
      </div>
    `
  }

  // ── 会话列表 ──
  const sessions = (data.sessions || []).slice(0, 10)
  let sessionsHtml = ''
  if (sessions.length > 0) {
    const rows = sessions.map(s => {
      const u = s.usage || {}
      const key = esc(s.key || '').replace(/^agent:main:/, '')
      const model = s.model || u.modelUsage?.[0]?.model || ''
      const provider = u.modelUsage?.[0]?.provider || s.modelProvider || ''
      return `<div class="session-row">
        <div class="session-row-header">
          <span class="session-key" title="${esc(s.key || '')}">${key || s.sessionId?.slice(0, 12) || '—'}</span>
          ${s.agentId ? `<span class="session-flag">${esc(s.agentId)}</span>` : ''}
          ${model ? `<span class="session-model">${esc(model)}</span>` : ''}
          ${provider ? `<span class="session-flag">${esc(provider)}</span>` : ''}
        </div>
        <div class="session-row-meta">${fmtTokens(u.totalTokens)} tokens · ${fmtCost(u.totalCost)} · ${(u.messageCounts?.total || 0)} msgs${u.messageCounts?.errors ? ' · ' + u.messageCounts.errors + ' err' : ''}</div>
      </div>`
    }).join('')
    sessionsHtml = `
      <div class="config-section" style="margin-top:var(--space-lg)">
        <div class="config-section-title">${t('usage.sessionDetail')} <span style="font-weight:normal;color:var(--text-tertiary);font-size:var(--font-size-xs)">${t('usage.recentN', { count: sessions.length })}</span></div>
        <div class="session-list">${rows}</div>
      </div>
    `
  }

  el.innerHTML = overviewHtml + topsHtml + tokenBreakdownHtml + dailyHtml + sessionsHtml
}

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
