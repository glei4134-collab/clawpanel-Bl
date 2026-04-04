/**
 * 自定义下拉选择组件
 * 可替代原生 select，支持毛玻璃等美化效果和滚轮选择
 */

export function createCustomSelect(options, {
  value = '',
  placeholder = '请选择',
  onchange = null,
  className = ''
} = {}) {
  const container = document.createElement('div')
  container.className = `custom-select ${className}`
  
  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.className = 'custom-select-trigger'
  trigger.innerHTML = `<span class="custom-select-value">${placeholder}</span><span class="custom-select-arrow">▼</span>`
  
  const dropdown = document.createElement('div')
  dropdown.className = 'custom-select-dropdown'
  
  const list = document.createElement('div')
  list.className = 'custom-select-list'
  
  let currentValue = value
  let selectedIndex = options.findIndex(o => o.value === currentValue)
  let wheelTimeout = null
  let isScrolling = false
  
  function updateDisplay() {
    const selected = options.find(o => o.value === currentValue)
    trigger.querySelector('.custom-select-value').textContent = selected ? selected.label : placeholder
    selectedIndex = options.findIndex(o => o.value === currentValue)
  }
  
  function scrollToSelected() {
    const selectedItem = list.querySelector('.custom-select-item.selected')
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }
  
  function renderOptions() {
    list.innerHTML = ''
    options.forEach((opt, idx) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = `custom-select-item ${opt.value === currentValue ? 'selected' : ''}`
      item.innerHTML = `
        <span>${opt.icon || ''}${opt.label}</span>
        ${opt.badge ? `<span class="custom-select-badge">${opt.badge}</span>` : ''}
      `
      item.dataset.index = idx
      item.onclick = () => {
        currentValue = opt.value
        selectedIndex = idx
        updateDisplay()
        dropdown.classList.remove('open')
        trigger.classList.remove('open')
        if (onchange) onchange(currentValue, opt)
      }
      list.appendChild(item)
    })
  }
  
  // 滚轮支持 - 在下拉列表上滚动时切换选项
  dropdown.addEventListener('wheel', (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!dropdown.classList.contains('open')) return
    
    isScrolling = true
    clearTimeout(wheelTimeout)
    
    const direction = e.deltaY > 0 ? 1 : -1
    let newIndex = selectedIndex + direction
    
    if (newIndex < 0) newIndex = 0
    if (newIndex >= options.length) newIndex = options.length - 1
    
    if (newIndex !== selectedIndex) {
      selectedIndex = newIndex
      currentValue = options[newIndex].value
      
      // 更新显示但不关闭下拉
      updateDisplay()
      renderOptions()
      scrollToSelected()
      
      // 高亮当前项
      const items = list.querySelectorAll('.custom-select-item')
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedIndex)
        if (i === selectedIndex) item.classList.add('highlighted')
        else item.classList.remove('highlighted')
      })
    }
    
    // 滚动停止后清除高亮
    wheelTimeout = setTimeout(() => {
      isScrolling = false
      const items = list.querySelectorAll('.custom-select-item')
      items.forEach(item => item.classList.remove('highlighted'))
    }, 300)
  }, { passive: false })
  
  trigger.onclick = (e) => {
    e.stopPropagation()
    const isOpen = dropdown.classList.contains('open')
    document.querySelectorAll('.custom-select-dropdown.open').forEach(d => {
      d.classList.remove('open')
      d.closest('.custom-select')?.querySelector('.custom-select-trigger')?.classList.remove('open')
    })
    if (!isOpen) {
      dropdown.classList.add('open')
      trigger.classList.add('open')
      renderOptions()
      setTimeout(scrollToSelected, 50)
    }
  }
  
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      dropdown.classList.remove('open')
      trigger.classList.remove('open')
    }
  })
  
  dropdown.appendChild(list)
  container.appendChild(trigger)
  container.appendChild(dropdown)
  
  updateDisplay()
  renderOptions()
  
  return {
    container,
    trigger,
    dropdown,
    getValue: () => currentValue,
    setValue: (val) => {
      currentValue = val
      selectedIndex = options.findIndex(o => o.value === val)
      updateDisplay()
      renderOptions()
    },
    refresh: () => renderOptions()
  }
}
