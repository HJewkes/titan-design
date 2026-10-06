import { defineConfig } from '@playwright/test'

/**
 * Layer-1 screenshot-baseline harness (TD-04.04). Mirrors
 * `playwright.comparison.config.ts` — same specimen dev server on port 5200 —
 * but targets only the `*.screenshot.test.ts` baseline suite and enables
 * pixel-snapshot comparison.
 *
 * Baselines are committed as `*-chromium-linux.png` and are generated inside the
 * pinned Playwright Linux image so they match CI byte-for-byte, so no pixel may
 * differ. The per-pixel `threshold` of 0.02 (about 5 of 255 luminance levels,
 * TD-3 §2) sees a ~0.03 alpha step on a hairline; Playwright's default 0.2 does not.
 */
export default defineConfig({
  testDir: './specimen/baseline',
  testMatch: '**/*.screenshot.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  expect: {
    toHaveScreenshot: {
      threshold: 0.02,
      maxDiffPixels: 0,
    },
  },
  use: {
    baseURL: 'http://localhost:5200',
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
  webServer: {
    command: 'pnpm specimen --port 5200 --strictPort',
    port: 5200,
    reuseExistingServer: false,
    timeout: 60000,
  },
})
