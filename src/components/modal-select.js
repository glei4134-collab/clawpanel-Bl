/**
 * 弹窗选择组件
 * 用于替代复杂的 <select> 下拉框，提供更好的多选/搜索体验
 */

import { showContentModal } from './modal.js'

export function showModalSelect(options) {
  const {
    title = '选择',
    options: optionList = [],
    value = null,
    multiple = false,
    searchable = true,
    onchange = () => {}
  } = options

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : [])
    : (value !== null && value !== undefined ? [value] : [])

  const escapedOptions = optionList.map(opt => ({
    value: opt.value,
    label: opt.label || opt.value,
    disabled: opt.disabled || false
  }))

  let html = `
    <div class="modal-select-container" style="display:flex;flex-direction:column;max-height:60vh">
      ${searchable ? `
        <div style="margin-bottom:var(--space-sm)">
          <input class="form-input" id="modal-select-search" placeholder="搜索..." style="width:100%">
        </div>
      ` : ''}
      <div id="modal-select-list" style="flex:1;overflow-y:auto;max-height:50vh">
        ${escapedOptions.map(opt => `
          <label class="modal-select-item" data-value="${escapeAttr(opt.value)}" 
                 style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;${opt.disabled ? 'opacity:0.5;cursor:not-allowed' : ''}"
                 ${opt.disabled ? 'data-disabled="true"' : ''}>
            ${multiple ? `
              <input type="checkbox" class="modal-select-cb" value="${escapeAttr(opt.value)}" 
                     ${selectedValues.includes(opt.value) ? 'checked' : ''}
                     ${opt.disabled ? 'disabled' : ''}>
            ` : `
              <input type="radio" name="modal-select-radio" value="${escapeAttr(opt.value)}" 
                     ${selectedValues.includes(opt.value) ? 'checked' : ''}
                     ${opt.disabled ? 'disabled' : ''}>
            `}
            <span style="flex:1">${escapeHtml(opt.label)}</span>
          </label>
        `).join('')}
      </div>
      <div id="modal-select-empty" style="display:none;text-align:center;padding:var(--space-md);color:var(--text-tertiary)">
        无匹配结果
      </div>
    </div>
    <style>
      .modal-select-item:hover:not([data-disabled="true"]) {
        background: var(--bg-hover);
      }
      .modal-select-item.selected {
        background: var(--accent-muted);
      }
    </style>
  `

  const modal = showContentModal({
    title,
    content: html,
    buttons: [
      { label: '取消', className: 'btn btn-secondary', id: 'modal-select-cancel' },
      { label: multiple ? '确定' : '选择', className: 'btn btn-primary', id: 'modal-select-confirm' }
    ],
    width: 400
  })

  const list = modal.querySelector('#modal-select-list')
  const searchInput = modal.querySelector('#modal-select-search')
  const emptyMsg = modal.querySelector('#modal-select-empty')

  function updateSelection() {
    modal.querySelectorAll('.modal-select-item').forEach(item => {
      const input = item.querySelector('input')
      if (input.checked) {
        item.classList.add('selected')
      } else {
        item.classList.remove('selected')
      }
    })
  }

  function filterItems(query) {
    const lowerQuery = query.toLowerCase()
    let visibleCount = 0
    modal.querySelectorAll('.modal-select-item').forEach(item => {
      const label = item.querySelector('span').textContent.toLowerCase()
      const value = item.dataset.value.toLowerCase()
      const match = label.includes(lowerQuery) || value.includes(lowerQuery)
      item.style.display = match ? '' : 'none'
      if (match) visibleCount++
    })
    emptyMsg.style.display = visibleCount === 0 ? '' : 'none'
  }

  function getSelectedValues() {
    if (multiple) {
      return Array.from(modal.querySelectorAll('.modal-select-cb:checked')).map(cb => cb.value)
    } else {
      const checked = modal.querySelector('.modal-select-cb:checked, .modal-select-radio:checked')
      return checked ? checked.value : null
    }
  }

  // 绑定事件
  modal.querySelectorAll('.modal-select-item input').forEach(input => {
    input.addEventListener('change', updateSelection)
  })

  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterItems(e.target.value))
  }

  modal.querySelector('#modal-select-confirm').addEventListener('click', () => {
    const selected = getSelectedValues()
    modal.close()
    onchange(multiple ? selected : selected)
  })

  modal.querySelector('#modal-select-cancel').addEventListener('click', () => {
    modal.close()
  })

  return modal
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;')
}

// 辅助函数：创建触发器按钮（点击后弹出选择）
export function createModalSelectTrigger(options) {
  const {
    options: optionList = [],
    value = null,
    placeholder = '请选择...',
    onchange = () => {}
  } = options

  const selectedOption = optionList.find(opt => opt.value === value)
  const displayText = selectedOption ? selectedOption.label : placeholder

  const container = document.createElement('div')
  container.className = 'modal-select-trigger'
  container.innerHTML = `
    <button class="btn btn-secondary" style="min-width:150px;justify-content:space-between">
      <span class="modal-select-text">${escapeHtml(displayText)}</span>
      <span style="opacity:0.5">▼</span>
    </button>
  `

  container.querySelector('button').addEventListener('click', () => {
    showModalSelect({
      title: options.title || '选择',
      options: optionList,
      value: value,
      onchange: (selected) => {
        const opt = optionList.find(o => o.value === selected)
        container.querySelector('.modal-select-text').textContent = opt ? opt.label : placeholder
        onchange(selected)
      }
    })
  })

  return container
}
