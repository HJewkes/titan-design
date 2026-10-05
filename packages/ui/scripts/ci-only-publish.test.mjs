import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ci-only-publish.mjs')

function runGuard(githubActions) {
  const env = { ...process.env }
  delete env.GITHUB_ACTIONS
  if (githubActions !== undefined) env.GITHUB_ACTIONS = githubActions
  return spawnSync(process.execPath, [SCRIPT], { env, encoding: 'utf8' })
}

describe('ci-only-publish guard', () => {
  it('refuses a local publish and points at the v* tag flow in publish.yml', () => {
    const result = runGuard(undefined)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('.github/workflows/publish.yml')
    expect(result.stderr).toContain('v* tag')
  })

  it('refuses when GITHUB_ACTIONS is set to anything but "true"', () => {
    const result = runGuard('false')

    expect(result.status).toBe(1)
  })

  it('lets the publish proceed inside GitHub Actions', () => {
    const result = runGuard('true')

    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
  })
})
