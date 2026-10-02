import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error -- plain .mjs build tool without type declarations
import { DEFAULT_OUT_DIR, defaultOutPath, isTracked, prepareOutPath } from './output-guard.mjs'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'ignore' })

describe('exporter output guard', () => {
  let repo: string

  beforeEach(() => {
    repo = mkdtempSync(path.join(tmpdir(), 'td104-'))
    git(repo, 'init', '-q')
    writeFileSync(path.join(repo, 'tracked.ts'), 'export {}\n')
    git(repo, 'add', 'tracked.ts')
  })

  afterEach(() => rmSync(repo, { recursive: true, force: true }))

  it('refuses a target that git tracks', () => {
    expect(() => prepareOutPath(path.join(repo, 'tracked.ts'))).toThrow(
      /refusing to overwrite tracked file/
    )
  })

  it('refuses a tracked target reached through a relative path', () => {
    mkdirSync(path.join(repo, 'sub'))
    expect(() => prepareOutPath(path.join(repo, 'sub', '..', 'tracked.ts'))).toThrow(/refusing/)
  })

  it('accepts an untracked target and creates its directory', () => {
    const target = path.join(repo, 'out', 'fresh.ts')
    expect(prepareOutPath(target)).toBe(target)
    expect(isTracked(target)).toBe(false)
  })

  it('points the default target at a gitignored directory', () => {
    const target = defaultOutPath('aw-data.ts')
    expect(path.dirname(target)).toBe(DEFAULT_OUT_DIR)
    expect(() =>
      git(path.dirname(path.dirname(target)), 'check-ignore', '-q', target)
    ).not.toThrow()
  })

  it('does not track anything in the default directory', () => {
    expect(isTracked(defaultOutPath('aw-data.ts'))).toBe(false)
  })
})
