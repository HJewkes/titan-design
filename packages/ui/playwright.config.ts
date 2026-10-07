import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defineConfig } from '@playwright/test'

// Outside Storybook's watched root: trace files written inside it make Vite reload the page mid-test.
const STORIES_OUTPUT_DIR = join(tmpdir(), 'titan-ui-playwright-stories')
const INTERACTION_OUTPUT_DIR = join(tmpdir(), 'titan-ui-playwright-interaction')

// Both projects load a production `storybook build`: a fresh context on the dev server re-fetched
// every unbundled module, about 7.7 s a story (TD-726). CI builds once per checkout and reuses the
// build in later steps; a local run always rebuilds so it never screenshots a stale tree.
const STATIC_DIR = 'storybook-static'
const reuseBuild = !!process.env.CI && existsSync(join(__dirname, STATIC_DIR, 'index.json'))
const buildCommand = `pnpm exec storybook build --quiet --output-dir ${STATIC_DIR}`
const serveCommand = `pnpm exec vite preview --outDir ${STATIC_DIR} --port 6006 --strictPort`

export default defineConfig({
  testDir: './tests/visual',
  outputDir: STORIES_OUTPUT_DIR,
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
      // One worker: parallel first loads made the scroll timings flaky on the dev server; not yet
      // re-measured against the static build.
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
    command: reuseBuild ? serveCommand : `${buildCommand} && ${serveCommand}`,
    port: 6006,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: 'pipe',
  },
})
