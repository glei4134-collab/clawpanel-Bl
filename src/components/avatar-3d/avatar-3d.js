/**
 * Avatar3D 3D人偶组件
 * 集成Three.js渲染、情绪控制、交互功能
 */

import { AvatarScene } from '../../lib/3d/3d-loader.js'
import { EMOTIONS, emotionList } from '../../lib/3d/emotion-config.js'

export class Avatar3D {
  constructor(container, options = {}) {
    this.container = container
    this.options = {
      modelPath: options.modelPath || '/models/avatar.glb',
      width: options.width || '100%',
      height: options.height || '400px',
      showEmotionPanel: options.showEmotionPanel !== false,
      onEmotionChange: options.onEmotionChange || null,
      onLoad: options.onLoad || null,
      onProgress: options.onProgress || null,
      onError: options.onError || null
    }

    this.scene = null
    this.currentEmotion = EMOTIONS.NEUTRAL
    this.isLoading = false
    this.isLoaded = false
    this.loadProgress = 0
  }

  init() {
    this.render()
    this.setupScene()
  }

  render() {
    this.container.innerHTML = `
      <div class="avatar-3d-wrapper" style="position:relative;width:${this.options.width};height:${this.options.height}">
        <div class="avatar-3d-canvas" style="width:100%;height:100%;border-radius:var(--radius-lg,8px);overflow:hidden"></div>
        <div class="avatar-3d-loading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:16px">
          <div class="avatar-3d-spinner" style="
            width:48px;height:48px;
            border:3px solid var(--border,#3a3a5e);
            border-top-color:var(--primary,#8b5cf6);
            border-radius:50%;
            animation:spin 1s linear infinite;
          "></div>
          <div class="avatar-3d-loading-text" style="color:var(--text-secondary);font-size:14px">正在加载模型...</div>
          <div class="avatar-3d-progress-wrap" style="width:200px">
            <div class="avatar-3d-progress-bar" style="
              height:4px;
              background:var(--border,#3a3a5e);
              border-radius:2px;
              overflow:hidden;
            ">
              <div class="avatar-3d-progress-fill" style="
                height:100%;
                background:var(--primary,#8b5cf6);
                width:0%;
                transition:width 0.3s;
              "></div>
            </div>
            <div class="avatar-3d-progress-text" style="
              text-align:center;
              font-size:12px;
              color:var(--text-tertiary);
              margin-top:4px;
            ">0%</div>
          </div>
        </div>
        <div class="avatar-3d-error" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:none;text-align:center">
          <div style="font-size:32px;margin-bottom:8px">❌</div>
          <div style="color:var(--error,#ef4444);font-weight:600">加载失败</div>
          <div class="avatar-3d-error-msg" style="font-size:12px;margin-top:8px;color:var(--text-tertiary);max-width:300px"></div>
          <button class="avatar-3d-retry-btn" style="
            margin-top:16px;
            padding:8px 20px;
            background:var(--primary,#8b5cf6);
            color:white;
            border:none;
            border-radius:6px;
            cursor:pointer;
            font-size:13px;
          ">重新加载</button>
        </div>
        <div class="avatar-3d-controls" style="position:absolute;bottom:12px;left:12px;display:flex;gap:8px">
          <button class="avatar-3d-btn" data-action="reset" title="重置视角" style="
            width:36px;height:36px;
            border:1px solid var(--border);
            border-radius:8px;
            background:var(--bg-secondary);
            cursor:pointer;
            font-size:16px;
            display:flex;
            align-items:center;
            justify-content:center;
          ">🔄</button>
          <button class="avatar-3d-btn" data-action="zoom-in" title="放大" style="
            width:36px;height:36px;
            border:1px solid var(--border);
            border-radius:8px;
            background:var(--bg-secondary);
            cursor:pointer;
            font-size:16px;
            display:flex;
            align-items:center;
            justify-content:center;
          ">➕</button>
          <button class="avatar-3d-btn" data-action="zoom-out" title="缩小" style="
            width:36px;height:36px;
            border:1px solid var(--border);
            border-radius:8px;
            background:var(--bg-secondary);
            cursor:pointer;
            font-size:16px;
            display:flex;
            align-items:center;
            justify-content:center;
          ">➖</button>
        </div>
      </div>
      ${this.options.showEmotionPanel ? this.renderEmotionPanel() : ''}
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `

    this.canvasContainer = this.container.querySelector('.avatar-3d-canvas')
    this.loadingEl = this.container.querySelector('.avatar-3d-loading')
    this.progressFill = this.container.querySelector('.avatar-3d-progress-fill')
    this.progressText = this.container.querySelector('.avatar-3d-progress-text')
    this.loadingText = this.container.querySelector('.avatar-3d-loading-text')
    this.errorEl = this.container.querySelector('.avatar-3d-error')
    this.errorMsgEl = this.container.querySelector('.avatar-3d-error-msg')
    this.retryBtn = this.container.querySelector('.avatar-3d-retry-btn')

    this.container.querySelectorAll('.avatar-3d-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleControlClick(e))
    })

    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', () => this.retry())
    }

    if (this.options.showEmotionPanel) {
      this.container.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.handleEmotionClick(e))
      })
    }
  }

  renderEmotionPanel() {
    const buttons = emotionList.map(emotion => `
      <button class="emotion-btn ${emotion.id === EMOTIONS.NEUTRAL ? 'active' : ''}"
              data-emotion="${emotion.id}"
              title="${emotion.name}"
              style="
                width:48px;height:48px;
                font-size:24px;
                border:2px solid ${emotion.id === EMOTIONS.NEUTRAL ? 'var(--primary,#8b5cf6)' : 'transparent'};
                border-radius:50%;
                background:var(--bg-secondary,#2a2a3e);
                cursor:pointer;
                transition:all 0.2s;
              ">
        ${emotion.emoji}
      </button>
    `).join('')

    return `
      <div class="avatar-3d-emotion-panel" style="
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        padding:12px;
        background:var(--bg-secondary,#2a2a3e);
        border-radius:var(--radius-lg,8px);
        margin-top:12px;
        justify-content:center;
      ">
        ${buttons}
      </div>
    `
  }

  updateProgress(percent, loaded, total) {
    this.loadProgress = percent
    if (this.progressFill) {
      this.progressFill.style.width = percent + '%'
    }
    if (this.progressText) {
      const loadedMB = (loaded / 1024 / 1024).toFixed(1)
      const totalMB = (total / 1024 / 1024).toFixed(1)
      this.progressText.textContent = total > 0 ? `${percent}% (${loadedMB}/${totalMB}MB)` : '下载中...'
    }
    if (this.options.onProgress) {
      this.options.onProgress(percent, loaded, total)
    }
  }

  async setupScene() {
    this.loadingEl.style.display = 'flex'
    this.errorEl.style.display = 'none'
    this.isLoading = true

    try {
      this.scene = new AvatarScene(this.canvasContainer)
      this.scene.init()

      await this.scene.loadAvatar(this.options.modelPath, {
        onProgress: (percent, loaded, total) => {
          this.updateProgress(percent, loaded, total)
        }
      })

      this.loadingEl.style.display = 'none'
      this.isLoading = false
      this.isLoaded = true

      if (this.options.onLoad) {
        this.options.onLoad(this)
      }
    } catch (error) {
      console.error('[Avatar3D] 加载失败:', error)
      this.loadingEl.style.display = 'none'
      this.errorEl.style.display = 'block'
      this.errorMsgEl.textContent = error.message || '未知错误'
      this.isLoading = false

      if (this.options.onError) {
        this.options.onError(error)
      }
    }
  }

  retry() {
    this.errorEl.style.display = 'none'
    this.setupScene()
  }

  handleControlClick(e) {
    const action = e.currentTarget.dataset.action

    switch (action) {
      case 'reset':
        this.reset()
        break
      case 'zoom-in':
        this.zoom(0.5)
        break
      case 'zoom-out':
        this.zoom(-0.5)
        break
    }
  }

  handleEmotionClick(e) {
    const emotionId = e.currentTarget.dataset.emotion

    this.container.querySelectorAll('.emotion-btn').forEach(btn => {
      btn.classList.remove('active')
      btn.style.borderColor = 'transparent'
    })

    e.currentTarget.classList.add('active')
    e.currentTarget.style.borderColor = 'var(--primary,#8b5cf6)'

    this.setEmotion(emotionId)

    if (this.options.onEmotionChange) {
      this.options.onEmotionChange(emotionId)
    }
  }

  setEmotion(emotionId) {
    if (this.scene && this.isLoaded) {
      this.scene.setEmotion(emotionId)
      this.currentEmotion = emotionId
    }
  }

  reset() {
    this.setEmotion(EMOTIONS.NEUTRAL)

    this.container.querySelectorAll('.emotion-btn').forEach(btn => {
      btn.classList.remove('active')
      btn.style.borderColor = 'transparent'
    })

    const neutralBtn = this.container.querySelector(`[data-emotion="${EMOTIONS.NEUTRAL}"]`)
    if (neutralBtn) {
      neutralBtn.classList.add('active')
      neutralBtn.style.borderColor = 'var(--primary,#8b5cf6)'
    }
  }

  zoom(delta) {
    if (this.scene && this.scene.camera) {
      this.scene.camera.position.z = Math.max(1.5, Math.min(5, this.scene.camera.position.z + delta))
    }
  }

  dispose() {
    if (this.scene) {
      this.scene.dispose()
      this.scene = null
    }
    this.container.innerHTML = ''
    this.isLoaded = false
  }
}

export function createAvatar3D(container, options) {
  const avatar = new Avatar3D(container, options)
  avatar.init()
  return avatar
}
