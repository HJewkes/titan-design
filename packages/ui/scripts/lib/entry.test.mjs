import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isEntryPoint } from './entry.mjs'

const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('isEntryPoint', () => {
  it('matches when argv[1] is a symlink to the script', () => {
    const real = (p) => (p === '/link/launch.mjs' ? '/pkg/scripts/launch.mjs' : p)
    expect(isEntryPoint('file:///pkg/scripts/launch.mjs', '/link/launch.mjs', real)).toBe(true)
  })

  it('does not match another entry file or a missing one', () => {
    expect(isEntryPoint('file:///pkg/scripts/launch.mjs', '/other.mjs', (p) => p)).toBe(false)
    expect(isEntryPoint('file:///pkg/scripts/launch.mjs', undefined)).toBe(false)
  })

  it('matches a percent-encoded module URL against its unencoded argv path', () => {
    const entry = '/tmp/a b/100%/scrïpt.mjs'
    const metaUrl = 'file:///tmp/a%20b/100%25/scr%C3%AFpt.mjs'
    expect(isEntryPoint(metaUrl, entry, (p) => p)).toBe(true)
  })
})

describe('a CLI run from a path holding a space', () => {
  let root
  let scriptsDir

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'entry-guard-'))
    scriptsDir = path.join(root, 'checkout with space', 'scripts')
    mkdirSync(path.join(scriptsDir, 'lib'), { recursive: true })
    copyFileSync(
      path.join(SCRIPTS_DIR, 'check-play-count.mjs'),
      path.join(scriptsDir, 'check-play-count.mjs')
    )
    copyFileSync(
      path.join(SCRIPTS_DIR, 'lib', 'entry.mjs'),
      path.join(scriptsDir, 'lib', 'entry.mjs')
    )
  })

  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('runs its body, so check-play-count fails an empty report instead of passing it', () => {
    const report = path.join(root, 'report.json')
    writeFileSync(report, '{}')

    const run = spawnSync(
      process.execPath,
      [path.join(scriptsDir, 'check-play-count.mjs'), report],
      {
        encoding: 'utf8',
      }
    )

    expect(run.stderr).toContain('Play guard: 0 play tests executed')
    expect(run.status).toBe(1)
  })
})
