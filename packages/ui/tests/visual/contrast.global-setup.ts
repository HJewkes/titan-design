import fs from 'node:fs'
import type { FullConfig } from '@playwright/test'
import storyIndexSetup from './story-index.global-setup'

export const CONTRAST_REPORT_ENV = 'TITAN_CONTRAST_REPORT'

/**
 * `contrast.spec.ts` appends one row per story-theme to the report file, so a file named through
 * the environment starts empty; then the story index is fetched as for `stories.spec.ts`.
 */
export default async function globalSetup(config: FullConfig) {
  const report = process.env[CONTRAST_REPORT_ENV]
  if (report) fs.rmSync(report, { force: true })
  return storyIndexSetup(config)
}
