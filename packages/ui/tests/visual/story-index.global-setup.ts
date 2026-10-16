import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { FullConfig } from '@playwright/test'

export const STORY_INDEX_ENV = 'TITAN_STORY_INDEX_FILE'

// CI may use the OS temp dir; a local run stays under $TMPDIR so a shared machine's /tmp is never written.
function tempRoot(): string {
  if (process.env.CI) return os.tmpdir()
  const local = process.env.TMPDIR
  if (!local) throw new Error('Set TMPDIR: a local run never writes the story index to /tmp')
  return fs.realpathSync(local)
}

/**
 * Fetches Storybook's `/index.json` once, after the web server is up and before any
 * test file is collected, so `stories.spec.ts` can declare one test per story.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects.find((p) => p.name === 'chromium')?.use.baseURL
  if (!baseURL) throw new Error('the chromium project needs a baseURL to fetch /index.json')

  const response = await fetch(new URL('/index.json', baseURL))
  if (!response.ok) throw new Error(`GET /index.json failed with ${response.status}`)

  const dir = fs.mkdtempSync(path.join(tempRoot(), 'titan-story-index-'))
  const file = path.join(dir, 'index.json')
  fs.writeFileSync(file, await response.text())
  process.env[STORY_INDEX_ENV] = file

  return () => fs.rmSync(dir, { recursive: true, force: true })
}
