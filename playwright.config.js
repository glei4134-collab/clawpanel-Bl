/**
 * Playwright 测试配置
 * 
 * 使用方法：
 * 1. 安装 Playwright: npm install -D @playwright/test
 * 2. 运行测试: npx playwright test tests/multi-window.test.js
 * 3. 跨浏览器测试: npx playwright test --project=chromium
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.js',
  timeout: 60000,
  retries: 2,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--disable-web-security']
    }
  },
  webServer: {
    command: 'npm run dev',
    port: 1420,
    timeout: 120000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
});
