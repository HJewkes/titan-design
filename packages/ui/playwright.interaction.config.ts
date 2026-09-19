import { defineConfig } from '@playwright/test'

// Behaviour and keyboard tests for stories tagged `interaction`, against a running Storybook.
// Not part of CI yet: run `STORYBOOK_URL=http://127.0.0.1:<port> pnpm test:interaction`.
export default defineConfig({
  testDir: './tests/interaction',
  outputDir: './tests/interaction/results',
  // One worker: parallel first loads of the dev server made the scroll timings flaky.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 } },
    },
  ],
})
