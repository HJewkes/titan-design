import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { foldFragments, parseFragment } from './changelog-compile.mjs'

const CHANGELOG = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '### Added',
  '',
  '- old added',
  '',
  '### Fixed',
  '',
  '- old fixed',
  '',
  '## 1.0.0',
  '',
  '### Added',
  '',
  '- shipped',
  '',
].join('\n')

const fragment = (section, text) =>
  parseFragment('f.md', `---\nsection: ${section}\n---\n${text}\n`)

describe('changelog fragments', () => {
  it('puts a new bullet first in its section and leaves released sections alone', () => {
    const out = foldFragments(CHANGELOG, [fragment('Added', 'new added')])
    expect(out).toMatch(/### Added\n\n- new added\n- old added\n/)
    expect(out).toMatch(/## 1\.0\.0\n\n### Added\n\n- shipped\n/)
  })

  it('creates a missing section in canonical order', () => {
    const out = foldFragments(CHANGELOG, [fragment('Changed', 'c'), fragment('Internal', 'i')])
    expect(out).toMatch(/- old added\n\n### Changed\n\n- c\n\n### Fixed\n/)
    expect(out).toMatch(/- old fixed\n\n### Internal\n\n- i\n\n## 1\.0\.0/)
  })

  it('rejects a fragment without a known section or without text', () => {
    expect(() => parseFragment('a.md', 'no front matter')).toThrow(/a\.md/)
    expect(() => parseFragment('b.md', '---\nsection: Nope\n---\nx\n')).toThrow(/b\.md/)
    expect(() => parseFragment('c.md', '---\nsection: Added\n---\n\n')).toThrow(/c\.md/)
  })

  it('indents continuation lines under the bullet', () => {
    expect(fragment('Added', 'one\ntwo').bullet).toBe('- one\n  two')
  })
})

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'changelog-compile.mjs')
const FRAGMENT = '---\nsection: Fixed\n---\n\nSynthetic fragment text (TD-0).\n'

describe('changelog-compile command line', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-compile-'))
    fs.mkdirSync(path.join(root, 'changelog.d'))
    fs.writeFileSync(path.join(root, 'CHANGELOG.md'), CHANGELOG)
    fs.writeFileSync(path.join(root, 'changelog.d', 'README.md'), '# Fragments\n')
    fs.writeFileSync(path.join(root, 'changelog.d', 'TD-0-synthetic.md'), FRAGMENT)
  })

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

  const run = (...args) =>
    spawnSync(process.execPath, [SCRIPT, ...args], {
      encoding: 'utf8',
      env: { ...process.env, CHANGELOG_COMPILE_ROOT: root },
    })

  const snapshot = () => {
    const files = [
      'CHANGELOG.md',
      ...fs.readdirSync(path.join(root, 'changelog.d')).map((name) => `changelog.d/${name}`),
    ]
    return Object.fromEntries(files.map((file) => [file, fs.readFileSync(path.join(root, file))]))
  }

  it.each([['--help'], ['-h'], ['--dry-run', '--help']])(
    '%s prints usage and writes nothing',
    (...args) => {
      const before = snapshot()
      const result = run(...args)
      expect(result.status).toBe(0)
      expect(result.stdout).toMatch(/^Usage: /)
      expect(snapshot()).toEqual(before)
    }
  )

  it.each([['--force'], ['stray-argument']])(
    'unknown argument %s prints usage to stderr, exits 64 and writes nothing',
    (arg) => {
      const before = snapshot()
      const result = run(arg)
      expect(result.status).toBe(64)
      expect(result.stderr).toMatch(/^Usage: /)
      expect(result.stdout).toBe('')
      expect(snapshot()).toEqual(before)
    }
  )

  it('--dry-run prints the folded [Unreleased] section and writes nothing', () => {
    const before = snapshot()
    const result = run('--dry-run')
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/^## \[Unreleased\]\n/)
    expect(result.stdout).toContain('### Fixed\n\n- Synthetic fragment text (TD-0).\n- old fixed')
    expect(result.stdout).not.toContain('## 1.0.0')
    expect(snapshot()).toEqual(before)
  })

  it('without flags folds the fragments into CHANGELOG.md and deletes them', () => {
    const result = run()
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('CHANGELOG.md: folded 1 fragment(s)\n')
    expect(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8')).toMatch(
      /### Fixed\n\n- Synthetic fragment text \(TD-0\)\.\n- old fixed\n/
    )
    expect(fs.readdirSync(path.join(root, 'changelog.d'))).toEqual(['README.md'])
  })
})
