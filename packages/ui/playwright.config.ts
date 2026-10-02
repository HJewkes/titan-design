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
  // Same floor as the Layer-1 baseline config: see playwright.baseline.config.ts.
  expect: {
    toHaveScreenshot: {
      threshold: 0.02,
      maxDiffPixels: 0,
    },
  },
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
    // Behaviour and keyboard tests for stories tagged `interaction`; they assert, never screenshot.
    {
      name: 'interaction',
      testDir: './tests/interaction',
      outputDir: './tests/interaction/results',
      // One worker: parallel first loads of the dev server made the scroll timings flaky.
      fullyParallel: false,
      workers: 1,
      timeout: 60_000,
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
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
