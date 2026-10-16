import { defineConfig } from '@playwright/test'

/**
 * D-35 audit-probe harness (TD-650). Each spec loads a static fixture with page.setContent and
 * installs the layout collector itself, so there is no web server.
 */
export default defineConfig({
  testDir: './tests/audit-probes',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
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
})
