/**
 * 分屏功能单元测试
 * 
 * 测试覆盖：
 * 1. setSplitRatio 边界值处理
 * 2. applySnap 吸附逻辑
 * 3. 比例计算精度
 * 4. localStorage 持久化
 */

describe('分屏功能单元测试', () => {
  
  describe('setSplitRatio 边界值处理', () => {
    
    function setSplitRatio(ratio) {
      return Math.max(0.2, Math.min(0.8, ratio))
    }
    
    test('小于最小值 0.2 应被限制到 0.2', () => {
      expect(setSplitRatio(0.1)).toBe(0.2)
      expect(setSplitRatio(0.0)).toBe(0.2)
      expect(setSplitRatio(-0.5)).toBe(0.2)
    })
    
    test('大于最大值 0.8 应被限制到 0.8', () => {
      expect(setSplitRatio(0.9)).toBe(0.8)
      expect(setSplitRatio(1.0)).toBe(0.8)
      expect(setSplitRatio(1.5)).toBe(0.8)
    })
    
    test('正常范围内的值应保持不变', () => {
      expect(setSplitRatio(0.5)).toBe(0.5)
      expect(setSplitRatio(0.3)).toBe(0.3)
      expect(setSplitRatio(0.7)).toBe(0.7)
    })
    
    test('边界值 0.2 和 0.8 应该有效', () => {
      expect(setSplitRatio(0.2)).toBe(0.2)
      expect(setSplitRatio(0.8)).toBe(0.8)
    })
  })
  
  describe('applySnap 吸附逻辑', () => {
    
    const SNAP_POINTS = [0.25, 0.5, 0.75]
    const SNAP_THRESHOLD = 0.03
    
    function applySnap(ratio) {
      for (const snap of SNAP_POINTS) {
        if (Math.abs(ratio - snap) < SNAP_THRESHOLD) {
          return snap
        }
      }
      return ratio
    }
    
    test('接近 0.25 的值应吸附到 0.25', () => {
      expect(applySnap(0.25)).toBe(0.25)
      expect(applySnap(0.24)).toBe(0.25)
      expect(applySnap(0.26)).toBe(0.25)
      expect(applySnap(0.27 - 0.001)).toBe(0.25)
    })
    
    test('接近 0.5 的值应吸附到 0.5', () => {
      expect(applySnap(0.5)).toBe(0.5)
      expect(applySnap(0.49)).toBe(0.5)
      expect(applySnap(0.51)).toBe(0.5)
    })
    
    test('接近 0.75 的值应吸附到 0.75', () => {
      expect(applySnap(0.75)).toBe(0.75)
      expect(applySnap(0.74)).toBe(0.75)
      expect(applySnap(0.76)).toBe(0.75)
    })
    
    test('不在吸附范围内的值应保持不变', () => {
      expect(applySnap(0.3)).toBe(0.3)
      expect(applySnap(0.6)).toBe(0.6)
      expect(applySnap(0.1)).toBe(0.1)
    })
    
    test('边界阈值外的值不应吸附', () => {
      expect(applySnap(0.23)).toBe(0.23)
      expect(applySnap(0.27)).toBe(0.27)
      expect(applySnap(0.48)).toBe(0.48)
      expect(applySnap(0.52)).toBe(0.52)
    })
  })
  
  describe('分屏比例计算', () => {
    
    function calculateRatio(dragStart, currentX, wrapperWidth, initialRatio) {
      const delta = currentX - dragStart
      return initialRatio + delta / wrapperWidth
    }
    
    test('向右拖动应增加比例', () => {
      const newRatio = calculateRatio(500, 600, 1000, 0.5)
      expect(newRatio).toBeCloseTo(0.6, 10)
    })
    
    test('向左拖动应减少比例', () => {
      const newRatio = calculateRatio(500, 400, 1000, 0.5)
      expect(newRatio).toBeCloseTo(0.4, 10)
    })
    
    test('未移动应保持原比例', () => {
      const newRatio = calculateRatio(500, 500, 1000, 0.5)
      expect(newRatio).toBeCloseTo(0.5, 10)
    })
    
    test('比例计算应与 wrapper 宽度成比例', () => {
      const smallWrapper = calculateRatio(100, 200, 200, 0.5)
      const largeWrapper = calculateRatio(500, 1000, 1000, 0.5)
      expect(smallWrapper).toBeCloseTo(largeWrapper, 10)
    })
  })
  
  describe('最小宽度限制', () => {
    
    function constrainWidth(width, minWidth = 200) {
      return Math.max(width, minWidth)
    }
    
    test('小于最小宽度的值应被限制', () => {
      expect(constrainWidth(100, 200)).toBe(200)
      expect(constrainWidth(150, 200)).toBe(200)
    })
    
    test('大于最小宽度的值应保持', () => {
      expect(constrainWidth(300, 200)).toBe(300)
      expect(constrainWidth(500, 200)).toBe(500)
    })
    
    test('等于最小宽度的值应保持', () => {
      expect(constrainWidth(200, 200)).toBe(200)
    })
  })
  
  describe('分屏指示器百分比计算', () => {
    
    function getIndicatorText(ratio) {
      const leftPercent = Math.round(ratio * 100)
      const rightPercent = 100 - leftPercent
      return `${leftPercent} : ${rightPercent}`
    }
    
    test('50:50 比例显示正确', () => {
      expect(getIndicatorText(0.5)).toBe('50 : 50')
    })
    
    test('80:20 比例显示正确', () => {
      expect(getIndicatorText(0.8)).toBe('80 : 20')
    })
    
    test('20:80 比例显示正确', () => {
      expect(getIndicatorText(0.2)).toBe('20 : 80')
    })
    
    test('25:75 比例显示正确', () => {
      expect(getIndicatorText(0.25)).toBe('25 : 75')
    })
    
    test('75:25 比例显示正确', () => {
      expect(getIndicatorText(0.75)).toBe('75 : 25')
    })
    
    test('百分比计算四舍五入正确', () => {
      expect(getIndicatorText(0.333)).toBe('33 : 67')
      expect(getIndicatorText(0.666)).toBe('67 : 33')
      expect(getIndicatorText(0.555)).toBe('56 : 44')
    })
  })
  
  describe('localStorage 持久化', () => {
    
    const STORAGE_KEY = 'clawpanel-split-ratio'
    
    beforeEach(() => {
      localStorage.clear()
    })
    
    test('保存比例到 localStorage', () => {
      const ratio = 0.5
      localStorage.setItem(STORAGE_KEY, String(ratio))
      expect(localStorage.getItem(STORAGE_KEY)).toBe('0.5')
    })
    
    test('从 localStorage 读取比例', () => {
      localStorage.setItem(STORAGE_KEY, '0.3')
      const savedRatio = parseFloat(localStorage.getItem(STORAGE_KEY))
      expect(savedRatio).toBe(0.3)
    })
    
    test('保存和读取多个分屏相关键', () => {
      localStorage.setItem('clawpanel-split-open', 'true')
      localStorage.setItem('clawpanel-split-key', 'session-123')
      localStorage.setItem('clawpanel-split-ratio', '0.6')
      
      expect(localStorage.getItem('clawpanel-split-open')).toBe('true')
      expect(localStorage.getItem('clawpanel-split-key')).toBe('session-123')
      expect(localStorage.getItem('clawpanel-split-ratio')).toBe('0.6')
    })
    
    test('删除分屏相关键', () => {
      localStorage.setItem('clawpanel-split-open', 'true')
      localStorage.setItem('clawpanel-split-key', 'session-123')
      localStorage.setItem('clawpanel-split-ratio', '0.5')
      
      localStorage.removeItem('clawpanel-split-open')
      localStorage.removeItem('clawpanel-split-key')
      localStorage.removeItem('clawpanel-split-ratio')
      
      expect(localStorage.getItem('clawpanel-split-open')).toBeNull()
      expect(localStorage.getItem('clawpanel-split-key')).toBeNull()
      expect(localStorage.getItem('clawpanel-split-ratio')).toBeNull()
    })
  })
  
  describe('窗口尺寸变化处理', () => {
    
    function adjustForMinWidth(leftWidth, rightWidth, minWidth = 200) {
      if (leftWidth < minWidth) {
        return { left: leftWidth, right: rightWidth + (minWidth - leftWidth) }
      }
      if (rightWidth < minWidth) {
        return { left: leftWidth + (minWidth - rightWidth), right: rightWidth }
      }
      return { left: leftWidth, right: rightWidth }
    }
    
    test('左侧过窄时补偿右侧', () => {
      const result = adjustForMinWidth(150, 400, 200)
      expect(result.left).toBe(200)
      expect(result.right).toBe(350)
    })
    
    test('右侧过窄时补偿左侧', () => {
      const result = adjustForMinWidth(400, 150, 200)
      expect(result.left).toBe(350)
      expect(result.right).toBe(200)
    })
    
    test('两侧都正常时不调整', () => {
      const result = adjustForMinWidth(400, 400, 200)
      expect(result.left).toBe(400)
      expect(result.right).toBe(400)
    })
    
    test('刚好等于最小宽度时不调整', () => {
      const result = adjustForMinWidth(200, 400, 200)
      expect(result.left).toBe(200)
      expect(result.right).toBe(400)
    })
  })
  
  describe('拖拽状态管理', () => {
    
    let isDragging = false
    let dragStart = 0
    let dragRatio = 0.5
    
    function startDrag(clientX, ratio) {
      isDragging = true
      dragStart = clientX
      dragRatio = ratio
    }
    
    function endDrag() {
      isDragging = false
      dragStart = 0
    }
    
    function isValidDragState() {
      return isDragging && dragStart >= 0 && dragRatio >= 0 && dragRatio <= 1
    }
    
    test('开始拖拽设置正确的状态', () => {
      startDrag(500, 0.5)
      expect(isDragging).toBe(true)
      expect(dragStart).toBe(500)
      expect(dragRatio).toBe(0.5)
    })
    
    test('结束拖拽重置状态', () => {
      startDrag(500, 0.5)
      endDrag()
      expect(isDragging).toBe(false)
      expect(dragStart).toBe(0)
    })
    
    test('拖拽状态有效性验证', () => {
      startDrag(500, 0.5)
      expect(isValidDragState()).toBe(true)
      
      endDrag()
      expect(isValidDragState()).toBe(false)
    })
    
    test('无效的初始比例应被拒绝', () => {
      expect(() => startDrag(500, 1.5)).toThrow()
      expect(() => startDrag(500, -0.5)).toThrow()
    })
  })
})
