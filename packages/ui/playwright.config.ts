import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  outputDir: './tests/visual/results',
  snapshotDir: './tests/visual/reference',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // The story-baseline suite is one test looping over every in-scope story
  // (goto + networkidle + screenshot each), so its runtime scales with the
  // story count. Give it well past the 30s default as the shell family grows.
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:6006',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'pnpm storybook --ci',
    port: 6006,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
