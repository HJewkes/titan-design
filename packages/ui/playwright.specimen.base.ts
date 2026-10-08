import { defineConfig, type PlaywrightTestConfig } from '@playwright/test'

const SPECIMEN_PORT = 5200

/**
 * The specimen dev server, browser and run policy shared by every Playwright config
 * that drives the specimen app on port 5200. Each config passes only what differs.
 */
export function specimenConfig({ use, ...config }: PlaywrightTestConfig) {
  return defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    ...config,
    use: {
      baseURL: `http://localhost:${SPECIMEN_PORT}`,
      trace: 'retain-on-failure',
      ...use,
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
      command: `pnpm specimen --port ${SPECIMEN_PORT} --strictPort`,
      port: SPECIMEN_PORT,
      reuseExistingServer: false,
      timeout: 60000,
    },
  })
}
