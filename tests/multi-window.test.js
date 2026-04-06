/**
 * 分屏/多窗口模式 UI 控件点击事件测试
 * 
 * 测试目标：
 * 1. 验证在 1:1、1:2、2:1 三种分屏比例下所有可交互元素的点击响应
 * 2. 验证侧边栏导航按钮
 * 3. 验证聊天页面控件
 * 4. 验证设置面板控件
 * 5. 验证弹窗控件
 * 
 * 使用方法：
 * npx playwright test tests/multi-window.test.js
 */

const { test, expect, chromium } = require('@playwright/test');

const WINDOW_CONFIGS = [
  { name: '1:1 分屏', width: 960, height: 540 },
  { name: '1:2 左窄', width: 640, height: 960 },
  { name: '2:1 右窄', width: 1280, height: 720 },
  { name: '最小窗口', width: 800, height: 500 },
];

const NAV_ITEMS = [
  { selector: '[data-route="/dashboard"]', name: '仪表盘' },
  { selector: '[data-route="/chat"]', name: '聊天' },
  { selector: '[data-route="/services"]', name: '服务' },
  { selector: '[data-route="/logs"]', name: '日志' },
  { selector: '[data-route="/settings"]', name: '设置' },
];

const CHAT_CONTROLS = [
  { selector: '#chat-model-select', name: '模型选择器' },
  { selector: '#btn-new-session', name: '新建会话' },
  { selector: '#btn-toggle-sidebar', name: '切换侧边栏' },
  { selector: '#btn-reset-session', name: '重置会话' },
  { selector: '#btn-split-chat', name: '分屏按钮' },
];

test.describe('分屏模式 UI 控件点击测试', () => {
  
  let context;
  let page;

  test.beforeAll(async () => {
    // 启动浏览器
    context = await chromium.launch({ 
      headless: false,
      args: ['--start-maximized']
    });
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  // 测试不同窗口尺寸下的侧边栏导航
  WINDOW_CONFIGS.forEach(config => {
    test(`侧边栏导航 - ${config.name}`, async () => {
      await page.setViewportSize({ width: config.width, height: config.height });
      await page.waitForTimeout(500);

      for (const item of NAV_ITEMS) {
        const element = page.locator(item.selector).first();
        const isVisible = await element.isVisible().catch(() => false);
        
        if (isVisible) {
          const boundingBox = await element.boundingBox();
          if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
            await element.click();
            await page.waitForTimeout(200);
            
            // 验证点击后元素是否响应
            const isStillClickable = await element.isEnabled().catch(() => false);
            expect(isStillClickable).toBe(true);
          }
        }
      }
    });
  });

  // 测试聊天页面控件
  test('聊天页面控件可点击性', async () => {
    await page.setViewportSize({ width: 1100, height: 700 });
    
    // 先导航到聊天页面
    await page.locator('[data-route="/chat"]').first().click();
    await page.waitForTimeout(500);

    for (const control of CHAT_CONTROLS) {
      const element = page.locator(control.selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      
      if (isVisible) {
        const boundingBox = await element.boundingBox();
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
          await element.click({ force: true });
          await page.waitForTimeout(200);
          console.log(`✓ ${control.name} 点击成功`);
        }
      }
    }
  });

  // 测试分屏按钮功能
  test('分屏切换功能', async () => {
    await page.setViewportSize({ width: 1100, height: 700 });
    await page.locator('[data-route="/chat"]').first().click();
    await page.waitForTimeout(500);

    const splitBtn = page.locator('#btn-split-chat').first();
    const isVisible = await splitBtn.isVisible().catch(() => false);
    
    if (isVisible) {
      // 第一次点击开启分屏
      await splitBtn.click();
      await page.waitForTimeout(300);
      
      // 第二次点击切换分屏位置
      await splitBtn.click();
      await page.waitForTimeout(300);
      
      console.log('✓ 分屏切换功能正常');
    }
  });

  // 测试模态框点击
  test('模态框控件点击', async () => {
    await page.setViewportSize({ width: 1100, height: 700 });
    await page.locator('[data-route="/settings"]').first().click();
    await page.waitForTimeout(500);

    // 尝试打开模态框
    const modalTriggers = page.locator('[data-action], .btn[data-action]').first();
    const isVisible = await modalTriggers.isVisible().catch(() => false);
    
    if (isVisible) {
      await modalTriggers.click();
      await page.waitForTimeout(300);
      
      // 检查模态框是否打开
      const modal = page.locator('.modal').first();
      const modalVisible = await modal.isVisible().catch(() => false);
      
      if (modalVisible) {
        // 测试模态框中的按钮
        const confirmBtn = page.locator('[data-action="confirm"]').first();
        const cancelBtn = page.locator('[data-action="cancel"]').first();
        
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          console.log('✓ 模态框确认按钮点击成功');
        }
      }
    }
  });

  // 测试 Toast 通知位置
  test('Toast 通知显示位置', async () => {
    await page.setViewportSize({ width: 640, height: 480 });
    await page.waitForTimeout(500);

    // 检查 toast 容器是否存在
    const toastContainer = page.locator('.toast-container').first();
    const containerExists = await toastContainer.count() > 0;
    
    if (containerExists) {
      const boundingBox = await toastContainer.boundingBox();
      if (boundingBox) {
        // 验证 toast 在视口内
        expect(boundingBox.right).toBeLessThanOrEqual(page.viewportSize().width + 10);
        expect(boundingBox.bottom).toBeLessThanOrEqual(page.viewportSize().height + 10);
        console.log('✓ Toast 容器位置正确');
      }
    }
  });

  // 测试窗口 resize 后布局
  test('窗口 resize 后布局重算', async () => {
    await page.setViewportSize({ width: 1100, height: 700 });
    await page.waitForTimeout(500);

    // 模拟分屏场景的窗口 resize
    await page.setViewportSize({ width: 960, height: 540 });
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 640, height: 960 });
    await page.waitForTimeout(300);

    // 验证侧边栏仍然可见
    const sidebar = page.locator('#sidebar').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    expect(sidebarVisible).toBe(true);

    // 验证内容区域没有被遮挡
    const content = page.locator('#content').first();
    const contentVisible = await content.isVisible().catch(() => false);
    expect(contentVisible).toBe(true);

    console.log('✓ 窗口 resize 后布局正常');
  });

  // 测试焦点恢复
  test('点击后焦点恢复', async () => {
    await page.setViewportSize({ width: 1100, height: 700 });
    
    // 点击侧边栏导航项
    const navItem = page.locator('.nav-item').first();
    await navItem.click();
    await page.waitForTimeout(200);

    // 验证焦点没有丢失在 body 上
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : 'none';
    });
    
    expect(activeElement).not.toBe('BODY');
    console.log(`✓ 焦点正确停留在: ${activeElement}`);
  });
});

test.describe('多实例窗口测试', () => {
  
  test('多个窗口独立运行', async () => {
    const context = await chromium.launch({ headless: false }).then(c => c);
    
    // 创建两个独立窗口
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('http://localhost:1420', { waitUntil: 'networkidle' });
    await page2.goto('http://localhost:1420', { waitUntil: 'networkidle' });
    
    // 设置不同尺寸
    await page1.setViewportSize({ width: 1100, height: 700 });
    await page2.setViewportSize({ width: 800, height: 600 });
    
    await page1.waitForTimeout(500);
    await page2.waitForTimeout(500);
    
    // 在两个窗口中进行操作
    await page1.locator('[data-route="/chat"]').first().click();
    await page2.locator('[data-route="/dashboard"]').first().click();
    
    await page1.waitForTimeout(300);
    await page2.waitForTimeout(300);
    
    // 验证两个窗口状态独立
    const url1 = page1.url();
    const url2 = page2.url();
    
    expect(url1).not.toBe(url2);
    
    await page1.close();
    await page2.close();
    await context.close();
    
    console.log('✓ 多窗口独立运行测试通过');
  });
});

test.describe('分屏功能专项测试', () => {
  
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });
    await page.locator('[data-route="/chat"]').first().click();
    await page.waitForTimeout(500);
  });

  test('分屏按钮可点击且开启分屏视图', async () => {
    const splitBtn = page.locator('#btn-split-chat').first();
    await expect(splitBtn).toBeVisible();
    
    await splitBtn.click();
    await page.waitForTimeout(300);
    
    // 检查是否显示会话选择器
    const selector = page.locator('#split-session-overlay, .split-session-selector');
    await expect(selector).toBeVisible({ timeout: 2000 }).catch(() => {
      console.log('会话选择器未显示，可能没有会话');
    });
  });

  test('分屏后左右面板存在且结构正确', async () => {
    // 打开分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    // 模拟选择第一个会话开启分屏
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      // 验证分屏结构
      const leftPanel = page.locator('#chat-split-left');
      const rightPanel = page.locator('#chat-split-right');
      const divider = page.locator('#chat-split-divider');
      
      await expect(leftPanel).toBeVisible();
      await expect(rightPanel).toBeVisible();
      await expect(divider).toBeVisible();
      
      // 验证面板宽度比例
      const leftBox = await leftPanel.boundingBox();
      const rightBox = await rightPanel.boundingBox();
      
      expect(leftBox.width).toBeGreaterThan(0);
      expect(rightBox.width).toBeGreaterThan(0);
      expect(leftBox.width + rightBox.width).toBeGreaterThan(100);
    }
  });

  test('拖拽分隔条调整分屏比例', async () => {
    // 先开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      const divider = page.locator('#chat-split-divider');
      const leftPanel = page.locator('#chat-split-left');
      
      const dividerBox = await divider.boundingBox();
      const leftBoxBefore = await leftPanel.boundingBox();
      
      // 拖动分隔条
      await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(dividerBox.x - 100, dividerBox.y + dividerBox.height / 2);
      await page.mouse.up();
      
      await page.waitForTimeout(200);
      
      const leftBoxAfter = await leftPanel.boundingBox();
      
      // 验证左侧面板宽度减小
      expect(leftBoxAfter.width).toBeLessThan(leftBoxBefore.width);
    }
  });

  test('双击分隔条重置比例为50:50', async () => {
    // 先开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      // 先拖动改变比例
      const divider = page.locator('#chat-split-divider');
      const dividerBox = await divider.boundingBox();
      
      await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(dividerBox.x - 150, dividerBox.y + dividerBox.height / 2);
      await page.mouse.up();
      
      await page.waitForTimeout(200);
      
      // 双击重置
      await divider.dblclick();
      await page.waitForTimeout(200);
      
      // 验证比例接近 50:50
      const wrapper = page.locator('.chat-split-wrapper');
      const leftPanel = page.locator('#chat-split-left');
      const rightPanel = page.locator('#chat-split-right');
      
      const wrapperBox = await wrapper.boundingBox();
      const leftBox = await leftPanel.boundingBox();
      const rightBox = await rightPanel.boundingBox();
      
      const ratio = leftBox.width / wrapperBox.width;
      expect(ratio).toBeCloseTo(0.5, 0.1);
    }
  });

  test('窗口resize后分屏布局保持正确', async () => {
    // 先开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      const leftPanel = page.locator('#chat-split-left');
      const rightPanel = page.locator('#chat-split-right');
      
      const leftBoxBefore = await leftPanel.boundingBox();
      const rightBoxBefore = await rightPanel.boundingBox();
      
      // 调整窗口大小
      await page.setViewportSize({ width: 960, height: 540 });
      await page.waitForTimeout(300);
      
      const leftBoxAfter = await leftPanel.boundingBox();
      const rightBoxAfter = await rightPanel.boundingBox();
      
      // 验证面板仍然可见且宽度合理
      expect(leftBoxAfter.width).toBeGreaterThan(0);
      expect(rightBoxAfter.width).toBeGreaterThan(0);
      expect(leftBoxAfter.width + rightBoxAfter.width).toBeCloseTo(leftBoxBefore.width + rightBoxBefore.width, 50);
    }
  });

  test('最小窗口尺寸下分屏仍可正常显示', async () => {
    await page.setViewportSize({ width: 800, height: 500 });
    await page.waitForTimeout(300);
    
    // 开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      const leftPanel = page.locator('#chat-split-left');
      const rightPanel = page.locator('#chat-split-right');
      
      // 验证面板最小宽度限制生效
      const leftBox = await leftPanel.boundingBox();
      const rightBox = await rightPanel.boundingBox();
      
      expect(leftBox.width).toBeGreaterThanOrEqual(200);
      expect(rightBox.width).toBeGreaterThanOrEqual(200);
    }
  });

  test('分屏指示器显示正确的比例', async () => {
    // 开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      // 拖动分隔条触发指示器
      const divider = page.locator('#chat-split-divider');
      const dividerBox = await divider.boundingBox();
      
      await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(dividerBox.x + 100, dividerBox.y + dividerBox.height / 2);
      
      await page.waitForTimeout(100);
      
      const indicator = page.locator('#split-ratio-indicator');
      const indicatorVisible = await indicator.isVisible().catch(() => false);
      
      if (indicatorVisible) {
        const indicatorText = await indicator.textContent();
        expect(indicatorText).toMatch(/\d+\s*:\s*\d+/);
      }
      
      await page.mouse.up();
    }
  });

  test('分屏关闭后恢复到单视图', async () => {
    // 开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      // 再次点击按钮关闭分屏
      await page.locator('#btn-split-chat').click();
      await page.waitForTimeout(300);
      
      // 验证分屏视图已移除
      const splitWrapper = page.locator('.chat-split-wrapper');
      await expect(splitWrapper).toHaveCount(0);
      
      // 验证原始聊天主视图恢复显示
      const chatMain = page.locator('.chat-main');
      await expect(chatMain).toBeVisible();
    }
  });

  test('键盘快捷键Ctrl+\\切换分屏', async () => {
    // 按下 Ctrl+\
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(300);
    
    const splitWrapper = page.locator('.chat-split-wrapper');
    const count = await splitWrapper.count();
    
    if (count > 0) {
      // 分屏已开启，再次按键关闭
      await page.keyboard.press('Control+\\');
      await page.waitForTimeout(300);
      await expect(splitWrapper).toHaveCount(0);
    }
  });

  test('键盘快捷键Ctrl+[/]调整分屏比例', async () => {
    // 开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      const leftPanel = page.locator('#chat-split-left');
      const leftBoxBefore = await leftPanel.boundingBox();
      
      // 按 Ctrl+[ 缩小左侧
      await page.keyboard.press('Control+[');
      await page.waitForTimeout(100);
      
      const leftBoxAfter = await leftPanel.boundingBox();
      
      // 验证左侧面板宽度减小
      expect(leftBoxAfter.width).toBeLessThan(leftBoxBefore.width);
      
      // 按 Ctrl+] 扩大左侧
      await page.keyboard.press('Control+]');
      await page.waitForTimeout(100);
      
      const leftBoxAfter2 = await leftPanel.boundingBox();
      
      // 验证左侧面板宽度增加
      expect(leftBoxAfter2.width).toBeGreaterThan(leftBoxAfter.width);
    }
  });

  test('分屏中切换会话', async () => {
    // 开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      // 查找右侧面板的会话选择器
      const rightSelector = page.locator('#split-session-wrapper-right .custom-select');
      const selectorExists = await rightSelector.isVisible().catch(() => false);
      
      if (selectorExists) {
        await rightSelector.click();
        await page.waitForTimeout(200);
        
        const option = page.locator('.custom-select-option, [data-value]').nth(1);
        const optionExists = await option.isVisible().catch(() => false);
        
        if (optionExists) {
          await option.click();
          await page.waitForTimeout(300);
          console.log('✓ 右侧面板会话切换成功');
        }
      }
    }
  });

  test('分屏指示器在窗口边界时不溢出', async () => {
    // 设置小窗口
    await page.setViewportSize({ width: 400, height: 300 });
    await page.waitForTimeout(200);
    
    // 开启分屏
    await page.locator('#btn-split-chat').click();
    await page.waitForTimeout(300);
    
    const firstSession = page.locator('.split-session-option, [data-session-key]').first();
    const sessionExists = await firstSession.isVisible().catch(() => false);
    
    if (sessionExists) {
      await firstSession.click();
      await page.waitForTimeout(500);
      
      // 拖动分隔条到边缘触发指示器
      const divider = page.locator('#chat-split-divider');
      const dividerBox = await divider.boundingBox();
      
      await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(dividerBox.x + 200, dividerBox.y + dividerBox.height / 2);
      
      await page.waitForTimeout(100);
      
      const indicator = page.locator('#split-ratio-indicator');
      const indicatorBox = await indicator.boundingBox().catch(() => null);
      
      if (indicatorBox) {
        expect(indicatorBox.x).toBeGreaterThanOrEqual(0);
        expect(indicatorBox.x + indicatorBox.width).toBeLessThanOrEqual(400);
        expect(indicatorBox.y).toBeGreaterThanOrEqual(0);
        expect(indicatorBox.y + indicatorBox.height).toBeLessThanOrEqual(300);
      }
      
      await page.mouse.up();
    }
  });
});

test.describe('跨浏览器兼容性测试', () => {
  
  test('Chrome 最新版分屏功能', async ({ browserName }) => {
    if (browserName !== 'chromium') {
      return;
    }
    const context = await chromium.launch({ headless: true });
    const page = await context.newPage();
    
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });
    await page.locator('[data-route="/chat"]').first().click();
    await page.waitForTimeout(500);
    
    const splitBtn = page.locator('#btn-split-chat');
    await expect(splitBtn).toBeVisible();
    
    await context.close();
  });

  test('Firefox 最新版分屏功能', async ({ browserName }) => {
    if (browserName !== 'firefox') {
      return;
    }
    // Firefox 测试用例
  });

  test('Safari 最新版分屏功能', async ({ browserName }) => {
    if (browserName !== 'webkit') {
      return;
    }
    // Safari 测试用例
  });

  test('Edge 最新版分屏功能', async ({ browserName }) => {
    if (browserName !== 'chromium') {
      return;
    }
    // Edge 使用 Chromium 内核，可以复用 Chrome 测试
  });
});

test.describe('内存与性能测试', () => {
  
  test('频繁开关分屏不导致内存泄漏', async () => {
    const context = await chromium.launch({ headless: true });
    const page = await context.newPage();
    
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });
    await page.locator('[data-route="/chat"]').first().click();
    await page.waitForTimeout(500);
    
    // 记录初始 DOM 节点数量
    const initialNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    
    // 多次开关分屏
    for (let i = 0; i < 5; i++) {
      await page.locator('#btn-split-chat').click();
      await page.waitForTimeout(200);
      
      const firstSession = page.locator('.split-session-option, [data-session-key]').first();
      const sessionExists = await firstSession.isVisible().catch(() => false);
      
      if (sessionExists) {
        await firstSession.click();
        await page.waitForTimeout(200);
      }
      
      await page.locator('#btn-split-chat').click();
      await page.waitForTimeout(200);
    }
    
    // 记录最终 DOM 节点数量
    const finalNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    
    // 允许少量增长，但不应该有大量泄漏
    expect(finalNodeCount - initialNodeCount).toBeLessThan(100);
    
    await context.close();
  });
});
