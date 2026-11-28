import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure', screenshot: 'only-on-failure',

  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined } } },
    ...(process.env.PLAYWRIGHT_CROSS_BROWSER ? [
      // Concurrent Firefox Axe scans can crash the page. Keep every check,
      // but run one Firefox worker; Chromium/WebKit keep the shared limit.
      {name:'firefox',workers:1,use:{...devices['Desktop Firefox']}},
      {name:'webkit',use:{...devices['Desktop Safari']}},
    ] : []),
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-only-public-key' },
  },
});
