import { defineConfig } from '@playwright/test'

/**
 * Capture proof (TD-845). The spec builds the beat page with Vite and serves it with
 * `vite preview` on a free port, so there is no web server here.
 */
export default defineConfig({
  testDir: './tests/capture',
  testMatch: '**/*.spec.ts',
  outputDir: './test-results/playwright-capture',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // With partial raster, Chromium re-rasters only the changed tiles, and a fractional edge
        // can keep the previous frame's anti-aliasing: about 3 in 10 scrambled-order captures
        // differed by up to 36 levels on the rail connector. Without it, 25 of 25 matched.
        launchOptions: { args: ['--disable-partial-raster'] },
      },
    },
  ],
})
