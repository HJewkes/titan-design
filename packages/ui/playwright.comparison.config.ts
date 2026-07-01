import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './specimen',
  testMatch: '**/*.visual.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5200',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1200, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'pnpm specimen --port 5200',
    port: 5200,
    reuseExistingServer: true,
    timeout: 60000,
  },
})
