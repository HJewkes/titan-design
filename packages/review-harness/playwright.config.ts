import { defineConfig } from '@playwright/test'

import { createRunTmpRoot } from '../../scripts/test-tmp-root.mjs'

// Per-run TMPDIR for the e2e fixtures and browser profiles, removed on exit (TD-770).
createRunTmpRoot()

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  timeout: 240_000,
  workers: 1,
  reporter: 'list',
  use: { browserName: 'chromium', viewport: { width: 1400, height: 1000 } },
})
