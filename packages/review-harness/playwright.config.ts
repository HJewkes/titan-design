import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  timeout: 240_000,
  workers: 1,
  reporter: 'list',
  use: { browserName: 'chromium', viewport: { width: 1400, height: 1000 } },
})
