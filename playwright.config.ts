import { defineConfig, devices } from '@playwright/test';

// Testa o build de produção servido no MESMO base path do GitHub Pages (/icones-quiz/).
const PORT = 4173;
const localChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/icones-quiz/`,
    trace: 'retain-on-failure',
    launchOptions: localChromium ? { executablePath: localChromium } : {},
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 }, browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/icones-quiz/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
