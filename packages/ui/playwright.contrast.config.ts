import { join } from 'node:path'

import { defineConfig } from '@playwright/test'

import { createRunTmpRoot } from '../../scripts/test-tmp-root.mjs'
import base from './playwright.config'

/**
 * axe `color-contrast` over every story in both themes (`tests/visual/contrast.spec.ts`, TD-738),
 * on the same static Storybook build and web server as `playwright.config.ts`.
 *
 * A config of its own, not a third project: the full index is about 14 minutes on one runner, so
 * `test:visual` must not pick it up, and CI runs it as the `contrast` job in three shards beside
 * `visual` (`--shard=i/3`), each shard building the static Storybook itself.
 */
export default defineConfig({
  ...base,
  testMatch: 'contrast.spec.ts',
  testIgnore: [],
  outputDir: join(createRunTmpRoot().root, 'playwright-contrast'),
  // Room for the spec's 20 s render wait plus axe (longest measured call 1.8 s).
  timeout: 60_000,
  // A retry re-renders from a fresh page. Sampling is frozen, but a story whose render depends on
  // real time before the clock settles (a scroll that is still moving) can still differ by a node
  // or two; Playwright reports the pass as flaky, which the run summary shows.
  retries: 1,
  globalSetup: './tests/visual/contrast.global-setup.ts',
  projects: base.projects?.filter((project) => project.name === 'chromium'),
})
