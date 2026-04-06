/**
 * Avatar3D Demo 页面
 * 展示3D人偶组件的使用示例
 */

import { createAvatar3D, createEmotionPanel, EMOTIONS } from '../components/avatar-3d/index.js'

const AVAILABLE_MODELS = [
  { path: '/models/soldier-color.glb', name: '🎖️ 彩色士兵 ⭐推荐', size: '2MB', hasColor: true },
  { path: '/models/raccoon_head.glb', name: '🦝 浣熊头像 ⭐表情', size: '9MB', hasEmotion: true },
  { path: '/models/avatar-frog.glb', name: '🐸 青蛙', size: '20MB' },
  { path: '/models/avatar-elf.glb', name: '🧝 精灵', size: '36MB' },
  { path: '/models/avatar-robot.glb', name: '🤖 机器人', size: '44MB' },
  { path: '/models/avatar-armor.glb', name: '⚔️ 铠甲战士', size: '65MB' },
]

export function render() {
  const page = document.createElement('div')
  page.className = 'page'
  page.innerHTML = `
    <div class="page-header">
      <h1>🎭 3D人偶演示</h1>
      <p class="page-desc">基于Three.js的3D人偶组件，支持多模型选择、情绪切换、视角控制</p>
    </div>

    <div class="demo-grid">
      <div class="demo-section full-width">
        <h2>🎮 模型选择与预览</h2>
        <div class="model-selector">
          <label style="font-size:14px;color:var(--text-secondary);margin-bottom:8px;display:block">选择3D模型：</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${AVAILABLE_MODELS.map((m, i) => `
              <button class="model-btn ${i === 0 ? 'active' : ''}" data-path="${m.path}" data-index="${i}" style="
                padding:10px 16px;
                border:${i === 0 ? '2px solid var(--primary)' : '1px solid var(--border)'};
                border-radius:8px;
                background:var(--bg-secondary);
                color:var(--text-primary);
                cursor:pointer;
                font-size:13px;
                transition:all 0.2s;
              ">
                ${m.name} <span style="font-size:11px;color:var(--text-tertiary)">(${m.size})</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div id="avatar-demo-container" style="margin-top:16px"></div>
        <div class="demo-info" style="margin-top:16px">
          <p><strong>💡 提示：</strong>拖拽旋转 | 滚轮缩放 | 首次加载需下载模型，请耐心等待</p>
        </div>
      </div>

      <div class="demo-section">
        <h2>🎨 情绪控制</h2>
        <div id="emotion-panel-demo" style="margin-bottom:16px"></div>
        <div class="demo-info">
          <p><strong>当前情绪：</strong></p>
          <div id="current-emotion-display" style="
            display:flex;
            align-items:center;
            gap:12px;
            padding:16px;
            background:var(--bg-secondary);
            border-radius:8px;
          ">
            <span style="font-size:48px">😐</span>
            <div>
              <div style="font-size:20px;font-weight:600" id="emotion-name">中性</div>
              <div style="font-size:13px;color:var(--text-tertiary)" id="emotion-id">neutral</div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>⚡ 功能特性</h2>
        <div class="feature-grid">
          <div class="feature-item">
            <span class="feature-icon">🌐</span>
            <div>
              <h4>GLB/GLTF支持</h4>
              <p>主流3D格式，原生Three.js支持</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎭</span>
            <div>
              <h4>7种情绪切换</h4>
              <p>中性/开心/悲伤/愤怒/惊讶/恐惧/厌恶</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎬</span>
            <div>
              <h4>BlendShape动画</h4>
              <p>平滑的表情过渡动画</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📱</span>
            <div>
              <h4>移动端适配</h4>
              <p>自动优化渲染性能</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔧</span>
            <div>
              <h4>Draco压缩</h4>
              <p>减小模型体积，加快加载</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🖱️</span>
            <div>
              <h4>交互控制</h4>
              <p>鼠标拖拽/滚轮缩放</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>📚 API 使用</h2>
        <pre style="
          background:var(--bg-secondary);
          padding:16px;
          border-radius:8px;
          overflow-x:auto;
          font-size:12px;
          line-height:1.6;
        "><code>import { createAvatar3D, createEmotionPanel } from '../components/avatar-3d'

// 创建3D人偶
const avatar = createAvatar3D(container, {
  modelPath: '/models/avatar.glb',
  height: '400px',
  showEmotionPanel: true,
  onEmotionChange: (emotionId) => {
    console.log('情绪:', emotionId)
  },
  onLoad: () => console.log('加载完成'),
  onError: (err) => console.error(err)
})

// 切换情绪
avatar.setEmotion('happy')
avatar.setEmotion('sad')
avatar.reset()

// 缩放控制
avatar.zoom(0.5)
avatar.zoom(-0.5)

// 销毁组件
avatar.dispose()</code></pre>
      </div>
    </div>

    <style>
      .demo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
        gap: 24px;
        padding: 24px;
      }
      .demo-section {
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
      }
      .demo-section.full-width {
        grid-column: 1 / -1;
      }
      .demo-section h2 {
        font-size: 18px;
        margin-bottom: 16px;
        color: var(--text-primary);
      }
      .demo-info {
        font-size: 14px;
        color: var(--text-secondary);
      }
      .model-selector {
        margin-bottom: 8px;
      }
      .model-btn:hover {
        border-color: var(--primary) !important;
        transform: translateY(-2px);
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .feature-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 8px;
      }
      .feature-icon {
        font-size: 24px;
      }
      .feature-item h4 {
        font-size: 13px;
        margin-bottom: 4px;
      }
      .feature-item p {
        font-size: 11px;
        color: var(--text-tertiary);
        margin: 0;
      }
      .page-header h1 {
        font-size: 28px;
        margin-bottom: 8px;
      }
      .page-desc {
        color: var(--text-secondary);
        font-size: 14px;
      }
    </style>
  `

  let currentAvatar = null

  function loadModel(modelPath) {
    const container = page.querySelector('#avatar-demo-container')
    if (currentAvatar) {
      currentAvatar.dispose()
    }
    container.innerHTML = ''

    currentAvatar = createAvatar3D(container, {
      modelPath: modelPath,
      height: '400px',
      onEmotionChange: (emotionId) => {
        console.log('[Demo] 情绪切换:', emotionId)
      },
      onLoad: () => {
        console.log('[Demo] 模型加载完成:', modelPath)
      },
      onError: (error) => {
        console.error('[Demo] 加载失败:', error)
        container.innerHTML = `
          <div style="text-align:center;padding:40px;color:var(--error)">
            <p>❌ 模型加载失败</p>
            <p style="font-size:12px;color:var(--text-tertiary)">${error.message || "请检查模型文件是否存在"}</p>
          </div>
        `
      }
    })
  }

  setTimeout(() => {
    page.querySelectorAll('.model-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        page.querySelectorAll('.model-btn').forEach(b => {
          b.classList.remove('active')
          b.style.borderColor = 'var(--border)'
        })
        e.target.closest('.model-btn').classList.add('active')
        e.target.closest('.model-btn').style.borderColor = 'var(--primary)'
        loadModel(e.target.closest('.model-btn').dataset.path)
      })
    })

    loadModel(AVAILABLE_MODELS[0].path)

    const emotionPanelDemo = page.querySelector('#emotion-panel-demo')
    if (emotionPanelDemo) {
      createEmotionPanel(emotionPanelDemo, {
        showLabels: true,
        onChange: (emotionId, config) => {
          const nameEl = page.querySelector('#emotion-name')
          const idEl = page.querySelector('#emotion-id')
          if (nameEl) nameEl.textContent = config.name
          if (idEl) idEl.textContent = emotionId

          if (currentAvatar) {
            currentAvatar.setEmotion(emotionId)
          }
        }
      })
    }
  }, 100)

  return page
}

export function cleanup() {
}
