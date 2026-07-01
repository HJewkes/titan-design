import { defineConfig } from '@playwright/test'

/**
 * Token-resolution harness (TD-05.03). Mirrors playwright.comparison.config.ts
 * but targets only `token-resolution.spec.ts`, served by the same specimen dev
 * server.
 */
export default defineConfig({
  testDir: './specimen',
  testMatch: '**/token-resolution.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5200',
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
