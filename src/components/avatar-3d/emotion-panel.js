/**
 * 情绪控制面板组件
 * 独立的情绪切换面板，可与Avatar3D组件配合使用
 */

import { emotionList, EMOTIONS, emotionConfigs } from '../../lib/3d/emotion-config.js'

export class EmotionPanel {
  constructor(container, options = {}) {
    this.container = container
    this.options = {
      currentEmotion: options.currentEmotion || EMOTIONS.NEUTRAL,
      onChange: options.onChange || null,
      showLabels: options.showLabels !== false,
      compact: options.compact || false
    }

    this.currentEmotion = this.options.currentEmotion
    this.emotionCallbacks = []
  }

  init() {
    this.render()
  }

  render() {
    this.container.innerHTML = this.getHTML()
    this.attachEvents()
  }

  getHTML() {
    if (this.options.compact) {
      return this.getCompactHTML()
    }
    return this.getFullHTML()
  }

  getFullHTML() {
    const buttons = emotionList.map(emotion => {
      const config = emotionConfigs[emotion.id]
      const isActive = emotion.id === this.currentEmotion

      return `
        <button class="emotion-panel-btn ${isActive ? 'active' : ''}"
                data-emotion="${emotion.id}"
                style="
                  display:flex;
                  flex-direction:column;
                  align-items:center;
                  gap:4px;
                  padding:12px 16px;
                  border:${isActive ? '2px solid var(--primary,#8b5cf6)' : '1px solid var(--border,#3a3a5e)'};
                  border-radius:var(--radius-lg,8px);
                  background:var(--bg-secondary,#2a2a3e);
                  cursor:pointer;
                  transition:all 0.2s;
                  min-width:80px;
                ">
          <span style="font-size:28px">${emotion.emoji}</span>
          ${this.options.showLabels ? `<span style="font-size:12px;color:var(--text-secondary)">${emotion.name}</span>` : ''}
        </button>
      `
    }).join('')

    return `
      <div class="emotion-panel" style="
        display:flex;
        flex-direction:column;
        gap:12px;
        padding:16px;
        background:var(--bg-secondary,#2a2a3e);
        border-radius:var(--radius-lg,8px);
      ">
        <div class="emotion-panel-title" style="
          font-size:14px;
          font-weight:600;
          color:var(--text-primary);
          margin-bottom:4px;
        ">🎭 情绪选择</div>
        <div class="emotion-panel-grid" style="
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(80px,1fr));
          gap:8px;
        ">
          ${buttons}
        </div>
        <div class="emotion-panel-info" style="
          font-size:12px;
          color:var(--text-tertiary);
          margin-top:8px;
        ">
          当前: <span class="current-emotion-name">${emotionConfigs[this.currentEmotion]?.name || '中性'}</span>
          <span class="current-emotion-emoji">${emotionConfigs[this.currentEmotion]?.emoji || '😐'}</span>
        </div>
      </div>
    `
  }

  getCompactHTML() {
    const buttons = emotionList.map(emotion => {
      const isActive = emotion.id === this.currentEmotion
      return `
        <button class="emotion-panel-btn ${isActive ? 'active' : ''}"
                data-emotion="${emotion.id}"
                title="${emotion.name}"
                style="
                  width:40px;
                  height:40px;
                  font-size:20px;
                  border:${isActive ? '2px solid var(--primary,#8b5cf6)' : '1px solid var(--border,#3a3a5e)'};
                  border-radius:50%;
                  background:var(--bg-secondary,#2a2a3e);
                  cursor:pointer;
                  transition:all 0.2s;
                ">
          ${emotion.emoji}
        </button>
      `
    }).join('')

    return `
      <div class="emotion-panel-compact" style="
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        padding:8px;
        background:var(--bg-secondary,#2a2a3e);
        border-radius:var(--radius-lg,8px);
      ">
        ${buttons}
      </div>
    `
  }

  attachEvents() {
    this.container.querySelectorAll('.emotion-panel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emotionId = e.currentTarget.dataset.emotion
        this.selectEmotion(emotionId)
      })

      btn.addEventListener('mouseenter', (e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.borderColor = 'var(--primary,#8b5cf6)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }
      })

      btn.addEventListener('mouseleave', (e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.borderColor = 'var(--border,#3a3a5e)'
          e.currentTarget.style.transform = 'scale(1)'
        }
      })
    })
  }

  selectEmotion(emotionId) {
    const config = emotionConfigs[emotionId]
    if (!config) return

    this.currentEmotion = emotionId

    this.container.querySelectorAll('.emotion-panel-btn').forEach(btn => {
      const isActive = btn.dataset.emotion === emotionId
      btn.classList.toggle('active', isActive)
      btn.style.borderColor = isActive ? 'var(--primary,#8b5cf6)' : 'var(--border,#3a3a5e)'
      btn.style.transform = isActive ? 'scale(1)' : 'scale(1)'
    })

    const infoEl = this.container.querySelector('.emotion-panel-info')
    if (infoEl) {
      const nameEl = infoEl.querySelector('.current-emotion-name')
      const emojiEl = infoEl.querySelector('.current-emotion-emoji')
      if (nameEl) nameEl.textContent = config.name
      if (emojiEl) emojiEl.textContent = config.emoji
    }

    if (this.options.onChange) {
      this.options.onChange(emotionId, config)
    }

    this.emotionCallbacks.forEach(cb => cb(emotionId, config))
  }

  setEmotion(emotionId) {
    if (emotionConfigs[emotionId]) {
      this.selectEmotion(emotionId)
    }
  }

  getCurrentEmotion() {
    return this.currentEmotion
  }

  onEmotionChange(callback) {
    if (typeof callback === 'function') {
      this.emotionCallbacks.push(callback)
    }
  }

  dispose() {
    this.emotionCallbacks = []
    this.container.innerHTML = ''
  }
}

export function createEmotionPanel(container, options) {
  const panel = new EmotionPanel(container, options)
  panel.init()
  return panel
}
