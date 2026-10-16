import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error -- plain .mjs build tool without type declarations
import { DEFAULT_OUT_DIR, defaultOutPath, prepareOutPath } from './output-guard.mjs'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'ignore' })

describe('exporter output guard', () => {
  let repo: string
  let elsewhere: string

  beforeEach(() => {
    repo = realpathSync(mkdtempSync(path.join(tmpdir(), 'td104-repo-')))
    elsewhere = realpathSync(mkdtempSync(path.join(tmpdir(), 'td104-out-')))
    git(repo, 'init', '-q')
    mkdirSync(path.join(repo, 'data'))
    writeFileSync(path.join(repo, 'data', 'tracked.ts'), 'export {}\n')
    writeFileSync(path.join(repo, '.gitignore'), 'private/\n')
    mkdirSync(path.join(repo, 'private'))
    git(repo, 'add', '.')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(repo, { recursive: true, force: true })
    rmSync(elsewhere, { recursive: true, force: true })
  })

  it('refuses a target that git tracks', () => {
    expect(() => prepareOutPath(path.join(repo, 'data', 'tracked.ts'))).toThrow(/refusing/)
  })

  it('refuses a new file in a tracked directory', () => {
    expect(() => prepareOutPath(path.join(repo, 'data', 'new.ts'))).toThrow(/does not ignore/)
  })

  it('refuses a tracked target reached through a relative path', () => {
    expect(() => prepareOutPath(path.join(repo, 'private', '..', 'data', 'tracked.ts'))).toThrow(
      /refusing/
    )
  })

  it('refuses a symlink outside the repo that points at a tracked file', () => {
    const link = path.join(elsewhere, 'link.ts')
    symlinkSync(path.join(repo, 'data', 'tracked.ts'), link)
    expect(() => prepareOutPath(link)).toThrow(/symlink/)
  })

  it('refuses a dangling symlink outside the repo that points at a missing file inside it', () => {
    const link = path.join(elsewhere, 'dangling.ts')
    const missing = path.join(repo, 'data', 'leak.ts')
    symlinkSync(missing, link)
    expect(() => prepareOutPath(link)).toThrow(/symlink/)
    expect(existsSync(missing)).toBe(false)
  })

  it('refuses a symlink planted inside an ignored directory', () => {
    const link = path.join(repo, 'private', 'link.ts')
    symlinkSync(path.join(repo, 'data', 'tracked.ts'), link)
    expect(() => prepareOutPath(link)).toThrow(/symlink/)
  })

  it('refuses a path under a symlinked directory that resolves to a tracked directory', () => {
    const dirLink = path.join(repo, 'private', 'dir')
    symlinkSync(path.join(repo, 'data'), dirLink)
    expect(() => prepareOutPath(path.join(dirLink, 'new.ts'))).toThrow(/does not ignore/)
  })

  it('refuses when git is unavailable', () => {
    vi.stubEnv('PATH', '')
    expect(() => prepareOutPath(path.join(repo, 'private', 'out.ts'))).toThrow(/git is unavailable/)
  })

  it('accepts a new file in an ignored directory and creates the directory', () => {
    const target = path.join(repo, 'private', 'nested', 'fresh.ts')
    expect(prepareOutPath(target)).toBe(target)
  })

  it('accepts a path outside any repo', () => {
    const target = path.join(elsewhere, 'fresh.ts')
    expect(prepareOutPath(target)).toBe(target)
  })

  it('accepts the default target, which sits in a gitignored directory', () => {
    const target = defaultOutPath('aw-data.ts')
    expect(path.dirname(target)).toBe(DEFAULT_OUT_DIR)
    expect(prepareOutPath(target)).toBe(
      path.join(realpathSync(path.dirname(DEFAULT_OUT_DIR)), '.private-out', 'aw-data.ts')
    )
  })
})
