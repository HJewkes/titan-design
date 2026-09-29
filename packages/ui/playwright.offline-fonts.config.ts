import { defineConfig } from '@playwright/test'

/**
 * Offline-fonts harness (TD-36). The spec builds its own single-file consumer and
 * opens it over file://, so there is no web server.
 */
export default defineConfig({
  testDir: './tests/offline-fonts',
  testMatch: '**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120_000,
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
