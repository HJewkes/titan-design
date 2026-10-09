import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from '@playwright/test'

import { createRunTmpRoot } from '../../scripts/test-tmp-root.mjs'

// Outside Storybook's watched root: trace files written inside it make Vite reload the page mid-test.
// Per-run root, removed on exit with Playwright's own browser profiles (TD-770).
const RUN_TMP = createRunTmpRoot().root
const STORIES_OUTPUT_DIR = join(RUN_TMP, 'playwright-stories')
const INTERACTION_OUTPUT_DIR = join(RUN_TMP, 'playwright-interaction')

// Both projects load a production `storybook build`: a fresh context on the dev server re-fetched
// every unbundled module, about 7.7 s a story (TD-726). CI builds once per checkout and reuses the
// build in later steps; a local run always rebuilds so it never screenshots a stale tree.
const STATIC_DIR = 'storybook-static'
const reuseBuild = !!process.env.CI && existsSync(join(__dirname, STATIC_DIR, 'index.json'))
const buildCommand = `pnpm exec storybook build --quiet --output-dir ${STATIC_DIR}`
const serveCommand = `pnpm exec vite preview --outDir ${STATIC_DIR} --host 127.0.0.1 --port 6006 --strictPort`

export default defineConfig({
  testDir: './tests/visual',
  // Every story in both themes is about 14 minutes; playwright.contrast.config.ts runs it alone (TD-738).
  testIgnore: '**/contrast.spec.ts',
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
      // One worker was the rule while parallel first loads of the dev server made the scroll timings
      // flaky; a static build loads in one bundle, so two workers share the 4-vCPU runner (TD-729).
      fullyParallel: true,
      workers: 2,
      timeout: 60_000,
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: reuseBuild ? serveCommand : `${buildCommand} && ${serveCommand}`,
    // A url wait, not `port`: a port wait takes any brief listener on 6006 for readiness (TD-735).
    // The host matches serveCommand's --host, which localhost may not resolve to.
    url: 'http://127.0.0.1:6006/index.json',
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: 'pipe',
  },
})
