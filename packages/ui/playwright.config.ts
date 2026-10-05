import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defineConfig } from '@playwright/test'

// Outside Storybook's watched root: trace files written inside it make Vite reload the page mid-test.
const INTERACTION_OUTPUT_DIR = join(tmpdir(), 'titan-ui-playwright-interaction')

export default defineConfig({
  testDir: './tests/visual',
  outputDir: './tests/visual/results',
  snapshotDir: './tests/visual/reference',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // stories.spec.ts declares one test per story from the index this writes.
  globalSetup: './tests/visual/story-index.global-setup.ts',
  workers: 4,
  timeout: 30_000,
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
      outputDir: INTERACTION_OUTPUT_DIR,
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
    reuseExistingServer: false,
    timeout: 120000,
    env: { DEBUG: 'vite:deps' },
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
